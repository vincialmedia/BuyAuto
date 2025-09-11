import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ImageGalleryProps {
  images: string[];
  brand?: string;
  model?: string;
  premium?: boolean;
}

export default function ImageGallery({ images, brand = "", model = "", premium = false }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const validImages = images.filter(Boolean);
  const alt = `${brand} ${model}`;
  
  if (validImages.length === 0) {
    return (
      <div className="aspect-video bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-3xl flex items-center justify-center">
        <div className="text-center space-y-2 text-neutral-500">
          <div className="text-6xl">📸</div>
          <p className="text-sm">Keine Bilder verfügbar</p>
        </div>
      </div>
    );
  }

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setShowLightbox(true);
  };

  const closeLightbox = () => {
    setShowLightbox(false);
  };

  const nextLightboxImage = () => {
    setLightboxIndex((prev) => (prev + 1) % validImages.length);
  };

  const prevLightboxImage = () => {
    setLightboxIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") nextLightboxImage();
    if (e.key === "ArrowLeft") prevLightboxImage();
    if (e.key === "Escape") closeLightbox();
  };

  return (
    <>
      <div className="space-y-4">
        {/* Main Image */}
        <div className="relative aspect-video group cursor-pointer overflow-hidden rounded-3xl shadow-xl shadow-neutral-900/10 bg-gradient-to-br from-neutral-100 to-neutral-200">
          {validImages[currentIndex] && (
            <Image
              src={validImages[currentIndex]}
              alt={alt}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 800px"
              priority
              onClick={() => openLightbox(currentIndex)}
            />
          )}
          
          {/* Zoom Overlay */}
          <div
            className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100"
            onClick={() => openLightbox(currentIndex)}
          >
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 transform scale-75 group-hover:scale-100 transition-transform duration-300">
              <ZoomIn className="w-6 h-6 text-neutral-700" />
            </div>
          </div>

          {/* Navigation for mobile carousel */}
          {validImages.length > 1 && (
            <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4 md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
                }}
                className="bg-white/80 hover:bg-white/90 backdrop-blur-sm rounded-full w-10 h-10 p-0 shadow-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex((prev) => (prev + 1) % validImages.length);
                }}
                className="bg-white/80 hover:bg-white/90 backdrop-blur-sm rounded-full w-10 h-10 p-0 shadow-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          )}

          {/* Mobile indicator dots */}
          {validImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 md:hidden">
              {validImages.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    index === currentIndex
                      ? "bg-white shadow-lg scale-125"
                      : "bg-white/60 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Desktop Thumbnails */}
        {validImages.length > 1 && (
          <div className="hidden md:grid grid-cols-4 lg:grid-cols-6 gap-3">
            {validImages.slice(0, 12).map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
                  index === currentIndex
                    ? "border-red-500 shadow-lg shadow-red-500/20 scale-105"
                    : "border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <Image
                  src={image}
                  alt={`${alt} - Bild ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="150px"
                />
              </button>
            ))}
            {validImages.length > 12 && (
              <div className="relative aspect-video rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-200 border-2 border-neutral-200 flex items-center justify-center text-sm font-medium text-neutral-600">
                +{validImages.length - 12}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <Dialog open={showLightbox} onOpenChange={setShowLightbox}>
        <DialogContent className="max-w-7xl max-h-[90vh] p-0 bg-black/95 border-0">
          <div
            className="relative w-full h-[85vh] flex items-center justify-center"
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-50 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full w-10 h-10 p-0 text-white"
            >
              <X className="w-5 h-5" />
            </Button>

            {/* Navigation */}
            {validImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={prevLightboxImage}
                  className="absolute left-4 z-50 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full w-12 h-12 p-0 text-white"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={nextLightboxImage}
                  className="absolute right-4 z-50 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full w-12 h-12 p-0 text-white"
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </>
            )}

            {/* Main Image */}
            <div className="relative max-w-full max-h-full">
              <Image
                src={validImages[lightboxIndex]}
                alt={`${alt} - Bild ${lightboxIndex + 1}`}
                width={1200}
                height={800}
                className="object-contain max-w-full max-h-full"
                sizes="100vw"
              />
            </div>

            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm">
              {lightboxIndex + 1} / {validImages.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}