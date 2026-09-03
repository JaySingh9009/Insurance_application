import api from "./axiosInstance";

export const paymentApi = {
  // Admin / officer — all payments
  getAll: (page = 0, size = 10, sortBy = "paymentId", sortDir = "desc") =>
    api.get(`/api/payments?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`),

  // Customer — own payments
  getMyPayments: (page = 0, size = 10, sortBy = "paymentId", sortDir = "desc") =>
    api.get(`/api/payments/my?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`),

  // Razorpay Payments
  createOrder: (data) => api.post("/api/payments/create-order", data),
  verifyPayment: (data) => api.post("/api/payments/verify", data),
 
};

