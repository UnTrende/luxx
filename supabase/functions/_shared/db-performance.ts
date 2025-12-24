/**
 * Database Performance Monitoring for Supabase Edge Functions
 * Tracks query performance, identifies slow queries, and monitors database health
 */

import { logger } from './response.ts';

interface QueryMetric {
  query: string;
  duration: number;
  timestamp: number;
  rowCount?: number;
  error?: string;
  functionName?: string;
  userId?: string;
}

interface DatabaseStats {
  totalQueries: number;
  averageDuration: number;
  slowQueries: number;
  errorRate: number;
  activeConnections?: number;
}

class DatabasePerformanceMonitor {
  private static instance: DatabasePerformanceMonitor;
  private queryMetrics: QueryMetric[] = [];
  private slowQueryThreshold: number = 1000; // 1 second
  private metricsRetentionMs: number = 3600000; // 1 hour
  private batchSize: number = 50;

  static getInstance(): DatabasePerformanceMonitor {
    if (!DatabasePerformanceMonitor.instance) {
      DatabasePerformanceMonitor.instance = new DatabasePerformanceMonitor();
    }
    return DatabasePerformanceMonitor.instance;
  }

  /**
   * Wrap Supabase queries with performance monitoring
   */
  async trackQuery<T>(
    queryName: string,
    queryFunction: () => Promise<T>,
    options: {
      functionName?: string;
      userId?: string;
      expectedRows?: number;
    } = {}
  ): Promise<T> {
    const startTime = performance.now();
    let rowCount: number | undefined;
    let error: string | undefined;

    try {
      const result = await queryFunction();
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Extract row count if possible
      if (result && typeof result === 'object') {
        const data = (result as any).data;
        if (Array.isArray(data)) {
          rowCount = data.length;
        } else if (data) {
          rowCount = 1;
        }
      }

      // Record the metric
      this.recordQuery({
        query: queryName,
        duration,
        timestamp: Date.now(),
        rowCount,
        functionName: options.functionName,
        userId: options.userId
      });

      // Log slow queries
      if (duration > this.slowQueryThreshold) {
        logger.warn('Slow database query detected', {
          queryName,
          duration: `${duration.toFixed(2)}ms`,
          rowCount,
          functionName: options.functionName
        }, 'DatabasePerformance');
      }

      return result;
    } catch (err) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      error = err instanceof Error ? err.message : String(err);

      // Record the failed query
      this.recordQuery({
        query: queryName,
        duration,
        timestamp: Date.now(),
        error,
        functionName: options.functionName,
        userId: options.userId
      });

      logger.error('Database query failed', {
        queryName,
        duration: `${duration.toFixed(2)}ms`,
        error,
        functionName: options.functionName
      }, 'DatabasePerformance');

      throw err;
    }
  }

  /**
   * Record a query metric
   */
  private recordQuery(metric: QueryMetric): void {
    this.queryMetrics.push(metric);

    // Clean up old metrics
    this.cleanupOldMetrics();

    // Auto-flush if batch size reached
    if (this.queryMetrics.length >= this.batchSize) {
      this.flushMetrics();
    }
  }

  /**
   * Get database performance statistics
   */
  getPerformanceStats(timeWindowMs: number = 300000): DatabaseStats {
    const now = Date.now();
    const recentMetrics = this.queryMetrics.filter(
      metric => now - metric.timestamp < timeWindowMs
    );

    if (recentMetrics.length === 0) {
      return {
        totalQueries: 0,
        averageDuration: 0,
        slowQueries: 0,
        errorRate: 0
      };
    }

    const totalQueries = recentMetrics.length;
    const slowQueries = recentMetrics.filter(
      metric => metric.duration > this.slowQueryThreshold
    ).length;
    const errorQueries = recentMetrics.filter(metric => metric.error).length;
    const totalDuration = recentMetrics.reduce((sum, metric) => sum + metric.duration, 0);

    return {
      totalQueries,
      averageDuration: totalDuration / totalQueries,
      slowQueries,
      errorRate: (errorQueries / totalQueries) * 100
    };
  }

  /**
   * Get slow query analysis
   */
  getSlowQueryAnalysis(timeWindowMs: number = 3600000): Array<{
    query: string;
    count: number;
    avgDuration: number;
    maxDuration: number;
    functions: string[];
  }> {
    const now = Date.now();
    const recentSlowQueries = this.queryMetrics.filter(
      metric => now - metric.timestamp < timeWindowMs && 
                metric.duration > this.slowQueryThreshold
    );

    const queryGroups = new Map<string, {
      durations: number[];
      functions: Set<string>;
    }>();

    recentSlowQueries.forEach(metric => {
      if (!queryGroups.has(metric.query)) {
        queryGroups.set(metric.query, {
          durations: [],
          functions: new Set()
        });
      }
      
      const group = queryGroups.get(metric.query)!;
      group.durations.push(metric.duration);
      if (metric.functionName) {
        group.functions.add(metric.functionName);
      }
    });

    return Array.from(queryGroups.entries())
      .map(([query, group]) => ({
        query,
        count: group.durations.length,
        avgDuration: group.durations.reduce((sum, d) => sum + d, 0) / group.durations.length,
        maxDuration: Math.max(...group.durations),
        functions: Array.from(group.functions)
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration);
  }

  /**
   * Get query patterns and optimization suggestions
   */
  getOptimizationSuggestions(): Array<{
    issue: string;
    suggestion: string;
    severity: 'low' | 'medium' | 'high';
    affectedQueries: string[];
  }> {
    const stats = this.getPerformanceStats();
    const slowQueries = this.getSlowQueryAnalysis();
    const suggestions: Array<{
      issue: string;
      suggestion: string;
      severity: 'low' | 'medium' | 'high';
      affectedQueries: string[];
    }> = [];

    // High error rate
    if (stats.errorRate > 5) {
      suggestions.push({
        issue: `High error rate: ${stats.errorRate.toFixed(1)}%`,
        suggestion: 'Review error logs and add better error handling. Consider connection pooling.',
        severity: 'high',
        affectedQueries: this.getErrorQueries()
      });
    }

    // Too many slow queries
    if (stats.slowQueries > stats.totalQueries * 0.1) {
      suggestions.push({
        issue: `${stats.slowQueries} slow queries out of ${stats.totalQueries} total`,
        suggestion: 'Add database indexes, optimize query conditions, or implement caching.',
        severity: 'high',
        affectedQueries: slowQueries.slice(0, 5).map(q => q.query)
      });
    }

    // High average duration
    if (stats.averageDuration > 500) {
      suggestions.push({
        issue: `High average query duration: ${stats.averageDuration.toFixed(0)}ms`,
        suggestion: 'Consider pagination, query optimization, or read replicas.',
        severity: 'medium',
        affectedQueries: []
      });
    }

    // Specific query pattern issues
    const frequentSlowQueries = slowQueries.filter(q => q.count > 5);
    if (frequentSlowQueries.length > 0) {
      suggestions.push({
        issue: 'Frequently executed slow queries detected',
        suggestion: 'These queries should be priority for optimization or caching.',
        severity: 'high',
        affectedQueries: frequentSlowQueries.map(q => q.query)
      });
    }

    return suggestions;
  }

  /**
   * Get queries that resulted in errors
   */
  private getErrorQueries(): string[] {
    const errorMetrics = this.queryMetrics.filter(metric => metric.error);
    const uniqueQueries = new Set(errorMetrics.map(metric => metric.query));
    return Array.from(uniqueQueries);
  }

  /**
   * Clean up old metrics to prevent memory growth
   */
  private cleanupOldMetrics(): void {
    const cutoff = Date.now() - this.metricsRetentionMs;
    const initialLength = this.queryMetrics.length;
    
    this.queryMetrics = this.queryMetrics.filter(
      metric => metric.timestamp > cutoff
    );

    const removedCount = initialLength - this.queryMetrics.length;
    if (removedCount > 0) {
      logger.debug('Cleaned up old database metrics', { 
        removedCount, 
        remaining: this.queryMetrics.length 
      }, 'DatabasePerformance');
    }
  }

  /**
   * Flush metrics to monitoring system
   */
  private async flushMetrics(): Promise<void> {
    if (this.queryMetrics.length === 0) return;

    const stats = this.getPerformanceStats();
    const slowQueries = this.getSlowQueryAnalysis(300000); // Last 5 minutes
    const suggestions = this.getOptimizationSuggestions();

    try {
      // Log performance summary
      logger.info('Database performance summary', {
        stats,
        slowQueries: slowQueries.slice(0, 3), // Top 3 slow queries
        suggestions: suggestions.filter(s => s.severity === 'high')
      }, 'DatabasePerformance');

      // In production, you would send this to your monitoring system
      // await sendToMonitoringSystem({ stats, slowQueries, suggestions });

    } catch (error) {
      logger.error('Failed to flush database metrics', error, 'DatabasePerformance');
    }
  }

  /**
   * Monitor connection pool health
   */
  async checkConnectionHealth(supabase: any): Promise<{
    isHealthy: boolean;
    connectionCount?: number;
    responseTime: number;
  }> {
    const startTime = performance.now();
    
    try {
      // Simple health check query
      const { data, error } = await supabase
        .from('app_users')
        .select('count')
        .limit(1);
      
      const responseTime = performance.now() - startTime;
      
      if (error) {
        logger.error('Database health check failed', error, 'DatabasePerformance');
        return { isHealthy: false, responseTime };
      }
      
      logger.debug('Database health check passed', { responseTime }, 'DatabasePerformance');
      return { isHealthy: true, responseTime };
      
    } catch (error) {
      const responseTime = performance.now() - startTime;
      logger.error('Database health check error', error, 'DatabasePerformance');
      return { isHealthy: false, responseTime };
    }
  }

  /**
   * Set slow query threshold
   */
  setSlowQueryThreshold(thresholdMs: number): void {
    this.slowQueryThreshold = thresholdMs;
    logger.info('Slow query threshold updated', { 
      thresholdMs 
    }, 'DatabasePerformance');
  }

  /**
   * Reset all metrics (useful for testing)
   */
  resetMetrics(): void {
    this.queryMetrics = [];
    logger.info('Database metrics reset', undefined, 'DatabasePerformance');
  }
}

// Export singleton instance and helper functions
export const dbPerformance = DatabasePerformanceMonitor.getInstance();

/**
 * Decorator function to automatically track database queries
 */
export function trackDBQuery(queryName: string, functionName?: string) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args: any[]) {
      return await dbPerformance.trackQuery(
        queryName,
        () => originalMethod.apply(this, args),
        { functionName }
      );
    };

    return descriptor;
  };
}

/**
 * Helper function to wrap any async database operation
 */
export async function trackAsyncQuery<T>(
  queryName: string,
  operation: () => Promise<T>,
  functionName?: string
): Promise<T> {
  return await dbPerformance.trackQuery(
    queryName,
    operation,
    { functionName }
  );
}

export default dbPerformance;