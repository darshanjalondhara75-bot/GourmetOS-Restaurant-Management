const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "");

// Browser clients must use the Next.js proxy when the app is opened remotely.
// A localhost API URL works only on the development machine, not on a phone.
const API_BASE_URL = configuredApiUrl &&
  !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(configuredApiUrl)
  ? configuredApiUrl
  : "";


const TOKEN_KEY = "restaurant_access_token";
const REFRESH_TOKEN_KEY = "restaurant_refresh_token";
const TOKEN_TIME_KEY = "restaurant_token_timestamp";
const SERVER_SESSION_KEY = "restaurant_server_session";

export const getServerSessionId = async (): Promise<string | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/`, { cache: "no-store" });
    if (!response.ok) return null;
    const data = await response.json();
    return typeof data.session_id === "string" ? data.session_id : null;
  } catch {
    return null;
  }
};

export const getStoredServerSessionId = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SERVER_SESSION_KEY);
};

export const setStoredServerSessionId = (sessionId: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(SERVER_SESSION_KEY, sessionId);
  }
};

export async function connectRealtimeUpdates(
  signal: AbortSignal,
  onActivity: (activity: { resource: string }) => void
): Promise<void> {
  let retryDelay = 1000;

  while (!signal.aborted) {
    try {
      let token = getToken();
      if (token && getTokenRemainingSeconds() < 15) {
        token = (await refreshAccessToken()) || token;
      }
      if (!token) throw new Error("Authentication is required for live updates.");

      let response = await fetch(`${API_BASE_URL}/api/v1/realtime/events`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
        signal,
      });

      if (response.status === 401) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          response = await fetch(`${API_BASE_URL}/api/v1/realtime/events`, {
            headers: { Authorization: `Bearer ${refreshed}` },
            cache: "no-store",
            signal,
          });
        }
      }
      if (!response.ok || !response.body) {
        throw new Error(`Live update connection failed (${response.status}).`);
      }

      retryDelay = 1000;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (!signal.aborted) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split(/\r?\n\r?\n/);
        buffer = events.pop() || "";
        for (const event of events) {
          if (event.split(/\r?\n/).some((line) => line === "event: activity")) {
            const dataLine = event.split(/\r?\n/).find((line) => line.startsWith("data: "));
            if (dataLine) {
              try {
                onActivity(JSON.parse(dataLine.slice(6)) as { resource: string });
              } catch (error) {
                console.error("Invalid live update event received.", error);
              }
            }
          }
        }
      }
      if (!signal.aborted) throw new Error("Live update connection closed.");
    } catch (error) {
      if (signal.aborted) return;
      console.warn("Live updates disconnected; retrying.", error);
      await new Promise<void>((resolve) => {
        let timer: number;
        const handleAbort = () => {
          window.clearTimeout(timer);
          resolve();
        };
        timer = window.setTimeout(() => {
          signal.removeEventListener("abort", handleAbort);
          resolve();
        }, retryDelay);
        signal.addEventListener("abort", handleAbort, { once: true });
      });
      retryDelay = Math.min(retryDelay * 2, 15000);
    }
  }
}

// Token Helpers
export const getToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
};

export const getRefreshToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }
  return null;
};

export const setToken = (accessToken: string, refreshToken?: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    localStorage.setItem(TOKEN_TIME_KEY, Date.now().toString());
  }
};

export const removeToken = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_TIME_KEY);
  }
};

// Token lifespan in seconds — must match backend ACCESS_TOKEN_EXPIRE_SECONDS
const ACCESS_TOKEN_EXPIRE_SECONDS = 60;

export const getTokenRemainingSeconds = (): number => {
  if (typeof window !== "undefined") {
    const timestampStr = localStorage.getItem(TOKEN_TIME_KEY);
    if (!timestampStr) return 0;
    const elapsedSeconds = Math.floor((Date.now() - parseInt(timestampStr, 10)) / 1000);
    const remaining = ACCESS_TOKEN_EXPIRE_SECONDS - elapsedSeconds;
    return remaining > 0 ? remaining : 0;
  }
  return 0;
};

let refreshingPromise: Promise<string | null> | null = null;

// Safe JSON parser helper to avoid SyntaxError: Unexpected token 'I' (e.g. 500 Internal Server Error text)
async function parseResponseJson(response: Response): Promise<any> {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    if (!response.ok) {
      throw new Error(`Server error (${response.status}): ${text.substring(0, 100) || response.statusText || "Internal Server Error"}`);
    }
    throw new Error("Invalid JSON response received from server.");
  }
}

// Auto Refresh Function
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  if (refreshingPromise) {
    return refreshingPromise;
  }

  refreshingPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!res.ok) return null;

      const data = await parseResponseJson(res);
      if (data.access_token) {
        setToken(data.access_token, data.refresh_token || refreshToken);
        return data.access_token;
      }
    } catch (err) {
      console.error("Failed to refresh token", err);
    }
    return null;
  })().finally(() => {
    refreshingPromise = null;
  });

  return refreshingPromise;
}

// Generic Fetch Wrapper with Auto-Refresh
async function fetchWithAuth<T>(url: string, options: RequestInit = {}): Promise<T> {
  let token = getToken();

  // Proactively refresh token if it has < 15 seconds remaining.
  // This prevents concurrent dashboard polls from all hitting a 401
  // at the same time and cascading into 500 errors.
  if (token && getTokenRemainingSeconds() < 15) {
    const refreshed = await refreshAccessToken();
    if (refreshed) token = refreshed;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;
  for (let attempt = 0; ; attempt += 1) {
    try {
      response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers,
        cache: "no-store",
      });
    } catch (error) {
      if (attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, 350));
        continue;
      }
      throw error;
    }

    if (response.status >= 500 && attempt === 0) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      continue;
    }
    break;
  }

  // Reactive fallback: if still 401 after proactive refresh, try once more
  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers,
      });
    }
  }

  const data = await parseResponseJson(response);

  if (!response.ok) {
    if (response.status === 401) {
      removeToken();
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.startsWith("/login") &&
        !window.location.pathname.startsWith("/customer")
      ) {
        window.location.href = "/login";
      }
    }
    throw new Error(data.detail || data.message || `API request failed (${response.status})`);
  }

  return data as T;
}

// Interfaces
export interface RestaurantUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "cashier" | "chef" | "user";
  created_at?: string;
}

export interface DiningTable {
  id: string;
  table_number: string;
  capacity: number;
  status: "Available" | "Occupied" | "Reserved" | "Cleaning";
  qr_code_url: string;
  reserved_by_name?: string;
  reservation_id?: string;
  reserved_at?: string;
}

export interface StaffShift {
  id: string;
  shift_name: string;
  start_time: string;
  end_time: string;
  assigned_user: string;
  status: "Active" | "Closed";
  created_at: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image_url: string;
  is_veg: boolean;
  is_available: boolean;
}

export interface OrderItemPayload {
  item_id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
  image_url?: string;
}

export interface CartItemResponse {
  item_id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
  image_url?: string;
}

export interface CartResponse {
  table_number: string;
  items: CartItemResponse[];
  total_amount: number;
  item_count: number;
  updated_at: string;
}

export interface TableBooking {
  id: string;
  table_number: string;
  capacity: number;
  customer_name: string;
  status: "Active" | "Completed" | "Cancelled";
  booked_at: string;
  released_at?: string;
  session_token?: string;
  order_token?: string;
  order_placed?: boolean;
}

export interface DiningSession {
  token?: string;
  active?: boolean;
  table_number?: string;
  customer_name?: string;
  booking_id?: string;
  expires_at?: string;
  message?: string;
  order_token?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  opening_stock: number;
  current_stock: number;
  minimum_level: number;
  status: "In Stock" | "Low Stock" | "Out of Stock";
  last_purchase_price: number;
  updated_at: string;
}

export interface InventorySummary {
  total_stock_items: number;
  todays_purchases: number;
  todays_consumption: number;
  low_stock_items: number;
  out_of_stock_items: number;
  wastage: number;
  total_purchase_cost: number;
  items_requiring_purchase: number;
  total_inventory_value: number;
  pending_requirements: number;
}


export interface RestaurantOrder {
  id: string;
  order_id: string;
  table_number: string;
  customer_name: string;
  items: OrderItemPayload[];
  total_amount: number;
  status: "Pending" | "Accepted" | "Cooking" | "Preparing" | "Ready" | "Completed" | "Cancelled";
  payment_status: "Paid" | "Unpaid" | "Refunded";
  payment_method?: string;
  paid_at?: string;
  payment_currency?: string;
  paid_amount?: number;
  payment_exchange_rate?: number;
  payment_amount_paise?: number;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  special_instructions?: string;
  created_at: string;
  order_token?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  target_role: string;
  created_at: string;
  is_read: boolean;
}

export interface DashboardSummary {
  total_sales: number;
  total_orders: number;
  pending_orders: number;
  completed_orders: number;
  active_tables: number;
  total_tables: number;
  active_shifts: number;
}

// Auth API
export async function directLogin(email: string, password: string, requestedRole: string = "admin") {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, requested_role: requestedRole }),
  });
  const data = await parseResponseJson(response);
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error(data.detail || data.message || "wrong email or password please try again");
    }
    throw new Error(data.detail || data.message || `Login request failed (${response.status})`);
  }
  if (data.access_token) setToken(data.access_token, data.refresh_token);
  return data;
}

export async function registerUser(name: string, email: string, password: string, role: string = "user") {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, role }),
  });
  const data = await parseResponseJson(response);
  if (!response.ok) {
    const detail = typeof data.detail === "string" ? data.detail : typeof data.message === "string" ? data.message : "";
    const normalizedDetail = detail.toLowerCase();
    if (response.status === 409 || normalizedDetail.includes("already") || normalizedDetail.includes("exist")) {
      throw new Error("An account with this email already exists.");
    }
    if (response.status === 400 || response.status === 422) {
      throw new Error(detail || "Please check your registration details and try again.");
    }
    throw new Error(detail || `Registration failed (${response.status})`);
  }
  return data;
}



export async function getCurrentUserProfile(): Promise<RestaurantUser> {
  return fetchWithAuth<RestaurantUser>("/api/auth/me");
}

export async function userLogout(): Promise<void> {
  try {
    const refreshToken = getRefreshToken();
    await fetchWithAuth("/api/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  } catch {
    // ignore
  }
  removeToken();
}

// User Management API
export async function getUsers(): Promise<RestaurantUser[]> {
  return fetchWithAuth<RestaurantUser[]>("/api/users");
}

export async function createUser(userData: { name: string; email: string; password: string; role: string }) {
  return fetchWithAuth<RestaurantUser>("/api/users", { method: "POST", body: JSON.stringify(userData) });
}

export async function updateUserRole(userId: string, role: string) {
  return fetchWithAuth<{ success: boolean; message: string }>(`/api/users/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export async function deleteUser(userId: string) {
  return fetchWithAuth<{ success: boolean; message: string }>(`/api/users/${userId}`, { method: "DELETE" });
}

