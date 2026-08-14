import Head from "next/head";

/**
 * What an embed renders when the garage's package does not include the
 * website tools. Server-side counterpart of the dashboard's "Website-Tools ab
 * Growth" lock — without it the fence was UI-only and the iframe worked for
 * every plan (and for anyone who typed the public slug into the URL).
 */
export function EmbedLockedNotice({ garageName }: { garageName?: string | null }) {
  return (
    <>
      <Head>
        <title>Website-Tools nicht aktiv</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <main className="min-h-[200px] bg-white">
        <div className="mx-auto max-w-xl px-4 py-10 text-center">
          <p className="text-sm font-semibold text-neutral-900">
            Website-Tools sind nicht aktiv
          </p>
          <p className="mt-2 text-sm text-neutral-600">
            {garageName ? `${garageName} nutzt` : "Diese Garage nutzt"} zurzeit
            kein BuyAuto-Paket mit Website-Tools. Das Widget ist ab dem
            Growth-Paket verfügbar.
          </p>
          <p className="mt-3 text-xs text-neutral-400">
            <a
              href="https://www.buyauto.ch/preise?type=garage"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-neutral-600"
            >
              Pakete ansehen auf buyauto.ch
            </a>
          </p>
        </div>
      </main>
    </>
  );
}
