/**
 * Shared test data for E2E tests.
 */

export const testUser = {
  email: 'e2e-test@example.com',
  password: 'TestPass123!',
}

export const testGuestEmail = 'guest-e2e@example.com'

export const testShippingAddress = {
  name: 'Test User',
  address: '123 Test Street',
  city: 'Riga',
  postalCode: 'LV-1001',
  country: 'Latvia',
}

export const testProduct = {
  id: 1,
  cityName: 'Riga',
  cityNameLv: 'Rīga',
}

export const routes = {
  home: '/',
  products: '/products',
  product: (id: number) => `/products/${id}`,
  cart: '/cart',
  checkout: '/checkout',
  checkoutSuccess: '/checkout/success',
  login: '/login',
  register: '/register',
  account: '/account',
  orders: '/account/orders',
  wishlist: '/wishlist',
}

export const selectors = {
  // Navigation
  header: '[data-slot="header"]',
  cartIcon: '[data-testid="cart-icon"]',
  userMenu: '[data-testid="user-menu"]',

  // Products
  productCard: '[data-slot="product-card"]',
  addToCartButton: '[data-testid="add-to-cart"]',
  colorSelector: '[data-slot="color-selector"]',
  sizeSelector: '[data-slot="size-selector"]',

  // Cart
  cartItem: '[data-testid="cart-item"]',
  cartTotal: '[data-testid="cart-total"]',
  checkoutButton: '[data-testid="checkout-button"]',

  // Forms
  emailInput: 'input[name="email"]',
  passwordInput: 'input[name="password"]',
  submitButton: 'button[type="submit"]',

  // Common
  loadingSpinner: '[data-testid="loading"]',
  errorMessage: '[role="alert"]',
  toast: '[data-sonner-toast]',
}
