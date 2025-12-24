/**
 * Enhanced Security Module
 * Implements double-submit CSRF protection and other security measures
 */

import { logger } from './logger';

interface CSRFTokenPair {
  headerToken: string;
  cookieToken: string;
  timestamp: number;
}

class SecurityManager {
  private static instance: SecurityManager;
  private csrfTokens: Map<string, CSRFTokenPair> = new Map();
  private readonly TOKEN_LIFETIME = 3600000; // 1 hour
  private readonly COOKIE_NAME = 'csrf_token';

  static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  /**
   * Generate cryptographically secure random token
   */
  private generateSecureToken(): string {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    
    // Fallback for environments without crypto.getRandomValues
    return Math.random().toString(36).substring(2) + 
           Math.random().toString(36).substring(2) + 
           Date.now().toString(36);
  }

  /**
   * Generate CSRF token pair for double-submit pattern
   */
  async generateCSRFTokenPair(): Promise<CSRFTokenPair> {
    const headerToken = this.generateSecureToken();
    const cookieToken = this.generateSecureToken();
    const timestamp = Date.now();
    
    const tokenPair: CSRFTokenPair = {
      headerToken,
      cookieToken,
      timestamp
    };

    // Store for validation (using headerToken as key)
    this.csrfTokens.set(headerToken, tokenPair);
    
    // Clean up expired tokens
    this.cleanupExpiredTokens();
    
    logger.debug('CSRF token pair generated', { 
      headerTokenPrefix: headerToken.substring(0, 8),
      timestamp 
    }, 'SecurityManager');
    
    return tokenPair;
  }

  /**
   * Set CSRF cookie (secure, httpOnly where possible)
   */
  setCSRFCookie(cookieToken: string): void {
    if (typeof document !== 'undefined') {
      // Client-side: set secure cookie
      const cookieOptions = [
        `${this.COOKIE_NAME}=${cookieToken}`,
        'Path=/',
        'SameSite=Strict',
        `Max-Age=${this.TOKEN_LIFETIME / 1000}`
      ];
      
      // Add Secure flag in production
      if (location.protocol === 'https:') {
        cookieOptions.push('Secure');
      }
      
      document.cookie = cookieOptions.join('; ');
      
      logger.debug('CSRF cookie set', { 
        cookieTokenPrefix: cookieToken.substring(0, 8),
        secure: location.protocol === 'https:'
      }, 'SecurityManager');
    }
  }

  /**
   * Get CSRF cookie value
   */
  getCSRFCookie(): string | null {
    if (typeof document === 'undefined') return null;
    
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === this.COOKIE_NAME) {
        return value || null;
      }
    }
    return null;
  }

  /**
   * Validate CSRF token pair (double-submit pattern)
   */
  validateCSRFTokens(headerToken: string, cookieToken: string): boolean {
    try {
      const stored = this.csrfTokens.get(headerToken);
      
      if (!stored) {
        logger.warn('CSRF validation failed: token not found', { 
          headerTokenPrefix: headerToken.substring(0, 8) 
        }, 'SecurityManager');
        return false;
      }
      
      // Check if token has expired
      if (Date.now() - stored.timestamp > this.TOKEN_LIFETIME) {
        this.csrfTokens.delete(headerToken);
        logger.warn('CSRF validation failed: token expired', { 
          headerTokenPrefix: headerToken.substring(0, 8),
          age: Date.now() - stored.timestamp
        }, 'SecurityManager');
        return false;
      }
      
      // Validate both tokens match
      const isValid = stored.headerToken === headerToken && 
                     stored.cookieToken === cookieToken;
      
      if (isValid) {
        logger.debug('CSRF validation successful', { 
          headerTokenPrefix: headerToken.substring(0, 8) 
        }, 'SecurityManager');
      } else {
        logger.warn('CSRF validation failed: token mismatch', { 
          headerTokenPrefix: headerToken.substring(0, 8) 
        }, 'SecurityManager');
      }
      
      return isValid;
    } catch (error) {
      logger.error('CSRF validation error', error, 'SecurityManager');
      return false;
    }
  }

  /**
   * Initialize CSRF protection for the session
   */
  async initializeCSRFProtection(): Promise<string> {
    try {
      const tokenPair = await this.generateCSRFTokenPair();
      this.setCSRFCookie(tokenPair.cookieToken);
      
      logger.info('CSRF protection initialized', undefined, 'SecurityManager');
      return tokenPair.headerToken;
    } catch (error) {
      logger.error('Failed to initialize CSRF protection', error, 'SecurityManager');
      throw new Error('Security initialization failed');
    }
  }

  /**
   * Get headers for secure API requests
   */
  getSecureHeaders(headerToken?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest', // CSRF protection
    };

    if (headerToken) {
      headers['X-CSRF-Token'] = headerToken;
    }

    // Add additional security headers
    headers['X-Client-Version'] = process.env.REACT_APP_VERSION || '1.0.0';
    headers['X-Client-Timestamp'] = Date.now().toString();

    return headers;
  }

  /**
   * Clean up expired CSRF tokens
   */
  private cleanupExpiredTokens(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, token] of this.csrfTokens.entries()) {
      if (now - token.timestamp > this.TOKEN_LIFETIME) {
        this.csrfTokens.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      logger.debug('Cleaned up expired CSRF tokens', { count: cleanedCount }, 'SecurityManager');
    }
  }

  /**
   * Validate request origin (CORS protection)
   */
  validateOrigin(origin: string, allowedOrigins: string[]): boolean {
    if (!origin) return false;
    
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed === '*') return true;
      if (allowed.includes('*')) {
        // Wildcard subdomain matching
        const pattern = allowed.replace(/\*/g, '.*');
        return new RegExp(`^${pattern}$`).test(origin);
      }
      return allowed === origin;
    });
    
    if (!isAllowed) {
      logger.warn('Origin validation failed', { 
        origin, 
        allowedOrigins 
      }, 'SecurityManager');
    }
    
    return isAllowed;
  }

  /**
   * Rate limiting helper
   */
  checkRateLimit(identifier: string, limit: number, windowMs: number): boolean {
    // Implementation would use a proper rate limiting store
    // For now, return true (to be implemented with Redis/memory store)
    return true;
  }

  /**
   * Input sanitization
   */
  sanitizeInput(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Content Security Policy helpers
   */
  generateCSPNonce(): string {
    return this.generateSecureToken().substring(0, 16);
  }

  /**
   * Session security validation
   */
  validateSession(sessionData: any): boolean {
    if (!sessionData || typeof sessionData !== 'object') return false;
    
    // Check required fields
    if (!sessionData.user || !sessionData.expires_at) return false;
    
    // Check expiration
    const expiresAt = new Date(sessionData.expires_at);
    if (expiresAt <= new Date()) {
      logger.warn('Session validation failed: expired', { 
        expiresAt 
      }, 'SecurityManager');
      return false;
    }
    
    return true;
  }
}

// Export singleton instance
export const security = SecurityManager.getInstance();

// Helper functions for common security operations
export const generateCSRFToken = () => security.initializeCSRFProtection();
export const validateCSRF = (headerToken: string, cookieToken: string) => 
  security.validateCSRFTokens(headerToken, cookieToken);
export const getSecureHeaders = (csrfToken?: string) => 
  security.getSecureHeaders(csrfToken);
export const sanitizeInput = (input: string) => security.sanitizeInput(input);

export default security;