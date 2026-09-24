import React, { useEffect, useState, useRef } from 'react';
import {
  Plus,
  Edit2,
  RefreshCw,
  AlertCircle,
  Eye,
  Tag,
  Boxes,
  Layers,
  Image as ImageIcon,
  ListPlus,
  Trash2,
  CheckCircle2,
  FileText,
  Sliders,
  UploadCloud,
  Loader2,
  Star,
  Package,
} from 'lucide-react';
import { productsApi } from '../../services/productsApi.js';
import PageHeader from '../../components/layout/PageHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import SearchInput from '../../components/common/SearchInput.jsx';
import { useDebounce } from '../../hooks/useDebounce.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { PRODUCT_STATUS } from '../../utils/constants.js';

export const resolveImageUrl = (img) => {
  if (!img) return '/placeholder-product.png';
  let url = typeof img === 'string' ? img : (img.url || img.image || '');
  if (!url) return '/placeholder-product.png';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  if (url.startsWith('/uploads/')) {
    const backendHost = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1').replace(/\/api\/v1\/?$/, '');
    return `${backendHost}${url}`;
  }
  return url;
};

export const getProductThumbnailUrl = (product) => {
  if (!product) return '/placeholder-product.png';
  if (Array.isArray(product.images) && product.images.length > 0) {
    const primary = product.images.find((i) => i && (i.isPrimary === true || i.isPrimary === 'true'));
    if (primary?.url) return resolveImageUrl(primary.url);
    if (product.images[0]?.url) return resolveImageUrl(product.images[0].url);
    if (typeof product.images[0] === 'string') return resolveImageUrl(product.images[0]);
  }
  if (product.image) return resolveImageUrl(product.image);
  return '/placeholder-product.png';
};

