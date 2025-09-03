
import { Car, Mail, Phone, MapPin } from "lucide-react";
import Link from "next/link";

const footerSections = [
  {
    title: "Services",
    links: [
      { label: "Fahrzeuge suchen", href: "/suche" },
      { label: "Inserat erstellen", href: "/inserat-erstellen" },
      { label: "So funktioniert's", href: "#funktioniert" },
      { label: "Finanzierung", href: "#" }
    ]
  },
  {
    title: "Unternehmen",
    links: [
      { label: "Über uns", href: "#" },
      { label: "Kontakt", href: "#kontakt" },
      { label: "Presse", href: "#" },
      { label: "Karriere", href: "#" }
    ]
  },
  {
    title: "Rechtliches",
    links: [
      { label: "Datenschutz", href: "#" },
      { label: "AGB", href: "#" },
      { label: "Impressum", href: "#" }
    ]
  }
];

export default function Footer() {
  return (
    <footer id="kontakt" className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Swiss company info */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-6 group">
              <Car className="h-8 w-8 text-red-500 group-hover:text-red-400 transition-colors" />
              <span className="text-2xl font-light text-white tracking-tight">
                <span className="font-semibold">Buy</span>Auto
              </span>
            </Link>
            <p className="text-neutral-300 mb-8 leading-relaxed font-light text-lg max-w-md">
              Die führende Plattform für Leasingübernahmen in der Schweiz. 
              Einfach, sicher und transparent.
            </p>
            
            {/* Swiss contact info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4 group">
                <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                  <Mail className="h-5 w-5 text-red-400" />
                </div>
                <span className="text-neutral-300 font-medium">info@buyauto.ch</span>
              </div>
              <div className="flex items-center space-x-4 group">
                <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                  <Phone className="h-5 w-5 text-red-400" />
                </div>
                <span className="text-neutral-300 font-medium">+41 44 123 45 67</span>
              </div>
              <div className="flex items-center space-x-4 group">
                <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                  <MapPin className="h-5 w-5 text-red-400" />
                </div>
                <span className="text-neutral-300 font-medium">Zürich, Schweiz</span>
              </div>
            </div>
          </div>

          {/* Swiss clean footer links */}
          {footerSections.map((section, index) => (
            <div key={index}>
              <h3 className="font-semibold text-white mb-6 text-lg tracking-wide">
                {section.title}
              </h3>
              <ul className="space-y-4">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link 
                      href={link.href}
                      className="text-neutral-300 hover:text-white transition-colors font-light hover:text-red-400 duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Swiss minimal bottom bar */}
        <div className="border-t border-neutral-700/60 mt-16 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-neutral-400 text-sm font-light">
              © {new Date().getFullYear()} BuyAuto. Alle Rechte vorbehalten.
            </p>
            <p className="text-neutral-400 text-sm mt-2 md:mt-0 font-medium">
              Proudly Swiss 🇨🇭
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}