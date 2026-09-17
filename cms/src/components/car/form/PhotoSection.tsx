import React, { useState, useRef } from "react";
import { Image, Plus, X, Loader2, AlertCircle } from "lucide-react";
import { CreateCarData } from "../../../services/carApi";
import { imgbbApi } from "../../../services/imgbbApi";

interface PhotoSectionProps {
  formData: CreateCarData;
  isViewMode: boolean;
  onAddPhoto: () => void;
  onAddPhotos: (photos: any[]) => void;
  onRemovePhoto: (index: number) => void;
  onUpdatePhoto: (index: number, photo: any) => void;
}

const PhotoSection: React.FC<PhotoSectionProps> = ({
  formData,
  isViewMode,
  onAddPhoto,
  onAddPhotos,
  onRemovePhoto,
  onUpdatePhoto,
}) => {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File, index: number) => {
    // Validate file
    const validation = imgbbApi.validateImageFile(file);
    if (!validation.isValid) {
      setUploadError(validation.error || 'Invalid file');
      return;
    }

    setUploadingIndex(index);
    setUploadError(null);

    try {
      const response = await imgbbApi.uploadImage(file, {
        name: `car-photo-${Date.now()}`,
      });

      // Update the photo with the uploaded URL
      onUpdatePhoto(index, {
        ...formData.photos![index],
        url: response.data.url,
      });
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Failed to upload image. Please try again.');
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file, index);
    }
    // Reset input
    event.target.value = '';
  };

  const handleBulkFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setIsBulkUploading(true);
    setUploadError(null);

    const uploadPromises = files.map(async (file, i) => {
      const validation = imgbbApi.validateImageFile(file);
      if (!validation.isValid) {
        throw new Error(`${file.name}: ${validation.error}`);
      }

      const response = await imgbbApi.uploadImage(file, {
        name: `car-photo-${Date.now()}-${i}`,
      });

      return {
        url: response.data.url,
        is_primary: formData.photos?.length === 0 && i === 0,
        sort_order: (formData.photos?.length || 0) + i,
        is_hidden: false,
      };
    });

    try {
      const newUploadedPhotos = await Promise.all(uploadPromises);
      onAddPhotos(newUploadedPhotos);
    } catch (error: any) {
      console.error('Bulk upload error:', error);
      setUploadError(error.message || 'Failed to upload some images. Please try again.');
    } finally {
      setIsBulkUploading(false);
      event.target.value = '';
    }
  };

  const triggerBulkFileInput = () => {
    if (bulkFileInputRef.current) {
      bulkFileInputRef.current.click();
    }
  };

  const triggerFileInput = (index: number) => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('data-index', index.toString());
      fileInputRef.current.click();
    }
  };

  if (isViewMode && formData.photos && formData.photos.length > 0) {
    return (
      <div className="rounded-xl p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Image className="w-5 h-5 text-primary-600" />
          Photos
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {formData.photos?.map((photo, index) => (
            <div key={index} className="relative group">
              <img
                src={photo.url}
                alt={`Car photo ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border border-gray-200"
                onError={(e) => {
                  // Fallback to original URL if image fails to load
                  const target = e.target as HTMLImageElement;
                  if (photo.url && target.src !== photo.url) {
                    target.src = photo.url;
                  }
                }}
              />
              {photo.is_primary && (
                <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                  Primary
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isViewMode) {
    return null;
  }

  return (
    <div className="rounded-xl p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Image className="w-5 h-5 text-primary-600" />
        Photos
      </h3>

      {/* Upload Error */}
      {uploadError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span className="text-sm text-red-600">{uploadError}</span>
        </div>
      )}

      <div className="space-y-4">
        {formData.photos?.map((photo, index) => (
          <div
            key={index}
            className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl"
          >
            {/* Image Preview */}
            <div className="w-20 h-20 flex-shrink-0">
              {photo.url ? (
                <img
                  src={photo.url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg border border-gray-200"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (photo.url && target.src !== photo.url) {
                      target.src = photo.url;
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                  <Image className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>

            {/* URL Input */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={photo.url}
                onChange={(e) => {
                  onUpdatePhoto(index, { ...photo, url: e.target.value });
                }}
                placeholder="Photo URL or click to select image"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer"
                onClick={() => triggerFileInput(index)}
                readOnly
              />
              {uploadingIndex === index && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={photo.is_primary}
                  onChange={(e) => {
                    const newPhotos = (formData.photos || []).map((p, i) => ({
                      ...p,
                      is_primary: i === index ? e.target.checked : false,
                    }));
                    onUpdatePhoto(index, {
                      ...photo,
                      is_primary: e.target.checked,
                    });
                  }}
                  className="rounded"
                />
                <span className="text-sm">Primary</span>
              </label>
              <input
                type="number"
                value={photo.sort_order}
                onChange={(e) => {
                  onUpdatePhoto(index, {
                    ...photo,
                    sort_order: parseInt(e.target.value),
                  });
                }}
                placeholder="Order"
                className="w-20 px-2 py-2 border border-gray-200 rounded-lg text-center"
              />
            </div>
            <button
              type="button"
              onClick={() => onRemovePhoto(index)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {/* Add Photo Button */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            type="button"
            onClick={onAddPhoto}
            className="flex-1 p-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 hover:border-green-500 hover:text-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add URL
          </button>
          <button
            type="button"
            onClick={triggerBulkFileInput}
            disabled={isBulkUploading}
            className="flex-1 p-4 border-2 border-dashed border-green-300 bg-green-50/50 dark:bg-green-950/20 rounded-2xl text-green-700 dark:text-green-400 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/40 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isBulkUploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
            {isBulkUploading ? "Uploading..." : "Upload Multiple Photos"}
          </button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const index = parseInt(e.target.getAttribute('data-index') || '0');
          handleFileSelect(e, index);
        }}
        className="hidden"
      />

      <input
        ref={bulkFileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleBulkFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default PhotoSection;
