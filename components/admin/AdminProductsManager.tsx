import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Product } from '../../types';
import { api } from '../../services/api';
import { ImageUpload } from '../../components/ImageUpload';
import { Edit2, Trash2, Plus, Search, Package, AlertTriangle } from 'lucide-react';
import { logger } from '../../src/lib/logger';

interface AdminProductsManagerProps {
    products: Product[];
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

// Local interface for form handling with UI convenience field
interface ProductFormData extends Omit<Product, 'categories'> {
    category: string; // UI convenience field, maps to categories[0]
}

export const AdminProductsManager: React.FC<AdminProductsManagerProps> = ({ products, setProducts }) => {
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
    const [productImageUrl, setProductImageUrl] = useState('');
    const [productImagePath, setProductImagePath] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const productForm = useForm<ProductFormData>();

    const handleProductSubmit = async (data: ProductFormData) => {
        try {
            // Include image data in product submission and map fields to API format
            const productData = {
                ...data,
                imageUrl: productImageUrl || data.imageUrl || '',
                image_path: productImagePath || data.image_path || '',
                stock: Number(data.stock), // Ensure number
                categories: [data.category], // Map single category to array
                description: data.description || ''
            };

            // Remove UI-only fields if necessary, but spread should handle most
            // We need to cast to any because API expects Omit<Product, 'id'> which has strict shape
            const apiData: any = {
                name: productData.name,
                description: productData.description,
                categories: productData.categories,
                price: Number(productData.price),
                imageUrl: productData.imageUrl,
                image_path: productData.image_path,
                stock: productData.stock
            };

            if (currentProduct) {
                await api.updateProduct(currentProduct.id, apiData);
                setProducts(prev => prev.map(p => p.id === currentProduct.id ? { ...p, ...productData } : p));
                toast.success('Product updated successfully');
            } else {
                const newProduct = await api.addProduct(apiData);
                // The API returns the new product, but we need to make sure it matches our local state shape
                const localProduct: Product = {
                    ...newProduct,
                    stock: newProduct.stock,
                    imageUrl: newProduct.imageUrl
                };
                setProducts(prev => [...prev, localProduct]);
                toast.success('Product created successfully');
            }

            setIsProductModalOpen(false);
            setCurrentProduct(null);
            productForm.reset();
            setProductImagePath('');
            setProductImageUrl('');
        } catch (error) {
            logger.error('Product operation failed:', error, 'AdminProductsManager');
            toast.error('Failed to save product');
        }
    };

    const handleProductDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;

        try {
            await api.deleteProduct(id);
            setProducts(prev => prev.filter(p => p.id !== id));
            toast.success('Product deleted successfully');
        } catch (error) {
            logger.error('Product deletion failed:', error, 'AdminProductsManager');
            toast.error('Failed to delete product');
        }
    };

    const openModal = (product?: Product) => {
        if (product) {
            setCurrentProduct(product);
            // Map category from categories array if needed
            const formData = {
                ...product,
                category: product.categories?.[0] || 'General'
            };
            productForm.reset(formData);
            setProductImageUrl(product.imageUrl || product.image_url || '');
            setProductImagePath(product.image_path || '');
        } else {
            setCurrentProduct(null);
            productForm.reset();
            setProductImageUrl('');
            setProductImagePath('');
        }
        setIsProductModalOpen(true);
    };

