'use client';

import { use, useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useSocket } from '@/lib/hooks/useSocket';
import { DeliveryMap } from '@/components/map/DeliveryMap';
import { ChatBox } from '@/components/chat/ChatBox';
import { ReviewForm } from '@/components/review/ReviewForm';
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  Phone,
  User,
  ChefHat,
  Bike,
  MessageCircle,
  Star,
} from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  createdAt: string;
  customerId: string;
  restaurant: {
    id?: string;
    name: string;
    phone: string;
    ownerId?: string;
    latitude: number;
    longitude: number;
  };
  address: {
    fullAddress: string;
    latitude: number;
    longitude: number;
  };
  items: Array<{
    menuItem: {
      name: string;
    };
    quantity: number;
    price: number;
  }>;
  delivery?: {
    currentLatitude?: number;
    currentLongitude?: number;
    driver?: {
      id?: string;
      name: string;
      phone: string;
    };
  };
}

interface OrderUpdateEvent {
  orderId: string;
  status: string;
}

interface DeliveryUpdateEvent {
  orderId: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface ReviewPayload {
  orderId: string;
  customerId: string;
  restaurantId: string;
  foodRating: number;
  deliveryRating: number;
  comment?: string;
  images?: string[];
}

const statusConfig = {
  PENDING: { label: 'รอยืนยัน', icon: Clock, color: 'text-yellow-500', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20' },
  ACCEPTED: { label: 'รับออเดอร์แล้ว', icon: CheckCircle, color: 'text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
  PREPARING: { label: 'กำลังเตรียม', icon: ChefHat, color: 'text-orange-500', bgColor: 'bg-orange-50 dark:bg-orange-900/20' },
  READY: { label: 'พร้อมส่ง', icon: Package, color: 'text-purple-500', bgColor: 'bg-purple-50 dark:bg-purple-900/20' },
  PICKED_UP: { label: 'รับของแล้ว', icon: Bike, color: 'text-indigo-500', bgColor: 'bg-indigo-50 dark:bg-indigo-900/20' },
  ON_THE_WAY: { label: 'กำลังจัดส่ง', icon: Bike, color: 'text-cyan-500', bgColor: 'bg-cyan-50 dark:bg-cyan-900/20' },
  DELIVERED: { label: 'จัดส่งสำเร็จ', icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-50 dark:bg-green-900/20' },
  CANCELLED: { label: 'ยกเลิก', icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-50 dark:bg-red-900/20' },
  REJECTED: { label: 'ปฏิเสธ', icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-50 dark:bg-red-900/20' },
};

export default function OrderTrackingPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | undefined>();
  const [userName, setUserName] = useState<string>('Customer');
  const [driverLocation, setDriverLocation] = useState<{latitude: number; longitude: number} | undefined>();
  const [showRestaurantChat, setShowRestaurantChat] = useState(false);
  const [showDriverChat, setShowDriverChat] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [hasReview, setHasReview] = useState(false);

  const { joinOrder, leaveOrder, joinDelivery, leaveDelivery, on, off } = useSocket(userId);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedUserName = localStorage.getItem('userName');
    if (storedUserId) {
      setUserId(storedUserId);
    }
    if (storedUserName) {
      setUserName(storedUserName);
    }
    fetchOrder();
  }, [orderId]);

  // Join order room for real-time updates
  useEffect(() => {
    if (orderId) {
      joinOrder(orderId);
      joinDelivery(orderId);

      // Listen for order status updates
      const handleOrderUpdate = (data: OrderUpdateEvent) => {
        console.warn('📦 Order updated:', data);
        if (data.orderId === orderId) {
          setOrder(prev => prev ? { ...prev, status: data.status } : null);
        }
      };

      // Listen for delivery location updates
      const handleDeliveryUpdate = (data: DeliveryUpdateEvent) => {
        console.warn('🚚 Delivery location updated:', data);
        if (data.orderId === orderId && data.location) {
          const location = data.location;
          setDriverLocation(location);
          // Also update order delivery data
          setOrder(prev => prev ? {
            ...prev,
            delivery: {
              ...prev.delivery,
              currentLatitude: location.latitude,
              currentLongitude: location.longitude,
            }
          } : null);
        }
      };

      on('order-status-update', handleOrderUpdate);
      on('delivery-location-update', handleDeliveryUpdate);

      return () => {
        leaveOrder(orderId);
        leaveDelivery(orderId);
        off('order-status-update', handleOrderUpdate);
        off('delivery-location-update', handleDeliveryUpdate);
      };
    }
  }, [orderId, joinOrder, leaveOrder, joinDelivery, leaveDelivery, on, off]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const storedUserId = localStorage.getItem('userId');
      const response = await fetch(`/api/orders/${orderId}?userId=${storedUserId || ''}`);
      const data = await response.json();

      if (data.success && data.data) {
        setOrder(data.data);
        // Check if order has review
        checkForReview(orderId);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkForReview = async (orderId: string) => {
    try {
      const response = await fetch(`/api/reviews?orderId=${orderId}`);
      const data = await response.json();
      if (data.success && data.data.length > 0) {
        setHasReview(true);
      }
    } catch (error) {
      console.error('Error checking review:', error);
    }
  };

  const handleReviewSubmit = async (reviewData: ReviewPayload) => {
    const payload = reviewData;
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        alert('ส่งรีวิวสำเร็จ!');
        setShowReviewForm(false);
        setHasReview(true);
      } else {
        alert(data.error || 'เกิดข้อผิดพลาดในการส่งรีวิว');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
    }
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

  if (!order) {
    return (
      <MainLayout userId={userId}>
        <div className="container mx-auto px-4 py-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">ไม่พบออเดอร์</h1>
          <p className="text-gray-600 dark:text-gray-400">ไม่พบข้อมูลออเดอร์นี้ในระบบ</p>
        </div>
      </MainLayout>
    );
  }

  const statusInfo = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.PENDING;
  const StatusIcon = statusInfo.icon;

  const statusSteps = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'PICKED_UP', 'DELIVERED'];
  const currentStepIndex = statusSteps.indexOf(order.status);

  return (
    <MainLayout userId={userId}>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Order Header */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  ออเดอร์ #{order.orderNumber}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(order.createdAt).toLocaleString('th-TH')}
                </p>
              </div>

              <div className={`${statusInfo.bgColor} ${statusInfo.color} px-4 py-2 rounded-full flex items-center gap-2`}>
                <StatusIcon className="w-5 h-5" />
                <span className="font-semibold">{statusInfo.label}</span>
              </div>
            </div>

            {/* Progress Bar */}
            {!['CANCELLED', 'REJECTED'].includes(order.status) && (
              <div className="mt-6">
                <div className="flex justify-between items-center">
                  {statusSteps.map((step, index) => {
                    const stepConfig = statusConfig[step as keyof typeof statusConfig];
                    const StepIcon = stepConfig.icon;
                    const isCompleted = index <= currentStepIndex;
                    const isCurrent = index === currentStepIndex;

                    return (
                      <div key={step} className="flex-1 relative">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              isCompleted
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                            } ${isCurrent ? 'ring-4 ring-orange-200 dark:ring-orange-800' : ''}`}
                          >
                            <StepIcon className="w-5 h-5" />
                          </div>
                          <span className={`text-xs mt-2 text-center ${isCompleted ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-500'}`}>
                            {stepConfig.label}
                          </span>
                        </div>

                        {index < statusSteps.length - 1 && (
                          <div
                            className={`absolute top-5 left-1/2 w-full h-0.5 ${
                              index < currentStepIndex ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-700'
                            }`}
                            style={{ zIndex: -1 }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Restaurant & Delivery Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Restaurant */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-orange-500" />
                ร้านอาหาร
              </h2>
              <p className="text-gray-900 dark:text-white font-medium mb-2">{order.restaurant.name}</p>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                <Phone className="w-4 h-4" />
                <a href={`tel:${order.restaurant.phone}`} className="hover:text-orange-500">
                  {order.restaurant.phone}
                </a>
              </div>
              <button
                onClick={() => setShowRestaurantChat(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                แชทกับร้าน
              </button>
            </div>

            {/* Delivery Address */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-500" />
                ที่อยู่จัดส่ง
              </h2>
              <p className="text-gray-700 dark:text-gray-300 text-sm">{order.address.fullAddress}</p>
            </div>
          </div>

          {/* Driver Info (if assigned) */}
          {order.delivery?.driver && (
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-lg p-6 mb-6 text-white">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Bike className="w-5 h-5" />
                ข้อมูลคนขับ
              </h2>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-medium">{order.delivery.driver.name}</p>
                    <p className="text-sm opacity-90">{order.delivery.driver.phone}</p>
                  </div>
                </div>
                <a
                  href={`tel:${order.delivery.driver.phone}`}
                  className="px-4 py-2 bg-white text-orange-500 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
                >
                  โทรหา
                </a>
              </div>
              <button
                onClick={() => setShowDriverChat(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors border border-white/30"
              >
                <MessageCircle className="w-4 h-4" />
                แชทกับคนขับ
              </button>
            </div>
          )}

          {/* Delivery Map */}
          {order.restaurant.latitude && order.address.latitude && (
            <div className="mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4">แผนที่ติดตามการจัดส่ง</h2>
                <div className="h-96 rounded-lg overflow-hidden">
                  <DeliveryMap
                    restaurantLocation={{
                      latitude: order.restaurant.latitude,
                      longitude: order.restaurant.longitude,
                    }}
                    deliveryLocation={{
                      latitude: order.address.latitude,
                      longitude: order.address.longitude,
                    }}
                    driverLocation={driverLocation || (order.delivery?.currentLatitude && order.delivery?.currentLongitude ? {
                      latitude: order.delivery.currentLatitude,
                      longitude: order.delivery.currentLongitude,
                    } : undefined)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Order Items */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">รายการอาหาร</h2>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600 dark:text-gray-400">{item.quantity}x</span>
                    <span className="text-gray-900 dark:text-white">{item.menuItem.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ฿{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">ราคาอาหาร</span>
                <span className="text-gray-900 dark:text-white">฿{order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">ค่าจัดส่ง</span>
                <span className="text-gray-900 dark:text-white">฿{order.deliveryFee.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">ส่วนลด</span>
                  <span className="text-green-600 dark:text-green-400">-฿{order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-gray-900 dark:text-white">ยอดรวม</span>
                <span className="text-orange-500">฿{order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Real-time Status Indicator */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 text-center border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-center gap-2 text-sm text-blue-700 dark:text-blue-300">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>กำลังอัพเดทสถานะแบบเรียลไทม์</span>
            </div>
          </div>

          {/* Restaurant Management Button - Only for restaurant owners */}
          {!['DELIVERED', 'CANCELLED', 'REJECTED'].includes(order.status) &&
           userId &&
           order.restaurant.ownerId === userId && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mt-6">
              <div className="text-center">
                <Package className="w-12 h-12 text-orange-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  อัพเดทสถานะออเดอร์
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  สำหรับร้านอาหาร: คลิกเพื่อไปยังหน้าจัดการและอัพเดทสถานะออเดอร์
                </p>
                <a
                  href={`/manage-orders?orderId=${orderId}`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all shadow-md hover:shadow-lg"
                >
                  <ChefHat className="w-5 h-5" />
                  ไปหน้าจัดการออเดอร์
                </a>
              </div>
            </div>
          )}

          {/* Review Section */}
          {order.status === 'DELIVERED' && !hasReview && !showReviewForm && userId && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mt-6">
              <div className="text-center">
                <Star className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  ประสบการณ์เป็นอย่างไรบ้าง?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  แบ่งปันความคิดเห็นของคุณเพื่อช่วยคนอื่น
                </p>
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  เขียนรีวิว
                </button>
              </div>
            </div>
          )}

          {showReviewForm && userId && order.restaurant.id && (
            <div className="mt-6">
              <ReviewForm
                restaurantId={order.restaurant.id}
                orderId={orderId}
                customerId={userId}
                onSubmit={handleReviewSubmit}
                onCancel={() => setShowReviewForm(false)}
              />
            </div>
          )}

          {hasReview && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 mt-6 text-center border border-green-200 dark:border-green-800">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-green-700 dark:text-green-300 font-medium">
                ขอบคุณสำหรับรีวิวของคุณ!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Boxes */}
      {showRestaurantChat && userId && (
        <ChatBox
          orderId={orderId}
          userId={userId}
          userName={userName}
          recipientId={order.restaurant.id || 'restaurant-1'}
          recipientName={order.restaurant.name}
          recipientType="restaurant"
          onClose={() => setShowRestaurantChat(false)}
        />
      )}

      {showDriverChat && userId && order.delivery?.driver && (
        <ChatBox
          orderId={orderId}
          userId={userId}
          userName={userName}
          recipientId={order.delivery.driver.id || 'driver-1'}
          recipientName={order.delivery.driver.name}
          recipientType="driver"
          onClose={() => setShowDriverChat(false)}
        />
      )}
    </MainLayout>
  );
}
