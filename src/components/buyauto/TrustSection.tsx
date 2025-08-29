
import { Shield, CreditCard, MapPin, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const trustPoints = [
  {
    icon: Shield,
    title: "Inserate manuell geprüft",
    description: "Jedes Inserat wird von unserem Team persönlich überprüft und validiert."
  },
  {
    icon: CreditCard,
    title: "Sichere Zahlungen via Stripe",
    description: "Alle Transaktionen sind durch modernste Verschlüsselung geschützt."
  },
  {
    icon: MapPin,
    title: "Schweizer Team in Zürich",
    description: "Lokaler Support und persönliche Beratung von unserem Standort in Zürich."
  }
];

export default function TrustSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-neutral-50/80 via-white to-neutral-50/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Swiss clean section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-light text-neutral-900 mb-4 tracking-tight">
            Sicher & <span className="font-semibold text-red-500">Transparent</span>
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto font-light leading-relaxed">
            Vertrauen Sie auf unsere bewährten Prozesse und Schweizer Qualität
          </p>
        </div>

        {/* Swiss refined trust cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {trustPoints.map((point, index) => {
            const IconComponent = point.icon;
            return (
              <div 
                key={index}
                className="group bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-sm hover:shadow-xl border border-neutral-200/40 hover:border-neutral-300/60 transition-all duration-500 text-center hover:-translate-y-1"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-lg group-hover:shadow-red-500/10 transition-all duration-300">
                  <IconComponent className="h-6 w-6 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-3 leading-tight">
                  {point.title}
                </h3>
                <p className="text-neutral-600 leading-relaxed font-light text-sm">
                  {point.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Swiss refined testimonial */}
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white/95 backdrop-blur-sm shadow-lg border border-neutral-200/40 overflow-hidden rounded-3xl">
            <CardContent className="p-8">
              <div className="flex items-center mb-6">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className="h-5 w-5 text-amber-400 fill-current mr-1" />
                ))}
              </div>
              <blockquote className="text-lg text-neutral-700 mb-6 leading-relaxed font-light italic">
                "Übernahme in 3 Tagen erledigt – top Support und transparenter Ablauf. 
                Kann BuyAuto nur weiterempfehlen!"
              </blockquote>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mr-4 shadow-sm">
                  <span className="text-red-700 font-semibold text-lg">L</span>
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">Lea M.</p>
                  <p className="text-neutral-600 text-sm font-light">Zürich</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
