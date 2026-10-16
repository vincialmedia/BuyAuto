import Image from "next/image";
import { CONTENT_LAST_UPDATED, formatSwissDate } from "@/lib/buyauto/contentDates";
import { FOUNDER_TAKEOVER } from "@/lib/buyauto/facts";

const SITE_URL = "https://www.buyauto.ch";

/** The one line the author box states about Vince: his own takeover in 2024 (F8), nothing more. */
export const AUTHOR_ONE_LINER =
  `Hat ${FOUNDER_TAKEOVER.year} den Leasingvertrag seines ${FOUNDER_TAKEOVER.car} selbst per Leasingübernahme abgegeben.`;

/** Person schema with exactly the facts the box shows. */
export const AUTHOR_PERSON_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: FOUNDER_TAKEOVER.person,
  jobTitle: FOUNDER_TAKEOVER.role,
  image: `${SITE_URL}${FOUNDER_TAKEOVER.photo}`,
  description: AUTHOR_ONE_LINER,
  worksFor: { "@type": "Organization", name: "BuyAuto", url: SITE_URL },
} as const;

/**
 * Author box for the guide, cost, exit, transfer, Auto-Abo and brand pages:
 * photo, name and role, one line from the founder's own 2024 takeover, and the
 * page's last-updated date from CONTENT_LAST_UPDATED (pass the page path, or
 * an explicit ISO date for pages that are not in that map).
 */
export function AuthorBox({
  path,
  updatedIso,
  className = "",
}: {
  path?: string;
  updatedIso?: string | null;
  className?: string;
}) {
  const iso = updatedIso ?? (path ? CONTENT_LAST_UPDATED[path] ?? null : null);

  return (
    <aside
      aria-label="Autor"
      className={`flex items-center gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 ${className}`}
    >
      <Image
        src={FOUNDER_TAKEOVER.photo}
        alt={FOUNDER_TAKEOVER.person}
        width={56}
        height={56}
        className="h-14 w-14 shrink-0 rounded-full object-cover object-top"
      />
      <div className="min-w-0 text-sm leading-snug">
        <p className="font-semibold text-neutral-900">
          {FOUNDER_TAKEOVER.person}, {FOUNDER_TAKEOVER.role}
        </p>
        <p className="text-neutral-600">{AUTHOR_ONE_LINER}</p>
        {iso ? (
          <p className="mt-1 text-xs text-neutral-500">
            Aktualisiert am <time dateTime={iso}>{formatSwissDate(iso)}</time>
          </p>
        ) : null}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(AUTHOR_PERSON_JSON_LD) }} />
    </aside>
  );
}
