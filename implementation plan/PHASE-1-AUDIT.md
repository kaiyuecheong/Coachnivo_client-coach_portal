# Phase 1 — Codebase & Flow Audit (CoachNivo Mobile Prototype)

> **Project:** CoachNivo — Sports Coaching Marketplace
> **Source audited:** `coachnivo_mobile-app`
> **Delivery target:** `coachnivo_admin` (this directory)
> **Audit date:** 2026-09-16

---

## 1. High-level architecture

| Layer | Location | Notes |
|---|---|---|
| Entry (HTML) | `index.html` | `#root` + `/src/main.jsx`; Google Fonts loaded at runtime |
| React root | `src/main.jsx` | Renders `<App/>` in `StrictMode` |
| Studio shell | `src/App.jsx` (1024 lines) | **Prototype-only**: sidebar, preview toolbar, device frame, screenshot, touch indicator |
| Theme tokens | `src/theme/theme.js` | `CL`/`CD` palettes, `T` type scale, `LAYOUT` rhythm, `KEYFRAMES`, fonts |
| Base CSS | `src/index.css` | Root CSS vars mirroring tokens + **phone-only** rules |
| State | `src/context/AppContext.jsx` (1420 lines) | All app state + nav + business logic (single provider) |
| Routing | `src/router/routes.js` | `ROUTES` (component registry) + `ROUTE_METADATA` (studio directory + demo params) |
| Data | `src/data/` (9 modules) | Mock coaches, bookings, businesses, sports, users, media |
| Utils | `src/utils/` (14 modules) | Name/avatar/calendar/persistence + mobile-feel utilities |
| Systems | `src/systems/` (2) | `StateSystem.jsx`, `ReviewsSystem.jsx` |
| Components | `src/components/` | `ui/`, `map/`, `booking/`, `business/` |
| Screens | `src/screens/` (8 groups) | onboarding, client, coach, messaging, shared, support, business, businessCoach |

**Design model:** everything is inline-styled via JS theme tokens; there is no CSS
framework. Screens receive context via `useApp()` (or props spread from context —
see §4). The app is mobile-shaped: it renders inside a device frame in the studio,
with screens authored for a ~393×852 viewport.

---

## 2. Route inventory (132 registered)

### 2.1 In scope — KEEP / ADAPT (81 routes)

**Onboarding / auth (20):**
`splash`, `get-started`, `role-select`, `auth`, `forgot-password`, `reset-code`,
`reset-password`, `verify-email`, `verify-phone`, `enable-biometric`,
`coach-info`, `coach-expertise`, `about-you-profile`, `account-type`,
`about-you-participants`, `about-you-self`, `client-setup-complete`,
`verification`, `verification-pending`, `verification-rejected`

**Client marketplace (27):**
`client-home`, `client-search`, `notifications`, `coach-profile`, `coach-media`,
`package-detail`, `booking-participants`, `booking-select-datetime`,
`booking-participant-details`, `booking-datetime`, `booking-review`, `payment`,
`payment-add-card`, `booking-confirmation`, `booking-request-sent`,
`package-inquiry`, `package-waitlist`, `session-prep`, `refund-status`,
`booking-message`, `availability-calendar`, `client-dashboard`,
`client-booking-detail`, `leave-review`, `client-messages`, `client-profile`,
`client-history`

**Coach (20):**
`coach-dashboard`, `coach-notifications`, `coach-services-setup`,
`coach-availability-setup`, `coach-payout-setup`, `coach-setup-complete`,
`coach-calendar`, `coach-bookings`, `coach-booking-detail`,
`booking-awaiting-payment`, `coach-session-detail`, `coach-profile-edit`,
`coach-reviews`, `coach-reels`, `coach-create-package`, `coach-edit-package`,
`coach-earnings`, `coach-history`, `coach-messages`, `coach-accept-booking`

**Shared (14):**
`chat-thread`, `session-completion`, `coach-session-completion`,
`client-session-start`, `client-session-code`, `coach-session-start`,
`session-progress`, `funds-release-status`, `dispute-create`, `dispute-status`,
`additional-charge-create`, `additional-charge-payment`,
`additional-charge-review`, `support`

### 2.2 Out of scope — EXCLUDE (51 routes)

**Business role onboarding (6):** `business-eligibility`, `business-identity`,
`business-plan`, `business-plan-checkout`, `business-plan-confirmation`,
`business-application-submitted`

