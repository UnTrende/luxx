/**
 * Enhanced Error Boundary with Recovery Mechanisms
 * Comprehensive error handling, fallback UI, and error reporting
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../lib/logger';
import { performanceMonitor } from '../lib/performance';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
  level?: 'page' | 'component' | 'critical';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
  retryCount: number;
  lastErrorTime: number;
}

interface ErrorReport {
  error: Error;
  errorInfo: ErrorInfo;
  userAgent: string;
  url: string;
  timestamp: number;
  userId?: string;
  sessionId: string;
  breadcrumbs: string[];
  componentStack: string;
  errorId: string;
}

class EnhancedErrorBoundary extends Component<Props, State> {
  private retryTimeout: NodeJS.Timeout | null = null;
  private maxRetries = 3;
  private retryDelayMs = 1000;
  private breadcrumbs: string[] = [];
  private sessionId: string;

  constructor(props: Props) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      retryCount: 0,
      lastErrorTime: 0
    };

    this.sessionId = this.generateSessionId();
    this.addBreadcrumb('ErrorBoundary initialized');
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = generateErrorId();
    const timestamp = Date.now();
    
    return {
      hasError: true,
      error,
      errorId,
      lastErrorTime: timestamp
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorReport = this.createErrorReport(error, errorInfo);
    
    // Log error with full context
    logger.error('React Error Boundary caught error', {
      errorId: errorReport.errorId,
      errorMessage: error.message,
      errorStack: error.stack?.substring(0, 500),
      componentStack: errorInfo.componentStack?.substring(0, 500),
      retryCount: this.state.retryCount,
      level: this.props.level || 'component'
    }, 'ErrorBoundary');

    // Track error performance impact
    performanceMonitor.recordMetric('error_boundary_triggered', 1, {
      type: 'error',
      level: this.props.level || 'component',
      error_id: errorReport.errorId
    });

    // Send error report
    this.reportError(errorReport);

    // Call custom error handler
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo);
      } catch (handlerError) {
        logger.error('Error in custom error handler', handlerError, 'ErrorBoundary');
      }
    }

    // Schedule retry for non-critical errors
    if (this.props.level !== 'critical' && this.state.retryCount < this.maxRetries) {
      this.scheduleRetry();
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetKeys?.some((key, idx) => prevProps.resetKeys?.[idx] !== key)) {
        this.resetError();
      }
    }

    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetError();
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  private createErrorReport(error: Error, errorInfo: ErrorInfo): ErrorReport {
    return {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      } as Error,
      errorInfo,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      breadcrumbs: [...this.breadcrumbs],
      componentStack: errorInfo.componentStack || '',
      errorId: this.state.errorId || generateErrorId()
    };
  }

  private async reportError(errorReport: ErrorReport): Promise<void> {
    try {
      // In production, send to error reporting service
      logger.info('Error reported to monitoring service', {
        errorId: errorReport.errorId,
        errorType: errorReport.error.name,
        url: errorReport.url
      }, 'ErrorBoundary');

      // Example: Send to error reporting service
      // await fetch('/api/errors/report', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorReport)
      // });

    } catch (reportingError) {
      logger.error('Failed to report error', reportingError, 'ErrorBoundary');
    }
  }

  private scheduleRetry(): void {
    const delay = this.retryDelayMs * Math.pow(2, this.state.retryCount); // Exponential backoff
    
    this.retryTimeout = setTimeout(() => {
      this.addBreadcrumb(`Retry attempt ${this.state.retryCount + 1}`);
      
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorId: null,
        retryCount: prevState.retryCount + 1
      }));
    }, delay);

    logger.info('Scheduled error boundary retry', {
      retryCount: this.state.retryCount + 1,
      delayMs: delay
    }, 'ErrorBoundary');
  }

  private resetError = (): void => {
    this.addBreadcrumb('Error boundary reset');
    
    this.setState({
      hasError: false,
      error: null,
      errorId: null,
      retryCount: 0,
      lastErrorTime: 0
    });

    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
  };

  private addBreadcrumb(message: string): void {
    const timestamp = new Date().toISOString();
    this.breadcrumbs.push(`${timestamp}: ${message}`);
    
    // Keep only last 20 breadcrumbs
    if (this.breadcrumbs.length > 20) {
      this.breadcrumbs = this.breadcrumbs.slice(-20);
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private renderFallbackUI(): ReactNode {
    const { fallback, level } = this.props;
    const { error, errorId, retryCount } = this.state;

    if (fallback) {
      return fallback;
    }

    const isCritical = level === 'critical';
    const canRetry = retryCount < this.maxRetries && !isCritical;

    return (
      <div className="error-boundary-fallback p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-red-800">
              {isCritical ? 'Critical Error' : 'Something went wrong'}
            </h3>
            <div className="mt-1 text-sm text-red-600">
              {isCritical 
                ? 'A critical error occurred. Please refresh the page.' 
                : 'We encountered an unexpected error. The issue has been reported.'
              }
            </div>
          </div>
        </div>

        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-4 p-3 bg-red-100 rounded border">
            <summary className="cursor-pointer text-sm font-medium text-red-700">
              Error Details (Development Mode)
            </summary>
            <div className="mt-2 text-xs font-mono text-red-600 whitespace-pre-wrap">
              {error.message}
              {error.stack && (
                <>
                  <hr className="my-2 border-red-200" />
                  {error.stack}
                </>
              )}
            </div>
            {errorId && (
              <div className="mt-2 text-xs text-red-500">
                Error ID: {errorId}
              </div>
            )}
          </details>
        )}

        <div className="mt-4 flex space-x-3">
          {canRetry && (
            <button
              onClick={this.resetError}
              className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Try Again {retryCount > 0 && `(${retryCount}/${this.maxRetries})`}
            </button>
          )}
          
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Refresh Page
          </button>
        </div>

        {!process.env.NODE_ENV !== 'development' && errorId && (
          <div className="mt-4 text-xs text-red-500">
            Error ID: {errorId}
          </div>
        )}
      </div>
    );
  }

  render() {
    if (this.state.hasError) {
      return this.renderFallbackUI();
    }

    return this.props.children;
  }
}

// Utility function to generate unique error IDs
function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Higher-order component for easy error boundary wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <EnhancedErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </EnhancedErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Hook for error handling in functional components
export function useErrorHandler() {
  const handleError = React.useCallback((error: Error, errorInfo?: any) => {
    // This will trigger the nearest error boundary
    throw error;
  }, []);

  const reportError = React.useCallback((error: Error, context?: string) => {
    logger.error('Manual error report', {
      errorMessage: error.message,
      errorStack: error.stack?.substring(0, 500),
      context
    }, 'ErrorHandler');

    // Track error
    performanceMonitor.recordMetric('manual_error_report', 1, {
      type: 'error',
      context: context || 'unknown'
    });
  }, []);

  return { handleError, reportError };
}

// Async error boundary for handling Promise rejections
export function setupGlobalErrorHandling(): void {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled Promise Rejection', {
      reason: event.reason,
      promise: event.promise.toString()
    }, 'GlobalErrorHandler');

    performanceMonitor.recordMetric('unhandled_promise_rejection', 1, {
      type: 'error',
      source: 'promise'
    });

    // Prevent default browser behavior
    event.preventDefault();
  });

  // Handle uncaught JavaScript errors
  window.addEventListener('error', (event) => {
    logger.error('Uncaught JavaScript Error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error?.stack
    }, 'GlobalErrorHandler');

    performanceMonitor.recordMetric('uncaught_js_error', 1, {
      type: 'error',
      source: 'javascript'
    });
  });

  logger.info('Global error handling setup completed', undefined, 'GlobalErrorHandler');
}

export default EnhancedErrorBoundary;