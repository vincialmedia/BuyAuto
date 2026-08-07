import { Button } from 'buyauto';
import { ArrowRight, Loader2, Search, Trash2 } from 'lucide-react';

// The six variants are the primary appearance axis. Labels are real BuyAuto
// copy (German, as the product ships) rather than "Primary"/"Secondary" —
// these cards are read by humans and imitated by the design agent.
export function Variants() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Inserat erstellen</Button>
      <Button variant="secondary">Merken</Button>
      <Button variant="outline">Filter</Button>
      <Button variant="ghost">Abbrechen</Button>
      <Button variant="destructive">Inserat löschen</Button>
      <Button variant="link">Mehr erfahren</Button>
    </div>
  );
}

export function Sizes() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm">Klein</Button>
      <Button size="default">Standard</Button>
      <Button size="lg">Gross</Button>
      <Button size="icon" aria-label="Suchen">
        <Search />
      </Button>
    </div>
  );
}

// Buttons carry a `[&_svg]:size-4` rule, so an icon child is sized by the
// button itself — no per-icon class needed.
export function WithIcons() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button>
        Jetzt suchen
        <ArrowRight />
      </Button>
      <Button variant="outline">
        <Search />
        Fahrzeuge suchen
      </Button>
      <Button variant="destructive">
        <Trash2 />
        Löschen
      </Button>
    </div>
  );
}

export function Disabled() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button disabled>Inserat erstellen</Button>
      <Button variant="secondary" disabled>
        Merken
      </Button>
      <Button variant="outline" disabled>
        Filter
      </Button>
      {/* The repo's own loading idiom: a spinning Loader2 beside the label.
          animate-spin is frozen in a screenshot, which is fine — the point of
          the cell is the disabled-with-spinner treatment. */}
      <Button disabled>
        <Loader2 className="animate-spin" />
        Wird geladen
      </Button>
    </div>
  );
}
