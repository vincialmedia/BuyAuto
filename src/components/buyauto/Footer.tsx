import { Mail, MapPin } from "lucide-react";
import Link from "next/link";
import { useHasMounted } from "@/hooks/use-has-mounted";
import dynamic from "next/dynamic";
import Image from "next/image";

const NewsletterSignup = dynamic(() => import("./NewsletterSignup").then(mod => mod.NewsletterSignup), {
  loading: () => <div className="h-48 bg-neutral-100/50 rounded-lg animate-pulse" />,
  ssr: false
});

const footerSections = [
  {
    title: "Fahrzeuge",
    links: [
      { label: "Alle Fahrzeuge", href: "/suche" },
      { label: "Occasionen", href: "/suche?deal_type=direct_purchase" },
      { label: "Leasing", href: "/suche?deal_type=leasing" },
      { label: "Auto-Abo", href: "/suche?deal_type=auto_abo" },
      { label: "Leasingübernahme", href: "/suche?deal_type=lease_takeover" }
    ]
  },
  {
    title: "Für Anbieter",
    links: [
      { label: "Inserat erstellen", href: "/inserat-erstellen" },
      { label: "Preise", href: "/preise" },
      { label: "Für Garagen", href: "/garage-plan" }
    ]
  },
  {
    title: "Unternehmen",
    links: [
      { label: "Über BuyAuto", href: "/#kontakt" },
      { label: "Kontakt", href: "/#kontakt" }
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-6">
          {/* Brand column - spans 2 on lg */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-5 group hover:opacity-80 transition-opacity">
              <Image
                src="/buyauto-logo-full.png"
                alt="BuyAuto"
                width={160}
                height={44}
                className="h-9 w-auto bg-transparent"
                priority={false}
              />
            </Link>
            <p className="text-neutral-300 mb-3 leading-relaxed font-light text-base max-w-sm">
              Die Schweizer Plattform für den einfacheren Weg zum nächsten Auto.
            </p>
            <p className="text-neutral-400 text-sm leading-relaxed max-w-sm mb-6">
              Occasionen, Neuwagen, Leasing, Auto-Abo und Leasingübernahmen – alles auf BuyAuto.
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