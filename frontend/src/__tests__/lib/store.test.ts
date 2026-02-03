/**
 * Tests for Zustand stores.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import {
  useAuthStore,
  useCartStore,
  useChatStore,
  useWishlistStore,
  useRecentlyViewedStore,
} from '@/lib/store'

describe('Zustand Stores', () => {
  describe('AuthStore', () => {
    beforeEach(() => {
      // Reset store state before each test
      useAuthStore.setState({
        token: null,
        user: null,
        guestSession: null,
      })
    })

    it('should initialize with null values', () => {
      const { result } = renderHook(() => useAuthStore())
      expect(result.current.token).toBeNull()
      expect(result.current.user).toBeNull()
      expect(result.current.guestSession).toBeNull()
    })

    it('should set auth token and user', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setAuth('test-token', {
          id: 1,
          email: 'test@example.com',
          role: 'customer',
          is_guest: false,
          is_active: true,
          created_at: '2026-01-01T00:00:00Z',
        })
      })

      expect(result.current.token).toBe('test-token')
      expect(result.current.user?.email).toBe('test@example.com')
    })

    it('should set guest session', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setGuestSession({
          id: 1,
          session_token: 'guest-token',
          email: null,
          expires_at: '2026-01-08T00:00:00Z',
        })
      })

      expect(result.current.guestSession?.session_token).toBe('guest-token')
    })

    it('should logout and clear auth state', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setAuth('test-token', {
          id: 1,
          email: 'test@example.com',
          role: 'customer',
          is_guest: false,
          is_active: true,
          created_at: '2026-01-01T00:00:00Z',
        })
      })

      expect(result.current.token).not.toBeNull()

      act(() => {
        result.current.logout()
      })

      expect(result.current.token).toBeNull()
      expect(result.current.user).toBeNull()
    })
  })

  describe('CartStore', () => {
    beforeEach(() => {
      useCartStore.setState({
        cart: null,
        isLoading: false,
      })
    })

    it('should initialize with null cart', () => {
      const { result } = renderHook(() => useCartStore())
      expect(result.current.cart).toBeNull()
      expect(result.current.isLoading).toBe(false)
    })

    it('should set cart data', () => {
      const { result } = renderHook(() => useCartStore())

      const mockCart = {
        items: [
          {
            id: 1,
            variant_id: 1,
            quantity: 2,
            variant: {
              id: 1,
              color: 'Black',
              size: 'M',
              price: 24.99,
              stock: 100,
              product_city: 'Riga',
              product_city_lv: 'Rīga',
              product_image: 'riga.svg',
            },
          },
        ],
        total: 49.98,
        item_count: 2,
      }

      act(() => {
        result.current.setCart(mockCart)
      })

      expect(result.current.cart?.items.length).toBe(1)
      expect(result.current.cart?.total).toBe(49.98)
      expect(result.current.cart?.item_count).toBe(2)
    })

    it('should set loading state', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.setLoading(true)
      })

      expect(result.current.isLoading).toBe(true)

      act(() => {
        result.current.setLoading(false)
      })

      expect(result.current.isLoading).toBe(false)
    })

    it('should clear cart', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.setCart({
          items: [],
          total: 10,
          item_count: 1,
        })
      })

      act(() => {
        result.current.clearCart()
      })

      expect(result.current.cart).toBeNull()
    })
  })

  describe('ChatStore', () => {
    beforeEach(() => {
      useChatStore.setState({
        isOpen: false,
        messages: [],
        isTyping: false,
      })
    })

    it('should initialize with closed chat', () => {
      const { result } = renderHook(() => useChatStore())
      expect(result.current.isOpen).toBe(false)
      expect(result.current.messages).toEqual([])
    })

    it('should toggle chat', () => {
      const { result } = renderHook(() => useChatStore())

      act(() => {
        result.current.toggleChat()
      })

      expect(result.current.isOpen).toBe(true)

      act(() => {
        result.current.toggleChat()
      })

      expect(result.current.isOpen).toBe(false)
    })

    it('should add messages', () => {
      const { result } = renderHook(() => useChatStore())

      act(() => {
        result.current.addMessage({
          id: '1',
          role: 'user',
          content: 'Hello',
          timestamp: new Date(),
        })
      })

      expect(result.current.messages.length).toBe(1)
      expect(result.current.messages[0].content).toBe('Hello')

      act(() => {
        result.current.addMessage({
          id: '2',
          role: 'assistant',
          content: 'Hi there!',
          timestamp: new Date(),
        })
      })

      expect(result.current.messages.length).toBe(2)
    })

    it('should clear messages', () => {
      const { result } = renderHook(() => useChatStore())

      act(() => {
        result.current.addMessage({
          id: '1',
          role: 'user',
          content: 'Hello',
          timestamp: new Date(),
        })
        result.current.clearMessages()
      })

      expect(result.current.messages).toEqual([])
    })
  })

  describe('WishlistStore', () => {
    beforeEach(() => {
      useWishlistStore.setState({
        wishlist: null,
        isLoading: false,
        productIds: new Set(),
      })
    })

    it('should check if product is in wishlist', () => {
      const { result } = renderHook(() => useWishlistStore())

      expect(result.current.isInWishlist(1)).toBe(false)

      act(() => {
        result.current.setWishlist({
          items: [
            {
              id: 1,
              product_id: 1,
              product: {
                id: 1,
                city_name: 'Riga',
                city_name_lv: 'Rīga',
                coat_of_arms_image: 'riga.svg',
                min_price: 24.99,
                total_stock: 100,
              },
              created_at: '2026-01-01T00:00:00Z',
            },
          ],
          count: 1,
        })
      })

      expect(result.current.isInWishlist(1)).toBe(true)
      expect(result.current.isInWishlist(2)).toBe(false)
    })
  })

  describe('RecentlyViewedStore', () => {
    beforeEach(() => {
      useRecentlyViewedStore.setState({
        items: [],
      })
    })

    it('should add items and deduplicate', () => {
      const { result } = renderHook(() => useRecentlyViewedStore())

      act(() => {
        result.current.addItem({
          id: 1,
          city_name: 'Riga',
          city_name_lv: 'Rīga',
          coat_of_arms_image: 'riga.svg',
          min_price: 24.99,
        })
      })

      expect(result.current.items.length).toBe(1)

      // Add same item again - should not duplicate
      act(() => {
        result.current.addItem({
          id: 1,
          city_name: 'Riga',
          city_name_lv: 'Rīga',
          coat_of_arms_image: 'riga.svg',
          min_price: 24.99,
        })
      })

      expect(result.current.items.length).toBe(1)

      // Add different item
      act(() => {
        result.current.addItem({
          id: 2,
          city_name: 'Liepaja',
          city_name_lv: 'Liepāja',
          coat_of_arms_image: 'liepaja.svg',
          min_price: 24.99,
        })
      })

      expect(result.current.items.length).toBe(2)
      // Most recent should be first
      expect(result.current.items[0].productId).toBe(2)
    })

    it('should clear items', () => {
      const { result } = renderHook(() => useRecentlyViewedStore())

      act(() => {
        result.current.addItem({
          id: 1,
          city_name: 'Riga',
          city_name_lv: 'Rīga',
          coat_of_arms_image: 'riga.svg',
          min_price: 24.99,
        })
        result.current.clearItems()
      })

      expect(result.current.items).toEqual([])
    })
  })
})
