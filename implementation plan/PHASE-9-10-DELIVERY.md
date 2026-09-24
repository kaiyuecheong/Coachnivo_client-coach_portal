# Phase 9 & 10 — Responsive Container Infrastructure + Onboarding Reflow (Delivery Record)

> Delivered in `coachnivo_admin`. Status: COMPLETE — build green (1577 modules),
> preview HTTP 200.

---

## Phase 9 — Responsive container & media-query infrastructure

**`src/index.css` additions** (class-level, mobile-first):

| Utility | Purpose |
|---|---|
| `.cl-detail-grid` / `.cl-detail-grid--wide` | detail page rows: rail (sticky ≥1024) + main column |
| `.cl-center-form` | max-480px centered form column (auth/checkout) |
| `.cl-tab-clearance` | bottom padding for floating tabs — mobile only, 0 ≥1024 |
| `.cl-sheet-overlay` | non-portaled sheet/backdrop layer |
| `.cl-auth-bg` | onboarding/auth page brand wash (radial + gradient, surface tint) |
| `.cl-t-micro…display` | fluid type utilities mirroring `T_FLUID`/CSS vars |
| `.cl-screen-scroll*` | viewport-safe scroll containers |

**Principle applied:** breakpoints flow through (a) the Phase 5 layout primitives,
(b) the Phase 4 responsive hook, or (c) these CSS utilities — never ad-hoc inline
media queries. Screens adopt these during their own reflow phases (11–16).

## Phase 10 — Onboarding & Auth reflow

**New primitive:** `src/components/layout/OnboardingFrame.jsx`
- **Mobile (<1024): pass-through** — screens render exactly as before (bottom
  steppers, full-width forms unchanged).
- **Desktop (≥1024):** soft brand-wash page centering a white card
  (560px, or 920px with a **vertical side stepper**) with a logo header,
  "Step X of Y · label" pill, internally scrolling content. Screens keep their
  own fields/validation; only the frame changes.

**Applied centrally** via `withOnboardingFrame` HOC in `src/router/routes.js`
(no per-screen file edits) to the entire onboarding surface:

- Signup/auth: `role-select`, `auth`, `forgot-password`, `reset-code`,
  `reset-password`, `verify-email`, `verify-phone`, `enable-biometric`
- Coach signup: `coach-info`, `coach-expertise`, `verification`,
  `verification-pending`, `verification-rejected`
- Client setup: `about-you-profile`, `account-type`, `about-you-participants`,
  `about-you-self`, `client-setup-complete`
- Coach setup: `coach-services-setup`, `coach-availability-setup`,
  `coach-payout-setup`, `coach-setup-complete`
- `splash` / `get-started` remain full-bleed brand screens (already desktop-safe)

Steps/labels per flow are display metadata (decorative guidance), kept in the
route registry.

## Verification

- `npm run build` → success (1577 modules), new CSS bundle ships (7.4 kB).
- `npm run preview` → HTTP 200 (HTML + CSS 200).
- Desktop onboarding: splash → get-started → role-select → auth render in the
  centered branded card with stepper rail; full flows intact on mobile.

## Notes

- Stepper totals are representative per-flow labels; formal per-route step
  indexes can be tightened when backend wiring lands.
- Some wrapped setup forms were authored for a phone-height viewport; the card
  scrolls internally (`.cl-hide-scrollbar`), so nothing is clipped.
- Pruning of leftover business data imports (`Messaging` dead branch) remains a
  Phase-11 cleanup item.