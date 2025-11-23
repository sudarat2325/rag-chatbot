'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  MapPin,
  CreditCard,
  Wallet,
  Smartphone,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import type { DiscountCalculation } from '@/lib/services/promotionService';

interface UserAddress {
  id: string;
  label: string;
  fullAddress: string;
  district?: string;
  province?: string;
  postalCode?: string;
  isDefault?: boolean;
}

interface CartItem {
  id: string;
  menuItemId?: string;
  name: string;
  quantity: number;
  price: number;
  restaurantId?: string;
  image?: string;
}

interface RestaurantSummary {
  id: string;
  name: string;
  deliveryFee?: number;
  minimumOrder?: number;
  estimatedTime?: string;
}

interface NewAddressInput {
  label: string;
  fullAddress: string;
  district: string;
  province: string;
  postalCode: string;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const restaurantId = searchParams.get('restaurantId');
  const { session, status } = useRoleGuard();
  const userId = session?.user?.id;
  const [loading, setLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [addressData, setAddressData] = useState<UserAddress | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState('CASH');
  const [promoCode, setPromoCode] = useState('');
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<DiscountCalculation | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [restaurant, setRestaurant] = useState<RestaurantSummary | null>(null);
  const [newAddress, setNewAddress] = useState<NewAddressInput>({
    label: '',
    fullAddress: '',
    district: '',
    province: '',
    postalCode: '',
  });

  useEffect(() => {
    if (status === 'loading') return;

    if (!userId) {
      alert('กรุณาเข้าสู่ระบบก่อนทำการสั่งอาหาร');
      router.push('/login');
      return;
    }

    fetchUserAddress(userId);

    if (restaurantId) {
      fetchRestaurant();
    }
  }, [router, restaurantId, userId, status]);

  const fetchRestaurant = async () => {
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}`);
      const data = await response.json();
      if (data.success && data.data) {
        const summary: RestaurantSummary = {
          id: data.data.id,
          name: data.data.name,
          deliveryFee: data.data.deliveryFee,
          minimumOrder: data.data.minimumOrder,
          estimatedTime: data.data.estimatedTime,
        };
        setRestaurant(summary);
        setDeliveryFee(data.data.deliveryFee || 30);
      }
    } catch (error) {
      console.error('Error fetching restaurant:', error);
    }
  };

  const fetchUserAddress = async (uid: string) => {
    setLoadingAddress(true);
    try {
      const response = await fetch(`/api/addresses?userId=${uid}`);
      const data = await response.json();

      if (data.success && data.data && data.data.length > 0) {
        const addresses = data.data as UserAddress[];
        const defaultAddress = addresses.find((addr) => addr.isDefault) || addresses[0];
        setSelectedAddress(defaultAddress.id);
        setAddressData(defaultAddress);
      } else {
        // If no address found, create a default one
        console.warn('No address found, creating default address...');
        await createDefaultAddress(uid);
      }
    } catch (error) {
      console.error('Error fetching address:', error);
    } finally {
      setLoadingAddress(false);
    }
  };

  const createDefaultAddress = async (uid: string) => {
    try {
      const response = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: uid,
          label: 'บ้าน',
          fullAddress: '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110',
          latitude: 13.7563,
          longitude: 100.5018,
          district: 'คลองเตย',
          province: 'กรุงเทพมหานคร',
          postalCode: '10110',
          isDefault: true,
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        const address: UserAddress = data.data;
        setSelectedAddress(address.id);
        setAddressData(address);
      }
    } catch (error) {
      console.error('Error creating default address:', error);
    }
  };

  const handleAddAddress = async () => {
    if (!userId || !newAddress.label || !newAddress.fullAddress) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    try {
      const response = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          label: newAddress.label,
          fullAddress: newAddress.fullAddress,
          latitude: 13.7563, // Default coordinates
          longitude: 100.5018,
          district: newAddress.district,
          province: newAddress.province,
          postalCode: newAddress.postalCode,
          isDefault: !addressData, // Set as default if no other address exists
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        setSelectedAddress(data.data.id);
        setAddressData(data.data);
        setShowAddressModal(false);
        setNewAddress({
          label: '',
          fullAddress: '',
          district: '',
          province: '',
          postalCode: '',
        });
        alert('เพิ่มที่อยู่สำเร็จ!');
      } else {
        alert('เกิดข้อผิดพลาด: ' + (data.error || 'ไม่สามารถเพิ่มที่อยู่ได้'));
      }
    } catch (error) {
      console.error('Error adding address:', error);
      alert('เกิดข้อผิดพลาดในการเพิ่มที่อยู่');
    }
  };

  const paymentMethods = [
    { id: 'CASH', name: 'เงินสด', icon: Wallet, color: 'text-green-500' },
    { id: 'CREDIT_CARD', name: 'บัตรเครดิต', icon: CreditCard, color: 'text-blue-500' },
    { id: 'PROMPTPAY', name: 'พร้อมเพย์', icon: Smartphone, color: 'text-purple-500' },
  ];

  // Get cart from localStorage
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [deliveryFee, setDeliveryFee] = useState(30);

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart: CartItem[] = JSON.parse(savedCart);
        setCartItems(parsedCart);
      } catch (e) {
        console.error('Error parsing cart:', e);
        setCartItems([]);
      }
    }
  }, []);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
  const total = subtotal + deliveryFee - discount;

  const applyPromoCode = async () => {
    setPromoError('');
    setPromoSuccess('');

    if (!promoCode) {
      return;
    }

    setIsValidatingPromo(true);

    try {
      const response = await fetch('/api/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: promoCode,
          subtotal,
          restaurantId,
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        setDiscount(data.data.discount);
        setAppliedPromo(data.data);
        setPromoSuccess(`ใช้คูปองสำเร็จ! ลด ${data.data.discount.toFixed(2)} บาท`);
      } else {
        setPromoError(data.error || 'โค้ดส่วนลดไม่ถูกต้อง');
        setDiscount(0);
        setAppliedPromo(null);
      }
    } catch (error) {
      console.error('Error validating promo code:', error);
      setPromoError('เกิดข้อผิดพลาดในการตรวจสอบโค้ด');
      setDiscount(0);
      setAppliedPromo(null);
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAddress || !selectedPayment) {
      alert('กรุณาเลือกที่อยู่และวิธีชำระเงิน');
      return;
    }

    setLoading(true);

    try {
      // Create order
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: userId,
          restaurantId,
          addressId: selectedAddress,
          items: cartItems.map(item => ({
            menuItemId: item.menuItemId || item.id,
            quantity: item.quantity,
          })),
          paymentMethod: selectedPayment,
          notes,
          promoCode: promoCode || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Clear cart
        localStorage.removeItem('cart');

        // Show success and redirect to order tracking
        alert('สั่งอาหารสำเร็จ!');
        router.push(`/orders/${data.data.id}`);
      } else {
        alert('เกิดข้อผิดพลาด: ' + (data.error || 'ไม่สามารถสั่งอาหารได้'));
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('เกิดข้อผิดพลาดในการสั่งอาหาร');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout userId={userId}>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            ชำระเงิน
          </h1>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Delivery Address */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-orange-500" />
                    ที่อยู่จัดส่ง
                  </h2>

                  {loadingAddress ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : addressData ? (
                    <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 hover:border-orange-500 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white mb-1">
                            {addressData.label}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {addressData.fullAddress}
                          </p>
                        </div>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ไม่พบที่อยู่จัดส่ง
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowAddressModal(true)}
                    className="mt-3 text-orange-500 hover:text-orange-600 text-sm font-medium"
                  >
                    + เพิ่มที่อยู่ใหม่
                  </button>
                </div>

                {/* Payment Method */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-orange-500" />
                    วิธีชำระเงิน
                  </h2>

                  <div className="space-y-3">
                    {paymentMethods.map(method => {
                      const Icon = method.icon;
                      return (
                        <label
                          key={method.id}
                          className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                            selectedPayment === method.id
                              ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                              : 'border-gray-300 dark:border-gray-600 hover:border-orange-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="payment"
                            value={method.id}
                            checked={selectedPayment === method.id}
                            onChange={(e) => setSelectedPayment(e.target.value)}
                            className="text-orange-500 focus:ring-orange-500"
                          />
                          <Icon className={`w-6 h-6 ${method.color}`} />
                          <span className="flex-1 font-medium text-gray-900 dark:text-white">
                            {method.name}
                          </span>
                          {selectedPayment === method.id && (
                            <CheckCircle className="w-5 h-5 text-orange-500" />
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Notes */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    หมายเหตุ (ถ้ามี)
                  </h2>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="เช่น ไม่ใส่ผัก, เผ็ดน้อย, ฯลฯ"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                    rows={3}
                  />
                </div>
              </div>

              {/* Right Column - Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sticky top-20">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    สรุปคำสั่งซื้อ
                  </h2>

                  {/* Estimated Delivery Time */}
                  {restaurant?.estimatedTime && (
                    <div className="mb-4 p-3 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-xs text-gray-600 dark:text-gray-400">เวลาจัดส่งโดยประมาณ</p>
                          <p className="text-sm font-bold text-orange-600 dark:text-orange-400">
                            {restaurant.estimatedTime}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Order Items */}
                  <div className="space-y-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                    {cartItems.map((item, index) => (
                      <div key={item.menuItemId || index} className="flex justify-between">
                        <div>
                          <p className="text-gray-900 dark:text-white">
                            {item.quantity}x {item.name}
                          </p>
                        </div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          ฿{(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Promo Code */}
                  <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      โค้ดส่วนลด
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => {
                          setPromoCode(e.target.value.toUpperCase());
                          setPromoError('');
                          setPromoSuccess('');
                        }}
                        placeholder="กรอกโค้ด"
                        disabled={isValidatingPromo}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={applyPromoCode}
                        disabled={isValidatingPromo || !promoCode}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isValidatingPromo ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ตรวจสอบ...
                          </>
                        ) : (
                          'ใช้'
                        )}
                      </button>
                    </div>
                    {promoError && (
                      <p className="text-sm text-red-500 mt-2 flex items-center gap-1 animate-fadeIn">
                        <AlertCircle className="w-4 h-4" />
                        {promoError}
                      </p>
                    )}
                    {promoSuccess && (
                      <p className="text-sm text-green-500 mt-2 flex items-center gap-1 animate-fadeIn">
                        <CheckCircle className="w-4 h-4" />
                        {promoSuccess}
                      </p>
                    )}
                    {appliedPromo && (
                      <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg animate-fadeIn">
                        <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                          🎉 {appliedPromo.promotionName || 'ใช้คูปองสำเร็จ'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Price Summary */}
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">ราคาอาหาร</span>
                      <span className="text-gray-900 dark:text-white">
                        ฿{subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">ค่าจัดส่ง</span>
                      <span className="text-gray-900 dark:text-white">
                        ฿{deliveryFee.toFixed(2)}
                      </span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">ส่วนลด</span>
                        <span className="text-green-500">-฿{discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-gray-900 dark:text-white">ยอดรวม</span>
                      <span className="text-orange-500">฿{total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Minimum Order Warning */}
                  {restaurant?.minimumOrder && subtotal < restaurant.minimumOrder && (
                    <div className="mb-3 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg">
                      <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
                        ⚠️ ยอดขั้นต่ำ ฿{restaurant.minimumOrder} (ยังขาดอีก ฿{(restaurant.minimumOrder - subtotal).toFixed(2)})
                      </p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                        กรุณาเพิ่มสินค้าให้ครบยอดขั้นต่ำก่อนสั่งซื้อ
                      </p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || (restaurant?.minimumOrder !== undefined && subtotal < restaurant.minimumOrder)}
                    className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-red-600 focus:ring-4 focus:ring-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {loading ? 'กำลังดำเนินการ...' : 'ยืนยันคำสั่งซื้อ'}
                  </button>

                  {/* Demo Promo Codes */}
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">
                      💡 โค้ดทดสอบ:
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      • WELCOME10 (ลด 10%)
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      • FREE30 (ฟรีค่าส่ง 30฿)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Add Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                เพิ่มที่อยู่ใหม่
              </h2>
              <button
                onClick={() => setShowAddressModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Label */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ชื่อที่อยู่ *
                </label>
                <input
                  type="text"
                  value={newAddress.label}
                  onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                  placeholder="เช่น บ้าน, ที่ทำงาน"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Full Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ที่อยู่เต็ม *
                </label>
                <textarea
                  value={newAddress.fullAddress}
                  onChange={(e) => setNewAddress({ ...newAddress, fullAddress: e.target.value })}
                  placeholder="บ้านเลขที่, ถนน, ซอย"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                />
              </div>

              {/* District */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  แขวง/ตำบล
                </label>
                <input
                  type="text"
                  value={newAddress.district}
                  onChange={(e) => setNewAddress({ ...newAddress, district: e.target.value })}
                  placeholder="เช่น คลองเตย"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Province */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  จังหวัด
                </label>
                <input
                  type="text"
                  value={newAddress.province}
                  onChange={(e) => setNewAddress({ ...newAddress, province: e.target.value })}
                  placeholder="เช่น กรุงเทพมหานคร"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Postal Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  รหัสไปรษณีย์
                </label>
                <input
                  type="text"
                  value={newAddress.postalCode}
                  onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                  placeholder="เช่น 10110"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleAddAddress}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-red-600 transition-colors"
                >
                  บันทึก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
