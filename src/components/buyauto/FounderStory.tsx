import Image from "next/image";

export function FounderStory() {
  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1fr,280px] gap-10 lg:gap-14 items-center">
          
          {/* Founder Image - Mobile: Top, centered, round / Desktop: Right, rectangular */}
          <div className="flex justify-center lg:block lg:order-last">
            <div className="relative w-44 h-44 lg:w-full lg:h-auto lg:aspect-[4/5] rounded-full lg:rounded-2xl overflow-hidden border-4 border-neutral-100 lg:border-0 shadow-xl lg:shadow-2xl">
              <Image
                src="/Vince.jpeg"
                alt="Vincent Hänggi, Gründer von BuyAuto"
                fill
                className="object-cover object-top"
                sizes="(max-width: 1024px) 176px, 280px"
              />
            </div>
          </div>

          {/* Text Content */}
          <div className="space-y-5 text-center lg:text-left">
            <div>
              <p className="text-sm font-bold tracking-widest uppercase text-red-500 mb-2">Die Geschichte</p>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900">
                Über BuyAuto
              </h2>
            </div>
            
            <div className="space-y-4 text-neutral-600 leading-relaxed text-sm sm:text-base">
              <p>
                BuyAuto ist entstanden, weil ich selbst vor einem simplen, aber frustrierenden Problem stand:
                Ich wollte mein Leasing in der Schweiz abgeben – doch die bestehenden Plattformen waren entweder veraltet, unnötig kompliziert oder hatten schlicht zu wenig Reichweite.
              </p>
              
              <p>
                Statt mich durch schlechte Nutzerführung, endlose Formulare und wenig Sichtbarkeit zu kämpfen, habe ich mich entschieden, die Lösung selbst zu bauen.
                BuyAuto ist eine Plattform, die ausschliesslich für Leasingübernahmen entwickelt wurde – klar strukturiert, benutzerfreundlich und auf maximale Sichtbarkeit ausgelegt.
              </p>
              
              <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100">
                <p className="font-semibold text-neutral-900 text-sm mb-1">
                  Kurz gesagt:
                </p>
                <p className="text-sm text-neutral-600">
                  BuyAuto wurde von jemandem gebaut, der selbst genau dieses Problem hatte.
                  Und genau deshalb ist es besser gelöst.
                </p>
              </div>
            </div>
            
            <div className="pt-2">
              <p className="text-neutral-900 font-bold">
                Vincent Hänggi
              </p>
              <p className="text-neutral-500 text-sm">
                Gründer von BuyAuto
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}