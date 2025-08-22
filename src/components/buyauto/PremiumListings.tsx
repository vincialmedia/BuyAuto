import ListingCard from "./ListingCard";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { getPremiumListings, mockListings } from "@/lib/buyauto/data";

export default function PremiumListings() {
  const premiumListings = getPremiumListings();
  const allListings = mockListings.slice(0, 6); // Show first 6 listings

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Premium Fahrzeuge
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Handverlesene Fahrzeuge mit besonders attraktiven Konditionen
          </p>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {allListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Button 
            size="lg" 
            variant="outline" 
            className="bg-transparent border-slate-300 text-slate-700 hover:bg-slate-50 px-8"
          >
            Alle Fahrzeuge anzeigen
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
}