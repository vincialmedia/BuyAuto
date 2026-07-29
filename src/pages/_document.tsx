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

        {/*
          Google Consent Mode v2 defaults. This has to be a plain inline script
          in the server HTML — a next/script tag would run after gtag.js has
          already fired its first hit, which is exactly the hit we must not send
          before the visitor has decided. Storage keys are duplicated from
          @/lib/analytics/gtag here because this runs outside the bundle.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              // Exposed on window so the bundle can reach the shim. It must
              // call *this* function rather than pushing to dataLayer itself:
              // only a real arguments object counts as a gtag command.
              window.gtag = gtag;
              gtag('consent', 'default', {
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied',
                analytics_storage: 'denied',
                functionality_storage: 'granted',
                security_storage: 'granted',
                wait_for_update: 500
              });
              try {
                if (window.localStorage.getItem('buyauto_consent_v2') === 'granted') {
                  gtag('consent', 'update', {
                    ad_storage: 'granted',
                    ad_user_data: 'granted',
                    ad_personalization: 'granted',
                    analytics_storage: 'granted'
                  });
                }
              } catch (e) {}
            `,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
