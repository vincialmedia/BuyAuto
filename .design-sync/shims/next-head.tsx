// next/head shim — document <head> tags have no visual output, and there is no
// Next head manager to receive them. Rendering null keeps components that set
// their own title/meta (the SEO-aware page sections) mounting cleanly.
import * as React from 'react';

export default function Head(_props: { children?: React.ReactNode }): React.ReactElement | null {
  return null;
}
