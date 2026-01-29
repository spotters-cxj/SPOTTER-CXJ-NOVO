// frontend/src/services/api.js
import axios from "axios";

/**
 * REGRAS DE URL (IMPORTANTÍSSIMO):
 * - Em PRODUÇÃO e PREVIEW: SEMPRE usa window.location.origin + /api
 *   => evita CORS e problemas com Cloudflare
 * - Isso funciona para:
 *   - spotterscxj.com.br (produção final)
 *   - *.emergent.host (preview)
 *   - *.emergentagent.com (preview)
 *   - localhost (desenvolvimento)
 */

const isBrowser = typeof window !== "undefined";
const ORIGIN = isBrowser ? window.location.origin : "";

const normalizeNoSlash = (url) => (url || "").replace(/\/+$/, "");

// Em TODOS os ambientes (produção, preview, localhost) usa o MESMO domínio
// O backend está no mesmo domínio/host, só muda a rota (/api/...)
const API_BASE_URL = ORIGIN ? `${normalizeNoSlash(ORIGIN)}/api` : "/api";

// Debug no console
export const API_CONFIG = {
  API: API_BASE_URL,
  ORIGIN,
};

/**
 * Resolve URL de imagem/asset para URL completa
 * Usado para imagens que vêm do backend com path /api/uploads/...
 * @param {string} url - URL relativa ou absoluta
 * @returns {string} URL completa
 */
export const resolveImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/api")) return `${ORIGIN}${url}`;
  return url;
};

if (isBrowser) {
  // eslint-disable-next-line no-console
  console.log("API:", API_BASE_URL);
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// Anexa token se existir
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {
    // ignore
  }
  return config;
});

// ====================== PAGES ======================
export const pagesApi = {
  getPage: (slug) => api.get(`/pages/${encodeURIComponent(slug)}`),
  updatePage: (slug, data) => api.put(`/pages/${encodeURIComponent(slug)}`, data),
};

// ====================== SETTINGS ======================
export const settingsApi = {
  get: () => api.get(`/settings`),
  update: (payload) => api.put(`/settings`, payload),
};

// ====================== GALLERY ======================
export const galleryApi = {
  list: (params = {}) => api.get(`/gallery`, { params }),
  listAdmin: (params = {}) => api.get(`/gallery/admin`, { params }),
  getOne: (photoId) => api.get(`/gallery/${encodeURIComponent(photoId)}`),
  delete: (photoId) => api.delete(`/gallery/${encodeURIComponent(photoId)}`),
  resubmit: (photoId) => api.post(`/gallery/${encodeURIComponent(photoId)}/resubmit`),
  upload: (formData) => api.post(`/photos`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 60000,
  }),
};

// ====================== PHOTOS ======================
export const photosApi = {
  list: (params = {}) => api.get(`/photos`, { params }),
  getOne: (photoId) => api.get(`/photos/${encodeURIComponent(photoId)}`),
  getQueue: () => api.get(`/photos/queue`),
  getMy: () => api.get(`/photos/my`),
  upload: (formData) => api.post(`/photos`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 60000,
  }),
  delete: (photoId) => api.delete(`/photos/${encodeURIComponent(photoId)}`),
  rate: (photoId, rating) => api.post(`/photos/${encodeURIComponent(photoId)}/rate`, { rating }),
  comment: (photoId, content) => api.post(`/photos/${encodeURIComponent(photoId)}/comment`, { content }),
};

// ====================== STATS ======================
export const statsApi = {
  get: () => api.get(`/stats`),
};

// ====================== RANKING ======================
export const rankingApi = {
  getPodium: () => api.get(`/ranking/podium`),
  getUsers: (limit = 50) => api.get(`/ranking/users`, { params: { limit } }),
  getPhotos: (limit = 50) => api.get(`/ranking/photos`, { params: { limit } }),
  getTop3: () => api.get(`/ranking/top3`),
};

// ====================== EVENTS ======================
export const eventsApi = {
  list: (includeEnded = false) =>
    api.get(`/events`, { params: { include_ended: includeEnded } }),
  listAll: () => api.get(`/events`, { params: { include_ended: true } }),
  getOne: (eventId) => api.get(`/events/${encodeURIComponent(eventId)}`),
  getResults: (eventId) =>
    api.get(`/events/${encodeURIComponent(eventId)}/results`),
  checkPermission: (eventId) =>
    api.get(`/events/${encodeURIComponent(eventId)}/check-permission`),
  vote: (eventId, voteData) =>
    api.post(`/events/${encodeURIComponent(eventId)}/vote`, voteData),
  create: (data) => api.post(`/events`, data),
  update: (eventId, data) => api.put(`/events/${encodeURIComponent(eventId)}`, data),
  delete: (eventId) => api.delete(`/events/${encodeURIComponent(eventId)}`),
  getAvailablePhotos: () => api.get(`/events/available-photos`),
};

// ====================== MEMBERS ======================
export const membersApi = {
  list: () => api.get(`/members`),
  getOne: (userId) => api.get(`/members/${encodeURIComponent(userId)}`),
  updateTags: (userId, tags) => api.put(`/members/${encodeURIComponent(userId)}/tags`, { tags }),
};

// ====================== NOTIFICATIONS ======================
export const notificationsApi = {
  list: () => api.get(`/notifications`),
  count: () => api.get(`/notifications/count`),
};

