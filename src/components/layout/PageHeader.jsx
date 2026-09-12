import React from 'react';
import Breadcrumbs from './Breadcrumbs.jsx';

export const PageHeader = ({
  title,
  subtitle,
  children,
  action,
}) => {
  return (
    <div className="mb-6">
      <Breadcrumbs />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
        {(children || action) && (
          <div className="flex items-center gap-3">
            {children}
            {action}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
