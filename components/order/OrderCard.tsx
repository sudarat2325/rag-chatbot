'use client';

import React from 'react';
import { OrderWithDetails } from '@/lib/types';
import {
  formatCurrency,
  formatDateTime,
  getOrderStatusText,
  getOrderStatusColor,
} from '@/lib/utils/helpers';
import { Package, MapPin, Clock } from 'lucide-react';

interface OrderCardProps {
  order: OrderWithDetails;
  onClick?: () => void;
  showDetails?: boolean;
}

export function OrderCard({ order, onClick, showDetails = false }: OrderCardProps) {
  const statusText = getOrderStatusText(order.status);
  const statusColor = getOrderStatusColor(order.status);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            <span className="font-semibold">{order.orderNumber}</span>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
            {statusText}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm opacity-90">
          <Clock className="w-4 h-4" />
          <span>{formatDateTime(order.createdAt)}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Restaurant */}
        <div className="flex items-center gap-3 mb-3">
          {order.restaurant.logo && (
            <img
              src={order.restaurant.logo}
              alt={order.restaurant.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          )}
          <div>
            <h4 className="font-semibold text-gray-900">
              {order.restaurant.name}
            </h4>
            <p className="text-sm text-gray-600">
              {order.items.length} รายการ
            </p>
          </div>
        </div>

        {/* Items */}
        {showDetails && (
          <div className="mb-3 space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {item.menuItem.image && (
                    <img
                      src={item.menuItem.image}
                      alt={item.menuItem.name}
                      className="w-10 h-10 rounded object-cover"
                    />
                  )}
                  <div>
                    <span className="font-medium">{item.menuItem.name}</span>
                    <span className="text-gray-500"> x{item.quantity}</span>
                  </div>
                </div>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Delivery Info */}
        {order.delivery && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="w-4 h-4 text-gray-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">สถานะการจัดส่ง</p>
                <p className="text-gray-600">
                  {order.delivery.driver ? (
                    <>
                      {order.delivery.driver.name} -{' '}
                      {order.delivery.driver.phone}
                    </>
                  ) : (
                    'กำลังหาคนส่ง...'
                  )}
                </p>
                {order.delivery.estimatedTime && (
                  <p className="text-gray-600">
                    เวลาโดยประมาณ: {order.delivery.estimatedTime}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Total */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <span className="text-gray-600">ยอดรวม</span>
          <span className="text-xl font-bold text-orange-600">
            {formatCurrency(order.total)}
          </span>
        </div>
      </div>
    </div>
  );
}
