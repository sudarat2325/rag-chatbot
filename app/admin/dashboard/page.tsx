'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  Users,
  Store,
  Package,
  DollarSign,
  Clock,
  Star,
  Activity,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface Stats {
  totalUsers: number;
  totalRestaurants: number;
  totalOrders: number;
  totalRevenue: number;
  todayOrders: number;
  todayRevenue: number;
  activeDrivers: number;
  averageOrderValue: number;
}

export default function AdminDashboard() {
  const [userId, setUserId] = useState<string | undefined>();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalRestaurants: 0,
    totalOrders: 0,
    totalRevenue: 0,
    todayOrders: 0,
    todayRevenue: 0,
    activeDrivers: 0,
    averageOrderValue: 0,
  });
  const [loading, setLoading] = useState(true);

  // Mock data for charts
  const revenueData = [
    { name: 'จ', value: 4000 },
    { name: 'อ', value: 3000 },
    { name: 'พ', value: 5000 },
    { name: 'พฤ', value: 4500 },
    { name: 'ศ', value: 6000 },
    { name: 'ส', value: 8000 },
    { name: 'อา', value: 7000 },
  ];

  const ordersData = [
    { name: 'จ', orders: 45 },
    { name: 'อ', orders: 38 },
    { name: 'พ', orders: 52 },
    { name: 'พฤ', orders: 48 },
    { name: 'ศ', orders: 65 },
    { name: 'ส', orders: 80 },
    { name: 'อา', orders: 75 },
  ];

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    }
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      // TODO: Fetch real stats from API
      // For now, use mock data
      setStats({
        totalUsers: 1234,
        totalRestaurants: 56,
        totalOrders: 5432,
        totalRevenue: 234500,
        todayOrders: 87,
        todayRevenue: 12450,
        activeDrivers: 23,
        averageOrderValue: 285,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout userId={userId} showFooter={false}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout userId={userId} showFooter={false}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
                <p className="opacity-90">ภาพรวมระบบและการวิเคราะห์</p>
              </div>
              <Activity className="w-16 h-16 opacity-50" />
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Users */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">ผู้ใช้ทั้งหมด</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalUsers.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Total Restaurants */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <Store className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">ร้านอาหาร</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalRestaurants}
                  </p>
                </div>
              </div>
            </div>

            {/* Total Orders */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">ออเดอร์ทั้งหมด</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalOrders.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Total Revenue */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">ยอดขายรวม</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ฿{stats.totalRevenue.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-8 h-8" />
                <h3 className="text-lg font-semibold">วันนี้</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="opacity-90">ออเดอร์</span>
                  <span className="font-bold">{stats.todayOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-90">ยอดขาย</span>
                  <span className="font-bold">฿{stats.todayRevenue.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <Activity className="w-8 h-8" />
                <h3 className="text-lg font-semibold">คนขับ</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="opacity-90">ออนไลน์</span>
                  <span className="font-bold">{stats.activeDrivers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-90">กำลังส่ง</span>
                  <span className="font-bold">{Math.floor(stats.activeDrivers * 0.6)}</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <Star className="w-8 h-8" />
                <h3 className="text-lg font-semibold">ค่าเฉลี่ย</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="opacity-90">ต่อออเดอร์</span>
                  <span className="font-bold">฿{stats.averageOrderValue}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-90">เรทติ้ง</span>
                  <span className="font-bold">4.5 ⭐</span>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Revenue Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                ยอดขายรายวัน (7 วันที่แล้ว)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#f97316"
                    strokeWidth={2}
                    name="ยอดขาย (฿)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Orders Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                จำนวนออเดอร์รายวัน
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ordersData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="orders" fill="#8b5cf6" name="ออเดอร์" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              กิจกรรมล่าสุด
            </h3>

            <div className="space-y-3">
              {[
                { type: 'order', text: 'ออเดอร์ใหม่ #12345 จากร้าน KFC', time: '2 นาทีที่แล้ว', color: 'text-blue-500' },
                { type: 'user', text: 'ผู้ใช้ใหม่ สมชาย ใจดี สมัครสมาชิก', time: '5 นาทีที่แล้ว', color: 'text-green-500' },
                { type: 'restaurant', text: 'ร้านใหม่ Pizza Hut เข้าร่วม', time: '10 นาทีที่แล้ว', color: 'text-orange-500' },
                { type: 'order', text: 'ออเดอร์ #12344 ส่งสำเร็จแล้ว', time: '15 นาทีที่แล้ว', color: 'text-green-500' },
                { type: 'review', text: 'รีวิวใหม่ 5 ดาว สำหรับร้าน McDonald\'s', time: '20 นาทีที่แล้ว', color: 'text-yellow-500' },
              ].map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${activity.color.replace('text-', 'bg-')}`}></div>
                    <span className="text-gray-900 dark:text-white">{activity.text}</span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* System Health */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Database</span>
                <span className="text-green-500 font-semibold">●  Online</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">85% capacity</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Socket.IO</span>
                <span className="text-green-500 font-semibold">● Online</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }}></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">147 connections</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">API Server</span>
                <span className="text-green-500 font-semibold">● Online</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '78%' }}></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">45ms avg response</p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
