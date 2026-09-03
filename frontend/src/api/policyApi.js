import api from "./axiosInstance";

export const policyApi = {
  // Admin / Agent — all policies
  getAll: (page = 0, size = 10, sortBy = "createdAt", sortDir = "desc") =>
    api.get(`/api/policies?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`),

  // Customer — own policies
  getMyPolicies: (page = 0, size = 10, sortBy = "createdAt", sortDir = "desc") =>
    api.get(`/api/policies/my?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`),

  // Issue a new policy (admin / officer)
  issue: (data) => api.post("/api/policies/issue", data),

  // Purchase a policy (customer)
  purchase: (data) => api.post("/api/policies/purchase", data),

  // Cancel policy (admin)
  cancel: (policyId, data) => api.patch(`/api/policies/${policyId}/cancel`, data),
};