// Table API
export async function getTables(): Promise<DiningTable[]> {
  return fetchWithAuth<DiningTable[]>("/api/tables");
}

// Table availability is safe to read publicly; booking and all state changes remain authenticated.
export async function getPublicTables(): Promise<DiningTable[]> {
  const response = await fetch(`${API_BASE_URL}/api/tables`, { cache: "no-store" });
  const data = await parseResponseJson(response);
  if (!response.ok) {
    throw new Error(data.detail || data.message || `Unable to load tables (${response.status})`);
  }
  return data as DiningTable[];
}

export async function createTable(data: { table_number: string; capacity: number; status: string }) {
  return fetchWithAuth<DiningTable>("/api/tables", { method: "POST", body: JSON.stringify(data) });
}

export async function updateTableStatus(tableNumber: string, status: string) {
  return fetchWithAuth<{ success: boolean; message: string }>(`/api/tables/${tableNumber}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function deleteTable(tableNumber: string) {
  return fetchWithAuth<{ success: boolean; message: string }>(`/api/tables/${tableNumber}`, { method: "DELETE" });
}

export interface TableQrMapping {
  table_number: string;
  capacity: number;
  status: DiningTable["status"];
  qr_code_url: string;
  full_target_url: string;
  qr_image_url: string;
}

export async function getTableQrMapping(tableNumber: string, token?: string): Promise<TableQrMapping> {
  const qs = token ? `?token=${encodeURIComponent(token)}` : "";
  const response = await fetch(`${API_BASE_URL}/api/tables/${encodeURIComponent(tableNumber)}/qr${qs}`, { cache: "no-store" });
  const data = await parseResponseJson(response);
  if (!response.ok) {
    throw new Error(data.detail || data.message || `Unable to load QR code (${response.status})`);
  }
  return data as TableQrMapping;
}

// Customer / User Panel APIs
export async function getMyBookings(): Promise<TableBooking[]> {
  return fetchWithAuth<TableBooking[]>("/api/bookings/mine");
}

export async function createTableBooking(tableNumber: string, customerName: string): Promise<TableBooking> {
  return fetchWithAuth<TableBooking>("/api/bookings", { method: "POST", body: JSON.stringify({ table_number: tableNumber, customer_name: customerName }) });
}

export async function cancelTableBooking(bookingId: string) {
  return fetchWithAuth<{ success: boolean; message: string }>(`/api/bookings/${bookingId}`, { method: "DELETE" });
}

export async function startMenuSession(tableNumber: string): Promise<DiningSession> {
  return fetchWithAuth<DiningSession>(`/api/bookings/start-session?table_number=${encodeURIComponent(tableNumber)}`, { method: "POST" });
}

export async function startMenuSessionFromBooking(bookingId: string): Promise<DiningSession> {
  return fetchWithAuth<DiningSession>(`/api/bookings/${bookingId}/menu-session`, { method: "POST" });
}

export async function validateMenuSession(token: string, tableNumber: string): Promise<{ active: boolean; table_number?: string; customer_name?: string; expires_at?: string; message?: string }> {
  return fetchWithAuth(`/api/bookings/session/validate?token=${encodeURIComponent(token)}&table_number=${encodeURIComponent(tableNumber)}`);
}

export async function getMyOrders(): Promise<RestaurantOrder[]> {
  return fetchWithAuth<RestaurantOrder[]>("/api/user/orders");
}

export async function getInventorySummary(): Promise<InventorySummary> {
  return fetchWithAuth<InventorySummary>("/api/inventory/summary");
}
export async function getInventoryItems(params: { search?: string; category?: string; status?: string } = {}): Promise<InventoryItem[]> {
  const qs = new URLSearchParams(); if (params.search) qs.set("search", params.search); if (params.category) qs.set("category", params.category); if (params.status) qs.set("status", params.status);
  return fetchWithAuth<InventoryItem[]>(`/api/inventory/items${qs.toString() ? `?${qs}` : ""}`);
}
export async function updateInventoryItem(itemId: string, data: { category?: string; unit?: string; minimum_level?: number; opening_stock?: number }) {
  return fetchWithAuth<InventoryItem>(`/api/inventory/items/${itemId}`, { method: "PATCH", body: JSON.stringify(data) });
}
export async function addInventoryPurchase(data: any) {
  return fetchWithAuth<{ success: boolean; message: string; data?: any }>("/api/inventory/purchases", { method: "POST", body: JSON.stringify(data) });
}
export async function getInventoryPurchases(): Promise<any[]> { return fetchWithAuth<any[]>("/api/inventory/purchases"); }
export async function addInventoryConsumption(data: any) { return fetchWithAuth<{ success: boolean; message: string; data?: any }>("/api/inventory/consumption", { method: "POST", body: JSON.stringify(data) }); }
export async function getInventoryConsumption(): Promise<any[]> { return fetchWithAuth<any[]>("/api/inventory/consumption"); }
export async function addInventoryWastage(data: any) { return fetchWithAuth<{ success: boolean; message: string; data?: any }>("/api/inventory/wastage", { method: "POST", body: JSON.stringify(data) }); }
export async function getInventoryWastage(): Promise<any[]> { return fetchWithAuth<any[]>("/api/inventory/wastage"); }
export async function getPurchaseRequirements(status?: string): Promise<any[]> { return fetchWithAuth<any[]>(`/api/inventory/requirements${status ? `?status=${encodeURIComponent(status)}` : ""}`); }
export async function createPurchaseRequirement(data: any) { return fetchWithAuth<{ success: boolean; message: string; data?: any }>("/api/inventory/requirements", { method: "POST", body: JSON.stringify(data) }); }
export async function updatePurchaseRequirementStatus(requirementId: string, status: string) { return fetchWithAuth<{ success: boolean; message: string }>(`/api/inventory/requirements/${requirementId}/status`, { method: "PATCH", body: JSON.stringify({ status }) }); }
export async function getInventoryAudit(params: Record<string, string> = {}): Promise<any[]> { const qs = new URLSearchParams(params); return fetchWithAuth<any[]>(`/api/inventory/audit${qs.toString() ? `?${qs}` : ""}`); }
export async function adjustInventoryStock(data: { item_id: string; quantity_delta: number; reason: string; reference?: string }) { return fetchWithAuth<{ success: boolean; message: string }>("/api/inventory/adjustment", { method: "POST", body: JSON.stringify(data) }); }


// Shift API
export async function getShifts(): Promise<StaffShift[]> {
  return fetchWithAuth<StaffShift[]>("/api/shifts");
}

export async function createShift(data: { shift_name: string; start_time: string; end_time: string; assigned_user?: string; status: string }) {
  return fetchWithAuth<StaffShift>("/api/shifts", { method: "POST", body: JSON.stringify(data) });
}

export async function assignShift(shiftId: string, assignedUser: string) {
  return fetchWithAuth<{ success: boolean; message: string }>(`/api/shifts/${shiftId}/assign`, {
    method: "PATCH",
    body: JSON.stringify({ assigned_user: assignedUser }),
  });
}

export async function reassignShift(shiftId: string, assignedUser: string) {
  return fetchWithAuth<{ success: boolean; message: string }>(`/api/shifts/${shiftId}/reassign`, {
    method: "POST",
    body: JSON.stringify({ assigned_user: assignedUser }),
  });
}

export async function updateShiftDetails(shiftId: string, data: { shift_name?: string; start_time?: string; end_time?: string; assigned_user?: string; status?: string }) {
  return fetchWithAuth<{ success: boolean; message: string; data?: any }>(`/api/shifts/${shiftId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function updateShiftStatus(shiftId: string, status: string) {
  return fetchWithAuth<{ success: boolean; message: string }>(`/api/shifts/${shiftId}/status?status=${status}`, { method: "PATCH" });
}

export async function deleteShift(shiftId: string) {
  return fetchWithAuth<{ success: boolean; message: string }>(`/api/shifts/${shiftId}`, { method: "DELETE" });
}

// Menu API
export async function getCategories(): Promise<MenuCategory[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/menu/categories`);
    const data = await parseResponseJson(response);
    if (!response.ok) {
      throw new Error(data.detail || data.message || `Categories request failed (${response.status}).`);
    }
    if (!Array.isArray(data)) {
      throw new Error("Categories API returned an invalid response.");
    }
    return data as MenuCategory[];
  } catch (err) {
    console.warn("Failed to fetch categories:", err);
    throw err instanceof Error ? err : new Error("Unable to load menu categories.");
  }
}

export async function createCategory(data: { name: string; icon?: string; sort_order?: number }) {
  return fetchWithAuth<MenuCategory>("/api/menu/categories", { method: "POST", body: JSON.stringify(data) });
}

export async function deleteCategory(categoryId: string) {
  return fetchWithAuth<{ success: boolean; message: string }>(`/api/menu/categories/${categoryId}`, { method: "DELETE" });
}

export async function getMenuItems(category?: string): Promise<MenuItem[]> {
  try {
    const url = category ? `${API_BASE_URL}/api/menu/items?category=${encodeURIComponent(category)}` : `${API_BASE_URL}/api/menu/items`;
    const response = await fetch(url);
    const data = await parseResponseJson(response);
    if (!response.ok) {
      throw new Error(data.detail || data.message || `Menu request failed (${response.status}).`);
    }
    if (!Array.isArray(data)) {
      throw new Error("Menu API returned an invalid response.");
    }
    return data as MenuItem[];
  } catch (err) {
    console.warn("Failed to fetch menu items:", err);
    throw err instanceof Error ? err : new Error("Unable to load menu items.");
  }
}

export async function createMenuItem(data: Partial<MenuItem>) {
  return fetchWithAuth<MenuItem>("/api/menu/items", { method: "POST", body: JSON.stringify(data) });
}

export async function updateMenuItem(itemId: string, data: Partial<MenuItem>) {
  return fetchWithAuth<{ success: boolean; message: string }>(`/api/menu/items/${itemId}`, { method: "PATCH", body: JSON.stringify(data) });
}

export async function deleteMenuItem(itemId: string) {
  return fetchWithAuth<{ success: boolean; message: string }>(`/api/menu/items/${itemId}`, { method: "DELETE" });
}

// Order API
export async function placeOrder(orderData: { table_number: string; customer_name?: string; items: OrderItemPayload[]; special_instructions?: string }) {
  const response = await fetch(`${API_BASE_URL}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderData),
  });
  const data = await parseResponseJson(response);
  if (!response.ok) throw new Error(data.detail || "Order placement failed.");
  return data as RestaurantOrder;
}

