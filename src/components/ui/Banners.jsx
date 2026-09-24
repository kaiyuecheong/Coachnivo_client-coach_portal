import React from "react";
import {
  CheckCircle2, XCircle, Clock, Hourglass, AlertTriangle, AlertCircle, WifiOff, Wifi,
  Ban, ShieldCheck, ShieldAlert, ShieldX, CalendarX2, CalendarCheck2, UserX,
  Info, PauseCircle, Undo2, Search,
} from "lucide-react";
import { CL, CD, fDisplay, fBody, T } from "../../theme/theme";
import { useApp } from "../../context/AppContext";
import { getPublicName } from "../../utils/name";

/* =========================================================================
   BANNER LAYER — status catalog + feedback components
   -------------------------------------------------------------------------
   First-class UI primitives for state feedback (moved out of the state
   system so error/empty/processing states live beside EmptyState & Toast).
   `StateSystem` re-exports these for backward compatibility.
   ========================================================================= */

function useColors() {
  try {
    const app = useApp();
    const darkMode = app?.darkMode ?? false;
    return (darkMode ? CD : CL) || CL;
  } catch (e) {
    return CL;
  }
}

function bookingClientPubName(b) {
  return getPublicName({
    name: b?.clientName,
    handle: b?.clientHandle,
    namePrivacy: b?.clientPrivacy || "initial",
  }, "public").name;
}

export function getTones(C) {
  return {
    success: { fg: C.success, bg: C.successTint },
    warning: { fg: C.brand, bg: C.brandTint },
    danger: { fg: C.danger, bg: C.dangerTint },
    neutral: { fg: C.slate, bg: C.fog },
    info: { fg: C.jet, bg: C.fog },
  };
}

