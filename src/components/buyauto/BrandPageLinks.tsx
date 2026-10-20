import Link from "next/link";
import { Fragment } from "react";

export interface BrandPageLink {
  slug: string;
  name: string;
}

/**
 * Comma-separated links to brand pages (/leasinguebernahme/[marke]), the brand name
 * as the anchor. Callers pass indexable brand pages only (getIndexableBrandPages),
 * so a noindex brand page is never linked.
 */
export function BrandPageLinks({ brands, linkClassName }: { brands: readonly BrandPageLink[]; linkClassName: string }) {
  return (
    <>
      {brands.map((brand, index) => (
        <Fragment key={brand.slug}>
          {index > 0 ? ", " : null}
          <Link href={`/leasinguebernahme/${brand.slug}`} className={linkClassName}>
            {brand.name}
          </Link>
        </Fragment>
      ))}
    </>
  );
}
