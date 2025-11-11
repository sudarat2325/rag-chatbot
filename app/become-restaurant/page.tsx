'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Store, MapPin, Phone, Mail, Clock } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';

export default function BecomeRestaurantPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    phone: '',
    email: '',
    address: '',
    latitude: 13.7563,
    longitude: 100.5018,
    district: '',
    province: 'กรุงเทพมหานคร',
    categories: '',
    deliveryFee: 30,
    minimumOrder: 100,
    estimatedTime: '30-45 นาที',
  });

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedUserRole = localStorage.getItem('userRole');

    if (!storedUserId) {
      router.push('/login');
      return;
    }

    setUserId(storedUserId);
    // Show welcome message if user is not a restaurant owner yet
    if (storedUserRole !== 'RESTAURANT_OWNER') {
      setShowWelcomeMessage(true);
    }

    // Check if user already has a restaurant
    checkExistingRestaurant(storedUserId);
  }, []);

  const checkExistingRestaurant = async (uid: string) => {
    try {
      const response = await fetch(`/api/restaurants?ownerId=${uid}`);
      const data = await response.json();

      if (data.success && data.data && data.data.length > 0) {
        // User already has a restaurant, redirect to dashboard
        alert('คุณมีร้านอาหารอยู่แล้ว! กำลังพาไปยัง Dashboard...');
        window.location.href = '/restaurant-dashboard';
      }
    } catch (error) {
      console.error('Error checking restaurant:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First, update user role to RESTAURANT_OWNER
      const userResponse = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'RESTAURANT_OWNER' }),
      });

      if (!userResponse.ok) {
        throw new Error('Failed to update user role');
      }

      // Create restaurant
      const restaurantResponse = await fetch('/api/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId: userId,
          ...formData,
        }),
      });

      const restaurantData = await restaurantResponse.json();

      if (restaurantData.success) {
        // Update localStorage
        localStorage.setItem('userRole', 'RESTAURANT_OWNER');

        // Show success message
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        toast.innerHTML = '🎉 ยินดีต้อนรับสู่ระบบร้านอาหาร! กำลังพาไปยัง Dashboard...';
        document.body.appendChild(toast);

        setTimeout(() => {
          router.push('/restaurant-dashboard');
        }, 2000);
      } else {
        throw new Error(restaurantData.error || 'Failed to create restaurant');
      }
    } catch (error) {
      console.error('Error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert('❌ เกิดข้อผิดพลาด: ' + message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'deliveryFee' || name === 'minimumOrder' || name === 'latitude' || name === 'longitude'
        ? parseFloat(value) || 0
        : value
    }));
  };

  return (
    <MainLayout userId={userId || undefined}>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <Store className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              เปิดร้านอาหารกับเรา
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              สมัครเป็นร้านค้าพาร์ทเนอร์และเริ่มรับออเดอร์ออนไลน์วันนี้
            </p>
          </div>

          {/* Welcome Message for redirected users */}
          {showWelcomeMessage && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-lg p-6 mb-8 animate-fade-in">
              <div className="flex items-start gap-3">
                <div className="text-blue-500 text-2xl">👋</div>
                <div>
                  <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2">
                    ยินดีต้อนรับสู่ระบบพาร์ทเนอร์!
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                    เพื่อเข้าใช้งาน Restaurant Dashboard คุณต้องสมัครเป็นพาร์ทเนอร์ก่อน
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    กรุณากรอกข้อมูลร้านอาหารของคุณด้านล่างเพื่อเริ่มต้น 🚀
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Benefits */}
          <div className="bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-6 mb-8">
            <h3 className="font-bold text-orange-900 dark:text-orange-300 mb-3">
              ✨ ประโยชน์ที่คุณจะได้รับ:
            </h3>
            <ul className="grid grid-cols-2 gap-3 text-sm text-orange-800 dark:text-orange-200">
              <li className="flex items-start gap-2">
                <span className="text-orange-500">✓</span>
                <span>ระบบจัดการออเดอร์แบบ Real-time</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500">✓</span>
                <span>แจ้งเตือนอัตโนมัติเมื่อมีออเดอร์ใหม่</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500">✓</span>
                <span>เข้าถึงลูกค้าจำนวนมาก</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500">✓</span>
                <span>ไม่มีค่าธรรมเนียมการสมัคร</span>
              </li>
            </ul>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              ข้อมูลร้านอาหาร
            </h2>

            <div className="space-y-6">
              {/* Restaurant Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ชื่อร้าน <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                  placeholder="ร้านอาหารของคุณ"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  คำอธิบายร้าน
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                  placeholder="บอกเล่าเกี่ยวกับร้านของคุณ..."
                />
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    เบอร์โทร <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                    placeholder="0xx-xxx-xxxx"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    อีเมล
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                    placeholder="restaurant@example.com"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  ที่อยู่ร้าน <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                  placeholder="123 ถนนสุขุมวิท แขวงคลองเตย..."
                />
              </div>

              {/* Categories */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ประเภทอาหาร
                </label>
                <input
                  type="text"
                  name="categories"
                  value={formData.categories}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                  placeholder="อาหารไทย, อาหารจานเดียว (คั่นด้วยเครื่องหมายจุลภาค)"
                />
              </div>

              {/* Delivery Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ค่าส่ง (บาท)
                  </label>
                  <input
                    type="number"
                    name="deliveryFee"
                    value={formData.deliveryFee}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ขั้นต่ำ (บาท)
                  </label>
                  <input
                    type="number"
                    name="minimumOrder"
                    value={formData.minimumOrder}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    เวลาจัดส่ง
                  </label>
                  <input
                    type="text"
                    name="estimatedTime"
                    value={formData.estimatedTime}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                    placeholder="30-45 นาที"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-lg hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    กำลังสมัคร...
                  </span>
                ) : (
                  '🚀 เริ่มต้นเป็นพาร์ทเนอร์'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}
