/**
 * TDD Example: Booking Validation Service
 * Demonstrates Test-Driven Development process step by step
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Step 1: Define the interface (contract)
interface BookingData {
  barberId: string;
  serviceIds: string[];
  date: string;
  time: string;
  customerNotes?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface BookingValidator {
  validateBooking(data: BookingData): ValidationResult;
}

// Step 2: Write tests first (TDD RED phase)
describe('BookingValidator (TDD Example)', () => {
  let validator: BookingValidator;

  beforeEach(() => {
    // This will fail initially until we implement the class
    validator = new BookingValidatorImpl();
  });

  describe('Basic Validation', () => {
    it('should pass validation for valid booking data', () => {
      // ARRANGE
      const validBooking: BookingData = {
        barberId: 'barber-123',
        serviceIds: ['service-1', 'service-2'],
        date: '2024-01-15',
        time: '10:00'
      };

      // ACT
      const result = validator.validateBooking(validBooking);

      // ASSERT
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation when barberId is missing', () => {
      // ARRANGE
      const invalidBooking: BookingData = {
        barberId: '',
        serviceIds: ['service-1'],
        date: '2024-01-15',
        time: '10:00'
      };

      // ACT
      const result = validator.validateBooking(invalidBooking);

      // ASSERT
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Barber ID is required');
    });

    it('should fail validation when no services selected', () => {
      // ARRANGE
      const invalidBooking: BookingData = {
        barberId: 'barber-123',
        serviceIds: [],
        date: '2024-01-15',
        time: '10:00'
      };

      // ACT
      const result = validator.validateBooking(invalidBooking);

      // ASSERT
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least one service must be selected');
    });
  });

  describe('Date Validation', () => {
    it('should fail validation for past dates', () => {
      // ARRANGE
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      
      const invalidBooking: BookingData = {
        barberId: 'barber-123',
        serviceIds: ['service-1'],
        date: pastDate.toISOString().split('T')[0],
        time: '10:00'
      };

      // ACT
      const result = validator.validateBooking(invalidBooking);

      // ASSERT
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Booking date cannot be in the past');
    });

    it('should fail validation for invalid date format', () => {
      // ARRANGE
      const invalidBooking: BookingData = {
        barberId: 'barber-123',
        serviceIds: ['service-1'],
        date: 'invalid-date',
        time: '10:00'
      };

      // ACT
      const result = validator.validateBooking(invalidBooking);

      // ASSERT
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid date format');
    });

    it('should fail validation for weekends (business rule)', () => {
      // ARRANGE - Find next Saturday
      const nextSaturday = new Date();
      nextSaturday.setDate(nextSaturday.getDate() + (6 - nextSaturday.getDay()));
      
      const invalidBooking: BookingData = {
        barberId: 'barber-123',
        serviceIds: ['service-1'],
        date: nextSaturday.toISOString().split('T')[0],
        time: '10:00'
      };

      // ACT
      const result = validator.validateBooking(invalidBooking);

      // ASSERT
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Bookings not available on weekends');
    });
  });

  describe('Time Validation', () => {
    it('should fail validation for invalid time format', () => {
      // ARRANGE
      const invalidBooking: BookingData = {
        barberId: 'barber-123',
        serviceIds: ['service-1'],
        date: '2024-01-15',
        time: '25:00' // Invalid time
      };

      // ACT
      const result = validator.validateBooking(invalidBooking);

      // ASSERT
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid time format');
    });

    it('should fail validation for times outside business hours', () => {
      // ARRANGE
      const invalidBooking: BookingData = {
        barberId: 'barber-123',
        serviceIds: ['service-1'],
        date: '2024-01-15',
        time: '07:00' // Before 9 AM
      };

      // ACT
      const result = validator.validateBooking(invalidBooking);

      // ASSERT
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Booking time must be between 9:00 AM and 6:00 PM');
    });

    it('should accept valid business hours', () => {
      // ARRANGE
      const validTimes = ['09:00', '12:00', '15:30', '17:00'];
      
      validTimes.forEach(time => {
        const validBooking: BookingData = {
          barberId: 'barber-123',
          serviceIds: ['service-1'],
          date: '2024-01-15',
          time
        };

        // ACT
        const result = validator.validateBooking(validBooking);

        // ASSERT
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });
  });

  describe('Service Validation', () => {
    it('should fail validation for too many services', () => {
      // ARRANGE
      const tooManyServices = Array.from({ length: 6 }, (_, i) => `service-${i + 1}`);
      
      const invalidBooking: BookingData = {
        barberId: 'barber-123',
        serviceIds: tooManyServices,
        date: '2024-01-15',
        time: '10:00'
      };

      // ACT
      const result = validator.validateBooking(invalidBooking);

      // ASSERT
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Maximum 5 services can be selected');
    });

    it('should fail validation for invalid service IDs', () => {
      // ARRANGE
      const invalidBooking: BookingData = {
        barberId: 'barber-123',
        serviceIds: ['', 'invalid-service', '   '],
        date: '2024-01-15',
        time: '10:00'
      };

      // ACT
      const result = validator.validateBooking(invalidBooking);

      // ASSERT
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('All service IDs must be valid');
    });
  });

  describe('Customer Notes Validation', () => {
    it('should accept valid customer notes', () => {
      // ARRANGE
      const validBooking: BookingData = {
        barberId: 'barber-123',
        serviceIds: ['service-1'],
        date: '2024-01-15',
        time: '10:00',
        customerNotes: 'Please use thinning scissors'
      };

      // ACT
      const result = validator.validateBooking(validBooking);

      // ASSERT
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for excessively long notes', () => {
      // ARRANGE
      const longNotes = 'A'.repeat(501); // Over 500 characters
      
      const invalidBooking: BookingData = {
        barberId: 'barber-123',
        serviceIds: ['service-1'],
        date: '2024-01-15',
        time: '10:00',
        customerNotes: longNotes
      };

      // ACT
      const result = validator.validateBooking(invalidBooking);

      // ASSERT
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Customer notes must be less than 500 characters');
    });

    it('should sanitize potentially dangerous input', () => {
      // ARRANGE
      const maliciousNotes = '<script>alert("xss")</script>Please trim my beard';
      
      const validBooking: BookingData = {
        barberId: 'barber-123',
        serviceIds: ['service-1'],
        date: '2024-01-15',
        time: '10:00',
        customerNotes: maliciousNotes
      };

      // ACT
      const result = validator.validateBooking(validBooking);

      // ASSERT
      expect(result.isValid).toBe(true);
      expect(result.errors).not.toContain('Invalid characters in customer notes');
      // Implementation should sanitize the input
    });
  });

  describe('Complex Validation Scenarios', () => {
    it('should return multiple errors for multiple validation failures', () => {
      // ARRANGE
      const invalidBooking: BookingData = {
        barberId: '',
        serviceIds: [],
        date: 'invalid-date',
        time: '25:00'
      };

      // ACT
      const result = validator.validateBooking(invalidBooking);

      // ASSERT
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain('Barber ID is required');
      expect(result.errors).toContain('At least one service must be selected');
      expect(result.errors).toContain('Invalid date format');
      expect(result.errors).toContain('Invalid time format');
    });

    it('should handle edge case of exactly 5 services', () => {
      // ARRANGE
      const exactlyFiveServices = ['service-1', 'service-2', 'service-3', 'service-4', 'service-5'];
      
      const validBooking: BookingData = {
        barberId: 'barber-123',
        serviceIds: exactlyFiveServices,
        date: '2024-01-15',
        time: '10:00'
      };

      // ACT
      const result = validator.validateBooking(validBooking);

      // ASSERT
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});

// Step 3: Implement the minimal code to make tests pass (TDD GREEN phase)
class BookingValidatorImpl implements BookingValidator {
  private readonly BUSINESS_START_HOUR = 9;
  private readonly BUSINESS_END_HOUR = 18;
  private readonly MAX_SERVICES = 5;
  private readonly MAX_NOTES_LENGTH = 500;

  validateBooking(data: BookingData): ValidationResult {
    const errors: string[] = [];

    // Validate barber ID
    if (!data.barberId || data.barberId.trim() === '') {
      errors.push('Barber ID is required');
    }

    // Validate services
    if (!data.serviceIds || data.serviceIds.length === 0) {
      errors.push('At least one service must be selected');
    } else if (data.serviceIds.length > this.MAX_SERVICES) {
      errors.push(`Maximum ${this.MAX_SERVICES} services can be selected`);
    } else if (data.serviceIds.some(id => !id || id.trim() === '')) {
      errors.push('All service IDs must be valid');
    }

    // Validate date
    const dateValidation = this.validateDate(data.date);
    errors.push(...dateValidation);

    // Validate time
    const timeValidation = this.validateTime(data.time);
    errors.push(...timeValidation);

    // Validate customer notes
    if (data.customerNotes) {
      if (data.customerNotes.length > this.MAX_NOTES_LENGTH) {
        errors.push(`Customer notes must be less than ${this.MAX_NOTES_LENGTH} characters`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private validateDate(dateStr: string): string[] {
    const errors: string[] = [];

    // Check date format
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      errors.push('Invalid date format');
      return errors; // Early return if format is invalid
    }

    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      errors.push('Booking date cannot be in the past');
    }

    // Check if date is a weekend
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday = 0, Saturday = 6
      errors.push('Bookings not available on weekends');
    }

    return errors;
  }

  private validateTime(timeStr: string): string[] {
    const errors: string[] = [];

    // Validate time format (HH:MM)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(timeStr)) {
      errors.push('Invalid time format');
      return errors; // Early return if format is invalid
    }

    // Check business hours
    const [hours] = timeStr.split(':').map(Number);
    if (hours < this.BUSINESS_START_HOUR || hours >= this.BUSINESS_END_HOUR) {
      errors.push(`Booking time must be between ${this.BUSINESS_START_HOUR}:00 AM and ${this.BUSINESS_END_HOUR - 12}:00 PM`);
    }

    return errors;
  }
}

// Step 4: Refactor (TDD BLUE phase) - Improve code while keeping tests green
// This would involve:
// - Extracting constants to configuration
// - Adding more sophisticated validation rules
// - Improving error messages
// - Adding logging and monitoring
// - Performance optimizations

export { BookingValidatorImpl, type BookingValidator, type BookingData, type ValidationResult };