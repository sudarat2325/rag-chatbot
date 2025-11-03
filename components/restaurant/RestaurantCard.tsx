'use client';

import React from 'react';
import { RestaurantWithDetails } from '@/lib/types';
import { formatCurrency } from '@/lib/utils/helpers';
import { Star, Clock, Bike } from 'lucide-react';

interface RestaurantCardProps {
  restaurant: RestaurantWithDetails;
  onClick?: () => void;
}

export function RestaurantCard({ restaurant, onClick }: RestaurantCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
    >
      {/* Cover Image */}
      <div className="relative h-48 bg-gradient-to-r from-orange-400 to-pink-500">
        {restaurant.coverImage ? (
          <img
            src={restaurant.coverImage}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-white text-4xl font-bold">
              {restaurant.name.charAt(0)}
            </span>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          {restaurant.isOpen ? (
            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
              เปิดอยู่
            </span>
          ) : (
            <span className="bg-gray-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
              ปิดแล้ว
            </span>
          )}
        </div>

        {/* Logo */}
        {restaurant.logo && (
          <div className="absolute bottom-2 left-2 w-16 h-16 bg-white rounded-full border-4 border-white shadow-lg">
            <img
              src={restaurant.logo}
              alt={`${restaurant.name} logo`}
              className="w-full h-full object-cover rounded-full"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          {restaurant.name}
        </h3>

        {restaurant.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {restaurant.description}
          </p>
        )}

        {/* Categories */}
        {restaurant.categories && restaurant.categories.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {restaurant.categories.slice(0, 3).map((cat, idx) => (
              <span
                key={idx}
                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
              >
                {cat}
              </span>
            ))}
          </div>
        )}

        {/* Info Row */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            {/* Rating */}
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="font-semibold">{restaurant.rating}</span>
              <span className="text-gray-500">({restaurant.totalReviews})</span>
            </div>

            {/* Delivery Time */}
            {restaurant.estimatedTime && (
              <div className="flex items-center gap-1 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{restaurant.estimatedTime}</span>
              </div>
            )}
          </div>

          {/* Distance */}
          {restaurant.distance !== undefined && (
            <div className="flex items-center gap-1 text-gray-600">
              <Bike className="w-4 h-4" />
              <span>{restaurant.distance} กม.</span>
            </div>
          )}
        </div>

        {/* Delivery Info */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
          <span className="text-sm text-gray-600">
            ขั้นต่ำ {formatCurrency(restaurant.minimumOrder)}
          </span>
          <span className="text-sm font-semibold text-orange-600">
            ค่าส่ง {formatCurrency(restaurant.deliveryFee)}
          </span>
        </div>
      </div>
    </div>
  );
}
