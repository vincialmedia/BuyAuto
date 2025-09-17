import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

const LISTING_IMAGES_BUCKET = "listing-images";

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
    const fileExtension = file.name.split(".").pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `${userId}/${fileName}`;

    const { error } = await supabase.storage
      .from(LISTING_IMAGES_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
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
