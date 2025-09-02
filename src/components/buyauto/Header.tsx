
"use client";

import { Button } from "@/components/ui/button";
import { Car, Menu, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/98 backdrop-blur-md border-b border-neutral-200/40 shadow-sm h-14 max-h-14">
      <div className="max-w-[2000px] mx-auto px-4 md:px-6 lg:px-8 h-full">
        <div className="flex justify-between items-center h-full">
          {/* Logo - Swiss minimalist */}
          <Link href="/" className="flex items-center space-x-2 group">
            <Car className="h-5 w-5 text-red-500 group-hover:text-red-600 transition-colors" />
            <span className="text-lg font-light text-neutral-900 tracking-tight">
              <span className="font-semibold">Buy</span>Auto
            </span>
          </Link>

          {/* Desktop Navigation - Ultra light */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/suche" 
              className="text-sm text-neutral-600 hover:text-red-500 font-normal transition-colors duration-200 tracking-wide"
            >
              Fahrzeuge suchen
            </Link>
            <a 
              href="#funktioniert" 
              className="text-sm text-neutral-600 hover:text-red-500 font-normal transition-colors duration-200 tracking-wide"
            >
              So funktioniert's
            </a>
            <a 
              href="#kontakt" 
              className="text-sm text-neutral-600 hover:text-red-500 font-normal transition-colors duration-200 tracking-wide"
            >
              Kontakt
            </a>
          </nav>

          {/* Desktop Action Buttons - Swiss refined */}
          <div className="hidden md:flex items-center space-x-3">
            <Button 
              variant="ghost" 
              className="text-neutral-700 hover:text-red-500 hover:bg-transparent text-sm font-normal h-8 px-3 tracking-wide"
            >
              Anmelden
            </Button>
            <Link href="/inserat-erstellen">
              <Button 
                className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium h-8 px-4 rounded-lg shadow-none hover:shadow-sm transition-all duration-200"
              >
                Inserat erstellen
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button - Minimal */}
          <button
            className="md:hidden p-1 -mr-1 rounded-md hover:bg-neutral-100/60 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 text-neutral-600" />
            ) : (
              <Menu className="h-5 w-5 text-neutral-600" />
            )}
          </button>
        </div>

        {/* Mobile Menu - Swiss clean */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white/98 backdrop-blur-md border-b border-neutral-200/40 shadow-lg">
            <nav className="px-4 py-4 space-y-4">
              <Link 
                href="/suche" 
                className="block text-neutral-700 hover:text-red-500 font-normal text-sm py-1 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Fahrzeuge suchen
              </Link>
              <a 
                href="#funktioniert" 
                className="block text-neutral-700 hover:text-red-500 font-normal text-sm py-1 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                So funktioniert's
              </a>
              <a 
                href="#kontakt" 
                className="block text-neutral-700 hover:text-red-500 font-normal text-sm py-1 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Kontakt
              </a>
              
              <div className="flex flex-col space-y-2 pt-3 border-t border-neutral-200/40">
                <Button 
                  variant="ghost" 
                  className="justify-start text-neutral-700 hover:text-red-500 hover:bg-transparent font-normal text-sm h-9"
                >
                  Anmelden
                </Button>
                <Link href="/inserat-erstellen" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="justify-start bg-red-500 hover:bg-red-600 text-white font-medium text-sm h-9 w-full">
                    Inserat erstellen
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}