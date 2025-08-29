
import { Button } from "@/components/ui/button";
import { Car, Menu, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-neutral-200/60 shadow-sm">
      <div className="max-w-[2000px] mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo - Smaller and more refined */}
          <div className="flex items-center space-x-2">
            <Car className="h-6 w-6 text-red-500" />
            <span className="text-lg font-semibold text-neutral-900 tracking-tight">BuyAuto</span>
          </div>

          {/* Desktop Navigation - Lighter typography */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/suche" className="text-sm text-neutral-600 hover:text-red-500 font-medium transition-colors duration-200">
              Fahrzeuge suchen
            </Link>
            <a href="#funktioniert" className="text-sm text-neutral-600 hover:text-red-500 font-medium transition-colors duration-200">
              So funktioniert's
            </a>
            <a href="#kontakt" className="text-sm text-neutral-600 hover:text-red-500 font-medium transition-colors duration-200">
              Kontakt
            </a>
          </nav>

          {/* Desktop Action Buttons - More refined */}
          <div className="hidden md:flex items-center space-x-3">
            <Button 
              variant="outline" 
              className="bg-transparent hover:bg-transparent border-neutral-300 text-neutral-700 hover:border-red-500 hover:text-red-500 text-sm font-medium h-8 px-4"
            >
              Anmelden
            </Button>
            <Button className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium h-8 px-4 shadow-sm">
              Inserat erstellen
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 -mr-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 text-neutral-700" />
            ) : (
              <Menu className="h-5 w-5 text-neutral-700" />
            )}
          </button>
        </div>

        {/* Mobile Menu - Cleaner design */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-neutral-200/60">
            <nav className="flex flex-col space-y-3">
              <Link href="/suche" className="text-neutral-700 hover:text-red-500 font-medium text-sm py-1">
                Fahrzeuge suchen
              </Link>
              <a href="#funktioniert" className="text-neutral-700 hover:text-red-500 font-medium text-sm py-1">
                So funktioniert's
              </a>
              <a href="#kontakt" className="text-neutral-700 hover:text-red-500 font-medium text-sm py-1">
                Kontakt
              </a>
              <div className="flex flex-col space-y-2 pt-3 border-t border-neutral-200/60">
                <Button 
                  variant="outline" 
                  className="bg-transparent border-neutral-300 text-neutral-700 text-sm h-9"
                >
                  Anmelden
                </Button>
                <Button className="bg-red-500 hover:bg-red-600 text-white text-sm h-9">
                  Inserat erstellen
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}