const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface FetchOptions extends RequestInit {
  token?: string | null;
  guestSession?: string | null;
}

export class ApiError extends Error {
  status: number;
  detail: string;
  requestId: string | null;

  constructor(status: number, detail: string, requestId: string | null = null) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
    this.requestId = requestId;
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, guestSession, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (guestSession) {
    headers["X-Guest-Session"] = guestSession;
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
    });
  } catch (networkError) {
    console.error(`[API] Network error on ${endpoint}:`, networkError);
    throw new ApiError(0, "Network error. Please check your connection.");
  }

  if (!response.ok) {
    const requestId = response.headers.get("x-request-id");
    const errorBody = await response.json().catch(() => ({}));
    const detail = errorBody.detail || `Request failed (${response.status})`;

    console.error(
      `[API] ${response.status} ${endpoint}`,
      requestId ? `(request_id: ${requestId})` : "",
      detail
    );

    throw new ApiError(response.status, detail, requestId);
  }

  return response.json();
}

// Products
export interface Product {
  id: number;
  city_name: string;
  city_name_lv: string;
  coat_of_arms_image: string;
  description: string;
  description_lv?: string;
  is_active: boolean;
  min_price?: number;
  total_stock?: number;
  created_at: string;
}

export interface ProductDetail extends Product {
  variants: Variant[];
}

export interface Variant {
  id: number;
  color: string;
  size: string;
  price: number;
  stock: number;
  sku: string;
}

export interface ProductFilters {
  q?: string;
  color?: string;
  size?: string;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  sort?: string;
  lang?: "en" | "lv";
}

export const getProducts = (langOrFilters?: "en" | "lv" | ProductFilters) => {
  const params = new URLSearchParams();
  if (typeof langOrFilters === "string") {
    params.set("lang", langOrFilters);
  } else if (langOrFilters) {
    const f = langOrFilters;
    if (f.lang) params.set("lang", f.lang);
    if (f.q) params.set("q", f.q);
    if (f.color) params.set("color", f.color);
    if (f.size) params.set("size", f.size);
    if (f.min_price !== undefined) params.set("min_price", String(f.min_price));
    if (f.max_price !== undefined) params.set("max_price", String(f.max_price));
    if (f.in_stock !== undefined) params.set("in_stock", String(f.in_stock));
    if (f.sort) params.set("sort", f.sort);
  }
  const query = params.toString();
  return fetchApi<Product[]>(`/products${query ? `?${query}` : ""}`);
};

export const getProduct = (id: number, lang?: "en" | "lv") =>
  fetchApi<ProductDetail>(`/products/${id}${lang ? `?lang=${lang}` : ""}`);

// Cart
export interface CartItem {
  id: number;
  variant_id: number;
  quantity: number;
  variant: {
    id: number;
    color: string;
    size: string;
    price: number;
    stock: number;
    product_city: string;
    product_city_lv: string;
    product_image: string;
  };
}

export interface Cart {
  items: CartItem[];
  total: number;
  item_count: number;
}

export const getCart = (token?: string | null, guestSession?: string | null) =>
  fetchApi<Cart>("/cart", { token, guestSession });

export const addToCart = (
  variantId: number,
  quantity: number,
  token?: string | null,
  guestSession?: string | null
) =>
  fetchApi<Cart>("/cart", {
    method: "POST",
    body: JSON.stringify({ variant_id: variantId, quantity }),
    token,
    guestSession,
  });

export const updateCartItem = (
  itemId: number,
  quantity: number,
  token?: string | null,
  guestSession?: string | null
) =>
  fetchApi<Cart>(`/cart/${itemId}`, {
    method: "PUT",
    body: JSON.stringify({ quantity }),
    token,
    guestSession,
  });

export const removeCartItem = (
  itemId: number,
  token?: string | null,
  guestSession?: string | null
) =>
  fetchApi<Cart>(`/cart/${itemId}`, {
    method: "DELETE",
    token,
    guestSession,
  });

// Auth
export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  id: number;
  email: string;
  role: string;
  is_guest: boolean;
  is_active: boolean;
  created_at: string;
}

export interface GuestSession {
  id: number;
  session_token: string;
  email: string | null;
  expires_at: string;
}

export const register = (email: string, password: string) =>
  fetchApi<User>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const login = (email: string, password: string) =>
  fetchApi<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const getMe = (token: string) => fetchApi<User>("/auth/me", { token });

