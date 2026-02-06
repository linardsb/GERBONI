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
  home: '/en',
  products: '/en/products',
  product: (id: number) => `/en/products/${id}`,
  cart: '/en/cart',
  checkout: '/en/checkout',
  checkoutSuccess: '/en/checkout/success',
  login: '/en/login',
  register: '/en/register',
  account: '/en/account',
  orders: '/en/account/orders',
  wishlist: '/en/wishlist',
}

export const selectors = {
  // Navigation
  header: '[data-slot="header"]',
  cartIcon: '[data-testid="cart-icon"]',
  userMenu: '[data-testid="user-menu"]',

  // Products
  productCard: '[data-slot="product-card"]',
  addToCartButton: 'button:has-text("Add to cart"), button:has-text("Pievienot grozam")',
  colorSelector: '[data-slot="color-selector"]',
  colorButton: '[data-slot="color-selector"] button',
  sizeSelector: '[data-slot="size-selector"]',
  sizeButton: '[data-slot="size-selector"] button',

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
