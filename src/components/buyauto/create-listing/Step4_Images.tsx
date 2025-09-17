import { useState, useCallback } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, X, GripVertical, Loader2 } from "lucide-react";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import { Reorder } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { uploadListingImages } from "@/services/storageService";
import { toast } from "sonner";

interface ImageItem {
  id: string;
  url: string;
}

export function Step4_Images() {
  const { control, setValue, getValues } = useFormContext();
  const images = useWatch({ control, name: "images" }) || [];
  const coverImageIndex = useWatch({ control, name: "cover_image_index" }) || 0;
  
  const [imageItems, setImageItems] = useState<ImageItem[]>(() =>
    images.map((url: string, index: number) => ({ id: `${index}-${Date.now()}`, url }))
  );
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user) {
      toast.error("Sie müssen angemeldet sein, um Bilder hochzuladen.");
      return;
    }
    
    if ((imageItems.length + acceptedFiles.length) > 15) {
      toast.error("Sie können maximal 15 Bilder hochladen.");
      return;
    }

    setIsUploading(true);
    try {
      const newUrls = await uploadListingImages(acceptedFiles, user.id);
      const newImageItems = newUrls.map((url, index) => ({ id: `${url}-${index}`, url }));
      
      const updatedItems = [...imageItems, ...newImageItems];
      setImageItems(updatedItems);
      
      const updatedUrls = updatedItems.map(item => item.url);
      setValue("images", updatedUrls, { shouldValidate: true, shouldDirty: true });

      toast.success(`${acceptedFiles.length} Bild(er) erfolgreich hochgeladen.`);
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Fehler beim Hochladen der Bilder. Bitte versuchen Sie es erneut.");
    } finally {
      setIsUploading(false);
    }
  }, [user, imageItems, setValue]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp"] },
    maxFiles: 15,
  });

  const handleRemoveImage = (indexToRemove: number) => {
    const updatedItems = imageItems.filter((_, index) => index !== indexToRemove);
    setImageItems(updatedItems);
    
    const updatedUrls = updatedItems.map(item => item.url);
    setValue("images", updatedUrls, { shouldValidate: true, shouldDirty: true });

    if (coverImageIndex === indexToRemove) {
      setValue("cover_image_index", 0, { shouldValidate: true });
    } else if (coverImageIndex > indexToRemove) {
      setValue("cover_image_index", coverImageIndex - 1, { shouldValidate: true });
    }
  };

  const handleSetCoverImage = (index: number) => {
    setValue("cover_image_index", index, { shouldValidate: true });
  };
  
  const onReorder = (newOrder: ImageItem[]) => {
    const oldCoverUrl = imageItems[coverImageIndex]?.url;
    setImageItems(newOrder);

    const newUrls = newOrder.map(item => item.url);
    setValue("images", newUrls, { shouldValidate: true, shouldDirty: true });

    const newCoverIndex = newOrder.findIndex(item => item.url === oldCoverUrl);
    setValue("cover_image_index", newCoverIndex >= 0 ? newCoverIndex : 0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bilder hochladen</CardTitle>
        <CardDescription>
          Laden Sie bis zu 15 Bilder Ihres Fahrzeugs hoch. Das erste Bild wird als Titelbild verwendet. Sie können die Reihenfolge per Drag-and-Drop ändern.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            {isUploading ? (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p>Bilder werden hochgeladen...</p>
              </>
            ) : (
              <>
                <UploadCloud className="h-12 w-12" />
                <p className="font-semibold">Klicken oder ziehen Sie Bilder hierher</p>
                <p className="text-sm">PNG, JPG, WEBP bis zu 10MB</p>
              </>
            )}
          </div>
        </div>

        {imageItems.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Ihre Bilder:</h3>
            <Reorder.Group axis="y" values={imageItems} onReorder={onReorder} className="space-y-4">
              {imageItems.map((item, index) => (
                <Reorder.Item key={item.id} value={item} className="bg-muted/50 p-3 rounded-lg flex items-center gap-4">
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab active:cursor-grabbing" />
                  <div className="relative w-24 h-16 rounded-md overflow-hidden flex-shrink-0">
                    <Image src={item.url} alt={`Fahrzeugbild ${index + 1}`} layout="fill" objectFit="cover" />
                  </div>
                  <div className="flex-grow text-sm truncate">{item.url.split("/").pop()}</div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={coverImageIndex === index ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => handleSetCoverImage(index)}
                      className={coverImageIndex === index ? "bg-green-100 dark:bg-green-900 border-green-500" : ""}
                    >
                      {coverImageIndex === index ? "Titelbild" : "Als Titelbild"}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveImage(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
