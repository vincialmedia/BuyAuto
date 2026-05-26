/**
 * Image Optimization Utility
 * Automatically resizes and optimizes images for faster page loads
 */

export interface ImageSizeConfig {
  width: number;
  height?: number;
  quality: number;
  format?: "webp" | "jpeg" | "png";
}

export const IMAGE_SIZE_CONFIGS = {
  thumbnail: { width: 400, quality: 80, format: "webp" as const },
  medium: { width: 800, quality: 85, format: "webp" as const },
  large: { width: 1200, quality: 90, format: "webp" as const },
  hero: { width: 1920, height: 600, quality: 85, format: "webp" as const },
} as const;

/**
 * Resize an image file to specified dimensions
 */
export async function resizeImage(
  file: File,
  config: ImageSizeConfig
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    img.onload = () => {
      // Calculate dimensions maintaining aspect ratio
      const { width, height } = config;
      const aspectRatio = img.width / img.height;

      if (height) {
        // If both width and height are specified, use them directly
        canvas.width = width;
        canvas.height = height;
      } else {
        // If only width is specified, calculate height from aspect ratio
        canvas.width = Math.min(width, img.width);
        canvas.height = canvas.width / aspectRatio;
      }

      // Draw and compress
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const requestedMime = `image/${config.format || "webp"}`;
      const quality = config.quality / 100;

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to create blob"));
            return;
          }

          // Some browsers (notably older iOS Safari) silently fall back to
          // PNG when an unsupported encoder is requested. PNG bloats
          // photographic content (often 10-30x larger than WebP/JPEG). If the
          // actual blob type doesn't match what we asked for, re-encode as
          // JPEG — universally supported and much smaller for photos.
          if (blob.type !== requestedMime) {
            canvas.toBlob(
              (jpegBlob) => {
                if (jpegBlob) {
                  resolve(jpegBlob);
                } else {
                  reject(new Error("Failed to re-encode as JPEG fallback"));
                }
              },
              "image/jpeg",
              quality
            );
            return;
          }

          resolve(blob);
        },
        requestedMime,
        quality
      );
    };

    img.onerror = () => reject(new Error("Failed to load image"));

    // Load the image
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        img.src = e.target.result as string;
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Generate multiple size variants of an image
 */
export async function generateImageVariants(file: File): Promise<{
  thumbnail: Blob;
  medium: Blob;
  large: Blob;
  original?: Blob;
}> {
  const [thumbnail, medium, large] = await Promise.all([
    resizeImage(file, IMAGE_SIZE_CONFIGS.thumbnail),
    resizeImage(file, IMAGE_SIZE_CONFIGS.medium),
    resizeImage(file, IMAGE_SIZE_CONFIGS.large),
  ]);

  return {
    thumbnail,
    medium,
    large,
  };
}

/**
 * Optimize a single image to a specific size
 */
export async function optimizeImage(
  file: File,
  size: keyof typeof IMAGE_SIZE_CONFIGS = "large"
): Promise<Blob> {
  return resizeImage(file, IMAGE_SIZE_CONFIGS[size]);
}

/**
 * Map a Blob's MIME type to its canonical file extension. Used by upload code
 * so the storage filename matches the actual encoded content (which may differ
 * from what we requested — see resizeImage's fallback handling).
 */
export function getImageExtension(blob: Blob): string {
  switch (blob.type) {
    case "image/webp":
      return "webp";
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    default:
      return "webp";
  }
}

/**
 * Get the appropriate image URL based on the context
 */
export function getOptimizedImageUrl(
  baseUrl: string,
  size: "thumbnail" | "medium" | "large" = "medium"
): string {
  if (!baseUrl) return "";
  
  // If URL already contains a size suffix, replace it
  const basePath = baseUrl.replace(/_(thumbnail|medium|large)(\.[^.]+)$/, "$2");
  
  // Add size suffix before file extension
  const lastDotIndex = basePath.lastIndexOf(".");
  if (lastDotIndex === -1) return basePath;
  
  return `${basePath.substring(0, lastDotIndex)}_${size}${basePath.substring(lastDotIndex)}`;
}

/**
 * Check if a file needs optimization based on size
 */
export function shouldOptimizeImage(file: File): boolean {
  const MAX_SIZE_MB = 1;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
  
  return file.size > MAX_SIZE_BYTES || !file.type.includes("webp");
}

/**
 * Get file size in a human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}