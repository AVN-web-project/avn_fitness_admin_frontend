import React, { useEffect, useState } from 'react';
import { UserPlus, Shield, Power, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { staffApi } from '../../services/staffApi.js';
import PageHeader from '../../components/layout/PageHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import SearchInput from '../../components/common/SearchInput.jsx';
import { useDebounce } from '../../hooks/useDebounce.js';
import { ROLES, ROLE_LABELS } from '../../permissions/roles.js';
import { formatDate } from '../../utils/formatDate.js';

export const StaffPage = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: ROLES.PRODUCT_INVENTORY_MANAGER,
    phone: '',
  });

  // Toggle Status Confirm State
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isToggleModalOpen, setIsToggleModalOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await staffApi.getStaffUsers({ search: debouncedSearch });
      setStaff(res.staff || res.users || []);
    } catch (err) {
      setError(err.message || 'Failed to load staff accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [debouncedSearch]);

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      await staffApi.createStaffMember(formData);
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: ROLES.PRODUCT_INVENTORY_MANAGER,
        phone: '',
      });
      await fetchStaff();
    } catch (err) {
      setFormError(err.message || 'Failed to create staff account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedStaff) return;
    try {
      setIsToggling(true);
      await staffApi.toggleStaffStatus(selectedStaff._id);
      setIsToggleModalOpen(false);
      setSelectedStaff(null);
      await fetchStaff();
    } catch (err) {
      alert(err.message || 'Failed to update staff status.');
    } finally {
      setIsToggling(false);
    }
  };

  const columns = [
    {
      header: 'Staff Member',
      key: 'name',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">{row.name}</div>
          <div className="text-xs text-slate-400">{row.email}</div>
        </div>
      ),
    },
    {
      header: 'Employee ID',
      key: 'employeeId',
      render: (row) => <span className="font-mono text-xs text-slate-700 dark:text-slate-200">{row.employeeId || '—'}</span>,
    },
    {
      header: 'Assigned Role',
      key: 'role',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
          <Shield className="w-3.5 h-3.5" />
          {ROLE_LABELS[row.role] || row.role}
        </span>
      ),
    },
    {
      header: 'Phone',
      key: 'phone',
      render: (row) => row.phone || '—',
    },
    {
      header: 'Created On',
      key: 'createdAt',
      render: (row) => formatDate(row.createdAt, false),
    },
    {
      header: 'Status',
      key: 'isActive',
      render: (row) => (
        <StatusBadge
          status={row.isActive !== false ? 'active' : 'unavailable'}
          customLabel={row.isActive !== false ? 'Active' : 'Suspended'}
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
            setSelectedStaff(row);
            setIsToggleModalOpen(true);
          }}
        >
          {row.isActive !== false ? 'Deactivate' : 'Activate'}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff & Access Management"
        subtitle="Manage administrative operators, roles, and credential access."
        action={
          <Button
            variant="primary"
            size="sm"
            leftIcon={UserPlus}
            onClick={() => {
              setFormError('');
              setIsAddModalOpen(true);
            }}
          >
            Add Staff Member
          </Button>
        }
      />

      <div className="flex items-center justify-between gap-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          onClear={() => setSearch('')}
          placeholder="Search staff by name, email or employee ID..."
        />
        <Button variant="secondary" size="sm" leftIcon={RefreshCw} onClick={fetchStaff}>
          Refresh
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={staff}
        isLoading={loading}
        error={error}
        onRetry={fetchStaff}
        emptyTitle="No staff accounts found"
      />

      {/* Add Staff Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Staff Member"
        maxWidth="max-w-md"
      >
        {formError && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleCreateStaff} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Vikram Verma"
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Staff Email Address
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g. vikram@avnfitness.com"
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Initial Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Minimum 6 characters"
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Management Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={ROLES.SUPER_ADMIN}>Super Admin (Full Access)</option>
              <option value={ROLES.PRODUCT_INVENTORY_MANAGER}>Product & Inventory Manager</option>
              <option value={ROLES.ORDER_MANAGER}>Order & Logistics Manager</option>
              <option value={ROLES.CUSTOMER_SUPPORT}>Customer Support Lead</option>
              <option value={ROLES.MARKETING_MANAGER}>Marketing & Campaigns Lead</option>
              <option value={ROLES.FINANCE_MANAGER}>Finance & Payouts Lead</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Phone Number (Optional)
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 98765 43210"
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Create Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Toggle Status Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isToggleModalOpen}
        onClose={() => {
          setIsToggleModalOpen(false);
          setSelectedStaff(null);
        }}
        onConfirm={handleToggleStatus}
        title={selectedStaff?.isActive !== false ? 'Deactivate Staff Account' : 'Reactivate Staff Account'}
        message={`Are you sure you want to ${
          selectedStaff?.isActive !== false ? 'deactivate' : 'reactivate'
        } account for ${selectedStaff?.name} (${selectedStaff?.email})?`}
        confirmText={selectedStaff?.isActive !== false ? 'Deactivate' : 'Activate'}
        variant={selectedStaff?.isActive !== false ? 'danger' : 'primary'}
        isLoading={isToggling}
      />
    </div>
  );
};

export default StaffPage;
