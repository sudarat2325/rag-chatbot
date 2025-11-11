'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { LoadingGrid } from '@/components/ui/LoadingSpinner';
import {
  Tag,
  Copy,
  Clock,
  CheckCircle,
  Gift,
  TrendingUp,
  Percent,
  Truck,
} from 'lucide-react';

interface Promotion {
  id: string;
  code: string;
  description: string;
  discountType: string;
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
}

export default function PromotionsPage() {
  const [userId, setUserId] = useState<string | undefined>();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    }
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/promotions');
      const data = await response.json();

      if (data.success) {
        type PromotionApi = {
          id: string;
          code: string;
          description?: string;
          name?: string;
          type: string;
          discountValue: number;
          minimumOrder: number;
          maxDiscount?: number;
          startDate: string;
          endDate: string;
          usageLimit?: number;
          usageCount: number;
          isActive: boolean;
        };
        const mappedPromotions: Promotion[] = (data.data as PromotionApi[]).map((p) => ({
          id: p.id,
          code: p.code,
          description: p.description || p.name || 'ไม่มีคำอธิบาย',
          discountType: p.type,
          discountValue: p.discountValue,
          minOrderAmount: p.minimumOrder,
          maxDiscount: p.maxDiscount,
          startDate: p.startDate,
          endDate: p.endDate,
          usageLimit: p.usageLimit,
          usageCount: p.usageCount,
          isActive: p.isActive,
        }));
        setPromotions(mappedPromotions);
      }
    } catch (error) {
      console.error('Error fetching promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getDiscountIcon = (type: string) => {
    switch (type) {
      case 'PERCENTAGE':
        return <Percent className="w-6 h-6" />;
      case 'FIXED_AMOUNT':
        return <Tag className="w-6 h-6" />;
      case 'FREE_DELIVERY':
        return <Truck className="w-6 h-6" />;
      default:
        return <Gift className="w-6 h-6" />;
    }
  };

  const getDiscountText = (promo: Promotion) => {
    if (promo.discountType === 'FREE_DELIVERY') {
      return 'ฟรีค่าส่ง';
    } else if (promo.discountType === 'PERCENTAGE') {
      return `-${promo.discountValue}%`;
    } else {
      return `-฿${promo.discountValue}`;
    }
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loading) {
    return (
      <MainLayout userId={userId}>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800 py-8">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="mb-8">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2 animate-pulse" />
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
            </div>
            <LoadingGrid count={6} />
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout userId={userId}>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Gift className="w-8 h-8 text-orange-500" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                โปรโมชั่น & คูปอง
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              ส่วนลดและข้อเสนอพิเศษสำหรับคุณ
            </p>
          </div>

          {/* Promotions Grid */}
          {promotions.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
              <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                ไม่มีโปรโมชั่น
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                กลับมาตรวจสอบใหม่ในภายหลัง
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {promotions.map((promo, index) => {
                const daysLeft = getDaysRemaining(promo.endDate);
                const isExpiringSoon = daysLeft <= 3;

                return (
                  <div
                    key={promo.id}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group animate-fadeIn hover:scale-105"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Header with Icon */}
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 opacity-20">
                        {getDiscountIcon(promo.discountType)}
                      </div>

                      <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-2 bg-white/20 rounded-lg">
                            {getDiscountIcon(promo.discountType)}
                          </div>
                          <div className="text-3xl font-bold">
                            {getDiscountText(promo)}
                          </div>
                        </div>

                        {promo.maxDiscount && promo.discountType === 'PERCENTAGE' && (
                          <p className="text-sm opacity-90">
                            สูงสุด ฿{promo.maxDiscount}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      {/* Description */}
                      <p className="text-gray-900 dark:text-white font-medium mb-4">
                        {promo.description}
                      </p>

                      {/* Details */}
                      <div className="space-y-2 mb-4">
                        {promo.minOrderAmount > 0 && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <TrendingUp className="w-4 h-4" />
                            <span>ขั้นต่ำ ฿{promo.minOrderAmount}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4" />
                          <span
                            className={
                              isExpiringSoon
                                ? 'text-red-600 dark:text-red-400 font-medium'
                                : 'text-gray-600 dark:text-gray-400'
                            }
                          >
                            {isExpiringSoon
                              ? `เหลืออีก ${daysLeft} วัน`
                              : `ใช้ได้ถึง ${new Date(promo.endDate).toLocaleDateString(
                                  'th-TH'
                                )}`}
                          </span>
                        </div>

                        {promo.usageLimit && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <CheckCircle className="w-4 h-4" />
                            <span>ใช้ได้ {promo.usageLimit} ครั้ง</span>
                          </div>
                        )}
                      </div>

                      {/* Coupon Code */}
                      <div className="border-2 border-dashed border-orange-300 dark:border-orange-700 rounded-lg p-3 mb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              รหัสคูปอง
                            </p>
                            <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                              {promo.code}
                            </p>
                          </div>
                          <button
                            onClick={() => copyCode(promo.code)}
                            className="p-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                          >
                            {copiedCode === promo.code ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <Copy className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => {
                          copyCode(promo.code);
                          // Could redirect to food page with promo pre-applied
                          window.location.href = '/food';
                        }}
                        className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                      >
                        ใช้คูปองนี้
                      </button>
                    </div>

                    {/* Expiring Soon Badge */}
                    {isExpiringSoon && (
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg">
                          ใกล้หมดเขต!
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Info Box */}
          <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              💡 เคล็ดลับการใช้คูปอง
            </h3>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                <span>คลิกปุ่ม "คัดลอก" เพื่อคัดลอกรหัสคูปอง</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                <span>นำรหัสไปใส่ในหน้าชำระเงิน</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                <span>ใช้ได้ทีละ 1 คูปองต่อออเดอร์</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                <span>ตรวจสอบเงื่อนไขขั้นต่ำก่อนใช้</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
