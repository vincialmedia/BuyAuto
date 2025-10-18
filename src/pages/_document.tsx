import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="de">
      <Head>
        {/* Meta Tags */}
        <meta name="description" content="Auto-Leasing übernehmen oder vorzeitig verkaufen – schnell, sicher, transparent. Jetzt Inserat erstellen." />
        <meta property="og:title" content="BuyAuto – Die Schweizer Plattform für Leasingübernahmen" />
        <meta property="og:description" content="Auto-Leasing übernehmen oder vorzeitig verkaufen – schnell, sicher, transparent. Jetzt Inserat erstellen." />
        <meta property="og:type" content="website" />
        
        {/* Favicon */}
        <link rel="icon" href="/Untitled_design_7_.png" />
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
  )
}
