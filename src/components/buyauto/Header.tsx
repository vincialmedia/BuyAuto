"use client";

import Link from "next/link";
import { useState } from "react";
import { User, LogOut, Settings, BarChart3, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import authService from "@/services/authService";
import { toast } from "sonner";

export default function Header() {
  const { user, loading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      toast.success("Erfolgreich abgemeldet!");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Fehler beim Abmelden");
    }
  };

  const firstName = user?.user_metadata?.first_name;
  const displayName = firstName || user?.email?.split('@')[0] || 'Benutzer';

  // Determine the create listing link based on auth state
  const createListingHref = user ? "/inserat-erstellen" : "/auth?redirect=/inserat-erstellen";

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20 gap-2">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center relative z-50">
            <Link href="/" className="relative block">
              {/* 
                Container preserves space in flow (optional, can be smaller) 
                but we use absolute positioning for the image to allow overlap
                without affecting header height.
              */}
              <div className="w-[120px] md:w-[160px] h-0 flex items-center justify-center">
                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[120px] md:w-[160px] h-24 md:h-32">
                  <Image
                    src="/Untitled_design_6_.webp"
                    alt="BuyAuto Logo"
                    fill
                    className="object-contain object-left"
                    priority
                    sizes="(max-width: 768px) 120px, 160px"
                  />
                </div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/suche" 
              className="text-neutral-600 hover:text-red-500 font-medium transition-colors"
            >
              Fahrzeuge suchen
            </Link>
            <div className="relative">
              <Link 
                href={createListingHref}
                className="text-neutral-600 hover:text-red-500 font-medium transition-colors"
              >
                Inserat erstellen
              </Link>
              <span className="absolute -top-2 left-full ml-2 text-red-500 font-scribble text-lg font-bold rotate-[-8deg] whitespace-nowrap pointer-events-none">
                Ab CHF0.-
              </span>
            </div>
          </nav>

          {/* Mobile Action Icons - visible only on mobile */}
          <div className="flex md:hidden items-center space-x-2 flex-shrink-0">
            {/* Search Icon */}
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="p-2 hover:bg-neutral-100 transition-colors"
            >
              <Link href="/suche">
                <Search className="h-5 w-5 text-neutral-600" />
                <span className="sr-only">Fahrzeuge suchen</span>
              </Link>
            </Button>

            {/* Create Listing Icon */}
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="p-2 hover:bg-neutral-100 transition-colors relative"
            >
              <Link href={createListingHref}>
                <Plus className="h-5 w-5 text-neutral-600" />
                <span className="sr-only">Inserat erstellen</span>
                {/* Price Badge */}
                <span className="absolute -top-1 -right-1 text-[10px] font-bold text-red-500 bg-white rounded px-1 border border-red-200">
                  CHF0
                </span>
              </Link>
            </Button>
          </div>

          {/* Auth Section - Handle loading state properly */}
          <div className="hidden md:flex items-center space-x-4 flex-shrink-0">
            {loading ? (
              /* Show loading state instead of login buttons */
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-neutral-200 rounded-full animate-pulse"></div>
                <div className="hidden sm:block w-20 h-4 bg-neutral-200 rounded animate-pulse"></div>
              </div>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-2 hover:bg-neutral-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-neutral-500 to-neutral-600 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-neutral-700">
                      {displayName}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  {/* Admin link - only show for admin users */}
                  {user?.user_metadata?.role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Admin
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Abmelden
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  asChild
                  className="text-neutral-600 hover:text-red-500 hover:bg-transparent transition-colors"
                >
                  <Link href="/auth">Anmelden</Link>
                </Button>
                <Button
                  asChild
                  className="bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/25 hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300"
                >
                  <Link href="/auth">Registrieren</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2"
            >
              <div className="w-6 h-6 flex flex-col justify-center items-center">
                <span className={`bg-neutral-600 block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${isMenuOpen ? 'rotate-45 translate-y-1' : '-translate-y-0.5'}`}></span>
                <span className={`bg-neutral-600 block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm my-0.5 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
                <span className={`bg-neutral-600 block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${isMenuOpen ? '-rotate-45 -translate-y-1' : 'translate-y-0.5'}`}></span>
              </div>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div className={`md:hidden transition-all duration-300 ease-out ${isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
          <nav className="pb-4 pt-2 space-y-2 border-t border-neutral-200">
            {loading ? (
              /* Mobile loading state */
              <div className="px-4 py-2">
                <div className="w-20 h-4 bg-neutral-200 rounded animate-pulse"></div>
              </div>
            ) : user ? (
              <>
                <Link 
                  href="/dashboard" 
                  className="block px-4 py-2 text-neutral-600 hover:text-red-500 hover:bg-neutral-50 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                {/* Admin link in mobile menu - only show for admin users */}
                {user?.user_metadata?.role === 'admin' && (
                  <Link 
                    href="/admin" 
                    className="block px-4 py-2 text-neutral-600 hover:text-red-500 hover:bg-neutral-50 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                <button 
                  onClick={() => {
                    handleSignOut();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Abmelden
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/auth" 
                  className="block px-4 py-2 text-neutral-600 hover:text-red-500 hover:bg-neutral-50 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Anmelden
                </Link>
                <Link 
                  href="/auth" 
                  className="block px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Registrieren
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
