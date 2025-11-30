// Centralized image resolver for entities that may store either a public URL or a storage path
// Usage: resolveImageUrl({ url: row.imageurl, path: row.image_path, bucket: 'product-images' })

export function resolveImageUrl(opts: { url?: string | null; path?: string | null; bucket: 'product-images' | 'barber-photos' | 'service-images' | 'site-images' }): string {
  const { url, path, bucket } = opts;
  if (url && /^https?:\/\//i.test(url)) return url;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (path) return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
  return '';
}

export function resolveBarberPhoto(barber: any): string {
  return (
    barber?.photo ||
    barber?.avatar_url ||
    resolveImageUrl({ url: barber?.photo, path: barber?.photo_path, bucket: 'barber-photos' }) ||
    'https://images.unsplash.com/photo-1580905400738-25e359a8492c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
  );
}

export function resolveProductImage(product: any): string {
  return (
    product?.imageUrl ||
    product?.imageurl ||
    resolveImageUrl({ url: product?.imageUrl || product?.imageurl, path: product?.image_path, bucket: 'product-images' }) ||
    '/default-product.png'
  );
}

export function resolveServiceImage(service: any): string {
  return (
    service?.imageUrl ||
    service?.imageurl ||
    resolveImageUrl({ url: service?.imageUrl || service?.imageurl, path: service?.image_path, bucket: 'service-images' }) ||
    ''
  );
}
