import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  CONSENT_REOPEN_EVENT,
  CONSENT_STORAGE_KEY,
  adoptConsentFromOtherTab,
  readStoredConsent,
  setConsent,
} from "@/lib/analytics/gtag";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Client-side only: localStorage is unavailable during SSR, and reading it
    // in render would desync hydration.
    if (readStoredConsent() === null) {
      setIsVisible(true);
    }
  }, []);

  useEffect(() => {
    const handleReopen = () => setIsVisible(true);
    window.addEventListener(CONSENT_REOPEN_EVENT, handleReopen);

    // `storage` fires only in the *other* tabs, which is exactly the case that
    // needs handling: without this, declining in one tab leaves a second tab's
    // banner open, and accepting there would overwrite the decline. Close the
    // banner and catch this tab's tag up on whatever was decided.
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== CONSENT_STORAGE_KEY) return;
      const choice = readStoredConsent();
      if (choice === null) return;
      adoptConsentFromOtherTab(choice);
      setIsVisible(false);
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(CONSENT_REOPEN_EVENT, handleReopen);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  // Both paths record an explicit decision. Until one of them runs, Consent
  // Mode stays at the "denied" defaults set in _document, so Google Analytics
  // sends cookieless pings only.
  const handleAccept = () => {
    setConsent("granted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    setConsent("denied");
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
              Diese Website verwendet Cookies und Google Analytics, um Ihnen das beste
              Nutzererlebnis zu bieten. Details finden Sie in unserer{" "}
              <Link href="/datenschutz" className="text-red-600 underline hover:no-underline">
                Datenschutzerklärung
              </Link>
              .
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Button
              onClick={handleDecline}
              variant="outline"
              size="sm"
              className="whitespace-nowrap border-gray-800 text-gray-800 hover:bg-gray-100"
            >
              Ablehnen
            </Button>
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
