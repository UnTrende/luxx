/**
 * Performance Monitoring & Metrics Collection
 * Real-world performance tracking and optimization insights
 */

import React from 'react';
import { logger } from './logger';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  labels?: Record<string, string | number>;
}

interface WebVitalsData {
  FCP?: number; // First Contentful Paint
  LCP?: number; // Largest Contentful Paint  
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();
  private isEnabled: boolean = true;
  private batchSize: number = 10;
  private flushInterval: number = 30000; // 30 seconds

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  constructor() {
    this.initialize();
  }

  /**
   * Initialize performance monitoring
   */
  private initialize(): void {
    if (typeof window === 'undefined') return;

    // Initialize Web Vitals tracking
    this.initializeWebVitals();
    
    // Initialize Navigation Timing
    this.initializeNavigationTiming();
    
    // Initialize Resource Timing
    this.initializeResourceTiming();
    
    // Initialize Long Tasks tracking
    this.initializeLongTasks();
    
    // Set up periodic metrics flushing
    this.setupPeriodicFlush();
    
    logger.info('Performance monitoring initialized', undefined, 'PerformanceMonitor');
  }

  /**
   * Track Web Vitals (Core Performance Metrics)
   */
  private initializeWebVitals(): void {
    // First Contentful Paint
    this.observePerformanceEntry('paint', (entries) => {
      entries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          this.recordMetric('web_vitals_fcp', entry.startTime, {
            type: 'web_vitals'
          });
        }
      });
    });

    // Largest Contentful Paint
    this.observePerformanceEntry('largest-contentful-paint', (entries) => {
      entries.forEach((entry) => {
        this.recordMetric('web_vitals_lcp', entry.startTime, {
          type: 'web_vitals',
          element: (entry as any).element?.tagName || 'unknown'
        });
      });
    });

    // First Input Delay
    this.observePerformanceEntry('first-input', (entries) => {
      entries.forEach((entry) => {
        this.recordMetric('web_vitals_fid', (entry as any).processingStart - entry.startTime, {
          type: 'web_vitals',
          event_type: (entry as any).name
        });
      });
    });

    // Cumulative Layout Shift
    this.observePerformanceEntry('layout-shift', (entries) => {
      let clsScore = 0;
      entries.forEach((entry) => {
        if (!(entry as any).hadRecentInput) {
          clsScore += (entry as any).value;
        }
      });
      
      if (clsScore > 0) {
        this.recordMetric('web_vitals_cls', clsScore, {
          type: 'web_vitals'
        });
      }
    });
  }

  /**
   * Track Navigation Timing
   */
  private initializeNavigationTiming(): void {
    this.observePerformanceEntry('navigation', (entries) => {
      entries.forEach((entry: Event) => {
        // Time to First Byte
        const ttfb = entry.responseStart - entry.fetchStart;
        this.recordMetric('navigation_ttfb', ttfb, { type: 'navigation' });
        
        // DNS Lookup Time
        const dnsTime = entry.domainLookupEnd - entry.domainLookupStart;
        this.recordMetric('navigation_dns', dnsTime, { type: 'navigation' });
        
        // Connection Time
        const connectionTime = entry.connectEnd - entry.connectStart;
        this.recordMetric('navigation_connection', connectionTime, { type: 'navigation' });
        
        // DOM Content Loaded
        const domContentLoaded = entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart;
        this.recordMetric('navigation_dom_content_loaded', domContentLoaded, { type: 'navigation' });
        
        // Full Load Time
        const loadTime = entry.loadEventEnd - entry.loadEventStart;
        this.recordMetric('navigation_load', loadTime, { type: 'navigation' });
      });
    });
  }

  /**
   * Track Resource Loading Performance
   */
  private initializeResourceTiming(): void {
    this.observePerformanceEntry('resource', (entries) => {
      entries.forEach((entry: Event) => {
        const resourceType = this.getResourceType(entry.name);
        const duration = entry.responseEnd - entry.startTime;
        
        this.recordMetric('resource_load_time', duration, {
          type: 'resource',
          resource_type: resourceType,
          initiator_type: entry.initiatorType,
          transfer_size: entry.transferSize || 0
        });
        
        // Track large resources
        if (entry.transferSize > 100000) { // > 100KB
          this.recordMetric('resource_large_asset', entry.transferSize, {
            type: 'resource',
            resource_type: resourceType,
            url: this.sanitizeUrl(entry.name)
          });
        }
      });
    });
  }

  /**
   * Track Long Tasks (blocking main thread)
   */
  private initializeLongTasks(): void {
    this.observePerformanceEntry('longtask', (entries) => {
      entries.forEach((entry: Event) => {
        this.recordMetric('long_task_duration', entry.duration, {
          type: 'long_task',
          attribution: entry.attribution?.[0]?.name || 'unknown'
        });
      });
    });
  }

  /**
   * Generic performance observer setup
   */
  private observePerformanceEntry(
    type: string, 
    callback: (entries: PerformanceEntry[]) => void
  ): void {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      
      observer.observe({ type, buffered: true });
      this.observers.set(type, observer);
    } catch (error) {
      logger.warn(`Failed to observe ${type} performance entries`, error, 'PerformanceMonitor');
    }
  }

  /**
   * Record a custom metric
   */
  recordMetric(name: string, value: number, labels: Record<string, string | number> = {}): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      labels: {
        ...labels,
        url: window.location.pathname,
        user_agent: navigator.userAgent.substring(0, 50)
      }
    };

    this.metrics.push(metric);
    
    // Auto-flush if batch size reached
    if (this.metrics.length >= this.batchSize) {
      this.flushMetrics();
    }

    logger.debug('Performance metric recorded', { name, value, labels }, 'PerformanceMonitor');
  }

  /**
   * Track API call performance
   */
  trackAPICall(endpoint: string, duration: number, status: number, size?: number): void {
    this.recordMetric('api_call_duration', duration, {
      type: 'api',
      endpoint: this.sanitizeUrl(endpoint),
      status_code: status,
      response_size: size || 0
    });

    // Track slow API calls
    if (duration > 2000) {
      this.recordMetric('api_slow_call', duration, {
        type: 'api',
        endpoint: this.sanitizeUrl(endpoint),
        status_code: status
      });
    }
  }

  /**
   * Track React component render performance
   */
  trackComponentRender(componentName: string, renderTime: number, props?: any): void {
    this.recordMetric('component_render_time', renderTime, {
      type: 'react',
      component: componentName,
      props_count: props ? Object.keys(props).length : 0
    });

    // Track slow components
    if (renderTime > 16) { // > 1 frame at 60fps
      this.recordMetric('component_slow_render', renderTime, {
        type: 'react',
        component: componentName
      });
    }
  }

  /**
   * Track user interactions
   */
  trackUserInteraction(action: string, target?: string, duration?: number): void {
    this.recordMetric('user_interaction', duration || 1, {
      type: 'interaction',
      action,
      target: target || 'unknown'
    });
  }

  /**
   * Get current Web Vitals data
   */
  getWebVitals(): WebVitalsData {
    const vitals: WebVitalsData = {};
    
    // Get from recorded metrics
    const recentMetrics = this.metrics.filter(m => 
      m.timestamp > Date.now() - 60000 && // Last minute
      m.labels?.type === 'web_vitals'
    );

    recentMetrics.forEach(metric => {
      if (metric.name === 'web_vitals_fcp') vitals.FCP = metric.value;
      if (metric.name === 'web_vitals_lcp') vitals.LCP = metric.value;
      if (metric.name === 'web_vitals_fid') vitals.FID = metric.value;
      if (metric.name === 'web_vitals_cls') vitals.CLS = metric.value;
      if (metric.name === 'navigation_ttfb') vitals.TTFB = metric.value;
    });

    return vitals;
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): Record<string, any> {
    const now = Date.now();
    const recentMetrics = this.metrics.filter(m => now - m.timestamp < 300000); // Last 5 minutes

    const summary = {
      total_metrics: recentMetrics.length,
      web_vitals: this.getWebVitals(),
      api_calls: {
        total: recentMetrics.filter(m => m.labels?.type === 'api').length,
        slow_calls: recentMetrics.filter(m => m.name === 'api_slow_call').length,
        avg_duration: this.calculateAverage(recentMetrics.filter(m => m.name === 'api_call_duration'))
      },
      components: {
        total_renders: recentMetrics.filter(m => m.labels?.type === 'react').length,
        slow_renders: recentMetrics.filter(m => m.name === 'component_slow_render').length,
        avg_render_time: this.calculateAverage(recentMetrics.filter(m => m.name === 'component_render_time'))
      },
      long_tasks: recentMetrics.filter(m => m.labels?.type === 'long_task').length
    };

    return summary;
  }

  /**
   * Flush metrics to backend/analytics
   */
  private async flushMetrics(): Promise<void> {
    if (this.metrics.length === 0) return;

    const metricsToSend = [...this.metrics];
    this.metrics = []; // Clear local buffer

    try {
      // In a real implementation, send to your analytics backend
      logger.info('Performance metrics flushed', { 
        count: metricsToSend.length,
        summary: this.getPerformanceSummary()
      }, 'PerformanceMonitor');
      
      // Example: Send to analytics service
      // await fetch('/api/analytics/performance', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ metrics: metricsToSend })
      // });
      
    } catch (error) {
      logger.error('Failed to flush performance metrics', error, 'PerformanceMonitor');
      // Re-add metrics to buffer for retry
      this.metrics.unshift(...metricsToSend);
    }
  }

  /**
   * Set up periodic metric flushing
   */
  private setupPeriodicFlush(): void {
    setInterval(() => {
      this.flushMetrics();
    }, this.flushInterval);
  }

  /**
   * Utility: Get resource type from URL
   */
  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'javascript';
    if (url.includes('.css')) return 'stylesheet';
    if (url.includes('.png') || url.includes('.jpg') || url.includes('.webp')) return 'image';
    if (url.includes('/api/')) return 'api';
    return 'other';
  }

  /**
   * Utility: Sanitize URL for logging
   */
  private sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return `${urlObj.pathname}${urlObj.search ? '?[params]' : ''}`;
    } catch {
      return url.substring(0, 100); // Truncate long URLs
    }
  }

  /**
   * Utility: Calculate average of metrics
   */
  private calculateAverage(metrics: PerformanceMetric[]): number {
    if (metrics.length === 0) return 0;
    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    logger.info(`Performance monitoring ${enabled ? 'enabled' : 'disabled'}`, undefined, 'PerformanceMonitor');
  }

  /**
   * Cleanup observers
   */
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.flushMetrics(); // Flush remaining metrics
    logger.info('Performance monitoring destroyed', undefined, 'PerformanceMonitor');
  }
}

