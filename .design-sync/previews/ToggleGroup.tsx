import { ToggleGroup, ToggleGroupItem } from 'buyauto';
import { AlignCenter, AlignLeft, AlignRight, Grid3x3, List } from 'lucide-react';

// `value` (controlled) rather than uncontrolled, so the selected item is
// visible in a screenshot.
export function SingleSelect() {
  return (
    <ToggleGroup type="single" value="grid" variant="outline">
      <ToggleGroupItem value="grid" aria-label="Raster"><Grid3x3 /></ToggleGroupItem>
      <ToggleGroupItem value="list" aria-label="Liste"><List /></ToggleGroupItem>
    </ToggleGroup>
  );
}

export function MultiSelect() {
  return (
    <ToggleGroup type="multiple" value={['left', 'center']}>
      <ToggleGroupItem value="left" aria-label="Links"><AlignLeft /></ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Zentriert"><AlignCenter /></ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Rechts"><AlignRight /></ToggleGroupItem>
    </ToggleGroup>
  );
}

export function WithText() {
  return (
    <ToggleGroup type="single" value="alle" variant="outline">
      <ToggleGroupItem value="alle">Alle</ToggleGroupItem>
      <ToggleGroupItem value="uebernahme">Übernahme</ToggleGroupItem>
      <ToggleGroupItem value="kauf">Direktkauf</ToggleGroupItem>
    </ToggleGroup>
  );
}
