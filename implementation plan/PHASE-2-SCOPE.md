# Phase 2 — Scope Lock & Exclusion Checklist (Web Portal)

> **Confirmed scope decisions** for converting the mobile prototype to a
> responsive **CoachNivo web portal** (client + coach experiences on the web).
> Business, Business Coach, and client-facing business-marketplace flows are
> excluded. **All prototype-only studio tooling is removed.**
>
> **Delivery location:** `coachnivo_admin`
> **Status:** LOCKED pending sign-off (bottom of file).

---

## 1. Classification legend

| Class | Meaning |
|---|---|
| **KEEP** | Carry over as-is (API/styling preserved). |
| **ADAPT** | Carry over, restructured for desktop/responsive. |
| **REMOVE** | Delete; only existed for prototyping. |
| **EXCLUDE** | Out of product scope for the web portal. |

---

## 2. Screens — keep / adapt / exclude

### 2.1 KEEP / ADAPT — in scope (81 routes)

| Group | Screen routes | Plan |
|---|---|---|
| Onboarding 1/2 | splash, get-started, auth, forgot-password, reset-code, reset-password, verify-email, verify-phone, enable-biometric | **ADAPT** — centered card layout + side stepper on desktop; biometric step shows "enable in app" on desktop |
| Onboarding 2/2 | role-select (client/coach only), coach-info, coach-expertise, verification, verification-pending, verification-rejected | **ADAPT** — trim business/businessCoach options; verification as focused page |
| Client setup | about-you-profile, account-type, about-you-participants, about-you-self, client-setup-complete | **ADAPT** — desktop form grid + stepper |
| Discover / search | client-home, client-search, notifications | **ADAPT** — card grid, left filter rail, top search on desktop |
| Coach detail | coach-profile, coach-media, package-detail, availability-calendar | **ADAPT** — two-column page + sticky booking summary |
| Booking flow | booking-participants, booking-select-datetime, booking-participant-details, booking-datetime, booking-review, payment, payment-add-card, booking-confirmation, booking-request-sent, package-inquiry, package-waitlist, session-prep, refund-status, booking-message | **ADAPT** — two-column checkout w/ order summary |
| Client ops | client-dashboard, client-booking-detail, leave-review, client-history | **ADAPT** — stat grid + table on desktop, cards on mobile |
| Coach ops | coach-dashboard, coach-notifications, coach-calendar, coach-bookings, coach-booking-detail, booking-awaiting-payment, coach-session-detail, coach-accept-booking, coach-earnings, coach-history | **ADAPT** — density + tables/calendars on desktop |
| Coach profile mgmt | coach-profile-edit, coach-reviews, coach-reels, coach-create-package, coach-edit-package, coach-services-setup, coach-availability-setup, coach-payout-setup, coach-setup-complete | **ADAPT** — centered forms + media grid |
| Messages | client-messages, coach-messages, chat-thread | **ADAPT** — three-pane mailbox on desktop |
| Shared | session-completion, coach-session-completion, client-session-start, client-session-code, coach-session-start, session-progress, funds-release-status, dispute-create, dispute-status, additional-charge-create, additional-charge-payment, additional-charge-review | **ADAPT** — dashboard-style flows, focus pages on desktop |
| Support | support | **ADAPT** — FAQ is two-column on desktop |

### 2.2 EXCLUDE (51 routes)

| Group | Routes |
|---|---|
| Business onboarding (6) | business-eligibility, business-identity, business-plan, business-plan-checkout, business-plan-confirmation, business-application-submitted |
| Business ops (25) | business-dashboard, business-bookings, business-notifications, business-roster, business-coach-detail, business-programs, business-program-overview, business-program-form, business-booking-detail, business-messages, business-more, business-locations, business-profile-edit, business-media, business-reviews, business-finance, business-payment-methods, business-payout-setup, business-earnings, business-coach-payouts, business-invoices, business-analytics, business-compliance, business-identity-details, business-insurance-details |
| Client-facing business marketplace (7) | business-directory, business-public-profile, business-coach-public-profile, business-program-detail, business-booking-review, business-booking-payment, business-booking-confirmation |
| Business Coach (13) | business-coach-login, business-coach-home, business-coach-bookings, business-coach-booking-detail, business-coach-programs, business-coach-program-overview, business-coach-earnings, business-coach-account, business-coach-notifications, business-coach-messages, business-coach-access, business-coach-credentials, business-coach-contact |

---

## 3. Files — keep / adapt / remove / exclude

### 3.1 REMOVE (prototype-only)

| File / item | Why |
|---|---|
| `src/App.jsx` studio `AppShell` | Replace with `PortalShell` |
| `src/utils/screenshot.js` | PNG export |
| `src/utils/screenChrome.js` | Status bar branding |
| `StatusBar`, `SignalBars`, `BatteryIcon` (Primitives) | Phone chrome |
| `ROUTE_METADATA`, `ROUTE_DEMO_PARAMS` (jump metadata) | Studio directory |
| `.cl-phone-screen*`, touch-cursor, tap-highlight CSS (`index.css`) | Phone simulation |
| `resetAll` (context) | Demo reset |
| Offline simulator toggle (studio button + context wiring kept as dead-path) | Studio control |

