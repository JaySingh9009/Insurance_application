import api from "./axiosInstance";

export const claimApi = {
  // Admin / Officer — all claims
  getAll: (page = 0, size = 10, sortBy = "createdAt", sortDir = "desc") =>
    api.get(`/api/claims?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`),

  // Customer — own claims
  getMyClaims: (page = 0, size = 10, sortBy = "createdAt", sortDir = "desc") =>
    api.get(`/api/claims/my?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`),

  // Claims by customer ID
  getByCustomer: (customerId) => api.get(`/api/claims/customer/${customerId}`),

  // Customer submits new claim
  submit: (data) => api.post("/api/claims", data),
 

  // officer actions
  review: (claimId, data) =>
    api.patch(`/api/claims/${claimId}/review`, data),
  recommend: (claimId, data) =>
    api.patch(`/api/claims/${claimId}/recommend`, data),

  // Admin actions
  decide: (claimId, data) =>
    api.patch(`/api/claims/${claimId}/decide`, data),
  assignOfficer: (claimId, officerId) =>
    api.patch(`/api/claims/${claimId}/assign-officer`, { officerId }),

  // History & Documents
  getHistory: (claimId) => api.get(`/api/claim-history/${claimId}`),
  getDocuments: (claimId) => api.get(`/api/claim-documents/${claimId}`),
  uploadDocument: (formData) =>
    api.post("/api/claim-documents/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

