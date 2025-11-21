"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Head from "next/head";

const faqs = [
  {
    id: "faq-1",
    question: "Was ist eine Leasingübernahme?",
    answer: "Eine Leasingübernahme in der Schweiz bedeutet, dass du einen bestehenden Auto-Leasingvertrag von einer anderen Person übernimmst, statt ein neues Leasing abzuschliessen. Du wirst dabei als neue:r Leasingnehmer:in in den Vertrag eingetragen und übernimmst die noch verbleibende Laufzeit, die vereinbarten Kilometer und den Restwert. Der grosse Vorteil: Die teure Anfangsphase des Leasings ist bereits bezahlt, sodass du oft von tieferen Raten und einer kürzeren Restlaufzeit profitierst. Für viele ist die Leasingübernahme die flexibelste Lösung zwischen Kauf, Neu-Leasing und Auto-Abo – besonders, wenn du ein gut ausgestattetes Fahrzeug suchst und nicht jahrelang gebunden sein willst.\n\nEine ausführliche Erklärung findest du in unserem Ratgeber zur Leasingübernahme."
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
      
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Swiss clean section header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light text-neutral-900 mb-3 tracking-tight">
              Häufig gestellte <span className="font-semibold text-red-500">Fragen</span>
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto font-light leading-relaxed">
              Alles was du über Leasingübernahmen wissen musst
            </p>
          </div>

          {/* Swiss minimalist accordion */}
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq) => (
              <AccordionItem 
                key={faq.id} 
                value={faq.id}
                className="bg-gradient-to-r from-neutral-50/80 to-white rounded-3xl border border-neutral-200/40 shadow-sm hover:shadow-md transition-all duration-300 px-8 hover:border-neutral-300/60"
              >
                <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-8 hover:text-red-600 transition-colors duration-200 text-base md:text-lg leading-relaxed">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-8 font-light whitespace-pre-line">
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
