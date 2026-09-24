# Phase 15 & 16 — Messaging/Support + Account/Settings Reflow (Delivery Record)

> Delivered in `coachnivo_admin`. Status: COMPLETE — build green, preview HTTP 200.

---

## Phase 15 — Messaging & Support reflow

### `Messaging.jsx` (client & coach inbox + thread)
- `ScreenMessages`: desktop gets a **bounded centred inbox** (860px) with
  desktop gutters; mobile keeps its full-bleed list + bottom tabs.
- `ScreenChatThread`: desktop reads as a **focused conversation column**
  (wider message gutters). Push-based list→thread navigation is preserved so
  both tiers share one flow.

### `Support.jsx` — desktop help centre
- **≥1024px: two-column layout** — a left **category rail** (FAQs / Contact
  support) + the content column (FAQ search/accordions or the chat), bounded
  and centred (1080px).
- **Mobile**: unchanged SegTabs + single column.

## Phase 16 — Account & Settings reflow

Centred desktop columns (max-width 760–960) with desktop gutters, applied to
every account/settings screen; mobile layouts unchanged:

| Screen | File | Desktop |
|---|---|---|
| Client Account (profile/settings) | `client/Account.jsx` | 760 centred |
| Client History | `client/Account.jsx` | 860 centred |
| Coach Profile Edit | `coach/ProfileEdit.jsx` | 760 centred |
| Coach Reviews | `coach/CoachReviews.jsx` | 860 centred |
| Coach Reels & Photos | `coach/Reels.jsx` | 960 centred |
| Create / Edit Package | `coach/PackageForm.jsx` | 760 centred |

Coach setup steps already live inside the desktop onboarding card (Phase 10),
so they inherit the registration frame's treatment.

## Verification
- `npm run build` → success.
- `npm run preview` → HTTP 200.
- Desktop: help centre two-column; inbox + thread bounded; all account/settings
  forms centred with comfortable gutters.

## Notes
- The full desktop **3-pane mailbox** (folder list + thread + booking context in
  one view) is not yet implemented — inbox→thread remains push navigation on a
  centred column, which suits the prototype's single-pane model. Converting to a
  true split mailbox is a follow-up.
- Settings forms use the centred single column; side-by-side two-column field
  grids for related inputs can be layered on top when needed.