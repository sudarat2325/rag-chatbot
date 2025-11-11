'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { ReviewCard } from '@/components/review/ReviewCard';
import {  Clock, MapPin, Star, ShoppingCart, Plus, Minus, MessageSquare, Heart } from 'lucide-react';
import Link from 'next/link';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isAvailable: boolean;
}

interface Restaurant {
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
  address: string;
  categories: string;
}

interface Favorite {
  restaurantId: string;
}

interface Review {
  id: string;
  foodRating: number;
  deliveryRating: number;
  overallRating: number;
  comment: string;
  createdAt: string;
  customer: {
    name: string;
    avatar?: string;
  };
}

export default function RestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ทั้งหมด');
  const [cart, setCart] = useState<Map<string, number>>(new Map());
  const [userId, setUserId] = useState<string | undefined>();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showReviews, setShowReviews] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
      checkIfFavorite(storedUserId);
    }
    fetchRestaurantData();
  }, [id]);

  const checkIfFavorite = async (userId: string) => {
    try {
      const response = await fetch(`/api/favorites?userId=${userId}`);
      const data = await response.json();
      if (data.success) {
        const favorites = (data.data || []) as Favorite[];
        const isFav = favorites.some((fav) => fav.restaurantId === id);
        setIsFavorite(isFav);
      }
    } catch (error) {
      console.error('Error checking favorite:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!userId) {
      alert('กรุณาเข้าสู่ระบบเพื่อเพิ่มรายการโปรด');
      return;
    }

    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        // Remove from favorites
        const response = await fetch(`/api/favorites?userId=${userId}&restaurantId=${id}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (data.success) {
          setIsFavorite(false);
        }
      } else {
        // Add to favorites
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, restaurantId: id }),
        });
        const data = await response.json();
        if (data.success) {
          setIsFavorite(true);
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const fetchRestaurantData = async () => {
    try {
      setLoading(true);
      // Fetch restaurant details
      const restaurantRes = await fetch(`/api/restaurants/${id}`);
      const restaurantData = await restaurantRes.json();

      if (restaurantData.success) {
        setRestaurant(restaurantData.data as Restaurant);
      }

      // Fetch menu items
      const menuRes = await fetch(`/api/menu?restaurantId=${id}`);
      const menuData = await menuRes.json();

      if (menuData.success) {
        setMenuItems(menuData.data as MenuItem[]);
      }

      // Fetch reviews
      const reviewsRes = await fetch(`/api/reviews?restaurantId=${id}&limit=5`);
      const reviewsData = await reviewsRes.json();

      if (reviewsData.success) {
        setReviews(reviewsData.data as Review[]);
      }
    } catch (error) {
      console.error('Error fetching restaurant data:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['ทั้งหมด', ...new Set(menuItems.map(item => item.category))];

  const filteredMenu = selectedCategory === 'ทั้งหมด'
    ? menuItems
    : menuItems.filter(item => item.category === selectedCategory);

  const addToCart = (itemId: string) => {
    setCart(prev => new Map(prev).set(itemId, (prev.get(itemId) || 0) + 1));
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const newCart = new Map(prev);
      const current = newCart.get(itemId) || 0;
      if (current <= 1) {
        newCart.delete(itemId);
      } else {
        newCart.set(itemId, current - 1);
      }
      return newCart;
    });
  };

  const getTotalItems = () => {
    return Array.from(cart.values()).reduce((sum, qty) => sum + qty, 0);
  };

  const getTotalPrice = () => {
    return Array.from(cart.entries()).reduce((sum, [itemId, qty]) => {
      const item = menuItems.find(m => m.id === itemId);
      return sum + (item?.price || 0) * qty;
    }, 0);
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

  if (!restaurant) {
    return (
      <MainLayout userId={userId}>
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ไม่พบร้านอาหาร</h1>
          <Link href="/food" className="text-orange-500 hover:text-orange-600 mt-4 inline-block">
            กลับไปหน้าหลัก
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout userId={userId} cartItemCount={getTotalItems()}>
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen pb-24">
        {/* Restaurant Cover */}
        <div className="relative h-64 bg-gradient-to-r from-orange-400 to-red-400">
          {restaurant.coverImage && (
            <img
              src={restaurant.coverImage}
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        </div>

        {/* Restaurant Info */}
        <div className="container mx-auto px-4 -mt-20 relative z-10">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <div className="flex items-start gap-4">
              {/* Logo */}
              {restaurant.logo && (
                <img
                  src={restaurant.logo}
                  alt={restaurant.name}
                  className="w-24 h-24 rounded-lg object-cover border-4 border-white dark:border-gray-700"
                />
              )}

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {restaurant.name}
                  </h1>
                  <button
                    onClick={toggleFavorite}
                    disabled={favoriteLoading}
                    className={`p-2 rounded-full transition-colors ${
                      isFavorite
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-500'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-red-500'
                    }`}
                    title={isFavorite ? 'ลบออกจากรายการโปรด' : 'เพิ่มในรายการโปรด'}
                  >
                    <Heart
                      className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`}
                    />
                  </button>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  {restaurant.description}
                </p>

                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{restaurant.rating.toFixed(1)}</span>
                    <span className="text-gray-500">({restaurant.totalReviews} รีวิว)</span>
                  </div>

                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>{restaurant.estimatedTime}</span>
                  </div>

                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span>ค่าส่ง {restaurant.deliveryFee} บาท</span>
                  </div>
                </div>

                {restaurant.minimumOrder > 0 && (
                  <div className="mt-3 px-3 py-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <p className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                      💰 ยอดสั่งซื้อขั้นต่ำ {restaurant.minimumOrder} บาท
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Menu Categories */}
        <div className="sticky top-16 z-20 bg-white dark:bg-gray-800 border-b dark:border-gray-700 mt-6">
          <div className="container mx-auto px-4 py-4">
            <div className="flex gap-2 overflow-x-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap font-medium text-sm transition-colors ${
                    cat === selectedCategory
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMenu.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Item Image */}
                <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {!item.isAvailable && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white font-semibold">หมด</span>
                    </div>
                  )}
                </div>

                {/* Item Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                    {item.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-orange-500">
                      ฿{item.price}
                    </span>

                    {item.isAvailable && (
                      cart.has(item.id) ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/40 flex items-center justify-center"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-semibold text-gray-900 dark:text-white w-6 text-center">
                            {cart.get(item.id)}
                          </span>
                          <button
                            onClick={() => addToCart(item.id)}
                            className="w-8 h-8 rounded-full bg-orange-500 text-white hover:bg-orange-600 flex items-center justify-center"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(item.id)}
                          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          เพิ่ม
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredMenu.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">ไม่พบเมนูในหมวดหมู่นี้</p>
            </div>
          )}

          {/* Reviews Section */}
          {reviews.length > 0 && (
            <div className="mt-12">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-orange-500" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">รีวิวจากลูกค้า</h2>
                  </div>
                  <button
                    onClick={() => setShowReviews(!showReviews)}
                    className="text-orange-500 hover:text-orange-600 font-medium"
                  >
                    {showReviews ? 'ซ่อน' : `ดูทั้งหมด (${restaurant?.totalReviews || 0})`}
                  </button>
                </div>

                {/* Rating Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 p-6 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-orange-500 mb-2">
                      {restaurant?.rating.toFixed(1)}
                    </div>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < Math.round(restaurant?.rating || 0)
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      จาก {restaurant?.totalReviews} รีวิว
                    </p>
                  </div>
                  <div className="col-span-2 flex items-center justify-center text-center text-gray-600 dark:text-gray-400">
                    <p>คะแนนเฉลี่ยจากประสบการณ์ของลูกค้าที่สั่งอาหารจากร้านนี้</p>
                  </div>
                </div>

                {/* Review List */}
                <div className="space-y-4">
                  {(showReviews ? reviews : reviews.slice(0, 2)).map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cart Summary (Fixed Bottom) */}
        {getTotalItems() > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 shadow-lg z-30">
            <div className="container mx-auto px-4 py-4">
              {/* Minimum Order Warning */}
              {restaurant && getTotalPrice() < restaurant.minimumOrder && (
                <div className="mb-3 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg">
                  <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
                    ⚠️ ยอดขั้นต่ำ ฿{restaurant.minimumOrder} (ยังขาดอีก ฿{(restaurant.minimumOrder - getTotalPrice()).toFixed(2)})
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <ShoppingCart className="w-5 h-5 text-orange-500" />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {getTotalItems()} รายการ
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-orange-500">
                    ฿{getTotalPrice().toFixed(2)}
                  </p>
                </div>

                <button
                  onClick={() => {
                    // Check minimum order
                    if (restaurant.minimumOrder && getTotalPrice() < restaurant.minimumOrder) {
                      return; // Don't proceed if below minimum
                    }

                    // Save cart to localStorage before checkout
                    const cartData = Array.from(cart.entries()).map(([itemId, quantity]) => {
                      const menuItem = menuItems.find(m => m.id === itemId);
                      return menuItem ? {
                        menuItemId: itemId,
                        name: menuItem.name,
                        price: menuItem.price,
                        quantity
                      } : null;
                    }).filter(Boolean);
                    localStorage.setItem('cart', JSON.stringify(cartData));
                    localStorage.setItem('cartRestaurantId', id);

                    // Navigate to checkout
                    router.push(`/checkout?restaurantId=${id}`);
                  }}
                  disabled={restaurant.minimumOrder ? getTotalPrice() < restaurant.minimumOrder : false}
                  className="px-8 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-orange-500"
                >
                  สั่งซื้อ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
