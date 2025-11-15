import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import responseTime from 'response-time';
import logger, { stream } from '../logger/winston';
import {
  generateRequestId,
  logRequest,
  logResponse,
  handleError,
  ErrorWithStatus,
} from '../logger/errorHandler';
import { metrics, MetricNames } from '../logger/metrics';

// Add request ID to all requests
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = generateRequestId();
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
}

// Log all requests
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  logRequest({
    requestId: req.requestId!,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  metrics.increment('http.requests.total');
  metrics.increment(`http.requests.${req.method.toLowerCase()}`);

  next();
}

// Response time tracker
export const responseTimeMiddleware = responseTime((req: Request, res: Response, time: number) => {
  const requestId = req.requestId || 'unknown';

  logResponse({
    requestId,
    statusCode: res.statusCode,
    duration: time,
  });

  // Record metrics
  metrics.record(MetricNames.HTTP_REQUEST_DURATION, time);

  if (res.statusCode >= 500) {
    metrics.increment('http.responses.5xx');
  } else if (res.statusCode >= 400) {
    metrics.increment('http.responses.4xx');
  } else if (res.statusCode >= 300) {
    metrics.increment('http.responses.3xx');
  } else if (res.statusCode >= 200) {
    metrics.increment('http.responses.2xx');
  }
});

// Morgan HTTP logger
export const morganMiddleware = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  { stream }
);

// Error handling middleware
export function errorHandlerMiddleware(
  error: ErrorWithStatus,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (res.headersSent) {
    return next(error);
  }

  const errorResponse = handleError(error);

  metrics.increment(MetricNames.ERROR_COUNT);
  metrics.increment(`errors.${error.status || 500}`);

  res.status(errorResponse.status).json({
    success: false,
    error: {
      message: errorResponse.message,
      requestId: req.requestId,
      ...(errorResponse.stack && { stack: errorResponse.stack }),
    },
  });
}

// Not found middleware
export function notFoundMiddleware(req: Request, res: Response): void {
  logger.warn('Route not found', {
    method: req.method,
    url: req.originalUrl,
    requestId: req.requestId,
  });

  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      path: req.originalUrl,
      requestId: req.requestId,
    },
  });
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}
