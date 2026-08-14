"use client";

import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Head from "next/head";
import Link from "next/link";
import { HelpCircle, ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pricingPlans } from "@/lib/buyauto/stripe_config";
import { GARAGE_PLANS } from "@/lib/buyauto/garagePlans";

const faqs = [
  {
    id: "faq-1",
    question: "Was ist eine Leasingübernahme?",
    answer: "Bei einer Leasingübernahme übernimmst du einen laufenden Leasingvertrag – inklusive Monatsrate, Restlaufzeit und Kilometerlimit. Die bisherige Leasingnehmerin oder der bisherige Leasingnehmer wird aus dem Vertrag entlassen, du fährst das Fahrzeug bis zum Vertragsende weiter."
  },
  {
    id: "faq-2",
    question: "Wie funktioniert eine Leasingübernahme auf BuyAuto?",
    answer: "Der Abgeber stellt seinen Leasingvertrag als Inserat ein – mit Monatsrate, Restlaufzeit und Kilometerstand. Interessenten melden sich direkt, und die eigentliche Übertragung läuft immer über die Leasinggesellschaft: Sie prüft den Übernehmer und schreibt den Vertrag um."
  },
  {
    id: "faq-3",
    question: "Warum ein bestehendes Leasing übernehmen statt neu zu leasen?",
    answer: "Du übernimmst nur die Restlaufzeit, statt einen neuen Vertrag über die volle Laufzeit zu unterschreiben – und eine hohe Anzahlung entfällt in der Regel. Zudem ist das Fahrzeug nach der Bewilligung schnell verfügbar, ohne Neuwagen-Wartezeit."
  },
  {
    id: "faq-4",
    question: "Kann ich mein Leasing vorzeitig abgeben?",
    answer: "Ja. Statt den Vertrag teuer vorzeitig aufzulösen, kannst du ihn an eine Nachfolgerin oder einen Nachfolger übertragen – mit Zustimmung deiner Leasinggesellschaft. Auf BuyAuto inserierst du deinen Vertrag und findest Menschen, die genau so ein Leasing übernehmen möchten."
  },
  {
    id: "faq-5",
    question: "Wer prüft die Bonität bei einer Leasingübernahme?",
    answer: "Die Leasinggesellschaft – wie bei jedem neuen Leasingvertrag. Der Übernehmer durchläuft die übliche Bonitätsprüfung, und erst nach der Bewilligung wird der Vertrag umgeschrieben. BuyAuto ersetzt diese Prüfung nicht."
  },
  {
    id: "faq-6",
    question: "Kann ich auf BuyAuto Fahrzeuge von Garagen und Privatpersonen finden?",
    answer: "Ja. Auf BuyAuto findest du Leasingübernahmen und Fahrzeuge von Garagen und Privatpersonen aus der ganzen Schweiz. Jedes Inserat weist die wichtigsten Vertragsdaten transparent aus."
  },
  {
    id: "faq-7",
    question: "Gibt es auf BuyAuto auch Fahrzeuge zum Direktkauf?",
    answer: "Ja. Neben Leasingübernahmen findest du auf BuyAuto auch ausgewählte Fahrzeuge zum Direktkauf – mit Kaufpreis in CHF. Der Fokus der Plattform liegt aber klar auf der Leasingübernahme."
  },
  {
    id: "faq-8",
    question: "Wie funktioniert die Kontaktaufnahme mit Anbietern?",
    answer: "Wenn dich ein Angebot interessiert, nimmst du direkt mit dem Anbieter oder der Garage Kontakt auf. So klärst du offene Fragen zum Vertrag, vereinbarst eine Besichtigung und startest die Übertragung ohne unnötige Umwege."
  },
  {
    id: "faq-10",
    question: "Was kostet ein Inserat auf BuyAuto?",
    // Prices and durations interpolated from the pricing configs so this
    // answer (and its FAQPage JSON-LD) can never drift from /preise.
    answer: `Für Private ist das Standard-Inserat gratis: ${pricingPlans.standard.duration_days} Tage online, bis 5 Fotos. Wer länger und sichtbarer inserieren will, wählt Verlängert (CHF ${pricingPlans.extended.price}, ${pricingPlans.extended.duration_days} Tage, Premium-Platzierung und 15 Fotos inklusive) oder Unlimitiert (CHF ${pricingPlans.unlimited.price}, online bis verkauft). Garagen buchen ein Monatspaket ab CHF ${GARAGE_PLANS.starter.monthlyPriceChf}. Alle Preise stehen offen auf der Preisseite.`
  }
];

export default function FAQSection() {
  const [openItem, setOpenItem] = useState<string | undefined>(undefined);
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>
      
      <section className="py-16 sm:py-20 px-4 bg-gradient-to-b from-white via-neutral-50 to-white relative overflow-hidden">
        {/* Subtle background decorations */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-red-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-neutral-200/30 rounded-full blur-3xl" />
        
        <div className="max-w-3xl mx-auto relative z-10">
          {/* Section header */}
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 text-red-600 text-sm font-bold uppercase tracking-wider mb-4">
              <HelpCircle className="w-4 h-4" />
              FAQ
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-neutral-900 mb-4 tracking-tight">
              Häufig gestellte{" "}
              <span className="text-red-500">Fragen</span>
            </h2>
            <p className="text-lg text-neutral-500 max-w-2xl mx-auto">
              Antworten auf die wichtigsten Fragen rund um Leasingübernahme und Leasingabgabe in der Schweiz
            </p>
          </div>

          {/* Accordion */}
          <Accordion 
            type="single" 
            collapsible 
            className="w-full space-y-3"
            value={openItem}
            onValueChange={setOpenItem}
          >
            {faqs.map((faq) => (
              <AccordionItem 
                key={faq.id} 
                value={faq.id}
                className="group bg-white rounded-2xl border border-neutral-200 hover:border-neutral-300 px-6 transition-all duration-300 data-[state=open]:border-red-200 data-[state=open]:shadow-lg data-[state=open]:shadow-red-500/5 overflow-hidden"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-5 hover:text-red-600 transition-colors duration-200 text-base md:text-lg gap-4 [&[data-state=open]>svg]:text-red-500 [&[data-state=open]>svg]:rotate-45">
                  <span className="flex-1">{faq.question}</span>
                  <Plus className="w-5 h-5 text-neutral-400 shrink-0 transition-transform duration-300" />
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-5 text-base">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          
          {/* Bottom helper text and CTAs */}
          <div className="mt-12 text-center">
            <p className="text-neutral-500 mb-6">
              <span className="font-semibold text-neutral-700">Noch Fragen?</span>
              <br />
              Dann entdecke alle Fahrzeuge oder erstelle dein eigenes Inserat auf BuyAuto.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/suche">
                <Button size="lg" className="bg-neutral-900 text-white hover:bg-neutral-800 font-bold rounded-xl px-8 h-12 w-full sm:w-auto hover:scale-105 transition-all duration-300">
                  Alle Fahrzeuge ansehen
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/inserat-erstellen">
                <Button size="lg" variant="outline" className="border-2 border-neutral-300 text-neutral-700 hover:border-red-500 hover:text-red-600 font-bold rounded-xl px-8 h-12 w-full sm:w-auto hover:scale-105 transition-all duration-300">
                  Inserat erstellen
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}