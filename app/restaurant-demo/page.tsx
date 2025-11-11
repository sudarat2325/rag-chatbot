'use client';

import { useState, useEffect } from 'react';
import { Clock, CheckCircle, Truck, Package, XCircle } from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  customer: {
    name: string;
    phone: string;
  };
  items: {
    menuItem: { name: string };
    quantity: number;
    price?: number;
  }[];
  total: number;
  createdAt: string;
}

export default function RestaurantDemoPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
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

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ อัพเดทสถานะสำเร็จ! ระบบจะส่งการแจ้งเตือนแบบ real-time ไปยังลูกค้า');
        fetchOrders(); // Refresh orders
      } else {
        alert('❌ เกิดข้อผิดพลาด: ' + (data.error || 'ไม่สามารถอัพเดทสถานะได้'));
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('❌ เกิดข้อผิดพลาดในการอัพเดทสถานะ');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'PREPARING':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'READY':
        return 'bg-indigo-100 text-indigo-700 border-indigo-300';
      case 'PICKED_UP':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'DELIVERED':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'CANCELLED':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-5 h-5" />;
      case 'CONFIRMED':
        return <CheckCircle className="w-5 h-5" />;
      case 'PREPARING':
        return <Package className="w-5 h-5" />;
      case 'READY':
        return <CheckCircle className="w-5 h-5" />;
      case 'PICKED_UP':
        return <Truck className="w-5 h-5" />;
      case 'DELIVERED':
        return <CheckCircle className="w-5 h-5" />;
      case 'CANCELLED':
        return <XCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      PENDING: 'รอยืนยัน',
      CONFIRMED: 'ยืนยันแล้ว',
      PREPARING: 'กำลังเตรียม',
      READY: 'พร้อมส่ง',
      PICKED_UP: 'ไรเดอร์รับแล้ว',
      DELIVERED: 'จัดส่งแล้ว',
      CANCELLED: 'ยกเลิก',
    };
    return statusMap[status] || status;
  };

  const getNextStatuses = (currentStatus: string): string[] => {
    switch (currentStatus) {
      case 'PENDING':
        return ['CONFIRMED', 'CANCELLED'];
      case 'CONFIRMED':
        return ['PREPARING', 'CANCELLED'];
      case 'PREPARING':
        return ['READY', 'CANCELLED'];
      case 'READY':
        return ['PICKED_UP'];
      case 'PICKED_UP':
        return ['DELIVERED'];
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🏪 Restaurant Demo - จัดการออเดอร์
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            หน้านี้สำหรับร้านอาหารในการอัพเดทสถานะออเดอร์แบบ Real-time
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-lg p-4 mb-6">
          <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2">
            💡 วิธีใช้งาน:
          </h3>
          <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal ml-5">
            <li>เลือกออเดอร์ที่ต้องการอัพเดทสถานะ</li>
            <li>กดปุ่ม "เปลี่ยนเป็น..." เพื่ออัพเดทสถานะใหม่</li>
            <li>ระบบจะส่งการแจ้งเตือนแบบ Real-time ไปยังลูกค้าผ่าน Socket.IO</li>
            <li>ลูกค้าสามารถเห็นการอัพเดททันทีในหน้า Order Tracking</li>
          </ol>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
            <Package className="w-24 h-24 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              ไม่มีออเดอร์
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              ยังไม่มีออเดอร์ในระบบ กรุณาสั่งอาหารก่อน
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
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

                {/* Status Update Buttons */}
                <div className="flex flex-wrap gap-2">
                  {getNextStatuses(order.status).map((nextStatus) => (
                    <button
                      key={nextStatus}
                      onClick={() => updateOrderStatus(order.id, nextStatus)}
                      disabled={updating === order.id}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
