'use client';

import { useEffect, useState } from 'react';
import { Star, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';

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
  response?: string;
  respondedAt?: string;
}

interface ReviewListProps {
  restaurantId: string;
  limit?: number;
}

export function ReviewList({ restaurantId, limit }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    distribution: {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0
    }
  });

  useEffect(() => {
    fetchReviews();
  }, [restaurantId]);

  const fetchReviews = async () => {
    try {
      const url = limit
        ? `/api/reviews?restaurantId=${restaurantId}&limit=${limit}`
        : `/api/reviews?restaurantId=${restaurantId}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setReviews(data.data.reviews || []);
        setStats({
          totalReviews: data.data.totalReviews || 0,
          averageRating: data.data.averageRating || 0,
          distribution: data.data.distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        });
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'text-yellow-500 fill-yellow-500'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <Star className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">ยังไม่มีรีวิว</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          {/* Average Rating */}
          <div className="text-center md:border-r md:border-gray-300 dark:border-gray-600 md:pr-6">
            <div className="text-5xl font-bold text-orange-600 mb-2">
              {stats.averageRating.toFixed(1)}
            </div>
            <div className="flex justify-center mb-2">
              {renderStars(Math.round(stats.averageRating))}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              จาก {stats.totalReviews} รีวิว
            </p>
          </div>

          {/* Rating Distribution */}
          <div className="flex-1 w-full">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.distribution[rating as keyof typeof stats.distribution] || 0;
              const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;

              return (
                <div key={rating} className="flex items-center gap-3 mb-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300 w-8">
                    {rating} <Star className="inline w-3 h-3 fill-yellow-500 text-yellow-500" />
                  </span>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
          >
            {/* Review Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center text-white font-semibold">
                  {review.customer.avatar ? (
                    <img
                      src={review.customer.avatar}
                      alt={review.customer.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {review.customer.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(new Date(review.createdAt), {
                      addSuffix: true,
                      locale: th
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                  <Star className="w-4 h-4 fill-white" />
                  {review.overallRating}
                </div>
              </div>
            </div>

            {/* Ratings */}
            <div className="flex gap-6 mb-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">อาหาร: </span>
                {renderStars(review.foodRating)}
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">การจัดส่ง: </span>
                {renderStars(review.deliveryRating)}
              </div>
            </div>

            {/* Comment */}
            <p className="text-gray-700 dark:text-gray-300 mb-4">{review.comment}</p>

            {/* Restaurant Response */}
            {review.response && (
              <div className="mt-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border-l-4 border-orange-500">
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  ตอบกลับจากร้าน
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {review.response}
                </p>
                {review.respondedAt && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {formatDistanceToNow(new Date(review.respondedAt), {
                      addSuffix: true,
                      locale: th
                    })}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Load More */}
      {limit && reviews.length >= limit && (
        <div className="text-center">
          <button className="px-6 py-2 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
            ดูรีวิวทั้งหมด
          </button>
        </div>
      )}
    </div>
  );
}
