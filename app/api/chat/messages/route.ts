import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import type { ApiResponse } from '@/lib/types';

// GET /api/chat/messages - Get chat messages for an order
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('orderId');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order ID is required',
        } as ApiResponse,
        { status: 400 }
      );
    }

    const where: Prisma.ChatMessageWhereInput = { orderId };

    // If userId provided, filter messages where user is sender or receiver
    if (userId) {
      where.OR = [{ senderId: userId }, { receiverId: userId }];
    }

    const messages = await prisma.chatMessage.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    const response: ApiResponse = {
      success: true,
      data: messages,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch chat messages',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// POST /api/chat/messages - Send a chat message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, senderId, receiverId, message, messageType, imageUrl, fileUrl } =
      body;

    // Validate required fields
    if (!orderId || !senderId || !receiverId || !message) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Create chat message
    const chatMessage = await prisma.chatMessage.create({
      data: {
        orderId,
        senderId,
        receiverId,
        message,
        messageType: messageType || 'TEXT',
        imageUrl,
        fileUrl,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    // Emit Socket.IO event for real-time delivery
    const emitChatMessage = (
      globalThis as {
        emitChatMessage?: (orderId: string, message: unknown) => void;
      }
    ).emitChatMessage;
    if (emitChatMessage) {
      // Transform to match ChatBox Message interface
      const socketMessage = {
        id: chatMessage.id,
        senderId: chatMessage.senderId,
        senderName: chatMessage.sender.name,
        message: chatMessage.message,
        timestamp: chatMessage.createdAt,
        type: chatMessage.messageType.toLowerCase(),
        imageUrl: chatMessage.imageUrl,
      };

      console.log('📤 Emitting chat message to room:', {
        room: `order-${orderId}`,
        event: `chat-message-${orderId}`,
        senderId,
        receiverId,
        message: message.substring(0, 50) + '...',
      });
      emitChatMessage(orderId, socketMessage);
    } else {
      console.warn('⚠️ emitChatMessage function not available');
    }

    const response: ApiResponse = {
      success: true,
      data: chatMessage,
      message: 'Message sent successfully',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error sending chat message:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to send message',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// PATCH /api/chat/messages - Mark messages as read
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, userId } = body;

    if (!orderId || !userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order ID and User ID are required',
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Mark all messages in this order received by this user as read
    await prisma.chatMessage.updateMany({
      where: {
        orderId,
        receiverId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Messages marked as read',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error marking messages as read:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to mark messages as read',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
