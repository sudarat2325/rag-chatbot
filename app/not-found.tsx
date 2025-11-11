'use client';

import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-24 h-24 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="w-12 h-12 text-orange-600 dark:text-orange-400" />
        </div>

        <h1 className="text-6xl font-bold text-orange-600 dark:text-orange-400 mb-4">
          404
        </h1>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          ไม่พบหน้าที่คุณค้นหา
        </h2>

        <p className="text-gray-600 dark:text-gray-400 mb-8">
          ขออภัย หน้าที่คุณกำลังมองหาอาจถูกย้าย ลบ หรือไม่เคยมีอยู่จริง
        </p>

        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold"
          >
            <Home className="w-5 h-5" />
            กลับหน้าหลัก
          </Link>

          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            ย้อนกลับ
          </button>
        </div>
      </div>
    </div>
  );
}
