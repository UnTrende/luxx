import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { supabase } from '../services/supabaseClient';
import type { StorageBucket } from '../services/imageResolver';
import { logger } from '../src/lib/logger';
import { api } from '../services/api'; // Import the API service to access CSRF token functionality

interface ImageUploadProps {
  onImageUpload: (imagePath: string, publicUrl: string) => void;
  currentImage?: string;
  bucket: StorageBucket;
  entityType: 'product' | 'barber' | 'service' | 'site';
  entityId?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageUpload,
  currentImage,
  bucket,
  entityType,
  entityId
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentImage || '');

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      // eslint-disable-next-line no-alert
      logger.warn('Please select an image file', undefined, 'ImageUpload');
      return;
    }

    // Validate file size (max 10MB for hero images, 5MB for others)
    const maxSize = entityType === 'site' ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    const maxSizeLabel = entityType === 'site' ? '10MB' : '5MB';
    if (file.size > maxSize) {
      alert(`Image must be smaller than ${maxSizeLabel}`);
      return;
    }

    setIsUploading(true);

    try {
      // Create preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${entityType}/${fileName}`;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucket);
      formData.append('path', filePath);
      formData.append('entityType', entityType);
      if (entityId) {
        formData.append('entityId', entityId);
      }

      // Get the Supabase URL from environment
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      
      // Get current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Ensure CSRF Token is present
      const csrfToken = await api.fetchCSRFToken();

      // Use different endpoints based on entity type
      const uploadEndpoint = entityType === 'site' 
        ? `${supabaseUrl}/functions/v1/upload-site-image`
        : `${supabaseUrl}/functions/v1/upload-image`;

      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Include CSRF token if available
          ...(csrfToken && { 'X-CSRF-Token': csrfToken })
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      onImageUpload(filePath, result.publicUrl);

    } catch (error) {
      logger.error('Upload error:', error, 'ImageUpload');
      // eslint-disable-next-line no-alert
      logger.error('Failed to upload image', undefined, 'ImageUpload');
      setPreviewUrl(currentImage || '');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl('');
    onImageUpload('', '');
  };

  return (
    <div className="space-y-4">
      {previewUrl ? (
        <div className="relative">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-32 h-32 object-cover rounded-lg border"
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400">
          <Upload size={24} className="text-gray-400 mb-2" />
          <span className="text-sm text-gray-500">Upload Image</span>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
        </label>
      )}
      {isUploading && (
        <div className="text-sm text-gray-500">Uploading...</div>
      )}
    </div>
  );
};