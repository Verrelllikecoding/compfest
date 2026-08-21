const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";

async function request(
  path,
  { method = "GET", body, accessToken, headers = {} } = {}
) {
  const finalHeaders = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (accessToken) {
    finalHeaders.Authorization = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: finalHeaders,
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
  const error = new Error(
    data.message ||
      `Request gagal (${res.status})`
  );

  error.status = res.status;
  error.data = data;

  throw error;
  }

  return data;
  }

/* =========================================================
   AUTH API
========================================================= */

export const authApi = {
  register: (payload) =>
    request("/auth/register", {
      method: "POST",
      body: payload,
    }),

  login: (payload) =>
    request("/auth/login", {
      method: "POST",
      body: payload,
    }),

  refresh: () =>
    request("/auth/refresh", {
      method: "POST",
    }),

  logout: (accessToken) =>
    request("/auth/logout", {
      method: "POST",
      accessToken,
    }),

  me: (accessToken) =>
    request("/users/me", {
      accessToken,
    }),
};

/* =========================================================
   WAREHOUSE API
========================================================= */

export const warehouseApi = {
  // Ambil seluruh warehouse
  list: (accessToken) =>
    request("/warehouses", {
      accessToken,
    }),

  // Buat warehouse baru
  create: (payload, accessToken) =>
    request("/warehouses", {
      method: "POST",
      body: payload,
      accessToken,
    }),

  // Ambil produk berdasarkan warehouse
  products: (warehouseId, accessToken) =>
    request(`/warehouses/${warehouseId}/products`, {
      accessToken,
    }),

  // Tambahkan produk baru ke warehouse
  createProduct: (warehouseId, payload, accessToken) =>
    request(`/warehouses/${warehouseId}/products`, {
      method: "POST",
      body: payload,
      accessToken,
    }),

  // Ambil semua produk low stock
  lowStock: (accessToken) =>
    request("/products/low-stock", {
      accessToken,
    }),

  // Catat Stock In / Stock Out / Adjustment
  createMovement: (productId, payload, accessToken) =>
    request(`/products/${productId}/movements`, {
      method: "POST",
      body: payload,
      accessToken,
    }),

  // Ambil riwayat movement dari sebuah produk
  movements: (productId, accessToken) =>
    request(`/products/${productId}/movements`, {
      accessToken,
    }),
};

/* =========================================================
   ROUTE OPTIMIZATION API
========================================================= */

export const routeApi = {
  // Ambil data pendukung untuk membuat route
  // pending orders, vehicles, drivers
  options: (accessToken) =>
    request("/routes/options", {
      accessToken,
    }),

  // Ambil seluruh route
  list: (accessToken) =>
    request("/routes", {
      accessToken,
    }),

  // Ambil detail satu route
  detail: (routeId, accessToken) =>
    request(`/routes/${routeId}`, {
      accessToken,
    }),

  // Generate route baru
  generate: (payload, accessToken) =>
    request("/routes/generate", {
      method: "POST",
      body: payload,
      accessToken,
    }),

  // Re-optimize route yang sudah ada
  reoptimize: (routeId, accessToken) =>
    request(`/routes/${routeId}/reoptimize`, {
      method: "POST",
      accessToken,
    }),

  // Update status route
  updateStatus: (routeId, status, accessToken) =>
    request(`/routes/${routeId}/status`, {
      method: "PATCH",
      body: { status },
      accessToken,
    }),

  // Update status salah satu stop
  updateStopStatus: (routeId, stopId, status, accessToken) =>
    request(`/routes/${routeId}/stops/${stopId}/status`, {
      method: "PATCH",
      body: { status },
      accessToken,
    }),
};

export const userApi = {
  assignees: (accessToken) =>
    request("/users/assignees", {
      accessToken,
    }),
};

export const scheduleApi = {
  list: (accessToken, params = {}) => {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query.append(key, value);
      }
    });

    const queryString = query.toString();

    return request(
      `/schedules${queryString ? `?${queryString}` : ""}`,
      { accessToken }
    );
  },

  calendar: (accessToken, startDate, endDate) => {
    const query = new URLSearchParams();

    if (startDate) {
      query.append("startDate", startDate);
    }

    if (endDate) {
      query.append("endDate", endDate);
    }

    const queryString = query.toString();

    return request(
      `/schedules/calendar${queryString ? `?${queryString}` : ""}`,
      { accessToken }
    );
  },

  getById: (id, accessToken) =>
    request(`/schedules/${id}`, {
      accessToken,
    }),

  create: (payload, accessToken) =>
    request("/schedules", {
      method: "POST",
      body: payload,
      accessToken,
    }),

  update: (id, payload, accessToken) =>
    request(`/schedules/${id}`, {
      method: "PATCH",
      body: payload,
      accessToken,
    }),

  remove: (id, accessToken) =>
    request(`/schedules/${id}`, {
      method: "DELETE",
      accessToken,
    }),

    recommendSlot: (
  payload,
  accessToken
) =>
  request(
    "/schedules/recommend-slot",
    {
      method: "POST",
      body: payload,
      accessToken,
    }
  ),

  recommendBestSlot: (
  payload,
  accessToken
) =>
  request(
    "/schedules/recommend-best-slot",
    {
      method: "POST",
      body: payload,
      accessToken,
    }
  ),
};

export { request };