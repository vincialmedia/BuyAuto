"use client";

import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Head from "next/head";
import Link from "next/link";
import { HelpCircle, Sparkles, ChevronRight } from "lucide-react";

const faqs = [
  {
    id: "faq-1",
    question: "Was ist eine Leasingübernahme?",
    answer: "Eine Leasingübernahme in der Schweiz bedeutet, dass du einen bestehenden Auto-Leasingvertrag von einer anderen Person übernimmst, statt ein neues Leasing abzuschliessen. Du wirst dabei als neue:r Leasingnehmer:in in den Vertrag eingetragen und übernimmst die noch verbleibende Laufzeit, die vereinbarten Kilometer und den Restwert. Der grosse Vorteil: Die teure Anfangsphase des Leasings ist bereits bezahlt, sodass du oft von tieferen Raten und einer kürzeren Restlaufzeit profitierst. Für viele ist die Leasingübernahme die flexibelste Lösung zwischen Kauf, Neu-Leasing und Auto-Abo – besonders, wenn du ein gut ausgestattetes Fahrzeug suchst und nicht jahrelang gebunden sein willst.\n\nEine ausführliche Erklärung findest du in unserem Ratgeber zur Leasingübernahme.",
    answerJSX: (
      <>
        Eine Leasingübernahme in der Schweiz bedeutet, dass du einen bestehenden Auto-Leasingvertrag von einer anderen Person übernimmst, statt ein neues Leasing abzuschliessen. Du wirst dabei als neue:r Leasingnehmer:in in den Vertrag eingetragen und übernimmst die noch verbleibende Laufzeit, die vereinbarten Kilometer und den Restwert. Der grosse Vorteil: Die teure Anfangsphase des Leasings ist bereits bezahlt, sodass du oft von tieferen Raten und einer kürzeren Restlaufzeit profitierst.
        <br /><br />
        Eine ausführliche Erklärung findest du in unserem{" "}
        <Link href="/leasinguebernahme" className="text-red-500 hover:text-red-600 underline underline-offset-2 font-semibold transition-colors">
          Ratgeber zur Leasingübernahme
        </Link>
        .
      </>
    )
  },
  {
    id: "faq-2",
    question: "Wie funktioniert eine Leasingübernahme mit BuyAuto?",
    answer: "Die Leasingübernahme über BuyAuto.ch funktioniert in wenigen einfachen Schritten. Zuerst suchst du auf unserer Plattform nach einem passenden Leasingauto in der Schweiz, das zur Übernahme angeboten wird. Sobald du ein interessantes Fahrzeug gefunden hast, kontaktierst du die aktuelle Leasingnehmerin oder den Leasingnehmer direkt über BuyAuto. Danach prüft die Leasinggesellschaft deine Bonität und entscheidet, ob du den bestehenden Leasingvertrag übernehmen darfst. Wenn alles passt, wird der Vertrag offiziell auf dich übertragen – inklusive Restlaufzeit, Kilometerlimit und vereinbartem Restwert. Anschliessend erfolgt die Fahrzeugübergabe und du kannst sofort losfahren.\n\nEine ausführliche Schritt-für-Schritt-Anleitung findest du auf unserer Seite zur Leasingübernahme.",
    answerJSX: (
      <>
        Die Leasingübernahme über BuyAuto.ch funktioniert in wenigen einfachen Schritten. Zuerst suchst du auf unserer Plattform nach einem passenden Leasingauto in der Schweiz. Sobald du ein interessantes Fahrzeug gefunden hast, kontaktierst du die aktuelle Leasingnehmerin oder den Leasingnehmer direkt über BuyAuto. Danach prüft die Leasinggesellschaft deine Bonität und entscheidet, ob du den bestehenden Leasingvertrag übernehmen darfst.
        <br /><br />
        Eine ausführliche Schritt-für-Schritt-Anleitung findest du auf unserer{" "}
        <Link href="/leasinguebernahme" className="text-red-500 hover:text-red-600 underline underline-offset-2 font-semibold transition-colors">
          Seite zur Leasingübernahme
        </Link>
        .
      </>
    )
  },
  {
    id: "faq-3",
    question: "Welche Voraussetzungen muss ich für eine Leasingübernahme erfüllen?",
    answer: "Um eine Leasingübernahme in der Schweiz machen zu können, brauchst du vor allem eine stabile finanzielle Situation und eine positive Bonitätsprüfung. Die Leasinggesellschaft prüft dabei dein Einkommen, deine laufenden Verpflichtungen und mögliche Einträge im Betreibungsregister. Wichtig ist ausserdem, dass du volljährig bist und einen festen Wohnsitz in der Schweiz hast, da der bestehende Auto-Leasingvertrag vollständig auf dich übertragen wird. Je besser deine finanzielle Ausgangslage, desto höher die Chance, dass die Bank deine Anfrage akzeptiert. Falls du dir unsicher bist, ob du alle Anforderungen erfüllst, lohnt sich ein Blick in unseren ausführlichen Leitfaden zur Leasingübernahme.\n\nMehr Details findest du in unserem Ratgeber zu den Voraussetzungen der Leasingübernahme.",
    answerJSX: (
      <>
        Um eine Leasingübernahme in der Schweiz machen zu können, brauchst du vor allem eine stabile finanzielle Situation und eine positive Bonitätsprüfung. Die Leasinggesellschaft prüft dabei dein Einkommen, deine laufenden Verpflichtungen und mögliche Einträge im Betreibungsregister. Wichtig ist ausserdem, dass du volljährig bist und einen festen Wohnsitz in der Schweiz hast.
        <br /><br />
        Mehr Details findest du in unserem{" "}
        <Link href="/leasinguebernahme" className="text-red-500 hover:text-red-600 underline underline-offset-2 font-semibold transition-colors">
          Ratgeber zu den Voraussetzungen
        </Link>
        .
      </>
    )
  },
  {
    id: "faq-4",
    question: "Was kostet eine Leasingübernahme?",
    answer: "Die Kosten einer Leasingübernahme in der Schweiz setzen sich aus drei Bestandteilen zusammen: Erstens zahlst du die monatliche Leasingrate, die bereits im bestehenden Vertrag festgelegt ist. Zweitens kann eine Ablösesumme an die bisherige Leasingnehmerin oder den bisherigen Leasingnehmer anfallen – zum Beispiel, wenn bereits eine hohe Anzahlung geleistet wurde. Drittens verlangen viele Leasinggesellschaften eine kleine Vertrags- oder Dossiergebühr für die Übertragung des Auto-Leasings. Zusätzlich kommen wie immer die laufenden Kosten wie Versicherung, Service und Motorfahrzeugsteuer dazu. Oft ist eine Leasingübernahme trotzdem günstiger als ein neues Leasing, weil die teure Anfangsphase schon abgeschlossen ist.\n\nEine komplette Übersicht findest du in unserem Leitfaden zu den Kosten der Leasingübernahme.",
    answerJSX: (
      <>
        Die Kosten einer Leasingübernahme in der Schweiz setzen sich aus drei Bestandteilen zusammen: die monatliche Leasingrate, eine mögliche Ablösesumme an die bisherige Person, und eine kleine Dossiergebühr der Leasinggesellschaft. Oft ist eine Leasingübernahme trotzdem günstiger als ein neues Leasing, weil die teure Anfangsphase schon abgeschlossen ist.
        <br /><br />
        Eine komplette Übersicht findest du in unserem{" "}
        <Link href="/leasinguebernahme-kosten" className="text-red-500 hover:text-red-600 underline underline-offset-2 font-semibold transition-colors">
          Leitfaden zu den Kosten
        </Link>
        .
      </>
    )
  },
  {
    id: "faq-5",
    question: "Welche Risiken oder Nachteile hat eine Leasingübernahme?",
    answer: "Bei einer Leasingübernahme in der Schweiz übernimmst du einen bestehenden Auto-Leasingvertrag – und damit auch dessen Bedingungen. Das bedeutet: Die Laufzeit, das Kilometerlimit und der vereinbarte Restwert sind bereits fix und können oft nicht mehr angepasst werden. Überschreitest du die Kilometer oder wurden frühere Schäden nicht sauber dokumentiert, kann es bei der Rückgabe zu zusätzlichen Kosten kommen. Auch die Leasingbank kann die Übernahme ablehnen, wenn deine Bonitätsprüfung nicht ausreicht. Deshalb ist es wichtig, das Fahrzeug genau anzuschauen, ein Übergabeprotokoll zu machen und den Vertrag vorab gründlich zu prüfen.\n\nMehr Infos findest du in unserem Leitfaden zu den Risiken einer Leasingübernahme.",
    answerJSX: (
      <>
        Bei einer Leasingübernahme übernimmst du einen bestehenden Vertrag – und damit auch dessen Bedingungen. Die Laufzeit, das Kilometerlimit und der Restwert sind fix. Deshalb ist es wichtig, das Fahrzeug genau anzuschauen, ein Übergabeprotokoll zu machen und den Vertrag vorab gründlich zu prüfen.
        <br /><br />
        Mehr Infos findest du in unserem{" "}
        <Link href="/leasinguebernahme" className="text-red-500 hover:text-red-600 underline underline-offset-2 font-semibold transition-colors">
          Leitfaden zu den Risiken
        </Link>
        .
      </>
    )
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
      
      <section className="py-24 md:py-32 px-4 bg-gradient-to-b from-white via-neutral-50 to-white relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-red-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "4s" }} />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "5s", animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-orange-500/3 to-red-500/3 rounded-full blur-3xl" />
        
        <div className="max-w-4xl mx-auto relative z-10">
          {/* Section header */}
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-red-500/10 to-orange-500/10 text-red-600 text-sm font-bold uppercase tracking-wider mb-5 hover:scale-105 transition-transform cursor-default">
              <HelpCircle className="w-4 h-4" />
              FAQ
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-neutral-900 mb-5 tracking-tight">
              Häufig gestellte{" "}
              <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">Fragen</span>
            </h2>
            <p className="text-lg md:text-xl text-neutral-500 max-w-2xl mx-auto leading-relaxed">
              Alles was du über Leasingübernahmen in der Schweiz wissen musst
            </p>
          </div>

          {/* Accordion */}
          <Accordion 
            type="single" 
            collapsible 
            className="w-full space-y-4"
            value={openItem}
            onValueChange={setOpenItem}
          >
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={faq.id} 
                value={faq.id}
                className="group bg-white rounded-2xl border-2 border-neutral-200 hover:border-red-200 px-6 md:px-8 transition-all duration-300 data-[state=open]:border-red-300 data-[state=open]:shadow-xl data-[state=open]:shadow-red-500/5 overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <AccordionTrigger className="text-left font-bold text-neutral-900 hover:no-underline py-6 md:py-7 hover:text-red-600 transition-colors duration-200 text-base md:text-lg leading-relaxed gap-4 [&[data-state=open]>svg]:text-red-500">
                  <span className="flex items-start gap-4">
                    <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-200 group-data-[state=open]:from-red-500 group-data-[state=open]:to-orange-500 flex items-center justify-center transition-all duration-300">
                      <span className="text-sm font-black text-neutral-400 group-data-[state=open]:text-white transition-colors">
                        {index + 1}
                      </span>
                    </span>
                    <span className="pt-0.5">{faq.question}</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-7 text-base md:text-lg pl-12">
                  <div className="border-l-2 border-red-200 pl-5 py-1">
                    {faq.answerJSX || faq.answer}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          
          {/* Bottom CTA */}
          <div className="mt-12 text-center">
            <p className="text-neutral-500 mb-4">Hast du weitere Fragen?</p>
            <Link 
              href="/leasinguebernahme"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold hover:shadow-lg hover:shadow-red-500/25 hover:scale-105 transition-all duration-300"
            >
              <Sparkles className="w-4 h-4" />
              Zum vollständigen Ratgeber
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}