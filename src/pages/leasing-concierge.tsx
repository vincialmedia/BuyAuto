import { useState } from "react";
import Head from "next/head";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ArrowRight, Mail, Clock, Shield } from "lucide-react";
import { submitServiceInquiry } from "@/services/serviceInquiryService";
import { toast } from "sonner";
import Link from "next/link";

export default function LeasingConcierge() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    inquiry_type: "" as "uebernahme_begleiten" | "leasing_exit_full_service" | "",
    leasing_company: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.inquiry_type) {
      toast.error("Bitte wähle eine Option aus");
      return;
    }

    setIsSubmitting(true);

    try {
      await submitServiceInquiry({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        inquiry_type: formData.inquiry_type,
        leasing_company: formData.leasing_company || undefined,
        message: formData.message,
      });

      setSubmitted(true);
      toast.success("Anfrage gesendet! Wir melden uns schnellstmöglich.");
    } catch (error) {
      console.error("Error submitting inquiry:", error);
      toast.error("Fehler beim Senden. Bitte versuche es erneut oder schreib uns direkt an Hello@buyauto.ch");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const baseUrl = "https://www.buyauto.ch";

  return (
    <>
      <Head>
        <title>Leasing Concierge Schweiz | Leasing abgeben lassen & Übernahme</title>
        <meta 
          name="description" 
          content="Leasing abgeben oder übernehmen? Wir koordinieren alles – inkl. Nachfolger finden, Leasingbank/Versicherung klären. Kostenlose Ersteinschätzung." 
        />
        <link rel="canonical" href={`${baseUrl}/leasing-concierge`} />
        
        {/* Open Graph */}
        <meta property="og:title" content="Leasing Concierge Schweiz | Leasing abgeben lassen & Übernahme" />
        <meta property="og:description" content="Leasing abgeben oder übernehmen? Wir koordinieren alles – inkl. Nachfolger finden, Leasingbank/Versicherung klären. Kostenlose Ersteinschätzung." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${baseUrl}/leasing-concierge`} />
      </Head>

      <MainLayout>
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white py-20 md:py-32">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=2070')] bg-cover bg-center opacity-10" />
          
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-8">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Leasing Concierge Schweiz: Leasing abgeben lassen oder Leasing übernehmen
              </h1>
              
              <div className="max-w-3xl mx-auto space-y-4">
                <p className="text-xl md:text-2xl text-neutral-200 leading-relaxed">
                  Ein Leasing loszuwerden oder zu übernehmen ist in der Schweiz selten "mal schnell erledigt". 
                  Leasingbank, Bonitätsprüfung, Fristen, Versicherung, Übergabe – und am Ende scheitert es oft an Kleinigkeiten.
                </p>

                <p className="text-lg md:text-xl text-neutral-300 font-medium">
                  Leasing Concierge ist dein persönlicher Service, der den Ablauf für dich übernimmt: klar, schnell, stressfrei.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto pt-6">
                <div className="flex items-start gap-3 text-left p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10">
                  <Check className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                  <span className="text-neutral-200">Leasingübernahme begleiten (wenn bereits ein Interessent da ist)</span>
                </div>
                <div className="flex items-start gap-3 text-left p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10">
                  <Check className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                  <span className="text-neutral-200">Leasing Exit Full Service (inkl. Nachfolger finden)</span>
                </div>
                <div className="flex items-start gap-3 text-left p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10">
                  <Check className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                  <span className="text-neutral-200">Koordination mit Leasinggesellschaft & Versicherung</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                <Button 
                  size="lg" 
                  className="bg-white text-neutral-900 hover:bg-neutral-100 text-lg px-8 py-6 h-auto"
                  onClick={() => document.getElementById('erst-einschaetzung')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Kostenlose Ersteinschätzung
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6 h-auto bg-transparent"
                  asChild
                >
                  <a href="mailto:Hello@buyauto.ch">
                    <Mail className="mr-2 w-5 h-5" />
                    Oder schreib uns direkt: Hello@buyauto.ch
                  </a>
                </Button>
              </div>

              <p className="text-sm text-neutral-400 pt-4">
                Unverbindlich. Verständlich erklärt. Keine versteckten Kosten.
              </p>
            </div>
          </div>
        </section>

        {/* What is Leasing Concierge */}
        <section className="py-20 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-6">
              Was genau macht ein Leasing Concierge?
            </h2>
            
            <p className="text-xl text-neutral-600 mb-8 leading-relaxed max-w-3xl">
              Wir sind keine Leasingbank und entscheiden nichts "im Hintergrund". 
              Wir sind der Koordinator, der dafür sorgt, dass alles richtig läuft und du keine Zeit verlierst.
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

            <div className="mt-8 p-6 bg-blue-50 border-l-4 border-blue-600 rounded-lg">
              <p className="text-neutral-800 font-medium text-lg">
                <strong>Wichtig:</strong> Die finale Entscheidung liegt immer bei der Leasinggesellschaft und der Versicherung.
              </p>
            </div>
          </div>
        </section>

        {/* Two Options */}
        <section className="py-20 bg-neutral-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 text-center mb-12">
              Zwei Wege – ein Ansprechpartner
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Option 1 */}
              <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 border-t-4 border-t-neutral-900">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">Option 1: Leasingübernahme begleiten</CardTitle>
                  <CardDescription className="text-base mt-3 text-neutral-600">
                    Du hast bereits einen Interessenten oder Käufer? Dann ist das meistens die schnellste Lösung. 
                    Wir klären die Bedingungen, strukturieren die Schritte und begleiten dich bis zur sauberen Übergabe.
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
                      <span className="text-neutral-700">Übergabe-Setup (damit's stressfrei läuft)</span>
                    </div>
                  </div>

                  <div className="pt-6 border-t">
                    <p className="text-3xl font-bold text-neutral-900 mb-2">
                      CHF 350.– <span className="text-lg font-normal text-neutral-600">Erfolgsgebühr</span>
                    </p>
                    <p className="text-sm text-neutral-500 mb-6 font-medium">
                      (nur fällig, wenn die Übernahme zustande kommt)
                    </p>
                    
                    <div className="space-y-4">
                      <Button 
                        className="w-full text-lg py-6" 
                        size="lg"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, inquiry_type: "uebernahme_begleiten" }));
                          document.getElementById('erst-einschaetzung')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        Übernahme begleiten lassen
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </Button>
                      <p className="text-center text-sm text-neutral-600">
                        Fragen? <a href="mailto:Hello@buyauto.ch" className="text-blue-600 hover:underline font-medium">Hello@buyauto.ch</a>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Option 2 */}
              <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-blue-600 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  POPULÄR
                </div>
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-blue-700">Option 2: Leasing Exit – Full Service</CardTitle>
                  <CardDescription className="text-base mt-3 text-neutral-600">
                    Du willst raus, hast aber keinen Übernehmer oder keine klare Strategie? 
                    Dann übernehmen wir den ganzen Weg bis zur Lösung.
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
                      <span className="text-neutral-700">Inserat/Positionierung, damit du schneller einen Nachfolger findest (z. B. via BuyAuto)</span>
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
                    <p className="text-3xl font-bold text-neutral-900 mb-2">
                      ab CHF 790.–
                    </p>
                    <p className="text-sm text-neutral-500 mb-6 font-medium">
                      (je nach Aufwand & Fall)
                    </p>
                    
                    <div className="space-y-4">
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6" 
                        size="lg"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, inquiry_type: "leasing_exit_full_service" }));
                          document.getElementById('erst-einschaetzung')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        Leasing Exit anfragen
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </Button>
                      <p className="text-center text-sm text-neutral-600">
                        Oder direkt mailen: <a href="mailto:Hello@buyauto.ch" className="text-blue-600 hover:underline font-medium">Hello@buyauto.ch</a>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Process */}
        <section className="py-20 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 text-center mb-16">
              So läuft's ab
            </h2>

            <div className="grid md:grid-cols-4 gap-8 relative">
              {/* Connector Line (Desktop) */}
              <div className="hidden md:block absolute top-6 left-0 right-0 h-0.5 bg-neutral-200 -z-10 mx-16"></div>

              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-neutral-900 text-white rounded-full flex items-center justify-center text-xl font-bold mb-6 shadow-lg">
                  1
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2">Kostenlose Ersteinschätzung</h3>
                <p className="text-neutral-600 text-sm">
                  Du schickst uns die Eckdaten (Leasinggesellschaft, Laufzeit, Rate, Kilometer, Ziel).
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-neutral-900 text-white rounded-full flex items-center justify-center text-xl font-bold mb-6 shadow-lg">
                  2
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2">Klare Antwort</h3>
                <p className="text-neutral-600 text-sm">
                  Was ist möglich? Was ist der schnellste Weg?
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-neutral-900 text-white rounded-full flex items-center justify-center text-xl font-bold mb-6 shadow-lg">
                  3
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2">Wir übernehmen die Koordination</h3>
                <p className="text-neutral-600 text-sm">
                  Wir treiben den Prozess voran, bleiben dran, halten dich auf Kurs.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold mb-6 shadow-lg">
                  4
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2">Lösung</h3>
                <p className="text-neutral-600 text-sm">
                  Übernahme abgeschlossen oder Exit sauber geregelt.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Who It's For */}
        <section className="py-20 bg-neutral-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-12 text-center">
              Für wen lohnt sich das?
            </h2>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="flex items-center gap-4 p-6 bg-white rounded-xl shadow-md border border-neutral-100">
                <Clock className="w-8 h-8 text-blue-600 flex-shrink-0" />
                <p className="text-neutral-700 font-medium">Du hast keine Zeit/Nerven für Bürokratie</p>
              </div>
              <div className="flex items-center gap-4 p-6 bg-white rounded-xl shadow-md border border-neutral-100">
                <Shield className="w-8 h-8 text-blue-600 flex-shrink-0" />
                <p className="text-neutral-700 font-medium">Du willst schnell Klarheit, was realistisch ist</p>
              </div>
              <div className="flex items-center gap-4 p-6 bg-white rounded-xl shadow-md border border-neutral-100">
                <Check className="w-8 h-8 text-blue-600 flex-shrink-0" />
                <p className="text-neutral-700 font-medium">Du willst vermeiden, dass ein Detail alles verzögert</p>
              </div>
              <div className="flex items-center gap-4 p-6 bg-white rounded-xl shadow-md border border-neutral-100">
                <ArrowRight className="w-8 h-8 text-blue-600 flex-shrink-0" />
                <p className="text-neutral-700 font-medium">Du musst einen Nachfolger finden und weisst nicht wie</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-12">
              Häufige Fragen
            </h2>

            <div className="space-y-8">
              <div className="border-l-4 border-blue-600 pl-6 py-1">
                <h3 className="text-xl font-bold text-neutral-900 mb-3">
                  Kann ich mein Leasing einfach zurückgeben?
                </h3>
                <p className="text-neutral-600 leading-relaxed">
                  Oft nicht "einfach so". Vorzeitige Beendigung kann teuer werden – deshalb prüfen wir zuerst, 
                  ob eine Übernahme/Alternative sinnvoller ist.
                </p>
              </div>

              <div className="border-l-4 border-blue-600 pl-6 py-1">
                <h3 className="text-xl font-bold text-neutral-900 mb-3">
                  Wie schnell geht eine Leasingübernahme?
                </h3>
                <p className="text-neutral-600 leading-relaxed">
                  Wenn Unterlagen passen und die Leasinggesellschaft mitspielt: oft Tage bis wenige Wochen. 
                  Nach der Ersteinschätzung sagen wir dir, was realistisch ist.
                </p>
              </div>

              <div className="border-l-4 border-blue-600 pl-6 py-1">
                <h3 className="text-xl font-bold text-neutral-900 mb-3">
                  Muss die Versicherung angepasst werden?
                </h3>
                <p className="text-neutral-600 leading-relaxed">
                  In der Regel ja. Wir helfen bei der Koordination, die Versicherung entscheidet final.
                </p>
              </div>

              <div className="border-l-4 border-blue-600 pl-6 py-1">
                <h3 className="text-xl font-bold text-neutral-900 mb-3">
                  Was passiert, wenn die Leasinggesellschaft ablehnt?
                </h3>
                <p className="text-neutral-600 leading-relaxed">
                  Dann prüfen wir Alternativen und sagen dir ehrlich, was noch Sinn macht.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Internal Link Section */}
        <section className="py-20 bg-blue-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-6">
              Mehr Infos (Ablauf & Hintergründe)
            </h2>
            <p className="text-lg text-neutral-600 mb-8 max-w-2xl mx-auto">
              Wenn du zuerst verstehen möchtest, wie Leasing abgeben in der Schweiz grundsätzlich funktioniert:
            </p>
            <Button size="lg" variant="outline" className="bg-white hover:bg-white/90 text-blue-900 border-blue-200" asChild>
              <Link href="/leasing-abgeben-schweiz">
                Leasing abgeben Schweiz: Ablauf, Optionen & Kosten
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Contact Form Section */}
        <section id="erst-einschaetzung" className="py-20 bg-white scroll-mt-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
                Kostenlose Ersteinschätzung anfordern
              </h2>
              <p className="text-lg text-neutral-600 mb-2">
                Sag uns kurz, wo du stehst – wir sagen dir, was der beste nächste Schritt ist.
              </p>
              <p className="text-neutral-600">
                Oder schreib direkt an: <a href="mailto:Hello@buyauto.ch" className="text-blue-600 hover:underline font-medium">Hello@buyauto.ch</a>
              </p>
            </div>

            {submitted ? (
              <Card className="shadow-xl border-green-200 border-2">
                <CardContent className="pt-12 pb-12 text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900 mb-4">
                    Danke! Wir melden uns schnellstmöglich.
                  </h3>
                  <p className="text-neutral-600 mb-8 text-lg">
                    Alternativ erreichst du uns jederzeit unter{" "}
                    <a href="mailto:Hello@buyauto.ch" className="text-blue-600 hover:underline font-medium">
                      Hello@buyauto.ch
                    </a>
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => setSubmitted(false)}
                    className="border-neutral-300"
                  >
                    Neue Anfrage senden
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-xl border border-neutral-200">
                <CardContent className="pt-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-base">Vorname / Name *</Label>
                        <Input
                          id="name"
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          required
                          placeholder="Max Mustermann"
                          className="h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-base">E-Mail *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          required
                          placeholder="max@beispiel.ch"
                          className="h-12"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-base">Telefonnummer (empfohlen)</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="+41 79 123 45 67"
                        className="h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="inquiry_type" className="text-base">Ziel *</Label>
                      <Select
                        value={formData.inquiry_type}
                        onValueChange={(value) => handleInputChange("inquiry_type", value)}
                        required
                      >
                        <SelectTrigger id="inquiry_type" className="h-12">
                          <SelectValue placeholder="Bitte wählen..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="uebernahme_begleiten">
                            Leasingübernahme begleiten
                          </SelectItem>
                          <SelectItem value="leasing_exit_full_service">
                            Leasing Exit (Full Service)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="leasing_company" className="text-base">Leasinggesellschaft (optional)</Label>
                      <Input
                        id="leasing_company"
                        type="text"
                        value={formData.leasing_company}
                        onChange={(e) => handleInputChange("leasing_company", e.target.value)}
                        placeholder="z.B. ALD Automotive, Alphabet, AMAG Leasing..."
                        className="h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-base">Nachricht / Eckdaten *</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => handleInputChange("message", e.target.value)}
                        required
                        rows={6}
                        placeholder="Bitte gib uns ein paar Eckdaten: Laufzeit, monatliche Rate, verbleibende Kilometer, was du erreichen möchtest..."
                        className="resize-none"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full text-lg py-6"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Wird gesendet..." : "Ersteinschätzung anfragen"}
                      {!isSubmitting && <ArrowRight className="ml-2 w-5 h-5" />}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            <p className="text-center text-neutral-500 mt-8 text-sm font-medium">
              Kein Callcenter. Ein Ansprechpartner. Klare Schritte.
            </p>
          </div>
        </section>

        {/* Sticky CTA (Mobile) */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-neutral-200 shadow-[0_-5px_15px_rgba(0,0,0,0.1)] md:hidden z-50">
          <Button 
            size="lg" 
            className="w-full h-12 text-lg font-bold shadow-lg"
            onClick={() => document.getElementById('erst-einschaetzung')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Kostenlose Ersteinschätzung
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </MainLayout>
    </>
  );
}