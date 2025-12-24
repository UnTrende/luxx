/**
 * Validation utilities tests
 */
import { describe, it, expect } from 'vitest';
import { validateEmail, validatePassword, validatePhoneNumber } from '../../../utils/validation';

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com',
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test.example.com',
        'test @example.com',
        '',
        null,
        undefined,
      ];

      invalidEmails.forEach(email => {
        expect(validateEmail(email as any)).toBe(false);
      });
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const validPasswords = [
        'StrongPass123!',
        'MySecure@Password1',
        'Complex#Pass99',
      ];

      validPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        { password: 'short', expectedErrors: ['length'] },
        { password: 'alllowercase123', expectedErrors: ['uppercase'] },
        { password: 'ALLUPPERCASE123', expectedErrors: ['lowercase'] },
        { password: 'NoNumbers!', expectedErrors: ['number'] },
        { password: 'NoSpecialChars123', expectedErrors: ['special'] },
        { password: '', expectedErrors: ['length', 'uppercase', 'lowercase', 'number', 'special'] },
      ];

      weakPasswords.forEach(({ password, expectedErrors }) => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(false);
        expectedErrors.forEach(errorType => {
          expect(result.errors.some(error => error.includes(errorType))).toBe(true);
        });
      });
    });
  });

  describe('validatePhoneNumber', () => {
    it('should validate correct phone number formats', () => {
      const validPhones = [
        '+1234567890',
        '+44 20 7946 0958',
        '(555) 123-4567',
        '555-123-4567',
        '5551234567',
      ];

      validPhones.forEach(phone => {
        expect(validatePhoneNumber(phone)).toBe(true);
      });
    });

    it('should reject invalid phone number formats', () => {
      const invalidPhones = [
        'abc-def-ghij',
        '123',
        '+',
        '++1234567890',
        '',
        null,
        undefined,
      ];

      invalidPhones.forEach(phone => {
        expect(validatePhoneNumber(phone as any)).toBe(false);
      });
    });
  });
});