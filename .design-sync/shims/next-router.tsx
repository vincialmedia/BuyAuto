// next/router shim for the design-system export.
//
// 26 components call useRouter(), overwhelmingly for router.query (to read a
// listing id or a search filter), router.pathname (to mark the active nav
// item) and router.push (on click). Without a Next runtime useRouter() returns
// undefined and every one of those components throws on first render, so the
// shim returns a stable, inert router object instead.
//
// router.isReady is true so components don't sit in their loading branch — a
// preview card stuck on a skeleton shows nothing useful.
import * as React from 'react';

type Handler = (...args: unknown[]) => void;

const noopEvents = {
  on: (_e: string, _h: Handler) => {},
  off: (_e: string, _h: Handler) => {},
  emit: (_e: string, ..._a: unknown[]) => {},
};

export const router = {
  pathname: '/',
  route: '/',
  asPath: '/',
  basePath: '',
  query: {} as Record<string, string | string[] | undefined>,
  isReady: true,
  isFallback: false,
  isPreview: false,
  isLocaleDomain: false,
  locale: 'de-CH',
  locales: ['de-CH'],
  defaultLocale: 'de-CH',
  events: noopEvents,
  push: async (_url?: unknown) => true,
  replace: async (_url?: unknown) => true,
  reload: () => {},
  back: () => {},
  forward: () => {},
  prefetch: async () => {},
  beforePopState: () => {},
};

export function useRouter() {
  return router;
}

export function withRouter<P extends object>(Component: React.ComponentType<P & { router: typeof router }>) {
  return function WithRouter(props: P) {
    return <Component {...props} router={router} />;
  };
}

export default router;
