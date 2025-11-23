'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Activity, Database, Cpu, Clock, AlertCircle } from 'lucide-react';

interface HealthData {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  environment: string;
  checks: {
    database: { status: 'up' | 'down'; responseTime?: number };
    memory: { status: 'ok' | 'warning' | 'critical'; usage: number };
  };
}

interface MetricsData {
  metrics: Record<string, { avg: number; min: number; max: number; count: number }>;
  counters: Record<string, number>;
  system: {
    uptime: number;
    memory: { total: number; used: number };
    platform: string;
    nodeVersion: string;
  };
}

export default function MonitoringPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = async () => {
    try {
      const [healthRes, metricsRes] = await Promise.all([
        fetch('/api/monitoring/health'),
        fetch('/api/monitoring/metrics'),
      ]);

      const healthData = await healthRes.json();
      const metricsData = await metricsRes.json();

      setHealth(healthData);
      setMetrics(metricsData.data);
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (autoRefresh) {
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  const isHealthy = health?.status === 'healthy';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              📊 System Monitoring
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Real-time system health and performance metrics
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                autoRefresh
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {autoRefresh ? '🔄 Auto-refresh ON' : '⏸️ Auto-refresh OFF'}
            </button>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Health Status */}
        <div className={`p-6 rounded-xl mb-6 ${
          isHealthy
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-center gap-3">
            {isHealthy ? (
              <Activity className="w-8 h-8 text-green-600 dark:text-green-400" />
            ) : (
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            )}
            <div>
              <h2 className={`text-2xl font-bold ${
                isHealthy ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'
              }`}>
                {isHealthy ? '✅ System Healthy' : '❌ System Unhealthy'}
              </h2>
              <p className={`text-sm ${
                isHealthy ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
              }`}>
                Environment: {health?.environment || 'Unknown'} • Uptime: {formatUptime(health?.uptime || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* System Checks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Database */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <Database className={`w-6 h-6 ${
                health?.checks.database.status === 'up' ? 'text-green-500' : 'text-red-500'
              }`} />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Database</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                <span className={`font-semibold ${
                  health?.checks.database.status === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {health?.checks.database.status === 'up' ? '🟢 UP' : '🔴 DOWN'}
                </span>
              </div>
              {health?.checks.database.responseTime && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Response:</span>
                  <span className="font-mono text-sm text-gray-900 dark:text-white">
                    {health.checks.database.responseTime}ms
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Memory */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <Cpu className={`w-6 h-6 ${
                health?.checks.memory.status === 'ok'
                  ? 'text-green-500'
                  : health?.checks.memory.status === 'warning'
                  ? 'text-yellow-500'
                  : 'text-red-500'
              }`} />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Memory</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Usage:</span>
                <span className="font-semibold">{health?.checks.memory.usage}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    health?.checks.memory.status === 'ok'
                      ? 'bg-green-500'
                      : health?.checks.memory.status === 'warning'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${health?.checks.memory.usage}%` }}
                />
              </div>
              {metrics && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {metrics.system.memory.used.toFixed(0)} MB / {metrics.system.memory.total.toFixed(0)} MB
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Uptime */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-6 h-6 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Uptime</h3>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatUptime(metrics?.system.uptime || 0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Node {metrics?.system.nodeVersion} • {metrics?.system.platform}
              </div>
            </div>
          </div>
        </div>

        {/* HTTP Metrics */}
        {metrics?.counters && Object.keys(metrics.counters).length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📡 HTTP Metrics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(metrics.counters)
                .filter(([key]) => key.startsWith('http'))
                .map(([key, value]) => (
                  <div key={key} className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {value}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {key.replace('http.', '').replace(/\./g, ' ')}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Performance Metrics */}
        {metrics?.metrics && Object.keys(metrics.metrics).length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              ⚡ Performance Metrics
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 text-gray-600 dark:text-gray-400 font-medium">Metric</th>
                    <th className="text-right py-3 text-gray-600 dark:text-gray-400 font-medium">Avg</th>
                    <th className="text-right py-3 text-gray-600 dark:text-gray-400 font-medium">Min</th>
                    <th className="text-right py-3 text-gray-600 dark:text-gray-400 font-medium">Max</th>
                    <th className="text-right py-3 text-gray-600 dark:text-gray-400 font-medium">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(metrics.metrics).map(([key, value]) => (
                    <tr key={key} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="py-3 text-gray-900 dark:text-white">{key}</td>
                      <td className="text-right font-mono text-sm text-gray-900 dark:text-white">
                        {value.avg.toFixed(2)}
                      </td>
                      <td className="text-right font-mono text-sm text-gray-600 dark:text-gray-400">
                        {value.min.toFixed(2)}
                      </td>
                      <td className="text-right font-mono text-sm text-gray-600 dark:text-gray-400">
                        {value.max.toFixed(2)}
                      </td>
                      <td className="text-right font-mono text-sm text-gray-600 dark:text-gray-400">
                        {value.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
