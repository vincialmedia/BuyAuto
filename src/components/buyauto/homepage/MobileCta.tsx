import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function MobileCta() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const viewportHeight = window.innerHeight;
      
      setIsVisible(scrollPosition > viewportHeight * 0.5);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`md:hidden fixed bottom-4 right-4 z-50 transition-all duration-300 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12 pointer-events-none"
      }`}
    >
      <Button
        asChild
        size="lg"
        className="bg-red-500 hover:bg-red-600 text-white h-14 w-14 rounded-full shadow-2xl shadow-red-500/40 hover:shadow-red-500/50 transition-all duration-200 hover:scale-110"
        aria-label="Inserat erstellen"
      >
        <Link href="/inserat-erstellen">
          <Plus className="h-6 w-6" aria-hidden="true" />
        </Link>
      </Button>
    </div>
  );
}