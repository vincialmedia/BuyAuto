import { Karla, Ultra } from "next/font/google";
import type { ReactNode } from "react";

import { PadkosFooter } from "./PadkosFooter";
import { PadkosHeader } from "./PadkosHeader";
import chrome from "./PadkosChrome.module.css";
import ui from "./Padkos.module.css";

// Ultra ships a single 400 weight; Karla is variable and used in italic for
// pull quotes and signatures. Loaded once here for every Padkos page.
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

interface PadkosShellProps {
  children: ReactNode;
  /** Header nav style: section anchors on landings, routes everywhere else. */
  header?: "shop" | "landing" | "none";
  lang?: "de" | "en";
  /** The 404 page paints its own full-screen green scene without chrome. */
  footer?: boolean;
  /** Darker paper behind the page, visible on overscroll (design spec). */
  bodyBackground?: string;
  /** Extra class on the <main> wrapper (the landing adds sticky-bar padding). */
  mainClassName?: string;
}

/**
 * The wrapper every Padkos page renders into: fonts, colour tokens (.root),
 * header and footer. MainLayout already strips all BuyAuto chrome from
 * /padkos/* routes, so this shell is the entire chrome.
 */
export function PadkosShell({
  children,
  header = "shop",
  lang = "de",
  footer = true,
  bodyBackground = "#E3D4B2",
  mainClassName,
}: PadkosShellProps) {
  return (
    <>
      <style jsx global>{`
        body {
          background: ${bodyBackground};
        }
      `}</style>
      <div className={`${ultra.variable} ${karla.variable} ${ui.root}`}>
        <main className={`${chrome.pageMain}${mainClassName ? ` ${mainClassName}` : ""}`}>
          <div aria-hidden="true" className={ui.flagRule} />
          {header !== "none" ? <PadkosHeader variant={header} lang={lang} /> : null}
          {children}
          {footer ? <PadkosFooter lang={lang} /> : null}
        </main>
      </div>
    </>
  );
}
