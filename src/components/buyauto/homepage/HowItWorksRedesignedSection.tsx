import { Search, MessageCircle, CheckCircle } from "lucide-react";

const steps = [
  {
    number: "1",
    icon: Search,
    title: "Finde ein Angebot",
    description: "Durchsuche hunderte aktuelle Leasingangebote und finde das perfekte Auto für dich.",
  },
  {
    number: "2",
    icon: MessageCircle,
    title: "Kontaktiere den Anbieter",
    description: "Nimm direkt Kontakt auf und kläre alle Details zur Leasingübernahme.",
  },
  {
    number: "3",
    icon: CheckCircle,
    title: "Übernehme das Leasing",
    description: "Schliesse die Übernahme ab und fahre schon bald dein neues Auto.",
  },
];

export function HowItWorksRedesignedSection() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
            So funktioniert die Leasingübernahme
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            In drei einfachen Schritten zu deinem neuen Auto
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="relative"
                style={{
                  animation: `fadeInUp 0.6s ease-out ${index * 0.15}s both`,
                }}
              >
                {/* Connector Line (Desktop Only) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-[calc(50%+3rem)] w-[calc(100%-6rem)] h-0.5 bg-gradient-to-r from-red-200 to-red-100 z-0" />
                )}

                <div className="relative z-10 text-center">
                  {/* Number Badge */}
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white text-2xl font-bold shadow-lg shadow-red-500/30 mb-6">
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div className="flex justify-center mb-4">
                    <div className="w-14 h-14 rounded-xl bg-red-50 flex items-center justify-center">
                      <Icon className="h-7 w-7 text-red-500" aria-hidden="true" />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-neutral-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </section>
  );
}