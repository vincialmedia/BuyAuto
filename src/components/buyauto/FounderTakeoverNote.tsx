import { FOUNDER_TAKEOVER } from "@/lib/buyauto/facts";
import { formatChf } from "@/lib/buyauto/format";

/**
 * The founder's own Leasingübernahme (F8), in the only wordings the site uses.
 * It is Vince's experience from 2024, before BuyAuto existed: never a BuyAuto
 * case, customer story or testimonial. Not known and therefore never stated:
 * how he found the taker, how long it took, which documents were needed.
 */
const F = FOUNDER_TAKEOVER;
const EXIT_COST = formatChf(F.exitCostApproxChf); // "CHF 20'000"
const FEE = formatChf(F.takeoverFeeChf); // "CHF 550"

/** Third person, three sentences (guide, cost page, BMW brand page). */
export const FOUNDER_TAKEOVER_TEXT =
  `${F.person} hatte ${F.year} einen ${F.car} geleast, mit noch rund ${F.monthsLeftApprox} Monaten Restlaufzeit. ` +
  `Rauskaufen oder auflösen und verkaufen hätte ihn rund ${EXIT_COST} gekostet, so gross war die Lücke zwischen ` +
  `seiner offenen Schuld und dem Wert des Autos. Er gab den Vertrag per Leasingübernahme ab und bezahlte der ` +
  `Leasinggesellschaft von BMW als bisheriger Leasingnehmer die volle Gebühr von ${FEE}, bevor es BuyAuto gab.`;

export function FounderTakeoverNote({
  variant = "inline",
  className = "",
}: {
  /** inline: label + text as one paragraph. box: the exit-page example box with both outcomes side by side. */
  variant?: "inline" | "box";
  className?: string;
}) {
  if (variant === "box") {
    return (
      <figure className={`rounded-2xl border border-neutral-200 bg-white p-5 ${className}`}>
        <figcaption className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Beispiel: {F.label}
        </figcaption>
        <p className="mt-2 text-sm text-neutral-700">
          {F.car}, {F.year}, noch rund {F.monthsLeftApprox} Monate Restlaufzeit.
        </p>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-neutral-50 p-3">
            <dt className="text-neutral-500">Rauskaufen und verkaufen</dt>
            <dd className="text-lg font-bold text-neutral-900">rund {EXIT_COST}</dd>
          </div>
          <div className="rounded-xl bg-neutral-50 p-3">
            <dt className="text-neutral-500">Leasingübernahme</dt>
            <dd className="text-lg font-bold text-neutral-900">{FEE}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-neutral-500">
          {F.person} hat das {F.year} selbst erlebt, bevor es BuyAuto gab. Die {FEE} verlangte die
          Leasinggesellschaft von BMW; er bezahlte sie als bisheriger Leasingnehmer.
        </p>
      </figure>
    );
  }

  return (
    <div className={className}>
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{F.label}</p>
      <p className="mt-1">{FOUNDER_TAKEOVER_TEXT}</p>
    </div>
  );
}
