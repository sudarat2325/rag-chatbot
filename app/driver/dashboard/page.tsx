'use client';

import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { useSocket } from '@/lib/hooks/useSocket';
import { ChatBox } from '@/components/chat/ChatBox';
import { useRoleGuard } from '@/lib/hooks/useRoleGuard';
import {
  Bike,
  MapPin,
  Navigation,
  Phone,
  CheckCircle,
  Clock,
  Package,
  DollarSign,
  LogOut,
  MessageCircle,
} from 'lucide-react';

interface Delivery {
  id: string;
  orderId: string;
  status: string;
  estimatedTime: string;
  pickupLatitude: number | null;
  pickupLongitude: number | null;
  deliveryLatitude: number | null;
  deliveryLongitude: number | null;
  order: {
    orderNumber: string;
    total: number;
    restaurant?: {
      id: string;
      ownerId?: string;
      name: string;
      address: string;
      phone: string;
      latitude?: number | null;
      longitude?: number | null;
    } | null;
    customer?: {
      id: string;
      name: string;
      phone: string;
    } | null;
    address: {
      fullAddress: string;
    };
  };
}

export default function DriverDashboard() {
  const { session, status } = useRoleGuard({ roles: ['DRIVER'] });
  const userId = session?.user?.id;
  const userName = session?.user?.name ?? 'ไรเดอร์';

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-300 animate-pulse">กำลังตรวจสอบสิทธิ์...</p>
      </div>
    );
  }

  if (!userId) {
    return null;
  }
  const [availableDeliveries, setAvailableDeliveries] = useState<Delivery[]>([]);
  const [currentDelivery, setCurrentDelivery] = useState<Delivery | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showRestaurantChat, setShowRestaurantChat] = useState(false);
  const [showCustomerChat, setShowCustomerChat] = useState(false);
  const [todayStats, setTodayStats] = useState({ deliveries: 0, earnings: 0 });
  const [acceptingDeliveryId, setAcceptingDeliveryId] = useState<string | null>(null);

  const { joinOrder, leaveOrder, joinDelivery, leaveDelivery } = useSocket(userId);

  const calculateDistanceKm = (
    targetLat?: number | null,
    targetLng?: number | null
  ): number | null => {
    if (!location || targetLat == null || targetLng == null) {
      return null;
    }
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(targetLat - location.latitude);
    const dLon = toRad(targetLng - location.longitude);
    const lat1 = toRad(location.latitude);
    const lat2 = toRad(targetLat);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10; // one decimal place
  };

  const getDistanceLabel = (delivery: Delivery) => {
    const pickupLat =
      delivery.pickupLatitude ?? delivery.order.restaurant?.latitude ?? null;
    const pickupLng =
      delivery.pickupLongitude ?? delivery.order.restaurant?.longitude ?? null;
    const distance = calculateDistanceKm(pickupLat, pickupLng);

    if (distance === null) {
      return location ? 'ไม่พบพิกัดร้าน' : 'รอจับตำแหน่งไรเดอร์...';
    }
    return `${distance} กม.`;
  };

  useEffect(() => {
    if (userId) {
      initializeDriver(userId);
    }
  }, [userId]);

  // Fetch deliveries when online status changes
  useEffect(() => {
    if (!userId) return;
    fetchDeliveries();
    fetchTodayStats();
  }, [userId, isOnline]);

  useEffect(() => {
    if (!userId || !isOnline) {
      return;
    }

    // Auto refresh every 5 seconds to detect order status changes
    const interval = setInterval(() => {
      fetchDeliveries();
    }, 5000);

    return () => clearInterval(interval);
  }, [userId, isOnline]);

  // Socket.IO: Join order and delivery rooms for real-time chat
  useEffect(() => {
    if (!currentDelivery?.orderId) return;

    // Join order room for chat messages
    joinOrder(currentDelivery.orderId);

    // Join delivery room for location tracking
    joinDelivery(currentDelivery.orderId);

    console.warn('🔵 Driver joined rooms:', {
      orderId: currentDelivery.orderId,
      orderRoom: `order-${currentDelivery.orderId}`,
      deliveryRoom: `delivery-${currentDelivery.orderId}`,
    });

    return () => {
      leaveOrder(currentDelivery.orderId);
      leaveDelivery(currentDelivery.orderId);
      console.warn('🔴 Driver left rooms:', currentDelivery.orderId);
    };
  }, [currentDelivery?.orderId, joinOrder, leaveOrder, joinDelivery, leaveDelivery]);

  // Get current location
  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });

          // Update location to server if on delivery
          if (currentDelivery && isOnline) {
            updateLocationToServer(currentDelivery.id, {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    }
  }, [currentDelivery, isOnline]);

  const initializeDriver = async (driverId: string) => {
    let determinedOnline: boolean | null = null;
    try {
      const profileResponse = await fetch(`/api/drivers/${driverId}`);
      const profileData = await profileResponse.json();

      if (profileData.success) {
        // Check if driver profile exists
        if (!profileData.data?.driverProfile) {
          // Create driver profile automatically
          console.warn('Driver profile not found, creating...');
          const createResponse = await fetch(`/api/drivers/${driverId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              isOnline: false,
              isAvailable: true,
              vehicleType: 'Motorcycle',
            }),
          });

          const createData = await createResponse.json();
          if (createData.success) {
            console.warn('Driver profile created successfully');
            determinedOnline = false;
          }
        } else {
          determinedOnline = profileData.data.driverProfile.isOnline ?? false;
        }

        setIsOnline(determinedOnline ?? false);
        if (determinedOnline) {
          localStorage.setItem('driverOnlineStatus', 'true');
        } else {
          localStorage.removeItem('driverOnlineStatus');
        }
      }
    } catch (error) {
      console.error('Error loading driver profile:', error);
    } finally {
      const fallbackOnline =
        determinedOnline ?? (localStorage.getItem('driverOnlineStatus') === 'true');
      fetchDeliveries(fallbackOnline);
    }
  };

  const fetchDeliveries = async (onlineOverride?: boolean) => {
    if (!userId) return;

    try {
      // Fetch current delivery (assigned to this driver)
      const currentResponse = await fetch(`/api/deliveries?driverId=${userId}&status=DRIVER_ASSIGNED,DRIVER_ARRIVED,PICKED_UP,ON_THE_WAY`);
      const currentData = await currentResponse.json();

      if (currentData.success && currentData.data && currentData.data.length > 0) {
        // Driver has active delivery
        setCurrentDelivery(currentData.data[0]);
        setAvailableDeliveries([]);
      } else {
        // No active delivery, fetch available ones
        setCurrentDelivery(null);

        const shouldFetchAvailable = onlineOverride ?? isOnline;

        if (shouldFetchAvailable) {
          const availableResponse = await fetch('/api/deliveries');
          const availableData = await availableResponse.json();

          if (availableData.success) {
            setAvailableDeliveries(availableData.data || []);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    } finally {
      // no-op
    }
  };

  const fetchTodayStats = async () => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/deliveries?driverId=${userId}&status=DELIVERED`);
      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const deliveredToday = data.data.filter((delivery: Delivery & { deliveredAt?: string | null }) => {
          const deliveredAt = delivery.deliveredAt ? new Date(delivery.deliveredAt) : null;
          return deliveredAt && deliveredAt >= today;
        });

        const earnings = deliveredToday.reduce((total: number, delivery: Delivery & { deliveredAt?: string | null }) => {
          return total + (delivery.order?.total ?? 0);
        }, 0);

        setTodayStats({
          deliveries: deliveredToday.length,
          earnings,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const updateLocationToServer = async (
    deliveryId: string,
    coords: { latitude: number; longitude: number }
  ) => {
    try {
      await fetch(`/api/deliveries/${deliveryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: coords.latitude,
          longitude: coords.longitude,
        }),
      });
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const updateDeliveryStatus = async (deliveryId: string, status: string) => {
    try {
      const response = await fetch(`/api/deliveries/${deliveryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setCurrentDelivery(prev => prev ? { ...prev, status } : null);

        // If delivered or failed, clear current delivery and fetch new ones
        if (status === 'DELIVERED' || status === 'FAILED') {
          setCurrentDelivery(null);
          fetchDeliveries();
          fetchTodayStats();
        }
        fetchTodayStats();

        // Show success message
        const message = document.createElement('div');
        message.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
        message.textContent = '✅ อัพเดทสถานะสำเร็จ';
        document.body.appendChild(message);
        setTimeout(() => message.remove(), 3000);
      }
    } catch (error) {
      console.error('Error updating delivery status:', error);
      alert('❌ เกิดข้อผิดพลาด: ไม่สามารถอัพเดทสถานะได้');
    }
  };

  const acceptDelivery = async (deliveryId: string) => {
    try {
      // Set loading state to prevent double-click
      setAcceptingDeliveryId(deliveryId);

      if (!userId) {
        setAcceptingDeliveryId(null);
        return;
      }

      const response = await fetch('/api/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryId,
          driverId: userId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCurrentDelivery(data.data);
        setAvailableDeliveries([]);

        // Show success message
        const message = document.createElement('div');
        message.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
        message.textContent = '✅ รับงานสำเร็จ!';
        document.body.appendChild(message);
        setTimeout(() => message.remove(), 3000);
      } else {
        // Show error and refresh deliveries list
        alert('❌ ไม่สามารถรับงานได้\n\n' + (data.error || 'กรุณาลองใหม่อีกครั้ง'));

        // Refresh deliveries list to remove outdated orders
        fetchDeliveries();
      }
    } catch (error) {
      console.error('Error accepting delivery:', error);
      alert('❌ เกิดข้อผิดพลาด');
    } finally {
      // Clear loading state
      setAcceptingDeliveryId(null);
    }
  };

  const toggleOnlineStatus = async () => {
    try {
      if (!userId) return;

      const newStatus = !isOnline;

      const response = await fetch(`/api/drivers/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOnline: newStatus, isAvailable: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        setIsOnline(newStatus);
        if (newStatus) {
          localStorage.setItem('driverOnlineStatus', 'true');
        } else {
          localStorage.removeItem('driverOnlineStatus');
        }

        if (newStatus) {
          // Going online - fetch available deliveries
          fetchDeliveries(true);
        } else {
          // Going offline - clear deliveries
          setAvailableDeliveries([]);
        }
      }
    } catch (error) {
      console.error('Error toggling online status:', error);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-green-50 dark:bg-gray-900">
      {/* Dynamic Header with Status */}
      <div className={`relative overflow-hidden transition-all ${
        isOnline
          ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-cyan-500'
          : 'bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800'
      }`}>
        {/* Animated waves effect */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-pulse"></div>
        </div>

        <div className="relative container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl shadow-2xl ${
                isOnline ? 'bg-white/20 backdrop-blur-sm' : 'bg-white/10'
              }`}>
                <Bike className="w-12 h-12 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg flex items-center gap-3">
                  🏍️ แอปไรเดอร์
                  {isOnline && (
                    <span className="relative flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
                    </span>
                  )}
                </h1>
                <p className="text-lg text-white/90 font-medium">
                  {userName && userName !== 'ไรเดอร์' ? `คุณ${userName}` : 'จัดการการจัดส่งของคุณ'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {/* Large Online Toggle Button */}
              <button
                onClick={toggleOnlineStatus}
                className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-2xl hover:scale-105 ${
                  isOnline
                    ? 'bg-white text-green-600 hover:bg-green-50'
                    : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border-2 border-white/30'
                }`}
              >
                {isOnline ? '🟢 ออนไลน์' : '⚫ ออฟไลน์'}
              </button>

              {/* Logout Button */}
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
      </div>

      {showRestaurantChat && userId && currentDelivery?.order.restaurant?.ownerId && currentDelivery.order.restaurant?.name && (
        <ChatBox
          orderId={currentDelivery.orderId}
          userId={userId}
          userName={userName}
          recipientId={currentDelivery.order.restaurant.ownerId}
          recipientName={currentDelivery.order.restaurant.name}
          recipientImage={(currentDelivery.order.restaurant as typeof currentDelivery.order.restaurant & { logo?: string | null }).logo || undefined}
          recipientType="restaurant"
          position="left"
          onClose={() => setShowRestaurantChat(false)}
        />
      )}

      {showCustomerChat && userId && currentDelivery?.order.customer?.id && (
        <ChatBox
          orderId={currentDelivery.orderId}
          userId={userId}
          userName={userName}
          recipientId={currentDelivery.order.customer.id}
          recipientName={currentDelivery.order.customer.name ?? 'ลูกค้า'}
          recipientType="customer"
          position="right"
          onClose={() => setShowCustomerChat(false)}
        />
      )}

        <div className="container mx-auto px-4 py-6">
          {/* Current Delivery */}
          {currentDelivery ? (
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                การจัดส่งปัจจุบัน
              </h2>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                {/* Order Info */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      ออเดอร์ #{currentDelivery.order.orderNumber}
                    </h3>
                    <span className="text-2xl font-bold text-green-500">
                      ฿{currentDelivery.order.total.toFixed(2)}
                    </span>
                  </div>

                  {/* Pickup Location */}
                  <div className="mb-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Package className="w-5 h-5 text-orange-500 mt-1" />
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white mb-1">
                          รับอาหารที่ร้าน
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white font-medium">
                          {currentDelivery.order.restaurant?.name ?? 'ไม่ทราบชื่อร้าน'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {currentDelivery.order.restaurant?.address ?? 'ไม่มีที่อยู่ร้าน'}
                        </p>
                        {currentDelivery.order.restaurant?.phone ? (
                          <a
                            href={`tel:${currentDelivery.order.restaurant.phone}`}
                            className="text-sm text-orange-500 hover:text-orange-600 flex items-center gap-1 mt-2"
                          >
                            <Phone className="w-4 h-4" />
                            {currentDelivery.order.restaurant.phone}
                          </a>
                        ) : (
                          <p className="text-sm text-gray-500 mt-2">ไม่มีเบอร์ร้าน</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Delivery Location */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-blue-500 mt-1" />
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white mb-1">
                          ส่งถึงลูกค้า
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white font-medium">
                          {currentDelivery.order.customer?.name ?? 'ลูกค้าไม่ระบุชื่อ'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {currentDelivery.order.address.fullAddress}
                        </p>
                        {currentDelivery.order.customer?.phone ? (
                          <a
                            href={`tel:${currentDelivery.order.customer.phone}`}
                            className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1 mt-2"
                          >
                            <Phone className="w-4 h-4" />
                            {currentDelivery.order.customer.phone}
                          </a>
                        ) : (
                          <p className="text-sm text-gray-500 mt-2">ไม่มีเบอร์ลูกค้า</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation Button */}
                <button
                  onClick={() => {
                    const lat = currentDelivery.deliveryLatitude;
                    const lng = currentDelivery.deliveryLongitude;
                    window.open(
                      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
                      '_blank'
                    );
                  }}
                  className="w-full mb-4 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all flex items-center justify-center gap-2 font-semibold"
                >
                  <Navigation className="w-5 h-5" />
                  นำทางด้วย Google Maps
                </button>

                {/* Chat Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <button
                    onClick={() => setShowRestaurantChat(true)}
                    disabled={!currentDelivery.order.restaurant?.ownerId}
                    className={`px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
                      currentDelivery.order.restaurant?.ownerId
                        ? 'bg-orange-500 text-white hover:bg-orange-600'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <MessageCircle className="w-5 h-5" />
                    แชตกับร้าน
                  </button>
                  <button
                    onClick={() => setShowCustomerChat(true)}
                    disabled={!currentDelivery.order.customer?.id}
                    className={`px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
                      currentDelivery.order.customer?.id
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <MessageCircle className="w-5 h-5" />
                    แชตกับลูกค้า
                  </button>
                </div>

                {/* Status Actions */}
                <div className="space-y-2">
                  {currentDelivery.status === 'DRIVER_ASSIGNED' && (
                    <button
                      onClick={() => updateDeliveryStatus(currentDelivery.id, 'DRIVER_ARRIVED')}
                      className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold"
                    >
                      ถึงร้านแล้ว
                    </button>
                  )}

                  {currentDelivery.status === 'DRIVER_ARRIVED' && (
                    <button
                      onClick={() => updateDeliveryStatus(currentDelivery.id, 'PICKED_UP')}
                      className="w-full px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-semibold"
                    >
                      รับอาหารแล้ว
                    </button>
                  )}

                  {currentDelivery.status === 'PICKED_UP' && (
                    <button
                      onClick={() => updateDeliveryStatus(currentDelivery.id, 'ON_THE_WAY')}
                      className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
                    >
                      กำลังเดินทางไปส่ง
                    </button>
                  )}

                  {currentDelivery.status === 'ON_THE_WAY' && (
                    <button
                      onClick={() => updateDeliveryStatus(currentDelivery.id, 'DELIVERED')}
                      className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2 font-semibold"
                    >
                      <CheckCircle className="w-5 h-5" />
                      ส่งสำเร็จแล้ว
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* No Current Delivery - Show Available Orders */
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                ออเดอร์ที่พร้อมรับ
              </h2>

              {!isOnline ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
                  <Bike className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    คุณออฟไลน์อยู่
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    เปิดสถานะออนไลน์เพื่อรับออเดอร์ใหม่
                  </p>
                  <button
                    onClick={toggleOnlineStatus}
                    className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold"
                  >
                    เปิดรับงาน
                  </button>
                </div>
              ) : availableDeliveries.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
                  <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    ไม่มีออเดอร์ใหม่
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    รอออเดอร์ใหม่... คุณจะได้รับการแจ้งเตือนเมื่อมีงานเข้ามา
                  </p>
                  <div className="mt-6 flex items-center justify-center gap-2 text-green-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">กำลังรอออเดอร์...</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {availableDeliveries.map((delivery) => {
                    const distanceLabel = getDistanceLabel(delivery);
                    return (
                      <div
                        key={delivery.id}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">
                              #{delivery.order.orderNumber}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {delivery.order.restaurant?.name ?? 'ไม่ทราบชื่อร้าน'}
                            </p>
                          </div>
                          <span className="text-xl font-bold text-green-500">
                            ฿{delivery.order.total.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-cyan-600 dark:text-cyan-300 mb-3">
                          ระยะทางประมาณ: {distanceLabel}
                        </p>

                        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <p>รับที่: {delivery.order.restaurant?.address ?? 'ไม่มีที่อยู่ร้าน'}</p>
                          <p>ส่งที่: {delivery.order.address.fullAddress}</p>
                        </div>

                        <button
                          onClick={() => acceptDelivery(delivery.id)}
                          disabled={acceptingDeliveryId === delivery.id}
                          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {acceptingDeliveryId === delivery.id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              กำลังรับงาน...
                            </>
                          ) : (
                            'รับงาน'
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Today's Summary */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Package className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">ส่งวันนี้</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {todayStats.deliveries}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">รายได้วันนี้</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ฿{todayStats.earnings.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Location Status */}
          {location && (
            <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>
                  GPS เปิดอยู่ • ตำแหน่งปัจจุบัน: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
  );
}
