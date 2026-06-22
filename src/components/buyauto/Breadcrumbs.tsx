import Link from "next/link";
import { ChevronRight } from "lucide-react";

const SITE_URL = "https://www.buyauto.ch";

export interface Crumb {
  name: string;
  href: string;
}

/**
 * Visible breadcrumb nav + BreadcrumbList JSON-LD in one component. Renders the structured
 * data inline (Google reads JSON-LD anywhere in the DOM), so pages just drop this near the
 * top of their <main>. Declares the page's place in the cluster hierarchy and is eligible
 * for breadcrumb rich results.
 */
export function Breadcrumbs({ items, className = "" }: { items: Crumb[]; className?: string }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${SITE_URL}${c.href}`,
    })),
  };

  return (
    <nav aria-label="Breadcrumb" className={`flex flex-wrap items-center gap-1.5 text-sm text-neutral-500 ${className}`}>
      {items.map((c, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={c.href} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="w-4 h-4 shrink-0" />}
            {isLast ? (
              <span className="text-neutral-900 font-medium">{c.name}</span>
            ) : (
              <Link href={c.href} className="hover:text-neutral-900">
                {c.name}
              </Link>
            )}
          </span>
        );
      })}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </nav>
  );
}