// Export singleton and utilities
export const performanceMonitor = PerformanceMonitor.getInstance();

// React Hook for component performance tracking
export const usePerformanceTracker = (componentName: string) => {
  const startTime = performance.now();
  
  React.useEffect(() => {
    return () => {
      const duration = performance.now() - startTime;
      performanceMonitor.trackComponentRender(componentName, duration);
    };
  }, [componentName, startTime]);
};

// HOC for automatic component performance tracking
export const withPerformanceTracking = <P extends object,>(
  Component: React.ComponentType<P>,
  componentName?: string
) => {
  const TrackedComponent = (props: P) => {
    const name = componentName || Component.displayName || Component.name || 'Unknown';
    usePerformanceTracker(name);
    return <Component {...props} />;
  };
  
  TrackedComponent.displayName = `withPerformanceTracking(${componentName || Component.displayName || Component.name})`;
  return TrackedComponent;
};

// API call wrapper for automatic performance tracking
export const trackAPI = async <T,>(
  endpoint: string,
  apiCall: () => Promise<T>
): Promise<T> => {
  const startTime = performance.now();
  let status = 200;
  
  try {
    const result = await apiCall();
    const duration = performance.now() - startTime;
    performanceMonitor.trackAPICall(endpoint, duration, status);
    return result;
  } catch (error) {
    status = 500; // Assume error
    const duration = performance.now() - startTime;
    performanceMonitor.trackAPICall(endpoint, duration, status);
    throw error;
  }
};

export default performanceMonitor;