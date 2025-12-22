import { supabase } from "@/integrations/supabase/client";
import { generateImageVariants, optimizeImage, shouldOptimizeImage, formatFileSize } from "@/lib/buyauto/imageOptimization";

const LISTING_IMAGES_BUCKET = "listing-images";

/**
 * Upload a file with automatic optimization
 * Generates multiple size variants for optimal performance
 */
export async function uploadOptimizedImage(
  file: File,
  bucket: string,
  path: string,
  onProgress?: (progress: number) => void
): Promise<{
  urls: {
    thumbnail: string;
    medium: string;
    large: string;
  };
  mainUrl: string;
}> {
  try {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const baseFileName = `${timestamp}_${randomId}_${sanitizedFileName}`;
    const basePath = path ? `${path}/${baseFileName}` : baseFileName;

    if (onProgress) onProgress(10);

    // Check if image needs optimization
    const needsOptimization = shouldOptimizeImage(file);
    
    if (needsOptimization) {
      console.log(`Optimizing image: ${file.name} (${formatFileSize(file.size)})`);
      
      // Generate optimized variants
      const variants = await generateImageVariants(file);
      
      if (onProgress) onProgress(40);

      // Upload all variants
      const uploadPromises = [
        supabase.storage
          .from(bucket)
          .upload(basePath.replace(/\.[^.]+$/, "_thumbnail.webp"), variants.thumbnail, {
            contentType: "image/webp",
            cacheControl: "3600",
            upsert: false,
          }),
        supabase.storage
          .from(bucket)
          .upload(basePath.replace(/\.[^.]+$/, "_medium.webp"), variants.medium, {
            contentType: "image/webp",
            cacheControl: "3600",
            upsert: false,
          }),
        supabase.storage
          .from(bucket)
          .upload(basePath.replace(/\.[^.]+$/, "_large.webp"), variants.large, {
            contentType: "image/webp",
            cacheControl: "3600",
            upsert: false,
          }),
      ];

      const results = await Promise.all(uploadPromises);

      if (onProgress) onProgress(90);

      // Check for errors
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) {
        throw new Error(`Failed to upload variants: ${errors[0].error?.message}`);
      }

      // Get public URLs
      const { data: thumbnailData } = supabase.storage
        .from(bucket)
        .getPublicUrl(basePath.replace(/\.[^.]+$/, "_thumbnail.webp"));
      const { data: mediumData } = supabase.storage
        .from(bucket)
        .getPublicUrl(basePath.replace(/\.[^.]+$/, "_medium.webp"));
      const { data: largeData } = supabase.storage
        .from(bucket)
        .getPublicUrl(basePath.replace(/\.[^.]+$/, "_large.webp"));

      if (onProgress) onProgress(100);

      console.log(`Successfully optimized and uploaded: ${file.name}`);
      console.log(`Thumbnail: ${formatFileSize(variants.thumbnail.size)}`);
      console.log(`Medium: ${formatFileSize(variants.medium.size)}`);
      console.log(`Large: ${formatFileSize(variants.large.size)}`);

      return {
        urls: {
          thumbnail: thumbnailData.publicUrl,
          medium: mediumData.publicUrl,
          large: largeData.publicUrl,
        },
        mainUrl: mediumData.publicUrl, // Use medium as default
      };
    } else {
      // File is already small enough, upload as-is
      console.log(`Uploading without optimization: ${file.name} (${formatFileSize(file.size)})`);
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(basePath, file, {
          contentType: file.type,
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      if (onProgress) onProgress(100);

      return {
        urls: {
          thumbnail: urlData.publicUrl,
          medium: urlData.publicUrl,
          large: urlData.publicUrl,
        },
        mainUrl: urlData.publicUrl,
      };
    }
  } catch (error) {
    console.error("Error uploading optimized image:", error);
    throw error;
  }
}

/**
 * Uploads images for a listing to Supabase Storage.
 *
 * @param files - An array of File objects to upload.
 * @param userId - The ID of the user uploading the files, used for folder organization.
 * @returns A promise that resolves to an array of public URLs for the uploaded images.
 */
export async function uploadListingImages(files: File[], userId: string): Promise<string[]> {
  if (!files || files.length === 0) {
    return [];
  }

  const uploadPromises = files.map(async (file) => {
    // Ensure unique name and standard extension
    const fileExtension = "jpg"; // We converted to jpeg
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `${userId}/${fileName}`;

    const { error } = await supabase.storage
      .from(LISTING_IMAGES_BUCKET)
      .upload(filePath, file, {
        cacheControl: "31536000", // 1 year cache (aggressive caching for immutable files)
        upsert: false,
        contentType: 'image/jpeg'
      });

    if (error) {
      console.error(`Error uploading image ${file.name}:`, error);
      throw new Error(`Failed to upload image: ${file.name}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from(LISTING_IMAGES_BUCKET)
      .getPublicUrl(filePath);
      
    return publicUrl;
  });

  try {
    const publicUrls = await Promise.all(uploadPromises);
    return publicUrls;
  } catch (error) {
    console.error("One or more image uploads failed:", error);
    // In a real app, you might want to implement a rollback mechanism
    // to delete already uploaded files if one fails.
    throw error;
  }
}
