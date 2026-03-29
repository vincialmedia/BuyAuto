"use client";

import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Head from "next/head";
import Link from "next/link";
import { HelpCircle, ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const faqs = [
  {
    id: "faq-1",
    question: "Was ist BuyAuto?",
    answer: "BuyAuto ist eine Schweizer Plattform, auf der du Occasionen, Neuwagen, Leasingangebote, Auto-Abos und Leasingübernahmen finden kannst – alles an einem Ort."
  },
  {
    id: "faq-2",
    question: "Welche Fahrzeuge finde ich auf BuyAuto?",
    answer: "Auf BuyAuto findest du Fahrzeuge von Privatpersonen und Garagen aus der ganzen Schweiz – je nach Inserat zum Kauf, Leasing, Auto-Abo oder zur Leasingübernahme."
  },
  {
    id: "faq-3",
    question: "Kann ich auf BuyAuto Occasionen und Neuwagen vergleichen?",
    answer: "Ja. BuyAuto bringt verschiedene Wege zum nächsten Auto auf einer Plattform zusammen, damit du Angebote einfacher vergleichen kannst."
  },
  {
    id: "faq-4",
    question: "Gibt es auch Leasing und Auto-Abo?",
    answer: "Ja. Neben Kaufangeboten findest du auf BuyAuto auch Leasingangebote, Auto-Abos und Leasingübernahmen."
  },
  {
    id: "faq-5",
    question: "Kann ich Fahrzeuge von Garagen und Privatpersonen finden?",
    answer: "Ja. BuyAuto zeigt Angebote von beiden Seiten, damit du mehr Auswahl und mehr Möglichkeiten hast."
  },
  {
    id: "faq-6",
    question: "Wie funktioniert die Kontaktaufnahme?",
    answer: "Du kannst direkt mit dem Anbieter oder der Garage in Kontakt treten, Fragen klären und den nächsten Schritt einfach anstossen."
  },
  {
    id: "faq-7",
    question: "Was kostet ein Inserat?",
    answer: "Die Kosten hängen von der gewählten Inserat-Art und möglichen Zusatzoptionen ab. Die aktuellen Preise siehst du direkt beim Inserieren."
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
            <p className="text-lg text-neutral-500 max-w-xl mx-auto">
              Alles, was du über BuyAuto wissen musst
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
            {faqs.map((faq, index) => (
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