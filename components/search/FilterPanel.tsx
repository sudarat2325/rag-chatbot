'use client';

import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

export interface FilterOptions {
  categories?: string[];
  priceRange?: { min: number; max: number };
  minRating?: number;
  maxDeliveryFee?: number;
  isOpen?: boolean;
  sortBy?: 'rating' | 'totalOrders' | 'deliveryFee' | 'name';
  sortOrder?: 'asc' | 'desc';
}

interface FilterPanelProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  availableCategories?: string[];
}

export function FilterPanel({ filters, onFilterChange, availableCategories = [] }: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState({
    categories: true,
    price: true,
    rating: true,
    delivery: true,
    sort: true,
  });

  const categories = availableCategories.length > 0
    ? availableCategories
    : ['อาหารไทย', 'อาหารจีน', 'อาหารญี่ปุ่น', 'อาหารตะวันตก', 'อาหารเกาหลี', 'ของหวาน', 'เครื่องดื่ม', 'อาหารว่าง'];

  const toggleCategory = (category: string) => {
    const current = filters.categories || [];
    const updated = current.includes(category)
      ? current.filter((c) => c !== category)
      : [...current, category];
    onFilterChange({ ...filters, categories: updated });
  };

  const clearAllFilters = () => {
    onFilterChange({});
  };

  const hasActiveFilters = () => {
    return (
      (filters.categories && filters.categories.length > 0) ||
      filters.priceRange ||
      filters.minRating ||
      filters.maxDeliveryFee ||
      filters.isOpen !== undefined ||
      filters.sortBy
    );
  };

  const toggleSection = (section: keyof typeof expanded) => {
    setExpanded({ ...expanded, [section]: !expanded[section] });
  };

  return (
    <div className="relative">
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden w-full flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <Filter className="w-5 h-5" />
        <span>ตัวกรอง</span>
        {hasActiveFilters() && (
          <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded-full">
            {(filters.categories?.length || 0) + (filters.minRating ? 1 : 0) + (filters.maxDeliveryFee ? 1 : 0)}
          </span>
        )}
      </button>

      {/* Filter Panel */}
      <div
        className={`${
          isOpen ? 'block' : 'hidden'
        } lg:block absolute lg:relative top-full left-0 right-0 mt-2 lg:mt-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg lg:shadow-none p-4 z-10 max-h-[80vh] overflow-y-auto`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Filter className="w-5 h-5" />
            ตัวกรอง
          </h3>
          {hasActiveFilters() && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              ล้างทั้งหมด
            </button>
          )}
        </div>

        <div className="space-y-4">
          {/* Categories */}
          <div>
            <button
              onClick={() => toggleSection('categories')}
              className="w-full flex items-center justify-between mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              <span>หมวดหมู่</span>
              {expanded.categories ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expanded.categories && (
              <div className="space-y-2 pl-1">
                {categories.map((category) => (
                  <label key={category} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={filters.categories?.includes(category) || false}
                      onChange={() => toggleCategory(category)}
                      className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                      {category}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Price Range */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => toggleSection('price')}
              className="w-full flex items-center justify-between mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              <span>ราคา (฿)</span>
              {expanded.price ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expanded.price && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="ต่ำสุด"
                    value={filters.priceRange?.min || ''}
                    onChange={(e) =>
                      onFilterChange({
                        ...filters,
                        priceRange: {
                          min: Number(e.target.value),
                          max: filters.priceRange?.max || 1000,
                        },
                      })
                    }
                    className="flex-1 px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                  <input
                    type="number"
                    placeholder="สูงสุด"
                    value={filters.priceRange?.max || ''}
                    onChange={(e) =>
                      onFilterChange({
                        ...filters,
                        priceRange: {
                          min: filters.priceRange?.min || 0,
                          max: Number(e.target.value),
                        },
                      })
                    }
                    className="flex-1 px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Rating */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => toggleSection('rating')}
              className="w-full flex items-center justify-between mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              <span>คะแนนขั้นต่ำ</span>
              {expanded.rating ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expanded.rating && (
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <label key={rating} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="rating"
                      checked={filters.minRating === rating}
                      onChange={() => onFilterChange({ ...filters, minRating: rating })}
                      className="w-4 h-4 border-gray-300 text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                      {rating} ⭐ ขึ้นไป
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Delivery Fee */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => toggleSection('delivery')}
              className="w-full flex items-center justify-between mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              <span>ค่าจัดส่ง</span>
              {expanded.delivery ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expanded.delivery && (
              <div className="space-y-2">
                <input
                  type="number"
                  placeholder="ไม่เกิน (฿)"
                  value={filters.maxDeliveryFee || ''}
                  onChange={(e) =>
                    onFilterChange({ ...filters, maxDeliveryFee: Number(e.target.value) || undefined })
                  }
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
            )}
          </div>

          {/* Sort */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => toggleSection('sort')}
              className="w-full flex items-center justify-between mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              <span>เรียงตาม</span>
              {expanded.sort ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expanded.sort && (
              <div className="space-y-2">
                <select
                  value={filters.sortBy || ''}
                  onChange={(e) =>
                    onFilterChange({ ...filters, sortBy: e.target.value as any || undefined })
                  }
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                >
                  <option value="">เรียงตาม...</option>
                  <option value="rating">คะแนน</option>
                  <option value="totalOrders">ยอดนิยม</option>
                  <option value="deliveryFee">ค่าจัดส่ง</option>
                  <option value="name">ชื่อ</option>
                </select>
                {filters.sortBy && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onFilterChange({ ...filters, sortOrder: 'desc' })}
                      className={`flex-1 px-3 py-2 rounded text-sm ${
                        filters.sortOrder === 'desc'
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      มาก → น้อย
                    </button>
                    <button
                      onClick={() => onFilterChange({ ...filters, sortOrder: 'asc' })}
                      className={`flex-1 px-3 py-2 rounded text-sm ${
                        filters.sortOrder === 'asc'
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      น้อย → มาก
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Open Now Toggle */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">เปิดอยู่ตอนนี้</span>
              <input
                type="checkbox"
                checked={filters.isOpen || false}
                onChange={(e) => onFilterChange({ ...filters, isOpen: e.target.checked || undefined })}
                className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
