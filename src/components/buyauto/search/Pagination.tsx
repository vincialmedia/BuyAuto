import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, 'dots1');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('dots2', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const visiblePages = getVisiblePages();

  return (
    <nav className="flex items-center justify-center space-x-1" role="navigation" aria-label="Pagination">
      {/* Previous button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="bg-white hover:bg-neutral-50 border-neutral-300 text-neutral-700 disabled:opacity-50"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Zurück
      </Button>

      {/* Page numbers */}
      <div className="flex space-x-1">
        {visiblePages.map((page, index) => {
          if (typeof page === 'string') {
            return (
              <div key={page} className="flex items-center px-2">
                <MoreHorizontal className="h-4 w-4 text-neutral-400" />
              </div>
            );
          }

          const isActive = page === currentPage;

          return (
            <Button
              key={page}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
              className={cn(
                "min-w-[40px] h-9",
                isActive
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-white hover:bg-neutral-50 border-neutral-300 text-neutral-700"
              )}
            >
              {page}
            </Button>
          );
        })}
      </div>

      {/* Next button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="bg-white hover:bg-neutral-50 border-neutral-300 text-neutral-700 disabled:opacity-50"
      >
        Weiter
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </nav>
  );
}