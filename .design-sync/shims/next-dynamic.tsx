// next/dynamic shim for the design-system export.
//
// Five components code-split a heavy child (the leasing calculator, the wizard
// steps, the garage dashboard tabs). Returning a stub would leave a hole in
// exactly the part of those cards worth looking at, so this keeps the real
// lazy import via React.lazy + Suspense — the component still renders, just
// after a microtask.
//
// `ssr: false` is irrelevant here (previews are client-rendered), and
// `loading` becomes the Suspense fallback, matching Next's behaviour.
import * as React from 'react';

type Loader<P> = () => Promise<{ default: React.ComponentType<P> } | React.ComponentType<P>>;

type DynamicOptions<P> = {
  ssr?: boolean;
  loading?: React.ComponentType<{ error?: Error | null; isLoading?: boolean; pastDelay?: boolean }>;
};

export default function dynamic<P extends object>(
  loader: Loader<P>,
  options: DynamicOptions<P> = {},
): React.ComponentType<P> {
  const Lazy = React.lazy(async () => {
    const mod = await loader();
    // next/dynamic accepts both `() => import('./x')` (a module namespace) and
    // `() => import('./x').then(m => m.Named)` (a bare component).
    return 'default' in (mod as Record<string, unknown>)
      ? (mod as { default: React.ComponentType<P> })
      : { default: mod as React.ComponentType<P> };
  });

  const Loading = options.loading;

  return function DynamicComponent(props: P) {
    return (
      <React.Suspense fallback={Loading ? <Loading isLoading pastDelay /> : null}>
        <Lazy {...(props as P & React.JSX.IntrinsicAttributes)} />
      </React.Suspense>
    );
  };
}

export const noSSR = dynamic;