**Business role operations (25):** `business-dashboard`, `business-bookings`,
`business-notifications`, `business-roster`, `business-coach-detail`,
`business-programs`, `business-program-overview`, `business-program-form`,
`business-booking-detail`, `business-messages`, `business-more`,
`business-locations`, `business-profile-edit`, `business-media`,
`business-reviews`, `business-finance`, `business-payment-methods`,
`business-payout-setup`, `business-earnings`, `business-coach-payouts`,
`business-invoices`, `business-analytics`, `business-compliance`,
`business-identity-details`, `business-insurance-details`

**Client-facing business marketplace (7):** `business-directory`,
`business-public-profile`, `business-coach-public-profile`,
`business-program-detail`, `business-booking-review`,
`business-booking-payment`, `business-booking-confirmation`

**Business Coach role (13):** `business-coach-login`, `business-coach-home`,
`business-coach-bookings`, `business-coach-booking-detail`,
`business-coach-programs`, `business-coach-program-overview`,
`business-coach-earnings`, `business-coach-account`,
`business-coach-notifications`, `business-coach-messages`,
`business-coach-access`, `business-coach-credentials`,
`business-coach-contact`

---

## 3. Component inventory

### 3.1 Shared UI primitives — `src/components/ui/Primitives.jsx` (1609 lines)

| Component | Class | Desktop plan |
|---|---|---|
| `Btn`, `Chip`, `Badge`, `Card`, `Avatar`, `StarRow`, `Toggle`, `Spinner` | Keep | Density via tokens |
| `Field`, `CheckboxRow`, `RadioRow`, `SearchSelect`, `SearchMultiSelect`, `StepProgress`, `SegTabs`, `ViewModeToggle`, `FormSection`, `Row`, `SettingsRow`, `SettingsGroup`, `BackButton` | Keep | Responsive sizing |
| `TopBar`, `ScreenHeader`, `BottomActionBar`, `EmptyState`, `Toast` | Adapt | Desktop-friendly frames |
| `BottomSheet`, `ConfirmDialog` | Adapt | Dialog on desktop |
| `BottomTabs` | Keep | Mobile nav only; hidden on desktop (sidebar instead) |
| `StatusBar`, `SignalBars`, `BatteryIcon`, `LogoMarkWhite`, `Wordmark` | **Remove** | Phone chrome / unused brand variants |

Other UI components (keep/adapt): `SportUI.jsx`, `SportSkillLevelPicker.jsx`,
`ServicePackageForm.jsx`, `PublicIdentityFields.jsx`, `PromoBannerCarousel.jsx`,
`PaymentCardForm.jsx`, `LocationField.jsx`, `CoachProfileSections.jsx`,
`Banners.jsx`, `AccountDetailsSheet.jsx`.
**Business-only (remove):** `FeaturedBusinessCarousel.jsx`.

### 3.2 Feature components

- `components/booking/SessionJourneyTimeline.jsx` — keep/adapt.
- `components/map/*` (CoachMapView, MapSearchBar, MapStyleSwitcher, RadiusFilter,
  SelectedCoachCard, LocationStatus) — keep; map panels become desktop modals.
- `components/business/*` (BusinessPlanUI, BusinessBookingPaymentSummary) —
  **remove** with the business scope.
- `systems/StateSystem.jsx`, `systems/ReviewsSystem.jsx` — keep/adapt (used by
  discovery, reviews).

### 3.3 Screen modules

- `screens/onboarding/OnboardingScreens.jsx` — keep (trim business branch from role-select).
- `screens/client/` — keep all except `BusinessDiscovery.jsx` +
  `BusinessBookingPayment.jsx` (**remove**).
- `screens/coach/` — keep all (20 screens across 14 files + `ProfileSetup.jsx`).
- `screens/messaging/Messaging.jsx` — keep (shared client/coach inbox + thread).
- `screens/shared/SessionLifecycle.jsx`, `SessionFlow.jsx`, `Exceptions.jsx` — keep.
- `screens/support/Support.jsx` — keep.
- `screens/business/` (**5 files**) and `screens/businessCoach/BusinessCoachScreens.jsx` — **remove**.

---

## 4. State / context inventory (AppContext value)

