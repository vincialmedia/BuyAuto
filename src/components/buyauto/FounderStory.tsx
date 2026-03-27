import Image from "next/image";

export function FounderStory() {
  return (
    <section className="py-20 sm:py-28 bg-white relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-red-500/5 to-orange-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-full blur-3xl" />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-[1fr,300px] gap-12 lg:gap-16 items-center">
          
          {/* Founder Image - Mobile: Top, centered, round / Desktop: Right, rectangular */}
          <div className="flex justify-center lg:block lg:order-last">
            <div className="relative group">
              {/* Glow effect on hover */}
              <div className="absolute -inset-4 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-full lg:rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative w-48 h-48 lg:w-full lg:h-auto lg:aspect-[4/5] rounded-full lg:rounded-3xl overflow-hidden border-4 border-neutral-100 lg:border-0 shadow-2xl group-hover:shadow-3xl transition-all duration-500 group-hover:scale-[1.02]">
                <Image
                  src="/Vince.jpeg"
                  alt="Vincent Hänggi, Gründer von BuyAuto"
                  fill
                  className="object-cover object-top group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 1024px) 192px, 300px"
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
              
              {/* Floating badge */}
              <div className="absolute -bottom-3 -right-3 lg:bottom-6 lg:-left-6 bg-white rounded-2xl shadow-xl px-4 py-2 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <p className="text-xs font-bold text-neutral-900">Gründer & CEO</p>
                <p className="text-xs text-red-500">seit 2024</p>
              </div>
            </div>
          </div>

          {/* Text Content */}
          <div className="space-y-6 text-center lg:text-left">
            <div>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-red-500/10 to-orange-500/10 text-red-600 text-xs font-bold uppercase tracking-wider mb-4 hover:scale-105 transition-transform cursor-default">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Die Geschichte
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-900">
                Über <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">BuyAuto</span>
              </h2>
            </div>
            
            <div className="space-y-5 text-neutral-600 leading-relaxed text-base">
              <p className="group">
                <span className="group-hover:text-neutral-900 transition-colors duration-300">BuyAuto ist entstanden, weil ich selbst vor einem simplen, aber frustrierenden Problem stand:</span>{" "}
                Ich wollte mein Leasing in der Schweiz abgeben – doch die bestehenden Plattformen waren entweder veraltet, unnötig kompliziert oder hatten schlicht zu wenig Reichweite.
              </p>
              
              <p>
                Statt mich durch schlechte Nutzerführung, endlose Formulare und wenig Sichtbarkeit zu kämpfen, habe ich mich entschieden, <span className="font-semibold text-neutral-900">die Lösung selbst zu bauen.</span>{" "}
                BuyAuto ist eine Plattform, die ausschliesslich für Leasingübernahmen entwickelt wurde – klar strukturiert, benutzerfreundlich und auf maximale Sichtbarkeit ausgelegt.
              </p>
              
              <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-2xl p-5 border border-neutral-200 hover:border-red-200 hover:shadow-lg hover:shadow-red-500/5 transition-all duration-300 group">
                <p className="font-bold text-neutral-900 text-base mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-gradient-to-b from-red-500 to-orange-500 rounded-full" />
                  Kurz gesagt:
                </p>
                <p className="text-neutral-600 group-hover:text-neutral-700 transition-colors">
                  BuyAuto wurde von jemandem gebaut, der selbst genau dieses Problem hatte.
                  <span className="font-semibold text-neutral-900"> Und genau deshalb ist es besser gelöst.</span>
                </p>
              </div>
            </div>
            
            <div className="pt-4 flex items-center gap-4 justify-center lg:justify-start">
              <div className="w-12 h-0.5 bg-gradient-to-r from-red-500 to-orange-500 rounded-full" />
              <div>
                <p className="text-neutral-900 font-black text-lg">
                  Vincent Hänggi
                </p>
                <p className="text-neutral-500 text-sm font-medium">
                  Gründer von BuyAuto
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}