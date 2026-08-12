import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";

import { CATEGORIES } from "@/lib/padkos/catalog";
import { LANDING_COPY } from "@/lib/padkos/landing-content";
import { PADKOS } from "@/lib/padkos/routes";
import { useCartCount } from "@/lib/padkos/store";

import styles from "./PadkosChrome.module.css";
import ui from "./Padkos.module.css";

type HeaderVariant = "shop" | "landing";
type HeaderLang = "de" | "en";

interface PadkosHeaderProps {
  /**
   * "shop" (default): the shared header — Shop/Heimweh-Paket/Versand/Kontakt
   * nav plus wishlist/account/cart icons. "landing": the landing pages'
   * section-anchor nav (Bestseller, Die Regale, …).
   */
  variant?: HeaderVariant;
  lang?: HeaderLang;
}

const HeartIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#382A1C" strokeWidth="1.8" aria-hidden="true">
    <path d="M12 20s-7-4.6-9.3-8.7C.9 8 2.6 4.5 6 4.5c2.2 0 3.6 1.2 6 3.6 2.4-2.4 3.8-3.6 6-3.6 3.4 0 5.1 3.5 3.3 6.8C19 15.4 12 20 12 20Z" />
  </svg>
);

const PersonIcon = () => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#382A1C" strokeWidth="1.8" aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c1.4-3.4 4.4-5 8-5s6.6 1.6 8 5" />
  </svg>
);

const CartIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#382A1C" strokeWidth="1.8" aria-hidden="true">
    <path d="M5 8h14l-1.2 12H6.2L5 8Z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </svg>
);

const COPY = {
  de: {
    tagline: "PADSTAL & SPEISEKAMMER · WIEN",
    announcement:
      "Versand in ganz Österreich · Gekühlter Versand für Boerewors · Ab €59 versandkostenfrei",
    cta: "Jetzt einkaufen",
    cartLabel: "Warenkorb öffnen",
    wishlistLabel: "Merkliste",
    accountLabel: "Mein Konto",
    menuOpen: "Menü öffnen",
    menuClose: "Menü schließen",
    langSwitch: "EN",
    langSwitchLabel: "Switch to English",
    langHref: PADKOS.en,
    shopNav: [
      { label: "Shop", href: PADKOS.shop },
      { label: "Heimweh-Paket", href: PADKOS.produkt("heimweh") },
      { label: "Versand", href: PADKOS.versand },
      { label: "Kontakt", href: PADKOS.kontakt },
    ],
    landingNav: [
      { label: "Bestseller", href: "#bestseller" },
      { label: "Die Regale", href: "#kategorien" },
      { label: "Heimweh-Paket", href: "#heimweh" },
      { label: "Unsere Geschichte", href: "#story" },
      { label: "FAQ", href: "#faq" },
    ],
    menuPrimaryShop: [
      { label: "Shop", href: PADKOS.shop },
      { label: "Heimweh-Paket", href: PADKOS.produkt("heimweh") },
      { label: "Warenkorb", href: PADKOS.kasse },
      { label: "Merkliste", href: PADKOS.merkliste },
    ],
    menuSecondaryShop: [
      { label: "Mein Konto", href: PADKOS.konto },
      { label: "Versand & Retouren", href: PADKOS.versand },
      { label: "Kontakt", href: PADKOS.kontakt },
      { label: "Startseite", href: PADKOS.home },
    ],
    menuSecondaryLanding: [
      { label: "Heimweh-Paket", href: "#heimweh" },
      { label: "Unsere Geschichte", href: "#story" },
      { label: "Fragen & Antworten", href: "#faq" },
    ],
    menuEn: "English version →",
    menuFoot: "Versand in ganz Österreich · Ab € 59 gratis · Abholung in Wien",
  },
  en: {
    tagline: "PADSTAL & PANTRY · VIENNA",
    announcement:
      "Shipping across Austria · Chilled delivery for boerewors · Free shipping from €59",
    cta: "Shop now",
    cartLabel: "Open cart",
    wishlistLabel: "Wishlist",
    accountLabel: "My account",
    menuOpen: "Open menu",
    menuClose: "Close menu",
    langSwitch: "DE",
    langSwitchLabel: "Zur deutschen Version wechseln",
    langHref: PADKOS.home,
    shopNav: [
      { label: "Shop", href: PADKOS.shop },
      { label: "Heimweh Box", href: PADKOS.produkt("heimweh") },
      { label: "Shipping", href: PADKOS.versand },
      { label: "Contact", href: PADKOS.kontakt },
    ],
    landingNav: [
      { label: "Bestsellers", href: "#bestseller" },
      { label: "The Shelves", href: "#kategorien" },
      { label: "Heimweh Box", href: "#heimweh" },
      { label: "Our Story", href: "#story" },
      { label: "FAQ", href: "#faq" },
    ],
    menuPrimaryShop: [
      { label: "Shop", href: PADKOS.shop },
      { label: "Heimweh Box", href: PADKOS.produkt("heimweh") },
      { label: "Cart", href: PADKOS.kasse },
      { label: "Wishlist", href: PADKOS.merkliste },
    ],
    menuSecondaryShop: [
      { label: "My account", href: PADKOS.konto },
      { label: "Shipping & returns", href: PADKOS.versand },
      { label: "Contact", href: PADKOS.kontakt },
      { label: "Home", href: PADKOS.en },
    ],
    menuSecondaryLanding: [
      { label: "Heimweh Box", href: "#heimweh" },
      { label: "Our Story", href: "#story" },
      { label: "Good to know", href: "#faq" },
    ],
    menuEn: "Deutsche Version →",
    menuFoot: "Shipping across Austria · Free from € 59 · Pickup in Vienna",
  },
} as const;

