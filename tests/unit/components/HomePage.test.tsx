/**
 * HomePage Component Tests
 * Tests main landing page functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../src/test/test-helpers';
import HomePage from '../../../pages/HomePage';
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

describe('HomePage', () => {
  const mockNavigate = vi.fn();
  const mockBarbers = [
    { id: 'barber-1', name: 'John Smith', rating: 4.8, specialties: ['haircut'] },
    { id: 'barber-2', name: 'Mike Johnson', rating: 4.6, specialties: ['styling'] }
  ];
  const mockServices = [
    { id: 'service-1', name: 'Haircut', price: 30 },
    { id: 'service-2', name: 'Beard Trim', price: 15 }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useNavigate as any).mockReturnValue(mockNavigate);
    
    const { api } = require('../../../services/api');
    api.barbers.getBarbers.mockResolvedValue(mockBarbers);
    api.services.getServices.mockResolvedValue(mockServices);
  });

  describe('Hero Section', () => {
    it('should render hero content', () => {
      render(<HomePage />);
      
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByText(/book.*appointment/i)).toBeInTheDocument();
      expect(screen.getByText(/view.*barbers/i)).toBeInTheDocument();
    });

    it('should navigate to barbers page when clicking view barbers', async () => {
      render(<HomePage />);
      
      const viewBarbersButton = screen.getByText(/view.*barbers/i);
      fireEvent.click(viewBarbersButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/barbers');
    });

    it('should navigate to booking when clicking book appointment', async () => {
      render(<HomePage />);
      
      const bookButton = screen.getByText(/book.*appointment/i);
      fireEvent.click(bookButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/barbers');
    });
  });

  describe('Featured Barbers Section', () => {
    beforeEach(async () => {
      render(<HomePage />);
      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });
    });

    it('should display featured barbers', () => {
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('Mike Johnson')).toBeInTheDocument();
      expect(screen.getByText('4.8')).toBeInTheDocument();
    });

    it('should navigate to barber profile when clicked', async () => {
      const barberCard = screen.getByText('John Smith').closest('[data-testid="barber-card"]');
      fireEvent.click(barberCard!);
      
      expect(mockNavigate).toHaveBeenCalledWith('/barbers/barber-1');
    });
  });

  describe('Services Section', () => {
    beforeEach(async () => {
      render(<HomePage />);
      await waitFor(() => {
        expect(screen.getByText('Haircut')).toBeInTheDocument();
      });
    });

    it('should display popular services', () => {
      expect(screen.getByText('Haircut')).toBeInTheDocument();
      expect(screen.getByText('Beard Trim')).toBeInTheDocument();
      expect(screen.getByText('$30')).toBeInTheDocument();
    });

    it('should navigate to services page', async () => {
      const viewAllButton = screen.getByText(/view.*all.*services/i);
      fireEvent.click(viewAllButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/services');
    });
  });

  describe('Error Handling', () => {
    it('should handle barbers loading error gracefully', async () => {
      const { api } = require('../../../services/api');
      api.barbers.getBarbers.mockRejectedValue(new Error('Failed to load'));
      
      render(<HomePage />);
      
      // Should still render other sections
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<HomePage />);
      
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength.greaterThan(0);
    });

    it('should have accessible navigation', () => {
      render(<HomePage />);
      
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getAllByRole('button')).toHaveLength.greaterThan(0);
    });
  });
});