### 3.2 EXCLUDE (business scope)

| File / item | Why |
|---|---|
| `src/screens/business/*` (5 files) | Business role out of scope |
| `src/screens/businessCoach/BusinessCoachScreens.jsx` | Business Coach out of scope |
| `src/screens/client/BusinessDiscovery.jsx`, `BusinessBookingPayment.jsx` | Client business marketplace excluded |
| `src/components/business/*` (2 files) | Business UI atoms |
| `src/components/ui/FeaturedBusinessCarousel.jsx` | Business banner carousel |
| Business data slices: `data/businesses.js` (# if unused post-prune), `BUSINESS_MEDIA_SOURCE` (media.js), `FEATURED_BUSINESS_BANNERS` + `isBusinessDiscoverable` (mockData.js), business chunks in `bookings.js` | Business state/seed |
| `AppContext` business family (state + actions + `business*` notifications) | Business state |
| Provider "Businesses & clubs" toggle + business cards in Discovery/Search | Business marketplace surfaces |

### 3.3 KEEP (core, untouched identity)

| File / item |
|---|
| `src/theme/theme.js` — `CL`/`CD` palettes, fonts (Outfit/Inter), `KEYFRAMES` |
| Brand language: `Btn`, `Card`, `Chip`, `Badge`, `Avatar`, `StarRow`, `Toggle`, `StatusPill`, `SectionLabel`, `FormSection`, `SettingsRow/Group` |
| `lucide-react` icon language; `@mdi/js` sport icons |
| `AppContext` booking/payment/session logic, client + coach state, notifications |
| Mock data (coaches, bookings, sports, users, media) minus business slices |
| `CONFIG` (fees, cancellation policy) |

### 3.4 ADAPT (carried over, restructured)

| File / item | Desktop change |
|---|---|
| `uitls/haptics.js` | Gate to touch devices / no-op |
| `utils/usePullToRefresh.js` | Mobile tier only |
| `BottomTabs` | Mobile tab bar; sidebar ≥1024px |
| `BottomSheet`/`ConfirmDialog` | → Dialog overlay on desktop |
| `TopBar`, `ScreenHeader`, `BottomActionBar` | → `PageHeader`/inline footer on desktop |
| `SearchSelect`, `Field`, form primitives | Density + width tokens |
| All 81 in-scope screens | Wrap in `ContentPage`, grids, desktop density |
| `index.css` | Full rewrite as base portal styles + media queries |
| `utils/avatar.js`, `calendar.js`, `name.js`, `persistence.js`, `coachProfile.js`, `notifications.js`, `styles.js`, `useUserLocation.js`, `userLocation` | Keep as-is (framework-agnostic) |
| `data/*.js` (mockData, sports, coaches, bookings, users, media, formOptions, sportSkillLevels, sportSkillLevels) | Prune business slices & business media only |

---

## 4. State & context reduction plan

**Remove from context (with import audit before deletion):**
- Business family: `business*` state + `update*/submit*/invite*/save*/add*/mark*/complete*/simulateBusinessDecision` actions + `businessNotifications`/`businessCoachNotifications` + `setBusinessNotifications`/`setBusinessCoachNotifications`.
- Studio: `resetAll`, `setOffline`+"offline" toggle wiring.
- Demo jumplinks: `ROUTE_METADATA`/demoParams consumption.

**Keep with default behaviour (remove only studio controls):**
- `offline` stays `false` (dead branches isolated), `darkMode`, `toggleDarkMode`.
- `isFirstTimeClient`, `showPostSignupGuide`, `discoveryPrefs` (empty-state / guide).
- Client + coach + bookings + notifications + verification + location.
- `goToHistory` (used by studio breadcrumbs) — prune if unused after Phase 7.

---

## 5. Dependency plan

| Package | Decision |
|---|---|
| `react`, `react-dom`, `lucide-react`, `@mdi/js`, `vite`, `@vitejs/plugin-react` | KEEP |
| `html-to-image` | **REMOVE** |

---

## 6. Validation gates (do-not-pass criteria)

1. No **EXCLUDE** or **REMOVE** item is reachable or rendered after Phase 7.
2. Palette/fonts were not altered (`CL`/`CD` file unchanged).
3. All 81 kept screens still render with equivalent information & order.
4. Every in-scope action in `AppContext` still functions (booking accept/pay/OTP
   chain, notifications, verification).
5. `npm run dev` / `npm run build` green.

---

## 7. Role & initial-route policy

- `role` restricted to `client` and `coach` in the portal.
- `role-select` offers client + coach only.
- Default route `/` → `splash` → `get-started` → `auth` → role home
  (`client-home` / `coach-dashboard`).
- No role switching UI (removed studio panel).

---

## 8. Sign-off

| Reviewer | Role | Decision | Date |
|---|---|---|---|
| (Client / Product owner) | | ✅ Approved — exclude business & business-coach UI, client business marketplace, and all prototype tooling | 2026-09-16 |
| (Dev lead) | | ✅ Approved — scope sheet matches Phase 1 audit (81 keep/adapt, 51 exclude) | 2026-09-16 |

> With sign-off captured, Phase 3 (Responsive & Desktop Design Strategy) may
> proceed in `coachnivo_admin`.