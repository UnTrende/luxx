import { supabaseAdmin } from '../_shared/supabaseClient.ts';
import { logger } from '../../../src/lib/logger';

export class AlertManager {
  static async checkAndAlert() {
    // Check for critical errors in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    try {
      const { data: errors, error } = await supabaseAdmin
        .from('security_logs')
        .select('*')
        .eq('severity', 'critical')
        .gte('created_at', fiveMinutesAgo);
      
      if (error) throw error;
      
      if (errors && errors.length > 0) {
        await this.sendAlert({
          title: '🚨 Critical Errors Detected',
          message: `${errors.length} critical errors in last 5 minutes`,
          level: 'critical',
          data: errors
        });
      }
      
      // Check error rate
      const { data: metrics } = await supabaseAdmin
        .from('deployment_monitoring')
        .select('*')
        .gte('created_at', fiveMinutesAgo);
      
      if (metrics) {
        const totalRequests = metrics.filter(m => m.status !== 'error').length || 0;
        const errorRequests = metrics.filter(m => m.status === 'error').length || 0;
        const errorRate = totalRequests > 0 ? errorRequests / totalRequests : 0;
        
        if (errorRate > 0.05) { // 5% error rate threshold
          await this.sendAlert({
            title: '⚠️ High Error Rate',
            message: `Error rate is ${(errorRate * 100).toFixed(1)}%`,
            level: 'warning',
            data: { errorRate, totalRequests, errorRequests }
          });
        }
      }
    } catch (error) {
      logger.error('Error checking alerts:', error, 'alerts');
    }
  }
  
  static async sendAlert(alert: {
    title: string;
    message: string;
    level: 'info' | 'warning' | 'critical';
    data?: unknown;
  }) {
    // Send to console for now
    logger.info(`ALERT [${alert.level}]: ${alert.title} - ${alert.message}`, undefined, 'alerts');
    
    // In a real implementation, this would:
    // 1. Send to Slack/webhook if configured
    // 2. Insert into alerts table
    // 3. Send email notifications
    
    // Send to database
    try {
      await supabaseAdmin.from('security_logs').insert({
        event_type: 'alert',
        details: {
          title: alert.title,
          message: alert.message,
          level: alert.level,
          data: alert.data
        },
        severity: alert.level,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to log alert to database:', error, 'alerts');
    }
  }
}