'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        return;
      }

      const sessionResponse = await fetch('/api/auth/session');
      const sessionData = sessionResponse.ok ? await sessionResponse.json() : null;
      const user = sessionData?.user;

      if (!user?.id) {
        setError('ไม่สามารถดึงข้อมูลผู้ใช้ได้ กรุณาลองใหม่');
        return;
      }

      localStorage.setItem('userId', user.id);
      if (user.email) localStorage.setItem('userEmail', user.email);
      if (user.name) localStorage.setItem('userName', user.name);
      if (user.role) localStorage.setItem('userRole', user.role);

      let redirectPath = '/food';
      switch (user.role) {
        case 'ADMIN':
          redirectPath = '/admin';
          break;
        case 'RESTAURANT_OWNER':
          redirectPath = '/restaurant-dashboard';
          break;
        case 'DRIVER':
          redirectPath = '/driver/dashboard';
          break;
        default:
          redirectPath = '/food';
      }

      console.warn(`🔐 Login successful! Role: ${user.role} → Redirecting to ${redirectPath}`);
      router.push(redirectPath);
    } catch (err) {
      console.error('Login error:', err);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 mb-4">
            <div className="text-5xl">🍕</div>
            <span className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              FoodHub
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            เข้าสู่ระบบเพื่อสั่งอาหารอร่อย
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            เข้าสู่ระบบ
          </h1>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Quick Demo Login */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3 font-semibold">
              💡 ทดสอบระบบ - เลือก Role:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setFormData({ email: 'demo@foodhub.com', password: 'demo123' });
                }}
                className="px-3 py-2 bg-orange-500 text-white text-xs rounded-lg hover:bg-orange-600 transition-colors font-medium"
              >
                👤 ลูกค้า
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData({ email: 'owner1@example.com', password: 'password123' });
                }}
                className="px-3 py-2 bg-purple-500 text-white text-xs rounded-lg hover:bg-purple-600 transition-colors font-medium"
              >
                🏪 ร้านอาหาร
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData({ email: 'driver@example.com', password: 'password123' });
                }}
                className="px-3 py-2 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors font-medium"
              >
                🏍️ ไรเดอร์
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                อีเมล
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                รหัสผ่าน
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  จดจำฉันไว้
                </span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-orange-500 hover:text-orange-600"
              >
                ลืมรหัสผ่าน?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-red-600 focus:ring-4 focus:ring-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">หรือ</span>
            </div>
          </div>

          {/* Social Login */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => signIn('google', { callbackUrl: '/food' })}
              className="w-full py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-gray-700 dark:text-gray-300">เข้าสู่ระบบด้วย Google</span>
            </button>

            <button className="w-full py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span className="text-gray-700 dark:text-gray-300">เข้าสู่ระบบด้วย Facebook</span>
            </button>
          </div>

          {/* Sign Up Link */}
          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            ยังไม่มีบัญชี?{' '}
            <Link href="/register" className="text-orange-500 hover:text-orange-600 font-semibold">
              สมัครสมาชิก
            </Link>
          </p>
        </div>

        {/* Quick Demo Access */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            ทดสอบระบบ:{' '}
            <button
              onClick={() => {
                setFormData({ email: 'demo@foodhub.com', password: 'demo123' });
              }}
              className="text-orange-500 hover:text-orange-600 underline"
            >
              ใช้ Demo Account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
