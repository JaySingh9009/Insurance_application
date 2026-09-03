import api from "./axiosInstance";

export const authApi = {
  login: (data) => api.post("/api/auth/login", data),
  register: (data) => api.post("/api/auth/register", data),
  verifyOtp: (data) => api.post("/api/auth/verify-otp", data),
  forgotPassword: (data) => api.post("/api/auth/forgot-password", data),
  verifyResetOtp: (data) => api.post("/api/auth/verify-reset-otp", data),
  resetPassword: (data) => api.post("/api/auth/reset-password", data),
  logout: () => api.post("/api/auth/logout"),
  getProfile: () => api.get("/api/users/profile"),
};

