# CoachNivo Portal — Design Notes (frontend-design skill)

Applying the `frontend-design` skill as a design-lead pass. The web portal must
preserve the mobile app's established identity (brand orange on white) while
avoiding "template default" tells.

## Design plan

**Subject** — CoachNivo: a sports-coaching marketplace. Client = athletes/parents
buying sessions; Coach = providers managing bookings. Job: find → trust → book.

**Color (palette, brief-locked)** — `#F15A29` brand orange (accent only),
`#FDF1E8` surface, `#16181D` ink, `#6B7280` slate, `#E7E8EC` hairline, `#FFFFFF`.
Primary CTAs stay **ink**; orange is spent in ONE place at a time.

**Type** — Outfit (display/headings; carries personality: wide, geometric sport
energy) + Inter (UI/body; neutral workhorse). One scale, fluid 13→16 body.
Body columns bounded to ~44–70ch. No single-word headline accents, no
unnecessary ALL-CAPS eyebrows (the two small caps labels that exist are required
by the reference header brief).

**Layout** — left-aligned content with a 64px desktop page boundary; hero is a
statement headline + search on the brand wash (marketplace vernacular), not the
"big number + small label" default. Nav = reference header (brand + hamburger +
search + notifications + profile) over a sidebar+content flex workspace.

**Principles** — One memorable moment at a time; restraint everywhere else.
Motion answers actions (open/expand/confirm); ambient entrances are quiet.
Responsive down to mobile, visible keyboard focus, reduced motion respected,
harmonious accessible palette.

## Critique log (what changed and why)

- **`.cl-stagger > *`** previously used a per-card fade-and-slide-up entrance —
  a classic generated-page tell. Changed to a single **opacity-only fade**
  (`clFadeIn`) so lists appear quietly; action-driven motion is untouched.
- **Card shadows/radius**: inherited product identity (not templated kit), so the
  soft shadow + 18px radius stays — it's the mobile brand, grounded in the brief.
- **Hero**: deliberately NOT the generic headline-with-gradient block cursory —
  it's a search-first marketplace statement on the brand wash.
- **Hover-transitions-on-every-card**: kept intentionally subtle (border + soft
  lift) because pointer feedback helps, but nothing decorative is added.

## Future passes
- Re-audit any new screen against: (1) copy is plain verbs, sentence case, from
  the user's perspective; (2) errors name what happened and how to fix; empty
  states invite action; (3) buttons reuse the same action word through the flow.