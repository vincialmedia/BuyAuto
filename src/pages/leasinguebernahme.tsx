
import Head from "next/head";
import Link from "next/link";
import { Check, ChevronRight, AlertTriangle, FileText, Info, ShieldCheck } from "lucide-react";
import SearchForm from "@/components/buyauto/SearchForm";
import PremiumListings from "@/components/buyauto/PremiumListings";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function LeasingUebernahmePage() {
  return (
    <>
      <Head>
        <title>Leasingübernahme in der Schweiz – Ablauf, Kosten & Vorteile | BuyAuto</title>
        <meta
          name="description"
          content="Alles, was du über die Übernahme eines bestehenden Auto-Leasingvertrags wissen musst. Ablauf, Kosten und Vorteile für Käufer und Verkäufer in der Schweiz."
        />
        <link rel="canonical" href="https://www.buyauto.ch/leasinguebernahme" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Leasingübernahme in der Schweiz – Ablauf, Kosten & Vorteile" />
        <meta property="og:description" content="Alles, was du über die Übernahme eines bestehenden Auto-Leasingvertrags wissen musst – klar erklärt für Käufer und Verkäufer." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://www.buyauto.ch/leasinguebernahme" />
      </Head>

      <main className="bg-neutral-50 min-h-screen">
        
        {/* SECTION 1 — HERO (Text-Only Hero) */}
        <section className="bg-white pt-12 pb-8 md:pt-20 md:pb-12 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-neutral-900 tracking-tight mb-6 leading-tight">
              Leasingübernahme in der Schweiz – <br className="hidden md:block" />
              <span className="text-red-600">Ablauf, Kosten & Vorteile</span>
            </h1>
            <p className="text-lg md:text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed">
              Alles, was du über die Übernahme eines bestehenden Auto-Leasingvertrags wissen musst – klar erklärt für Käufer und Verkäufer.
            </p>
          </div>
        </section>

        {/* SECTION 2 — SHORT INTRO */}
        <section className="bg-white pb-8 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-neutral-700 text-base md:text-lg leading-relaxed">
              Die Leasingübernahme ist eine der flexibelsten Möglichkeiten, ein Auto in der Schweiz zu fahren. Du übernimmst einen bestehenden Leasingvertrag, profitierst von attraktiven Konditionen und kürzeren Restlaufzeiten – ohne hohe Anzahlung und ohne langfristige Bindung. Hier erfährst du Schritt für Schritt, wie der Prozess funktioniert, was es kostet und worauf du achten musst.
            </p>
          </div>
        </section>

        {/* SECTION 3 — SEARCH BAR COMPONENT */}
        <section className="bg-white pb-16 px-4 relative z-10">
          <div className="max-w-5xl mx-auto -mt-4">
             <div className="text-center mb-8">
               <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-3">
                 Angebote Entdecken
               </h2>
               <p className="text-neutral-600 max-w-xl mx-auto">
                 Finde jetzt verfügbare Leasingübernahmen mit unserer intelligenten Suche.
               </p>
             </div>
             <div className="relative">
                {/* Optional decorative element behind search bar */}
                <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 to-orange-500/20 blur-lg opacity-50 rounded-[2rem]"></div>
                <SearchForm />
             </div>
          </div>
        </section>

        {/* SECTION 4 — MAIN CONTENT */}
        <section className="py-12 md:py-20 px-4">
          <div className="max-w-4xl mx-auto space-y-16">
            
            {/* Was ist eine Leasingübernahme? */}
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-neutral-900">Was ist eine Leasingübernahme?</h2>
              <div className="prose prose-lg text-neutral-700 max-w-none leading-relaxed">
                <p>
                  Bei einer Leasingübernahme übernimmst du einen laufenden Auto-Leasingvertrag von einer anderen Person. Vertragskonditionen wie Restlaufzeit, Kilometerlimit und monatliche Rate bleiben in der Regel bestehen – du steigst einfach in den Vertrag ein. Die grosse Stärke: Die teure Anfangsphase des Leasings ist bereits bezahlt, sodass du oft von tieferen Raten und besseren Konditionen profitierst.
                </p>
                <p>
                  Die Leasingübernahme ist in der Schweiz besonders beliebt, weil Leasingverträge häufig vorzeitig beendet werden sollen – aber eine Kündigung meist teuer wäre. Mit einer Übernahme profitieren beide Seiten.
                </p>
              </div>
            </div>

            {/* Warum ist die Leasingübernahme in der Schweiz so beliebt? */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-neutral-100">
              <h2 className="text-2xl font-bold text-neutral-900 mb-8">Warum ist die Leasingübernahme in der Schweiz so beliebt?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { title: "Hohe Anfangsabschreibung entfällt", desc: "Grosse Ersparnis gegenüber Neuwagen." },
                  { title: "Kürzere Restlaufzeiten", desc: "Perfekte Lösung für flexible Fahrer." },
                  { title: "Attraktive Monatsraten", desc: "Deutlich günstiger als Neuleasing." },
                  { title: "Kein hoher Kapitalbedarf", desc: "Oft keine Anzahlung nötig." },
                  { title: "Schneller Prozess", desc: "Viele Verträge lassen sich innert Tagen übertragen." },
                  { title: "Transparenz", desc: "Fahrzeugzustand ist bereits bekannt." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="mt-1 bg-red-50 p-2 rounded-full h-fit">
                      <Check className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-neutral-900">{item.title}</h3>
                      <p className="text-neutral-600 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Voraussetzungen */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-neutral-900">Voraussetzungen für eine Leasingübernahme (Schweiz)</h2>
              <p className="text-neutral-700 mb-4">Um eine Leasingübernahme durchzuführen, brauchst du:</p>
              <Card className="bg-neutral-50 border-none">
                <CardContent className="p-6">
                  <ul className="space-y-3">
                    {[
                      "Wohnsitz in der Schweiz",
                      "Volljährigkeit",
                      "Stabile finanzielle Situation",
                      "Erfolgreiche Bonitätsprüfung durch die Leasingbank",
                      "Keine relevanten offenen Betreibungen",
                      "Gültige Fahrerlaubnis (logisch, aber gehört offiziell dazu)"
                    ].map((req, i) => (
                      <li key={i} className="flex items-center gap-3 text-neutral-700">
                        <div className="w-2 h-2 bg-neutral-400 rounded-full"></div>
                        {req}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-6 text-sm text-neutral-500 italic bg-white p-4 rounded-xl border border-neutral-200 inline-block">
                    <Info className="w-4 h-4 inline mr-2 align-text-bottom" />
                    Die Leasingbank entscheidet schlussendlich, ob du als neuer Vertragspartner akzeptiert wirst. Je besser deine Bonität, desto schneller läuft der Prozess.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Ablauf */}
            <div className="space-y-8">
               <h2 className="text-2xl font-bold text-neutral-900">Ablauf der Leasingübernahme – Schritt für Schritt</h2>
               <div className="space-y-6 relative before:absolute before:left-4 before:top-4 before:h-full before:w-0.5 before:bg-neutral-200 before:hidden md:before:block">
                  {[
                    { step: 1, title: "Passendes Fahrzeug finden", desc: "Du suchst auf BuyAuto ein Leasingfahrzeug, das zur Übernahme angeboten wird." },
                    { step: 2, title: "Kontakt aufnehmen", desc: "Du klärst direkt mit der aktuellen Leasingnehmerin/dem Leasingnehmer offene Fragen zu Zustand, Kilometerstand, Ablöse etc." },
                    { step: 3, title: "Bonitätsprüfung der Leasingbank", desc: "Die Leasingfirma prüft deine Kreditwürdigkeit und gibt den Vertrag frei oder lehnt ab." },
                    { step: 4, title: "Vertragsübernahme unterschreiben", desc: "Wird alles bewilligt, erstellt die Bank die Übernahmeunterlagen." },
                    { step: 5, title: "Fahrzeugübergabe", desc: "Ihr trefft euch, erstellt ein Übergabeprotokoll und das Auto gehört für die Restlaufzeit offiziell dir." }
                  ].map((item) => (
                    <div key={item.step} className="relative flex flex-col md:flex-row gap-6 md:items-start bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 z-10">
                       <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-red-200">
                         {item.step}
                       </div>
                       <div>
                         <h3 className="text-lg font-bold text-neutral-900 mb-2">{item.title}</h3>
                         <p className="text-neutral-600">{item.desc}</p>
                       </div>
                    </div>
                  ))}
               </div>
               <p className="text-neutral-500 text-center font-medium">In vielen Fällen dauert der gesamte Prozess nur wenige Tage.</p>
            </div>

            {/* Kosten */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
               <div className="space-y-6">
                 <h2 className="text-2xl font-bold text-neutral-900">Kosten einer Leasingübernahme</h2>
                 <p className="text-neutral-600">Die Gesamtkosten setzen sich aus folgenden Punkten zusammen:</p>
                 <div className="space-y-4">
                    {[
                      { title: "1. Monatliche Leasingrate", desc: "Diese ist bereits im bestehenden Vertrag festgelegt." },
                      { title: "2. Ablösesumme (optional)", desc: "Manchmal verlangt der bisherige Leasingnehmer eine kleine Ablöse, wenn er z. B. viel vorausbezahlt hat oder das Auto über dem Restwert steht." },
                      { title: "3. Dossier- oder Vertragsgebühr", desc: "Viele Leasinggesellschaften verlangen CHF 100–400 für die Vertragsübertragung." },
                      { title: "4. Laufende Kosten", desc: "Versicherung, Service, Motorfahrzeugsteuer, Reifenmanagement, etc." }
                    ].map((cost, i) => (
                      <div key={i} className="bg-white p-4 rounded-xl border border-neutral-200">
                        <h4 className="font-bold text-neutral-900 text-sm mb-1">{cost.title}</h4>
                        <p className="text-neutral-600 text-sm">{cost.desc}</p>
                      </div>
                    ))}
                 </div>
                 <div className="bg-green-50 p-4 rounded-xl border border-green-100 text-green-800 text-sm font-medium flex gap-3 items-center">
                    <div className="bg-white p-1 rounded-full shadow-sm"><Check className="w-4 h-4 text-green-600" /></div>
                    <span>Vorteil: Oft ist eine Leasingübernahme bis zu mehrere tausend Franken günstiger als ein neues Leasing.</span>
                 </div>
               </div>
               
               {/* Käufer vs Verkäufer Vorteile */}
               <div className="bg-neutral-900 text-white p-8 rounded-3xl">
                 <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <ShieldCheck className="w-6 h-6 text-red-500" />
                    Vorteile auf einen Blick
                 </h3>
                 
                 <div className="space-y-8">
                   <div>
                     <h4 className="text-neutral-400 text-sm uppercase tracking-wider font-semibold mb-4">Für Käufer</h4>
                     <ul className="space-y-3">
                       {[
                         "Geringere Monatsraten",
                         "Keine teure Anfangsphase",
                         "Keine oder geringe Anzahlung",
                         "Transparenter Fahrzeugzustand",
                         "Kürzere Bindung",
                         "Sofort verfügbar"
                       ].map((item, i) => (
                         <li key={i} className="flex items-center gap-3 text-neutral-200 text-sm">
                           <Check className="w-4 h-4 text-green-500 shrink-0" />
                           {item}
                         </li>
                       ))}
                     </ul>
                   </div>
                   
                   <Separator className="bg-neutral-800" />
                   
                   <div>
                     <h4 className="text-neutral-400 text-sm uppercase tracking-wider font-semibold mb-4">Für Verkäufer</h4>
                     <ul className="space-y-3">
                       {[
                         "Vertrag ohne hohe Strafzahlung loswerden",
                         "Keine Rückgabe an die Garage mit Verlust",
                         "Flexibler Ausstieg bei Lebensveränderungen",
                         "Direkte Kontaktaufnahme über BuyAuto",
                         "Schneller Übertragungsprozess"
                       ].map((item, i) => (
                         <li key={i} className="flex items-center gap-3 text-neutral-200 text-sm">
                           <Check className="w-4 h-4 text-green-500 shrink-0" />
                           {item}
                         </li>
                       ))}
                     </ul>
                   </div>
                 </div>
               </div>
            </div>

            {/* Risiken */}
            <div className="bg-orange-50 border border-orange-100 p-8 rounded-3xl">
              <h2 className="text-2xl font-bold text-orange-900 mb-4 flex items-center gap-3">
                <AlertTriangle className="w-6 h-6" />
                Risiken & worauf du achten musst
              </h2>
              <p className="text-orange-800 mb-6">Eine Leasingübernahme ist sicher – aber nur, wenn du Folgendes beachtest:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  "Kilometerlimit prüfen (und realistisch einschätzen)",
                  "Vorhandene Schäden dokumentieren",
                  "Serviceheft kontrollieren",
                  "Reifen & Ausstattung checken",
                  "Rückgaberegeln der Leasingbank unbedingt lesen",
                  "Übergabeprotokoll immer erstellen",
                  "Bonitätsentscheidung der Bank abwarten (nichts vorher zahlen)"
                ].map((risk, i) => (
                  <div key={i} className="flex items-start gap-3 text-orange-900 text-sm bg-white/60 p-3 rounded-lg">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1.5 shrink-0"></div>
                    {risk}
                  </div>
                ))}
              </div>
              <p className="mt-6 font-medium text-orange-900">Wenn du diese Punkte beachtest, minimierst du alle Risiken.</p>
            </div>

            {/* Comparison Table */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-neutral-900">Vergleich: Welches Modell passt zu dir?</h2>
              <div className="overflow-x-auto rounded-xl border border-neutral-200 shadow-sm">
                <table className="w-full bg-white text-left text-sm">
                  <thead className="bg-neutral-50 text-neutral-900 border-b border-neutral-200">
                    <tr>
                      <th className="p-4 font-bold">Modell</th>
                      <th className="p-4 font-bold">Vorteile</th>
                      <th className="p-4 font-bold">Nachteile</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    <tr className="bg-red-50/50">
                      <td className="p-4 font-bold text-neutral-900">Leasingübernahme</td>
                      <td className="p-4 text-green-700 font-medium">Günstig, flexibel, keine Anzahlung</td>
                      <td className="p-4 text-neutral-600">Fixe Vertragsbedingungen</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium text-neutral-900">Neu-Leasing</td>
                      <td className="p-4 text-neutral-600">Freie Fahrzeugwahl</td>
                      <td className="p-4 text-neutral-600">Lange Laufzeit, hohe Anzahlung</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium text-neutral-900">Kauf</td>
                      <td className="p-4 text-neutral-600">Du bist Eigentümer</td>
                      <td className="p-4 text-neutral-600">Hoher Wertverlust, Kapitalbindung</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium text-neutral-900">Auto-Abo</td>
                      <td className="p-4 text-neutral-600">Alles inkl., flexibel</td>
                      <td className="p-4 text-neutral-600">Teurer pro Monat</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-center text-neutral-500 italic">Für viele ist die Leasingübernahme der beste Mix aus Preis, Flexibilität und Sicherheit.</p>
            </div>

            {/* Checklist */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-neutral-200">
              <h2 className="text-2xl font-bold text-neutral-900 mb-6 flex items-center gap-3">
                <FileText className="w-6 h-6 text-neutral-400" />
                Checkliste für eine sichere Leasingübernahme
              </h2>
              <div className="space-y-4">
                {[
                  "Vertrag vollständig lesen",
                  "Restwert prüfen",
                  "Kilometerstand dokumentieren",
                  "Fotos vom Fahrzeugzustand machen",
                  "Protokoll bei Übergabe ausfüllen",
                  "Bestätigung der Leasingbank abwarten",
                  "Versicherung für den ersten Tag bereit haben"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 group">
                    <div className="w-6 h-6 rounded-full border-2 border-neutral-200 flex items-center justify-center group-hover:border-red-500 group-hover:bg-red-50 transition-colors">
                      <div className="w-2.5 h-2.5 rounded-full bg-transparent group-hover:bg-red-500 transition-colors"></div>
                    </div>
                    <span className="text-neutral-700 font-medium group-hover:text-neutral-900 transition-colors">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-neutral-900">FAQ – Leasingübernahme (kurz & präzise)</h2>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1" className="border-b-neutral-200">
                  <AccordionTrigger className="text-neutral-900 font-medium hover:text-red-600 hover:no-underline">Wie schnell geht eine Leasingübernahme?</AccordionTrigger>
                  <AccordionContent className="text-neutral-600">
                    Zwischen wenigen Tagen und zwei Wochen – je nach Bank und Unterlagen.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2" className="border-b-neutral-200">
                  <AccordionTrigger className="text-neutral-900 font-medium hover:text-red-600 hover:no-underline">Kann jede Person eine Leasingübernahme machen?</AccordionTrigger>
                  <AccordionContent className="text-neutral-600">
                    Nein. Die Bank entscheidet anhand der Bonitätsprüfung.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3" className="border-b-0">
                  <AccordionTrigger className="text-neutral-900 font-medium hover:text-red-600 hover:no-underline">Was passiert mit Schäden?</AccordionTrigger>
                  <AccordionContent className="text-neutral-600">
                    Alle Vorschäden müssen dokumentiert werden; sonst können bei Rückgabe Kosten entstehen.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

          </div>
        </section>

        {/* SECTION 5 — CTA BLOCK */}
        <section className="py-20 bg-neutral-900 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Bereit für deine Leasingübernahme?</h2>
            <p className="text-neutral-400 max-w-2xl mx-auto text-lg">
              Starte jetzt und finde dein Traumauto oder gib deinen Vertrag flexibel weiter.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button asChild size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20 rounded-xl">
                <Link href="/suche">Fahrzeuge durchsuchen</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold border-neutral-700 text-neutral-900 hover:bg-neutral-800 hover:text-white rounded-xl bg-white hover:border-neutral-600">
                <Link href="/inserat-erstellen">Inserat erstellen</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* SECTION 6 — PREMIUM LISTINGS */}
        <PremiumListings />
        
      </main>
    </>
  );
}
