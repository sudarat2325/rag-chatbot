'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DriverPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard
    router.push('/driver/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">กำลังโหลด Driver Dashboard...</p>
      </div>
    </div>
  );
}
