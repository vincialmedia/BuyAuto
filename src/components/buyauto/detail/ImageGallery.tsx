import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Loader2, X, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getImageVariant } from "@/lib/buyauto/imageVariant";

interface ImageGalleryProps {
  images: string[];
  brand?: string;
  model?: string;
  premium?: boolean;
}

// Shared between the main surface and the lightbox underlay so the lightbox
// can reuse the exact bytes the main image already fetched (same src + sizes
// + quality → same optimizer URL → served from browser cache).
const MAIN_SIZES = "(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 800px";
const LIGHTBOX_SIZES = "(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 85vw";
const IMAGE_QUALITY = 85;

export default function ImageGallery({ images, brand = "", model = "", premium = false }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  // Indexes whose image finished loading, per surface. The lightbox requests
  // a larger candidate than the main surface on desktop, so the two are
  // tracked separately.
  const [loadedMain, setLoadedMain] = useState<Set<number>>(() => new Set());
  const [loadedLightbox, setLoadedLightbox] = useState<Set<number>>(() => new Set());
  // Only preload carousel neighbours once the visitor actually navigates —
  // never on plain page load, where it would compete with the LCP image.
  const [hasNavigated, setHasNavigated] = useState(false);

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

  const markLoaded = (setter: typeof setLoadedMain, index: number) => {
    setter((prev) => {
      if (prev.has(index)) return prev;
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  };

  const goToImage = (index: number) => {
    setHasNavigated(true);
    setCurrentIndex(index);
  };

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

  const neighbourIndexes = (index: number): number[] => {
    if (validImages.length < 2) return [];
    const next = (index + 1) % validImages.length;
    const prev = (index - 1 + validImages.length) % validImages.length;
    return Array.from(new Set([next, prev])).filter((i) => i !== index);
  };

  // Warm the browser cache for the images a click away, so stepping through
  // the carousel or lightbox doesn't wait on the network each time. Rendered
  // as real next/image elements (in an invisible 1px box) so the fetched URL
  // is exactly the one the visible surface will request.
  const preloads: { key: string; src: string; sizes: string }[] = [];
  if (hasNavigated) {
    for (const i of neighbourIndexes(currentIndex)) {
      preloads.push({ key: `main-${i}`, src: validImages[i], sizes: MAIN_SIZES });
    }
  }
  if (showLightbox) {
    for (const i of neighbourIndexes(lightboxIndex)) {
      preloads.push({ key: `lightbox-${i}`, src: validImages[i], sizes: LIGHTBOX_SIZES });
    }
  }

  const mainLoaded = loadedMain.has(currentIndex);
  const lightboxLoaded = loadedLightbox.has(lightboxIndex);

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
              sizes={MAIN_SIZES}
              priority
              quality={IMAGE_QUALITY}
              onClick={() => openLightbox(currentIndex)}
              onLoad={() => markLoaded(setLoadedMain, currentIndex)}
              onError={() => markLoaded(setLoadedMain, currentIndex)}
            />
          )}

          {/* Loading spinner while the current image is still in flight */}
          {!mainLoaded && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-fade-in-delayed">
              <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg">
                <Loader2 className="w-6 h-6 text-neutral-500 animate-spin" />
              </div>
            </div>
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
                  goToImage((currentIndex - 1 + validImages.length) % validImages.length);
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
                  goToImage((currentIndex + 1) % validImages.length);
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
                    goToImage(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    index === currentIndex
                      ? "bg-white shadow-lg scale-125"
                      : "bg-white/60 hover:bg-white/80"
                  }`}
                  aria-label={`Bild ${index + 1} anzeigen`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Desktop Thumbnails - Lazy loaded */}
        {validImages.length > 1 && (
          <div className="hidden md:grid grid-cols-4 lg:grid-cols-6 gap-3">
            {validImages.slice(0, 12).map((image, index) => (
              <button
                key={index}
                onClick={() => goToImage(index)}
                className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
                  index === currentIndex
                    ? "border-red-500 shadow-lg shadow-red-500/20 scale-105"
                    : "border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <Image
                  src={getImageVariant(image, "thumbnail")}
                  alt={`${alt} - Bild ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="150px"
                  quality={60}
                  loading="lazy"
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

      {/* Lightbox Modal */}
      {showLightbox && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={closeLightbox}
        >
          <div className="relative w-full h-full max-w-6xl max-h-full p-4 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
              aria-label="Galerie schliessen"
            >
              <X size={32} />
            </button>

            {/* Previous Button */}
            {validImages.length > 1 && (
              <button
                onClick={prevLightboxImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
                aria-label="Vorheriges Bild"
              >
                <ChevronLeft size={48} />
              </button>
            )}

            {/* Image Container */}
            <div className="relative w-full h-full max-w-5xl max-h-[85vh] flex items-center justify-center">
              {/* Instant underlay: the main surface already fetched this exact
                  URL, so it paints from cache while the larger candidate
                  above it finishes loading. */}
              <Image
                src={validImages[lightboxIndex]}
                alt=""
                fill
                aria-hidden
                className="object-contain"
                sizes={MAIN_SIZES}
                quality={IMAGE_QUALITY}
              />
              <Image
                src={validImages[lightboxIndex]}
                alt={`${alt} - Bild ${lightboxIndex + 1}`}
                fill
                className={`object-contain transition-opacity duration-200 ${lightboxLoaded ? "opacity-100" : "opacity-0"}`}
                sizes={LIGHTBOX_SIZES}
                quality={IMAGE_QUALITY}
                onLoad={() => markLoaded(setLoadedLightbox, lightboxIndex)}
                onError={() => markLoaded(setLoadedLightbox, lightboxIndex)}
              />

              {/* Loading spinner while the full-size image is in flight */}
              {!lightboxLoaded && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-fade-in-delayed">
                  <div className="bg-black/60 backdrop-blur-sm rounded-full p-3">
                    <Loader2 className="w-7 h-7 text-white animate-spin" />
                  </div>
                </div>
              )}
            </div>

            {/* Next Button */}
            {validImages.length > 1 && (
              <button
                onClick={nextLightboxImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
                aria-label="Nächstes Bild"
              >
                <ChevronRight size={48} />
              </button>
            )}

            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-3 py-1 rounded">
              {lightboxIndex + 1} / {validImages.length}
            </div>
          </div>
        </div>
      )}

      {/* Invisible preload box (1px, offscreen for all intents) — see `preloads` above */}
      {preloads.length > 0 && (
        <div aria-hidden className="pointer-events-none fixed left-0 top-0 h-px w-px overflow-hidden opacity-0">
          {preloads.map((p) => (
            <Image key={p.key} src={p.src} alt="" fill sizes={p.sizes} quality={IMAGE_QUALITY} />
          ))}
        </div>
      )}
    </>
  );
}
