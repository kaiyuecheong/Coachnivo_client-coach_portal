# Phase 3 — Responsive & Desktop Design Strategy (Web Portal)

> The decision layer that determines *how* the 81 in-scope mobile screens are
> restructured for desktop, tablet, and mobile — before any code changes.
> Approved 2026-09-16.

---

## 1. Model: mobile-first foundation, desktop-first density

- Author layouts **mobile-first** (existing screens are already the mobile
  baseline), then layer desktop arrangements on top.
- Breakpoints are **minimum widths** (`min-width`); everything under `640px`
  inherits the mobile UI unchanged in spirit.
- **Single React tree** per screen — no per-device screen forks. Breakpoints
  are handled by a shared `useResponsive()` hook and CSS utility classes, so
  state, scroll, and interactions stay identical across tiers.

## 2. Breakpoint tokens

| Token | Value | Tier | Typical device |
|---|---|---|---|
| `BP.sm` | `640px` | Mobile → Tablet | large phones, small tablets |
| `BP.md` | `1024px` | Tablet → Desktop | tablets, small laptops |
| `BP.lg` | `1440px` | Desktop ceiling | wide monitors (content max-width) |

- `useResponsive()` returns the active tier and **pointer capability**:
  - `breakpoint`: `"sm" | "md" | "lg"`
  - booleans: `isMobile` (<640), `isTablet` (640–1023), `isDesktop` (≥1024)
  - pointer: `isTouch` / `isHover` (from `(hover:hover) and (pointer:fine)`)
- Pointer detection drives **interaction** decisions (sheets vs dialogs,
  haptics on/off, pull-to-refresh availability, hover affordances).

## 3. Grid strategy per tier

| | Mobile (<640) | Tablet (640–1023) | Desktop (≥1024) |
|---|---|---|---|
| **Outer page** | single column, full-bleed | single column w/ gutter | `ContentPage` max ~1280px, side gutters 32px |
| **Card lists** (coaches/bookings/threads) | 1-col stacked | 2-col grid | 3-col grid (coaches), 2–3-col for bookings |
| **Detail pages** (profile/package/booking review) | 1-col + bottom CTA | 2-col (content + summary rail) | 2-col, **sticky right rail** |
| **Forms / setup** | full width | 600–720px centered column | 600–720px centered column |
| **Tables** (bookings/history/earnings) | rendered as stacked cards | condensed table ≥768 | full table |
| **Messages** | list → thread (push) | 2-pane (list + thread) | 3-pane (folders + list + thread) |
| **Filters** (discovery) | bottom sheet | left inline rail (collapsible) | persistent left rail |

## 4. Navigation patterns per tier

| Tier | Primary nav | Secondary |
|---|---|---|
| Mobile | `BottomTabs` glass tab bar (client: Discover/Bookings/Messages/Account; coach: Dashboard/Calendar/Bookings/Messages/Profile) | back button in `TopBar` |
| Tablet | compact left icon **rail** (reuses same tab labels/icons, collapsed to icons) + top bar | breadcrumb in page header |
| Desktop | full left **sidebar** with section groups + icons + labels | top utility bar: search, notifications bell, dark-mode toggle, user menu |

Rules:
- Nav **labels & icon set are identical** to today's tabs — only the container
  changes (bottom bar → rail → sidebar).
- Deep flows (booking, coaching setup, verification) add a **breadcrumb trail**
  in the page header on md/lg; mobile keeps stack-based back.
- No role switching UI (roles are client | coach, chosen at sign-up).

## 5. Modal & interaction strategy

| Mobile behavior | Desktop equivalent |
|---|---|
| `BottomSheet` (portals inside phone) | centered `Dialog` (overlay, focus trap, Esc) |
| `BottomActionBar` fixed CTA | sticky footer bar **or** inline sidebar CTA in summary rail |
| Pull-to-refresh | desktop "Refresh" affordance in toolbar; **suppressed on hover devices** |
| Haptics (`navigator.vibrate`) | **disabled on hover-capable devices** (no-op) |
| Horizontal swipe rows / carousels | stay swipeable on touch; become wrapped grids on hover devices |
| `:active` press scale | kept, **plus** `:hover`/`:focus-visible` states (Phases 8/18) |

## 6. Content & hierarchy rules

1. **Same information, same order** on every tier — only frames and density
   change (e.g. coach card keeps avatar → identity → location → sports →
   rating/price on all columns).
2. Primary action placement: mobile = bottom edge; desktop = right rail or
   header — never moved silently into a different column order.
3. **Mouse scroll**: page-level scrolling on desktop (no inner "phone" scroll
   regions except constrained lists/code).
4. Density tiers: compact 44px touch targets retained on mobile; desktop may
   relax vertical padding but must keep ≥40px click targets.
5. Truncation: one-line ellipsis on mobile; desktop can expand to 2 lines for
   card copy without changing field meaning.

## 7. Component contract

- Every converted screen is wrapped by a layout primitive from Phase 5
  (`ContentPage`, `PageHeader`, `Grid`, `SplitView`, …).
- Screens keep their **`useApp()` state contract** intact; only presentation
  changes at this layer.
- All breakpoint behavior flows through either (a) layout primitives, (b)
  `useResponsive()` in a screen, or (c) CSS utilities in `index.css` — never
  ad-hoc per-element inline breakpoints.

## 8. Acceptance for this phase

- Breakpoint/pointer model confirmed.
- Grid + navigation tables above approved as the single source of truth for
  Phases 10–16.
- Proceed to Phase 4 (tokens) and Phase 5 (layout primitives) without further
  design churn on these decisions.