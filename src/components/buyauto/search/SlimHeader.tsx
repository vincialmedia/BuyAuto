import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function SlimHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-neutral-200/40 shadow-sm">
      <div className="max-w-[2000px] mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo - Minimal and clean */}
          <Link href="/" className="flex items-center">
            <Image
              src="/buyauto-logo-full.png"
              alt="BuyAuto Logo"
              width={140}
              height={38}
              className="h-8 w-auto"
              priority
              sizes="140px"
            />
          </Link>

          {/* Desktop Navigation - Ultra minimal */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/suche" className="text-xs text-neutral-600 hover:text-red-500 font-medium transition-colors duration-200 uppercase tracking-wide">
              Fahrzeuge suchen
            </Link>
            <a href="#funktioniert" className="text-xs text-neutral-600 hover:text-red-500 font-medium transition-colors duration-200 uppercase tracking-wide">
              So funktioniert's
            </a>
            <a href="#kontakt" className="text-xs text-neutral-600 hover:text-red-500 font-medium transition-colors duration-200 uppercase tracking-wide">
              Kontakt
            </a>
          </nav>

          {/* Desktop Action Buttons - Minimal */}
          <div className="hidden md:flex items-center space-x-2">
            <Button 
              variant="outline" 
              className="bg-transparent hover:bg-transparent border-neutral-300/60 text-neutral-700 hover:border-red-500 hover:text-red-500 text-xs font-medium h-7 px-3"
              asChild
            >
              <Link href="/auth">Anmelden</Link>
            </Button>
            <Button className="bg-red-500 hover:bg-red-600 text-white text-xs font-medium h-7 px-3 shadow-sm" asChild>
              <Link href="/inserat-erstellen">Inserat erstellen</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-1"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-4 w-4 text-neutral-700" />
            ) : (
              <Menu className="h-4 w-4 text-neutral-700" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-neutral-200/40">
            <nav className="flex flex-col space-y-2">
              <Link href="/suche" className="text-neutral-700 hover:text-red-500 font-medium text-xs py-1 uppercase tracking-wide">
                Fahrzeuge suchen
              </Link>
              <a href="#funktioniert" className="text-neutral-700 hover:text-red-500 font-medium text-xs py-1 uppercase tracking-wide">
                So funktioniert's
              </a>
              <a href="#kontakt" className="text-neutral-700 hover:text-red-500 font-medium text-xs py-1 uppercase tracking-wide">
                Kontakt
              </a>
              <div className="flex space-x-2 pt-2 border-t border-neutral-200/40">
                <Button 
                  variant="outline" 
                  className="bg-transparent border-neutral-300 text-neutral-700 text-xs h-7 flex-1"
                  asChild
                >
                  <Link href="/auth">Anmelden</Link>
                </Button>
                <Button className="bg-red-500 hover:bg-red-600 text-white text-xs h-7 flex-1" asChild>
                  <Link href="/inserat-erstellen">Inserat erstellen</Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}