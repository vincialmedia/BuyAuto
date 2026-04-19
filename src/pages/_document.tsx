import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="de-CH">
      <Head>
        {/* Favicon - BuyAuto logo */}
        <link rel="icon" href="/buyauto-logo.jpg" />
        <link rel="apple-touch-icon" href="/buyauto-logo.jpg" />
        
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
