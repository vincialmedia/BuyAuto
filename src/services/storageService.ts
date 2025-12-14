import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

const LISTING_IMAGES_BUCKET = "listing-images";

// Helper to compress image before upload
async function compressImage(file: File): Promise<File> {
  // Configuration
  const MAX_WIDTH = 1920; // Max width for full screen quality
  const MAX_HEIGHT = 1080;
  const QUALITY = 0.8; // 80% quality is good balance

  return new Promise((resolve, reject) => {
    // If it's not an image, return original
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions
      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file); // Fallback to original
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Create new file with same name but optimized
            // We use jpeg or webp for better compression than png
            const optimizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(optimizedFile);
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        QUALITY
      );
    };

    reader.onerror = (error) => reject(error);
    img.onerror = (error) => reject(error);
    
    reader.readAsDataURL(file);
  });
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

  // Compress all images in parallel
  const compressionPromises = files.map(file => compressImage(file));
  let optimizedFiles: File[] = [];
  
  try {
    optimizedFiles = await Promise.all(compressionPromises);
  } catch (err) {
    console.error("Compression failed, using original files:", err);
    optimizedFiles = files;
  }

  const uploadPromises = optimizedFiles.map(async (file) => {
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
