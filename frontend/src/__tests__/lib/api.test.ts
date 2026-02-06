/**
 * Tests for the API client.
 */

import { describe, it, expect } from 'vitest'
import {
  getProducts,
  getProduct,
  login,
  register,
  getMe,
  createGuestSession,
  changePassword,
  getCart,
  addToCart,
  getOrders,
  getAddresses,
  createAddress,
} from '@/lib/api'

describe('API Client', () => {
  describe('Products API', () => {
    it('should fetch products list', async () => {
      const products = await getProducts()
      expect(products).toBeInstanceOf(Array)
      expect(products.length).toBeGreaterThan(0)
      expect(products[0]).toHaveProperty('city_name')
      expect(products[0]).toHaveProperty('coat_of_arms_image')
    })

    it('should fetch a single product with variants', async () => {
      const product = await getProduct(1)
      expect(product).toHaveProperty('city_name', 'Riga')
      expect(product).toHaveProperty('variants')
      expect(product.variants).toBeInstanceOf(Array)
      expect(product.variants[0]).toHaveProperty('color')
      expect(product.variants[0]).toHaveProperty('size')
      expect(product.variants[0]).toHaveProperty('price')
    })

    it('should throw error for non-existent product', async () => {
      await expect(getProduct(99999)).rejects.toThrow()
    })
  })

  describe('Auth API', () => {
    it('should login with valid credentials', async () => {
      const response = await login('test@example.com', 'TestPass123')
      expect(response).toHaveProperty('access_token')
      expect(response).toHaveProperty('token_type', 'bearer')
    })

    it('should reject login with invalid credentials', async () => {
      await expect(login('test@example.com', 'WrongPass')).rejects.toThrow('Incorrect')
    })

    it('should register a new user', async () => {
      const user = await register('new@example.com', 'NewPass123')
      expect(user).toHaveProperty('email', 'new@example.com')
      expect(user).toHaveProperty('is_guest', false)
    })

    it('should get current user with valid token', async () => {
      const user = await getMe('mock-jwt-token')
      expect(user).toHaveProperty('email')
      expect(user).toHaveProperty('is_active', true)
    })

    it('should create guest session', async () => {
      const session = await createGuestSession()
      expect(session).toHaveProperty('session_token')
      expect(session).toHaveProperty('expires_at')
    })

    it('should change password with valid current password', async () => {
      const response = await changePassword(
        { current_password: 'TestPass123', new_password: 'NewPass456' },
        'mock-jwt-token'
      )
      expect(response).toHaveProperty('message')
      expect(response.message).toContain('successfully')
    })

    it('should reject password change with wrong current password', async () => {
      await expect(
        changePassword(
          { current_password: 'WrongPass', new_password: 'NewPass456' },
          'mock-jwt-token'
        )
      ).rejects.toThrow('incorrect')
    })
  })

  describe('Cart API', () => {
    it('should fetch empty cart', async () => {
      const cart = await getCart('mock-jwt-token')
      expect(cart).toHaveProperty('items')
      expect(cart).toHaveProperty('total')
      expect(cart).toHaveProperty('item_count')
    })

    it('should add item to cart', async () => {
      const cart = await addToCart(1, 2, 'mock-jwt-token')
      expect(cart.items.length).toBeGreaterThan(0)
      expect(cart.item_count).toBeGreaterThan(0)
    })
  })

  describe('Orders API', () => {
    it('should fetch orders list', async () => {
      const orders = await getOrders('mock-jwt-token')
      expect(orders).toBeInstanceOf(Array)
    })
  })

  describe('Addresses API', () => {
    it('should fetch addresses list', async () => {
      const addresses = await getAddresses('mock-jwt-token')
      expect(addresses).toBeInstanceOf(Array)
    })

    it('should create a new address', async () => {
      const address = await createAddress(
        {
          name: 'Test User',
          address_line1: '123 Test St',
          city: 'Riga',
          postal_code: 'LV-1001',
          country: 'Latvia',
        },
        'mock-jwt-token'
      )
      expect(address).toHaveProperty('id')
      expect(address).toHaveProperty('name', 'Test User')
      expect(address).toHaveProperty('city', 'Riga')
    })
  })
})
