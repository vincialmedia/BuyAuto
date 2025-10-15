import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function CtaBannerSection() {
  return (
    <section className="py-16 md:py-20 bg-gradient-to-r from-red-600 to-red-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-6">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
            Bereit, dein Leasing zu transferieren?
          </h2>
          <p className="text-lg md:text-xl text-red-50 max-w-3xl mx-auto">
            Erstelle dein Inserat in 3 Minuten – schnell, sicher und stressfrei.
          </p>
          <div className="pt-4">
            <Button
              asChild
              size="lg"
              className="bg-white text-red-600 hover:bg-neutral-50 h-14 px-8 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
            >
              <Link href="/inserat-erstellen" className="inline-flex items-center gap-2">
                Inserat erstellen
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}