export async function getOrders(status?: string, tableNumber?: string): Promise<RestaurantOrder[]> {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (tableNumber) params.set("table_number", tableNumber);

  const query = params.toString();
  const data = await fetchWithAuth<RestaurantOrder[]>(
    `/api/orders${query ? `?${query}` : ""}`
  );
  if (!Array.isArray(data)) {
    throw new Error("Orders API returned an invalid response.");
  }
  return data;
}

export async function getOrderById(orderId: string): Promise<RestaurantOrder> {
  const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`);
  return parseResponseJson(response);
}

export async function updateOrderStatus(orderId: string, status: string) {
  return fetchWithAuth<{ success: boolean; message: string }>(`/api/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function cancelKitchenOrder(orderId: string, reason?: string) {
  const query = reason ? `?reason=${encodeURIComponent(reason)}` : "";
  return fetchWithAuth<{ success: boolean; message: string }>(`/api/kitchen/order/${orderId}/cancel${query}`, {
    method: "POST",
  });
}

export async function payOrder(orderId: string, paymentMethod: string = "Cash") {
  return fetchWithAuth<{ success: boolean; message: string }>(`/api/orders/${orderId}/pay`, {
    method: "POST",
    body: JSON.stringify({ payment_status: "Paid", payment_method: paymentMethod }),
  });
}

export async function adminCancelOrder(orderId: string, reason: string, isRefund: boolean = false) {
  return fetchWithAuth<{ success: boolean; message: string }>(`/api/orders/${orderId}/admin-cancel`, {
    method: "POST",
    body: JSON.stringify({ reason, is_refund: isRefund }),
  });
}

// Table-Wise Order API
export async function createTableOrder(tableNumber: string, orderData: { customer_name?: string; items: OrderItemPayload[]; special_instructions?: string }) {
  const response = await fetch(`${API_BASE_URL}/api/orders/table/${tableNumber}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderData),
  });
  const data = await parseResponseJson(response);
  if (!response.ok) throw new Error(data.detail || "Table order creation failed.");
  return data as RestaurantOrder;
}

export async function getTableOrdersHistory(tableNumber: string): Promise<RestaurantOrder[]> {
  const response = await fetch(`${API_BASE_URL}/api/orders/table/${tableNumber}`);
  const data = await parseResponseJson(response);
  return Array.isArray(data) ? data : [];
}

export async function getTableActiveOrder(tableNumber: string): Promise<RestaurantOrder> {
  const response = await fetch(`${API_BASE_URL}/api/orders/table/${tableNumber}/active`);
  const data = await parseResponseJson(response);
  if (!response.ok) {
    throw new Error(data.detail || "Active order not found.");
  }
  return data;
}

export async function appendTableOrder(tableNumber: string, items: OrderItemPayload[], specialInstructions?: string): Promise<RestaurantOrder> {
  const response = await fetch(`${API_BASE_URL}/api/orders/table/${tableNumber}/append`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items, special_instructions: specialInstructions }),
  });
  const data = await parseResponseJson(response);
  if (!response.ok) throw new Error(data.detail || "Failed to append items to order.");
  return data as RestaurantOrder;
}

// Cart API
export async function getCart(tableNumber: string, sessionToken: string): Promise<CartResponse> {
  const response = await fetch(`${API_BASE_URL}/api/cart/${tableNumber}?session_token=${encodeURIComponent(sessionToken)}`, { headers: { Authorization: `Bearer ${getToken() || ""}` }, cache: "no-store" });
  return parseResponseJson(response);
}

export async function addToCart(tableNumber: string, itemId: string, quantity: number = 1, notes: string = "", sessionToken: string = ""): Promise<CartResponse> {
  const response = await fetch(`${API_BASE_URL}/api/cart/${tableNumber}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken() || ""}` },
    body: JSON.stringify({ item_id: itemId, quantity, notes, session_token: sessionToken }),
  });
  const data = await parseResponseJson(response);
  if (!response.ok) throw new Error(data.detail || "Failed to add item to cart.");
  return data as CartResponse;
}

export async function updateCartItem(tableNumber: string, itemId: string, quantity?: number, notes?: string, sessionToken: string = ""): Promise<CartResponse> {
  const response = await fetch(`${API_BASE_URL}/api/cart/${tableNumber}/items/${itemId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken() || ""}` },
    body: JSON.stringify({ quantity, notes, session_token: sessionToken }),
  });
  const data = await parseResponseJson(response);
  if (!response.ok) {
    if (response.status === 404) {
      return { table_number: tableNumber, items: [], total_amount: 0, item_count: 0, updated_at: new Date().toISOString() };
    }
    throw new Error(data.detail || "Failed to update cart item.");
  }
  return data as CartResponse;
}

export async function removeCartItem(tableNumber: string, itemId: string, sessionToken: string = ""): Promise<CartResponse> {
  const response = await fetch(`${API_BASE_URL}/api/cart/${tableNumber}/items/${itemId}?session_token=${encodeURIComponent(sessionToken)}`, {
    method: "DELETE", headers: { Authorization: `Bearer ${getToken() || ""}` },
  });
  const data = await parseResponseJson(response);
  if (!response.ok) {
    if (response.status === 404) {
      return { table_number: tableNumber, items: [], total_amount: 0, item_count: 0, updated_at: new Date().toISOString() };
    }
    throw new Error(data.detail || "Failed to remove cart item.");
  }
  return data as CartResponse;
}


export async function clearCart(tableNumber: string, sessionToken: string = "") {
  const response = await fetch(`${API_BASE_URL}/api/cart/${tableNumber}?session_token=${encodeURIComponent(sessionToken)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken() || ""}` },
  });
  return parseResponseJson(response);
}

export async function checkoutCart(
  tableNumber: string,
  customerName?: string,
  specialInstructions?: string,
  sessionToken: string = "",
  paymentMethod: "Online" | "At Counter" = "At Counter",
): Promise<RestaurantOrder> {
  const url = `${API_BASE_URL}/api/cart/${tableNumber}/checkout`;
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken() || ""}` }, body: JSON.stringify({ session_token: sessionToken, customer_name: customerName || "", special_instructions: specialInstructions || "", payment_method: paymentMethod }) });
  const data = await parseResponseJson(response);
  if (!response.ok) throw new Error(data.detail || "Cart checkout failed.");
  return data as RestaurantOrder;
}

