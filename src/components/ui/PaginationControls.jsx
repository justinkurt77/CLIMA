import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * PaginationControls - Reusable pagination UI component
 * @param {number} currentPage - Current page number (1-indexed)
 * @param {number} totalPages - Total number of pages
 * @param {function} onPageChange - Callback when page changes (receives new page number)
 * @param {boolean} isLoading - Whether data is currently loading
 * @param {boolean} hasNextPage - Whether there is a next page (for infinite scroll)
 * @param {function} onNextPage - Callback for next page (for infinite scroll)
 */
export default function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
  hasNextPage = false,
  onNextPage = null,
}) {
  const hasPrev = currentPage > 1;
  const hasNext = onNextPage ? hasNextPage : currentPage < totalPages;

  const handlePrev = () => {
    if (hasPrev && !isLoading && onPageChange) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (hasNext && !isLoading) {
      if (onNextPage) {
        onNextPage();
      } else if (onPageChange) {
        onPageChange(currentPage + 1);
      }
    }
  };

  return (
    <div className="flex items-center justify-between py-4 px-2">
      {/* Page Info */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {totalPages > 0 ? (
          <span>
            Page <span className="font-semibold">{currentPage}</span> of{' '}
            <span className="font-semibold">{totalPages}</span>
          </span>
        ) : (
          <span>Loading...</span>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handlePrev}
          disabled={!hasPrev || isLoading}
          className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        <button
          onClick={handleNext}
          disabled={!hasNext || isLoading}
          className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {isLoading ? 'Loading...' : 'Next'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