export const STATE_CATALOG = {
  // ---- Coach availability ----
  coachAvailable: {
    tone: "success", icon: CheckCircle2, title: "Available for bookings",
    message: "New booking requests will reach you right away.",
  },
  coachUnavailable: {
    tone: "neutral", icon: PauseCircle, title: "Currently unavailable",
    message: "This coach isn't taking new bookings right now.",
    primary: "Notify me when available", secondary: "Message coach",
    next: "You'll get a notification the moment they reopen bookings.",
  },

  // ---- Search ----
  noResults: {
    tone: "neutral", icon: Search, title: "No coaches match your search",
    message: "Try a different suburb, a wider price range, or clear your filters.",
    primary: "Clear filters", secondary: "Browse all coaches",
  },

  // ---- Booking lifecycle ----
  bookingPending: {
    tone: "warning", icon: Hourglass, title: "Request sent",
    message: "Waiting on the coach to accept or decline.",
    next: "You'll be notified as soon as they respond - usually within a few hours.",
    notify: (b) => ({ title: "New booking request", body: `${bookingClientPubName(b) || "A client"} requested ${b?.service || "a session"}${b?.date ? ` for ${b.date}` : ""}.` }),
  },
  bookingConfirmed: {
    tone: "success", icon: CheckCircle2, title: "Booking confirmed",
    message: "This session is locked in on both calendars.",
    primary: "Add to calendar", secondary: "Message",
    next: "Show up on time - cancellations follow the coach's policy.",
    notify: (b) => ({ title: "Booking confirmed", body: `Your session with ${b?.coachName || "your coach"} is confirmed${b?.date ? ` for ${b.date}${b.time ? `, ${b.time}` : ""}` : ""}.` }),
  },
  bookingDeclined: {
    tone: "danger", icon: XCircle, title: "Request declined",
    message: "The coach isn't able to take this booking.",
    primary: "Find another coach", secondary: "Message coach",
    next: "No charge was made - you're free to book someone else.",
    notify: (b) => ({ title: "Booking declined", body: `${b?.coachName || "The coach"} declined your request for ${b?.service || "a session"}.` }),
  },
  bookingExpired: {
    tone: "neutral", icon: CalendarX2, title: "Request expired",
    message: "The coach didn't respond in time, so this request was automatically closed.",
    primary: "Try another time", secondary: "Message coach",
    next: "No charge was made. Sending a new request restarts the clock.",
    notify: (b) => ({ title: "Request expired", body: `Your request for ${b?.service || "a session"} expired without a response.` }),
  },
  bookingCancelled: {
    tone: "neutral", icon: Ban, title: "Session cancelled",
    message: "This booking has been called off.",
    primary: "Book again", secondary: "View policy",
    notify: (b) => ({ title: "Booking cancelled", body: `${bookingClientPubName(b) || "A client"} cancelled ${b?.service || "a session"}${b?.date ? ` on ${b.date}` : ""}.` }),
  },

  // ---- Payment ----
  paymentProcessing: {
    tone: "info", icon: Clock, title: "Processing payment…",
    message: "Confirming your charge with the payment provider.",
    next: "This usually takes a few seconds - don't close the app.",
  },
  paymentSuccess: {
    tone: "success", icon: CheckCircle2, title: "Payment successful",
    message: "Funds are held securely until the session is completed.",
    next: "A receipt has been added to your payment history.",
    notify: (b) => ({ title: "Payment received", body: `Payment of $${b?.amount ?? ""} received for ${b?.service || "a session"}.` }),
  },
  paymentFailed: {
    tone: "danger", icon: XCircle, title: "Payment failed",
    message: "Your card was declined and no charge was made.",
    primary: "Try again", secondary: "Use a different card",
    next: "Check your card details or try another payment method.",
  },
  paymentCancelled: {
    tone: "neutral", icon: Ban, title: "Payment cancelled",
    message: "You stopped this payment before it completed.",
    primary: "Resume payment", secondary: "Back to review",
    next: "Your booking request is still saved - you can pay whenever you're ready.",
  },
  paymentRefunded: {
    tone: "success", icon: Undo2, title: "Refund issued",
    message: "Your refund has been sent back to your original payment method.",
    next: "Refunds typically land in 5–10 business days.",
    notify: (b) => ({ title: "Refund issued", body: `$${b?.amount ?? ""} was refunded for ${b?.service || "your session"}.` }),
  },
  refundProcessing: {
    tone: "info", icon: Clock, title: "Refund requested",
    message: "We're processing your refund now.",
    next: "You'll be notified once it's issued - no action needed.",
  },

  // ---- Session ----
  sessionConfirmed: {
    tone: "success", icon: CalendarCheck2, title: "Session confirmed",
    message: "You're on the calendar.",
  },
  sessionCompleted: {
    tone: "success", icon: CheckCircle2, title: "Session completed",
    message: "Hope it went well! Payouts release automatically.",
    primary: "Leave a review", secondary: "Book again",
    notify: (b) => ({ title: "Session completed", body: `Your session with ${b?.coachName || "your coach"} is complete. Leave a review?` }),
  },
  sessionCancelled: {
    tone: "neutral", icon: Ban, title: "Session cancelled",
    message: "This session will no longer take place.",
    primary: "Book again",
  },

  // ---- Messaging ----
  messageSent: {
    tone: "success", icon: CheckCircle2, title: "Sent", message: "Delivered.",
  },
  messageFailed: {
    tone: "danger", icon: AlertCircle, title: "Not delivered",
    message: "This message didn't send.",
    primary: "Retry",
    next: "Check your connection and try again.",
  },

  // ---- Connectivity ----
  online: {
    tone: "success", icon: Wifi, title: "Back online", message: "Everything's syncing again.",
  },
  offline: {
    tone: "neutral", icon: WifiOff, title: "You're offline",
    message: "Showing your last saved data. Some actions are unavailable until you reconnect.",
    next: "Booking, payment and messaging actions will resume once you're back online.",
  },

  // ---- Verification ----
  verificationPending: {
    tone: "warning", icon: Hourglass, title: "Verification pending",
    message: "Your documents are with our review team.",
    next: "Most reviews complete within 2 business days.",
    notify: () => ({ title: "Verification submitted", body: "Your documents were submitted for review." }),
  },
  verificationApproved: {
    tone: "success", icon: ShieldCheck, title: "Verification approved",
    message: "You're verified and ready to accept bookings.",
    notify: (b) => ({ title: "You're verified!", body: `${b?.name || "Your"} verification was approved. You can now accept bookings.` }),
  },
  verificationRejected: {
    tone: "danger", icon: ShieldX, title: "Verification rejected",
    message: "One or more documents couldn't be confirmed.",
    primary: "Resubmit documents", secondary: "Contact support",
    notify: (b) => ({ title: "Verification rejected", body: `${b?.name || "Your"} verification was rejected. Please resubmit your documents.` }),
  },
  verificationExpiring: {
    tone: "warning", icon: ShieldAlert, title: "Verification expiring soon",
    message: "Renew before it expires to keep accepting bookings without interruption.",
    primary: "Renew now",
    notify: (b) => ({ title: "Verification expiring soon", body: `${b?.label || "A document"} expires in ${b?.daysLeft ?? "a few"} days - renew it to avoid disruption.` }),
  },
  verificationExpired: {
    tone: "danger", icon: ShieldX, title: "Verification expired",
    message: "You can't accept certain bookings until this is renewed.",
    primary: "Renew now",
    notify: (b) => ({ title: "Verification expired", body: `${b?.label || "A document"} has expired. Renew it to keep accepting bookings.` }),
  },

  // ---- Profile ----
  profilePublished: {
    tone: "success", icon: CheckCircle2, title: "Profile published",
    message: "Clients can now find and book you.",
  },
  profileIncomplete: {
    tone: "warning", icon: AlertTriangle, title: "Profile incomplete",
    message: "A few required details are missing, so your profile isn't visible to clients yet.",
    primary: "Finish profile",
    next: "Complete every required section to publish.",
  },

  // ---- Availability ----
  availabilityUpdated: {
    tone: "success", icon: CalendarCheck2, title: "Availability updated",
    message: "Your bookable hours are live for clients.",
  },
  scheduleConflict: {
    tone: "danger", icon: AlertTriangle, title: "Scheduling conflict",
    message: "You already have a session booked at this time.",
    primary: "Choose another time", secondary: "View conflicting booking",
    next: "Pick a different slot to continue.",
  },

  // ---- Guardrails ----
  actionBlockedOffline: {
    tone: "neutral", icon: WifiOff, title: "You're offline",
    message: "This action needs a connection - reconnect and try again.",
    primary: "Retry",
  },
  invalidAction: {
    tone: "danger", icon: AlertCircle, title: "This action can't be completed",
    message: "That request was already handled, or is no longer available.",
    primary: "Refresh",
  },
  unauthorized: {
    tone: "danger", icon: UserX, title: "Not authorized",
    message: "You don't have permission to do that.",
    primary: "Go back",
  },
};

