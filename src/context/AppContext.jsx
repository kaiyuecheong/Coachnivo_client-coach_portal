import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import {
  INITIAL_BOOKINGS, COACH_BOOKINGS, ADMIN_VERIFICATION_QUEUE, ADMIN_DISPUTES,
  INITIAL_AVAILABILITY_BLOCKS, BOOKING_STATUS, PAYMENT_STATUS, PAYOUT_STATUS,
  SESSION_DISPUTES, ADDITIONAL_CHARGES, DISPUTE_STATUS, DISPUTE_OUTCOME,
  ADDITIONAL_CHARGE_STATUS, ADDITIONAL_CHARGE_PHASE, ADDITIONAL_CHARGE_KIND,
  CLIENT_NOTIFICATIONS, COACH_NOTIFICATIONS, SESSION_OTP,
} from "../data/bookings";
import { COACHES } from "../data/coaches";
import { getCoachMedia } from "../data/media";
import { CURRENT_CLIENT, isHandleTaken as isHandleTakenBase } from "../data/users";
import { getPublicName, fullNameOf } from "../utils/name";
import { formatCoachLocation, getCoachPublicProfile } from "../utils/coachProfile";
import { useUserLocation } from "../utils/useUserLocation";
import { applyTheme } from "../theme/theme";
import { loadStored, saveStored, STORAGE_KEYS } from "../utils/persistence";
import { getRoleHome } from "../utils/roles";

/* =========================================================================
   APP CONTEXT
   -------------------------------------------------------------------------
   Single source of truth for all prototype state — bookings, notifications,
   verification, coach media, availability, dark mode, etc.
   ========================================================================= */

const AppContext = createContext(null);

const getNextBookingNumber = () => {
  const seededIds = [...INITIAL_BOOKINGS, ...COACH_BOOKINGS]
    .map((booking) => /^b(\d+)$/.exec(String(booking.id || ""))?.[1])
    .filter(Boolean)
    .map(Number);
  return Math.max(0, ...seededIds) + 1;
};

const seedNotifications = () => [
  ...CLIENT_NOTIFICATIONS.map((notification) => ({ ...notification, audience: "client" })),
  ...COACH_NOTIFICATIONS.map((notification) => ({ ...notification, audience: "coach" })),
];

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp() must be used inside <AppProvider>");
  return ctx;
}

