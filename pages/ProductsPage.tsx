import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('🛍️ Fetching products...');
        const fetchedProducts = await api.getProducts();
        console.log('✅ Products fetched:', fetchedProducts.length, 'products');

        // Verify data normalization
        if (fetchedProducts.length > 0) {
          const firstProduct = fetchedProducts[0];
          console.log('📦 Sample product (full):', JSON.stringify(firstProduct, null, 2));
          console.log('📦 Sample product (summary):', {
            name: firstProduct.name,
            stock: firstProduct.stock,
            stockType: typeof firstProduct.stock,
            price: firstProduct.price,
            priceType: typeof firstProduct.price,
            imageUrl: firstProduct.imageUrl,
            imageUrlLength: firstProduct.imageUrl?.length || 0
          });
        }

        setProducts(fetchedProducts);
      } catch (err) {
        console.error('❌ Error fetching products:', err);
        setError('Failed to load products. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-96 bg-white/5 rounded-3xl animate-pulse" />
          ))}
        </div>
      );
    }
    if (error) {
      return <p className="text-center text-xl text-red-400">{error}</p>;
    }
    if (products.length > 0) {
      return (
        <div className="columns-1 md:columns-2 gap-6 space-y-6">
          {products.map(product => (
            <div
              key={product.id}
              className="group relative break-inside-avoid mb-6 cursor-pointer"
              onClick={() => navigate(`/product-order/${product.id}`)}
            >
              <div className="relative overflow-hidden rounded-3xl bg-card-bg">
                {/* Image - Takes up significant height */}
                <div className="aspect-[3/4] w-full relative">
                  <img
                    src={product.imageUrl || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&auto=format&fit=crop'}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />

                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-midnight via-transparent to-transparent opacity-60" />

                  {/* Floating Details */}
                  <div className="absolute bottom-0 left-0 w-full p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                    <p className="text-xs text-gold uppercase tracking-widest mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                      {(product.categories || []).join(', ')}
                    </p>
                    <h3 className="text-2xl font-serif font-bold text-white mb-1">{product.name}</h3>
                    <p className="text-xl font-bold text-white/80">${product.price.toFixed(2)}</p>
                  </div>

                  {/* Circular + Button */}
                  <button
                    disabled={!product.stock || product.stock <= 0}
                    className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-gold-gradient flex items-center justify-center text-midnight font-bold text-2xl shadow-glow transform group-hover:translate-y-0 transition-all duration-500 delay-100 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed z-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (product.stock && product.stock > 0) {
                        console.log('✅ Adding to cart:', product.name, '(Stock:', product.stock, ')');
                        navigate(`/product-order/${product.id}`);
                      } else {
                        console.log('❌ Out of stock:', product.name);
                      }
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }
    return <p className="text-center text-xl text-subtle-text">No products are currently available.</p>;
  };

  return (
    <div className="px-6 max-w-7xl mx-auto pt-8 pb-32 min-h-screen bg-midnight">
      <div className="text-center mb-12">
        <ShoppingBag className="mx-auto text-gold h-10 w-10 mb-6 opacity-80" />
        <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4">The Collection</h1>
        <div className="w-16 h-1 bg-gold mx-auto rounded-full mb-6" />
        <p className="text-lg text-subtle-text max-w-xl mx-auto font-light">
          Curated essentials for the modern gentleman.
        </p>
      </div>
      {renderContent()}
    </div>
  );
};

export default ProductsPage;