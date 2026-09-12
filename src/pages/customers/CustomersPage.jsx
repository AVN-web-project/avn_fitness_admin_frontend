import React, { useEffect, useState } from 'react';
import { RefreshCw, UserX, UserCheck } from 'lucide-react';
import { customersApi } from '../../services/customersApi.js';
import PageHeader from '../../components/layout/PageHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import SearchInput from '../../components/common/SearchInput.jsx';
import Button from '../../components/common/Button.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import { usePagination } from '../../hooks/usePagination.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { formatDate } from '../../utils/formatDate.js';

export const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  // Status Toggle State
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isToggleModalOpen, setIsToggleModalOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const pagination = usePagination(1, 20);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await customersApi.getCustomers({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch,
      });

      setCustomers(res.users || []);
      if (res.pagination) {
        pagination.setTotal(res.pagination.total || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch customer accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [pagination.page, debouncedSearch]);

  const handleToggleStatus = async () => {
    if (!selectedCustomer) return;
    try {
      setIsToggling(true);
      await customersApi.toggleCustomerStatus(selectedCustomer._id);
      setIsToggleModalOpen(false);
      setSelectedCustomer(null);
      await fetchCustomers();
    } catch (err) {
      alert(err.message || 'Failed to update customer status.');
    } finally {
      setIsToggling(false);
    }
  };

  const columns = [
    {
      header: 'Customer Name',
      key: 'name',
      render: (row) => <div className="font-semibold text-slate-900 dark:text-slate-100">{row.name}</div>,
    },
    {
      header: 'Email Address',
      key: 'email',
      render: (row) => <span className="text-slate-600 dark:text-slate-300">{row.email}</span>,
    },
    {
      header: 'Phone',
      key: 'phone',
      render: (row) => row.phone || '—',
    },
    {
      header: 'Joined On',
      key: 'createdAt',
      render: (row) => formatDate(row.createdAt, false),
    },
    {
      header: 'Account Status',
      key: 'isActive',
      render: (row) => (
        <StatusBadge
          status={row.isActive !== false ? 'active' : 'unavailable'}
          customLabel={row.isActive !== false ? 'Active' : 'Disabled'}
        />
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (row) => (
        <Button
          variant={row.isActive !== false ? 'danger' : 'success'}
          size="sm"
          className="text-xs py-1 px-2.5"
          onClick={() => {
            setSelectedCustomer(row);
            setIsToggleModalOpen(true);
          }}
        >
          {row.isActive !== false ? 'Disable' : 'Enable'}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Directory"
        subtitle="View registered customer accounts and manage status."
      />

      <div className="flex items-center justify-between gap-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          onClear={() => setSearch('')}
          placeholder="Search by name or email..."
        />
        <Button variant="secondary" size="sm" leftIcon={RefreshCw} onClick={fetchCustomers}>
          Refresh
        </Button>
      </div>

      <div className="space-y-0">
        <DataTable
          columns={columns}
          data={customers}
          isLoading={loading}
          error={error}
          onRetry={fetchCustomers}
          emptyTitle="No customer accounts found"
        />

        {!loading && !error && customers.length > 0 && (
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            onNext={pagination.nextPage}
            onPrev={pagination.prevPage}
            hasNext={pagination.hasNextPage}
            hasPrev={pagination.hasPrevPage}
          />
        )}
      </div>

      {/* Status Toggle Confirmation */}
      <ConfirmDialog
        isOpen={isToggleModalOpen}
        onClose={() => {
          setIsToggleModalOpen(false);
          setSelectedCustomer(null);
        }}
        onConfirm={handleToggleStatus}
        title={selectedCustomer?.isActive !== false ? 'Disable Customer Account' : 'Re-enable Customer Account'}
        message={`Are you sure you want to ${
          selectedCustomer?.isActive !== false ? 'disable' : 'enable'
        } account for ${selectedCustomer?.name} (${selectedCustomer?.email})?`}
        confirmText={selectedCustomer?.isActive !== false ? 'Disable' : 'Enable'}
        variant={selectedCustomer?.isActive !== false ? 'danger' : 'primary'}
        isLoading={isToggling}
      />
    </div>
  );
};

export default CustomersPage;
