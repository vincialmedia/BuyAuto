/**
 * The two schema.org entities every page refers to: BuyAuto (Organization) and its
 * founder Vincent Hänggi (Person), each with one stable @id.
 *
 * - The Organization node is emitted once, site-wide, in _app.tsx. Pages never add a
 *   second one; an Article's `publisher` is a reference: ORGANIZATION_REF.
 * - The full Person node comes with the AuthorBox (the visible author box, so every
 *   value in it is on the page). An Article's `author` is a reference: FOUNDER_REF.
 *   The Organization's `founder` names the same @id, so the reference also resolves
 *   on a page without the AuthorBox.
 * - A reference carries its @type and name next to the @id, so the Article's author
 *   and publisher read correctly also to a parser that does not join the separate
 *   JSON-LD blocks by @id. It is the same entity, with no fact beyond its name.
 *
 * Address and e-mail are the operator details on /impressum (src/pages/impressum.tsx);
 * keep them in sync and add nothing that page does not say. No `sameAs` until there is
 * a real profile to list.
 *
 * Kept free of other imports: _app.tsx ships it in the shared bundle.
 */

export const SITE_URL = "https://www.buyauto.ch";

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const FOUNDER_PERSON_ID = `${SITE_URL}/#vincent-haenggi`;

/** Same string as FOUNDER_TAKEOVER.person in facts.ts (checked by scripts/test-entities.ts). */
export const FOUNDER_NAME = "Vincent Hänggi";
/** The schema jobTitle; the AuthorBox shows FOUNDER_TAKEOVER.role ("Gründer von BuyAuto"). */
export const FOUNDER_JOB_TITLE = "Gründer";

export const ORGANIZATION_NAME = "BuyAuto";

export const ORGANIZATION_REF = { "@type": "Organization", "@id": ORGANIZATION_ID, name: ORGANIZATION_NAME } as const;
export const FOUNDER_REF = { "@type": "Person", "@id": FOUNDER_PERSON_ID, name: FOUNDER_NAME } as const;

/** As on /impressum. */
export const ORGANIZATION_EMAIL = "hello@buyauto.ch";
export const ORGANIZATION_ADDRESS = {
  "@type": "PostalAddress",
  streetAddress: "Brandstrasse 21",
  postalCode: "8952",
  addressLocality: "Schlieren",
  addressCountry: "CH",
} as const;

export const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: ORGANIZATION_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/share-logo.jpg`,
  email: ORGANIZATION_EMAIL,
  address: ORGANIZATION_ADDRESS,
  description:
    "Schweizer Marktplatz für Leasingübernahmen von Privatpersonen und Garagen: Leasing übernehmen oder abgeben.",
  founder: FOUNDER_REF,
} as const;
