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
        
        {/* HERO SECTION - With Image Background */}
        <section className="relative min-h-[500px] md:min-h-[550px] flex items-center overflow-hidden pt-16">
          {/* Background Image */}
          <div className="absolute inset-0">
            <img 
              src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1600&q=80" 
              alt="Leasingübernahme Schweiz" 
              className="w-full h-full object-cover"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/70 via-neutral-900/60 to-neutral-900/80" />
            <div className="absolute inset-0 bg-gradient-to-r from-red-900/20 via-transparent to-neutral-900/30" />
          </div>

          {/* Geometric Accents */}
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 left-1/5 w-64 h-64 bg-red-400/5 rounded-full blur-2xl" />

          {/* Hero Content */}
          <div className="relative z-10 w-full px-4 py-16 md:py-20">
            <div className="max-w-5xl mx-auto">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 bg-red-600 text-white px-5 py-2 rounded-full text-sm font-semibold mb-6">
                  <TrendingDown className="w-4 h-4" />
                  Bis zu CHF 5'000 günstiger
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight mb-6">
                  Leasingübernahme in der Schweiz
                </h1>
                <p className="text-xl md:text-2xl text-red-400 font-semibold mb-4">
                  Ablauf, Kosten & Vorteile
                </p>
                <p className="text-lg text-neutral-200 leading-relaxed mb-8 max-w-2xl">
                  Alles, was du über die Übernahme eines bestehenden Auto-Leasingvertrags wissen musst – klar erklärt für Käufer und Verkäufer.
                </p>
                
                {/* Quick Stats */}
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/20">
                    <Clock className="w-5 h-5 text-red-400" />
                    <div>
                      <div className="text-xs text-neutral-300">Dauer</div>
                      <div className="font-bold text-white">2-7 Tage</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/20">
                    <DollarSign className="w-5 h-5 text-red-400" />
                    <div>
                      <div className="text-xs text-neutral-300">Ersparnis</div>
                      <div className="font-bold text-white">Bis CHF 5'000</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/20">
                    <Zap className="w-5 h-5 text-red-400" />
                    <div>
                      <div className="text-xs text-neutral-300">Anzahlung</div>
                      <div className="font-bold text-white">Meist CHF 0</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SHORT INTRO */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50 border-l-4 border-red-600 p-8 rounded-r-xl">
              <p className="text-lg text-neutral-700 leading-relaxed">
                Die Leasingübernahme ist eine der flexibelsten Möglichkeiten, ein Auto in der Schweiz zu fahren. Du übernimmst einen bestehenden Leasingvertrag, profitierst von attraktiven Konditionen und kürzeren Restlaufzeiten – ohne hohe Anzahlung und ohne langfristige Bindung. Hier erfährst du Schritt für Schritt, wie der Prozess funktioniert, was es kostet und worauf du achten musst.
              </p>
            </div>
          </div>
        </section>

        {/* SEARCH SECTION */}
        <section id="search-section" className="py-16 px-4 bg-neutral-50">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border-2 border-red-600 p-6 md:p-10">
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-3">
                  Angebote Entdecken
                </h2>
                <p className="text-neutral-600 text-base md:text-lg">
                  Finde jetzt verfügbare Leasingübernahmen mit unserer intelligenten Suche.
                </p>
              </div>
              <SearchForm />
            </div>
          </div>
        </section>

        {/* MAIN CONTENT */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto space-y-16">
            
            {/* Was ist eine Leasingübernahme? */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <FileCheck className="w-8 h-8 text-red-600" />
                <h2 className="text-3xl font-bold text-neutral-900">
                  Was ist eine Leasingübernahme?
                </h2>
              </div>
              <div className="prose prose-lg max-w-none">
                <p className="text-lg text-neutral-700 leading-relaxed mb-4">
                  Bei einer Leasingübernahme übernimmst du einen laufenden Auto-Leasingvertrag von einer anderen Person. Vertragskonditionen wie Restlaufzeit, Kilometerlimit und monatliche Rate bleiben in der Regel bestehen – du steigst einfach in den Vertrag ein. Die grosse Stärke: Die teure Anfangsphase des Leasings ist bereits bezahlt, sodass du oft von tieferen Raten und besseren Konditionen profitierst.
                </p>
                <p className="text-lg text-neutral-700 leading-relaxed">
                  Die Leasingübernahme ist in der Schweiz besonders beliebt, weil Leasingverträge häufig vorzeitig beendet werden sollen – aber eine Kündigung meist teuer wäre. Mit einer Übernahme profitieren beide Seiten.
                </p>
              </div>
            </div>

            {/* Warum beliebt */}
            <div className="bg-neutral-50 rounded-3xl p-8 border border-neutral-200">
              <h2 className="text-2xl font-bold text-neutral-900 mb-8">
                Warum ist die Leasingübernahme in der Schweiz so beliebt?
              </h2>
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
                    <div key={i} className="flex items-start gap-4 bg-white p-4 rounded-lg border border-neutral-200 hover:border-red-600 transition-colors">
                      <div className="mt-1 bg-red-50 p-2 rounded-full">
                        <IconComponent className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-neutral-900 mb-1">{item.title}</h3>
                        <p className="text-neutral-600 text-sm">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Voraussetzungen */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <BadgeCheck className="w-8 h-8 text-red-600" />
                <h2 className="text-2xl font-bold text-neutral-900">
                  Voraussetzungen für eine Leasingübernahme (Schweiz)
                </h2>
              </div>
              <p className="text-lg text-neutral-700 mb-6">Um eine Leasingübernahme durchzuführen, brauchst du:</p>
              <div className="bg-white border-2 border-red-600 rounded-xl p-8">
                <div className="space-y-4">
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
                      <div key={i} className="flex items-start gap-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                        <div className="flex-shrink-0">
                          <div className="w-6 h-6 rounded border-2 border-red-600 flex items-center justify-center">
                            <Check className="w-4 h-4 text-red-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-neutral-900 font-medium">{req.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-6">
                <div className="flex items-start gap-4">
                  <Info className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-blue-900">
                    Die Leasingbank entscheidet schlussendlich, ob du als neuer Vertragspartner akzeptiert wirst. Je besser deine Bonität, desto schneller läuft der Prozess.
                  </p>
                </div>
              </div>
            </div>

            {/* Ablauf - Timeline */}
            <div className="space-y-8">
              <div className="flex items-center gap-3 mb-6">
                <ChevronRight className="w-8 h-8 text-red-600" />
                <h2 className="text-2xl font-bold text-neutral-900">
                  Ablauf der Leasingübernahme – Schritt für Schritt
                </h2>
              </div>
              
              {/* Timeline Design */}
              <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-red-200 hidden md:block"></div>
                
                <div className="space-y-8">
                  {[
                    {
                      step: 1,
                      title: "Passendes Fahrzeug finden",
                      desc: "Du suchst auf BuyAuto ein Leasingfahrzeug, das zur Übernahme angeboten wird.",
                      icon: Search
                    },
                    {
                      step: 2,
                      title: "Kontakt aufnehmen",
                      desc: "Du klärst direkt mit der aktuellen Leasingnehmerin/dem Leasingnehmer offene Fragen zu Zustand, Kilometerstand, Ablöse etc.",
                      icon: Users
                    },
                    {
                      step: 3,
                      title: "Bonitätsprüfung der Leasingbank",
                      desc: "Die Leasingfirma prüft deine Kreditwürdigkeit und gibt den Vertrag frei oder lehnt ab.",
                      icon: ShieldCheck
                    },
                    {
                      step: 4,
                      title: "Vertragsübernahme unterschreiben",
                      desc: "Wird alles bewilligt, erstellt die Bank die Übernahmeunterlagen.",
                      icon: FileCheck
                    },
                    {
                      step: 5,
                      title: "Fahrzeugübergabe",
                      desc: "Ihr trefft euch, erstellt ein Übergabeprotokoll und das Auto gehört für die Restlaufzeit offiziell dir.",
                      icon: Check
                    }
                  ].map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <div key={item.step} className="relative flex gap-6 md:gap-8">
                        {/* Step Number Circle */}
                        <div className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-full bg-red-600 text-white flex flex-col items-center justify-center font-bold border-4 border-white shadow-lg z-10">
                          <span className="text-2xl">{item.step}</span>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl p-6 md:p-8">
                          <div className="flex items-start gap-3 mb-3">
                            <IconComponent className="w-6 h-6 text-red-600 mt-1" />
                            <h3 className="text-xl md:text-2xl font-bold text-neutral-900">{item.title}</h3>
                          </div>
                          <p className="text-neutral-700">{item.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <p className="text-center text-neutral-600 font-medium text-lg mt-8">
                In vielen Fällen dauert der gesamte Prozess nur wenige Tage.
              </p>
            </div>

            {/* Kosten */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <DollarSign className="w-8 h-8 text-red-600" />
                  <h2 className="text-2xl font-bold text-neutral-900">
                    Kosten einer Leasingübernahme
                  </h2>
                </div>
                <p className="text-neutral-600 text-lg">Die Gesamtkosten setzen sich aus folgenden Punkten zusammen:</p>
                <div className="space-y-4">
                  {[
                    { title: "1. Monatliche Leasingrate", desc: "Diese ist bereits im bestehenden Vertrag festgelegt." },
                    { title: "2. Ablösesumme (optional)", desc: "Manchmal verlangt der bisherige Leasingnehmer eine kleine Ablöse, wenn er z. B. viel vorausbezahlt hat oder das Auto über dem Restwert steht." },
                    { title: "3. Dossier- oder Vertragsgebühr", desc: "Viele Leasinggesellschaften verlangen CHF 100–400 für die Vertragsübertragung." },
                    { title: "4. Laufende Kosten", desc: "Versicherung, Service, Motorfahrzeugsteuer, Reifenmanagement, etc." }
                  ].map((cost, i) => (
                    <div key={i} className="bg-white p-4 rounded-xl border border-neutral-200">
                      <h4 className="font-bold text-neutral-900 mb-1">{cost.title}</h4>
                      <p className="text-neutral-600 text-sm">{cost.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-green-50 p-4 rounded-xl border border-green-200 text-green-800 text-sm font-medium flex gap-3 items-center">
                  <div className="bg-white p-1 rounded-full shadow-sm">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <span>Vorteil: Oft ist eine Leasingübernahme bis zu mehrere tausend Franken günstiger als ein neues Leasing.</span>
                </div>
              </div>
              
              {/* Vorteile Käufer/Verkäufer */}
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
            <div className="bg-orange-50 border border-orange-200 p-8 rounded-3xl">
              <h2 className="text-2xl font-bold text-orange-900 mb-4 flex items-center gap-3">
                <AlertTriangle className="w-7 h-7" />
                Risiken & worauf du achten musst
              </h2>
              <p className="text-orange-800 mb-6 text-lg">Eine Leasingübernahme ist sicher – aber nur, wenn du Folgendes beachtest:</p>
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
              <div className="overflow-x-auto rounded-xl border-2 border-red-600 shadow-lg">
                <table className="w-full bg-white text-left text-sm">
                  <thead className="bg-red-600 text-white">
                    <tr>
                      <th className="p-4 md:p-6 font-bold text-base md:text-lg">Modell</th>
                      <th className="p-4 md:p-6 font-bold text-base md:text-lg">Vorteile</th>
                      <th className="p-4 md:p-6 font-bold text-base md:text-lg">Nachteile</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    <tr className="hover:bg-red-50 transition-colors">
                      <td className="p-4 md:p-6 font-bold text-neutral-900">Leasingübernahme</td>
                      <td className="p-4 md:p-6 text-green-700 font-medium">Günstig, flexibel, keine Anzahlung</td>
                      <td className="p-4 md:p-6 text-neutral-600">Fixe Vertragsbedingungen</td>
                    </tr>
                    <tr className="hover:bg-red-50 transition-colors">
                      <td className="p-4 md:p-6 font-medium text-neutral-900">Neu-Leasing</td>
                      <td className="p-4 md:p-6 text-neutral-600">Freie Fahrzeugwahl</td>
                      <td className="p-4 md:p-6 text-neutral-600">Lange Laufzeit, hohe Anzahlung</td>
                    </tr>
                    <tr className="hover:bg-red-50 transition-colors">
                      <td className="p-4 md:p-6 font-medium text-neutral-900">Kauf</td>
                      <td className="p-4 md:p-6 text-neutral-600">Du bist Eigentümer</td>
                      <td className="p-4 md:p-6 text-neutral-600">Hoher Wertverlust, Kapitalbindung</td>
                    </tr>
                    <tr className="hover:bg-red-50 transition-colors">
                      <td className="p-4 md:p-6 font-medium text-neutral-900">Auto-Abo</td>
                      <td className="p-4 md:p-6 text-neutral-600">Alles inkl., flexibel</td>
                      <td className="p-4 md:p-6 text-neutral-600">Teurer pro Monat</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-center text-neutral-600 italic">Für viele ist die Leasingübernahme der beste Mix aus Preis, Flexibilität und Sicherheit.</p>
            </div>

            {/* Checklist */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-neutral-200">
              <h2 className="text-2xl font-bold text-neutral-900 mb-6 flex items-center gap-3">
                <FileText className="w-7 h-7 text-red-600" />
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
                <p className="text-neutral-600 text-lg">Die wichtigsten Fragen schnell beantwortet</p>
              </div>
              
              <Accordion type="single" collapsible className="w-full space-y-4">
                <AccordionItem 
                  value="item-1" 
                  className="bg-neutral-50 rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-red-600 transition-colors"
                >
                  <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 hover:text-red-600 transition-colors text-base md:text-lg">
                    Wie schnell geht eine Leasingübernahme?
                  </AccordionTrigger>
                  <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                    Zwischen wenigen Tagen und zwei Wochen – je nach Bank und Unterlagen.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem 
                  value="item-2" 
                  className="bg-neutral-50 rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-red-600 transition-colors"
                >
                  <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 hover:text-red-600 transition-colors text-base md:text-lg">
                    Kann jede Person eine Leasingübernahme machen?
                  </AccordionTrigger>
                  <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                    Nein. Die Bank entscheidet anhand der Bonitätsprüfung. Wichtig sind ein Wohnsitz in der Schweiz und eine geregelte finanzielle Situation.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem 
                  value="item-3" 
                  className="bg-neutral-50 rounded-xl border border-neutral-200 px-6 md:px-8 hover:border-red-600 transition-colors"
                >
                  <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline py-6 hover:text-red-600 transition-colors text-base md:text-lg">
                    Was passiert mit Schäden am Fahrzeug?
                  </AccordionTrigger>
                  <AccordionContent className="text-neutral-600 leading-relaxed pb-6">
                    Alle Vorschäden müssen genau dokumentiert werden. Wenn nicht protokollierte Schäden bei der späteren Rückgabe festgestellt werden, haftest du als neuer Leasingnehmer dafür. Deshalb ist das Übergabeprotokoll extrem wichtig.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

          </div>
        </section>

        {/* CTA BLOCK */}
        <section className="py-20 bg-neutral-900 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Bereit für deine Leasingübernahme?</h2>
            <p className="text-neutral-300 max-w-2xl mx-auto text-lg leading-relaxed">
              Starte jetzt und finde dein Traumauto oder gib deinen Vertrag flexibel weiter.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Button asChild size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg shadow-red-600/30 transition-all">
                <Link href="/suche">
                  <Search className="w-5 h-5 mr-2" />
                  Fahrzeuge durchsuchen
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold border-2 border-white text-white hover:bg-white hover:text-neutral-900 rounded-xl bg-transparent transition-all">
                <Link href="/inserat-erstellen">
                  Inserat erstellen
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* PREMIUM LISTINGS */}
        <PremiumListings />
        
      </main>
    </>
  );
}