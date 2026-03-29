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
    question: "Wo kann ich in der Schweiz Occasionen, Neuwagen, Leasingangebote und Auto-Abos vergleichen?",
    answer: "Mit BuyAuto kannst du in der Schweiz Occasionen, Neuwagen, Leasingangebote, Auto-Abos und Leasingübernahmen auf einer Plattform entdecken und vergleichen. So musst du nicht mehrere verschiedene Auto-Plattformen durchsuchen, um das passende Angebot zu finden."
  },
  {
    id: "faq-2",
    question: "Soll ich ein Auto kaufen, leasen, im Auto-Abo fahren oder eine Leasingübernahme suchen?",
    answer: "Das hängt von deinem Budget, deiner gewünschten Flexibilität und deinem Zeithorizont ab. Auf BuyAuto kannst du verschiedene Wege zum nächsten Auto vergleichen – vom Kauf über Leasing bis zum Auto-Abo oder zur Leasingübernahme."
  },
  {
    id: "faq-3",
    question: "Was ist der Unterschied zwischen Kauf, Leasing, Auto-Abo und Leasingübernahme?",
    answer: "Beim Kauf gehört dir das Fahrzeug direkt oder nach Finanzierung. Beim Leasing zahlst du eine monatliche Rate für eine feste Laufzeit. Ein Auto-Abo ist meist flexibler und bündelt mehrere Kosten in einer monatlichen Zahlung. Bei einer Leasingübernahme übernimmst du einen bestehenden Leasingvertrag von einer anderen Person."
  },
  {
    id: "faq-4",
    question: "Sind Occasionen oder Neuwagen die bessere Wahl in der Schweiz?",
    answer: "Das kommt darauf an, was dir wichtiger ist: Preis, Verfügbarkeit, Ausstattung oder Neuwertigkeit. Occasionen sind oft günstiger und schneller verfügbar, während Neuwagen mit aktueller Technik und individueller Konfiguration punkten können. Auf BuyAuto kannst du beide Varianten vergleichen."
  },
  {
    id: "faq-5",
    question: "Wie finde ich das passende Auto in der Schweiz nach Budget oder Monatsrate?",
    answer: "Auf BuyAuto kannst du Fahrzeuge nach verschiedenen Kriterien filtern – zum Beispiel nach Marke, Modell, Preis, Kaufart oder Monatsbudget. So findest du schneller heraus, ob eher ein Kauf, ein Leasing, ein Auto-Abo oder eine Leasingübernahme zu dir passt."
  },
  {
    id: "faq-6",
    question: "Kann ich auf BuyAuto Fahrzeuge von Garagen und Privatpersonen finden?",
    answer: "Ja. Auf BuyAuto findest du Fahrzeuge von Garagen und Privatpersonen aus der ganzen Schweiz. Das gibt dir mehr Auswahl und mehr Möglichkeiten, passende Angebote zu vergleichen."
  },
  {
    id: "faq-7",
    question: "Gibt es auf BuyAuto auch Leasingangebote und Auto-Abos in der Schweiz?",
    answer: "Ja. Neben Occasionen und Neuwagen zum Kauf findest du auf BuyAuto auch Leasingangebote, Auto-Abos und Leasingübernahmen in der Schweiz – alles an einem Ort."
  },
  {
    id: "faq-8",
    question: "Wie funktioniert die Kontaktaufnahme mit Anbietern und Garagen?",
    answer: "Wenn dich ein Fahrzeug interessiert, kannst du direkt mit dem Anbieter oder der Garage Kontakt aufnehmen. So kannst du offene Fragen klären, Details besprechen und den nächsten Schritt ohne unnötige Umwege anstossen."
  },
  {
    id: "faq-9",
    question: "Kann ich auf BuyAuto Fahrzeuge nach Kaufart filtern?",
    answer: "Ja. Du kannst gezielt nach Kauf, Leasing, Auto-Abo oder Leasingübernahme filtern und so schneller die Angebote sehen, die zu deinem Bedarf passen."
  },
  {
    id: "faq-10",
    question: "Was kostet ein Inserat auf BuyAuto?",
    answer: "Die Kosten für ein Inserat hängen von der gewählten Inserat-Art und möglichen Zusatzoptionen ab. Die aktuellen Preise und Möglichkeiten siehst du direkt beim Erstellen deines Inserats auf BuyAuto."
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
              Antworten auf wichtige Fragen rund um Auto kaufen, Leasing, Auto-Abo und Leasingübernahme in der Schweiz
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