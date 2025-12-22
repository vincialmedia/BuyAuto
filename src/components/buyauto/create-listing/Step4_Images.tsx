import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, X, GripVertical, Loader2, ChevronLeft } from "lucide-react";
import Image from "next/image";
import Head from "next/head";
import { useDropzone } from "react-dropzone";
import { Reorder } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { uploadListingImages } from "@/services/storageService";
import { useWizard } from "./ListingWizard";
import Uppy from '@uppy/core';
import { Dashboard } from '@uppy/react';
import { useToast } from '@/hooks/use-toast';
import { createOrUpdateListing } from '@/services/createListingService';
import { uploadOptimizedImage } from "@/services/storageService";

// CSS is now loaded via Head to avoid build errors with package exports
// and to enable better caching/performance

interface ImageItem {
  id: string;
  url: string;
}

export function Step4_Images() {
  const { data, updateData, nextStep, prevStep, getMaxPhotos } = useWizard();
  const images = data.images || [];
  const coverImageIndex = data.cover_image_index || 0;
  const { toast } = useToast();
  const { user } = useAuth();
  const maxPhotos = getMaxPhotos();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Initialize image items state
  const [imageItems, setImageItems] = useState<ImageItem[]>(() =>
    images.map((url: string, index: number) => ({ id: `${index}-${Date.now()}`, url }))
  );

  const [uppy] = useState(() =>
    new Uppy({
      autoProceed: true,
      restrictions: {
        maxFileSize: 10 * 1024 * 1024,
        maxNumberOfFiles: maxPhotos,
        allowedFileTypes: ['image/*'],
      },
    })
  );

  // Handle component mount for client-side only rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    uppy.on('upload-error', (file, error) => {
      console.error('Uppy upload error:', error);
      toast({
        title: 'Upload-Fehler',
        description: `Fehler beim Hochladen von ${file?.name}: ${error.message}`,
        variant: 'destructive',
      });
    });

    uppy.on('error', (error) => {
      console.error('Uppy generic error:', error);
      toast({
        title: 'Ein Fehler ist aufgetreten',
        description: 'Beim Uploader ist ein Problem aufgetreten. Bitte laden Sie die Seite neu.',
        variant: 'destructive',
      });
    });
    
    uppy.on('complete', (result) => {
      const successfulUploads = result.successful;
      if (successfulUploads.length > 0) {
        const permanentUrls = successfulUploads.map(file => file.response?.body.url).filter(Boolean) as string[];
        console.log('Uploaded file URLs:', permanentUrls);
        
        const newImages = [...(data.images || []), ...permanentUrls];
        updateData({ images: newImages });

        toast({
          title: 'Upload erfolgreich',
          description: `${permanentUrls.length} Bilder wurden erfolgreich hochgeladen.`,
        });
      }

      if (result.failed.length > 0) {
        toast({
          title: 'Einige Uploads sind fehlgeschlagen',
          description: `${result.failed.length} Bilder konnten nicht hochgeladen werden.`,
          variant: 'destructive',
        });
      }
    });

    return () => {
      // Fix: Use destroy instead of close
      uppy.destroy();
    };
  }, [uppy, data.images, toast, updateData]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user) {
      toast({
        title: "Fehler",
        description: "Sie müssen angemeldet sein, um Bilder hochzuladen.",
        variant: "destructive",
      });
      return;
    }
    
    if ((imageItems.length + acceptedFiles.length) > maxPhotos) {
      toast({
        title: "Limit erreicht",
        description: `Sie können maximal ${maxPhotos} Bilder hochladen.`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const newUrls = await uploadListingImages(acceptedFiles, user.id);
      const newImageItems = newUrls.map((url, index) => ({ id: `${url}-${index}`, url }));
      
      const updatedItems = [...imageItems, ...newImageItems];
      setImageItems(updatedItems);
      
      const updatedUrls = updatedItems.map(item => item.url);
      updateData({ 
        images: updatedUrls, 
        cover_image_index: coverImageIndex < updatedUrls.length ? coverImageIndex : 0 
      });

      toast({
        title: "Upload erfolgreich",
        description: `${acceptedFiles.length} Bild(er) erfolgreich hochgeladen.`,
      });
    } catch (error) {
      console.error("Upload failed:", error);
      toast({
        title: "Upload Fehler",
        description: "Fehler beim Hochladen der Bilder. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [user, imageItems, maxPhotos, updateData, coverImageIndex, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp"] },
    maxFiles: maxPhotos,
  });

  const handleRemoveImage = (indexToRemove: number) => {
    const updatedItems = imageItems.filter((_, index) => index !== indexToRemove);
    setImageItems(updatedItems);
    
    const updatedUrls = updatedItems.map(item => item.url);
    let newCoverIndex = coverImageIndex;
    
    if (coverImageIndex === indexToRemove) {
      newCoverIndex = 0;
    } else if (coverImageIndex > indexToRemove) {
      newCoverIndex = coverImageIndex - 1;
    }

    updateData({ 
      images: updatedUrls, 
      cover_image_index: newCoverIndex 
    });
  };

  const handleSetCoverImage = (index: number) => {
    updateData({ cover_image_index: index });
  };
  
  const onReorder = (newOrder: ImageItem[]) => {
    const oldCoverUrl = imageItems[coverImageIndex]?.url;
    setImageItems(newOrder);

    const newUrls = newOrder.map(item => item.url);
    const newCoverIndex = oldCoverUrl ? newOrder.findIndex(item => item.url === oldCoverUrl) : 0;
    
    updateData({ 
      images: newUrls, 
      cover_image_index: newCoverIndex >= 0 ? newCoverIndex : 0 
    });
  };

  const handleNext = async () => {
    if (!user) {
      toast({ 
        title: "Nicht angemeldet", 
        description: "Bitte melden Sie sich an.", 
        variant: "destructive" 
      });
      return;
    }
    if (!data.id) {
      toast({ 
        title: "Fehler", 
        description: "Keine Inserat-ID gefunden.", 
        variant: "destructive" 
      });
      return;
    }
    if (!data.images || data.images.length === 0) {
      toast({ 
        title: "Keine Bilder", 
        description: "Bitte laden Sie mindestens ein Bild hoch.", 
        variant: "destructive" 
      });
      return;
    }

    setIsUpdating(true);
    try {
      await createOrUpdateListing({
        id: data.id,
        images: data.images,
        cover_image_index: data.cover_image_index || 0,
      }, user);

      toast({
        title: "Bilder gespeichert",
        description: "Ihre Bilder wurden dem Inserat hinzugefügt.",
      });
      nextStep();
    } catch (error) {
      console.error("Fehler beim Speichern der Bilder:", error);
      toast({ 
        title: "Fehler", 
        description: "Bilder konnten nicht gespeichert werden.", 
        variant: "destructive" 
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const uploadImage = async (file: File) => {
    try {
      setIsUploading(true);
      
      // Use optimized upload that generates multiple size variants
      const result = await uploadOptimizedImage(
        file,
        "listing-images",
        "",
        (progress) => {
          // setUploadProgress(progress);
        }
      );

      const newImage: ImageItem = {
        id: Math.random().toString(36).substring(7),
        url: result.mainUrl,
      };

      const updatedItems = [...imageItems, newImage];
      setImageItems(updatedItems);
      updateData({ 
        images: updatedItems.map(item => item.url), 
        cover_image_index: coverImageIndex < updatedItems.length ? coverImageIndex : 0 
      });

      toast({
        title: "Bild hochgeladen",
        description: "Das Bild wurde erfolgreich optimiert und hochgeladen.",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Fehler",
        description: "Beim Hochladen des Bildes ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Head>
        <link href="https://releases.transloadit.com/uppy/v3.27.3/uppy.min.css" rel="stylesheet" />
      </Head>
      <div className="text-center">
        <h2 className="text-2xl font-light text-neutral-900 mb-2 tracking-tight">
          Bilder hochladen
        </h2>
        <p className="text-neutral-600 font-light leading-relaxed">
          Laden Sie bis zu {maxPhotos} Bilder Ihres Fahrzeugs hoch
        </p>
      </div>

      <Card className="border border-neutral-200/40 shadow-sm bg-white">
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? "border-red-400 bg-red-50" 
                : "border-neutral-300 hover:border-red-400 hover:bg-neutral-50"
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-3 text-neutral-600">
              {isUploading ? (
                <>
                  <Loader2 className="h-12 w-12 animate-spin text-red-500" />
                  <p className="font-medium">Bilder werden hochgeladen...</p>
                </>
              ) : (
                <>
                  <UploadCloud className="h-12 w-12 text-neutral-400" />
                  <div className="space-y-1">
                    <p className="font-medium text-neutral-900">Klicken oder ziehen Sie Bilder hierher</p>
                    <p className="text-sm font-light">PNG, JPG, WEBP bis zu 10MB pro Bild</p>
                    <p className="text-xs text-neutral-500">
                      Maximal {maxPhotos} Bilder · {imageItems.length} von {maxPhotos} hochgeladen
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {imageItems.length > 0 && (
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-neutral-900">Ihre Bilder ({imageItems.length})</h3>
                <p className="text-xs text-neutral-500 font-light">
                  Ziehen Sie die Bilder, um die Reihenfolge zu ändern
                </p>
              </div>
              
              <Reorder.Group axis="y" values={imageItems} onReorder={onReorder} className="space-y-3">
                {imageItems.map((item, index) => (
                  <Reorder.Item 
                    key={item.id} 
                    value={item} 
                    className="bg-neutral-50 p-4 rounded-lg flex items-center gap-4 border border-neutral-200/40 hover:border-neutral-300 transition-colors"
                  >
                    <GripVertical className="h-5 w-5 text-neutral-400 cursor-grab active:cursor-grabbing" />
                    
                    <div className="relative w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-neutral-200">
                      <Image 
                        src={item.url} 
                        alt={`Fahrzeugbild ${index + 1}`} 
                        fill
                        className="object-cover" 
                        sizes="80px"
                      />
                      {coverImageIndex === index && (
                        <div className="absolute top-1 left-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                          Titel
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-grow">
                      <p className="text-sm font-medium text-neutral-900">Bild {index + 1}</p>
                      <p className="text-xs text-neutral-500 font-light truncate">
                        {item.url.split("/").pop()}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant={coverImageIndex === index ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleSetCoverImage(index)}
                        className={
                          coverImageIndex === index 
                            ? "bg-red-500 hover:bg-red-600 text-white" 
                            : "border-neutral-200/40 text-neutral-600 hover:bg-neutral-50"
                        }
                      >
                        {coverImageIndex === index ? "Titelbild" : "Als Titel"}
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRemoveImage(index)}
                        className="text-neutral-500 hover:text-red-600 hover:bg-red-50"
                      >
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

      {/* Plan info */}
      <div className="bg-gradient-to-br from-neutral-50 to-red-50/30 rounded-lg p-6 border border-neutral-200/40">
        <h3 className="text-lg font-medium text-neutral-900 mb-3 tracking-tight">Bilderlimit</h3>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-neutral-900">
              {data.price_plan === 'standard' ? 'Standard Plan' : 'Premium Plan'}
            </p>
            <p className="text-xs text-neutral-600 font-light">
              {maxPhotos} Bilder möglich
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-neutral-900">{imageItems.length}/{maxPhotos}</p>
            <p className="text-xs text-neutral-500 font-light">hochgeladen</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button
          type="button"
          onClick={prevStep}
          variant="outline"
          className="px-6 py-3 bg-transparent hover:bg-neutral-50 border-neutral-200/40 text-neutral-600 rounded-lg transition-all duration-200"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Zurück
        </Button>
        
        <Button
          type="button"
          onClick={handleNext}
          className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white"
          disabled={isUpdating}
        >
          {isUpdating ? "Speichern..." : "Weiter zur Vorschau"}
        </Button>
      </div>
    </div>
  );
}
