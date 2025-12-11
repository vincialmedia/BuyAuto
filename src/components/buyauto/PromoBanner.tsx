import { useState, useEffect } from "react";
import { X } from "lucide-react";

export function PromoBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if banner was previously dismissed
    const isDismissed = localStorage.getItem("promoBannerDismissed");
    if (!isDismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("promoBannerDismissed", "true");
  };

  if (!isVisible) return null;

  return (
    <div className="relative w-full bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-10 sm:h-11">
          {/* Left side - Pulsing dot */}
          <div className="flex items-center">
            <div className="relative">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <div className="absolute inset-0 w-2 h-2 bg-red-500 rounded-full animate-ping opacity-75"></div>
            </div>
          </div>

          {/* Center - Promo text */}
          <div className="flex-1 flex items-center justify-center px-4">
            <p className="text-xs sm:text-sm font-medium text-gray-800 text-center">
              🚀 Die ersten 100 Autos bekommen UNLIMITIERTE Premium Platzierung
            </p>
          </div>

          {/* Right side - Close button */}
          <button
            onClick={handleDismiss}
            className="flex items-center justify-center p-1 hover:bg-red-100 rounded-full transition-colors"
            aria-label="Banner schließen"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
}