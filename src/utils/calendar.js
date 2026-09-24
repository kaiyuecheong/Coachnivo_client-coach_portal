/* =========================================================================
   CALENDAR UTILITIES
   -------------------------------------------------------------------------
   Framework-agnostic date helpers shared across booking, coach calendar,
   and availability screens. Extracted from Booking.jsx to avoid circular
   imports and duplication.
   ========================================================================= */

export const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const DOW_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function addDays(d, n) {
  const r = new Date(d);
  r.setDate(d.getDate() + n);
  return r;
}

/** Monday-start week beginning. */
export function startOfWeek(d) {
  const dow = (d.getDay() + 6) % 7;
  return addDays(d, -dow);
}

/** Build a 6-row × 7-column month grid starting from `cursor`'s month. */
export function buildMonthGrid(cursor) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const gridStart = startOfWeek(first);
  const weeks = [];
  let cur = gridStart;
  for (let w = 0; w < 6; w++) {
    const row = [];
    for (let i = 0; i < 7; i++) {
      row.push(cur);
      cur = addDays(cur, 1);
    }
    weeks.push(row);
  }
  return weeks;
}

/** True if two Dates represent the same calendar day. */
export function sameDay(a, b) {
  return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** True if `d` is strictly before today (midnight-normalised). */
export function isPastDay(d) {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x < t;
}

/** Parse a short "22 Jul" style date string into a Date (defaults to 2026). */
export function parseShortDate(str, year = 2026) {
  const m = /(\d{1,2})\s+([A-Za-z]{3})/.exec(str || "");
  if (!m) return null;
  const month = MONTH_ABBR.indexOf(m[2]);
  if (month < 0) return null;
  return new Date(year, month, parseInt(m[1], 10));
}

/** True if two Dates represent the same calendar day (alias used in some screens). */
export function sameCalendarDay(a, b) {
  return sameDay(a, b);
}

/** Normalise a time string for comparison ("6:00 am" → "6:00am"). */
export function normTime(t) {
  return (t || "").replace(/\s+/g, "").toLowerCase();
}

/**
 * Availability state for a calendar cell, based on how many slots the coach
 * has open that day: none → unavailable, 1-2 → limited, 3+ → available.
 */
export function dayAvailability(date, coach, availability) {
  if (isPastDay(date)) return "unavailable";
  const abbrev = DOW_ABBR[date.getDay()];
  const slots = (availability || coach.availability)[abbrev];
  if (!slots || slots.length === 0) return "unavailable";
  if (slots.length <= 2) return "limited";
  return "available";
}

/** Return the raw time-slot array for a given date from a coach's availability. */
export function slotsForDate(date, coach, availability) {
  const abbrev = DOW_ABBR[date.getDay()];
  return (availability || coach.availability)[abbrev] || [];
}

/** Bucket a coach's raw "HH:MM" slots into Morning / Afternoon / Evening. */
export function groupSlotsByPeriod(slots) {
  const groups = { Morning: [], Afternoon: [], Evening: [] };
  slots.forEach((t) => {
    const h = parseInt(t.split(":")[0], 10);
    if (h < 12) groups.Morning.push(t);
    else if (h < 17) groups.Afternoon.push(t);
    else groups.Evening.push(t);
  });
  return groups;
}

/** Format a Date as a full human-readable date ("Tuesday, 22 July"). */
export function formatFullDateFromDate(d) {
  return d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });
}
