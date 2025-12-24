import { Component } from 'react';
import { logger } from '../../src/lib/logger';

// Simplified types for robustness
export interface TrackedError {
    id: string;
    type: 'api' | 'ui' | 'network' | 'validation' | 'security';
    message: string;
    stack?: string;
    url: string;
    userAgent: string;
    timestamp: Date;
    resolved: boolean;
}

export class ErrorTracker {
    private static instance: ErrorTracker;
    private errors: TrackedError[] = [];
    private readonly MAX_ERRORS = 100;

    private constructor() {
        this.setupGlobalErrorHandlers();
    }

    static getInstance(): ErrorTracker {
        if (!ErrorTracker.instance) {
            ErrorTracker.instance = new ErrorTracker();
        }
        return ErrorTracker.instance;
    }

    private setupGlobalErrorHandlers(): void {
        if (typeof window !== 'undefined') {
            window.addEventListener('error', (event) => {
                this.track({
                    type: 'ui',
                    message: event.message,
                    stack: event.error?.stack,
                    url: window.location.href,
                    userAgent: navigator.userAgent,
                });
            });

            window.addEventListener('unhandledrejection', (event) => {
                this.track({
                    type: 'api',
                    message: event.reason?.message || 'Unhandled promise rejection',
                    stack: event.reason?.stack,
                    url: window.location.href,
                    userAgent: navigator.userAgent,
                });
            });
        }
    }

    track(errorData: Omit<TrackedError, 'id' | 'timestamp' | 'resolved'>): void {
        const error: TrackedError = {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            resolved: false,
            ...errorData,
        };

        logger.error(`[ErrorTracker] ${error.type}:`, error.message, error, 'error-tracking');
        this.errors.unshift(error);
        if (this.errors.length > this.MAX_ERRORS) {
            this.errors = this.errors.slice(0, this.MAX_ERRORS);
        }
    }

    getErrors() {
        return this.errors;
    }
}

export const errorTracker = ErrorTracker.getInstance();
