/* =========================================================================
   NAME & HANDLE HELPERS
   -------------------------------------------------------------------------
   Single source of truth for public identity — resolves which name is shown
   to whom (based on the user's privacy setting and the viewer's context),
   validates unique @handles, and formats privacy-safe names.
   ========================================================================= */

/** Full name from any user-like object (firstName/lastName or name). */
export function fullNameOf(user) {
  if (!user) return "";
  if (user.firstName || user.lastName) return `${user.firstName || ""} ${user.lastName || ""}`.trim();
  return String(user.name || user.fullName || "").trim();
}

/**
 * "Shane Warne" -> "Shane W."
 * Family / group names stay intact ("The Chen Family (u18)" is kept as-is).
 */
export function formatFirstLastInitial(name) {
  const s = String(name || "").trim();
  if (!s) return "";
  const parts = s.split(/\s+/);
  if (parts.length < 2) return s;
  const last = parts[parts.length - 1];
  if (/[()]/.test(last) || last.toLowerCase() === last) return s;
  return `${parts.slice(0, -1).join(" ")} ${last[0].toUpperCase()}.`;
}

/**
 * @handle validation — 3–24 chars, lowercase a–z0–9 with "." and "_" as the
 * only separators, never leading/trailing/consecutive separators.
 */
export function isValidHandle(h) {
  const s = String(h || "").trim();
  return s.length >= 3 && s.length <= 24 && /^[a-z0-9]+([._]?[a-z0-9])*$/.test(s);
}

/** Suggest a handle from a name: "Shane Warne" -> "shanewarne42" */
export function suggestHandle(name) {
  const base =
    String(name || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 16) || "athlete";
  return `${base}${Math.floor(10 + Math.random() * 89)}`;
}

/**
 * Resolve the public name + handle for a user, given the viewer's context.
 *
 *   context "self"      — the user looking at their own account: full name.
 *   context "confirmed" — a booking partner: full legal name is revealed
 *                         once a booking is confirmed (trust & logistics).
 *   context "public"    — anyone else: honours the user's privacy setting.
 *
 * Privacy settings:
 *   "full"    — full name shown publicly
 *   "initial" — first name + last initial (e.g. "Shane W."), default
 *   "handle"  — only the @handle is shown
 *
 * Returns { name, handle, revealed }.
 */
export function getPublicName(user, context = "public") {
  const full = fullNameOf(user);
  const handle = user?.handle ? `@${String(user.handle).replace(/^@/, "")}` : "";

  if (context === "self" || context === "confirmed") {
    return {
      name: full || handle || "CoachNivo user",
      handle: handle || null,
      revealed: context === "confirmed" && !!full,
    };
  }

  const privacy = user?.namePrivacy || "initial";
  if (privacy === "handle") {
    return { name: handle || full, handle: null, revealed: false };
  }
  if (privacy === "full") {
    return { name: full, handle: handle || null, revealed: false };
  }
  const reduced = formatFirstLastInitial(full);
  return { name: reduced || full, handle: handle || null, revealed: false };
}

/** Name a coach should see for a booking's client — full name once confirmed. */
export function getBookingClientName(booking) {
  const confirmed = ["confirmed", "completion_pending", "completed", "paid"].includes(booking?.status);
  if (confirmed && booking?.clientName) {
    return {
      name: booking.clientName,
      handle: booking.clientHandle ? `@${booking.clientHandle}` : null,
      revealed: true,
    };
  }
  return {
    ...getPublicName({
      name: booking?.clientName,
      handle: booking?.clientHandle,
      namePrivacy: booking?.clientPrivacy || "initial",
    }),
    revealed: false,
  };
}

/** Name a client should see for a booking's coach — full name once confirmed. */
export function getBookingCoachName(booking, coach) {
  if (booking?.providerType === "business") {
    return { name: booking.providerName || booking.coachName || "Organisation", handle: null, revealed: true };
  }
  const confirmed = ["confirmed", "completion_pending", "completed", "paid"].includes(booking?.status);
  if (confirmed && booking?.coachName) {
    return {
      name: booking.coachName,
      handle: coach?.handle ? `@${coach.handle}` : null,
      revealed: true,
    };
  }
  const user = coach && coach.name === booking?.coachName ? coach : { name: booking?.coachName };
  return { ...getPublicName(user, "public"), revealed: false };
}
