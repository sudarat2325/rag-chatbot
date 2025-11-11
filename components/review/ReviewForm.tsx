'use client';

import { useState } from 'react';
import { Star, Send } from 'lucide-react';

interface ReviewFormProps {
  restaurantId: string;
  orderId: string;
  customerId: string;
  onSubmit: (data: {
    orderId: string;
    customerId: string;
    restaurantId: string;
    foodRating: number;
    deliveryRating: number;
    comment: string;
  }) => Promise<void>;
  onCancel?: () => void;
}

export function ReviewForm({ restaurantId, orderId, customerId, onSubmit, onCancel }: ReviewFormProps) {
  const [foodRating, setFoodRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [hoverFoodRating, setHoverFoodRating] = useState(0);
  const [hoverDeliveryRating, setHoverDeliveryRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (foodRating === 0 || deliveryRating === 0) {
      alert('กรุณาให้คะแนนทั้งอาหารและการจัดส่ง');
      return;
    }

    if (comment.trim().length < 10) {
      alert('กรุณาเขียนรีวิวอย่างน้อย 10 ตัวอักษร');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        orderId,
        customerId,
        restaurantId,
        foodRating,
        deliveryRating,
        comment
      });
      setFoodRating(0);
      setDeliveryRating(0);
      setComment('');
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('เกิดข้อผิดพลาดในการส่งรีวิว');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        เขียนรีวิว
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Food Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            คะแนนอาหาร
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setFoodRating(star)}
                onMouseEnter={() => setHoverFoodRating(star)}
                onMouseLeave={() => setHoverFoodRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= (hoverFoodRating || foodRating)
                      ? 'text-yellow-500 fill-yellow-500'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              </button>
            ))}
            {foodRating > 0 && (
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                {foodRating === 1 && 'แย่มาก'}
                {foodRating === 2 && 'แย่'}
                {foodRating === 3 && 'ปานกลาง'}
                {foodRating === 4 && 'ดี'}
                {foodRating === 5 && 'ดีเยี่ยม'}
              </span>
            )}
          </div>
        </div>

        {/* Delivery Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            คะแนนการจัดส่ง
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setDeliveryRating(star)}
                onMouseEnter={() => setHoverDeliveryRating(star)}
                onMouseLeave={() => setHoverDeliveryRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= (hoverDeliveryRating || deliveryRating)
                      ? 'text-yellow-500 fill-yellow-500'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              </button>
            ))}
            {deliveryRating > 0 && (
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                {deliveryRating === 1 && 'แย่มาก'}
                {deliveryRating === 2 && 'แย่'}
                {deliveryRating === 3 && 'ปานกลาง'}
                {deliveryRating === 4 && 'ดี'}
                {deliveryRating === 5 && 'ดีเยี่ยม'}
              </span>
            )}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            รีวิวของคุณ
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="บอกเล่าประสบการณ์ของคุณ..."
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
            required
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {comment.length} / 500 ตัวอักษร (ขั้นต่ำ 10)
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting || foodRating === 0 || deliveryRating === 0 || comment.trim().length < 10}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                กำลังส่ง...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                ส่งรีวิว
              </>
            )}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              ยกเลิก
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
