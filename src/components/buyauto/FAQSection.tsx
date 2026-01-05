"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Head from "next/head";
import Link from "next/link";

const faqs = [
  {
    id: "faq-1",
    question: "Was ist eine Leasingübernahme?",
    answer: "Eine Leasingübernahme in der Schweiz bedeutet, dass du einen bestehenden Auto-Leasingvertrag von einer anderen Person übernimmst, statt ein neues Leasing abzuschliessen. Du wirst dabei als neue:r Leasingnehmer:in in den Vertrag eingetragen und übernimmst die noch verbleibende Laufzeit, die vereinbarten Kilometer und den Restwert. Der grosse Vorteil: Die teure Anfangsphase des Leasings ist bereits bezahlt, sodass du oft von tieferen Raten und einer kürzeren Restlaufzeit profitierst. Für viele ist die Leasingübernahme die flexibelste Lösung zwischen Kauf, Neu-Leasing und Auto-Abo – besonders, wenn du ein gut ausgestattetes Fahrzeug suchst und nicht jahrelang gebunden sein willst.\n\nEine ausführliche Erklärung findest du in unserem Ratgeber zur Leasingübernahme.",
    answerJSX: (
      <>
        Eine Leasingübernahme in der Schweiz bedeutet, dass du einen bestehenden Auto-Leasingvertrag von einer anderen Person übernimmst, statt ein neues Leasing abzuschliessen. Du wirst dabei als neue:r Leasingnehmer:in in den Vertrag eingetragen und übernimmst die noch verbleibende Laufzeit, die vereinbarten Kilometer und den Restwert. Der grosse Vorteil: Die teure Anfangsphase des Leasings ist bereits bezahlt, sodass du oft von tieferen Raten und einer kürzeren Restlaufzeit profitierst. Für viele ist die Leasingübernahme die flexibelste Lösung zwischen Kauf, Neu-Leasing und Auto-Abo – besonders, wenn du ein gut ausgestattetes Fahrzeug suchst und nicht jahrelang gebunden sein willst.
        {"\n\n"}
        Eine ausführliche Erklärung findest du in unserem{" "}
        <Link href="/leasinguebernahme" className="text-primary hover:underline font-bold">
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
        Die Leasingübernahme über BuyAuto.ch funktioniert in wenigen einfachen Schritten. Zuerst suchst du auf unserer Plattform nach einem passenden Leasingauto in der Schweiz, das zur Übernahme angeboten wird. Sobald du ein interessantes Fahrzeug gefunden hast, kontaktierst du die aktuelle Leasingnehmerin oder den Leasingnehmer direkt über BuyAuto. Danach prüft die Leasinggesellschaft deine Bonität und entscheidet, ob du den bestehenden Leasingvertrag übernehmen darfst. Wenn alles passt, wird der Vertrag offiziell auf dich übertragen – inklusive Restlaufzeit, Kilometerlimit und vereinbartem Restwert. Anschliessend erfolgt die Fahrzeugübergabe und du kannst sofort losfahren.
        {"\n\n"}
        Eine ausführliche Schritt-für-Schritt-Anleitung findest du auf unserer{" "}
        <Link href="/leasinguebernahme" className="text-primary hover:underline font-bold">
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
        Um eine Leasingübernahme in der Schweiz machen zu können, brauchst du vor allem eine stabile finanzielle Situation und eine positive Bonitätsprüfung. Die Leasinggesellschaft prüft dabei dein Einkommen, deine laufenden Verpflichtungen und mögliche Einträge im Betreibungsregister. Wichtig ist ausserdem, dass du volljährig bist und einen festen Wohnsitz in der Schweiz hast, da der bestehende Auto-Leasingvertrag vollständig auf dich übertragen wird. Je besser deine finanzielle Ausgangslage, desto höher die Chance, dass die Bank deine Anfrage akzeptiert. Falls du dir unsicher bist, ob du alle Anforderungen erfüllst, lohnt sich ein Blick in unseren ausführlichen Leitfaden zur Leasingübernahme.
        {"\n\n"}
        Mehr Details findest du in unserem{" "}
        <Link href="/leasinguebernahme" className="text-primary hover:underline font-bold">
          Ratgeber zu den Voraussetzungen der Leasingübernahme
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
        Die Kosten einer Leasingübernahme in der Schweiz setzen sich aus drei Bestandteilen zusammen: Erstens zahlst du die monatliche Leasingrate, die bereits im bestehenden Vertrag festgelegt ist. Zweitens kann eine Ablösesumme an die bisherige Leasingnehmerin oder den bisherigen Leasingnehmer anfallen – zum Beispiel, wenn bereits eine hohe Anzahlung geleistet wurde. Drittens verlangen viele Leasinggesellschaften eine kleine Vertrags- oder Dossiergebühr für die Übertragung des Auto-Leasings. Zusätzlich kommen wie immer die laufenden Kosten wie Versicherung, Service und Motorfahrzeugsteuer dazu. Oft ist eine Leasingübernahme trotzdem günstiger als ein neues Leasing, weil die teure Anfangsphase schon abgeschlossen ist.
        {"\n\n"}
        Eine komplette Übersicht findest du in unserem{" "}
        <Link href="/leasinguebernahme" className="text-primary hover:underline font-bold">
          Leitfaden zu den Kosten der Leasingübernahme
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
        Bei einer Leasingübernahme in der Schweiz übernimmst du einen bestehenden Auto-Leasingvertrag – und damit auch dessen Bedingungen. Das bedeutet: Die Laufzeit, das Kilometerlimit und der vereinbarte Restwert sind bereits fix und können oft nicht mehr angepasst werden. Überschreitest du die Kilometer oder wurden frühere Schäden nicht sauber dokumentiert, kann es bei der Rückgabe zu zusätzlichen Kosten kommen. Auch die Leasingbank kann die Übernahme ablehnen, wenn deine Bonitätsprüfung nicht ausreicht. Deshalb ist es wichtig, das Fahrzeug genau anzuschauen, ein Übergabeprotokoll zu machen und den Vertrag vorab gründlich zu prüfen.
        {"\n\n"}
        Mehr Infos findest du in unserem{" "}
        <Link href="/leasinguebernahme" className="text-primary hover:underline font-bold">
          Leitfaden zu den Risiken einer Leasingübernahme
        </Link>
        .
      </>
    )
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
      
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-neutral-900 mb-4 tracking-tight">
              Häufig gestellte <span className="text-primary">Fragen</span>
            </h2>
            <p className="text-lg md:text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed">
              Alles was du über Leasingübernahmen wissen musst
            </p>
          </div>

          {/* Accordion */}
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq) => (
              <AccordionItem 
                key={faq.id} 
                value={faq.id}
                className="bg-neutral-50 rounded-3xl border-2 border-neutral-200 px-8 hover:border-primary/50 transition-all duration-300 data-[state=open]:bg-white data-[state=open]:shadow-lg"
              >
                <AccordionTrigger className="text-left font-black text-neutral-900 hover:no-underline py-8 hover:text-primary transition-colors duration-200 text-lg md:text-xl leading-relaxed">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 leading-relaxed pb-8 whitespace-pre-line text-base md:text-lg">
                  {faq.answerJSX || faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </>
  );
}