// API client for the admin panel. Base URL comes from VITE_API_URL (.env).
const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(
  /\/$/,
  ""
);

const TOKEN_KEY = "ddd_admin_token";
export const getToken = () => localStorage.getItem(TOKEN_KEY) || "";
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function request(path, { method = "GET", body, isForm } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (isForm) {
    payload = body; // FormData — let the browser set the multipart boundary
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const res = await fetch(API_URL + path, { method, headers, body: payload });

  if (res.status === 401 && !path.endsWith("/auth/login")) {
    clearToken();
    if (!location.hash.startsWith("#/login")) location.hash = "#/login";
  }

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  url: API_URL,

  // auth
  login: (email, password) =>
    request("/api/auth/login", { method: "POST", body: { email, password } }),
  me: () => request("/api/auth/me"),

  // categories
  getCategories: () => request("/api/categories"),
  createCategory: (data) =>
    request("/api/categories", { method: "POST", body: data }),
  updateCategory: (id, data) =>
    request(`/api/categories/${id}`, { method: "PUT", body: data }),
  deleteCategory: (id) =>
    request(`/api/categories/${id}`, { method: "DELETE" }),

  // products (multipart for image upload)
  getProducts: () => request("/api/products"),
  createProduct: (formData) =>
    request("/api/products", { method: "POST", body: formData, isForm: true }),
  updateProduct: (id, formData) =>
    request(`/api/products/${id}`, { method: "PUT", body: formData, isForm: true }),
  deleteProduct: (id) =>
    request(`/api/products/${id}`, { method: "DELETE" }),

  // settings
  getSettings: () => request("/api/settings"),
  updateSettings: (data) =>
    request("/api/settings", { method: "PUT", body: data }),

  // orders + analytics
  getOrders: () => request("/api/orders"),
  getAnalytics: () => request("/api/analytics"),
};
