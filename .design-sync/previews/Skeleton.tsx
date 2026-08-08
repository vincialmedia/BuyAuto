import { Skeleton } from 'buyauto';

// Skeleton is a pulsing grey block — visible only when given a size.
export function Shapes() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-10 w-32" />
      <Skeleton className="size-12 rounded-full" />
    </div>
  );
}

// The listing-card loading state the search results use.
export function ListingCard() {
  return (
    <div className="w-full max-w-xs overflow-hidden rounded-lg border">
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="flex flex-col gap-2 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="mt-2 flex justify-between">
          <Skeleton className="h-6 w-24" /><Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  );
}
