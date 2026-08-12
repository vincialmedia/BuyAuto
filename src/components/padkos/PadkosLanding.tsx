import Link from "next/link";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";

import {
  BESTSELLER_SKUS,
  CATEGORIES,
  findProduct,
  type PadkosProduct,
} from "@/lib/padkos/catalog";
import { LANDING_COPY, type PadkosLang } from "@/lib/padkos/landing-content";
import { subscribeNewsletter } from "@/lib/padkos/backend";
import { PADKOS } from "@/lib/padkos/routes";
import { padkosStore } from "@/lib/padkos/store";

import styles from "./Padkos.module.css";
import { PadkosLoader } from "./PadkosLoader";

/** Overlay starts cross-fading out at this point, and unmounts .5s later. */
const LOADER_FADE_AT_MS = 2700;
const LOADER_HIDE_AT_MS = 3200;

/**
 * useLayoutEffect on the client so the loader-skip decision commits BEFORE
 * first paint (a plain effect would flash the overlay for one frame on every
 * return visit); aliased to useEffect during SSR to avoid the React warning.
 */
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
/** How long an add-to-cart button shows its "✓ Dazugelegt" state. */
const ADDED_FEEDBACK_MS = 1400;
const ADDED_FEEDBACK_HERO_MS = 2600;

export interface PadkosLandingProps {
  lang?: PadkosLang;
  /** The taxi loading screen — the design's "Verhalten" editor toggle. */
  taxiLoader?: boolean;
  /** Rubber-stamp flourishes ("PROUDLY SOUTH AFRICAN", "DIREKT IMPORTIERT"). */
  stamps?: boolean;
}

/**
 * The Padkos landing content (German and English), rendered inside
 * PadkosShell. Desktop follows the `Padstal Heritage Desktop` design, mobile
 * (<760px) the `v2` design: centred hero, 2-column grids, photo-in-the-middle
 * gift box and the sticky bottom CTA. All cart buttons write to the real
 * store, so the header badge and checkout see every add.
 */
