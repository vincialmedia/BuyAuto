import type { GetStaticProps } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CircleCheck, Shield, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ModernListingCard } from "@/components/buyauto/search/ModernListingCard";
import { searchListings } from "@/services/listingsService";
import type { Listing } from "@/lib/buyauto/types";
import { Slider } from "@/components/ui/slider";
import { trackEvent } from "@/lib/analytics/gtag";

type LeasingAbgebenPageProps = {
  takeoverListings: Listing[];
};

// Typical re-registration/transfer fee charged by Swiss leasing banks — a guide
// value, not a quote; the disclaimer under the calculator says so.
const TRANSFER_FEE_CHF = 350;

const CTA_HREF = "/inserat-erstellen";
const CTA_LABEL = "Gratis Inserat erstellen";

// Deterministic CHF formatting with the typographic apostrophe the design
// specifies (U+2019). toLocaleString("de-CH") ships whichever apostrophe the
// runtime's ICU has, and a server/browser mismatch threw hydration error #425
// on this page — a literal character can't drift.
const fmtChf = (n: number) => "CHF " + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "’");

// Single source of truth for the FAQ: feeds BOTH the visible cards and the
// FAQPage JSON-LD, so the structured data can never drift from the page text.
// `linkText` must appear verbatim in `a` — it is what the answer is split on to
// turn that phrase into an internal link without duplicating the copy.
type Faq = { q: string; a: string; href?: string; linkText?: string };

const FAQS: Faq[] = [
  {
    q: "Kann ich mein Leasing einfach zurückgeben?",
    a: "Nein, ein Leasingvertrag ist bindend. Eine vorzeitige Rückgabe ist meist mit sehr hohen Kosten (Vorfälligkeitsentschädigung) verbunden. Die Leasingübernahme ist oft die einzige kostengünstige Alternative.",
    href: "/leasinguebernahme",
    linkText: "Leasingübernahme",
  },
  {
    q: "Was kostet mich die Leasingübernahme?",
    a: `In der Regel nur die Umschreibegebühr deiner Leasingbank – typischerweise rund CHF ${TRANSFER_FEE_CHF}. Die verbleibenden Raten zahlt ab der Umschreibung dein Nachfolger. Das Inserat auf BuyAuto ist gratis.`,
  },
  {
    q: "Wie schnell kann ich mein Leasing abgeben?",
    a: "Das hängt davon ab, wie schnell du einen Übernehmer findest. Mit einem attraktiven Inserat auf BuyAuto oft in wenigen Wochen. Die bankseitige Abwicklung dauert dann meist nur wenige Tage.",
  },
  {
    q: "Warum ist die Leasingübernahme günstiger als die Kündigung?",
    a: "Bei einer Kündigung musst du die Bank für den Zinsausfall entschädigen. Bei einer Leasingübernahme läuft der Vertrag einfach weiter – die Bank verliert kein Geld, daher fallen kaum Strafgebühren an.",
  },
];

const PROCESS_STEPS = [
  { step: 1, title: "Vertrag prüfen", desc: "Restwert, Laufzeit und Kilometerstand checken" },
  { step: 2, title: "Bank kontaktieren", desc: "Konditionen für die Übernahme klären" },
  { step: 3, title: "Inserat erstellen", desc: "Auf BuyAuto.ch veröffentlichen und Nachfolger finden" },
  { step: 4, title: "Bonitätsprüfung", desc: "Leasingbank prüft den Übernehmer" },
  { step: 5, title: "Umschreibung", desc: "Vertrag umschreiben, Fahrzeug übergeben – fertig!" },
];

// Hero chips fall back to real historic listings when the live query returns
// nothing, so the block never renders empty (values from the design handoff).
const FALLBACK_CHIPS = [
  { initials: "DT", label: "Fiat 600 · CHF 428 / Monat" },
  { initials: "RC", label: "Porsche Cayenne · CHF 2’265 / Monat" },
  { initials: "TB", label: "BMW 340i · CHF 906 / Monat" },
];

