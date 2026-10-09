import type { FactSource } from "@/lib/buyauto/facts";

/**
 * Visible citation for a sourced figure: «Quelle: <Titel>, <Stand>».
 * Every number taken from facts.ts is printed next to one of these, so the
 * reader (and Google) can see where it comes from and how current it is.
 */
export function SourceLink({ source, className = "" }: { source: FactSource; className?: string }) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className={`underline decoration-neutral-300 underline-offset-2 hover:text-neutral-900 ${className}`}
    >
      {source.title}
    </a>
  );
}

export function SourceCitation({
  source,
  prefix = "Quelle:",
  className = "",
}: {
  source: FactSource;
  prefix?: string;
  className?: string;
}) {
  return (
    <span className={className}>
      {prefix ? `${prefix} ` : null}
      <SourceLink source={source} />
      {source.stand ? `, ${source.stand}` : null}
    </span>
  );
}

/**
 * "Quellen" block for the end of a page: every source behind a printed figure,
 * de-duplicated by URL, with its Stand. Pass the same FactSource objects the
 * page cites inline.
 */
export function SourcesList({
  sources,
  heading = "Quellen",
  id = "quellen",
  className = "",
}: {
  sources: FactSource[];
  heading?: string;
  id?: string;
  className?: string;
}) {
  const unique = sources.filter((s, i) => sources.findIndex((o) => o.url === s.url) === i);
  if (unique.length === 0) return null;
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className={`scroll-mt-24 ${className}`}>
      <h2 id={`${id}-heading`} className="text-lg font-bold text-neutral-900 mb-3">
        {heading}
      </h2>
      <ol className="list-decimal pl-5 space-y-1.5 text-sm text-neutral-600">
        {unique.map((source) => (
          <li key={source.url}>
            <SourceLink source={source} />
            {source.stand ? `, ${source.stand}` : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
