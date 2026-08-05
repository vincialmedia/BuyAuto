import { useState } from "react";
import Head from "next/head";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ArrowRight, Mail, Clock, Shield, X } from "lucide-react";
import Link from "next/link";
import { BreadcrumbJsonLd } from "@/components/buyauto/Breadcrumbs";

function buildMailtoHref(params: { subject: string; body?: string }) {
  const subject = encodeURIComponent(params.subject);
  const body = encodeURIComponent(params.body ?? "");
  const query = body ? `?subject=${subject}&body=${body}` : `?subject=${subject}`;
  return `mailto:hello@buyauto.ch${query}`;
}

export default function LeasingConcierge() {
  const baseUrl = "https://www.buyauto.ch";
  const [showMobileCta, setShowMobileCta] = useState(true);

  const option1Mailto = buildMailtoHref({
    subject: "Leasing Concierge Anfrage – Übernahme begleiten",
    body:
      "Hallo BuyAuto Team,\n\nIch möchte eine Leasingübernahme begleiten lassen.\n\nLeasinggesellschaft:\nFahrzeug / Details:\nStand heute (Laufzeit, Rate, Kilometer):\n\nDanke & viele Grüsse\n",
  });

  const option2Mailto = buildMailtoHref({
    subject: "Leasing Concierge Anfrage – Leasing Exit (Full Service)",
    body:
      "Hallo BuyAuto Team,\n\nIch möchte einen Leasing Exit (Full Service) anfragen.\n\nLeasinggesellschaft:\nFahrzeug / Details:\nStand heute (Laufzeit, Rate, Kilometer):\nZiel (Exit/Übernahme/Alternative):\n\nDanke & viele Grüsse\n",
  });

  const generalMailto = buildMailtoHref({
    subject: "Leasing Concierge Anfrage",
    body:
      "Hallo BuyAuto Team,\n\nIch habe eine Anfrage zum Leasing Concierge.\n\nLeasinggesellschaft:\nFahrzeug / Details:\nStand heute (Laufzeit, Rate, Kilometer):\nZiel:\n\nDanke & viele Grüsse\n",
  });

  return (
    <>
      <Head>
        <title>Leasing Concierge Schweiz | Leasing abgeben lassen & Übernahme</title>
        <meta
          name="description"
          content="Leasing abgeben oder übernehmen? Wir koordinieren alles – inkl. Leasingbank/Versicherung klären. Schreib uns für eine kostenlose Ersteinschätzung."
        />
        <link rel="canonical" href={`${baseUrl}/leasing-concierge`} />

        <meta property="og:title" content="Leasing Concierge Schweiz | Leasing abgeben lassen & Übernahme" />
        <meta
          property="og:description"
          content="Leasing abgeben oder übernehmen? Wir koordinieren alles – inkl. Leasingbank/Versicherung klären. Schreib uns für eine kostenlose Ersteinschätzung."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${baseUrl}/leasing-concierge`} />
      </Head>

      {/* Schema-only: hero layout has no room for a visible crumb bar. */}
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Leasing Concierge", href: "/leasing-concierge" },
        ]}
      />

      {/* pb-24 compensates the fixed mobile CTA bar so it never covers the final content/footer */}
      <div className={showMobileCta ? "pb-24 md:pb-0" : ""}>

      <section className="relative bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white py-20 md:py-32">
        <div className="absolute inset-0 opacity-10">
          <Image
            src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=2070"
            alt=""
            fill
            priority
            fetchPriority="high"
            sizes="100vw"
            quality={70}
            className="object-cover object-center"
          />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Leasing Concierge Schweiz: Leasing abgeben lassen oder Leasing übernehmen
            </h1>

            <div className="max-w-3xl mx-auto space-y-4">
              <p className="text-xl md:text-2xl text-neutral-200 leading-relaxed">
                Ein Leasing loszuwerden oder zu übernehmen ist in der Schweiz selten &quot;mal schnell erledigt&quot;.
                Leasingbank, Bonitätsprüfung, Fristen, Versicherung, Übergabe – und am Ende scheitert es oft an
                Kleinigkeiten.
              </p>

              <p className="text-lg md:text-xl text-neutral-300 font-medium">
                Leasing Concierge ist dein persönlicher Service, der den Ablauf für dich übernimmt: klar, schnell,
                stressfrei.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto pt-6">
              <div className="flex items-start gap-3 text-left p-4 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10">
                <Check className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                <span className="text-neutral-200">Leasingübernahme begleiten (wenn bereits ein Interessent da ist)</span>
              </div>
              <div className="flex items-start gap-3 text-left p-4 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10">
                <Check className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                <span className="text-neutral-200">Leasing Exit Full Service (inkl. Nachfolger finden)</span>
              </div>
              <div className="flex items-start gap-3 text-left p-4 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10">
                <Check className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                <span className="text-neutral-200">Koordination mit Leasinggesellschaft & Versicherung</span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 justify-center pt-8">
              <Button size="lg" className="bg-white text-neutral-900 hover:bg-neutral-100 whitespace-normal text-center text-base sm:text-lg px-6 sm:px-8 py-6 h-auto" asChild>
                <a href={generalMailto}>
                  Kostenlose Ersteinschätzung per E-Mail
                  <ArrowRight className="ml-2 w-5 h-5" />
                </a>
              </Button>

              <div className="flex items-center gap-2 text-green-400 font-medium bg-green-900/30 px-4 py-1.5 rounded-full border border-green-500/30 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150">
                <Clock className="w-4 h-4" />
                Antwort innerhalb 24 Stunden
              </div>

              <a
                href="mailto:hello@buyauto.ch"
                className="text-neutral-300 hover:text-white flex items-center gap-2 mt-2 transition-colors"
              >
                <Mail className="w-4 h-4" />
                hello@buyauto.ch
              </a>
            </div>

            <p className="text-sm text-neutral-400 pt-2">Unverbindlich. Verständlich erklärt. Keine versteckten Kosten.</p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-6">Was genau macht ein Leasing Concierge?</h2>

          <p className="text-xl text-neutral-600 mb-8 leading-relaxed max-w-3xl">
            Wir sind keine Leasingbank und entscheiden nichts &quot;im Hintergrund&quot;. Wir sind der Koordinator, der
            dafür sorgt, dass alles richtig läuft und du keine Zeit verlierst. Wenn du zuerst verstehen willst,{" "}
            <Link href="/leasinguebernahme" className="text-blue-600 hover:underline font-medium">
              wie die Leasingübernahme funktioniert
            </Link>
            , findest du alle Grundlagen in unserem Ratgeber.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <span className="text-neutral-700 text-lg">Abklären, ob eine Übernahme / ein Ausstieg möglich ist</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <span className="text-neutral-700 text-lg">Den Ablauf strukturieren (wer macht was, wann)</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <span className="text-neutral-700 text-lg">Kommunikation mit Leasinggesellschaft & Versicherung koordinieren</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <span className="text-neutral-700 text-lg">Dossier/Unterlagen vorbereiten (damit es nicht an Details scheitert)</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <span className="text-neutral-700 text-lg">Übergabe sauber organisieren (Dokumente, Timing, Protokoll)</span>
              </div>
            </div>
          </div>

          <div className="mt-8 p-6 bg-blue-50 border-l-4 border-blue-600 rounded-2xl">
            <p className="text-neutral-800 font-medium text-lg">
              <strong>Wichtig:</strong> Die finale Entscheidung liegt immer bei der Leasinggesellschaft und der Versicherung.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-neutral-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 text-center mb-12">Zwei Wege – ein Ansprechpartner</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 border-t-4 border-t-neutral-900 rounded-3xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">Option 1: Leasingübernahme begleiten</CardTitle>
                <CardDescription className="text-base mt-3 text-neutral-600">
                  Du hast bereits einen Interessenten oder Käufer? Dann ist das meistens die schnellste Lösung. Wir klären
                  die Bedingungen, strukturieren die Schritte und begleiten dich bis zur sauberen Übergabe.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 bg-green-100 p-1 rounded-full">
                      <Check className="w-3 h-3 text-green-700" />
                    </div>
                    <span className="text-neutral-700">Abklärung der Bedingungen bei der Leasinggesellschaft</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 bg-green-100 p-1 rounded-full">
                      <Check className="w-3 h-3 text-green-700" />
                    </div>
                    <span className="text-neutral-700">Checkliste & benötigte Dokumente für beide Parteien</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 bg-green-100 p-1 rounded-full">
                      <Check className="w-3 h-3 text-green-700" />
                    </div>
                    <span className="text-neutral-700">Koordination der Umschreibung / Termine</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 bg-green-100 p-1 rounded-full">
                      <Check className="w-3 h-3 text-green-700" />
                    </div>
                    <span className="text-neutral-700">Übergabe-Setup (damit&apos;s stressfrei läuft)</span>
                  </div>
                </div>

                <div className="pt-6 border-t">
                  <p className="text-3xl font-bold text-neutral-900 mb-2">
                    CHF 350.– <span className="text-lg font-normal text-neutral-600">Erfolgsgebühr</span>
                  </p>
                  <p className="text-sm text-neutral-500 mb-6 font-medium">(nur fällig, wenn die Übernahme zustande kommt)</p>

                  <div className="space-y-4">
                    <Button className="w-full whitespace-normal h-auto text-center text-base sm:text-lg py-6" size="lg" asChild>
                      <a href={option1Mailto}>
                        Übernahme per E-Mail anfragen
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </a>
                    </Button>
                    <p className="text-center text-sm text-neutral-600">
                      Fragen?{" "}
                      <a href="mailto:hello@buyauto.ch" className="text-blue-600 hover:underline font-medium">
                        hello@buyauto.ch
                      </a>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-blue-600 relative overflow-hidden rounded-3xl">
              <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                POPULÄR
              </div>
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-blue-700">Option 2: Leasing Exit – Full Service</CardTitle>
                <CardDescription className="text-base mt-3 text-neutral-600">
                  Du willst raus, hast aber keinen Übernehmer oder keine klare Strategie? Dann übernehmen wir den ganzen
                  Weg bis zur Lösung. Wenn du die Abgabe lieber selbst organisierst, zeigt dir{" "}
                  <Link href="/leasing-abgeben-schweiz" className="text-blue-600 hover:underline font-medium">
                    Leasing abgeben in der Schweiz – der Leitfaden
                  </Link>{" "}
                  jeden Schritt.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 bg-blue-100 p-1 rounded-full">
                      <Check className="w-3 h-3 text-blue-700" />
                    </div>
                    <span className="text-neutral-700">Einschätzung deiner Exit-Möglichkeiten (Übernahme vs. andere Lösung)</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 bg-blue-100 p-1 rounded-full">
                      <Check className="w-3 h-3 text-blue-700" />
                    </div>
                    <span className="text-neutral-700">
                      Inserat/Positionierung, damit du schneller einen Nachfolger findest (z. B. via BuyAuto)
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 bg-blue-100 p-1 rounded-full">
                      <Check className="w-3 h-3 text-blue-700" />
                    </div>
                    <span className="text-neutral-700">Interessenten-Vorselektion (damit du keine Zeit verschwendest)</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 bg-blue-100 p-1 rounded-full">
                      <Check className="w-3 h-3 text-blue-700" />
                    </div>
                    <span className="text-neutral-700">Koordination mit Leasingbank & Versicherung</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 bg-blue-100 p-1 rounded-full">
                      <Check className="w-3 h-3 text-blue-700" />
                    </div>
                    <span className="text-neutral-700">Begleitung bis Abschluss</span>
                  </div>
                </div>

                <div className="pt-6 border-t">
                  <p className="text-3xl font-bold text-neutral-900 mb-2">ab CHF 790.–</p>
                  <p className="text-sm text-neutral-500 mb-6 font-medium">(je nach Aufwand & Fall)</p>

                  <div className="space-y-4">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 whitespace-normal h-auto text-center text-base sm:text-lg py-6" size="lg" asChild>
                      <a href={option2Mailto}>
                        Leasing Exit per E-Mail anfragen
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </a>
                    </Button>
                    <p className="text-center text-sm text-neutral-600">
                      Oder direkt mailen:{" "}
                      <a href="mailto:hello@buyauto.ch" className="text-blue-600 hover:underline font-medium">
                        hello@buyauto.ch
                      </a>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 text-center mb-16">So läuft&apos;s ab</h2>

          <div className="grid md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-6 left-0 right-0 h-0.5 bg-neutral-200 -z-10 mx-16"></div>

            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-neutral-900 text-white rounded-full flex items-center justify-center text-xl font-bold mb-6 shadow-lg">
                1
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-2">E-Mail senden</h3>
              <p className="text-neutral-600 text-sm">
                Schreib uns kurz deine Eckdaten (Leasinggesellschaft, Laufzeit, Rate, Kilometer, Ziel).
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-neutral-900 text-white rounded-full flex items-center justify-center text-xl font-bold mb-6 shadow-lg">
                2
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-2">Klare Antwort</h3>
              <p className="text-neutral-600 text-sm">Was ist möglich? Was ist der schnellste Weg?</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-neutral-900 text-white rounded-full flex items-center justify-center text-xl font-bold mb-6 shadow-lg">
                3
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-2">Wir übernehmen die Koordination</h3>
              <p className="text-neutral-600 text-sm">Wir treiben den Prozess voran, bleiben dran, halten dich auf Kurs.</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold mb-6 shadow-lg">
                4
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-2">Lösung</h3>
              <p className="text-neutral-600 text-sm">Übernahme abgeschlossen oder Exit sauber geregelt.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-neutral-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-12 text-center">Für wen lohnt sich das?</h2>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 p-6 bg-white rounded-2xl shadow-md border border-neutral-100">
              <Clock className="w-8 h-8 text-blue-600 flex-shrink-0" />
              <p className="text-neutral-700 font-medium">Du hast keine Zeit/Nerven für Bürokratie</p>
            </div>
            <div className="flex items-center gap-4 p-6 bg-white rounded-2xl shadow-md border border-neutral-100">
              <Shield className="w-8 h-8 text-blue-600 flex-shrink-0" />
              <p className="text-neutral-700 font-medium">Du willst schnell Klarheit, was realistisch ist</p>
            </div>
            <div className="flex items-center gap-4 p-6 bg-white rounded-2xl shadow-md border border-neutral-100">
              <Check className="w-8 h-8 text-blue-600 flex-shrink-0" />
              <p className="text-neutral-700 font-medium">Du willst vermeiden, dass ein Detail alles verzögert</p>
            </div>
            <div className="flex items-center gap-4 p-6 bg-white rounded-2xl shadow-md border border-neutral-100">
              <ArrowRight className="w-8 h-8 text-blue-600 flex-shrink-0" />
              <p className="text-neutral-700 font-medium">Du musst einen Nachfolger finden und weisst nicht wie</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-12">Häufige Fragen</h2>

          <div className="space-y-8">
            <div className="border-l-4 border-blue-600 pl-6 py-1">
              <h3 className="text-xl font-bold text-neutral-900 mb-3">Kann ich mein Leasing einfach zurückgeben?</h3>
              <p className="text-neutral-600 leading-relaxed">
                Oft nicht &quot;einfach so&quot;. Vorzeitige Beendigung kann teuer werden – deshalb prüfen wir zuerst,
                ob eine Übernahme/Alternative sinnvoller ist.
              </p>
            </div>

            <div className="border-l-4 border-blue-600 pl-6 py-1">
              <h3 className="text-xl font-bold text-neutral-900 mb-3">Wie schnell geht eine Leasingübernahme?</h3>
              <p className="text-neutral-600 leading-relaxed">
                Wenn Unterlagen passen und die Leasinggesellschaft mitspielt: oft Tage bis wenige Wochen. Nach der
                Ersteinschätzung sagen wir dir, was realistisch ist.
              </p>
            </div>

            <div className="border-l-4 border-blue-600 pl-6 py-1">
              <h3 className="text-xl font-bold text-neutral-900 mb-3">Muss die Versicherung angepasst werden?</h3>
              <p className="text-neutral-600 leading-relaxed">
                In der Regel ja. Wir helfen bei der Koordination, die Versicherung entscheidet final.
              </p>
            </div>

            <div className="border-l-4 border-blue-600 pl-6 py-1">
              <h3 className="text-xl font-bold text-neutral-900 mb-3">Was passiert, wenn die Leasinggesellschaft ablehnt?</h3>
              <p className="text-neutral-600 leading-relaxed">Dann prüfen wir Alternativen und sagen dir ehrlich, was noch Sinn macht.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-6">Mehr Infos (Ablauf & Hintergründe)</h2>
          <p className="text-lg text-neutral-600 mb-8 max-w-2xl mx-auto">
            Wenn du zuerst verstehen möchtest, wie Leasing abgeben in der Schweiz grundsätzlich funktioniert:
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="outline" className="bg-white hover:bg-white/90 text-blue-900 border-blue-200 whitespace-normal h-auto text-center" asChild>
              <Link href="/leasing-abgeben-schweiz">
                Leasing abgeben Schweiz: Ablauf, Optionen & Kosten
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-white hover:bg-white/90 text-blue-900 border-blue-200 whitespace-normal h-auto text-center" asChild>
              <Link href="/leasinguebernahme">
                Alles zur Leasingübernahme
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="kontakt" className="py-20 bg-white scroll-mt-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-xl border border-neutral-200 rounded-3xl overflow-hidden">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-900">
                Leasing Exit Concierge per E-Mail anfragen
              </CardTitle>
              <CardDescription className="text-base md:text-lg text-neutral-600 mt-2">
                Für den Leasing Exit Concierge läuft alles per E-Mail: <span className="font-semibold">hello@buyauto.ch</span>.
                Wir melden uns in der Regel innerhalb von 24 Stunden.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-10">
              <div className="max-w-xl mx-auto space-y-6 text-center">
                <Button size="lg" className="w-full text-lg py-6 h-auto" asChild>
                  <a href={generalMailto}>
                    E-Mail an hello@buyauto.ch
                    <Mail className="ml-2 w-5 h-5" />
                  </a>
                </Button>

                <div className="rounded-2xl bg-neutral-50 border border-neutral-200 p-5 text-left">
                  <p className="font-semibold text-neutral-900 mb-2">Damit wir schnell antworten können:</p>
                  <ul className="text-neutral-700 space-y-1 list-disc pl-5">
                    <li>Leasinggesellschaft</li>
                    <li>Laufzeit / verbleibende Monate</li>
                    <li>Monatliche Rate</li>
                    <li>Aktueller Kilometerstand / verbleibende Kilometer</li>
                    <li>Was du erreichen möchtest (Übernahme begleiten / Exit)</li>
                  </ul>
                </div>

                <div className="flex items-center justify-center gap-2 text-green-700 font-medium">
                  <Clock className="w-4 h-4" />
                  <span>Antwort innerhalb 24 Stunden</span>
                </div>

                <p className="text-neutral-500 text-sm font-medium">Kein Callcenter. Ein Ansprechpartner. Klare Schritte.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      </div>

      {showMobileCta && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-neutral-200 shadow-[0_-5px_15px_rgba(0,0,0,0.08)] md:hidden z-50">
          <div className="flex items-center gap-3">
            <Button size="lg" className="flex-1 h-12 px-4 text-base min-[400px]:text-lg font-bold shadow-lg" asChild>
              <a href={generalMailto}>
                E-Mail schreiben
                <Mail className="ml-2 w-5 h-5" />
              </a>
            </Button>
            <button
              onClick={() => setShowMobileCta(false)}
              className="p-2 text-neutral-500 hover:bg-neutral-100 rounded-lg transition-colors"
              aria-label="Schliessen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}