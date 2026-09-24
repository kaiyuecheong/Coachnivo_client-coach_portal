/* =========================================================================
   PORTAL ROUTE REGISTRY
   -------------------------------------------------------------------------
   Central lookup mapping screen names to their component. Business,
   Business Coach, and client-facing business-marketplace routes are EXCLUDED
   (see PHASE-2-SCOPE.md). Navigation is real (AppContext nav + hash sync).

   PERFORMANCE (Phase 19): every non-onboarding screen is React.lazy() so Vite
   code-splits the bundle into per-module chunks loaded on first visit. The
   onboarding/auth flow stays eager for an instant first paint.
   ========================================================================= */

import React from "react";

import {
  ScreenSplash, ScreenGetStarted, ScreenRoleSelect, ScreenAuth,
  ScreenCoachInfo, ScreenCoachExpertise,
  ScreenVerification, ScreenVerificationPending,
  ScreenForgotPassword, ScreenResetCode, ScreenResetPassword,
  ScreenVerifyEmail, ScreenVerifyPhone,
} from "../screens/onboarding/OnboardingScreens";
import {
  ScreenAboutYouProfile, ScreenAccountType,
  ScreenAboutYouParticipants, ScreenAboutYouSelf,
} from "../screens/client/AboutYou";

import { withOnboardingFrame } from "../components/layout/OnboardingFrame";

/** All screen modules — statically analysable so Vite emits one chunk each. */
const SCREEN_MODULES = import.meta.glob("../screens/**/*.jsx");

/** Lazy-load a named export from a screen module (path without ".jsx"). */
const lazyC = (path, name) => {
  const key = path.endsWith(".jsx") ? path : `${path}.jsx`;
  return React.lazy(() => {
    const loader = SCREEN_MODULES[key];
    if (!loader) throw new Error(`Unknown screen module: ${key}`);
    return loader().then((m) => ({ default: m[name] }));
  });
};

/**
 * Desktop onboarding shell meta — applied via withOnboardingFrame so auth and
 * setup forms render as a centered branded card with a vertical stepper on
 * desktop (≥1024) while staying byte-for-byte on mobile (pass-through).
 */
const ONB = (step, total, label, steps) => withOnboardingFrame({ step, total, label, steps });

/**
 * Route registry — each key is a screen name (the string passed to `nav()`).
 */
