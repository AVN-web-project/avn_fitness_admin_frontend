import React, { useEffect, useState } from 'react';
import { financeApi } from '../../services/financeApi.js';
import PageHeader from '../../components/layout/PageHeader.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import { formatCurrency } from '../../utils/formatCurrency.js';

export const FinancePage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFinance = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await financeApi.getFinancialSummary();
      setData(res.summary || {});
    } catch (err) {
      setError(err.message || 'Failed to load financial records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinance();
  }, []);

  if (loading) return <LoadingState message="Loading financial analytics..." />;
  if (error) return <ErrorState error={error} onRetry={fetchFinance} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial Overview"
        subtitle="Track gross merchandise volume, net settlement, discounts, and refunds."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gross Sales</div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {formatCurrency(data?.grossRevenue || 0)}
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Discounts Given</div>
          <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {formatCurrency(data?.totalDiscounts || 0)}
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Realized Revenue</div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(data?.netRevenue || 0)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancePage;
