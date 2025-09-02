
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Star, Calendar, ArrowRight, Home, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function SuccessScreen() {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center space-y-8">
        {/* Success Icon */}
        <div className="relative">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center animate-pulse">
            <Star className="w-4 h-4 text-white fill-current" />
          </div>
        </div>

        {/* Success Message */}
        <div className="space-y-4">
          <h1 className="text-3xl font-light text-neutral-900 tracking-wide">
            Inserat erfolgreich erstellt!
          </h1>
          <p className="text-neutral-600 leading-relaxed">
            Vielen Dank für Ihr Vertrauen in BuyAuto. Ihr Inserat wird nun von unserem Team überprüft 
            und anschließend veröffentlicht.
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="rounded-2xl border-neutral-200/60 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2">Überprüfung läuft</h3>
              <p className="text-sm text-neutral-600">
                Unser Team überprüft Ihr Inserat innerhalb von 2-4 Stunden
              </p>
              <Badge variant="secondary" className="mt-3 bg-amber-100 text-amber-700">
                In Bearbeitung
              </Badge>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-neutral-200/60 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2">Benachrichtigung</h3>
              <p className="text-sm text-neutral-600">
                Sie erhalten eine E-Mail sobald Ihr Inserat live geschaltet wird
              </p>
              <Badge variant="secondary" className="mt-3 bg-green-100 text-green-700">
                Automatisch
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Next Steps */}
        <Card className="rounded-3xl border-neutral-200/60 shadow-lg bg-gradient-to-br from-neutral-50/50 to-white">
          <CardContent className="p-8">
            <h2 className="text-xl font-semibold text-neutral-900 mb-6">Was passiert als Nächstes?</h2>
            
            <div className="space-y-4 text-left">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-amber-600">1</span>
                </div>
                <div>
                  <h3 className="font-medium text-neutral-900">Qualitätsprüfung</h3>
                  <p className="text-sm text-neutral-600">
                    Wir überprüfen alle Angaben und Bilder auf Vollständigkeit und Richtigkeit
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-amber-600">2</span>
                </div>
                <div>
                  <h3 className="font-medium text-neutral-900">Freischaltung</h3>
                  <p className="text-sm text-neutral-600">
                    Nach erfolgreicher Prüfung wird Ihr Inserat automatisch veröffentlicht
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-amber-600">3</span>
                </div>
                <div>
                  <h3 className="font-medium text-neutral-900">Interessenten erreichen</h3>
                  <p className="text-sm text-neutral-600">
                    Ihr Fahrzeug wird von tausenden Interessenten auf BuyAuto entdeckt
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Button
            onClick={() => router.push('/')}
            className="px-8 py-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-medium rounded-xl shadow-lg shadow-amber-200 transition-all duration-200 hover:shadow-xl hover:scale-[1.02]"
          >
            <Home className="w-5 h-5 mr-2" />
            Zur Startseite
          </Button>

          <Button
            onClick={() => router.push('/suche')}
            variant="outline"
            className="px-8 py-4 bg-transparent hover:bg-neutral-50 border-neutral-300 text-neutral-600 rounded-xl transition-all duration-200"
          >
            <Search className="w-5 h-5 mr-2" />
            Andere Angebote ansehen
          </Button>
        </div>

        {/* Additional Info */}
        <div className="pt-8 border-t border-neutral-200">
          <p className="text-sm text-neutral-500">
            Haben Sie Fragen? Kontaktieren Sie unser Support-Team unter{" "}
            <Link href="mailto:support@buyauto.ch" className="text-amber-600 hover:text-amber-700 transition-colors">
              support@buyauto.ch
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
