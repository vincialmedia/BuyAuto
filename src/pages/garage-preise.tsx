import { useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

type PlanCode = "starter" | "growth" | "pro" | "custom";

const START_URL = "/auth?redirect=%2Fgarage-onboarding";

function getPlanStartUrl(code: PlanCode): string {
  return `${START_URL}%3Fplan%3D${encodeURIComponent(code)}`;
}

function MailtoLink({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <a className={className} href="mailto:hello@buyauto.ch">
      {children}
    </a>
  );
}

export default function GaragePreisePage() {
  const heroRef = useRef<HTMLDivElement | null>(null);
  const [showStickyCta, setShowStickyCta] = useState(false);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setShowStickyCta(!entry.isIntersecting);
      },
      { threshold: 0.2 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const included = useMemo(
    () => [
      "Garage-Profilseite + Inventar-Seite",
      "Inserate erstellen & verwalten",
      "VIN-PreFill (wo verfügbar)",
      "Leasing-Rechner direkt im Inserat",
      "Deal-Chat pro Fahrzeug (Chat + Dokumente)",
      "Basis-Statistiken: Views & Anfragen",
    ],
    []
  );

  const faqs = useMemo(
    () => [
      {
        q: "Was zählt als Inserat?",
        a: "Ein Inserat ist ein aktives Fahrzeug-Angebot in deinem Inventar. Entwürfe zählen nicht als aktive Inserate.",
      },
      {
        q: "Kann ich upgraden/downgraden?",
        a: "Ja. Du kannst dein Paket im Garage-Dashboard unter „Zahlung“ anpassen. Upgrades/Downgrades werden sauber protokolliert.",
      },
      {
        q: "Gibt es eine Mindestlaufzeit?",
        a: "Nein. Du kannst monatlich kündigen. Keine Setup-Falle.",
      },
      {
        q: "Wie funktioniert der Deal-Chat?",
        a: "Jedes Fahrzeug hat seinen eigenen Chat. Du führst die Kommunikation direkt am Objekt und kannst Dokumente im Chat teilen.",
      },
      {
        q: "Welche Daten braucht ihr fürs Done-for-you Onboarding?",
        a: "Fahrzeugliste (CSV/Excel oder Link), Fotos (Ordner/Drive/WeTransfer), Info welche Fahrzeuge leasingfähig sind, plus Konditionen (Monate, KM, Anzahlung, Rate/Zins falls vorhanden).",
      },
      {
        q: "Garantiert BuyAuto Leads?",
        a: "Nein. Leads können nicht garantiert werden. Du bekommst aber eine saubere Präsenz + einen direkten Kanal für Anfragen.",
      },
      {
        q: "Wie setze ich Premium Inserate ein?",
        a: "Premium eignet sich für Fahrzeuge, die du visuell hervorheben willst. Premium ist Hervorhebung – keine garantierte Lead- oder Ranking-Verbesserung.",
      },
      {
        q: "Welche Zahlungsarten gibt es?",
        a: "Aktuell bauen wir das Paket-System als Basis aus. Die Zahlungsabwicklung kann danach sauber integriert werden.",
      },
      {
        q: "Was passiert bei Kündigung?",
        a: "Du kannst zum Periodenende kündigen. Deine Daten bleiben erhalten, und du kannst später wieder starten.",
      },
    ],
    []
  );

  return (
    <MainLayout>
      <Head>
        <title>BuyAuto – Preise für Garagen</title>
        <meta
          name="description"
          content="Pakete für Garagen: Inserate, VIN-PreFill, Leasing-Rechner und Deal-Chat pro Fahrzeug. Done-for-you Onboarding ab Growth."
        />
      </Head>

      <div className="bg-white">
        <section ref={heroRef} className="relative overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="/pexels-maitree-rimthong-444156-1602726.jpg"
              alt="Garage Inventar online"
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-neutral-950/20" />
          </div>

          <div className="relative">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/85 border border-white/15">
                  Marketplace für Direktkauf & Leasing
                </div>

                <h1 className="mt-5 text-4xl sm:text-5xl font-bold tracking-tight text-white">
                  Preise für Garagen
                </h1>

                <p className="mt-4 text-xl sm:text-2xl font-semibold text-white">
                  Mehr Anfragen. Weniger Aufwand.
                </p>

                <p className="mt-3 text-base sm:text-lg text-white/80">
                  Dein Inventar online – mit VIN-PreFill, Leasing-Rechner und Deal-Chat pro Fahrzeug.
                </p>

                <p className="mt-3 text-sm sm:text-base text-white/70">
                  Marketplace für Direktkauf & Leasing – mit klaren Inseraten und direktem Kontakt.
                </p>

                <div className="mt-7 flex flex-col sm:flex-row gap-3">
                  <Button asChild className="rounded-2xl h-11 bg-white text-neutral-950 hover:bg-white/90">
                    <Link href={START_URL}>Jetzt starten</Link>
                  </Button>

                  <Button
                    asChild
                    variant="secondary"
                    className="rounded-2xl h-11 bg-white/15 text-white hover:bg-white/20 border border-white/20"
                  >
                    <a href="#pakete">Preise ansehen</a>
                  </Button>
                </div>

                <div className="mt-8 grid gap-2 text-sm text-white/80">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white/70" />
                    <span>VIN-PreFill (wo verfügbar)</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white/70" />
                    <span>Leasing-Rechner im Inserat</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white/70" />
                    <span>Deal-Chat inkl. Dokumentenversand</span>
                  </div>
                </div>

                <div className="mt-10 rounded-3xl bg-white/25 backdrop-blur-xl border border-white/30 shadow-2xl p-5">
                  <div className="grid gap-3">
                    <div className="text-white font-semibold">Schnellstart</div>
                    <div className="text-sm text-white/80">
                      Starte mit einem Konto – danach wählst du dein Paket im Garage-Dashboard unter „Zahlung“.
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button asChild className="rounded-2xl bg-white text-neutral-950 hover:bg-white/90">
                        <Link href={START_URL}>Jetzt starten</Link>
                      </Button>
                      <Button
                        asChild
                        variant="secondary"
                        className="rounded-2xl bg-white/15 text-white hover:bg-white/20 border border-white/20"
                      >
                        <MailtoLink>Kontakt aufnehmen</MailtoLink>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-xs text-white/70">
                  Wichtig: Leads können nicht garantiert werden – aber du bekommst eine saubere Präsenz + direkten Kanal für Anfragen.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
                In jedem Paket inklusive
              </h2>
              <p className="mt-3 text-neutral-600">
                Alles, was du brauchst, um dein Inventar sauber, nachvollziehbar und effizient online zu verwalten.
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {included.map((item) => (
                <div key={item} className="rounded-3xl border border-neutral-200/60 bg-white p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                    <div className="text-neutral-900 font-medium">{item}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-3xl border border-neutral-200/60 bg-neutral-50 p-5">
              <div className="text-sm text-neutral-700">
                <span className="font-semibold">Wichtig:</span>{" "}
                Leads können nicht garantiert werden – aber du bekommst eine saubere Präsenz + direkten Kanal für Anfragen.
              </div>
            </div>
          </div>
        </section>

        <section id="pakete" className="py-16 sm:py-20 bg-neutral-50/60">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">Pakete</h2>
              <p className="mt-3 text-neutral-600">
                Wähle das Paket, das zu deinem Inventar passt. Upgrade/Downgrade ist jederzeit möglich.
              </p>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-4">
              <Card className="rounded-3xl border-neutral-200/60 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="text-lg font-bold tracking-tight text-neutral-900">Starter</div>
                  <div className="mt-2 text-3xl font-bold text-neutral-900">CHF 149</div>
                  <div className="text-sm text-neutral-600">/ Monat</div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl border border-neutral-200/60 bg-white p-4">
                    <div className="text-sm text-neutral-600">bis zu 15 Inserate</div>
                    <div className="mt-1 text-sm text-neutral-600">1 Premium Inserat / Monat inklusive</div>
                  </div>
                  <div className="text-sm text-neutral-600">Alles aus „Inklusive“</div>
                  <Button asChild className="w-full rounded-2xl h-11">
                    <Link href={getPlanStartUrl("starter")}>Starter wählen</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-primary/30 shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-lg font-bold tracking-tight text-neutral-900">Growth</div>
                    <Badge className="rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0">
                      Meist gewählt
                    </Badge>
                  </div>
                  <div className="mt-2 text-3xl font-bold text-neutral-900">CHF 349</div>
                  <div className="text-sm text-neutral-600">/ Monat</div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl border border-neutral-200/60 bg-white p-4">
                    <div className="text-sm text-neutral-600">bis zu 50 Inserate</div>
                    <div className="mt-1 text-sm text-neutral-600">5 Premium Inserate / Monat inklusive</div>
                  </div>
                  <div className="text-sm text-neutral-900 font-medium">Done-for-you Onboarding</div>
                  <div className="text-sm text-neutral-600">Du schickst uns dein Inventar, wir erledigen den Rest.</div>
                  <Button asChild className="w-full rounded-2xl h-11 bg-gradient-to-r from-primary to-primary/80 text-white hover:opacity-95">
                    <Link href={getPlanStartUrl("growth")}>Growth wählen</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-neutral-200/60 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="text-lg font-bold tracking-tight text-neutral-900">Pro</div>
                  <div className="mt-2 text-3xl font-bold text-neutral-900">CHF 599</div>
                  <div className="text-sm text-neutral-600">/ Monat</div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl border border-neutral-200/60 bg-white p-4">
                    <div className="text-sm text-neutral-600">bis zu 100 Inserate</div>
                    <div className="mt-1 text-sm text-neutral-600">10 Premium Inserate / Monat inklusive</div>
                  </div>
                  <div className="text-sm text-neutral-900 font-medium">Done-for-you Onboarding (priorisiert)</div>
                  <div className="text-sm text-neutral-600">Für Teams, die schnell und konsistent live sein wollen.</div>
                  <Button asChild className="w-full rounded-2xl h-11">
                    <Link href={getPlanStartUrl("pro")}>Pro wählen</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-neutral-200/60 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="text-lg font-bold tracking-tight text-neutral-900">100+</div>
                  <div className="mt-2 text-3xl font-bold text-neutral-900">Individuell</div>
                  <div className="text-sm text-neutral-600">Für grosse Bestände</div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl border border-neutral-200/60 bg-white p-4 text-sm text-neutral-600">
                    Für grosse Bestände, mehrere Standorte oder Spezialprozesse.
                  </div>
                  <Button asChild variant="secondary" className="w-full rounded-2xl h-11">
                    <MailtoLink>Kontakt aufnehmen</MailtoLink>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
                  Was ist ein Premium Inserat?
                </h2>
                <p className="mt-3 text-neutral-600">
                  Ein Premium Inserat ist visuell hervorgehoben (Premium-Badge + Highlight) und kann zusätzlich in separaten Premium-Bereichen
                  erscheinen (z.B. Startseite / Premium-Sektion), ohne dass wir eine bessere Suchplatzierung versprechen.
                </p>

                <div className="mt-6 space-y-3">
                  {[
                    "Premium-Badge + visuelle Hervorhebung",
                    "Optional: Platzierung in Premium-Sektionen, wenn verfügbar",
                    "Monatliches Premium-Kontingent je nach Paket",
                  ].map((t) => (
                    <div key={t} className="flex items-start gap-3">
                      <div className="mt-2 h-2 w-2 rounded-full bg-primary" />
                      <div className="text-neutral-900 font-medium">{t}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-3xl border border-neutral-200/60 bg-neutral-50 p-5 text-sm text-neutral-700">
                  <span className="font-semibold">Hinweis:</span> Premium = Hervorhebung, nicht garantierte Leads.
                </div>
              </div>

              <div className="rounded-3xl border border-neutral-200/60 bg-white shadow-sm p-6">
                <div className="text-sm font-semibold text-neutral-900">Praktisch gedacht</div>
                <p className="mt-2 text-sm text-neutral-600">
                  Nutze Premium für Fahrzeuge, bei denen du bewusst mehr Aufmerksamkeit willst: Top-Deals, neue Modelle, schneller Abverkauf.
                </p>
                <div className="mt-6 grid gap-3">
                  {[
                    { label: "Starter", value: "1 Premium / Monat" },
                    { label: "Growth", value: "5 Premium / Monat" },
                    { label: "Pro", value: "10 Premium / Monat" },
                  ].map((x) => (
                    <div key={x.label} className="flex items-center justify-between rounded-2xl border border-neutral-200/60 bg-neutral-50 px-4 py-3">
                      <div className="text-sm font-medium text-neutral-900">{x.label}</div>
                      <div className="text-sm text-neutral-600">{x.value}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex gap-3">
                  <Button asChild className="rounded-2xl w-full h-11">
                    <Link href={START_URL}>Jetzt starten</Link>
                  </Button>
                  <Button asChild variant="secondary" className="rounded-2xl w-full h-11">
                    <MailtoLink>Kontakt</MailtoLink>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20 bg-neutral-50/60">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">So bist du schnell live</h2>
              <p className="mt-3 text-neutral-600">
                Done-for-you Onboarding ab Growth. Du lieferst die Inputs, wir setzen sauber um.
              </p>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {[
                {
                  step: "Step 1",
                  title: "Du schickst uns dein Inventar",
                  bullets: [
                    "Fahrzeugliste (CSV/Excel oder Link)",
                    "Fotos (Ordner/Drive/WeTransfer)",
                    "Welche Fahrzeuge leasingfähig sind",
                    "Leasing-Konditionen (Monate, KM, Anzahlung, Rate/Zins falls vorhanden)",
                  ],
                },
                {
                  step: "Step 2",
                  title: "Wir erstellen die Inserate",
                  bullets: ["Wir übernehmen Struktur, Grunddaten, Bilder-Reihenfolge und setzen den Leasing-Rechner korrekt."],
                },
                {
                  step: "Step 3",
                  title: "Du bekommst Anfragen",
                  bullets: ["Anfragen landen im Deal-Chat pro Fahrzeug – inkl. Dokumentenversand."],
                },
              ].map((s) => (
                <Card key={s.step} className="rounded-3xl border-neutral-200/60 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="text-xs text-neutral-500">{s.step}</div>
                    <div className="text-lg font-bold tracking-tight text-neutral-900">{s.title}</div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {s.bullets.map((b) => (
                      <div key={b} className="flex items-start gap-3 text-sm text-neutral-600">
                        <div className="mt-2 h-2 w-2 rounded-full bg-primary" />
                        <div>{b}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">FAQ</h2>
              <p className="mt-3 text-neutral-600">Kurz und klar – damit du schnell entscheiden kannst.</p>
            </div>

            <div className="mt-8 max-w-3xl">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((f, idx) => (
                  <AccordionItem key={f.q} value={`faq-${idx}`}>
                    <AccordionTrigger className={cn("text-left text-neutral-900 font-semibold", idx === 0 && "pt-0")}>
                      {f.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-neutral-600">{f.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20 bg-neutral-950">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-7 sm:p-10">
              <div className="max-w-2xl">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Bereit, dein Inventar live zu bringen?
                </h2>
                <p className="mt-3 text-white/75">
                  Monatlich kündbar. Keine Setup-Falle.
                </p>

                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <Button asChild className="rounded-2xl h-11 bg-white text-neutral-950 hover:bg-white/90">
                    <Link href={START_URL}>Jetzt starten</Link>
                  </Button>
                  <Button
                    asChild
                    variant="secondary"
                    className="rounded-2xl h-11 bg-white/15 text-white hover:bg-white/20 border border-white/20"
                  >
                    <MailtoLink>Kontakt aufnehmen</MailtoLink>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300",
            showStickyCta ? "translate-y-0" : "translate-y-full"
          )}
        >
          <div className="bg-white/80 backdrop-blur-md border-t border-neutral-200">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="text-sm text-neutral-700">
                  <span className="font-semibold text-neutral-900">Garagen-Pakete:</span> Starter, Growth, Pro – Upgrade/Downgrade jederzeit.
                </div>
                <div className="flex gap-2">
                  <Button asChild className="rounded-2xl h-10">
                    <Link href={START_URL}>Jetzt starten</Link>
                  </Button>
                  <Button asChild variant="secondary" className="rounded-2xl h-10">
                    <MailtoLink>Kontakt</MailtoLink>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}