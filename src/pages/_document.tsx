import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="de-CH">
      <Head>
        {/* Favicon - BuyAuto BA icon */}
        <link rel="icon" href="/favicon-ba.png" />
        <link rel="apple-touch-icon" href="/favicon-ba.png" />
        
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