export function PadkosLanding({
  lang = "de",
  taxiLoader = true,
  stamps = true,
}: PadkosLandingProps) {
  const copy = LANDING_COPY[lang];
  const bestsellers = BESTSELLER_SKUS.map((sku) => findProduct(sku)!).filter(Boolean);
  const heimweh = findProduct("heimweh")!;

  const [justAdded, setJustAdded] = useState<string | null>(null);
  const addedTimer = useRef<ReturnType<typeof setTimeout>>();
  const [subscribed, setSubscribed] = useState(false);

  // Server and first client render agree on `true`, so the overlay is part of
  // the initial HTML; the timers below only ever take it away.
  const [loading, setLoading] = useState(true);
  const [fading, setFading] = useState(false);
  const fadeTimer = useRef<ReturnType<typeof setTimeout>>();
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  useIsomorphicLayoutEffect(() => {
    if (!taxiLoader) {
      setLoading(false);
      return;
    }
    // With animations suppressed the taxis freeze off-screen — a reduced-motion
    // visitor would stare at a blank green field for 3.2s. Skip instead.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setLoading(false);
      return;
    }
    // Brand moment, not a toll booth: play once per browser session. Without
    // this flag the 3.2s overlay would replay on every wordmark click and
    // every DE↔EN switch, blocking all input each time.
    try {
      if (window.sessionStorage.getItem("padkos-loader-seen")) {
        setLoading(false);
        return;
      }
      window.sessionStorage.setItem("padkos-loader-seen", "1");
    } catch {
      // Storage blocked: fall through and show the loader once per mount.
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

  useEffect(() => () => clearTimeout(addedTimer.current), []);

  const addToCart = (sku: string, feedbackMs = ADDED_FEEDBACK_MS) => {
    // Ignore clicks while the "✓" confirmation shows — the button stays the
    // same enabled element so keyboard focus and screen-reader announcements
    // (aria-live on the label) survive the state flip.
    if (justAdded === sku) return;
    padkosStore.add(sku, 1);
    setJustAdded(sku);
    clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setJustAdded(null), feedbackMs);
  };

  const subscribe = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = new FormData(event.currentTarget).get("email");
    if (typeof email === "string") void subscribeNewsletter(email);
    setSubscribed(true);
  };

  const productSub = (product: PadkosProduct) =>
    (lang === "en" && copy.productSubs?.[product.sku]) || product.sub;

  return (
    <>
      {loading ? <PadkosLoader fading={fading} /> : null}

      {/* ------------------------------------------------------------ hero */}
      <section id="top" className={styles.heroSection}>
        <div className={styles.heroCard}>
          <p className={styles.heroEyebrow}>{copy.eyebrow}</p>

          <div className={styles.heroGrid}>
            <div>
              <h1 className={`${styles.display} ${styles.heroTitle}`}>
                {copy.titleBefore}
                <span className={styles.heroAccent}>{copy.titleAccent}</span>
                {copy.titleAfter}
              </h1>
              <p className={styles.heroLead}>{copy.lead}</p>
              <div className={styles.heroActions}>
                <Link
                  href={PADKOS.shop}
                  className={`${styles.btn} ${styles.btnGreen} ${styles.shadowMd} ${styles.btnHero}`}
                >
                  {copy.ctaShop}
                </Link>
                <a
                  href="#heimweh"
                  className={`${styles.btn} ${styles.btnPaper} ${styles.shadowMd} ${styles.btnHeroSecondary}`}
                >
                  {copy.ctaHeimweh}
                </a>
              </div>
            </div>

            <div className={styles.heroMedia}>
              <div
                role="img"
                aria-label={copy.heroPhotoAlt}
                className={`${styles.photo} ${styles.heroPhoto}`}
              >
                <span className={styles.photoLabel}>{copy.heroPhotoCaption}</span>
              </div>
              <span className={styles.lekkerSticker}>{copy.sticker}</span>
            </div>
          </div>

          {stamps ? (
            <div aria-hidden="true" className={styles.proudlyStamp}>
              {copy.stamp}
            </div>
          ) : null}
        </div>
      </section>

      {/* ------------------------------------------------------ bestseller */}
      <section id="bestseller" className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={`${styles.sectionHeading} ${styles.sectionHeadingTight}`}>
            <span aria-hidden="true" className={styles.rule} />
            <h2 className={styles.display}>{copy.bestsellerTitle}</h2>
            <span aria-hidden="true" className={styles.rule} />
          </div>
          <p className={styles.sectionSub}>{copy.bestsellerSub}</p>

          <div className={styles.productGrid}>
            {bestsellers.map((product) => (
              <article key={product.sku} className={styles.productCard}>
                <div className={styles.productTicket}>
                  <p className={styles.productStamp}>{copy.productStamp}</p>
                  <Link
                    href={PADKOS.produkt(product.sku)}
                    className={styles.productPhotoLink}
                    tabIndex={-1}
                    aria-hidden="true"
                  >
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
                  </Link>
                  <h3 className={`${styles.display} ${styles.productName}`}>
                    <Link href={PADKOS.produkt(product.sku)}>{product.name}</Link>
                  </h3>
                  <p className={styles.productSub}>{productSub(product)}</p>
                  <p className={styles.productPrice}>{copy.formatPrice(product.price)}</p>
                  {product.grundpreis ? (
                    <p className={styles.productGrundpreis}>{product.grundpreis}</p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => addToCart(product.sku)}
                    aria-label={`${product.name}: ${copy.addToCart}`}
                    className={
                      justAdded === product.sku
                        ? styles.productButtonAdded
                        : `${styles.btn} ${styles.btnGreen} ${styles.shadowSm} ${styles.productButton}`
                    }
                  >
                    <span aria-live="polite">
                      {justAdded === product.sku ? copy.justAdded : copy.addToCart}
                    </span>
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
            <h2 className={styles.display}>{copy.categoriesTitle}</h2>
            <span aria-hidden="true" className={styles.rule} />
          </div>

          <div className={styles.categoryGrid}>
            {CATEGORIES.map((category) => {
              const names = copy.categoryNames[category.key] ?? {
                name: category.name,
                sub: category.sub,
              };
              return (
                <Link
                  key={category.key}
                  href={PADKOS.shopCategory(category.key)}
                  className={styles.categoryTile}
                  style={{ background: category.background }}
                >
                  <span className={styles.categoryName}>{names.name}</span>
                  <span className={styles.categorySub}>{names.sub}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- story */}
      <section id="story" className={styles.section}>
        <div className={styles.storyGrid}>
          <div className={styles.storyPanel}>
            <h2 className={`${styles.display} ${styles.storyTitle}`}>{copy.storyTitle}</h2>
            <p className={styles.storyText}>{copy.storyP1}</p>
            <p className={styles.storyText}>{copy.storyP2}</p>
            <p className={styles.storySignature}>{copy.storySignature}</p>
            {stamps ? (
              <div aria-hidden="true" className={styles.importStamp}>
                {copy.storyStamp}
              </div>
            ) : null}
          </div>

          <div
            role="img"
            aria-label={copy.storyPhotoAlt}
            className={`${styles.photo} ${styles.storyPhoto}`}
          >
            <span className={styles.photoLabel}>{copy.storyPhotoCaption}</span>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- guestbook */}
      <section id="bewertungen" className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeading}>
            <span aria-hidden="true" className={styles.rule} />
            <h2 className={styles.display}>{copy.guestbookTitle}</h2>
            <span aria-hidden="true" className={styles.rule} />
          </div>

          <div className={styles.testimonialGrid}>
            {copy.testimonials.map((testimonial) => (
              <figure key={testimonial.author} className={styles.testimonial}>
                <p aria-label={copy.starsLabel} className={styles.stars}>
                  ★★★★★
                </p>
                <blockquote className={styles.testimonialQuote}>„{testimonial.quote}“</blockquote>
                <figcaption className={styles.testimonialAuthor}>{testimonial.author}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------- heimweh box */}
      <section id="heimweh" className={styles.section}>
        <div className={styles.heimwehCard}>
          <div className={styles.heimwehGrid}>
            <div className={styles.heimwehHead}>
              <span className={styles.heimwehBadge}>{copy.heimwehBadge}</span>
              <h2 className={`${styles.display} ${styles.heimwehTitle}`}>{copy.heimwehTitle}</h2>
              <p className={styles.heimwehText}>{copy.heimwehText}</p>
            </div>

            <div className={styles.heimwehMedia}>
              <div
                role="img"
                aria-label={copy.heimwehPhotoAlt}
                className={styles.heimwehPhoto}
              >
                <span className={styles.heimwehPhotoLabel}>{copy.heimwehPhotoCaption}</span>
              </div>
            </div>

            <div className={styles.heimwehBuy}>
              <div className={styles.heimwehPricing}>
                <span className={`${styles.display} ${styles.heimwehPrice}`}>
                  {copy.formatPrice(heimweh.price)}
                </span>
                {heimweh.was ? (
                  <span className={styles.heimwehWas}>{copy.formatPrice(heimweh.was)}</span>
                ) : null}
              </div>
              <div className={styles.heimwehActions}>
                <button
                  type="button"
                  onClick={() => addToCart("heimweh", ADDED_FEEDBACK_HERO_MS)}
                  className={`${styles.btn} ${styles.btnGold} ${styles.shadowMd} ${styles.btnHero}`}
                >
                  <span aria-live="polite">
                    {justAdded === "heimweh" ? copy.justAdded : copy.heimwehCta}
                  </span>
                </button>
                {copy.heimwehInsideLink ? (
                  <Link href={PADKOS.produkt("heimweh")} className={styles.heimwehInside}>
                    {copy.heimwehInsideLink}
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- faq */}
      <section id="faq" className={styles.section}>
        <div className={styles.faqInner}>
          <div className={`${styles.sectionHeading} ${styles.sectionHeadingFaq}`}>
            <span aria-hidden="true" className={styles.rule} />
            <h2 className={styles.display}>{copy.faqTitle}</h2>
            <span aria-hidden="true" className={styles.rule} />
          </div>

          {copy.faqs.map((faq) => (
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
            {copy.newsletterTitle}
          </h2>
          <p className={styles.newsletterText}>{copy.newsletterText}</p>

          {subscribed ? (
            <p className={styles.newsletterSuccess}>
              {copy.newsletterSuccessBefore}
              <strong>{copy.newsletterSuccessCode}</strong>
              {copy.newsletterSuccessAfter}
            </p>
          ) : (
            <form onSubmit={subscribe} className={styles.newsletterForm}>
              <input
                type="email"
                name="email"
                required
                aria-label={copy.newsletterEmailLabel}
                placeholder={copy.newsletterPlaceholder}
                className={styles.newsletterInput}
              />
              <button
                type="submit"
                className={`${styles.btn} ${styles.btnGreen} ${styles.shadowMd} ${styles.newsletterButton}`}
              >
                {copy.newsletterCta}
              </button>
            </form>
          )}

          <p className={styles.newsletterFinePrint}>{copy.newsletterFine}</p>
        </div>
      </section>

      <div aria-hidden="true" className={styles.landingEnd} />

      {/* Mobile-only sticky CTA bar (v2 design). */}
      <div className={styles.stickyBar}>
        <div className={styles.stickyFree}>
          <p>{copy.stickyFreeFrom}</p>
          <p>{copy.stickyFreeLabel}</p>
        </div>
        <Link
          href={PADKOS.shop}
          className={`${styles.btn} ${styles.btnGreen} ${styles.shadowMd} ${styles.stickyButton}`}
        >
          {copy.stickyCta}
        </Link>
      </div>
    </>
  );
}
