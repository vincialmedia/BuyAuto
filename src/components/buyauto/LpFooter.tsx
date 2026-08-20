import { Mail, MapPin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { reopenConsent } from "@/lib/analytics/gtag";

/**
 * Minimal footer for paid landing pages (see MainLayout's FUNNEL_ROUTES):
 * brand, contact and the legally required links — none of the sitewide
 * newsletter block or the four link columns, which would leak ad traffic out
 * of the funnel. The full Footer stays on every other page.
 */
export function LpFooter() {
  const hasMounted = useHasMounted();

  return (
    <footer className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          <div>
            <Link href="/" className="inline-flex items-center mb-4 hover:opacity-80 transition-opacity">
              <Image
                src="/buyauto-logo-header.png"
                alt="BuyAuto"
                width={96}
                height={64}
                className="h-14 w-auto bg-transparent"
                sizes="96px"
              />
            </Link>
            <p className="text-neutral-300 leading-relaxed font-light text-base max-w-sm">
              BuyAuto ist ein Schweizer Marktplatz für Leasingübernahmen – für Privatpersonen und Garagen.
            </p>
          </div>

          <div className="space-y-3 md:text-right">
            <div className="flex items-center md:justify-end space-x-3">
              <Mail className="h-4 w-4 text-red-400 shrink-0" />
              <span className="text-neutral-300 text-sm">hello@buyauto.ch</span>
            </div>
            <div className="flex items-center md:justify-end space-x-3">
              <MapPin className="h-4 w-4 text-red-400 shrink-0" />
              <span className="text-neutral-300 text-sm">Zürich, Schweiz</span>
            </div>
          </div>
        </div>

        {/* Legal line — the LP's only exits besides the logo */}
        <div className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-400">
          <Link href="/datenschutz" className="hover:text-white transition-colors">
            Datenschutz
          </Link>
          <span aria-hidden>·</span>
          <Link href="/agb" className="hover:text-white transition-colors">
            AGB
          </Link>
          <span aria-hidden>·</span>
          <Link href="/impressum" className="hover:text-white transition-colors">
            Impressum
          </Link>
          <span aria-hidden>·</span>
          {/* Same reopen hook as the sitewide footer: without it a stored
              consent choice could never be revisited on the LP. */}
          <button type="button" onClick={reopenConsent} className="hover:text-white transition-colors">
            Cookie-Einstellungen
          </button>
        </div>

        <div className="border-t border-neutral-700/60 mt-6 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
            <p className="text-neutral-500 text-sm">
              © {hasMounted ? new Date().getFullYear() : 2025} BuyAuto. Alle Rechte vorbehalten.
            </p>
            <a
              href="https://www.vincialmedia.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-500 text-sm hover:text-white transition-colors"
            >
              A VincialMedia Website
            </a>
            <p className="text-neutral-500 text-sm font-medium">Proudly Swiss 🇨🇭</p>
          </div>
        </div>
      </div>

      {/* Clearance for the LP's fixed mobile CTA bar — without it the bar
          covers the © line at the very bottom of the page. */}
      <div className="h-16 md:hidden" aria-hidden />
    </footer>
  );
}