export const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  // Success Toast
  const [toastMessage, setToastMessage] = useState('');

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('general'); // 'general', 'variants', 'images', 'specs'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Image File Upload State
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Edit modal fetch state
  const [isFetchingProduct, setIsFetchingProduct] = useState(false);

  const defaultVariant = {
    sku: '',
    title: 'Standard',
    size: 'Standard',
    color: 'Standard',
    price: 499,
    compareAtPrice: 699,
    stockQuantity: 50,
    isActive: true,
  };

  const defaultImage = {
    url: '',
    altText: '',
    isPrimary: true,
  };

  const defaultSpec = {
    key: '',
    value: '',
  };

  const initialFormState = {
    name: '',
    slug: '',
    category: '',
    tagline: '',
    description: '',
    badge: '',
    status: PRODUCT_STATUS.ACTIVE,
    ageGroup: 'all',
    gender: 'unisex',
    tags: '',
    careInstructions: '',
    variants: [defaultVariant],
    images: [defaultImage],
    specifications: [
      { key: 'Material', value: 'High Grade Heavy-Duty Compound' },
      { key: 'Warranty', value: '1 Year Full Replacement Guarantee' },
    ],
  };

  const [formData, setFormData] = useState(initialFormState);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const fetchCategories = async () => {
    try {
      const res = await productsApi.getCategories();
      setCategories(res.categories || res || []);
    } catch {
      // Non-critical
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
    setActiveTab('general');
    setFormData({
      ...initialFormState,
      category: categories[0]?._id || '',
      variants: [
        {
          ...defaultVariant,
          sku: `AVN-PROD-${Date.now().toString().slice(-4)}`,
        },
      ],
      images: [
        {
          url: '/placeholder-product.png',
          altText: 'Product thumbnail',
          isPrimary: true,
        },
      ],
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const populateFormFromProduct = (product) => {
    const mappedVariants =
      product.variants && product.variants.length > 0
        ? product.variants.map((v) => ({
            sku: v.sku || '',
            title: v.title || 'Standard',
            size: v.size || 'Standard',
            color: v.color || 'Standard',
            price: Number(v.price) || 0,
            compareAtPrice: Number(v.compareAtPrice) || 0,
            stockQuantity: Number(v.stockQuantity) || 0,
            isActive: v.isActive !== false,
          }))
        : [
            {
              ...defaultVariant,
              sku: `${product.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase()}-STD`,
              price: product.pricing?.basePrice || product.price || 499,
            },
          ];

    const mappedImages =
      product.images && product.images.length > 0
        ? product.images.map((img, idx) => ({
            url: img.url || '',
            altText: img.altText || product.name,
            isPrimary: img.isPrimary || idx === 0,
          }))
        : [
            {
              url: product.image || '/placeholder-product.png',
              altText: product.name,
              isPrimary: true,
            },
          ];

    const mappedSpecs =
      product.specifications && product.specifications.length > 0
        ? product.specifications.map((s) => ({
            key: s.key || '',
            value: s.value || '',
          }))
        : [
            { key: 'Material', value: 'High Grade Heavy-Duty Compound' },
            { key: 'Warranty', value: '1 Year Full Replacement Guarantee' },
          ];

    setFormData({
      name: product.name || '',
      slug: product.slug || '',
      category: product.category?._id || product.category || categories[0]?._id || '',
      tagline: product.tagline || '',
      description: product.description || '',
      badge: product.badge || '',
      status: product.status === 'inactive' ? PRODUCT_STATUS.INACTIVE : PRODUCT_STATUS.ACTIVE,
      ageGroup: product.ageGroup || 'all',
      gender: product.gender || 'unisex',
      tags: Array.isArray(product.tags) ? product.tags.join(', ') : product.tags || '',
      careInstructions: product.careInstructions || '',
      variants: mappedVariants,
      images: mappedImages,
      specifications: mappedSpecs,
    });
  };

  const handleOpenEditModal = async (product) => {
    setEditingProduct(product);
    setActiveTab('variants'); // Open directly on Variants tab so they are immediately visible
    setFormError('');
    setIsFetchingProduct(true);
    setIsModalOpen(true);

    try {
      // Fetch fresh full product data to ensure variants are complete
      const res = await productsApi.getProductBySlug(product.slug || product._id);
      const fullProduct = res.data?.product || res.product || product;
      populateFormFromProduct(fullProduct);
    } catch {
      // Fallback to the row data already in the list if fetch fails
      populateFormFromProduct(product);
    } finally {
      setIsFetchingProduct(false);
    }
  };

  // ----------------------------------------------------
  // Variant Management Helpers
  // ----------------------------------------------------
  const handleAddVariant = () => {
    const nextIndex = formData.variants.length + 1;
    const prefix = (formData.name || 'AVN').replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase();
    const newSku = `${prefix}-${Date.now().toString().slice(-4)}-${nextIndex}`;

    setFormData({
      ...formData,
      variants: [
        ...formData.variants,
        {
          ...defaultVariant,
          sku: newSku,
          title: `Variant ${nextIndex}`,
          price: Number(formData.variants[0]?.price) || 499,
          compareAtPrice: Number(formData.variants[0]?.compareAtPrice) || 699,
          stockQuantity: 25,
        },
      ],
    });
  };

  const handleUpdateVariant = (index, field, value) => {
    const updated = [...formData.variants];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, variants: updated });
  };

  const handleRemoveVariant = (index) => {
    if (formData.variants.length <= 1) {
      alert('A product must contain at least one variant SKU.');
      return;
    }
    const updated = formData.variants.filter((_, i) => i !== index);
    setFormData({ ...formData, variants: updated });
  };

  // ----------------------------------------------------
  // Images Management & File Upload Helpers
  // ----------------------------------------------------
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploadingImage(true);
    setUploadError('');

    try {
      const uploadedList = [];

      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          throw new Error(`File "${file.name}" is not a valid image format.`);
        }

        // Convert file to base64
        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        });

        try {
          const res = await productsApi.uploadProductImage(
            base64Data,
            file.name,
            file.name.replace(/\.[^/.]+$/, '')
          );
          if (res?.data?.url) {
            uploadedList.push({
              url: res.data.url,
              altText: res.data.altText || file.name.replace(/\.[^/.]+$/, ''),
              isPrimary: formData.images.length === 0 && uploadedList.length === 0,
            });
          } else {
            uploadedList.push({
              url: base64Data,
              altText: file.name.replace(/\.[^/.]+$/, ''),
              isPrimary: formData.images.length === 0 && uploadedList.length === 0,
            });
          }
        } catch {
          uploadedList.push({
            url: base64Data,
            altText: file.name.replace(/\.[^/.]+$/, ''),
            isPrimary: formData.images.length === 0 && uploadedList.length === 0,
          });
        }
      }

      setFormData((prev) => {
        const currentImages = prev.images.filter(
          (img) => img.url && img.url !== '/placeholder-product.png'
        );
        const combined = [...currentImages, ...uploadedList];
        if (!combined.some((img) => img.isPrimary) && combined.length > 0) {
          combined[0].isPrimary = true;
        }
        return {
          ...prev,
          images: combined,
        };
      });

      showToast(`${files.length} image file(s) uploaded successfully.`);
    } catch (err) {
      setUploadError(err.message || 'Failed to upload image files.');
    } finally {
      setIsUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleAddImage = () => {
    setFormData({
      ...formData,
      images: [
        ...formData.images,
        { url: '', altText: formData.name || 'Product Image', isPrimary: false },
      ],
    });
  };

  const handleUpdateImage = (index, field, value) => {
    const updated = [...formData.images];
    if (field === 'isPrimary') {
      updated.forEach((img, i) => {
        img.isPrimary = i === index;
      });
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setFormData({ ...formData, images: updated });
  };

  const handleRemoveImage = (index) => {
    if (formData.images.length <= 1) {
      alert('A product must have at least one image reference.');
      return;
    }
    const updated = formData.images.filter((_, i) => i !== index);
    if (!updated.some((img) => img.isPrimary)) {
      updated[0].isPrimary = true;
    }
    setFormData({ ...formData, images: updated });
  };

  // ----------------------------------------------------
  // Specifications Management Helpers
  // ----------------------------------------------------
  const handleAddSpec = () => {
    setFormData({
      ...formData,
      specifications: [...formData.specifications, { key: '', value: '' }],
    });
  };

  const handleUpdateSpec = (index, field, value) => {
    const updated = [...formData.specifications];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, specifications: updated });
  };

  const handleRemoveSpec = (index) => {
    const updated = formData.specifications.filter((_, i) => i !== index);
    setFormData({ ...formData, specifications: updated });
  };

  // ----------------------------------------------------
  // Submit Handler
  // ----------------------------------------------------
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      // Validate mandatory fields
      if (!formData.name.trim()) throw new Error('Product name is required.');
      if (!formData.category) throw new Error('Please select a category for this product.');
      if (!formData.description.trim()) throw new Error('Product description is required.');
      if (!formData.variants || formData.variants.length === 0) {
        throw new Error('At least one variant SKU must be configured.');
      }

      // Format tags array from comma-separated string
      const parsedTags = typeof formData.tags === 'string'
        ? formData.tags
            .split(',')
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean)
        : formData.tags;

      // Filter valid specifications
      const parsedSpecs = formData.specifications
        .filter((s) => s.key && s.key.trim() && s.value && s.value.trim())
        .map((s) => ({ key: s.key.trim(), value: s.value.trim() }));

      // Clean images
      const parsedImages = formData.images
        .filter((img) => img.url && img.url.trim())
        .map((img) => ({
          url: img.url.trim(),
          altText: img.altText ? img.altText.trim() : formData.name.trim(),
          isPrimary: !!img.isPrimary,
        }));

      if (parsedImages.length === 0) {
        parsedImages.push({
          url: '/placeholder-product.png',
          altText: formData.name.trim(),
          isPrimary: true,
        });
      }

      // Format variants
      const parsedVariants = (formData.variants && formData.variants.length > 0 ? formData.variants : [defaultVariant]).map((v, idx) => {
        const skuVal = (v?.sku || '').trim().toUpperCase();
        const fallbackPrefix = (formData.name || 'AVN').replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase() || 'AVN';
        const generatedSku = `${fallbackPrefix}-${idx + 1}-${Date.now().toString().slice(-4)}`;
        return {
          sku: skuVal || generatedSku,
          title: v?.title ? v.title.trim() : `${v?.size || ''} ${v?.color || ''}`.trim() || 'Standard',
          size: v?.size ? v.size.trim() : 'Standard',
          color: v?.color ? v.color.trim() : 'Standard',
          price: Number(v?.price) || 0,
          compareAtPrice: Number(v?.compareAtPrice) || 0,
          stockQuantity: Number(v?.stockQuantity) || 0,
          packQuantity: Number(v?.packQuantity) || 1,
          isActive: v?.isActive !== false && formData.status === PRODUCT_STATUS.ACTIVE,
        };
      });

      // Base Price taken from the primary variant
      const primaryPrice = parsedVariants[0]?.price || 499;

      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim() || undefined,
        category: formData.category,
        tagline: formData.tagline.trim(),
        description: formData.description.trim(),
        badge: formData.badge.trim(),
        status: formData.status,
        ageGroup: formData.ageGroup,
        gender: formData.gender,
        tags: parsedTags,
        careInstructions: formData.careInstructions.trim(),
        specifications: parsedSpecs,
        images: parsedImages,
        variants: parsedVariants,
        price: primaryPrice,
        pricing: {
          basePrice: primaryPrice,
          compareAtPrice: parsedVariants[0]?.compareAtPrice || 0,
        },
      };

      if (editingProduct) {
        await productsApi.updateProduct(editingProduct._id, payload);
        showToast(`Product "${formData.name}" successfully updated.`);
      } else {
        await productsApi.createProduct(payload);
        showToast(`Product "${formData.name}" successfully published to catalog.`);
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
      showToast(`Product status updated to ${newStatus === 'active' ? 'Active (Live onsite)' : 'Inactive (Hidden)'}.`);
      await fetchProducts();
    } catch (err) {
      alert(err.message || 'Failed to update product status.');
    }
  };

  const columns = [
    {
      header: 'Product Name',
      key: 'name',
      render: (row) => {
        const thumbUrl = getProductThumbnailUrl(row);
        return (
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
              <img
                src={thumbUrl}
                alt={row.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  if (e.target.src !== '/placeholder-product.png') {
                    e.target.src = '/placeholder-product.png';
                  }
                }}
              />
            </div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                {row.name}
                {row.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                    {row.badge}
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 line-clamp-1">
                {row.tagline || row.slug || `${row.variants?.length || 1} SKU variants`}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Category',
      key: 'category',
      render: (row) => (
        <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {row.category?.name || row.category || 'General'}
        </span>
      ),
    },
    {
      header: 'SKUs & Pricing',
      key: 'pricing',
      render: (row) => {
        const minPrice = row.priceRange?.min || row.price || row.pricing?.basePrice || 0;
        const maxPrice = row.priceRange?.max || row.price || row.pricing?.basePrice || 0;
        const varCount = row.variants?.length || 1;

        return (
          <div>
            <span className="font-bold text-slate-900 dark:text-slate-100 text-xs font-mono">
              {minPrice === maxPrice ? formatCurrency(minPrice) : `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`}
            </span>
            <div className="text-[11px] text-slate-400 font-mono">
              {varCount} {varCount === 1 ? 'variant' : 'variants'}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Warehouse Stock',
      key: 'totalStock',
      render: (row) => {
        const totalStock = row.totalStock !== undefined ? row.totalStock : (row.variants || []).reduce((acc, v) => acc + (Number(v.stockQuantity) || 0), 0);
        return (
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className={`font-bold ${totalStock === 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
              {totalStock}
            </span>
            <span className="text-[11px] text-slate-400 font-sans">units</span>
          </div>
        );
      },
    },
    {
      header: 'Storefront Display',
      key: 'status',
      render: (row) => {
        const currentStatus = row.status === 'active' ? 'active' : 'inactive';
        return (
          <select
            value={currentStatus}
            onChange={(e) => handleStatusChange(row._id, e.target.value)}
            className={`text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer border transition-all ${
              currentStatus === 'active'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            <option value={PRODUCT_STATUS.ACTIVE}>Active (Onsite)</option>
            <option value={PRODUCT_STATUS.INACTIVE}>Inactive (Hidden)</option>
          </select>
        );
      },
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
          Edit Product
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products & Catalog"
        subtitle="Manage complete commercial fitness gear catalog, variants, and product attributes synchronized with MongoDB."
        action={
          <Button variant="primary" size="sm" leftIcon={Plus} onClick={handleOpenCreateModal}>
            Add Product
          </Button>
        }
      />

      {/* Global Success Toast */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-sm flex items-center gap-2.5 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          onClear={() => setSearch('')}
          placeholder="Search products by title, SKU, or keywords..."
          className="w-full sm:w-80"
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

      {/* ======================================================== */}
      {/* ADD / EDIT PRODUCT MODAL                                 */}
      {/* ======================================================== */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? `Edit Product: ${editingProduct.name}` : 'Add New Catalog Product'}
        maxWidth="max-w-3xl"
      >
        {formError && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {isFetchingProduct && (
          <div className="flex items-center justify-center gap-2 py-8 text-slate-500 dark:text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading product details...</span>
          </div>
        )}

        {!isFetchingProduct && (
          <>
        {/* Modal Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-5 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'general'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            1. General Info
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('variants')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'variants'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            2. Variants & SKUs ({formData.variants.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('images')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'images'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            3. Media ({formData.images.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('specs')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'specs'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            4. Specs & Care
          </button>
        </div>

        <form onSubmit={handleSaveProduct} className="space-y-4">
          {/* TAB 1: GENERAL INFO */}
          {activeTab === 'general' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. AVN Heavy Duty Knee Wrap"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Category Reference *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select category...</option>
                    {categories.map((c) => (
                      <option key={c._id || c.slug} value={c._id || c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Display Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={PRODUCT_STATUS.ACTIVE}>Active (Live Onsite)</option>
                    <option value={PRODUCT_STATUS.INACTIVE}>Inactive (Hidden)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Age Group
                  </label>
                  <select
                    value={formData.ageGroup}
                    onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Ages</option>
                    <option value="adults">Adults</option>
                    <option value="kids">Kids</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Target Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="unisex">Unisex</option>
                    <option value="men">Men</option>
                    <option value="women">Women</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Marketing Tagline
                  </label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    placeholder="e.g. Maximum joint protection for heavy squats and leg presses."
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Badge / Tag
                  </label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="e.g. BESTSELLER, NEW, PRO"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Search & SEO Tags (Comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g. knee wrap, powerlifting, squats, gym accessories"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Full Product Description *
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Engineered with heavy-duty elastic compound rubber and premium cotton wrap..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* TAB 2: VARIANTS & PRICING */}
          {activeTab === 'variants' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Variant SKUs & Inventory Stock
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Each variant is synchronized directly to the database <code className="font-mono text-blue-600">inventory_m</code> collection.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  leftIcon={Plus}
                  onClick={handleAddVariant}
                  className="text-xs"
                >
                  Add Variant
                </Button>
              </div>

              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {formData.variants.map((v, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                        Variant #{idx + 1}
                      </span>
                      {formData.variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(idx)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-0.5 font-medium">
                          SKU Code *
                        </label>
                        <input
                          type="text"
                          required
                          value={v.sku}
                          onChange={(e) => handleUpdateVariant(idx, 'sku', e.target.value.toUpperCase())}
                          placeholder="AVN-KW-79"
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-500 mb-0.5 font-medium">
                          Title / Description
                        </label>
                        <input
                          type="text"
                          value={v.title}
                          onChange={(e) => handleUpdateVariant(idx, 'title', e.target.value)}
                          placeholder="e.g. Red / Standard 79"
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-500 mb-0.5 font-medium">
                          Size
                        </label>
                        <input
                          type="text"
                          value={v.size}
                          onChange={(e) => handleUpdateVariant(idx, 'size', e.target.value)}
                          placeholder="e.g. M, L, 79 inch"
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-500 mb-0.5 font-medium">
                          Color
                        </label>
                        <input
                          type="text"
                          value={v.color}
                          onChange={(e) => handleUpdateVariant(idx, 'color', e.target.value)}
                          placeholder="e.g. Crimson Red"
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-0.5 font-medium">
                          Selling Price (₹) *
                        </label>
                        <input
                          type="number"
                          required
                          min={0}
                          value={v.price}
                          onChange={(e) => handleUpdateVariant(idx, 'price', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-500 mb-0.5 font-medium">
                          MRP / Compare Price (₹)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={v.compareAtPrice}
                          onChange={(e) => handleUpdateVariant(idx, 'compareAtPrice', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-500 mb-0.5 font-medium">
                          Stock Quantity (Units) *
                        </label>
                        <input
                          type="number"
                          required
                          min={0}
                          value={v.stockQuantity}
                          onChange={(e) => handleUpdateVariant(idx, 'stockQuantity', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs font-bold text-emerald-600"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: IMAGES & MEDIA */}
          {activeTab === 'images' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Product Image Files & Media
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Upload product photos directly from your computer (PNG, JPG, WEBP, SVG).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="text-xs py-1 px-2.5"
                    leftIcon={Plus}
                    onClick={handleAddImage}
                  >
                    Custom URL
                  </Button>
                </div>
              </div>

              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                accept="image/*"
                className="hidden"
              />

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-blue-300 dark:border-blue-900 hover:border-blue-500 dark:hover:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl p-6 text-center cursor-pointer transition-all group"
              >
                {isUploadingImage ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-2">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                      Uploading & Processing Image File(s)...
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 py-1">
                    <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        Click to browse or drag & drop image files
                      </span>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Supports PNG, JPG, JPEG, WEBP, SVG (Select single or multiple photos)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {uploadError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Uploaded Images List */}
              <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Configured Product Photos ({formData.images.length})
                </div>

                {formData.images.map((img, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border flex items-center gap-3.5 transition-all ${
                      img.isPrimary
                        ? 'bg-blue-50/40 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {/* Thumbnail Preview */}
                    <div className="w-14 h-14 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                      {img.url ? (
                        <img
                          src={resolveImageUrl(img.url)}
                          alt={img.altText || 'Preview'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = '/placeholder-product.png';
                          }}
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-slate-400" />
                      )}
                    </div>

                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-0.5">
                          Image File Source
                        </label>
                        <input
                          type="text"
                          required
                          value={img.url}
                          onChange={(e) => handleUpdateImage(idx, 'url', e.target.value)}
                          placeholder="Image Path or Upload URL"
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-0.5">
                          Alt Description
                        </label>
                        <input
                          type="text"
                          value={img.altText}
                          onChange={(e) => handleUpdateImage(idx, 'altText', e.target.value)}
                          placeholder="e.g. Front angle view"
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleUpdateImage(idx, 'isPrimary', true)}
                        className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${
                          img.isPrimary
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-400'
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${img.isPrimary ? 'fill-white' : ''}`} />
                        <span>{img.isPrimary ? 'Primary' : 'Set Primary'}</span>
                      </button>

                      {formData.images.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1.5"
                          title="Remove image"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SPECS & CARE */}
          {activeTab === 'specs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Technical Specifications
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Add key-value pairs for technical specifications displayed on product cards.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  leftIcon={Plus}
                  onClick={handleAddSpec}
                  className="text-xs"
                >
                  Add Spec
                </Button>
              </div>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {formData.specifications.map((spec, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={spec.key}
                      onChange={(e) => handleUpdateSpec(idx, 'key', e.target.value)}
                      placeholder="Spec Name (e.g. Max Load, Length)"
                      className="w-1/3 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                    />
                    <input
                      type="text"
                      value={spec.value}
                      onChange={(e) => handleUpdateSpec(idx, 'value', e.target.value)}
                      placeholder="Spec Value (e.g. Tested up to 450 kg)"
                      className="flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSpec(idx)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase text-xs mb-1">
                  Care & Maintenance Instructions
                </label>
                <textarea
                  rows={2}
                  value={formData.careInstructions}
                  onChange={(e) => setFormData({ ...formData, careInstructions: e.target.value })}
                  placeholder="e.g. Hand wash in cold water with mild detergent. Air dry flat in shade."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="mt-6 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>* Required fields</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                {editingProduct ? 'Save Changes' : 'Publish Product to Catalog'}
              </Button>
            </div>
          </div>
        </form>
          </>
        )}
      </Modal>
    </div>
  );
};

export default ProductsPage;
