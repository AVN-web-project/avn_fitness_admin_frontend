import api from './api.js';

export const inventoryApi = {
  /**
   * Get all inventory items from dedicated inventory_m collection
   */
  getInventoryList: async (params = {}) => {
    try {
      const res = await api.get('/inventory', { params });
      return res.data;
    } catch (err) {
      // Fallback to /products if /inventory is unavailable
      const res = await api.get('/products', { params });
      return res.data;
    }
  },

  /**
   * Update stock quantity by SKU directly in inventory_m (and synced with product catalog)
   */
  updateStockBySku: async (sku, stockQuantity, metadata = {}) => {
    const res = await api.patch(`/inventory/${encodeURIComponent(sku)}`, {
      stockQuantity,
      ...metadata,
    });
    return res.data;
  },

  /**
   * Legacy / Product-scoped update stock method
   */
  updateInventory: async (productId, sku, stockQuantity) => {
    try {
      const res = await api.patch(`/inventory/${encodeURIComponent(sku)}`, { stockQuantity });
      return res.data;
    } catch (err) {
      const res = await api.patch(`/products/${productId}/inventory`, { sku, stockQuantity });
      return res.data;
    }
  },
};

export default inventoryApi;
