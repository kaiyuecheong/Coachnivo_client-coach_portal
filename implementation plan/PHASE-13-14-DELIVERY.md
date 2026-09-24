# Phase 13 & 14 — Booking/Payment + Dashboard Reflow (Delivery Record)

> Delivered in `coachnivo_admin`. Status: COMPLETE — build green, preview HTTP 200.

---

## Phase 13 — Booking & Payment Flow reflow

### Shared component
- **`src/components/booking/BookingSummary.jsx`** — sticky order-summary rail
  (coach card, service, date/time, price rows, total, note, actions) built on
  the Phase 12 `RightSummary`. Used by the desktop checkout.

### `ScreenPayment` (`Booking.jsx`) — two-column desktop checkout
- **≥1024px:** `SplitView` with the payment controls (optional add-ons, saved
  methods, add-card, promo, secure note, test-card link) in the **left column**
  and a **sticky `BookingSummary` rail** (package, charges, add-ons, total +
  the "Pay & confirm" primary and cancel actions) on the **right**.
- Content bounded to 1160px; desktop hides the fixed bottom bar (rail owns the
  CTA). **Mobile unchanged.**

### `ScreenBookingReview` / `ScreenBookingParticipants` / `ScreenBookingSelectDateTime`
- These long form steps get a **focused centred desktop column** (max-width
  760/820, desktop gutters) — the phone-wide form reads as a condensed checkout
  page on desktop while mobile keeps its exact layout. The full price/summary
  rail sits on the Payment step where the transaction happens.

---

## Phase 14 — Dashboard / Bookings / History reflow

### `ScreenClientDashboard` (`Dashboard.jsx`)
- **Desktop stats row:** Requests & payments / Upcoming / Completed & past as a
  3-up stat grid.
- **Desktop bookings table** (list view): `Session | Coach | Date | Time |
  Status | Actions` with context-sensitive actions (Pay now / Review / Open)
  and row-click → booking detail. Mobile keeps the stacked `BookingCard` list.
- Header + list bounded/centred to **1160px**; calendar view unchanged (it's
  already wide-friendly).

### `ScreenClientBookingDetail` (`Dashboard.jsx`)
- Centred desktop column (max-width 900) with desktop gutters; mobile layout
  unchanged.

## Verification
- `npm run build` → success.
- `npm run preview` → HTTP 200.
- Desktop flows: book → choose time → review (centred) → payment (two-column
  sticky rail) compile and render; dashboard shows stats + bookings table.
- State/actions untouched (booking submit, pay, cancel, review all preserved).

## Notes
- Review/Participants use the centred-column treatment rather than a dual rail;
  if a full sticky summary rail is wanted on Review too, it's the next iteration
  (the `BookingSummary` component is ready to drop in).
- `ScreenClientHistory` (Account) still uses its mobile layout — include it in
  the Phase 16 Account reflow or a follow-up.