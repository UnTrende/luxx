import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ConfirmationStep from './ConfirmationStep';
import { BrowserRouter } from 'react-router-dom';
import * as AuthContext from '../contexts/AuthContext';
import { api } from '../services/api';

// Mock API
vi.mock('../services/api', () => ({
    api: {
        getServices: vi.fn(),
        createBooking: vi.fn(),
    },
}));

// Mock Auth Context
const mockUseAuth = vi.spyOn(AuthContext, 'useAuth');

// Mock Navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('Booking Flow - Confirmation Step', () => {
    const mockBarber = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Barber',
        photo: null,
    };

    const mockServices = [
        { id: '123e4567-e89b-12d3-a456-426614174001', name: 'Haircut', price: 30 },
        { id: '123e4567-e89b-12d3-a456-426614174002', name: 'Shave', price: 20 },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        (api.getServices as any).mockResolvedValue(mockServices);
    });

    it('should render booking details correctly', async () => {
        mockUseAuth.mockReturnValue({
            user: { id: 'u1', name: 'Test User', email: 'test@example.com' },
        } as any);

        render(
            <BrowserRouter>
                <ConfirmationStep
                    barber={mockBarber}
                    selectedServices={['123e4567-e89b-12d3-a456-426614174001', '123e4567-e89b-12d3-a456-426614174002']}
                    selectedDate="2025-12-25"
                    selectedTime="10:00"
                    services={mockServices}
                    onBack={vi.fn()}
                    onConfirm={vi.fn()}
                />
            </BrowserRouter>
        );

        // Check if barber name is displayed
        expect(screen.getByText('Test Barber')).toBeInTheDocument();

        // Check if services are displayed (fetched via api.getServices in component)
        await waitFor(() => {
            expect(screen.getByText('Haircut')).toBeInTheDocument();
            expect(screen.getByText('$30')).toBeInTheDocument();
        });

        // Check total price
        expect(screen.getByText('$50')).toBeInTheDocument();
    });

    it('should redirect to login if user is not authenticated', () => {
        mockUseAuth.mockReturnValue({ user: null } as any);

        render(
            <BrowserRouter>
                <ConfirmationStep
                    barber={mockBarber}
                    selectedServices={['123e4567-e89b-12d3-a456-426614174001']}
                    selectedDate="2025-12-25"
                    selectedTime="10:00"
                    services={mockServices}
                    onBack={vi.fn()}
                    onConfirm={vi.fn()}
                />
            </BrowserRouter>
        );

        const confirmButton = screen.getByText('Confirm & Pay');
        fireEvent.click(confirmButton);

        expect(mockNavigate).toHaveBeenCalledWith('/login', expect.any(Object));
    });

    it('should call createBooking API on successful confirmation', async () => {
        mockUseAuth.mockReturnValue({
            user: { id: 'u1', name: 'Test User', email: 'test@example.com' },
        } as any);

        (api.createBooking as any).mockResolvedValue({ id: 'b1' });

        const onConfirmMock = vi.fn();

        render(
            <BrowserRouter>
                <ConfirmationStep
                    barber={mockBarber}
                    selectedServices={['123e4567-e89b-12d3-a456-426614174001']}
                    selectedDate="2025-12-25"
                    selectedTime="10:00 AM" // Changed to 12-hour format with AM/PM
                    services={mockServices}
                    onBack={vi.fn()}
                    onConfirm={onConfirmMock}
                />
            </BrowserRouter>
        );

        // Wait for services to load
        await waitFor(() => screen.getByText('Haircut'));

        const confirmButton = screen.getByText('Confirm & Pay');
        fireEvent.click(confirmButton);

        await waitFor(() => {
            expect(api.createBooking).toHaveBeenCalledWith(expect.objectContaining({
                barberId: '123e4567-e89b-12d3-a456-426614174000',
                serviceIds: ['123e4567-e89b-12d3-a456-426614174001'],
                totalPrice: 30
            }));
        });
    });
});
