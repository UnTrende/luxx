// Declare Deno for TypeScript
declare const Deno: unknown;

import { supabaseAdmin } from '../_shared/supabaseClient.ts';
import { logger } from '../../../src/lib/logger';

export class MetricsCollector {
  private static instance: MetricsCollector;
  private batch: unknown[] = [];
  private batchSize = 50;
  private flushInterval = 10000; // 10 seconds
  
  private constructor() {
    // Auto-flush metrics
    setInterval(() => this.flush(), this.flushInterval);
  }
  
  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }
  
  async record(metric: {
    name: string;
    value: number;
    type: 'counter' | 'gauge' | 'histogram';
    tags?: Record<string, string>;
    timestamp?: string;
  }) {
    this.batch.push({
      ...metric,
      timestamp: metric.timestamp || new Date().toISOString(),
      environment: typeof Deno !== 'undefined' && Deno.env && Deno.env.get('ENVIRONMENT') || 'development'
    });
    
    if (this.batch.length >= this.batchSize) {
      await this.flush();
    }
  }
  
  async recordRequest(
    functionName: string,
    duration: number,
    status: number,
    userId?: string
  ) {
    await this.record({
      name: 'function.request.duration',
      value: duration,
      type: 'histogram',
      tags: {
        function: functionName,
        status: status.toString(),
        user_type: userId ? 'authenticated' : 'anonymous'
      }
    });
    
    await this.record({
      name: 'function.request.count',
      value: 1,
      type: 'counter',
      tags: {
        function: functionName,
        status: status.toString()
      }
    });
  }
  
  async recordCacheHit(miss: boolean) {
    await this.record({
      name: `cache.${miss ? 'miss' : 'hit'}`,
      value: 1,
      type: 'counter'
    });
  }
  
  async recordValidation(success: boolean, schema: string) {
    await this.record({
      name: `validation.${success ? 'success' : 'failure'}`,
      value: 1,
      type: 'counter',
      tags: { schema }
    });
  }
  
  private async flush() {
    if (this.batch.length === 0) return;
    
    const batchToSend = [...this.batch];
    this.batch = [];
    
    try {
      // In a real implementation, this would insert into a metrics table
      logger.info('Flushing metrics:', batchToSend, 'metrics');
    } catch (error) {
      logger.error('Failed to send metrics:', error, 'metrics');
      // Re-add failed batch
      this.batch = [...batchToSend, ...this.batch];
    }
  }
}