import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from 'buyauto';

// `defaultValue` opens one item so the card shows both the collapsed and the
// expanded state at once. Content copy is real FAQ text from the site.
export function FAQ() {
  return (
    <Accordion type="single" collapsible defaultValue="faq-1" className="w-full max-w-xl">
      <AccordionItem value="faq-1">
        <AccordionTrigger>Was ist eine Leasingübernahme?</AccordionTrigger>
        <AccordionContent>
          Bei einer Leasingübernahme übernimmst du einen bestehenden Leasingvertrag von einer
          anderen Person — zu den bestehenden Konditionen und ohne Neuabschluss.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="faq-2">
        <AccordionTrigger>Was kostet ein Inserat?</AccordionTrigger>
        <AccordionContent>Für Privatpersonen ist das erste Inserat 30 Tage kostenlos.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="faq-3">
        <AccordionTrigger>Kann ich mein Leasing vorzeitig abgeben?</AccordionTrigger>
        <AccordionContent>Ja — sofern deine Leasinggesellschaft eine Übernahme zulässt.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export function Multiple() {
  return (
    <Accordion type="multiple" defaultValue={['a', 'b']} className="w-full max-w-xl">
      <AccordionItem value="a">
        <AccordionTrigger>Fahrzeugdaten</AccordionTrigger>
        <AccordionContent>BMW 320d Touring, 2022, 42’000 km, Diesel, Automatik.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="b">
        <AccordionTrigger>Leasingdetails</AccordionTrigger>
        <AccordionContent>CHF 489/Mt., Restlaufzeit 23 Monate, Anzahlung CHF 0.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
