import React, { useEffect, useState } from 'react';
import { Plus, Edit2, RefreshCw, AlertCircle, Eye, Tag } from 'lucide-react';
import { productsApi } from '../../services/productsApi.js';
import PageHeader from '../../components/layout/PageHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import SearchInput from '../../components/common/SearchInput.jsx';
import { useDebounce } from '../../hooks/useDebounce.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { PRODUCT_STATUS } from '../../utils/constants.js';

export const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const initialFormState = {
    name: '',
    category: '',
    tagline: '',
    description: '',
    badge: '',
    status: 'active',
    ageGroup: 'all',
    gender: 'unisex',
    price: 499,
    stockQuantity: 50,
  };

  const [formData, setFormData] = useState(initialFormState);

  const fetchCategories = async () => {
    try {
      const res = await productsApi.getCategories();
      setCategories(res.categories || res || []);
    } catch {
      // ignore
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await productsApi.getProducts({ search: debouncedSearch });
      setProducts(res.products || res.items || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch catalog products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [debouncedSearch]);

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      ...initialFormState,
      category: categories[0]?._id || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      category: product.category?._id || product.category || '',
      tagline: product.tagline || '',
      description: product.description || '',
      badge: product.badge || '',
      status: product.status || 'active',
      ageGroup: product.ageGroup || 'all',
      gender: product.gender || 'unisex',
      price: product.pricing?.basePrice || product.price || 499,
      stockQuantity: product.variants?.[0]?.stockQuantity || 50,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        category: formData.category,
        tagline: formData.tagline,
        description: formData.description,
        badge: formData.badge,
        status: formData.status,
        ageGroup: formData.ageGroup,
        gender: formData.gender,
        price: Number(formData.price),
        pricing: {
          basePrice: Number(formData.price),
          discountPrice: Number(formData.price),
        },
        variants: [
          {
            sku: `${formData.name.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
            title: 'Standard',
            size: 'Standard',
            color: 'Standard',
            price: Number(formData.price),
            stockQuantity: Number(formData.stockQuantity),
            isActive: true,
          },
        ],
      };

      if (editingProduct) {
        await productsApi.updateProduct(editingProduct._id, payload);
      } else {
        await productsApi.createProduct(payload);
      }

      setIsModalOpen(false);
      await fetchProducts();
    } catch (err) {
      setFormError(err.message || 'Failed to save product details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (productId, newStatus) => {
    try {
      await productsApi.updateProductStatus(productId, newStatus);
      await fetchProducts();
    } catch (err) {
      alert(err.message || 'Failed to update product status.');
    }
  };

  const columns = [
    {
      header: 'Product Name',
      key: 'name',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">{row.name}</div>
          {row.tagline && <div className="text-xs text-slate-400 line-clamp-1">{row.tagline}</div>}
        </div>
      ),
    },
    {
      header: 'Category',
      key: 'category',
      render: (row) => row.category?.name || row.category || 'General',
    },
    {
      header: 'Base Price',
      key: 'pricing',
      render: (row) => formatCurrency(row.pricing?.basePrice || row.price || 0),
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => (
        <select
          value={row.status || 'active'}
          onChange={(e) => handleStatusChange(row._id, e.target.value)}
          className="text-xs font-semibold rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value={PRODUCT_STATUS.ACTIVE}>Active</option>
          <option value={PRODUCT_STATUS.UNAVAILABLE}>Unavailable</option>
          <option value={PRODUCT_STATUS.DISCONTINUED}>Discontinued</option>
        </select>
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
          className="text-xs py-1 px-2.5"
          leftIcon={Edit2}
          onClick={() => handleOpenEditModal(row)}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products & Catalog"
        subtitle="Manage product listings, categories, and display states."
        action={
          <Button variant="primary" size="sm" leftIcon={Plus} onClick={handleOpenCreateModal}>
            Add Product
          </Button>
        }
      />

      <div className="flex items-center justify-between gap-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          onClear={() => setSearch('')}
          placeholder="Search products by title..."
        />
        <Button variant="secondary" size="sm" leftIcon={RefreshCw} onClick={fetchProducts}>
          Refresh
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={products}
        isLoading={loading}
        error={error}
        onRetry={fetchProducts}
        emptyTitle="No products in catalog"
        emptyMessage="Create your first fitness gear product listing above."
      />

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Product Listing' : 'Add New Catalog Product'}
        maxWidth="max-w-xl"
      >
        {formError && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Product Title
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. AVN Leather Weightlifting Belt"
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select category...</option>
                {categories.map((c) => (
                  <option key={c._id || c.slug} value={c._id || c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Badge / Tag (Optional)
              </label>
              <input
                type="text"
                value={formData.badge}
                onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                placeholder="e.g. BESTSELLER, NEW"
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Price (INR ₹)
              </label>
              <input
                type="number"
                required
                min={1}
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Initial Stock
              </label>
              <input
                type="number"
                required
                min={0}
                value={formData.stockQuantity}
                onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Short Tagline
            </label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              placeholder="e.g. 10mm competition grade genuine leather"
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Full Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description of fitness gear specifications and features..."
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {editingProduct ? 'Save Changes' : 'Publish Product'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProductsPage;
