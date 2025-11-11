import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generate unique order number
export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `ORD-${timestamp}-${random}`.toUpperCase();
}

// Calculate distance between two coordinates (Haversine formula)
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of Earth in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Calculate estimated delivery time based on distance
export function calculateEstimatedTime(distanceKm: number): string {
  // Assume average speed of 20 km/h for delivery
  const prepTime = 20; // minutes for food preparation
  const travelTime = Math.ceil((distanceKm / 20) * 60); // convert to minutes
  const total = prepTime + travelTime;

  const min = total - 5;
  const max = total + 10;

  return `${min}-${max} mins`;
}

// Format currency (Thai Baht)
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Format date/time
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

// Time ago format
export function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((new Date().getTime() - d.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) {
    return Math.floor(interval) + ' ปีที่แล้ว';
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + ' เดือนที่แล้ว';
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + ' วันที่แล้ว';
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + ' ชั่วโมงที่แล้ว';
  }
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + ' นาทีที่แล้ว';
  }
  return 'เมื่อสักครู่';
}

// Get order status in Thai
export function getOrderStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    PENDING: 'รอยืนยัน',
    ACCEPTED: 'ร้านรับออเดอร์',
    PREPARING: 'กำลังเตรียม',
    READY: 'พร้อมส่ง',
    PICKED_UP: 'คนส่งรับของแล้ว',
    ON_THE_WAY: 'กำลังส่ง',
    DELIVERED: 'ส่งแล้ว',
    CANCELLED: 'ยกเลิก',
    REJECTED: 'ร้านปฏิเสธ',
  };
  return statusMap[status] || status;
}

// Get order status color
export function getOrderStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    ACCEPTED: 'bg-blue-100 text-blue-800',
    PREPARING: 'bg-orange-100 text-orange-800',
    READY: 'bg-purple-100 text-purple-800',
    PICKED_UP: 'bg-indigo-100 text-indigo-800',
    ON_THE_WAY: 'bg-cyan-100 text-cyan-800',
    DELIVERED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    REJECTED: 'bg-gray-100 text-gray-800',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800';
}

// Validate phone number (Thai format)
export function isValidThaiPhone(phone: string): boolean {
  // Remove spaces and dashes
  const cleaned = phone.replace(/[\s-]/g, '');
  // Check if it's 10 digits starting with 0
  return /^0[0-9]{9}$/.test(cleaned);
}

// Format Thai phone number
export function formatThaiPhone(phone: string): string {
  const cleaned = phone.replace(/[\s-]/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
  }
  return phone;
}

// Truncate text
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

// Sleep utility
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Get restaurant operating status
export function isRestaurantOpen(operatingHours?: string): boolean {
  if (!operatingHours) return true;

  try {
    const hours = JSON.parse(operatingHours);
    const now = new Date();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const dayHours = hours[dayName];
    if (!dayHours || !dayHours.open || !dayHours.close) return false;

    const [openHour, openMin] = dayHours.open.split(':').map(Number);
    const [closeHour, closeMin] = dayHours.close.split(':').map(Number);

    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;

    return currentTime >= openTime && currentTime <= closeTime;
  } catch {
    return true;
  }
}
