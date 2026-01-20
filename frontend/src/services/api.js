import axios from "axios";

/**
 * Spotters CXJ - API Client (Vite)
 * - Usa VITE_BACKEND_URL quando existir
 * - Fallback para o domínio atual (window.location.origin)
 * - Base da API: `${BACKEND_URL}/api`
 */

// Remove barra final
const normalizeBase = (url) => String(url || "").replace(/\/$/, "");

// Vite env
const ENV_BACKEND =
  typeof import.meta !== "undefined" &&
  import.meta.env &&
  import.meta.env.VITE_BACKEND_URL
    ? normalizeBase(import.meta.env.VITE_BACKEND_URL)
    : "";

// fallback = domínio atual do site
const FALLBACK_ORIGIN =
  typeof window !== "undefined" ? normalizeBase(window.location.origin) : "";

// BACKEND_URL final (prioriza env)
export const BACKEND_URL = ENV_BACKEND || FALLBACK_ORIGIN;

// API base
export const API_BASE = `${BACKEND_URL}/api`;

// Axios instance
export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // necessário se você usa cookie/sessão
  timeout: 30000,
});

// Debug rápido (aparece no console)
if (typeof window !== "undefined") {
  window.__SPOTTERS_API__ = { BACKEND_URL, API_BASE };
  // eslint-disable-next-line no-console
  console.log("API Configuration:", { BACKEND_URL, API_BASE, origin: window.location.origin });
}

// Helper: garante que upload (form) não quebre
const jsonHeaders = { "Content-Type": "application/json" };

// ======================= PAGES =======================
export const pagesApi = {
  getPage: (slug) => api.get(`/pages/${encodeURIComponent(slug)}`),
};

// ======================= SETTINGS =======================
export const settingsApi = {
  get: () => api.get(`/settings`),
};

// ======================= GALLERY =======================
export const galleryApi = {
  // lista pública (aprovadas)
  list: (params = {}) => api.get(`/gallery`, { params }),
  // detalhes (se existir no backend)
  getById: (photo_id) => api.get(`/gallery/${encodeURIComponent(photo_id)}`),
};

// ======================= STATS =======================
export const statsApi = {
  get: () => api.get(`/stats`),
};

// ======================= RANKING =======================
export const rankingApi = {
  // Top fotógrafos
  getUsers: (limit = 50) => api.get(`/ranking/users`, { params: { limit } }),

  // Ranking de fotos (público)
  getPhotos: (limit = 50) => api.get(`/ranking/photos`, { params: { limit } }),

  // Pódio
  getPodium: () => api.get(`/ranking/podium`),

  // Top 3 fotos
  getTop3: () => api.get(`/ranking/top3`),
};

// ======================= NEWS =======================
export const newsApi = {
  list: (limit = 10) => api.get(`/news`, { params: { limit } }),
  getById: (id) => api.get(`/news/${encodeURIComponent(id)}`),
};

// ======================= AUTH =======================
export const authApi = {
  me: () => api.get(`/auth/me`),
  login: (payload) => api.post(`/auth/login`, payload, { headers: jsonHeaders }),
  logout: () => api.post(`/auth/logout`),
  register: (payload) => api.post(`/auth/register`, payload, { headers: jsonHeaders }),
};

// ======================= MEMBERS =======================
export const membersApi = {
  list: () => api.get(`/members`),
  getById: (user_id) => api.get(`/members/${encodeURIComponent(user_id)}`),
};

// ======================= EVENTS =======================
export const eventsApi = {
  // include_ended false por padrão
  list: (includeEnded = false) =>
    api.get(`/events`, { params: { include_ended: includeEnded } }),

  getById: (event_id) => api.get(`/events/${encodeURIComponent(event_id)}`),

  getResults: (event_id) =>
    api.get(`/events/${encodeURIComponent(event_id)}/results`),

  vote: (event_id, voteData) =>
    api.post(`/events/${encodeURIComponent(event_id)}/vote`, voteData, {
      headers: jsonHeaders,
    }),

  checkPermission: (event_id) =>
    api.get(`/events/${encodeURIComponent(event_id)}/check-permission`),

  // Admin (gestao+)
  adminListAll: () => api.get(`/events/admin/all`),
  adminCreate: (payload) => api.post(`/events`, payload, { headers: jsonHeaders }),
  adminUpdate: (event_id, payload) =>
    api.put(`/events/${encodeURIComponent(event_id)}`, payload, {
      headers: jsonHeaders,
    }),
  adminDelete: (event_id) =>
    api.delete(`/events/${encodeURIComponent(event_id)}`),

  adminAvailablePhotos: () => api.get(`/events/photos/available`),
  adminVotes: (event_id) =>
    api.get(`/events/${encodeURIComponent(event_id)}/votes`),
};

// ======================= EXPORT DEFAULT (opcional) =======================
export default api;
