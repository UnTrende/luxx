# PR: Real-backend product flow, atomic orders, DB-driven availability, admin analytics, and UX hardening

Summary
- Enforce real Supabase backend (removed mock API and constants data)
- Atomic stock decrement for product orders via Postgres RPC
- Availability driven from DB using barber_settings (+ RLS policies)
- Admin analytics: product sales (daily revenue + top products) with selectable window (7/30/90)
- UX hardening: toast-based errors, improved booking/order flows, disabled invalid controls

Key changes
- backend/migrations
  - 20251126000000_create_decrement_product_stock.sql
  - 20251126000001_create_barber_settings.sql
  - 20251126000002_barber_settings_policies.sql
- edge functions
  - Updated: create-product-order (uses decrement_product_stock)
  - Updated: get-available-slots (reads barber_settings)
  - Updated: update-barber-availability (writes barber_settings)
  - New: get-product-sales (analytics)
- frontend
  - services/api.ts: force realApi; added getProductSales; normalized order response
  - Removed: services/mockApi.ts, test-booking.html
  - constants.ts: cleared mock datasets
  - ProductsPage/ProductOrderPage: robust number handling, fallbacks, disabled +/- at bounds, toasts
  - Booking flow:
    - ServiceSelectionStep: toast on failure
    - DateTimeSelectionStep: toasts on slot loading errors + fallback
    - BookingPage: success toast + auto-nav to My Bookings
  - BarberDashboardPage: load & save hidden hours; toasts on availability/attendance
  - AdminDashboardPageNew: integrated product sales analytics with day selector; replaced alerts with toasts
  - MyOrdersPage: toast on load failure

Deployment steps
1) Apply migrations in supabase/migrations in this order:
   - 20251126000000_create_decrement_product_stock.sql
   - 20251126000001_create_barber_settings.sql
   - 20251126000002_barber_settings_policies.sql
2) Deploy/refresh edge functions:
   - create-product-order, get-available-slots, update-barber-availability, get-product-sales
3) Confirm env vars in frontend:
   - VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
4) Build and smoke test

E2E verification checklist (summary)
- Customer
  - Products list loads; out-of-stock UI disabled; product detail uses fallback image
  - Order placement logged-in: success toast → auto-navigate to My Bookings; stock decremented
  - My Orders: newest first; handles missing/invalid data gracefully
  - Booking flow: services load; available slots respect DB hidden hours; success toast + nav
- Barber
  - Availability grid: reflects saved hidden hours on mount; save shows success toast
  - Attendance actions: success/failure toasts; state updates
- Admin
  - Services/products CRUD incl. images; error toasts on failures
  - Bookings/orders status updates; lists refresh on failure
  - Rosters: list/edit/delete; toasts on result
  - Analytics: product sales with 7/30/90 selector

Notes
- Breaking: mock data and constants removed; real Supabase required
- Concurrency-safe stock decrement via RPC; consider similar approach for other counters if added later

Closes: Integrate real backend for products/orders; Remove mock data; DB-driven availability; Admin product analytics; UX hardening.
