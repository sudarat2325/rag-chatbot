import Anthropic from '@anthropic-ai/sdk';
import prisma from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { calculateDistance, formatCurrency } from '@/lib/utils/helpers';
import { VectorStoreManager } from '@/src/vectorStore';
import { getEmbeddings } from '@/src/embeddings';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

type RestaurantWithMenuItems = Prisma.RestaurantGetPayload<{
  include: {
    menuItems: {
      where: { isAvailable: true },
      take: 3,
    },
  },
}>;

type RestaurantWithDistance = RestaurantWithMenuItems & { distance?: number };

type UserOrderSummary = Prisma.OrderGetPayload<{
  include: {
    restaurant: {
      select: {
        name: true,
      },
    },
    items: {
      include: {
        menuItem: {
          select: {
            name: true,
          },
        },
      },
    },
    delivery: true,
  },
}>;

type PopularMenuItem = Prisma.MenuItemGetPayload<{
  include: {
    restaurant: {
      select: {
        name: true,
        rating: true,
        deliveryFee: true,
      },
    },
  },
}>;

type RagDocument = {
  content: string;
  source: string;
  metadata: Record<string, unknown>;
};

type IntentType =
  | 'search_restaurant'
  | 'search_food'
  | 'track_order'
  | 'recommend'
  | 'price_inquiry'
  | 'general';

interface ChatContext {
  userId?: string;
  userLocation?: {
    latitude: number;
    longitude: number;
  };
  currentOrder?: UserOrderSummary | null;
}

type EnrichedContext = ChatContext & {
  ragContext?: RagDocument[];
  restaurants?: RestaurantWithDistance[];
  userOrders?: UserOrderSummary[];
  popularItems?: PopularMenuItem[];
  intent?: IntentType;
};

type ClaudeMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export class FoodDeliveryBot {
  private model: string;
  private vectorStore: VectorStoreManager | null = null;
  private useRAG: boolean = false;

  constructor(model: string = 'claude-3-haiku-20240307', useRAG: boolean = true) {
    this.model = model;
    this.useRAG = useRAG;

    // Initialize RAG vector store if enabled
    if (this.useRAG) {
      this.initializeRAG().catch((error) => {
        console.warn('RAG not available:', error.message);
        this.useRAG = false;
      });
    }
  }

  private async initializeRAG() {
    try {
      const embeddings = getEmbeddings();
      this.vectorStore = new VectorStoreManager(embeddings);

      const exists = await this.vectorStore.exists();
      if (exists) {
        await this.vectorStore.load();
        console.warn('✅ RAG vector store loaded for Food Delivery Bot');
      } else {
        console.warn('⚠️ Vector store not found. RAG disabled.');
        this.useRAG = false;
      }
    } catch (error) {
      console.warn('Failed to initialize RAG:', error);
      this.useRAG = false;
    }
  }

  async chat(
    message: string,
    context: ChatContext = {},
    chatHistory: string[] = []
  ): Promise<string> {
    try {
      // Get relevant data based on the query
      const enrichedContext = await this.enrichContext(message, context);

      // Build system prompt
      const systemPrompt = this.buildSystemPrompt(enrichedContext);

      // Build conversation history
      const messages: ClaudeMessage[] = [];

      // Add chat history
      for (let i = 0; i < chatHistory.length; i++) {
        messages.push({
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: chatHistory[i],
        });
      }

      // Add current message
      messages.push({
        role: 'user',
        content: message,
      });

      // Call Claude API
      const response = await anthropic.messages.create({
        model: this.model,
        max_tokens: 2048,
        system: systemPrompt,
        messages,
      });

      const textContent = response.content.find(
        (chunk) => chunk.type === 'text'
      );
      return textContent && 'text' in textContent ? textContent.text : 'ขออภัย ไม่สามารถตอบกลับได้ในขณะนี้';
    } catch (error) {
      console.error('Food delivery bot error:', error);
      return 'ขออภัย เกิดข้อผิดพลาดในการประมวลผล กรุณาลองใหม่อีกครั้ง';
    }
  }

  private async enrichContext(message: string, context: ChatContext): Promise<EnrichedContext> {
    const enriched: EnrichedContext = { ...context };

    // Detect intent
    const intent = this.detectIntent(message);

    // 🔍 Search from RAG vector store for food-related queries
    if (
      this.useRAG &&
      this.vectorStore &&
      (intent === 'search_food' ||
        message.includes('อาหาร') ||
        message.includes('เมนู') ||
        message.includes('สูตร') ||
        message.includes('ส่วนผสม') ||
        message.includes('วิธีทำ') ||
        message.includes('แนะนำ'))
    ) {
      try {
        const ragResults = await this.searchFromRAG(message);
        if (ragResults && ragResults.length > 0) {
          enriched.ragContext = ragResults;
        }
      } catch (error) {
        console.warn('RAG search failed:', error);
      }
    }

    // Search for restaurants if looking for food
    if (
      intent === 'search_restaurant' ||
      intent === 'search_food' ||
      message.includes('ร้าน') ||
      message.includes('อาหาร') ||
      message.includes('เมนู')
    ) {
      enriched.restaurants = await this.searchRestaurants(message, context.userLocation);
    }

    // Get user's orders if asking about order status
    if (
      (intent === 'track_order' || message.includes('สั่ง') || message.includes('ออเดอร์')) &&
      context.userId
    ) {
      enriched.userOrders = await this.getUserOrders(context.userId);
    }

    // Get popular items
    if (message.includes('แนะนำ') || message.includes('ยอดนิยม')) {
      enriched.popularItems = await this.getPopularItems();
    }

    enriched.intent = intent as IntentType;

    return enriched;
  }

  private async searchFromRAG(query: string): Promise<RagDocument[]> {
    if (!this.vectorStore) return [];

    try {
      const results = await this.vectorStore.similaritySearch(query, 4);
      return results.map((doc) => ({
        content: doc.pageContent,
        source: (doc.metadata.fileName as string) || (doc.metadata.source as string) || 'Unknown',
        metadata: doc.metadata,
      }));
    } catch (error) {
      console.error('RAG search error:', error);
      return [];
    }
  }

  private detectIntent(message: string): string {
    const lower = message.toLowerCase();

    if (
      lower.includes('ร้าน') ||
      lower.includes('หา') ||
      lower.includes('ค้นหา')
    ) {
      return 'search_restaurant';
    }

    if (
      lower.includes('เมนู') ||
      lower.includes('อาหาร') ||
      lower.includes('กิน')
    ) {
      return 'search_food';
    }

    if (
      lower.includes('สั่ง') ||
      lower.includes('ออเดอร์') ||
      lower.includes('order')
    ) {
      return 'track_order';
    }

    if (lower.includes('แนะนำ') || lower.includes('ช่วย')) {
      return 'recommend';
    }

    if (
      lower.includes('ราคา') ||
      lower.includes('เท่าไหร่') ||
      lower.includes('ค่าส่ง')
    ) {
      return 'price_inquiry';
    }

    return 'general';
  }

  private async searchRestaurants(
    _query: string,
    userLocation?: {
      latitude: number;
      longitude: number;
    }
  ): Promise<RestaurantWithDistance[]> {
    try {
      const restaurants = await prisma.restaurant.findMany({
        where: {
          isActive: true,
          isOpen: true,
        },
        take: 5,
        orderBy: {
          rating: 'desc',
        },
        include: {
          menuItems: {
            where: { isAvailable: true },
            take: 3,
          },
        },
      });

      // Calculate distances if user location provided
      if (userLocation) {
        return restaurants.map((r) => ({
          ...r,
          distance: calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            r.latitude,
            r.longitude
          ),
        }));
      }

      return restaurants;
    } catch (error) {
      console.error('Error searching restaurants:', error);
      return [];
    }
  }

  private async getUserOrders(userId: string): Promise<UserOrderSummary[]> {
    try {
      const orders = await prisma.order.findMany({
        where: { customerId: userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          restaurant: {
            select: {
              name: true,
            },
          },
          items: {
            include: {
              menuItem: {
                select: {
                  name: true,
                },
              },
            },
          },
          delivery: true,
        },
      });

      return orders;
    } catch (error) {
      console.error('Error getting user orders:', error);
      return [];
    }
  }

  private async getPopularItems(): Promise<PopularMenuItem[]> {
    try {
      const popularItems = await prisma.menuItem.findMany({
        where: {
          isAvailable: true,
          isPopular: true,
        },
        take: 10,
        include: {
          restaurant: {
            select: {
              name: true,
              rating: true,
              deliveryFee: true,
            },
          },
        },
      });

      return popularItems;
    } catch (error) {
      console.error('Error getting popular items:', error);
      return [];
    }
  }

  private buildSystemPrompt(context: EnrichedContext): string {
    let prompt = `คุณคือ AI ผู้ช่วยอัจฉริยะสำหรับระบบสั่งอาหารออนไลน์ ชื่อว่า "FoodBot"

ความสามารถของคุณ:
1. แนะนำร้านอาหารและเมนูอาหาร
2. ช่วยค้นหาร้านอาหารตามความต้องการ
3. ตรวจสอบสถานะคำสั่งซื้อ
4. ตอบคำถามเกี่ยวกับราคา ค่าส่ง และเวลาจัดส่ง
5. รับเรื่องร้องเรียนและข้อเสนอแนะ
6. แนะนำโปรโมชั่นและของแนะนำ
7. ตอบคำถามเกี่ยวกับอาหาร สูตร ส่วนผสม และวิธีทำจากฐานความรู้

คำแนะนำ:
- ตอบเป็นภาษาไทยที่เป็นกันเอง
- ให้ข้อมูลที่ถูกต้องและครบถ้วน
- ถ้าไม่มีข้อมูล ให้บอกตรงๆ
- แนะนำตัวเลือกที่หลากหลาย
- สอบถามข้อมูลเพิ่มเติมถ้าจำเป็น
- ใช้ข้อมูลจากฐานความรู้ (RAG) เมื่อมี

`;

    // Add RAG context if available
    if (context.ragContext && context.ragContext.length > 0) {
      prompt += '\n\n## 📚 ข้อมูลจากฐานความรู้:\n';
      context.ragContext.forEach((doc, i) => {
        prompt += `\n### เอกสาร ${i + 1}: ${doc.source}\n`;
        prompt += `${doc.content}\n`;
      });
      prompt += '\n---\n';
    }

    // Add context data
    if (context.restaurants && context.restaurants.length > 0) {
      prompt += '\n\n## ร้านอาหารที่พบ:\n';
      context.restaurants.forEach((r, i) => {
        prompt += `\n${i + 1}. ${r.name}
   - คะแนน: ${r.rating}/5 (${r.totalReviews} รีวิว)
   - ค่าส่ง: ${formatCurrency(r.deliveryFee)}
   - ระยะทาง: ${r.distance ? r.distance + ' กม.' : 'ไม่ระบุ'}
   - เวลาจัดส่งโดยประมาณ: ${r.estimatedTime || '30-45 นาที'}
   - เมนูยอดนิยม: ${r.menuItems?.map((m) => m.name).join(', ') || 'ไม่มีข้อมูล'}
`;
      });
    }

    if (context.userOrders && context.userOrders.length > 0) {
      prompt += '\n\n## ออเดอร์ล่าสุดของลูกค้า:\n';
      context.userOrders.forEach((o, i) => {
        const statusText = this.getStatusText(o.status);
        prompt += `\n${i + 1}. ออเดอร์ ${o.orderNumber}
   - ร้าน: ${o.restaurant.name}
   - สถานะ: ${statusText}
   - ยอดรวม: ${formatCurrency(o.total)}
   - เมนู: ${o.items?.map((item) => `${item.menuItem.name} x${item.quantity}`).join(', ')}
`;
      });
    }

    if (context.popularItems && context.popularItems.length > 0) {
      prompt += '\n\n## เมนูยอดนิยม:\n';
      context.popularItems.forEach((item, i) => {
        prompt += `\n${i + 1}. ${item.name}
   - ร้าน: ${item.restaurant.name}
   - ราคา: ${formatCurrency(item.price)}
   - คะแนนร้าน: ${item.restaurant.rating}/5
`;
      });
    }

    return prompt;
  }

  private getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      PENDING: 'รอยืนยัน',
      ACCEPTED: 'ร้านรับออเดอร์',
      PREPARING: 'กำลังเตรียม',
      READY: 'พร้อมส่ง',
      PICKED_UP: 'คนส่งรับของแล้ว',
      ON_THE_WAY: 'กำลังส่ง',
      DELIVERED: 'ส่งแล้ว',
      CANCELLED: 'ยกเลิก',
    };
    return statusMap[status] || status;
  }
}

export default FoodDeliveryBot;
