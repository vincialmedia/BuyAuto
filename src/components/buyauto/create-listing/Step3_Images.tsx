import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useWizard } from "./ListingWizard";
import { imagesSchema, type ImagesForm } from "@/lib/buyauto/schemas";
import { ChevronLeft, Upload, X, Star, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

export default function Step3_Images() {
  const { data, updateData, nextStep, prevStep } = useWizard();
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const {
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ImagesForm>({
    resolver: zodResolver(imagesSchema),
    defaultValues: {
      images: data.images || [],
      cover_image_index: data.cover_image_index || 0,
    },
  });

  const images = watch("images") || [];
  const coverImageIndex = watch("cover_image_index");

  const onSubmit = (formData: ImagesForm) => {
    updateData(formData);
    nextStep();
  };

  const handleFileUpload = useCallback(async (files: FileList) => {
    if (!files || files.length === 0) return;
    
    setUploading(true);
    
    try {
      const newImages = [...images];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Create a data URL for preview (in real app, upload to Supabase Storage)
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            newImages.push(e.target.result as string);
            setValue("images", newImages, { shouldValidate: true });
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  }, [images, setValue]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, [handleFileUpload]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setValue("images", newImages, { shouldValidate: true });
    
    // Adjust cover image index if needed
    if (coverImageIndex >= newImages.length) {
      setValue("cover_image_index", Math.max(0, newImages.length - 1));
    } else if (coverImageIndex === index) {
      setValue("cover_image_index", 0);
    }
  };

  const setCoverImage = (index: number) => {
    setValue("cover_image_index", index);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-light text-neutral-900 mb-2">
          Bilder hochladen
        </h2>
        <p className="text-neutral-600">
          Laden Sie hochwertige Fotos Ihres Fahrzeugs hoch
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Upload Area */}
        <div
          className={`
            relative border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-300
            ${dragActive 
              ? 'border-amber-400 bg-amber-50/50 scale-[1.02]' 
              : 'border-neutral-300 hover:border-amber-300 bg-neutral-50/50'
            }
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center">
              <Upload className="w-8 h-8 text-amber-600" />
            </div>
            
            <div>
              <p className="text-lg font-medium text-neutral-900 mb-2">
                Bilder hier ablegen oder klicken
              </p>
              <p className="text-sm text-neutral-500">
                JPG, PNG oder WEBP bis 10MB pro Bild
              </p>
            </div>
            
            {uploading && (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-amber-600">Wird hochgeladen...</span>
              </div>
            )}
          </div>
        </div>

        {/* Image Grid */}
        {images.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-neutral-900">
                Hochgeladene Bilder ({images.length})
              </h3>
              <p className="text-sm text-neutral-500">
                Klicken Sie auf den Stern, um das Titelbild festzulegen
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <Card key={index} className="relative group overflow-hidden rounded-2xl border-2 border-transparent hover:border-amber-200 transition-all duration-200">
                  <div className="relative aspect-[4/3] bg-neutral-100">
                    <Image
                      src={image}
                      alt={`Fahrzeugbild ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200" />
                    
                    {/* Cover Image Badge */}
                    {coverImageIndex === index && (
                      <div className="absolute top-2 left-2 bg-amber-500 text-white px-2 py-1 rounded-lg text-xs font-medium flex items-center space-x-1">
                        <Star className="w-3 h-3 fill-current" />
                        <span>Titelbild</span>
                      </div>
                    )}
                    
                    {/* Actions */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 flex space-x-1">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setCoverImage(index)}
                        className={`
                          w-8 h-8 p-0 rounded-lg
                          ${coverImageIndex === index 
                            ? 'bg-amber-500 hover:bg-amber-600' 
                            : 'bg-white/90 hover:bg-white text-neutral-600 hover:text-neutral-900'
                          }
                        `}
                      >
                        <Star className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => removeImage(index)}
                        className="w-8 h-8 p-0 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {errors.images && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-600 flex items-center">
              <ImageIcon className="w-4 h-4 mr-2" />
              {errors.images.message}
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-6">
          <Button
            type="button"
            onClick={prevStep}
            variant="outline"
            className="px-6 py-3 bg-transparent hover:bg-neutral-50 border-neutral-300 text-neutral-600 rounded-xl transition-all duration-200"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
          
          <Button
            type="submit"
            className="px-8 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-medium rounded-xl shadow-lg shadow-amber-200 transition-all duration-200 hover:shadow-xl hover:scale-[1.02]"
          >
            Weiter zur Plan-Auswahl
          </Button>
        </div>
      </form>
    </div>
  );
}