    const filteredProducts = products.filter(p =>
        (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        ((p.categories?.[0] || '').toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="bg-glass-card rounded-[2rem] border border-white/10 overflow-hidden relative">
            {/* Header */}
            <div className="p-8 border-b border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-white mb-2">Inventory</h2>
                    <p className="text-subtle-text text-sm">Track stock levels and manage product catalog</p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-white/30 focus:border-gold/50 focus:outline-none transition-all"
                        />
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="bg-gold text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-white transition-all shadow-glow flex items-center gap-2"
                    >
                        <Plus size={18} />
                        <span>Add Product</span>
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/5">
                            <th className="text-left py-6 px-8 text-xs font-bold text-gold uppercase tracking-[0.2em]">Product</th>
                            <th className="text-left py-6 px-8 text-xs font-bold text-gold uppercase tracking-[0.2em]">Category</th>
                            <th className="text-left py-6 px-8 text-xs font-bold text-gold uppercase tracking-[0.2em]">Price</th>
                            <th className="text-left py-6 px-8 text-xs font-bold text-gold uppercase tracking-[0.2em]">Stock</th>
                            <th className="text-right py-6 px-8 text-xs font-bold text-gold uppercase tracking-[0.2em]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredProducts.map((product) => (
                            <tr key={product.id} className="group hover:bg-white/5 transition-colors">
                                <td className="py-5 px-8 font-medium text-white">
                                    <div className="flex items-center gap-4">
                                        {(product.imageUrl || product.image_url) ? (
                                            <img
                                                src={product.imageUrl || product.image_url}
                                                alt={product.name}
                                                className="w-12 h-12 rounded-xl object-cover border border-white/10 group-hover:border-gold/50 transition-colors"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20">
                                                <Package size={20} />
                                            </div>
                                        )}
                                        <span className="text-lg">{product.name}</span>
                                    </div>
                                </td>
                                <td className="py-5 px-8">
                                    <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-subtle-text uppercase tracking-wide group-hover:border-gold/30 group-hover:text-white transition-colors">
                                        {product.categories?.[0] || product.category || 'General'}
                                    </span>
                                </td>
                                <td className="py-5 px-8 font-bold text-gold text-lg">${product.price}</td>
                                <td className="py-5 px-8">
                                    <div className={`flex items-center gap-2 ${product.stock < 10 ? 'text-red-400' : 'text-green-400'}`}>
                                        <div className={`w-2 h-2 rounded-full ${product.stock < 10 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                                        <span className="font-bold">{product.stock} units</span>
                                        {product.stock < 5 && <AlertTriangle size={14} className="text-red-400" />}
                                    </div>
                                </td>
                                <td className="py-5 px-8 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => openModal(product)}
                                            className="p-2 rounded-lg hover:bg-white/10 text-subtle-text hover:text-white transition-colors"
                                            title="Edit"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleProductDelete(product.id)}
                                            className="p-2 rounded-lg hover:bg-red-500/10 text-subtle-text hover:text-red-400 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredProducts.length === 0 && (
                    <div className="text-center py-24">
                        <p className="text-subtle-text text-lg">No products found.</p>
                    </div>
                )}
            </div>

            {/* Product Modal */}
            {isProductModalOpen && createPortal(
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[9999] animate-fade-in">
                    <div className="bg-glass-card w-screen h-screen p-10 overflow-y-auto border-none shadow-none animate-scale-in relative rounded-none flex flex-col">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold to-transparent opacity-50" />

                        <div className="max-w-4xl mx-auto w-full">
                            <h3 className="text-3xl font-serif font-bold text-white mb-8 text-center pt-10">
                                {currentProduct ? 'Edit Product' : 'New Product'}
                            </h3>

                            <form onSubmit={productForm.handleSubmit(handleProductSubmit)} className="space-y-6 pb-20">
                                {/* Product Image Upload */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-subtle-text mb-2">
                                        Product Image
                                    </label>
                                    <div className="bg-black/20 rounded-xl p-2 border border-white/5">
                                        <ImageUpload
                                            onImageUpload={(imagePath: string, publicUrl: string) => {
                                                setProductImagePath(imagePath);
                                                setProductImageUrl(publicUrl);
                                            }}
                                            currentImage={productImageUrl || currentProduct?.imageUrl || currentProduct?.image_url}
                                            bucket="luxecut-public"
                                            entityType="product"
                                            entityId={currentProduct?.id}
                                        />
                                    </div>
                                </div>

                                {/* Product Name */}
                                <div className="group">
                                    <label className="block text-xs font-bold uppercase tracking-widest text-subtle-text mb-2 group-focus-within:text-gold transition-colors">Name</label>
                                    <input
                                        {...productForm.register('name', { required: 'Name is required' })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white focus:border-gold focus:ring-1 focus:ring-gold/20 focus:outline-none transition-all placeholder:text-white/20"
                                        placeholder="e.g., Luxe Pomade"
                                    />
                                </div>

                                {/* Category */}
                                <div className="group">
                                    <label className="block text-xs font-bold uppercase tracking-widest text-subtle-text mb-2 group-focus-within:text-gold transition-colors">Category</label>
                                    <select
                                        {...productForm.register('category', { required: 'Category is required' })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white focus:border-gold focus:ring-1 focus:ring-gold/20 focus:outline-none transition-all appearance-none"
                                    >
                                        <option value="" className="bg-card-bg">Select category</option>
                                        <option value="Hair Care" className="bg-card-bg">Hair Care</option>
                                        <option value="Beard Care" className="bg-card-bg">Beard Care</option>
                                        <option value="Styling" className="bg-card-bg">Styling</option>
                                        <option value="Shaving" className="bg-card-bg">Shaving</option>
                                        <option value="Tools" className="bg-card-bg">Tools</option>
                                        <option value="Branded Merch" className="bg-card-bg">Branded Merch</option>
                                    </select>
                                </div>

                                {/* Description */}
                                <div className="group">
                                    <label className="block text-xs font-bold uppercase tracking-widest text-subtle-text mb-2 group-focus-within:text-gold transition-colors">Description</label>
                                    <textarea
                                        {...productForm.register('description')}
                                        rows={3}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white focus:border-gold focus:ring-1 focus:ring-gold/20 focus:outline-none transition-all placeholder:text-white/20"
                                        placeholder="Product description..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    {/* Price */}
                                    <div className="group">
                                        <label className="block text-xs font-bold uppercase tracking-widest text-subtle-text mb-2 group-focus-within:text-gold transition-colors">Price ($)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            {...productForm.register('price', { required: 'Price is required', min: 0 })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white focus:border-gold focus:ring-1 focus:ring-gold/20 focus:outline-none transition-all placeholder:text-white/20"
                                            placeholder="25.00"
                                        />
                                    </div>

                                    {/* Stock Quantity */}
                                    <div className="group">
                                        <label className="block text-xs font-bold uppercase tracking-widest text-subtle-text mb-2 group-focus-within:text-gold transition-colors">Stock</label>
                                        <input
                                            type="number"
                                            {...productForm.register('stock', {
                                                required: 'Stock quantity is required',
                                                min: { value: 0, message: 'Stock cannot be negative' }
                                            })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white focus:border-gold focus:ring-1 focus:ring-gold/20 focus:outline-none transition-all placeholder:text-white/20"
                                        />
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-4 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsProductModalOpen(false);
                                            setCurrentProduct(null);
                                            productForm.reset();
                                            setProductImagePath('');
                                            setProductImageUrl('');
                                        }}
                                        className="flex-1 bg-transparent text-subtle-text border border-white/10 py-4 px-6 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-white/5 hover:text-white transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-gold text-black py-4 px-6 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-white transition-all shadow-glow"
                                    >
                                        {currentProduct ? 'Save Changes' : 'Create Product'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
