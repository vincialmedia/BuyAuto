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
    <section className="py-16 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Sicher & Transparent
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Vertrauen Sie auf unsere bewährten Prozesse und Schweizer Qualität
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {trustPoints.map((point, index) => {
            const IconComponent = point.icon;
            return (
              <div 
                key={index}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 text-center group"
              >
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-red-200 transition-colors">
                  <IconComponent className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {point.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {point.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Testimonial */}
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white shadow-lg border-0 overflow-hidden">
            <CardContent className="p-8">
              <div className="flex items-center mb-4">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <blockquote className="text-lg text-slate-700 mb-4 leading-relaxed">
                "Übernahme in 3 Tagen erledigt – top Support und transparenter Ablauf. 
                Kann BuyAuto nur weiterempfehlen!"
              </blockquote>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mr-4">
                  <span className="text-red-700 font-semibold text-lg">L</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Lea M.</p>
                  <p className="text-slate-600 text-sm">Zürich</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}