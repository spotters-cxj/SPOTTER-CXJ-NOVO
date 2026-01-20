// frontend/src/services/api.js
import axios from "axios";

/**
 * REGRAS DE URL (IMPORTANTÍSSIMO):
 * - Em PRODUÇÃO (spotterscxj.com.br / www): SEMPRE usa o MESMO domínio do site (window.location.origin)
 *   => evita CORS e evita Cloudflare 520 no host de deploy
 * - Em DEV/local: permite VITE_BACKEND_URL ou VITE_API_URL
 *
 * VITE_API_URL: ex "http://localhost:8001/api"
 * VITE_BACKEND_URL: ex "http://localhost:8001" (sem /api)
 */

const isBrowser = typeof window !== "undefined";
const ORIGIN = isBrowser ? window.location.origin : "";

const normalizeNoSlash = (url) => (url || "").replace(/\/+$/, "");
const normalizeApi = (url) => normalizeNoSlash(url) + "/api";

// Vite env (não use process.env no Vite)
const ENV_API_URL = normalizeNoSlash(import.meta?.env?.VITE_API_URL);
const ENV_BACKEND_URL = normalizeNoSlash(import.meta?.env?.VITE_BACKEND_URL);

// Detecta produção no teu domínio real
const isProdDomain =
  ORIGIN.includes("spotterscxj.com.br") || ORIGIN.includes("www.spotterscxj.com.br");

// BACKEND_URL final:
// - se estiver no spotterscxj.com.br => FORÇA o ORIGIN
// - senão (dev) => usa ENV_BACKEND_URL ou vazio
const BACKEND_URL = isProdDomain ? ORIGIN : (ENV_BACKEND_URL || "");

// API_BASE_URL final:
// - se ENV_API_URL existir, usa ela (dev)
// - senão, se BACKEND_URL existir => BACKEND_URL + /api
// - fallback: "" (vai quebrar, mas evita apontar pro deploy)
const API_BASE_URL = ENV_API_URL || (BACKEND_URL ? normalizeApi(BACKEND_URL) : "");

// Debug no console (igual aparece no teu print)
export const API_CONFIG = {
  API: API_BASE_URL,
  BACKEND_URL,
  env_api: ENV_API_URL,
  env_backend: ENV_BACKEND_URL,
  origin: ORIGIN,
  isProdDomain,
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
