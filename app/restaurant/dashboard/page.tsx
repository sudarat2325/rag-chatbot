'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useSocket } from '@/lib/hooks/useSocket';
import { ChatBox } from '@/components/chat/ChatBox';
import {
  Package,
  Clock,
  TrendingUp,
  DollarSign,
  ChefHat,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageCircle,
} from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  items: Array<{
    menuItem: { name: string };
    quantity: number;
  }>;
  delivery?: {
    driver?: {
      id: string;
      name: string;
      phone: string;
    } | null;
  } | null;
}

interface Stats {
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  completedOrders: number;
}

export default function RestaurantDashboard() {
  const [userId, setUserId] = useState<string | undefined>();
  const [restaurantId, setRestaurantId] = useState<string | undefined>();
  const [userName, setUserName] = useState<string>('เจ้าของร้าน');
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats>({
    todayOrders: 0,
    todayRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'pending' | 'all'>('pending');
  const [chatContext, setChatContext] = useState<{
    orderId: string;
    recipientId: string;
    recipientName: string;
    recipientType: 'driver' | 'customer';
  } | null>(null);

  const { joinRestaurant, on, off } = useSocket(userId);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedRestaurantId = localStorage.getItem('restaurantId') || 'demo-restaurant-id';
    const storedUserName = localStorage.getItem('userName');

    if (storedUserId) {
      setUserId(storedUserId);
    }
    if (storedUserName) {
      setUserName(storedUserName);
    }
    setRestaurantId(storedRestaurantId);
  }, []);

  useEffect(() => {
    if (restaurantId) {
      fetchOrders();
      joinRestaurant(restaurantId);

      // Listen for new orders
      const handleNewOrder = () => {
        console.warn('🏪 New order notification received');
        fetchOrders(); // Refresh orders
      };

      on('restaurant-notification', handleNewOrder);

      return () => {
        off('restaurant-notification', handleNewOrder);
      };
    }
  }, [restaurantId, joinRestaurant, on, off]);

  const fetchOrders = async () => {
    if (!restaurantId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/orders?restaurantId=${restaurantId}`);
      const data = await response.json();

      if (data.success) {
        const ordersList = data.data || [];
        setOrders(ordersList);

        // Calculate stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayOrders = ordersList.filter(
          (o: Order) => new Date(o.createdAt) >= today
        );

        const todayRevenue = todayOrders.reduce(
          (sum: number, o: Order) => sum + o.total,
          0
        );

        const pendingOrders = ordersList.filter(
          (o: Order) => ['PENDING', 'ACCEPTED', 'PREPARING'].includes(o.status)
        ).length;

        const completedOrders = ordersList.filter(
          (o: Order) => o.status === 'DELIVERED'
        ).length;

        setStats({
          todayOrders: todayOrders.length,
          todayRevenue,
          pendingOrders,
          completedOrders,
        });
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setOrders(prev =>
          prev.map(o => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const openChat = (context: {
    orderId: string;
    recipientId: string;
    recipientName: string;
    recipientType: 'driver' | 'customer';
  }) => {
    setChatContext(context);
  };

  const closeChat = () => setChatContext(null);

  const filteredOrders =
    selectedTab === 'pending'
      ? orders.filter(o =>
          ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.status)
        )
      : orders;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
      ACCEPTED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
      PREPARING: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
      READY: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
      PICKED_UP: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400',
      ON_THE_WAY: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400',
      DELIVERED: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
      CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
      REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    };
    return colors[status] || colors.PENDING;
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      PENDING: 'รอยืนยัน',
      ACCEPTED: 'รับแล้ว',
      PREPARING: 'กำลังทำ',
      READY: 'พร้อมส่ง',
      PICKED_UP: 'คนขับรับแล้ว',
      ON_THE_WAY: 'กำลังส่ง',
      DELIVERED: 'ส่งแล้ว',
      CANCELLED: 'ยกเลิก',
      REJECTED: 'ปฏิเสธ',
    };
    return texts[status] || status;
  };

  return (
    <MainLayout userId={userId} showFooter={false}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">ร้านอาหารของฉัน</h1>
                <p className="opacity-90">จัดการออเดอร์และเมนู</p>
              </div>
              <ChefHat className="w-16 h-16 opacity-50" />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="container mx-auto px-4 -mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Today Orders */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.todayOrders}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">ออเดอร์วันนี้</p>
            </div>

            {/* Today Revenue */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  ฿{stats.todayRevenue.toFixed(0)}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">ยอดขายวันนี้</p>
            </div>

            {/* Pending Orders */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.pendingOrders}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">รอดำเนินการ</p>
            </div>

            {/* Completed Orders */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.completedOrders}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">สำเร็จแล้ว</p>
            </div>
          </div>

          {/* Orders Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <div className="flex">
                <button
                  onClick={() => setSelectedTab('pending')}
                  className={`px-6 py-4 font-semibold border-b-2 transition-colors ${
                    selectedTab === 'pending'
                      ? 'border-orange-500 text-orange-500'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  ออเดอร์ที่รอดำเนินการ ({stats.pendingOrders})
                </button>
                <button
                  onClick={() => setSelectedTab('all')}
                  className={`px-6 py-4 font-semibold border-b-2 transition-colors ${
                    selectedTab === 'all'
                      ? 'border-orange-500 text-orange-500'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  ออเดอร์ทั้งหมด ({orders.length})
                </button>
              </div>
            </div>

            {/* Orders List */}
            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    {selectedTab === 'pending' ? 'ไม่มีออเดอร์ที่รอดำเนินการ' : 'ยังไม่มีออเดอร์'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map(order => (
                    <div
                      key={order.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                            #{order.orderNumber}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(order.createdAt).toLocaleString('th-TH')}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            ลูกค้า: {order.customer.name} ({order.customer.phone})
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                          <p className="text-xl font-bold text-orange-500 mt-2">
                            ฿{order.total.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          รายการอาหาร:
                        </p>
                        <ul className="space-y-1">
                          {order.items.map((item, idx) => (
                            <li key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                              • {item.quantity}x {item.menuItem.name}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Chat Actions */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        <button
                          onClick={() =>
                            order.customer?.id &&
                            openChat({
                              orderId: order.id,
                              recipientId: order.customer.id,
                              recipientName: order.customer.name,
                              recipientType: 'customer',
                            })
                          }
                          disabled={!order.customer?.id}
                          className={`px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
                            order.customer?.id
                              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          <MessageCircle className="w-4 h-4" />
                          แชตกับลูกค้า
                        </button>

                        <button
                          onClick={() =>
                            order.delivery?.driver?.id &&
                            openChat({
                              orderId: order.id,
                              recipientId: order.delivery.driver.id,
                              recipientName: order.delivery.driver.name,
                              recipientType: 'driver',
                            })
                          }
                          disabled={!order.delivery?.driver?.id}
                          className={`px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
                            order.delivery?.driver?.id
                              ? 'bg-blue-500 text-white hover:bg-blue-600'
                              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          <MessageCircle className="w-4 h-4" />
                          แชตกับไรเดอร์
                        </button>
                      </div>

                      {/* Action Buttons */}
                      {order.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateOrderStatus(order.id, 'ACCEPTED')}
                            className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            รับออเดอร์
                          </button>
                          <button
                            onClick={() => updateOrderStatus(order.id, 'REJECTED')}
                            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            ปฏิเสธ
                          </button>
                        </div>
                      )}

                      {order.status === 'ACCEPTED' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                          className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                        >
                          <ChefHat className="w-4 h-4" />
                          เริ่มทำอาหาร
                        </button>
                      )}

                      {order.status === 'PREPARING' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'READY')}
                          className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
                        >
                          <AlertCircle className="w-4 h-4" />
                          อาหารพร้อมแล้ว
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
      </div>

      {/* Real-time Indicator */}
      <div className="fixed bottom-6 right-6 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        <span className="text-sm font-medium">Real-time Updates</span>
      </div>
    </div>

    {chatContext && userId && (
      <ChatBox
        orderId={chatContext.orderId}
        userId={userId}
        userName={userName}
        recipientId={chatContext.recipientId}
        recipientName={chatContext.recipientName}
        recipientType={chatContext.recipientType}
        onClose={closeChat}
      />
    )}
  </MainLayout>
);
}
