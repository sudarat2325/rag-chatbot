'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  ChevronRight,
  RotateCcw,
  MessageCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  restaurantId: string;
  restaurant: {
    name: string;
    logo: string;
  };
  items: Array<{
    menuItemId: string;
    menuItem: {
      name: string;
    };
    quantity: number;
    price: number;
  }>;
}

const statusConfig = {
  PENDING: { label: 'รอยืนยัน', color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20', icon: Clock },
  ACCEPTED: { label: 'รับออเดอร์แล้ว', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20', icon: CheckCircle },
  PREPARING: { label: 'กำลังเตรียม', color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20', icon: Package },
  READY: { label: 'พร้อมส่ง', color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20', icon: Package },
  PICKED_UP: { label: 'รับของแล้ว', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20', icon: Package },
  ON_THE_WAY: { label: 'กำลังจัดส่ง', color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20', icon: Package },
  DELIVERED: { label: 'จัดส่งสำเร็จ', color: 'text-green-600 bg-green-50 dark:bg-green-900/20', icon: CheckCircle },
  CANCELLED: { label: 'ยกเลิก', color: 'text-red-600 bg-red-50 dark:bg-red-900/20', icon: XCircle },
  REJECTED: { label: 'ปฏิเสธ', color: 'text-red-600 bg-red-50 dark:bg-red-900/20', icon: XCircle },
};

export default function OrderHistoryPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | undefined>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
      fetchOrders(storedUserId);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, statusFilter]);

  const fetchOrders = async (customerId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders?customerId=${customerId}`);
      const data = await response.json();

      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.items.some((item) =>
            item.menuItem.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        // Filter for active orders (multiple statuses)
        filtered = filtered.filter((order) =>
          ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'PICKED_UP', 'ON_THE_WAY', 'CONFIRMED'].includes(
            order.status
          )
        );
      } else if (statusFilter === 'cancelled') {
        // Filter for cancelled orders
        filtered = filtered.filter((order) =>
          ['CANCELLED', 'REJECTED'].includes(order.status)
        );
      } else {
        // Filter by specific status
        filtered = filtered.filter((order) => order.status === statusFilter);
      }
    }

    setFilteredOrders(filtered);
  };

  const getStatusCounts = () => {
    return {
      all: orders.length,
      active: orders.filter((o) =>
        ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'PICKED_UP', 'ON_THE_WAY'].includes(
          o.status
        )
      ).length,
      delivered: orders.filter((o) => o.status === 'DELIVERED').length,
      cancelled: orders.filter((o) => ['CANCELLED', 'REJECTED'].includes(o.status)).length,
    };
  };

  const handleReorder = (order: Order) => {
    // Store order items in localStorage for checkout
    const reorderData = {
      restaurantId: order.restaurantId,
      items: order.items.map((item) => ({
        id: item.menuItemId,
        name: item.menuItem.name,
        quantity: item.quantity,
        price: item.price,
      })),
    };

    localStorage.setItem('reorderData', JSON.stringify(reorderData));

    // Redirect to restaurant page
    router.push(`/restaurant/${order.restaurantId}`);
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

  if (!userId) {
    return (
      <MainLayout userId={userId}>
        <div className="container mx-auto px-4 py-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            กรุณาเข้าสู่ระบบ
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            เข้าสู่ระบบเพื่อดูประวัติการสั่งซื้อ
          </p>
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

  const statusCounts = getStatusCounts();

  return (
    <MainLayout userId={userId}>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              ประวัติการสั่งซื้อ
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              ดูและติดตามออเดอร์ทั้งหมดของคุณ
            </p>
          </div>

          {/* Status Filter Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-2 mb-6">
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl font-bold">{statusCounts.all}</div>
                  <div className="text-xs mt-1">ทั้งหมด</div>
                </div>
              </button>

              <button
                onClick={() => setStatusFilter('active')}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  statusFilter === 'active'
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl font-bold">{statusCounts.active}</div>
                  <div className="text-xs mt-1">กำลังดำเนินการ</div>
                </div>
              </button>

              <button
                onClick={() => setStatusFilter('DELIVERED')}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  statusFilter === 'DELIVERED'
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl font-bold">{statusCounts.delivered}</div>
                  <div className="text-xs mt-1">สำเร็จ</div>
                </div>
              </button>

              <button
                onClick={() => setStatusFilter('cancelled')}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  statusFilter === 'cancelled'
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl font-bold">{statusCounts.cancelled}</div>
                  <div className="text-xs mt-1">ยกเลิก</div>
                </div>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาเลขออเดอร์, ร้านอาหาร, หรือเมนู..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {searchQuery || statusFilter !== 'all' ? 'ไม่พบออเดอร์' : 'ยังไม่มีออเดอร์'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchQuery || statusFilter !== 'all'
                  ? 'ลองเปลี่ยนคำค้นหาหรือตัวกรอง'
                  : 'เริ่มสั่งอาหารจากร้านที่คุณชื่นชอบ'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Link
                  href="/food"
                  className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  เริ่มสั่งอาหาร
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const statusInfo = statusConfig[order.status as keyof typeof statusConfig];
                const StatusIcon = statusInfo?.icon || Package;

                return (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="block bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {order.restaurant.logo && (
                            <img
                              src={order.restaurant.logo}
                              alt={order.restaurant.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {order.restaurant.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              #{order.orderNumber}
                            </p>
                          </div>
                        </div>

                        <div className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 ${statusInfo?.color}`}>
                          <StatusIcon className="w-4 h-4" />
                          <span className="text-xs font-medium">{statusInfo?.label}</span>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        {order.items.slice(0, 2).map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">
                              {item.quantity}x {item.menuItem.name}
                            </span>
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            และอีก {order.items.length - 2} รายการ
                          </p>
                        )}
                      </div>

                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(order.createdAt).toLocaleDateString('th-TH', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-lg font-bold text-orange-500">
                                ฿{order.total.toFixed(2)}
                              </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex gap-2">
                          {order.status === 'DELIVERED' && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleReorder(order);
                                }}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors text-sm font-medium"
                              >
                                <RotateCcw className="w-4 h-4" />
                                สั่งอีกครั้ง
                              </button>
                              <Link
                                href={`/restaurant/${order.restaurantId}`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                              >
                                <MessageCircle className="w-4 h-4" />
                                รีวิว
                              </Link>
                            </>
                          )}
                          {['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'PICKED_UP', 'ON_THE_WAY'].includes(order.status) && (
                            <Link
                              href={`/orders/${order.id}`}
                              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
                            >
                              ติดตามออเดอร์
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
