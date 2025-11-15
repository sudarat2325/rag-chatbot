'use client';

import { useState, useEffect } from 'react';
import { StatCard } from '@/components/analytics/StatCard';
import {
  Users,
  Store,
  ShoppingCart,
  Star,
  DollarSign,
  AlertTriangle,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminAnalytics() {
  const [overview, setOverview] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportStatus, setReportStatus] = useState<'PENDING' | 'ALL'>('PENDING');

  useEffect(() => {
    fetchData();
  }, [reportStatus]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [overviewRes, reportsRes] = await Promise.all([
        fetch('/api/admin/overview'),
        fetch(`/api/admin/reports?status=${reportStatus}`),
      ]);

      const overviewData = await overviewRes.json();
      const reportsData = await reportsRes.json();

      if (overviewData.success) setOverview(overviewData.data);
      if (reportsData.success) setReports(reportsData.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReportAction = async (reportId: string, action: 'HIDE_REVIEW' | 'DISMISS') => {
    try {
      const response = await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          status: 'RESOLVED',
          action,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(action === 'HIDE_REVIEW' ? '✅ ซ่อนรีวิวสำเร็จ' : '✅ ยกเลิกรายงานสำเร็จ');
        fetchData();
      } else {
        alert('❌ เกิดข้อผิดพลาด: ' + data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ เกิดข้อผิดพลาดในการดำเนินการ');
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

  if (!overview) return null;

  const { stats, recentOrders, recentUsers } = overview;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="text-gray-600 dark:text-gray-400 hover:text-orange-500"
              >
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  📊 System Analytics
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  ภาพรวมและสถิติของระบบทั้งหมด
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* System Stats */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">สถิติระบบ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              title="ผู้ใช้ทั้งหมด"
              value={stats.totalUsers.toLocaleString()}
              icon={Users}
              colorClass="bg-blue-500"
            />
            <StatCard
              title="ร้านอาหาร"
              value={stats.totalRestaurants.toLocaleString()}
              icon={Store}
              colorClass="bg-green-500"
              subtitle={`รออนุมัติ: ${stats.pendingRestaurants}`}
            />
            <StatCard
              title="ออเดอร์ทั้งหมด"
              value={stats.totalOrders.toLocaleString()}
              icon={ShoppingCart}
              colorClass="bg-orange-500"
              subtitle={`วันนี้: ${stats.todayOrders}`}
            />
            <StatCard
              title="รายได้รวม"
              value={`฿${stats.totalRevenue.toLocaleString()}`}
              icon={DollarSign}
              colorClass="bg-purple-500"
            />
            <StatCard
              title="รีวิวทั้งหมด"
              value={stats.totalReviews.toLocaleString()}
              icon={Star}
              colorClass="bg-yellow-500"
              subtitle={`ถูกรายงาน: ${stats.reportedReviews}`}
            />
            <StatCard
              title="คนขับออนไลน์"
              value={stats.activeDrivers.toLocaleString()}
              icon={Truck}
              colorClass="bg-indigo-500"
            />
          </div>
        </div>

        {/* Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              ออเดอร์ล่าสุด
            </h3>
            <div className="space-y-3">
              {recentOrders.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  ยังไม่มีออเดอร์
                </p>
              ) : (
                recentOrders.map((order: any) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">
                        {order.orderNumber}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {order.restaurant} • {order.customer}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-orange-600 text-sm">
                        ฿{order.total.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">{order.status}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Users */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              ผู้ใช้ใหม่
            </h3>
            <div className="space-y-3">
              {recentUsers.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  ยังไม่มีผู้ใช้ใหม่
                </p>
              ) : (
                recentUsers.map((user: any) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium">
                      {user.role}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Review Reports */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              รายงานรีวิว
            </h3>
            <select
              value={reportStatus}
              onChange={(e) => setReportStatus(e.target.value as any)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="PENDING">รอการตรวจสอบ</option>
              <option value="ALL">ทั้งหมด</option>
            </select>
          </div>

          {reports.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              {reportStatus === 'PENDING' ? 'ไม่มีรายงานที่รอการตรวจสอบ' : 'ไม่มีรายงาน'}
            </p>
          ) : (
            <div className="space-y-4">
              {reports.map((report: any) => (
                <div
                  key={report.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {report.review.restaurant.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        โดย: {report.review.customer.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        รายงานโดย: {report.reporter.name}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                        {report.reason}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          report.status === 'PENDING'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {report.status}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-3 mb-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      "{report.review.comment}"
                    </p>
                  </div>

                  {report.description && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        เหตุผลการรายงาน:
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {report.description}
                      </p>
                    </div>
                  )}

                  {report.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReportAction(report.id, 'HIDE_REVIEW')}
                        className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        ซ่อนรีวิว
                      </button>
                      <button
                        onClick={() => handleReportAction(report.id, 'DISMISS')}
                        className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        ยกเลิกรายงาน
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
