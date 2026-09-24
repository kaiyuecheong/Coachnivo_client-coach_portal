/* =========================================================================
   AVATAR HELPERS
   -------------------------------------------------------------------------
   Generate initials and deterministic background colours from a name string.
   Extracted from mockData.js — these are UI utilities, not data.
   ========================================================================= */

import { PROFILE_AVATARS, getValidAvatar } from "../data/media";

const AVATAR_PALETTE = ["#4d7c0e"];

/** First-party avatars for every seeded person; unknown names get a deterministic local avatar. */
export function avatarForName(name) {
  const s = String(name || "").trim();
  if (!s) return null;
  const key = s.toLowerCase();
  if (PROFILE_AVATARS[key]) return PROFILE_AVATARS[key];
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return getValidAvatar(h);
}

/** Extract up to two-letter initials from a display name (or @handle). */
export function initials(name) {
  const s = String(name || "").trim();
  if (!s) return "?";
  if (s.startsWith("@")) return s.slice(1, 3).toUpperCase();
  return s
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Deterministic colour from a name, drawn from the avatar palette. */
export function hashColor(name) {
  const s = String(name || "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}
