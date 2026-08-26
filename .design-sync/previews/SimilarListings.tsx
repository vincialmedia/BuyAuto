import { SimilarListings } from 'buyauto';

// SimilarListings loads its own recommendations from Supabase and
// `return null`s when the result set is empty (see the `listings.length === 0`
// branch). During a capture there is no backend — the process-env shim points
// at an unresolvable .invalid host deliberately — so the fetch fails, the list
// stays empty, and the component renders literally nothing.
//
// There is therefore NO static rendering of this component that shows its real
// content, and inventing a populated lookalike would be a reimplementation
// rather than a preview. The card mounts the real component (below the note)
// and says plainly what it needs; the note is preview scaffolding, clearly
// marked as such.
const listing = {
  id: '11111111-1111-4111-8111-111111111111',
  brand: 'BMW',
  model: '320d Touring',
  year: 2022,
  deal_type: 'lease_takeover' as const,
  pricePerMonthCHF: 489,
  remainingMonths: 23,
  location: 'Zürich',
  mileageKm: 42000,
  fuel: 'Diesel' as const,
  gearbox: 'Automatik' as const,
  body: 'Kombi' as const,
  premium: true,
  images: [],
  imageUrl: '',
};

export function RequiresLiveData() {
  return (
    <div className="w-full max-w-2xl">
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Braucht Live-Daten</p>
        <p className="mt-1">
          <code className="text-xs">SimilarListings</code> lädt vergleichbare Fahrzeuge selbst aus
          Supabase und rendert <code className="text-xs">null</code>, solange keine Treffer
          vorliegen. Ohne Backend gibt es deshalb keine statische Darstellung mit Inhalt.
        </p>
        <p className="mt-2">
          Props: <code className="text-xs">listing</code> — das aktuell angezeigte Fahrzeug.
        </p>
      </div>
      {/* The real component, mounted with a realistic listing. */}
      <SimilarListings listing={listing as never} />
    </div>
  );
}
