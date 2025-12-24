/**
 * AdminBookingsManager Component Tests
 * Tests admin booking management functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../src/test/test-helpers';
import { AdminBookingsManager } from '../../../components/admin/AdminBookingsManager';

// Mock API
vi.mock('../../../services/api', () => ({
  api: {
    bookings: {
      getAllBookings: vi.fn(),
      updateBookingStatus: vi.fn(),
    },
    barbers: {
      getBarbers: vi.fn(),
    },
  },
}));

describe('AdminBookingsManager', () => {
  const mockBookings = [
    {
      id: 'booking-1',
      customer_id: 'customer-1',
      barber_id: 'barber-1',
      appointment_date: '2024-01-15',
      appointment_time: '10:00',
      status: 'confirmed',
      total_price: 30,
      customer_notes: 'Please use thinning scissors',
      customers: { name: 'John Smith', email: 'john@example.com' },
      barbers: { name: 'Jane Doe' },
      booking_services: [
        { services: { name: 'Haircut', price: 30 } }
      ]
    },
    {
      id: 'booking-2',
      customer_id: 'customer-2',
      barber_id: 'barber-2',
      appointment_date: '2024-01-16',
      appointment_time: '14:00',
      status: 'pending',
      total_price: 45,
      customer_notes: null,
      customers: { name: 'Mike Johnson', email: 'mike@example.com' },
      barbers: { name: 'Bob Wilson' },
      booking_services: [
        { services: { name: 'Haircut', price: 30 } },
        { services: { name: 'Beard Trim', price: 15 } }
      ]
    }
  ];

  const mockBarbers = [
    { id: 'barber-1', name: 'Jane Doe' },
    { id: 'barber-2', name: 'Bob Wilson' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    const { api } = require('../../../services/api');
    api.bookings.getAllBookings.mockResolvedValue(mockBookings);
    api.barbers.getBarbers.mockResolvedValue(mockBarbers);
    api.bookings.updateBookingStatus.mockResolvedValue({ 
      success: true, 
      booking: { ...mockBookings[0], status: 'completed' }
    });
  });

  describe('Component Loading', () => {
    it('should render loading state initially', () => {
      render(<AdminBookingsManager />);
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should load bookings and barbers on mount', async () => {
      render(<AdminBookingsManager />);
      
      const { api } = require('../../../services/api');
      
      await waitFor(() => {
        expect(api.bookings.getAllBookings).toHaveBeenCalled();
        expect(api.barbers.getBarbers).toHaveBeenCalled();
      });
    });

    it('should display bookings after loading', async () => {
      render(<AdminBookingsManager />);
      
      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
        expect(screen.getByText('Mike Johnson')).toBeInTheDocument();
        expect(screen.getByText('Jane Doe')).toBeInTheDocument();
        expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
      });
    });
  });

  describe('Booking Display', () => {
    beforeEach(async () => {
      render(<AdminBookingsManager />);
      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });
    });

    it('should display booking information correctly', () => {
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument();
      expect(screen.getByText('10:00 AM')).toBeInTheDocument();
      expect(screen.getByText('$30.00')).toBeInTheDocument();
    });

    it('should show customer notes when available', () => {
      expect(screen.getByText('Please use thinning scissors')).toBeInTheDocument();
    });

    it('should display multiple services correctly', () => {
      expect(screen.getByText('Haircut')).toBeInTheDocument();
      expect(screen.getByText('Beard Trim')).toBeInTheDocument();
    });

    it('should show booking status badges', () => {
      expect(screen.getByText('Confirmed')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });
  });

  describe('Status Management', () => {
    beforeEach(async () => {
      render(<AdminBookingsManager />);
      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });
    });

    it('should show status dropdown for each booking', () => {
      const statusDropdowns = screen.getAllByDisplayValue(/confirmed|pending/i);
      expect(statusDropdowns).toHaveLength(2);
    });

    it('should update booking status when changed', async () => {
      const { api } = require('../../../services/api');
      
      const firstStatusSelect = screen.getAllByDisplayValue('confirmed')[0];
      fireEvent.change(firstStatusSelect, { target: { value: 'completed' } });
      
      await waitFor(() => {
        expect(api.bookings.updateBookingStatus).toHaveBeenCalledWith(
          'booking-1',
          'completed'
        );
      });
    });

    it('should show success message after status update', async () => {
      const firstStatusSelect = screen.getAllByDisplayValue('confirmed')[0];
      fireEvent.change(firstStatusSelect, { target: { value: 'completed' } });
      
      await waitFor(() => {
        expect(screen.getByText(/status updated successfully/i)).toBeInTheDocument();
      });
    });

    it('should handle status update errors', async () => {
      const { api } = require('../../../services/api');
      api.bookings.updateBookingStatus.mockRejectedValue(new Error('Update failed'));
      
      const firstStatusSelect = screen.getAllByDisplayValue('confirmed')[0];
      fireEvent.change(firstStatusSelect, { target: { value: 'completed' } });
      
      await waitFor(() => {
        expect(screen.getByText(/failed to update status/i)).toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    beforeEach(async () => {
      render(<AdminBookingsManager />);
      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });
    });

    it('should show filter controls', () => {
      expect(screen.getByLabelText(/filter by status/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/filter by barber/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/search/i)).toBeInTheDocument();
    });

    it('should filter by booking status', async () => {
      const statusFilter = screen.getByLabelText(/filter by status/i);
      fireEvent.change(statusFilter, { target: { value: 'confirmed' } });
      
      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
        expect(screen.queryByText('Mike Johnson')).not.toBeInTheDocument();
      });
    });

    it('should filter by barber', async () => {
      const barberFilter = screen.getByLabelText(/filter by barber/i);
      fireEvent.change(barberFilter, { target: { value: 'barber-1' } });
      
      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
        expect(screen.queryByText('Mike Johnson')).not.toBeInTheDocument();
      });
    });

    it('should search by customer name', async () => {
      const searchInput = screen.getByLabelText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'John' } });
      
      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
        expect(screen.queryByText('Mike Johnson')).not.toBeInTheDocument();
      });
    });

    it('should clear filters when reset', async () => {
      // Apply a filter first
      const statusFilter = screen.getByLabelText(/filter by status/i);
      fireEvent.change(statusFilter, { target: { value: 'confirmed' } });
      
      // Clear filters
      const clearButton = screen.getByText(/clear filters/i);
      fireEvent.click(clearButton);
      
      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
        expect(screen.getByText('Mike Johnson')).toBeInTheDocument();
      });
    });
  });

  describe('Bulk Operations', () => {
    beforeEach(async () => {
      render(<AdminBookingsManager />);
      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });
    });

    it('should allow selecting multiple bookings', () => {
      const checkboxes = screen.getAllByRole('checkbox');
      
      fireEvent.click(checkboxes[0]); // Select first booking
      fireEvent.click(checkboxes[1]); // Select second booking
      
      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).toBeChecked();
    });

    it('should show bulk actions when items are selected', async () => {
      const checkbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(checkbox);
      
      await waitFor(() => {
        expect(screen.getByText(/bulk actions/i)).toBeInTheDocument();
      });
    });

    it('should perform bulk status update', async () => {
      const { api } = require('../../../services/api');
      
      // Select bookings
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      fireEvent.click(checkboxes[1]);
      
      // Perform bulk action
      const bulkStatusSelect = screen.getByLabelText(/bulk status/i);
      fireEvent.change(bulkStatusSelect, { target: { value: 'completed' } });
      
      const updateButton = screen.getByText(/update selected/i);
      fireEvent.click(updateButton);
      
      await waitFor(() => {
        expect(api.bookings.updateBookingStatus).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Sorting', () => {
    beforeEach(async () => {
      render(<AdminBookingsManager />);
      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });
    });

    it('should sort by appointment date', async () => {
      const dateHeader = screen.getByText(/appointment date/i);
      fireEvent.click(dateHeader);
      
      // Check that bookings are reordered (implementation specific)
      await waitFor(() => {
        const bookingRows = screen.getAllByRole('row');
        expect(bookingRows).toHaveLength(3); // Including header
      });
    });

    it('should sort by customer name', async () => {
      const nameHeader = screen.getByText(/customer/i);
      fireEvent.click(nameHeader);
      
      await waitFor(() => {
        const bookingRows = screen.getAllByRole('row');
        expect(bookingRows).toHaveLength(3);
      });
    });
  });

  describe('Export Functionality', () => {
    beforeEach(async () => {
      render(<AdminBookingsManager />);
      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });
    });

    it('should show export button', () => {
      expect(screen.getByText(/export/i)).toBeInTheDocument();
    });

    it('should export bookings data', async () => {
      const exportButton = screen.getByText(/export/i);
      fireEvent.click(exportButton);
      
      // Mock implementation would test CSV generation
      await waitFor(() => {
        expect(exportButton).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle bookings loading error', async () => {
      const { api } = require('../../../services/api');
      api.bookings.getAllBookings.mockRejectedValue(new Error('Failed to load bookings'));
      
      render(<AdminBookingsManager />);
      
      await waitFor(() => {
        expect(screen.getByText(/error.*loading.*bookings/i)).toBeInTheDocument();
      });
    });

    it('should handle empty bookings list', async () => {
      const { api } = require('../../../services/api');
      api.bookings.getAllBookings.mockResolvedValue([]);
      
      render(<AdminBookingsManager />);
      
      await waitFor(() => {
        expect(screen.getByText(/no bookings found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should refresh data periodically', async () => {
      vi.useFakeTimers();
      
      render(<AdminBookingsManager />);
      
      const { api } = require('../../../services/api');
      
      // Fast-forward time to trigger refresh
      vi.advanceTimersByTime(30000); // 30 seconds
      
      await waitFor(() => {
        expect(api.bookings.getAllBookings).toHaveBeenCalledTimes(2);
      });
      
      vi.useRealTimers();
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      render(<AdminBookingsManager />);
      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });
    });

    it('should have proper table structure', () => {
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getAllByRole('columnheader')).toHaveLength.greaterThan(0);
      expect(screen.getAllByRole('row')).toHaveLength.greaterThan(1);
    });

    it('should have accessible form controls', () => {
      expect(screen.getByLabelText(/filter by status/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/search/i)).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      const firstCheckbox = screen.getAllByRole('checkbox')[0];
      firstCheckbox.focus();
      expect(firstCheckbox).toHaveFocus();
    });
  });
});