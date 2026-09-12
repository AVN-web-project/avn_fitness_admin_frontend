import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button.jsx';

export const Pagination = ({
  page,
  totalPages,
  total,
  limit,
  onNext,
  onPrev,
  onPageChange,
  hasNext,
  hasPrev,
  className = '',
}) => {
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-sm ${className}`}>
      <div className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
        Showing <span className="font-medium text-slate-800 dark:text-slate-200">{startItem}</span> to{' '}
        <span className="font-medium text-slate-800 dark:text-slate-200">{endItem}</span> of{' '}
        <span className="font-medium text-slate-800 dark:text-slate-200">{total}</span> results
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={onPrev}
          disabled={!hasPrev}
          leftIcon={ChevronLeft}
        >
          Previous
        </Button>

        <span className="text-xs font-medium text-slate-600 dark:text-slate-400 px-2">
          Page {page} of {totalPages || 1}
        </span>

        <Button
          variant="secondary"
          size="sm"
          onClick={onNext}
          disabled={!hasNext}
          rightIcon={ChevronRight}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default Pagination;
