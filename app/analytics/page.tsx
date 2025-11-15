'use client';

import { useState, useEffect } from 'react';
import { RevenueChart } from '@/components/analytics/RevenueChart';
import { StatCard } from '@/components/analytics/StatCard';
import { TopSellingItems } from '@/components/analytics/TopSellingItems';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Star,
  Users,
  XCircle,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('7d');
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Demo restaurant ID - in production, get from session/auth
  const demoRestaurantId = '6917616189f8a9faa040b08e';

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/analytics?restaurantId=${demoRestaurantId}&period=${period}`
      );
      const data = await response.json();

      if (data.success) {
        setAnalytics(data.data);
      } else {
        console.error('Error:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">ไม่พบข้อมูล</p>
        </div>
      </div>
    );
  }

  const { summary, dailyRevenue, topSellingItems } = analytics;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/restaurant-dashboard"
                className="text-gray-600 dark:text-gray-400 hover:text-orange-500"
              >
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  📊 Analytics Dashboard
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  ภาพรวมและสถิติการขายของร้าน
                </p>
              </div>
            </div>

            {/* Period Selector */}
            <div className="flex gap-2">
              {[
                { label: '7 วัน', value: '7d' },
                { label: '30 วัน', value: '30d' },
                { label: '90 วัน', value: '90d' },
                { label: '1 ปี', value: '1y' },
              ].map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    period === p.value
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="รายได้รวม"
            value={`฿${summary.totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            colorClass="bg-green-500"
            subtitle={`${summary.completedOrders} ออเดอร์`}
          />
          <StatCard
            title="จำนวนออเดอร์"
            value={summary.totalOrders.toLocaleString()}
            icon={ShoppingBag}
            colorClass="bg-blue-500"
            subtitle={`ยกเลิก ${summary.cancelledOrders} รายการ`}
          />
          <StatCard
            title="ค่าเฉลี่ยต่อออเดอร์"
            value={`฿${Math.round(summary.avgOrderValue).toLocaleString()}`}
            icon={TrendingUp}
            colorClass="bg-orange-500"
          />
          <StatCard
            title="คะแนนเฉลี่ย"
            value={`${summary.avgRating} ⭐`}
            icon={Star}
            colorClass="bg-yellow-500"
            subtitle={`${summary.totalReviews} รีวิว`}
          />
        </div>

        {/* Charts and Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart - 2 columns */}
          <div className="lg:col-span-2">
            <RevenueChart data={dailyRevenue} />
          </div>

          {/* Top Selling Items - 1 column */}
          <div>
            <TopSellingItems items={topSellingItems} />
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            สถานะออเดอร์
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {Object.entries(analytics.statusDistribution).map(([status, count]) => (
              <div
                key={status}
                className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50"
              >
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {count as number}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {status}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            📅 ข้อมูลจาก: {new Date(analytics.startDate).toLocaleDateString('th-TH')} -{' '}
            {new Date(analytics.endDate).toLocaleDateString('th-TH')}
          </p>
        </div>
      </div>
    </div>
  );
}
