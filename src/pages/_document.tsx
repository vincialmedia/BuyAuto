import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="de-CH">
      <Head>
        {/* Favicon - BuyAuto red car icon */}
        <link rel="icon" href="/favicon-car.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/BuyAuto_Favicon_2.png" />
        
        {/* Preconnect to Supabase (auth + REST calls from the browser) */}
        <link rel="preconnect" href="https://fgalkhfopecwsryracre.supabase.co" />
        <link rel="dns-prefetch" href="https://fgalkhfopecwsryracre.supabase.co" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
