/**
 * ProductsPage Component Tests
 * Tests product catalog and ordering functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../src/test/test-helpers';
import ProductsPage from '../../../pages/ProductsPage';

// Mock API
vi.mock('../../../services/api', () => ({
  api: {
    products: {
      getProducts: vi.fn(),
      createProductOrder: vi.fn(),
    },
  },
}));

describe('ProductsPage', () => {
  const mockProducts = [
    {
      id: 'product-1',
      name: 'Premium Hair Gel',
      description: 'Strong hold hair gel',
      price: 25,
      imageUrl: 'https://example.com/gel.jpg',
      inStock: true,
      stock: 10,
      category: 'styling'
    },
    {
      id: 'product-2',
      name: 'Beard Oil',
      description: 'Nourishing beard oil',
      price: 18,
      imageUrl: 'https://example.com/oil.jpg',
      inStock: false,
      stock: 0,
      category: 'beard'
    },
    {
      id: 'product-3',
      name: 'Shampoo',
      description: 'Professional shampoo',
      price: 15,
      imageUrl: 'https://example.com/shampoo.jpg',
      inStock: true,
      stock: 5,
      category: 'hair-care'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    const { api } = require('../../../services/api');
    api.products.getProducts.mockResolvedValue(mockProducts);
    api.products.createProductOrder.mockResolvedValue({
      id: 'order-123',
      status: 'pending'
    });
  });

  describe('Product Display', () => {
    beforeEach(async () => {
      render(<ProductsPage />);
      await waitFor(() => {
        expect(screen.getByText('Premium Hair Gel')).toBeInTheDocument();
      });
    });

    it('should display all products', () => {
      expect(screen.getByText('Premium Hair Gel')).toBeInTheDocument();
      expect(screen.getByText('Beard Oil')).toBeInTheDocument();
      expect(screen.getByText('Shampoo')).toBeInTheDocument();
    });

    it('should show product details', () => {
      expect(screen.getByText('Strong hold hair gel')).toBeInTheDocument();
      expect(screen.getByText('$25.00')).toBeInTheDocument();
      expect(screen.getByText('$18.00')).toBeInTheDocument();
      expect(screen.getByText('$15.00')).toBeInTheDocument();
    });

    it('should show stock status', () => {
      expect(screen.getByText('In Stock (10)')).toBeInTheDocument();
      expect(screen.getByText('Out of Stock')).toBeInTheDocument();
      expect(screen.getByText('In Stock (5)')).toBeInTheDocument();
    });

    it('should disable add to cart for out of stock items', () => {
      const addToCartButtons = screen.getAllByText(/add to cart/i);
      const beardOilButton = addToCartButtons.find(button => 
        button.closest('[data-testid="product-card"]')?.textContent?.includes('Beard Oil')
      );
      expect(beardOilButton).toBeDisabled();
    });
  });

  describe('Product Filtering', () => {
    beforeEach(async () => {
      render(<ProductsPage />);
      await waitFor(() => {
        expect(screen.getByText('Premium Hair Gel')).toBeInTheDocument();
      });
    });

    it('should show filter controls', () => {
      expect(screen.getByLabelText(/filter by category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/show in stock only/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/search products/i)).toBeInTheDocument();
    });

    it('should filter by category', async () => {
      const categoryFilter = screen.getByLabelText(/filter by category/i);
      fireEvent.change(categoryFilter, { target: { value: 'styling' } });

      await waitFor(() => {
        expect(screen.getByText('Premium Hair Gel')).toBeInTheDocument();
        expect(screen.queryByText('Beard Oil')).not.toBeInTheDocument();
      });
    });

    it('should filter by stock status', async () => {
      const stockFilter = screen.getByLabelText(/show in stock only/i);
      fireEvent.click(stockFilter);

      await waitFor(() => {
        expect(screen.getByText('Premium Hair Gel')).toBeInTheDocument();
        expect(screen.getByText('Shampoo')).toBeInTheDocument();
        expect(screen.queryByText('Beard Oil')).not.toBeInTheDocument();
      });
    });

    it('should search products by name', async () => {
      const searchInput = screen.getByPlaceholderText(/search products/i);
      fireEvent.change(searchInput, { target: { value: 'gel' } });

      await waitFor(() => {
        expect(screen.getByText('Premium Hair Gel')).toBeInTheDocument();
        expect(screen.queryByText('Beard Oil')).not.toBeInTheDocument();
      });
    });
  });

  describe('Shopping Cart', () => {
    beforeEach(async () => {
      render(<ProductsPage />);
      await waitFor(() => {
        expect(screen.getByText('Premium Hair Gel')).toBeInTheDocument();
      });
    });

    it('should add products to cart', async () => {
      const addToCartButton = screen.getAllByText(/add to cart/i)[0];
      fireEvent.click(addToCartButton);

      await waitFor(() => {
        expect(screen.getByText(/cart \(1\)/i)).toBeInTheDocument();
      });
    });

    it('should update cart quantity', async () => {
      const addToCartButton = screen.getAllByText(/add to cart/i)[0];
      fireEvent.click(addToCartButton);
      fireEvent.click(addToCartButton);

      await waitFor(() => {
        expect(screen.getByText(/cart \(2\)/i)).toBeInTheDocument();
      });
    });

    it('should show cart total', async () => {
      const addToCartButtons = screen.getAllByText(/add to cart/i);
      fireEvent.click(addToCartButtons[0]); // Hair Gel - $25
      fireEvent.click(addToCartButtons[2]); // Shampoo - $15

      await waitFor(() => {
        expect(screen.getByText('$40.00')).toBeInTheDocument();
      });
    });

    it('should allow removing items from cart', async () => {
      const addToCartButton = screen.getAllByText(/add to cart/i)[0];
      fireEvent.click(addToCartButton);

      await waitFor(() => {
        const removeButton = screen.getByText(/remove/i);
        fireEvent.click(removeButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/cart \(0\)/i)).toBeInTheDocument();
      });
    });
  });

  describe('Order Placement', () => {
    beforeEach(async () => {
      render(<ProductsPage />);
      await waitFor(() => {
        expect(screen.getByText('Premium Hair Gel')).toBeInTheDocument();
      });
    });

    it('should place order successfully', async () => {
      const addToCartButton = screen.getAllByText(/add to cart/i)[0];
      fireEvent.click(addToCartButton);

      await waitFor(() => {
        const checkoutButton = screen.getByText(/checkout/i);
        fireEvent.click(checkoutButton);
      });

      const { api } = require('../../../services/api');
      await waitFor(() => {
        expect(api.products.createProductOrder).toHaveBeenCalledWith(
          expect.objectContaining({
            items: expect.arrayContaining([
              expect.objectContaining({
                productId: 'product-1',
                quantity: 1
              })
            ])
          })
        );
      });
    });

    it('should show order confirmation', async () => {
      const addToCartButton = screen.getAllByText(/add to cart/i)[0];
      fireEvent.click(addToCartButton);

      await waitFor(() => {
        const checkoutButton = screen.getByText(/checkout/i);
        fireEvent.click(checkoutButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/order placed successfully/i)).toBeInTheDocument();
      });
    });

    it('should handle order failure', async () => {
      const { api } = require('../../../services/api');
      api.products.createProductOrder.mockRejectedValue(new Error('Order failed'));

      const addToCartButton = screen.getAllByText(/add to cart/i)[0];
      fireEvent.click(addToCartButton);

      await waitFor(() => {
        const checkoutButton = screen.getByText(/checkout/i);
        fireEvent.click(checkoutButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/order failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Product Details Modal', () => {
    beforeEach(async () => {
      render(<ProductsPage />);
      await waitFor(() => {
        expect(screen.getByText('Premium Hair Gel')).toBeInTheDocument();
      });
    });

    it('should open product details', async () => {
      const productImage = screen.getByAltText(/premium hair gel/i);
      fireEvent.click(productImage);

      await waitFor(() => {
        expect(screen.getByText(/product details/i)).toBeInTheDocument();
      });
    });

    it('should close product details', async () => {
      const productImage = screen.getByAltText(/premium hair gel/i);
      fireEvent.click(productImage);

      await waitFor(() => {
        const closeButton = screen.getByText(/close/i);
        fireEvent.click(closeButton);
      });

      await waitFor(() => {
        expect(screen.queryByText(/product details/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle products loading error', async () => {
      const { api } = require('../../../services/api');
      api.products.getProducts.mockRejectedValue(new Error('Failed to load products'));

      render(<ProductsPage />);

      await waitFor(() => {
        expect(screen.getByText(/error.*products/i)).toBeInTheDocument();
      });
    });

    it('should show retry option', async () => {
      const { api } = require('../../../services/api');
      api.products.getProducts.mockRejectedValue(new Error('Network error'));

      render(<ProductsPage />);

      await waitFor(() => {
        expect(screen.getByText(/retry/i)).toBeInTheDocument();
      });
    });

    it('should handle empty products list', async () => {
      const { api } = require('../../../services/api');
      api.products.getProducts.mockResolvedValue([]);

      render(<ProductsPage />);

      await waitFor(() => {
        expect(screen.getByText(/no products available/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      render(<ProductsPage />);
      await waitFor(() => {
        expect(screen.getByText('Premium Hair Gel')).toBeInTheDocument();
      });
    });

    it('should have proper ARIA labels', () => {
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByLabelText(/filter by category/i)).toBeInTheDocument();
      expect(screen.getAllByRole('button')).toHaveLength.greaterThan(0);
    });

    it('should have accessible product cards', () => {
      const productCards = screen.getAllByRole('article');
      expect(productCards.length).toBeGreaterThan(0);
      
      productCards.forEach(card => {
        expect(card).toHaveAttribute('aria-label');
      });
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