import Head from "next/head";
import { NewHeroSection } from "@/components/buyauto/homepage/NewHeroSection";
import { PremiumListings } from "@/components/buyauto/PremiumListings";
import { WhyBuyAutoSection } from "@/components/buyauto/homepage/WhyBuyAutoSection";
import { HowItWorksRedesignedSection } from "@/components/buyauto/homepage/HowItWorksRedesignedSection";
import { TestimonialsSection } from "@/components/buyauto/homepage/TestimonialsSection";
import { CtaBannerSection } from "@/components/buyauto/homepage/CtaBannerSection";
import { SeoCopySection } from "@/components/buyauto/homepage/SeoCopySection";
import { MobileCta } from "@/components/buyauto/homepage/MobileCta";
import Link from "next/link";

export default function HomePage() {
  const canonicalUrl = "https://www.buyauto.ch";
  const title = "Auto Leasing Übernehmen oder Transferieren in der Schweiz | BuyAuto.ch";
  const description = "Finde dein nächstes Auto-Leasing oder verkaufe deines einfach und sicher. BuyAuto.ch ist die Plattform für Leasingübernahmen in der Schweiz – transparent, schnell und ohne Stress.";

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "BuyAuto.ch",
    "url": "https://www.buyauto.ch",
    "logo": "https://www.buyauto.ch/favicon.ico",
    "description": "Die führende Plattform für Leasingübernahmen in der Schweiz",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "CH"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "availableLanguage": ["de", "fr", "it"]
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.buyauto.ch"
      }
    ]
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonicalUrl} />
        
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="de_CH" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        
        <meta name="keywords" content="Leasingübernahme Schweiz, Auto Leasing übernehmen, Leasing Transfer, Auto verkaufen Schweiz, Leasingübernahme online" />
        <meta name="author" content="BuyAuto.ch" />
        <meta name="robots" content="index, follow" />
        <meta name="language" content="German" />
        <meta name="geo.region" content="CH" />
        <meta name="geo.placename" content="Switzerland" />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      </Head>

      <main>
        <NewHeroSection />

        <section className="py-16 md:py-24 bg-white" aria-labelledby="featured-listings-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 md:mb-16">
              <h2 id="featured-listings-heading" className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
                Top Leasingangebote in der Schweiz
              </h2>
              <p className="text-lg text-neutral-600 max-w-2xl mx-auto mb-6">
                Entdecke die besten verfügbaren Leasingübernahmen
              </p>
              <Link 
                href="/suche" 
                className="text-red-600 hover:text-red-700 font-semibold inline-flex items-center gap-2 hover:underline transition-colors"
              >
                Alle Fahrzeuge anzeigen
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <PremiumListings />
          </div>
        </section>

        <WhyBuyAutoSection />
        <HowItWorksRedesignedSection />
        <TestimonialsSection />
        <CtaBannerSection />
        <SeoCopySection />
        <MobileCta />
      </main>
    </>
  );
}