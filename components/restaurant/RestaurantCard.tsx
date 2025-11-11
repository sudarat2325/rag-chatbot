'use client';

import React from 'react';
import { RestaurantWithDetails } from '@/lib/types';
import { formatCurrency } from '@/lib/utils/helpers';
import { Star, Clock, Bike, Flame, Sparkles } from 'lucide-react';

interface RestaurantCardProps {
  restaurant: RestaurantWithDetails;
  onClick?: () => void;
}

export function RestaurantCard({ restaurant, onClick }: RestaurantCardProps) {
  return (
    <div
      onClick={onClick}
      className="group relative overflow-hidden rounded-3xl border border-orange-100/70 bg-white shadow-[0_15px_60px_rgba(249,115,22,0.08)] transition-all hover:-translate-y-1 hover:shadow-[0_25px_80px_rgba(249,115,22,0.15)] cursor-pointer"
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

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* Status Badge */}
        <div className="absolute top-4 right-4">
          {restaurant.isOpen ? (
            <span className="bg-emerald-500/90 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
              เปิดอยู่
            </span>
          ) : (
            <span className="bg-gray-500/90 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
              ปิดแล้ว
            </span>
          )}
        </div>

        {/* Logo */}
        {restaurant.logo && (
          <div className="absolute -bottom-6 left-6 w-20 h-20 bg-white rounded-2xl border-4 border-white shadow-xl overflow-hidden">
            <img
              src={restaurant.logo}
              alt={`${restaurant.name} logo`}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 pt-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-1">
              {restaurant.name}
            </h3>
            {restaurant.description && (
              <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                {restaurant.description}
              </p>
            )}
          </div>
          <div className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600">
            <Flame className="w-3.5 h-3.5" />
            {restaurant.popularityScore ?? 'ฮิต'}
          </div>
        </div>

        {/* Categories */}
        {restaurant.categories && restaurant.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {restaurant.categories.slice(0, 3).map((cat, idx) => (
              <span
                key={idx}
                className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full"
              >
                {cat}
              </span>
            ))}
          </div>
        )}

        {/* Info Row */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4 text-gray-800">
            {/* Rating */}
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="font-semibold">{restaurant.rating ?? '4.9'}</span>
              {restaurant.totalReviews && (
                <span className="text-gray-400">({restaurant.totalReviews})</span>
              )}
            </div>

            {/* Delivery Time */}
            {restaurant.estimatedTime && (
              <div className="flex items-center gap-1 text-gray-500">
                <Clock className="w-4 h-4" />
                <span>{restaurant.estimatedTime}</span>
              </div>
            )}
          </div>

          {/* Distance */}
          {restaurant.distance !== undefined && (
            <div className="flex items-center gap-1 text-gray-500">
              <Bike className="w-4 h-4" />
              <span>{restaurant.distance} กม.</span>
            </div>
          )}
        </div>

        {/* Delivery Info */}
        <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-3 flex items-center justify-between text-sm">
          <span className="text-gray-500">
            ขั้นต่ำ {formatCurrency(restaurant.minimumOrder)}
          </span>
          <div className="flex items-center gap-2 font-semibold text-orange-600">
            <Sparkles className="w-4 h-4" />
            ค่าส่ง {formatCurrency(restaurant.deliveryFee)}
          </div>
        </div>
      </div>
    </div>
  );
}
