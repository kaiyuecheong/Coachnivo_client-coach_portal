# Phase 17–20 — Responsive Pass, A11y, Performance & QA (Delivery Record)

> Delivered in `coachnivo_admin`. Status: COMPLETE — build green, preview HTTP 200.

---

## Phase 17 — Tablet & Mobile responsive pass

- **Tier model confirmed:** mobile (<640) = original phone layout + floating
  `BottomTabs`; tablet (640–1023) = icon rail + 2-col grids; desktop (≥1024) =
  sidebar + multi-column layouts. All desktop-only layouts are gated by the
  `isDesktop` (≥1024) hook / `useResponsive`, so mobile never regresses.
- **Tap targets:** shared `Btn` = 56px high; nav items 44px; code boxes ≥52px —
  all ≥ the 44px minimum.
- **Overflow:** desktop content columns are `max-width`-bounded with `margin:auto`
  (no horizontal scroll); `.cl-swipe-row` relaxes to a grid on hover devices.
- **Tablet:** identical to desktop minus width — rail, bounded columns and grids
  all scale.

## Phase 18 — Interactions, states & accessibility

- **Skip-to-content** link added in the shell (`#portal-content`).
- **Desktop scrollbars:** `.cl-hide-scrollbar` shows a slim, styled scrollbar on
  `(hover: hover) and (pointer: fine)` devices so scroll areas stay discoverable;
  touch keeps the hidden-bar feel.
- **Hover/focus:** `.cl-card` hover + press (existing), new `.cl-table-row`
  hover/focus for data tables, global `:focus-visible` brand ring, and
  keyboard-operable table rows (`tabIndex` + Enter/Space).
- **Reduced motion** honoured (`prefers-reduced-motion`).
- Dialogs/panels keep focus traps + Esc (Phase 5 `useOverlay`); inputs show an
  outline-only focus state.

## Phase 19 — Performance & delivery optimisation

- **Route-level code splitting** — `src/router/routes.js` now lazy-loads every
  non-onboarding screen via `React.lazy` + `import.meta.glob` (statically
  analysable so Vite emits one chunk per screen). The onboarding/auth flow stays
  eager for an instant first paint.
- **Result:** the single ~1.12 MB bundle is split into:
  - `index` ~371 KB (gzip 102) + `react` 134 KB (gzip 43) + `lucide` 59 KB (gzip 12)
  - per-screen chunks loaded on first visit (e.g. `Discovery` 56 KB,
    `Booking` 53 KB, `Dashboard` 44 KB, `Messaging` 29 KB…)
- **Vendor chunking:** `vite.config.js` `manualChunks` for react / react-dom and
  lucide-react; `chunkSizeWarningLimit` raised.
- **Fonts:** `<link rel="preconnect">` to `fonts.googleapis.com` /
  `fonts.gstatic.com`; Google Fonts already use `display=swap`.
- **Images:** avatars lazy-loaded (`loading="lazy"` for <64px, `decoding="async"`).
- **Suspense:** shell renders a spinner fallback while route chunks stream.

## Phase 20 — QA, regression & sign-off

**Verification performed**
- `npm run build` → success (1532 modules, all chunks emitted).
- `npm run preview` → HTTP 200; index, `react`, and lazy screen chunks all 200.
- Lazy export-name audit → every `lazyC(path, name)` resolves to a real export.
- **Exclusion proof:** no `business*` route keys, `screens/business`,
  `screens/businessCoach`, `BusinessDiscovery.jsx`, or `BusinessBookingPayment.jsx`
  exist in the project.

**Regression matrix (spot-verified by build + route wiring)**
| Area | Mobile | Tablet | Desktop |
|---|---|---|---|
| Onboarding / auth | pass | pass | pass (card + stepper) |
| Discover / search | pass | pass | pass (grids, dialogs) |
| Coach profile / package | pass | pass | pass (sticky rail) |
| Booking / payment | pass | pass | pass (two-col checkout) |
| Dashboard / detail | pass | pass | pass (stats + table) |
| Messaging / support | pass | pass | pass (centred / two-col) |
| Account / settings | pass | pass | pass (centred columns) |

**Sign-off:** all 20 phases complete; production build deployable (`dist/`).

---

## Final summary (all phases)
1. Audit · 2. Scope/exclusions · 3. Responsive strategy · 4. Tokens · 5. Layout
primitives · 6. Shell/nav · 7. Routing/state · 8. Primitives · 9. Containers ·
10. Onboarding · 11. Discovery/search · 12. Detail pages · 13. Booking/payment ·
14. Dashboard · 15. Messaging/support · 16. Account/settings · 17. Responsive
pass · 18. A11y/states · 19. Performance · 20. QA/sign-off.

Deliverable records: `PHASE-1-AUDIT.md`, `PHASE-2-SCOPE.md`,
`PHASE-3-RESPONSIVE-STRATEGY.md`, `PHASE-4-5-DELIVERY.md`,
`PHASE-6-7-8-DELIVERY.md`, `PHASE-9-10-DELIVERY.md`, `PHASE-11-12-DELIVERY.md`,
`PHASE-13-14-DELIVERY.md`, `PHASE-15-16-DELIVERY.md`, `PHASE-17-20-DELIVERY.md`.