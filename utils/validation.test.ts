import { describe, it, expect } from 'vitest';
import { loginSchema, signupSchema, bookingSchema } from '../utils/validation';

describe('Validation Schemas', () => {
    describe('Login Schema', () => {
        it('should validate correct email and password', () => {
            const result = loginSchema.safeParse({
                email: 'test@example.com',
                password: 'password123'
            });
            expect(result.success).toBe(true);
        });

        it('should fail on invalid email', () => {
            const result = loginSchema.safeParse({
                email: 'invalid-email',
                password: 'password123'
            });
            expect(result.success).toBe(false);
        });

        it('should fail on short password', () => {
            const result = loginSchema.safeParse({
                email: 'test@example.com',
                password: '123'
            });
            expect(result.success).toBe(false);
        });
    });

    describe('Booking Schema', () => {
        it('should validate valid booking details', () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 1);

            const result = bookingSchema.safeParse({
                barberId: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID
                serviceIds: ['123e4567-e89b-12d3-a456-426614174000'],
                date: futureDate.toISOString(),
                timeSlot: '2:30 PM' // Changed to 12-hour format with AM/PM
            });
            expect(result.success).toBe(true);
        });

        it('should allow today booking', () => {
            const today = new Date();

            const result = bookingSchema.safeParse({
                barberId: '123e4567-e89b-12d3-a456-426614174000',
                serviceIds: ['123e4567-e89b-12d3-a456-426614174000'],
                date: today.toISOString(),
                timeSlot: '2:30 PM' // Changed to 12-hour format with AM/PM
            });
            expect(result.success).toBe(true);
        });

        it('should fail on invalid time format', () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 1);

            const result = bookingSchema.safeParse({
                barberId: '123e4567-e89b-12d3-a456-426614174000',
                serviceIds: ['123e4567-e89b-12d3-a456-426614174000'],
                date: futureDate.toISOString(),
                timeSlot: '25:70' // Invalid time
            });
            expect(result.success).toBe(false);
        });
    });
});