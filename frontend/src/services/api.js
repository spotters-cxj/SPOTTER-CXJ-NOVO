// frontend/src/services/api.js
import axios from "axios";

/**
 * ✅ Objetivo:
 * - SEMPRE usar o mesmo domínio do site (window.location.origin) em produção
 * - Evitar CORS chamando deploy-app-22.emergent.host
 * - Permitir override opcional via VITE_BACKEND_URL (somente se você quiser)
 *
 * Resultado final:
 * API_BASE = https://spotterscxj.com.br/api
 */

const isBrowser = typeof window !== "undefined";

const normalizeNoSlash = (url) => (url || "").replace(/\/+$/, "");
const buildApiBase = (base) => `${normalizeNoSlash(base)}/api`;

// Vite env (não quebra build)
const VITE_BACKEND_URL =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_BACKEND_URL) ||
  "";

// Prioridade:
// 1) VITE_BACKEND_URL (se você quiser forçar)
// 2) window.location.origin (padrão absoluto em produção)
// 3) fallback vazio (SSR)
const ORIGIN = isBrowser ? window.location.origin : "";
const BACKEND_URL = normalizeNoSlash(VITE_BACKEND_URL) || normalizeNoSlash(ORIGIN);
const API_BASE_URL = buildApiBase(BACKEND_URL);

export const API_CONFIG = {
  ORIGIN,
  BACKEND_URL,
  API: API_BASE_URL,
  VITE_BACKEND_URL: normalizeNoSlash(VITE_BACKEND_URL),
};

if (isBrowser) {
  // eslint-disable-next-line no-console
  console.log("API Configuration:", API_CONFIG);
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// Token (se você usa)
api.interceptors.request.use((config) => {
  try {
    const token =
      localStorage.getItem("auth_token") ||
      localStorage.getItem("session_token") ||
      localStorage.getItem("token");

    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // ignore
  }
  return config;
});

// ====================== PAGES ======================
export const pagesApi = {
  getPage: (slug) => api.get(`/pages/${encodeURIComponent(slug)}`),
  updatePage: (slug, data) => api.put(`/pages/${encodeURIComponent(slug)}`, data),
  listPages: () => api.get(`/pages`),
};

// ====================== SETTINGS ======================
export const settingsApi = {
  get: () => api.get(`/settings`),
  update: (data) => api.put(`/settings`, data),
};

// ====================== GALLERY ======================
export const galleryApi = {
  list: (params = {}) => api.get(`/gallery`, { params }),
  getById: (id) => api.get(`/gallery/${encodeURIComponent(id)}`),
  rate: (id, rating) => api.post(`/gallery/${encodeURIComponent(id)}/rate`, { rating }),
  delete: (id) => api.delete(`/gallery/${encodeURIComponent(id)}`),
};

// ====================== STATS ======================
export const statsApi = {
  get: () => api.get(`/stats`),
  update: (data) => api.put(`/stats`, data),
};

// ====================== RANKING ======================
// ✅ Corrige: getPodium/getPhotos/getUsers existem aqui
// (mantém compatível com o backend que você já tinha)
export const rankingApi = {
  get: () => api.get(`/ranking`),
  getWeekly: () => api.get(`/ranking/weekly`),
  getPhotos: (limit = 50) => api.get(`/ranking`, { params: { limit } }),
  getUsers: (limit = 50) => api.get(`/ranking/users`, { params: { limit } }),
  getPodium: () => api.get(`/ranking/podium`),
  getTop3: () => api.get(`/ranking/top3`),
};

// ====================== EVENTS ======================
// (Front pronto; se /api/events der Not Found, é backend/rota não publicada -> ETAPA 2)
export const eventsApi = {
  list: (includeEnded = false) =>
    api.get(`/events`, { params: { include_ended: includeEnded } }),

  getById: (id) => api.get(`/events/${encodeURIComponent(id)}`),

  getResults: (id) => api.get(`/events/${encodeURIComponent(id)}/results`),

  checkPermission: (id) => api.get(`/events/${encodeURIComponent(id)}/check-permission`),

  vote: (id, data) => api.post(`/events/${encodeURIComponent(id)}/vote`, data),

  // admin
  listAll: () => api.get(`/events/admin/all`),
  create: (data) => api.post(`/events`, data),
  update: (id, data) => api.put(`/events/${encodeURIComponent(id)}`, data),
  delete: (id) => api.delete(`/events/${encodeURIComponent(id)}`),
  getAvailablePhotos: () => api.get(`/events/photos/available`),
};

// ====================== MEMBERS ======================
export const membersApi = {
  list: () => api.get(`/members`),
  getById: (id) => api.get(`/members/${encodeURIComponent(id)}`),
};

// ====================== NOTIFICATIONS ======================
export const notificationsApi = {
  list: () => api.get(`/notifications`),
  count: () => api.get(`/notifications/count`),
  markRead: (id) => api.put(`/notifications/${encodeURIComponent(id)}/read`),
  markAllRead: () => api.put(`/notifications/read-all`),
};

// ====================== NEWS ======================
export const newsApi = {
  list: (limit = 10) => api.get(`/news`, { params: { limit } }),
  getById: (id) => api.get(`/news/${encodeURIComponent(id)}`),
};

// ====================== AUTH ======================
export const authApi = {
  getMe: () => api.get(`/auth/me`),
  login: (data) => api.post(`/auth/login`, data),
  logout: () => api.post(`/auth/logout`),
  register: (data) => api.post(`/auth/register`, data),
};

export default api;
