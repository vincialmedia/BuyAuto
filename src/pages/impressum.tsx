import Head from "next/head";
import Link from "next/link";

// Operator details mirror the "Verantwortliche Stelle" block in datenschutz.tsx
// — keep the two in sync. Gaps are marked visibly instead of guessed.
export default function Impressum() {
  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900">
      <Head>
        <title>Impressum | BuyAuto</title>
        <meta name="description" content="Impressum von BuyAuto – Betreiber, Adresse und Kontakt." />
      </Head>

      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-neutral-200">
          <h1 className="text-3xl font-bold mb-8 text-neutral-900">Impressum</h1>

          <div className="prose prose-neutral max-w-none">
            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-4">Betreiber der Website</h2>
              <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-100">
                <p className="font-medium">BuyAuto</p>
                <p>Vincent Hänggi</p>
                <p>Brandstrasse 21</p>
                <p>8952 Schlieren (Zürich)</p>
                <p>Schweiz</p>
              </div>
              <p className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                TODO: Rechtsform und – falls vorhanden – UID-Nummer ergänzen.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-4">Kontakt</h2>
              <p>
                E-Mail:{" "}
                <a href="mailto:hello@buyauto.ch" className="text-red-600 hover:underline">
                  hello@buyauto.ch
                </a>
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-4">Verantwortlich für den Inhalt</h2>
              <p>Vincent Hänggi</p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-4">Realisierung</h2>
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
              <h2 className="text-xl font-semibold mb-4">Rechtliche Hinweise</h2>
              <p>
                Angaben zum Datenschutz finden sich in der{" "}
                <Link href="/datenschutz" className="text-red-600 hover:underline">
                  Datenschutzerklärung
                </Link>
                , die Nutzungsbedingungen in den{" "}
                <Link href="/agb" className="text-red-600 hover:underline">
                  AGB
                </Link>
                .
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
