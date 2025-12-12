import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="de">
      <Head>
        {/* Favicon - The little red car */}
        <link rel="icon" href="/Untitled_design_7_.png" />
        <link rel="apple-touch-icon" href="/buyauto-logo.png" />
        
        {/* Preconnect to Supabase storage for faster image loading */}
        <link rel="preconnect" href="https://psdtkknwxzxnxnbqmdzl.supabase.co" />
        <link rel="dns-prefetch" href="https://psdtkknwxzxnxnbqmdzl.supabase.co" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
