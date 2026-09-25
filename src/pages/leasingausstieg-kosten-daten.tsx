import Head from "next/head";
import { BreadcrumbJsonLd } from "@/components/buyauto/Breadcrumbs";
import { useLocale, useT } from "@/i18n/runtime";
import { absoluteUrl } from "@/i18n/config";
import { staticI18nProps } from "@/i18n/server";

// SCAFFOLD — data page «Leasingausstieg Schweiz: Was er wirklich kostet». The table
// structure is ready for REAL BuyAuto data (anonymised aggregates from completed
// transfers); every cell is deliberately [TODO] — no invented numbers, ever. Flip
// CONTENT_READY once the data is in: it switches the page to index,follow. Until
// then the page is noindex and absent from the sitemap (no contentDates.ts entry).
const CONTENT_READY = false;

// Row skeleton: one row per exit path, filled from real BuyAuto/market data.
const COST_ROWS = [
  {
    path: "Leasingübernahme (BuyAuto)",
    einmalkosten: "[TODO: CHF]",
    restratenRisiko: "[TODO]",
    dauer: "[TODO: Tage]",
    hinweis: "[TODO: Quelle: echte BuyAuto-Transfers]",
  },
  {
    path: "Vorzeitige Auflösung beim Leasinggeber",
    einmalkosten: "[TODO: CHF]",
    restratenRisiko: "[TODO]",
    dauer: "[TODO]",
    hinweis: "[TODO: Quelle]",
  },
  {
    path: "Verkauf mit Ablösung",
    einmalkosten: "[TODO: CHF]",
    restratenRisiko: "[TODO]",
    dauer: "[TODO]",
    hinweis: "[TODO: Quelle]",
  },
];

export default function LeasingausstiegKostenDatenPage() {
  const t = useT();
  const locale = useLocale();
  const canonical = absoluteUrl("/leasingausstieg-kosten-daten", locale);

  return (
    <>
      <Head>
        <title>{t("Leasingausstieg Schweiz: Was er wirklich kostet | BuyAuto")}</title>
        <meta
          name="description"
          content={t(
            "Die echten Kosten des Leasingausstiegs in der Schweiz im Vergleich: Übernahme, vorzeitige Auflösung, Verkauf mit Ablösung – mit Daten statt Schätzungen.",
          )}
        />
        {CONTENT_READY ? (
          <link rel="canonical" href={canonical} />
        ) : (
          <meta name="robots" content="noindex,follow" />
        )}
      </Head>

      <BreadcrumbJsonLd
        items={[
          { name: t("Home"), href: "/" },
          { name: t("Leasingübernahme"), href: "/leasinguebernahme" },
          { name: t("Leasingausstieg: Kosten"), href: "/leasingausstieg-kosten-daten" },
        ]}
      />

      <main className="bg-white min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-neutral-900">
            {t("Leasingausstieg Schweiz: Was er wirklich kostet")}
          </h1>

          <p className="mt-4 text-lg text-neutral-600 leading-relaxed">
            {t(
              "[TODO: Direkte Antwort in 2–4 Sätzen mit den echten Zahlen, sobald die Daten vorliegen — keine Schätzungen, keine erfundenen Werte.]",
            )}
          </p>

          <section className="mt-10">
            <h2 className="text-2xl font-bold text-neutral-900">{t("Kostenvergleich der drei Ausstiegswege")}</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm border border-neutral-200 rounded-xl overflow-hidden">
                <thead className="bg-neutral-50 text-neutral-900">
                  <tr>
                    <th className="p-4 font-bold">{t("Ausstiegsweg")}</th>
                    <th className="p-4 font-bold">{t("Einmalkosten")}</th>
                    <th className="p-4 font-bold">{t("Restraten-Risiko")}</th>
                    <th className="p-4 font-bold">{t("Typische Dauer")}</th>
                    <th className="p-4 font-bold">{t("Hinweis")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-neutral-700">
                  {COST_ROWS.map((row) => (
                    <tr key={row.path}>
                      <td className="p-4 font-medium text-neutral-900">{t(row.path)}</td>
                      <td className="p-4">{t(row.einmalkosten)}</td>
                      <td className="p-4">{t(row.restratenRisiko)}</td>
                      <td className="p-4">{t(row.dauer)}</td>
                      <td className="p-4">{t(row.hinweis)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm text-neutral-500">
              {t("[TODO: Methodik-Absatz — Datenbasis, Zeitraum, Anonymisierung. Ohne Methodik keine Publikation.]")}
            </p>
          </section>

          <section className="mt-10">
            <h2 className="text-2xl font-bold text-neutral-900">{t("Was die Zahlen bedeuten")}</h2>
            <p className="mt-2 text-neutral-600">{t("[TODO: Einordnung pro Ausstiegsweg, wann welcher Weg günstiger ist.]")}</p>
          </section>
        </div>
      </main>
    </>
  );
}

export const getStaticProps = staticI18nProps(["pages/leasingausstieg-kosten-daten"]);
