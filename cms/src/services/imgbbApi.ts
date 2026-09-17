// ImgBB API service for image uploads
const IMGBB_API_KEY = '184886199fbd4f0cd6da0ed475128ce0';
const IMGBB_BASE_URL = 'https://api.imgbb.com/1/upload';

export interface ImgBBResponse {
  data: {
    id: string;
    title: string;
    url_viewer: string;
    url: string;
    display_url: string;
    width: string;
    height: string;
    size: string;
    time: string;
    expiration: string;
    image: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    thumb: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    medium: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    delete_url: string;
  };
  success: boolean;
  status: number;
}

export interface ImgBBUploadOptions {
  expiration?: number; // in seconds (60-15552000)
  name?: string;
}

export const imgbbApi = {
  /**
   * Upload image to ImgBB
   * @param file - File object or base64 string
   * @param options - Upload options
   * @returns Promise with ImgBB response
   */
  async uploadImage(
    file: File | string,
    options: ImgBBUploadOptions = {}
  ): Promise<ImgBBResponse> {
    const formData = new FormData();
    
    // Handle different input types
    if (typeof file === 'string') {
      // Base64 string
      formData.append('image', file);
    } else {
      // File object
      formData.append('image', file);
    }
    
    // Add API key
    formData.append('key', IMGBB_API_KEY);
    
    // Add optional parameters
    if (options.expiration) {
      formData.append('expiration', options.expiration.toString());
    }
    if (options.name) {
      formData.append('name', options.name);
    }

    try {
      const response = await fetch(IMGBB_BASE_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ImgBBResponse = await response.json();
      
      if (!data.success) {
        throw new Error('Image upload failed');
      }

      return data;
    } catch (error) {
      console.error('ImgBB upload error:', error);
      throw new Error('Failed to upload image to ImgBB');
    }
  },

  /**
   * Convert file to base64 string
   * @param file - File object
   * @returns Promise with base64 string
   */
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:image/...;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  },

  /**
   * Validate image file
   * @param file - File object
   * @returns boolean indicating if file is valid
   */
  validateImageFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 32 * 1024 * 1024; // 32MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (file.size > maxSize) {
      return { isValid: false, error: 'File size must be less than 32MB' };
    }

    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'File must be an image (JPEG, PNG, GIF, or WebP)' };
    }

    return { isValid: true };
  }
};
