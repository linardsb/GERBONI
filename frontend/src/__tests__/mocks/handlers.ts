/**
 * MSW request handlers for API mocking in tests.
 */

import { http, HttpResponse } from 'msw'

const API_URL = 'http://localhost:8000/api'

// Sample test data
const mockProducts = [
  {
    id: 1,
    city_name: 'Riga',
    city_name_lv: 'Rīga',
    coat_of_arms_image: 'riga.svg',
    description: 'T-shirt featuring the coat of arms of Riga',
    description_lv: 'T-krekls ar Rīgas ģerboni',
    is_active: true,
    min_price: 24.99,
    total_stock: 100,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 2,
    city_name: 'Liepaja',
    city_name_lv: 'Liepāja',
    coat_of_arms_image: 'liepaja.svg',
    description: 'T-shirt featuring the coat of arms of Liepaja',
    description_lv: 'T-krekls ar Liepājas ģerboni',
    is_active: true,
    min_price: 24.99,
    total_stock: 100,
    created_at: '2026-01-01T00:00:00Z',
  },
]

const mockUser = {
  id: 1,
  email: 'test@example.com',
  is_guest: false,
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
}

const mockCart = {
  items: [],
  total: 0,
  item_count: 0,
}

const mockOrders: Record<string, unknown>[] = []

const mockAddresses: Record<string, unknown>[] = []

