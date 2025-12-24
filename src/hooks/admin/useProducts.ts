import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../services/supabaseClient';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
  stock_quantity: number;
  status: 'active' | 'inactive' | 'out_of_stock';
  created_at: string;
  updated_at: string;
}

const fetchProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

const updateProductStatus = async ({ 
  productId, 
  status 
}: { 
  productId: string; 
  status: 'active' | 'inactive' | 'out_of_stock' 
}): Promise<void> => {
  const { error } = await supabase
    .from('products')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', productId);

  if (error) throw error;
};

const deleteProduct = async (productId: string): Promise<void> => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId);

  if (error) throw error;
};

export const useProducts = () => {
  const queryClient = useQueryClient();

  const {
    data: products = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-products'],
    queryFn: fetchProducts,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes cache
  });

  const updateStatusMutation = useMutation({
    mutationFn: updateProductStatus,
    onSuccess: (_, variables) => {
      // Update cache optimistically
      queryClient.setQueryData(['admin-products'], 
        (old: Product[]) => old.map(p => 
          p.id === variables.productId ? { ...p, status: variables.status } : p
        )
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: (_, productId) => {
      // Remove from cache optimistically
      queryClient.setQueryData(['admin-products'], 
        (old: Product[]) => old.filter(p => p.id !== productId)
      );
    },
  });

  return {
    products,
    isLoading,
    error,
    updateProductStatus: updateStatusMutation.mutate,
    deleteProduct: deleteMutation.mutate,
    refetch,
  };
};