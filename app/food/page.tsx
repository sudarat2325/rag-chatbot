'use client';

import React, { useState, useEffect } from 'react';
import { RestaurantCard } from '@/components/restaurant/RestaurantCard';
import { RestaurantWithDetails } from '@/lib/types';
import { Search, MapPin, Filter } from 'lucide-react';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';

export default function FoodDeliveryPage() {
  const [restaurants, setRestaurants] = useState<RestaurantWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [
    'ทั้งหมด',
    'อาหารไทย',
    'อาหารญี่ปุ่น',
    'อาหารจีน',
    'ฟาสต์ฟู้ด',
    'ของหวาน',
    'เครื่องดื่ม',
  ];

  useEffect(() => {
    fetchRestaurants();
  }, [selectedCategory]);

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

  const handleSearch = () => {
    // Filter restaurants based on search query
    if (!searchQuery) {
      fetchRestaurants();
      return;
    }

    const filtered = restaurants.filter(
      (r) =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setRestaurants(filtered);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <Navigation />

      {/* Search Header */}
      <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">สั่งอาหารออนไลน์</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            ส่งตรงถึงบ้าน รวดเร็ว ปลอดภัย
          </p>

          {/* Location */}
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>กรุงเทพมหานคร</span>
          </div>

          {/* Search */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 flex items-center gap-2 border border-gray-200 dark:border-gray-700">
            <Search className="w-5 h-5 text-gray-400 ml-2" />
            <input
              type="text"
              placeholder="ค้นหาร้านอาหาร เมนู หรือประเภทอาหาร..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 outline-none text-gray-900 dark:text-white bg-transparent px-2 py-2"
            />
            <button
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-semibold transition-colors"
            >
              ค้นหา
            </button>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-sm sticky top-16 z-10 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 overflow-x-auto">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat === 'ทั้งหมด' ? null : cat)}
                className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-colors ${
                  (cat === 'ทั้งหมด' && !selectedCategory) ||
                  cat === selectedCategory
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Restaurants Grid */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : restaurants.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600 dark:text-gray-400 text-lg">ไม่พบร้านอาหาร</p>
            <p className="text-gray-500 dark:text-gray-500 mt-2">ลองค้นหาด้วยคำอื่นหรือเปลี่ยนหมวดหมู่</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                ร้านอาหารทั้งหมด
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                พบ {restaurants.length} ร้าน
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurants.map((restaurant) => (
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
      <button
        onClick={() => {
          // Open chatbot
          window.location.href = '/chatbot';
        }}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all hover:scale-110 z-50"
        title="เปิดแชทบอท"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      </button>

      {/* Footer */}
      <Footer />
    </div>
  );
}
