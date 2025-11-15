'use client';

import { Filter, X, Calendar, CreditCard, Package } from 'lucide-react';
import { useState } from 'react';

export interface OrderFilters {
  status?: string[];
  paymentMethod?: string[];
  paymentStatus?: string[];
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'createdAt' | 'total' | 'status';
  sortOrder?: 'asc' | 'desc';
}

interface OrderFilterProps {
  filters: OrderFilters;
  onFilterChange: (filters: OrderFilters) => void;
  orderCount?: number;
}

export function OrderFilter({ filters, onFilterChange, orderCount }: OrderFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const orderStatuses = [
    { value: 'PENDING', label: 'รอยืนยัน', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'CONFIRMED', label: 'ยืนยันแล้ว', color: 'bg-blue-100 text-blue-800' },
    { value: 'PREPARING', label: 'กำลังเตรียม', color: 'bg-purple-100 text-purple-800' },
    { value: 'READY', label: 'พร้อมส่ง', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'PICKED_UP', label: 'กำลังส่ง', color: 'bg-orange-100 text-orange-800' },
    { value: 'DELIVERED', label: 'ส่งแล้ว', color: 'bg-green-100 text-green-800' },
    { value: 'CANCELLED', label: 'ยกเลิก', color: 'bg-red-100 text-red-800' },
  ];

  const paymentMethods = [
    { value: 'CASH', label: 'เงินสด' },
    { value: 'CREDIT_CARD', label: 'บัตรเครดิต' },
    { value: 'PROMPTPAY', label: 'พร้อมเพย์' },
    { value: 'WALLET', label: 'กระเป๋าเงิน' },
    { value: 'LOYALTY_POINTS', label: 'คะแนนสะสม' },
  ];

  const paymentStatuses = [
    { value: 'PENDING', label: 'รอชำระ', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'PAID', label: 'ชำระแล้ว', color: 'bg-green-100 text-green-800' },
    { value: 'FAILED', label: 'ล้มเหลว', color: 'bg-red-100 text-red-800' },
    { value: 'REFUNDED', label: 'คืนเงิน', color: 'bg-gray-100 text-gray-800' },
  ];

  const toggleArrayFilter = (key: keyof OrderFilters, value: string) => {
    const current = (filters[key] as string[]) || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFilterChange({ ...filters, [key]: updated.length > 0 ? updated : undefined });
  };

  const clearAllFilters = () => {
    onFilterChange({});
  };

  const hasActiveFilters = () => {
    return (
      (filters.status && filters.status.length > 0) ||
      (filters.paymentMethod && filters.paymentMethod.length > 0) ||
      (filters.paymentStatus && filters.paymentStatus.length > 0) ||
      filters.dateFrom ||
      filters.dateTo ||
      filters.sortBy
    );
  };

  const activeFilterCount = () => {
    let count = 0;
    if (filters.status && filters.status.length > 0) count += filters.status.length;
    if (filters.paymentMethod && filters.paymentMethod.length > 0) count += filters.paymentMethod.length;
    if (filters.paymentStatus && filters.paymentStatus.length > 0) count += filters.paymentStatus.length;
    if (filters.dateFrom || filters.dateTo) count += 1;
    return count;
  };

  return (
    <div className="relative">
      {/* Filter Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
      >
        <Filter className="w-5 h-5" />
        <span className="font-medium">กรองออเดอร์</span>
        {activeFilterCount() > 0 && (
          <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded-full font-semibold">
            {activeFilterCount()}
          </span>
        )}
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-20 max-h-[600px] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Filter className="w-5 h-5" />
                ตัวกรองออเดอร์
              </h3>
              {orderCount !== undefined && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">พบ {orderCount} รายการ</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {hasActiveFilters() && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                >
                  ล้างทั้งหมด
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-6">
            {/* Order Status Filter */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                สถานะออเดอร์
              </h4>
              <div className="space-y-2">
                {orderStatuses.map((status) => (
                  <label key={status.value} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={filters.status?.includes(status.value) || false}
                      onChange={() => toggleArrayFilter('status', status.value)}
                      className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    />
                    <span
                      className={`text-sm px-2 py-1 rounded ${status.color} group-hover:opacity-80 transition-opacity`}
                    >
                      {status.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Payment Method Filter */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                วิธีชำระเงิน
              </h4>
              <div className="space-y-2">
                {paymentMethods.map((method) => (
                  <label key={method.value} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={filters.paymentMethod?.includes(method.value) || false}
                      onChange={() => toggleArrayFilter('paymentMethod', method.value)}
                      className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                      {method.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Payment Status Filter */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                สถานะการชำระเงิน
              </h4>
              <div className="space-y-2">
                {paymentStatuses.map((status) => (
                  <label key={status.value} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={filters.paymentStatus?.includes(status.value) || false}
                      onChange={() => toggleArrayFilter('paymentStatus', status.value)}
                      className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    />
                    <span className={`text-sm px-2 py-1 rounded ${status.color} group-hover:opacity-80 transition-opacity`}>
                      {status.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                ช่วงเวลา
              </h4>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">จาก</label>
                  <input
                    type="date"
                    value={filters.dateFrom || ''}
                    onChange={(e) => onFilterChange({ ...filters, dateFrom: e.target.value || undefined })}
                    className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">ถึง</label>
                  <input
                    type="date"
                    value={filters.dateTo || ''}
                    onChange={(e) => onFilterChange({ ...filters, dateTo: e.target.value || undefined })}
                    className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Sort Options */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">เรียงตาม</h4>
              <div className="space-y-2">
                <select
                  value={filters.sortBy || 'createdAt'}
                  onChange={(e) =>
                    onFilterChange({ ...filters, sortBy: (e.target.value as any) || undefined })
                  }
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                >
                  <option value="createdAt">วันที่สั่ง</option>
                  <option value="total">ยอดรวม</option>
                  <option value="status">สถานะ</option>
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={() => onFilterChange({ ...filters, sortOrder: 'desc' })}
                    className={`flex-1 px-3 py-2 rounded text-sm transition-colors ${
                      filters.sortOrder === 'desc' || !filters.sortOrder
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    ใหม่ → เก่า
                  </button>
                  <button
                    onClick={() => onFilterChange({ ...filters, sortOrder: 'asc' })}
                    className={`flex-1 px-3 py-2 rounded text-sm transition-colors ${
                      filters.sortOrder === 'asc'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    เก่า → ใหม่
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
