"""
GERBONI Load Testing Scenarios

Simulates real user behavior against the API:
- Browsing products (most common)
- Cart operations
- Auth flows
- Checkout flows

Usage:
    locust -f locustfile.py --host=http://localhost:8000
    locust -f locustfile.py --host=http://localhost:8000 --headless -u 50 -r 5 -t 60s
"""

import random
import string

from locust import HttpUser, task, between, tag


# Product IDs 1-10 (from seed data)
PRODUCT_IDS = list(range(1, 11))
COLORS = ["Black", "White", "Red", "Navy", "Gray", "Forest Green"]
SIZES = ["XS", "S", "M", "L", "XL", "XXL"]
CITIES = ["Riga", "Liepaja", "Ventspils", "Jelgava", "Jurmala"]


def random_email():
    suffix = "".join(random.choices(string.ascii_lowercase, k=8))
    return f"loadtest_{suffix}@example.com"


def random_password():
    return f"LoadTest{random.randint(1000, 9999)}!"


class BrowsingUser(HttpUser):
    """Simulates users browsing the product catalog."""

    weight = 3
    wait_time = between(1, 3)

    @tag("browse")
    @task(5)
    def list_products(self):
        self.client.get("/api/products")

    @tag("browse")
    @task(3)
    def search_products(self):
        city = random.choice(CITIES)
        self.client.get(f"/api/products?q={city}")

    @tag("browse")
    @task(2)
    def filter_products(self):
        params = {}
        if random.random() > 0.5:
            params["color"] = random.choice(COLORS)
        if random.random() > 0.5:
            params["size"] = random.choice(SIZES)
        if random.random() > 0.7:
            params["sort"] = random.choice(["price_asc", "price_desc", "name_asc", "newest"])
        self.client.get("/api/products", params=params)

    @tag("browse")
    @task(4)
    def view_product(self):
        pid = random.choice(PRODUCT_IDS)
        self.client.get(f"/api/products/{pid}")

    @tag("browse")
    @task(2)
    def view_variants(self):
        pid = random.choice(PRODUCT_IDS)
        self.client.get(f"/api/products/{pid}/variants")


class CartUser(HttpUser):
    """Simulates users interacting with cart."""

    weight = 2
    wait_time = between(1, 5)

    def on_start(self):
        """Create a guest session for cart operations."""
        resp = self.client.post("/api/auth/guest-session", json={})
        if resp.status_code == 200:
            self.session_token = resp.json().get("session_token")
        else:
            self.session_token = None
        self.cart_item_ids = []

    def _headers(self):
        if self.session_token:
            return {"X-Guest-Session": self.session_token}
        return {}

    @tag("cart")
    @task(3)
    def add_to_cart(self):
        # Pick a random variant (product_id * 9 offsets for 9 variants each)
        variant_id = random.randint(1, 90)
        resp = self.client.post(
            "/api/cart",
            json={"variant_id": variant_id, "quantity": random.randint(1, 3)},
            headers=self._headers(),
        )
        if resp.status_code == 200:
            data = resp.json()
            self.cart_item_ids = [item["id"] for item in data.get("items", [])]

    @tag("cart")
    @task(4)
    def view_cart(self):
        self.client.get("/api/cart", headers=self._headers())

    @tag("cart")
    @task(1)
    def update_cart_item(self):
        if self.cart_item_ids:
            item_id = random.choice(self.cart_item_ids)
            self.client.put(
                f"/api/cart/{item_id}",
                json={"quantity": random.randint(1, 5)},
                headers=self._headers(),
            )

    @tag("cart")
    @task(1)
    def remove_cart_item(self):
        if self.cart_item_ids:
            item_id = self.cart_item_ids.pop()
            self.client.delete(f"/api/cart/{item_id}", headers=self._headers())


class AuthUser(HttpUser):
    """Simulates registration and login flows."""

    weight = 1
    wait_time = between(2, 5)

    def on_start(self):
        self.email = random_email()
        self.password = random_password()
        self.token = None

    @tag("auth")
    @task(2)
    def register_and_login(self):
        email = random_email()
        password = random_password()

        resp = self.client.post(
            "/api/auth/register",
            json={"email": email, "password": password},
        )
        if resp.status_code == 200:
            resp = self.client.post(
                "/api/auth/login",
                json={"email": email, "password": password},
            )
            if resp.status_code == 200:
                self.token = resp.json().get("access_token")

    @tag("auth")
    @task(3)
    def login_existing(self):
        if not self.token:
            # Register first
            self.register_and_login()
            return

        self.client.post(
            "/api/auth/login",
            json={"email": self.email, "password": self.password},
        )

    @tag("auth")
    @task(2)
    def get_profile(self):
        if self.token:
            self.client.get(
                "/api/auth/me",
                headers={"Authorization": f"Bearer {self.token}"},
            )

    @tag("auth")
    @task(1)
    def create_guest_session(self):
        self.client.post("/api/auth/guest-session", json={})


class CheckoutUser(HttpUser):
    """Simulates the full checkout flow."""

    weight = 1
    wait_time = between(3, 8)

    def on_start(self):
        """Set up a guest session."""
        email = random_email()
        resp = self.client.post(
            "/api/auth/guest-session",
            json={"email": email},
        )
        if resp.status_code == 200:
            data = resp.json()
            self.session_token = data.get("session_token")
            self.guest_email = email
        else:
            self.session_token = None
            self.guest_email = None

    def _headers(self):
        if self.session_token:
            return {"X-Guest-Session": self.session_token}
        return {}

    @tag("checkout")
    @task
    def full_checkout_flow(self):
        if not self.session_token:
            return

        # 1. Browse products
        self.client.get("/api/products")

        # 2. View a product
        pid = random.choice(PRODUCT_IDS)
        resp = self.client.get(f"/api/products/{pid}")

        # 3. Add to cart
        variant_id = random.randint(1, 90)
        self.client.post(
            "/api/cart",
            json={"variant_id": variant_id, "quantity": 1},
            headers=self._headers(),
        )

        # 4. View cart
        self.client.get("/api/cart", headers=self._headers())

        # 5. Create order
        self.client.post(
            "/api/orders",
            json={
                "shipping": {
                    "name": "Load Test User",
                    "address": "123 Test Street",
                    "city": "Riga",
                    "postal_code": "LV-1001",
                    "country": "Latvia",
                },
                "guest_email": self.guest_email,
            },
            headers=self._headers(),
        )
