import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export const signupSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
    fullName: z.string().min(2, { message: "Name must be at least 2 characters" }),
});

export const bookingSchema = z.object({
    barberId: z.string().uuid({ message: "Invalid barber selection" }),
    serviceIds: z.array(z.string().uuid()).min(1, { message: "Please select at least one service" }),
    date: z.string().refine((val) => {
        const d = new Date(val);
        const today = new Date();
        d.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        return d >= today;
    }, { message: "Date must be in the future or today" }),
    timeSlot: z.string().regex(/^((0?[1-9]|1[0-2]):([0-5][0-9]) ?([AaPp][Mm]))$/, { message: "Invalid time format" }),
});export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
