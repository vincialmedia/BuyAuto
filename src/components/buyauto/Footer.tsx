import { Car, Mail, Phone } from "lucide-react";

const footerSections = [
  {
    title: "Services",
    links: [
      { label: "Fahrzeuge suchen", href: "#" },
      { label: "Inserat erstellen", href: "#" },
      { label: "So funktioniert's", href: "#" },
      { label: "Finanzierung", href: "#" }
    ]
  },
  {
    title: "Unternehmen",
    links: [
      { label: "Über uns", href: "#" },
      { label: "Kontakt", href: "#" },
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
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Car className="h-8 w-8 text-red-600" />
              <span className="text-2xl font-bold">BuyAuto</span>
            </div>
            <p className="text-slate-300 mb-6 leading-relaxed">
              Die führende Plattform für Leasingübernahmen in der Schweiz. 
              Einfach, sicher und transparent.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-red-600" />
                <span className="text-slate-300">info@buyauto.ch</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-red-600" />
                <span className="text-slate-300">+41 44 123 45 67</span>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section, index) => (
            <div key={index}>
              <h3 className="font-semibold text-white mb-4">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a 
                      href={link.href}
                      className="text-slate-300 hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-700 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-400 text-sm">
              © {new Date().getFullYear()} BuyAuto. Alle Rechte vorbehalten.
            </p>
            <p className="text-slate-400 text-sm mt-2 md:mt-0">
              Proudly Swiss 🇨🇭
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}