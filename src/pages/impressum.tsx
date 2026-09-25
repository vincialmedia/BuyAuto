import Head from "next/head";
import Link from "next/link";
import { T, useLocale, useT } from "@/i18n/runtime";
import { staticI18nProps } from "@/i18n/server";

// Operator details mirror the "Verantwortliche Stelle" block in datenschutz.tsx
// — keep the two in sync. Gaps are marked visibly instead of guessed.
export default function Impressum() {
  const t = useT();
  const locale = useLocale();
  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900">
      <Head>
        <title>{t("Impressum | BuyAuto")}</title>
        <meta name="description" content={t("Impressum von BuyAuto – Betreiber, Adresse und Kontakt.")} />
      </Head>

      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-neutral-200">
          <h1 className="text-3xl font-bold mb-8 text-neutral-900">{t("Impressum")}</h1>

          <div className="prose prose-neutral max-w-none">
            {locale !== "de" && (
              <p className="mb-6 text-sm text-neutral-600 bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                {t("Diese Übersetzung dient nur zur Information. Massgebend ist ausschliesslich die deutsche Fassung.")}
              </p>
            )}
            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-4">{t("Betreiber der Website")}</h2>
              <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-100">
                <p className="font-medium">BuyAuto</p>
                <p>Vincent Hänggi</p>
                <p>Brandstrasse 21</p>
                <p>8952 Schlieren (Zürich)</p>
                <p>{t("Schweiz")}</p>
              </div>
              <p className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                {t("TODO: Rechtsform und – falls vorhanden – UID-Nummer ergänzen.")}
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-4">{t("Kontakt")}</h2>
              <p>
                {t("E-Mail:")}{" "}
                <a href="mailto:hello@buyauto.ch" className="text-red-600 hover:underline">
                  hello@buyauto.ch
                </a>
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-4">{t("Verantwortlich für den Inhalt")}</h2>
              <p>Vincent Hänggi</p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-4">{t("Realisierung")}</h2>
              <p>
                <a
                  href="https://www.vincialmedia.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-600 hover:underline"
                >
                  A VincialMedia Website
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">{t("Rechtliche Hinweise")}</h2>
              <p>
                <T
                  k="Angaben zum Datenschutz finden sich in der <0>Datenschutzerklärung</0>, die Nutzungsbedingungen in den <1>AGB</1>."
                  c={[
                    <Link key="datenschutz" href="/datenschutz" className="text-red-600 hover:underline" />,
                    <Link key="agb" href="/agb" className="text-red-600 hover:underline" />,
                  ]}
                />
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export const getStaticProps = staticI18nProps(["pages/impressum"]);