### 4.1 Navigation & UI
- `nav`, `goBack`, `replaceNav`, `resetNav`, `goToHistory`
- `screen`, `setScreen`, `params`, `setParams`, `history`, `setHistory`,
  `role`, `setRole`
- `toast`, `toastMsg`, `darkMode`, `toggleDarkMode`
- `offline`, `setOffline` ← **studio toggle; keep `offline=false` default, remove toggle**

### 4.2 Client
- `favorites`, `toggleFav`, `biometric`, `setBiometric`
- `clientPrefs`, `onComplete:handleClientPrefs`, `children`, `addChild`,
  `updateChild`, `removeChild`
- `clientIdentity`, `updateClientIdentity`, `isHandleTaken`, `coachIdentity`
- `filters` / `onFiltersChange`
- `isFirstTimeClient`, `discoveryPrefs`, `showPostSignupGuide` ← product
  empty-state + post-signup guide (KEEP, remove studio *toggle* only)

### 4.3 Bookings / payments (shared client↔coach transactions)
- `bookings`, `setBookings`, `coachBookings`, `setCoachBookings`
- `addBooking`, `cancelBooking`, `rescheduleBooking`, `markBookingPaid`,
  `respondBooking`, `acceptBookingWithCharges`, `sendPaymentReminder`,
  `expireAwaitingPayment`
- `draft`, `setDraft`, `clientPaymentMethods`, `saveClientPaymentMethod`
- `sessionDisputes`, `createSessionDispute`, `resolveSessionDispute`
- `additionalCharges`, `createAdditionalCharge`, `payAdditionalCharge`,
  `disputeAdditionalCharge`, `cancelAdditionalCharge`
- Session lifecycle: `generateSessionCode`, `verifySessionCode`,
  `confirmSessionCompletion`

### 4.4 Coach
- `verified`, `verificationStatus`, `reachedDashboardAfterVerification`
- `coachOnboarding`, `updateCoachOnboarding`, `coachProfile`
- `coachPackages`, `savePackage`, `removePackage`
- `coachMedia`, `addMedia`, `removeMedia`
- `availabilityBlocks`, `setAvailabilityBlocks`
- `coachAvailableNow`, `setCoachAvailableNow`
- `submitVerification`, `verificationQueue`, `decideVerification`
  (queue admin + `simulateVerificationDecision` are demo aids — keep until backend)

### 4.5 Business (will be removed with scope)
- `businessOnboarding`, `business`, `businesses`, `businessLocations`,
  `businessRoster`, `businessPrograms`, `businessBookings`,
  `businessCoachPayouts`, `businessMedia`, `businessReviews` + all
  `update*`/`save*`/`invite*`/`add*`/`submit*` actions and
  `simulateBusinessDecision` ← **remove from portal context**

### 4.6 Notifications
- `pushNotification`, `notifications`, `clientNotifications`,
  `coachNotifications`, `setClientNotifications`, `setCoachNotifications`
  ← keep; `business*` + `businessCoach*` notification slices **removed**
- Location: `userLocationState` (from `useUserLocation`) — keep (product feature)

### 4.7 Studio-only state (remove)
- `resetAll` (reset-to-seed), offline simulator toggle, business/businessCoach
  role state, role switching via studio roles panel.

---

## 5. Prototype-only inventory (must be removed or rewritten)

| Item | Location | Reason |
|---|---|---|
| Studio `AppShell` (sidebar, preview toolbar, canvas, zoom) | `src/App.jsx` | Prototype control panel |
| Device frame (notch, home indicator, hardware buttons) | `src/App.jsx` | Mockup chassis |
| Touch-dot / touch ripple simulation | `src/App.jsx` | Screen-recording sim |
| Screenshot / PNG export | `src/utils/screenshot.js` + `html-to-image` dep | Prototype export |
| Branded status bar helpers | `src/utils/screenChrome.js` | Phone chrome |
| `StatusBar`, `SignalBars`, `BatteryIcon` | `Primitives.jsx` | Phone chrome |
| Studio screen directory & jump navigation | `ROUTE_METADATA` / `ROUTE_DEMO_PARAMS`, `src/App.jsx` | Prototype directory |
| Touch-cursor, tap-highlight, phone overflow CSS | `src/index.css` (`.cl-phone-screen*`) | Phone simulation |
| Wheel→horizontal scroll shim | `src/App.jsx` | Phone-only UX shim |
| `resetAll` demo reset | `AppContext` | Studio control |
| Business/businessCoach screens, components, data | `screens/business*`, `components/business`, `data/businesses.js`, business slices in `bookings.js`/`media.js`/`mockData.js` | Out of scope |
| Business marketplace in Discovery/Search | `BusinessCard` (BusinessDiscovery), `FeaturedBusinessCarousel`, `FEATURED_BUSINESS_BANNERS`, provider "Businesses & clubs" toggle | Out of scope |

