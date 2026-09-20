import apiClient from "./apiClient";
import { API_BASE_URL } from "../config/api";

export interface CarImageUploadResult {
  data: {
    path: string;
    url: string;
    filename: string;
  };
  success: boolean;
  message?: string;
}

/** Turn car_image/... path into a browser-loadable URL. */
export function resolvePublicAssetUrl(pathOrUrl?: string | null): string {
  if (!pathOrUrl) return "";
  if (
    /^https?:\/\//i.test(pathOrUrl) ||
    pathOrUrl.startsWith("blob:") ||
    pathOrUrl.startsWith("data:")
  ) {
    return pathOrUrl;
  }
  const origin = API_BASE_URL.replace(/\/api\/?$/, "");
  return `${origin}/${pathOrUrl.replace(/^\/+/, "")}`;
}

export const carImageApi = {
  /**
   * Upload image to backend public/car_image folder.
   */
  async uploadImage(
    file: File,
    _options: { name?: string } = {}
  ): Promise<CarImageUploadResult> {
    const formData = new FormData();
    formData.append("image", file);

    const response = await apiClient.post<CarImageUploadResult>(
      "/cars/upload-image",
      formData,
      { timeout: 60000 }
    );

    if (!response.data?.success || !response.data?.data?.url) {
      throw new Error(response.data?.message || "Image upload failed");
    }

    return response.data;
  },

  validateImageFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB (backend limit)
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];

    if (file.size > maxSize) {
      return { isValid: false, error: "File size must be less than 10MB" };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: "File must be an image (JPEG, PNG, GIF, or WebP)",
      };
    }

    return { isValid: true };
  },
};