const initialsOf = (name?: string | null) =>
  (name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "BA";

/**
 * Every conversion click on this page goes through here, so GA4/Ads can tell
 * which slot actually produced the listing (header vs. calculator vs. slab).
 */
function CtaButton({
  location,
  className = "",
  children = CTA_LABEL,
}: {
  location: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Button asChild className={className}>
      <Link
        href={CTA_HREF}
        onClick={() => trackEvent("cta_click", { cta_location: location, page: "lp-leasing-abgeben" })}
      >
        {children}
      </Link>
    </Button>
  );
}

export default function LeasingAbgebenLp({ takeoverListings }: LeasingAbgebenPageProps) {
  const [months, setMonths] = useState(24);
  const [monthlyRate, setMonthlyRate] = useState(450);

  // The one number the calculator can state honestly: cancellation can cost up
  // to the whole remaining obligation, so it anchors the Kündigung box ("bis
  // CHF X").
  const remainingObligation = months * monthlyRate;

  const heroChips =
    takeoverListings.length >= 3
      ? takeoverListings.slice(0, 3).map((listing) => ({
          initials: initialsOf(listing.seller_name),
          label: `${listing.title?.trim() || `${listing.brand} ${listing.model}`} · ${fmtChf(listing.pricePerMonthCHF)} / Monat`,
        }))
      : FALLBACK_CHIPS;

  return (
    <>
      <Head>
        <title>Leasing abgeben Schweiz: legal & ohne Verlust raus | BuyAuto</title>
        <meta
          name="description"
          content="Leasing abgeben in der Schweiz leicht gemacht: Übergib deinen Leasingvertrag an einen Nachfolger und zahle nur die Umschreibegebühr."
        />
        {/* Unlisted Google Ads landing page: the organic twin lives at
            /leasing-abgeben-schweiz. noindex keeps this variant out of search;
            robots.txt must keep it crawlable so the directive is seen (and so
            AdsBot can check the landing page). No canonical, no JSON-LD, no
            sitemap entry (the sitemap only lists CONTENT_LAST_UPDATED keys). */}
        <meta name="robots" content="noindex" />
      </Head>

      <div className="bg-white">
        {/* FUNNEL HEADER — replaces the global site header on this page (see
            MainLayout's FUNNEL_ROUTES): logo, one trust line, one CTA. No nav,
            no login — ad traffic gets exactly one thing to click. */}
        <header className="sticky top-0 z-50 bg-white border-b border-neutral-200">
          <div className="max-w-[1120px] mx-auto px-5 sm:px-10 h-[68px] flex items-center justify-between overflow-visible">
            <Link href="/" className="flex-none relative z-10 block">
              <Image
                src="/buyauto-logo-header.png"
                alt="BuyAuto"
                width={180}
                height={120}
                loading="eager"
                className="h-20 sm:h-24 w-auto"
                sizes="180px"
              />
            </Link>
            <div className="flex items-center gap-4">
              <span className="hidden lg:inline-flex items-center gap-2.5 text-[13px] font-semibold text-neutral-500">
                <Shield className="w-[15px] h-[15px]" strokeWidth={2} aria-hidden />
                100% legal – der Vertrag läuft weiter
              </span>
              <CtaButton location="header" className="h-11 sm:h-9 font-semibold" />
            </div>
          </div>
        </header>

        {/* HERO — dark stage, alpine shot at 55% under the gradient, offer
            left, calculator card right. The calculator is the focal point. */}
        <section className="relative bg-[#0a0a0a] overflow-hidden">
          <Image
            src="/hero-macan-mountain.png"
            alt=""
            fill
            priority
            fetchPriority="high"
            className="object-cover opacity-55"
            sizes="100vw"
            // q60 AVIF/WebP is visually indistinguishable at 55% opacity under
            // the gradient and keeps the LCP payload small.
            quality={60}
          />
          <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(10,10,10,0.95)_15%,rgba(10,10,10,0.55))]" />

          <div className="relative max-w-[1120px] mx-auto px-5 sm:px-10 py-12 lg:py-[72px] grid lg:grid-cols-[1fr_460px] gap-10 lg:gap-14 items-center">
            {/* Left: offer */}
            <div>
              <span className="inline-flex items-center gap-2 text-[11px] leading-tight font-extrabold tracking-[0.08em] uppercase text-red-300 bg-red-500/15 px-3 py-1.5 rounded-full backdrop-blur-md">
                Leasing abgeben Schweiz
              </span>
              <h1 className="mt-[18px] text-[34px] sm:text-[42px] lg:text-[50px] leading-[1.05] font-black tracking-[-0.025em] text-white [hyphens:auto]">
                Leasing abgeben – <span className="text-red-500">ohne teure Kündigung.</span>
              </h1>
              <p className="mt-5 text-[16.5px] leading-[1.625] text-white/[0.72] max-w-[480px] [text-wrap:pretty]">
                Übergib deinen Leasingvertrag an eine Nachfolgerin oder einen Nachfolger: Sie übernehmen die
                Restraten, du zahlst nur die Umschreibegebühr von typischerweise rund CHF {TRANSFER_FEE_CHF}.
              </p>

              <ul className="mt-[26px] flex flex-col gap-3">
                {[
                  "Keine Vorfälligkeitsentschädigung",
                  "Bankseitige Abwicklung in wenigen Tagen",
                  "100% legal – der Vertrag läuft weiter",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-[15px] font-semibold text-white">
                    <CircleCheck className="w-[18px] h-[18px] text-red-500 shrink-0" strokeWidth={2} aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <p className="mb-2.5 text-[11px] font-extrabold tracking-[0.08em] uppercase text-white/55">
                  Live auf BuyAuto · Diese Fahrer geben gerade ihr Leasing ab
                </p>
                <div className="flex gap-2.5 flex-wrap">
                  {heroChips.map((chip) => (
                    <span
                      key={chip.label}
                      className="inline-flex items-center gap-2 py-[7px] pl-2 pr-3.5 rounded-full bg-white/10 backdrop-blur-md text-white text-[12.5px] font-semibold"
                    >
                      <span className="w-6 h-6 rounded-full bg-white/20 inline-flex items-center justify-center text-[9.5px] font-extrabold">
                        {chip.initials}
                      </span>
                      {chip.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: the calculator card — the conversion centerpiece */}
            <div id="calculator" className="scroll-mt-24">
              <div className="bg-white rounded-3xl p-7 shadow-[0_25px_60px_rgb(0_0_0/0.45)]">
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-[10px] bg-red-50 inline-flex items-center justify-center flex-none">
                    <SlidersHorizontal className="w-[18px] h-[18px] text-red-600" strokeWidth={2} aria-hidden />
                  </span>
                  <div>
                    <h2 className="text-xl font-black tracking-[-0.02em] text-neutral-900">
                      Was kostet dich der Ausstieg?
                    </h2>
                    <p className="mt-0.5 text-[12.5px] text-neutral-500">
                      Stell deinen Vertrag ein – transparent, ohne Schönrechnen.
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex justify-between items-baseline mb-2.5">
                    <label className="text-[13.5px] font-bold text-neutral-700">Restlaufzeit</label>
                    <span className="text-[15px] font-extrabold text-red-600">{months} Monate</span>
                  </div>
                  <Slider
                    value={[months]}
                    onValueChange={(value) => setMonths(value[0])}
                    min={6}
                    max={48}
                    step={1}
                    className="py-[5px]"
                    aria-label="Restlaufzeit in Monaten"
                  />
                </div>
                <div className="mt-5">
                  <div className="flex justify-between items-baseline mb-2.5">
                    <label className="text-[13.5px] font-bold text-neutral-700">Monatsrate</label>
                    <span className="text-[15px] font-extrabold text-red-600">{fmtChf(monthlyRate)}</span>
                  </div>
                  <Slider
                    value={[monthlyRate]}
                    onValueChange={(value) => setMonthlyRate(value[0])}
                    min={100}
                    max={2500}
                    step={25}
                    className="py-[5px]"
                    aria-label="Monatsrate in Franken"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 mt-6">
                  <div className="bg-red-600 rounded-[14px] px-4 py-3.5">
                    <p className="text-[10.5px] font-extrabold tracking-[0.06em] uppercase text-white/70">Kündigung</p>
                    {/* No nowrap here: at max slider values ("bis CHF 120’000")
                        the figure must wrap instead of clipping on mobile. */}
                    <p className="mt-1 text-xl leading-tight font-black text-white">
                      bis {fmtChf(remainingObligation)}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-tight text-white/70">je nach Bank & Vertrag</p>
                  </div>
                  <div className="relative bg-emerald-50 border border-emerald-200 rounded-[14px] px-4 py-3.5">
                    <span className="absolute -top-[11px] right-3 text-[9.5px] font-extrabold tracking-[0.06em] uppercase px-2.5 py-1 rounded-full bg-amber-400 text-amber-900 shadow-[0_0_0_3px_#fffbeb,0_0_14px_rgba(251,191,36,0.65)] whitespace-nowrap">
                      Beste Lösung
                    </span>
                    <p className="text-[10.5px] font-extrabold tracking-[0.06em] uppercase text-emerald-700">Übernahme</p>
                    <p className="mt-1 text-xl leading-tight font-black text-emerald-700 whitespace-nowrap">CHF 0 – 650</p>
                    <p className="mt-0.5 text-[11px] leading-tight text-emerald-600">Umschreibegebühr</p>
                  </div>
                </div>

                <div className="mt-[18px]">
                  <CtaButton location="calculator" className="w-full h-14 text-base font-bold rounded-xl" />
                </div>
                <p className="mt-2.5 text-xs text-neutral-500 text-center">
                  Gratis · 60 Tage online · Login erst beim Veröffentlichen
                </p>
                <p className="mt-3 text-[10.5px] leading-normal text-neutral-400">
                  Richtwerte zur Orientierung. Massgebend sind dein Leasingvertrag und die Konditionen deiner
                  Leasingbank.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* OPTIONS COMPARISON — three stacked rows; the recommended path leads
            with the red border and the only price in brand red. */}
        <section className="max-w-[1120px] mx-auto px-5 sm:px-10 py-12 lg:py-[72px]">
          <div className="max-w-[640px]">
            <h2 className="text-[30px] sm:text-[38px] font-black tracking-[-0.025em] leading-[1.1] text-neutral-900">
              Deine 3 Optionen im Vergleich
            </h2>
            <p className="mt-3.5 text-base leading-[1.625] text-neutral-600 [text-wrap:pretty]">
              Du hast drei Wege aus dem Leasing: die Übernahme durch eine Nachfolgerin oder einen Nachfolger, die
              vorzeitige Kündigung (teuer) oder den Verkauf mit Ablösung. Am günstigsten ist meist die
              Leasingübernahme.
            </p>
          </div>

          <div className="flex flex-col gap-3.5 mt-9">
            <div className="grid lg:grid-cols-[250px_1fr_190px] gap-5 lg:gap-6 items-center bg-white border-2 border-red-500 rounded-[20px] px-6 py-[22px] sm:px-7 shadow-[0_10px_30px_rgb(239_68_68/0.1)]">
              <div>
                <span className="text-[10px] font-extrabold tracking-[0.06em] px-2.5 py-1 rounded-full bg-red-600 text-white">
                  EMPFOHLEN
                </span>
                <h3 className="mt-2.5 text-[19px] leading-tight font-extrabold text-neutral-900">Leasingübernahme</h3>
                <p className="mt-1 text-xs leading-tight font-bold text-red-700">BESTE LÖSUNG</p>
              </div>
              <ul className="grid sm:grid-cols-2 gap-y-2 gap-x-5">
                {["Schneller Ausstieg", "Keine Strafzahlungen", "Kein Verkauf nötig", "Win-Win für beide Seiten"].map(
                  (item) => (
                    <li key={item} className="flex gap-2 items-center text-[13.5px] leading-snug font-semibold text-neutral-800">
                      <CircleCheck className="w-[15px] h-[15px] text-red-600 shrink-0" strokeWidth={2.5} aria-hidden />
                      {item}
                    </li>
                  )
                )}
              </ul>
              <div className="lg:text-right">
                <p className="text-[22px] leading-tight font-black text-red-600 whitespace-nowrap">~ CHF {TRANSFER_FEE_CHF}</p>
                <p className="mt-0.5 text-[11.5px] leading-tight text-neutral-500">Umschreibegebühr</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-[250px_1fr_190px] gap-5 lg:gap-6 items-center bg-white border border-neutral-200 rounded-[20px] px-6 py-[22px] sm:px-7">
              <div>
                <span className="text-[10px] font-extrabold tracking-[0.06em] px-2.5 py-1 rounded-full bg-red-50 text-red-600">
                  TEUERSTE OPTION
                </span>
                <h3 className="mt-2.5 text-[19px] leading-tight font-extrabold text-neutral-900">Vorzeitige Kündigung</h3>
              </div>
              <ul className="grid sm:grid-cols-2 gap-y-2 gap-x-5">
                {[
                  "Restschuld für verbleibende Vertragsdauer",
                  "Vorfälligkeitsentschädigung",
                  "Rücknahmekosten",
                  "Kosten bei Schäden",
                ].map((item) => (
                  <li key={item} className="flex gap-2 items-center text-[13.5px] leading-snug text-neutral-600">
                    <X className="w-3.5 h-3.5 text-neutral-400 shrink-0" strokeWidth={2.5} aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="lg:text-right">
                <p className="text-[17px] leading-tight font-extrabold text-neutral-900 whitespace-nowrap">Mehrere tausend</p>
                <p className="mt-0.5 text-[11.5px] leading-tight text-neutral-500">Fast immer die teuerste Lösung</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-[250px_1fr_190px] gap-5 lg:gap-6 items-center bg-white border border-neutral-200 rounded-[20px] px-6 py-[22px] sm:px-7">
              <div>
                <span className="text-[10px] font-extrabold tracking-[0.06em] px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700">
                  UNSICHER
                </span>
                <h3 className="mt-2.5 text-[19px] leading-tight font-extrabold text-neutral-900">Auto verkaufen</h3>
              </div>
              <ul className="grid sm:grid-cols-2 gap-y-2 gap-x-5">
                {[
                  "Niedriger Ankaufpreis",
                  "Risiko eines Wertverlusts",
                  "Weiterlaufende Raten",
                  "Unerwartete Zusatzgebühren",
                ].map((item) => (
                  <li key={item} className="flex gap-2 items-center text-[13.5px] leading-snug text-neutral-600">
                    <X className="w-3.5 h-3.5 text-neutral-400 shrink-0" strokeWidth={2.5} aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="lg:text-right">
                <p className="text-[17px] leading-tight font-extrabold text-neutral-900">Unsicher</p>
                <p className="mt-0.5 text-[11.5px] leading-tight text-neutral-500">Nur bei hohem Marktwert sinnvoll</p>
              </div>
            </div>
          </div>

          <p className="mt-5 text-[13px] text-neutral-500 text-center">
            Wie die Übernahme im Detail funktioniert, liest du unter{" "}
            <Link href="/leasinguebernahme" className="font-semibold text-red-600 hover:text-red-700">
              Leasingübernahme
            </Link>
            .
          </p>
        </section>

        {/* LIVE TAKEOVER LISTINGS — real, current social proof. The cards stay
            clickable: they demonstrate the product (intentional exception to
            the no-leak rule). */}
        {takeoverListings.length > 0 && (
          <section className="max-w-[1120px] mx-auto px-5 sm:px-10 pb-12 lg:pb-[72px]">
            <span className="inline-flex items-center gap-2 text-[11px] font-extrabold tracking-[0.08em] uppercase text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full">
              <span className="w-[7px] h-[7px] rounded-full bg-emerald-700 inline-block" aria-hidden />
              Live auf BuyAuto
            </span>
            <h2 className="mt-3.5 text-[30px] sm:text-4xl font-black tracking-[-0.025em] leading-[1.1] text-neutral-900">
              Diese Fahrer geben gerade ihr Leasing ab
            </h2>
            <p className="mt-3 text-base text-neutral-600">
              Echte, aktuelle Inserate – so präsentiert sich dein Leasing möglichen Übernehmern.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-9">
              {takeoverListings.map((listing) => (
                <ModernListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </section>
        )}

        {/* PROCESS — five numbered circles on one timeline. */}
        <section id="ablauf" className="bg-neutral-50 border-y border-neutral-200 scroll-mt-20">
          <div className="max-w-[1120px] mx-auto px-5 sm:px-10 py-12 lg:py-16">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
              <div>
                <h2 className="text-[30px] sm:text-[32px] font-black tracking-[-0.025em] leading-[1.1] text-neutral-900">
                  So funktioniert&apos;s
                </h2>
                <p className="mt-2.5 text-[15px] text-neutral-600">
                  In 5 Schritten zum Ziel –{" "}
                  <Link href="/leasingvertrag-uebertragen" className="font-semibold text-red-600 hover:text-red-700">
                    so wird der Leasingvertrag übertragen
                  </Link>
                </p>
              </div>
              <CtaButton location="steps" className="h-11 lg:h-10 px-6 font-semibold" />
            </div>

            <div className="relative mt-9">
              {/* Timeline rail behind the circles — lg only, where the five
                  steps share one row. */}
              <div className="hidden lg:block absolute top-[19px] left-[10%] right-[10%] h-0.5 bg-neutral-200" aria-hidden />
              <ol className="grid lg:grid-cols-5 gap-y-8">
                {PROCESS_STEPS.map((item) => (
                  <li key={item.step} className="relative text-center px-3">
                    <span className="inline-flex w-10 h-10 rounded-full bg-red-600 text-white text-base font-black items-center justify-center shadow-[0_0_0_6px_#fafafa]">
                      {item.step}
                    </span>
                    <h3 className="mt-3 text-[14.5px] leading-tight font-extrabold text-neutral-900">{item.title}</h3>
                    <p className="mt-[5px] text-[12.5px] leading-normal text-neutral-500 max-w-[240px] mx-auto">
                      {item.desc}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* FAQ — the last objections before the close, as a 2×2 card grid. */}
        <section id="faq" className="max-w-[1120px] mx-auto px-5 sm:px-10 py-12 lg:py-[72px] scroll-mt-20">
          <h2 className="text-[30px] sm:text-[32px] font-black tracking-[-0.025em] leading-[1.1] text-neutral-900">
            Häufige Fragen
          </h2>
          <p className="mt-2.5 text-[15px] text-neutral-600">Alles, was du wissen musst</p>
          <div className="grid md:grid-cols-2 gap-5 mt-8">
            {FAQS.map((faq) => (
              <div key={faq.q} className="bg-white border border-neutral-200 rounded-2xl p-6">
                <h3 className="text-base leading-snug font-extrabold text-neutral-900">{faq.q}</h3>
                <p className="mt-2.5 text-sm leading-[1.625] text-neutral-600">
                  {faq.href ? (
                    <>
                      {faq.a.split(faq.linkText)[0]}
                      <Link href={faq.href} className="text-red-600 hover:text-red-700">
                        {faq.linkText}
                      </Link>
                      {faq.a.split(faq.linkText)[1]}
                    </>
                  ) : (
                    faq.a
                  )}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA SLAB — one action on a red stage, white button for contrast. */}
        <section className="max-w-[1120px] mx-auto px-5 sm:px-10 pb-12 lg:pb-[72px]">
          <div className="bg-red-600 rounded-[32px] px-8 py-10 sm:px-12 sm:py-14 flex flex-col md:flex-row items-center justify-between gap-10 shadow-[0_20px_45px_rgb(239_68_68/0.25)]">
            <div className="text-center md:text-left">
              <h2 className="text-3xl sm:text-4xl font-black tracking-[-0.025em] leading-[1.1] text-white">
                Gib dein Leasing ab – legal, schnell & günstig
              </h2>
              <p className="mt-3 text-base leading-[1.625] text-white/85 max-w-[520px]">
                Die Leasingübernahme ist für die meisten Fahrer die beste Lösung. Keine versteckten Kosten, keine
                Komplikationen.
              </p>
            </div>
            <div className="flex-none text-center">
              <CtaButton
                location="slab"
                className="h-14 px-8 text-base font-bold rounded-xl bg-white text-red-600 hover:bg-white/90 shadow-[0_10px_30px_rgb(0_0_0/0.2)]"
              />
              <p className="mt-2.5 text-[12.5px] text-white/75">Gratis · 60 Tage online</p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps<LeasingAbgebenPageProps> = async () => {
  try {
    const results = await searchListings({ dealType: "lease_takeover", sort: "dateDesc" });
    // Newest three takeovers; strip undefined fields so Next can serialize.
    const takeoverListings = JSON.parse(JSON.stringify(results.items.slice(0, 3))) as Listing[];
    return { props: { takeoverListings }, revalidate: 3600 };
  } catch (error) {
    console.error("Leasing abgeben landing: takeover fetch failed:", error);
    return { props: { takeoverListings: [] }, revalidate: 3600 };
  }
};
