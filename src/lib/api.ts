import axios from 'axios';
import { getApiBaseUrl } from '@/lib/apiBaseUrl';

const api = axios.create({
  baseURL: `${getApiBaseUrl()}/api`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data: { name: string; email: string; phone: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { login: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  getById: (id: string) => api.get(`/categories/${id}`),
  create: (data: FormData) =>
    api.post('/categories', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: FormData) =>
    api.put(`/categories/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

export const foodsAPI = {
  getAll: (params?: Record<string, string>) => api.get('/foods', { params }),
  getById: (id: string) => api.get(`/foods/${id}`),
  create: (data: FormData) =>
    api.post('/foods', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: FormData) =>
    api.put(`/foods/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: string) => api.delete(`/foods/${id}`),
};

export const ordersAPI = {
  create: (data: Record<string, unknown>) => api.post('/orders', data),
  getAll: (params?: Record<string, string>) => api.get('/orders', { params }),
  getById: (id: string) => api.get(`/orders/${id}`),
  updateStatus: (id: string, status: string) => api.put(`/orders/${id}/status`, { status }),
};

export const paymentsAPI = {
  process: (data: { orderId: string; method?: string }) => api.post('/payments', data),
  getByOrder: (orderId: string) => api.get(`/payments/${orderId}`),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getStatistics: (params?: Record<string, string>) => api.get('/admin/statistics', { params }),
  getUsers: () => api.get('/admin/users'),
  getUserDetails: (id: string) => api.get(`/admin/users/${id}`),
  updateUserRole: (id: string, role: string) => api.put(`/admin/users/${id}/role`, { role }),
};

export const driverAPI = {
  getDeliveringOrders: (params?: Record<string, string>) => api.get('/driver/orders', { params }),
  updateOrderStatus: (id: string, status: string) => api.put(`/driver/orders/${id}/status`, { status }),
};

export const newsAPI = {
  getPublic: (params?: Record<string, string>) => api.get('/news', { params }),
  getPublicById: (id: string) => api.get(`/news/${id}`),
  getAdminList: (params?: Record<string, string>) => api.get('/admin/news', { params }),
  getAdminById: (id: string) => api.get(`/admin/news/${id}`),
  create: (data: FormData) =>
    api.post('/admin/news', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: FormData) =>
    api.put(`/admin/news/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: string) => api.delete(`/admin/news/${id}`),
};

export default api;
