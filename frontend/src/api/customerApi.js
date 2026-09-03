import api from "./axiosInstance";

export const customerApi = {
  // Admin — all customer profiles
  getAll: (page = 0, size = 10, sortBy = "createdAt", sortDir = "desc") =>
    api.get(`/api/customers?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`),

  // Fetch active customers for dropdowns
  getAllActive: (size = 100) =>
    api.get(`/api/customers?page=0&size=${size}`),

  // Customer — own profile
  getMyProfile: () => api.get("/api/customers/profile"),
  createProfile: (data) => api.post("/api/customers/profile", data),
  updateMyProfile: (data) => api.put("/api/customers/profile", data),
};

