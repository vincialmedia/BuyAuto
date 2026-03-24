import React from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Sparkles, Database, Shield, Zap, CheckCircle, 
  CreditCard, Clock, FileText, Search, FileCheck, Car, ArrowRight 
} from 'lucide-react';
import SearchForm from '@/components/buyauto/SearchForm';
import PremiumListings from '@/components/buyauto/PremiumListings';
import { FounderStory } from '@/components/buyauto/FounderStory';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';

const FAQSection = dynamic(() => import("@/components/buyauto/FAQSection"));
const SeoCopyBlock = dynamic(() => import("@/components/buyauto/SeoCopyBlock").then(m => ({ default: m.SeoCopyBlock })));

export default function V2Home() {
  return (
    <div className="bg-[#fcfcfc] min-h-screen font-sans selection:bg-primary/20 selection:text-primary">
      <Head>
        <title>BuyAuto – V2 Redesign Concept</title>
      </Head>

      {/* HERO SECTION - 2026 FULL BLEED */}
      <section className="relative w-full h-[95vh] min-h-[700px] max-h-[1100px] flex flex-col items-center justify-start pt-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/ChatGPT_Image_Oct_18_2025_05_36_15_PM.png"
            alt="Porsche driving on a mountain road"
            fill
            className="object-cover object-center scale-105"
            priority
            quality={95}
          />
          {/* Advanced Gradients for Text Legibility & Mood */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#fcfcfc] via-[#fcfcfc]/10 to-transparent" />
          
          {/* Subtle colored glow */}
          <div className="absolute top-0 right-0 w-[60vw] h-[60vw] bg-primary/20 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3 mix-blend-screen pointer-events-none" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-xl text-white px-5 py-2.5 rounded-full text-sm font-semibold mb-8 border border-white/20 shadow-2xl">
            <Sparkles className="w-4 h-4 text-primary" />
            Die Schweizer Plattform
          </div>
          
          <h1 className="text-[12vw] sm:text-6xl md:text-8xl lg:text-[7rem] font-black text-white tracking-tighter leading-[0.9] mb-6 drop-shadow-2xl">
            Leasingübernahme<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-200 to-neutral-400">
              Einfach & Schnell
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl text-white/80 font-medium mb-12 max-w-2xl mx-auto leading-relaxed text-balance">
            Finde und übernimm deinen nächsten Auto-Leasingvertrag – schweizweit.
          </p>

          {/* OVERLAPPING SEARCH CONTAINER (Icy Glassmorph) */}
          <div className="w-full max-w-5xl translate-y-16 sm:translate-y-24">
            <div className="bg-white/25 backdrop-blur-xl border border-white/30 rounded-[2.5rem] p-3 sm:p-6 shadow-2xl relative overflow-hidden group hover:bg-white/30 hover:border-white/50 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50 pointer-events-none" />
              <div className="relative z-10">
                {/* We rely on SearchForm's hero variant which already handles transparent inner styling */}
                <SearchForm variant="hero" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SPACING FOR OVERLAP */}
      <div className="h-24 sm:h-32 md:h-40" />

      {/* FLOATING USP BENTO ROW */}
      <section className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24 sm:mb-32">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[
            { icon: Database, title: "Swiss Data", desc: "Daten in der Schweiz" },
            { icon: Shield, title: "Sichere Bezahlung", desc: "Powered by Stripe" },
            { icon: Zap, title: "Schneller Prozess", desc: "In wenigen Minuten" },
            { icon: CheckCircle, title: "Geprüfte Inserate", desc: "Qualität garantiert" }
          ].map((usp, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-100 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1.5 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-neutral-50 group-hover:bg-primary/10 flex items-center justify-center mb-5 transition-colors duration-300">
                <usp.icon className="w-6 h-6 text-neutral-900 group-hover:text-primary transition-colors duration-300" />
              </div>
              <h3 className="font-bold text-lg text-neutral-900 mb-1">{usp.title}</h3>
              <p className="text-sm font-medium text-neutral-500">{usp.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PREMIUM LISTINGS */}
      <div className="relative z-20 bg-white border-y border-neutral-100">
         <PremiumListings />
      </div>

      {/* BENEFITS - 2026 BENTO GRID */}
      <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 sm:mb-24 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-neutral-900 tracking-tighter mb-6">
                Warum <span className="text-primary">BuyAuto</span>?
              </h2>
              <p className="text-xl md:text-2xl text-neutral-600 font-light text-balance">
                Wir machen Leasingübernahme einfach, sicher und transparent.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 auto-rows-[280px]">
            {/* Feature 1 - Large Box */}
            <div className="md:col-span-2 md:row-span-2 bg-neutral-900 rounded-[2rem] sm:rounded-[2.5rem] p-8 sm:p-12 relative overflow-hidden group flex flex-col justify-end">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />
              
              <CreditCard className="w-20 h-20 text-white/10 mb-8 absolute top-10 right-10 group-hover:scale-110 group-hover:text-white/20 transition-all duration-500" />
              
              <div className="relative z-10">
                <div className="inline-flex bg-white/10 backdrop-blur-md rounded-full px-4 py-1.5 text-white text-sm font-medium mb-6">Kostentransparenz</div>
                <h3 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight leading-tight">Übersichtliche Kosten</h3>
                <p className="text-lg sm:text-xl text-white/70 max-w-md font-light leading-relaxed">Monatsrate, Restlaufzeit, Kilometer – alles transparent und leicht verständlich auf einen Blick.</p>
              </div>
            </div>

            {/* Feature 2 - Small Box */}
            <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-8 shadow-sm border border-neutral-100 group hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-center">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-500 transition-colors duration-300">
                <Clock className="w-7 h-7 text-blue-500 group-hover:text-white" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-3">Flexible Laufzeiten</h3>
              <p className="text-neutral-500 font-medium">Von wenigen Monaten bis mehrere Jahre – passend für dich.</p>
            </div>

            {/* Feature 3 - Small Box */}
            <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-8 shadow-sm border border-neutral-100 group hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-center">
               <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-500 transition-colors duration-300">
                <CheckCircle className="w-7 h-7 text-emerald-500 group-hover:text-white" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-3">Günstiger als Neu</h3>
              <p className="text-neutral-500 font-medium">Oft mehrere Hundert Franken pro Monat günstiger als Leasing-Neuverträge.</p>
            </div>

            {/* Feature 4 - Wide Box CTA */}
            <div className="md:col-span-3 bg-gradient-to-r from-primary to-primary/80 rounded-[2rem] sm:rounded-[2.5rem] p-8 sm:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 group overflow-hidden relative">
              <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[80px] pointer-events-none" />
              
              <div className="max-w-2xl text-white relative z-10">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Direkter Kontakt zum Anbieter</h3>
                <p className="text-lg text-white/90 font-medium">Ohne Zwischenhändler. Kommuniziere direkt mit der Person, die den Vertrag abgeben möchte.</p>
              </div>
              <div className="w-full md:w-auto relative z-10 shrink-0">
                <Link href="/suche" className="inline-flex items-center justify-center w-full md:w-auto gap-2 bg-white text-primary px-8 py-5 rounded-2xl font-bold text-lg hover:scale-105 transition-transform duration-300 shadow-xl">
                  Fahrzeuge entdecken <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS - STICKY SCROLL UX */}
      <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-neutral-900 text-white rounded-[2rem] sm:rounded-[3rem] mx-4 sm:mx-6 lg:mx-8 mb-24 sm:mb-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] pointer-events-none translate-x-1/3 -translate-y-1/3" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row gap-16 lg:gap-24">
            
            {/* Sticky Left Column */}
            <div className="md:w-5/12 md:sticky md:top-32 h-fit">
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-[1.1]">
                So<br/><span className="text-primary">funktioniert's</span>
              </h2>
              <p className="text-xl md:text-2xl text-neutral-400 font-light mb-10 text-balance">
                In nur 3 einfachen Schritten zu deinem neuen Leasingfahrzeug.
              </p>
              <Link href="/inserat-erstellen">
                <button className="bg-white hover:bg-neutral-100 text-neutral-900 font-bold px-8 py-4 rounded-2xl transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)] hover:-translate-y-1 flex items-center gap-2 group">
                  Inserat erstellen <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </div>

            {/* Scrolling Right Column */}
            <div className="md:w-7/12 space-y-6 sm:space-y-8 pb-10">
              {[
                { icon: Search, step: "01", title: "Suche & wähle", desc: "Durchsuche unsere Fahrzeugdatenbank und finde das perfekte Auto für deine Bedürfnisse." },
                { icon: FileCheck, step: "02", title: "Anfrage & Inspektion", desc: "Stelle eine unverbindliche Anfrage und besichtige das Fahrzeug vor Ort." },
                { icon: Car, step: "03", title: "Übernahme & Übergabe", desc: "Nach erfolgreicher Prüfung übernimmst du den Leasingvertrag und erhältst dein Fahrzeug." }
              ].map((step, i) => (
                <div key={i} className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 sm:p-12 hover:bg-white/10 transition-colors duration-500 group">
                  <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-8">
                    <div className="text-6xl sm:text-7xl font-black text-white/10 leading-none group-hover:text-primary/40 transition-colors duration-500 shrink-0">
                      {step.step}
                    </div>
                    <div>
                      <h3 className="text-2xl sm:text-3xl font-bold mb-4 text-white">{step.title}</h3>
                      <p className="text-neutral-400 text-lg leading-relaxed font-medium">{step.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
          </div>
        </div>
      </section>

      {/* KEEP EXISTING CONTENT BLOCKS */}
      <FounderStory />
      <FAQSection />
      <SeoCopyBlock />

      {/* STICKY BOTTOM CTA FOR LONG FORM PAGES */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 translate-y-full animate-[slideUp_0.5s_ease-out_2s_forwards]">
        <div className="max-w-4xl mx-auto bg-white/90 backdrop-blur-xl border border-neutral-200 shadow-2xl rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <div className="font-bold text-neutral-900">Bereit für dein nächstes Auto?</div>
            <div className="text-sm text-neutral-600">Entdecke Top-Deals oder erstelle ein Inserat.</div>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button asChild variant="outline" className="w-full sm:w-auto rounded-xl">
              <Link href="/suche">Fahrzeuge finden</Link>
            </Button>
            <Button asChild className="w-full sm:w-auto rounded-xl shadow-lg shadow-primary/20">
              <Link href="/inserat-erstellen">Inserat erstellen</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}