export const handlers = [
  // Products
  http.get(`${API_URL}/products`, () => {
    return HttpResponse.json(mockProducts)
  }),

  http.get(`${API_URL}/products/:id`, ({ params }) => {
    const product = mockProducts.find(p => p.id === Number(params.id))
    if (!product) {
      return new HttpResponse(null, { status: 404 })
    }
    return HttpResponse.json({
      ...product,
      variants: [
        { id: 1, color: 'Black', size: 'M', price: 24.99, stock: 100, sku: 'RIG-BLA-M' },
        { id: 2, color: 'White', size: 'M', price: 24.99, stock: 100, sku: 'RIG-WHI-M' },
      ],
    })
  }),

  // Auth
  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string }
    if (body.email === 'test@example.com' && body.password === 'TestPass123') {
      return HttpResponse.json({
        access_token: 'mock-jwt-token',
        token_type: 'bearer',
      })
    }
    return new HttpResponse(
      JSON.stringify({ detail: 'Incorrect email or password' }),
      { status: 401 }
    )
  }),

  http.post(`${API_URL}/auth/register`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string }
    return HttpResponse.json({
      id: 2,
      email: body.email,
      is_guest: false,
      is_active: true,
      created_at: new Date().toISOString(),
    })
  }),

  http.get(`${API_URL}/auth/me`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new HttpResponse(null, { status: 401 })
    }
    return HttpResponse.json(mockUser)
  }),

  http.post(`${API_URL}/auth/guest-session`, () => {
    return HttpResponse.json({
      id: 1,
      session_token: 'mock-guest-token',
      email: null,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
  }),

  http.post(`${API_URL}/auth/me/change-password`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return new HttpResponse(null, { status: 401 })
    }
    const body = await request.json() as { current_password: string; new_password: string }
    if (body.current_password !== 'TestPass123') {
      return new HttpResponse(
        JSON.stringify({ detail: 'Current password is incorrect' }),
        { status: 400 }
      )
    }
    return HttpResponse.json({ message: 'Password changed successfully' })
  }),

  // Cart
  http.get(`${API_URL}/cart`, () => {
    return HttpResponse.json(mockCart)
  }),

  http.post(`${API_URL}/cart`, async ({ request }) => {
    const body = await request.json() as { variant_id: number; quantity: number }
    const newItem = {
      id: mockCart.items.length + 1,
      variant_id: body.variant_id,
      quantity: body.quantity,
      variant: {
        id: body.variant_id,
        color: 'Black',
        size: 'M',
        price: 24.99,
        stock: 100,
        product_city: 'Riga',
        product_city_lv: 'Rīga',
        product_image: 'riga.svg',
      },
    }
    mockCart.items.push(newItem as never)
    mockCart.total = mockCart.items.reduce((sum: number, item: { quantity: number; variant: { price: number } }) =>
      sum + (item.quantity * item.variant.price), 0)
    mockCart.item_count = mockCart.items.reduce((sum: number, item: { quantity: number }) =>
      sum + item.quantity, 0)
    return HttpResponse.json(mockCart)
  }),

  // Orders
  http.get(`${API_URL}/orders`, () => {
    return HttpResponse.json(mockOrders)
  }),

  http.get(`${API_URL}/orders/:id`, ({ params }) => {
    const order = mockOrders.find(o => o.id === Number(params.id))
    if (!order) {
      return new HttpResponse(null, { status: 404 })
    }
    return HttpResponse.json(order)
  }),

  http.post(`${API_URL}/orders`, async ({ request }) => {
    const body = await request.json() as { shipping: Record<string, string> }
    const order = {
      id: mockOrders.length + 1,
      status: 'pending',
      total: mockCart.total,
      items: mockCart.items,
      shipping_name: body.shipping.name,
      shipping_address: body.shipping.address,
      shipping_city: body.shipping.city,
      shipping_postal_code: body.shipping.postal_code,
      shipping_country: body.shipping.country,
      tracking_number: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    mockOrders.push(order)
    // Clear cart after order
    mockCart.items = []
    mockCart.total = 0
    mockCart.item_count = 0
    return HttpResponse.json(order)
  }),

  // Addresses
  http.get(`${API_URL}/addresses`, () => {
    return HttpResponse.json(mockAddresses)
  }),

  http.post(`${API_URL}/addresses`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    const address = {
      id: mockAddresses.length + 1,
      user_id: 1,
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    mockAddresses.push(address)
    return HttpResponse.json(address)
  }),

  http.put(`${API_URL}/addresses/:id`, async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>
    const index = mockAddresses.findIndex(a => a.id === Number(params.id))
    if (index === -1) {
      return new HttpResponse(null, { status: 404 })
    }
    mockAddresses[index] = { ...mockAddresses[index], ...body }
    return HttpResponse.json(mockAddresses[index])
  }),

  http.delete(`${API_URL}/addresses/:id`, ({ params }) => {
    const index = mockAddresses.findIndex(a => a.id === Number(params.id))
    if (index === -1) {
      return new HttpResponse(null, { status: 404 })
    }
    mockAddresses.splice(index, 1)
    return new HttpResponse(null, { status: 204 })
  }),

  // Wishlist
  http.get(`${API_URL}/wishlist`, () => {
    return HttpResponse.json({ items: [], count: 0 })
  }),

  // Recommendations
  http.get(`${API_URL}/recommendations/popular`, () => {
    return HttpResponse.json(mockProducts)
  }),

  // Payments - Stripe checkout
  http.post(`${API_URL}/payments/create-checkout`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return new HttpResponse(null, { status: 401 })
    }
    const url = new URL(request.url)
    const orderId = url.searchParams.get('order_id')
    if (!orderId) {
      return new HttpResponse(
        JSON.stringify({ detail: 'Order ID required' }),
        { status: 400 }
      )
    }
    return HttpResponse.json({
      checkout_url: `https://checkout.stripe.com/pay/cs_test_${orderId}`,
    })
  }),

  http.get(`${API_URL}/payments/session/:sessionId`, ({ params }) => {
    return HttpResponse.json({
      status: 'complete',
      payment_status: 'paid',
      order_id: '1',
    })
  }),

  // Product variants
  http.get(`${API_URL}/products/:id/variants`, ({ params }) => {
    const productId = Number(params.id)
    const product = mockProducts.find(p => p.id === productId)
    if (!product) {
      return new HttpResponse(null, { status: 404 })
    }
    return HttpResponse.json([
      { id: 1, color: 'Black', size: 'S', price: 24.99, stock: 100, sku: `${product.city_name.toUpperCase().slice(0, 3)}-BLA-S` },
      { id: 2, color: 'Black', size: 'M', price: 24.99, stock: 100, sku: `${product.city_name.toUpperCase().slice(0, 3)}-BLA-M` },
      { id: 3, color: 'Black', size: 'L', price: 24.99, stock: 50, sku: `${product.city_name.toUpperCase().slice(0, 3)}-BLA-L` },
      { id: 4, color: 'White', size: 'M', price: 24.99, stock: 75, sku: `${product.city_name.toUpperCase().slice(0, 3)}-WHI-M` },
      { id: 5, color: 'Red', size: 'M', price: 24.99, stock: 25, sku: `${product.city_name.toUpperCase().slice(0, 3)}-RED-M` },
    ])
  }),

  // Cart update/delete
  http.put(`${API_URL}/cart/:id`, async ({ params, request }) => {
    const body = await request.json() as { quantity: number }
    return HttpResponse.json({
      id: Number(params.id),
      quantity: body.quantity,
      variant_id: 1,
      variant: {
        id: 1,
        color: 'Black',
        size: 'M',
        price: 24.99,
        stock: 100,
      },
    })
  }),

  http.delete(`${API_URL}/cart/:id`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // Order cancel
  http.delete(`${API_URL}/orders/:id`, ({ params }) => {
    return HttpResponse.json({ status: 'cancelled' })
  }),
]
