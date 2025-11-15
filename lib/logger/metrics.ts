import logger from './winston';

// Metrics storage
interface MetricData {
  count: number;
  sum: number;
  min: number;
  max: number;
  avg: number;
  lastValue: number;
  lastUpdate: Date;
}

interface Metrics {
  [key: string]: MetricData;
}

class MetricsCollector {
  private metrics: Metrics = {};
  private counters: Record<string, number> = {};

  // Record a metric value
  record(name: string, value: number): void {
    if (!this.metrics[name]) {
      this.metrics[name] = {
        count: 0,
        sum: 0,
        min: value,
        max: value,
        avg: 0,
        lastValue: value,
        lastUpdate: new Date(),
      };
    }

    const metric = this.metrics[name];
    metric.count++;
    metric.sum += value;
    metric.min = Math.min(metric.min, value);
    metric.max = Math.max(metric.max, value);
    metric.avg = metric.sum / metric.count;
    metric.lastValue = value;
    metric.lastUpdate = new Date();

    logger.debug(`Metric recorded: ${name}`, {
      value,
      avg: metric.avg,
      min: metric.min,
      max: metric.max,
    });
  }

  // Increment a counter
  increment(name: string, value: number = 1): void {
    this.counters[name] = (this.counters[name] || 0) + value;
    logger.debug(`Counter incremented: ${name}`, { value: this.counters[name] });
  }

  // Decrement a counter
  decrement(name: string, value: number = 1): void {
    this.counters[name] = (this.counters[name] || 0) - value;
    logger.debug(`Counter decremented: ${name}`, { value: this.counters[name] });
  }

  // Get metric data
  getMetric(name: string): MetricData | null {
    return this.metrics[name] || null;
  }

  // Get counter value
  getCounter(name: string): number {
    return this.counters[name] || 0;
  }

  // Get all metrics
  getAllMetrics(): Metrics {
    return { ...this.metrics };
  }

  // Get all counters
  getAllCounters(): Record<string, number> {
    return { ...this.counters };
  }

  // Reset a metric
  resetMetric(name: string): void {
    delete this.metrics[name];
    logger.info(`Metric reset: ${name}`);
  }

  // Reset a counter
  resetCounter(name: string): void {
    delete this.counters[name];
    logger.info(`Counter reset: ${name}`);
  }

  // Reset all metrics
  resetAll(): void {
    this.metrics = {};
    this.counters = {};
    logger.info('All metrics reset');
  }

  // Get summary
  getSummary(): {
    metrics: Metrics;
    counters: Record<string, number>;
    timestamp: string;
  } {
    return {
      metrics: this.getAllMetrics(),
      counters: this.getAllCounters(),
      timestamp: new Date().toISOString(),
    };
  }
}

// Singleton instance
export const metrics = new MetricsCollector();

// Pre-defined metric names
export const MetricNames = {
  // HTTP
  HTTP_REQUEST_DURATION: 'http.request.duration',
  HTTP_REQUEST_SIZE: 'http.request.size',
  HTTP_RESPONSE_SIZE: 'http.response.size',

  // Database
  DB_QUERY_DURATION: 'db.query.duration',
  DB_QUERY_COUNT: 'db.query.count',
  DB_CONNECTION_COUNT: 'db.connection.count',

  // API
  API_CALL_DURATION: 'api.call.duration',
  API_ERROR_COUNT: 'api.error.count',

  // Business
  ORDER_CREATED: 'business.order.created',
  ORDER_COMPLETED: 'business.order.completed',
  ORDER_CANCELLED: 'business.order.cancelled',
  PAYMENT_SUCCESS: 'business.payment.success',
  PAYMENT_FAILED: 'business.payment.failed',

  // System
  MEMORY_USAGE: 'system.memory.usage',
  CPU_USAGE: 'system.cpu.usage',
  ERROR_COUNT: 'system.error.count',
} as const;

// System metrics collection
export function collectSystemMetrics(): void {
  const memUsage = process.memoryUsage();

  metrics.record(MetricNames.MEMORY_USAGE, memUsage.heapUsed / 1024 / 1024); // MB

  if (process.cpuUsage) {
    const cpuUsage = process.cpuUsage();
    metrics.record(MetricNames.CPU_USAGE, cpuUsage.user + cpuUsage.system);
  }
}

// Auto-collect system metrics every minute
let systemMetricsInterval: NodeJS.Timeout | null = null;

export function startSystemMetricsCollection(intervalMs: number = 60000): void {
  if (systemMetricsInterval) {
    return;
  }

  collectSystemMetrics(); // Collect immediately
  systemMetricsInterval = setInterval(collectSystemMetrics, intervalMs);

  logger.info('System metrics collection started', { interval: `${intervalMs}ms` });
}

export function stopSystemMetricsCollection(): void {
  if (systemMetricsInterval) {
    clearInterval(systemMetricsInterval);
    systemMetricsInterval = null;
    logger.info('System metrics collection stopped');
  }
}

export default metrics;
