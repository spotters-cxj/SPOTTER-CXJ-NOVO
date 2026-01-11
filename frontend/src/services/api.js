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

// Photos API (for full photo functionality)
export const photosApi = {
  list: (params) => api.get('/photos', { params }),
  get: (photoId) => api.get(`/photos/${photoId}`),
  getMy: () => api.get('/photos/my'),
  getQueue: () => api.get('/photos/queue'),
  upload: (formData) => api.post('/photos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  rate: (photoId, rating) => api.post(`/photos/${photoId}/rate`, { rating }),
  comment: (photoId, content) => api.post(`/photos/${photoId}/comment`, { content }),
  delete: (photoId) => api.delete(`/photos/${photoId}`),
  edit: (photoId, data) => api.put(`/photos/${photoId}/edit`, data),
  getEditHistory: (photoId) => api.get(`/photos/${photoId}/edit-history`),
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

// News API
export const newsApi = {
  list: (limit = 20) => api.get('/news', { params: { limit } }),
  get: (newsId) => api.get(`/news/${newsId}`),
  create: (data) => api.post('/news', data),
  update: (newsId, data) => api.put(`/news/${newsId}`, data),
  delete: (newsId) => api.delete(`/news/${newsId}`),
};

// Members API
export const membersApi = {
  list: (tag = null) => api.get('/members', { params: tag ? { tag } : {} }),
  getHierarchy: () => api.get('/members/hierarchy'),
  get: (userId) => api.get(`/members/${userId}`),
  updateTags: (userId, tags) => api.put(`/members/${userId}/tags`, { tags }),
  approve: (userId, approved) => api.put(`/members/${userId}/approve`, { approved }),
  delete: (userId) => api.delete(`/members/${userId}`),
};

// Evaluation API
export const evaluationApi = {
  getQueue: () => api.get('/evaluation/queue'),
  getPhoto: (photoId) => api.get(`/evaluation/${photoId}`),
  submit: (photoId, criteria, comment) => api.post(`/evaluation/${photoId}`, { criteria, comment }),
  getHistory: (photoId) => api.get(`/evaluation/history/${photoId}`),
  getEvaluatorHistory: (evaluatorId) => api.get(`/evaluation/evaluator/${evaluatorId}/history`),
};

// Ranking API
export const rankingApi = {
  getPhotos: (limit = 20) => api.get('/ranking', { params: { limit } }),
  getTop3: () => api.get('/ranking/top3'),
  getUsers: (limit = 20) => api.get('/ranking/users', { params: { limit } }),
  getPodium: () => api.get('/ranking/podium'),
};

// Notifications API
export const notificationsApi = {
  list: (unreadOnly = false) => api.get('/notifications', { params: { unread_only: unreadOnly } }),
  getCount: () => api.get('/notifications/count'),
  markRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

// Audit Logs API
export const logsApi = {
  list: (params) => api.get('/logs', { params }),
  getActions: () => api.get('/logs/actions'),
  getStats: () => api.get('/logs/stats'),
  getEvaluations: (params) => api.get('/logs/evaluations', { params }),
  getEvaluationStats: () => api.get('/logs/evaluations/stats'),
  getSecurityLogs: (limit = 50) => api.get('/logs/security', { params: { limit } }),
};

// Aircraft API (ANAC database)
export const aircraftApi = {
  lookup: (registration) => api.get('/aircraft/lookup', { params: { registration } }),
  getOperators: () => api.get('/aircraft/operators'),
  getTypes: () => api.get('/aircraft/types'),
  getModels: (type = null) => api.get('/aircraft/models', { params: type ? { aircraft_type: type } : {} }),
  validate: (registration) => api.get('/aircraft/validate', { params: { registration } }),
};

export default api;
