import api from "./axiosInstance";

export const userApi = {
  // Admin — all users
  getAllUsers: (page = 0, size = 10, sortBy = "createdAt", sortDir = "desc", role = "") => {
    const roleParam = role && role !== "ALL" ? `&role=${role}` : "";
    return api.get(`/api/admin/users?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}${roleParam}`);
  },

  // Admin — get all officers
  getOfficers: () => api.get("/api/admin/users/officers-workload"),
  getAgents: () => api.get("/api/admin/users/officers"),

  // Admin — create officer / agent
  createOfficer: (data) => api.post("/api/admin/users/officers", data),
  createAgent: (data) => api.post("/api/admin/users/agents", data),

  activate: (userId) => api.patch(`/api/admin/users/${userId}/activate`),
  deactivate: (userId) => api.patch(`/api/admin/users/${userId}/deactivate`),

  // Any authenticated user — own profile
  getProfile: () => api.get("/api/users/profile"),

  // Admin Dashboard Overview
  getAdminDashboard: () => api.get("/api/dashboard/admin"),
};


