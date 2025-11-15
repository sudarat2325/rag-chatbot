'use client';

import { RefreshCw } from 'lucide-react';

interface UpdatePromptProps {
  onUpdate: () => void;
}

export function UpdatePrompt({ onUpdate }: UpdatePromptProps) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-xl p-4 text-white flex items-center gap-3 max-w-md">
        <RefreshCw className="w-5 h-5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold">เวอร์ชันใหม่พร้อมใช้งาน!</p>
          <p className="text-xs text-blue-100">อัปเดตเพื่อใช้งานฟีเจอร์ล่าสุด</p>
        </div>
        <button
          onClick={onUpdate}
          className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors"
        >
          อัปเดต
        </button>
      </div>
    </div>
  );
}
