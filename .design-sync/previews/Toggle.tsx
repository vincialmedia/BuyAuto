import { Toggle } from 'buyauto';
import { Bold, Heart, Italic, Underline } from 'lucide-react';

// A Toggle with no children is a bare 36px square — hence the blank card.
// `pressed` is set explicitly so both states are visible in a screenshot;
// leaving it uncontrolled would render every cell in the off state.
export function States() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Toggle aria-label="Fett">
        <Bold />
      </Toggle>
      <Toggle pressed aria-label="Kursiv">
        <Italic />
      </Toggle>
      <Toggle disabled aria-label="Unterstrichen">
        <Underline />
      </Toggle>
    </div>
  );
}

export function Variants() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Toggle variant="default" aria-label="Merken">
        <Heart />
      </Toggle>
      <Toggle variant="outline" aria-label="Merken">
        <Heart />
      </Toggle>
      <Toggle variant="outline" pressed aria-label="Gemerkt">
        <Heart />
      </Toggle>
    </div>
  );
}

export function WithText() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Toggle variant="outline" size="sm">
        Nur Garagen
      </Toggle>
      <Toggle variant="outline" pressed>
        Nur Premium
      </Toggle>
      <Toggle variant="outline" size="lg">
        Mit Bildern
      </Toggle>
    </div>
  );
}
