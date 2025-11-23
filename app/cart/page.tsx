'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { useRoleGuard } from '@/lib/hooks/useRoleGuard';

interface CartItem {
  id: string;
  restaurantId: string;
  restaurantName: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export default function CartPage() {
  const router = useRouter();
  const { session, status } = useRoleGuard();
  const userId = session?.user?.id;
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [minimumOrder, setMinimumOrder] = useState(0);

  useEffect(() => {
    if (status === 'loading') return;
    if (!userId) {
      router.push('/login');
      return;
    }

    const cart = localStorage.getItem('cart');
    if (cart) {
      try {
        const items = JSON.parse(cart);
        setCartItems(items);
        if (items.length > 0) {
          fetchRestaurantInfo(items[0].restaurantId);
        }
      } catch (error) {
        console.error('Error parsing cart:', error);
      }
    }
  }, [status, userId, router]);

  const fetchRestaurantInfo = async (restaurantId: string) => {
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}`);
      const data = await response.json();
      if (data.success && data.data) {
        setMinimumOrder(data.data.minimumOrder || 0);
      }
    } catch (error) {
      console.error('Error fetching restaurant info:', error);
    }
  };

  const updateQuantity = (itemId: string, change: number) => {
    const updatedCart = cartItems.map(item => {
      if (item.id === itemId) {
        const newQuantity = Math.max(1, item.quantity + change);
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const removeItem = (itemId: string) => {
    const updatedCart = cartItems.filter(item => item.id !== itemId);
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cart');
  };

  const handleCheckout = () => {
    if (!userId) {
      alert('กรุณาเข้าสู่ระบบก่อนทำการสั่งอาหาร');
      router.push('/login');
      return;
    }

    if (cartItems.length === 0) {
      alert('กรุณาเพิ่มสินค้าในตะกร้าก่อน');
      return;
    }

    // Get restaurant ID from first item
    const restaurantId = cartItems[0]?.restaurantId;
    router.push(`/checkout?restaurantId=${restaurantId}`);
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = cartItems.length > 0 ? 30 : 0;
  const total = subtotal + deliveryFee;

  return (
    <MainLayout userId={userId}>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-8 h-8 text-orange-500" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                ตะกร้าสินค้า
              </h1>
            </div>
            {cartItems.length > 0 && (
              <button
                onClick={clearCart}
                className="text-red-500 hover:text-red-600 text-sm font-medium flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                ล้างตะกร้า
              </button>
            )}
          </div>

          {cartItems.length === 0 ? (
            /* Empty Cart */
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
              <ShoppingCart className="w-24 h-24 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                ตะกร้าสินค้าว่างเปล่า
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                เพิ่มอาหารที่คุณชอบลงในตะกร้าเพื่อสั่งซื้อ
              </p>
              <button
                onClick={() => router.push('/food')}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-red-600 transition-all"
              >
                เลือกอาหาร
              </button>
            </div>
          ) : (
            /* Cart with Items */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {cartItems.map((item, index) => (
                  <div
                    key={`${item.id}-${item.restaurantId}-${index}`}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 flex items-center gap-4"
                  >
                    {/* Image */}
                    <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">
                          🍽️
                        </div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.restaurantName}
                      </p>
                      <p className="text-lg font-semibold text-orange-500 mt-2">
                        ฿{item.price.toFixed(2)}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                      </button>
                      <span className="text-lg font-semibold text-gray-900 dark:text-white w-8 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-4 h-4 text-white" />
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-600 p-2"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sticky top-20">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    สรุปคำสั่งซื้อ
                  </h2>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span>ราคาอาหาร</span>
                      <span>฿{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span>ค่าจัดส่ง</span>
                      <span>฿{deliveryFee.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between text-lg font-bold">
                      <span className="text-gray-900 dark:text-white">ยอดรวม</span>
                      <span className="text-orange-500">฿{total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Minimum Order Warning */}
                  {minimumOrder > 0 && subtotal < minimumOrder && (
                    <div className="mb-3 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg">
                      <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
                        ⚠️ ยอดขั้นต่ำ ฿{minimumOrder} (ยังขาดอีก ฿{(minimumOrder - subtotal).toFixed(2)})
                      </p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                        กรุณาเพิ่มสินค้าให้ครบยอดขั้นต่ำก่อนสั่งซื้อ
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleCheckout}
                    disabled={minimumOrder > 0 && subtotal < minimumOrder}
                    className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-red-600 focus:ring-4 focus:ring-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    ดำเนินการชำระเงิน
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => router.push('/food')}
                    className="w-full mt-3 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    เพิ่มเมนูอื่น
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
