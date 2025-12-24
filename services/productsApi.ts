/**
 * Products API Module
 * Consolidated product catalog and order management operations
 */

import { supabase } from './supabaseClient';
import { logger } from '../src/lib/logger';
import { performanceMonitor } from '../src/lib/performance';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  inStock: boolean;
  stock: number;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductOrder {
  id: string;
  customerId: string;
  items: OrderItem[];
  totalPrice: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress?: Address;
  orderDate: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  stock: number;
  tags: string[];
}

export interface CreateOrderRequest {
  items: { productId: string; quantity: number }[];
  shippingAddress?: Address;
}

export interface ProductFilters {
  category?: string;
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  search?: string;
}

export class ProductsApi {
  /**
   * Get all products with optional filtering
   */
  async getProducts(filters: ProductFilters = {}): Promise<Product[]> {
    const startTime = performance.now();
    
    try {
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name');

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      
      if (filters.inStock !== undefined) {
        if (filters.inStock) {
          query = query.gt('stock', 0);
        } else {
          query = query.eq('stock', 0);
        }
      }
      
      if (filters.minPrice !== undefined) {
        query = query.gte('price', filters.minPrice);
      }
      
      if (filters.maxPrice !== undefined) {
        query = query.lte('price', filters.maxPrice);
      }

      const { data, error } = await query;

      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/products', duration, error ? 500 : 200);

      if (error) {
        logger.error('Failed to get products', error, 'ProductsApi');
        throw new Error(error.message || 'Failed to load products');
      }

      let filteredData = data as Product[] || [];

      // Client-side filtering for complex criteria
      if (filters.tags && filters.tags.length > 0) {
        filteredData = filteredData.filter(product =>
          filters.tags!.some(tag => product.tags.includes(tag))
        );
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredData = filteredData.filter(product =>
          product.name.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower) ||
          product.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }

      logger.debug('Products loaded', { 
        count: filteredData.length,
        filters,
        duration 
      }, 'ProductsApi');

      return filteredData;
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/products', duration, 500);
      throw error;
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(id: string): Promise<Product> {
    const startTime = performance.now();
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/products/detail', duration, error ? 404 : 200);

      if (error) {
        logger.error('Failed to get product by ID', error, 'ProductsApi');
        throw new Error(error.message || 'Product not found');
      }

      return data as Product;
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/products/detail', duration, 500);
      throw error;
    }
  }

  /**
   * Create new product (admin)
   */
  async createProduct(request: CreateProductRequest): Promise<Product> {
    const startTime = performance.now();
    
    try {
      logger.info('Creating product', { name: request.name, price: request.price }, 'ProductsApi');

      const { data, error } = await supabase.functions.invoke('product-management', {
        body: {
          action: 'create',
          data: {
            ...request,
            in_stock: request.stock > 0,
            is_active: true
          }
        }
      });

      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/products', duration, error ? 500 : 201);

      if (error) {
        logger.error('Failed to create product', error, 'ProductsApi');
        throw new Error(error.message || 'Failed to create product');
      }

      logger.info('Product created successfully', { 
        productId: data.id,
        name: request.name,
        duration 
      }, 'ProductsApi');

      return data as Product;
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/products', duration, 500);
      throw error;
    }
  }

  /**
   * Update product (admin)
   */
  async updateProduct(id: string, updates: Partial<CreateProductRequest>): Promise<Product> {
    const startTime = performance.now();
    
    try {
      logger.info('Updating product', { productId: id, updates }, 'ProductsApi');

      const { data, error } = await supabase.functions.invoke('product-management', {
        body: {
          action: 'update',
          productId: id,
          data: updates
        }
      });

      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/products/update', duration, error ? 500 : 200);

      if (error) {
        logger.error('Failed to update product', error, 'ProductsApi');
        throw new Error(error.message || 'Failed to update product');
      }

      logger.info('Product updated successfully', { productId: id, duration }, 'ProductsApi');

      return data as Product;
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/products/update', duration, 500);
      throw error;
    }
  }

  /**
   * Delete product (admin)
   */
  async deleteProduct(id: string): Promise<void> {
    const startTime = performance.now();
    
    try {
      logger.info('Deleting product', { productId: id }, 'ProductsApi');

      const { error } = await supabase.functions.invoke('product-management', {
        body: {
          action: 'delete',
          productId: id
        }
      });

      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/products/delete', duration, error ? 500 : 204);

      if (error) {
        logger.error('Failed to delete product', error, 'ProductsApi');
        throw new Error(error.message || 'Failed to delete product');
      }

      logger.info('Product deleted successfully', { productId: id, duration }, 'ProductsApi');
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/products/delete', duration, 500);
      throw error;
    }
  }

  /**
   * Create product order
   */
  async createOrder(request: CreateOrderRequest): Promise<ProductOrder> {
    const startTime = performance.now();
    
    try {
      logger.info('Creating product order', { 
        itemCount: request.items.length 
      }, 'ProductsApi');

      // Get product details to calculate total
      const productIds = request.items.map(item => item.productId);
      const products = await Promise.all(
        productIds.map(id => this.getProductById(id))
      );

      // Validate stock availability
      const stockErrors: string[] = [];
      request.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (!product) {
          stockErrors.push(`Product ${item.productId} not found`);
        } else if (!product.inStock || product.stock < item.quantity) {
          stockErrors.push(`Insufficient stock for ${product.name}`);
        }
      });

      if (stockErrors.length > 0) {
        throw new Error(stockErrors.join(', '));
      }

      // Calculate order details
      const orderItems: OrderItem[] = request.items.map(item => {
        const product = products.find(p => p.id === item.productId)!;
        return {
          productId: item.productId,
          productName: product.name,
          quantity: item.quantity,
          price: product.price,
          total: product.price * item.quantity
        };
      });

      const totalPrice = orderItems.reduce((sum, item) => sum + item.total, 0);

      const { data, error } = await supabase.functions.invoke('order-management', {
        body: {
          action: 'create',
          data: {
            items: orderItems,
            totalPrice,
            shippingAddress: request.shippingAddress,
            status: 'pending'
          }
        }
      });

      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/orders', duration, error ? 500 : 201);

      if (error) {
        logger.error('Failed to create order', error, 'ProductsApi');
        throw new Error(error.message || 'Failed to create order');
      }

      logger.info('Order created successfully', { 
        orderId: data.id,
        totalPrice,
        itemCount: orderItems.length,
        duration 
      }, 'ProductsApi');

      return data as ProductOrder;
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/orders', duration, 500);
      throw error;
    }
  }

  /**
   * Get user's orders
   */
  async getMyOrders(): Promise<ProductOrder[]> {
    const startTime = performance.now();
    
    try {
      const { data, error } = await supabase.functions.invoke('order-management', {
        body: {
          action: 'get-my-orders'
        }
      });

      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/orders/my', duration, error ? 500 : 200);

      if (error) {
        logger.error('Failed to get user orders', error, 'ProductsApi');
        throw new Error(error.message || 'Failed to load orders');
      }

      logger.debug('User orders loaded', { 
        count: data?.length || 0,
        duration 
      }, 'ProductsApi');

      return data || [];
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/orders/my', duration, 500);
      throw error;
    }
  }

  /**
   * Update order status (admin)
   */
  async updateOrderStatus(orderId: string, status: ProductOrder['status']): Promise<ProductOrder> {
    const startTime = performance.now();
    
    try {
      logger.info('Updating order status', { orderId, status }, 'ProductsApi');

      const { data, error } = await supabase.functions.invoke('order-management', {
        body: {
          action: 'update-status',
          orderId,
          data: { status }
        }
      });

      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/orders/status', duration, error ? 500 : 200);

      if (error) {
        logger.error('Failed to update order status', error, 'ProductsApi');
        throw new Error(error.message || 'Failed to update order status');
      }

      logger.info('Order status updated', { orderId, status, duration }, 'ProductsApi');

      return data as ProductOrder;
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/orders/status', duration, 500);
      throw error;
    }
  }

  /**
   * Get product categories
   */
  async getProductCategories(): Promise<string[]> {
    const products = await this.getProducts();
    const categories = [...new Set(products.map(product => product.category))];
    return categories.sort();
  }

  /**
   * Get product sales data (admin)
   */
  async getProductSales(startDate?: string, endDate?: string): Promise<any[]> {
    const startTime = performance.now();
    
    try {
      const { data, error } = await supabase.functions.invoke('analytics-reporting', {
        body: {
          action: 'product-sales',
          data: { startDate, endDate }
        }
      });

      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/products/sales', duration, error ? 500 : 200);

      if (error) {
        logger.error('Failed to get product sales', error, 'ProductsApi');
        throw new Error(error.message || 'Failed to load sales data');
      }

      return data || [];
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.trackAPICall('/api/products/sales', duration, 500);
      throw error;
    }
  }

  /**
   * Update product stock (admin)
   */
  async updateStock(productId: string, newStock: number): Promise<Product> {
    return this.updateProduct(productId, { 
      stock: newStock 
    });
  }

  /**
   * Check product availability
   */
  async checkAvailability(productId: string, quantity: number = 1): Promise<boolean> {
    try {
      const product = await this.getProductById(productId);
      return product.inStock && product.stock >= quantity;
    } catch {
      return false;
    }
  }

  /**
   * Search products
   */
  async searchProducts(query: string): Promise<Product[]> {
    return this.getProducts({ search: query });
  }

  /**
   * Get featured products
   */
  async getFeaturedProducts(limit: number = 6): Promise<Product[]> {
    const allProducts = await this.getProducts({ inStock: true });
    
    // Simple featured logic: highest price products that are in stock
    return allProducts
      .sort((a, b) => b.price - a.price)
      .slice(0, limit);
  }

  /**
   * Validate product creation request
   */
  validateCreateProductRequest(request: CreateProductRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.name || request.name.trim().length < 2) {
      errors.push('Product name must be at least 2 characters');
    }

    if (!request.description || request.description.trim().length < 10) {
      errors.push('Description must be at least 10 characters');
    }

    if (!request.price || request.price <= 0) {
      errors.push('Price must be greater than 0');
    }

    if (!request.category || request.category.trim().length < 2) {
      errors.push('Category is required');
    }

    if (request.stock < 0) {
      errors.push('Stock cannot be negative');
    }

    if (!request.tags || request.tags.length === 0) {
      errors.push('At least one tag is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate order creation request
   */
  validateCreateOrderRequest(request: CreateOrderRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.items || request.items.length === 0) {
      errors.push('At least one item is required');
    }

    request.items.forEach((item, index) => {
      if (!item.productId) {
        errors.push(`Item ${index + 1}: Product ID is required`);
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const productsApi = new ProductsApi();
export default productsApi;