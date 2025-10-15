import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function MobileCta() {
  const [isVisible, setIsVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const viewportHeight = window.innerHeight;
      
      setIsVisible(scrollPosition > viewportHeight * 0.5);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const transitionClass = prefersReducedMotion ? "" : "transition-all duration-300";

  return (
    <div
      className={`md:hidden fixed bottom-4 right-4 z-50 ${transitionClass} ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12 pointer-events-none"
      }`}
      role="complementary"
      aria-label="Schnellzugriff Inserat erstellen"
    >
      <Button
        asChild
        size="lg"
        className={`bg-red-500 hover:bg-red-600 text-white h-14 w-14 rounded-full shadow-2xl shadow-red-500/40 hover:shadow-red-500/50 ${transitionClass} ${prefersReducedMotion ? "" : "hover:scale-110"}`}
        aria-label="Neues Inserat erstellen"
      >
        <Link href="/inserat-erstellen">
          <Plus className="h-6 w-6" aria-hidden="true" />
        </Link>
      </Button>
    </div>
  );
}
