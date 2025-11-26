import Head from "next/head";
import Link from "next/link";
import { Check, ChevronRight, AlertTriangle, FileText, Info, ShieldCheck, TrendingDown, Clock, Zap, Users, BadgeCheck, MapPin, Calendar, DollarSign, FileCheck, Search } from "lucide-react";
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
        
        {/* SECTION 1 — HERO (Text + Image Split) */}
        <section className="bg-gradient-to-br from-white via-neutral-50 to-red-50/30 pt-12 pb-8 md:pt-20 md:pb-12 px-4 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Text Content */}
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-semibold">
                  <TrendingDown className="w-4 h-4" />
                  Bis zu CHF 5'000 günstiger
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 tracking-tight leading-tight">
                  Leasingübernahme in der Schweiz
                </h1>
                <p className="text-xl md:text-2xl text-red-600 font-semibold">
                  Ablauf, Kosten & Vorteile
                </p>
                <p className="text-lg text-neutral-600 leading-relaxed">
                  Alles, was du über die Übernahme eines bestehenden Auto-Leasingvertrags wissen musst – klar erklärt für Käufer und Verkäufer.
                </p>
                
                {/* Quick Stats */}
                <div className="flex flex-wrap gap-6 pt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Clock className="w-5 h-5 text-green-700" />
                    </div>
                    <div>
                      <div className="text-sm text-neutral-500">Dauer</div>
                      <div className="font-bold text-neutral-900">2-7 Tage</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                      <div className="text-sm text-neutral-500">Ersparnis</div>
                      <div className="font-bold text-neutral-900">Bis CHF 5'000</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Zap className="w-5 h-5 text-purple-700" />
                    </div>
                    <div>
                      <div className="text-sm text-neutral-500">Anzahlung</div>
                      <div className="font-bold text-neutral-900">Meist CHF 0</div>
                    </div>
                  </div>
                </div>

                {/* CTA Button - Scrolls to Search */}
                <div className="pt-6">
                  <Button
                    onClick={() => {
                      const searchSection = document.getElementById("search-section");
                      if (searchSection) {
                        searchSection.scrollIntoView({ behavior: "smooth", block: "start" });
                      }
                    }}
                    size="lg"
                    className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transition-all duration-300 px-8 py-6 text-lg font-semibold rounded-xl group"
                  >
                    <Search className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                    Fahrzeuge Durchsuchen
                    <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
              
              {/* Image */}
              <div className="relative lg:block">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                  <img 
                    src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80" 
                    alt="Auto Leasingübernahme Schweiz" 
                    className="w-full h-[400px] lg:h-[500px] object-cover"
                  />
                  {/* Overlay Badge */}
                  <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-neutral-500 mb-1">Monatliche Rate ab</div>
                        <div className="text-2xl font-bold text-neutral-900">CHF 299.-</div>
                      </div>
                      <div className="bg-green-500 text-white px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-2">
                        <BadgeCheck className="w-4 h-4" />
                        Verfügbar
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating Elements */}
                <div className="hidden lg:block absolute -top-4 -right-4 bg-red-600 text-white px-6 py-3 rounded-2xl shadow-lg rotate-3 font-bold">
                  100+ Angebote
                </div>
                <div className="hidden lg:block absolute -bottom-4 -left-4 bg-neutral-900 text-white px-6 py-3 rounded-2xl shadow-lg -rotate-3 font-bold">
                  Geprüfte Inserate
                </div>
              </div>
            </div>
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

        {/* SECTION 4 — MAIN CONTENT */}
        <section className="py-12 md:py-20 px-4">
          <div className="max-w-4xl mx-auto space-y-16">
            
            {/* Was ist eine Leasingübernahme? */}
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-neutral-900 flex items-center gap-3">
                <FileCheck className="w-8 h-8 text-red-600" />
                Was ist eine Leasingübernahme?
              </h2>
              <div className="prose prose-lg text-neutral-700 max-w-none leading-relaxed">
                <p>
                  Bei einer Leasingübernahme übernimmst du einen laufenden Auto-Leasingvertrag von einer anderen Person. Vertragskonditionen wie Restlaufzeit, Kilometerlimit und monatliche Rate bleiben in der Regel bestehen – du steigst einfach in den Vertrag ein. Die grosse Stärke: Die teure Anfangsphase des Leasings ist bereits bezahlt, sodass du oft von tieferen Raten und besseren Konditionen profitierst.
                </p>
                <p>
                  Die Leasingübernahme ist in der Schweiz besonders beliebt, weil Leasingverträge häufig vorzeitig beendet werden sollen – aber eine Kündigung meist teuer wäre. Mit einer Übernahme profitieren beide Seiten.
                </p>
              </div>
            </div>

            {/* SEARCH BAR COMPONENT */}
            <div id="search-section" className="py-8 -mx-4 px-4 bg-neutral-50/80 md:bg-transparent md:p-0 md:mx-0">
              <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 md:p-8 relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
                 <div className="text-center mb-8 relative z-10">
                   <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                     Angebote Entdecken
                   </h2>
                   <p className="text-neutral-600 text-sm md:text-base">
                     Finde jetzt verfügbare Leasingübernahmen mit unserer intelligenten Suche.
                   </p>
                 </div>
                 <div className="relative z-10">
                    <SearchForm />
                 </div>
              </div>
            </div>

            {/* Warum ist die Leasingübernahme in der Schweiz so beliebt? */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-neutral-100">
              <h2 className="text-2xl font-bold text-neutral-900 mb-8">Warum ist die Leasingübernahme in der Schweiz so beliebt?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { title: "Hohe Anfangsabschreibung entfällt", desc: "Grosse Ersparnis gegenüber Neuwagen.", icon: TrendingDown },
                  { title: "Kürzere Restlaufzeiten", desc: "Perfekte Lösung für flexible Fahrer.", icon: Calendar },
                  { title: "Attraktive Monatsraten", desc: "Deutlich günstiger als Neuleasing.", icon: DollarSign },
                  { title: "Kein hoher Kapitalbedarf", desc: "Oft keine Anzahlung nötig.", icon: Zap },
                  { title: "Schneller Prozess", desc: "Viele Verträge lassen sich innert Tagen übertragen.", icon: Clock },
                  { title: "Transparenz", desc: "Fahrzeugzustand ist bereits bekannt.", icon: ShieldCheck },
                ].map((item, i) => {
                  const IconComponent = item.icon;
                  return (
                    <div key={i} className="flex gap-4">
                      <div className="mt-1 bg-red-50 p-2 rounded-full h-fit">
                        <IconComponent className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-neutral-900">{item.title}</h3>
                        <p className="text-neutral-600 text-sm">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Voraussetzungen */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
                <BadgeCheck className="w-7 h-7 text-red-600" />
                Voraussetzungen für eine Leasingübernahme (Schweiz)
              </h2>
              <p className="text-neutral-700 mb-4">Um eine Leasingübernahme durchzuführen, brauchst du:</p>
              <Card className="bg-neutral-50 border-none">
                <CardContent className="p-6">
                  <ul className="space-y-3">
                    {[
                      { text: "Wohnsitz in der Schweiz", icon: MapPin },
                      { text: "Volljährigkeit", icon: Users },
                      { text: "Stabile finanzielle Situation", icon: DollarSign },
                      { text: "Erfolgreiche Bonitätsprüfung durch die Leasingbank", icon: FileCheck },
                      { text: "Keine relevanten offenen Betreibungen", icon: BadgeCheck },
                      { text: "Gültige Fahrerlaubnis (logisch, aber gehört offiziell dazu)", icon: FileText }
                    ].map((req, i) => {
                      const IconComponent = req.icon;
                      return (
                        <li key={i} className="flex items-center gap-3 text-neutral-700">
                          <IconComponent className="w-4 h-4 text-neutral-400 shrink-0" />
                          {req.text}
                        </li>
                      );
                    })}
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
               <h2 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
                  <ChevronRight className="w-7 h-7 text-red-600" />
                  Ablauf der Leasingübernahme – Schritt für Schritt
               </h2>
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
                 <h2 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
                    <DollarSign className="w-7 h-7 text-red-600" />
                    Kosten einer Leasingübernahme
                 </h2>
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
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-neutral-900 mb-3">
                  FAQ – Leasingübernahme <span className="text-red-600">(kurz & präzise)</span>
                </h2>
                <p className="text-neutral-600">Die wichtigsten Fragen schnell beantwortet</p>
              </div>
              
              <Accordion type="single" collapsible className="w-full space-y-4">
                <AccordionItem 
                  value="item-1" 
                  className="bg-gradient-to-r from-neutral-50/80 to-white rounded-3xl border border-neutral-200/40 shadow-sm hover:shadow-md transition-all duration-300 px-6 md:px-8 hover:border-neutral-300/60"
                >
                  <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 hover:text-red-600 transition-colors duration-200 text-base md:text-lg">
                    Wie schnell geht eine Leasingübernahme?
                  </AccordionTrigger>
                  <AccordionContent className="text-neutral-600 leading-relaxed pb-6 font-light">
                    Zwischen wenigen Tagen und zwei Wochen – je nach Bank und Unterlagen.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem 
                  value="item-2" 
                  className="bg-gradient-to-r from-neutral-50/80 to-white rounded-3xl border border-neutral-200/40 shadow-sm hover:shadow-md transition-all duration-300 px-6 md:px-8 hover:border-neutral-300/60"
                >
                  <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 hover:text-red-600 transition-colors duration-200 text-base md:text-lg">
                    Kann jede Person eine Leasingübernahme machen?
                  </AccordionTrigger>
                  <AccordionContent className="text-neutral-600 leading-relaxed pb-6 font-light">
                    Nein. Die Bank entscheidet anhand der Bonitätsprüfung. Wichtig sind ein Wohnsitz in der Schweiz und eine geregelte finanzielle Situation.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem 
                  value="item-3" 
                  className="bg-gradient-to-r from-neutral-50/80 to-white rounded-3xl border border-neutral-200/40 shadow-sm hover:shadow-md transition-all duration-300 px-6 md:px-8 hover:border-neutral-300/60"
                >
                  <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 hover:text-red-600 transition-colors duration-200 text-base md:text-lg">
                    Was passiert mit Schäden am Fahrzeug?
                  </AccordionTrigger>
                  <AccordionContent className="text-neutral-600 leading-relaxed pb-6 font-light">
                    Alle Vorschäden müssen genau dokumentiert werden. Wenn nicht protokollierte Schäden bei der späteren Rückgabe festgestellt werden, haftest du als neuer Leasingnehmer dafür. Deshalb ist das Übergabeprotokoll extrem wichtig.
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
