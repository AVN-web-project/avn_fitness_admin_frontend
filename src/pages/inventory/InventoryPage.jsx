import React, { useEffect, useState } from 'react';
import {
  Boxes,
  Edit3,
  RefreshCw,
  AlertCircle,
  Save,
  AlertTriangle,
  CheckCircle2,
  PackageX,
  PackageCheck,
  TrendingDown,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { inventoryApi } from '../../services/inventoryApi.js';
import PageHeader from '../../components/layout/PageHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import SearchInput from '../../components/common/SearchInput.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import { useDebounce } from '../../hooks/useDebounce.js';

export const InventoryPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'lowStock', 'outOfStock'
  const [metaCounts, setMetaCounts] = useState({ lowStock: 0, outOfStock: 0, total: 0 });
  const debouncedSearch = useDebounce(search, 300);

  // Stock Edit Modal State
  const [selectedItem, setSelectedItem] = useState(null);
  const [newStock, setNewStock] = useState(0);
  const [newThreshold, setNewThreshold] = useState(5);
  const [newPrice, setNewPrice] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        search: debouncedSearch || undefined,
        lowStock: filterType === 'lowStock' ? true : undefined,
      };

      const res = await inventoryApi.getInventoryList(params);

      // Handle items from inventory_m directly or fallback product variants
      let inventoryList = [];
      if (Array.isArray(res.items)) {
        inventoryList = res.items;
      } else if (Array.isArray(res.products)) {
        // Flatten product variants if fallback endpoint was queried
        inventoryList = res.products.flatMap((prod) =>
          (prod.variants || []).map((v) => ({
            _id: v._id || `${prod._id}-${v.sku}`,
            product: prod._id,
            productName: prod.name,
            sku: v.sku,
            variantTitle: v.title || `${v.size || ''} ${v.color || ''}`.trim() || 'Standard',
            size: v.size || 'Standard',
            color: v.color || 'Standard',
            stockQuantity: v.stockQuantity !== undefined ? v.stockQuantity : v.stock || 0,
            lowStockThreshold: 5,
            price: v.price || prod.price || 0,
            lastRestockedAt: prod.updatedAt,
          }))
        );
      } else if (Array.isArray(res)) {
        inventoryList = res;
      }

      // Filter for out of stock if active
      if (filterType === 'outOfStock') {
        inventoryList = inventoryList.filter((item) => Number(item.stockQuantity) === 0);
      }

      setItems(inventoryList);

      // Calculate stats
      const lowCount = res.lowStockCount ?? inventoryList.filter((i) => (Number(i.stockQuantity) || 0) <= (Number(i.lowStockThreshold) || 5) && Number(i.stockQuantity) > 0).length;
      const outCount = res.outOfStockCount ?? inventoryList.filter((i) => (Number(i.stockQuantity) || 0) === 0).length;
      setMetaCounts({
        total: res.total || inventoryList.length,
        lowStock: lowCount,
        outOfStock: outCount,
      });
    } catch (err) {
      setError(err.message || 'Failed to fetch inventory from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [debouncedSearch, filterType]);

  const handleOpenStockModal = (item) => {
    setSelectedItem(item);
    setNewStock(Number(item.stockQuantity) || 0);
    setNewThreshold(Number(item.lowStockThreshold) || 5);
    setNewPrice(Number(item.price) || 0);
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSaveStock = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    setIsSubmitting(true);
    setModalError('');

    try {
      await inventoryApi.updateStockBySku(selectedItem.sku, newStock, {
        lowStockThreshold: newThreshold,
        price: newPrice,
      });

      setSuccessToast(`Stock for ${selectedItem.sku} successfully updated to ${newStock} units.`);
      setTimeout(() => setSuccessToast(''), 4000);

      setIsModalOpen(false);
      setSelectedItem(null);
      await fetchInventory();
    } catch (err) {
      setModalError(err.message || 'Failed to update stock quantity in database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const adjustQuick = (delta) => {
    setNewStock((prev) => Math.max(0, prev + delta));
  };

  const columns = [
    {
      header: 'SKU Code',
      key: 'sku',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
            {row.sku}
          </span>
        </div>
      ),
    },
    {
      header: 'Product & Variant',
      key: 'productName',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">{row.productName}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {row.variantTitle || `${row.size || ''} ${row.color || ''}`.trim() || 'Standard Variant'}
          </div>
        </div>
      ),
    },
    {
      header: 'Attributes',
      key: 'attributes',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs">
          {row.size && (
            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
              {row.size}
            </span>
          )}
          {row.color && (
            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
              {row.color}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Unit Price',
      key: 'price',
      render: (row) => (
        <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
          ₹{Number(row.price || 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      header: 'In Stock',
      key: 'stockQuantity',
      render: (row) => {
        const qty = Number(row.stockQuantity) || 0;
        const threshold = Number(row.lowStockThreshold) || 5;
        const isOut = qty === 0;
        const isLow = qty > 0 && qty <= threshold;

        return (
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-bold font-mono px-2 py-0.5 rounded-lg ${
                isOut
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  : isLow
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              }`}
            >
              {qty}
            </span>
            <span className="text-[11px] text-slate-400">units</span>
          </div>
        );
      },
    },
    {
      header: 'Stock Status',
      key: 'status',
      render: (row) => {
        const qty = Number(row.stockQuantity) || 0;
        const threshold = Number(row.lowStockThreshold) || 5;
        if (qty === 0) {
          return <StatusBadge status="danger" text="Out of Stock" />;
        }
        if (qty <= threshold) {
          return <StatusBadge status="warning" text="Low Stock" />;
        }
        return <StatusBadge status="success" text="In Stock" />;
      },
    },
    {
      header: 'Last Restocked',
      key: 'lastRestockedAt',
      render: (row) => (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {row.lastRestockedAt
            ? new Date(row.lastRestockedAt).toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : 'N/A'}
        </span>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (row) => (
        <Button
          variant="secondary"
          size="sm"
          className="text-xs py-1 px-2.5 shadow-sm hover:border-blue-400"
          leftIcon={Edit3}
          onClick={() => handleOpenStockModal(row)}
        >
          Adjust Stock
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Management"
        subtitle="Live synchronization with MongoDB inventory_m collection and product catalog."
      />

      {/* Success Toast */}
      {successToast && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-sm flex items-center gap-2.5 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-medium">{successToast}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setFilterType('all')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            filterType === 'all'
              ? 'bg-blue-50/70 border-blue-300 dark:bg-blue-950/30 dark:border-blue-800 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total SKUs Tracked
            </span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {metaCounts.total || items.length}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Active warehouse SKU records
          </p>
        </div>

        <div
          onClick={() => setFilterType('lowStock')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            filterType === 'lowStock'
              ? 'bg-amber-50/70 border-amber-300 dark:bg-amber-950/30 dark:border-amber-800 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Low Stock Warnings
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {metaCounts.lowStock}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Quantity ≤ configured threshold
          </p>
        </div>

        <div
          onClick={() => setFilterType('outOfStock')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            filterType === 'outOfStock'
              ? 'bg-rose-50/70 border-rose-300 dark:bg-rose-950/30 dark:border-rose-800 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Out of Stock
            </span>
            <PackageX className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">
            {metaCounts.outOfStock}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Zero physical warehouse stock
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterType === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            All SKUs ({metaCounts.total || items.length})
          </button>
          <button
            onClick={() => setFilterType('lowStock')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterType === 'lowStock'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Low Stock ({metaCounts.lowStock})
          </button>
          <button
            onClick={() => setFilterType('outOfStock')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterType === 'outOfStock'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Out of Stock ({metaCounts.outOfStock})
          </button>
        </div>

        <div className="flex items-center gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            onClear={() => setSearch('')}
            placeholder="Search by SKU, Product or Variant..."
          />
          <Button variant="secondary" size="sm" leftIcon={RefreshCw} onClick={fetchInventory}>
            Sync & Refresh
          </Button>
        </div>
      </div>

      {/* Main Inventory DataTable */}
      <DataTable
        columns={columns}
        data={items}
        isLoading={loading}
        error={error}
        onRetry={fetchInventory}
        emptyTitle="No inventory records found"
      />

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Adjust Warehouse Stock: ${selectedItem?.sku}`}
        maxWidth="max-w-md"
      >
        {modalError && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{modalError}</span>
          </div>
        )}

        {selectedItem && (
          <form onSubmit={handleSaveStock} className="space-y-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="text-xs text-slate-500 dark:text-slate-400">Product</div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {selectedItem.productName}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                {selectedItem.variantTitle} ({selectedItem.size} / {selectedItem.color})
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Physical Stock Quantity (Units)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  required
                  value={newStock}
                  onChange={(e) => setNewStock(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-base font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Quick Adjust Buttons */}
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[11px] text-slate-400 mr-1">Quick:</span>
                <button
                  type="button"
                  onClick={() => adjustQuick(5)}
                  className="px-2 py-1 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-slate-700 dark:text-slate-300"
                >
                  +5
                </button>
                <button
                  type="button"
                  onClick={() => adjustQuick(10)}
                  className="px-2 py-1 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-slate-700 dark:text-slate-300"
                >
                  +10
                </button>
                <button
                  type="button"
                  onClick={() => adjustQuick(25)}
                  className="px-2 py-1 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-slate-700 dark:text-slate-300"
                >
                  +25
                </button>
                <button
                  type="button"
                  onClick={() => adjustQuick(-5)}
                  className="px-2 py-1 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-slate-700 dark:text-slate-300"
                >
                  -5
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Low Stock Threshold
                </label>
                <input
                  type="number"
                  min={1}
                  value={newThreshold}
                  onChange={(e) => setNewThreshold(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Unit Price (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={newPrice}
                  onChange={(e) => setNewPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-blue-50/50 dark:bg-blue-950/30 p-2.5 rounded-lg border border-blue-200 dark:border-blue-900/50">
              💡 Changes will instantly sync with the database (<code className="font-mono">inventory_m</code>) and the public store catalog.
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting} leftIcon={Save}>
                Save Stock
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default InventoryPage;
