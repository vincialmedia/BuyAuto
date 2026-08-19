import Link from "next/link";

import { PADKOS } from "@/lib/padkos/routes";

import styles from "./PadkosChrome.module.css";
import ui from "./Padkos.module.css";

const PAYMENT_METHODS = ["EPS", "Klarna", "PayPal", "Visa", "Mastercard", "Apple Pay"];

const COPY = {
  de: {
    blurb: "Südafrikanischer Padstal für Österreich. Direkt importiert, mit Liebe verpackt. Wien.",
    shipping: "Versand mit der Österreichischen Post · 1–3 Werktage · Gekühlter Versand Mo–Mi",
    nav: [
      { label: "Shop", href: PADKOS.shop },
      { label: "Versand & Retouren", href: PADKOS.versand },
      { label: "Heimweh-Paket", href: PADKOS.produkt("heimweh") },
      { label: "Kontakt", href: PADKOS.kontakt },
      { label: "Mein Konto", href: PADKOS.konto },
      { label: "Merkliste", href: PADKOS.merkliste },
      { label: "Impressum", href: PADKOS.impressum },
      { label: "AGB & Widerruf", href: PADKOS.agb },
      { label: "Datenschutz", href: PADKOS.datenschutz },
    ],
    dealer: "Händler-Login (Dashboard)",
    seo: "Padkos ist dein South African Shop Vienna: Biltong Österreich-weit bestellen, Boerewors kaufen mit gekühltem Versand – dazu Mrs Ball's Chutney, Ouma Rusks, Chappies und Rooibos. Direkt importiert und in 1–3 Werktagen mit der Österreichischen Post geliefert.",
    copyright: "© 2026 Padkos e.U. · Wien · Totsiens & baie dankie!",
    paymentsLabel: "Zahlungsarten",
    navLabel: "Footer",
  },
  en: {
    blurb: "A South African padstal for Austria. Imported directly, packed with love. Vienna.",
    shipping: "Shipped with Austrian Post · 1–3 working days · Chilled shipping Mon–Wed",
    nav: [
      { label: "Shop", href: PADKOS.shop },
      { label: "Shipping & returns", href: PADKOS.versand },
      { label: "Heimweh Box", href: PADKOS.produkt("heimweh") },
      { label: "Contact", href: PADKOS.kontakt },
      { label: "My account", href: PADKOS.konto },
      { label: "Wishlist", href: PADKOS.merkliste },
      { label: "Imprint", href: PADKOS.impressum },
      { label: "Terms & withdrawal", href: PADKOS.agb },
      { label: "Privacy", href: PADKOS.datenschutz },
    ],
    dealer: "Merchant login (dashboard)",
    seo: "Padkos is your South African shop in Vienna: order biltong across Austria, buy boerewors with chilled delivery – plus Mrs Ball's chutney, Ouma rusks, Chappies and rooibos. Imported directly and delivered in 1–3 working days with Austrian Post.",
    copyright: "© 2026 Padkos e.U. · Vienna · Thank you & see you soon!",
    paymentsLabel: "Payment methods",
    navLabel: "Footer",
  },
} as const;

export function PadkosFooter({ lang = "de" }: { lang?: "de" | "en" }) {
  const copy = COPY[lang];
  return (
    <>
      <div aria-hidden="true" className={ui.flagRule} />
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerGrid}>
            <div>
              <p className={styles.footerWordmark}>PADKOS</p>
              <p className={styles.footerBlurb}>{copy.blurb}</p>
              <div className={styles.payments} aria-label={copy.paymentsLabel}>
                {PAYMENT_METHODS.map((method) => (
                  <span key={method} className={styles.payment}>
                    {method}
                  </span>
                ))}
              </div>
              <p className={styles.footerShipping}>{copy.shipping}</p>
            </div>
            <nav aria-label={copy.navLabel} className={styles.footerNav}>
              {copy.nav.map((item) => (
                <Link key={item.label} href={item.href}>
                  {item.label}
                </Link>
              ))}
              <Link href={PADKOS.dashboard} className={styles.footerMuted}>
                {copy.dealer}
              </Link>
            </nav>
          </div>
          <p className={styles.footerSeo}>{copy.seo}</p>
          <p className={styles.footerCopyright}>{copy.copyright}</p>
        </div>
      </footer>
    </>
  );
}
