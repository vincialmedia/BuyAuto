// next/link shim for the design-system export.
//
// There is no Next.js runtime inside a claude.ai/design render, so the real
// next/link (which reaches for the router's prefetch machinery) can't mount.
// A plain anchor is what next/link renders anyway once you strip navigation,
// so components keep their real markup, styling, and accessible semantics.
import * as React from 'react';

type UrlObject = { pathname?: string; query?: Record<string, unknown> };

export type LinkProps = {
  href: string | UrlObject;
  children?: React.ReactNode;
  // Consumed here rather than forwarded: these are navigation directives with
  // no meaning without a router, and React warns about unknown DOM attributes.
  replace?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  prefetch?: boolean;
  locale?: string | false;
  legacyBehavior?: boolean;
  passHref?: boolean;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>;

function hrefToString(href: string | UrlObject): string {
  if (typeof href === 'string') return href;
  const path = href?.pathname ?? '';
  const entries = Object.entries(href?.query ?? {});
  if (!entries.length) return path;
  const qs = entries
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return qs ? `${path}?${qs}` : path;
}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { href, children, replace, scroll, shallow, prefetch, locale, legacyBehavior, passHref, ...rest },
  ref,
) {
  // legacyBehavior wraps a single <a> child that already carries the styling —
  // clone it with the resolved href instead of nesting a second anchor.
  if (legacyBehavior && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ href?: string }>, {
      href: hrefToString(href),
    });
  }
  return (
    <a ref={ref} href={hrefToString(href)} {...rest}>
      {children}
    </a>
  );
});

export default Link;
