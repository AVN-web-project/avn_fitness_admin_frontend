import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button.jsx';

export const ErrorState = ({
  error,
  title = 'Something went wrong',
  onRetry,
  className = '',
}) => {
  const errorMessage = error instanceof Error ? error.message : error || 'Failed to load data.';

  return (
    <div className={`flex flex-col items-center justify-center text-center p-10 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-950/60 rounded-xl shadow-sm ${className}`}>
      <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-5">{errorMessage}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} leftIcon={RefreshCw}>
          Retry Request
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
