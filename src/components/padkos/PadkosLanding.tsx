import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";

import {
  BESTSELLERS,
  CATEGORIES,
  FAQS,
  PADKOS_ROUTES,
  PAYMENT_METHODS,
  TESTIMONIALS,
} from "@/lib/padkos/landing-content";

import styles from "./Padkos.module.css";
import { PadkosLoader } from "./PadkosLoader";

/** Overlay starts cross-fading out at this point, and unmounts .5s later. */
const LOADER_FADE_AT_MS = 2700;
const LOADER_HIDE_AT_MS = 3200;

export interface PadkosLandingProps {
  /**
   * The taxi loading screen. Exposed as a prop because the design file exposes
   * it as an editor toggle ("Verhalten"), and because it is the one piece of
   * the page worth being able to switch off without a code change.
   */
  taxiLoader?: boolean;
  /** Rubber-stamp flourishes ("PROUDLY SOUTH AFRICAN", "DIREKT IMPORTIERT"). */
  stamps?: boolean;
}

export function PadkosLanding({ taxiLoader = true, stamps = true }: PadkosLandingProps) {
  const [cart, setCart] = useState(0);
  const [subscribed, setSubscribed] = useState(false);

  // Server and first client render agree on `true`, so the overlay is part of
  // the initial HTML and there is no hydration mismatch; the timers below only
  // ever take it away.
  const [loading, setLoading] = useState(true);
  const [fading, setFading] = useState(false);
  const fadeTimer = useRef<ReturnType<typeof setTimeout>>();
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!taxiLoader) {
      setLoading(false);
      return;
    }

    // With animations suppressed the taxis freeze off-screen, which would leave
    // a reduced-motion visitor staring at a blank green field for 3.2s. Skip
    // straight to the shop instead.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setFading(false);
    fadeTimer.current = setTimeout(() => setFading(true), LOADER_FADE_AT_MS);
    hideTimer.current = setTimeout(() => setLoading(false), LOADER_HIDE_AT_MS);

    return () => {
      clearTimeout(fadeTimer.current);
      clearTimeout(hideTimer.current);
    };
  }, [taxiLoader]);

  // Matches the design's own cart: a counter, not a basket. Real line items
  // arrive with the shop screens.
  const addToCart = () => setCart((n) => n + 1);

  const subscribe = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubscribed(true);
  };

  return (
    <div className={styles.root}>
      {loading ? <PadkosLoader fading={fading} /> : null}

      <main className={styles.page} data-screen-label="Padstal Heritage Desktop">
        <div aria-hidden="true" className={styles.flagRule} />

        <header className={styles.header}>
          <div className={styles.headerInner}>
            <a href="#top" className={styles.wordmarkLink}>
              <span className={`${styles.display} ${styles.wordmark}`}>PADKOS</span>
              <span className={styles.wordmarkSub}>PADSTAL &amp; SPEISEKAMMER · WIEN</span>
            </a>

            <nav aria-label="Hauptmenü" className={styles.nav}>
              <a href="#bestseller" className={styles.navLink}>
                Bestseller
              </a>
              <a href="#kategorien" className={styles.navLink}>
                Die Regale
              </a>
              <a href="#heimweh" className={styles.navLink}>
                Heimweh-Paket
              </a>
              <a href="#story" className={styles.navLink}>
                Unsere Geschichte
              </a>
              <a href="#faq" className={styles.navLink}>
                FAQ
              </a>
            </nav>

            <div className={styles.headerActions}>
              <a
                href={PADKOS_ROUTES.english}
                aria-label="Switch to English"
                className={styles.langLink}
              >
                EN
              </a>
              <button type="button" aria-label="Warenkorb öffnen" className={styles.cartButton}>
                <svg
                  width="23"
                  height="23"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#382A1C"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path d="M5 8h14l-1.2 12H6.2L5 8Z" />
                  <path d="M9 8V6a3 3 0 0 1 6 0v2" />
                </svg>
                {cart > 0 ? <span className={styles.cartBadge}>{cart}</span> : null}
              </button>
              <a
                href={PADKOS_ROUTES.shop}
                className={`${styles.btn} ${styles.btnGreen} ${styles.shadowSm} ${styles.btnHeader}`}
              >
                Jetzt einkaufen
              </a>
            </div>
          </div>

          <p className={styles.announcement}>
            Versand in ganz Österreich · Gekühlter Versand für Boerewors · Ab €59
            versandkostenfrei
          </p>
        </header>

        {/* ------------------------------------------------------------ hero */}
        <section id="top" className={styles.heroSection}>
          <div className={styles.heroCard}>
            <p className={styles.heroEyebrow}>EST. 2026 · KAAPSTAD — WIEN</p>

            <div className={styles.heroGrid}>
              <div>
                <h1 className={`${styles.display} ${styles.heroTitle}`}>
                  Ein Stück <span className={styles.heroAccent}>Südafrika</span>, mitten in
                  Österreich.
                </h1>
                <p className={styles.heroLead}>
                  Wie ein Padstal an der R62 – nur mit Lieferung bis vor deine Tür. Snacks,
                  Speisekammer-Klassiker und Heimweh-Pakete, direkt importiert.
                </p>
                <div className={styles.heroActions}>
                  <a
                    href={PADKOS_ROUTES.shop}
                    className={`${styles.btn} ${styles.btnGreen} ${styles.shadowMd} ${styles.btnHero}`}
                  >
                    In den Laden
                  </a>
                  <a
                    href="#heimweh"
                    className={`${styles.btn} ${styles.btnPaper} ${styles.shadowMd} ${styles.btnHeroSecondary}`}
                  >
                    Heimweh-Paket
                  </a>
                </div>
              </div>

              <div className={styles.heroMedia}>
                <div
                  role="img"
                  aria-label="Padstal-Regal mit Chappies, Fizzers, Mrs Ball's Chutney und Creme Soda Dosen"
                  className={`${styles.photo} ${styles.heroPhoto}`}
                >
                  <span className={styles.photoLabel}>FOTO · PADSTAL-REGAL MIT KLASSIKERN</span>
                </div>
                <span className={styles.lekkerSticker}>lekker!</span>
              </div>
            </div>

            {stamps ? (
              <div aria-hidden="true" className={styles.proudlyStamp}>
                PROUDLY SOUTH AFRICAN ★
              </div>
            ) : null}
          </div>
        </section>

        {/* ------------------------------------------------------ bestseller */}
        <section id="bestseller" className={styles.section}>
          <div className={styles.sectionInner}>
            <div className={`${styles.sectionHeading} ${styles.sectionHeadingTight}`}>
              <span aria-hidden="true" className={styles.rule} />
              <h2 className={styles.display}>Bestseller</h2>
              <span aria-hidden="true" className={styles.rule} />
            </div>
            <p className={styles.sectionSub}>The taste of home – direkt importiert.</p>

            <div className={styles.productGrid}>
              {BESTSELLERS.map((product) => (
                <article key={product.sku} className={styles.productCard}>
                  <div className={styles.productTicket}>
                    <p className={styles.productStamp}>PADKOS · KAAPSTAD</p>
                    <div
                      role="img"
                      aria-label={product.photoAlt}
                      className={styles.productPhoto}
                      style={
                        {
                          "--photo-from": product.photoFrom,
                          "--photo-to": product.photoTo,
                        } as CSSProperties
                      }
                    >
                      <span className={styles.productPhotoLabel}>{product.photoCaption}</span>
                    </div>
                    <h3 className={`${styles.display} ${styles.productName}`}>{product.name}</h3>
                    <p className={styles.productSub}>{product.sub}</p>
                    <p className={styles.productPrice}>{product.price}</p>
                    <button
                      type="button"
                      onClick={addToCart}
                      className={`${styles.btn} ${styles.btnGreen} ${styles.shadowSm} ${styles.productButton}`}
                    >
                      In den Warenkorb
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------- die regale */}
        <section id="kategorien" className={styles.section}>
          <div className={styles.sectionInner}>
            <div className={styles.sectionHeading}>
              <span aria-hidden="true" className={styles.rule} />
              <h2 className={styles.display}>Die Regale</h2>
              <span aria-hidden="true" className={styles.rule} />
            </div>

            <div className={styles.categoryGrid}>
              {CATEGORIES.map((category) => (
                <a
                  key={category.name}
                  href={PADKOS_ROUTES.shop}
                  className={styles.categoryTile}
                  style={{ background: category.background }}
                >
                  <span className={`${styles.display} ${styles.categoryName}`}>
                    {category.name}
                  </span>
                  <span className={styles.categorySub}>{category.sub}</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------- story */}
        <section id="story" className={styles.section}>
          <div className={styles.storyGrid}>
            <div className={styles.storyPanel}>
              <h2 className={`${styles.display} ${styles.storyTitle}`}>Vom Padstal nach Wien.</h2>
              <p className={styles.storyText}>
                Ein Padstal ist der kleine Hofladen am Straßenrand: selbstgemachtes Chutney,
                Biltong im Glas, Rusks für die Fahrt. Padkos – wörtlich „Proviant" – ist genau
                das, nur für Österreich.
              </p>
              <p className={styles.storyText}>
                Ich bin in Kapstadt aufgewachsen und lebe seit sechs Jahren in Wien. Alles hier
                kommt direkt von südafrikanischen Herstellern – ohne Zwischenhändler, dafür mit
                gekühltem Versand für Boerewors.
              </p>
              <p className={styles.storySignature}>
                — Retha, Gründerin · danke fürs Vorbeischauen!
              </p>

              {stamps ? (
                <div aria-hidden="true" className={styles.importStamp}>
                  DIREKT IMPORTIERT
                </div>
              ) : null}
            </div>

            <div
              role="img"
              aria-label="Retha im Laden, hinter der Theke mit Biltong und Chutney-Regal"
              className={`${styles.photo} ${styles.storyPhoto}`}
            >
              <span className={styles.photoLabel}>FOTO · RETHA IM LADEN</span>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------- guestbook */}
        <section id="bewertungen" className={styles.section}>
          <div className={styles.sectionInner}>
            <div className={styles.sectionHeading}>
              <span aria-hidden="true" className={styles.rule} />
              <h2 className={styles.display}>Gästebuch</h2>
              <span aria-hidden="true" className={styles.rule} />
            </div>

            <div className={styles.testimonialGrid}>
              {TESTIMONIALS.map((testimonial) => (
                <figure key={testimonial.author} className={styles.testimonial}>
                  <p aria-label="5 von 5 Sternen" className={styles.stars}>
                    ★★★★★
                  </p>
                  <blockquote className={styles.testimonialQuote}>
                    „{testimonial.quote}"
                  </blockquote>
                  <figcaption className={styles.testimonialAuthor}>
                    {testimonial.author}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------- heimweh box */}
        <section id="heimweh" className={styles.section}>
          <div className={styles.heimwehCard}>
            <div className={styles.heimwehGrid}>
              <div>
                <span className={styles.heimwehBadge}>GESCHENK-KISTE</span>
                <h2 className={`${styles.display} ${styles.heimwehTitle}`}>Das Heimweh-Paket</h2>
                <p className={styles.heimwehText}>
                  Biltong, NikNaks, Chappies, Fizzers, Mrs Ball's und eine Creme Soda – verpackt
                  wie ein Packerl von Ouma. Zum Verschenken oder Selberbehalten.
                </p>
                <div className={styles.heimwehPricing}>
                  <span className={`${styles.display} ${styles.heimwehPrice}`}>€ 49,90</span>
                  <span className={styles.heimwehWas}>€ 56,40</span>
                </div>
                <button
                  type="button"
                  onClick={addToCart}
                  className={`${styles.btn} ${styles.btnGold} ${styles.shadowMd} ${styles.btnHero}`}
                >
                  Kiste in den Warenkorb
                </button>
              </div>

              <div
                role="img"
                aria-label="Heimweh-Paket: Kraftkarton mit Stroh, gefüllt mit südafrikanischen Klassikern"
                className={styles.heimwehPhoto}
              >
                <span className={styles.heimwehPhotoLabel}>FOTO · OFFENE GESCHENK-KISTE</span>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- faq */}
        <section id="faq" className={styles.section}>
          <div className={styles.faqInner}>
            <div className={`${styles.sectionHeading} ${styles.sectionHeadingFaq}`}>
              <span aria-hidden="true" className={styles.rule} />
              <h2 className={styles.display}>Gut zu wissen</h2>
              <span aria-hidden="true" className={styles.rule} />
            </div>

            {FAQS.map((faq) => (
              <details key={faq.question} className={styles.faqItem}>
                <summary className={styles.faqSummary}>
                  <h3 className={styles.faqQuestion}>{faq.question}</h3>
                  <span aria-hidden="true" className={styles.faqMarker}>
                    +
                  </span>
                </summary>
                <p className={styles.faqAnswer}>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------------ newsletter */}
        <section id="newsletter" className={styles.section}>
          <div className={styles.newsletterCard}>
            <h2 className={`${styles.display} ${styles.newsletterTitle}`}>
              10 % Willkommensrabatt
            </h2>
            <p className={styles.newsletterText}>
              Neuigkeiten aus dem Padstal, neue Produkte, Rezepte. Gute Post, versprochen.
            </p>

            {subscribed ? (
              <p className={styles.newsletterSuccess}>
                Danke! Dein Code: <strong>WELKOM10</strong> – gleich beim ersten Einkauf
                einlösen.
              </p>
            ) : (
              <form onSubmit={subscribe} className={styles.newsletterForm}>
                <input
                  type="email"
                  required
                  aria-label="E-Mail-Adresse"
                  placeholder="deine@email.at"
                  className={styles.newsletterInput}
                />
                <button
                  type="submit"
                  className={`${styles.btn} ${styles.btnGreen} ${styles.shadowMd} ${styles.newsletterButton}`}
                >
                  Rabatt sichern
                </button>
              </form>
            )}

            <p className={styles.newsletterFinePrint}>Kein Spam. Abmeldung jederzeit.</p>
          </div>
        </section>

        {/* ---------------------------------------------------------- footer */}
        <div aria-hidden="true" className={`${styles.flagRule} ${styles.footerRule}`} />

        <footer className={styles.footer}>
          <div className={styles.footerInner}>
            <div className={styles.footerGrid}>
              <div>
                <p className={`${styles.display} ${styles.footerWordmark}`}>PADKOS</p>
                <p className={styles.footerBlurb}>
                  Südafrikanischer Padstal für Österreich. Direkt importiert, mit Liebe verpackt.
                  Wien.
                </p>
                <div className={styles.payments} aria-label="Zahlungsarten">
                  {PAYMENT_METHODS.map((method) => (
                    <span key={method} className={styles.payment}>
                      {method}
                    </span>
                  ))}
                </div>
                <p className={styles.footerShipping}>
                  Versand mit der Österreichischen Post · 1–3 Werktage · Gekühlter Versand Mo–Mi
                </p>
              </div>

              <nav aria-label="Footer" className={styles.footerNav}>
                <a href={PADKOS_ROUTES.shop}>Shop &amp; Bestseller</a>
                <a href={PADKOS_ROUTES.versand}>Versand &amp; Retouren</a>
                <a href={PADKOS_ROUTES.heimwehProdukt}>Heimweh-Paket</a>
                <a href="#story">Über uns</a>
                <a href={PADKOS_ROUTES.impressum}>Impressum</a>
                <a href={PADKOS_ROUTES.agb}>AGB &amp; Widerruf</a>
                <a href={PADKOS_ROUTES.datenschutz}>Datenschutz</a>
                <a href={PADKOS_ROUTES.kontakt}>Kontakt</a>
              </nav>
            </div>

            <p className={styles.footerSeo}>
              Padkos ist dein South African Shop Vienna: Biltong Österreich-weit bestellen,
              Boerewors kaufen mit gekühltem Versand – dazu Mrs Ball's Chutney, Ouma Rusks,
              Chappies und Rooibos. Direkt importiert und in 1–3 Werktagen mit der
              Österreichischen Post geliefert.
            </p>
            <p className={styles.footerCopyright}>
              © 2026 Padkos e.U. · Wien · Thank you &amp; see you soon!
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
