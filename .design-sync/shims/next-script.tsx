// next/script shim — third-party script injection (analytics, Stripe) has no
// place in a preview card and would fire real network requests during capture.
import * as React from 'react';

export default function Script(_props: Record<string, unknown>): React.ReactElement | null {
  return null;
}
