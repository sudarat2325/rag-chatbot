'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit,
  Save,
  X,
  Package,
  Star,
  Bell,
  Shield,
  LogOut,
} from 'lucide-react';
import Link from 'next/link';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  addresses: Array<{
    id: string;
    fullAddress: string;
    isDefault: boolean;
  }>;
}

export default function ProfilePage() {
  const [userId, setUserId] = useState<string | undefined>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});
  const [orderStats, setOrderStats] = useState({
    total: 0,
    delivered: 0,
    pending: 0,
  });

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedUserName = localStorage.getItem('userName');
    const storedUserEmail = localStorage.getItem('userEmail');

    if (storedUserId) {
      setUserId(storedUserId);
      // Mock profile data - in production, fetch from API
      setProfile({
        id: storedUserId,
        name: storedUserName || 'ผู้ใช้งาน',
        email: storedUserEmail || 'user@example.com',
        phone: '081-234-5678',
        addresses: [],
      });
      fetchOrderStats(storedUserId);
    }
    setLoading(false);
  }, []);

  interface OrderSummary {
    status: string;
  }

  const fetchOrderStats = async (userId: string) => {
    try {
      const response = await fetch(`/api/orders?customerId=${userId}`);
      const data = await response.json();

      if (data.success) {
        const orders = (data.data || []) as OrderSummary[];
        setOrderStats({
          total: orders.length,
          delivered: orders.filter((o) => o.status === 'DELIVERED').length,
          pending: orders.filter((o) =>
            ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'PICKED_UP', 'ON_THE_WAY'].includes(
              o.status
            )
          ).length,
        });
      }
    } catch (error) {
      console.error('Error fetching order stats:', error);
    }
  };

  const handleEdit = () => {
    setEditedProfile({
      name: profile?.name,
      email: profile?.email,
      phone: profile?.phone,
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (profile) {
      setProfile({
        ...profile,
        name: editedProfile.name || profile.name,
        email: editedProfile.email || profile.email,
        phone: editedProfile.phone || profile.phone,
      });

      // Update localStorage
      localStorage.setItem('userName', editedProfile.name || profile.name);
      localStorage.setItem('userEmail', editedProfile.email || profile.email);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedProfile({});
    setIsEditing(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <MainLayout userId={userId}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </MainLayout>
    );
  }

  if (!profile) {
    return (
      <MainLayout userId={userId}>
        <div className="container mx-auto px-4 py-12 text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            กรุณาเข้าสู่ระบบ
          </h1>
          <Link
            href="/login"
            className="text-orange-500 hover:text-orange-600 font-medium"
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
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Profile Header */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-orange-400 to-red-400 flex items-center justify-center text-white text-3xl font-bold">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedProfile.name}
                      onChange={(e) =>
                        setEditedProfile({ ...editedProfile, name: e.target.value })
                      }
                      className="text-2xl font-bold text-gray-900 dark:text-white mb-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                    />
                  ) : (
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {profile.name}
                    </h1>
                  )}
                  <p className="text-gray-500 dark:text-gray-400">สมาชิก FoodHub</p>
                </div>
              </div>

              {!isEditing ? (
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-4 py-2 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  แก้ไข
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    บันทึก
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                    ยกเลิก
                  </button>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <Mail className="w-5 h-5 text-orange-500" />
                {isEditing ? (
                  <input
                    type="email"
                    value={editedProfile.email}
                    onChange={(e) =>
                      setEditedProfile({ ...editedProfile, email: e.target.value })
                    }
                    className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                  />
                ) : (
                  <span>{profile.email}</span>
                )}
              </div>

              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <Phone className="w-5 h-5 text-orange-500" />
                {isEditing ? (
                  <input
                    type="tel"
                    value={editedProfile.phone}
                    onChange={(e) =>
                      setEditedProfile({ ...editedProfile, phone: e.target.value })
                    }
                    className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                  />
                ) : (
                  <span>{profile.phone}</span>
                )}
              </div>
            </div>
          </div>

          {/* Order Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 text-center">
              <Package className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {orderStats.total}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">ออเดอร์ทั้งหมด</div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 text-center">
              <Star className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {orderStats.delivered}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">สำเร็จ</div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 text-center">
              <Package className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {orderStats.pending}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">กำลังดำเนินการ</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">เมนูด่วน</h2>
            <div className="space-y-2">
              <Link
                href="/food"
                className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Package className="w-5 h-5 text-orange-500" />
                <span className="text-gray-700 dark:text-gray-300">ประวัติการสั่งซื้อ</span>
              </Link>

              <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-left">
                <MapPin className="w-5 h-5 text-orange-500" />
                <span className="text-gray-700 dark:text-gray-300">ที่อยู่ของฉัน</span>
              </button>

              <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-left">
                <Bell className="w-5 h-5 text-orange-500" />
                <span className="text-gray-700 dark:text-gray-300">การแจ้งเตือน</span>
              </button>

              <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-left">
                <Shield className="w-5 h-5 text-orange-500" />
                <span className="text-gray-700 dark:text-gray-300">ความปลอดภัย</span>
              </button>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-4 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium"
          >
            <LogOut className="w-5 h-5" />
            ออกจากระบบ
          </button>
        </div>
      </div>
    </MainLayout>
  );
}
