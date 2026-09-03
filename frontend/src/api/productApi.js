import api from "./axiosInstance";

export const productApi = {
  getAll: (page = 0, size = 10, sortBy = "createdAt", sortDir = "desc") =>
    api.get(`/api/products?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`),

  // Fetch all active products (for dropdowns)
  getAllActive: (size = 100) =>
    api.get(`/api/products?page=0&size=${size}`),



  create: (data) => api.post("/api/products", data),

  update: (productId, data) => api.put(`/api/products/${productId}`, data),

  activate: (productId) => api.patch(`/api/products/${productId}/activate`),
  deactivate: (productId) => api.patch(`/api/products/${productId}/deactivate`),
};
