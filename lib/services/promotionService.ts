import prisma from '@/lib/prisma';

export interface DiscountCalculation {
  discount: number;
  promotionId?: string;
  promotionCode?: string;
  promotionName?: string;
  error?: string;
}

/**
 * Calculate discount from promo code
 */
export async function calculateDiscount(
  promoCode: string | undefined,
  subtotal: number,
  _restaurantId: string
): Promise<DiscountCalculation> {
  // No promo code provided
  if (!promoCode) {
    return { discount: 0 };
  }

  try {
    // Find promotion
    const promotion = await prisma.promotion.findUnique({
      where: { code: promoCode.toUpperCase() },
    });

    // Promo code not found
    if (!promotion) {
      return {
        discount: 0,
        error: 'Invalid promo code',
      };
    }

    // Check if promotion is active
    const now = new Date();
    if (promotion.startDate && promotion.startDate > now) {
      return {
        discount: 0,
        error: 'Promotion has not started yet',
      };
    }

    if (promotion.endDate && promotion.endDate < now) {
      return {
        discount: 0,
        error: 'Promotion has expired',
      };
    }

    // Check usage limit
    if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
      return {
        discount: 0,
        error: 'Promotion usage limit reached',
      };
    }

    // Check minimum order
    if (subtotal < promotion.minimumOrder) {
      return {
        discount: 0,
        error: `Minimum order of ${promotion.minimumOrder} THB required for this promotion`,
      };
    }

    // Note: To add restaurant-specific promotions, add 'restaurantId String?' field to Promotion model

    // Calculate discount based on type
    let discount = 0;

    if (promotion.type === 'PERCENTAGE') {
      discount = subtotal * (promotion.discountValue / 100);

      // Apply max discount if specified
      if (promotion.maxDiscount && discount > promotion.maxDiscount) {
        discount = promotion.maxDiscount;
      }
    } else if (promotion.type === 'FIXED_AMOUNT') {
      discount = promotion.discountValue;

      // Discount cannot exceed subtotal
      if (discount > subtotal) {
        discount = subtotal;
      }
    } else if (promotion.type === 'FREE_DELIVERY') {
      // Free delivery will be handled separately
      discount = 0;
    }

    // Round to 2 decimal places
    discount = Math.round(discount * 100) / 100;

    return {
      discount,
      promotionId: promotion.id,
      promotionCode: promotion.code,
      promotionName: promotion.name,
    };
  } catch (error) {
    console.error('Error calculating discount:', error);
    return {
      discount: 0,
      error: 'Error applying promotion',
    };
  }
}

/**
 * Increment promotion usage count
 */
export async function incrementPromotionUsage(promotionId: string): Promise<void> {
  try {
    await prisma.promotion.update({
      where: { id: promotionId },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });
  } catch (error) {
    console.error('Error incrementing promotion usage:', error);
  }
}

/**
 * Check if promotion gives free delivery
 */
export async function checkFreeDelivery(promoCode: string | undefined): Promise<boolean> {
  if (!promoCode) return false;

  try {
    const promotion = await prisma.promotion.findUnique({
      where: { code: promoCode.toUpperCase() },
    });

    return promotion?.type === 'FREE_DELIVERY' &&
           (!promotion.endDate || promotion.endDate > new Date());
  } catch (error) {
    console.error('Error checking free delivery:', error);
    return false;
  }
}
