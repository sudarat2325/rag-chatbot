'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bike, MapPin, Phone, Mail, Car, AlertCircle, Upload, FileText } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';

interface FormData {
  vehicleType: string;
  vehiclePlate: string;
  licenseNumber: string;
  licenseExpiry: string;
  // Personal info
  phone: string;
  email: string;
  emergencyContact: string;
  emergencyPhone: string;
  // Address
  address: string;
  district: string;
  province: string;
  postalCode: string;
}

export default function BecomeDriverPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    vehicleType: 'Motorcycle',
    vehiclePlate: '',
    licenseNumber: '',
    licenseExpiry: '',
    phone: '',
    email: '',
    emergencyContact: '',
    emergencyPhone: '',
    address: '',
    district: '',
    province: 'กรุงเทพมหานคร',
    postalCode: '',
  });

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedUserRole = localStorage.getItem('userRole');

    if (!storedUserId) {
      router.push('/login');
      return;
    }

    setUserId(storedUserId);

    // Show welcome message if user is not a driver yet
    if (storedUserRole !== 'DRIVER') {
      setShowWelcomeMessage(true);
    }

    // Check if user already is a driver
    checkExistingDriver(storedUserId);
  }, []);

  const checkExistingDriver = async (uid: string) => {
    try {
      const response = await fetch(`/api/drivers?userId=${uid}`);
      const data = await response.json();

      if (data.success && data.data) {
        // User already is a driver, redirect to dashboard
        alert('คุณเป็นไรเดอร์อยู่แล้ว! กำลังพาไปยัง Dashboard...');
        window.location.href = '/driver';
      }
    } catch (error) {
      console.error('Error checking driver:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate license expiry date
      const expiryDate = new Date(formData.licenseExpiry);
      if (expiryDate < new Date()) {
        throw new Error('ใบขับขี่หมดอายุแล้ว กรุณาต่ออายุก่อนสมัคร');
      }

      // First, update user role to DRIVER
      const userResponse = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'DRIVER',
          phone: formData.phone,
        }),
      });

      if (!userResponse.ok) {
        throw new Error('ไม่สามารถอัพเดทข้อมูลผู้ใช้ได้');
      }

      // Create driver profile
      const driverResponse = await fetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          vehicleType: formData.vehicleType,
          vehiclePlate: formData.vehiclePlate,
          licenseNumber: formData.licenseNumber,
          licenseExpiry: formData.licenseExpiry,
          emergencyContact: formData.emergencyContact,
          emergencyPhone: formData.emergencyPhone,
          address: formData.address,
          district: formData.district,
          province: formData.province,
          postalCode: formData.postalCode,
        }),
      });

      const driverData = await driverResponse.json();

      if (driverData.success) {
        // Update localStorage
        localStorage.setItem('userRole', 'DRIVER');

        // Show success message
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
        toast.innerHTML = '🎉 ยินดีต้อนรับสู่ทีมไรเดอร์! กำลังพาไปยัง Dashboard...';
        document.body.appendChild(toast);

        setTimeout(() => {
          router.push('/driver');
        }, 2000);
      } else {
        throw new Error(driverData.error || 'ไม่สามารถสร้างโปรไฟล์ไรเดอร์ได้');
      }
    } catch (error) {
      console.error('Error:', error);
      const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ';
      alert('❌ เกิดข้อผิดพลาด: ' + message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <MainLayout userId={userId || undefined}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <Bike className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              สมัครเป็นไรเดอร์
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              เข้าร่วมทีมไรเดอร์และเริ่มรับงานส่งอาหารวันนี้
            </p>
          </div>

          {/* Welcome Message */}
          {showWelcomeMessage && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-lg p-6 mb-8 animate-fade-in">
              <div className="flex items-start gap-3">
                <div className="text-blue-500 text-2xl">👋</div>
                <div>
                  <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2">
                    ยินดีต้อนรับสู่ระบบไรเดอร์!
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                    เพื่อเข้าใช้งาน Driver Dashboard คุณต้องสมัครเป็นไรเดอร์ก่อน
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    กรุณากรอกข้อมูลของคุณด้านล่างเพื่อเริ่มต้น 🚀
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Benefits */}
          <div className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 mb-8">
            <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-3">
              ✨ ประโยชน์ที่คุณจะได้รับ:
            </h3>
            <ul className="grid grid-cols-2 gap-3 text-sm text-blue-800 dark:text-blue-200">
              <li className="flex items-start gap-2">
                <span className="text-blue-500">✓</span>
                <span>กำหนดเวลาทำงานเองได้อย่างอิสระ</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">✓</span>
                <span>รับเงินทุกสัปดาห์</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">✓</span>
                <span>ระบบนำทาง GPS แบบ Real-time</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">✓</span>
                <span>แจ้งเตือนงานใหม่ทันที</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">✓</span>
                <span>ค่าน้ำมันและโบนัสพิเศษ</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">✓</span>
                <span>ประกันอุบัติเหตุ</span>
              </li>
            </ul>
          </div>

          {/* Requirements Notice */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-yellow-900 dark:text-yellow-300 mb-2">
                  เอกสารที่ต้องเตรียม:
                </h3>
                <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                  <li>• บัตรประชาชน (สำเนา)</li>
                  <li>• ใบขับขี่ (ยังไม่หมดอายุ)</li>
                  <li>• ทะเบียนรถ (สำเนา)</li>
                  <li>• สมุดบัญชีธนาคาร (หน้าแรก)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              ข้อมูลไรเดอร์
            </h2>

            <div className="space-y-6">
              {/* Vehicle Information */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  ข้อมูลยานพาหนะ
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ประเภทยานพาหนะ <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="vehicleType"
                      value={formData.vehicleType}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Motorcycle">มอเตอร์ไซค์</option>
                      <option value="Car">รถยนต์</option>
                      <option value="Bicycle">จักรยาน</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ทะเบียนรถ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="vehiclePlate"
                      value={formData.vehiclePlate}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="กข 1234 กรุงเทพ"
                    />
                  </div>
                </div>
              </div>

              {/* License Information */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  ข้อมูลใบขับขี่
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      เลขที่ใบขับขี่ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="12345678"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      วันหมดอายุ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="licenseExpiry"
                      value={formData.licenseExpiry}
                      onChange={handleChange}
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  ข้อมูลติดต่อ
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      เบอร์โทร <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="0xx-xxx-xxxx"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      อีเมล <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="driver@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ผู้ติดต่อฉุกเฉิน <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="ชื่อผู้ติดต่อฉุกเฉิน"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      เบอร์ฉุกเฉิน <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="emergencyPhone"
                      value={formData.emergencyPhone}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="0xx-xxx-xxxx"
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  ที่อยู่
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ที่อยู่ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="123 ถนนสุขุมวิท แขวงคลองเตย..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        เขต/อำเภอ <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="district"
                        value={formData.district}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        placeholder="คลองเตย"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        จังหวัด <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="province"
                        value={formData.province}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        placeholder="กรุงเทพมหานคร"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        รหัสไปรษณีย์ <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        required
                        pattern="[0-9]{5}"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        placeholder="10110"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    ข้าพเจ้ายอมรับ{' '}
                    <a href="#" className="text-blue-600 hover:underline">
                      ข้อกำหนดและเงื่อนไข
                    </a>{' '}
                    และ{' '}
                    <a href="#" className="text-blue-600 hover:underline">
                      นโยบายความเป็นส่วนตัว
                    </a>{' '}
                    รวมถึงยืนยันว่าข้อมูลที่ให้มาถูกต้องและเป็นจริงทุกประการ
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold rounded-lg hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    กำลังสมัคร...
                  </span>
                ) : (
                  '🚀 สมัครเป็นไรเดอร์'
                )}
              </button>
            </div>
          </form>

          {/* Additional Info */}
          <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>
              มีคำถาม? ติดต่อเราที่{' '}
              <a href="mailto:support@fooddelivery.com" className="text-blue-600 hover:underline">
                support@fooddelivery.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
