import React, { useState, useRef, useEffect } from "react";
import { Upload, File as FileIcon, Image, X, Download, Eye } from "lucide-react";
import { CreateCarData } from "../../../services/carApi";

interface AttachedFileSectionProps {
  formData: CreateCarData;
  errors: Record<string, string>;
  isViewMode: boolean;
  onInputChange: (field: keyof CreateCarData, value: any) => void;
}

const AttachedFileSection: React.FC<AttachedFileSectionProps> = ({
  formData,
  errors,
  isViewMode,
  onInputChange,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [originalExistingFile, setOriginalExistingFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track the original existing file when formData.attached_file is a string (existing file URL)
  // This happens when a car with an existing file is loaded
  useEffect(() => {
    if (typeof formData.attached_file === 'string' && formData.attached_file) {
      // Update the original existing file when we detect a string URL
      // This handles initial load and car changes
      setOriginalExistingFile((prev) => {
        // Only update if it's different (avoids unnecessary state updates)
        return prev !== formData.attached_file ? (formData.attached_file as string) : prev;
      });
    }
    // If formData.attached_file is a File or null, we keep the originalExistingFile
    // so it can still be displayed and restored if needed
  }, [formData.attached_file]); // Update when formData.attached_file changes

  // Check if attached_file is an existing file (string URL) or a new file (File object)
  const existingFile = typeof formData.attached_file === 'string' ? formData.attached_file : originalExistingFile;
  const newFile = formData.attached_file instanceof File ? formData.attached_file : null;

  const handleFileSelect = (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image (JPG, PNG, GIF, WebP) or PDF file.');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB.');
      return;
    }

    // If there's an existing file, replace it with the new file
    // Otherwise, just set the new file
    onInputChange('attached_file', file);

    // Create preview URL for images
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const removeFile = () => {
    // Remove new file, restore existing file if available
    if (originalExistingFile) {
      onInputChange('attached_file', originalExistingFile);
    } else {
      onInputChange('attached_file', null);
    }
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeExistingFile = () => {
    // Remove existing file, keep new file if any, otherwise set to null
    if (newFile) {
      onInputChange('attached_file', newFile);
    } else {
      onInputChange('attached_file', null);
    }
    setOriginalExistingFile(null);
  };

  const handleViewExistingFile = () => {
    if (existingFile) {
      window.open(existingFile, '_blank');
    }
  };

  const getFileIcon = (file: File | string) => {
    if (typeof file === 'string') {
      // For existing files, determine type from URL
      if (file.includes('imgbb.com') || file.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        return <Image className="w-5 h-5 text-green-600" />;
      } else if (file.match(/\.pdf$/i)) {
        return <FileIcon className="w-5 h-5 text-red-600" />;
      }
      return <FileIcon className="w-5 h-5 text-gray-600" />;
    }

    if (file.type.startsWith('image/')) {
      return <Image className="w-5 h-5 text-green-600" />;
    } else if (file.type === 'application/pdf') {
      return <FileIcon className="w-5 h-5 text-red-600" />;
    }
    return <FileIcon className="w-5 h-5 text-gray-600" />;
  };

  const formatFileSize = (file: File | string) => {
    if (typeof file === 'string') {
      return 'Existing file';
    }

    const bytes = file.size;
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileName = (file: File | string) => {
    if (typeof file === 'string') {
      return file.split('/').pop() || 'Unknown file';
    }
    return file.name;
  };

  return (
    <div className="rounded-xl p-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5 text-primary-600" />
        Attached File
      </h3>

      <div className="space-y-4">
        {!isViewMode && (
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
              dragActive
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
              onChange={handleFileInputChange}
              className="hidden"
            />

            <div className="flex flex-col items-center">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-1">
                {existingFile ? (
                  <>Drag and drop a new file to replace the current one, or{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="text-primary-600 hover:text-primary-700 underline"
                  >
                    browse
                  </button></>
                ) : (
                  <>Drag and drop a file here, or{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="text-primary-600 hover:text-primary-700 underline"
                  >
                    browse
                  </button></>
                )}
              </p>
              <p className="text-xs text-gray-500">
                Supports: JPG, PNG, GIF, WebP, PDF (Max 10MB)
              </p>
            </div>
          </div>
        )}

        {/* Show existing file if available */}
        {existingFile && (
          <div className="bg-primary-50 rounded-lg border border-primary-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-primary-700 uppercase">Current File</span>
              </div>
              {!isViewMode && (
                <button
                  type="button"
                  onClick={removeExistingFile}
                  className="text-red-600 hover:text-red-700 p-1"
                  title="Remove existing file"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getFileIcon(existingFile)}
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {getFileName(existingFile)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Existing file
                  </p>
                </div>
              </div>
              {/* <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleViewExistingFile}
                  className="text-primary-600 hover:text-primary-700 p-2 rounded-lg hover:bg-primary-100 transition-colors"
                  title="View file"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <a
                  href={existingFile}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:text-green-700 p-2 rounded-lg hover:bg-green-100 transition-colors"
                  title="Download file"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div> */}
            </div>
          </div>
        )}

        {/* Show new file if selected */}
        {newFile && (
          <div className="bg-green-50 rounded-lg border border-green-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-green-700 uppercase">New File (will replace current)</span>
              </div>
              {!isViewMode && (
                <button
                  type="button"
                  onClick={removeFile}
                  className="text-red-600 hover:text-red-700 p-1"
                  title="Remove new file"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getFileIcon(newFile)}
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {getFileName(newFile)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(newFile)}
                  </p>
                </div>
              </div>
            </div>

            {previewUrl && (
              <div className="mt-3">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-w-full h-32 object-cover rounded border"
                />
              </div>
            )}
          </div>
        )}

        {errors.attached_file && (
          <p className="text-sm text-red-600">{errors.attached_file}</p>
        )}
      </div>
    </div>
  );
};

export default AttachedFileSection;
