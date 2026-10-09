"use client";

import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Head from "next/head";
import { HelpCircle, Plus } from "lucide-react";
import { pricingPlans } from "@/lib/buyauto/stripe_config";
import { GARAGE_PLANS } from "@/lib/buyauto/garagePlans";
import { SourceCitation } from "@/components/buyauto/SourceCitation";
import {
  AMAG_LEASING,
  CA_AUTO_FINANCE,
  KKG,
  PORSCHE_FINANCIAL_SERVICES,
  type FactSource,
} from "@/lib/buyauto/facts";

interface Faq {
  id: string;
  question: string;
  /** Rendered in the accordion and used verbatim in the FAQPage JSON-LD. */
  answer: string;
  /** Sources of the lender clauses or laws the answer names, shown under the answer. */
  sources?: FactSource[];
}

const faqs: Faq[] = [
  {
    id: "faq-1",
    question: "Was ist eine Leasingübernahme?",
    answer: "Bei einer Leasingübernahme übernimmst du einen laufenden Leasingvertrag von der bisherigen Leasingnehmerin oder dem bisherigen Leasingnehmer, mit Monatsrate, Restlaufzeit und Kilometerlimit. Du fährst das Auto bis zum Ende des Vertrags."
  },
  {
    id: "faq-2",
    question: "Wie funktioniert eine Leasingübernahme auf BuyAuto?",
    answer: `Der Abgeber erstellt ein Inserat mit den Vertragsdaten, etwa Monatsrate und Restlaufzeit. Interessenten melden sich über den Chat auf BuyAuto. Die Übertragung selbst macht die Leasinggesellschaft: Wenn sie zustimmt, schreibt sie den Vertrag auf die neue Person um. ${PORSCHE_FINANCIAL_SERVICES.name} zum Beispiel verlangt dafür eine vorherige schriftliche Zustimmung (ALB ${PORSCHE_FINANCIAL_SERVICES.transferClause}).`,
    sources: [PORSCHE_FINANCIAL_SERVICES.source]
  },
  {
    id: "faq-3",
    question: "Was unterscheidet eine Leasingübernahme von einem neuen Leasing?",
    answer: "Du übernimmst einen bestehenden Vertrag für seine Restlaufzeit, mit der Monatsrate und dem Kilometerlimit, die darin stehen. Eine Anzahlung für einen neuen Vertrag zahlst du nicht. Ob der Abgeber eine Kaution verlangt, steht im Inserat."
  },
  {
    id: "faq-4",
    question: "Kann ich mein Leasing vorzeitig abgeben?",
    answer: `Ja, auf zwei Wegen. Du überträgst den Vertrag mit Zustimmung deiner Leasinggesellschaft an eine Person, die ihn übernimmt. Dafür kannst du auf BuyAuto ein Inserat erstellen. Oder du kündigst einen privaten Leasingvertrag, der unter das Konsumkreditgesetz fällt, vorzeitig (${KKG.terminationArticle} KKG). Was du dann noch bezahlst, berechnet deine Leasinggesellschaft.`,
    sources: [KKG.source]
  },
  {
    id: "faq-5",
    question: "Wer prüft die Bonität bei einer Leasingübernahme?",
    answer: `Die Leasinggesellschaft prüft die Bonität der Person, die den Vertrag übernehmen will. ${AMAG_LEASING.name} holt dafür unter anderem Auskünfte bei der ZEK und der IKO ein (ALB ${AMAG_LEASING.clauses.bonitaetspruefung}), ${CA_AUTO_FINANCE.name} ebenfalls bei IKO und ZEK (AVB ${CA_AUTO_FINANCE.clauses.bonitaetspruefung}). BuyAuto ersetzt diese Prüfung nicht.`,
    sources: [AMAG_LEASING.source, CA_AUTO_FINANCE.source]
  },
  {
    id: "faq-6",
    question: "Kann ich auf BuyAuto Fahrzeuge von Garagen und Privatpersonen finden?",
    answer: "Ja. Auf BuyAuto findest du Leasingübernahmen und Fahrzeuge von Garagen und Privatpersonen."
  },
  {
    id: "faq-7",
    question: "Gibt es auf BuyAuto auch Fahrzeuge zum Direktkauf?",
    answer: "Ja. Neben Leasingübernahmen findest du auf BuyAuto auch Fahrzeuge zum Direktkauf. Der Schwerpunkt der Plattform liegt auf der Leasingübernahme."
  },
  {
    id: "faq-8",
    question: "Wie funktioniert die Kontaktaufnahme mit Anbietern?",
    answer: "Wenn dich ein Angebot interessiert, nimmst du direkt mit dem Anbieter oder der Garage Kontakt auf. So klärst du offene Fragen zum Vertrag und vereinbarst eine Besichtigung."
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
                  <p>{faq.answer}</p>
                  {faq.sources?.map((source) => (
                    <p key={source.url} className="mt-2 text-xs text-neutral-500">
                      <SourceCitation source={source} />
                    </p>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </>
  );
}