export const createGuestSession = (email?: string) =>
  fetchApi<GuestSession>("/auth/guest-session", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

// Orders
export interface ShippingInfo {
  name: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
}

export interface Order {
  id: number;
  user_id: number | null;
  guest_email: string | null;
  status: string;
  subtotal: number | null;
  discount_code: string | null;
  discount_amount: number;
  total: number;
  shipping_name: string | null;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_postal_code: string | null;
  shipping_country: string | null;
  tracking_number: string | null;
  items: {
    id: number;
    variant_id: number;
    quantity: number;
    price: number;
    variant: {
      id: number;
      color: string;
      size: string;
      product_city: string;
      product_image: string;
    };
  }[];
  created_at: string;
  updated_at: string;
}

export const getOrders = (token: string) =>
  fetchApi<Order[]>("/orders", { token });

export const getOrder = (id: number, token?: string) =>
  fetchApi<Order>(`/orders/${id}`, { token });

export const createOrder = (
  shipping: ShippingInfo,
  token?: string | null,
  guestSession?: string | null,
  guestEmail?: string,
  discountCode?: string,
) =>
  fetchApi<Order>("/orders", {
    method: "POST",
    body: JSON.stringify({ shipping, guest_email: guestEmail, discount_code: discountCode }),
    token,
    guestSession,
  });

// Discounts
export interface DiscountValidation {
  valid: boolean;
  code: string;
  type: string | null;
  value: number | null;
  discount_amount: number | null;
  message: string | null;
}

export const validateDiscount = (code: string, subtotal: number) =>
  fetchApi<DiscountValidation>("/discounts/validate", {
    method: "POST",
    body: JSON.stringify({ code, subtotal }),
  });

// Payments
export const createCheckout = (orderId: number, token?: string | null) =>
  fetchApi<{ checkout_url: string }>("/payments/create-checkout", {
    method: "POST",
    body: JSON.stringify({}),
    token,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  }).catch(() =>
    fetchApi<{ checkout_url: string }>(
      `/payments/create-checkout?order_id=${orderId}`,
      {
        method: "POST",
        token,
      }
    )
  );

// Wishlist
export interface WishlistProduct {
  id: number;
  city_name: string;
  city_name_lv: string;
  coat_of_arms_image: string;
  min_price: number | null;
  total_stock: number | null;
}

export interface WishlistItem {
  id: number;
  product_id: number;
  product: WishlistProduct;
  created_at: string;
}

export interface Wishlist {
  items: WishlistItem[];
  count: number;
}

export interface WishlistCheckResponse {
  in_wishlist: boolean;
  wishlist_item_id: number | null;
}

export const getWishlist = (token?: string | null, guestSession?: string | null) =>
  fetchApi<Wishlist>("/wishlist", { token, guestSession });

export const addToWishlist = (
  productId: number,
  token?: string | null,
  guestSession?: string | null
) =>
  fetchApi<Wishlist>("/wishlist", {
    method: "POST",
    body: JSON.stringify({ product_id: productId }),
    token,
    guestSession,
  });

export const removeFromWishlist = (
  productId: number,
  token?: string | null,
  guestSession?: string | null
) =>
  fetchApi<Wishlist>(`/wishlist/${productId}`, {
    method: "DELETE",
    token,
    guestSession,
  });

export const checkWishlist = (
  productId: number,
  token?: string | null,
  guestSession?: string | null
) =>
  fetchApi<WishlistCheckResponse>(`/wishlist/check/${productId}`, {
    token,
    guestSession,
  });

export const moveWishlistToCart = (
  productId: number,
  variantId: number,
  quantity: number = 1,
  token?: string | null,
  guestSession?: string | null
) =>
  fetchApi<{ status: string }>(`/wishlist/move-to-cart/${productId}`, {
    method: "POST",
    body: JSON.stringify({ variant_id: variantId, quantity }),
    token,
    guestSession,
  });

// Recommendations
export interface RecommendedProduct {
  id: number;
  city_name: string;
  city_name_lv: string;
  coat_of_arms_image: string;
  description: string;
  min_price: number | null;
  total_stock: number | null;
}

export const getPopularProducts = (limit: number = 8) =>
  fetchApi<RecommendedProduct[]>(`/recommendations/popular?limit=${limit}`);

export const getRelatedProducts = (productId: number, limit: number = 4) =>
  fetchApi<RecommendedProduct[]>(`/recommendations/related/${productId}?limit=${limit}`);

export const getFrequentlyBoughtTogether = (productId: number, limit: number = 4) =>
  fetchApi<RecommendedProduct[]>(`/recommendations/frequently-bought-together/${productId}?limit=${limit}`);

// Reviews
export interface ReviewAuthor {
  id: number;
  email: string;
}

export interface Review {
  id: number;
  product_id: number;
  user_id: number;
  rating: number;
  title: string | null;
  content: string | null;
  is_verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  author_name: string;
}

export interface ReviewSummary {
  average_rating: number;
  total_reviews: number;
  rating_distribution: Record<number, number>;
}

export interface ReviewListResponse {
  reviews: Review[];
  total: number;
  page: number;
  page_size: number;
  summary: ReviewSummary;
}

export interface CanReviewResponse {
  can_review: boolean;
  order_id: number | null;
}

export const getProductReviews = (
  productId: number,
  page: number = 1,
  pageSize: number = 10
) =>
  fetchApi<ReviewListResponse>(
    `/products/${productId}/reviews?page=${page}&page_size=${pageSize}`
  );

export const createReview = (
  productId: number,
  data: { rating: number; title?: string; content?: string; order_id?: number },
  token: string
) =>
  fetchApi<Review>(`/products/${productId}/reviews`, {
    method: "POST",
    body: JSON.stringify(data),
    token,
  });

export const updateReview = (
  reviewId: number,
  data: { rating?: number; title?: string; content?: string },
  token: string
) =>
  fetchApi<Review>(`/reviews/${reviewId}`, {
    method: "PUT",
    body: JSON.stringify(data),
    token,
  });

export const deleteReview = (reviewId: number, token: string) =>
  fetchApi<{ status: string }>(`/reviews/${reviewId}`, {
    method: "DELETE",
    token,
  });

export const markReviewHelpful = (
  reviewId: number,
  token?: string | null,
  guestSession?: string | null
) =>
  fetchApi<{ review_id: number; helpful_count: number; user_marked_helpful: boolean }>(
    `/reviews/${reviewId}/helpful`,
    {
      method: "POST",
      token,
      guestSession,
    }
  );

export const canReviewProduct = (productId: number, token: string) =>
  fetchApi<CanReviewResponse>(`/products/${productId}/can-review`, { token });

// Password Change
export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface MessageResponse {
  message: string;
}

export const changePassword = (data: ChangePasswordRequest, token: string) =>
  fetchApi<MessageResponse>("/auth/me/change-password", {
    method: "POST",
    body: JSON.stringify(data),
    token,
  });

// Addresses
export interface Address {
  id: number;
  user_id: number;
  name: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  postal_code: string;
  country: string;
  phone: string | null;
  label: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface AddressCreate {
  name: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  postal_code: string;
  country?: string;
  phone?: string | null;
  label?: string | null;
  is_default?: boolean;
}

export interface AddressUpdate {
  name?: string;
  address_line1?: string;
  address_line2?: string | null;
  city?: string;
  postal_code?: string;
  country?: string;
  phone?: string | null;
  label?: string | null;
  is_default?: boolean;
}

export const getAddresses = (token: string) =>
  fetchApi<Address[]>("/addresses", { token });

export const createAddress = (data: AddressCreate, token: string) =>
  fetchApi<Address>("/addresses", {
    method: "POST",
    body: JSON.stringify(data),
    token,
  });

export const updateAddress = (id: number, data: AddressUpdate, token: string) =>
  fetchApi<Address>(`/addresses/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
    token,
  });

export const deleteAddress = (id: number, token: string) =>
  fetchApi<void>(`/addresses/${id}`, {
    method: "DELETE",
    token,
  });

export const setDefaultAddress = (id: number, token: string) =>
  fetchApi<Address>(`/addresses/${id}/set-default`, {
    method: "POST",
    token,
  });

// Admin API
export interface DashboardStats {
  total_orders: number;
  pending_orders: number;
  total_revenue: number;
  total_customers: number;
  orders_today: number;
  revenue_today: number;
  low_stock_variants: number;
}

export interface AdminOrder {
  id: number;
  user_id: number | null;
  guest_email: string | null;
  status: string;
  total: number;
  shipping_name: string | null;
  shipping_city: string | null;
  shipping_country: string | null;
  tracking_number: string | null;
  created_at: string;
  updated_at: string;
  item_count: number;
}

export interface AdminOrderList {
  orders: AdminOrder[];
  total: number;
  limit: number;
  offset: number;
}

export interface AdminProduct {
  id: number;
  city_name: string;
  city_name_lv: string;
  is_active: boolean;
  variant_count: number;
  total_stock: number;
  low_stock_count: number;
}

export interface AdminProductList {
  products: AdminProduct[];
  total: number;
  limit: number;
  offset: number;
}

export interface AdminVariant {
  id: number;
  product_id: number;
  color: string;
  size: string;
  price: number;
  stock: number;
  sku: string;
}

export interface AdminUser {
  id: number;
  email: string;
  role: string;
  is_guest: boolean;
  is_active: boolean;
  created_at: string;
  order_count: number;
  total_spent: number;
}

export interface AdminUserList {
  users: AdminUser[];
  total: number;
  limit: number;
  offset: number;
}

// Admin Dashboard
export const getAdminDashboardStats = (token: string) =>
  fetchApi<DashboardStats>("/admin/dashboard/stats", { token });

// Admin Orders
export const getAdminOrders = (
  token: string,
  params?: { status?: string; limit?: number; offset?: number }
) => {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.set("status", params.status);
  if (params?.limit) queryParams.set("limit", String(params.limit));
  if (params?.offset) queryParams.set("offset", String(params.offset));
  const query = queryParams.toString();
  return fetchApi<AdminOrderList>(`/admin/orders${query ? `?${query}` : ""}`, { token });
};

export const getAdminOrder = (id: number, token: string) =>
  fetchApi<Order>(`/admin/orders/${id}`, { token });

export const updateOrderStatus = (id: number, status: string, token: string) =>
  fetchApi<{ id: number; status: string }>(`/admin/orders/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
    token,
  });

export const shipOrder = (id: number, trackingNumber: string, token: string) =>
  fetchApi<{ id: number; status: string; tracking_number: string }>(
    `/admin/orders/${id}/ship`,
    {
      method: "POST",
      body: JSON.stringify({ tracking_number: trackingNumber }),
      token,
    }
  );

// Admin Products
export const getAdminProducts = (
  token: string,
  params?: { limit?: number; offset?: number }
) => {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.set("limit", String(params.limit));
  if (params?.offset) queryParams.set("offset", String(params.offset));
  const query = queryParams.toString();
  return fetchApi<AdminProductList>(`/admin/products${query ? `?${query}` : ""}`, { token });
};

export const getAdminProductVariants = (productId: number, token: string) =>
  fetchApi<AdminVariant[]>(`/admin/products/${productId}/variants`, { token });

export const updateVariant = (
  productId: number,
  variantId: number,
  data: { price?: number; stock?: number },
  token: string
) =>
  fetchApi<AdminVariant>(`/admin/products/${productId}/variants/${variantId}`, {
    method: "PUT",
    body: JSON.stringify(data),
    token,
  });

export const getLowStockVariants = (token: string, threshold?: number) => {
  const query = threshold ? `?threshold=${threshold}` : "";
  return fetchApi<(AdminVariant & { product_name: string })[]>(
    `/admin/products/low-stock${query}`,
    { token }
  );
};

// Admin Users
export const getAdminUsers = (
  token: string,
  params?: { role?: string; limit?: number; offset?: number }
) => {
  const queryParams = new URLSearchParams();
  if (params?.role) queryParams.set("role", params.role);
  if (params?.limit) queryParams.set("limit", String(params.limit));
  if (params?.offset) queryParams.set("offset", String(params.offset));
  const query = queryParams.toString();
  return fetchApi<AdminUserList>(`/admin/users${query ? `?${query}` : ""}`, { token });
};

export const getAdminUser = (id: number, token: string) =>
  fetchApi<AdminUser & { recent_orders: { id: number; status: string; total: number; created_at: string }[] }>(
    `/admin/users/${id}`,
    { token }
  );

export const updateUserRole = (id: number, role: string, token: string) =>
  fetchApi<{ id: number; email: string; role: string }>(`/admin/users/${id}/role`, {
    method: "PUT",
    body: JSON.stringify({ role }),
    token,
  });

export const activateUser = (id: number, token: string) =>
  fetchApi<{ id: number; is_active: boolean }>(`/admin/users/${id}/activate`, {
    method: "PUT",
    token,
  });

export const deactivateUser = (id: number, token: string) =>
  fetchApi<{ id: number; is_active: boolean }>(`/admin/users/${id}/deactivate`, {
    method: "PUT",
    token,
  });

// ── CSV Exports ─────────────────────────────────────────────────────

export async function downloadCsv(
  endpoint: string,
  filename: string,
  token: string,
  params?: Record<string, string>,
) {
  const url = new URL(`${API_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v);
    });
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}
