"use client";

import { Button } from "@/components/ui/button";
import { Car, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Car className="h-8 w-8 text-red-600" />
            <span className="text-2xl font-bold text-slate-900">BuyAuto</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-slate-700 hover:text-red-600 font-medium transition-colors">
              Fahrzeuge suchen
            </a>
            <a href="#" className="text-slate-700 hover:text-red-600 font-medium transition-colors">
              So funktioniert's
            </a>
            <a href="#" className="text-slate-700 hover:text-red-600 font-medium transition-colors">
              Kontakt
            </a>
          </nav>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="outline" className="bg-transparent border-slate-300 text-slate-700 hover:bg-slate-50">
              Anmelden
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white">
              Inserat erstellen
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-slate-700" />
            ) : (
              <Menu className="h-6 w-6 text-slate-700" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200">
            <nav className="flex flex-col space-y-4">
              <a href="#" className="text-slate-700 hover:text-red-600 font-medium">
                Fahrzeuge suchen
              </a>
              <a href="#" className="text-slate-700 hover:text-red-600 font-medium">
                So funktioniert's
              </a>
              <a href="#" className="text-slate-700 hover:text-red-600 font-medium">
                Kontakt
              </a>
              <div className="flex flex-col space-y-2 pt-4">
                <Button variant="outline" className="bg-transparent border-slate-300 text-slate-700">
                  Anmelden
                </Button>
                <Button className="bg-red-600 hover:bg-red-700 text-white">
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