function resolveState(state, params) {
  if (typeof state === "string") return { key: state, ...STATE_CATALOG[state], params };
  return { ...state, params };
}

/* -------------------------------------------------------------------------
   StatusBanner — the workhorse component.
   ------------------------------------------------------------------------- */
export function StatusBanner({ state, params, title, message, next, onPrimary, onSecondary, primaryLabel, secondaryLabel, equalActions, compact, style }) {
  const C = useColors();
  const TONES = getTones(C);
  const cfg = resolveState(state, params);
  const tone = TONES[cfg.tone] || TONES.neutral;
  const Icon = cfg.icon || Info;
  const useEqualActions = Boolean(equalActions && onPrimary && onSecondary);
  return (
    <div style={{
      display: "flex", gap: 12, alignItems: "flex-start", background: tone.bg,
      border: `1px solid ${tone.bg}`, borderRadius: 16, padding: compact ? "12px 13px" : "14px 15px",
      ...style,
    }}>
      <div style={{ width: compact ? 30 : 36, height: compact ? 30 : 36, borderRadius: 11, background: C.white, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={compact ? 15 : 17} color={tone.fg} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: compact ? T.body : T.subtitle, fontWeight: 700, color: C.jet, ...fDisplay }}>{title || cfg.title}</div>
        {(message || cfg.message) && (
          <div style={{ fontSize: compact ? T.label : T.labelLg, color: C.slate, marginTop: 3, lineHeight: 1.5, ...fBody }}>{message || cfg.message}</div>
        )}
        {(next || cfg.next) && (
          <div style={{ fontSize: T.captionLg, color: tone.fg, marginTop: 6, fontWeight: 600, ...fBody }}>Next: {next || cfg.next}</div>
        )}
        {(onPrimary || onSecondary) && (
          <div style={{ display: useEqualActions ? "grid" : "flex", gridTemplateColumns: useEqualActions ? "repeat(2, minmax(0, 1fr))" : undefined, gap: 8, marginTop: 10 }}>
            {onPrimary && (
              <button type="button" onClick={onPrimary} style={{ width: useEqualActions ? "100%" : "auto", minHeight: useEqualActions ? 44 : undefined, display: "inline-flex", alignItems: "center", justifyContent: "center", background: tone.fg, color: C.white, border: "none", borderRadius: 9, padding: useEqualActions ? "0 10px" : "7px 12px", fontSize: T.label, lineHeight: 1.2, whiteSpace: "nowrap", fontWeight: 700, cursor: "pointer", ...fBody }}>
                {primaryLabel || cfg.primary || "Continue"}
              </button>
            )}
            {onSecondary && (
              <button type="button" onClick={onSecondary} style={{ width: useEqualActions ? "100%" : "auto", minHeight: useEqualActions ? 44 : undefined, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "none", color: C.jet, border: `1px solid ${C.border}`, borderRadius: 9, padding: useEqualActions ? "0 10px" : "7px 12px", fontSize: T.label, lineHeight: 1.2, whiteSpace: "nowrap", fontWeight: 600, cursor: "pointer", ...fBody }}>
                {secondaryLabel || cfg.secondary || "Cancel"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   ResultOverlay — full-screen transient overlay
   ------------------------------------------------------------------------- */
export function ResultOverlay({ open, state, params, title, message }) {
  const C = useColors();
  const TONES = getTones(C);
  if (!open) return null;
  const cfg = resolveState(state, params);
  const tone = TONES[cfg.tone] || TONES.neutral;
  const Icon = cfg.icon || Info;
  const isProcessing = cfg.tone === "info";
  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(22,24,29,.88)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 80, textAlign: "center", padding: "0 30px" }}>
      <div style={{ width: 64, height: 64, borderRadius: 20, background: isProcessing ? "rgba(255,255,255,.1)" : tone.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, animation: isProcessing ? "none" : "clPopIn .25s ease" }}>
        {isProcessing ? <Spin /> : <Icon size={28} color={tone.fg} />}
      </div>
      <div style={{ color: CL.white, fontSize: T.subtitleLg, fontWeight: 700, ...fDisplay }}>{title || cfg.title}</div>
      {(message || cfg.message) && (
        <div style={{ color: CL.onDark, fontSize: T.labelLg, marginTop: 6, lineHeight: 1.5, ...fBody }}>{message || cfg.message}</div>
      )}
    </div>
  );
}

function Spin() {
  return <span aria-hidden="true" style={{ width: 24, height: 24, borderRadius: "50%", border: `2.5px solid ${CL.onDarkDivider}`, borderTopColor: CL.white, display: "inline-block", animation: "clSpin .7s linear infinite" }} />;
}

/* -------------------------------------------------------------------------
   InlineStatus — tiny icon + label
   ------------------------------------------------------------------------- */
export function InlineStatus({ state, params, label }) {
  const C = useColors();
  const TONES = getTones(C);
  const cfg = resolveState(state, params);
  const tone = TONES[cfg.tone] || TONES.neutral;
  const Icon = cfg.icon || Info;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: T.captionLg, fontWeight: 700, color: tone.fg, ...fBody }}>
      <Icon size={12} /> {label || cfg.title}
    </span>
  );
}
