/* =========================================================================
   USER IDENTITY SEED DATA
   -------------------------------------------------------------------------
   Mock identity directory for the prototype — the current signed-in client,
   the coach-side client roster, and the registry of taken @handles used for
   the unique-username availability check.
   ========================================================================= */
import { COACHES } from "./coaches";
import { PROFILE_AVATARS } from "./media";

/** The signed-in client — replaces the "Sarah Lin" strings scattered around. */
export const CURRENT_CLIENT = {
  id: "u-client",
  firstName: "Sarah",
  lastName: "Lin",
  email: "sarah.lin@email.com",
  handle: "sarahlin",
  namePrivacy: "initial",
  avatar: PROFILE_AVATARS["sarah lin"],
};

/** Client roster seen from the coach side (used for handle lookups). */
export const MOCK_CLIENTS = [
  { id: "mc1", name: "Marcus Webb", handle: "marcusw", namePrivacy: "initial", avatar: PROFILE_AVATARS["marcus webb"] },
  { id: "mc2", name: "The Chen Family (u18)", handle: "thechens", namePrivacy: "initial", avatar: PROFILE_AVATARS["the chen family (u18)"] },
  { id: "mc3", name: "Aiden Cross", handle: "aidenruns", namePrivacy: "initial", avatar: PROFILE_AVATARS["aiden cross"] },
  { id: "mc4", name: "Grace Liu", handle: "graceliu", namePrivacy: "initial", avatar: PROFILE_AVATARS["grace liu"] },
  { id: "mc5", name: "Sarah Lin", handle: "sarahlin", namePrivacy: "initial", avatar: PROFILE_AVATARS["sarah lin"] },
  { id: "mc6", name: "Ravi Patel", handle: "ravip", namePrivacy: "initial", avatar: PROFILE_AVATARS["ravi patel"] },
  { id: "mc7", name: "Owen King", handle: "owenk", namePrivacy: "initial", avatar: PROFILE_AVATARS["owen king"] },
  { id: "mc8", name: "The Nguyen Family (u18)", handle: "nguyenfam", namePrivacy: "initial", avatar: PROFILE_AVATARS["the nguyen family (u18)"] },
  { id: "mc9", name: "Priya Desai", handle: "priyad", namePrivacy: "initial", avatar: PROFILE_AVATARS["priya desai"] },
  { id: "mc10", name: "Hannah Smith", handle: "hannahs", namePrivacy: "initial", avatar: PROFILE_AVATARS["hannah smith"] },
  { id: "mc11", name: "Leo Tanaka", handle: "leot", namePrivacy: "initial", avatar: PROFILE_AVATARS["leo tanaka"] },
  { id: "mc12", name: "Jordan Lee", handle: "jordanl", namePrivacy: "initial", avatar: PROFILE_AVATARS["jordan lee"] },
];

export const TAKEN_HANDLES = [
  ...COACHES.filter((c) => c.handle).map((c) => c.handle.toLowerCase()),
  ...MOCK_CLIENTS.map((c) => c.handle.toLowerCase()),
  CURRENT_CLIENT.handle,
  "admin",
  "support",
  "coachnivo",
  "coachlink",
];

/** Unique-handle check (case-insensitive). `exclude` = own handles to skip. */
export function isHandleTaken(handle, exclude = []) {
  const h = String(handle || "").trim().toLowerCase();
  if (!h) return false;
  const excludes = exclude.map((e) => String(e).toLowerCase());
  return !excludes.includes(h) && TAKEN_HANDLES.includes(h);
}

/** Client identity metadata for a booking/thread's plain client name. */
export function clientMetaFor(name) {
  const m = MOCK_CLIENTS.find((c) => c.name === name);
  return {
    clientHandle: m?.handle,
    clientPrivacy: m?.namePrivacy || "initial",
  };
}

/** Attach handle/privacy metadata to a booking record if missing. */
export function withClientMeta(booking) {
  if (!booking || booking.clientHandle) return booking;
  return { ...booking, ...clientMetaFor(booking.clientName) };
}