export const ROUTES = {
  // ── Onboarding / auth (eager for first paint) ──────────────────────
  "splash": ScreenSplash,
  "get-started": ScreenGetStarted,
  "role-select": ONB(1, 3, "Choose your path", ["Choose your path", "Create account", "About you"])(ScreenRoleSelect),
  "auth": ONB(0, 0, null)(ScreenAuth),
  "forgot-password": ONB(0, 0, null)(ScreenForgotPassword),
  "reset-code": ONB(0, 0, null)(ScreenResetCode),
  "reset-password": ONB(0, 0, null)(ScreenResetPassword),
  "verify-email": ONB(1, 2, "Verify email", ["Verify email", "Verify phone"])(ScreenVerifyEmail),
  "verify-phone": ONB(2, 2, "Verify phone", ["Verify email", "Verify phone"])(ScreenVerifyPhone),
  "coach-info": ONB(1, 4, "About your coaching", ["About you", "Coach info", "Expertise", "Verification"])(ScreenCoachInfo),
  "coach-expertise": ONB(2, 4, "Expertise", ["About you", "Coach info", "Expertise", "Verification"])(ScreenCoachExpertise),
  "about-you-profile": ONB(1, 4, "Your profile", ["Profile", "Account type", "Participants", "Preferences"])(ScreenAboutYouProfile),
  "account-type": ONB(2, 4, "Who it's for", ["Profile", "Account type", "Participants", "Preferences"])(ScreenAccountType),
  "about-you-participants": ONB(3, 4, "Add participants", ["Profile", "Account type", "Participants", "Preferences"])(ScreenAboutYouParticipants),
  "about-you-self": ONB(4, 4, "Preferences", ["Profile", "Account type", "Participants", "Preferences"])(ScreenAboutYouSelf),
  "verification": ONB(3, 4, "Verification", ["About you", "Coach info", "Expertise", "Verification"])(ScreenVerification),
  "verification-pending": ONB(0, 0, null)(ScreenVerificationPending),
  "verification-rejected": ONB(0, 0, null)(ScreenVerificationPending),

  // ── Client setup (eager) + coach setup (lazy) ──────────────────────
  "client-setup-complete": ONB(0, 0, null)(lazyC("../screens/client/SetupComplete", "ScreenClientSetupComplete")),
  "coach-services-setup": ONB(1, 4, "Services", ["Services", "Availability", "Payouts", "Done"])(lazyC("../screens/coach/ServicesSetup", "ScreenCoachServicesSetup")),
  "coach-availability-setup": ONB(2, 4, "Availability", ["Services", "Availability", "Payouts", "Done"])(lazyC("../screens/coach/AvailabilitySetup", "ScreenCoachAvailabilitySetup")),
  "coach-payout-setup": ONB(3, 4, "Payouts", ["Services", "Availability", "Payouts", "Done"])(lazyC("../screens/coach/PayoutSetup", "ScreenCoachPayoutSetup")),
  "coach-setup-complete": ONB(4, 4, "Done", ["Services", "Availability", "Payouts", "Done"])(lazyC("../screens/coach/SetupComplete", "ScreenCoachSetupComplete")),

  // ── Client ─────────────────────────────────────────────────────────
  "client-home": lazyC("../screens/client/Discovery", "ScreenClientHome"),
  "client-search": lazyC("../screens/client/SearchResults", "ScreenClientSearchResults"),
  "notifications": lazyC("../screens/client/Notifications", "ScreenNotifications"),
  "coach-profile": lazyC("../screens/client/CoachProfile", "ScreenCoachProfile"),
  "coach-media": lazyC("../screens/client/Reels", "ScreenCoachMedia"),
  "package-detail": lazyC("../screens/client/PackageDetail", "ScreenPackageDetail"),
  "booking-participants": lazyC("../screens/client/Booking", "ScreenBookingParticipants"),
  "booking-select-datetime": lazyC("../screens/client/BookingExtra", "ScreenBookingSelectDateTime"),
  "booking-participant-details": lazyC("../screens/client/BookingExtra", "ScreenBookingParticipantDetails"),
  "booking-datetime": lazyC("../screens/client/Booking", "ScreenBookingDateTime"),
  "booking-review": lazyC("../screens/client/Booking", "ScreenBookingReview"),
  "payment": lazyC("../screens/client/Booking", "ScreenPayment"),
  "payment-add-card": lazyC("../screens/client/BookingExtra", "ScreenPaymentAddCard"),
  "booking-confirmation": lazyC("../screens/client/Booking", "ScreenBookingConfirmation"),
  "booking-request-sent": lazyC("../screens/client/Booking", "ScreenBookingRequestSent"),
  "package-inquiry": lazyC("../screens/client/BookingExtra", "ScreenPackageInquiry"),
  "package-waitlist": lazyC("../screens/client/BookingExtra", "ScreenPackageWaitlist"),
  "session-prep": lazyC("../screens/client/BookingExtra", "ScreenSessionPrep"),
  "refund-status": lazyC("../screens/client/BookingExtra", "ScreenRefundStatus"),
  "booking-message": lazyC("../screens/client/BookingExtra", "ScreenBookingMessage"),
  "availability-calendar": lazyC("../screens/client/BookingExtra", "ScreenAvailabilityCalendar"),
  "client-dashboard": lazyC("../screens/client/Dashboard", "ScreenClientDashboard"),
  "client-booking-detail": lazyC("../screens/client/Dashboard", "ScreenClientBookingDetail"),
  "leave-review": lazyC("../screens/client/Dashboard", "ScreenLeaveReview"),
  "client-messages": lazyC("../screens/messaging/Messaging", "ScreenMessages"),
  "client-profile": lazyC("../screens/client/Account", "ScreenClientProfile"),
  "client-history": lazyC("../screens/client/Account", "ScreenClientHistory"),

  // ── Coach ──────────────────────────────────────────────────────────
  "coach-dashboard": lazyC("../screens/coach/CoachDashboard", "ScreenCoachDashboard"),
  "coach-notifications": lazyC("../screens/coach/Notifications", "ScreenCoachNotifications"),
  "coach-calendar": lazyC("../screens/coach/Calendar", "ScreenCoachCalendar"),
  "coach-bookings": lazyC("../screens/coach/Bookings", "ScreenCoachBookings"),
  "coach-booking-detail": lazyC("../screens/coach/Bookings", "ScreenCoachBookingDetail"),
  "booking-awaiting-payment": lazyC("../screens/coach/Bookings", "ScreenCoachBookingDetail"),
  "coach-session-detail": lazyC("../screens/coach/Bookings", "ScreenCoachBookingDetail"),
  "coach-profile-edit": lazyC("../screens/coach/ProfileEdit", "ScreenCoachProfileEdit"),
  "coach-reviews": lazyC("../screens/coach/CoachReviews", "ScreenCoachReviews"),
  "coach-reels": lazyC("../screens/coach/Reels", "ScreenCoachReels"),
  "coach-create-package": lazyC("../screens/coach/PackageForm", "ScreenCoachPackageForm"),
  "coach-edit-package": lazyC("../screens/coach/PackageForm", "ScreenCoachPackageForm"),
  "coach-earnings": lazyC("../screens/coach/Earnings", "ScreenCoachEarnings"),
  "coach-history": lazyC("../screens/coach/History", "ScreenCoachHistory"),
  "coach-messages": lazyC("../screens/messaging/Messaging", "ScreenMessages"),
  "coach-accept-booking": lazyC("../screens/coach/AcceptBooking", "ScreenCoachAcceptBooking"),

  // ── Shared ─────────────────────────────────────────────────────────
  "chat-thread": lazyC("../screens/messaging/Messaging", "ScreenChatThread"),
  "session-completion": lazyC("../screens/shared/SessionLifecycle", "ScreenSessionCompletion"),
  "coach-session-completion": lazyC("../screens/shared/SessionLifecycle", "ScreenSessionCompletion"),
  "client-session-start": lazyC("../screens/shared/SessionFlow", "ScreenClientSessionStart"),
  "client-session-code": lazyC("../screens/shared/SessionFlow", "ScreenClientSessionCode"),
  "coach-session-start": lazyC("../screens/shared/SessionFlow", "ScreenCoachSessionStart"),
  "session-progress": lazyC("../screens/shared/SessionFlow", "ScreenSessionProgress"),
  "funds-release-status": lazyC("../screens/shared/SessionLifecycle", "ScreenFundsReleaseStatus"),
  "dispute-create": lazyC("../screens/shared/Exceptions", "ScreenDisputeCreate"),
  "dispute-status": lazyC("../screens/shared/Exceptions", "ScreenDisputeStatus"),
  "additional-charge-create": lazyC("../screens/shared/Exceptions", "ScreenAdditionalChargeCreate"),
  "additional-charge-payment": lazyC("../screens/shared/Exceptions", "ScreenAdditionalChargePayment"),
  "additional-charge-review": lazyC("../screens/shared/Exceptions", "ScreenAdditionalChargeReview"),
  "support": lazyC("../screens/support/Support", "ScreenSupport"),
};