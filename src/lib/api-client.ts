/**
 * API Client with Service Boundary Enforcement
 * Implements contract-based communication between services
 */

import { logger } from './logger';
import { security } from './security';

interface ApiClientConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  version: string;
  service: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

interface RetryConfig {
  attempts: number;
  delay: number;
  backoff: 'linear' | 'exponential';
  retryableStatuses: number[];
}

class ApiClient {
  private config: ApiClientConfig;
  private defaultRetryConfig: RetryConfig = {
    attempts: 3,
    delay: 1000,
    backoff: 'exponential',
    retryableStatuses: [408, 429, 500, 502, 503, 504]
  };

  constructor(config: ApiClientConfig) {
    this.config = config;
  }

  /**
   * Make HTTP request with retry logic and error handling
   */
  async request<T>(
    endpoint: string,
    options: RequestInit & {
      retryConfig?: Partial<RetryConfig>;
      skipAuth?: boolean;
    } = {}
  ): Promise<ApiResponse<T>> {
    const { retryConfig, skipAuth, ...fetchOptions } = options;
    const finalRetryConfig = { ...this.defaultRetryConfig, ...retryConfig };
    
    let lastError: Error;
    
    for (let attempt = 1; attempt <= finalRetryConfig.attempts; attempt++) {
      try {
        const response = await this.executeRequest<T>(endpoint, fetchOptions, skipAuth);
        
        // If successful or non-retryable error, return response
        if (response.success || !this.isRetryableError(response, finalRetryConfig)) {
          return response;
        }
        
        // Log retry attempt
        if (attempt < finalRetryConfig.attempts) {
          logger.warn('API request failed, retrying', {
            endpoint,
            attempt,
            maxAttempts: finalRetryConfig.attempts,
            service: this.config.service
          }, 'ApiClient');
        }
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === finalRetryConfig.attempts || !this.isRetryableError(error, finalRetryConfig)) {
          break;
        }
      }
      
      // Wait before retry
      if (attempt < finalRetryConfig.attempts) {
        const delay = this.calculateDelay(attempt, finalRetryConfig);
        await this.sleep(delay);
      }
    }
    
    // All retries failed
    logger.error('API request failed after all retries', {
      endpoint,
      attempts: finalRetryConfig.attempts,
      service: this.config.service,
      error: lastError.message
    }, 'ApiClient');
    
    throw lastError;
  }

  private async executeRequest<T>(
    endpoint: string,
    options: RequestInit,
    skipAuth?: boolean
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.baseUrl}/api/${this.config.version}${endpoint}`;
    const requestId = this.generateRequestId();
    
    // Prepare headers
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');
    headers.set('X-Request-ID', requestId);
    headers.set('X-Service-Name', this.config.service);
    headers.set('X-API-Version', this.config.version);
    
    // Add authentication if not skipped
    if (!skipAuth) {
      const secureHeaders = security.getSecureHeaders();
      Object.entries(secureHeaders).forEach(([key, value]) => {
        headers.set(key, value);
      });
    }
    
    const startTime = performance.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
      
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const duration = performance.now() - startTime;
      
      // Parse response
      const responseData = await this.parseResponse<T>(response);
      
      // Log request
      logger.info('API request completed', {
        endpoint,
        method: options.method || 'GET',
        status: response.status,
        duration: Math.round(duration),
        requestId,
        service: this.config.service
      }, 'ApiClient');
      
      return responseData;
      
    } catch (error) {
      const duration = performance.now() - startTime;
      
      logger.error('API request failed', {
        endpoint,
        method: options.method || 'GET',
        duration: Math.round(duration),
        requestId,
        service: this.config.service,
        error: error instanceof Error ? error.message : String(error)
      }, 'ApiClient');
      
      throw error;
    }
  }

  private async parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
    let responseData: unknown;
    
    try {
      responseData = await response.json();
    } catch {
      // Non-JSON response
      responseData = {
        success: response.ok,
        error: response.ok ? undefined : {
          code: `HTTP_${response.status}`,
          message: response.statusText
        }
      };
    }
    
    // Ensure response follows contract
    if (!this.isValidApiResponse(responseData)) {
      return {
        success: false,
        error: {
          code: 'INVALID_RESPONSE_FORMAT',
          message: 'Response does not follow API contract'
        }
      };
    }
    
    return responseData;
  }

  private isValidApiResponse(data: Record<string, unknown>): data is ApiResponse<any> {
    return (
      typeof data === 'object' &&
      data !== null &&
      typeof data.success === 'boolean' &&
      (data.data === undefined || data.data !== null) &&
      (data.error === undefined || this.isValidErrorObject(data.error))
    );
  }

  private isValidErrorObject(error: any): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      typeof error.code === 'string' &&
      typeof error.message === 'string'
    );
  }

  private isRetryableError(error: any, config: RetryConfig): boolean {
    // Network errors are retryable
    if (error instanceof Error) {
      return error.name === 'AbortError' || error.message.includes('fetch');
    }
    
    // HTTP status-based retry
    if (typeof error === 'object' && error?.error?.code) {
      const statusMatch = error.error.code.match(/HTTP_(\d+)/);
      if (statusMatch) {
        const status = parseInt(statusMatch[1]);
        return config.retryableStatuses.includes(status);
      }
    }
    
    return false;
  }

  private calculateDelay(attempt: number, config: RetryConfig): number {
    if (config.backoff === 'linear') {
      return config.delay * attempt;
    } else {
      return config.delay * Math.pow(2, attempt - 1);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  // Convenience methods for different HTTP verbs
  async get<T>(endpoint: string, options?: Omit<RequestInit, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any, options?: Omit<RequestInit, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async put<T>(endpoint: string, data?: any, options?: Omit<RequestInit, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async patch<T>(endpoint: string, data?: any, options?: Omit<RequestInit, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async delete<T>(endpoint: string, options?: Omit<RequestInit, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Service-specific API clients
export const authApiClient = new ApiClient({
  baseUrl: process.env.REACT_APP_AUTH_SERVICE_URL || '',
  timeout: 5000,
  retries: 3,
  version: 'v1',
  service: 'auth'
});

export const barberApiClient = new ApiClient({
  baseUrl: process.env.REACT_APP_BARBER_SERVICE_URL || '',
  timeout: 10000,
  retries: 3,
  version: 'v1',
  service: 'barber'
});

export const bookingApiClient = new ApiClient({
  baseUrl: process.env.REACT_APP_BOOKING_SERVICE_URL || '',
  timeout: 15000,
  retries: 5,
  version: 'v1',
  service: 'booking'
});

export default ApiClient;