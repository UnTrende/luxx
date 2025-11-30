import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Product } from '../../types';
import { api } from '../../services/api';
import { ImageUpload } from '../../components/ImageUpload';

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
            console.error('Product operation failed:', error);
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
            console.error('Product deletion failed:', error);
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

    return (
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-xl shadow-gray-200/50">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div>
                    <h2 className="text-2xl font-serif font-bold text-dubai-black">Product Inventory</h2>
                    <p className="text-gray-500 text-sm mt-1">Track stock levels and manage product catalog</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="bg-dubai-gold text-dubai-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-white transition-all shadow-md hover:shadow-lg"
                >
                    + Add Product
                </button>
            </div>

            <div className="overflow-x-auto">

                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="text-left py-5 px-8 text-xs font-bold text-dubai-gold uppercase tracking-[0.15em]">Product</th>
                            <th className="text-left py-5 px-8 text-xs font-bold text-dubai-gold uppercase tracking-[0.15em]">Category</th>
                            <th className="text-left py-5 px-8 text-xs font-bold text-dubai-gold uppercase tracking-[0.15em]">Price</th>
                            <th className="text-left py-5 px-8 text-xs font-bold text-dubai-gold uppercase tracking-[0.15em]">Stock</th>
                            <th className="text-right py-5 px-8 text-xs font-bold text-dubai-gold uppercase tracking-[0.15em]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {products.map((product) => (
                            <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                                <td className="py-5 px-8 font-medium text-dubai-black">
                                    <div className="flex items-center gap-3">
                                        {(product.imageUrl || product.image_url) && (
                                            <img
                                                src={product.imageUrl || product.image_url}
                                                alt={product.name}
                                                className="w-10 h-10 rounded-lg object-cover border border-gray-200 group-hover:border-dubai-gold/50 transition-colors"
                                            />
                                        )}
                                        {product.name}
                                    </div>
                                </td>
                                <td className="py-5 px-8">
                                    <span className="px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wide group-hover:border-dubai-gold/30 transition-colors">
                                        {product.categories?.[0] || product.category || 'General'}
                                    </span>
                                </td>
                                <td className="py-5 px-8 font-bold text-dubai-gold">${product.price}</td>
                                <td className="py-5 px-8">
                                    <div className={`flex items-center gap-2 ${product.stock < 10 ? 'text-red-500' : 'text-green-600'}`}>
                                        <div className={`w-2 h-2 rounded-full ${product.stock < 10 ? 'bg-red-500' : 'bg-green-500'}`} />
                                        <span className="font-bold">{product.stock} units</span>
                                    </div>
                                </td>
                                <td className="py-5 px-8 text-right">
                                    <div className="flex justify-end gap-3">
                                        <button
                                            onClick={() => openModal(product)}
                                            className="text-gray-400 hover:text-dubai-gold font-bold text-sm transition-colors"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleProductDelete(product.id)}
                                            className="text-gray-400 hover:text-red-500 font-bold text-sm transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {products.length === 0 && (
                    <div className="text-center py-16">
                        <p className="text-gray-500 text-lg">No products found.</p>
                    </div>
                )}
            </div>

            {/* Product Modal */}
            {isProductModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
                        <h3 className="text-2xl font-serif font-bold text-dubai-black mb-6">
                            {currentProduct ? 'Edit Product' : 'Add New Product'}
                        </h3>

                        <form onSubmit={productForm.handleSubmit(handleProductSubmit)} className="space-y-5">
                            {/* Product Image Upload */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                                    Product Image
                                </label>
                                <ImageUpload
                                    onImageUploaded={(publicUrl: string, imagePath: string) => {
                                        setProductImagePath(imagePath);
                                        setProductImageUrl(publicUrl);
                                    }}
                                    currentImageUrl={productImageUrl || currentProduct?.imageUrl || currentProduct?.image_url}
                                    bucket="luxecut-public"
                                    folder="products"
                                    entityType="product"
                                    entityId={currentProduct?.id}
                                />
                            </div>

                            {/* Product Name */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Name *</label>
                                <input
                                    {...productForm.register('name', { required: 'Name is required' })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-dubai-black focus:border-dubai-gold focus:ring-1 focus:ring-dubai-gold/20 focus:outline-none transition-all placeholder:text-gray-400"
                                    placeholder="e.g., Luxe Pomade"
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Category *</label>
                                <select
                                    {...productForm.register('category', { required: 'Category is required' })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-dubai-black focus:border-dubai-gold focus:ring-1 focus:ring-dubai-gold/20 focus:outline-none transition-all placeholder:text-gray-400"
                                >
                                    <option value="">Select category</option>
                                    <option value="Hair Care">Hair Care</option>
                                    <option value="Beard Care">Beard Care</option>
                                    <option value="Styling">Styling</option>
                                    <option value="Shaving">Shaving</option>
                                    <option value="Tools">Tools</option>
                                    <option value="Branded Merch">Branded Merch</option>
                                </select>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Description</label>
                                <textarea
                                    {...productForm.register('description')}
                                    rows={3}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-dubai-black focus:border-dubai-gold focus:ring-1 focus:ring-dubai-gold/20 focus:outline-none transition-all placeholder:text-gray-400"
                                    placeholder="Product description..."
                                />
                            </div>

                            {/* Price */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Price ($) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    {...productForm.register('price', { required: 'Price is required', min: 0 })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-dubai-black focus:border-dubai-gold focus:ring-1 focus:ring-dubai-gold/20 focus:outline-none transition-all placeholder:text-gray-400"
                                    placeholder="25.00"
                                />
                            </div>

                            {/* Stock Quantity */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Stock Quantity *</label>
                                <input
                                    type="number"
                                    {...productForm.register('stock', {
                                        required: 'Stock quantity is required',
                                        min: { value: 0, message: 'Stock cannot be negative' }
                                    })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-dubai-black focus:border-dubai-gold focus:ring-1 focus:ring-dubai-gold/20 focus:outline-none transition-all placeholder:text-gray-400"
                                />
                                {productForm.formState.errors.stock && (
                                    <p className="text-red-400 text-sm mt-1">{productForm.formState.errors.stock.message}</p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-dubai-gold text-dubai-black py-3 px-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-white transition-all shadow-lg"
                                >
                                    {currentProduct ? 'Update Product' : 'Create Product'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsProductModalOpen(false);
                                        setCurrentProduct(null);
                                        productForm.reset();
                                        setProductImagePath('');
                                        setProductImageUrl('');
                                    }}
                                    className="flex-1 bg-transparent text-gray-500 border border-gray-200 py-3 px-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-gray-50 hover:text-dubai-black transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>

    );
};
