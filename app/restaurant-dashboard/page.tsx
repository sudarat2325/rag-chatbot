'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSocket } from '@/lib/hooks/useSocket';
import { Clock, CheckCircle, Truck, Package, XCircle, Filter, RefreshCw, Store, LogOut } from 'lucide-react';

interface OrderItem {
  id?: string;
  quantity: number;
  price?: number;
  menuItem?: {
    name: string;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  customerId?: string;
  customer?: {
    id?: string;
    name: string;
    phone: string;
  };
  items: OrderItem[];
  total: number;
  createdAt: string;
}

interface Restaurant {
  id: string;
  name: string;
  logo?: string;
}

function RestaurantDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightOrderId = searchParams.get('orderId');
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [highlightedOrder, setHighlightedOrder] = useState<string | null>(highlightOrderId);
  const [statusFilter, setStatusFilter] = useState<string>('active');

  // Socket.IO for real-time updates
  const { joinRestaurant, leaveRestaurant, joinOrder, leaveOrder, on, off } = useSocket(userId || undefined);
  const orderRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    // Check authentication
    const storedUserId = localStorage.getItem('userId');
    const storedUserRole = localStorage.getItem('userRole');
    const storedUserEmail = localStorage.getItem('userEmail');

    console.warn('🔍 Restaurant Dashboard - Auth Check:', {
      userId: storedUserId,
      role: storedUserRole,
      email: storedUserEmail
    });

    if (!storedUserId) {
      alert('⚠️ กรุณา Login ก่อนเข้าใช้งาน');
      router.push('/login');
      return;
    }

    if (storedUserRole !== 'RESTAURANT_OWNER') {
      alert(`❌ คุณไม่มีสิทธิ์เข้าถึงหน้านี้\n\nRole ปัจจุบัน: ${storedUserRole}\nEmail: ${storedUserEmail}\n\nต้องเป็น RESTAURANT_OWNER เท่านั้น`);
      // Redirect based on actual role
      if (storedUserRole === 'ADMIN') {
        router.push('/admin');
      } else if (storedUserRole === 'DRIVER') {
        router.push('/driver/dashboard');
      } else {
        router.push('/food');
      }
      return;
    }

