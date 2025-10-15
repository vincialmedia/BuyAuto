import { Star } from "lucide-react";

const testimonials = [
  {
    quote: "Übernahme in wenigen Tagen – super unkompliziert.",
    author: "Martin",
    location: "Zürich",
    rating: 5,
  },
  {
    quote: "Schnelle Abwicklung und faire Konditionen. Sehr empfehlenswert!",
    author: "Sarah",
    location: "Bern",
    rating: 5,
  },
  {
    quote: "Die Plattform ist benutzerfreundlich und der Support hilfsbereit.",
    author: "Thomas",
    location: "Basel",
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-16 md:py-24 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
            Was unsere Nutzer sagen
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Echte Erfahrungen von zufriedenen Kunden
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 md:p-8 shadow-lg shadow-neutral-900/5 border border-neutral-200/50 hover:shadow-xl hover:shadow-neutral-900/10 transition-all duration-300"
            >
              {/* Rating Stars */}
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 fill-yellow-400 text-yellow-400"
                    aria-hidden="true"
                  />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-neutral-700 text-base leading-relaxed mb-6">
                "{testimonial.quote}"
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-neutral-200">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-semibold text-sm">
                  {testimonial.author.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">
                    {testimonial.author}
                  </p>
                  <p className="text-sm text-neutral-600">
                    {testimonial.location}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}