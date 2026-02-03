# T-Shirt Webstore — Pages & Quick Wins

## Page Structure

```
├── 🏠 Core Shopping Flow
│   ├── /                           # Home
│   ├── /collections                # All collections
│   │   └── /collections/{slug}     # Category/Collection listing
│   ├── /products/{slug}            # Product detail
│   ├── /cart                       # Shopping cart
│   ├── /checkout                   # Checkout process
│   ├── /order/confirmation/{id}    # Order confirmation
│   └── /order/track/{id}           # Order tracking/status
│
├── 👤 User Account
│   ├── /login                      # Login
│   ├── /register                   # Register
│   ├── /password-reset             # Password reset
│   ├── /account                    # My account dashboard
│   │   ├── /account/orders         # Order history
│   │   ├── /account/orders/{id}    # Order detail
│   │   ├── /account/addresses      # Saved addresses
│   │   ├── /account/settings       # Profile settings
│   │   └── /account/wishlist       # Wishlist/favorites
│   └── /logout                     # Logout action
│
├── 🛟 Trust & Support
│   ├── /size-guide                 # Size guide
│   ├── /shipping                   # Shipping & delivery info
│   ├── /returns                    # Returns & exchanges policy
│   ├── /contact                    # Contact us
│   └── /faq                        # FAQ
│
├── 📄 Brand & Legal
│   ├── /about                      # About us
│   ├── /privacy                    # Privacy policy
│   ├── /terms                      # Terms & conditions
│   └── /cookies                    # Cookie policy
│
├── 🚀 Optional / Growth
│   ├── /blog                       # Blog/lookbook
│   │   └── /blog/{slug}            # Blog post
│   ├── /reviews                    # Reviews page
│   ├── /gift-cards                 # Gift cards
│   ├── /wholesale                  # Bulk/wholesale inquiry
│   └── /referral                   # Refer a friend
│
└── ⚠️ System Pages
    ├── /404                        # Not found
    ├── /500                        # Server error
    └── /maintenance                # Maintenance mode
```

---

## Quick Wins Structure

```
├── 🛒 Product & Cart UX
│   ├── Size guide modal            # Popup on product pages, reduces returns
│   ├── Color swatch + live swap    # Click color, image updates instantly
│   ├── Low stock indicator         # "Only 3 left in M" urgency
│   ├── Quick-add from grid         # Add to cart without opening product page
│   ├── Sticky add-to-cart          # Fixed button on mobile scroll
│   ├── Care instructions           # Washing/drying info on product page
│   └── Persistent cart             # localStorage + backend sync on login
│
├── 🔍 Discovery & Engagement
│   ├── Recently viewed             # Track and show last seen products
│   ├── "You may also like"         # Related product recommendations
│   ├── Social proof                # Reviews count, "X bought this week"
│   └── Wishlist quick-add          # Heart icon on product cards
│
├── 💳 Checkout Optimization
│   ├── Guest checkout              # No forced account creation
│   ├── Trust badges                # Stripe logo, SSL, easy returns icons
│   ├── Progress indicator          # Step 1/2/3 visual in checkout
│   └── Saved payment methods       # For returning customers
│
├── 📧 Conversion & Retention
│   ├── Email popup                 # "10% off first order" capture
│   ├── Exit-intent offer           # Trigger on cart page mouse-leave
│   ├── Abandoned cart email        # Automated recovery sequence
│   └── Back-in-stock alerts        # Notify when size available
│
└── ⚡ Performance & Polish
    ├── Skeleton loaders            # Loading states for product grids
    ├── Image lazy loading          # Load images as user scrolls
    ├── Optimistic cart updates     # Instant UI feedback, sync async
    └── Smooth page transitions     # Fade/slide between routes
```

---

## Implementation Checklist

### Phase 1 — MVP (Launch)
- [ ] Home
- [ ] Collection listing
- [ ] Product detail + size guide modal
- [ ] Cart + persistent cart
- [ ] Checkout + guest checkout
- [ ] Order confirmation
- [ ] Login / Register
- [ ] Contact
- [ ] Privacy policy
- [ ] Terms & conditions

### Phase 2 — Trust & Retention
- [ ] Order history
- [ ] Order tracking
- [ ] Shipping info page
- [ ] Returns policy page
- [ ] FAQ
- [ ] About us
- [ ] Email popup (10% off)
- [ ] Trust badges at checkout

### Phase 3 — Growth
- [ ] Wishlist
- [ ] Recently viewed
- [ ] Product recommendations
- [ ] Reviews integration
- [ ] Low stock indicators
- [ ] Exit-intent offer
- [ ] Abandoned cart emails
- [ ] Back-in-stock alerts

### Phase 4 — Expansion
- [ ] Blog / Lookbook
- [ ] Gift cards
- [ ] Wholesale inquiry
- [ ] Referral program
- [ ] Saved payment methods

---

## Notes

- **Size guide** is critical for apparel — expect 20-30% fewer returns
- **Guest checkout** typically increases conversion by 10-15%
- **Persistent cart** handles the "added on mobile, checkout on desktop" flow
- **Low stock urgency** works best when real — fake scarcity damages trust
