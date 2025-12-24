import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../src/lib/logger';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        logger.error('Uncaught error:', error, errorInfo, 'ErrorBoundary');
        // In a real app, you might send this to Sentry or another error logging service
    }

    public handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-midnight text-light-text p-4">
                    <div className="bg-charcoal-card p-8 rounded-xl shadow-lg max-w-md w-full text-center border border-gray-800">
                        <h1 className="text-2xl font-bold text-red-500 mb-4">Something went wrong</h1>
                        <p className="text-subtle-text mb-6">
                            We're sorry, but an unexpected error occurred.
                        </p>
                        {this.state.error && (
                            <div className="bg-black/30 p-4 rounded-md mb-6 overflow-auto text-left max-h-40 text-xs font-mono text-red-300">
                                {this.state.error.toString()}
                            </div>
                        )}
                        <button
                            onClick={this.handleReset}
                            className="bg-lime-accent text-dark-text font-bold py-2 px-6 rounded-lg hover:brightness-110 transition-all"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
