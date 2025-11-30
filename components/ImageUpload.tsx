import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { supabase } from '../services/supabaseClient';

interface ImageUploadProps {
  onImageUpload: (imagePath: string, publicUrl: string) => void;
  currentImage?: string;
  bucket: 'product-images' | 'barber-photos' | 'service-images';
  entityType: 'product' | 'barber' | 'service';
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
      console.warn('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB');
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

      const response = await fetch(`${supabaseUrl}/functions/v1/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      onImageUpload(filePath, result.publicUrl);

    } catch (error) {
      console.error('Upload error:', error);
      // eslint-disable-next-line no-alert
      console.error('Failed to upload image');
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