import {
  CANTONAL_FAHRZEUGAUSWEIS_SUMMARY,
  CANTONAL_FEES,
  CANTONAL_KONTROLLSCHILDER_SUMMARY,
  FACTS_CHECKED_ON,
} from "@/lib/buyauto/facts";
import { formatChfRappen } from "@/lib/buyauto/format";

/**
 * The 26 cantonal tariffs for a Leasingübernahme (F9): new Fahrzeugausweis on
 * the change of holder, and a new plate pair if the new lessee has no plates
 * of their own. One row per canton with its official source and Stand; the
 * notes for ZH, VD, ZG, SH and JU are footnotes. Server-rendered (static data).
 */
export function CantonalFeesTable({ headingLevel = "h2" }: { headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  const notes = CANTONAL_FEES.filter((c) => c.note);
  const noteNumber = (code: string) => notes.findIndex((c) => c.code === code) + 1;

  return (
    <section id="kantone" className="scroll-mt-24" aria-labelledby="kantone-heading">
      <Heading id="kantone-heading" className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight mb-3">
        Gebühren des Strassenverkehrsamts nach Kanton
      </Heading>
      <p className="text-neutral-700 leading-relaxed mb-2">
        Bei einer Leasingübernahme stellt das Strassenverkehrsamt einen neuen Fahrzeugausweis auf dich aus.{" "}
        {CANTONAL_FAHRZEUGAUSWEIS_SUMMARY} {CANTONAL_KONTROLLSCHILDER_SUMMARY}
      </p>
      <p className="text-sm text-neutral-500 mb-6">
        Die Kontrollschilder deiner Vorgängerin oder deines Vorgängers zu übernehmen, ist in den meisten Kantonen
        eingeschränkt oder kostet extra. Rechne deshalb mit eigenen oder neuen Schildern. Alle Tarife geprüft am{" "}
        {FACTS_CHECKED_ON}.
      </p>

      <div className="overflow-x-auto rounded-xl border border-neutral-200">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">
            Kantonale Gebühren für den neuen Fahrzeugausweis und neue Kontrollschilder bei einer Leasingübernahme
          </caption>
          <thead className="bg-neutral-100 text-neutral-700">
            <tr>
              <th scope="col" className="px-3 py-2 font-semibold">Kanton</th>
              <th scope="col" className="px-3 py-2 font-semibold">Neuer Fahrzeugausweis</th>
              <th scope="col" className="px-3 py-2 font-semibold">Neue Kontrollschilder</th>
              <th scope="col" className="px-3 py-2 font-semibold">Quelle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 bg-white">
            {CANTONAL_FEES.map((canton) => (
              <tr key={canton.code}>
                <th scope="row" className="px-3 py-2 font-medium text-neutral-900 whitespace-nowrap">
                  <abbr title={canton.name} className="no-underline">
                    {canton.code}
                  </abbr>
                  {canton.note ? <sup className="ml-0.5 text-neutral-500">{noteNumber(canton.code)}</sup> : null}
                </th>
                <td className="px-3 py-2 text-neutral-800 whitespace-nowrap">{formatChfRappen(canton.fahrzeugausweisChf)}</td>
                <td className="px-3 py-2 text-neutral-800 whitespace-nowrap">
                  {canton.kontrollschilderChf === null ? "kein fester Betrag" : formatChfRappen(canton.kontrollschilderChf)}
                </td>
                <td className="px-3 py-2 text-neutral-600">
                  <a
                    href={canton.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="underline decoration-neutral-300 underline-offset-2 hover:text-neutral-900"
                  >
                    Tarif {canton.name}
                  </a>
                  <span className="block text-xs text-neutral-500">{canton.stand}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ol className="mt-4 space-y-1 text-xs text-neutral-500 list-none">
        {notes.map((canton, i) => (
          <li key={canton.code}>
            <sup>{i + 1}</sup> {canton.name}: {canton.note}
          </li>
        ))}
      </ol>
    </section>
  );
}
