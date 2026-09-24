# Phase 6, 7 & 8 — Portal Shell, Routing/State Refactor & Primitives (Delivery Record)

> Delivered in `coachnivo_admin`. Status: COMPLETE — `npm run build` green
> (1577 modules), preview serves HTTP 200.

---

## What was delivered

### Phase 6 — Portal Shell & Navigation (`src/App.jsx` → PortalShell)

- **Desktop (≥1024):** persistent left sidebar (248px) with brand, role label,
  nav items, notifications bell (+unread dot), help, dark-mode toggle.
- **Tablet (640–1023):** the same nav collapses to a 72px icon rail.
- **Mobile (<640):** no shell chrome; the existing `BottomTabs` glass tab bar
  renders over tab screens (familiar mobile pattern).
- **Nav model** derives from the original tab definitions (`CLIENT_NAV`,
  `COACH_NAV`) — identical labels/icons to the mobile app.
- **Decommissioned:** the studio sidebar, preview toolbar, device frame, role
  switcher, screenshot tooling, and touch-dot simulation are gone.

### Phase 7 — Routing, App Shell & State Refactor

- **`src/router/routes.js`** rewritten → **81 in-scope routes** only;
  business, business-coach, and client business-marketplace routes removed.
- **Real navigation:** `nav`/`resetNav` + hash sync (`#/screen`); hashchange
  listener for back/forward + deep links. Studio demo jumps removed. (Params
  stay in memory — screen names only are reflected in the URL to avoid
  string-encoding type corruption.)
- **`src/context/AppContext.jsx` stripped:**
  - Removed: business state/actions (`business`, `businesses`,
    `businessPrograms`, `businessLocations`, `businessRoster`,
    `businessMedia`, `businessReviews`, `businessOnboarding`, billing,
    payouts, coaches payouts, invite, programs, bookings,
    `simulateBusinessDecision`, …), `resetAll`, `setOffline`,
    business/businessCoach notification slices.
  - Kept: client + coach + bookings + payment + session lifecycle + OTP +
    verification + notifications + location + dark mode. `businessBookings`
    stays as an **empty pool** so shared lifecycle functions keep their shape
    (no business data seeded → no business UI anywhere).
  - Client `bookings` seed no longer merges `INITIAL_BUSINESS_BOOKINGS`.
- **Removed files:** `utils/screenshot.js`, `utils/screenChrome.js` were never
  ported; `StatusBar`/phone chrome no longer rendered.
- **Screens ported (excluded unchanged):** 81 routes across onboarding, client,
  coach, messaging, shared, support. `screens/business/*`,
  `BusinessCoachScreens.jsx`, `BusinessDiscovery.jsx`,
  `BusinessBookingPayment.jsx`, `components/business/*`,
  `FeaturedBusinessCarousel.jsx` are NOT in this project.
- **Business-UI surfaces removed from kept screens:**
  - `role-select` — business option removed (client | coach only).
  - `Discovery.jsx` — provider toggle, "Businesses & clubs" chip, business
    cards, `FeaturedBusinessCarousel`, business filter/computation all removed.
  - `SearchResults.jsx` — business/org result sections + navigation removed.
  - `Dashboard.jsx` — business booking-detail branch + import removed.

### Phase 8 — Shared Primitive Evolution

- `Primitives.jsx` (ported) now adapts for tiers:
  - **`TopBar`** → desktop height 64px + wider gutters + larger type.
  - **`BottomActionBar`** → desktop padding (no safe-area excess).
  - **`BottomSheet`** → bottom sheet on mobile, **centered modal ≥1024**
    (drag handle hidden on desktop); overlay ported to fixed viewport layer.
  - `StatusBar`/`BatteryIcon`/phone chrome remain exported but unrendered.
- `useColors()` unified: single source of truth = `AppContext.darkMode`
  (ThemeProvider kept as fallback for isolated previews).

---

## Verification

- `npm run build` → **1577 modules**, success (chunk-size warning is
  expected — Phase 19 adds code splitting).
- `npm run preview` → HTTP 200.
- No **EXCLUDE** route is registered; no business screen reachable.
- Screens still receive the full `AppContext` contract (`{...app}`).

## Notes / known temporary states

- Ported screens currently render their mobile-proportioned layout inside the
  portal (screens provide their own sticky `TopBar`); the **desktop reflow of
  each screen group is phases 10–16** (ContentPage/Grid/SplitView wiring).
- `data/businesses.js` remains in the bundle only because `Messaging.jsx` has
  a dead `role === "business"` branch that imports `BUSINESS_THREADS`; prune in
  phase 11 cleanup.
- Bundle ~1.1 MB un-split — expected until Phase 19.