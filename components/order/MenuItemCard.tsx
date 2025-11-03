'use client';

import React from 'react';
import { MenuItemWithOptions } from '@/lib/types';
import { formatCurrency } from '@/lib/utils/helpers';
import { Plus, Minus, Flame } from 'lucide-react';

interface MenuItemCardProps {
  item: MenuItemWithOptions;
  quantity?: number;
  onAdd?: () => void;
  onRemove?: () => void;
  onSelect?: () => void;
}

export function MenuItemCard({
  item,
  quantity = 0,
  onAdd,
  onRemove,
  onSelect,
}: MenuItemCardProps) {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow ${
        !item.isAvailable ? 'opacity-50' : ''
      }`}
    >
      <div className="flex gap-3 p-3">
        {/* Image */}
        <div className="flex-shrink-0">
          <div className="relative w-24 h-24 bg-gradient-to-br from-orange-200 to-pink-200 rounded-lg overflow-hidden">
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <span className="text-3xl">🍽️</span>
              </div>
            )}

            {/* Popular Badge */}
            {item.isPopular && (
              <div className="absolute top-1 left-1">
                <div className="bg-red-500 text-white px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  ยอดนิยม
                </div>
              </div>
            )}

            {/* Out of Stock */}
            {!item.isAvailable && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <span className="text-white text-xs font-semibold">
                  หมด
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4
            className="font-semibold text-gray-900 mb-1 cursor-pointer hover:text-orange-600"
            onClick={onSelect}
          >
            {item.name}
          </h4>

          {item.description && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
              {item.description}
            </p>
          )}

          {/* Category */}
          <div className="text-xs text-gray-500 mb-2">{item.category}</div>

          {/* Price and Actions */}
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-orange-600">
              {formatCurrency(item.price)}
            </span>

            {/* Add/Remove Buttons */}
            {item.isAvailable && (
              <div className="flex items-center gap-2">
                {quantity > 0 ? (
                  <div className="flex items-center gap-2 bg-orange-100 rounded-full px-2 py-1">
                    <button
                      onClick={onRemove}
                      className="w-6 h-6 flex items-center justify-center bg-white rounded-full shadow-sm hover:bg-gray-50"
                    >
                      <Minus className="w-4 h-4 text-orange-600" />
                    </button>
                    <span className="font-semibold text-orange-600 min-w-[20px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={onAdd}
                      className="w-6 h-6 flex items-center justify-center bg-orange-500 rounded-full shadow-sm hover:bg-orange-600"
                    >
                      <Plus className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={onAdd}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1 rounded-full text-sm font-semibold transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    เพิ่ม
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
