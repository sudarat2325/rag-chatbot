'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useToast as useToastContext } from '@/lib/context/ToastContext';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

// Export useToast from context
export { useToast } from '@/lib/context/ToastContext';

// ToastContainer component that displays all toasts
export function ToastContainer() {
  const { toasts, hideToast } = useToastContext();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md w-full pointer-events-none px-4">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          id={toast.id}
          title={toast.title}
          message={toast.message}
          type={toast.type}
          onClose={() => hideToast(toast.id)}
        />
      ))}
    </div>
  );
}

interface ToastItemProps {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
  onClose: () => void;
}

function ToastItem({ title, message, type, onClose }: ToastItemProps) {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const config = {
    success: {
      icon: CheckCircle,
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      iconColor: 'text-green-600 dark:text-green-400',
      title: 'text-green-900 dark:text-green-100',
      message: 'text-green-700 dark:text-green-300',
    },
    error: {
      icon: XCircle,
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      iconColor: 'text-red-600 dark:text-red-400',
      title: 'text-red-900 dark:text-red-100',
      message: 'text-red-700 dark:text-red-300',
    },
    warning: {
      icon: AlertTriangle,
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      title: 'text-yellow-900 dark:text-yellow-100',
      message: 'text-yellow-700 dark:text-yellow-300',
    },
    info: {
      icon: Info,
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      iconColor: 'text-blue-600 dark:text-blue-400',
      title: 'text-blue-900 dark:text-blue-100',
      message: 'text-blue-700 dark:text-blue-300',
    },
  };

  const settings = config[type];
  const Icon = settings.icon;

  return (
    <div
      className={`pointer-events-auto transform transition-all duration-300 ${
        isExiting ? 'translate-x-[120%] opacity-0' : 'translate-x-0 opacity-100'
      }`}
    >
      <div className={`${settings.bg} ${settings.border} border rounded-lg shadow-lg p-4 flex items-start gap-3`}>
        <div className={settings.iconColor}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold text-sm ${settings.title}`}>{title}</h4>
          {message && <p className={`text-sm mt-1 ${settings.message}`}>{message}</p>}
        </div>
        <button
          onClick={handleClose}
          className={`${settings.iconColor} hover:opacity-70 transition-opacity flex-shrink-0`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
