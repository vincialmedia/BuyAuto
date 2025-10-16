
import { Skeleton } from "@/components/ui/skeleton";

export function ListingCardSkeleton() {
  return (
    <div className="bg-white border border-neutral-200/60 rounded-2xl overflow-hidden shadow-sm">
      {/* Image Skeleton */}
      <Skeleton className="w-full aspect-[16/10]" />

      {/* Content Section */}
      <div className="p-5">
        {/* Title Skeleton */}
        <Skeleton className="h-6 w-3/4 mb-3" />

        {/* Year Pill Skeleton */}
        <Skeleton className="h-6 w-16 rounded-full mb-4" />

        {/* Specs Grid Skeleton */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>

        {/* Leasing Term Skeleton */}
        <Skeleton className="h-9 w-full rounded-xl mb-4" />

        {/* Divider */}
        <div className="h-px bg-neutral-200 mb-4" />

        {/* Price & CTA Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-10 w-24 rounded-md" />
        </div>
      </div>
    </div>
  );
}
