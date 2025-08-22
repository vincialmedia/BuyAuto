"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Head from "next/head";

const faqs = [
  {
    id: "faq-1",
    question: "Wie funktioniert eine Leasingübernahme?",
    answer: "Bei einer Leasingübernahme übernimmst du den bestehenden Leasingvertrag eines anderen Kunden. Du zahlst die monatlichen Raten weiter und erhältst das Fahrzeug. Wir prüfen deine Bonität und wickeln den gesamten Prozess für dich ab."
  },
  {
    id: "faq-2",
    question: "Welche Kosten entstehen?",
    answer: "Du zahlst die monatliche Leasingrate plus eventuell anfallende Übernahmegebühren. Diese sind transparent in jedem Inserat aufgeführt. Zusätzlich können je nach Anbieter Bearbeitungsgebühren anfallen."
  },
  {
    id: "faq-3",
    question: "Was muss ich als neuer Leasingnehmer nachweisen?",
    answer: "Du benötigst einen gültigen Führerausweis, Einkommensnachweis der letzten 3 Monate, einen aktuellen Betreibungsregisterauszug und eine Kopie deines Personalausweises oder Passes."
  },
  {
    id: "faq-4",
    question: "Kann ich das Fahrzeug vor der Übernahme besichtigen?",
    answer: "Ja, wir empfehlen dringend eine Besichtigung vor der Übernahme. Du kannst direkt mit dem aktuellen Leasingnehmer einen Termin vereinbaren oder über unsere Plattform eine Besichtigung organisieren."
  },
  {
    id: "faq-5",
    question: "Was passiert bei Schäden oder Verschleiss?",
    answer: "Der Zustand des Fahrzeugs wird bei der Übernahme dokumentiert. Bestehende Schäden gehen nicht zu deinen Lasten. Für neue Schäden während deiner Leasingdauer bist du entsprechend den Leasingbedingungen verantwortlich."
  }
];

export default function FAQSection() {
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
      
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Häufig gestellte Fragen
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Alles was du über Leasingübernahmen wissen musst
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq) => (
              <AccordionItem 
                key={faq.id} 
                value={faq.id}
                className="bg-slate-50 rounded-2xl border-0 px-6"
              >
                <AccordionTrigger className="text-left font-semibold text-slate-900 hover:no-underline py-6">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 leading-relaxed pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </>
  );
}