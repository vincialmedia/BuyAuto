import Link from "next/link";
import { useState } from "react";

import { PadkosSeo } from "@/components/padkos/PadkosSeo";
import { PadkosShell } from "@/components/padkos/PadkosShell";
import shop from "@/components/padkos/PadkosShop.module.css";
import ui from "@/components/padkos/Padkos.module.css";
import { fmtEUR } from "@/lib/padkos/catalog";
import { PADKOS } from "@/lib/padkos/routes";

type OrderStatus = "Neu" | "Verpackt" | "Unterwegs" | "Geliefert";

interface DashOrder {
  nr: string;
  kunde: string;
  ort: string;
  zeit: string;
  artikel: string;
  total: number;
  status: OrderStatus;
  cooled: boolean;
}

const INITIAL_ORDERS: DashOrder[] = [
  { nr: "PK-73415", kunde: "Lena Hofer", ort: "Salzburg", zeit: "09:41", artikel: "1× Heimweh-Paket, 1× Rooibos", total: 57.8, status: "Neu", cooled: false },
  { nr: "PK-73414", kunde: "Johan Pretorius", ort: "Wien", zeit: "08:57", artikel: "2× Boerewors, 1× Braai-Gewürz", total: 32.3, status: "Neu", cooled: true },
  { nr: "PK-73413", kunde: "Sarah Gruber", ort: "Graz", zeit: "08:12", artikel: "1× Biltong Chili, 2× Fizzers", total: 15.0, status: "Neu", cooled: false },
  { nr: "PK-73412", kunde: "Anje van der Merwe", ort: "Wien", zeit: "gestern", artikel: "1× Heimweh-Paket, 2× Biltong", total: 67.7, status: "Verpackt", cooled: false },
  { nr: "PK-73411", kunde: "Markus Steiner", ort: "Linz", zeit: "gestern", artikel: "1× Boerewors, 1× Mrs Ball’s", total: 20.4, status: "Verpackt", cooled: true },
  { nr: "PK-73410", kunde: "Thabo Nkosi", ort: "Innsbruck", zeit: "gestern", artikel: "3× Chappies, 2× NikNaks", total: 24.7, status: "Unterwegs", cooled: false },
  { nr: "PK-73409", kunde: "Julia Berger", ort: "Wien", zeit: "So., 9.8.", artikel: "1× Amarula, 1× Ouma Rusks", total: 26.8, status: "Geliefert", cooled: false },
];

