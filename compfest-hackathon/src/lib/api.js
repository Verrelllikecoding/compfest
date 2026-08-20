const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";

async function request(path, { method = "GET", body, accessToken, headers = {} } = {}) {
  const finalHeaders = { "Content-Type": "application/json", ...headers };
  if (accessToken) finalHeaders.Authorization = `Bearer ${accessToken}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: finalHeaders,
    credentials: "include", // wajib — biar cookie refreshToken ikut terkirim & tersimpan
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || `Request gagal (${res.status})`);
  }
  return data;
}

export const authApi = {
  register: (payload) => request("/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  refresh: () => request("/auth/refresh", { method: "POST" }),
  logout: (accessToken) => request("/auth/logout", { method: "POST", accessToken }),
  me: (accessToken) => request("/users/me", { accessToken }),
};

export const warehouseApi = {
  list: (accessToken) => request("/warehouses", { accessToken }),
  products: (warehouseId, accessToken) =>
    request(`/warehouses/${warehouseId}/products`, { accessToken }),
  lowStock: (accessToken) => request("/products/low-stock", { accessToken }),
  createMovement: (productId, payload, accessToken) =>
    request(`/products/${productId}/movements`, { method: "POST", body: payload, accessToken }),
};

export { request };