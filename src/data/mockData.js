/* =========================================================================
   MOCK DATA — Barrel Re-export
   -------------------------------------------------------------------------
   This file now re-exports everything from the focused data modules so
   existing imports like `import { COACHES } from "../data/mockData"` keep
   working without modification. New code should import directly from the
   specific module (coaches.js, bookings.js, formOptions.js).
   ========================================================================= */

// --- Utils (kept here for backward compatibility) ---
export { initials, hashColor } from "../utils/avatar";

// --- Config ---
export { CONFIG } from "../config";

// --- Coaches & sport data ---
export { COACHES, ALL_SUBURBS, SUBURB_COORDS } from "./coaches";
export {
  SPORT_CATALOG, SPORT_NAMES, POPULAR_SPORTS,
  getSportDefinition, getSportLabel, getSportIconPath,
} from "./sports";
export { COACH_AVATARS, PROFILE_AVATARS, DEFAULT_COACH_MEDIA, getCoachMedia, PROMO_BANNERS, FEATURED_BUSINESS_BANNERS } from "./media";

// --- Form option lists ---
export {
  LANGUAGE_OPTIONS, GENDER_OPTIONS, AU_SUBURBS, SPORT_OPTIONS_FULL,
  COACHING_CATEGORY_OPTIONS, SKILL_LEVEL_OPTIONS, AGE_GROUP_OPTIONS,
  COACHING_EXPERIENCE_LEVELS, COACHING_FORMAT_OPTIONS, ID_TYPE_OPTIONS,
  CERTIFICATION_TYPE_OPTIONS,
} from "./formOptions";

// --- Bookings, messaging, notifications, admin ---
export {
  BOOKING_STATUS, PAYMENT_STATUS, PAYOUT_STATUS, BOOKING_LIFECYCLE, withBookingLifecycle,
  INITIAL_BOOKINGS, INITIAL_AVAILABILITY_BLOCKS, COACH_BOOKINGS,
  REVIEWS, THREADS, COACH_THREADS, CHAT_MESSAGES, BOOKING_ENQUIRY_MESSAGES,
  CLIENT_PROFILES, FAQS, CLIENT_NOTIFICATIONS, COACH_VERIFICATION_DOCS,
  COACH_NOTIFICATIONS, ADMIN_VERIFICATION_QUEUE, ADMIN_DISPUTES,
  ADMIN_FLAGGED, ADMIN_RECENT_BOOKINGS,
} from "./bookings";

// --- Business marketplace ---
export {
  BUSINESS_STATUS, BUSINESS_PLANS, BUSINESS_TYPES, BUSINESS_STATUS_LABELS,
  INITIAL_BUSINESS, INITIAL_BUSINESSES, INITIAL_BUSINESS_LOCATIONS,
  INITIAL_BUSINESS_ROSTER, INITIAL_BUSINESS_PROGRAMS, INITIAL_BUSINESS_BOOKINGS,
  BUSINESS_THREADS, getBusinessPlan, getBusinessLaunchProgress, isBusinessDiscoverable,
} from "./businesses";