export interface RazorpayOrderDetails {
  key_id: string;
  razorpay_order_id: string;
  amount: number;
  currency: string;
  exchange_rate?: number;
  amount_inr?: number;
  amount_usd?: number;
}

export type OnlinePaymentOrderResult =
  | { available: true; order: RazorpayOrderDetails }
  | { available: false; message: string };

export interface RazorpayCheckoutResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export async function createOnlinePaymentOrder(orderId: string): Promise<OnlinePaymentOrderResult> {
  const url = `${API_BASE_URL}/api/orders/${encodeURIComponent(orderId)}/online-payment/order`;
  const request = (token: string | null) => fetch(url, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });

  let response = await request(getToken());
  if (response.status === 401) {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) response = await request(refreshedToken);
  }

  const data = await parseResponseJson(response);
  if (response.status === 503) {
    return {
      available: false,
      message: data.detail || "Online payments are unavailable. Please pay at the restaurant counter.",
    };
  }
  if (!response.ok) {
    throw new Error(data.detail || data.message || `Online payment setup failed (${response.status}).`);
  }
  return { available: true, order: data as RazorpayOrderDetails };
}

export async function verifyOnlinePayment(
  orderId: string,
  payment: RazorpayCheckoutResponse,
): Promise<{ success: boolean; message: string }> {
  return fetchWithAuth<{ success: boolean; message: string }>(
    `/api/orders/${encodeURIComponent(orderId)}/online-payment/verify`,
    {
      method: "POST",
      body: JSON.stringify(payment),
    },
  );
}

