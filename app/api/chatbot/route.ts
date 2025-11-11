import { NextRequest, NextResponse } from 'next/server';
import { FoodDeliveryBot } from '@/lib/services/foodDeliveryBot';
import type { ApiResponse } from '@/lib/types';

interface ChatContext {
  userId?: string;
  userLocation?: {
    latitude: number;
    longitude: number;
  };
}

// POST /api/chatbot - Chat with food delivery assistant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userId, userLocation, chatHistory = [] } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Message is required',
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Initialize bot
    const bot = new FoodDeliveryBot();

    // Build context
    const context: ChatContext = {};
    if (userId) {
      context.userId = userId;
    }
    if (userLocation) {
      context.userLocation = userLocation;
    }

    // Get response from bot
    const response = await bot.chat(message, context, chatHistory);

    return NextResponse.json({
      success: true,
      data: {
        message: response,
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse);
  } catch (error) {
    console.error('Chatbot API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process message',
      } as ApiResponse,
      { status: 500 }
    );
  }
}

// GET /api/chatbot - Health check
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Food Delivery Chatbot is ready',
    features: [
      'Restaurant search',
      'Menu recommendations',
      'Order tracking',
      'Price inquiry',
      'General assistance',
    ],
  } as ApiResponse);
}
