import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

type LocationSuggestion = {
  label: string;
  value: string;
};

type SuggestResponse = {
  items: LocationSuggestion[];
};

export interface LocationAutocompleteProps {
  value: string;
  onValueChange: (next: string) => void;
  disabled?: boolean;
  placeholder?: string;
  inputClassName?: string;
  name?: string;
  inputRef?: (instance: HTMLInputElement | null) => void;
  onBlur?: () => void;
}

export function LocationAutocomplete(props: LocationAutocompleteProps) {
  const {
    value,
    onValueChange,
    disabled = false,
    placeholder,
    inputClassName,
    name,
    inputRef,
    onBlur,
  } = props;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value ?? "");
  const [items, setItems] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const requestIdRef = useRef(0);
  const blurCloseTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setQuery(value ?? "");
  }, [value]);

  useEffect(() => {
    if (disabled) {
      setItems([]);
      setLoading(false);
      return;
    }

    const q = query.trim();
    if (q.length < 2) {
      setItems([]);
      setLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);

    const t = window.setTimeout(async () => {
      try {
        const resp = await fetch(`/api/locations/suggest?q=${encodeURIComponent(q)}`, { method: "GET" });
        if (!resp.ok) throw new Error("Request failed");

        const json = (await resp.json()) as SuggestResponse;
        const next = Array.isArray(json?.items) ? json.items : [];

        if (requestId !== requestIdRef.current) return;
        setItems(next);
      } catch {
        if (requestId !== requestIdRef.current) return;
        setItems([]);
      } finally {
        if (requestId !== requestIdRef.current) return;
        setLoading(false);
      }
    }, 220);

    return () => {
      window.clearTimeout(t);
    };
  }, [disabled, query]);

  const closeSoon = () => {
    if (blurCloseTimeoutRef.current) window.clearTimeout(blurCloseTimeoutRef.current);
    blurCloseTimeoutRef.current = window.setTimeout(() => setOpen(false), 140);
  };

  const showDropdown = open && !disabled && (loading || items.length > 0 || query.trim().length >= 2);

  return (
    <div className="relative">
      <Input
        name={name}
        ref={inputRef}
        value={query}
        onChange={(e) => {
          const next = e.target.value;
          setQuery(next);
          onValueChange(next);
          if (!open) setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          closeSoon();
          onBlur?.();
        }}
        placeholder={placeholder}
        disabled={disabled}
        className={inputClassName}
        autoComplete="off"
        inputMode="text"
        aria-autocomplete="list"
        aria-expanded={showDropdown}
      />

      {showDropdown ? (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl">
          <div className="max-h-64 overflow-auto py-1">
            {loading ? <div className="px-3 py-2 text-sm text-neutral-500">Lade Vorschläge...</div> : null}

            {!loading && items.length === 0 ? (
              <div className="px-3 py-2 text-sm text-neutral-500">Keine Vorschläge gefunden.</div>
            ) : null}

            {items.map((item) => (
              <button
                key={item.value}
                type="button"
                className="w-full px-3 py-2 text-left text-sm text-neutral-900 hover:bg-neutral-50 focus:bg-neutral-50 focus:outline-none"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setQuery(item.value);
                  onValueChange(item.value);
                  setOpen(false);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}