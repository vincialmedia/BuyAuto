import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, ChevronRight, Crown, FileText, MessageSquare, Sparkles } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import MainLayout from "@/components/layout/MainLayout";
import { cn } from "@/lib/utils";
import { useHasMounted } from "@/hooks/use-has-mounted";

type PlanCard = {
  code: "starter" | "growth" | "pro" | "custom";
  name: string;
  priceLine: string;
  limitLine: string;
  premiumLine: string;
  highlights: string[];
  ctaLabel: string;
  ctaHref: string;
  ctaKind: "primary" | "secondary" | "mail";
  badge?: string;
};

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow ? <div className="text-xs font-semibold tracking-[0.2em] text-neutral-500 uppercase">{eyebrow}</div> : null}
      <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">{title}</h2>
      {description ? <p className="mt-3 text-base text-neutral-600 leading-relaxed">{description}</p> : null}
    </div>
  );
}

function PricingCard({ plan }: { plan: PlanCard }) {
  const isPrimary = plan.code === "growth";
  const isMail = plan.ctaKind === "mail";

  const topClass = isPrimary
    ? "border-primary/20 bg-gradient-to-b from-primary/[0.06] to-white shadow-lg"
    : "border-neutral-200/60 bg-white shadow-sm";

  const priceClass = isPrimary ? "text-neutral-900" : "text-neutral-900";

  const button = isMail ? (
    <Button asChild variant="secondary" className="w-full rounded-2xl">
      <a href={plan.ctaHref}>{plan.ctaLabel}</a>
    </Button>
  ) : (
    <Button
      asChild
      className={cn(
        "w-full rounded-2xl",
        plan.ctaKind === "primary" ? "bg-gradient-to-r from-primary to-primary/80 text-white hover:opacity-95" : ""
      )}
      variant={plan.ctaKind === "primary" ? "default" : "secondary"}
    >
      <Link href={plan.ctaHref}>{plan.ctaLabel}</Link>
    </Button>
  );

  return (
    <Card className={cn("rounded-3xl overflow-hidden transition-shadow hover:shadow-md", topClass)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="text-lg font-bold tracking-tight text-neutral-900">{plan.name}</div>
              {plan.badge ? (
                <Badge className="rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0">
                  {plan.badge}
                </Badge>
              ) : null}
            </div>
            <div className={cn("mt-2 text-2xl sm:text-3xl font-bold tracking-tight", priceClass)}>{plan.priceLine}</div>
            <div className="mt-1 text-sm text-neutral-600">{plan.limitLine}</div>
            <div className="mt-1 text-sm text-neutral-600">{plan.premiumLine}</div>
          </div>

          <div className={cn("rounded-2xl border px-3 py-2 text-xs font-semibold", isPrimary ? "border-primary/20 bg-white/70" : "border-neutral-200/60 bg-neutral-50")}>
            {plan.code.toUpperCase()}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="mt-3 space-y-2 text-sm text-neutral-700">
          {plan.highlights.map((h) => (
            <div key={h} className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 text-emerald-600" />
              <div>{h}</div>
            </div>
          ))}
        </div>

        <div className="mt-5">{button}</div>

        {plan.code === "custom" ? (
          <div className="mt-3 text-xs text-neutral-500">
            Für 100+ rechnen wir gemeinsam: mehrere Standorte, Spezialprozesse, Schnittstellen und Support.
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function useStickyCtaVisibility() {
  const hasMounted = useHasMounted();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!hasMounted) return;

    const handler = () => {
      const y = window.scrollY || 0;
      setVisible(y > 520);
    };

    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [hasMounted]);

  return { hasMounted, visible };
}

export default function GaragePreisePage() {
  const startHref = "/garage-onboarding";
  const packagesAnchor = "#pakete";
  const contactHref = "mailto:hello@buyauto.ch";

  const plans: PlanCard[] = useMemo(
    () => [
      {
        code: "starter",
        name: "Starter",
        priceLine: "CHF 149 / Monat",
        limitLine: "bis zu 15 Inserate",
        premiumLine: "1 Premium Inserat / Monat inklusive",
        highlights: ["Alles aus „In jedem Paket inklusive“", "Ideal, wenn du sauber starten willst – ohne Setup-Overhead."],
        ctaLabel: "Starter wählen",
        ctaHref: `${startHref}?plan=starter`,
        ctaKind: "secondary",
      },
      {
        code: "growth",
        name: "Growth",
        priceLine: "CHF 349 / Monat",
        limitLine: "bis zu 50 Inserate",
        premiumLine: "5 Premium Inserate / Monat inklusive",
        highlights: ["Alles aus Starter", "Done-for-you Onboarding", "Du schickst uns dein Inventar, wir erledigen den Rest."],
        ctaLabel: "Growth wählen",
        ctaHref: `${startHref}?plan=growth`,
        ctaKind: "primary",
        badge: "Meist gewählt",
      },
      {
        code: "pro",
        name: "Pro",
        priceLine: "CHF 599 / Monat",
        limitLine: "bis zu 100 Inserate",
        premiumLine: "10 Premium Inserate / Monat inklusive",
        highlights: ["Alles aus Growth", "Done-for-you Onboarding (priorisiert)", "Für Teams mit konstantem Inventory-Flow."],
        ctaLabel: "Pro wählen",
        ctaHref: `${startHref}?plan=pro`,
        ctaKind: "secondary",
      },
      {
        code: "custom",
        name: "100+",
        priceLine: "Individuell",
        limitLine: "Für grosse Bestände, mehrere Standorte oder Spezialprozesse.",
        premiumLine: "Premium-Kontingent nach Bedarf",
        highlights: ["Setup & Prozesse gemeinsam definieren", "Onboarding nach Datenlage & Bestand", "Optional: individuelle Integrationen"],
        ctaLabel: "Kontakt aufnehmen",
        ctaHref: contactHref,
        ctaKind: "mail",
      },
    ],
    []
  );

  const includes = [
    { icon: <FileText className="h-5 w-5 text-neutral-900" />, title: "Garage-Profilseite + Inventar-Seite", desc: "Dein Auftritt als Garage – und ein sauberer Überblick über dein Inventory." },
    { icon: <Check className="h-5 w-5 text-neutral-900" />, title: "Inserate erstellen & verwalten", desc: "Status, Laufzeit und Premium-Optionen direkt im Dashboard." },
    { icon: <Sparkles className="h-5 w-5 text-neutral-900" />, title: "VIN-PreFill (wo verfügbar)", desc: "Schneller live – weniger Tipparbeit bei Grunddaten." },
    { icon: <ChevronRight className="h-5 w-5 text-neutral-900" />, title: "Leasing-Rechner direkt im Inserat", desc: "Klare Konditionen – weniger Rückfragen, bessere Gespräche." },
    { icon: <MessageSquare className="h-5 w-5 text-neutral-900" />, title: "Deal-Chat pro Fahrzeug (Chat + Dokumente)", desc: "Kommunikation und Dokumente pro Inserat – strukturiert, nachvollziehbar." },
    { icon: <Crown className="h-5 w-5 text-neutral-900" />, title: "Basis-Statistiken: Views & Anfragen", desc: "Sieh, was läuft – und was du optimieren solltest." },
  ];

  const faqs: Array<{ q: string; a: string }> = [
    {
      q: "Was zählt als Inserat?",
      a: "Ein Inserat ist ein Fahrzeug, das in deinem Inventory sichtbar ist (egal ob aktiv oder pending). Archivierte/gelöschte Inserate zählen nicht.",
    },
    {
      q: "Kann ich upgraden/downgraden?",
      a: "Ja. Du kannst dein Paket im Garage-Dashboard unter „Zahlung“ ändern. Wir protokollieren jede Änderung transparent.",
    },
    {
      q: "Gibt es eine Mindestlaufzeit?",
      a: "Nein. Monatlich kündbar – ohne Setup-Falle.",
    },
    {
      q: "Wie funktioniert der Deal-Chat?",
      a: "Jede Anfrage ist an ein Fahrzeug gebunden. Chat + Dokumente bleiben im Kontext des Inserats – statt in verstreuten E-Mails.",
    },
    {
      q: "Welche Daten braucht ihr fürs Onboarding?",
      a: "Fahrzeugliste (CSV/Excel oder Link), Fotos (Ordner/Drive/WeTransfer), Leasingfähigkeit pro Fahrzeug und die wichtigsten Konditionen (Monate, KM, Anzahlung, Rate/Zins falls vorhanden).",
    },
    {
      q: "Garantiert BuyAuto Leads?",
      a: "Nein. Leads können nicht garantiert werden – aber du bekommst eine saubere Präsenz + einen direkten Kanal für Anfragen.",
    },
    {
      q: "Wie setze ich Premium Inserate ein?",
      a: "Premium eignet sich für Fahrzeuge mit hoher Marge, knapper Verfügbarkeit oder für Modelle, die du aktiv pushen willst. Das Kontingent pro Monat hängt vom Paket ab.",
    },
    {
      q: "Welche Zahlungsarten gibt es?",
      a: "Aktuell: Paketverwaltung im Dashboard. Payment-Integration folgt – die Paketlogik ist bereits vorbereitet.",
    },
    {
      q: "Was passiert bei Kündigung?",
      a: "Dein Paket läuft bis zum Periodenende. Danach kannst du keine neuen Inserate veröffentlichen, wenn du über dem Limit bist; bestehende Inhalte bleiben nachvollziehbar.",
    },
  ];

  const { hasMounted, visible } = useStickyCtaVisibility();

  return (
    <MainLayout>
      <SEO
        title="BuyAuto – Preise für Garagen"
        description="Pakete für Garagen: Inserate, VIN-PreFill, Leasing-Rechner und Deal-Chat pro Fahrzeug. Done-for-you Onboarding ab Growth."
      />

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-neutral-950" />
        <div
          className="absolute inset-0 bg-cover bg-center opacity-45"
          style={{ backgroundImage: "url(/20251209_0003_Handshake_in_Zurich_simple_compose_01kc036j1cff881r0wzwemf48h.png)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-16 sm:pt-20 pb-10 sm:pb-14">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-4 py-2 text-white/90 text-xs font-semibold">
              Marketplace für Direktkauf & Leasing
              <span className="h-1 w-1 rounded-full bg-white/40" />
              für Garagen in der Schweiz
            </div>

            <h1 className="mt-5 text-4xl sm:text-5xl font-bold tracking-tight text-white">Preise für Garagen</h1>
            <p className="mt-4 text-xl sm:text-2xl font-semibold text-white/95">Mehr Anfragen. Weniger Aufwand.</p>
            <p className="mt-3 text-base sm:text-lg text-white/80 leading-relaxed">
              Dein Inventar online – mit VIN-PreFill, Leasing-Rechner und Deal-Chat pro Fahrzeug.
            </p>
            <p className="mt-2 text-sm text-white/70">
              Marketplace für Direktkauf & Leasing – mit klaren Inseraten und direktem Kontakt.
            </p>

            <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild className="rounded-2xl bg-white text-neutral-900 hover:bg-white/90">
                <Link href={startHref}>Jetzt starten</Link>
              </Button>
              <Button asChild variant="secondary" className="rounded-2xl bg-white/15 text-white hover:bg-white/20 border border-white/20">
                <a href={packagesAnchor}>Preise ansehen</a>
              </Button>
            </div>

            <div className="mt-8 grid gap-2 sm:grid-cols-3 text-left">
              {[
                "VIN-PreFill (wo verfügbar)",
                "Leasing-Rechner im Inserat",
                "Deal-Chat inkl. Dokumentenversand",
              ].map((t) => (
                <div key={t} className="rounded-2xl bg-white/10 border border-white/15 px-4 py-3 text-sm text-white/90">
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 text-emerald-300" />
                    <div>{t}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-3xl bg-white/25 backdrop-blur-xl border border-white/30 shadow-2xl px-4 py-4 sm:px-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="text-left">
                  <div className="text-sm font-semibold text-white">Done-for-you Onboarding ab Growth</div>
                  <div className="text-sm text-white/80 mt-1">
                    Du schickst uns dein Inventar – wir strukturieren, erstellen und bringen dich schnell live.
                  </div>
                </div>
                <Button asChild className="rounded-2xl bg-white text-neutral-900 hover:bg-white/90">
                  <Link href={startHref}>
                    Starten
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionTitle eyebrow="Leistung" title="In jedem Paket inklusive" />

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {includes.map((b) => (
              <Card key={b.title} className="rounded-3xl border-neutral-200/60 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-neutral-100 border border-neutral-200/60 p-2">{b.icon}</div>
                    <div>
                      <div className="font-semibold text-neutral-900">{b.title}</div>
                      <div className="mt-1 text-sm text-neutral-600 leading-relaxed">{b.desc}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 rounded-3xl border border-neutral-200/60 bg-neutral-50 p-5">
            <div className="text-sm font-semibold text-neutral-900">Wichtig</div>
            <div className="mt-1 text-sm text-neutral-600">
              Leads können nicht garantiert werden – aber du bekommst eine saubere Präsenz + direkten Kanal für Anfragen.
            </div>
          </div>
        </div>
      </section>

      <section id="pakete" className="py-16 sm:py-20 bg-neutral-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionTitle
            eyebrow="Pakete"
            title="Wähle das Paket, das zu deinem Bestand passt"
            description="Upgrade/Downgrade jederzeit im Dashboard. Growth ist perfekt, wenn du schnell und sauber live willst."
          />

          <div className="mt-10 grid gap-4 lg:grid-cols-4">
            {plans.map((p) => (
              <PricingCard key={p.code} plan={p} />
            ))}
          </div>

          <div className="mt-8 rounded-3xl border border-neutral-200/60 bg-white p-5">
            <div className="text-sm font-semibold text-neutral-900">Hinweis zu Premium</div>
            <div className="mt-1 text-sm text-neutral-600">
              Premium = Hervorhebung. Keine garantierten Leads und kein versprochenes Suchranking-Boosting.
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionTitle
            eyebrow="Premium"
            title="Was ist ein Premium Inserat?"
            description="Premium ist visuell hervorgehoben (Badge + Highlight) und kann zusätzlich in separaten Premium-Sektionen erscheinen – ohne dass wir eine bessere Suchplatzierung versprechen."
          />

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {[
              { title: "Premium-Badge + visuelle Hervorhebung", icon: <Crown className="h-5 w-5 text-amber-600" /> },
              { title: "Optional: Platzierung in Premium-Sektionen (wenn verfügbar)", icon: <Sparkles className="h-5 w-5 text-amber-600" /> },
              { title: "Monatliches Premium-Kontingent je nach Paket", icon: <Check className="h-5 w-5 text-amber-600" /> },
            ].map((b) => (
              <Card key={b.title} className="rounded-3xl border-neutral-200/60 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-amber-50 border border-amber-200/60 p-2">{b.icon}</div>
                    <div className="font-semibold text-neutral-900">{b.title}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 rounded-3xl bg-neutral-950 text-white p-6 sm:p-8">
            <div className="text-lg font-bold tracking-tight">Kurz gesagt</div>
            <div className="mt-2 text-white/80">
              Premium = Hervorhebung, nicht garantierte Leads. Nutze Premium für Fahrzeuge, die du aktiv pushen willst.
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-neutral-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionTitle eyebrow="Onboarding" title="So bist du schnell live" />

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
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
                bullets: [
                  "Struktur + Grunddaten",
                  "Bilder-Reihenfolge sauber setzen",
                  "Leasing-Rechner korrekt konfigurieren",
                ],
              },
              {
                step: "Step 3",
                title: "Du bekommst Anfragen",
                bullets: ["Anfragen landen im Deal-Chat pro Fahrzeug", "inkl. Dokumentenversand", "klarer Kontext pro Inserat"],
              },
            ].map((s) => (
              <Card key={s.step} className="rounded-3xl border-neutral-200/60 shadow-sm">
                <CardContent className="p-6">
                  <div className="inline-flex items-center rounded-full bg-neutral-100 border border-neutral-200/60 px-3 py-1 text-xs font-semibold text-neutral-700">
                    {s.step}
                  </div>
                  <div className="mt-3 text-lg font-bold tracking-tight text-neutral-900">{s.title}</div>
                  <div className="mt-4 space-y-2 text-sm text-neutral-700">
                    {s.bullets.map((b) => (
                      <div key={b} className="flex gap-2">
                        <Check className="mt-0.5 h-4 w-4 text-emerald-600" />
                        <div>{b}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-white hover:opacity-95">
              <Link href={startHref}>Jetzt starten</Link>
            </Button>
            <Button asChild variant="secondary" className="rounded-2xl">
              <a href={contactHref}>Kontakt aufnehmen</a>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionTitle eyebrow="FAQ" title="Häufige Fragen" />

          <div className="mt-10 mx-auto max-w-3xl">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((f, idx) => (
                <AccordionItem key={f.q} value={`faq-${idx}`} className="border-neutral-200/60">
                  <AccordionTrigger className="text-left text-neutral-900">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-neutral-600 leading-relaxed">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-neutral-950">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 sm:p-10 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Bereit, dein Inventar live zu bringen?</h2>
            <p className="mt-3 text-white/75 max-w-2xl mx-auto">
              Monatlich kündbar. Keine Setup-Falle.
            </p>

            <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild className="rounded-2xl bg-white text-neutral-900 hover:bg-white/90">
                <Link href={startHref}>Jetzt starten</Link>
              </Button>
              <Button asChild variant="secondary" className="rounded-2xl bg-white/15 text-white hover:bg-white/20 border border-white/20">
                <a href={contactHref}>Kontakt aufnehmen</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {hasMounted ? (
        <div
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-white/80 backdrop-blur-md transition-transform duration-300",
            visible ? "translate-y-0" : "translate-y-full"
          )}
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-neutral-900 truncate">Pakete für Garagen</div>
              <div className="text-xs text-neutral-600 truncate">Done-for-you Onboarding ab Growth. Premium = Hervorhebung.</div>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="secondary" className="rounded-2xl">
                <a href={packagesAnchor}>Preise</a>
              </Button>
              <Button asChild className="rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-white hover:opacity-95">
                <Link href={startHref}>Jetzt starten</Link>
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </MainLayout>
  );
}