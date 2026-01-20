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
};

// ====================== SETTINGS ======================
export const settingsApi = {
  get: () => api.get(`/settings`),
  update: (payload) => api.put(`/settings`, payload),
};

// ====================== GALLERY ======================
export const galleryApi = {
  list: (params = {}) => api.get(`/gallery`, { params }),
  getOne: (photoId) => api.get(`/gallery/${encodeURIComponent(photoId)}`),
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

  getOne: (eventId) => api.get(`/events/${encodeURIComponent(eventId)}`),

  getResults: (eventId) =>
    api.get(`/events/${encodeURIComponent(eventId)}/results`),

  checkPermission: (eventId) =>
    api.get(`/events/${encodeURIComponent(eventId)}/check-permission`),

  vote: (eventId, voteData) =>
    api.post(`/events/${encodeURIComponent(eventId)}/vote`, voteData),
};

// ====================== MEMBERS ======================
export const membersApi = {
  list: () => api.get(`/members`),
  getOne: (userId) => api.get(`/members/${encodeURIComponent(userId)}`),
};

// ====================== NOTIFICATIONS ======================
export const notificationsApi = {
  list: () => api.get(`/notifications`),
  count: () => api.get(`/notifications/count`),
};

// ====================== NEWS ======================
export const newsApi = {
  list: (limit = 10) => api.get(`/news`, { params: { limit } }),
};

// ====================== AUTH ======================
export const authApi = {
  me: () => api.get(`/auth/me`),
  login: (payload) => api.post(`/auth/login`, payload),
  logout: () => api.post(`/auth/logout`),
};

export default api;
