import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import Button from './Button.jsx';

export const FilterBar = ({
  children,
  onReset,
  isFiltered = false,
  className = '',
}) => {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm ${className}`}>
      <div className="flex flex-wrap items-center gap-2.5 flex-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters</span>
        </div>
        {children}
      </div>

      {isFiltered && onReset && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          leftIcon={RotateCcw}
          className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        >
          Reset Filters
        </Button>
      )}
    </div>
  );
};

export default FilterBar;
