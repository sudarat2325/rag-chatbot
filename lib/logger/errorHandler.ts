import logger from './winston';

export interface ErrorWithStatus extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
}

export class AppError extends Error implements ErrorWithStatus {
  status: number;
  isOperational: boolean;

  constructor(message: string, status: number = 500, isOperational: boolean = true) {
    super(message);
    this.status = status;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export function logError(error: ErrorWithStatus): void {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    status: error.status || error.statusCode,
    code: error.code,
    timestamp: new Date().toISOString(),
  };

  if (error.status && error.status < 500) {
    logger.warn('Client Error:', errorInfo);
  } else {
    logger.error('Server Error:', errorInfo);
  }
}

export function isTrustedError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

export function handleError(error: ErrorWithStatus): {
  message: string;
  status: number;
  stack?: string;
} {
  logError(error);

  const status = error.status || error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  return {
    message,
    status,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  };
}

// Performance monitoring
export class PerformanceMonitor {
  private startTime: number;
  private operation: string;

  constructor(operation: string) {
    this.operation = operation;
    this.startTime = Date.now();
  }

  end(metadata?: Record<string, unknown>): void {
    const duration = Date.now() - this.startTime;

    if (duration > 1000) {
      logger.warn(`Slow operation: ${this.operation}`, {
        duration: `${duration}ms`,
        ...metadata,
      });
    } else {
      logger.debug(`Operation completed: ${this.operation}`, {
        duration: `${duration}ms`,
        ...metadata,
      });
    }
  }
}

// Request tracking
let requestCounter = 0;

export function generateRequestId(): string {
  requestCounter = (requestCounter + 1) % 1000000;
  return `req-${Date.now()}-${requestCounter}`;
}

export function logRequest(params: {
  requestId: string;
  method: string;
  url: string;
  ip?: string;
  userAgent?: string;
}): void {
  logger.http('Incoming request', params);
}

export function logResponse(params: {
  requestId: string;
  statusCode: number;
  duration: number;
}): void {
  const { requestId, statusCode, duration } = params;

  if (statusCode >= 500) {
    logger.error('Request failed', params);
  } else if (statusCode >= 400) {
    logger.warn('Client error', params);
  } else if (duration > 1000) {
    logger.warn('Slow request', params);
  } else {
    logger.http('Request completed', params);
  }
}