    setUserId(storedUserId);
    setUserRole(storedUserRole);
    setUserEmail(storedUserEmail);
    fetchRestaurantAndOrders(storedUserId);
  }, [router]);

  useEffect(() => {
    if (restaurant) {
      const interval = setInterval(() => fetchOrders(restaurant.id), 5000);
      return () => clearInterval(interval);
    }
  }, [restaurant]);

  useEffect(() => {
    filterOrders();
  }, [orders, statusFilter]);

  useEffect(() => {
    if (highlightOrderId && orders.length > 0) {
      setTimeout(() => {
        const orderRef = orderRefs.current[highlightOrderId];
        if (orderRef) {
          orderRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setHighlightedOrder(highlightOrderId);
          setTimeout(() => setHighlightedOrder(null), 3000);
        }
      }, 500);
    }
  }, [highlightOrderId, orders]);

  // Socket.IO: Join restaurant room and listen for real-time updates
  useEffect(() => {
    if (!restaurant?.id) return;

    // Join restaurant room to receive new orders and updates
    joinRestaurant(restaurant.id);

    // Listen for order updates
    const handleOrderUpdate = () => {
      // Refresh orders when any order is updated
      fetchOrders(restaurant.id);
    };

    on('order-status-update', handleOrderUpdate);
    on('restaurant-notification', handleOrderUpdate);

    return () => {
      leaveRestaurant(restaurant.id);
      off('order-status-update', handleOrderUpdate);
      off('restaurant-notification', handleOrderUpdate);
    };
  }, [restaurant, joinRestaurant, leaveRestaurant, on, off]);

  // Socket.IO: Join all active order rooms for real-time chat
  useEffect(() => {
    if (orders.length === 0) return;

    // Join order rooms for active orders (not delivered/cancelled)
    orders.forEach((order) => {
      if (!['DELIVERED', 'CANCELLED', 'REJECTED'].includes(order.status)) {
        joinOrder(order.id);
      }
    });

    return () => {
      orders.forEach((order) => {
        leaveOrder(order.id);
      });
    };
  }, [orders, joinOrder, leaveOrder]);

  const fetchRestaurantAndOrders = async (uid: string) => {
    try {
      setLoading(true);

      // Get restaurant data for this user
      const restaurantResponse = await fetch(`/api/restaurants?ownerId=${uid}`);
      const restaurantData = await restaurantResponse.json();

      if (restaurantData.success && restaurantData.data && restaurantData.data.length > 0) {
        const userRestaurant = restaurantData.data[0];
        setRestaurant(userRestaurant);

        // Fetch orders for this restaurant
        await fetchOrders(userRestaurant.id);
      } else {
        alert('ไม่พบข้อมูลร้านอาหารของคุณ กรุณาสมัครเป็นเจ้าของร้านอาหารก่อน');
        router.push('/food');
      }
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูลร้านอาหาร');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (restaurantId: string) => {
    try {
      const response = await fetch(`/api/orders?restaurantId=${restaurantId}`);
      const data = await response.json();

      if (data.success && data.data) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    if (statusFilter === 'active') {
      filtered = filtered.filter(order =>
        ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'].includes(order.status)
      );
    } else if (statusFilter === 'completed') {
      filtered = filtered.filter(order =>
        ['PICKED_UP', 'ON_THE_WAY', 'DELIVERED'].includes(order.status)
      );
    } else if (statusFilter === 'cancelled') {
      filtered = filtered.filter(order => ['CANCELLED', 'REJECTED'].includes(order.status));
    }

    setFilteredOrders(filtered);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);

    try {
      console.log('🔄 Updating order status:', {
        orderId,
        newStatus,
        userId
      });

      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          userId: userId
        }),
      });

      const data = await response.json();
      console.log('📥 Update response:', data);

      if (response.ok && data.success) {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
        toast.innerHTML = '✅ อัพเดทสถานะสำเร็จ! ลูกค้าได้รับการแจ้งเตือนแล้ว';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);

        if (restaurant) {
          fetchOrders(restaurant.id);
        }
      } else {
        console.error('❌ Update failed:', {
          status: response.status,
          data
        });
        const errorMsg = data.error || data.message || 'ไม่สามารถอัพเดทสถานะได้';
        alert(`❌ เกิดข้อผิดพลาด: ${errorMsg}\n\nกรุณาตรวจสอบ Console สำหรับรายละเอียด`);
      }
    } catch (error) {
      console.error('💥 Error updating order status:', error);
      alert('❌ เกิดข้อผิดพลาดในการอัพเดทสถานะ\n\nกรุณาตรวจสอบ Console');
    } finally {
      setUpdating(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    router.push('/login');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'ACCEPTED':
        return 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300';
      case 'PREPARING':
        return 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/20 dark:text-purple-300';
      case 'READY':
        return 'bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-900/20 dark:text-indigo-300';
      case 'PICKED_UP':
        return 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/20 dark:text-orange-300';
      case 'ON_THE_WAY':
        return 'bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-900/20 dark:text-cyan-300';
      case 'DELIVERED':
        return 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-300';
      case 'CANCELLED':
      case 'REJECTED':
        return 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getUpdateButtonClass = (status: string) => {
    const base =
      'flex-1 px-4 py-2 font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all ';
    const variant =
      status === 'REJECTED' || status === 'CANCELLED'
        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700'
        : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600';
    return `${base}${variant}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-5 h-5" />;
      case 'ACCEPTED':
      case 'READY':
      case 'DELIVERED':
        return <CheckCircle className="w-5 h-5" />;
      case 'PREPARING':
        return <Package className="w-5 h-5" />;
      case 'PICKED_UP':
      case 'ON_THE_WAY':
        return <Truck className="w-5 h-5" />;
      case 'CANCELLED':
      case 'REJECTED':
        return <XCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      PENDING: 'รอยืนยัน',
      ACCEPTED: 'ยืนยันแล้ว',
      PREPARING: 'กำลังเตรียม',
      READY: 'พร้อมส่ง',
      PICKED_UP: 'ไรเดอร์รับแล้ว',
      ON_THE_WAY: 'กำลังจัดส่ง',
      DELIVERED: 'จัดส่งแล้ว',
      CANCELLED: 'ยกเลิก',
      REJECTED: 'ปฏิเสธ',
    };
    return statusMap[status] || status;
  };

  // Restaurant can only update these statuses
  const getNextStatuses = (currentStatus: string): string[] => {
    switch (currentStatus) {
      case 'PENDING':
        return ['ACCEPTED', 'REJECTED'];
      case 'ACCEPTED':
        return ['PREPARING', 'CANCELLED'];
      case 'PREPARING':
        return ['READY', 'CANCELLED'];
      case 'READY':
        // อนุญาตให้ร้านเปลี่ยนกลับเป็น PREPARING ได้หากยังไม่ถูกไรเดอร์รับ
        return ['PREPARING', 'CANCELLED'];
      default:
        return [];
    }
  };

  const activeCount = orders.filter(o =>
    ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.status)
  ).length;

  const completedCount = orders.filter(o =>
    ['PICKED_UP', 'ON_THE_WAY', 'DELIVERED'].includes(o.status)
  ).length;

  const cancelledCount = orders.filter(o => ['CANCELLED', 'REJECTED'].includes(o.status)).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Premium Header with Gold Accent */}
        <div className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 rounded-3xl shadow-2xl p-8 mb-6 overflow-hidden">
          {/* Decorative Gold Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-400/20 to-amber-600/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-pink-400/20 to-purple-400/20 rounded-full blur-3xl -ml-24 -mb-24"></div>

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-5">
              {restaurant?.logo && (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full blur-lg opacity-50"></div>
                  <img src={restaurant.logo} alt={restaurant.name} className="relative w-20 h-20 rounded-full object-cover ring-4 ring-amber-400/50" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold text-white drop-shadow-lg">
                    👑 {restaurant?.name || 'ร้านอาหาร'}
                  </h1>
                  <span className="px-3 py-1 bg-gradient-to-r from-amber-400 to-amber-500 text-purple-900 text-sm font-bold rounded-full shadow-lg">
                    PREMIUM
                  </span>
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full border border-white/30">
                    {userRole}
                  </span>
                </div>
                <p className="text-purple-100 text-lg font-medium">
                  💼 ระบบจัดการออเดอร์สำหรับร้านอาหาร
                </p>
                {userEmail && (
                  <p className="text-purple-200 text-sm mt-1">
                    📧 {userEmail}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => restaurant && fetchOrders(restaurant.id)}
                className="p-4 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all shadow-lg hover:scale-105 border border-white/30"
                title="รีเฟรชข้อมูล"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={handleLogout}
                className="p-4 bg-red-500/90 text-white rounded-xl hover:bg-red-600 transition-all shadow-lg hover:scale-105"
                title="ออกจากระบบ"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Premium Info Box */}
        <div className="relative bg-gradient-to-r from-purple-100 via-pink-50 to-amber-50 dark:from-purple-900/20 dark:to-amber-900/20 rounded-2xl p-6 mb-6 border-2 border-purple-200 dark:border-purple-800 shadow-lg overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl"></div>
          <div className="relative">
            <h3 className="flex items-center gap-2 font-bold text-purple-900 dark:text-purple-300 mb-3 text-lg">
              <span className="text-2xl">💎</span> สำหรับเจ้าของร้านอาหาร:
            </h3>
            <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-2 ml-5">
              <li className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">✓</span>
                <span>คุณสามารถจัดการออเดอร์ของร้านได้ตั้งแต่ยืนยันออเดอร์จนถึงพร้อมส่ง</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">✓</span>
                <span>เมื่อสถานะเป็น "พร้อมส่ง" ไรเดอร์จะรับออเดอร์และดำเนินการส่งต่อ</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">✓</span>
                <span>ระบบจะแจ้งเตือนลูกค้าอัตโนมัติทุกครั้งที่คุณอัพเดทสถานะ</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Highlighted Order Banner */}
        {highlightedOrder && (
          <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-l-4 border-orange-500 rounded-lg p-4 mb-6 animate-pulse">
            <div className="flex items-center gap-3">
              <Package className="w-6 h-6 text-orange-500" />
              <div>
                <h3 className="font-bold text-orange-900 dark:text-orange-300">
                  🎯 กำลังแสดงออเดอร์ที่เลือก
                </h3>
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  ออเดอร์ที่คุณต้องการอัพเดทถูกไฮไลท์ด้านล่าง
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Premium Filter Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6 border border-purple-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Filter className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">กรองสถานะออเดอร์</h3>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <button
              onClick={() => setStatusFilter('all')}
              className={`p-5 rounded-xl font-semibold transition-all hover:scale-105 ${
                statusFilter === 'all'
                  ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-xl shadow-purple-300/50'
                  : 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 hover:from-purple-50 hover:to-pink-50 border border-gray-200 dark:border-gray-600'
              }`}
            >
              <div className="text-3xl font-bold">{orders.length}</div>
              <div className="text-sm mt-1">ทั้งหมด</div>
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`p-5 rounded-xl font-semibold transition-all hover:scale-105 ${
                statusFilter === 'active'
                  ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-purple-900 shadow-xl shadow-amber-300/50'
                  : 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 hover:from-amber-50 hover:to-amber-100 border border-gray-200 dark:border-gray-600'
              }`}
            >
              <div className="text-2xl font-bold">{activeCount}</div>
              <div className="text-sm">ต้องจัดการ</div>
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`p-4 rounded-lg font-medium transition-all ${
                statusFilter === 'completed'
                  ? 'bg-green-500 text-white shadow-lg scale-105'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <div className="text-2xl font-bold">{completedCount}</div>
              <div className="text-sm">กำลังจัดส่ง/เสร็จสิ้น</div>
            </button>
            <button
              onClick={() => setStatusFilter('cancelled')}
              className={`p-4 rounded-lg font-medium transition-all ${
                statusFilter === 'cancelled'
                  ? 'bg-red-500 text-white shadow-lg scale-105'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <div className="text-2xl font-bold">{cancelledCount}</div>
              <div className="text-sm">ยกเลิก/ปฏิเสธ</div>
            </button>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
            <Store className="w-24 h-24 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              ไม่มีออเดอร์
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {statusFilter === 'active' && 'ไม่มีออเดอร์ที่ต้องจัดการ'}
              {statusFilter === 'completed' && 'ยังไม่มีออเดอร์ที่กำลังจัดส่ง/เสร็จสิ้น'}
              {statusFilter === 'cancelled' && 'ไม่มีออเดอร์ที่ยกเลิก'}
              {statusFilter === 'all' && 'ยังไม่มีออเดอร์ในระบบ'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                ref={(el) => { orderRefs.current[order.id] = el }}
                className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 transition-all duration-500 ${
                  highlightedOrder === order.id
                    ? 'ring-4 ring-orange-500 ring-opacity-50 shadow-2xl scale-105'
                    : 'hover:shadow-2xl'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      ออเดอร์ #{order.orderNumber}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {order.customer?.name || 'ลูกค้า'} {order.customer?.phone ? `- ${order.customer.phone}` : ''}
                    </p>
                  </div>
                  <div
                    className={`px-4 py-2 rounded-lg border-2 flex items-center gap-2 ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {getStatusIcon(order.status)}
                    <span className="font-semibold">{getStatusText(order.status)}</span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="border-t border-b border-gray-200 dark:border-gray-700 py-4 mb-4">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, index) => (
                      <div key={index} className="flex justify-between mb-2">
                        <span className="text-gray-700 dark:text-gray-300">
                          {item.quantity}x {item.menuItem?.name || 'เมนู'}
                        </span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          ฿{(((item.price ?? 0) * item.quantity)).toFixed(2)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">ไม่มีรายการสินค้า</p>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="font-bold text-gray-900 dark:text-white">ยอดรวม:</span>
                    <span className="font-bold text-orange-500">
                      ฿{order.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  {/* Status Update Buttons */}
                  {getNextStatuses(order.status).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {getNextStatuses(order.status).map((nextStatus) => (
                        <button
                          key={nextStatus}
                          onClick={() => updateOrderStatus(order.id, nextStatus)}
                          disabled={updating === order.id}
                          className={getUpdateButtonClass(nextStatus)}
                        >
                          {updating === order.id ? (
                            <span className="flex items-center justify-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              กำลังอัพเดท...
                            </span>
                          ) : (
                            <span>{`เปลี่ยนเป็น "${getStatusText(nextStatus)}"`}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                      ไม่สามารถอัพเดทสถานะเพิ่มเติมได้ (รอไรเดอร์ดำเนินการต่อ)
                    </p>
                  )}
                </div>

                {order.status === 'READY' && (
                  <div className="mt-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-300 dark:border-indigo-700 rounded-lg p-3">
                    <p className="text-sm text-indigo-900 dark:text-indigo-200">
                      ✅ ออเดอร์พร้อมส่งแล้ว รอไรเดอร์มารับ
                    </p>
                  </div>
                )}

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                  สร้างเมื่อ: {new Date(order.createdAt).toLocaleString('th-TH')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RestaurantDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">กำลังโหลด...</p>
        </div>
      </div>
    }>
      <RestaurantDashboardContent />
    </Suspense>
  );
}
