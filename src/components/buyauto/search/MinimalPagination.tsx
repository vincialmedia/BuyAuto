import { ChevronLeft, ChevronRight } from "lucide-react";

interface MinimalPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function MinimalPagination({
  currentPage,
  totalPages,
  onPageChange
}: MinimalPaginationProps) {
  const getVisiblePages = () => {
    const pages: (number | string)[] = [];
    const delta = 1;
    
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    
    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <nav className="flex items-center justify-center gap-1 sm:gap-2" aria-label="Pagination">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`flex items-center justify-center h-9 sm:h-10 px-3 sm:px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
          currentPage === 1
            ? 'text-neutral-400 cursor-not-allowed bg-neutral-100'
            : 'text-neutral-700 hover:text-red-600 hover:bg-red-50 bg-white border border-neutral-200 hover:border-red-200 active:scale-95'
        }`}
        aria-label="Vorherige Seite"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline ml-1">Zurück</span>
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {visiblePages.map((page, index) => {
          if (page === '...') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="flex items-center justify-center h-9 sm:h-10 px-2 sm:px-3 text-neutral-400 text-sm"
              >
                ...
              </span>
            );
          }

          const isCurrentPage = page === currentPage;
          return (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={`flex items-center justify-center h-9 sm:h-10 min-w-[36px] sm:min-w-[40px] px-2 sm:px-3 rounded-lg text-sm font-semibold transition-all duration-200 active:scale-95 ${
                isCurrentPage
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/20 hover:bg-red-700'
                  : 'text-neutral-700 hover:text-red-600 hover:bg-red-50 bg-white border border-neutral-200 hover:border-red-200'
              }`}
              aria-label={`Seite ${page}`}
              aria-current={isCurrentPage ? 'page' : undefined}
            >
              {page}
            </button>
          );
        })}
      </div>

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`flex items-center justify-center h-9 sm:h-10 px-3 sm:px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
          currentPage === totalPages
            ? 'text-neutral-400 cursor-not-allowed bg-neutral-100'
            : 'text-neutral-700 hover:text-red-600 hover:bg-red-50 bg-white border border-neutral-200 hover:border-red-200 active:scale-95'
        }`}
        aria-label="Nächste Seite"
      >
        <span className="hidden sm:inline mr-1">Weiter</span>
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
