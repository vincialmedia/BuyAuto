import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="de-CH">
      <Head>
        {/* Favicon - BuyAuto logo */}
        <link rel="icon" href="/ChatGPT_Image_Mar_24_2026_02_28_34_PM.jpg" />
        <link rel="apple-touch-icon" href="/ChatGPT_Image_Mar_24_2026_02_28_34_PM.jpg" />
        
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
