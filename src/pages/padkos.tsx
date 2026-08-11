import Head from "next/head";
import { Karla, Ultra } from "next/font/google";

import { PadkosLanding } from "@/components/padkos/PadkosLanding";

// Ultra ships a single 400 weight; Karla is variable and is used in italic for
// the pull quotes and the founder's signature.
const ultra = Ultra({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-ultra",
  display: "swap",
});

const karla = Karla({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-karla",
  display: "swap",
});

/**
 * Padkos — "Padstal Heritage" desktop landing page.
 *
 * Padkos is a separate brand from BuyAuto and this page shares none of its
 * chrome: MainLayout gives /padkos the same standalone carve-out as /embed, so
 * there is no BuyAuto header, footer or cookie banner around it.
 *
 * It is also kept out of search results while it lives in this repo — its title
 * and copy are about South African groceries in Vienna and would only muddy
 * BuyAuto's search presence. Drop the robots tag when Padkos moves to its own
 * domain.
 */
export default function PadkosPage() {
  return (
    <>
      <Head>
        <title>
          Padkos – South African Shop Vienna | Südafrikanische Lebensmittel Österreich
        </title>
        <meta
          name="description"
          content="Der Padstal für Österreich: Biltong, Mrs Ball's Chutney, Ouma Rusks, Chappies & Heimweh-Pakete. Südafrikanische Lebensmittel direkt importiert – Biltong kaufen in Wien, Versand österreichweit."
        />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      {/* The design paints the area behind the page a shade darker than the
          page itself, which shows on overscroll. styled-jsx removes this rule
          again when the route unmounts, so it cannot leak into BuyAuto. */}
      <style jsx global>{`
        body {
          background: #e3d4b2;
        }
      `}</style>

      <div className={`${ultra.variable} ${karla.variable}`}>
        <PadkosLanding />
      </div>
    </>
  );
}
