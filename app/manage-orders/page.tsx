'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Clock, CheckCircle, Truck, Package, XCircle, Filter, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  menuItem?: {
    name: string;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  customer: {
    name: string;
    phone: string;
  };
  items: OrderItem[];
  total: number;
  createdAt: string;
}

function ManageOrdersContent() {
  const searchParams = useSearchParams();
  const highlightOrderId = searchParams.get('orderId');
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [highlightedOrder, setHighlightedOrder] = useState<string | null>(highlightOrderId);
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const orderRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, statusFilter]);

  // Scroll to and highlight specific order
  useEffect(() => {
    if (highlightOrderId && orders.length > 0) {
      setTimeout(() => {
        const orderRef = orderRefs.current[highlightOrderId];
        if (orderRef) {
          orderRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setHighlightedOrder(highlightOrderId);
          // Remove highlight after 3 seconds
          setTimeout(() => setHighlightedOrder(null), 3000);
        }
      }, 500);
    }
  }, [highlightOrderId, orders]);

  const fetchOrders = async () => {
    try {
      // Get restaurant owner ID from localStorage
      const ownerId = localStorage.getItem('userId');

      if (!ownerId) {
        console.error('No owner ID found in localStorage');
        setLoading(false);
        return;
      }

      // Fetch orders for this restaurant owner only
      const response = await fetch(`/api/orders?ownerId=${ownerId}`);
      const data = await response.json();

      if (data.success && data.data) {
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

    if (statusFilter === 'active') {
      filtered = filtered.filter(order =>
        ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'PICKED_UP', 'ON_THE_WAY'].includes(order.status)
      );
    } else if (statusFilter === 'completed') {
      filtered = filtered.filter(order => order.status === 'DELIVERED');
    } else if (statusFilter === 'cancelled') {
      filtered = filtered.filter(order => ['CANCELLED', 'REJECTED'].includes(order.status));
    }

    setFilteredOrders(filtered);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);

    try {
      // Get user ID for authorization
      const userId = localStorage.getItem('userId');

      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          userId: userId
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Success toast
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
        toast.innerHTML = '✅ อัพเดทสถานะสำเร็จ! ลูกค้าได้รับการแจ้งเตือนแล้ว';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);

        fetchOrders(); // Refresh orders
      } else {
        console.error('Update failed:', data);
        alert('❌ เกิดข้อผิดพลาด: ' + (data.error || data.message || 'ไม่สามารถอัพเดทสถานะได้'));
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('❌ เกิดข้อผิดพลาดในการอัพเดทสถานะ: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setUpdating(null);
    }
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

  const getNextStatuses = (currentStatus: string): string[] => {
    switch (currentStatus) {
      case 'PENDING':
        return ['ACCEPTED', 'REJECTED'];
      case 'ACCEPTED':
        return ['PREPARING', 'CANCELLED'];
      case 'PREPARING':
        return ['READY', 'CANCELLED'];
      case 'READY':
        return ['PICKED_UP'];
      case 'PICKED_UP':
        return ['ON_THE_WAY'];
      case 'ON_THE_WAY':
        return ['DELIVERED'];
      default:
        return [];
    }
  };

  const activeCount = orders.filter(o =>
    ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'PICKED_UP', 'ON_THE_WAY'].includes(o.status)
  ).length;

  const completedCount = orders.filter(o => o.status === 'DELIVERED').length;
  const cancelledCount = orders.filter(o => ['CANCELLED', 'REJECTED'].includes(o.status)).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                🏪 จัดการออเดอร์
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                ระบบจัดการออเดอร์แบบ Real-time สำหรับร้านอาหาร
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchOrders}
                className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                title="รีเฟรชข้อมูล"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <Link
                href="/food"
                className="p-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                title="กลับหน้าหลัก"
              >
                <Home className="w-5 h-5" />
              </Link>
            </div>
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

        {/* Filter Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">กรองสถานะออเดอร์</h3>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <button
              onClick={() => setStatusFilter('all')}
              className={`p-4 rounded-lg font-medium transition-all ${
                statusFilter === 'all'
                  ? 'bg-blue-500 text-white shadow-lg scale-105'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <div className="text-2xl font-bold">{orders.length}</div>
              <div className="text-sm">ทั้งหมด</div>
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`p-4 rounded-lg font-medium transition-all ${
                statusFilter === 'active'
                  ? 'bg-orange-500 text-white shadow-lg scale-105'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <div className="text-2xl font-bold">{activeCount}</div>
              <div className="text-sm">กำลังดำเนินการ</div>
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
              <div className="text-sm">จัดส่งแล้ว</div>
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
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
            <Package className="w-24 h-24 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              ไม่มีออเดอร์
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {statusFilter === 'active' && 'ไม่มีออเดอร์ที่กำลังดำเนินการ'}
              {statusFilter === 'completed' && 'ยังไม่มีออเดอร์ที่จัดส่งเสร็จ'}
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
                      {order.customer?.name} - {order.customer?.phone}
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
                          ฿{(item.price * item.quantity).toFixed(2)}
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

                {/* Status Update Buttons */}
                {getNextStatuses(order.status).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {getNextStatuses(order.status).map((nextStatus) => (
                      <button
                        key={nextStatus}
                        onClick={() => updateOrderStatus(order.id, nextStatus)}
                        disabled={updating === order.id}
                        className={`px-4 py-2 font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                          nextStatus === 'REJECTED' || nextStatus === 'CANCELLED'
                            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700'
                            : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600'
                        }`}
                      >
                        {updating === order.id ? (
                          <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            กำลังอัพเดท...
                          </span>
                        ) : (
                          `เปลี่ยนเป็น "${getStatusText(nextStatus)}"`
                        )}
                      </button>
                    ))}
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

export default function ManageOrdersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">กำลังโหลด...</p>
        </div>
      </div>
    }>
      <ManageOrdersContent />
    </Suspense>
  );
}
