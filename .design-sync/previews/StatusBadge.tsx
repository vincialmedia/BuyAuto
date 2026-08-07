import { StatusBadge } from 'buyauto';

// StatusBadge is the listing lifecycle made visible — it appears in the
// dashboard listing table and on every listing row. `status` is the whole
// appearance axis, so the first cell sweeps all ten values from its prop
// union rather than picking a representative few.
export function AllStatuses() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <StatusBadge status="draft" />
      <StatusBadge status="pending" />
      <StatusBadge status="active" />
      <StatusBadge status="published" />
      <StatusBadge status="paused" />
      <StatusBadge status="inactive" />
      <StatusBadge status="sold" />
      <StatusBadge status="rejected" />
      <StatusBadge status="expired" />
      <StatusBadge status="archived" />
    </div>
  );
}

// The one piece of behaviour that isn't a straight status→colour mapping:
// a `published` listing whose expiry has passed renders as "Abgelaufen".
// Both dates are fixed literals so the card is deterministic — a relative
// date would re-render differently on every capture and churn its hash.
export function ExpiryOverride() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <StatusBadge status="published" expiresAt="2099-01-01T00:00:00.000Z" />
        <span className="text-xs text-muted-foreground">
          published, expiry in the future — stays &ldquo;Veröffentlicht&rdquo;
        </span>
      </div>
      <div className="flex items-center gap-3">
        <StatusBadge status="published" expiresAt="2020-01-01T00:00:00.000Z" />
        <span className="text-xs text-muted-foreground">
          published, expiry passed — flips to &ldquo;Abgelaufen&rdquo;
        </span>
      </div>
    </div>
  );
}

// In situ: how the badge actually reads next to a listing title in the
// dashboard's listing rows.
export function InListingRow() {
  return (
    <div className="w-full max-w-md divide-y rounded-lg border">
      {[
        { title: 'BMW 320d Touring', status: 'published' as const },
        { title: 'Audi Q5 40 TDI quattro', status: 'pending' as const },
        { title: 'VW Golf GTI', status: 'sold' as const },
        { title: 'Tesla Model 3 Long Range', status: 'draft' as const },
      ].map((row) => (
        <div key={row.title} className="flex items-center justify-between gap-4 px-4 py-3">
          <span className="text-sm font-medium">{row.title}</span>
          <StatusBadge status={row.status} />
        </div>
      ))}
    </div>
  );
}
