import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already consented (client-side only)
    const hasConsented = localStorage.getItem("buyauto_cookie_consent");
    if (!hasConsented) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("buyauto_cookie_consent", "true");
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Message */}
          <div className="flex-1 text-sm text-gray-700">
            <p>
              Diese Website verwendet Cookies, um Ihnen das beste Nutzererlebnis zu bieten.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link href="/datenschutz">
              <Button variant="outline" size="sm" className="whitespace-nowrap">
                Datenschutz
              </Button>
            </Link>
            <Button 
              onClick={handleAccept}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
            >
              Einverstanden
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}