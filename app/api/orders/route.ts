import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateOrderNumber } from '@/lib/utils/helpers';
import type { ApiResponse, CreateOrderDTO, OrderWithDetails } from '@/lib/types';

// GET /api/orders - Get orders (with filters)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');
    const restaurantId = searchParams.get('restaurantId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};

    if (customerId) {
      where.customerId = customerId;
    }

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    if (status) {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
            logo: true,
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
          include: {
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

    const response: ApiResponse<OrderWithDetails[]> = {
      success: true,
      data: orders as any,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching orders:', error);
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
    const body: CreateOrderDTO = await request.json();
    const { restaurantId, addressId, items, paymentMethod, notes } = body;

    // Get customerId from session/auth (for now, we'll require it in the body)
    const customerId = (body as any).customerId;

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

    // Get menu items and calculate total
    const menuItemIds = items.map((item) => item.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        restaurantId,
        isAvailable: true,
      },
    });

    if (menuItems.length !== items.length) {
      return NextResponse.json(
        {
          success: false,
          error: 'Some menu items not found or unavailable',
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Calculate subtotal
    let subtotal = 0;
    const orderItemsData = items.map((item) => {
      const menuItem = menuItems.find((m) => m.id === item.menuItemId)!;
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

    const deliveryFee = restaurant.deliveryFee;
    const discount = 0; // TODO: Apply promotions
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
          paymentMethod: paymentMethod as any,
          paymentStatus: 'PENDING',
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
          customer: {
            select: {
              name: true,
              phone: true,
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

    const response: ApiResponse = {
      success: true,
      data: order,
      message: 'Order created successfully',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create order',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