const FILTERS = [
  { key: "alle", label: "Alle" },
  { key: "Neu", label: "Neu" },
  { key: "Verpackt", label: "Verpackt" },
  { key: "Unterwegs", label: "Unterwegs" },
  { key: "kuehl", label: "❄ Kühl" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

const PILL_CLASS: Record<OrderStatus, string> = {
  Neu: shop.pillNeu,
  Verpackt: shop.pillVerpackt,
  Unterwegs: shop.pillUnterwegs,
  Geliefert: shop.pillGeliefert,
};

const CHART_VALUES = [186, 220, 168, 305, 142, 391, 264, 212, 247, 298, 176, 486, 233, 312];
const CHART_DAYS = ["29.7.", "30.7.", "31.7.", "1.8.", "2.8.", "3.8.", "4.8.", "5.8.", "6.8.", "7.8.", "8.8.", "9.8.", "10.8.", "heute"];

const STOCK: Array<[string, number, number]> = [
  ["Biltong Original", 34, 60],
  ["Boerewors (TK)", 6, 40],
  ["Heimweh-Paket", 11, 25],
  ["Mrs Ball’s Chutney", 42, 60],
  ["Chappies", 8, 50],
  ["Creme Soda", 56, 72],
];

const REGULARS = [
  { initial: "A", name: "Anje van der Merwe", meta: "Wien · 7 Bestellungen", total: "€ 402" },
  { initial: "J", name: "Johan Pretorius", meta: "Wien · 5 Bestellungen", total: "€ 356" },
  { initial: "S", name: "Sarah Gruber", meta: "Graz · 4 Bestellungen", total: "€ 219" },
  { initial: "M", name: "Markus Steiner", meta: "Linz · 3 Bestellungen", total: "€ 187" },
];

/**
 * Merchant backoffice — `Padkos Dashboard.dc.html`. A working demo on the
 * design's sample data: order filters and the Packen/Versenden actions advance
 * real state. Auth + live data arrive with Supabase (service role); until then
 * the footer links here as "Händler-Login (Dashboard)".
 */
export default function PadkosDashboardPage() {
  const [filter, setFilter] = useState<FilterKey>("alle");
  const [orders, setOrders] = useState(INITIAL_ORDERS);

  const advance = (nr: string, to: OrderStatus) =>
    setOrders((prev) => prev.map((o) => (o.nr === nr ? { ...o, status: to } : o)));

  const visible = orders.filter((o) => {
    if (filter === "alle") return true;
    if (filter === "kuehl") return o.cooled;
    return o.status === filter;
  });

  const open = orders.filter((o) => o.status === "Neu" || o.status === "Verpackt");
  const cooledToday = open.filter((o) => o.cooled).length;
  const chartMax = Math.max(...CHART_VALUES);

  return (
    <PadkosShell header="none" footer={false} bodyBackground="#F7EEDB">
      <PadkosSeo
        title="Dashboard – Padkos Backoffice"
        description="Padkos Backoffice: Bestellungen, Umsatz, Lager und Kühlversand-Planung."
        path={PADKOS.dashboard}
        alwaysNoindex
      />

      {/* Backoffice header — dark, its own beast (design). */}
      <header className={shop.dashHeader}>
        <div className={shop.dashHeaderInner}>
          <div className={shop.dashBrand}>
            <span className={shop.dashWordmark}>PADKOS</span>
            <span className={shop.dashBrandSub}>BACKOFFICE</span>
          </div>
          <div className={shop.dashHeaderRight}>
            <Link href={PADKOS.shop} className={shop.dashShopLink}>
              Zum Shop →
            </Link>
            <span aria-label="Angemeldet als Retha" className={shop.dashAvatar}>
              R
            </span>
          </div>
        </div>
      </header>

      <div className={shop.dashBody}>
        <div className={shop.dashHead}>
          <h1 className={shop.dashTitle}>Good morning, Retha!</h1>
          <p className={shop.dashDate}>Dienstag, 11. August 2026 · Kühlversand-Tag ❄</p>
        </div>

        {/* -------------------------------------------------------- stats */}
        <div className={shop.statGrid}>
          <div className={shop.statCard}>
            <p className={shop.statLabel}>UMSATZ HEUTE</p>
            <p className={`${shop.statValue} ${shop.statGreen}`}>€ 312,40</p>
            <p className={shop.statHint} style={{ color: "#5C4C36" }}>
              +22 % vs. letzter Dienstag
            </p>
          </div>
          <div className={shop.statCard}>
            <p className={shop.statLabel}>UMSATZ AUGUST</p>
            <p className={shop.statValue}>€ 4.180</p>
            <p className={shop.statHint} style={{ color: "#5C4C36" }}>
              Ziel € 9.000 · 46 %
            </p>
          </div>
          <div className={shop.statCard}>
            <p className={shop.statLabel}>OFFENE BESTELLUNGEN</p>
            <p className={`${shop.statValue} ${shop.statRed}`}>{open.length}</p>
            <p className={shop.statHint} style={{ color: "#5C4C36" }}>
              {cooledToday} davon gekühlt (heute raus!)
            </p>
          </div>
          <div className={shop.statCard}>
            <p className={shop.statLabel}>Ø WARENKORB</p>
            <p className={shop.statValue}>€ 41,20</p>
            <p className={shop.statHint} style={{ color: "#5C4C36" }}>
              62 % erreichen Gratis-Versand
            </p>
          </div>
        </div>

        {/* ------------------------------------------------------- orders */}
        <section className={shop.dashSection}>
          <div className={shop.dashSectionHead}>
            <h2 className={shop.dashSectionTitle}>Bestellungen</h2>
            <div className={shop.dashChips}>
              {FILTERS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  aria-pressed={filter === key}
                  className={`${shop.dashChip}${filter === key ? ` ${shop.dashChipActive}` : ""}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className={shop.orderScroll}>
            <div className={shop.orderTable}>
              <div className={shop.orderHead}>
                <span>NR.</span>
                <span>KUND:IN</span>
                <span>ARTIKEL</span>
                <span>SUMME</span>
                <span>STATUS</span>
                <span />
              </div>
              {visible.map((o) => (
                <div key={o.nr} className={shop.orderRow}>
                  <span className={shop.orderRowNr}>{o.nr}</span>
                  <span className={shop.orderRowCustomer}>
                    {o.kunde}
                    <span className={shop.orderRowMeta}>
                      {o.ort} · {o.zeit}
                    </span>
                  </span>
                  <span className={shop.orderRowItems}>
                    {o.artikel}
                    {o.cooled ? <span className={shop.coolChip}>❄ KÜHL</span> : null}
                  </span>
                  <span className={shop.orderRowTotal}>{fmtEUR(o.total)}</span>
                  <span>
                    <span className={`${shop.pill} ${PILL_CLASS[o.status]}`}>{o.status}</span>
                  </span>
                  <span>
                    {o.status === "Neu" ? (
                      <button
                        type="button"
                        onClick={() => advance(o.nr, "Verpackt")}
                        className={`${shop.dashAction} ${shop.dashActionGreen}`}
                      >
                        Packen ✓
                      </button>
                    ) : o.status === "Verpackt" ? (
                      <button
                        type="button"
                        onClick={() => advance(o.nr, "Unterwegs")}
                        className={`${shop.dashAction} ${shop.dashActionGold}`}
                      >
                        Versenden
                      </button>
                    ) : null}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className={shop.dashPanelGrid}>
          {/* ------------------------------------------------------ chart */}
          <section className={shop.dashSection} style={{ marginTop: 0 }}>
            <h2 className={shop.dashSectionTitle}>Umsatz · letzte 14 Tage</h2>
            <div
              className={shop.chart}
              role="img"
              aria-label="Balkendiagramm der Tagesumsätze der letzten 14 Tage"
            >
              {CHART_VALUES.map((v, i) => (
                <span
                  key={CHART_DAYS[i]}
                  title={`${CHART_DAYS[i]} · € ${v}`}
                  className={`${shop.chartBar}${i === CHART_VALUES.length - 1 ? ` ${shop.chartBarToday}` : ""}`}
                  style={{ height: `${Math.round((v / chartMax) * 100)}%` }}
                />
              ))}
            </div>
            <div className={shop.chartAxis}>
              <span>29. Juli</span>
              <span>heute</span>
            </div>
            <p className={shop.chartNote}>
              Bester Tag: <strong>Sa, 9. August (€ 486)</strong> – Heimweh-Pakete nach dem
              Newsletter.
            </p>
          </section>

          {/* ------------------------------------------------------ stock */}
          <section className={shop.dashSection} style={{ marginTop: 0 }}>
            <div className={shop.dashSectionHead}>
              <h2 className={shop.dashSectionTitle}>Lagerbestand</h2>
              <span className={shop.lowBadge}>2 KNAPP</span>
            </div>
            <div style={{ marginTop: 8 }}>
              {STOCK.map(([name, n, max]) => {
                const low = n < 10;
                return (
                  <div key={name} className={shop.stockRow}>
                    <span className={shop.stockName}>{name}</span>
                    <span className={shop.stockTrack}>
                      <span
                        style={{
                          width: `${Math.round((n / max) * 100)}%`,
                          background: low ? "#C43A26" : "#007A4D",
                        }}
                      />
                    </span>
                    <span className={`${shop.stockCount}${low ? ` ${shop.stockCountLow}` : ""}`}>
                      {low ? `${n} Stk. · knapp!` : `${n} Stk.`}
                    </span>
                  </div>
                );
              })}
            </div>
            <button type="button" className={shop.dashGhostButton}>
              Nachbestellung planen
            </button>
          </section>

          {/* ----------------------------------------------- cool planner */}
          <section className={shop.coolPlanner}>
            <h2>❄ Kühlversand-Planer</h2>
            <p className={shop.coolPlannerSub}>
              Boerewors &amp; Co. gehen nur Mo–Mi raus – nie übers Wochenende.
            </p>
            <div className={shop.weekGrid}>
              <div className={shop.dayCell}>
                <span className={shop.dayLabel}>MO 10.</span>
                <span className={shop.dayCount}>2</span>
                <span className={`${shop.dayState} ${shop.dayStateOut}`}>✓ RAUS</span>
              </div>
              <div className={`${shop.dayCell} ${shop.dayCellToday}`}>
                <span className={shop.dayLabel}>DI 11.</span>
                <span className={shop.dayCount}>{cooledToday}</span>
                <span className={shop.dayState}>HEUTE</span>
              </div>
              <div className={shop.dayCell}>
                <span className={shop.dayLabel}>MI 12.</span>
                <span className={shop.dayCount}>1</span>
                <span className={shop.dayState}>GEPLANT</span>
              </div>
              {["DO 13.", "FR 14.", "SA 15.", "SO 16."].map((day) => (
                <div key={day} className={`${shop.dayCell} ${shop.dayCellOff}`}>
                  <span className={shop.dayLabel}>{day}</span>
                  <span className={shop.dayDash}>–</span>
                </div>
              ))}
            </div>
            <p className={shop.coolPlannerNote}>
              <strong>{cooledToday} Kühl-Packerl heute:</strong> bis 14:00 zur Post, sonst
              wandern sie auf morgen.
            </p>
          </section>

          {/* --------------------------------------------------- regulars */}
          <section className={shop.dashSection} style={{ marginTop: 0 }}>
            <h2 className={shop.dashSectionTitle}>Stammkund:innen</h2>
            <div style={{ marginTop: 8 }}>
              {REGULARS.map((r) => (
                <div key={r.name} className={shop.regularRow}>
                  <span aria-hidden="true" className={shop.regularAvatar}>
                    {r.initial}
                  </span>
                  <span className={shop.regularName}>
                    {r.name}
                    <span className={shop.regularMeta}>{r.meta}</span>
                  </span>
                  <span className={shop.regularTotal}>{r.total}</span>
                </div>
              ))}
            </div>
            <div className={shop.newsStat}>
              <div>
                <p className={shop.newsStatLabel}>NEWSLETTER</p>
                <p className={shop.newsStatValue}>
                  <strong className={shop.newsStatBig}>214</strong> Abos ·{" "}
                  <strong className={shop.newsStatPlus}>+18</strong> diese Woche
                </p>
              </div>
              <span className={shop.codeBadge}>WELKOM10 · 31× eingelöst</span>
            </div>
          </section>
        </div>

        <p className={shop.dashNote}>
          Demo-Backoffice mit Beispieldaten – echte Bestellungen und Login kommen mit Supabase
          (siehe supabase/padkos/README.md).
        </p>
      </div>

      <div aria-hidden="true" className={ui.flagRule} />
    </PadkosShell>
  );
}
