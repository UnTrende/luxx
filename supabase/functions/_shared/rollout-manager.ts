// Declare Deno for TypeScript
declare const Deno: unknown;

export class GradualRollout {
  static shouldEnableForUser(
    userId: string,
    feature: string,
    rolloutPercent: number
  ): boolean {
    if (rolloutPercent >= 100) return true;
    if (rolloutPercent <= 0) return false;
    
    // Consistent hash based on user ID
    const hash = this.hashString(userId + feature);
    const userPercent = hash % 100;
    
    return userPercent < rolloutPercent;
  }
  
  static getRolloutConfig(feature: string): {
    currentPercent: number;
    targetPercent: number;
    increment?: number;
    minTimeBetweenIncrements?: number;
    metricsThreshold?: number;
  } {
    // In a real implementation, this would read from environment variables or a config table
    const configs: Record<string, any> = {
      'strict_validation': {
        currentPercent: typeof Deno !== 'undefined' && Deno.env && parseInt(Deno.env.get('FF_STRICT_VALIDATION_PERCENT') || '0') || 0,
        targetPercent: 100,
        increment: 25,
        minTimeBetweenIncrements: 24 * 60 * 60 * 1000, // 24 hours
        metricsThreshold: 0.01 // 1% error rate
      },
      'caching': {
        currentPercent: 100, // Enable for all immediately
        targetPercent: 100,
        increment: 100,
        minTimeBetweenIncrements: 0
      }
    };
    
    return configs[feature] || { currentPercent: 0, targetPercent: 0 };
  }
  
  static async evaluateAndAdjust(feature: string) {
    const config = this.getRolloutConfig(feature);
    
    // Check if we should increase rollout
    if (config.currentPercent < config.targetPercent) {
      // In a real implementation, this would check metrics
      const metrics = await this.getFeatureMetrics(feature);
      
      if (metrics.errorRate < (config.metricsThreshold || 0.01)) {
        // Note: In a real implementation, we would track lastIncrement time
        const timeSinceLastIncrement = Date.now() - Date.now(); // Placeholder
        
        if (timeSinceLastIncrement > (config.minTimeBetweenIncrements || 0)) {
          const newPercent = Math.min(
            config.currentPercent + (config.increment || 0),
            config.targetPercent
          );
          
          await this.updateRolloutPercent(feature, newPercent);
          await this.logRolloutChange(feature, config.currentPercent, newPercent);
        }
      }
    }
  }
  
  private static hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
  
  private static async getFeatureMetrics(feature: string): Promise<{ errorRate: number }> {
    // In a real implementation, this would fetch actual metrics
    return { errorRate: 0.005 }; // 0.5% error rate
  }
  
  private static async updateRolloutPercent(feature: string, newPercent: number) {
    // In a real implementation, this would update environment variables or a config table
    logger.info(`Updating ${feature} rollout percent to ${newPercent}%`, undefined, 'rollout-manager');
  }
  
  private static async logRolloutChange(feature: string, oldPercent: number, newPercent: number) {
    // In a real implementation, this would log to a rollout_log table
    logger.info(`Rollout change for ${feature}: ${oldPercent}% → ${newPercent}%`, undefined, 'rollout-manager');
  }
}