export function PadkosHeader({ variant = "shop", lang = "de" }: PadkosHeaderProps) {
  const count = useCartCount();
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const copy = COPY[lang];
  const homeHref = lang === "en" ? PADKOS.en : PADKOS.home;
  const nav = variant === "landing" ? copy.landingNav : copy.shopNav;
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const menuCloseRef = useRef<HTMLButtonElement>(null);

  // The overlay menu must never survive a navigation.
  useEffect(() => {
    const close = () => setMenuOpen(false);
    router.events.on("routeChangeStart", close);
    return () => router.events.off("routeChangeStart", close);
  }, [router.events]);

  // Overlay menu focus management: focus moves in on open, Escape closes,
  // focus returns to the hamburger on close (but never on initial mount).
  const menuWasOpen = useRef(false);
  useEffect(() => {
    if (menuOpen) {
      menuWasOpen.current = true;
      menuCloseRef.current?.focus();
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") setMenuOpen(false);
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
    if (menuWasOpen.current) {
      menuWasOpen.current = false;
      hamburgerRef.current?.focus({ preventScroll: true });
    }
  }, [menuOpen]);

  // The landing menu's category links (design v2): each shelf deep-links into
  // the shop with its filter chip preselected — labelled in the page's own
  // language (the catalogue itself carries the German names).
  const menuPrimary =
    variant === "landing"
      ? CATEGORIES.map((c) => ({
          label: LANDING_COPY[lang].categoryNames[c.key]?.name ?? c.name,
          href: PADKOS.shopCategory(c.key),
        }))
      : copy.menuPrimaryShop;
  const menuSecondary =
    variant === "landing" ? copy.menuSecondaryLanding : copy.menuSecondaryShop;

  const cartBadge = count > 0 ? <span className={styles.cartBadge}>{count}</span> : null;

  return (
    <div className={styles.headerWrap}>
      <header className={styles.header}>
        {/* Desktop bar */}
        <div className={styles.headerBar}>
          <Link href={homeHref} className={styles.wordmarkLink}>
            <span className={styles.wordmark}>PADKOS</span>
            <span className={styles.wordmarkSub}>{copy.tagline}</span>
          </Link>

          <nav aria-label={lang === "de" ? "Hauptmenü" : "Main menu"} className={styles.nav}>
            {nav.map((item) => (
              <a key={item.label} href={item.href} className={styles.navLink}>
                {item.label}
              </a>
            ))}
          </nav>

          <div className={styles.actions}>
            <Link
              href={copy.langHref}
              aria-label={copy.langSwitchLabel}
              className={styles.langLink}
            >
              {copy.langSwitch}
            </Link>
            {variant === "shop" ? (
              <>
                <Link href={PADKOS.merkliste} aria-label={copy.wishlistLabel} className={styles.iconLink}>
                  <HeartIcon size={21} />
                </Link>
                <Link href={PADKOS.konto} aria-label={copy.accountLabel} className={styles.iconLink}>
                  <PersonIcon />
                </Link>
              </>
            ) : null}
            <Link href={PADKOS.kasse} aria-label={copy.cartLabel} className={styles.iconLink}>
              <CartIcon />
              {cartBadge}
            </Link>
            <Link
              href={PADKOS.shop}
              className={`${ui.btn} ${ui.btnGreen} ${ui.shadowSm} ${styles.headerCta}`}
            >
              {copy.cta}
            </Link>
          </div>
        </div>

        {/* Mobile bar */}
        <div className={styles.mobileBar}>
          <button
            ref={hamburgerRef}
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label={copy.menuOpen}
            aria-expanded={menuOpen}
            className={styles.hamburger}
          >
            <span />
            <span />
            <span />
          </button>
          <Link href={homeHref} className={styles.mobileWordmark}>
            <span className={styles.wordmark}>PADKOS</span>
            <span className={styles.wordmarkSub}>{copy.tagline}</span>
          </Link>
          <div className={styles.mobileActions}>
            {variant === "shop" ? (
              <Link href={PADKOS.merkliste} aria-label={copy.wishlistLabel} className={styles.iconLink}>
                <HeartIcon size={20} />
              </Link>
            ) : (
              <Link
                href={copy.langHref}
                aria-label={copy.langSwitchLabel}
                className={styles.langLink}
              >
                {copy.langSwitch}
              </Link>
            )}
            <Link href={PADKOS.kasse} aria-label={copy.cartLabel} className={styles.iconLink}>
              <CartIcon />
              {cartBadge}
            </Link>
          </div>
        </div>

        <p className={styles.announcement}>{copy.announcement}</p>
      </header>

      {menuOpen ? (
        <div
          className={styles.menu}
          role="dialog"
          aria-modal="true"
          aria-label={lang === "de" ? "Menü" : "Menu"}
        >
          <div className={styles.menuTop}>
            <span className={styles.menuWordmark}>PADKOS</span>
            <button
              ref={menuCloseRef}
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label={copy.menuClose}
              className={styles.menuClose}
            >
              ×
            </button>
          </div>
          <nav aria-label={lang === "de" ? "Hauptmenü" : "Main menu"} className={styles.menuNav}>
            {menuPrimary.map((item) => (
              <a key={item.label} href={item.href} onClick={() => setMenuOpen(false)}>
                {item.label}
              </a>
            ))}
          </nav>
          <nav
            aria-label={lang === "de" ? "Weitere Links" : "More links"}
            className={styles.menuSecondary}
          >
            {menuSecondary.map((item) => (
              <a key={item.label} href={item.href} onClick={() => setMenuOpen(false)}>
                {item.label}
              </a>
            ))}
            <a href={copy.langHref} className={styles.menuEn} onClick={() => setMenuOpen(false)}>
              {copy.menuEn}
            </a>
          </nav>
          <p className={styles.menuFoot}>{copy.menuFoot}</p>
        </div>
      ) : null}
    </div>
  );
}
