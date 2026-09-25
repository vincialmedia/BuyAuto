import Head from "next/head";
import { CONTENT_LAST_UPDATED, formatSwissDate } from "@/lib/buyauto/contentDates";
import Link from "next/link";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowRight,
  Check,
  X,
  Calendar,
  Gauge,
  Shield,
  Users,
  Zap,
  Clock,
  TrendingDown,
  BadgeCheck,
  FileText,
  DollarSign,
  Package,
  Car,
  Sparkles,
  Target,
} from "lucide-react";
import { absoluteUrl } from "@/i18n/config";
import { T, useLocale, useT } from "@/i18n/runtime";
import { staticI18nProps } from "@/i18n/server";

const PremiumListings = dynamic(
  () => import("@/components/buyauto/PremiumListings"),
  {
    ssr: false,
    loading: () => <div className="w-full min-h-[600px] bg-neutral-100 animate-pulse" />,
  }
);

// Single source for the visible «Aktualisiert am» badge and the Article dateModified.
const LAST_UPDATED_ISO = CONTENT_LAST_UPDATED["/auto-abos-im-vergleich"];

export default function AutoAbosImVergleichPage() {
  const t = useT();
  const locale = useLocale();
  const pageUrl = absoluteUrl("/auto-abos-im-vergleich", locale);
  const pageTitle = t("Auto-Abos im Vergleich 2026: Die besten Anbieter in der Schweiz | BuyAuto");
  const pageDescription = t(
    "Auto-Abos im Vergleich (Schweiz): Carify, Carvolution, Clyde, FlatDrive, SIXT+ & mehr. Unterschiede bei Laufzeit, Leistungen & Flexibilität – plus Alternative.",
  );

  const providers = [
    {
      name: "Carify",
      description: "Plattform für verschiedene Auto-Abo Anbieter mit breiter Auswahl.",
      fit: "Für alle, die Anbieter vergleichen wollen.",
      icon: Package,
    },
    {
      name: "Carvolution",
      description: "Auto-Abo mit flexiblen Laufzeiten, oft ab 3 Monaten.",
      fit: "Für mittelfristige Flexibilität.",
      icon: Calendar,
    },
    {
      name: "Clyde",
      description: "Kurze Mindestlaufzeiten möglich (1-2 Monate je nach Modell).",
      fit: "Für maximale Kurzfristigkeit.",
      icon: Zap,
    },
    {
      name: "FlatDrive",
      description: "Sorglos-Abo mit Fokus auf Fixpreis und All-inclusive.",
      fit: "Für Planbarkeit und Komfort.",
      icon: Shield,
    },
    {
      name: "Emil Frey move",
      description: "Marken-Abo mit Qualitätsflotte und Händlernetz.",
      fit: "Für Markenbewusste mit Service-Fokus.",
      icon: BadgeCheck,
    },
    {
      name: "SIXT+",
      description: "Sehr flexibel: monatlich kündbar, pausierbar.",
      fit: "Für maximale Flexibilität.",
      icon: Target,
    },
    {
      name: "Enterprise Minilease",
      description: "Auto-Abo mit flexibler Dauer (Monate).",
      fit: "Für Langzeitmiete-Konzept.",
      icon: Car,
    },
    {
      name: "Hertz Minilease",
      description: "Langzeitmiete/Abo-Logik.",
      fit: "Für klassische Mietmodelle.",
      icon: Clock,
    },
    {
      name: "Abo@Europcar",
      description: "Abo-Logik bei bekannter Mietwagenmarke.",
      fit: "Für Vertraute des Brands.",
      icon: Package,
    },
    {
      name: "Toyota Rent",
      description: "Markenspezifisches Abo.",
      fit: "Für Toyota-Fans.",
      icon: Car,
    },
    {
      name: "Astara Move",
      description: "Auto-Abo Angebot.",
      fit: "Weitere Option im Markt.",
      icon: Sparkles,
    },
    {
      name: "Upto",
      description: "Auto-Abo Anbieter.",
      fit: "Alternative im Vergleich.",
      icon: Package,
    },
    {
      name: "Vivelacar",
      description: "Auto-Abo Option.",
      fit: "Weitere Markt-Alternative.",
      icon: Car,
    },
    {
      name: "e-Joy",
      description: "E-Mobility fokussiertes Abo.",
      fit: "Für Elektro-Fans.",
      icon: Zap,
    },
  ];

  const comparisonData = [
    {
      provider: "Carify",
      model: "Plattform/Partnernetz",
      strength: "Breite Auswahl, Vergleichslogik",
      caveat: "Angebote variieren je nach Partner",
      fit: "Für Vergleicher",
    },
    {
      provider: "Carvolution",
      model: "Auto-Abo",
      strength: "Flexible Laufzeiten (oft ab 3 Monaten)",
      caveat: "Konditionen je nach Modell",
      fit: "Mittelfristige Flexibilität",
    },
    {
      provider: "Clyde",
      model: "Auto-Abo",
      strength: "Sehr kurze Laufzeiten möglich (1-2 Monate)",
      caveat: "Verfügbarkeit je nach Fahrzeug",
      fit: "Kurzfristige Nutzung",
    },
    {
      provider: "FlatDrive",
      model: "Sorglos-Abo",
      strength: "Fixpreis, All-inclusive Fokus",
      caveat: "Paketlogik kann teurer sein",
      fit: "Planbarkeit & Komfort",
    },
    {
      provider: "Emil Frey move",
      model: "Marken-Abo",
      strength: "Qualitätsflotte, Händlernetz",
      caveat: "Markengebunden",
      fit: "Service & Marke wichtig",
    },
    {
      provider: "SIXT+",
      model: "Flex-Abo",
      strength: "Monatlich kündbar, pausierbar",
      caveat: "Konditionen je nach Paket",
      fit: "Maximale Flexibilität",
    },
    {
      provider: "Enterprise Minilease",
      model: "Langzeitmiete",
      strength: "Flexible Dauer",
      caveat: "Konditionen variieren",
      fit: "Langzeitmiete-Konzept",
    },
    {
      provider: "Weitere (Hertz, Europcar, Toyota, etc.)",
      model: "Verschiedene Modelle",
      strength: "Je nach Anbieter",
      caveat: "Unterschiedliche Ansätze",
      fit: "Markt-Alternativen",
    },
  ];

  const checklistItems = [
    {
      icon: Calendar,
      title: "Mindestlaufzeit & Kündigungsfrist",
      description: "Wie lange bindest du dich? Wie flexibel kommst du raus?",
    },
    {
      icon: Gauge,
      title: "Kilometerpaket & Mehrkilometer",
      description: "Welches Paket brauchst du? Was kosten Extra-Kilometer?",
    },
    {
      icon: Shield,
      title: "Versicherung: Deckung & Selbstbehalt",
      description: "Vollkasko inklusive? Wie hoch ist der Selbstbehalt?",
    },
    {
      icon: Users,
      title: "Fahrer:innen-Regelung",
      description: "Wer darf fahren? Gibt es Altersbeschränkungen?",
    },
    {
      icon: Clock,
      title: "Verfügbarkeit / Lieferzeit",
      description: "Wie schnell bekommst du das Auto?",
    },
    {
      icon: DollarSign,
      title: "Zusatzkosten / Fees",
      description: "Gibt es versteckte Kosten? Übernahmegebühren?",
    },
  ];

  const faqs = [
    {
      question: "Was ist ein Auto-Abo?",
      answer:
        "Ein Auto-Abo ist eine monatliche Pauschale für ein Fahrzeug, oft inklusive Versicherung, Service, Steuern und Wartung (je nach Anbieter und Paket). Du zahlst eine fixe Rate und gibst das Auto nach der Mindestlaufzeit zurück oder verlängerst.",
    },
    {
      question: "Welche Auto-Abo Anbieter gibt es in der Schweiz?",
      answer:
        "In der Schweiz gibt es unter anderem: Carify, Carvolution, Clyde, FlatDrive, Emil Frey move, SIXT+, Enterprise Minilease, Hertz Minilease, Abo@Europcar, Toyota Rent, Astara Move, Upto, Vivelacar und e-Joy. Der Markt ist dynamisch und Angebote ändern sich.",
    },
    {
      question: "Was ist bei einem Auto-Abo normalerweise inklusive?",
      answer:
        "Oft sind Versicherung (Vollkasko), Service/Wartung, Steuern und manchmal sogar Reifen enthalten. Die genauen Leistungen variieren je nach Anbieter und Paket — deshalb lohnt sich der Vergleich.",
    },
    {
      question: "Ist ein Auto-Abo günstiger als Leasing?",
      answer:
        "Nicht unbedingt. Auto-Abos sind oft teurer pro Monat, weil viele Kosten gebündelt sind (Versicherung, Service). Dafür hast du weniger Organisationsaufwand. Ob es günstiger ist, hängt von deiner Nutzung und Versicherungssituation ab.",
    },
    {
      question: "Warum sind Auto-Abos oft teurer pro Monat?",
      answer:
        "Weil sie eine All-inclusive-Logik haben: Versicherung, Service, Steuern und Wartung sind oft im Preis enthalten. Das schafft Komfort, aber du zahlst auch für Dinge, die du vielleicht günstiger selbst organisieren könntest.",
    },
    {
      question: "Welche Anbieter sind besonders flexibel (kurze Laufzeiten)?",
      answer:
        "SIXT+ bietet monatliche Kündigungsoptionen und Pausierbarkeit. Clyde ermöglicht teilweise sehr kurze Mindestlaufzeiten (1-2 Monate je nach Modell). Auch Carvolution bietet flexible Laufzeiten ab 3 Monaten (je nach Angebot).",
    },
    {
      question: "Worauf muss ich beim Kilometerpaket achten?",
      answer:
        "Wähle das Paket realistisch: zu wenig Kilometer = teure Nachzahlungen. Zu viele Kilometer = höhere Monatsrate. Prüfe auch, was Extra-Kilometer kosten und ob du Kilometer zurückkaufen kannst.",
    },
    {
      question: "Was bedeutet Selbstbehalt bei der Versicherung?",
      answer:
        "Der Selbstbehalt ist der Betrag, den du bei einem Schaden selbst zahlst (z.B. CHF 1'000). Je niedriger der Selbstbehalt, desto höher oft die Monatsrate. Vergleiche das bei den Anbietern.",
    },
    {
      question: "Was sind Carify Alternativen?",
      answer:
        "Wenn du nach 'Carify Alternativen' suchst, meinst du meist: ein ähnliches Auto-Abo, aber mit anderen Laufzeiten, Konditionen oder Fahrzeugauswahl. Alternativen sind z.B. Carvolution, Clyde, FlatDrive, SIXT+ und Emil Frey move.",
    },
    {
      question: "Wann ist Leasingübernahme die bessere Wahl?",
      answer:
        "Wenn du die Monatsrate optimieren willst und bereit bist, Versicherung selbst zu organisieren. Bei einer Leasingübernahme übernimmst du einen bestehenden Vertrag (Restlaufzeit + Konditionen) — oft günstiger als ein neues Auto-Abo, weil du die Paketlogik umgehst.",
    },
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: t(faq.question),
          acceptedAnswer: {
            "@type": "Answer",
            text: t(faq.answer),
          },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: t("Home"),
            item: absoluteUrl("/", locale),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: t("Auto-Abos im Vergleich"),
            item: pageUrl,
          },
        ],
      },
    ],
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta
          name="description"
          content={pageDescription}
        />
        <link rel="canonical" href={pageUrl} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: t("Auto-Abos im Vergleich: Anbieter & Alternativen in der Schweiz"),
              author: { "@type": "Person", name: "Vincent Hänggi" },
              publisher: {
                "@type": "Organization",
                name: "BuyAuto",
                logo: { "@type": "ImageObject", url: "https://www.buyauto.ch/share-logo.jpg" },
              },
              dateModified: LAST_UPDATED_ISO,
              mainEntityOfPage: pageUrl,
            }),
          }}
        />
        
        <meta property="og:title" content={pageTitle} />
        <meta
          property="og:description"
          content={pageDescription}
        />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:type" content="website" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta
          name="twitter:description"
          content={pageDescription}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>

      <main className="min-h-screen">
        {/* HERO SECTION */}
        <section className="relative bg-gradient-to-t from-neutral-900 via-neutral-900/95 to-neutral-900/90 text-white py-24 md:py-32">
          <div className="absolute inset-0 -z-10">
            <Image
              src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1920"
              alt=""
              fill
              priority
              fetchPriority="high"
              sizes="100vw"
              quality={70}
              className="object-cover object-center"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/80 to-transparent -z-10" />

          <div className="container mx-auto px-4 max-w-5xl text-center relative z-10">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              {t("Auto-Abos im Vergleich: Anbieter & Alternativen in der Schweiz")}
            </h1>
            <p className="text-lg md:text-xl text-neutral-200 mb-4 max-w-3xl mx-auto">
              {t("Die wichtigsten Auto-Abo-Anbieter in der Schweiz sind Carify, Carvolution, Clyde, FlatDrive und SIXT+ — dazu kommt die Leasingübernahme als flexible Alternative. Auto-Abo ist das Sorglos-Paket: Fixpreis, wenig Aufwand, schnell. Aber: All-inclusive ist bequem — und genau deshalb oft nicht die günstigste Option. Hier ist der faire Vergleich.")}
            </p>
            <p className="text-sm text-neutral-400 mb-8">{t("Aktualisiert am {date}", { date: formatSwissDate(LAST_UPDATED_ISO) })}</p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white"
                asChild
              >
                <a href="#vergleich">
                  {t("Auto-Abos vergleichen")} <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/30"
                asChild
              >
                <Link href="/leasinguebernahme">{t("Leasingübernahmen ansehen")}</Link>
              </Button>
            </div>

            <p className="text-sm text-neutral-300 max-w-2xl mx-auto">
              {t("Anbieter unterscheiden sich stark bei Mindestlaufzeit, Kilometerpaketen, Versicherung/Selbstbehalt und Leistungen — vergleichen lohnt sich.")}
            </p>
          </div>
        </section>

        {/* SECTION: WAS IST EIN AUTO-ABO */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 mb-6 text-center">
              {t("Was ist ein Auto-Abo (und warum unterscheiden sich die Angebote so stark)?")}
            </h2>
            <div className="prose prose-lg max-w-3xl mx-auto text-neutral-700">
              <p>
                {t("Ein Auto-Abo ist eine monatliche Pauschale für ein Fahrzeug, oft inklusive Versicherung, Service und Steuern (je nach Anbieter/Paket).")}
              </p>
              <p className="font-semibold text-neutral-900">{t("Die Unterschiede:")}</p>
              <ul className="space-y-2">
                <li><T k={"<0>Mindestlaufzeit & Kündigungsfrist:</0> Manche Anbieter binden dich monatelang, andere sind monatlich kündbar."} c={[<strong key="0" />]} /></li>
                <li><T k={"<0>Kilometerpakete & Mehrkilometer:</0> Wählst du zu wenig, zahlst du Nachschlag. Wählst du zu viel, zahlst du unnötig."} c={[<strong key="0" />]} /></li>
                <li><T k="<0>Versicherung:</0> Deckung, Selbstbehalt und Fahrer:innen-Regelung variieren stark." c={[<strong key="0" />]} /></li>
                <li><T k="<0>Verfügbarkeit, Fahrzeugwahl, Extras:</0> Je nach Anbieter unterschiedlich." c={[<strong key="0" />]} /></li>
              </ul>
              <p className="text-neutral-600 italic border-l-4 border-primary pl-4 mt-6">
                {t('"Auto-Abo ist wie Hotel mit Frühstück: entspannt — aber du zahlst halt auch für Dinge, die du vielleicht gar nicht brauchst."')}
              </p>
            </div>
          </div>
        </section>

        {/* SECTION: ANBIETER LISTE */}
        <section className="py-20 bg-neutral-50">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 mb-12 text-center">
              {t("Auto-Abo Anbieter in der Schweiz (Auswahl)")}
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {providers.map((provider, index) => {
                const Icon = provider.icon;
                return (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-neutral-900 mb-2">{provider.name}</h3>
                          <p className="text-sm text-neutral-600 mb-3">{t(provider.description)}</p>
                          <Badge variant="outline" className="text-xs">
                            {t(provider.fit)}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <p className="text-sm text-neutral-600 text-center mt-8 max-w-2xl mx-auto">
              {t("Der Markt ist dynamisch: Angebote, Mindestlaufzeiten und Inklusivleistungen ändern sich je nach Anbieter, Fahrzeug und Paket.")}
            </p>
          </div>
        </section>

        {/* SECTION: VERGLEICHSTABELLE */}
        <section id="vergleich" className="py-20 bg-white scroll-mt-20">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 mb-12 text-center">
              {t("Auto-Abos im Vergleich (Schweiz) — auf einen Blick")}
            </h2>

            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-neutral-100">
                    <th className="text-left p-4 font-bold text-neutral-900">{t("Anbieter@@provider")}</th>
                    <th className="text-left p-4 font-bold text-neutral-900">{t("Modell")}</th>
                    <th className="text-left p-4 font-bold text-neutral-900">{t("Typische Stärke")}</th>
                    <th className="text-left p-4 font-bold text-neutral-900">{t("Typischer Haken")}</th>
                    <th className="text-left p-4 font-bold text-neutral-900">{t("Für wen passt's?")}</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((item, index) => (
                    <tr key={index} className="border-b border-neutral-200 hover:bg-neutral-50">
                      <td className="p-4 font-semibold text-neutral-900">{t(item.provider)}</td>
                      <td className="p-4 text-neutral-700">{t(item.model)}</td>
                      <td className="p-4 text-neutral-700">{t(item.strength)}</td>
                      <td className="p-4 text-neutral-600 text-sm">{t(item.caveat)}</td>
                      <td className="p-4 text-neutral-700">{t(item.fit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4">
              {comparisonData.map((item, index) => (
                <Card key={index}>
                  <CardContent className="p-6 space-y-3">
                    <h3 className="font-bold text-lg text-neutral-900">{t(item.provider)}</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-semibold text-neutral-700">{t("Modell:")}</span> {t(item.model)}</p>
                      <p><span className="font-semibold text-neutral-700">{t("Stärke:")}</span> {t(item.strength)}</p>
                      <p><span className="font-semibold text-neutral-700">{t("Haken:")}</span> {t(item.caveat)}</p>
                      <p><span className="font-semibold text-neutral-700">{t("Passt für:")}</span> {t(item.fit)}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
              <Button size="lg" asChild>
                <Link href="/leasinguebernahme">
                  {t("Leasingübernahmen ansehen")} <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/inserat-erstellen">{t("Leasing abgeben")}</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* SECTION: CHECKLISTE */}
        <section className="py-20 bg-neutral-50">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 mb-12 text-center">
              {t("Worauf du beim Auto-Abo Vergleich wirklich achten solltest")}
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {checklistItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-2xl">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-neutral-900 mb-2">{t(item.title)}</h3>
                        <p className="text-neutral-600">{t(item.description)}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION: CARIFY ALTERNATIVEN */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 mb-6 text-center">
              {t("Carify Alternativen: Welche Anbieter sind ähnlich?")}
            </h2>
            <div className="prose prose-lg max-w-3xl mx-auto text-neutral-700">
              <p>
                <T
                  k={'Wenn du nach <0>"Carify Alternativen"</0> suchst, meinst du meistens: ein ähnliches Auto-Abo, aber mit anderer Laufzeit, Auswahl oder Konditionen.'}
                  c={[<strong key="0" />]}
                />
              </p>
              <p>
                <T
                  k="Nahegelegene Alternativen sind zum Beispiel: <0>Carvolution, Clyde, FlatDrive, SIXT+</0> und <1>Emil Frey move</1>. Alle bieten Auto-Abo-Modelle mit unterschiedlichen Schwerpunkten — wir haben die <2>Carify-Alternativen im Detail</2> verglichen."
                  c={[
                    <strong key="0" />,
                    <strong key="1" />,
                    <Link key="2" href="/carify-alternativen" className="text-primary font-semibold hover:underline" />,
                  ]}
                />
              </p>
              <p className="text-sm text-neutral-600 border-l-4 border-primary pl-4 mt-4">
                {t("Für den besten Match lohnt sich der Vergleich nach Mindestlaufzeit, Kilometer und Versicherung (siehe Vergleichstabelle oben).")}
              </p>
            </div>
          </div>
        </section>

        {/* SECTION: PLOT TWIST */}
        <section className="py-20 bg-gradient-to-br from-primary/5 to-primary/10">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-primary text-white">{t("Der Cheatcode")}</Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 mb-6">
                {t("Günstigere Alternative zum Auto-Abo: Leasingübernahme")}
              </h2>
            </div>

            <div className="prose prose-lg max-w-3xl mx-auto text-neutral-700">
              <p>
                <T k="<0>Auto-Abo = Paketlogik:</0> Komfort, Fixpreis, alles gebündelt." c={[<strong key="0" />]} />
              </p>
              <p>
                <T
                  k="<0>Leasingübernahme = bestehenden Vertrag übernehmen:</0> Du übernimmst einen laufenden Leasingvertrag (Restlaufzeit + Konditionen transparent), organisierst Versicherung selbst → oft besser steuerbar beim Monatsbudget. Du filterst gezielt nach Rate/Laufzeit/Kilometern."
                  c={[<strong key="0" />]}
                />
              </p>
              <p className="text-neutral-900 font-semibold italic border-l-4 border-primary pl-4 mt-6">
                {t('"Wenn du keine Lust hast, die Komfort-Steuer zu zahlen: Leasingübernahme ist für viele der Cheatcode."')}
              </p>
              <p className="text-sm text-neutral-600 mt-4">
                <T
                  k="<0>Fairness-Hinweis:</0> Ob es günstiger ist, hängt vom Auto, Vertrag und deiner Versicherung ab — aber wenn du den Monatsbetrag optimieren willst, lohnt sich Leasingübernahme fast immer als erster Check. Den direkten Vergleich der beiden Modelle findest du in unserem Guide <1>Leasingübernahme vs. Auto-Abo</1>."
                  c={[
                    <strong key="0" />,
                    <Link key="1" href="/leasinguebernahme-vs-autoabo" className="text-primary font-semibold hover:underline" />,
                  ]}
                />
              </p>
            </div>
          </div>
        </section>

        {/* SECTION: VERGLEICHSBOX (2 SPALTEN) */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 mb-12 text-center">
              {t("Auto-Abo oder Leasingübernahme? Der ehrliche Vergleich")}
            </h2>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {/* AUTO-ABO */}
              <Card className="relative overflow-hidden hover:shadow-xl transition-shadow">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full" />
                <CardContent className="p-8">
                  <Badge className="mb-4 bg-green-500 text-white">{t("Sorglos-Modus ✅")}</Badge>
                  <h3 className="text-2xl font-bold text-neutral-900 mb-4">
                    {t("Auto-Abo (Carify, Carvolution, Clyde, FlatDrive & Co.)")}
                  </h3>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                      <span className="text-neutral-700">{t("Fixpreis: viele Kosten gebündelt (je nach Anbieter/Paket)")}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                      <span className="text-neutral-700">{t("Bequem: weniger Organisieren (Versicherung/Service oft inkludiert)")}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                      <span className="text-neutral-700">{t("Passt, wenn Komfort & Planbarkeit Priorität haben")}</span>
                    </li>
                  </ul>
                  <p className="text-sm text-neutral-600 italic border-t pt-4">
                    {t("Komfort ist selten gratis: du zahlst oft eine Paketlogik, auch wenn du nicht alles ausnutzt.")}
                  </p>
                </CardContent>
              </Card>

              {/* LEASINGÜBERNAHME */}
              <Card className="relative overflow-hidden hover:shadow-xl transition-shadow border-2 border-primary">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-bl-full" />
                <CardContent className="p-8">
                  <Badge className="mb-4 bg-primary text-white">{t("Preis-Optimierer 🧠")}</Badge>
                  <h3 className="text-2xl font-bold text-neutral-900 mb-4">
                    {t("Leasingübernahme (über BuyAuto)")}
                  </h3>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                      <span className="text-neutral-700">{t("Bestehenden Leasingvertrag übernehmen (Restlaufzeit + Konditionen transparent)")}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                      <span className="text-neutral-700">{t("Mehr Kontrolle: Rate/Laufzeit/Kilometer wählen statt Paket")}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                      <span className="text-neutral-700">{t("Oft günstiger, wenn du Versicherung separat regelst")}</span>
                    </li>
                  </ul>
                  <p className="text-sm text-neutral-600 italic border-t pt-4">
                    {t("Konditionen hängen vom Inserat & Vertrag ab — darum lohnt sich der Vergleich.")}
                  </p>
                </CardContent>
              </Card>
            </div>

            <p className="text-center text-lg text-neutral-700 italic max-w-3xl mx-auto mb-8">
              {t('"Auto-Abo ist wie Hotel mit Frühstück. Leasingübernahme ist wie eine gute Wohnung: weniger inklusive — aber oft günstiger, wenn du\'s schlau machst."')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/leasinguebernahme">
                  {t("Leasingübernahmen ansehen")} <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/inserat-erstellen">{t("Leasing abgeben")}</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* TRUST SECTION */}
        <section className="py-20 bg-neutral-50">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 mb-6">
              {t("Warum BuyAuto hier überhaupt mitredet")}
            </h2>
            <div className="prose prose-lg max-w-3xl mx-auto text-neutral-700">
              <p>
                <T
                  k={'BuyAuto ist auf <0>Leasingübernahmen</0> spezialisiert. Wenn du nach dem besten Auto-Abo suchst, ist die Frage dahinter oft: <1>"Wie komme ich günstig und flexibel zu einem Auto?"</1>'}
                  c={[<strong key="0" />, <em key="1" />]}
                />
              </p>
              <p>
                <T
                  k="Auto-Abo ist bequem — <0>Leasingübernahme ist für viele die unterschätzte Option</0>, um die Monatsrate zu optimieren."
                  c={[<strong key="0" />]}
                />
              </p>
              <p className="text-sm text-neutral-600 italic mt-6">
                {t("— Vincent Hänggi, Gründer von BuyAuto")}
              </p>
            </div>
            <p className="text-xs text-neutral-500 mt-8">
              {t("BuyAuto ist unabhängig und steht in keiner Verbindung zu den genannten Anbietern.")}
            </p>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 mb-12 text-center">
              {t("FAQ: Auto-Abos im Vergleich (Schweiz)")}
            </h2>

            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border rounded-2xl px-6">
                  <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline">
                    {t(faq.question)}
                  </AccordionTrigger>
                  <AccordionContent className="text-neutral-700 pt-4">
                    {t(faq.answer)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-20 bg-gradient-to-br from-primary to-primary/80 text-white">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
              {t("Vergleich gemacht — jetzt die Monatsrate optimieren.")}
            </h2>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
              {t("Du hast die Auto-Abo Anbieter verglichen. Jetzt sieh dir an, wie viel du mit einer Leasingübernahme sparen könntest.")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/leasinguebernahme">
                  {t("Leasingübernahmen ansehen")} <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/30"
                asChild
              >
                <Link href="/inserat-erstellen">{t("Leasing abgeben")}</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* PREMIUM LISTINGS - Dynamic Load */}
        <PremiumListings />
      </main>
    </>
  );
}

export const getStaticProps = staticI18nProps(["pages/auto-abos-im-vergleich"]);