import type { GetServerSideProps } from "next";
import Link from "next/link";

import { PadkosSeo } from "@/components/padkos/PadkosSeo";
import { PadkosShell } from "@/components/padkos/PadkosShell";
import shop from "@/components/padkos/PadkosShop.module.css";
import { PADKOS } from "@/lib/padkos/routes";

/**
 * Padkos-branded 404 for any unknown /padkos/* path — `Padkos 404.dc.html`:
 * a broken-down taxi on the green, with smoke and a hoisted warning triangle.
 * Served with a real 404 status so crawlers don't index dead paths.
 */
export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.statusCode = 404;
  return { props: {} };
};

export default function PadkosNotFoundPage() {
  return (
    <PadkosShell header="none" footer={false} bodyBackground="#007A4D">
      <PadkosSeo
        title="404 – Padkos | Seite nicht gefunden"
        description="Diese Seite ist stehengeblieben oder umgezogen."
        path={PADKOS.home}
        alwaysNoindex
      />

      <div className={shop.notFoundMain}>
        <div aria-hidden="true" className={shop.notFoundLane} style={{ top: "30%" }} />
        <div aria-hidden="true" className={shop.notFoundLane} style={{ top: "72%" }} />

        <div className={shop.notFoundContent}>
          <p className={shop.notFoundCode}>404</p>

          <div aria-hidden="true" className={shop.notFoundScene}>
            <div className={shop.notFoundWobble}>
              {/* The fleet taxi, broken down: flat rear wheel, blinking light. */}
              <svg width="150" height="82" viewBox="0 0 92 50" style={{ display: "block" }}>
                <path
                  d="M5 40 L5 20 Q5 12 13 12 L56 12 Q68 12 76 17 L83 24 Q87 28 87 33 L87 40 Z"
                  fill="#F7EEDB"
                  stroke="#382A1C"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
                <rect x="7" y="29" width="78" height="4" fill="#FFB612" />
                <rect x="7" y="33" width="78" height="3" fill="#007A4D" />
                <rect x="10" y="16" width="13" height="9" rx="1.5" fill="#BFD9D2" stroke="#382A1C" strokeWidth="1.5" />
                <rect x="27" y="16" width="13" height="9" rx="1.5" fill="#BFD9D2" stroke="#382A1C" strokeWidth="1.5" />
                <rect x="44" y="16" width="12" height="9" rx="1.5" fill="#BFD9D2" stroke="#382A1C" strokeWidth="1.5" />
                <path
                  d="M60 16 L68 16 Q74 18 79 24 L60 25 Z"
                  fill="#BFD9D2"
                  stroke="#382A1C"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <rect x="83" y="26" width="4" height="4" rx="1" fill="#FFB612" className={shop.notFoundBlink} />
                <circle cx="23" cy="41" r="7" fill="#2A2119" stroke="#382A1C" strokeWidth="2" />
                <circle cx="23" cy="41" r="2.5" fill="#F7EEDB" />
                <circle cx="70" cy="43.5" r="4.5" fill="#2A2119" stroke="#382A1C" strokeWidth="2" />
                <path d="M63 47 L77 47" stroke="#382A1C" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <span
              className={shop.smoke}
              style={{ top: -6, right: -4, width: 10, height: 10, background: "rgba(247,238,219,.9)" }}
            />
            <span
              className={shop.smoke}
              style={{ top: -2, right: 6, width: 7, height: 7, background: "rgba(247,238,219,.7)", animationDelay: ".55s" }}
            />
            <span
              className={shop.smoke}
              style={{ top: 2, right: -10, width: 8, height: 8, background: "rgba(247,238,219,.8)", animationDelay: "1.05s" }}
            />
            {/* Warning triangle set out behind the taxi. */}
            <span
              style={{
                position: "absolute",
                bottom: -4,
                left: -34,
                width: 0,
                height: 0,
                borderLeft: "13px solid transparent",
                borderRight: "13px solid transparent",
                borderBottom: "22px solid #DE3831",
                transform: "rotate(-6deg)",
              }}
            />
            <span
              style={{
                position: "absolute",
                bottom: 1,
                left: -27,
                width: 0,
                height: 0,
                borderLeft: "6px solid transparent",
                borderRight: "6px solid transparent",
                borderBottom: "11px solid #FFB612",
                transform: "rotate(-6deg)",
              }}
            />
          </div>

          <h1 className={shop.notFoundTitle}>Oh no! This taxi has broken down.</h1>
          <p className={shop.notFoundText}>
            Die Seite, die du suchst, ist stehengeblieben oder umgezogen. Steig um – der Rest vom
            Laden fährt wie gewohnt.
          </p>

          <div className={shop.notFoundActions}>
            <Link href={PADKOS.home} className={`${shop.notFoundButton} ${shop.notFoundButtonGold}`}>
              Zur Startseite
            </Link>
            <Link href={PADKOS.shop} className={`${shop.notFoundButton} ${shop.notFoundButtonPaper}`}>
              In den Laden
            </Link>
          </div>

          <p className={shop.notFoundFoot}>Don&apos;t worry – dein Warenkorb ist noch da.</p>
        </div>
      </div>
    </PadkosShell>
  );
}
