import { PricingToggle, type PricingPersona } from "@/components/buyauto/pricing/PricingToggle";

export interface PricingHeroProps {
  persona: PricingPersona;
  onPersonaChange: (value: PricingPersona) => void;
}

export function PricingHero({ persona, onPersonaChange }: PricingHeroProps) {
  return (
    <section className="relative overflow-hidden pt-24 pb-14 sm:pt-28 sm:pb-16">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-neutral-950"
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-90"
        style={{
          backgroundImage:
            "radial-gradient(800px 380px at 50% 20%, rgba(255,255,255,0.16), transparent 60%), radial-gradient(700px 420px at 10% 10%, rgba(239,68,68,0.22), transparent 55%), radial-gradient(700px 420px at 90% 35%, rgba(239,68,68,0.18), transparent 60%)",
        }}
      />

      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-white" />

      <div className="relative container">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-white/80 text-sm font-semibold tracking-wide">
            BuyAuto Preise
          </p>

          <h1 className="mt-3 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white">
            Klar. Fair. Swiss-clean.
          </h1>

          <p className="mt-4 text-base sm:text-lg text-white/80">
            Wähle deinen Kundentyp und finde das passende Paket – mit allen
            Kaufarten unter einem Dach und Kommunikation immer rund ums Fahrzeug.
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

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { title: "Pro Fahrzeug gedacht", body: "Anfragen & Deal-Chat sind immer ans Inserat gekoppelt." },
              { title: "Schlankes Setup", body: "Schnell live – privat oder als Garage." },
              { title: "Transparente Preise", body: "Keine Setup-Fallen. Klarer Leistungsumfang." },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-white/15 bg-white/10 backdrop-blur px-4 py-4 text-left"
              >
                <div className="text-sm font-semibold text-white">{item.title}</div>
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