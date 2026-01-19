import axios from 'axios';

// Get backend URL from environment or use current origin
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

// Normalize URL - remove www, ensure https in production
const normalizeBackendUrl = (url) => {
  try {
    const parsed = new URL(url);
    // Remove www
    parsed.hostname = parsed.hostname.replace(/^www\./, '');
    return parsed.toString().replace(/\/$/, ''); // Remove trailing slash
  } catch (e) {
    return url;
  }
};

const API = `${normalizeBackendUrl(BACKEND_URL)}/api`;

// Debug log for troubleshooting
if (typeof window !== 'undefined') {
  console.log('API Configuration:', { 
    BACKEND_URL: normalizeBackendUrl(BACKEND_URL), 
    API, 
    env: process.env.REACT_APP_BACKEND_URL,
    origin: window.location.origin
  });
}

const api = axios.create({
  baseURL: API,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 second timeout
});

// Request interceptor - automatically attach auth token
api.interceptors.request.use(
  (config) => {
    // Try to get token from localStorage
    const token = localStorage.getItem('auth_token') || localStorage.getItem('session_token');
    
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Ensure HTTPS in production
    if (config.url && !config.url.startsWith('http')) {
      // Relative URL, will use baseURL
    } else if (config.url && config.url.startsWith('http://') && !config.url.includes('localhost')) {
      config.url = config.url.replace('http://', 'https://');
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handle auth errors and token refresh
api.interceptors.response.use(
  (response) => {
    // Check for new session token in response headers
    const newToken = response.headers?.['x-session-token'];
    if (newToken) {
      localStorage.setItem('auth_token', newToken);
    }
    return response;
  },
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || 'unknown';
    
    // Detailed error logging
    console.error('API Error:', {
      url,
      status,
      message: error?.message,
      data: error?.response?.data
    });
    
    // Handle auth errors
    if (status === 401) {
      console.warn('Authentication error - session may have expired');
      // Clear stored tokens on auth error
      localStorage.removeItem('auth_token');
      localStorage.removeItem('session_token');
      
      // Only redirect to login if not already on auth pages
      if (!window.location.pathname.includes('/auth') && !window.location.pathname.includes('/login')) {
        // Dispatch custom event for auth error
        window.dispatchEvent(new CustomEvent('auth-error', { detail: { status, url } }));
      }
    }
    
    // Handle CORS/domain errors
    if (status === 403 || (error?.message?.includes('CORS') || error?.message?.includes('Network'))) {
      console.error('Possible CORS or domain authorization error');
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  createSession: (sessionId) => api.post('/auth/session', { session_id: sessionId }),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

// Admin API
export const adminApi = {
  getUsers: () => api.get('/admin/users'),
  updateUserRole: (userId, role) => api.put(`/admin/users/${userId}/role`, { role }),
  approveUser: (userId, approved) => api.put(`/admin/users/${userId}/approve`, { approved }),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  updateUserTags: (userId, tags) => api.put(`/admin/users/${userId}/tags`, { tags }),
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
  update: (id, data) => api.put(`/leaders/${id}`, data),
  delete: (id) => api.delete(`/leaders/${id}`),
};

// Settings API
export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
};

// Memories/Recordações API
export const memoriesApi = {
  list: () => api.get('/memories'),
  create: (data) => api.post('/memories', data),
  update: (id, data) => api.put(`/memories/${id}`, data),
  delete: (id) => api.delete(`/memories/${id}`),
};

// Gallery API
export const galleryApi = {
  list: (params) => api.get('/gallery', { params }),
  getById: (id) => api.get(`/gallery/${id}`),
  rate: (id, rating) => api.post(`/gallery/${id}/rate`, { rating }),
  delete: (id) => api.delete(`/gallery/${id}`),
  resubmit: (id) => api.post(`/gallery/${id}/resubmit`),
  listAdmin: (params) => api.get('/gallery/admin/all', { params }),
};

// Timeline API
export const timelineApi = {
  getAirport: () => api.get('/timeline/airport'),
  createAirport: (data) => api.post('/timeline/airport', data),
  updateAirport: (id, data) => api.put(`/timeline/airport/${id}`, data),
  deleteAirport: (id) => api.delete(`/timeline/airport/${id}`),
  getSpotters: () => api.get('/timeline/spotters'),
  createSpotters: (data) => api.post('/timeline/spotters', data),
  updateSpotters: (id, data) => api.put(`/timeline/spotters/${id}`, data),
  deleteSpotters: (id) => api.delete(`/timeline/spotters/${id}`),
};

// Stats API
export const statsApi = {
  get: () => api.get('/stats'),
  update: (data) => api.put('/stats', data),
};

// Photos API
export const photosApi = {
  upload: (formData) => api.post('/photos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000, // 60 second timeout for uploads
  }),
  getMy: () => api.get('/photos/my'),
  getQueue: () => api.get('/photos/queue'),
};

// Ranking API
export const rankingApi = {
  get: () => api.get('/ranking'),
  getWeekly: () => api.get('/ranking/weekly'),
};

// Evaluation API
export const evaluationApi = {
  getQueue: () => api.get('/evaluation/queue'),
  evaluate: (photoId, data) => api.post(`/evaluation/${photoId}`, data),
};

// News API
export const newsApi = {
  list: (limit = 10) => api.get('/news', { params: { limit } }),
  getById: (id) => api.get(`/news/${id}`),
  create: (data) => api.post('/news', data),
  update: (id, data) => api.put(`/news/${id}`, data),
  delete: (id) => api.delete(`/news/${id}`),
  getDrafts: () => api.get('/news/drafts'),
  getAll: (limit = 50) => api.get('/news/all', { params: { limit } }),
};

// Members API
export const membersApi = {
  list: () => api.get('/members'),
  getById: (id) => api.get(`/members/${id}`),
  getHierarchy: () => api.get('/members/hierarchy'),
  search: (query) => api.get('/members/search', { params: { q: query } }),
  updateProfile: (data) => api.put('/members/profile', data),
};

// Notifications API
export const notificationsApi = {
  list: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

// Audit Logs API
export const logsApi = {
  list: (params) => api.get('/logs', { params }),
  getActions: () => api.get('/logs/actions'),
  getStats: () => api.get('/logs/stats'),
};

// Backup API
export const backupApi = {
  getStatus: () => api.get('/backup/status'),
  getHistory: (limit = 20) => api.get('/backup/history', { params: { limit } }),
  getConfig: () => api.get('/backup/config'),
  createGoogleDrive: () => api.post('/backup/google-drive', {}, { timeout: 120000 }),
  createManual: () => api.get('/backup/manual', { responseType: 'blob', timeout: 120000 }),
  listLocal: () => api.get('/backup/local'),
  downloadLocal: (filename) => api.get(`/backup/local/download/${filename}`, { responseType: 'blob' }),
  deleteLocal: (filename) => api.delete(`/backup/local/${filename}`),
  testEmail: () => api.post('/backup/test-email'),
  sendWeeklyReport: () => api.post('/backup/send-weekly-report'),
};

// Aircraft API
export const aircraftApi = {
  lookup: (registration) => api.get('/aircraft/anac_lookup', { params: { registration } }),
  quickLookup: (registration) => api.get(`/aircraft/quick_lookup/${registration}`),
};

export default api;
