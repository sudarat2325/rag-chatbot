'use client';

import React, { useState, useEffect } from 'react';
import { RestaurantCard } from '@/components/restaurant/RestaurantCard';
import { RestaurantWithDetails } from '@/lib/types';
import { Search, MapPin, Filter, MessageCircle, X, Star, Truck, Clock, DollarSign, SlidersHorizontal } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import Link from 'next/link';

export default function FoodDeliveryPage() {
  const [restaurants, setRestaurants] = useState<RestaurantWithDetails[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<RestaurantWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Advanced filters
  const [filters, setFilters] = useState({
    priceRange: 'all', // 'all', 'budget', 'medium', 'premium'
    minRating: 0,
    maxDeliveryFee: 100,
    openNow: false,
    sortBy: 'recommended' // 'recommended', 'rating', 'deliveryTime', 'distance'
  });

  const categories = [
    'ทั้งหมด',
    'อาหารไทย',
    'อาหารญี่ปุ่น',
    'อาหารจีน',
    'ฟาสต์ฟู้ด',
    'ของหวาน',
    'เครื่องดื่ม',
  ];

  const quickFilters = [
    {
      label: '🚀 ส่งด่วน',
      description: '< 25 นาที',
      apply: () =>
        setFilters((prev) => ({
          ...prev,
          sortBy: 'deliveryTime',
        })),
    },
    {
      label: '🌟 4.5+',
      description: 'คะแนนสูง',
      apply: () =>
        setFilters((prev) => ({
          ...prev,
          minRating: 4.5,
        })),
    },
    {
      label: '💸 ส่งฟรี',
      description: '0 บาท',
      apply: () =>
        setFilters((prev) => ({
          ...prev,
          maxDeliveryFee: 0,
        })),
    },
    {
      label: '🔥 โปรฮิต',
      description: 'คะแนนนิยม',
      apply: () =>
        setFilters((prev) => ({
          ...prev,
          sortBy: 'rating',
          minRating: 4,
        })),
    },
  ];

  const highlightStats = [
    {
      label: 'ร้านที่คัดมา',
      value: `${restaurants.length || 0}+`,
      sub: 'เลือกโดยทีมภายใน',
    },
    {
      label: 'เวลาส่งเฉลี่ย',
      value: '32 นาที',
      sub: 'การันตีตรงเวลา',
    },
    {
      label: 'ค่าส่งเริ่มต้น',
      value: '฿0',
      sub: 'มีโปรทุกวัน',
    },
  ];

  useEffect(() => {
    fetchRestaurants();
  }, [selectedCategory]);

  useEffect(() => {
    applyFilters();
  }, [restaurants, searchQuery, filters]);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (selectedCategory && selectedCategory !== 'ทั้งหมด') {
        params.append('category', selectedCategory);
      }

      const response = await fetch(`/api/restaurants?${params}`);
      const data = await response.json();

      if (data.success) {
        setRestaurants(data.data);
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...restaurants];

    // Search query filter
    if (searchQuery) {
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Price range filter
    if (filters.priceRange !== 'all') {
      const priceRanges = {
        budget: [0, 100],
        medium: [100, 300],
        premium: [300, 1000]
      };
      const [min, max] = priceRanges[filters.priceRange as keyof typeof priceRanges];
      filtered = filtered.filter(r => {
        const avgPrice = r.averagePrice || 0;
        return avgPrice >= min && avgPrice < max;
      });
    }

    // Rating filter
    if (filters.minRating > 0) {
      filtered = filtered.filter(r => (r.rating || 0) >= filters.minRating);
    }

    // Delivery fee filter
    if (filters.maxDeliveryFee < 100) {
      filtered = filtered.filter(r => (r.deliveryFee || 0) <= filters.maxDeliveryFee);
    }

    // Open now filter
    if (filters.openNow) {
      filtered = filtered.filter(r => r.isOpen);
    }

    // Sorting
    switch (filters.sortBy) {
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'deliveryTime':
        filtered.sort((a, b) => (a.deliveryTime || 30) - (b.deliveryTime || 30));
        break;
      case 'distance':
        filtered.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        break;
      default:
        // Keep original order (recommended)
        break;
    }

    setFilteredRestaurants(filtered);
  };

  const resetFilters = () => {
    setFilters({
      priceRange: 'all',
      minRating: 0,
      maxDeliveryFee: 100,
      openNow: false,
      sortBy: 'recommended'
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.priceRange !== 'all') count++;
    if (filters.minRating > 0) count++;
    if (filters.maxDeliveryFee < 100) count++;
    if (filters.openNow) count++;
    if (filters.sortBy !== 'recommended') count++;
    return count;
  };

  // Get user from localStorage (temporary - should use proper auth)
  const [userId, setUserId] = useState<string | undefined>();

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  return (
    <MainLayout userId={userId}>
      <div className="relative bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900 min-h-screen">
        <div className="absolute inset-0 pointer-events-none [mask-image:radial-gradient(circle_at_top,_white,_transparent_70%)]">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-orange-400/20 blur-3xl" />
          <div className="absolute top-1/3 left-10 h-72 w-72 rounded-full bg-pink-400/10 blur-3xl" />
        </div>
        {/* Hero Header with Gradient */}
        <div className="relative bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white overflow-hidden shadow-2xl rounded-br-[4rem] rounded-bl-[4rem] mx-4 mt-4">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24 blur-2xl" />

          <div className="relative max-w-7xl mx-auto px-4 py-10">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 mb-8">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-white/70 mb-3">
                  Thailand&apos;s Favorite Delivery
                </p>
                <h1 className="text-4xl md:text-5xl font-bold mb-3 drop-shadow-lg leading-tight">
                  🍔 สั่งอาหารออนไลน์ สวย ครบ จบในที่เดียว
                </h1>
                <p className="text-white/90 text-lg mb-6 max-w-2xl">
                  คัดสรรร้านดังและเมนูห้ามพลาด พร้อมการันตีจัดส่งรวดเร็วและโปรแรงทุกวัน
                </p>

                {/* Location */}
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <MapPin className="w-4 h-4" />
                    <span className="font-medium">กรุงเทพมหานคร</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs uppercase tracking-wide">
                    เปิด 24 ชม.
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-4 text-black">
                {highlightStats.map((card) => (
                  <div
                    key={card.label}
                    className="bg-white/90 backdrop-blur rounded-2xl px-5 py-4 text-center text-gray-900 shadow-2xl"
                  >
                    <div className="text-2xl font-bold text-orange-500">{card.value}</div>
                    <div className="text-sm text-gray-600">{card.label}</div>
                    <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Search and Filters */}
            <div className="space-y-4">
              <div className="flex flex-col lg:flex-row gap-3">
                <div className="flex-1 bg-white/95 dark:bg-gray-900/90 rounded-2xl shadow-2xl p-1 flex items-center gap-2 border border-white/40 dark:border-gray-800 hover:border-white transition-all">
                  <Search className="w-5 h-5 text-orange-500 ml-3" />
                  <input
                    type="text"
                    placeholder="🔍 ค้นหาร้านอาหาร เมนู หรือประเภทอาหาร..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 outline-none text-gray-900 dark:text-white bg-transparent px-2 py-3 placeholder:text-gray-400"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mr-3 text-xs text-gray-500 hover:text-gray-800"
                    >
                      ล้าง
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`relative rounded-2xl px-6 py-3 flex items-center gap-2 border transition-all hover:scale-105 ${
                    showFilters || getActiveFiltersCount() > 0
                      ? 'border-transparent text-white bg-gradient-to-r from-orange-500 to-red-500 shadow-lg shadow-orange-500/40'
                      : 'border-white/50 text-gray-900 dark:text-gray-100 bg-white/20 hover:bg-white/30'
                  }`}
                >
                  <SlidersHorizontal className="w-5 h-5" />
                  <span className="font-semibold">ตัวกรอง</span>
                  {getActiveFiltersCount() > 0 && (
                    <span className="absolute -top-2 -right-2 bg-white text-orange-600 text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold shadow-lg animate-pulse">
                      {getActiveFiltersCount()}
                    </span>
                  )}
                </button>
              </div>

              {/* Quick filters */}
              <div className="flex flex-wrap gap-3">
                {quickFilters.map((filter) => (
                  <button
                    key={filter.label}
                    onClick={filter.apply}
                    className="flex items-center gap-3 rounded-2xl bg-white/20 px-4 py-3 text-sm font-medium backdrop-blur border border-white/40 hover:bg-white/30 transition"
                  >
                    <span>{filter.label}</span>
                    <span className="text-white/70 text-xs">{filter.description}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

      {/* Categories */}
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-lg sticky top-16 z-10 border-b-2 border-orange-100 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-1">
            <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-700 rounded-full flex-shrink-0">
              <Filter className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">หมวดหมู่:</span>
            </div>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat === 'ทั้งหมด' ? null : cat)}
                className={`px-5 py-2.5 rounded-full font-semibold text-sm whitespace-nowrap transition-all hover:scale-105 shadow-md ${
                  (cat === 'ทั้งหมด' && !selectedCategory) ||
                  cat === selectedCategory
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-300/50'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-white/95 dark:bg-gray-900/95 border-y border-orange-100/60 dark:border-gray-800 shadow-xl rounded-3xl mx-4 mt-6">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">ตัวกรองขั้นสูง</h3>
              <div className="flex gap-2">
                <button
                  onClick={resetFilters}
                  className="text-sm text-orange-600 dark:text-orange-400 hover:underline"
                >
                  ล้างตัวกรอง
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Price Range */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <DollarSign className="w-4 h-4" />
                  ช่วงราคา
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'all', label: 'ทั้งหมด' },
                    { value: 'budget', label: '฿ (0-100 บาท)' },
                    { value: 'medium', label: '฿฿ (100-300 บาท)' },
                    { value: 'premium', label: '฿฿฿ (300+ บาท)' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFilters({ ...filters, priceRange: option.value })}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all shadow-sm ${
                        filters.priceRange === option.value
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold shadow-lg'
                          : 'bg-white dark:bg-gray-800/50 text-gray-700 dark:text-gray-200 hover:bg-orange-50 dark:hover:bg-gray-700/70 border border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Minimum Rating */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <Star className="w-4 h-4" />
                  คะแนนขั้นต่ำ
                </label>
                <div className="space-y-2">
                  {[0, 3, 3.5, 4, 4.5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setFilters({ ...filters, minRating: rating })}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all shadow-sm flex items-center gap-2 ${
                        filters.minRating === rating
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold shadow-lg'
                          : 'bg-white dark:bg-gray-800/50 text-gray-700 dark:text-gray-200 hover:bg-orange-50 dark:hover:bg-gray-700/70 border border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {rating === 0 ? (
                        'ทั้งหมด'
                      ) : (
                        <>
                          {rating}
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          ขึ้นไป
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Delivery Fee */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <Truck className="w-4 h-4" />
                  ค่าจัดส่งสูงสุด
                </label>
                <div className="space-y-3">
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {filters.maxDeliveryFee === 100 ? 'ไม่จำกัด' : `฿${filters.maxDeliveryFee}`}
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="10"
                      value={filters.maxDeliveryFee}
                      onChange={(e) => setFilters({ ...filters, maxDeliveryFee: parseInt(e.target.value) })}
                      className="w-full accent-orange-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>฿0</span>
                      <span>฿100+</span>
                    </div>
                  </div>

                  {/* Open Now Toggle */}
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">เปิดอยู่ตอนนี้</span>
                    </div>
                    <button
                      onClick={() => setFilters({ ...filters, openNow: !filters.openNow })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        filters.openNow ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          filters.openNow ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Sort By */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <SlidersHorizontal className="w-4 h-4" />
                  เรียงตาม
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'recommended', label: 'แนะนำ' },
                    { value: 'rating', label: 'คะแนนสูงสุด' },
                    { value: 'deliveryTime', label: 'จัดส่งเร็วที่สุด' },
                    { value: 'distance', label: 'ระยะทางใกล้สุด' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFilters({ ...filters, sortBy: option.value })}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all shadow-sm ${
                        filters.sortBy === option.value
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold shadow-lg'
                          : 'bg-white dark:bg-gray-800/50 text-gray-700 dark:text-gray-200 hover:bg-orange-50 dark:hover:bg-gray-700/70 border border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restaurants Grid */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="h-64 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 animate-pulse"
              />
            ))}
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="text-center py-20 rounded-3xl border border-dashed border-orange-200 bg-orange-50/60 dark:bg-gray-900/50">
            <div className="mx-auto h-16 w-16 rounded-full bg-white shadow-inner flex items-center justify-center text-3xl mb-4">
              🍽️
            </div>
            <p className="text-gray-800 dark:text-gray-100 text-xl font-semibold">ไม่พบร้านอาหาร</p>
            <p className="text-gray-500 dark:text-gray-400 mt-2">ลองค้นหาด้วยคำอื่นหรือเปลี่ยนหมวดหมู่</p>
            {getActiveFiltersCount() > 0 && (
              <button
                onClick={resetFilters}
                className="mt-6 px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full hover:shadow-lg transition"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  ร้านอาหารทั้งหมด
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  พบ {filteredRestaurants.length} ร้าน
                  {restaurants.length !== filteredRestaurants.length && (
                    <span className="text-orange-600 dark:text-orange-400 ml-1">
                      (จากทั้งหมด {restaurants.length} ร้าน)
                    </span>
                  )}
                </p>
              </div>

              {/* Active filters badge */}
              {getActiveFiltersCount() > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    ใช้ตัวกรอง {getActiveFiltersCount()} รายการ
                  </span>
                  <button
                    onClick={resetFilters}
                    className="text-sm text-orange-600 dark:text-orange-400 hover:underline"
                  >
                    ล้างทั้งหมด
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRestaurants.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  onClick={() => {
                    // Navigate to restaurant detail page
                    window.location.href = `/restaurant/${restaurant.id}`;
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>

        {/* Chatbot Button (Fixed) */}
        <Link
          href="/chatbot"
          className="fixed bottom-6 right-6 bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-full shadow-lg transition-all hover:scale-110 z-50 flex items-center justify-center"
          title="เปิดแชทบอท AI"
        >
          <MessageCircle className="w-6 h-6" />
        </Link>
      </div>
    </MainLayout>
  );
}
