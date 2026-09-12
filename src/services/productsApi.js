import api from './api.js';

export const productsApi = {
  getProducts: async (params = {}) => {
    const res = await api.get('/products', { params });
    return res.data;
  },

  getProductBySlug: async (slug) => {
    const res = await api.get(`/products/${slug}`);
    return res.data;
  },

  createProduct: async (productData) => {
    const res = await api.post('/products', productData);
    return res.data;
  },

  updateProduct: async (id, productData) => {
    const res = await api.patch(`/products/${id}`, productData);
    return res.data;
  },

  updateProductStatus: async (id, status) => {
    const res = await api.patch(`/products/${id}/status`, { status });
    return res.data;
  },

  getCategories: async () => {
    const res = await api.get('/categories');
    return res.data;
  },

  createCategory: async (categoryData) => {
    const res = await api.post('/categories', categoryData);
    return res.data;
  },

  updateCategory: async (id, categoryData) => {
    const res = await api.patch(`/categories/${id}`, categoryData);
    return res.data;
  },
};
