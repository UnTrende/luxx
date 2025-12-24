/**
 * Production-ready logging utility
 * Replaces console.log statements with structured logging
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: string;
  source?: string;
}

class Logger {
  private level: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV || process.env.NODE_ENV === 'development';
    this.level = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
  }

  private formatMessage(level: LogLevel, message: string, data?: any, source?: string): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      source,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  private output(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    const prefix = `[${entry.timestamp}] ${LogLevel[entry.level]}`;
    const source = entry.source ? ` (${entry.source})` : '';
    
    if (this.isDevelopment) {
      // Development: use console for immediate feedback
      const method = entry.level >= LogLevel.ERROR ? 'error' : 
                    entry.level >= LogLevel.WARN ? 'warn' : 'log';
      console[method](`${prefix}${source}: ${entry.message}`, entry.data || '');
    } else {
      // Production: structured logging for monitoring
      console.log(JSON.stringify(entry));
    }
  }

  debug(message: string, data?: any, source?: string): void {
    this.output(this.formatMessage(LogLevel.DEBUG, message, data, source));
  }

  info(message: string, data?: any, source?: string): void {
    this.output(this.formatMessage(LogLevel.INFO, message, data, source));
  }

  warn(message: string, data?: any, source?: string): void {
    this.output(this.formatMessage(LogLevel.WARN, message, data, source));
  }

  error(message: string, error?: any, source?: string): void {
    this.output(this.formatMessage(LogLevel.ERROR, message, error, source));
  }

  // Performance logging
  time(label: string, source?: string): void {
    if (this.isDevelopment) {
      console.time(label);
    } else {
      this.debug(`Timer started: ${label}`, undefined, source);
    }
  }

  timeEnd(label: string, source?: string): void {
    if (this.isDevelopment) {
      console.timeEnd(label);
    } else {
      this.debug(`Timer ended: ${label}`, undefined, source);
    }
  }
}

export const logger = new Logger();

// Legacy console replacement (for gradual migration)
export const console_replacement = {
  log: (message: string, ...args: unknown[]) => logger.info(message, args.length > 0 ? args : undefined),
  warn: (message: string, ...args: unknown[]) => logger.warn(message, args.length > 0 ? args : undefined),
  error: (message: string, ...args: unknown[]) => logger.error(message, args.length > 0 ? args : undefined),
  info: (message: string, ...args: unknown[]) => logger.info(message, args.length > 0 ? args : undefined),
  debug: (message: string, ...args: unknown[]) => logger.debug(message, args.length > 0 ? args : undefined),
};