import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { PadkosSeo } from "@/components/padkos/PadkosSeo";
import { PadkosShell } from "@/components/padkos/PadkosShell";
import chrome from "@/components/padkos/PadkosChrome.module.css";
import shop from "@/components/padkos/PadkosShop.module.css";
import ui from "@/components/padkos/Padkos.module.css";
import { PADKOS } from "@/lib/padkos/routes";
import { padkosStore } from "@/lib/padkos/store";

type KontoTab = "orders" | "address" | "news";

const TABS: Array<{ key: KontoTab; label: string }> = [
  { key: "orders", label: "Bestellungen" },
  { key: "address", label: "Adresse & Daten" },
  { key: "news", label: "Newsletter" },
];

/**
 * Customer account — `Padkos Konto.dc.html`. Demo data (Anje's account) as
 * designed; real order history arrives with Supabase Auth.
 */
export default function PadkosKontoPage() {
  const [tab, setTab] = useState<KontoTab>("orders");
  const [news, setNews] = useState(true);
  const [reordered, setReordered] = useState(false);
  const reorderTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(reorderTimer.current), []);

  const reorder = () => {
    if (!reordered) {
      padkosStore.add("boerewors", 1);
      padkosStore.add("mrsballs", 1);
      padkosStore.add("ouma", 1);
      padkosStore.add("cremesoda", 2);
    }
    setReordered(true);
    clearTimeout(reorderTimer.current);
    reorderTimer.current = setTimeout(() => setReordered(false), 2200);
  };

  return (
    <PadkosShell>
      <PadkosSeo
        title="Mein Konto – Padkos"
        description="Deine Padkos-Bestellungen, Adressen und Newsletter-Einstellungen."
        path={PADKOS.konto}
        alwaysNoindex
      />

      <div className={chrome.pageBody}>
        <div className={shop.kontoHead}>
          <div>
            <h1 className={chrome.pageTitle}>Hallo, Anje!</h1>
            <p className={chrome.pageSub}>
              Schön, dass du wieder da bist. Dein letztes Packerl ist unterwegs.
            </p>
          </div>
          <Link href={PADKOS.login} className={shop.kontoLogout}>
            Abmelden →
          </Link>
        </div>

        <div className={chrome.chipRow}>
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              aria-pressed={tab === key}
              className={`${chrome.chip}${tab === key ? ` ${chrome.chipActive}` : ""}`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "orders" ? (
          <div className={shop.orderList}>
            <article className={shop.orderCard}>
              <div className={shop.orderCardHead}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <span className={shop.orderNr}>PK-73412</span>
                  <span className={shop.orderDate}>10. August 2026</span>
                </div>
                <span className={shop.orderStatus}>UNTERWEGS</span>
              </div>
              <p className={shop.orderItems}>1× Das Heimweh-Paket · 2× Biltong Original</p>
              <div className={shop.orderCardFoot}>
                <span className={shop.orderTotal}>€ 67,70 · Gratis-Versand</span>
                <div className={shop.orderLinks}>
                  <Link href={PADKOS.bestellung} className={shop.authLink}>
                    Details ansehen
                  </Link>
                  <Link href={PADKOS.versand} className={shop.authLink}>
                    Sendung verfolgen
                  </Link>
                </div>
              </div>
            </article>

            <article className={shop.orderCard}>
              <div className={shop.orderCardHead}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <span className={shop.orderNr}>PK-71006</span>
                  <span className={shop.orderDate}>14. Juli 2026</span>
                </div>
                <span className={`${shop.orderStatus} ${shop.orderStatusDone}`}>GELIEFERT</span>
              </div>
              <p className={shop.orderItems}>
                1× Boerewors · 1× Mrs Ball&apos;s Chutney · 1× Ouma Rusks · 2× Creme Soda
              </p>
              <div className={shop.orderCardFoot}>
                <span className={shop.orderTotal}>€ 32,30 · Versand € 8,80</span>
                <button
                  type="button"
                  onClick={reorder}
                  className={`${ui.btn} ${ui.btnGreen} ${ui.shadowSm}`}
                  style={{ minHeight: 42, padding: "0 18px", fontSize: 13, borderRadius: 8 }}
                >
                  <span aria-live="polite">{reordered ? "✓ Im Warenkorb" : "Nochmal bestellen"}</span>
                </button>
              </div>
            </article>
          </div>
        ) : null}

        {tab === "address" ? (
          <div className={shop.kontoGrid}>
            <article className={shop.kontoCard}>
              <div className={shop.kontoCardHead}>
                <h2 className={shop.kontoCardTitle}>Lieferadresse</h2>
                <span className={shop.kontoTag}>STANDARD</span>
              </div>
              <p className={shop.kontoCardText}>
                Anje van der Merwe
                <br />
                Neubaugasse 12/4
                <br />
                1070 Wien · Österreich
              </p>
              <button type="button" className={shop.kontoButton}>
                Bearbeiten
              </button>
            </article>
            <article className={shop.kontoCard}>
              <h2 className={shop.kontoCardTitle}>Kontodaten</h2>
              <p className={shop.kontoCardText}>
                anje@example.at
                <br />
                Passwort: ••••••••
              </p>
              <button type="button" className={shop.kontoButton}>
                Bearbeiten
              </button>
            </article>
          </div>
        ) : null}

        {tab === "news" ? (
          <div className={shop.newsPanel}>
            <h2>Newsletter</h2>
            <p>
              Du bekommst unseren Newsletter an <strong>anje@example.at</strong> – Neuigkeiten
              aus dem Padstal, neue Produkte, Rezepte.
            </p>
            <label className={shop.newsToggle}>
              <input type="checkbox" checked={news} onChange={() => setNews((n) => !n)} />
              <span>{news ? "Newsletter abonniert" : "Newsletter pausiert"}</span>
            </label>
          </div>
        ) : null}

        <div className={shop.hintStrip} style={{ marginTop: "clamp(24px, 4vw, 36px)" }}>
          <p>
            <strong>♥ Deine Merkliste</strong> — gemerkte Produkte findest du auf einer eigenen
            Seite.
          </p>
          <Link href={PADKOS.merkliste} className={shop.hintLink}>
            Zur Merkliste →
          </Link>
        </div>
      </div>
    </PadkosShell>
  );
}
