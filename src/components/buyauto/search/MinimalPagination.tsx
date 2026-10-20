import Link from "next/link";
import { Fragment, type MouseEvent, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MinimalPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /**
   * The URL of a results page. When given, page numbers, «Zurück» and «Weiter» are
   * real <a href> links that crawlers can follow; a plain click still goes through
   * onPageChange (shallow routing), so the in-page behaviour stays the same.
   */
  hrefForPage?: (page: number) => string;
  className?: string;
}

const NAV_BASE =
  "flex items-center justify-center h-9 sm:h-10 px-2 sm:px-4 rounded-lg text-sm font-semibold transition-all duration-200";
const NAV_ENABLED =
  "text-neutral-700 hover:text-red-600 hover:bg-red-50 bg-white border border-neutral-200 hover:border-red-200 active:scale-95";
const NAV_DISABLED = "text-neutral-400 cursor-not-allowed bg-neutral-100";

const PAGE_BASE =
  "flex items-center justify-center h-9 sm:h-10 min-w-[32px] sm:min-w-[40px] px-1.5 sm:px-3 rounded-lg text-sm font-semibold transition-all duration-200 active:scale-95";
const PAGE_CURRENT = "bg-red-600 text-white shadow-md shadow-red-600/20 hover:bg-red-700";
const PAGE_OTHER =
  "text-neutral-700 hover:text-red-600 hover:bg-red-50 bg-white border border-neutral-200 hover:border-red-200";

/** Ctrl/Cmd/Shift/middle clicks open the href natively (new tab or window). */
function isModifiedClick(event: MouseEvent<HTMLAnchorElement>): boolean {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

export default function MinimalPagination({
  currentPage,
  totalPages,
  onPageChange,
  hrefForPage,
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

  /**
   * A page control: a <Link> when hrefForPage is set (plain clicks are handed to
   * onPageChange), otherwise the former <button>.
   */
  const pageControl = ({
    page,
    className,
    ariaLabel,
    ariaCurrent,
    children,
  }: {
    page: number;
    className: string;
    ariaLabel: string;
    ariaCurrent?: "page";
    children: ReactNode;
  }) => {
    if (hrefForPage) {
      return (
        <Link
          href={hrefForPage(page)}
          shallow
          scroll={false}
          onClick={(event) => {
            if (isModifiedClick(event)) return;
            event.preventDefault();
            onPageChange(page);
          }}
          className={className}
          aria-label={ariaLabel}
          aria-current={ariaCurrent}
        >
          {children}
        </Link>
      );
    }
    return (
      <button
        type="button"
        onClick={() => onPageChange(page)}
        className={className}
        aria-label={ariaLabel}
        aria-current={ariaCurrent}
      >
        {children}
      </button>
    );
  };

  /** «Zurück» on page 1 and «Weiter» on the last page: inert, never a link. */
  const disabledControl = (ariaLabel: string, children: ReactNode) =>
    hrefForPage ? (
      <span className={`${NAV_BASE} ${NAV_DISABLED}`} aria-label={ariaLabel} aria-disabled="true">
        {children}
      </span>
    ) : (
      <button type="button" disabled className={`${NAV_BASE} ${NAV_DISABLED}`} aria-label={ariaLabel}>
        {children}
      </button>
    );

  const prevContent = (
    <>
      <ChevronLeft className="h-4 w-4" />
      <span className="hidden sm:inline ml-1">Zurück</span>
    </>
  );
  const nextContent = (
    <>
      <span className="hidden sm:inline mr-1">Weiter</span>
      <ChevronRight className="h-4 w-4" />
    </>
  );

  return (
    <nav className="flex items-center justify-center gap-1 sm:gap-2" aria-label="Pagination">
      {/* Previous */}
      {currentPage <= 1
        ? disabledControl("Vorherige Seite", prevContent)
        : pageControl({
            page: currentPage - 1,
            className: `${NAV_BASE} ${NAV_ENABLED}`,
            ariaLabel: "Vorherige Seite",
            children: prevContent,
          })}

      {/* Page Numbers */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {visiblePages.map((page, index) => {
          if (page === '...') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="flex items-center justify-center h-9 sm:h-10 px-1 sm:px-3 text-neutral-400 text-sm"
              >
                ...
              </span>
            );
          }

          const isCurrentPage = page === currentPage;
          return (
            <Fragment key={page}>
              {pageControl({
                page: page as number,
                className: `${PAGE_BASE} ${isCurrentPage ? PAGE_CURRENT : PAGE_OTHER}`,
                ariaLabel: `Seite ${page}`,
                ariaCurrent: isCurrentPage ? "page" : undefined,
                children: page,
              })}
            </Fragment>
          );
        })}
      </div>

      {/* Next */}
      {currentPage >= totalPages
        ? disabledControl("Nächste Seite", nextContent)
        : pageControl({
            page: currentPage + 1,
            className: `${NAV_BASE} ${NAV_ENABLED}`,
            ariaLabel: "Nächste Seite",
            children: nextContent,
          })}
    </nav>
  );
}