export function AppProvider({ children }) {
  // ---- Navigation ----
  const [role, setRole] = useState("client");
  const [screen, setScreen] = useState("splash");
  const [params, setParams] = useState({});
  const [history, setHistory] = useState([]);
  const screenRef = useRef(screen);
  const paramsRef = useRef(params);
  const historyRef = useRef(history);
  const roleRef = useRef(role);

  // ---- UI ----
  const [toastMsg, setToastMsg] = useState(null);
  const [offline, setOffline] = useState(false);
  const [darkMode, setDarkMode] = useState(() => loadStored(STORAGE_KEYS.darkMode, false) === true);

  // ---- Client state ----
  const [favorites, setFavorites] = useState(() => {
    const stored = loadStored(STORAGE_KEYS.favorites, ["c1"]);
    return Array.isArray(stored) ? stored.filter((id) => typeof id === "string") : ["c1"];
  });
  const [biometric, setBiometric] = useState(false);
  const [clientPrefs, setClientPrefs] = useState(null);
  const [clientFilters, setClientFilters] = useState(() => loadStored(STORAGE_KEYS.clientFilters, null));
  const [childrenState, setChildren] = useState([]);
  const [isFirstTimeClient, setIsFirstTimeClient] = useState(false);
  const [discoveryPrefs, setDiscoveryPrefs] = useState(() => loadStored(STORAGE_KEYS.discoveryPrefs, { seeded: true }));
  const [showPostSignupGuide, setShowPostSignupGuide] = useState(false);
  const [clientIdentity, setClientIdentity] = useState(CURRENT_CLIENT);
  const [clientPaymentMethods, setClientPaymentMethods] = useState([]);

  // ---- Booking state ----
  const [bookings, setBookings] = useState(() => [...INITIAL_BOOKINGS]);
  const [coachBookings, setCoachBookings] = useState(COACH_BOOKINGS);
  const [sessionDisputes, setSessionDisputes] = useState(SESSION_DISPUTES);
  const [additionalCharges, setAdditionalCharges] = useState(ADDITIONAL_CHARGES);
  const [draft, setDraft] = useState(null);
  const nextBookingNumberRef = useRef(getNextBookingNumber());

  // ---- Coach state ----
  const [verified, setVerified] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState("none");
  const [reachedDashboardAfterVerification, setReachedDashboardAfterVerification] = useState(false);
  const [hasCoachRole, setHasCoachRole] = useState(false);
  const [coachOnboarding, setCoachOnboarding] = useState({});
  const [coachPackages, setCoachPackages] = useState(COACHES[1].packages);
  const [coachMedia, setCoachMedia] = useState(() => getCoachMedia(COACHES[1].id));
  const [availabilityBlocks, setAvailabilityBlocks] = useState(INITIAL_AVAILABILITY_BLOCKS);
  const [coachAvailableNow, setCoachAvailableNow] = useState(true);

  // ---- Business bookings (shared session lifecycle keeps an empty pool;
  //      business marketplace is excluded from the portal) ----
  const [businessBookings, setBusinessBookings] = useState([]);

  // ---- Admin state ----
  const [verificationQueue, setVerificationQueue] = useState(ADMIN_VERIFICATION_QUEUE);
  const [disputes, setDisputes] = useState(ADMIN_DISPUTES);

  // ---- Notifications ----
  const [notifications, setNotifications] = useState(seedNotifications);

  // ---- Shared location ----
  const userLocationState = useUserLocation();

  // ======== Dark mode effect ========
  useEffect(() => {
    applyTheme(document.documentElement, darkMode ? "dark" : "light");
  }, [darkMode, screen]);

  // ======== Persistence — keep lightweight preferences across reloads ========
  useEffect(() => { saveStored(STORAGE_KEYS.darkMode, darkMode); }, [darkMode]);
  useEffect(() => { saveStored(STORAGE_KEYS.favorites, favorites); }, [favorites]);
  useEffect(() => { saveStored(STORAGE_KEYS.clientFilters, clientFilters); }, [clientFilters]);
  useEffect(() => { saveStored(STORAGE_KEYS.discoveryPrefs, discoveryPrefs); }, [discoveryPrefs]);

  useEffect(() => { screenRef.current = screen; }, [screen]);
  useEffect(() => { paramsRef.current = params; }, [params]);
  useEffect(() => { historyRef.current = history; }, [history]);
  useEffect(() => { roleRef.current = role; }, [role]);

  const toggleDarkMode = () => setDarkMode((v) => !v);

  // ======== Derived state ========
  const clientNotifications = notifications.filter((n) => n.audience === "client");
  const coachNotifications = notifications.filter((n) => n.audience === "coach");

  // Public identity of the current coach (onboarding data over directory seed).
  const coachIdentity = {
    name: coachOnboarding.name || COACHES[1].name,
    handle: coachOnboarding.handle || COACHES[1].handle,
    namePrivacy: coachOnboarding.namePrivacy || COACHES[1].namePrivacy,
  };

  const setClientNotifications = (updater) => {
    setNotifications((all) => {
      const clientItems = all.filter((n) => n.audience === "client");
      const nextClientItems = typeof updater === "function" ? updater(clientItems) : updater;
      const nextById = new Map(nextClientItems.map((n) => [n.id, n]));
      return all.map((n) => (n.audience === "client" ? nextById.get(n.id) || n : n));
    });
  };

  // ======== Actions ========
  const toast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2200);
  };

  const normaliseHistoryEntry = (entry) => typeof entry === "string"
    ? { screen: entry, params: {}, role: roleRef.current }
    : entry;

  const commitRoute = (nextScreen, nextParams = {}, nextRole = roleRef.current) => {
    screenRef.current = nextScreen;
    paramsRef.current = nextParams;
    roleRef.current = nextRole;
    setScreen(nextScreen);
    setParams(nextParams);
    setRole(nextRole);
  };

  // One public profile model powers both the coach preview and the client
  // profile. Directory data remains the fallback for coaches that are not the
  // current signed-in coach.
  const coachProfile = getCoachPublicProfile({
    base: COACHES[1],
    onboarding: coachOnboarding,
    packages: coachPackages,
    availableNow: coachAvailableNow,
  });

  const getBookingCoachPublicIdentity = (booking) => {
    const listedCoach = COACHES.find((coach) => coach.id === booking?.coachId);
    const bookingCoach = listedCoach?.id === coachProfile.id
      ? coachProfile
      : listedCoach || { ...coachIdentity, name: booking?.coachName || coachIdentity.name };
    return getPublicName(bookingCoach, "public");
  };

  const setCoachNotifications = (updater) => {
    setNotifications((all) => {
      const coachItems = all.filter((n) => n.audience === "coach");
      const nextCoachItems = typeof updater === "function" ? updater(coachItems) : updater;
      const nextById = new Map(nextCoachItems.map((n) => [n.id, n]));
      return all.map((n) => (n.audience === "coach" ? nextById.get(n.id) || n : n));
    });
  };

  const commitHistory = (nextHistory) => {
    historyRef.current = nextHistory;
    setHistory(nextHistory);
  };

  const nav = (nextScreen, nextParams = {}, nextRole = roleRef.current) => {
    if (!nextScreen) return;
    if (nextScreen === screenRef.current && nextRole === roleRef.current) {
      commitRoute(nextScreen, nextParams, nextRole);
      return;
    }
    const stack = historyRef.current.map(normaliseHistoryEntry);
    const previous = stack[stack.length - 1];

    // Several legacy screens use nav(previousRoute) for their back button.
    // Recognise that immediate reversal and unwind it instead of creating a
    // forward/back loop in the stack.
    if (previous?.screen === nextScreen) {
      commitHistory(stack.slice(0, -1));
      commitRoute(nextScreen, Object.keys(nextParams).length ? nextParams : previous.params, previous.role);
      return;
    }

    const currentEntry = {
      screen: screenRef.current,
      params: paramsRef.current,
      role: roleRef.current,
    };
    commitHistory([...stack, currentEntry]);
    commitRoute(nextScreen, nextParams, nextRole);
  };

  const goBack = (fallbackScreen, fallbackParams = {}) => {
    const stack = historyRef.current.map(normaliseHistoryEntry);
    const previous = stack.pop();
    if (previous) {
      commitHistory(stack);
      commitRoute(previous.screen, previous.params || {}, previous.role || roleRef.current);
      return;
    }

    const explicitFallback = typeof fallbackScreen === "string" ? fallbackScreen : null;
    const safeFallback = explicitFallback
      || getRoleHome(roleRef.current);
    commitHistory([]);
    commitRoute(safeFallback, explicitFallback && fallbackParams && !fallbackParams.nativeEvent ? fallbackParams : {}, roleRef.current);
  };

  const replaceNav = (nextScreen, nextParams = {}, nextRole = roleRef.current) => {
    commitRoute(nextScreen, nextParams, nextRole);
  };

  const resetNav = (nextScreen, nextParams = {}, nextRole = roleRef.current) => {
    commitHistory([]);
    commitRoute(nextScreen, nextParams, nextRole);
  };

  const goToHistory = (index) => {
    const stack = historyRef.current.map(normaliseHistoryEntry);
    const target = stack[index];
    if (!target) return;
    commitHistory(stack.slice(0, index));
    commitRoute(target.screen, target.params || {}, target.role || roleRef.current);
  };

  const toggleFav = (id) =>
    setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));

  const pushNotification = ({ audience, type = "booking", title, body, bookingId, chargeId, businessId }) => {
    setNotifications((n) => [
      {
        id: `rt${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
        audience, type, title, body, bookingId, chargeId, businessId, time: "Just now", unread: true,
      },
      ...n,
    ]);
  };

  const updateCoachOnboarding = (patch) => setCoachOnboarding((c) => ({ ...c, ...patch }));

  // ---- Identity / handles ----
  const updateClientIdentity = (patch) => setClientIdentity((c) => ({ ...c, ...patch }));
  const isHandleTaken = (handle, ownHandles = []) => isHandleTakenBase(handle, [
    clientIdentity.handle,
    coachOnboarding.handle,
    ...ownHandles,
  ]);

  // ---- Booking actions ----
  const addBooking = (d) => {
    if (!d?.coach?.id || !d?.pkg?.name) return null;

    const id = d.id || `b${nextBookingNumberRef.current++}`;
    const coachId = d.coach.id;
    const clientFull = fullNameOf(clientIdentity);
    const clientPub = getPublicName(clientIdentity, "public");
    const who = clientPub.handle ? `${clientPub.name} (${clientPub.handle})` : clientPub.name;
    const sharedBooking = {
      id,
      coachId,
      coachName: d.coach.name,
      clientName: clientFull,
      clientHandle: clientIdentity.handle,
      clientPrivacy: clientIdentity.namePrivacy,
      service: d.pkg.name,
      date: d.day,
      time: d.time,
      mode: d.mode,
      status: BOOKING_STATUS.PENDING,
      paymentStatus: PAYMENT_STATUS.NOT_REQUESTED,
      payoutStatus: PAYOUT_STATUS.NOT_READY,
      price: Number(d.total || d.pkg.price || 0),
      participants: d.participants || "You",
      notes: d.bookingNotes || "",
      safetyNotes: d.safetyNotes || d.conditions || "",
      includesMinor: !!d.includesMinor,
      guardianName: d.guardianName || "",
      guardianRelationship: d.guardianRelationship || "",
      guardianPhone: d.guardianPhone || "",
      emergencyName: d.emergencyName || "",
      emergencyPhone: d.emergencyPhone || "",
      createdAt: "Just now",
    };

    // The prototype renders both sides of the same marketplace transaction in
    // one app session. Keep a shared ID and payload in each role's collection
    // so client Requests, coach Requests and notifications always agree.
    setBookings((items) => [
      { ...sharedBooking, reviewed: false },
      ...items.filter((booking) => booking.id !== id),
    ]);
    setCoachBookings((items) => [
      sharedBooking,
      ...items.filter((booking) => booking.id !== id),
    ]);
    setIsFirstTimeClient(false);
    pushNotification({
      audience: "coach", type: "booking", title: "New booking request",
      body: `${who} requested a ${d.pkg.name} for ${d.day}, ${d.time}.`,
      bookingId: id,
    });
    return id;
  };

  const cancelBooking = (id) => {
    const target = bookings.find((booking) => booking.id === id)
      || coachBookings.find((booking) => booking.id === id);
    if (!target || [BOOKING_STATUS.CANCELLED, BOOKING_STATUS.DECLINED, BOOKING_STATUS.EXPIRED].includes(target.status)) return;

    const wasPaid = [PAYMENT_STATUS.HELD, PAYMENT_STATUS.RELEASED].includes(target.paymentStatus);
    const refundableTotal = Number(target.paidTotal || target.price || 0);
    const cancellationPatch = {
      status: BOOKING_STATUS.CANCELLED,
      ...(wasPaid
        ? { paymentStatus: PAYMENT_STATUS.REFUND_PROCESSING, refundStatus: "processing" }
        : { paymentStatus: PAYMENT_STATUS.NOT_REQUESTED }),
    };

    setBookings((items) => items.map((booking) => (booking.id === id ? { ...booking, ...cancellationPatch } : booking)));
    setCoachBookings((items) => items.map((booking) => (booking.id === id ? { ...booking, ...cancellationPatch } : booking)));

    const wasPending = target.status === BOOKING_STATUS.PENDING;
    pushNotification({
      audience: target.providerType === "business" ? "business" : "coach",
      businessId: target.businessId,
      type: "booking",
      title: wasPending ? "Request withdrawn" : "Booking cancelled",
      body: `${target.clientName || "A client"} ${wasPending ? "withdrew their request for" : "cancelled"} ${target.service}${target.date ? ` on ${target.date}` : ""}.`,
      bookingId: id,
    });

    if (wasPaid) {
      pushNotification({
        audience: "client",
        type: "payment",
        title: "Refund started",
        body: `Your refund for ${target.service} is being returned to your original payment method.`,
        bookingId: id,
      });
      setTimeout(() => {
        const refundPatch = { paymentStatus: PAYMENT_STATUS.REFUNDED, refundStatus: "refunded" };
        setBookings((items) => items.map((booking) => (booking.id === id ? { ...booking, ...refundPatch } : booking)));
        setCoachBookings((items) => items.map((booking) => (booking.id === id ? { ...booking, ...refundPatch } : booking)));
        pushNotification({
          audience: "client",
          type: "payment",
          title: "Refund complete",
        body: `$${refundableTotal.toFixed(2)} was returned to your original payment method.`,
          bookingId: id,
        });
        toast(`$${refundableTotal.toFixed(2)} refunded`);
      }, 1400);
    }
  };

  const rescheduleBooking = (id, { date, time }, actorRole = "client") => {
    const target = bookings.find((booking) => booking.id === id)
      || coachBookings.find((booking) => booking.id === id);
    if (!target) return;

    const schedulePatch = { date, time };
    setBookings((items) => items.map((booking) => (booking.id === id ? { ...booking, ...schedulePatch } : booking)));
    setCoachBookings((items) => items.map((booking) => (booking.id === id ? { ...booking, ...schedulePatch } : booking)));
    pushNotification({
      audience: actorRole === "coach" ? "client" : "coach",
      type: "booking",
      title: "Session rescheduled",
      body: actorRole === "coach"
        ? `${target.coachName || coachIdentity.name} moved ${target.service} to ${date}, ${time}.`
        : `${target.clientName || "Your client"} moved ${target.service} to ${date}, ${time}.`,
      bookingId: id,
    });
  };

  const markBookingPaid = (id, selectedOptionalChargeIds = []) => {
    const target = bookings.find((booking) => booking.id === id)
      || coachBookings.find((booking) => booking.id === id);
    if (!target || target.status !== BOOKING_STATUS.AWAITING_PAYMENT) return false;

    const selectedOptional = new Set(selectedOptionalChargeIds);
    const acceptanceCharges = additionalCharges.filter((charge) => (
      charge.bookingId === id
      && charge.phase === ADDITIONAL_CHARGE_PHASE.ACCEPTANCE
      && charge.status === ADDITIONAL_CHARGE_STATUS.PENDING
    ));
    const paidCharges = acceptanceCharges.filter((charge) => (
      charge.kind === ADDITIONAL_CHARGE_KIND.REQUIRED || selectedOptional.has(charge.id)
    ));
    const chargeTotal = paidCharges.reduce((sum, charge) => sum + Number(charge.amount || 0), 0);
    const paidTotal = Number(target.price || 0) + chargeTotal;

    const paymentPatch = {
      status: BOOKING_STATUS.CONFIRMED,
      paymentStatus: PAYMENT_STATUS.HELD,
      payoutStatus: PAYOUT_STATUS.NOT_READY,
      paidAt: "Just now",
      acceptanceChargeTotal: chargeTotal,
      paidTotal,
    };
    setAdditionalCharges((items) => items.map((charge) => {
      if (charge.bookingId !== id || charge.phase !== ADDITIONAL_CHARGE_PHASE.ACCEPTANCE || charge.status !== ADDITIONAL_CHARGE_STATUS.PENDING) return charge;
      const selected = charge.kind === ADDITIONAL_CHARGE_KIND.REQUIRED || selectedOptional.has(charge.id);
      return selected
        ? { ...charge, status: ADDITIONAL_CHARGE_STATUS.PAID, selected: true, paidAt: "Just now" }
        : { ...charge, status: ADDITIONAL_CHARGE_STATUS.DECLINED, selected: false, decidedAt: "Just now" };
    }));
    setBookings((items) => items.map((booking) => (booking.id === id ? { ...booking, ...paymentPatch } : booking)));
    setCoachBookings((items) => items.map((booking) => (booking.id === id ? { ...booking, ...paymentPatch } : booking)));
    pushNotification({
      audience: "coach",
      type: "payment",
      title: "Payment received",
      body: `Payment of $${paidTotal.toFixed(2)} received for ${target.service}. The session is now confirmed.`,
      bookingId: id,
    });
    return true;
  };

  const respondBooking = (id, status) => {
    const target = coachBookings.find((booking) => booking.id === id)
      || bookings.find((booking) => booking.id === id);
    if (!target || target.status !== BOOKING_STATUS.PENDING) return false;

    const nextStatus = status === BOOKING_STATUS.CONFIRMED ? BOOKING_STATUS.AWAITING_PAYMENT : status;
    if (![BOOKING_STATUS.AWAITING_PAYMENT, BOOKING_STATUS.DECLINED].includes(nextStatus)) return false;

    const responsePatch = {
      status: nextStatus,
      paymentStatus: nextStatus === BOOKING_STATUS.AWAITING_PAYMENT
        ? PAYMENT_STATUS.DUE
        : PAYMENT_STATUS.NOT_REQUESTED,
      payoutStatus: PAYOUT_STATUS.NOT_READY,
      ...(nextStatus === BOOKING_STATUS.AWAITING_PAYMENT
        ? { acceptedAt: "Just now", paymentDeadline: "Tomorrow, 6:00pm", paymentReminderSent: false }
        : {}),
    };
    setCoachBookings((items) => items.map((booking) => (booking.id === id ? { ...booking, ...responsePatch } : booking)));
    setBookings((items) => items.map((booking) => (booking.id === id ? { ...booking, ...responsePatch } : booking)));
    const coachPub = getBookingCoachPublicIdentity(target);
    if (nextStatus === BOOKING_STATUS.AWAITING_PAYMENT) {
      pushNotification({
        audience: "client", type: "payment", title: "Send your payment",
        body: `${coachPub.name} accepted your ${target.service} request - send payment to confirm your session on ${target.date}.`,
        bookingId: id,
      });
    } else if (nextStatus === BOOKING_STATUS.DECLINED) {
      pushNotification({
        audience: "client", type: "booking", title: "Booking declined",
        body: `${coachPub.name} declined your ${target.service} request for ${target.date}.`,
        bookingId: id,
      });
    }
    return true;
  };

  const acceptBookingWithCharges = (id, charges = []) => {
    const coachBooking = coachBookings.find((booking) => booking.id === id);
    const target = coachBooking
      || bookings.find((booking) => booking.id === id);
    if (!target || target.status !== BOOKING_STATUS.PENDING) return false;

    const currentClientName = fullNameOf(clientIdentity).trim().toLowerCase();
    const requestClientName = String(target.clientName || "").trim().toLowerCase();
    const belongsToSignedInClient = requestClientName === currentClientName;
    const hasClientBooking = bookings.some((booking) => booking.id === id);

    // Older prototype records may exist only in the coach queue. Hydrate a
    // matching client copy before acceptance so details and notifications use
    // one shared booking ID across both roles.
    if (coachBooking && !hasClientBooking && belongsToSignedInClient) {
      setBookings((items) => [{
        ...coachBooking,
        id,
        coachId: coachBooking.coachId || COACHES[1].id,
        coachName: coachBooking.coachName || coachIdentity.name,
        reviewed: false,
        participants: coachBooking.participants || "You",
      }, ...items]);
    }

    const normalisedCharges = charges
      .map((charge, index) => ({
        id: `charge-${Date.now()}-${index}`,
        bookingId: id,
        reason: String(charge.reason || "Additional cost").trim(),
        note: String(charge.note || "Added by the coach when accepting this booking.").trim(),
        amount: Number(charge.amount || 0),
        phase: ADDITIONAL_CHARGE_PHASE.ACCEPTANCE,
        kind: charge.kind === ADDITIONAL_CHARGE_KIND.OPTIONAL
          ? ADDITIONAL_CHARGE_KIND.OPTIONAL
          : ADDITIONAL_CHARGE_KIND.REQUIRED,
        evidence: "Included with booking acceptance",
        status: ADDITIONAL_CHARGE_STATUS.PENDING,
        createdAt: "Just now",
        dueAt: charge.kind === ADDITIONAL_CHARGE_KIND.OPTIONAL ? "Choose at checkout" : "Pay with your booking",
      }))
      .filter((charge) => charge.reason && charge.amount > 0);

    const responsePatch = {
      status: BOOKING_STATUS.AWAITING_PAYMENT,
      paymentStatus: PAYMENT_STATUS.DUE,
      payoutStatus: PAYOUT_STATUS.NOT_READY,
      acceptedAt: "Just now",
      paymentDeadline: "Tomorrow, 6:00pm",
      paymentReminderSent: false,
    };
    if (normalisedCharges.length) setAdditionalCharges((items) => [...normalisedCharges, ...items]);
    setCoachBookings((items) => items.map((booking) => (booking.id === id ? { ...booking, ...responsePatch } : booking)));
    setBookings((items) => items.map((booking) => (booking.id === id ? { ...booking, ...responsePatch } : booking)));

    const requiredTotal = normalisedCharges
      .filter((charge) => charge.kind === ADDITIONAL_CHARGE_KIND.REQUIRED)
      .reduce((sum, charge) => sum + charge.amount, 0);
    const optionalCount = normalisedCharges.filter((charge) => charge.kind === ADDITIONAL_CHARGE_KIND.OPTIONAL).length;
    const coachPub = getBookingCoachPublicIdentity(target);
    if (hasClientBooking || belongsToSignedInClient) {
      pushNotification({
        audience: "client",
        type: "payment",
        title: "Booking accepted - review payment",
        body: `${coachPub.name} accepted ${target.service}. $${(Number(target.price || 0) + requiredTotal).toFixed(2)} is required${optionalCount ? `, with ${optionalCount} optional add-on${optionalCount === 1 ? "" : "s"}` : ""}.`,
        bookingId: id,
      });
    }
    return true;
  };

  const sendPaymentReminder = (id) => {
    const target = coachBookings.find((booking) => booking.id === id)
      || bookings.find((booking) => booking.id === id);
    if (!target || target.status !== BOOKING_STATUS.AWAITING_PAYMENT) return false;

    const reminderPatch = { paymentReminderSent: true, paymentReminderSentAt: "Just now" };
    setCoachBookings((items) => items.map((booking) => (booking.id === id ? { ...booking, ...reminderPatch } : booking)));
    setBookings((items) => items.map((booking) => (booking.id === id ? { ...booking, ...reminderPatch } : booking)));
    pushNotification({
      audience: "client",
      type: "payment",
      title: "Payment reminder",
      body: `Complete payment for ${target.service} by ${target.paymentDeadline || "tomorrow at 6:00pm"} to keep your session.`,
      bookingId: id,
    });
    return true;
  };

  const expireAwaitingPayment = (id) => {
    const target = coachBookings.find((booking) => booking.id === id)
      || bookings.find((booking) => booking.id === id);
    if (!target || target.status !== BOOKING_STATUS.AWAITING_PAYMENT) return false;

    const expiryPatch = {
      status: BOOKING_STATUS.EXPIRED,
      paymentStatus: PAYMENT_STATUS.NOT_REQUESTED,
      payoutStatus: PAYOUT_STATUS.NOT_READY,
      slotReleased: true,
    };
    setCoachBookings((items) => items.map((booking) => (booking.id === id ? { ...booking, ...expiryPatch } : booking)));
    setBookings((items) => items.map((booking) => (booking.id === id ? { ...booking, ...expiryPatch } : booking)));
    pushNotification({
      audience: "client",
      type: "booking",
      title: "Payment window closed",
      body: `The reserved slot for ${target.service} was released because payment was not completed.`,
      bookingId: id,
    });
    return true;
  };

  /* ---- Session OTP & live-session lifecycle ----
     Mirrors ride-hailing / service-marketplace check-in: the client generates
     a fresh 6-digit code, the coach enters it to start the session, and
     completion is coach-driven (client payment of any final charge acts as
     acceptance — disputes stay available after completion). */

  const generateSessionCode = (id) => {
    const target = bookings.find((booking) => booking.id === id)
      || coachBookings.find((booking) => booking.id === id)
      || businessBookings.find((booking) => booking.id === id);
    if (!target || target.status !== BOOKING_STATUS.CONFIRMED) return null;

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codePatch = {
      sessionCode: code,
      codeGeneratedAt: "Just now",
      codeExpiresAt: Date.now() + SESSION_OTP.TTL_SECONDS * 1000,
      codeAttempts: 0,
    };
    setBookings((items) => items.map((booking) => (booking.id === id ? { ...booking, ...codePatch } : booking)));
    setCoachBookings((items) => items.map((booking) => (booking.id === id ? { ...booking, ...codePatch } : booking)));
    setBusinessBookings((items) => items.map((booking) => (booking.id === id ? { ...booking, ...codePatch } : booking)));
    pushNotification({
      audience: "coach",
      type: "session",
      title: "Client ready with session code",
      body: `${target.clientName || "Your client"} generated a session code for ${target.service}. Enter it to start the session.`,
      bookingId: id,
    });
    return code;
  };

  const verifySessionCode = (id, code) => {
    const target = coachBookings.find((booking) => booking.id === id)
      || bookings.find((booking) => booking.id === id)
      || businessBookings.find((booking) => booking.id === id);
    if (!target || target.status !== BOOKING_STATUS.CONFIRMED) {
      return { ok: false, reason: "state" };
    }
    if (!target.sessionCode) {
      return { ok: false, reason: "no_code" };
    }
    // Runtime-generated codes always carry a real expiry. Seeded demo codes
    // may omit one, in which case the code simply doesn't expire.
    if (Number(target.codeExpiresAt) > 0 && Date.now() > target.codeExpiresAt) {
      return { ok: false, reason: "expired" };
    }
    const entry = String(code || "").trim();
    const attempts = Number(target.codeAttempts || 0) + 1;
    if (entry !== String(target.sessionCode)) {
      const attemptsLeft = Math.max(0, SESSION_OTP.MAX_ATTEMPTS - attempts);
      const failedPatch = { codeAttempts: attempts };
      if (attemptsLeft === 0) {
        failedPatch.sessionCode = null;
        failedPatch.codeExpiresAt = null;
      }
      setBookings((items) => items.map((booking) => (booking.id === id ? { ...booking, ...failedPatch } : booking)));
      setCoachBookings((items) => items.map((booking) => (booking.id === id ? { ...booking, ...failedPatch } : booking)));
      setBusinessBookings((items) => items.map((booking) => (booking.id === id ? { ...booking, ...failedPatch } : booking)));
      return { ok: false, reason: attemptsLeft === 0 ? "voided" : "mismatch", attemptsLeft };
    }

    const startPatch = {
      status: BOOKING_STATUS.IN_PROGRESS,
      paymentStatus: PAYMENT_STATUS.HELD,
      payoutStatus: PAYOUT_STATUS.NOT_READY,
      sessionStartedAt: "Just now",
      sessionCode: null,
      codeExpiresAt: null,
      codeAttempts: 0,
    };
    setBookings((items) => items.map((booking) => (booking.id === id ? { ...booking, ...startPatch } : booking)));
    setCoachBookings((items) => items.map((booking) => (booking.id === id ? { ...booking, ...startPatch } : booking)));
    setBusinessBookings((items) => items.map((booking) => (booking.id === id ? { ...booking, ...startPatch } : booking)));
    pushNotification({
      audience: "client",
      type: "session",
      title: "Session started",
      body: `${target.coachName || "Your coach"} verified your code — ${target.service} is now live.`,
      bookingId: id,
    });
    pushNotification({
      audience: target.providerType === "business" ? "business" : "coach",
      businessId: target.businessId,
      type: "session",
      title: "Session in progress",
      body: `Code verified for ${target.service} with ${target.clientName || "your client"}. Have a great session!`,
      bookingId: id,
    });
    if (target.providerType === "business" && target.assignedCoachId) {
      pushNotification({ audience: "businessCoach", businessId: target.businessId, coachId: target.assignedCoachId, type: "session", title: "Session in progress", body: `Code verified for ${target.service} with ${target.clientName || "your client"}.`, bookingId: id });
    }
    return { ok: true };
  };

  const completeBookingAndRelease = (id, actorLabel) => {
    const target = bookings.find((booking) => booking.id === id)
      || coachBookings.find((booking) => booking.id === id)
      || businessBookings.find((booking) => booking.id === id);
    if (!target) return;
    const releasePatch = {
      status: BOOKING_STATUS.COMPLETED,
      paymentStatus: PAYMENT_STATUS.RELEASED,
      payoutStatus: PAYOUT_STATUS.RELEASED,
      completionConfirmations: ["coach", "client"],
      completionConfirmedBy: "coach",
      completionConfirmedAt: "Just now",
      fundsReleasedAt: "Just now",
      sessionEndedAt: target.sessionEndedAt || "Just now",
    };
    setCoachBookings((items) => items.map((booking) => (booking.id === id ? { ...booking, ...releasePatch } : booking)));
    setBookings((items) => items.map((booking) => (booking.id === id ? { ...booking, ...releasePatch } : booking)));
    setBusinessBookings((items) => items.map((booking) => (booking.id === id ? { ...booking, ...releasePatch } : booking)));
    pushNotification({
      audience: target.providerType === "business" ? "business" : "coach",
      businessId: target.businessId,
      type: "payment",
      title: target.providerType === "business" ? "Booking payment settled" : "Payout released",
      body: target.providerType === "business" ? `The customer payment for ${target.service} has been released to the business.` : `Your payout for ${target.service} is on its way to your bank account.`,
      bookingId: id,
    });
    pushNotification({
      audience: "client",
      type: "payment",
      title: "Session completed - payment released",
      body: `${target.service} is complete and the held payment has been released${actorLabel ? ` after ${actorLabel}` : ""}.`,
      bookingId: id,
    });
    if (target.providerType === "business" && target.assignedCoachId) {
      pushNotification({ audience: "businessCoach", businessId: target.businessId, coachId: target.assignedCoachId, type: "session", title: "Assigned session completed", body: `${target.service} is complete. ${target.providerName || "The business"} will reconcile your compensation separately.`, bookingId: id });
    }
  };

  const confirmSessionCompletion = (id, actorRole = role) => {
    // Provider-driven completion: the individual coach, business, or assigned
    // business coach can mark delivery complete.
    // The client no longer presses a confirm button — their payment of any
    // final charge acts as acceptance, and disputes remain available after
    // completion for anything that went wrong.
    if (!["coach", "business", "businessCoach"].includes(actorRole)) return false;
    const target = coachBookings.find((booking) => booking.id === id)
      || bookings.find((booking) => booking.id === id)
      || businessBookings.find((booking) => booking.id === id);
    if (!target || ![BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.COMPLETION_PENDING].includes(target.status)) return false;
    const unpaidFinalCharge = additionalCharges.some((charge) => (
      charge.bookingId === id
      && charge.phase === ADDITIONAL_CHARGE_PHASE.COMPLETION
      && charge.kind === ADDITIONAL_CHARGE_KIND.REQUIRED
      && charge.status === ADDITIONAL_CHARGE_STATUS.PENDING
    ));
    if (unpaidFinalCharge) return false;

    completeBookingAndRelease(id);
    return true;
  };

  // ---- Client prefs / children ----
  const handleClientPrefs = (prefs) => {
    setClientPrefs(prefs);
    if (prefs?.children?.length) {
      setChildren((c) => [
        ...c,
        ...prefs.children
          .filter((nc) => nc.name && nc.name.trim().length > 0)
          .filter((nc) => !c.some((ec) => ec.id === nc.id))
          .map((nc) => ({ sport: [], sportLevels: {}, goals: "", location: prefs.location || null, preferences: "", hasPhoto: false, ...nc })),
      ]);
    }
  };

  const addChild = (child) =>
    setChildren((c) => [...c, { id: Date.now(), name: "", age: "", sport: [], sportLevels: {}, goals: "", location: null, preferences: "", hasPhoto: false, ...child }]);
  const updateChild = (id, patch) =>
    setChildren((c) => c.map((ch) => (ch.id === id ? { ...ch, ...patch } : ch)));
  const removeChild = (id) =>
    setChildren((c) => c.filter((ch) => ch.id !== id));

  // ---- Session exceptions & additional charges ----
  const createSessionDispute = ({
    bookingId, filedByRole = role, category, categoryLabel, description,
    amountRequested, evidence = [], includeChat = true, chargeId,
  }) => {
    const target = bookings.find((booking) => booking.id === bookingId)
      || coachBookings.find((booking) => booking.id === bookingId)
      || businessBookings.find((booking) => booking.id === bookingId);
    if (!target) return null;

    const id = `case-${Date.now()}`;
    const record = {
      id, bookingId, filedByRole, category, categoryLabel, description,
      amountRequested: Number(amountRequested || target.price || 0),
      evidence, includeChat, chargeId,
      status: DISPUTE_STATUS.SUBMITTED,
      submittedAt: "Just now",
      updatedAt: "Just now",
      supportNote: "Your report is safely recorded. A resolution specialist will review the booking, messages and evidence.",
    };
    setSessionDisputes((items) => [record, ...items]);
    const exceptionPatch = { exceptionStatus: DISPUTE_STATUS.SUBMITTED, payoutStatus: PAYOUT_STATUS.PROCESSING };
    setBookings((items) => items.map((booking) => (booking.id === bookingId ? { ...booking, ...exceptionPatch } : booking)));
    setCoachBookings((items) => items.map((booking) => (booking.id === bookingId ? { ...booking, ...exceptionPatch } : booking)));
    setBusinessBookings((items) => items.map((booking) => (booking.id === bookingId ? { ...booking, ...exceptionPatch } : booking)));
    const reportAudience = filedByRole === "client"
      ? (target.providerType === "business" ? "business" : "coach")
      : filedByRole === "businessCoach" ? "business" : "client";
    pushNotification({
      audience: reportAudience,
      businessId: target.businessId,
      type: "dispute",
      title: "Session report submitted",
      body: `A report was opened for ${target.service}. Funds will stay protected while it is reviewed.`,
      bookingId,
    });
    window.setTimeout(() => {
      setSessionDisputes((items) => items.map((item) => (
        item.id === id
          ? { ...item, status: DISPUTE_STATUS.REVIEWING, updatedAt: "Just now" }
          : item
      )));
      setBookings((items) => items.map((booking) => (booking.id === bookingId ? { ...booking, exceptionStatus: DISPUTE_STATUS.REVIEWING } : booking)));
      setCoachBookings((items) => items.map((booking) => (booking.id === bookingId ? { ...booking, exceptionStatus: DISPUTE_STATUS.REVIEWING } : booking)));
      setBusinessBookings((items) => items.map((booking) => (booking.id === bookingId ? { ...booking, exceptionStatus: DISPUTE_STATUS.REVIEWING } : booking)));
    }, 900);
    return id;
  };

  const resolveSessionDispute = (id, outcome) => {
    const target = sessionDisputes.find((item) => item.id === id);
    if (!target) return false;
    const booking = bookings.find((item) => item.id === target.bookingId)
      || coachBookings.find((item) => item.id === target.bookingId)
      || businessBookings.find((item) => item.id === target.bookingId);
    const financialPatch = outcome === DISPUTE_OUTCOME.CLIENT_REFUNDED
      ? { paymentStatus: PAYMENT_STATUS.REFUNDED, refundStatus: "refunded", payoutStatus: PAYOUT_STATUS.NOT_READY }
      : { paymentStatus: PAYMENT_STATUS.RELEASED, payoutStatus: PAYOUT_STATUS.RELEASED };
    setSessionDisputes((items) => items.map((item) => (
      item.id === id
        ? { ...item, status: DISPUTE_STATUS.RESOLVED, outcome, updatedAt: "Just now" }
        : item
    )));
    setBookings((items) => items.map((item) => (item.id === target.bookingId ? { ...item, ...financialPatch, exceptionStatus: DISPUTE_STATUS.RESOLVED } : item)));
    setCoachBookings((items) => items.map((item) => (item.id === target.bookingId ? { ...item, ...financialPatch, exceptionStatus: DISPUTE_STATUS.RESOLVED } : item)));
    setBusinessBookings((items) => items.map((item) => (item.id === target.bookingId ? { ...item, ...financialPatch, exceptionStatus: DISPUTE_STATUS.RESOLVED } : item)));
    pushNotification({
      audience: "client", type: "dispute", title: "Case decision ready",
      body: outcome === DISPUTE_OUTCOME.CLIENT_REFUNDED
        ? `A refund was approved for ${booking?.service || "your session"}.`
        : `The case for ${booking?.service || "your session"} has been decided.`,
      bookingId: target.bookingId,
    });
    pushNotification({
      audience: "coach", type: "dispute", title: "Case decision ready",
      body: outcome === DISPUTE_OUTCOME.COACH_COMPENSATED
        ? `Compensation was approved for ${booking?.service || "your session"}.`
        : `The case for ${booking?.service || "your session"} has been decided.`,
      bookingId: target.bookingId,
    });
    return true;
  };

  const createAdditionalCharge = ({
    bookingId, reason, note, amount, evidence,
    phase = ADDITIONAL_CHARGE_PHASE.COMPLETION,
    kind = ADDITIONAL_CHARGE_KIND.REQUIRED,
  }) => {
    const coachBooking = coachBookings.find((booking) => booking.id === bookingId);
    const target = coachBooking || bookings.find((booking) => booking.id === bookingId) || businessBookings.find((booking) => booking.id === bookingId);
    if (!target) return null;
    const currentClientName = fullNameOf(clientIdentity).trim().toLowerCase();
    const requestClientName = String(target.clientName || "").trim().toLowerCase();
    // Coach and client views share an ID for live bookings. Some seeded coach
    // history predates that convention, so create the matching client record
    // when the request belongs to the signed-in client.
    if (coachBooking && !bookings.some((booking) => booking.id === bookingId) && requestClientName === currentClientName) {
      setBookings((items) => [{
        ...coachBooking,
        id: bookingId,
        coachId: COACHES[1].id,
        coachName: coachIdentity.name,
        reviewed: false,
        participants: coachBooking.participants || "You",
      }, ...items]);
    }
    const id = `charge-${Date.now()}`;
    setAdditionalCharges((items) => [{
      id, bookingId, reason, note, amount: Number(amount || 0), evidence,
      phase,
      kind,
      status: ADDITIONAL_CHARGE_STATUS.PENDING,
      createdAt: "Just now",
      dueAt: phase === ADDITIONAL_CHARGE_PHASE.COMPLETION
        ? "Pay before confirming completion"
        : kind === ADDITIONAL_CHARGE_KIND.OPTIONAL ? "Choose at checkout" : "Pay with your booking",
    }, ...items]);

    // Adding a completion charge is the coach's "finish" act: it ends the live
    // session and locks completion until the client's payment acts as their
    // acceptance. Funds release automatically once the charge is paid.
    if (phase === ADDITIONAL_CHARGE_PHASE.COMPLETION && [BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.CONFIRMED].includes(target.status)) {
      const endPatch = {
        status: BOOKING_STATUS.COMPLETION_PENDING,
        paymentStatus: PAYMENT_STATUS.HELD,
        payoutStatus: PAYOUT_STATUS.NOT_READY,
        sessionEndedAt: "Just now",
        completionConfirmations: ["coach"],
        completionConfirmedBy: "coach",
      };
      setBookings((items) => items.map((booking) => (booking.id === bookingId ? { ...booking, ...endPatch } : booking)));
      setCoachBookings((items) => items.map((booking) => (booking.id === bookingId ? { ...booking, ...endPatch } : booking)));
      setBusinessBookings((items) => items.map((booking) => (booking.id === bookingId ? { ...booking, ...endPatch } : booking)));
    }
    pushNotification({
      audience: "client", type: "payment",
      title: phase === ADDITIONAL_CHARGE_PHASE.COMPLETION ? "Final payment required" : "Booking cost updated",
      body: phase === ADDITIONAL_CHARGE_PHASE.COMPLETION
        ? `${target.coachName || coachIdentity.name} added a final $${Number(amount || 0).toFixed(2)} payment for ${reason.toLowerCase()}. Pay it before confirming completion.`
        : `${target.coachName || coachIdentity.name} added $${Number(amount || 0).toFixed(2)} for ${reason.toLowerCase()}.`,
      bookingId, chargeId: id,
    });
    return id;
  };

  const payAdditionalCharge = (id) => {
    const charge = additionalCharges.find((item) => item.id === id);
    if (!charge || charge.status !== ADDITIONAL_CHARGE_STATUS.PENDING) return false;
    if (charge.phase === ADDITIONAL_CHARGE_PHASE.ACCEPTANCE) return false;
    const target = bookings.find((booking) => booking.id === charge.bookingId)
      || coachBookings.find((booking) => booking.id === charge.bookingId)
      || businessBookings.find((booking) => booking.id === charge.bookingId);
    const finalChargeTotal = Number(target?.finalChargeTotal || 0) + Number(charge.amount || 0);
    const paidTotal = Number(target?.paidTotal || target?.price || 0) + Number(charge.amount || 0);
    setAdditionalCharges((items) => items.map((item) => (
      item.id === id ? { ...item, status: ADDITIONAL_CHARGE_STATUS.PAID, paidAt: "Just now" } : item
    )));
    const paymentPatch = { finalChargeTotal, paidTotal };
    setBookings((items) => items.map((booking) => (booking.id === charge.bookingId ? { ...booking, ...paymentPatch } : booking)));
    setCoachBookings((items) => items.map((booking) => (booking.id === charge.bookingId ? { ...booking, ...paymentPatch } : booking)));
    setBusinessBookings((items) => items.map((booking) => (booking.id === charge.bookingId ? { ...booking, ...paymentPatch } : booking)));
    pushNotification({ audience: target?.providerType === "business" ? "business" : "coach", businessId: target?.businessId, type: "payment", title: "Final payment received", body: `$${Number(charge.amount).toFixed(2)} has been paid and added to your payout.`, bookingId: charge.bookingId, chargeId: charge.id });
    pushNotification({ audience: "client", type: "payment", title: "Final payment complete", body: `$${Number(charge.amount).toFixed(2)} was paid securely. Your receipt is ready.`, bookingId: charge.bookingId, chargeId: charge.id });

    // Coach-driven completion: once the coach has ended the session and every
    // required final charge is paid, the client's payment doubles as their
    // acceptance — complete and release the funds.
    const remainingRequired = additionalCharges.some((item) => (
      item.id !== id
      && item.bookingId === charge.bookingId
      && item.phase === ADDITIONAL_CHARGE_PHASE.COMPLETION
      && item.kind === ADDITIONAL_CHARGE_KIND.REQUIRED
      && item.status === ADDITIONAL_CHARGE_STATUS.PENDING
    ));
    const coachEnded = target?.status === BOOKING_STATUS.COMPLETION_PENDING
      && (target.completionConfirmations || (target.completionConfirmedBy ? [target.completionConfirmedBy] : [])).includes("coach");
    if (!remainingRequired && coachEnded) {
      window.setTimeout(() => completeBookingAndRelease(charge.bookingId, "your final payment"), 1100);
    }
    return true;
  };

  const disputeAdditionalCharge = (id, details = {}) => {
    const charge = additionalCharges.find((item) => item.id === id);
    if (!charge || charge.status !== ADDITIONAL_CHARGE_STATUS.PENDING) return null;
    setAdditionalCharges((items) => items.map((item) => (
      item.id === id ? { ...item, status: ADDITIONAL_CHARGE_STATUS.DISPUTED } : item
    )));
    return createSessionDispute({
      bookingId: charge.bookingId,
      filedByRole: "client",
      category: "additional_charge",
      categoryLabel: "Question an additional charge",
      description: details.description || `I don’t recognise or agree with the additional ${charge.reason.toLowerCase()} charge.`,
      amountRequested: charge.amount,
      evidence: details.evidence || [charge.evidence].filter(Boolean),
      includeChat: true,
      chargeId: id,
    });
  };

  const cancelAdditionalCharge = (id) => {
    const charge = additionalCharges.find((item) => item.id === id);
    if (!charge || charge.status !== ADDITIONAL_CHARGE_STATUS.PENDING) return false;
    setAdditionalCharges((items) => items.map((item) => (
      item.id === id ? { ...item, status: ADDITIONAL_CHARGE_STATUS.CANCELLED } : item
    )));
    pushNotification({ audience: "client", type: "payment", title: "Payment request withdrawn", body: "The coach withdrew this additional payment request.", bookingId: charge.bookingId, chargeId: charge.id });
    return true;
  };

  // ---- Verification ----
  const submitVerification = ({ documents, worksWithMinors }) => {
    setVerificationStatus("pending");
    setVerificationQueue((q) => [
      {
        id: "v" + (q.length + 1),
        name: coachOnboarding.name || "New Coach",
        sport: (coachOnboarding.primarySports && coachOnboarding.primarySports[0]) || "Coaching",
        type: documents.map((d) => d.label).join(" + "),
        suburb: formatCoachLocation(coachOnboarding.location),
        experience: coachOnboarding.yearsExperience || "",
        documents,
        submittedByUser: true,
      },
      ...q,
    ]);
  };

  const decideVerification = (id, approve) => {
    const applicant = verificationQueue.find((v) => v.id === id);
    setVerificationQueue((q) => q.filter((v) => v.id !== id));
    if (applicant && applicant.submittedByUser) {
      setVerificationStatus(approve ? "approved" : "rejected");
      if (approve) setVerified(true);
      pushNotification({
        audience: "coach", type: "verification",
        title: approve ? "You're verified!" : "Verification rejected",
        body: approve ? "Your verification was approved. You can now accept bookings." : "One or more documents couldn't be confirmed - please resubmit.",
      });
    }
    toast(approve ? `${applicant ? applicant.name : "Coach"} approved` : `${applicant ? applicant.name : "Coach"} rejected`);
  };

  const simulateVerificationDecision = (approve) => {
    const applicant = [...verificationQueue].reverse().find((v) => v.submittedByUser);
    if (applicant) {
      decideVerification(applicant.id, approve);
    } else {
      setVerificationStatus(approve ? "approved" : "rejected");
      if (approve) setVerified(true);
      toast(approve ? "Verification approved" : "Verification rejected");
    }
  };

  const saveClientPaymentMethod = (method) => {
    const saved = { ...method, id: method.id || `cpm-${Date.now()}`, isDefault: true, addedAt: method.addedAt || "Just now" };
    setClientPaymentMethods((items) => [...items.map((item) => ({ ...item, isDefault: false })), saved]);
    return saved;
  };

  const resolveDispute = (id) => setDisputes((d) => d.filter((x) => x.id !== id));

  // ---- Coach packages ----
  const savePackage = (record) =>
    setCoachPackages((pkgs) => {
      const exists = pkgs.some((p) => p.id === record.id);
      return exists ? pkgs.map((p) => (p.id === record.id ? record : p)) : [...pkgs, record];
    });

  const removePackage = (id) => {
    setCoachPackages((pkgs) => pkgs.filter((p) => p.id !== id));
    setAvailabilityBlocks((blocks) => blocks.map((b) => ({ ...b, packageIds: b.packageIds.filter((pid) => pid !== id) })));
  };

  // ---- Media ----
  const addMedia = (item) => setCoachMedia((m) => [{ id: Date.now(), ...item }, ...m]);
  const removeMedia = (id) => setCoachMedia((m) => m.filter((x) => x.id !== id));

  // ======== Context value ========
  const value = {
    // Navigation
    nav, goBack, replaceNav, resetNav, goToHistory,
    screen, setScreen, params, setParams, history, setHistory, role, setRole,
    // UI
    toast, toastMsg, offline, darkMode, toggleDarkMode,
    // Client
    favorites, toggleFav, biometric, setBiometric, clientPrefs, onComplete: handleClientPrefs,
    children: childrenState, addChild, updateChild, removeChild,
    isFirstTimeClient, setIsFirstTimeClient, discoveryPrefs, setDiscoveryPrefs,
    showPostSignupGuide, setShowPostSignupGuide,
    clientIdentity, updateClientIdentity, isHandleTaken, coachIdentity,
    filters: clientFilters, onFiltersChange: setClientFilters,
    // Bookings
    bookings, setBookings, coachBookings, setCoachBookings,
    addBooking, cancelBooking, rescheduleBooking, markBookingPaid, respondBooking, acceptBookingWithCharges,
    sendPaymentReminder, expireAwaitingPayment, confirmSessionCompletion,
    generateSessionCode, verifySessionCode,
    sessionDisputes, createSessionDispute, resolveSessionDispute,
    additionalCharges, createAdditionalCharge, payAdditionalCharge,
    disputeAdditionalCharge, cancelAdditionalCharge,
    draft, setDraft, clientPaymentMethods, saveClientPaymentMethod,
    businessBookings, setBusinessBookings,
    // Coach
    verified, verificationStatus, reachedDashboardAfterVerification, setReachedDashboardAfterVerification,
    coachOnboarding, updateCoachOnboarding, coachProfile,
    coachPackages, savePackage, removePackage,
    coachMedia, addMedia, removeMedia,
    availabilityBlocks, setAvailabilityBlocks,
    coachAvailableNow, setCoachAvailableNow,
    addCoachRole: () => setHasCoachRole(true),
    // Verification & admin
    submitVerification, verificationQueue, decideVerification, simulateVerificationDecision, disputes, resolveDispute,
    // Notifications
    pushNotification, notifications, clientNotifications, coachNotifications,
    setClientNotifications, setCoachNotifications,
    // Location
    ...userLocationState,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
