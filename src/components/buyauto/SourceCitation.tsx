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
