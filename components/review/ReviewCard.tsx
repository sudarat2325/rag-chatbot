'use client';

import { Star, User } from 'lucide-react';

interface Review {
  id: string;
  foodRating: number;
  deliveryRating: number;
  overallRating: number;
  comment: string;
  createdAt: string;
  customer: {
    name: string;
  };
}

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
            <User className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{review.customer.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(review.createdAt).toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < review.overallRating
                  ? 'text-yellow-500 fill-yellow-500'
                  : 'text-gray-300 dark:text-gray-600'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Rating Details */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="text-xs">
          <span className="text-gray-500 dark:text-gray-400">อาหาร:</span>
          <div className="flex items-center gap-1 mt-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${
                  i < review.foodRating
                    ? 'text-yellow-500 fill-yellow-500'
                    : 'text-gray-300 dark:text-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
        <div className="text-xs">
          <span className="text-gray-500 dark:text-gray-400">การจัดส่ง:</span>
          <div className="flex items-center gap-1 mt-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${
                  i < review.deliveryRating
                    ? 'text-yellow-500 fill-yellow-500'
                    : 'text-gray-300 dark:text-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
        {review.comment}
      </p>
    </div>
  );
}
