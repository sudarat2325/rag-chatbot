// API Error Handler Utilities

export class ApiError extends Error {
  statusCode: number;
  code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export const errorCodes = {
  // Client errors (400-499)
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION_ERROR: 422,
  TOO_MANY_REQUESTS: 429,

  // Server errors (500-599)
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
};

// Standard error responses
export function createErrorResponse(
  message: string,
  statusCode: number = 500,
  code?: string
) {
  return {
    success: false,
    error: message,
    code,
    timestamp: new Date().toISOString(),
  };
}

// Common error handlers
export const errorHandlers = {
  notFound: (resource: string) =>
    new ApiError(`${resource} not found`, errorCodes.NOT_FOUND, 'NOT_FOUND'),

  unauthorized: (message: string = 'Unauthorized access') =>
    new ApiError(message, errorCodes.UNAUTHORIZED, 'UNAUTHORIZED'),

  forbidden: (message: string = 'Access forbidden') =>
    new ApiError(message, errorCodes.FORBIDDEN, 'FORBIDDEN'),

  validationError: (message: string) =>
    new ApiError(message, errorCodes.VALIDATION_ERROR, 'VALIDATION_ERROR'),

  conflict: (message: string) =>
    new ApiError(message, errorCodes.CONFLICT, 'CONFLICT'),

  serverError: (message: string = 'Internal server error') =>
    new ApiError(message, errorCodes.INTERNAL_SERVER_ERROR, 'INTERNAL_ERROR'),
};

// Async error wrapper for API routes
export function asyncHandler(fn: Function) {
  return async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error('Async handler error:', error);

      if (error instanceof ApiError) {
        throw error;
      }

      // Unknown errors
      throw new ApiError(
        'An unexpected error occurred',
        errorCodes.INTERNAL_SERVER_ERROR,
        'UNEXPECTED_ERROR'
      );
    }
  };
}

// Client-side error handler
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new ApiError(
      data.error || 'An error occurred',
      response.status,
      data.code
    );
  }

  return response.json();
}

// Retry logic for failed requests
export async function retryRequest<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Attempt ${i + 1} failed, retrying in ${delay}ms...`);

      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }

  throw lastError!;
}

// Error logging (can be extended to send to external service)
export function logError(error: Error, context?: Record<string, any>) {
  const errorLog = {
    message: error.message,
    name: error.name,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    context,
  };

  // In production, send to error tracking service (e.g., Sentry)
  console.error('Error logged:', errorLog);

  // TODO: Send to error tracking service
  // sendToSentry(errorLog);
}

// User-friendly error messages
export function getUserFriendlyMessage(error: any): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'NOT_FOUND':
        return 'ไม่พบข้อมูลที่ต้องการ';
      case 'UNAUTHORIZED':
        return 'กรุณาเข้าสู่ระบบก่อนใช้งาน';
      case 'FORBIDDEN':
        return 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้';
      case 'VALIDATION_ERROR':
        return error.message;
      case 'CONFLICT':
        return 'ข้อมูลซ้ำกับที่มีอยู่แล้ว';
      default:
        return error.message;
    }
  }

  if (error.message) {
    return error.message;
  }

  return 'เกิดข้อผิดพลาดบางอย่าง กรุณาลองใหม่อีกครั้ง';
}
