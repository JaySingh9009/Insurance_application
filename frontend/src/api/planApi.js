import api from "./axiosInstance";

export const planApi = {
  // Admin — all plans (including inactive)
  getAll: (page = 0, size = 10, sortBy = "createdAt", sortDir = "desc") =>
    api.get(`/api/plans?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`),

  // Active plans (for customer browsing and dropdowns)
  getActive: (page = 0, size = 10) =>
    api.get(`/api/plans/active?page=${page}&size=${size}`),

  create: (data) => api.post("/api/plans", data),

  activate: (planId) => api.patch(`/api/plans/${planId}/activate`),
  deactivate: (planId) => api.patch(`/api/plans/${planId}/deactivate`),
};

