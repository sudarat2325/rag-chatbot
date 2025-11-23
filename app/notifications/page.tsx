'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { useRoleGuard } from '@/lib/hooks/useRoleGuard';
import {
  Bell,
  Package,
  Gift,
  Star,
  CheckCircle,
  Info,
  Trash2,
  Check,
} from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  orderId?: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { session, status } = useRoleGuard();
  const userId = session?.user?.id;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    if (status === 'loading') return;
    if (userId) {
      fetchNotifications(userId);
    } else {
      setLoading(false);
    }
  }, [userId, status]);

  const fetchNotifications = async (uid: string) => {
    if (!uid) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/notifications?userId=${uid}&limit=100`);
      const data = await response.json();

      if (data.success) {
        // API returns { notifications, unreadCount }
        if (data.data?.notifications && Array.isArray(data.data.notifications)) {
          setNotifications(data.data.notifications);
        } else if (Array.isArray(data.data)) {
          // Fallback for old response format
          setNotifications(data.data);
        } else {
          setNotifications([]);
        }
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!userId) return;

    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, notificationId }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notificationId ? { ...notif, isRead: true } : notif
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;

    try {
      const unreadIds = notifications
        .filter((n) => !n.isRead)
        .map((n) => n.id);

      for (const id of unreadIds) {
        await fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, notificationId: id }),
        });
      }

      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!userId) return;

    // Optimistic update
    const deletedNotification = notifications.find((n) => n.id === notificationId);
    setNotifications((prev) =>
      prev.filter((notif) => notif.id !== notificationId)
    );

    try {
      const response = await fetch(`/api/notifications?notificationId=${notificationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        // Rollback on error
        if (deletedNotification) {
          setNotifications((prev) => [...prev, deletedNotification].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ));
        }
        alert('ไม่สามารถลบการแจ้งเตือนได้ กรุณาลองใหม่อีกครั้ง');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      // Rollback on error
      if (deletedNotification) {
        setNotifications((prev) => [...prev, deletedNotification].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      }
      alert('เกิดข้อผิดพลาดในการลบการแจ้งเตือน');
    }
  };

  if (status === 'loading') {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">กำลังโหลด...</p>
        </div>
      </MainLayout>
    );
  }

  if (!userId) {
    return null;
  }

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read first
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    // Navigate to order if available
    if (notification.orderId && notification.orderId !== 'demo-order-id') {
      try {
        router.push(`/orders/${notification.orderId}`);
      } catch (error) {
        console.error('Error navigating to order:', error);
      }
    } else if (notification.type === 'PROMOTION') {
      router.push('/promotions');
    } else if (notification.type.startsWith('ORDER_')) {
      // Handle all ORDER_* notification types
      router.push('/orders');
    }
  };

  const getNotificationIcon = (type: string) => {
    // Handle all ORDER_* types
    if (type.startsWith('ORDER_')) {
      return <Package className="w-5 h-5 text-orange-500" />;
    }

    switch (type) {
      case 'PROMOTION':
        return <Gift className="w-5 h-5 text-pink-500" />;
      case 'REVIEW':
        return <Star className="w-5 h-5 text-yellow-500" />;
      case 'DELIVERY':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    // Handle all ORDER_* types
    if (type.startsWith('ORDER_')) {
      return 'bg-orange-50 dark:bg-orange-900/10';
    }

    switch (type) {
      case 'PROMOTION':
        return 'bg-pink-50 dark:bg-pink-900/10';
      case 'REVIEW':
        return 'bg-yellow-50 dark:bg-yellow-900/10';
      case 'DELIVERY':
        return 'bg-green-50 dark:bg-green-900/10';
      default:
        return 'bg-blue-50 dark:bg-blue-900/10';
    }
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notif.isRead;
    if (filter === 'read') return notif.isRead;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <MainLayout userId={userId}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </MainLayout>
    );
  }

  if (!userId) {
    return (
      <MainLayout userId={userId}>
        <div className="container mx-auto px-4 py-12 text-center">
          <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            กรุณาเข้าสู่ระบบ
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            เข้าสู่ระบบเพื่อดูการแจ้งเตือนของคุณ
          </p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            เข้าสู่ระบบ
          </button>
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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Bell className="w-8 h-8 text-orange-500" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    การแจ้งเตือน
                  </h1>
                  {unreadCount > 0 && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      คุณมี {unreadCount} การแจ้งเตือนที่ยังไม่ได้อ่าน
                    </p>
                  )}
                </div>
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                >
                  <Check className="w-4 h-4" />
                  อ่านทั้งหมด
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  ทั้งหมด ({notifications.length})
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'unread'
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  ยังไม่อ่าน ({unreadCount})
                </button>
                <button
                  onClick={() => setFilter('read')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'read'
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  อ่านแล้ว ({notifications.length - unreadCount})
                </button>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          {filteredNotifications.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 text-center">
              <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                ไม่มีการแจ้งเตือน
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {filter === 'unread'
                  ? 'คุณได้อ่านการแจ้งเตือนทั้งหมดแล้ว'
                  : filter === 'read'
                  ? 'ยังไม่มีการแจ้งเตือนที่อ่านแล้ว'
                  : 'ยังไม่มีการแจ้งเตือนในระบบ'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer overflow-hidden ${
                    !notification.isRead ? 'ring-2 ring-orange-500 ring-opacity-50' : ''
                  }`}
                >
                  <div
                    onClick={() => handleNotificationClick(notification)}
                    className="p-4"
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`p-3 rounded-xl ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h3 className={`text-base font-semibold mb-1 ${
                              !notification.isRead
                                ? 'text-gray-900 dark:text-white'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}>
                              {notification.title}
                            </h3>
                            <p className={`text-sm ${
                              !notification.isRead
                                ? 'text-gray-700 dark:text-gray-300'
                                : 'text-gray-500 dark:text-gray-500'
                            }`}>
                              {notification.message}
                            </p>
                          </div>

                          {/* Unread Badge */}
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-2"></div>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            {new Date(notification.createdAt).toLocaleDateString('th-TH', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="text-red-500 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
