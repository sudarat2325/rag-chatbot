'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign, TrendingUp, Calendar, ArrowLeft, Download, Clock, Package } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';

interface Delivery {
  id: string;
  orderId: string;
  status: string;
  deliveredAt?: string;
  order: {
    orderNumber: string;
    total: number;
    restaurant: {
      name: string;
    };
  };
}

interface EarningStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  total: number;
  deliveriesCount: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    total: number;
  };
}

export default function DriverEarningsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<EarningStats>({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    total: 0,
    deliveriesCount: {
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      total: 0,
    },
  });
  const [recentDeliveries, setRecentDeliveries] = useState<Delivery[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>(
    'today'
  );

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedUserRole = localStorage.getItem('userRole');

    if (!storedUserId || storedUserRole !== 'DRIVER') {
      router.push('/login');
      return;
    }

    setUserId(storedUserId);
    loadEarningsData(storedUserId);
  }, []);

  const loadEarningsData = async (uid: string) => {
    try {
      setLoading(true);

      // Get driver profile for total earnings
      const profileResponse = await fetch(`/api/drivers?userId=${uid}`);
      const profileData = await profileResponse.json();

      // Get all completed deliveries
      const deliveriesResponse = await fetch(`/api/deliveries?driverId=${uid}`);
      const deliveriesData = await deliveriesResponse.json();

      if (deliveriesData.success && deliveriesData.data) {
        const completedDeliveries = deliveriesData.data.filter(
          (d: Delivery) => d.status === 'DELIVERED' && d.deliveredAt
        );

        // Calculate earnings by period
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        let todayEarnings = 0;
        let weekEarnings = 0;
        let monthEarnings = 0;
        let todayCount = 0;
        let weekCount = 0;
        let monthCount = 0;

        completedDeliveries.forEach((delivery: Delivery) => {
          const deliveredDate = new Date(delivery.deliveredAt!);
          const earning = delivery.order.total * 0.15; // Driver gets 15% of order total

          if (deliveredDate >= todayStart) {
            todayEarnings += earning;
            todayCount++;
          }
          if (deliveredDate >= weekStart) {
            weekEarnings += earning;
            weekCount++;
          }
          if (deliveredDate >= monthStart) {
            monthEarnings += earning;
            monthCount++;
          }
        });

        setStats({
          today: todayEarnings,
          thisWeek: weekEarnings,
          thisMonth: monthEarnings,
          total: profileData.data?.totalEarnings || 0,
          deliveriesCount: {
            today: todayCount,
            thisWeek: weekCount,
            thisMonth: monthCount,
            total: completedDeliveries.length,
          },
        });

        // Set recent deliveries (last 10)
        setRecentDeliveries(
          completedDeliveries
            .sort(
              (a: Delivery, b: Delivery) =>
                new Date(b.deliveredAt!).getTime() -
                new Date(a.deliveredAt!).getTime()
            )
            .slice(0, 10)
        );
      }
    } catch (error) {
      console.error('Error loading earnings data:', error);
      alert('ไม่สามารถโหลดข้อมูลรายได้ได้');
    } finally {
      setLoading(false);
    }
  };

  const getPeriodStats = () => {
    switch (selectedPeriod) {
      case 'today':
        return {
          earnings: stats.today,
          count: stats.deliveriesCount.today,
          label: 'วันนี้',
        };
      case 'week':
        return {
          earnings: stats.thisWeek,
          count: stats.deliveriesCount.thisWeek,
          label: 'สัปดาห์นี้',
        };
      case 'month':
        return {
          earnings: stats.thisMonth,
          count: stats.deliveriesCount.thisMonth,
          label: 'เดือนนี้',
        };
    }
  };

  const handleExport = () => {
    // Simple CSV export
    const csv = [
      ['เลขที่ออเดอร์', 'ร้านค้า', 'วันที่ส่ง', 'รายได้'],
      ...recentDeliveries.map((d) => [
        d.order.orderNumber,
        d.order.restaurant.name,
        new Date(d.deliveredAt!).toLocaleString('th-TH'),
        (d.order.total * 0.15).toFixed(2),
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `earnings_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <MainLayout userId={userId || undefined}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const periodStats = getPeriodStats();

  return (
    <MainLayout userId={userId || undefined}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/driver')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              กลับไป Dashboard
            </button>
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                รายได้
              </h1>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all"
              >
                <Download className="w-5 h-5" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Period Selector */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setSelectedPeriod('today')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                selectedPeriod === 'today'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              วันนี้
            </button>
            <button
              onClick={() => setSelectedPeriod('week')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                selectedPeriod === 'week'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              สัปดาห์นี้
            </button>
            <button
              onClick={() => setSelectedPeriod('month')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                selectedPeriod === 'month'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              เดือนนี้
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Current Period Earnings */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-8 h-8" />
                <div className="text-sm opacity-90">{periodStats.label}</div>
              </div>
              <div className="text-3xl font-bold mb-1">
                ฿{periodStats.earnings.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-sm opacity-90">
                {periodStats.count} งาน
              </div>
            </div>

            {/* Total Earnings */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-8 h-8" />
                <div className="text-sm opacity-90">รายได้สะสม</div>
              </div>
              <div className="text-3xl font-bold mb-1">
                ฿{stats.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-sm opacity-90">
                {stats.deliveriesCount.total} งานทั้งหมด
              </div>
            </div>

            {/* Average per Delivery */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <Package className="w-8 h-8" />
                <div className="text-sm opacity-90">เฉลี่ยต่องาน</div>
              </div>
              <div className="text-3xl font-bold mb-1">
                ฿
                {stats.deliveriesCount.total > 0
                  ? (stats.total / stats.deliveriesCount.total).toLocaleString(
                      'th-TH',
                      { minimumFractionDigits: 2 }
                    )
                  : '0.00'}
              </div>
              <div className="text-sm opacity-90">ต่อการส่ง 1 ครั้ง</div>
            </div>

            {/* This Week */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-8 h-8" />
                <div className="text-sm opacity-90">สัปดาห์นี้</div>
              </div>
              <div className="text-3xl font-bold mb-1">
                ฿{stats.thisWeek.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-sm opacity-90">
                {stats.deliveriesCount.thisWeek} งาน
              </div>
            </div>
          </div>

          {/* Recent Deliveries */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              ประวัติการส่งล่าสุด
            </h2>

            {recentDeliveries.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>ยังไม่มีประวัติการส่ง</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-200 dark:border-gray-700">
                    <tr className="text-left">
                      <th className="pb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        เลขที่ออเดอร์
                      </th>
                      <th className="pb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        ร้านค้า
                      </th>
                      <th className="pb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        วันที่ส่ง
                      </th>
                      <th className="pb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        มูลค่าออเดอร์
                      </th>
                      <th className="pb-3 text-sm font-semibold text-gray-700 dark:text-gray-300 text-right">
                        รายได้
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {recentDeliveries.map((delivery) => (
                      <tr
                        key={delivery.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="py-4 text-sm font-medium text-gray-900 dark:text-white">
                          {delivery.order.orderNumber}
                        </td>
                        <td className="py-4 text-sm text-gray-700 dark:text-gray-300">
                          {delivery.order.restaurant.name}
                        </td>
                        <td className="py-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {new Date(delivery.deliveredAt!).toLocaleString('th-TH', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </td>
                        <td className="py-4 text-sm text-gray-700 dark:text-gray-300">
                          ฿{delivery.order.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 text-sm font-semibold text-green-600 dark:text-green-400 text-right">
                          ฿
                          {(delivery.order.total * 0.15).toLocaleString('th-TH', {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Info Card */}
          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-lg p-6">
            <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2">
              ℹ️ ข้อมูลรายได้
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• ค่าจัดส่ง: คิดเป็น 15% ของมูลค่าออเดอร์</li>
              <li>• รายได้จะถูกโอนเข้าบัญชีทุกวันศุกร์</li>
              <li>• สามารถตรวจสอบประวัติการโอนได้ในหน้า Dashboard</li>
              <li>• มีคำถาม? ติดต่อฝ่ายสนับสนุน 02-xxx-xxxx</li>
            </ul>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
