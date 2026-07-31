import Image from "next/image";
import { PricingToggle, type PricingPersona } from "@/components/buyauto/pricing/PricingToggle";

export interface PricingHeroProps {
  persona: PricingPersona;
  onPersonaChange: (value: PricingPersona) => void;
}

// The three objections each audience arrives with, answered above the fold.
const GARAGE_USPS = [
  {
    title: "Fixpreis, kein Fahrzeugwert",
    body: "Dein Preis hängt am Paket – nicht am Wert der Autos in deinem Hof.",
  },
  {
    title: "Monatlich kündbar",
    body: "Kein Jahresvertrag, keine Setup-Gebühr, kein Kleingedrucktes.",
  },
  {
    title: "Alles am Fahrzeug",
    body: "Inserat, Leasing-Rechner, Anfragen und Deal-Chat hängen am selben Auto.",
  },
];

const PRIVATE_USPS = [
  {
    title: "Einmal zahlen, kein Abo",
    body: "Du buchst eine Laufzeit – danach passiert nichts automatisch.",
  },
  {
    title: "Premium wenn du willst",
    body: "In Verlängert und Unlimitiert ist die Premium-Platzierung schon drin.",
  },
  {
    title: "Anfragen direkt im Chat",
    body: "Interessenten schreiben dir am Inserat – ohne Telefonnummer im Netz.",
  },
];

export function PricingHero({ persona, onPersonaChange }: PricingHeroProps) {
  return (
    <section className="relative overflow-hidden pt-24 pb-16 sm:pt-28 sm:pb-20">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-neutral-950"
      />

      {/* next/image instead of a CSS background so the LCP image is
          discoverable in the initial HTML and served responsive/AVIF. */}
      <div aria-hidden="true" className="absolute inset-0 opacity-60">
        <Image
          src="/pexels-maitree-rimthong-444156-1602726.jpg"
          alt=""
          fill
          priority
          fetchPriority="high"
          className="object-cover"
          sizes="100vw"
          quality={60}
        />
      </div>

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-neutral-950/20"
      />

      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(900px 420px at 50% 10%, rgba(255,255,255,0.20), transparent 60%), radial-gradient(780px 520px at 20% 20%, rgba(239,68,68,0.12), transparent 55%), radial-gradient(760px 520px at 85% 30%, rgba(10,10,10,0.10), transparent 60%)",
        }}
      />

      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-white" />

      <div className="relative container">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-white/85 text-sm font-semibold tracking-wide">
            BuyAuto Preise
          </p>

          <h1 className="mt-3 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white">
            Klar. Fair. Swiss-clean.
          </h1>

          <p className="mt-4 text-base sm:text-lg text-white/80">
            {persona === "garage"
              ? "Ein Fixpreis pro Monat für deine Garage – Profilseite, Inserate, Leasing-Rechner und Deal-Chat inklusive. Monatlich kündbar."
              : "Ein Inserat, ein Preis, keine Abo-Falle. Wähle Laufzeit und Sichtbarkeit – Premium kannst du jederzeit dazunehmen."}
          </p>

          <div className="mt-8 flex justify-center">
            <div className="w-full max-w-[520px] rounded-3xl bg-white/25 backdrop-blur-xl border border-white/30 shadow-2xl p-4 sm:p-5">
              <div className="flex flex-col items-center gap-3">
                <PricingToggle value={persona} onChange={onPersonaChange} />
                <p className="text-xs text-white/70">
                  Du kannst jederzeit wechseln – Preise & Inhalte passen sich an.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(persona === "garage" ? GARAGE_USPS : PRIVATE_USPS).map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-white/15 bg-white/10 backdrop-blur px-4 py-4 text-left"
              >
                <div className="text-sm font-semibold text-white">
                  {item.title}
                </div>
                <div className="mt-1 text-xs leading-relaxed text-white/75">
                  {item.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}