// ====================== NEWS ======================
export const newsApi = {
  list: (limit = 10) => api.get(`/news`, { params: { limit } }),
  getAll: (limit = 50) => api.get(`/news/all`, { params: { limit } }),
  create: (data) => api.post(`/news`, data),
  update: (newsId, data) => api.put(`/news/${encodeURIComponent(newsId)}`, data),
  delete: (newsId) => api.delete(`/news/${encodeURIComponent(newsId)}`),
  publish: (newsId) => api.post(`/news/${encodeURIComponent(newsId)}/publish`),
};

// ====================== AUTH ======================
export const authApi = {
  me: () => api.get(`/auth/me`),
  getMe: () => api.get(`/auth/me`),
  createSession: (sessionId) => api.post(`/auth/session`, { session_id: sessionId }),
  login: (payload) => api.post(`/auth/login`, payload),
  logout: () => api.post(`/auth/logout`),
};

// ====================== ADMIN ======================
export const adminApi = {
  getUsers: (params = {}) => api.get(`/admin/users`, { params }),
  getUser: (userId) => api.get(`/admin/users/${encodeURIComponent(userId)}`),
  updateUser: (userId, data) => api.put(`/admin/users/${encodeURIComponent(userId)}`, data),
  deleteUser: (userId) => api.delete(`/admin/users/${encodeURIComponent(userId)}`),
  updateRole: (userId, role) => api.put(`/admin/users/${encodeURIComponent(userId)}/role`, { role }),
  getPendingApprovals: () => api.get(`/admin/pending`),
  approveUser: (userId) => api.post(`/admin/users/${encodeURIComponent(userId)}/approve`),
  rejectUser: (userId) => api.post(`/admin/users/${encodeURIComponent(userId)}/reject`),
};

// ====================== LEADERS ======================
export const leadersApi = {
  list: () => api.get(`/leaders`),
  create: (data) => api.post(`/leaders`, data),
  update: (leaderId, data) => api.put(`/leaders/${encodeURIComponent(leaderId)}`, data),
  delete: (leaderId) => api.delete(`/leaders/${encodeURIComponent(leaderId)}`),
};

// ====================== MEMORIES ======================
export const memoriesApi = {
  list: () => api.get(`/memories`),
  create: (data) => api.post(`/memories`, data),
  update: (memoryId, data) => api.put(`/memories/${encodeURIComponent(memoryId)}`, data),
  delete: (memoryId) => api.delete(`/memories/${encodeURIComponent(memoryId)}`),
};

// ====================== TIMELINE ======================
export const timelineApi = {
  list: () => api.get(`/timeline`),
  getAirport: () => api.get(`/timeline/airport`),
  getSpotters: () => api.get(`/timeline/spotters`),
  create: (data) => api.post(`/timeline`, data),
  update: (eventId, data) => api.put(`/timeline/${encodeURIComponent(eventId)}`, data),
  delete: (eventId) => api.delete(`/timeline/${encodeURIComponent(eventId)}`),
  createAirportItem: (data) => api.post(`/timeline/airport`, data),
  updateAirportItem: (itemId, data) => api.put(`/timeline/airport/${encodeURIComponent(itemId)}`, data),
  deleteAirportItem: (itemId) => api.delete(`/timeline/airport/${encodeURIComponent(itemId)}`),
  createSpottersItem: (data) => api.post(`/timeline/spotters`, data),
  updateSpottersItem: (itemId, data) => api.put(`/timeline/spotters/${encodeURIComponent(itemId)}`, data),
  deleteSpottersItem: (itemId) => api.delete(`/timeline/spotters/${encodeURIComponent(itemId)}`),
};

// ====================== LOGS ======================
export const logsApi = {
  list: (params = {}) => api.get(`/logs`, { params }),
  getActions: () => api.get(`/logs/actions`),
  getStats: () => api.get(`/logs/stats`),
};

// ====================== EVALUATION ======================
export const evaluationApi = {
  getQueue: () => api.get(`/evaluation/queue`),
  getPhoto: (photoId) => api.get(`/evaluation/${encodeURIComponent(photoId)}`),
  submitEvaluation: (photoId, data) => api.post(`/evaluation/${encodeURIComponent(photoId)}`, data),
  skip: (photoId) => api.post(`/evaluation/${encodeURIComponent(photoId)}/skip`),
};

// ====================== BACKUP ======================
export const backupApi = {
  list: () => api.get(`/backup`),
  create: () => api.post(`/backup`),
  download: (backupId) => api.get(`/backup/${encodeURIComponent(backupId)}/download`, { responseType: 'blob' }),
  delete: (backupId) => api.delete(`/backup/${encodeURIComponent(backupId)}`),
  restore: (backupId) => api.post(`/backup/${encodeURIComponent(backupId)}/restore`),
  getStatus: () => api.get(`/backup/status`),
  getHistory: () => api.get(`/backup/history`),
  listLocal: () => api.get(`/backup/local`),
  createGoogleDrive: () => api.post(`/backup/google-drive`),
  createManual: () => api.post(`/backup/manual`),
  downloadLocal: (filename) => api.get(`/backup/local/${encodeURIComponent(filename)}/download`, { responseType: 'blob' }),
  deleteLocal: (filename) => api.delete(`/backup/local/${encodeURIComponent(filename)}`),
  testEmail: () => api.post(`/backup/test-email`),
  sendWeeklyReport: () => api.post(`/backup/weekly-report`),
};

export default api;
