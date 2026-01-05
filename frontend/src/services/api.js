import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth API
export const authApi = {
  createSession: (sessionId) => api.post('/auth/session', { session_id: sessionId }),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// Admin API
export const adminApi = {
  getUsers: () => api.get('/admin/users'),
  updateUserRole: (userId, role) => api.put(`/admin/users/${userId}/role`, { role }),
  approveUser: (userId, approved) => api.put(`/admin/users/${userId}/approve`, { approved }),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
};

// Pages API
export const pagesApi = {
  getPage: (slug) => api.get(`/pages/${slug}`),
  updatePage: (slug, data) => api.put(`/pages/${slug}`, data),
  listPages: () => api.get('/pages'),
};

// Leaders API
export const leadersApi = {
  list: () => api.get('/leaders'),
  create: (data) => api.post('/leaders', data),
  update: (leaderId, data) => api.put(`/leaders/${leaderId}`, data),
  delete: (leaderId) => api.delete(`/leaders/${leaderId}`),
};

// Gallery API
export const galleryApi = {
  list: (params) => api.get('/gallery', { params }),
  getTypes: () => api.get('/gallery/types'),
  get: (photoId) => api.get(`/gallery/${photoId}`),
  upload: (formData) => api.post('/gallery', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (photoId) => api.delete(`/gallery/${photoId}`),
  getByRegistration: (registration) => api.get(`/gallery/by-registration/${registration}`),
};

// Memories API
export const memoriesApi = {
  list: () => api.get('/memories'),
  create: (data) => api.post('/memories', data),
  update: (memoryId, data) => api.put(`/memories/${memoryId}`, data),
  delete: (memoryId) => api.delete(`/memories/${memoryId}`),
};

// Settings API
export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
};

// Upload API
export const uploadApi = {
  upload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Timeline API
export const timelineApi = {
  getAirport: () => api.get('/timeline/airport'),
  createAirportItem: (data) => api.post('/timeline/airport', data),
  updateAirportItem: (itemId, data) => api.put(`/timeline/airport/${itemId}`, data),
  deleteAirportItem: (itemId) => api.delete(`/timeline/airport/${itemId}`),
  getSpotters: () => api.get('/timeline/spotters'),
  createSpottersItem: (data) => api.post('/timeline/spotters', data),
  updateSpottersItem: (itemId, data) => api.put(`/timeline/spotters/${itemId}`, data),
  deleteSpottersItem: (itemId) => api.delete(`/timeline/spotters/${itemId}`),
};

// Stats API
export const statsApi = {
  get: () => api.get('/stats'),
  update: (data) => api.put('/stats', data),
};

export default api;
