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
    <section className="py-20 px-4 bg-gradient-to-b from-neutral-50 to-white">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-neutral-900 mb-4 tracking-tight">
            Sicher & <span className="text-primary">Transparent</span>
          </h2>
          <p className="text-lg md:text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed">
            Vertrauen Sie auf unsere bewährten Prozesse und Schweizer Qualität
          </p>
        </div>

        {/* Trust cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {trustPoints.map((point, index) => {
            const IconComponent = point.icon;
            return (
              <div 
                key={index}
                className="group bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl border-2 border-neutral-100 hover:border-primary/30 transition-all duration-300 text-center hover:-translate-y-1"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-300">
                  <IconComponent className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-black text-neutral-900 mb-3 leading-tight">
                  {point.title}
                </h3>
                <p className="text-neutral-600 leading-relaxed text-base">
                  {point.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Testimonial */}
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white shadow-lg border-2 border-neutral-100 overflow-hidden rounded-3xl">
            <CardContent className="p-8 md:p-10">
              <div className="flex items-center justify-center mb-6">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className="h-6 w-6 text-amber-400 fill-current mr-1" />
                ))}
              </div>
              <blockquote className="text-xl md:text-2xl text-neutral-700 mb-8 leading-relaxed text-center italic">
                "Übernahme in 3 Tagen erledigt – top Support und transparenter Ablauf. 
                Kann BuyAuto nur weiterempfehlen!"
              </blockquote>
              <div className="flex items-center justify-center">
                <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/30 rounded-full flex items-center justify-center mr-4 shadow-sm">
                  <span className="text-primary font-black text-xl">L</span>
                </div>
                <div className="text-center">
                  <p className="font-black text-neutral-900 text-lg">Lea M.</p>
                  <p className="text-neutral-600 font-medium">Zürich</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}