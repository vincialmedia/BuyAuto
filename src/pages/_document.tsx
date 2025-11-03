import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  const baseUrl = process.env.NODE_ENV === "production" 
    ? "https://www.buyauto.ch" 
    : "http://localhost:3000";

  return (
    <Html lang="de">
      <Head>
        {/* Global Meta Tags */}
        <meta name="description" content="Auto-Leasing übernehmen oder vorzeitig verkaufen – schnell, sicher, transparent. Jetzt Inserat erstellen." />
        
        {/* Open Graph Meta Tags for Social Sharing */}
        <meta property="og:title" content="BuyAuto – Die Schweizer Plattform für Leasingübernahmen" />
        <meta property="og:description" content="Auto-Leasing übernehmen oder vorzeitig verkaufen – schnell, sicher, transparent. Jetzt Inserat erstellen." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={`${baseUrl}/buyauto-logo.png`} />
        <meta property="og:image:width" content="512" />
        <meta property="og:image:height" content="512" />
        <meta property="og:image:alt" content="BuyAuto Logo" />
        <meta property="og:site_name" content="BuyAuto" />
        <meta property="og:locale" content="de_CH" />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:image" content={`${baseUrl}/buyauto-logo.png`} />
        
        {/* Favicon */}
        <link rel="icon" href="/Untitled_design_7_.png" />
        <link rel="apple-touch-icon" href="/buyauto-logo.png" />
        
        {/* Preconnect to Supabase storage for faster image loading */}
        <link rel="preconnect" href="https://psdtkknwxzxnxnbqmdzl.supabase.co" />
        <link rel="dns-prefetch" href="https://psdtkknwxzxnxnbqmdzl.supabase.co" />
        <link
          rel="stylesheet"
          href="https://releases.transloadit.com/uppy/v3.12.0/uppy.min.css"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
