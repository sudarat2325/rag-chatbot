'use client';

import { WifiOff } from 'lucide-react';

export function OfflineIndicator() {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
      <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg shadow-xl px-4 py-3 text-white flex items-center gap-2">
        <WifiOff className="w-5 h-5" />
        <span className="text-sm font-semibold">คุณออฟไลน์อยู่</span>
      </div>
    </div>
  );
}
