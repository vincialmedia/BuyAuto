import Head from "next/head";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BreadcrumbJsonLd } from "@/components/buyauto/Breadcrumbs";
import { useLocale, useT } from "@/i18n/runtime";
import { absoluteUrl } from "@/i18n/config";
import { staticI18nProps } from "@/i18n/server";

// SCAFFOLD — outline for the EV / underwater-lease exit page (BuyAuto's
// differentiation vs. dissolution services). Every [TODO] below is placeholder copy
// for Vince to replace with real text and real numbers. Flip CONTENT_READY to true
// once done: it switches the page to index,follow and emits the FAQPage schema.
// Until then the page is noindex and deliberately absent from the sitemap
// (contentDates.ts has no entry for it).
const CONTENT_READY = false;

// FAQ scaffold: questions are final, answers are [TODO]. The schema is only emitted
// once CONTENT_READY — placeholder answers must never reach a crawler.
const FAQ_ITEMS = [
  {
    q: "Kann ich mein E-Auto-Leasing vorzeitig abgeben?",
    a: "[TODO: Antwort — Übernahme durch Nachfolger vs. vorzeitige Auflösung, Zustimmung der Leasinggesellschaft.]",
  },
  {
    q: "Was heisst «underwater» beim Leasing?",
    a: "[TODO: Antwort — Restwert des Vertrags liegt über dem Marktwert des Fahrzeugs; warum das bei E-Autos häufiger vorkommt.]",
  },
  {
    q: "Warum ist eine Leasingübernahme günstiger als eine Auflösung?",
    a: "[TODO: Antwort — bei der Übernahme entfällt die Restwert-Differenzzahlung, der Nachfolger übernimmt Rate und Restlaufzeit; Vergleich mit typischen Auflösungskosten.]",
  },
  {
    q: "Wie schnell finde ich jemanden für mein E-Auto-Leasing?",
    a: "[TODO: Antwort — echte BuyAuto-Erfahrungswerte, keine erfundenen Zahlen.]",
  },
];

export default function ElektroautoLeasingAbgebenPage() {
  const t = useT();
  const locale = useLocale();
  const canonical = absoluteUrl("/elektroauto-leasing-abgeben", locale);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((f) => ({
      "@type": "Question",
      name: t(f.q),
      acceptedAnswer: { "@type": "Answer", text: t(f.a) },
    })),
  };

  return (
    <>
      <Head>
        <title>{t("E-Auto Leasing abgeben – Ausstieg ohne Verlust | BuyAuto")}</title>
        <meta
          name="description"
          content={t(
            "Dein E-Auto-Leasing loswerden, ohne die Restwert-Differenz zu zahlen: Übernahme statt Auflösung. So funktioniert der Ausstieg in der Schweiz.",
          )}
        />
        {CONTENT_READY ? (
          <link rel="canonical" href={canonical} />
        ) : (
          <meta name="robots" content="noindex,follow" />
        )}
        {CONTENT_READY && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
        )}
      </Head>

      <BreadcrumbJsonLd
        items={[
          { name: t("Home"), href: "/" },
          { name: t("Leasingübernahme"), href: "/leasinguebernahme" },
          { name: t("E-Auto Leasing abgeben"), href: "/elektroauto-leasing-abgeben" },
        ]}
      />

      <main className="bg-white min-h-screen">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-neutral-900">
            {t("E-Auto Leasing abgeben: Raus aus dem Vertrag, ohne Verlust")}
          </h1>

          {/* Answer-first block — 2-4 sentences, quotable, direct. */}
          <p className="mt-4 text-lg text-neutral-600 leading-relaxed">
            {t(
              "[TODO: Direkte Antwort in 2–4 Sätzen: Warum viele E-Auto-Leasingverträge «underwater» sind (Restwert > Marktwert), warum eine Übernahme durch eine Nachfolgerin oder einen Nachfolger dich günstiger aussteigen lässt als eine Auflösung, und was BuyAuto dabei übernimmt.]",
            )}
          </p>

          {/* Outline — sections for Vince to fill. */}
          <section className="mt-10 space-y-10">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">{t("Warum E-Autos besonders oft «underwater» sind")}</h2>
              <p className="mt-2 text-neutral-600">
                {t("[TODO: Wertverlust E-Autos, Restwerte aus der Boomphase, Beispielrechnung mit echten Zahlen.]")}
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">{t("Übernahme statt Auflösung: der Unterschied")}</h2>
              <p className="mt-2 text-neutral-600">
                {t("[TODO: Vergleich Leasingübernahme vs. Auflösungsservices — Kostenlogik, wer was zahlt, Dauer.]")}
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">{t("So gibst du dein E-Auto-Leasing auf BuyAuto ab")}</h2>
              <p className="mt-2 text-neutral-600">{t("[TODO: Schritte — Inserat, Interessenten, Bonitätsprüfung, Umschreibung.]")}</p>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">{t("Häufige Fragen")}</h2>
              <div className="mt-4 space-y-6">
                {FAQ_ITEMS.map((f) => (
                  <div key={f.q}>
                    <h3 className="font-bold text-neutral-900">{t(f.q)}</h3>
                    <p className="mt-1 text-neutral-600">{t(f.a)}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="mt-12">
            <Button asChild size="lg" className="font-bold">
              <Link href="/inserat-erstellen">{t("Jetzt E-Auto-Leasing inserieren")}</Link>
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}

export const getStaticProps = staticI18nProps(["pages/elektroauto-leasing-abgeben"]);
