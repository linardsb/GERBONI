import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Cart, User, GuestSession, Product, Wishlist } from "./api";

// Recently Viewed Products
interface RecentlyViewedItem {
  productId: number;
  viewedAt: number;
  product: Pick<Product, "id" | "city_name" | "city_name_lv" | "coat_of_arms_image" | "min_price">;
}

interface RecentlyViewedState {
  items: RecentlyViewedItem[];
  addItem: (product: Pick<Product, "id" | "city_name" | "city_name_lv" | "coat_of_arms_image" | "min_price">) => void;
  clearItems: () => void;
}

const MAX_RECENTLY_VIEWED = 10;

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (product) =>
        set((state) => {
          // Remove existing entry if present (deduplication)
          const filtered = state.items.filter((item) => item.productId !== product.id);
          // Add new item at the beginning
          const newItem: RecentlyViewedItem = {
            productId: product.id,
            viewedAt: Date.now(),
            product,
          };
          // Keep only MAX items (FIFO)
          const items = [newItem, ...filtered].slice(0, MAX_RECENTLY_VIEWED);
          return { items };
        }),
      clearItems: () => set({ items: [] }),
    }),
    {
      name: "gerboni-recently-viewed",
    }
  )
);

interface AuthState {
  token: string | null;
  user: User | null;
  guestSession: GuestSession | null;
  setAuth: (token: string, user: User) => void;
  setGuestSession: (session: GuestSession) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      guestSession: null,
      setAuth: (token, user) => set({ token, user }),
      setGuestSession: (session) => set({ guestSession: session }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: "gerboni-auth",
    }
  )
);

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  setCart: (cart: Cart) => void;
  setLoading: (loading: boolean) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  cart: null,
  isLoading: false,
  setCart: (cart) => set({ cart }),
  setLoading: (isLoading) => set({ isLoading }),
  clearCart: () => set({ cart: null }),
}));

interface ChatState {
  isOpen: boolean;
  messages: ChatMessage[];
  isTyping: boolean;
  toggleChat: () => void;
  addMessage: (message: ChatMessage) => void;
  setTyping: (typing: boolean) => void;
  clearMessages: () => void;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export const useChatStore = create<ChatState>((set) => ({
  isOpen: false,
  messages: [],
  isTyping: false,
  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setTyping: (isTyping) => set({ isTyping }),
  clearMessages: () => set({ messages: [] }),
}));

// Wishlist Store
interface WishlistState {
  wishlist: Wishlist | null;
  isLoading: boolean;
  productIds: Set<number>; // Quick lookup for checking if product is in wishlist
  setWishlist: (wishlist: Wishlist) => void;
  setLoading: (loading: boolean) => void;
  clearWishlist: () => void;
  isInWishlist: (productId: number) => boolean;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  wishlist: null,
  isLoading: false,
  productIds: new Set(),
  setWishlist: (wishlist) =>
    set({
      wishlist,
      productIds: new Set(wishlist.items.map((item) => item.product_id)),
    }),
  setLoading: (isLoading) => set({ isLoading }),
  clearWishlist: () => set({ wishlist: null, productIds: new Set() }),
  isInWishlist: (productId) => get().productIds.has(productId),
}));
