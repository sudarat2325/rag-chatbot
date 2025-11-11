'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Car,
  Phone,
  Mail,
  MapPin,
  FileText,
  AlertCircle,
  Save,
  ArrowLeft,
  CreditCard,
  Shield,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';

interface DriverProfile {
  id: string;
  vehicleType: string;
  vehiclePlate: string;
  licenseNumber: string;
  licenseExpiry: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  address?: string;
  district?: string;
  province?: string;
  postalCode?: string;
  bankName?: string;
  bankAccount?: string;
  bankAccountName?: string;
  rating: number;
  totalDeliveries: number;
  totalEarnings: number;
  isVerified: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
  };
}

export default function DriverProfilePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [formData, setFormData] = useState({
    vehicleType: '',
    vehiclePlate: '',
    licenseNumber: '',
    licenseExpiry: '',
    emergencyContact: '',
    emergencyPhone: '',
    address: '',
    district: '',
    province: '',
    postalCode: '',
    bankName: '',
    bankAccount: '',
    bankAccountName: '',
  });

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedUserRole = localStorage.getItem('userRole');

    if (!storedUserId || storedUserRole !== 'DRIVER') {
      router.push('/login');
      return;
    }

    setUserId(storedUserId);
    loadProfile(storedUserId);
  }, []);

  const loadProfile = async (uid: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/drivers?userId=${uid}`);
      const data = await response.json();

      if (data.success && data.data) {
        const profileData = data.data;
        setProfile(profileData);

        // Populate form with existing data
        setFormData({
          vehicleType: profileData.vehicleType || '',
          vehiclePlate: profileData.vehiclePlate || '',
          licenseNumber: profileData.licenseNumber || '',
          licenseExpiry: profileData.licenseExpiry
            ? new Date(profileData.licenseExpiry).toISOString().split('T')[0]
            : '',
          emergencyContact: profileData.emergencyContact || '',
          emergencyPhone: profileData.emergencyPhone || '',
          address: profileData.address || '',
          district: profileData.district || '',
          province: profileData.province || '',
          postalCode: profileData.postalCode || '',
          bankName: profileData.bankName || '',
          bankAccount: profileData.bankAccount || '',
          bankAccountName: profileData.bankAccountName || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      alert('ไม่สามารถโหลดข้อมูลโปรไฟล์ได้');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validate license expiry
      const expiryDate = new Date(formData.licenseExpiry);
      if (expiryDate < new Date()) {
        alert('ใบขับขี่หมดอายุแล้ว กรุณาต่ออายุก่อนบันทึก');
        setSaving(false);
        return;
      }

      const response = await fetch('/api/drivers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...formData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Show success message
        const toast = document.createElement('div');
        toast.className =
          'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
        toast.innerHTML = '✅ บันทึกข้อมูลสำเร็จ!';
        document.body.appendChild(toast);

        setTimeout(() => {
          toast.remove();
        }, 3000);

        // Reload profile
        await loadProfile(userId!);
      } else {
        throw new Error(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      const message =
        error instanceof Error ? error.message : 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ';
      alert('❌ เกิดข้อผิดพลาด: ' + message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout userId={userId || undefined}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout userId={userId || undefined}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/driver')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              กลับไป Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              แก้ไขโปรไฟล์
            </h1>
          </div>

          {/* Profile Stats Card */}
          {profile && (
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 mb-6 text-white">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-2xl font-bold text-blue-600">
                  {profile.user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{profile.user.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    {profile.isVerified ? (
                      <span className="flex items-center gap-1 text-sm bg-green-500 px-2 py-1 rounded-full">
                        <Shield className="w-3 h-3" />
                        ยืนยันตัวตนแล้ว
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-sm bg-yellow-500 px-2 py-1 rounded-full">
                        <AlertCircle className="w-3 h-3" />
                        รอการยืนยันตัวตน
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                  <div className="text-sm opacity-90">คะแนนรีวิว</div>
                  <div className="text-2xl font-bold">
                    ⭐ {profile.rating.toFixed(1)}
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                  <div className="text-sm opacity-90">จำนวนงาน</div>
                  <div className="text-2xl font-bold">{profile.totalDeliveries}</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                  <div className="text-sm opacity-90">รายได้สะสม</div>
                  <div className="text-2xl font-bold">
                    ฿{profile.totalEarnings.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Vehicle Information */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Car className="w-6 h-6 text-blue-500" />
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-500" />
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Phone className="w-6 h-6 text-blue-500" />
                ข้อมูลติดต่อฉุกเฉิน
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ผู้ติดต่อฉุกเฉิน
                  </label>
                  <input
                    type="text"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="ชื่อผู้ติดต่อฉุกเฉิน"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    เบอร์ฉุกเฉิน
                  </label>
                  <input
                    type="tel"
                    name="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="0xx-xxx-xxxx"
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-blue-500" />
                ที่อยู่
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ที่อยู่
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="123 ถนนสุขุมวิท แขวงคลองเตย..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      เขต/อำเภอ
                    </label>
                    <input
                      type="text"
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="คลองเตย"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      จังหวัด
                    </label>
                    <input
                      type="text"
                      name="province"
                      value={formData.province}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="กรุงเทพมหานคร"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      รหัสไปรษณีย์
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleChange}
                      pattern="[0-9]{5}"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="10110"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bank Information */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-blue-500" />
                ข้อมูลบัญชีธนาคาร
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ธนาคาร
                  </label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="ธนาคารกรุงเทพ"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      เลขที่บัญชี
                    </label>
                    <input
                      type="text"
                      name="bankAccount"
                      value={formData.bankAccount}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="xxx-x-xxxxx-x"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ชื่อบัญชี
                    </label>
                    <input
                      type="text"
                      name="bankAccountName"
                      value={formData.bankAccountName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="ชื่อผู้ถือบัญชี"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.push('/driver')}
                className="flex-1 py-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold rounded-lg hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    บันทึกข้อมูล
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}
