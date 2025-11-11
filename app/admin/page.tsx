'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { Users, Store, ShoppingBag, Edit, Trash2, Search, LogOut } from 'lucide-react';

type RoleType = 'CUSTOMER' | 'RESTAURANT_OWNER' | 'DRIVER' | 'ADMIN';
type EntityTab = 'users' | 'restaurants' | 'orders';

interface AdminUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role: RoleType;
  phone?: string | null;
}

interface AdminRestaurant {
  id: string;
  name: string;
  phone?: string | null;
  rating?: number | null;
  totalOrders?: number | null;
  isOpen: boolean;
}

interface AdminOrderParty {
  name?: string | null;
}

interface AdminOrderRestaurant {
  name?: string | null;
}

interface AdminOrder {
  id: string;
  orderNumber?: string | null;
  customer?: AdminOrderParty | null;
  restaurant?: AdminOrderRestaurant | null;
  total?: number | null;
  status: string;
  createdAt: string | Date;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | undefined>();
  const [userRole, setUserRole] = useState<RoleType | null>(null);
  const [activeTab, setActiveTab] = useState<EntityTab>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [restaurants, setRestaurants] = useState<AdminRestaurant[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedUserRole = localStorage.getItem('userRole');

    if (!storedUserId) {
      alert('⚠️ กรุณา Login ก่อนเข้าใช้งาน');
      router.push('/login');
      return;
    }

    if (storedUserRole !== 'ADMIN') {
      alert('❌ คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (ต้องเป็น Admin เท่านั้น)');
      // Redirect based on actual role
      if (storedUserRole === 'RESTAURANT_OWNER') {
        router.push('/restaurant-dashboard');
      } else if (storedUserRole === 'DRIVER') {
        router.push('/driver/dashboard');
      } else {
        router.push('/food');
      }
      return;
    }

    setUserId(storedUserId);
    setUserRole(storedUserRole);
    fetchData();
  }, [router]);

  useEffect(() => {
    if (userRole === 'ADMIN') {
      fetchData();
    }
  }, [activeTab, userRole]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const response = await fetch('/api/users');
        const data = await response.json();
        if (data.success) setUsers((data.data || []) as AdminUser[]);
      } else if (activeTab === 'restaurants') {
        const response = await fetch('/api/restaurants');
        const data = await response.json();
        if (data.success) setRestaurants((data.data || []) as AdminRestaurant[]);
      } else if (activeTab === 'orders') {
        const response = await fetch('/api/orders');
        const data = await response.json();
        if (data.success) setOrders((data.data || []) as AdminOrder[]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, type: EntityTab) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบรายการนี้?')) return;

    try {
      const endpoint =
        type === 'users'
          ? '/api/users'
          : type === 'restaurants'
          ? '/api/restaurants'
          : '/api/orders';
      const response = await fetch(`${endpoint}/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        alert('ลบสำเร็จ!');
        fetchData();
      } else {
        alert('เกิดข้อผิดพลาด: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('เกิดข้อผิดพลาดในการลบ');
    }
  };

  const handleUpdateRole = async (userId: string, newRole: RoleType) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();
      if (data.success) {
        alert('อัพเดท Role สำเร็จ!');
        fetchData();
      } else {
        alert('เกิดข้อผิดพลาด: ' + data.error);
      }
    } catch (error) {
      console.error('Error updating role:', error);
      alert('เกิดข้อผิดพลาดในการอัพเดท Role');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const filteredUsers = users.filter((user) =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRestaurants = restaurants.filter((restaurant) =>
    restaurant.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOrders = orders.filter((order) =>
    order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && !users.length && !restaurants.length && !orders.length) {
    return (
      <MainLayout userId={userId}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout userId={userId}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900">
        <div className="container mx-auto px-4 max-w-7xl py-8">
          {/* Dark Professional Header */}
          <div className="relative bg-gradient-to-r from-slate-800 to-zinc-800 rounded-3xl shadow-2xl p-8 mb-6 border border-slate-700 overflow-hidden">
            {/* Subtle grid pattern */}
            <div className="absolute inset-0 opacity-5" style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}></div>

            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-slate-700 to-zinc-700 rounded-2xl shadow-xl border border-slate-600">
                  <div className="text-3xl">⚡</div>
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
                    Admin Control Panel
                  </h1>
                  <p className="text-slate-300 text-lg font-medium">
                    💼 System Management Dashboard
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all shadow-lg hover:scale-105 font-semibold"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>

          {/* Dark Tabs with Data Count */}
          <div className="bg-slate-800 rounded-2xl shadow-2xl mb-6 border border-slate-700">
            <div className="grid grid-cols-3 gap-0 border-b border-slate-700">
              <button
                onClick={() => setActiveTab('users')}
                className={`flex flex-col items-center justify-center gap-2 p-6 font-bold transition-all ${
                  activeTab === 'users'
                    ? 'bg-gradient-to-br from-slate-700 to-zinc-700 text-white border-b-4 border-blue-500'
                    : 'text-slate-400 hover:bg-slate-750 hover:text-white'
                }`}
              >
                <Users className="w-6 h-6" />
                <div className="text-sm">Users</div>
                <div className="text-2xl font-bold">{users.length}</div>
              </button>
              <button
                onClick={() => setActiveTab('restaurants')}
                className={`flex flex-col items-center justify-center gap-2 p-6 font-bold transition-all border-x border-slate-700 ${
                  activeTab === 'restaurants'
                    ? 'bg-gradient-to-br from-slate-700 to-zinc-700 text-white border-b-4 border-orange-500'
                    : 'text-slate-400 hover:bg-slate-750 hover:text-white'
                }`}
              >
                <Store className="w-6 h-6" />
                <div className="text-sm">Restaurants</div>
                <div className="text-2xl font-bold">{restaurants.length}</div>
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex flex-col items-center justify-center gap-2 p-6 font-bold transition-all ${
                  activeTab === 'orders'
                    ? 'bg-gradient-to-br from-slate-700 to-zinc-700 text-white border-b-4 border-green-500'
                    : 'text-slate-400 hover:bg-slate-750 hover:text-white'
                }`}
              >
                <ShoppingBag className="w-6 h-6" />
                <div className="text-sm">Orders</div>
                <div className="text-2xl font-bold">{orders.length}</div>
              </button>
            </div>

            {/* Dark Search Bar */}
            <div className="p-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={`🔍 ค้นหา${activeTab === 'users' ? 'ผู้ใช้' : activeTab === 'restaurants' ? 'ร้านอาหาร' : 'ออเดอร์'}...`}
                  className="w-full pl-12 pr-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder:text-slate-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Dark Content Area */}
          <div className="bg-slate-800 rounded-2xl shadow-2xl p-6 border border-slate-700">
            {/* Users Table */}
            {activeTab === 'users' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">ชื่อ</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Role</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">เบอร์โทร</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="py-3 px-4 text-gray-900 dark:text-white">{user.name}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{user.email}</td>
                        <td className="py-3 px-4">
                          <select
                            value={user.role}
                            onChange={(e) => handleUpdateRole(user.id, e.target.value as RoleType)}
                            className="px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 border-none"
                          >
                            <option value="CUSTOMER">CUSTOMER</option>
                            <option value="RESTAURANT_OWNER">RESTAURANT_OWNER</option>
                            <option value="DRIVER">DRIVER</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{user.phone || '-'}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleDelete(user.id, 'users')}
                              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="ลบ"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Restaurants Table */}
            {activeTab === 'restaurants' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">ชื่อร้าน</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">เบอร์โทร</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">คะแนน</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">ออเดอร์</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">สถานะ</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRestaurants.map((restaurant) => (
                      <tr key={restaurant.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="py-3 px-4 text-gray-900 dark:text-white font-semibold">{restaurant.name}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{restaurant.phone}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">⭐ {restaurant.rating?.toFixed(1)}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{restaurant.totalOrders} ออเดอร์</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            restaurant.isOpen
                              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                              : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                          }`}>
                            {restaurant.isOpen ? 'เปิด' : 'ปิด'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleDelete(restaurant.id, 'restaurants')}
                              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="ลบ"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Orders Table */}
            {activeTab === 'orders' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">เลขออเดอร์</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">ลูกค้า</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">ร้านอาหาร</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">ยอดรวม</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">สถานะ</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">วันที่</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="py-3 px-4 text-gray-900 dark:text-white font-mono">#{order.orderNumber}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{order.customer?.name}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{order.restaurant?.name}</td>
                        <td className="py-3 px-4 text-gray-900 dark:text-white font-semibold">฿{order.total?.toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            order.status === 'DELIVERED'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                              : order.status === 'CANCELLED'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">
                          {new Date(order.createdAt).toLocaleDateString('th-TH')}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => router.push(`/orders/${order.id}`)}
                              className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="ดูรายละเอียด"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(order.id, 'orders')}
                              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="ลบ"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Empty State */}
            {((activeTab === 'users' && filteredUsers.length === 0) ||
              (activeTab === 'restaurants' && filteredRestaurants.length === 0) ||
              (activeTab === 'orders' && filteredOrders.length === 0)) && (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">ไม่พบข้อมูล</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
