// frontend/src/services/api.js
import axios from "axios";

/**
 * Resolve BASE URL da API:
 * - Em produção (spotterscxj.com.br): usa o mesmo domínio do site (window.location.origin)
 * - Em dev: permite REACT_APP_BACKEND_URL / REACT_APP_API_URL
 */
const isBrowser = typeof window !== "undefined";

const getOrigin = () => {
  if (!isBrowser) return "";
  return window.location.origin; // ex: https://spotterscxj.com.br
};

const normalizeNoSlash = (url) => (url || "").replace(/\/+$/, "");
const normalizeApi = (url) => normalizeNoSlash(url) + "/api";

// Prioridade:
// 1) REACT_APP_API_URL (se você quiser setar direto .../api)
// 2) REACT_APP_BACKEND_URL (sem /api)
// 3) window.location.origin (em prod)
// 4) fallback vazio
const ENV_API_URL = normalizeNoSlash(process.env.REACT_APP_API_URL);
const ENV_BACKEND_URL = normalizeNoSlash(process.env.REACT_APP_BACKEND_URL);

const ORIGIN = getOrigin();
const BACKEND_URL =
  ENV_BACKEND_URL ||
  (ORIGIN && !ORIGIN.includes("localhost") ? ORIGIN : "");

const API_BASE_URL =
  ENV_API_URL ||
  (BACKEND_URL ? normalizeApi(BACKEND_URL) : "");

// Debug (vai aparecer no console como no teu print)
export const API_CONFIG = {
  API: API_BASE_URL,
  BACKEND_URL,
  env_api: ENV_API_URL,
  env_backend: ENV_BACKEND_URL,
  origin: ORIGIN,
};

if (isBrowser) {
  // eslint-disable-next-line no-console
  console.log("API Configuration:", API_CONFIG);
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Anexa token se existir
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (e) {
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
// Corrige teu erro: "getPodium is not a function"
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

// ====================== MEMBERS (se teu site usa) ======================
export const membersApi = {
  list: () => api.get(`/members`),
  getOne: (userId) => api.get(`/members/${encodeURIComponent(userId)}`),
};

// ====================== NOTIFICATIONS (se teu site usa) ======================
export const notificationsApi = {
  list: () => api.get(`/notifications`),
  count: () => api.get(`/notifications/count`),
};

// ====================== NEWS (se teu site usa) ======================
export const newsApi = {
  list: (limit = 10) => api.get(`/news`, { params: { limit } }),
};

// ====================== AUTH (se teu site usa) ======================
export const authApi = {
  me: () => api.get(`/auth/me`),
  login: (payload) => api.post(`/auth/login`, payload),
  logout: () => api.post(`/auth/logout`),
};

export default api;
