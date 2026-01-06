import Image from "next/image";

export function FounderStory() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text Content */}
          <div className="space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900">
              Über uns
            </h2>
            
            <div className="space-y-4 text-neutral-600 leading-relaxed">
              <p>
                BuyAuto ist entstanden, weil ich selbst vor einem simplen, aber frustrierenden Problem stand:
                Ich wollte mein Leasing in der Schweiz abgeben – doch die bestehenden Plattformen waren entweder veraltet, unnötig kompliziert oder hatten schlicht zu wenig Reichweite.
              </p>
              
              <p>
                Statt mich durch schlechte Nutzerführung, endlose Formulare und wenig Sichtbarkeit zu kämpfen, habe ich mich entschieden, die Lösung selbst zu bauen.
                BuyAuto ist eine Plattform, die ausschliesslich für Leasingübernahmen entwickelt wurde – klar strukturiert, benutzerfreundlich und auf maximale Sichtbarkeit ausgelegt.
              </p>
              
              <p>
                BuyAuto richtet sich an Menschen, die ihr Leasingfahrzeug unkompliziert weitergeben möchten, sowie an Interessenten, die eine bestehende Leasingübernahme suchen – ohne Umwege, ohne versteckte Hürden.
              </p>
              
              <p>
                Die Plattform wurde von VincialMedia, meiner eigenen Digitalagentur, entwickelt. BuyAuto basiert nicht auf Theorie, sondern auf echter eigener Erfahrung.
              </p>
              
              <div className="pt-4 border-t border-neutral-200 mt-6">
                <p className="font-semibold text-neutral-900">
                  Kurz gesagt:
                </p>
                <p>
                  BuyAuto wurde von jemandem gebaut, der selbst genau dieses Problem hatte.
                  Und genau deshalb ist es besser gelöst.
                </p>
              </div>
              
              <div className="pt-6">
                <p className="text-neutral-900 font-bold text-lg">
                  Vincent Hänggi
                </p>
                <p className="text-neutral-500 text-sm">
                  Gründer von BuyAuto
                </p>
              </div>
            </div>
          </div>

          {/* Founder Image */}
          <div className="relative">
            <div className="relative aspect-[3/4] lg:aspect-square rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src="/Vince.jpeg"
                alt="Vincent Hänggi, Gründer von BuyAuto"
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>
            {/* Decorative gradient backdrop */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-3xl -z-10 translate-x-4 translate-y-4" />
          </div>
        </div>
      </div>
    </section>
  );
}