import Image from "next/image";

export function FounderStory() {
  return (
    <section className="py-16 sm:py-20 bg-white relative overflow-hidden">
      {/* Subtle background decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-neutral-200/50 rounded-full blur-3xl" />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-[1fr,280px] gap-10 lg:gap-14 items-start">
          
          {/* Founder Image */}
          <div className="flex justify-center lg:block lg:order-last">
            <div className="relative group lg:sticky lg:top-8">
              {/* Glow effect on hover */}
              <div className="absolute -inset-4 bg-red-500/10 rounded-full lg:rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative w-40 h-40 lg:w-full lg:h-auto lg:aspect-[4/5] rounded-full lg:rounded-3xl overflow-hidden border-4 border-neutral-100 lg:border-0 shadow-xl group-hover:shadow-2xl transition-all duration-500 group-hover:scale-[1.02]">
                <Image
                  src="/Vince.jpeg"
                  alt="Vincent Hänggi, Gründer von BuyAuto"
                  fill
                  className="object-cover object-top group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 1024px) 160px, 280px"
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
              
              {/* Floating badge */}
              <div className="absolute -bottom-2 -right-2 lg:bottom-6 lg:-left-4 bg-white rounded-xl shadow-lg px-3 py-1.5 transform group-hover:scale-110 group-hover:rotate-2 transition-all duration-300">
                <p className="text-xs font-bold text-neutral-900">Gründer & CEO</p>
                <p className="text-xs text-red-500">seit 2024</p>
              </div>
            </div>
          </div>

          {/* Text Content */}
          <div className="space-y-5 text-center lg:text-left">
            <div>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 text-red-600 text-xs font-bold uppercase tracking-wider mb-3 hover:scale-105 transition-transform cursor-default">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Die Geschichte
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-900">
                Über <span className="text-red-500">BuyAuto</span>
              </h2>
            </div>
            
            <div className="space-y-4 text-neutral-600 leading-relaxed text-base">
              <p>
                BuyAuto ist entstanden, weil ich gemerkt habe, wie unnötig kompliziert es sein kann, <span className="font-semibold text-neutral-900">ein Auto in der Schweiz zu kaufen oder anzubieten</span>.
              </p>
              
              <p>
                Wer heute nach dem passenden Auto sucht, landet oft auf mehreren Plattformen gleichzeitig: eine für <span className="font-semibold text-neutral-900">Occasionen</span>, eine für <span className="font-semibold text-neutral-900">Neuwagen</span>, eine für <span className="font-semibold text-neutral-900">Leasing</span>, eine für <span className="font-semibold text-neutral-900">Leasingübernahmen</span> und vielleicht noch eine weitere für <span className="font-semibold text-neutral-900">Auto-Abos</span>. Dazu kommen oft hohe Kosten, veraltete Nutzerführung und zu wenig Übersicht.
              </p>

              <p className="font-semibold text-neutral-900">
                Genau das wollte ich besser lösen.
              </p>

              <p>
                BuyAuto ist deshalb nicht einfach nur eine weitere Auto-Plattform. BuyAuto bringt die wichtigsten Wege zum Auto an einem Ort zusammen – klarer, moderner und fairer für Käufer, Verkäufer und Garagen in der Schweiz.
              </p>

              <p>
                Egal ob <span className="font-semibold text-neutral-900">Kauf, Leasing, Auto-Abo oder Leasingübernahme</span>: BuyAuto soll den Prozess einfacher machen und die Plattform sein, auf der man nicht fünfmal neu anfangen muss.
              </p>
              
              <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-200 hover:border-red-200 hover:shadow-lg hover:shadow-red-500/5 transition-all duration-300 group">
                <p className="font-bold text-neutral-900 text-base mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-red-500 rounded-full" />
                  Kurz gesagt:
                </p>
                <div className="space-y-1 text-neutral-700 group-hover:text-neutral-800 transition-colors">
                  <p>Eine Plattform statt fünf.</p>
                  <p>Mehr Übersicht statt Umwege.</p>
                  <p>Mehr Möglichkeiten statt altem Marktplatzdenken.</p>
                </div>
              </div>
            </div>
            
            <div className="pt-3 flex items-center gap-4 justify-center lg:justify-start">
              <div className="w-10 h-0.5 bg-red-500 rounded-full" />
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