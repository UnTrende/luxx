
export interface PerformanceMetrics {
    functionName: string;
    executionTime: number;
    memoryUsage: number;
    cacheHit: boolean;
    timestamp: Date;
}

export class PerformanceMonitor {
    private static instance: PerformanceMonitor;
    private metrics: PerformanceMetrics[] = [];
    private readonly MAX_METRICS = 1000;

    private constructor() { }

    static getInstance(): PerformanceMonitor {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    }

    async measure<T>(
        functionName: string,
        operation: () => Promise<T>,
        useCache: boolean = false
    ): Promise<T> {
        const startTime = performance.now();
        // Deno specific memory usage might need permissions or be unstable in some versions
        // Safe fallback to 0 if Deno.memoryUsage is not available without flag
        const startMemory = 0;

        try {
            let result: T;

            // Basic cache logic placeholder - can be expanded with Redis later
            result = await operation();

            constexecutionTime = performance.now() - startTime;
            const memoryUsage = 0; // Placeholder

            this.recordMetric({
                functionName,
                executionTime: performance.now() - startTime,
                memoryUsage: 0,
                cacheHit: false,
                timestamp: new Date(),
            });

            // Alert on slow functions (> 1s)
            if ((performance.now() - startTime) > 1000) {
                await this.alertSlowFunction(functionName, performance.now() - startTime);
            }

            return result;
        } catch (error) {
            await this.logError(functionName, error);
            throw error;
        }
    }

    private recordMetric(metric: PerformanceMetrics): void {
        this.metrics.push(metric);
        if (this.metrics.length > this.MAX_METRICS) {
            this.metrics = this.metrics.slice(-this.MAX_METRICS);
        }
    }

    private async alertSlowFunction(functionName: string, time: number): Promise<void> {
        logger.warn(`SLOW FUNCTION: ${functionName} took ${time}ms`, undefined, 'performance-monitor');
    }

    private async logError(functionName: string, error: Error | unknown): Promise<void> {
        logger.error(`FUNCTION ERROR [${functionName}]:`, error, 'performance-monitor');
    }
}

export const withPerformanceMonitor = <T>(
    functionName: string,
    handler: (req: Request) => Promise<T>
) => {
    return async (req: Request): Promise<T> => {
        const monitor = PerformanceMonitor.getInstance();
        return monitor.measure(functionName, async () => {
            return handler(req);
        });
    };
};
