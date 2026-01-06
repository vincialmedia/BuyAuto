import Image from "next/image";

export function FounderStory() {
  return (
    <section className="py-16 bg-neutral-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1fr,300px] gap-8 lg:gap-12 items-center">
          {/* Text Content */}
          <div className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
              Über uns
            </h2>
            
            <div className="space-y-3 text-neutral-600 leading-relaxed text-sm sm:text-base">
              <p>
                BuyAuto ist entstanden, weil ich selbst vor einem simplen, aber frustrierenden Problem stand:
                Ich wollte mein Leasing in der Schweiz abgeben – doch die bestehenden Plattformen waren entweder veraltet, unnötig kompliziert oder hatten schlicht zu wenig Reichweite.
              </p>
              
              <p>
                Statt mich durch schlechte Nutzerführung, endlose Formulare und wenig Sichtbarkeit zu kämpfen, habe ich mich entschieden, die Lösung selbst zu bauen.
                BuyAuto ist eine Plattform, die ausschliesslich für Leasingübernahmen entwickelt wurde – klar strukturiert, benutzerfreundlich und auf maximale Sichtbarkeit ausgelegt.
              </p>
              
              <p>
                Die Plattform wurde von VincialMedia, meiner eigenen Digitalagentur, entwickelt. BuyAuto basiert nicht auf Theorie, sondern auf echter eigener Erfahrung.
              </p>
              
              <div className="pt-3 border-t border-neutral-200 mt-4">
                <p className="font-semibold text-neutral-900 text-sm">
                  Kurz gesagt:
                </p>
                <p className="text-sm">
                  BuyAuto wurde von jemandem gebaut, der selbst genau dieses Problem hatte.
                  Und genau deshalb ist es besser gelöst.
                </p>
              </div>
              
              <div className="pt-4">
                <p className="text-neutral-900 font-bold">
                  Vincent Hänggi
                </p>
                <p className="text-neutral-500 text-xs">
                  Gründer von BuyAuto
                </p>
              </div>
            </div>
          </div>

          {/* Founder Image */}
          <div className="relative lg:order-last">
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl">
              <Image
                src="/Vince.jpeg"
                alt="Vincent Hänggi, Gründer von BuyAuto"
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 300px"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}