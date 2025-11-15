// Input validation utilities

export const validators = {
  // Email validation
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Phone number validation (Thai format)
  phone: (phone: string): boolean => {
    const phoneRegex = /^0[0-9]{9}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  },

  // Required field validation
  required: (value: any): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  },

  // Min length validation
  minLength: (value: string, min: number): boolean => {
    return value.length >= min;
  },

  // Max length validation
  maxLength: (value: string, max: number): boolean => {
    return value.length <= max;
  },

  // Number range validation
  numberRange: (value: number, min: number, max: number): boolean => {
    return value >= min && value <= max;
  },

  // Positive number validation
  positiveNumber: (value: number): boolean => {
    return value > 0;
  },

  // URL validation
  url: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  // Rating validation (1-5)
  rating: (rating: number): boolean => {
    return Number.isInteger(rating) && rating >= 1 && rating <= 5;
  },
};

// Sanitization utilities
export const sanitize = {
  // Remove HTML tags
  stripHtml: (text: string): string => {
    return text.replace(/<[^>]*>/g, '');
  },

  // Trim whitespace
  trim: (text: string): string => {
    return text.trim();
  },

  // Remove special characters (keep only alphanumeric and spaces)
  alphanumeric: (text: string): string => {
    return text.replace(/[^a-zA-Z0-9\s]/g, '');
  },

  // Normalize phone number
  phone: (phone: string): string => {
    return phone.replace(/\D/g, '');
  },
};

// Validation error messages
export const errorMessages = {
  required: 'กรุณากรอกข้อมูล',
  email: 'รูปแบบอีเมลไม่ถูกต้อง',
  phone: 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง (ต้องเป็น 10 หลัก)',
  minLength: (min: number) => `ต้องมีอย่างน้อย ${min} ตัวอักษร`,
  maxLength: (max: number) => `ต้องไม่เกิน ${max} ตัวอักษร`,
  positiveNumber: 'ต้องเป็นตัวเลขที่มากกว่า 0',
  rating: 'คะแนนต้องอยู่ระหว่าง 1-5',
  url: 'รูปแบบ URL ไม่ถูกต้อง',
};

// Form validation helper
export function validateForm<T extends Record<string, any>>(
  data: T,
  rules: Record<keyof T, Array<(value: any) => boolean | string>>
): { isValid: boolean; errors: Partial<Record<keyof T, string>> } {
  const errors: Partial<Record<keyof T, string>> = {};
  let isValid = true;

  for (const field in rules) {
    const fieldRules = rules[field];
    const value = data[field];

    for (const rule of fieldRules) {
      const result = rule(value);
      if (result !== true) {
        errors[field] = typeof result === 'string' ? result : 'ข้อมูลไม่ถูกต้อง';
        isValid = false;
        break;
      }
    }
  }

  return { isValid, errors };
}
