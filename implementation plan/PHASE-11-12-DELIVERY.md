# Phase 11 & 12 — Discovery/Search + Detail-Page Reflow (Delivery Record)

> Delivered in `coachnivo_admin`. Status: COMPLETE — build green (1587 modules),
> preview HTTP 200.

---

## Phase 11 — Client Discovery & Search reflow

### `screens/client/Discovery.jsx` (client-home)
- **Responsive coach grid:** the coach list now renders through the Phase 5
  `Grid` primitive → **1 col mobile / 2 col tablet / 3 col desktop**, cards
  fill their cell (`height:100%`, no internal margin).
- **Desktop content column:** the app-style scroll area is centered and
  bounded at **1280px** on ≥1024 (subtle page shadow), keeping the hero,
  sticky sort/filter toolbar and map affordance intact.
- **Sheets → desktop modals automatically:** the Filters / Sort / Location
  sheets use `BottomSheet`, which already presents as a centered dialog ≥1024
  (Phase 8), so a mouse user gets modal popovers instead of bottom sheet.
- Promo carousels keep their mobile swipe; hover devices retain the carousel
  (not yet grid-ified — Phase 17 refinement).

### `screens/client/SearchResults.jsx`
- Results scroll area bounded to **1160px centered** on desktop with desktop
  gutters; **Sports** stay chips; **Coaches** and **Coach packages** sections
  render as a `Grid` (1 / 2 columns).
- Search strings de-phoned (no "clubs/programs" in copy).

## Phase 12 — Coach profile & package detail reflow

### `screens/client/CoachProfile.jsx` (coach-profile)
- **Two-column ≥1024:** content (About / Reels / Packages / Reviews tabs) in
  the main column; a **sticky right summary rail** (`RightSummary`) shows
  rating + reviews, verified/location badges, "Starting from $X", next
  availability, and a primary **Book a session / View packages** CTA plus
  "Message" outline action.
- Tab content extracted into a `tabPane` used by both tiers (no duplication).
- **Reels grid:** desktop = 3-column 16:10 grid; mobile keeps 2-column 3:4.
- **Packages grid:** desktop = auto-fill min 320px tiles; mobile keeps stacked.
- The fixed mobile bottom action bar is hidden on desktop (rail owns the CTA).

### `screens/client/PackageDetail.jsx`
- **Two-column ≥1024:** title + description + info rows + policy + actions on
  the left; **sticky booking summary rail** on the right (price, selected
  session date/time, Continue / Choose date & time CTA, Ask a question,
  cancellation policy).
- **Mobile unchanged:** single column + fixed bottom CTA (kept verbatim).

## Verification
- `npm run build` → success (1587 modules).
- `npm run preview` → HTTP 200.
- Desktop flows: Discover → search → coach profile (sticky rail + CTA) →
  package detail (sticky rail) all reachable; mobile keeps original columns
  and fixed bottom CTAs.

## Notes
- `availability-calendar` (BookingExtra) reflow is deferred to the booking
  flow phase (13); individual coach reels viewer stays immersive on all tiers.
- Business surfaces remain fully removed from these screens (Phase 7).
- Grid density values (3 col coaches, 2 col search) are initial settings and
  easy to tune in the `Grid` props.