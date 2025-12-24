/**
 * BarbersPage Component Tests
 * Tests barber listing and selection functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../src/test/test-helpers';
import BarbersPage from '../../../pages/BarbersPage';
import { useNavigate } from 'react-router-dom';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

// Mock API
vi.mock('../../../services/api', () => ({
  api: {
    barbers: {
      getBarbers: vi.fn(),
    },
    services: {
      getServices: vi.fn(),
    },
  },
}));

describe('BarbersPage', () => {
  const mockBarbers = [
    {
      id: 'barber-1',
      name: 'John Smith',
      email: 'john@example.com',
      specialties: ['haircut', 'beard'],
      rating: 4.8,
      experience: 5,
      imageUrl: 'https://example.com/john.jpg',
      bio: 'Experienced barber with 5 years of expertise',
      isAvailable: true
    },
    {
      id: 'barber-2',
      name: 'Mike Johnson',
      email: 'mike@example.com',
      specialties: ['styling', 'coloring'],
      rating: 4.6,
      experience: 3,
      imageUrl: 'https://example.com/mike.jpg',
      bio: 'Creative stylist specializing in modern cuts',
      isAvailable: false
    },
    {
      id: 'barber-3',
      name: 'Sarah Wilson',
      email: 'sarah@example.com',
      specialties: ['haircut', 'washing', 'styling'],
      rating: 4.9,
      experience: 7,
      imageUrl: 'https://example.com/sarah.jpg',
      bio: 'Master barber with extensive experience',
      isAvailable: true
    }
  ];

  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useNavigate as any).mockReturnValue(mockNavigate);
    
    const { api } = require('../../../services/api');
    api.barbers.getBarbers.mockResolvedValue(mockBarbers);
    api.services.getServices.mockResolvedValue([
      { id: 'service-1', name: 'Haircut' },
      { id: 'service-2', name: 'Beard Trim' },
    ]);
  });

  describe('Component Loading', () => {
    it('should render loading state initially', () => {
      render(<BarbersPage />);
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should load barbers on mount', async () => {
      render(<BarbersPage />);
      
      const { api } = require('../../../services/api');
      await waitFor(() => {
        expect(api.barbers.getBarbers).toHaveBeenCalled();
      });
    });

    it('should display barbers after loading', async () => {
      render(<BarbersPage />);
      
      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
        expect(screen.getByText('Mike Johnson')).toBeInTheDocument();
        expect(screen.getByText('Sarah Wilson')).toBeInTheDocument();
      });
    });
  });

  describe('Barber Display', () => {
    beforeEach(async () => {
      render(<BarbersPage />);
      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });
    });

    it('should display barber information correctly', () => {
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('5 years experience')).toBeInTheDocument();
      expect(screen.getByText('4.8')).toBeInTheDocument();
      expect(screen.getByText(/haircut.*beard/i)).toBeInTheDocument();
      expect(screen.getByText('Experienced barber with 5 years of expertise')).toBeInTheDocument();
    });

    it('should show availability status', () => {
      expect(screen.getByText('Available')).toBeInTheDocument();
      expect(screen.getByText('Unavailable')).toBeInTheDocument();
    });

    it('should display barber images', () => {
      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(mockBarbers.length);
      expect(images[0]).toHaveAttribute('src', 'https://example.com/john.jpg');
    });

    it('should show specialties as tags', () => {
      expect(screen.getByText('haircut')).toBeInTheDocument();
      expect(screen.getByText('beard')).toBeInTheDocument();
      expect(screen.getByText('styling')).toBeInTheDocument();
      expect(screen.getByText('coloring')).toBeInTheDocument();
    });
  });

  describe('Filtering and Search', () => {
    beforeEach(async () => {
      render(<BarbersPage />);
      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });
    });

    it('should show search and filter controls', () => {
      expect(screen.getByPlaceholderText(/search barbers/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/filter by specialty/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/show only available/i)).toBeInTheDocument();
    });

    it('should filter by search term', async () => {
      const searchInput = screen.getByPlaceholderText(/search barbers/i);
      fireEvent.change(searchInput, { target: { value: 'John' } });

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
        expect(screen.queryByText('Mike Johnson')).not.toBeInTheDocument();
      });
    });

    it('should filter by specialty', async () => {
      const specialtyFilter = screen.getByLabelText(/filter by specialty/i);
      fireEvent.change(specialtyFilter, { target: { value: 'styling' } });

      await waitFor(() => {
        expect(screen.getByText('Mike Johnson')).toBeInTheDocument();
        expect(screen.getByText('Sarah Wilson')).toBeInTheDocument();
        expect(screen.queryByText('John Smith')).not.toBeInTheDocument();
      });
    });

    it('should filter by availability', async () => {
      const availabilityToggle = screen.getByLabelText(/show only available/i);
      fireEvent.click(availabilityToggle);

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
        expect(screen.getByText('Sarah Wilson')).toBeInTheDocument();
        expect(screen.queryByText('Mike Johnson')).not.toBeInTheDocument();
      });
    });

    it('should combine multiple filters', async () => {
      const searchInput = screen.getByPlaceholderText(/search barbers/i);
      const availabilityToggle = screen.getByLabelText(/show only available/i);

      fireEvent.change(searchInput, { target: { value: 'Sarah' } });
      fireEvent.click(availabilityToggle);

      await waitFor(() => {
        expect(screen.getByText('Sarah Wilson')).toBeInTheDocument();
        expect(screen.queryByText('John Smith')).not.toBeInTheDocument();
        expect(screen.queryByText('Mike Johnson')).not.toBeInTheDocument();
      });
    });
  });

  describe('Sorting', () => {
    beforeEach(async () => {
      render(<BarbersPage />);
      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });
    });

    it('should show sort options', () => {
      expect(screen.getByLabelText(/sort by/i)).toBeInTheDocument();
    });

    it('should sort by rating', async () => {
      const sortSelect = screen.getByLabelText(/sort by/i);
      fireEvent.change(sortSelect, { target: { value: 'rating' } });

      await waitFor(() => {
        const barberCards = screen.getAllByTestId('barber-card');
        expect(barberCards[0]).toHaveTextContent('Sarah Wilson'); // Highest rating
      });
    });

    it('should sort by experience', async () => {
      const sortSelect = screen.getByLabelText(/sort by/i);
      fireEvent.change(sortSelect, { target: { value: 'experience' } });

      await waitFor(() => {
        const barberCards = screen.getAllByTestId('barber-card');
        expect(barberCards[0]).toHaveTextContent('Sarah Wilson'); // Most experience
      });
    });

    it('should sort alphabetically', async () => {
      const sortSelect = screen.getByLabelText(/sort by/i);
      fireEvent.change(sortSelect, { target: { value: 'name' } });

      await waitFor(() => {
        const barberCards = screen.getAllByTestId('barber-card');
        expect(barberCards[0]).toHaveTextContent('John Smith'); // Alphabetical order
      });
    });
  });

  describe('Barber Selection', () => {
    beforeEach(async () => {
      render(<BarbersPage />);
      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });
    });

    it('should navigate to booking page when barber is selected', async () => {
      const bookButtons = screen.getAllByText(/book appointment/i);
      fireEvent.click(bookButtons[0]);

      expect(mockNavigate).toHaveBeenCalledWith('/booking/barber-1');
    });

    it('should show view profile option', async () => {
      const viewProfileButtons = screen.getAllByText(/view profile/i);
      fireEvent.click(viewProfileButtons[0]);

      expect(mockNavigate).toHaveBeenCalledWith('/barbers/barber-1');
    });

    it('should disable booking for unavailable barbers', () => {
      const barberCards = screen.getAllByTestId('barber-card');
      const mikeCard = barberCards.find(card => card.textContent?.includes('Mike Johnson'));
      
      const bookButton = mikeCard?.querySelector('button[disabled]');
      expect(bookButton).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    beforeEach(async () => {
      render(<BarbersPage />);
      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });
    });

    it('should display grid layout on desktop', () => {
      const container = screen.getByTestId('barbers-grid');
      expect(container).toHaveClass('grid');
    });

    it('should support mobile viewport', () => {
      // Test responsive classes or mobile-specific elements
      expect(screen.getByTestId('barbers-grid')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle barbers loading error', async () => {
      const { api } = require('../../../services/api');
      api.barbers.getBarbers.mockRejectedValue(new Error('Failed to load barbers'));

      render(<BarbersPage />);

      await waitFor(() => {
        expect(screen.getByText(/error.*barbers/i)).toBeInTheDocument();
      });
    });

    it('should show retry option on error', async () => {
      const { api } = require('../../../services/api');
      api.barbers.getBarbers.mockRejectedValue(new Error('Network error'));

      render(<BarbersPage />);

      await waitFor(() => {
        expect(screen.getByText(/retry/i)).toBeInTheDocument();
      });
    });

    it('should handle empty barbers list', async () => {
      const { api } = require('../../../services/api');
      api.barbers.getBarbers.mockResolvedValue([]);

      render(<BarbersPage />);

      await waitFor(() => {
        expect(screen.getByText(/no barbers available/i)).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', async () => {
      const { rerender } = render(<BarbersPage />);
      
      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      const { api } = require('../../../services/api');
      const callCount = api.barbers.getBarbers.mock.calls.length;

      rerender(<BarbersPage />);
      
      // Should not call API again if data hasn't changed
      expect(api.barbers.getBarbers.mock.calls.length).toBe(callCount);
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      render(<BarbersPage />);
      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });
    });

    it('should have proper ARIA labels', () => {
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByLabelText(/search barbers/i)).toBeInTheDocument();
      expect(screen.getAllByRole('button')).toHaveLength.greaterThan(0);
    });

    it('should support keyboard navigation', () => {
      const firstButton = screen.getAllByRole('button')[0];
      firstButton.focus();
      expect(firstButton).toHaveFocus();
    });

    it('should have descriptive alt text for images', () => {
      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('alt');
        expect(img.getAttribute('alt')).not.toBe('');
      });
    });
  });
});