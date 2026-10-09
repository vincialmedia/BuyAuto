import Link from "next/link";
import { useId, useState, type ReactNode } from "react";
import { computeExitOptions, parseChfInput, type ExitLenderKey } from "@/lib/buyauto/exitCalculator";
import {
  amountInputError,
  describeBuyoutAndSell,
  describeEarlyTermination,
  describeTakeover,
  ESTIMATE_LABEL,
  LENDER_OPTIONS,
  PLAN_KEYS,
  planOptionLabel,
  type ExitResultView,
} from "@/lib/buyauto/exitCalculatorText";
import type { Plan } from "@/lib/buyauto/stripe_config";
import { SourceCitation } from "@/components/buyauto/SourceCitation";

/**
 * Ausstiegsrechner for /leasing-abgeben-schweiz. All arithmetic lives in
 * src/lib/buyauto/exitCalculator.ts, all wording in exitCalculatorText.ts.
 * The form and the three "what is missing" states render on the server; the
 * amounts appear once the visitor enters them. No field has a default amount.
 */

const FIELD_CLASS =
  "block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-base text-neutral-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 md:text-sm";

function AmountField({
  id,
  label,
  hint,
  value,
  onChange,
}: {
  id: string;
  label: string;
  hint: ReactNode;
  value: string;
  onChange: (value: string) => void;
}) {
  const error = amountInputError(value);
  const hintId = `${id}-hint`;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-neutral-800">
        {label} <span className="font-normal text-neutral-500">(optional)</span>
      </label>
      <div className="relative mt-1.5">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-neutral-500">
          CHF
        </span>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={hintId}
          aria-invalid={error ? true : undefined}
          className={`${FIELD_CLASS} pl-12`}
        />
      </div>
      <p id={hintId} className={`mt-1 text-xs ${error ? "text-red-600" : "text-neutral-500"}`}>
        {error ?? hint}
      </p>
    </div>
  );
}

function ResultCard({ title, view }: { title: string; view: ExitResultView }) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        view.kind === "missing" ? "border-dashed border-neutral-300 bg-neutral-50" : "border-neutral-200 bg-white"
      }`}
    >
      <p className="text-sm font-bold text-neutral-900">{title}</p>
      {view.kind === "missing" ? (
        <p className="mt-2 text-sm text-neutral-600">{view.headline}</p>
      ) : (
        <>
          {view.caption ? <p className="mt-2 text-xs text-neutral-500">{view.caption}</p> : null}
          <p
            className={`font-black text-neutral-900 ${
              view.kind === "amount" ? "text-2xl" : "mt-2 text-lg leading-snug"
            }`}
          >
            {view.headline}
          </p>
          <ul className="mt-2 space-y-1.5 text-xs text-neutral-600">
            {view.lines.map((line) => (
              <li key={line.text}>
                {line.text}
                {line.source ? (
                  <>
                    {" "}
                    <SourceCitation source={line.source} className="text-neutral-500" />
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export function ExitCalculator({ footer }: { footer?: ReactNode }) {
  const baseId = useId();
  const [lender, setLender] = useState<ExitLenderKey | "">("");
  const [plan, setPlan] = useState<Plan>("standard");
  const [termination, setTermination] = useState("");
  const [buyout, setBuyout] = useState("");
  const [vehicleValue, setVehicleValue] = useState("");

  const buyoutChf = parseChfInput(buyout);
  const vehicleValueChf = parseChfInput(vehicleValue);
  const result = computeExitOptions({
    lender: lender === "" ? null : lender,
    terminationPaymentChf: parseChfInput(termination),
    buyoutAmountChf: buyoutChf,
    vehicleValueChf,
    plan,
  });

  const lenderId = `${baseId}-lender`;
  const planId = `${baseId}-plan`;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
      <form noValidate onSubmit={(e) => e.preventDefault()} aria-label="Ausstiegsrechner">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={lenderId} className="block text-sm font-semibold text-neutral-800">
              Leasinggesellschaft
            </label>
            <select
              id={lenderId}
              value={lender}
              onChange={(e) => setLender(e.target.value as ExitLenderKey | "")}
              className={`${FIELD_CLASS} mt-1.5`}
            >
              <option value="">Bitte wählen</option>
              {LENDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <AmountField
            id={`${baseId}-termination`}
            label="Nachzahlung laut Auflösungsofferte"
            hint="Steht in der Auflösungsofferte deiner Leasinggesellschaft."
            value={termination}
            onChange={setTermination}
          />

          <AmountField
            id={`${baseId}-buyout`}
            label="Ablösesumme fürs Rauskaufen"
            hint="Nennt dir deine Leasinggesellschaft auf Anfrage."
            value={buyout}
            onChange={setBuyout}
          />

          <AmountField
            id={`${baseId}-value`}
            label="Fahrzeugwert"
            hint={
              <>
                Schätz ihn mit dem{" "}
                <Link href="/eintauschwert-rechner" className="font-semibold text-primary hover:underline">
                  Eintauschwert-Rechner
                </Link>
                .
              </>
            }
            value={vehicleValue}
            onChange={setVehicleValue}
          />

          <div className="sm:col-span-2">
            <label htmlFor={planId} className="block text-sm font-semibold text-neutral-800">
              Paket für dein Inserat auf BuyAuto
            </label>
            <select
              id={planId}
              value={plan}
              onChange={(e) => setPlan(e.target.value as Plan)}
              className={`${FIELD_CLASS} mt-1.5 sm:max-w-sm`}
            >
              {PLAN_KEYS.map((key) => (
                <option key={key} value={key}>
                  {planOptionLabel(key)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </form>

      <div className="mt-6" aria-live="polite">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{ESTIMATE_LABEL}</p>
        <div className="mt-2 grid gap-3 md:grid-cols-3">
          <ResultCard title="Leasingübernahme" view={describeTakeover(result.takeover)} />
          <ResultCard title="Vorzeitige Auflösung" view={describeEarlyTermination(result.earlyTermination)} />
          <ResultCard
            title="Rauskaufen und verkaufen"
            view={describeBuyoutAndSell(result.buyoutAndSell, buyoutChf, vehicleValueChf)}
          />
        </div>
        <p className="mt-3 text-xs text-neutral-500">
          Massgebend sind dein Leasingvertrag und die Offerten deiner Leasinggesellschaft.
        </p>
      </div>

      {footer ? <div className="mt-5">{footer}</div> : null}
    </div>
  );
}
