'use client';

import { TrendingUp } from 'lucide-react';

interface TopSellingItem {
  id: string;
  name: string;
  quantity: number;
  revenue: number;
}

interface TopSellingItemsProps {
  items: TopSellingItem[];
}

export function TopSellingItems({ items }: TopSellingItemsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-orange-500" />
        สินค้าขายดี
      </h3>
      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            ยังไม่มีข้อมูล
          </p>
        ) : (
          items.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-bold text-sm">
                  {index + 1}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    ขายได้ {item.quantity} รายการ
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-orange-600 dark:text-orange-400">
                  ฿{item.revenue.toLocaleString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
