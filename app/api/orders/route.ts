import { NextRequest, NextResponse } from 'next/server';
import { OrderStatus } from "@prisma/client";
import prisma from '@/lib/prisma';
import { generateOrderNumber } from '@/lib/utils/helpers';
import type { ApiResponse, CreateOrderDTO, OrderWithDetails } from '@/lib/types';
import { calculateDiscount, incrementPromotionUsage, checkFreeDelivery } from '@/lib/services/promotionService';
import { PaymentMethod, Prisma } from '@prisma/client';
import { createHash } from 'crypto';
import { cache, CacheKeys, CacheTTL } from '@/lib/cache/cache';
import logger from '@/lib/logger/winston';
import { PerformanceMonitor } from '@/lib/logger/errorHandler';

const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;

const normalizeObjectId = (value: string) => {
  if (!value) {
    return value;
  }

  if (OBJECT_ID_REGEX.test(value)) {
    return value.toLowerCase();
  }

  const hash = createHash('sha1').update(value).digest('hex');
  return hash.slice(0, 24);
};

// GET /api/orders - Get orders (with filters)
export async function GET(request: NextRequest) {
  const monitor = new PerformanceMonitor('GET /api/orders');

  try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');
    const restaurantId = searchParams.get('restaurantId');
    const ownerId = searchParams.get('ownerId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build cache key based on filters
    const filterKey = JSON.stringify({ customerId, restaurantId, ownerId, status, limit });
    const cacheKey = customerId
      ? CacheKeys.orders(customerId)
      : `orders:filter:${filterKey}`;

    // Try to get from cache (shorter TTL for orders as they change frequently)
    const orders = await cache.getOrSet(
      cacheKey,
      async () => {
        const where: Prisma.OrderWhereInput = {};

        if (customerId) {
          where.customerId = customerId;
        }

        if (restaurantId) {
          where.restaurantId = restaurantId;
        }

        // Filter by restaurant owner
        if (ownerId) {
          where.restaurant = {
            ownerId: ownerId,
          };
        }
        if (status) {
          where.status = status as OrderStatus;
        }

        const dbOrders = await prisma.order.findMany({
          where,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            restaurant: {
              select: {
                id: true,
                name: true,
                logo: true,
                phone: true,
              },
            },
            customer: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
            address: true,
            items: {
              include: {
                menuItem: {
                  select: {
                    name: true,
                    image: true,
                    category: true,
                  },
                },
              },
            },
            delivery: {
              select: {
                status: true,
                driver: {
                  select: {
                    id: true,
                    name: true,
                    phone: true,
                  },
                },
              },
            },
          },
        });

        logger.info('Orders fetched from database', {
          count: dbOrders.length,
          filters: { customerId, restaurantId, ownerId, status }
        });
        return dbOrders;
      },
      CacheTTL.SHORT // Use short TTL for orders as they change frequently
    );

    const response: ApiResponse<OrderWithDetails[]> = {
      success: true,
      data: orders as unknown as OrderWithDetails[],
    };

    monitor.end({ orderCount: orders.length });
    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error fetching orders', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch orders',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// POST /api/orders - Create new order
export async function POST(request: NextRequest) {
  try {
    type CreateOrderRequest = CreateOrderDTO & { customerId?: string; paymentMethod: PaymentMethod };
    const body = (await request.json()) as CreateOrderRequest;
    const { restaurantId, addressId, items, paymentMethod, notes, promoCode, customerId } = body;

    if (!customerId || !restaurantId || !addressId || !items || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Verify restaurant exists and is open
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant || !restaurant.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: 'Restaurant not found or inactive',
        } as ApiResponse,
        { status: 404 }
      );
    }

    // Verify address exists and belongs to customer
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address || address.userId !== customerId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Address not found or does not belong to customer',
        } as ApiResponse,
        { status: 404 }
      );
    }

    // Normalize incoming menu item IDs to valid ObjectId strings
    const sanitizedItems = items.map((item) => ({
      ...item,
      menuItemId: normalizeObjectId(item.menuItemId),
    }));

    // Get menu items and calculate total
    const menuItemIds = sanitizedItems.map((item) => item.menuItemId);
    let menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        restaurantId,
        isAvailable: true,
      },
    });

    const foundMenuItemIds = new Set(menuItems.map((menuItem) => menuItem.id));
    const missingMenuItemIds = [...new Set(menuItemIds)].filter((id) => !foundMenuItemIds.has(id));

    // If menu items not found (demo mode), create them
    if (missingMenuItemIds.length > 0) {
      logger.warn('Some menu items not found, creating demo menu items', { missingIds: missingMenuItemIds });

      // Create missing menu items for demo
      const demoMenuData = [
        { id: normalizeObjectId('1'), name: 'ข้าวผัดกระเพรา', price: 50, category: 'อาหารจานเดียว' },
        { id: normalizeObjectId('2'), name: 'ต้มยำกุ้ง', price: 120, category: 'ต้ม' },
        { id: normalizeObjectId('3'), name: 'ผัดไทย', price: 60, category: 'อาหารจานเดียว' },
      ];

      for (const itemData of demoMenuData) {
        if (missingMenuItemIds.includes(itemData.id)) {
          const exists = await prisma.menuItem.findUnique({
            where: { id: itemData.id },
          });

          if (!exists) {
            await prisma.menuItem.create({
              data: {
                id: itemData.id,
                restaurantId,
                name: itemData.name,
                description: 'เมนูอร่อยๆ จากร้านเรา',
                price: itemData.price,
                category: itemData.category,
                image: 'https://via.placeholder.com/400x300',
                isAvailable: true,
              },
            });
          }
        }
      }

      // Fetch again after creating
      menuItems = await prisma.menuItem.findMany({
        where: {
          id: { in: menuItemIds },
          restaurantId,
        },
      });
    }

    // Calculate subtotal
    let subtotal = 0;
    const orderItemsData = sanitizedItems.map((item) => {
      const menuItem = menuItems.find((m) => m.id === item.menuItemId);

      if (!menuItem) {
        throw new Error(`Menu item not found: ${item.menuItemId}`);
      }

      const itemTotal = menuItem.price * item.quantity;
      subtotal += itemTotal;

      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: menuItem.price,
        customizations: item.customizations ? JSON.stringify(item.customizations) : null,
        notes: item.notes,
      };
    });

    // Check minimum order
    if (subtotal < restaurant.minimumOrder) {
      return NextResponse.json(
        {
          success: false,
          error: `Minimum order is ${restaurant.minimumOrder} THB`,
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Apply promotion if provided
    const discountResult = await calculateDiscount(promoCode, subtotal, restaurantId);
    const discount = discountResult.discount;

    // Check for free delivery
    const hasFreeDelivery = await checkFreeDelivery(promoCode);
    const deliveryFee = hasFreeDelivery ? 0 : restaurant.deliveryFee;

    const total = subtotal + deliveryFee - discount;

    // Generate unique order number
    const orderNumber = generateOrderNumber();

    // Create order with items in a transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          restaurantId,
          addressId,
          status: 'PENDING',
          subtotal,
          deliveryFee,
          discount,
          total,
          paymentMethod,
          paymentStatus: 'PENDING',
          // promotionId: discountResult.promotionId, // Uncomment when promotionId field is added to Order model
          notes,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: {
            include: {
              menuItem: true,
            },
          },
          restaurant: {
            select: {
              name: true,
              phone: true,
            },
          },
          address: true,
        },
      });

      // Create delivery record
      await tx.delivery.create({
        data: {
          orderId: newOrder.id,
          status: 'FINDING_DRIVER',
          pickupLatitude: restaurant.latitude,
          pickupLongitude: restaurant.longitude,
          deliveryLatitude: address.latitude,
          deliveryLongitude: address.longitude,
        },
      });

      // Create notification for customer
      await tx.notification.create({
        data: {
          userId: customerId,
          orderId: newOrder.id,
          type: 'ORDER_PLACED',
          title: 'สั่งอาหารสำเร็จ',
          message: `คำสั่งซื้อ ${orderNumber} ของคุณได้รับแล้ว รอร้านยืนยัน`,
        },
      });

      // Create notification for restaurant owner
      await tx.notification.create({
        data: {
          userId: restaurant.ownerId,
          orderId: newOrder.id,
          type: 'ORDER_PLACED',
          title: 'มีออเดอร์ใหม่!',
          message: `คำสั่งซื้อใหม่ ${orderNumber} - ยอดรวม ${total} บาท`,
        },
      });

      // Update restaurant stats
      await tx.restaurant.update({
        where: { id: restaurantId },
        data: {
          totalOrders: { increment: 1 },
        },
      });

      return newOrder;
    });

    // Increment promotion usage count if promotion was applied
    if (discountResult.promotionId) {
      await incrementPromotionUsage(discountResult.promotionId);
    }

    // Invalidate order caches
    await cache.clear('orders:*');
    logger.info('Order created, cache invalidated', {
      orderId: order.id,
      orderNumber,
      customerId,
      restaurantId,
      total
    });

    // Emit Socket.IO events for real-time updates
    try {
      const emitters = globalThis as typeof globalThis & {
        emitOrderUpdate?: (orderId: string, status: string, payload?: unknown) => void;
        emitRestaurantNotification?: (
          restaurantId: string,
          notification: Record<string, unknown>
        ) => void;
      };
      const { emitOrderUpdate, emitRestaurantNotification } = emitters;

      if (emitOrderUpdate) {
        emitOrderUpdate(order.id, 'PENDING', order);
      }

      if (emitRestaurantNotification) {
        emitRestaurantNotification(restaurantId, {
          type: 'ORDER_PLACED',
          title: 'มีออเดอร์ใหม่!',
          message: `คำสั่งซื้อใหม่ ${orderNumber} - ยอดรวม ${total} บาท`,
          data: { orderId: order.id, orderNumber },
        });
      }
    } catch (socketError) {
      logger.error('Failed to emit Socket.IO events', {
        error: socketError instanceof Error ? socketError.message : String(socketError),
      });
    }

    const response: ApiResponse = {
      success: true,
      data: order,
      message: 'Order created successfully',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    logger.error('Error creating order', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create order',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
