import Head from "next/head";
import Link from "next/link";
import Header from "@/components/buyauto/Header";
import { Footer } from "@/components/buyauto/Footer";
import { 
  Check, 
  ChevronRight, 
  AlertTriangle,
  ArrowRight,
  Car,
  FileText,
  Users,
  ShieldCheck,
  Banknote,
  Clock
} from "lucide-react";

export default function LeasingAbgebenSchweiz() {
  return (
    <>
      <Head>
        <title>Auto Leasing abgeben in der Schweiz – So wirst du deinen Vertrag stressfrei los | BuyAuto</title>
        <meta 
          name="description" 
          content="Leasing vorzeitig beenden ohne hohe Kosten? Erfahre, wie du dein Auto-Leasing in der Schweiz per Leasingübernahme abgeben kannst. Anleitung & Tipps." 
        />
      </Head>

      <Header />

      <main className="min-h-screen bg-white">
        {/* Hero Section */}
        <div className="relative bg-white pt-20 pb-16 lg:pt-28 lg:pb-24 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30"></div>
          
          <div className="container mx-auto px-4 relative">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Text Content */}
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 text-red-600 font-medium text-sm mb-6 border border-red-100">
                  <Banknote className="w-4 h-4" />
                  Kostenfalle Kündigung vermeiden
                </div>
                
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 tracking-tight leading-tight">
                  Auto Leasing <span className="text-red-600">abgeben</span> in der Schweiz
                </h1>
                
                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                  So wirst du deinen Vertrag stressfrei los. Ohne Tausende Franken Strafe an die Bank zu zahlen.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link 
                    href="/inserat-erstellen" 
                    className="inline-flex justify-center items-center px-8 py-4 text-lg font-semibold rounded-xl text-white bg-red-600 hover:bg-red-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Jetzt Leasing abgeben
                    <ChevronRight className="ml-2 w-5 h-5" />
                  </Link>
                  <Link 
                    href="#how-it-works" 
                    className="inline-flex justify-center items-center px-8 py-4 text-lg font-semibold rounded-xl text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all"
                  >
                    Wie es funktioniert
                  </Link>
                </div>
              </div>

              {/* Image */}
              <div className="relative lg:block">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                  <img 
                    src="/20251203_1745_Handshake_in_Zurich_simple_compose_01kbjhkpn8eserb84c183b5wke.png" 
                    alt="Leasingvertrag vorzeitig beenden - Erfolgreiche Übergabe und Handshake in der Schweiz" 
                    className="w-full h-[400px] lg:h-[500px] object-cover"
                  />
                  
                  {/* Floating Card 1 */}
                  <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border border-gray-100 hidden lg:block">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Banknote className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Durchschnittliche Ersparnis</p>
                        <p className="text-lg font-bold text-gray-900">CHF 4'500.-</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                      <Check className="w-3 h-3" />
                      <span>Gegenüber Kündigung</span>
                    </div>
                  </div>

                  {/* Floating Card 2 */}
                  <div className="absolute top-8 -right-6 bg-white p-3 rounded-lg shadow-lg border border-gray-100 flex items-center gap-3 animate-fade-in hidden lg:flex">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-700">Leasing abgeben Schweiz - Erfolgreiche Übergabe</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Intro Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6">
              Leasing klingt am Anfang immer simpel.
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              Fixe Monatsrate, keine grossen Überraschungen, neues Auto, fertig. 
              Doch manchmal passt der Vertrag plötzlich nicht mehr ins Leben. Vielleicht ist ein Baby unterwegs, 
              die Kosten steigen, der Job hat sich geändert oder du willst einfach flexibler sein.
            </p>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 inline-block">
              <p className="text-xl font-semibold text-gray-900 italic">
                „Wie gebe ich mein Leasing ab, ohne Tausende Franken zu verlieren?“
              </p>
            </div>
            <p className="mt-8 text-lg text-gray-600 leading-relaxed">
              <strong className="text-gray-900">Die gute Nachricht:</strong> Leasing abgeben ist möglich – und oft viel einfacher (und günstiger), als die Bank es dir glauben lässt.
              In diesem Guide zeigen wir dir Schritt für Schritt, wie du deinen Leasingvertrag in der Schweiz korrekt abgibst.
            </p>
          </div>
        </section>

        {/* Reasons Grid */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <span className="text-red-600 font-semibold tracking-wider uppercase text-sm">Situationen</span>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-2">Warum wollen so viele ihr Leasing abgeben?</h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: Users,
                  title: "Lebensumstände",
                  desc: "Familienzuwachs, Jobwechsel oder Umzug in die Stadt machen das aktuelle Auto unpassend."
                },
                {
                  icon: Banknote,
                  title: "Zu hohe Kosten",
                  desc: "Rate, Versicherung und Unterhalt summieren sich oft höher als ursprünglich geplant."
                },
                {
                  icon: AlertTriangle,
                  title: "Kilometer & Rückgabe",
                  desc: "Angst vor hohen Nachzahlungen für Mehrkilometer oder Schäden bei der Rückgabe."
                },
                {
                  icon: Clock,
                  title: "Wunsch nach Flexibilität",
                  desc: "Starre 48-Monats-Verträge passen nicht mehr. Flexiblere Lösungen wie Abos sind gefragt."
                }
              ].map((item, i) => (
                <div key={i} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The Problem: Canceling is expensive */}
        <section className="py-20 bg-gray-900 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-600 rounded-full blur-3xl opacity-10 transform translate-x-1/2 -translate-y-1/2"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start gap-6 mb-8">
                <div className="p-3 bg-red-500/20 rounded-lg border border-red-500/30 shrink-0">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-4">Leasing „einfach kündigen“? In der Schweiz fast unmöglich</h2>
                  <p className="text-xl text-gray-300 leading-relaxed">
                    Das ist der grosse Schockmoment für viele: Du kannst ein Auto-Leasing nicht einfach kündigen wie ein Handy-Abo.
                    Leasing ist ein Finanzierungsvertrag. Wenn du früh raus willst, musst du fast immer Restwert, Zinsen und Strafgebühren zahlen.
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700">
                <p className="text-lg font-medium text-red-400 mb-2">Das Ergebnis einer Kündigung:</p>
                <p className="text-2xl font-bold text-white">
                  Eine Kündigung kostet oft mehrere Tausend Franken – manchmal mehr, als das Auto aktuell wert ist.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* The Solution: Transfer */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                  Die beste Alternative: Leasing abgeben per <span className="text-red-600">Übernahme</span>
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  Anstatt teuer zu kündigen, kannst du deinen Leasingvertrag einfach an eine andere Person übertragen.
                  Das ist die sogenannte Leasingübernahme – und für viele die einzige günstige Möglichkeit, sauber aus dem Vertrag zu kommen.
                </p>
                
                <div className="space-y-4">
                  {[
                    "Du zahlst keine horrenden Kündigungsgebühren",
                    "Du wirst Fixkosten sofort los",
                    "Keine Rückgabe, keine Aufbereitungskosten",
                    "Keine Mehrkilometer-Abrechnung",
                    "Vertrag läuft einfach weiter – du bist raus"
                  ].map((point, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4" />
                      </div>
                      <span className="text-gray-700 font-medium">{point}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-4 bg-yellow-50 rounded-xl border border-yellow-100 text-sm text-yellow-800">
                  <strong>Wichtig:</strong> Die Leasingfirma muss zustimmen und der Übernehmer braucht eine positive Bonität. In 90% der Fälle ist dies aber die beste Lösung.
                </div>

                <div className="mt-10">
                  <Link 
                    href="/leasinguebernahme" 
                    className="text-red-600 font-semibold hover:text-red-700 inline-flex items-center"
                  >
                    Mehr zur Leasingübernahme erfahren
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              </div>
              
              <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Kostenvergleich</h3>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium text-gray-900">Bei normaler Kündigung</span>
                      <span className="font-bold text-red-600">CHF 2'000 – 8'000+</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full w-full"></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Rückgabegebühren, Aufbereitung, Mehrkilometer, Restwert-Differenz</p>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium text-gray-900">Bei Leasingübernahme</span>
                      <span className="font-bold text-green-600">CHF 0 – 500</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full w-[10%]"></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Meist nur eine kleine Administrationsgebühr der Bank</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Step by Step Guide */}
        <section id="how-it-works" className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">Wie gibst du dein Leasing ab?</h2>
              <p className="text-xl text-gray-600 mt-4">Schritt-für-Schritt Anleitung</p>
            </div>

            <div className="max-w-4xl mx-auto space-y-8">
              {[
                {
                  step: 1,
                  title: "Leasingvertrag prüfen",
                  content: "Notiere dir Restlaufzeit, Monatsrate, Freikilometer und die Leasinggesellschaft (z.B. Cembra, AMAG, MultiLease)."
                },
                {
                  step: 2,
                  title: "Inserat erstellen",
                  content: "Erstelle ein attraktives Inserat mit guten Fotos und allen wichtigen Daten. Ohne Inserat findest du niemanden."
                },
                {
                  step: 3,
                  title: "Interessenten finden",
                  content: "Der wichtigste Schritt. Nutze spezialisierte Plattformen wie BuyAuto für maximale Reichweite."
                },
                {
                  step: 4,
                  title: "Bonität prüfen lassen",
                  content: "Die Bank prüft den Übernehmer (Einkommen, Betreibungsregister). Wenn alles passt, wird der Vertrag übertragen."
                },
                {
                  step: 5,
                  title: "Unterschrift & Übergabe",
                  content: "Alle Parteien unterschreiben die Umschreibung. Du übergibst das Auto und bist raus aus dem Vertrag."
                }
              ].map((item, i) => (
                <div key={i} className="flex gap-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="shrink-0 w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-lg">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600">{item.content}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link 
                href="/inserat-erstellen" 
                className="inline-flex justify-center items-center px-8 py-4 text-lg font-semibold rounded-xl text-white bg-red-600 hover:bg-red-700 transition-all shadow-lg"
              >
                Jetzt Inserat erstellen
                <ChevronRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900">Häufige Fragen</h2>
            </div>
            
            <div className="space-y-6">
              {[
                {
                  q: "Kann ich mein Auto-Leasing jederzeit abgeben?",
                  a: "Ja, die Abgabe via Leasingübernahme ist fast immer möglich, solange der Übernehmer von der Leasingbank akzeptiert wird."
                },
                {
                  q: "Was kostet es, mein Leasing abzugeben?",
                  a: "Mit einer Leasingübernahme meist nur 0–500 CHF Bearbeitungsgebühr. Eine vorzeitige Kündigung hingegen kann mehrere Tausend Franken kosten."
                },
                {
                  q: "Werden Schäden oder Mehrkilometer verrechnet?",
                  a: "Bei einer Übernahme nicht sofort. Der neue Leasingnehmer übernimmt den Vertrag so wie er ist – inkl. aktueller Kilometer und Zustand. Das wird erst am Ende der Laufzeit für ihn relevant."
                },
                {
                  q: "Wie lange dauert der Prozess?",
                  a: "Wenn du einen Interessenten gefunden hast, dauert die Umschreibung bei der Bank in der Regel zwischen 3 und 10 Tagen."
                }
              ].map((faq, i) => (
                <div key={i} className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="font-bold text-gray-900 mb-2">{faq.q}</h3>
                  <p className="text-gray-600">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-red-600">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Leasing abgeben ist einfacher als du denkst
            </h2>
            <p className="text-xl text-red-100 mb-8 max-w-2xl mx-auto">
              Erstelle dein Inserat in weniger als 3 Minuten und finde jemanden, der deinen Vertrag übernimmt.
            </p>
            <Link 
              href="/inserat-erstellen" 
              className="inline-flex justify-center items-center px-10 py-5 text-lg font-bold rounded-xl text-red-600 bg-white hover:bg-gray-50 transition-all shadow-xl transform hover:-translate-y-1"
            >
              Jetzt Leasing kostenlos inserieren
              <ChevronRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
