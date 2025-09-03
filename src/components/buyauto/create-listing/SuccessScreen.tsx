
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
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-50 to-emerald-50 rounded-full flex items-center justify-center border border-green-100/40">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
            <Star className="w-4 h-4 text-white fill-current" />
          </div>
        </div>

        {/* Success Message */}
        <div className="space-y-4">
          <h1 className="text-3xl font-light text-neutral-900 tracking-tight">
            Inserat erfolgreich erstellt!
          </h1>
          <p className="text-neutral-600 leading-relaxed font-light">
            Vielen Dank für Ihr Vertrauen in BuyAuto. Ihr Inserat wird nun von unserem Team überprüft 
            und anschließend veröffentlicht.
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="rounded-lg border border-neutral-200/40 shadow-sm bg-white">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto bg-red-50 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2 tracking-tight">Überprüfung läuft</h3>
              <p className="text-sm text-neutral-600 font-light">
                Unser Team überprüft Ihr Inserat innerhalb von 2-4 Stunden
              </p>
              <Badge variant="secondary" className="mt-3 bg-red-50 text-red-600 border-red-200/40">
                In Bearbeitung
              </Badge>
            </CardContent>
          </Card>

          <Card className="rounded-lg border border-neutral-200/40 shadow-sm bg-white">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto bg-green-50 rounded-lg flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2 tracking-tight">Benachrichtigung</h3>
              <p className="text-sm text-neutral-600 font-light">
                Sie erhalten eine E-Mail sobald Ihr Inserat live geschaltet wird
              </p>
              <Badge variant="secondary" className="mt-3 bg-green-50 text-green-600 border-green-200/40">
                Automatisch
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Next Steps */}
        <Card className="rounded-lg border border-neutral-200/40 shadow-sm bg-gradient-to-br from-neutral-50/30 to-white">
          <CardContent className="p-8">
            <h2 className="text-xl font-semibold text-neutral-900 mb-6 tracking-tight">Was passiert als Nächstes?</h2>
            
            <div className="space-y-4 text-left">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border border-red-200/40">
                  <span className="text-sm font-bold text-red-600">1</span>
                </div>
                <div>
                  <h3 className="font-medium text-neutral-900 tracking-tight">Qualitätsprüfung</h3>
                  <p className="text-sm text-neutral-600 font-light">
                    Wir überprüfen alle Angaben und Bilder auf Vollständigkeit und Richtigkeit
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border border-red-200/40">
                  <span className="text-sm font-bold text-red-600">2</span>
                </div>
                <div>
                  <h3 className="font-medium text-neutral-900 tracking-tight">Freischaltung</h3>
                  <p className="text-sm text-neutral-600 font-light">
                    Nach erfolgreicher Prüfung wird Ihr Inserat automatisch veröffentlicht
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border border-red-200/40">
                  <span className="text-sm font-bold text-red-600">3</span>
                </div>
                <div>
                  <h3 className="font-medium text-neutral-900 tracking-tight">Interessenten erreichen</h3>
                  <p className="text-sm text-neutral-600 font-light">
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
            className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
          >
            <Home className="w-5 h-5 mr-2" />
            Zur Startseite
          </Button>

          <Button
            onClick={() => router.push('/suche')}
            variant="outline"
            className="px-8 py-4 bg-transparent hover:bg-neutral-50 border-neutral-200/40 text-neutral-600 rounded-lg transition-all duration-200"
          >
            <Search className="w-5 h-5 mr-2" />
            Andere Angebote ansehen
          </Button>
        </div>

        {/* Additional Info */}
        <div className="pt-8 border-t border-neutral-200/60">
          <p className="text-sm text-neutral-500 font-light">
            Haben Sie Fragen? Kontaktieren Sie unser Support-Team unter{" "}
            <Link href="mailto:support@buyauto.ch" className="text-red-500 hover:text-red-600 transition-colors font-medium">
              support@buyauto.ch
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
