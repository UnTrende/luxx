/**
 * BookingPage Component Tests
 * Tests the complete booking flow functionality
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../src/test/test-helpers';
import BookingPage from '../../../pages/BookingPage';
import { useParams } from 'react-router-dom';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(),
    useNavigate: vi.fn(() => vi.fn()),
  };
});

// Mock API
vi.mock('../../../services/api', () => ({
  api: {
    barbers: {
      getBarberById: vi.fn(),
    },
    services: {
      getServices: vi.fn(),
    },
    bookings: {
      getAvailableSlots: vi.fn(),
      createBooking: vi.fn(),
    },
  },
}));

describe('BookingPage', () => {
  const mockBarber = {
    id: 'barber-123',
    name: 'John Doe',
    email: 'john@example.com',
    specialties: ['haircut', 'beard'],
    rating: 4.8,
    experience: 5,
    imageUrl: 'https://example.com/barber.jpg'
  };

  const mockServices = [
    { id: 'service-1', name: 'Haircut', price: 30, duration: 30, loyalty_points_bronze: 10 },
    { id: 'service-2', name: 'Beard Trim', price: 15, duration: 15, loyalty_points_bronze: 5 },
    { id: 'service-3', name: 'Hair Wash', price: 10, duration: 10, loyalty_points_bronze: 3 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useParams as any).mockReturnValue({ barberId: 'barber-123' });
    
    // Mock successful API responses
    const { api } = require('../../../services/api');
    api.barbers.getBarberById.mockResolvedValue(mockBarber);
    api.services.getServices.mockResolvedValue(mockServices);
    api.bookings.getAvailableSlots.mockResolvedValue(['09:00', '10:00', '11:00', '14:00']);
    api.bookings.createBooking.mockResolvedValue({ 
      id: 'booking-123', 
      status: 'confirmed',
      total_price: 30
    });
  });

  describe('Component Loading', () => {
    it('should render loading state initially', () => {
      render(<BookingPage />);
      
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should load barber and services data on mount', async () => {
      render(<BookingPage />);
      
      const { api } = require('../../../services/api');
      
      await waitFor(() => {
        expect(api.barbers.getBarberById).toHaveBeenCalledWith('barber-123');
        expect(api.services.getServices).toHaveBeenCalled();
      });
    });

    it('should display barber information after loading', async () => {
      render(<BookingPage />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText(/haircut.*beard/i)).toBeInTheDocument();
      });
    });
  });

  describe('Service Selection', () => {
    it('should display available services', async () => {
      render(<BookingPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Haircut')).toBeInTheDocument();
        expect(screen.getByText('Beard Trim')).toBeInTheDocument();
        expect(screen.getByText('Hair Wash')).toBeInTheDocument();
      });
    });

    it('should allow service selection and show total price', async () => {
      render(<BookingPage />);
      
      await waitFor(() => {
        const haircutService = screen.getByText('Haircut').closest('div');
        expect(haircutService).toBeInTheDocument();
      });
      
      const haircutCheckbox = screen.getByRole('checkbox', { name: /haircut/i });
      fireEvent.click(haircutCheckbox);
      
      await waitFor(() => {
        expect(screen.getByText('$30')).toBeInTheDocument();
      });
    });

    it('should calculate correct total for multiple services', async () => {
      render(<BookingPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Haircut')).toBeInTheDocument();
      });
      
      const haircutCheckbox = screen.getByRole('checkbox', { name: /haircut/i });
      const beardCheckbox = screen.getByRole('checkbox', { name: /beard trim/i });
      
      fireEvent.click(haircutCheckbox);
      fireEvent.click(beardCheckbox);
      
      await waitFor(() => {
        expect(screen.getByText('$45')).toBeInTheDocument(); // 30 + 15
      });
    });

    it('should prevent proceeding without services selected', async () => {
      render(<BookingPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Haircut')).toBeInTheDocument();
      });
      
      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeDisabled();
    });
  });

  describe('Date and Time Selection', () => {
    beforeEach(async () => {
      render(<BookingPage />);
      
      // Select a service first
      await waitFor(() => {
        const haircutCheckbox = screen.getByRole('checkbox', { name: /haircut/i });
        fireEvent.click(haircutCheckbox);
      });
      
      // Proceed to date selection
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
    });

    it('should show date selection interface', async () => {
      await waitFor(() => {
        expect(screen.getByText(/select date/i)).toBeInTheDocument();
      });
    });

    it('should load available time slots when date is selected', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Mock date selection (implementation depends on date picker component)
      const { api } = require('../../../services/api');
      
      // Simulate date selection
      await waitFor(() => {
        expect(api.bookings.getAvailableSlots).toHaveBeenCalled();
      });
    });

    it('should display available time slots', async () => {
      await waitFor(() => {
        expect(screen.getByText('09:00')).toBeInTheDocument();
        expect(screen.getByText('10:00')).toBeInTheDocument();
        expect(screen.getByText('14:00')).toBeInTheDocument();
      });
    });

    it('should allow time slot selection', async () => {
      await waitFor(() => {
        const timeSlot = screen.getByText('10:00');
        fireEvent.click(timeSlot);
        
        expect(timeSlot).toHaveClass('selected'); // Assuming selected class
      });
    });
  });

  describe('Booking Confirmation', () => {
    beforeEach(async () => {
      render(<BookingPage />);
      
      // Complete the booking flow
      await waitFor(() => {
        const haircutCheckbox = screen.getByRole('checkbox', { name: /haircut/i });
        fireEvent.click(haircutCheckbox);
      });
      
      // Go to date selection
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      // Select time (mocked)
      await waitFor(() => {
        const timeSlot = screen.getByText('10:00');
        fireEvent.click(timeSlot);
      });
      
      // Proceed to confirmation
      const confirmButton = screen.getByText('Next');
      fireEvent.click(confirmButton);
    });

    it('should show booking summary', async () => {
      await waitFor(() => {
        expect(screen.getByText('Booking Summary')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Haircut')).toBeInTheDocument();
        expect(screen.getByText('$30')).toBeInTheDocument();
      });
    });

    it('should create booking when confirmed', async () => {
      await waitFor(() => {
        const confirmBookingButton = screen.getByText('Confirm Booking');
        fireEvent.click(confirmBookingButton);
      });
      
      const { api } = require('../../../services/api');
      
      await waitFor(() => {
        expect(api.bookings.createBooking).toHaveBeenCalledWith(
          expect.objectContaining({
            barberId: 'barber-123',
            serviceIds: ['service-1'],
          })
        );
      });
    });

    it('should show loading state during booking creation', async () => {
      // Mock slow API response
      const { api } = require('../../../services/api');
      api.bookings.createBooking.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ id: 'booking-123', status: 'confirmed' }), 1000))
      );
      
      await waitFor(() => {
        const confirmBookingButton = screen.getByText('Confirm Booking');
        fireEvent.click(confirmBookingButton);
      });
      
      expect(screen.getByText('Creating Booking...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle barber loading error', async () => {
      const { api } = require('../../../services/api');
      api.barbers.getBarberById.mockRejectedValue(new Error('Barber not found'));
      
      render(<BookingPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/error.*barber/i)).toBeInTheDocument();
      });
    });

    it('should handle services loading error', async () => {
      const { api } = require('../../../services/api');
      api.services.getServices.mockRejectedValue(new Error('Services unavailable'));
      
      render(<BookingPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/error.*services/i)).toBeInTheDocument();
      });
    });

    it('should handle booking creation error', async () => {
      const { api } = require('../../../services/api');
      api.bookings.createBooking.mockRejectedValue(new Error('Booking failed'));
      
      render(<BookingPage />);
      
      // Complete booking flow
      await waitFor(() => {
        const haircutCheckbox = screen.getByRole('checkbox', { name: /haircut/i });
        fireEvent.click(haircutCheckbox);
      });
      
      // Proceed through steps and confirm
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        const timeSlot = screen.getByText('10:00');
        fireEvent.click(timeSlot);
      });
      
      const confirmNextButton = screen.getByText('Next');
      fireEvent.click(confirmNextButton);
      
      await waitFor(() => {
        const confirmBookingButton = screen.getByText('Confirm Booking');
        fireEvent.click(confirmBookingButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/booking failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should allow going back to previous steps', async () => {
      render(<BookingPage />);
      
      // Go to step 2
      await waitFor(() => {
        const haircutCheckbox = screen.getByRole('checkbox', { name: /haircut/i });
        fireEvent.click(haircutCheckbox);
      });
      
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      // Go back
      const backButton = screen.getByText('Back');
      fireEvent.click(backButton);
      
      await waitFor(() => {
        expect(screen.getByText('Select Services')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<BookingPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation', async () => {
      render(<BookingPage />);
      
      await waitFor(() => {
        const haircutCheckbox = screen.getByRole('checkbox', { name: /haircut/i });
        haircutCheckbox.focus();
        expect(haircutCheckbox).toHaveFocus();
      });
    });
  });
});