import generatePayload from 'promptpay-qr';
import QRCode from 'qrcode';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PaymentConfig {
  promptPayId: string; // Phone number or National ID
  merchantName: string;
}

export const paymentConfig: PaymentConfig = {
  promptPayId: '0891112222', // Replace with actual PromptPay ID
  merchantName: 'FoodHub Delivery',
};

/**
 * Generate PromptPay QR Code for payment
 */
export async function generatePromptPayQR(amount: number): Promise<string> {
  try {
    // Generate PromptPay payload
    const payload = generatePayload(paymentConfig.promptPayId, { amount });

    // Generate QR code as Data URL
    const qrCodeDataURL = await QRCode.toDataURL(payload, {
      type: 'image/png',
      width: 300,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating PromptPay QR:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Create payment record
 */
export async function createPayment(data: {
  orderId: string;
  amount: number;
  method: string;
  qrCodeUrl?: string;
}) {
  try {
    const payment = await prisma.payment.create({
      data: {
        orderId: data.orderId,
        amount: data.amount,
        currency: 'THB',
        method: data.method as any,
        status: 'PENDING',
        qrCodeUrl: data.qrCodeUrl,
        gatewayProvider: data.method === 'PROMPTPAY' ? 'promptpay' : undefined,
      },
    });

    return payment;
  } catch (error) {
    console.error('Error creating payment:', error);
    throw error;
  }
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(
  paymentId: string,
  status: 'PAID' | 'FAILED' | 'REFUNDED',
  data?: {
    gatewayTxnId?: string;
    errorCode?: string;
    errorMessage?: string;
  }
) {
  try {
    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status,
        paidAt: status === 'PAID' ? new Date() : undefined,
        failedAt: status === 'FAILED' ? new Date() : undefined,
        refundedAt: status === 'REFUNDED' ? new Date() : undefined,
        gatewayTxnId: data?.gatewayTxnId,
        errorCode: data?.errorCode,
        errorMessage: data?.errorMessage,
      },
    });

    // Update order payment status
    await prisma.order.update({
      where: { id: payment.orderId },
      data: {
        paymentStatus: status,
      },
    });

    return payment;
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
}

/**
 * Process wallet payment
 */
export async function processWalletPayment(userId: string, amount: number, orderId: string) {
  try {
    // Get or create wallet
    let wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId,
          balance: 0,
        },
      });
    }

    // Check balance
    if (wallet.balance < amount) {
      throw new Error('Insufficient wallet balance');
    }

    // Deduct from wallet
    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore - amount;

    await prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: balanceAfter },
    });

    // Record transaction
    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'PAYMENT',
        amount: -amount,
        balanceBefore,
        balanceAfter,
        orderId,
        description: `Payment for order #${orderId}`,
      },
    });

    return { success: true, newBalance: balanceAfter };
  } catch (error) {
    console.error('Error processing wallet payment:', error);
    throw error;
  }
}

/**
 * Add funds to wallet
 */
export async function topUpWallet(
  userId: string,
  amount: number,
  gatewayTxnId?: string,
  gatewayProvider?: string
) {
  try {
    // Get or create wallet
    let wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId,
          balance: 0,
        },
      });
    }

    // Add to wallet
    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore + amount;

    await prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: balanceAfter },
    });

    // Record transaction
    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'TOP_UP',
        amount,
        balanceBefore,
        balanceAfter,
        gatewayTxnId,
        gatewayProvider,
        description: `Wallet top-up`,
      },
    });

    return { success: true, newBalance: balanceAfter };
  } catch (error) {
    console.error('Error topping up wallet:', error);
    throw error;
  }
}

/**
 * Process refund
 */
export async function processRefund(paymentId: string, reason: string, amount?: number) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    const refundAmount = amount || payment.amount;

    // Create refund record
    const refund = await prisma.refund.create({
      data: {
        paymentId,
        amount: refundAmount,
        reason,
        status: 'PENDING',
      },
    });

    // If wallet payment, refund to wallet
    if (payment.method === 'WALLET' && payment.walletId) {
      const wallet = await prisma.wallet.findUnique({
        where: { id: payment.walletId },
      });

      if (wallet) {
        const balanceBefore = wallet.balance;
        const balanceAfter = balanceBefore + refundAmount;

        await prisma.wallet.update({
          where: { id: wallet.id },
          data: { balance: balanceAfter },
        });

        await prisma.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'REFUND',
            amount: refundAmount,
            balanceBefore,
            balanceAfter,
            orderId: payment.orderId,
            description: `Refund for order #${payment.orderId}`,
          },
        });

        // Update refund status
        await prisma.refund.update({
          where: { id: refund.id },
          data: {
            status: 'COMPLETED',
            processedAt: new Date(),
          },
        });
      }
    }

    // Update payment status
    await updatePaymentStatus(paymentId, 'REFUNDED');

    return refund;
  } catch (error) {
    console.error('Error processing refund:', error);
    throw error;
  }
}

/**
 * Award loyalty points for order
 */
export async function awardLoyaltyPoints(userId: string, orderAmount: number, orderId: string) {
  try {
    // Get or create loyalty points
    let loyaltyPoints = await prisma.loyaltyPoints.findUnique({
      where: { userId },
    });

    if (!loyaltyPoints) {
      loyaltyPoints = await prisma.loyaltyPoints.create({
        data: {
          userId,
          points: 0,
          totalEarned: 0,
          tier: 'BRONZE',
        },
      });
    }

    // Calculate points (1 point per 10 THB)
    const pointsEarned = Math.floor(orderAmount / 10);

    const balanceBefore = loyaltyPoints.points;
    const balanceAfter = balanceBefore + pointsEarned;

    // Update loyalty points
    await prisma.loyaltyPoints.update({
      where: { id: loyaltyPoints.id },
      data: {
        points: balanceAfter,
        totalEarned: loyaltyPoints.totalEarned + pointsEarned,
      },
    });

    // Record transaction
    await prisma.pointTransaction.create({
      data: {
        loyaltyPointsId: loyaltyPoints.id,
        type: 'EARNED',
        points: pointsEarned,
        balanceBefore,
        balanceAfter,
        orderId,
        description: `Earned from order #${orderId}`,
      },
    });

    return { pointsEarned, totalPoints: balanceAfter };
  } catch (error) {
    console.error('Error awarding loyalty points:', error);
    throw error;
  }
}
