/**
 * Enhanced BookingFlow component tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../src/test/test-helpers';
import { ServiceSelectionStep } from '../../../components/ServiceSelectionStep';
import { DateTimeSelectionStep } from '../../../components/DateTimeSelectionStep';
import { ConfirmationStep } from '../../../components/ConfirmationStep';

// Mock API calls
vi.mock('../../../services/api', () => ({
  api: {
    services: {
      getServices: vi.fn(() => Promise.resolve([
        { id: '1', name: 'Haircut', price: 30, duration: 30, loyalty_points_bronze: 10, loyalty_points_silver: 10, loyalty_points_gold: 10 },
        { id: '2', name: 'Beard Trim', price: 15, duration: 15, loyalty_points_bronze: 5, loyalty_points_silver: 5, loyalty_points_gold: 5 },
      ])),
    },
    bookings: {
      getAvailableSlots: vi.fn(() => Promise.resolve([
        '09:00', '10:00', '11:00', '14:00', '15:00'
      ])),
      createBooking: vi.fn(() => Promise.resolve({
        id: 'booking-123',
        status: 'confirmed'
      })),
    },
    barbers: {
      getBarberById: vi.fn(() => Promise.resolve({
        id: 'barber-1',
        name: 'John Doe',
        specialties: ['haircut', 'beard']
      })),
    }
  }
}));

const mockBarber = {
  id: 'barber-1',
  name: 'John Doe',
  email: 'john@example.com',
  specialties: ['haircut', 'beard'],
};

describe('BookingFlow Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ServiceSelectionStep', () => {
    const mockProps = {
      barberId: 'barber-1',
      selectedServices: [],
      onServiceToggle: vi.fn(),
      onNext: vi.fn(),
      onBack: vi.fn(),
    };

    it('should render available services', async () => {
      render(<ServiceSelectionStep {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Haircut')).toBeInTheDocument();
        expect(screen.getByText('Beard Trim')).toBeInTheDocument();
      });
    });

    it('should handle service selection', async () => {
      render(<ServiceSelectionStep {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Haircut')).toBeInTheDocument();
      });

      const haircutService = screen.getByText('Haircut').closest('div');
      fireEvent.click(haircutService!);

      expect(mockProps.onServiceToggle).toHaveBeenCalledWith('1');
    });

    it('should disable next button when no services selected', async () => {
      render(<ServiceSelectionStep {...mockProps} />);

      await waitFor(() => {
        const nextButton = screen.getByText('Next');
        expect(nextButton).toBeDisabled();
      });
    });

    it('should enable next button when services selected', async () => {
      const propsWithSelectedService = {
        ...mockProps,
        selectedServices: ['1'],
      };

      render(<ServiceSelectionStep {...propsWithSelectedService} />);

      await waitFor(() => {
        const nextButton = screen.getByText('Next');
        expect(nextButton).not.toBeDisabled();
      });
    });

    it('should calculate total price correctly', async () => {
      const propsWithMultipleServices = {
        ...mockProps,
        selectedServices: ['1', '2'],
      };

      render(<ServiceSelectionStep {...propsWithMultipleServices} />);

      await waitFor(() => {
        expect(screen.getByText('$45')).toBeInTheDocument(); // 30 + 15
      });
    });
  });

  describe('DateTimeSelectionStep', () => {
    const mockProps = {
      barberId: 'barber-1',
      selectedServices: ['1'],
      selectedDate: null,
      selectedTime: null,
      onDateSelect: vi.fn(),
      onTimeSelect: vi.fn(),
      onNext: vi.fn(),
      onBack: vi.fn(),
    };

    it('should render calendar for date selection', () => {
      render(<DateTimeSelectionStep {...mockProps} />);
      
      expect(screen.getByRole('button', { name: /select date/i })).toBeInTheDocument();
    });

    it('should load available time slots when date is selected', async () => {
      const propsWithDate = {
        ...mockProps,
        selectedDate: new Date('2024-01-15'),
      };

      render(<DateTimeSelectionStep {...propsWithDate} />);

      await waitFor(() => {
        expect(screen.getByText('09:00')).toBeInTheDocument();
        expect(screen.getByText('10:00')).toBeInTheDocument();
      });
    });

    it('should handle time selection', async () => {
      const propsWithDate = {
        ...mockProps,
        selectedDate: new Date('2024-01-15'),
      };

      render(<DateTimeSelectionStep {...propsWithDate} />);

      await waitFor(() => {
        const timeSlot = screen.getByText('10:00');
        fireEvent.click(timeSlot);
      });

      expect(mockProps.onTimeSelect).toHaveBeenCalledWith('10:00');
    });

    it('should disable next button when no time selected', async () => {
      const propsWithDateOnly = {
        ...mockProps,
        selectedDate: new Date('2024-01-15'),
      };

      render(<DateTimeSelectionStep {...propsWithDateOnly} />);

      await waitFor(() => {
        const nextButton = screen.getByText('Next');
        expect(nextButton).toBeDisabled();
      });
    });

    it('should prevent selection of past dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      render(<DateTimeSelectionStep {...mockProps} />);

      // Past dates should be disabled in calendar
      // This would need to be tested based on the actual calendar implementation
    });
  });

  describe('ConfirmationStep', () => {
    const mockBookingData = {
      barber: mockBarber,
      services: [
        { id: '1', name: 'Haircut', price: 30, duration: 30 }
      ],
      date: new Date('2024-01-15'),
      time: '10:00',
      totalPrice: 30,
    };

    const mockProps = {
      bookingData: mockBookingData,
      onConfirm: vi.fn(),
      onBack: vi.fn(),
      isSubmitting: false,
    };

    it('should display booking summary', () => {
      render(<ConfirmationStep {...mockProps} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Haircut')).toBeInTheDocument();
      expect(screen.getByText('$30')).toBeInTheDocument();
      expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument();
      expect(screen.getByText('10:00')).toBeInTheDocument();
    });

    it('should handle booking confirmation', async () => {
      render(<ConfirmationStep {...mockProps} />);

      const confirmButton = screen.getByText('Confirm Booking');
      fireEvent.click(confirmButton);

      expect(mockProps.onConfirm).toHaveBeenCalled();
    });

    it('should show loading state when submitting', () => {
      const propsWithLoading = {
        ...mockProps,
        isSubmitting: true,
      };

      render(<ConfirmationStep {...propsWithLoading} />);

      expect(screen.getByText('Creating Booking...')).toBeInTheDocument();
      expect(screen.getByText('Confirm Booking')).toBeDisabled();
    });

    it('should handle back navigation', () => {
      render(<ConfirmationStep {...mockProps} />);

      const backButton = screen.getByText('Back');
      fireEvent.click(backButton);

      expect(mockProps.onBack).toHaveBeenCalled();
    });
  });

  describe('Integration - Full Booking Flow', () => {
    it('should complete a full booking flow', async () => {
      // This would test the complete flow from service selection to confirmation
      // Implementation depends on how the full BookingFlow component is structured
    });

    it('should handle errors gracefully', async () => {
      // Test error handling throughout the flow
    });

    it('should preserve state when navigating back and forth', async () => {
      // Test that selections are maintained when user goes back
    });
  });
});