import React from 'react';
import LoadingState from './LoadingState.jsx';
import EmptyState from './EmptyState.jsx';
import ErrorState from './ErrorState.jsx';

export const DataTable = ({
  columns = [],
  data = [],
  isLoading = false,
  error = null,
  onRetry = null,
  emptyTitle = 'No data found',
  emptyMessage = 'There are no records matching your current criteria.',
  keyExtractor = (row, index) => row._id || row.id || index,
  onRowClick = null,
  className = '',
}) => {
  if (isLoading) {
    return <LoadingState message="Loading records..." />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={onRetry} />;
  }

  if (!data || data.length === 0) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />;
  }

  return (
    <div className={`w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm ${className}`}>
      <table className="w-full text-left text-sm border-collapse">
        <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={col.key || idx}
                className={`py-3 px-4 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {data.map((row, rowIdx) => (
            <tr
              key={keyExtractor(row, rowIdx)}
              onClick={() => onRowClick && onRowClick(row)}
              className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50 ${
                onRowClick ? 'cursor-pointer' : ''
              }`}
            >
              {columns.map((col, colIdx) => (
                <td
                  key={col.key || colIdx}
                  className={`py-3.5 px-4 text-slate-700 dark:text-slate-300 ${
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                  } ${col.cellClassName || ''}`}
                >
                  {col.render ? col.render(row, rowIdx) : row[col.accessor || col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