### Borderline (adapt/gate, not removed)
- `utils/haptics.js` — used across ~10 product screens; gate to touch devices / no-op
  on desktop (`navigator.vibrate` already no-ops where unsupported).
- `utils/usePullToRefresh.js` — used by `Discovery`; keep for mobile tier, skip on
  hover-capable devices.
- `offline` context flag — screens in `Booking`, `Messaging`, `Dashboard`,
  `Exceptions`, `CoachDashboard` branch on it. Keep default `false`; remove the
  studio toggle. (Later refinement: can prune branches once backend exists.)
- `simulateVerificationDecision` / admin verification queue — demo of the admin
  verification step; retain until a real backend exists.
- `isFirstTimeClient` / `showPostSignupGuide` / `discoveryPrefs` — product
  empty-state & onboarding-guide features; keep, remove studio toggle.
- `BottomTabs` glass tab bar — mobile-tier nav, keep; hidden ≥1024px.
- `BottomSheet` mount logic (portal into `.cl-phone-screen .cl-screen-wrap`) —
  must be rewritten for portal DOM (Phase 8).

---

## 6. Mobile-viewport assumptions to re-architect

1. **Viewport lock**: `html, body, #root { height:100%; overflow:hidden }` —
   app fills the screen; desktop needs page-level scroll + dashboard layout.
2. **Type scale** `T` (10–32px) and **layout** `LAYOUT` (`statusBarH:48`,
   `topBarH:56`, `pagePadX:18`, `tabClearance:116`, `ctaPadBottom:28`,
   `touchTarget:44`) are phone-proportioned → derive a desktop scale (Phase 4).
3. **Single column**: most screens assume 1 column ~360px content width; cards,
   list rows, step flows, chat threads need grid/column compositors (Phase 5).
4. **Fixed toolbars**: `TopBar` sticky + absolute `BottomTabs`/`BottomActionBar`
   assume a phone-height container → swap for sidebar + top bar on desktop.
5. **Bottom sheets as the modal idiom** (`BottomSheet` mounted inside the phone
   screen) → desktop dialogs.
6. **Touch-only affordances**: haptics, pull-to-refresh, horizontal swipe rows,
   `Slider`-based filters, `:active` press scaling (no `:hover`) → pointer support.
7. **px-sized media**: reels, destination lenses, map cards all sized in px and
   positioned for a 393px screen → responsive grids (Phase 11–14).

---

## 7. Dependencies

| Package | Used by | Decision |
|---|---|---|
| `react@18.3.1`, `react-dom@18.3.1` | everywhere | KEEP |
| `lucide-react@0.383` | icons throughout | KEEP |
| `@mdi/js@7.4.47` | `data/sports.js` sport icons | KEEP |
| `html-to-image@1.11.13` | `utils/screenshot.js` only | **REMOVE** (Phase 7) |
| `vite@5`, `@vitejs/plugin-react@4` | build/dev | KEEP |

---

## 8. Key risks & watch items

1. **Context is a monolith** — removing business slices will ripple into imports;
   do it once and carefully (Phase 7) and verify with a build.
2. **Screens destructure props from context** (`offline`, `isFirstTimeClient`, etc.)
   in ~8 places — any removed key must be audited before deletion.
3. **`client-home` imports business discovery** (`BusinessCard`,
   `isBusinessDiscoverable`, `FEATURED_BUSINESS_BANNERS`, provider toggle) —
   needs surgical stripping (Phase 11).
4. **`Messaging` mixes roles** (`client-messages`/`coach-messages` share one
   module) — do not break the shared thread actions when reflowing.
5. **Inline styles everywhere** — media queries must be introduced via shared
   primitives/tokens, not inline per-screen (Phases 4–9), or maintainability dies.
6. **`index.css` phone rules** (`.cl-phone-screen`, custom cursor, `user-select:none`,
   `overflow:hidden`) must be entirely replaced, not patched.