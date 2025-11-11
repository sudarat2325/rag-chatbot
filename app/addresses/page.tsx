'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Home,
  Building,
  Briefcase,
  Check,
} from 'lucide-react';
import Link from 'next/link';

interface Address {
  id: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
  district?: string;
  province?: string;
  postalCode?: string;
  label?: string;
  isDefault: boolean;
  createdAt: string;
}

export default function AddressesPage() {
  const [userId, setUserId] = useState<string | undefined>();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullAddress: '',
    district: '',
    province: '',
    postalCode: '',
    label: 'home',
    isDefault: false,
  });

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
      fetchAddresses(storedUserId);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchAddresses = async (userId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/addresses?userId=${userId}`);
      const data = await response.json();

      if (data.success) {
        setAddresses(data.data);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    try {
      let response;

      if (editingId) {
        // Update existing address
        response = await fetch('/api/addresses', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            addressId: editingId,
            userId,
            ...formData,
          }),
        });
      } else {
        // Create new address
        response = await fetch('/api/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            ...formData,
            latitude: 0, // In real app, get from geocoding
            longitude: 0,
          }),
        });
      }

      const data = await response.json();

      if (data.success) {
        fetchAddresses(userId);
        setShowForm(false);
        setEditingId(null);
        resetForm();
      } else {
        alert(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error saving address:', error);
      alert('เกิดข้อผิดพลาด');
    }
  };

  const handleEdit = (address: Address) => {
    setFormData({
      fullAddress: address.fullAddress,
      district: address.district || '',
      province: address.province || '',
      postalCode: address.postalCode || '',
      label: address.label || 'home',
      isDefault: address.isDefault,
    });
    setEditingId(address.id);
    setShowForm(true);
  };

  const handleDelete = async (addressId: string) => {
    if (!confirm('คุณต้องการลบที่อยู่นี้ใช่หรือไม่?')) return;

    try {
      const response = await fetch(`/api/addresses?addressId=${addressId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success && userId) {
        fetchAddresses(userId);
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      alert('เกิดข้อผิดพลาดในการลบที่อยู่');
    }
  };

  const setAsDefault = async (addressId: string) => {
    if (!userId) return;

    try {
      const response = await fetch('/api/addresses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addressId,
          userId,
          isDefault: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        fetchAddresses(userId);
      }
    } catch (error) {
      console.error('Error setting default address:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      fullAddress: '',
      district: '',
      province: '',
      postalCode: '',
      label: 'home',
      isDefault: false,
    });
  };

  const getLabelIcon = (label?: string) => {
    switch (label) {
      case 'home':
        return <Home className="w-5 h-5" />;
      case 'work':
        return <Briefcase className="w-5 h-5" />;
      case 'other':
        return <Building className="w-5 h-5" />;
      default:
        return <MapPin className="w-5 h-5" />;
    }
  };

  const getLabelText = (label?: string) => {
    switch (label) {
      case 'home':
        return 'บ้าน';
      case 'work':
        return 'ที่ทำงาน';
      case 'other':
        return 'อื่นๆ';
      default:
        return 'ที่อยู่';
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

  if (!userId) {
    return (
      <MainLayout userId={userId}>
        <div className="container mx-auto px-4 py-12 text-center">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            กรุณาเข้าสู่ระบบ
          </h1>
          <Link
            href="/login"
            className="text-orange-500 hover:text-orange-600 font-medium"
          >
            เข้าสู่ระบบ
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout userId={userId}>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                ที่อยู่ของฉัน
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                จัดการที่อยู่สำหรับจัดส่ง
              </p>
            </div>
            {!showForm && (
              <button
                onClick={() => {
                  resetForm();
                  setEditingId(null);
                  setShowForm(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
                เพิ่มที่อยู่
              </button>
            )}
          </div>

          {/* Address Form */}
          {showForm && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {editingId ? 'แก้ไขที่อยู่' : 'เพิ่มที่อยู่ใหม่'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Label Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ประเภทที่อยู่
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'home', label: 'บ้าน', icon: <Home className="w-5 h-5" /> },
                      { value: 'work', label: 'ที่ทำงาน', icon: <Briefcase className="w-5 h-5" /> },
                      { value: 'other', label: 'อื่นๆ', icon: <Building className="w-5 h-5" /> },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, label: option.value })}
                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                          formData.label === option.value
                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600'
                            : 'border-gray-300 dark:border-gray-600 hover:border-orange-300'
                        }`}
                      >
                        {option.icon}
                        <span className="font-medium">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ที่อยู่เต็ม *
                  </label>
                  <textarea
                    value={formData.fullAddress}
                    onChange={(e) =>
                      setFormData({ ...formData, fullAddress: e.target.value })
                    }
                    rows={3}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="บ้านเลขที่, ซอย, ถนน..."
                  />
                </div>

                {/* District & Province */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      เขต/อำเภอ
                    </label>
                    <input
                      type="text"
                      value={formData.district}
                      onChange={(e) =>
                        setFormData({ ...formData, district: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      จังหวัด
                    </label>
                    <input
                      type="text"
                      value={formData.province}
                      onChange={(e) =>
                        setFormData({ ...formData, province: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                {/* Postal Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    รหัสไปรษณีย์
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) =>
                      setFormData({ ...formData, postalCode: e.target.value })
                    }
                    maxLength={5}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Default Checkbox */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={formData.isDefault}
                    onChange={(e) =>
                      setFormData({ ...formData, isDefault: e.target.checked })
                    }
                    className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <label
                    htmlFor="isDefault"
                    className="text-sm text-gray-700 dark:text-gray-300"
                  >
                    ตั้งเป็นที่อยู่หลัก
                  </label>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                  >
                    {editingId ? 'บันทึกการแก้ไข' : 'เพิ่มที่อยู่'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                      resetForm();
                    }}
                    className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    ยกเลิก
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Addresses List */}
          {addresses.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
              <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                ยังไม่มีที่อยู่
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                เพิ่มที่อยู่เพื่อใช้สำหรับจัดส่ง
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {addresses.map((address) => (
                <div
                  key={address.id}
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 ${
                    address.isDefault ? 'ring-2 ring-orange-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 bg-orange-50 dark:bg-orange-900/20 text-orange-500 rounded-lg">
                        {getLabelIcon(address.label)}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {getLabelText(address.label)}
                          </h3>
                          {address.isDefault && (
                            <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/20 text-orange-600 text-xs font-medium rounded-full flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              ที่อยู่หลัก
                            </span>
                          )}
                        </div>

                        <p className="text-gray-700 dark:text-gray-300 mb-1">
                          {address.fullAddress}
                        </p>

                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {[address.district, address.province, address.postalCode]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {!address.isDefault && (
                        <button
                          onClick={() => setAsDefault(address.id)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="ตั้งเป็นที่อยู่หลัก"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(address)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="แก้ไข"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(address.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="ลบ"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
