'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  TrendingUp,
  Package,
  DollarSign,
  Star,
  Award,
  Heart,
  ShoppingBag,
} from 'lucide-react';
import Link from 'next/link';

interface Stats {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  deliveredOrders: number;
  cancelledOrders: number;
  favoriteRestaurants: number;
  reviewsGiven: number;
  averageRating: number;
  mostOrderedCategory: string;
  lastOrderDate: string;
}

type PeriodFilter = 'week' | 'month' | 'year' | 'all';

export default function StatsPage() {
  const [userId, setUserId] = useState<string | undefined>();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodFilter>('month');

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
      fetchStats(storedUserId);
    } else {
      setLoading(false);
    }
  }, [period]);

  const fetchStats = async (_userId: string) => {
    try {
      setLoading(true);

      // For now, use demo data
      // TODO: Implement real API endpoint
      await new Promise(resolve => setTimeout(resolve, 500));

      setStats({
        totalOrders: 47,
        totalSpent: 12450,
        averageOrderValue: 265,
        deliveredOrders: 43,
        cancelledOrders: 2,
        favoriteRestaurants: 8,
        reviewsGiven: 15,
        averageRating: 4.5,
        mostOrderedCategory: 'อาหารไทย',
        lastOrderDate: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!userId) {
    return (
      <MainLayout userId={userId}>
        <div className="container mx-auto px-4 py-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            กรุณาเข้าสู่ระบบ
          </h1>
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            เข้าสู่ระบบ
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout userId={userId}>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800 py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              สถิติของฉัน
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              ดูสถิติการสั่งอาหารและข้อมูลต่างๆ
            </p>
          </div>

          {/* Period Filter */}
          <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
            {(
              [
                { value: 'week', label: '7 วันที่แล้ว' },
                { value: 'month', label: '30 วันที่แล้ว' },
                { value: 'year', label: 'ปีนี้' },
                { value: 'all', label: 'ทั้งหมด' },
              ] as Array<{ value: PeriodFilter; label: string }>
            ).map((option) => (
              <button
                key={option.value}
                onClick={() => setPeriod(option.value)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  period === option.value
                    ? 'bg-orange-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
            </div>
          ) : stats ? (
            <>
              {/* Main Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300 animate-fadeIn">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <Package className="w-6 h-6 text-blue-500" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    ออเดอร์ทั้งหมด
                  </h3>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats.totalOrders}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    สำเร็จ {stats.deliveredOrders} ออเดอร์
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300 animate-fadeIn" style={{ animationDelay: '100ms' }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                      <DollarSign className="w-6 h-6 text-green-500" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    ยอดรวมทั้งหมด
                  </h3>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    ฿{stats.totalSpent.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    เฉลี่ย ฿{stats.averageOrderValue}/ออเดอร์
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300 animate-fadeIn" style={{ animationDelay: '200ms' }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                      <Star className="w-6 h-6 text-orange-500" />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    คะแนนเฉลี่ย
                  </h3>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats.averageRating.toFixed(1)} ⭐
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    {stats.reviewsGiven} รีวิว
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300 animate-fadeIn" style={{ animationDelay: '300ms' }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                      <Heart className="w-6 h-6 text-purple-500" />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    ร้านโปรด
                  </h3>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats.favoriteRestaurants}
                  </p>
                  <Link href="/favorites" className="text-xs text-orange-500 hover:text-orange-600 mt-2 inline-block">
                    ดูทั้งหมด →
                  </Link>
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Breakdown */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-orange-500" />
                    หมวดหมู่ที่สั่งบ่อย
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700 dark:text-gray-300">
                        {stats.mostOrderedCategory}
                      </span>
                      <span className="text-2xl font-bold text-orange-500">
                        #{1}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      คุณชอบ{stats.mostOrderedCategory} มากที่สุด! 🍜
                    </div>
                  </div>
                </div>

                {/* Achievements */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-orange-500" />
                    ความสำเร็จ
                  </h3>
                  <div className="space-y-3">
                    {stats.totalOrders >= 10 && (
                      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg">
                        <div className="text-2xl">🏆</div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            ผู้สั่งอาหารระดับมืออาชีพ
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            สั่งอาหารครบ 10 ออเดอร์แล้ว!
                          </p>
                        </div>
                      </div>
                    )}
                    {stats.reviewsGiven >= 10 && (
                      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                        <div className="text-2xl">⭐</div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            นักรีวิวชั้นนำ
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            เขียนรีวิวครบ 10 รีวิว!
                          </p>
                        </div>
                      </div>
                    )}
                    {stats.favoriteRestaurants >= 5 && (
                      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-pink-50 to-red-50 dark:from-pink-900/20 dark:to-red-900/20 rounded-lg">
                        <div className="text-2xl">❤️</div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            นักชิมตัวยง
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            มีร้านโปรดมากกว่า 5 ร้าน!
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  href="/orders"
                  className="flex items-center justify-center gap-2 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 text-gray-700 dark:text-gray-300 hover:text-orange-500"
                >
                  <Package className="w-5 h-5" />
                  <span className="font-medium">ดูประวัติออเดอร์</span>
                </Link>
                <Link
                  href="/favorites"
                  className="flex items-center justify-center gap-2 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 text-gray-700 dark:text-gray-300 hover:text-orange-500"
                >
                  <Heart className="w-5 h-5" />
                  <span className="font-medium">ร้านโปรดของฉัน</span>
                </Link>
                <Link
                  href="/promotions"
                  className="flex items-center justify-center gap-2 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 text-gray-700 dark:text-gray-300 hover:text-orange-500"
                >
                  <Award className="w-5 h-5" />
                  <span className="font-medium">โปรโมชั่นสำหรับคุณ</span>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-600 dark:text-gray-400">ไม่พบข้อมูลสถิติ</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
