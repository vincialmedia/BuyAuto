import { SearchQuery } from "@/lib/buyauto/search";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface FilterChipsProps {
  searchQuery: SearchQuery;
  onSearchQueryChange: (query: SearchQuery) => void;
}

export default function FilterChips({ searchQuery, onSearchQueryChange }: FilterChipsProps) {
  const hasActiveFilters = Object.keys(searchQuery).some(key => {
    const value = searchQuery[key as keyof SearchQuery];
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null && key !== 'page' && key !== 'sort';
  });

  if (!hasActiveFilters) return null;

  const removeFilter = (key: keyof SearchQuery, value?: string) => {
    const newQuery = { ...searchQuery };
    
    if (value && Array.isArray(newQuery[key])) {
      // Remove specific value from array
      const arrayValue = newQuery[key] as string[];
      const updatedArray = arrayValue.filter(v => v !== value);
      
      // Handle different array field types properly
      if (key === 'body') {
        newQuery[key] = updatedArray.length > 0 ? updatedArray as ("Limousine" | "Kombi" | "SUV" | "Cabrio")[] : undefined;
      } else if (key === 'fuel') {
        newQuery[key] = updatedArray.length > 0 ? updatedArray as ("Benzin" | "Diesel" | "Hybrid" | "Elektro")[] : undefined;
      } else if (key === 'gearbox') {
        newQuery[key] = updatedArray.length > 0 ? updatedArray as ("Automatik" | "Manuell")[] : undefined;
      } else if (key === 'canton') {
        newQuery[key] = updatedArray.length > 0 ? updatedArray : undefined;
      }
    } else {
      // Remove entire filter
      delete newQuery[key];
    }
    
    // Reset to page 1
    newQuery.page = 1;
    
    onSearchQueryChange(newQuery);
  };

  const clearAllFilters = () => {
    onSearchQueryChange({ sort: searchQuery.sort }); // Keep sort, clear everything else
  };

  const getChips = () => {
    const chips: Array<{ label: string; key: keyof SearchQuery; value?: string }> = [];
    
    if (searchQuery.brand) {
      chips.push({ label: searchQuery.brand, key: 'brand' });
    }
    
    if (searchQuery.model) {
      chips.push({ label: searchQuery.model, key: 'model' });
    }
    
    if (searchQuery.yearMin) {
      chips.push({ label: `ab ${searchQuery.yearMin}`, key: 'yearMin' });
    }
    
    if (searchQuery.priceMin) {
      chips.push({ label: `ab CHF ${searchQuery.priceMin.toLocaleString('de-CH')}`, key: 'priceMin' });
    }
    
    if (searchQuery.priceMax) {
      chips.push({ label: `bis CHF ${searchQuery.priceMax.toLocaleString('de-CH')}`, key: 'priceMax' });
    }
    
    if (searchQuery.monthsMin) {
      chips.push({ label: `ab ${searchQuery.monthsMin} Mon.`, key: 'monthsMin' });
    }
    
    if (searchQuery.monthsMax) {
      chips.push({ label: `bis ${searchQuery.monthsMax} Mon.`, key: 'monthsMax' });
    }
    
    if (searchQuery.kmMax) {
      chips.push({ label: `≤ ${searchQuery.kmMax.toLocaleString('de-CH')} km`, key: 'kmMax' });
    }
    
    // Array filters
    searchQuery.body?.forEach(body => {
      chips.push({ label: body, key: 'body', value: body });
    });
    
    searchQuery.fuel?.forEach(fuel => {
      chips.push({ label: fuel, key: 'fuel', value: fuel });
    });
    
    searchQuery.gearbox?.forEach(gearbox => {
      chips.push({ label: gearbox, key: 'gearbox', value: gearbox });
    });
    
    searchQuery.canton?.forEach(canton => {
      chips.push({ label: canton, key: 'canton', value: canton });
    });
    
    // Boolean filters
    if (searchQuery.noDeposit) {
      chips.push({ label: 'Keine Kaution', key: 'noDeposit' });
    }
    
    if (searchQuery.premiumOnly) {
      chips.push({ label: 'Nur Premium', key: 'premiumOnly' });
    }
    
    return chips;
  };

  const chips = getChips();
  
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-neutral-600 font-medium">Aktive Filter:</span>
      
      {chips.map((chip, index) => (
        <Badge
          key={`${chip.key}-${chip.value || 'single'}-${index}`}
          variant="secondary"
          className="bg-red-50 text-red-800 border border-red-200 hover:bg-red-100 transition-colors pl-3 pr-1 py-1"
        >
          <span className="mr-1">{chip.label}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeFilter(chip.key, chip.value)}
            className="h-4 w-4 p-0 hover:bg-red-200 rounded-full ml-1"
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
      
      <Button
        variant="ghost"
        size="sm"
        onClick={clearAllFilters}
        className="text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 text-xs px-2 py-1 h-7"
      >
        Alle zurücksetzen
      </Button>
    </div>
  );
}