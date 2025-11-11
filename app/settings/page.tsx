'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  Bell,
  Moon,
  Globe,
  Shield,
  CreditCard,
  HelpCircle,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const [userId, setUserId] = useState<string | undefined>();
  const [settings, setSettings] = useState({
    notifications: {
      orderUpdates: true,
      promotions: true,
      newRestaurants: false,
      newsletter: false,
    },
    preferences: {
      darkMode: false,
      language: 'th',
    },
  });

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
      loadPreferences(storedUserId);
    }

    // Check system dark mode
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setSettings((prev) => ({
        ...prev,
        preferences: { ...prev.preferences, darkMode: true },
      }));
      document.documentElement.classList.add('dark');
    }
  }, []);

  const loadPreferences = async (userId: string) => {
    try {
      const response = await fetch(`/api/preferences?userId=${userId}`);
      const data = await response.json();

      if (data.success) {
        const prefs = data.data;
        setSettings({
          notifications: {
            orderUpdates: prefs.orderUpdates,
            promotions: prefs.promotions,
            newRestaurants: prefs.newRestaurants,
            newsletter: prefs.newsletter,
          },
          preferences: {
            darkMode: prefs.darkMode,
            language: prefs.language,
          },
        });

        // Apply dark mode if enabled
        if (prefs.darkMode) {
          document.documentElement.classList.add('dark');
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const updateNotificationSetting = async (key: keyof typeof settings.notifications) => {
    const newSettings = {
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: !settings.notifications[key],
      },
    };
    setSettings(newSettings);

    // Save to database
    if (userId) {
      try {
        await fetch('/api/preferences', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            [key]: newSettings.notifications[key],
          }),
        });
      } catch (error) {
        console.error('Error saving preferences:', error);
      }
    }
  };

  const toggleDarkMode = async () => {
    const newDarkMode = !settings.preferences.darkMode;
    const newSettings = {
      ...settings,
      preferences: {
        ...settings.preferences,
        darkMode: newDarkMode,
      },
    };
    setSettings(newSettings);

    // Toggle dark mode class
    document.documentElement.classList.toggle('dark');

    // Save to database
    if (userId) {
      try {
        await fetch('/api/preferences', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            darkMode: newDarkMode,
          }),
        });
      } catch (error) {
        console.error('Error saving dark mode:', error);
      }
    }
  };

  const handleLogout = () => {
    if (confirm('คุณต้องการออกจากระบบหรือไม่?')) {
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      window.location.href = '/login';
    }
  };

  if (!userId) {
    return (
      <MainLayout userId={userId}>
        <div className="container mx-auto px-4 py-12 text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            กรุณาเข้าสู่ระบบ
          </h1>
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            เข้าสู่ระบบ
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout userId={userId}>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              การตั้งค่า
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              จัดการการตั้งค่าบัญชีและการแจ้งเตือน
            </p>
          </div>

          {/* Notifications Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md mb-6">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Bell className="w-6 h-6 text-orange-500" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  การแจ้งเตือน
                </h2>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    อัพเดทออเดอร์
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    แจ้งเตือนเมื่อสถานะออเดอร์เปลี่ยนแปลง
                  </p>
                </div>
                <button
                  onClick={() => updateNotificationSetting('orderUpdates')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.notifications.orderUpdates
                      ? 'bg-orange-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.notifications.orderUpdates
                        ? 'translate-x-6'
                        : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    โปรโมชั่น
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    รับข้อเสนอพิเศษและส่วนลด
                  </p>
                </div>
                <button
                  onClick={() => updateNotificationSetting('promotions')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.notifications.promotions
                      ? 'bg-orange-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.notifications.promotions
                        ? 'translate-x-6'
                        : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    ร้านอาหารใหม่
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    แจ้งเตือนเมื่อมีร้านใหม่เข้าร่วม
                  </p>
                </div>
                <button
                  onClick={() => updateNotificationSetting('newRestaurants')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.notifications.newRestaurants
                      ? 'bg-orange-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.notifications.newRestaurants
                        ? 'translate-x-6'
                        : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    จดหมายข่าว
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    รับข่าวสารทางอีเมล
                  </p>
                </div>
                <button
                  onClick={() => updateNotificationSetting('newsletter')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.notifications.newsletter
                      ? 'bg-orange-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.notifications.newsletter
                        ? 'translate-x-6'
                        : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md mb-6">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                ความชอบ
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      โหมดมืด
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      เปลี่ยนธีมเป็นสีเข้ม
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.preferences.darkMode
                      ? 'bg-orange-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.preferences.darkMode
                        ? 'translate-x-6'
                        : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <Link
                href="/settings/language"
                className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      ภาษา
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      ไทย (Thai)
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md mb-6">
            <div className="p-6 space-y-2">
              <Link
                href="/profile"
                className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    บัญชีและความปลอดภัย
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>

              <Link
                href="/addresses"
                className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    วิธีการชำระเงิน
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>

              <Link
                href="/help"
                className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    ช่วยเหลือและสนับสนุน
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-4 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium"
          >
            <LogOut className="w-5 h-5" />
            ออกจากระบบ
          </button>
        </div>
      </div>
    </MainLayout>
  );
}
