// Re-export Prisma types
export * from '@prisma/client';

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Restaurant Types
export interface RestaurantWithDetails {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  rating: number;
  totalReviews: number;
  categories?: string[];
  isOpen: boolean;
  estimatedTime?: string;
  deliveryFee: number;
  minimumOrder: number;
  distance?: number; // calculated distance from user
}

export interface CreateRestaurantDTO {
  name: string;
  description?: string;
  phone: string;
  email?: string;
  address: string;
  latitude: number;
  longitude: number;
  district?: string;
  province?: string;
  categories?: string;
  deliveryFee: number;
  minimumOrder: number;
  estimatedTime?: string;
  operatingHours?: string;
}

// Menu Types
export interface MenuItemWithOptions {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  category: string;
  isAvailable: boolean;
  isPopular: boolean;
  options?: MenuOption[];
}

export interface MenuOption {
  name: string;
  choices: string[];
  required?: boolean;
}

export interface CreateMenuItemDTO {
  restaurantId: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  category: string;
  options?: MenuOption[];
  preparationTime?: string;
}

// Order Types
export interface OrderWithDetails {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: Date;
  restaurant: {
    id: string;
    name: string;
    logo?: string;
  };
  customer: {
    id: string;
    name: string;
    phone?: string;
  };
  items: OrderItemDetails[];
  delivery?: DeliveryDetails;
}

export interface OrderItemDetails {
  id: string;
  menuItem: {
    name: string;
    image?: string;
  };
  quantity: number;
  price: number;
  customizations?: any;
}

export interface DeliveryDetails {
  id: string;
  status: string;
  driverId?: string;
  driver?: {
    name: string;
    phone?: string;
    vehicleType?: string;
  };
  currentLatitude?: number;
  currentLongitude?: number;
  estimatedTime?: string;
}

export interface CreateOrderDTO {
  restaurantId: string;
  addressId: string;
  items: {
    menuItemId: string;
    quantity: number;
    customizations?: any;
    notes?: string;
  }[];
  paymentMethod: string;
  notes?: string;
}

// Cart Types
export interface CartItem {
  menuItem: MenuItemWithOptions;
  quantity: number;
  customizations?: any;
  notes?: string;
}

export interface Cart {
  restaurantId: string;
  restaurant?: RestaurantWithDetails;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
}

// Location Types
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationWithAddress extends Coordinates {
  address: string;
  district?: string;
  province?: string;
  postalCode?: string;
}

// Notification Types
export interface NotificationData {
  type: string;
  title: string;
  message: string;
  orderId?: string;
  data?: any;
}

// Driver Types
export interface DriverLocation {
  driverId: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
}

// Analytics Types
export interface DashboardStats {
  today: {
    orders: number;
    revenue: number;
    customers: number;
  };
  thisWeek: {
    orders: number;
    revenue: number;
    customers: number;
  };
  thisMonth: {
    orders: number;
    revenue: number;
    customers: number;
  };
  popularItems: {
    name: string;
    count: number;
    revenue: number;
  }[];
  recentOrders: OrderWithDetails[];
}

// WebSocket Event Types
export enum SocketEvent {
  // Order Events
  ORDER_CREATED = 'order:created',
  ORDER_UPDATED = 'order:updated',
  ORDER_STATUS_CHANGED = 'order:status-changed',

  // Delivery Events
  DRIVER_LOCATION_UPDATE = 'driver:location-update',
  DELIVERY_STATUS_CHANGED = 'delivery:status-changed',

  // Notification Events
  NOTIFICATION_NEW = 'notification:new',

  // Chat Events (for support)
  CHAT_MESSAGE = 'chat:message',
}

// Filter Types
export interface RestaurantFilter {
  search?: string;
  category?: string;
  minRating?: number;
  isOpen?: boolean;
  sortBy?: 'rating' | 'distance' | 'popular' | 'new';
  latitude?: number;
  longitude?: number;
}

export interface OrderFilter {
  status?: string;
  customerId?: string;
  restaurantId?: string;
  startDate?: Date;
  endDate?: Date;
}
