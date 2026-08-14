import { Mail, MapPin } from "lucide-react";
import Link from "next/link";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { reopenConsent } from "@/lib/analytics/gtag";
import Image from "next/image";
import { NewsletterSignup } from "./NewsletterSignup";

const footerSections = [
  {
    title: "Fahrzeuge",
    links: [
      { label: "Alle Fahrzeuge", href: "/suche" },
      { label: "Occasionen", href: "/suche?dealType=direct_purchase" },
      { label: "Leasing", href: "/suche?dealType=direct_purchase&financingType=leasing" },
      { label: "Leasingübernahme", href: "/suche?dealType=lease_takeover" }
    ]
  },
  {
    title: "Leasingübernahme",
    links: [
      { label: "Leasingübernahme – Ratgeber", href: "/leasinguebernahme" },
      { label: "Was kostet eine Übernahme?", href: "/leasinguebernahme-kosten" },
      { label: "Leasingvertrag übertragen", href: "/leasingvertrag-uebertragen" },
      { label: "Übernahme vs. neues Leasing", href: "/leasinguebernahme-vs-neues-leasing" },
      { label: "Übernahme vs. Auto-Abo", href: "/leasinguebernahme-vs-autoabo" },
      { label: "AutoScout24-Alternative", href: "/autoscout24-alternative-leasinguebernahme" },
      { label: "Leasing abgeben", href: "/leasing-abgeben-schweiz" }
    ]
  },
  {
    title: "Für Anbieter",
    links: [
      { label: "Inserat erstellen", href: "/inserat-erstellen" },
      { label: "Preise", href: "/preise" },
      // Public garage landing page — /garage-plan is noindex and auth-gated,
      // so the footer sends garages to the pitch first.
      { label: "Für Garagen", href: "/fuer-garagen" },
      { label: "Eintauschwert-Rechner", href: "/eintauschwert-rechner" }
    ]
  },
  {
    title: "Unternehmen",
    links: [
      { label: "Über BuyAuto", href: "/#ueber-buyauto" }
    ]
  },
  {
    title: "Rechtliches",
    links: [
      { label: "Datenschutz", href: "/datenschutz" },
      { label: "AGB", href: "/agb" },
      { label: "Impressum", href: "/datenschutz" }
    ]
  }
];

export function Footer() {
  const hasMounted = useHasMounted();

  return (
    <footer id="kontakt" className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white">
      {/* Newsletter Section */}
      <div className="border-b border-neutral-700/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl p-8 shadow-2xl">
            <NewsletterSignup />
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-8 lg:gap-6">
          {/* Brand column - spans 2 on lg */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-5 group hover:opacity-80 transition-opacity">
              <Image
                src="/buyauto-logo-header.png"
                alt="BuyAuto"
                width={96}
                height={64}
                className="h-14 sm:h-16 w-auto bg-transparent"
                sizes="96px"
                priority={false}
              />
            </Link>
            <p className="text-neutral-300 mb-3 leading-relaxed font-light text-base max-w-sm">
              BuyAuto ist ein Schweizer Marktplatz für Leasingübernahmen – für Privatpersonen und Garagen.
            </p>
            <p className="text-neutral-400 text-sm leading-relaxed max-w-sm mb-6">
              Leasing übernehmen oder ohne Verlust abgeben – daneben ausgewählte Fahrzeuge zum Direktkauf.
            </p>
            
            {/* Contact info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3 group">
                <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                  <Mail className="h-4 w-4 text-red-400" />
                </div>
                <span className="text-neutral-300 text-sm">hello@buyauto.ch</span>
              </div>
              <div className="flex items-center space-x-3 group">
                <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                  <MapPin className="h-4 w-4 text-red-400" />
                </div>
                <span className="text-neutral-300 text-sm">Zürich, Schweiz</span>
              </div>
            </div>
          </div>

          {/* Footer link columns */}
          {footerSections.map((section, index) => (
            <div key={index}>
              <h3 className="font-semibold text-white mb-4 text-sm tracking-wide uppercase">
                {section.title}
              </h3>
              <ul className="space-y-2.5">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link
                      href={link.href}
                      className="text-neutral-400 hover:text-white text-sm transition-colors duration-200 hover:text-red-400"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                {/* Without this the banner is a one-shot: once a choice is
                    stored it never shows again, so declining is irreversible
                    short of clearing site data. */}
                {section.title === "Rechtliches" && (
                  <li>
                    <button
                      type="button"
                      onClick={reopenConsent}
                      className="text-neutral-400 hover:text-white text-sm transition-colors duration-200 hover:text-red-400"
                    >
                      Cookie-Einstellungen
                    </button>
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-neutral-700/60 mt-12 pt-8">
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

            <p className="text-neutral-500 text-sm font-medium">
              Proudly Swiss 🇨🇭
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}