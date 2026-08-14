"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { User, LogOut, Settings, BarChart3, Plus, ChevronDown, Car, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  HeaderDropdown,
  HeaderDropdownSeparator,
  headerDropdownItemClass,
} from "@/components/buyauto/HeaderDropdown";
import { useAuth } from "@/contexts/AuthContext";

export default function Header() {
  const router = useRouter();
  const { user, loading, messageCount, isAdmin } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Clear loading state when navigation completes or errors
  useEffect(() => {
    const handleStopNavigation = () => {
      setIsNavigating(false);
    };

    router.events.on('routeChangeComplete', handleStopNavigation);
    router.events.on('routeChangeError', handleStopNavigation);

    return () => {
      router.events.off('routeChangeComplete', handleStopNavigation);
      router.events.off('routeChangeError', handleStopNavigation);
    };
  }, [router]);

  // authService drags the Supabase client with it and sonner is its own
  // bundle — both load on demand here so signing out (a rare action) doesn't
  // put either into the critical JS every visitor downloads.
  const handleSignOut = async () => {
    try {
      const [{ default: authService }, { toast }] = await Promise.all([
        import("@/services/authService"),
        import("sonner"),
      ]);
      try {
        await authService.signOut();
        toast.success("Erfolgreich abgemeldet!");
      } catch (error) {
        console.error("Sign out error:", error);
        toast.error("Fehler beim Abmelden");
      }
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const firstName = user?.user_metadata?.first_name;
  const displayName = firstName || user?.email?.split('@')[0] || 'Benutzer';
  const safeMessageCount = Math.max(0, messageCount);

  // Deferred login: guests go straight into the wizard and sign in at the
  // final publish step — never route them to /auth first.
  const createListingHref = "/inserat-erstellen";

  const handleCreateListingClick = async (e: React.MouseEvent) => {
    // If just opening in new tab (cmd/ctrl click), let default behavior happen
    if (e.metaKey || e.ctrlKey) return;

    e.preventDefault();
    if (isNavigating) return;
    
    // Only start loading if we are actually navigating to a new page
    if (router.asPath !== createListingHref) {
      setIsNavigating(true);
      try {
        await router.push(createListingHref);
      } catch (error) {
        console.error("Navigation error:", error);
        setIsNavigating(false);
      }
    }
  };

  // No preventDefault/manual push here: the Link performs the client-side
  // navigation itself, and a default-prevented click also stops Radix from
  // closing the dropdown on select — the menu would survive the navigation
  // and keep the new page scroll-locked and unclickable until dismissed.
  const handleDashboardClick = (e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey) return; // opening in a new tab — no overlay
    setIsMenuOpen(false); // Close mobile menu if open
    if (router.asPath !== "/dashboard") {
      setIsNavigating(true);
    }
  };

  return (
    <>
      {/* Navigation feedback lives in the global RouteProgress bar now —
          isNavigating stays only as a double-click guard. A second overlay
          here would stack a full-screen spinner on top of it. */}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20 gap-2">
            {/* Logo - Large and prominent, allowed to overflow */}
            <div className="flex-shrink-0 flex items-center relative z-50 -my-6">
              <Link href="/" className="relative block">
                <Image
                  src="/buyauto-logo-header.png"
                  alt="BuyAuto"
                  width={180}
                  height={120}
                  loading="eager"
                  className="h-[96px] sm:h-[120px] md:h-[144px] w-auto bg-transparent"
                  sizes="(max-width: 639px) 144px, (max-width: 768px) 180px, 216px"
                />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center justify-evenly flex-1 max-w-2xl mx-auto">
              {/* Inserat erstellen - with CHF0 badge */}
              <div className="relative">
                <Link 
                  href={createListingHref}
                  onClick={handleCreateListingClick}
                  className="text-neutral-600 hover:text-red-500 font-medium transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Inserat erstellen
                </Link>
                <span className="absolute -top-2 left-full ml-1 text-red-600 font-scribble text-sm font-bold rotate-[-8deg] whitespace-nowrap pointer-events-none">
                  CHF0
                </span>
              </div>
              
              {/* Fahrzeuge Suchen - Dropdown. The links are always in the
                  server HTML now (panel is CSS-toggled), so crawlers see them
                  on every page — Radix only rendered them while open. */}
              <HeaderDropdown
                align="center"
                triggerClassName="text-neutral-600 hover:text-red-500 font-medium transition-colors flex items-center gap-1"
                trigger={
                  <>
                    <Car className="w-4 h-4" />
                    Fahrzeuge Suchen
                    <ChevronDown className="w-4 h-4" />
                  </>
                }
              >
                <Link href="/suche?dealType=lease_takeover" className={headerDropdownItemClass}>
                  Leasingübernahmen
                </Link>
                <Link href="/suche?dealType=direct_purchase" className={headerDropdownItemClass}>
                  Occasion & Neuwagen
                </Link>
                <Link href="/suche?dealType=direct_purchase&financingType=leasing" className={headerDropdownItemClass}>
                  Leasing Suchen
                </Link>
                <HeaderDropdownSeparator />
                <Link href="/suche" className={`${headerDropdownItemClass} font-medium`}>
                  Alle Fahrzeuge
                </Link>
                <HeaderDropdownSeparator />
                <Link href="/leasinguebernahme" className={headerDropdownItemClass}>
                  Leasingübernahme – Ratgeber
                </Link>
              </HeaderDropdown>
              
              {/* Preise */}
              <Link
                href="/preise"
                className="text-neutral-600 hover:text-red-500 font-medium transition-colors flex items-center gap-1.5"
              >
                <Coins className="w-4 h-4" />
                Preise
              </Link>

              {/* Für Garagen — supply-side entry point, visually secondary
                  (muted, smaller) to the consumer items. */}
              <Link
                href="/fuer-garagen"
                className="text-neutral-500 hover:text-red-500 text-sm font-medium transition-colors"
              >
                Für Garagen
              </Link>
            </nav>

            {/* Mobile Action CTA - visible only on mobile */}
            <div className="flex md:hidden items-center flex-shrink-0 gap-3">
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white shadow-sm relative px-2 sm:px-3 py-2 text-xs font-medium"
                onClick={handleCreateListingClick}
              >
                <Plus className="h-4 w-4 mr-1 md:mr-1.5" />
                <span className="hidden xs:inline">Inserat erstellen</span>
                <span className="xs:hidden">Inserieren</span>
                <span className="ml-1 text-[10px] font-bold bg-white text-red-600 rounded px-1.5 py-0.5">
                  CHF0
                </span>
              </Button>
            </div>

            {/* Auth Section - Handle loading state properly */}
            <div className="hidden md:flex items-center space-x-4 ml-8 flex-shrink-0">
              {loading ? (
                /* Show loading state instead of login buttons */
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-neutral-200 rounded-full animate-pulse"></div>
                  <div className="hidden sm:block w-20 h-4 bg-neutral-200 rounded animate-pulse"></div>
                </div>
              ) : user ? (
                <HeaderDropdown
                  align="end"
                  triggerClassName="inline-flex items-center space-x-2 rounded-md px-4 py-2 text-sm font-medium hover:bg-neutral-100 transition-colors"
                  trigger={
                    <>
                      <span className="relative inline-flex items-center">
                        <span className="w-8 h-8 bg-gradient-to-br from-neutral-500 to-neutral-600 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-white" />
                        </span>
                        {safeMessageCount > 0 ? (
                          <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold leading-[18px] text-center">
                            {safeMessageCount >= 10 ? "9+" : String(safeMessageCount)}
                          </span>
                        ) : null}
                      </span>
                      <span className="hidden sm:block text-sm font-medium text-neutral-700">
                        {displayName}
                      </span>
                    </>
                  }
                >
                  <Link href="/dashboard" className={headerDropdownItemClass} onClick={handleDashboardClick}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                  {/* Admin link - only show for admin users */}
                  {isAdmin && (
                    <Link href="/admin" className={headerDropdownItemClass}>
                      <Settings className="mr-2 h-4 w-4" />
                      Admin
                    </Link>
                  )}
                  <HeaderDropdownSeparator />
                  <button
                    type="button"
                    className={`${headerDropdownItemClass} text-red-600 hover:text-red-600 hover:bg-red-50`}
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Abmelden
                  </button>
                </HeaderDropdown>
              ) : (
                <Button
                  asChild
                  className="bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/25 hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300"
                >
                  <Link href="/auth">Anmelden</Link>
                </Button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2"
                aria-label={isMenuOpen ? "Menü schliessen" : "Menü öffnen"}
                aria-expanded={isMenuOpen}
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
          {/* 640px cap: the signed-in menu (search links + Für Garagen + account
              block) measures ~550px, ~600px for admins — 500px clipped the
              Abmelden button, the only sign-out control on mobile. */}
          <div className={`md:hidden transition-all duration-300 ease-out ${isMenuOpen ? 'max-h-[640px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
            <nav className="pb-4 pt-2 space-y-2 border-t border-neutral-200">
              {/* Fahrzeuge Suchen Section */}
              <div className="px-4 py-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Fahrzeuge Suchen
              </div>
              <Link 
                href="/suche?dealType=lease_takeover" 
                className="block px-4 py-2 text-neutral-600 hover:text-red-500 hover:bg-neutral-50 rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Leasingübernahmen
              </Link>
              <Link 
                href="/suche?dealType=direct_purchase" 
                className="block px-4 py-2 text-neutral-600 hover:text-red-500 hover:bg-neutral-50 rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Occasion & Neuwagen
              </Link>
              <Link 
                href="/suche?dealType=direct_purchase&financingType=leasing" 
                className="block px-4 py-2 text-neutral-600 hover:text-red-500 hover:bg-neutral-50 rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Leasing Suchen
              </Link>
              <Link
                href="/suche"
                className="block px-4 py-2 text-neutral-600 hover:text-red-500 hover:bg-neutral-50 rounded-lg transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Alle Fahrzeuge
              </Link>
              <Link
                href="/leasinguebernahme"
                className="block px-4 py-2 text-neutral-600 hover:text-red-500 hover:bg-neutral-50 rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Leasingübernahme – Ratgeber
              </Link>

              <div className="border-t border-neutral-100 my-2"></div>
              
              {/* Preise */}
              <Link
                href="/preise"
                className="block px-4 py-2 text-neutral-600 hover:text-red-500 hover:bg-neutral-50 rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Preise
              </Link>

              {/* Für Garagen — muted like its desktop counterpart, but always
                  present in the mobile menu. */}
              <Link
                href="/fuer-garagen"
                className="block px-4 py-2 text-neutral-500 hover:text-red-500 hover:bg-neutral-50 rounded-lg transition-colors text-sm"
                onClick={() => setIsMenuOpen(false)}
              >
                Für Garagen
              </Link>

              <div className="border-t border-neutral-100 my-2"></div>

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
                    onClick={handleDashboardClick}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard/messages"
                    className="block px-4 py-2 text-neutral-600 hover:text-red-500 hover:bg-neutral-50 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Nachrichten
                  </Link>
                  {/* Admin link in mobile menu - only show for admin users */}
                  {isAdmin && (
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
                <Link 
                  href="/auth" 
                  className="block px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Anmelden
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>
    </>
  );
}