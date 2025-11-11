'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Heart, Star, Clock, MapPin, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface Favorite {
  id: string;
  restaurantId: string;
  createdAt: string;
  restaurant: {
    id: string;
    name: string;
    description: string;
    logo: string;
    coverImage: string;
    rating: number;
    totalReviews: number;
    deliveryFee: number;
    minimumOrder: number;
    estimatedTime: string;
    categories: string;
    isOpen: boolean;
  };
}

export default function FavoritesPage() {
  const [userId, setUserId] = useState<string | undefined>();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
      fetchFavorites(storedUserId);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchFavorites = async (userId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/favorites?userId=${userId}`);
      const data = await response.json();

      if (data.success) {
        setFavorites(data.data);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (restaurantId: string) => {
    if (!userId) return;

    try {
      const response = await fetch(
        `/api/favorites?userId=${userId}&restaurantId=${restaurantId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (data.success) {
        setFavorites(favorites.filter((fav) => fav.restaurantId !== restaurantId));
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      alert('เกิดข้อผิดพลาดในการลบรายการโปรด');
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
          <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            กรุณาเข้าสู่ระบบ
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            เข้าสู่ระบบเพื่อดูรายการโปรดของคุณ
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
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
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Heart className="w-8 h-8 text-red-500 fill-current" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                รายการโปรด
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              ร้านอาหารที่คุณชื่นชอบ ({favorites.length} ร้าน)
            </p>
          </div>

          {/* Favorites Grid */}
          {favorites.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
              <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                ยังไม่มีรายการโปรด
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                เพิ่มร้านอาหารที่คุณชื่นชอบเพื่อเข้าถึงได้ง่ายขึ้น
              </p>
              <Link
                href="/food"
                className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                เลือกร้านอาหาร
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((favorite) => (
                <div
                  key={favorite.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden group"
                >
                  <Link href={`/restaurant/${favorite.restaurantId}`}>
                    {/* Cover Image */}
                    <div className="relative h-48 bg-gradient-to-r from-orange-400 to-red-400">
                      {favorite.restaurant.coverImage && (
                        <img
                          src={favorite.restaurant.coverImage}
                          alt={favorite.restaurant.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

                      {/* Status Badge */}
                      <div className="absolute top-3 right-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            favorite.restaurant.isOpen
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-500 text-white'
                          }`}
                        >
                          {favorite.restaurant.isOpen ? 'เปิดอยู่' : 'ปิดแล้ว'}
                        </span>
                      </div>

                      {/* Logo */}
                      {favorite.restaurant.logo && (
                        <div className="absolute bottom-3 left-3">
                          <img
                            src={favorite.restaurant.logo}
                            alt={favorite.restaurant.name}
                            className="w-16 h-16 rounded-lg object-cover border-2 border-white"
                          />
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Content */}
                  <div className="p-4">
                    <Link href={`/restaurant/${favorite.restaurantId}`}>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 hover:text-orange-500 transition-colors">
                        {favorite.restaurant.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {favorite.restaurant.description}
                      </p>
                    </Link>

                    {/* Stats */}
                    <div className="flex flex-wrap gap-3 text-sm mb-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">
                          {favorite.restaurant.rating.toFixed(1)}
                        </span>
                        <span className="text-gray-500">
                          ({favorite.restaurant.totalReviews})
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>{favorite.restaurant.estimatedTime}</span>
                      </div>

                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <MapPin className="w-4 h-4" />
                        <span>฿{favorite.restaurant.deliveryFee}</span>
                      </div>
                    </div>

                    {/* Categories */}
                    {favorite.restaurant.categories && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {favorite.restaurant.categories
                          .split(',')
                          .slice(0, 3)
                          .map((cat, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                            >
                              {cat.trim()}
                            </span>
                          ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link
                        href={`/restaurant/${favorite.restaurantId}`}
                        className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-center font-medium"
                      >
                        สั่งอาหาร
                      </Link>
                      <button
                        onClick={() => removeFavorite(favorite.restaurantId)}
                        className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                        title="ลบออกจากรายการโปรด"
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
