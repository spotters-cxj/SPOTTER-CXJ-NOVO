import axios from 'axios';

// Sempre usar o mesmo domínio do site em produção.
// Isso evita CORS e evita puxar a URL do emergent host.
const BACKEND_URL =
  (typeof window !== 'undefined' && window.location.origin)
    ? window.location.origin
    : 'https://spotterscxj.com.br';

const normalizeBackendUrl = (url) => {
  try {
    const parsed = new URL(url);
    parsed.hostname = parsed.hostname.replace(/^www\./, '');
    return parsed.toString().replace(/\/$/, '');
  } catch (e) {
    return url;
  }
};

const API = `${normalizeBackendUrl(BACKEND_URL)}/api`;

if (typeof window !== 'undefined') {
  console.log('API Configuration:', {
    BACKEND_URL: normalizeBackendUrl(BACKEND_URL),
    API,
    origin: window.location.origin
  });
}

const api = axios.create({
  baseURL: API,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('auth_token') || localStorage.getItem('session_token');

    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    const newToken = response.headers?.['x-session-token'];
    if (newToken) localStorage.setItem('auth_token', newToken);
    return response;
  },
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || 'unknown';

    console.error('API Error:', {
      url,
      status,
      message: error?.message,
      data: error?.response?.data
    });

    if (status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('session_token');
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.includes('/auth') &&
        !window.location.pathname.includes('/login')
      ) {
        window.dispatchEvent(
          new CustomEvent('auth-error', { detail: { status, url } })
        );
      }
    }

    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  createSession: (sessionId) => api.post('/auth/session', { session_id: sessionId }),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

// Admin
export const adminApi = {
  getUsers: () => api.get('/admin/users'),
  updateUserRole: (userId, role) => api.put(`/admin/users/${userId}/role`, { role }),
  approveUser: (userId, approved) => api.put(`/admin/users/${userId}/approve`, { approved }),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  updateUserTags: (userId, tags) => api.put(`/admin/users/${userId}/tags`, { tags }),
};

// Pages
export const pagesApi = {
  getPage: (slug) => api.get(`/pages/${slug}`),
  updatePage: (slug, data) => api.put(`/pages/${slug}`, data),
  listPages: () => api.get('/pages'),
};

// Leaders
export const leadersApi = {
  list: () => api.get('/leaders'),
  create: (data) => api.post('/leaders', data),
  update: (id, data) => api.put(`/leaders/${id}`, data),
  delete: (id) => api.delete(`/leaders/${id}`),
};

// Settings
export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
};

// Memories
export const memoriesApi = {
  list: () => api.get('/memories'),
  create: (data) => api.post('/memories', data),
  update: (id, data) => api.put(`/memories/${id}`, data),
  delete: (id) => api.delete(`/memories/${id}`),
};

// Gallery (✅ adiciona getTypes e upload)
export const galleryApi = {
  list: (params) => api.get('/gallery', { params }),
  getById: (id) => api.get(`/gallery/${id}`),
  getTypes: () => api.get('/gallery/types'),
  upload: (formData) =>
    api.post('/gallery/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    }),
  rate: (id, rating) => api.post(`/gallery/${id}/rate`, { rating }),
  delete: (id) => api.delete(`/gallery/${id}`),
  resubmit: (id) => api.post(`/gallery/${id}/resubmit`),
  listAdmin: (params) => api.get('/gallery/admin/all', { params }),
};

// Timeline
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

// Stats
export const statsApi = {
  get: () => api.get('/stats'),
  update: (data) => api.put('/stats', data),
};

// Photos
export const photosApi = {
  upload: (formData) =>
    api.post('/photos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    }),
  getMy: () => api.get('/photos/my'),
  getQueue: () => api.get('/photos/queue'),
};

// Ranking (✅ garante que existe getPodium e getPhotos)
export const rankingApi = {
  get: () => api.get('/ranking'),
  getWeekly: () => api.get('/ranking/weekly'),
  getPhotos: (limit = 50) => api.get('/ranking', { params: { limit } }),
  getUsers: (limit = 50) => api.get('/ranking/users', { params: { limit } }),
  getPodium: () => api.get('/ranking/podium'),
  getTop3: () => api.get('/ranking/top3'),
};

// Events
export const eventsApi = {
  list: (includeEnded = false) =>
    api.get('/events', { params: { include_ended: includeEnded } }),
  getById: (id) => api.get(`/events/${id}`),
  getResults: (id) => api.get(`/events/${id}/results`),
  checkPermission: (id) => api.get(`/events/${id}/check-permission`),
  vote: (id, data) => api.post(`/events/${id}/vote`, data),

  listAll: () => api.get('/events/admin/all'),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
  getAvailablePhotos: () => api.get('/events/photos/available'),
};

// Evaluation
export const evaluationApi = {
  getQueue: () => api.get('/evaluation/queue'),
  evaluate: (photoId, data) => api.post(`/evaluation/${photoId}`, data),
};

// News
export const newsApi = {
  list: (limit = 10) => api.get('/news', { params: { limit } }),
  getById: (id) => api.get(`/news/${id}`),
  create: (data) => api.post('/news', data),
  update: (id, data) => api.put(`/news/${id}`, data),
  delete: (id) => api.delete(`/news/${id}`),
  getDrafts: () => api.get('/news/drafts'),
  getScheduled: () => api.get('/news/scheduled'),
  getAll: (limit = 50) => api.get('/news/all', { params: { limit } }),
  publish: (id) => api.post(`/news/${id}/publish`),
};

// Members
export const membersApi = {
  list: () => api.get('/members'),
  getById: (id) => api.get(`/members/${id}`),
  getHierarchy: () => api.get('/members/hierarchy'),
  search: (query) => api.get('/members/search', { params: { q: query } }),
  updateProfile: (data) => api.put('/members/profile', data),
};

// Notifications
export const notificationsApi = {
  list: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

// Logs
export const logsApi = {
  list: (params) => api.get('/logs', { params }),
  getActions: () => api.get('/logs/actions'),
  getStats: () => api.get('/logs/stats'),
};

// Backup
export const backupApi = {
  getStatus: () => api.get('/backup/status'),
  getHistory: (limit = 20) => api.get('/backup/history', { params: { limit } }),
  getConfig: () => api.get('/backup/config'),
  createGoogleDrive: () => api.post('/backup/google-drive', {}, { timeout: 120000 }),
  createManual: () =>
    api.get('/backup/manual', { responseType: 'blob', timeout: 120000 }),
  listLocal: () => api.get('/backup/local'),
  downloadLocal: (filename) =>
    api.get(`/backup/local/download/${filename}`, { responseType: 'blob' }),
  deleteLocal: (filename) => api.delete(`/backup/local/${filename}`),
  testEmail: () => api.post('/backup/test-email'),
  sendWeeklyReport: () => api.post('/backup/send-weekly-report'),
};

// Aircraft
export const aircraftApi = {
  lookup: (registration) =>
    api.get('/aircraft/anac_lookup', { params: { registration } }),
  quickLookup: (registration) => api.get(`/aircraft/quick_lookup/${registration}`),
};

export default api;
