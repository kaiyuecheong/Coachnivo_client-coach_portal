# Phase 4 & 5 — Design Tokens + Layout System (Delivery Record)

> Delivered in `coachnivo_admin` (this project). Status: COMPLETE — verified
> with `npm run build` + local preview (HTTP 200).

---

## 1. What was delivered

### Phase 4 — tokens & responsive infrastructure

| File | Purpose |
|---|---|
| `src/theme/theme.js` | Verbatim `CL`/`CD`/`T`/`LAYOUT` from the mobile app (identity preserved, **palettes untouched**), extended with: `TD` (desktop type mirror), `T_FLUID` (fluid clamp per semantic step), `BP` breakpoints (640/1024/1440), `SPACE` spacing scale (1–8), `fluid()` clamp helper, `LAYOUT.desktop`/`LAYOUT.tablet`/`LAYOUT.rail` overrides, `clPanelIn*` keyframes |
| `src/theme/responsive.js` | `useResponsive()` → `{ breakpoint, isMobile, isTablet, isDesktop, isTouch, isHover, matches }`; `useMediaQuery`, `useIsTabletUp`, `useIsDesktop`, `getBreakpoint`, `TIERS` |
| `src/theme/ThemeContext.jsx` | `ThemeProvider` + `useColors()` — isolated dark/light context (persisted to localStorage), so primitives are theme-aware before AppContext lands in Phase 7 |
| `src/utils/persistence.js` | Ported namespaced storage helpers |
| `src/index.css` | Replaces the phone prototype CSS: portal reset, fluid root vars, brand focus states, `.cl-page`, `.cl-card-grid` (auto-fill minmax), swipe-row → grid on hover devices, press/hover card feedback |

### Phase 5 — layout primitives (`src/components/layout/`)

| Component | API | Behavior |
|---|---|---|
| `ContentPage` | maxWidth (default 1280), top/bottom padding | responsive gutters (18px mobile / 32px desktop) |
| `PageHeader` + `BackButton` + `Breadcrumbs` | title, subtitle, onBack, breadcrumbs, actions, icon | mobile compact / desktop breadcrumb + baseline actions |
| `Grid` + `Column` + `Stack` + `Row` | cols, sm, md, lg, gap | per-tier column counts (`minmax(0,1fr)` tracks) |
| `SplitView` + `RightSummary` | left, right, minLeft, ratio, stickyLeft | side-by-side ≥1024; stacked below; sticky summary rail |
| `Toolbar` + `ToolbarSpacer` | justify, wrap, sticky, label | header/toolbar rows |
| `Dialog` | open, onClose, title, subtitle, footer, wide, width | **bottom sheet <1024 / centered modal ≥1024**; portal to body; focus trap; Esc |
| `Panel` | open, onClose, title, footer, width, side | right slide-over with backdrop (sheets on mobile) |
| `useOverlay` | shared hook | ESC + focus trap + scroll lock for Dialog/Panel |
| `index.js` | barrel | single import surface |

---

## 2. Phase 5 exit criteria check

- [x] Primitives render at all three tiers — verified via the **dev preview** in
  `src/App.jsx` (breakpoint chip, fluid type sampler, card grid, split view,
  dialog, panel). Resize the browser to traverse tiers.
- [x] No screen components were touched — scaffolding only, no ported screens yet.
- [x] `CL`/`CD` unchanged; `npm run build` green.

## 3. How to verify

```bash
cd coachnivo_admin
npm run dev        # drag the window across 390 / 768 / 1024 / 1440 / 1920
```

Watch: breakpoint badge (`SM/MD/LG` + hover/touch) updates live; the fluid type
scale changes continuously; the card grid shifts 1→2→3 columns; the split view
stacks on mobile; the dialog is a sheet on phone and a modal on desktop.

## 4. Open follow-ups (for later phases)

- `PortalShell` + sidebar/topbar (Phase 6) replaces the preview header.
- `Dialog`/`Panel` multi-overlay scroll-lock stack (guard for stacked modals).
- `RightSummary` sticky offsets tuned once the shell top bar exists.