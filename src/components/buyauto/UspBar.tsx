import { Shield, Database, Zap, CheckCircle } from "lucide-react";

export function UspBar() {
  const usps = [
    {
      icon: Database,
      text: "Swiss Data Hosting",
      description: "Daten in der Schweiz"
    },
    {
      icon: Shield,
      text: "Sichere Bezahlung",
      description: "Powered by Stripe"
    },
    {
      icon: Zap,
      text: "Schneller Prozess",
      description: "In wenigen Minuten"
    },
    {
      icon: CheckCircle,
      text: "Geprüfte Inserate",
      description: "Qualität garantiert"
    }
  ];

  return (
    <section className="bg-white border-y border-gray-100 py-8 md:py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {usps.map((usp, index) => {
            const Icon = usp.icon;
            return (
              <div 
                key={index}
                className="flex flex-col items-center text-center group"
              >
                <div className="mb-3 p-3 rounded-full bg-red-50 group-hover:bg-red-100 transition-colors duration-200">
                  <Icon className="h-6 w-6 text-red-600" strokeWidth={1.5} />
                </div>
                <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-1">
                  {usp.text}
                </h3>
                <p className="text-xs md:text-sm text-gray-600 font-light">
                  {usp.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}