// Notifications API
export async function getNotifications(
  type?: string,
  targetRole?: string,
  isRead?: boolean,
  limit: number = 50
): Promise<NotificationItem[]> {
  let query = `?limit=${limit}`;
  if (type) query += `&type=${encodeURIComponent(type)}`;
  if (targetRole) query += `&target_role=${encodeURIComponent(targetRole)}`;
  if (isRead !== undefined) query += `&is_read=${isRead}`;
  return fetchWithAuth<NotificationItem[]>(`/api/notifications${query}`);
}

export async function getUnreadNotificationCount(): Promise<number> {
  const data = await fetchWithAuth<{ unread_count: number }>("/api/notifications/unread-count");
  return data.unread_count || 0;
}

export async function getNotificationById(notificationId: string): Promise<NotificationItem> {
  return fetchWithAuth<NotificationItem>(`/api/notifications/${notificationId}`);
}

export async function createNotification(data: { title: string; message: string; type?: string; target_role?: string }): Promise<NotificationItem> {
  return fetchWithAuth<NotificationItem>("/api/notifications", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function createOrderNotification(title: string, message: string, targetRole: string = "all"): Promise<NotificationItem> {
  const url = `/api/notifications/order?title=${encodeURIComponent(title)}&message=${encodeURIComponent(message)}&target_role=${encodeURIComponent(targetRole)}`;
  return fetchWithAuth<NotificationItem>(url, { method: "POST" });
}

export async function createShiftNotification(title: string, message: string, targetRole: string = "all"): Promise<NotificationItem> {
  const url = `/api/notifications/shift?title=${encodeURIComponent(title)}&message=${encodeURIComponent(message)}&target_role=${encodeURIComponent(targetRole)}`;
  return fetchWithAuth<NotificationItem>(url, { method: "POST" });
}

export async function markNotificationRead(notificationId: string) {
  return fetchWithAuth<{ success: boolean; message: string }>(`/api/notifications/${notificationId}/read`, { method: "PATCH" });
}

export async function markNotificationsRead() {
  return fetchWithAuth<{ success: boolean; message: string }>("/api/notifications/read-all", { method: "POST" });
}

export async function clearReadNotifications() {
  return fetchWithAuth<{ success: boolean; message: string }>("/api/notifications/clear-read", { method: "DELETE" });
}

export async function deleteNotification(notificationId: string) {
  return fetchWithAuth<{ success: boolean; message: string }>(`/api/notifications/${notificationId}`, { method: "DELETE" });
}

// Reports API
export async function getDashboardSummary(): Promise<DashboardSummary> {
  return fetchWithAuth<DashboardSummary>("/api/reports/summary");
}

export async function getSalesReport() {
  return fetchWithAuth<{
    total_revenue: number;
    paid_orders_count: number;
    avg_order_value: number;
    payment_method_breakdown: Record<string, number>;
    currency: string;
  }>("/api/reports/sales");
}

export async function getOrdersReport() {
  return fetchWithAuth<{
    total_orders: number;
    status_breakdown: Record<string, number>;
    total_items_sold: number;
  }>("/api/reports/orders");
}

export async function getShiftsReport() {
  return fetchWithAuth<{
    total_shifts: number;
    active_shifts: number;
    closed_shifts: number;
    staff_shift_allocation: Record<string, number>;
  }>("/api/reports/shifts");
}

export async function getSalesChartData() {
  return fetchWithAuth<{ day: string; sales: number; orders: number }[]>("/api/reports/sales-chart");
}

export async function getPopularItems() {
  return fetchWithAuth<{ name: string; category: string; orders_count: number; revenue: number }[]>("/api/reports/popular-items");
}

export interface OrderPeriodReport {
  period: "daily" | "weekly" | "monthly" | "yearly";
  period_start: string;
  period_end: string;
  total_orders: number;
  paid_orders: number;
  total_revenue: number;
  status_breakdown: Record<string, number>;
  chart_data: { label: string; sales: number; orders: number }[];
}

export async function getOrderPeriodReport(period: "daily" | "weekly" | "monthly" | "yearly", reportDate?: string): Promise<OrderPeriodReport> {
  const query = new URLSearchParams({ period });
  if (reportDate) query.set("report_date", reportDate);
  return fetchWithAuth<OrderPeriodReport>(`/api/reports/orders-period?${query.toString()}`);
}

// Membership Plans API (Silver / Gold / Platinum)
export interface MembershipPlan {
  id: string;
  name: string;
  tier: string;
  tagline: string;
  price_inr: number;
  price_usd: number;
  period: string;
  badge: string;
  features: string[];
}

export interface PlanTransaction {
  id: string;
  plan_id: string;
  plan_name: string;
  amount_inr: number;
  amount_usd: number;
  currency: string;
  razorpay_payment_id: string;
  status: string;
  created_at: string;
}

export async function getPlans(): Promise<MembershipPlan[]> {
  const data = await fetchWithAuth<{ success: boolean; plans: MembershipPlan[] }>("/api/plans");
  return Array.isArray(data.plans) ? data.plans : [];
}

export async function getMyPlanTransactions(): Promise<{ transactions: PlanTransaction[]; current_plan: string | null }> {
  const data = await fetchWithAuth<{ success: boolean; transactions: PlanTransaction[]; current_plan: string | null }>("/api/plans/my");
  return {
    transactions: Array.isArray(data.transactions) ? data.transactions : [],
    current_plan: data.current_plan || null,
  };
}

export async function subscribeToPlan(planId: string, razorpayPaymentId: string): Promise<{ success: boolean; message: string; transaction: PlanTransaction }> {
  return fetchWithAuth<{ success: boolean; message: string; transaction: PlanTransaction }>(
    "/api/plans/subscribe",
    {
      method: "POST",
      body: JSON.stringify({ plan_id: planId, razorpay_payment_id: razorpayPaymentId }),
    },
  );
}
