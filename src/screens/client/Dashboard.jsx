import React, { useState, useMemo, useEffect } from "react";
import {
  WifiOff, Calendar, ClipboardList, Heart, Download, Clock, MessageCircle, Star, CheckCircle2,
  AlertTriangle, CreditCard, ShieldCheck, LifeBuoy, Hourglass, RefreshCcw, ChevronLeft, ChevronRight, CalendarX2, CalendarDays, CalendarClock,
  Banknote, Scale, BadgeDollarSign, PlayCircle, Building2,
} from "lucide-react";
import { CL, CD, fDisplay, fBody, T, LAYOUT } from "../../theme/theme";
import { useApp } from "../../context/AppContext";
import { useResponsive } from "../../theme/responsive";
import { COACHES } from "../../data/mockData";
import { CONFIG } from "../../config";
import {
  ADDITIONAL_CHARGE_KIND, ADDITIONAL_CHARGE_PHASE, ADDITIONAL_CHARGE_STATUS,
  BOOKING_STATUS, PAYMENT_STATUS,
} from "../../data/bookings";
import {
  Avatar, BottomActionBar, Card, Badge, SegTabs, ViewModeToggle, ScreenHeader, SectionLabel, Btn, TopBar, EmptyState, StatusPill, Chip, BottomSheet, Row, ScrollFadeRow, HandleTag, BookingCardSkeleton,
} from "../../components/ui/Primitives";
import { StatusBanner } from "../../systems/StateSystem";
import { getBookingCoachName } from "../../utils/name";
import { PaymentDeadlineCard, SessionJourneyTimeline } from "../../components/booking/SessionJourneyTimeline";
import { SportBadge } from "../../components/ui/SportUI";

/** Resolved name for a booking's coach — public name until the booking is
    confirmed, full name afterwards (partner reveal). */
function coachNameFor(booking) {
  const coach = booking ? COACHES.find((c) => c.id === booking.coachId) : null;
  return getBookingCoachName(booking, coach);
}

/* ---- date helpers for the calendar view (booking dates look like "Tue, 22 Jul") ---- */
const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function parseBookingDate(str, year = 2026) {
  const m = /(\d{1,2})\s+([A-Za-z]{3})/.exec(str || "");
  if (!m) return null;
  const month = MONTH_ABBR.indexOf(m[2]);
  if (month < 0) return null;
  return new Date(year, month, parseInt(m[1], 10));
}
function sameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function addDays(d, n) { const r = new Date(d); r.setDate(d.getDate() + n); return r; }
function startOfWeek(d) { const dow = (d.getDay() + 6) % 7; return addDays(d, -dow); } // Monday-start
function parseTimeSlotHour(timeStr) {
  if (!timeStr) return null;
  const match = timeStr.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) return null;
  let hour = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const period = match[3]?.toLowerCase();
  if (period === "pm" && hour < 12) hour += 12;
  if (period === "am" && hour === 12) hour = 0;
  return { hour, minutes, totalMinutes: hour * 60 + minutes };
}

function formatHourLabel(hour) {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  const ampm = hour < 12 ? "AM" : "PM";
  return `${h} ${ampm}`;
}

function buildMonthGrid(cursor) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const gridStart = startOfWeek(first);
  const weeks = [];
  let cur = gridStart;
  for (let w = 0; w < 6; w++) {
    const row = [];
    for (let i = 0; i < 7; i++) { row.push(cur); cur = addDays(cur, 1); }
    weeks.push(row);
  }
  return weeks;
}

/* ---- cancellation policy math (used by the Cancellation Summary sheet below) ----
   CoachNivo uses one platform-wide cancellation policy for every coach: free
   cancellation up to 24h before the session, 50% refund inside 24h. We compare
   against how many hours remain until the session to pick the refund rule. */
function bookingDateTime(dateStr, timeStr) {
  const d = parseBookingDate(dateStr);
  if (!d) return null;
  const m = /(\d{1,2}):(\d{2})\s*([ap]m)/i.exec(timeStr || "");
  if (!m) return d;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ap = m[3].toLowerCase();
  if (ap === "pm" && h !== 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  const dt = new Date(d);
  dt.setHours(h, min, 0, 0);
  return dt;
}

function getCancellationOutcome(booking, coach) {
  const sessionAt = bookingDateTime(booking.date, booking.time);
  const hoursUntil = sessionAt ? (sessionAt.getTime() - Date.now()) / 36e5 : null;

  let refundPct = 1;
  let ruleLabel;
  if (hoursUntil == null || hoursUntil >= 24) {
    refundPct = 1;
    ruleLabel = "Cancelled 24h+ before the session - fully refundable under CoachNivo's cancellation policy.";
  } else {
    refundPct = 0.5;
    ruleLabel = "Cancelled inside 24h - CoachNivo's cancellation policy refunds 50% of the session fee.";
  }
  return { refundPct, ruleLabel, hoursUntil, tier: "standard" };
}

export function ScreenClientDashboard({ nav, bookings = [], additionalCharges = [], offline, toast, cancelBooking, isFirstTimeClient }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const { isDesktop } = useResponsive();
  const [tab, setTab] = useState("pending");
  const [view, setView] = useState("list");
  const [loading, setLoading] = useState(true);
  const [calMode, setCalMode] = useState("month");
  const safeBookings = Array.isArray(bookings) ? bookings : [];
  // When there are no booked sessions yet, show a single, unified
  // empty state pointing clients at Discover, instead of the tabbed/calendar UI.
  const showEmptyDashboard = safeBookings.length === 0;
  const [cancelTarget, setCancelTarget] = useState(null);

  useEffect(() => { const t = setTimeout(() => setLoading(false), 800); return () => clearTimeout(t); }, []);

  const pendingChargeBookingIds = new Set(
    additionalCharges
      .filter((charge) => charge.status === ADDITIONAL_CHARGE_STATUS.PENDING)
      .map((charge) => charge.bookingId),
  );
  const pendingPriority = (booking) => {
    if (booking.status === BOOKING_STATUS.AWAITING_PAYMENT && booking.paymentStatus === PAYMENT_STATUS.DUE) return 0;
    if (pendingChargeBookingIds.has(booking.id)) return 1;
    return 2;
  };
  const upcoming = safeBookings.filter((b) => (
    [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.COMPLETION_PENDING].includes(b?.status)
    && !pendingChargeBookingIds.has(b.id)
  ));
  const pending = safeBookings
    .filter((b) => (
      [BOOKING_STATUS.PENDING, BOOKING_STATUS.AWAITING_PAYMENT].includes(b?.status)
      || pendingChargeBookingIds.has(b.id)
    ))
    .sort((a, b) => pendingPriority(a) - pendingPriority(b));
  const past = safeBookings.filter((b) => [
    BOOKING_STATUS.COMPLETED,
    BOOKING_STATUS.CANCELLED,
    BOOKING_STATUS.DECLINED,
    BOOKING_STATUS.EXPIRED,
  ].includes(b?.status) && !pendingChargeBookingIds.has(b.id));

  const dated = useMemo(() => safeBookings.map((b) => ({ ...b, _date: parseBookingDate(b.date) })), [safeBookings]);
  const initialDate = useMemo(() => (dated.find((b) => b._date)?._date) || new Date(), [dated]);
  const [cursor, setCursor] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const bookingsOnDate = (d) => dated.filter((b) => b._date && sameDay(b._date, d));

  const isToday = (d) => sameDay(d, new Date());
  const goToday = () => {
    const now = new Date();
    setCursor(now);
    setSelectedDate(now);
  };
  const monthWeeks = useMemo(() => buildMonthGrid(cursor), [cursor]);
  const weekRow = useMemo(() => {
    const start = startOfWeek(selectedDate || cursor);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selectedDate, cursor]);
  const displayWeeks = calMode === "month" ? monthWeeks : [weekRow];

  const currentMonthBookings = useMemo(() => {
    return dated.filter(
      (b) => b._date && b._date.getFullYear() === cursor.getFullYear() && b._date.getMonth() === cursor.getMonth()
    );
  }, [dated, cursor]);

const currentRangeBookings = useMemo(() => {
    if (calMode === "month") return currentMonthBookings;
    return dated.filter((b) => b._date && weekRow.some((d) => sameDay(d, b._date)));
  }, [calMode, currentMonthBookings, dated, weekRow]);

  const weekSlotRange = useMemo(() => {
    let minHour = 6;
    let maxHour = 20;
    currentRangeBookings.forEach((b) => {
      const parsed = parseTimeSlotHour(b.time);
      if (parsed) {
        if (parsed.hour < minHour) minHour = Math.max(0, parsed.hour);
        if (parsed.hour > maxHour) maxHour = Math.min(23, parsed.hour);
      }
    });
    const slots = [];
    for (let h = minHour; h <= maxHour; h++) {
      slots.push(h);
    }
    return slots;
  }, [currentRangeBookings]);

  const nextUpcomingBooking = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingList = dated
      .filter(
        (b) =>
          b._date &&
          b._date >= today &&
          [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.COMPLETION_PENDING, BOOKING_STATUS.PENDING, BOOKING_STATUS.AWAITING_PAYMENT].includes(b.status)
      )
      .sort((a, b) => a._date - b._date);
    return upcomingList[0] || null;
  }, [dated]);

  const headerLabel = calMode === "month"
    ? cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : `${weekRow[0].toLocaleDateString(undefined, { day: "numeric", month: "short" })} – ${weekRow[6].toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`;

  const goPrev = () => {
    if (calMode === "month") {
      setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1));
    } else {
      setCursor((c) => addDays(c, -7));
      setSelectedDate((d) => addDays(d, -7));
    }
  };
  const goNext = () => {
    if (calMode === "month") {
      setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1));
    } else {
      setCursor((c) => addDays(c, 7));
      setSelectedDate((d) => addDays(d, 7));
    }
  };

  const handleCancel = (id) => {
    cancelBooking(id);
    toast(cancelTarget?.status === "pending" ? "Booking request withdrawn" : "Session cancelled");
    setCancelTarget(null);
  };

  const renderCard = (b, i) => {
    const pendingAdditionalCharge = additionalCharges.find((charge) => (
      charge.bookingId === b.id
      && charge.phase === ADDITIONAL_CHARGE_PHASE.COMPLETION
      && charge.status === ADDITIONAL_CHARGE_STATUS.PENDING
    ));
    return (
      <BookingCard
        key={b.id}
        b={b}
        nav={nav}
        past={[BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CANCELLED, BOOKING_STATUS.DECLINED, BOOKING_STATUS.EXPIRED].includes(b.status)}
        additionalCharge={pendingAdditionalCharge}
        onAdditionalCharge={() => nav("additional-charge-review", { chargeId: pendingAdditionalCharge?.id, role: "client", backTo: "client-dashboard" })}
        onCancel={() => b.providerType === "business" ? nav("client-booking-detail", { id: b.id }) : setCancelTarget(b)}
        onPay={() => b.providerType === "business" ? nav("client-booking-detail", { id: b.id }) : nav("payment", { bookingId: b.id })}
        style={{ animationDelay: `${Math.min(i || 0, 8) * 45}ms` }}
      />
    );
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", position: "relative" }}>
      <div style={{ padding: isDesktop ? "32px 64px 0" : "18px 18px 0", width: "100%", boxSizing: "border-box" }}>
        <ScreenHeader
          title="My sessions"
          subtitle="Requests, upcoming sessions and history."
          action={!showEmptyDashboard && <ViewModeToggle value={view} onChange={setView} ariaLabel="Session view" />}
        />
        {!showEmptyDashboard && <DashboardStats pendingCount={pending.length} upcomingCount={upcoming.length} pastCount={past.length} C={C} />}
        {offline && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: darkMode ? C.white : C.jet, color: darkMode ? C.jet : C.white, border: `1px solid ${C.border}`, padding: "9px 12px", borderRadius: 12, marginTop: 12, fontSize: T.label, ...fBody }}>
            <WifiOff size={14} color={C.brand} /> You're offline - showing your last saved sessions.
          </div>
        )}
        
        {!showEmptyDashboard && view === "list" && (
          <div style={{ marginTop: 24 }}>
            <SegTabs strong value={tab} onChange={setTab} items={[
              { value: "pending", label: "Requests" }, { value: "upcoming", label: "Upcoming" }, { value: "past", label: "Completed" },
            ]} />
          </div>
        )}

      </div>

      <div style={{ flex: 1, overflowY: "auto", width: "100%", padding: isDesktop ? (view === "calendar" ? "32px 64px 48px" : "24px 64px 64px") : (view === "calendar" ? "14px 18px" : "24px 18px"), paddingBottom: 116, boxSizing: "border-box" }} className="cl-hide-scrollbar">
        {showEmptyDashboard && (
          <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <EmptyState
              large
              icon={Calendar}
              title="Your Bookings Will Appear Here"
              body="You haven't booked a coaching session yet. Find a coach that matches your sport, goals, and location to get started."
              ctaLabel="Find My Coaches"
              onCta={() => nav("client-home")}
            />
          </div>
        )}

        {!showEmptyDashboard && view === "list" && (
          <>
            {loading ? (
              <BookingCardSkeleton rows={4} />
            ) : (
              <>
                {tab === "pending" && (pending.length
                  ? (isDesktop ? <BookingTable items={pending} nav={nav} additionalCharges={additionalCharges} C={C} /> : <div className="cl-stagger">{pending.map(renderCard)}</div>)
                  : <EmptyState icon={Hourglass} title="No active requests" body="Requests awaiting a coach or your payment will show up here." />)}
                {tab === "upcoming" && (upcoming.length
                  ? (isDesktop ? <BookingTable items={upcoming} nav={nav} additionalCharges={additionalCharges} C={C} /> : <div className="cl-stagger">{upcoming.map(renderCard)}</div>)
                  : <EmptyState icon={Calendar} title="No upcoming sessions" body="Search for a coach to book your next session." />)}
                {tab === "past" && (past.length
                  ? (isDesktop ? <BookingTable items={past} nav={nav} additionalCharges={additionalCharges} C={C} /> : <div className="cl-stagger">{past.map(renderCard)}</div>)
                  : <EmptyState icon={ClipboardList} title="No booking history yet" body="Completed, cancelled, declined and expired bookings will show up here." />)}
              </>
            )}
          </>
        )}
        {!showEmptyDashboard && view === "calendar" && (
          <div
            style={{
              display: isDesktop ? "grid" : "block",
              gridTemplateColumns: isDesktop ? "minmax(0, 1.65fr) minmax(360px, 1fr)" : undefined,
              gap: isDesktop ? 28 : 20,
              alignItems: "start",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            {/* Left Column: Interactive Month Calendar with In-Cell Session Details */}
            <div style={{ width: "100%", margin: isDesktop ? "0" : "0 auto 20px" }}>
              <Card
                style={{
                  padding: isDesktop ? "20px 20px 18px" : "16px 14px",
                  borderRadius: 20,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                  background: C.white,
                  border: `1px solid ${C.border}`,
                }}
              >
                {/* Month Header & Controls */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 16,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      type="button"
                      aria-label="Previous month"
                      onClick={goPrev}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 9,
                        background: darkMode ? "transparent" : C.fog,
                        border: darkMode ? `1px solid ${C.border}` : "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "background 0.15s ease",
                      }}
                    >
                      <ChevronLeft size={16} color={C.jet} />
                    </button>
                    <span style={{ fontSize: isDesktop ? 17.5 : 16, fontWeight: 700, color: C.jet, ...fDisplay }}>
                      {headerLabel}
                    </span>
                    <button
                      type="button"
                      aria-label="Next month"
                      onClick={goNext}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 9,
                        background: darkMode ? "transparent" : C.fog,
                        border: darkMode ? `1px solid ${C.border}` : "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "background 0.15s ease",
                      }}
                    >
                      <ChevronRight size={16} color={C.jet} />
                    </button>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      type="button"
                      onClick={goToday}
                      style={{
                        padding: "5px 11px",
                        borderRadius: 8,
                        border: `1px solid ${C.border}`,
                        background: C.white,
                        fontSize: 12,
                        fontWeight: 700,
                        color: C.jet,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        ...fBody,
                      }}
                    >
                      Today
                    </button>
                    <div style={{ minWidth: 140 }}>
                      <SegTabs
                        value={calMode}
                        onChange={setCalMode}
                        items={[
                          { value: "month", label: "Month" },
                          { value: "week", label: "Week" },
                        ]}
                      />
                    </div>
                    
                  </div>
                </div>

                {calMode === "month" ? (
                  <>
                    {/* Weekday Strip */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: isDesktop ? 6 : 3, marginBottom: 8 }}>
                      {WEEKDAY_HEADERS.map((d) => (
                        <div
                          key={d}
                          style={{
                            textAlign: "center",
                            fontSize: 11,
                            fontWeight: 700,
                            color: C.slateLight,
                            padding: "4px 0",
                            textTransform: "uppercase",
                            letterSpacing: 0.4,
                            ...fBody,
                          }}
                        >
                          {d.slice(0, 3)}
                        </div>
                      ))}
                    </div>

                    {/* Day Cells Grid */}
                    <div style={{ display: "flex", flexDirection: "column", gap: isDesktop ? 6 : 4 }}>
                      {monthWeeks.map((row, ri) => (
                        <div key={ri} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: isDesktop ? 6 : 4 }}>
                          {row.map((d, di) => {
                            const inRange = d.getMonth() === cursor.getMonth();
                            const dayBookings = bookingsOnDate(d);
                            const count = dayBookings.length;
                            const isSelected = sameDay(d, selectedDate);
                            const isCurToday = isToday(d);

                            return (
                              <div
                                key={di}
                                onClick={() => setSelectedDate(d)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === "Enter" && setSelectedDate(d)}
                                aria-label={`${d.toDateString()}${count > 0 ? `, ${count} bookings` : ""}`}
                                style={{
                                  minHeight: isDesktop ? 88 : 44,
                                  width: "100%",
                                  borderRadius: 12,
                                  cursor: "pointer",
                                  border: isSelected
                                    ? `2px solid ${C.brand}`
                                    : isCurToday
                                    ? `1.5px solid ${C.brand}60`
                                    : `1px solid ${C.border}`,
                                  background: isSelected
                                    ? (darkMode ? "rgba(241,90,41,0.18)" : "#FFF7F4")
                                    : inRange
                                    ? C.white
                                    : C.fog,
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "flex-start",
                                  justifyContent: "flex-start",
                                  position: "relative",
                                  padding: isDesktop ? "6px 6px 5px" : "4px 2px",
                                  opacity: inRange ? 1 : 0.42,
                                  boxShadow: isSelected ? "0 4px 14px rgba(241, 90, 41, 0.14)" : "none",
                                  transition: "all 0.15s ease",
                                  textAlign: "left",
                                  boxSizing: "border-box",
                                  overflow: "hidden",
                                }}
                              >
                                {/* Day Header Row inside Cell */}
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    width: "100%",
                                    marginBottom: isDesktop && count > 0 ? 4 : 0,
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: 12,
                                      fontWeight: isSelected || isCurToday ? 800 : 600,
                                      width: 22,
                                      height: 22,
                                      borderRadius: 99,
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      background: isCurToday
                                        ? C.brand
                                        : "transparent",
                                      color: isCurToday
                                        ? C.white
                                        : isSelected
                                        ? C.brand
                                        : inRange
                                        ? C.jet
                                        : C.slateLight,
                                      lineHeight: 1,
                                      ...fDisplay,
                                    }}
                                  >
                                    {d.getDate()}
                                  </span>

                                  {/* Mobile dot indicator */}
                                  {!isDesktop && count > 0 && (
                                    <span
                                      style={{
                                        width: 5,
                                        height: 5,
                                        borderRadius: 99,
                                        background: isSelected ? C.brand : C.brand,
                                        marginRight: 2,
                                      }}
                                    />
                                  )}
                                </div>

                                {/* In-Cell Session Details (Desktop view) */}
                                {isDesktop && count > 0 && (
                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: 3,
                                      width: "100%",
                                      marginTop: 2,
                                    }}
                                  >
                                    {dayBookings.slice(0, 2).map((b) => {
                                      const cn = coachNameFor(b);
                                      return (
                                        <div
                                          key={b.id}
                                          title={`${b.time} · ${b.service} (${cn.name || b.coachName || "Coach"})`}
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 3.5,
                                            width: "100%",
                                            padding: "2.5px 5px",
                                            borderRadius: 5,
                                            background: isSelected
                                              ? (darkMode ? "rgba(241,90,41,0.28)" : "#FFE8DF")
                                              : C.brandTint,
                                            borderLeft: `2.5px solid ${C.brand}`,
                                            fontSize: 10,
                                            lineHeight: 1.25,
                                            overflow: "hidden",
                                            boxSizing: "border-box",
                                            ...fBody,
                                          }}
                                        >
                                          <span
                                            style={{
                                              fontWeight: 700,
                                              color: C.brand,
                                              fontSize: 9.5,
                                              flexShrink: 0,
                                              lineHeight: 1,
                                            }}
                                          >
                                            {b.time?.replace(":00", "").split(" ")[0]}
                                          </span>
                                          <span
                                            style={{
                                              fontWeight: 650,
                                              color: C.jet,
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                              whiteSpace: "nowrap",
                                              flex: 1,
                                              minWidth: 0,
                                              lineHeight: 1.15,
                                            }}
                                          >
                                            {b.service || "Session"}
                                          </span>
                                        </div>
                                      );
                                    })}

                                    {count > 2 && (
                                      <div
                                        style={{
                                          fontSize: 9.5,
                                          fontWeight: 700,
                                          color: C.brand,
                                          paddingLeft: 3,
                                          marginTop: 1,
                                          lineHeight: 1,
                                          ...fBody,
                                        }}
                                      >
                                        +{count - 2} more
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  /* Weekly Calendar with Time Slots (Expands vertically) */
                  <div style={{ width: "100%", overflowX: isDesktop ? "visible" : "auto" }}>
                    <div style={{ minWidth: isDesktop ? "auto" : 580 }}>
                      {/* Week Header Row */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "52px repeat(7, minmax(0, 1fr))",
                          gap: 0,
                          borderBottom: `1.5px solid ${C.border}`,
                          paddingBottom: 8,
                          marginBottom: 4,
                          position: "sticky",
                          top: 0,
                          background: C.white,
                          zIndex: 2,
                        }}
                      >
                        <div style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: C.slateLight, textTransform: "uppercase", alignSelf: "center", ...fBody }}>
                          Time
                        </div>
                        {weekRow.map((d, di) => {
                          const isSelected = sameDay(d, selectedDate);
                          const isCurToday = isToday(d);
                          const dayBookings = bookingsOnDate(d);
                          return (
                            <div
                              key={di}
                              onClick={() => setSelectedDate(d)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => e.key === "Enter" && setSelectedDate(d)}
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "6px 4px",
                                borderRadius: 10,
                                cursor: "pointer",
                                background: isSelected ? (darkMode ? "rgba(241,90,41,0.14)" : "#FFF7F4") : "transparent",
                                transition: "background 0.15s ease",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: isSelected ? C.brand : C.slateLight,
                                  textTransform: "uppercase",
                                  letterSpacing: 0.3,
                                  marginBottom: 3,
                                  ...fBody,
                                }}
                              >
                                {WEEKDAY_HEADERS[(d.getDay() + 6) % 7].slice(0, 3)}
                              </span>
                              <span
                                style={{
                                  fontSize: 13,
                                  fontWeight: isSelected || isCurToday ? 800 : 600,
                                  width: 26,
                                  height: 26,
                                  borderRadius: 99,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  background: isSelected ? C.brand : isCurToday ? (darkMode ? "rgba(241,90,41,0.22)" : "#FFF1EB") : "transparent",
                                  color: isSelected ? C.white : isCurToday ? C.brand : C.jet,
                                  border: isCurToday && !isSelected ? `1.5px solid ${C.brand}` : "none",
                                  ...fDisplay,
                                }}
                              >
                                {d.getDate()}
                              </span>
                              {dayBookings.length > 0 && (
                                <span
                                  style={{
                                    marginTop: 3,
                                    fontSize: 9.5,
                                    fontWeight: 700,
                                    color: isSelected ? C.brand : C.slate,
                                    ...fBody,
                                  }}
                                >
                                  {dayBookings.length} {dayBookings.length === 1 ? "session" : "sessions"}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Time Slots Grid Container (Expands vertically with scrollable overflow) */}
                      <div
                        style={{
                          maxHeight: isDesktop ? 600 : 460,
                          overflowY: "auto",
                          paddingRight: 2,
                        }}
                        className="cl-hide-scrollbar"
                      >
                        {weekSlotRange.map((hour) => {
                          const hourLabel = formatHourLabel(hour);
                          return (
                            <div
                              key={hour}
                              style={{
                                display: "grid",
                                gridTemplateColumns: "52px repeat(7, minmax(0, 1fr))",
                                minHeight: 56,
                                borderTop: `1px solid ${darkMode ? "rgba(255,255,255,0.06)" : "#F0F0F2"}`,
                              }}
                            >
                              {/* Hour Gutter Label */}
                              <div
                                style={{
                                  fontSize: 10.5,
                                  fontWeight: 600,
                                  color: C.slateLight,
                                  textAlign: "right",
                                  paddingRight: 10,
                                  paddingTop: 4,
                                  userSelect: "none",
                                  ...fBody,
                                }}
                              >
                                {hourLabel}
                              </div>

                              {/* 7 Day Slot Cells */}
                              {weekRow.map((d, di) => {
                                const isSelected = sameDay(d, selectedDate);
                                const dayBookings = bookingsOnDate(d);
                                const slotBookings = dayBookings.filter((b) => {
                                  const parsed = parseTimeSlotHour(b.time);
                                  return parsed && parsed.hour === hour;
                                });

                                return (
                                  <div
                                    key={di}
                                    onClick={() => setSelectedDate(d)}
                                    role="button"
                                    tabIndex={0}
                                    style={{
                                      borderLeft: `1px solid ${darkMode ? "rgba(255,255,255,0.06)" : "#F0F0F2"}`,
                                      background: isSelected
                                        ? (darkMode ? "rgba(241,90,41,0.04)" : "rgba(241,90,41,0.02)")
                                        : "transparent",
                                      padding: 3,
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: 3,
                                      cursor: "pointer",
                                      position: "relative",
                                      transition: "background 0.12s ease",
                                      boxSizing: "border-box",
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!isSelected) e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.02)" : "#FAFAFC";
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!isSelected) e.currentTarget.style.background = "transparent";
                                    }}
                                  >
                                    {slotBookings.map((b) => {
                                      const cn = coachNameFor(b);
                                      const isPending = [BOOKING_STATUS.PENDING, BOOKING_STATUS.AWAITING_PAYMENT].includes(b.status);
                                      const isConfirmed = [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.COMPLETION_PENDING].includes(b.status);

                                      const toneBg = isConfirmed
                                        ? (darkMode ? "rgba(241,90,41,0.24)" : "#FFF1EB")
                                        : isPending
                                        ? (darkMode ? "rgba(245,158,11,0.22)" : "#FEF3C7")
                                        : (darkMode ? "rgba(16,185,129,0.18)" : "#ECFDF5");

                                      const toneBorder = isConfirmed
                                        ? C.brand
                                        : isPending
                                        ? (C.warning || "#F59E0B")
                                        : (C.success || "#10B981");

                                      const toneText = isConfirmed
                                        ? C.brand
                                        : isPending
                                        ? "#B45309"
                                        : "#047857";

                                      const coachDisplayName = cn.name || b.coachName || "Coach";

                                      return (
                                        <div
                                          key={b.id}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedDate(d);
                                            nav("client-booking-detail", { id: b.id });
                                          }}
                                          title={`${b.time} · ${b.service} (${coachDisplayName}) - ${b.status}`}
                                          style={{
                                            borderRadius: 6,
                                            padding: "3px 5px",
                                            background: toneBg,
                                            borderLeft: `3px solid ${toneBorder}`,
                                            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                                            cursor: "pointer",
                                            overflow: "hidden",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 1.5,
                                            transition: "transform 0.12s ease, box-shadow 0.12s ease",
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = "scale(1.02)";
                                            e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.12)";
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = "none";
                                            e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)";
                                          }}
                                        >
                                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                                            <span style={{ fontSize: 9, fontWeight: 700, color: toneText, lineHeight: 1, ...fDisplay }}>
                                              {b.time}
                                            </span>
                                            <span
                                              style={{
                                                width: 5,
                                                height: 5,
                                                borderRadius: 99,
                                                background: toneBorder,
                                                flexShrink: 0,
                                              }}
                                            />
                                          </div>
                                          <div
                                            style={{
                                              fontSize: 9.5,
                                              fontWeight: 700,
                                              color: C.jet,
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                              whiteSpace: "nowrap",
                                              lineHeight: 1.2,
                                              ...fBody,
                                            }}
                                          >
                                            {b.service}
                                          </div>
                                          <div
                                            style={{
                                              fontSize: 8.5,
                                              fontWeight: 500,
                                              color: C.slate,
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                              whiteSpace: "nowrap",
                                              lineHeight: 1.1,
                                              ...fBody,
                                            }}
                                          >
                                            {coachDisplayName}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Calendar Legend */}
                <div
                  style={{
                    marginTop: 14,
                    paddingTop: 12,
                    borderTop: `1px solid ${C.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 10,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: C.slate, ...fBody }}>
                      <span style={{ width: 12, height: 12, borderRadius: 3, background: C.brandTint, borderLeft: `2.5px solid ${C.brand}` }} />
                      Coaching session
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: C.slate, ...fBody }}>
                      <span style={{ width: 8, height: 8, borderRadius: 99, background: C.brand }} />
                      Today
                    </span>
                  </div>
                  <span style={{ fontSize: 11.5, color: C.slateLight, ...fBody }}>
                    Click a day to view sessions
                  </span>
                </div>
              </Card>

              {/* Next Upcoming Session Quick Link (Sticky under calendar) */}
              {nextUpcomingBooking && !sameDay(nextUpcomingBooking._date, selectedDate) && (
                <Card
                  onClick={() => {
                    setSelectedDate(nextUpcomingBooking._date);
                    setCursor(nextUpcomingBooking._date);
                  }}
                  style={{
                    marginTop: 14,
                    padding: 13,
                    borderRadius: 16,
                    cursor: "pointer",
                    background: C.fog,
                    border: `1px solid ${C.border}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    transition: "all 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: C.brandTint,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <CalendarClock size={17} color={C.brand} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: C.brand, textTransform: "uppercase", letterSpacing: 0.4, ...fBody }}>
                      Next Upcoming Session
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.jet, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", ...fDisplay }}>
                      {nextUpcomingBooking.date} · {nextUpcomingBooking.time} with {coachNameFor(nextUpcomingBooking)?.name || "Coach"}
                    </div>
                  </div>
                  <ChevronRight size={16} color={C.slateLight} />
                </Card>
              )}
            </div>

            {/* Right Column: Sessions Scheduled for Selected Day */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Header Bar: Selected Date Title & Session Count */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <h3 style={{ fontSize: isDesktop ? 18 : 16, fontWeight: 700, color: C.jet, margin: 0, ...fDisplay }}>
                      {selectedDate.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
                    </h3>
                    <Badge tone={bookingsOnDate(selectedDate).length > 0  ? "orange" : "neutral"}>
                      {bookingsOnDate(selectedDate).length} {bookingsOnDate(selectedDate).length === 1 ? "session" : "sessions"}
                    </Badge>
                  </div>
                  {isToday(selectedDate) && (
                    <div style={{ fontSize: 12, fontWeight: 650, color: C.brand, marginTop: 2, ...fBody }}>
                      Today's Schedule
                    </div>
                  )}
                </div>

                {!isToday(selectedDate) && (
                  <button
                    type="button"
                    onClick={goToday}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                      background: C.white,
                      fontSize: 12,
                      fontWeight: 650,
                      color: C.slate,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      ...fBody,
                    }}
                  >
                    View Today
                  </button>
                )}
              </div>

              {/* Sessions List Content */}
              {bookingsOnDate(selectedDate).length === 0 ? (
                <Card style={{ padding: isDesktop ? 36 : 24, textAlign: "center", borderRadius: 20 }}>
                  <EmptyState
                    icon={CalendarX2}
                    title="No sessions scheduled"
                    body={`You don't have any sessions on ${selectedDate.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}.`}
                  />
                  {nextUpcomingBooking && !sameDay(nextUpcomingBooking._date, selectedDate) && (
                    <div style={{ marginTop: 16 }}>
                      <Btn
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setSelectedDate(nextUpcomingBooking._date);
                          setCursor(nextUpcomingBooking._date);
                        }}
                        style={{ margin: "0 auto", borderRadius: 12 }}
                      >
                        Jump to next session ({nextUpcomingBooking.date})
                      </Btn>
                    </div>
                  )}
                </Card>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }} className="cl-stagger">
                  {bookingsOnDate(selectedDate).map(renderCard)}
                </div>
              )}

              </div>
          </div>
        )}
      </div>

      <CancelSheet
        booking={cancelTarget}
        pending={cancelTarget?.status === "pending"}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
      />
    </div>
  );
}

/* Reschedule — lets the client pick a new day/time from the coach's live availability */
function RescheduleSheet({ booking, onClose, onConfirm }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const coach = booking ? COACHES.find((c) => c.id === booking.coachId) : null;
  const days = coach ? Object.keys(coach.availability) : [];
  const [day, setDay] = useState(null);
  const [time, setTime] = useState(null);
  const [confirming, setConfirming] = useState(false);

  // Reset picker state whenever a new booking is opened
  React.useEffect(() => {
    if (booking) { setDay(days[0] || null); setTime(null); setConfirming(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking?.id]);

  const confirmReschedule = () => {
    setConfirming(true);
    // Simulates re-checking the coach's live calendar before locking in the new time.
    setTimeout(() => { setConfirming(false); onConfirm(booking.id, { date: day, time }); }, 700);
  };

  return (
    <BottomSheet open={!!booking} onClose={onClose} title="Reschedule session" heightPct={78}>
      {booking && (
        <>
          <Card style={{ marginBottom: 16, display: "flex", gap: 12, alignItems: "center" }}>
            <Avatar name={coachNameFor(booking).name} size={40} />
            <div>
              <div style={{ fontSize: T.bodyLg, fontWeight: 600, color: C.jet, ...fDisplay }}>{booking.service}</div>
              <div style={{ fontSize: T.label, color: C.slate, ...fBody }}>Currently {booking.date} · {booking.time}</div>
            </div>
          </Card>

          {coach ? (
            <>
              <SectionLabel>New day</SectionLabel>
              <ScrollFadeRow style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 18, paddingBottom: 4 }}>
                {days.map((d) => (
                  <Chip key={d} active={day === d} onClick={() => { setDay(d); setTime(null); }}>{d}</Chip>
                ))}
              </ScrollFadeRow>

              <SectionLabel>New time</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
                {(coach.availability[day] || []).map((t) => (
                  <button key={t} onClick={() => setTime(t)} style={{
                    padding: "12px 0", borderRadius: 12, border: `1.5px solid ${time === t ? C.brand : C.border}`,
                    background: time === t ? C.brandTint : C.white, color: time === t ? C.brand : C.jet,
                    fontWeight: 600, fontSize: T.bodyLg, cursor: "pointer", ...fBody,
                  }}>{t}</button>
                ))}
              </div>

              <Btn full disabled={!day || !time} loading={confirming} loadingText="Confirming…" onClick={confirmReschedule}>
                Confirm new time
              </Btn>
            </>
          ) : (
            <div style={{ fontSize: T.body, color: C.slate, lineHeight: 1.6, ...fBody, marginBottom: 16 }}>
              This coach's live availability isn't accessible right now. Message them directly to arrange a new time.
            </div>
          )}
        </>
      )}
    </BottomSheet>
  );
}

/* Cancel — for a confirmed session this now presents a full Cancellation Summary
   (policy-based refund math, payment breakdown, resulting status, explicit
   confirmation) before anything is cancelled. A still-pending request never had
   payment collected, so it keeps the lighter "withdraw" confirmation instead. */
function CancelSheet({ booking, onClose, onConfirm, pending }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const coach = booking ? COACHES.find((c) => c.id === booking.coachId) : null;
  const [understood, setUnderstood] = useState(false);
  useEffect(() => { if (booking) setUnderstood(false); }, [booking?.id]);

  if (pending) {
    return (
      <BottomSheet open={!!booking} onClose={onClose} title="Withdraw this request?" heightPct={58}>
        {booking && (
          <>
            <Card style={{ marginBottom: 14, display: "flex", gap: 12, alignItems: "center" }}>
              <Avatar name={coachNameFor(booking).name} size={40} />
              <div>
                <div style={{ fontSize: T.bodyLg, fontWeight: 600, color: C.jet, ...fDisplay }}>{booking.service}</div>
                <div style={{ fontSize: T.label, color: C.slate, ...fBody }}>{booking.date} · {booking.time} with {coachNameFor(booking).name}</div>
              </div>
            </Card>

            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: C.warnTint, borderRadius: 12, padding: 12, marginBottom: 18 }}>
              <AlertTriangle size={14} color={C.brand} style={{ marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: T.label, color: C.slate, lineHeight: 1.5, ...fBody }}>
                {coachNameFor(booking).name.split(" ")[0]} hasn't responded to this request yet - withdrawing it now won't incur any charge.
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Btn full variant="danger" onClick={() => onConfirm(booking.id)}>Yes, withdraw request</Btn>
              <Btn full variant="secondary" onClick={onClose}>Keep request</Btn>
            </div>
          </>
        )}
      </BottomSheet>
    );
  }

  const outcome = booking ? getCancellationOutcome(booking, coach) : null;
  const price = booking?.price || 0;
  const fee = Math.round(price * 0.06 * 100) / 100;
  const subtotal = Math.round((price - fee) * 100) / 100;
  const alreadyPaid = booking
    ? [PAYMENT_STATUS.HELD, PAYMENT_STATUS.RELEASED, PAYMENT_STATUS.REFUND_PROCESSING, PAYMENT_STATUS.REFUNDED].includes(booking.paymentStatus)
    : false;
  const refundAmount = alreadyPaid && outcome ? Math.round(subtotal * outcome.refundPct * 100) / 100 : 0;

  return (
    <BottomSheet open={!!booking} onClose={onClose} title="Review Cancellation" heightPct={92}>
      {booking && (
        <>
          <div style={{ fontSize: T.labelLg, color: C.slate, lineHeight: 1.55, marginBottom: 18, ...fBody }}>
            Please review the cancellation outcome before confirming. Refunds and fees are calculated based on CoachNivo's standard cancellation policy.
          </div>

          <SectionLabel>Booking details</SectionLabel>
          <Card style={{ marginBottom: 16 }}>
            <Row label="Service" value={booking.service} />
            <Row label="Coach" value={coachNameFor(booking).name} />
            <Row label="Date" value={booking.date} />
            <Row label="Time" value={booking.time} last />
          </Card>

          <SectionLabel>Payment breakdown</SectionLabel>
          {alreadyPaid ? (
            <Card style={{ marginBottom: 16 }}>
              <Row label="Session Fee" value={`$${subtotal.toFixed(2)}`} />
              <Row label="Platform Service Fee" value={`$${fee.toFixed(2)}`} />
              <Row label="Total Paid" value={`$${price.toFixed(2)}`} bold last />
            </Card>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: C.fog, borderRadius: 12, padding: 12, marginBottom: 16 }}>
              <CreditCard size={14} color={C.slate} style={{ marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: T.label, color: C.slate, lineHeight: 1.5, ...fBody }}>No payment has been collected for this booking yet - cancelling now won't incur any charge.</span>
            </div>
          )}

          <SectionLabel>Refund amount</SectionLabel>
          <Card style={{ marginBottom: 16, background: alreadyPaid && refundAmount > 0 ? C.successTint : C.warnTint }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: T.body, fontWeight: 600, color: C.jet, ...fBody }}>{alreadyPaid ? "You'll be refunded" : "Amount owed"}</span>
              <span style={{ fontSize: T.heading, fontWeight: 700, color: C.jet, ...fDisplay }}>${(alreadyPaid ? refundAmount : 0).toFixed(2)}</span>
            </div>
            <div style={{ fontSize: T.captionLg, color: C.slate, marginTop: 6, lineHeight: 1.5, ...fBody }}>
              {alreadyPaid ? outcome.ruleLabel : "No charge applies since payment hasn't been sent."}
            </div>
          </Card>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <span style={{ fontSize: T.label, color: C.slate, ...fBody }}>Resulting booking status:</span>
            <StatusPill status="cancelled" />
          </div>

          <button onClick={() => setUnderstood((v) => !v)} style={{ display: "flex", width: "100%", gap: 10, alignItems: "flex-start", background: "none", border: "none", cursor: "pointer", textAlign: "left", marginBottom: 18 }}>
            <div style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${understood ? C.brand : C.border}`, background: understood ? C.brand : C.white, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
              {understood && <CheckCircle2 size={12} color={C.white} />}
            </div>
            <span style={{ fontSize: T.label, color: C.jet, lineHeight: 1.5, ...fBody }}>I understand the cancellation policy and refund outcome.</span>
          </button>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Btn full variant="danger" disabled={!understood} onClick={() => onConfirm(booking.id)}>Confirm Cancellation</Btn>
            <Btn full variant="secondary" onClick={onClose}>Keep session</Btn>
          </div>
        </>
      )}
    </BottomSheet>
  );
}

/* Receipt — shown when a payments list item is tapped (also used in Account > Payment history) */
export function ReceiptSheet({ booking, onClose }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const total = Number(booking?.paidTotal || booking?.price || 0);
  return (
    <BottomSheet open={!!booking} onClose={onClose} title="Receipt" heightPct={72}>
      {booking && (
        <>
          <div style={{ textAlign: "center", marginBottom: 18 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: C.successTint, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
              <CheckCircle2 size={24} color={C.success} />
            </div>
            <div style={{ fontSize: T.headingLg, fontWeight: 700, color: C.jet, ...fDisplay }}>${total.toFixed(2)}</div>
            <div style={{ fontSize: T.label, color: C.slate, marginTop: 2, ...fBody }}>
              {booking.status === "cancelled" ? "Cancelled" : "Paid"} · {booking.date}
            </div>
          </div>

          <Card style={{ marginBottom: 14 }}>
            <Row label="Service" value={booking.service} />
            <Row label="Coach" value={coachNameFor(booking).name} />
            <Row label="Date" value={booking.date} />
            <Row label="Time" value={booking.time} />
            <Row label="Location" value={booking.mode} last />
          </Card>

          <Card style={{ marginBottom: 14 }}>
            <Row label="Package" value={`$${Number(booking.price).toFixed(2)}`} />
            {Number(booking.acceptanceChargeTotal || 0) > 0 && <Row label="Booking extras" value={`$${Number(booking.acceptanceChargeTotal).toFixed(2)}`} />}
            {Number(booking.finalChargeTotal || 0) > 0 && <Row label="Final payment" value={`$${Number(booking.finalChargeTotal).toFixed(2)}`} />}
            <Row label="Total" value={`$${total.toFixed(2)}`} bold last />
          </Card>

          <Card style={{ marginBottom: 18, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 24, borderRadius: 5, background: C.jet, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CreditCard size={13} color={C.white} />
            </div>
            <div style={{ fontSize: T.body, color: C.jet, fontWeight: 500, ...fBody }}>Visa •••• 4821</div>
          </Card>

          <Btn full variant="outline" icon={Download}>Download receipt</Btn>
        </>
      )}
    </BottomSheet>
  );
}

export function BookingCard({ b, nav, past, additionalCharge, onAdditionalCharge, onCancel, onPay, style }) {
  const { darkMode, businesses = [] } = useApp();
  const C = darkMode ? CD : CL;
  const pending = b.status === BOOKING_STATUS.PENDING;
  const live = b.status === BOOKING_STATUS.IN_PROGRESS;
  const paymentDue = !past
    && b.status === BOOKING_STATUS.AWAITING_PAYMENT
    && b.paymentStatus === PAYMENT_STATUS.DUE;
  const additionalPaymentDue = additionalCharge?.status === ADDITIONAL_CHARGE_STATUS.PENDING;
  const needsAttention = paymentDue || additionalPaymentDue;
  const cn = coachNameFor(b);
  const isBusiness = b.providerType === "business";
  const business = isBusiness ? businesses.find((item) => item.id === b.businessId) : null;
  const providerName = isBusiness ? (business?.tradingName || b.providerName || "Organisation") : (cn.name || b.clientName);
  const providerLogo = isBusiness ? business?.profile?.logo : undefined;
  const coach = COACHES.find((c) => c.id === b.coachId);
  return (
    <Card
      onClick={() => nav("client-booking-detail", { id: b.id })}
      style={{
        padding: 24,
        marginBottom: 16,
        borderRadius: 18,
        border: `1px solid ${C.border}`,
        boxShadow: needsAttention
          ? "0 8px 24px rgba(22,24,29,.06)"
          : "0 1px 2px rgba(22,24,29,.04)",
        ...style,
      }}
    >
      <div style={{ display: "flex", gap: 12, minWidth: 0, marginBottom: 10 }}>
        {isBusiness ? (
          <div style={{ width: 48, height: 48, borderRadius: 14, padding: 4, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: C.white, border: `1px solid ${C.border}` }}>
            {providerLogo ? <img src={providerLogo} alt={`${providerName} logo`} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} /> : <Avatar name={providerName} size={40} />}
          </div>
        ) : <Avatar name={providerName} src={coach?.avatar} size={46} />}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: T.subtitleLg, fontWeight: 700, color: C.jet, letterSpacing: "-0.1px", ...fDisplay }}>{b.service}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0, marginTop: 3 }}>
            {isBusiness && <span style={{ display: "inline-flex", alignItems: "center", color: C.brand, flexShrink: 0 }}><Building2 size={12} /></span>}
            <div style={{ minWidth: 0, fontSize: T.labelLg, color: C.slate, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...fBody }}>{providerName}</div>
          </div>
          {isBusiness && (b.coachName || coach?.name) && <div style={{ fontSize: T.caption, color: C.slateLight, marginTop: 3, ...fBody }}>Coach · {b.coachName || coach?.name}</div>}
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: T.label, color: C.slateLight, marginTop: 6, ...fBody }}>
            <Clock size={11} /> {b.date} · {b.time}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <StatusPill status={b.status} />
        {past && b.status === BOOKING_STATUS.COMPLETED && b.reviewed && <Badge tone="success" icon={CheckCircle2}>Reviewed</Badge>}
      </div>
      {additionalPaymentDue && (
        <div
          onClick={(event) => event.stopPropagation()}
          style={{ display: "flex", alignItems: "center", gap: 10, background: C.warnTint, borderRadius: 14, padding: "10px 12px", marginTop: 12 }}
        >
          <div style={{ width: 34, height: 34, borderRadius: 11, background: C.white, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <BadgeDollarSign size={17} color={C.warnStrong} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: T.labelLg, fontWeight: 700, color: C.jet, ...fBody }}>Additional payment due · ${Number(additionalCharge.amount).toFixed(2)}</div>
            <div style={{ fontSize: T.caption, color: C.slate, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...fBody }}>{additionalCharge.reason}</div>
          </div>
        </div>
      )}
      {paymentDue && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.brandTint, borderRadius: 12, padding: "9px 12px", marginTop: 12 }} onClick={(e) => e.stopPropagation()}>
          <CreditCard size={14} color={C.brand} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: T.label, color: C.jet, lineHeight: 1.4, ...fBody }}>{isBusiness ? "Your organisation assigned a coach" : `${(cn.name || "Your coach").split(" ")[0]} accepted`} - send your payment to lock in the session.</span>
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
        {/* Keep cards focused on quick actions. Rescheduling stays in booking
            details, where clients can review the session before choosing a slot. */}
        {!past && (
          <>
            {live ? (
              <Btn size="sm" variant="dark" full icon={CheckCircle2} onClick={() => nav("session-progress", { bookingId: b.id, role: "client" })}>Live session</Btn>
            ) : paymentDue ? (
              <Btn size="sm" variant="dark" full onClick={onPay}>Pay now</Btn>
            ) : additionalPaymentDue ? (
              <Btn size="sm" variant="dark" full onClick={onAdditionalCharge}>Review</Btn>
            ) : isBusiness ? (
              <Btn size="sm" variant="secondary" full onClick={() => nav("client-booking-detail", { id: b.id })}>View details</Btn>
            ) : (
              <Btn size="sm" variant="secondary" full onClick={onCancel}>{pending ? "Withdraw request" : "Cancel booking"}</Btn>
            )}
            <Btn size="sm" variant="dark" icon={MessageCircle} ariaLabel={`Message ${providerName}`} onClick={() => nav("chat-thread", { name: isBusiness ? providerName : (b.coachName || b.clientName), handle: coach?.handle, context: `${b.service} · ${b.date}`, bookingId: b.id })} />
          </>
        )}
        {/* Completed / cancelled: always offer a fast rebook path alongside whatever review state applies. */}
        {past && isBusiness && (
          <Btn size="sm" variant="outline" full icon={RefreshCcw} onClick={() => nav("business-public-profile", { id: b.businessId })}>Book again</Btn>
        )}
        {past && !isBusiness && b.status === BOOKING_STATUS.COMPLETED && !b.reviewed && (
          <>
            <Btn size="sm" full onClick={() => nav("leave-review", { bookingId: b.id, name: cn.name || b.coachName })}>Leave a review</Btn>
            <Btn size="sm" variant="outline" full icon={RefreshCcw} onClick={() => nav("coach-profile", { id: b.coachId })}>Book again</Btn>
          </>
        )}
        {past && !isBusiness && b.status === BOOKING_STATUS.COMPLETED && b.reviewed && (
          <>
            <Btn size="sm" variant="outline" full icon={RefreshCcw} onClick={() => nav("coach-profile", { id: b.coachId })}>Book again</Btn>
          </>
        )}
        {past && !isBusiness && [BOOKING_STATUS.DECLINED, BOOKING_STATUS.EXPIRED].includes(b.status) && (
          <Btn size="sm" variant="outline" full icon={RefreshCcw} onClick={() => nav("coach-profile", { id: b.coachId })}>Find another time</Btn>
        )}
        {past && !isBusiness && b.status === BOOKING_STATUS.CANCELLED && (
          <Btn size="sm" variant="outline" full icon={RefreshCcw} onClick={() => nav("coach-profile", { id: b.coachId })}>Book again</Btn>
        )}
      </div>
    </Card>
  );
}
 
/* Desktop dashboard helpers — stat row + data-dense bookings table (Phase 14).
   Mobile keeps the stacked BookingCard list; ≥1024 uses these. */
function DashboardStats({ pendingCount, upcomingCount, pastCount, C }) {
  const { isDesktop } = useResponsive();
  const stats = [
    { label: "Requests & payments", value: pendingCount, sub: "requires action" },
    { label: "Upcoming sessions", value: upcomingCount, sub: "scheduled" },
    { label: "Completed & past", value: pastCount, sub: "session history" },
  ];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isDesktop ? "repeat(3, minmax(0, 1fr))" : "repeat(3, 1fr)",
        gap: isDesktop ? 16 : 10,
        marginTop: isDesktop ? 16 : 12,
      }}
    >
      {stats.map((s) => (
        <Card
          key={s.label}
          style={{
            padding: isDesktop ? 32 : 16,
            borderRadius: isDesktop ? 22 : 16,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: isDesktop ? 15 : T.caption, color: C.slateLight, fontWeight: 650, ...fBody }}>
            {s.label}
          </div>
          <div
            style={{
              fontSize: isDesktop ? 44 : 28,
              fontWeight: 700,
              color: C.jet,
              marginTop: 6,
              lineHeight: 1.05,
              ...fDisplay,
            }}
          >
            {s.value}
          </div>
          <div style={{ fontSize: isDesktop ? 13.5 : T.tiny, color: C.slateLight, marginTop: 6, ...fBody }}>
            {s.sub}
          </div>
        </Card>
      ))}
    </div>
  );
}

function BookingTable({ items, nav, additionalCharges = [], C }) {
  const headers = ["Session", "Coach", "Date", "Time", "Status", ""];
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: LAYOUT.cardRadius, overflow: "hidden", background: C.white }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} style={{ textAlign: "left", padding: "16px 24px", borderBottom: `1px solid ${C.border}`, fontSize: T.caption, fontWeight: 700, color: C.slateLight, textTransform: "uppercase", letterSpacing: ".05em", ...fBody }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((b) => {
            const cn = coachNameFor(b);
            const pendingCharge = additionalCharges.find((c) => (
              c.bookingId === b.id && c.phase === ADDITIONAL_CHARGE_PHASE.COMPLETION && c.status === ADDITIONAL_CHARGE_STATUS.PENDING
            ));
            const paymentDue = b.status === BOOKING_STATUS.AWAITING_PAYMENT && b.paymentStatus === PAYMENT_STATUS.DUE;
            return (
              <tr
                key={b.id}
                tabIndex={0}
                className="cl-table-row"
                onClick={() => nav("client-booking-detail", { id: b.id })}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); nav("client-booking-detail", { id: b.id }); } }}
                style={{ cursor: "pointer", borderBottom: `1px solid ${C.border}` }}
              >
                <td style={{ padding: "18px 24px", fontSize: T.body, fontWeight: 600, color: C.jet, ...fBody }}>{b.service}</td>
                <td style={{ padding: "18px 24px", fontSize: T.body, color: C.slate, ...fBody }}>{cn.name || b.coachName || "Coach"}</td>
                <td style={{ padding: "18px 24px", fontSize: T.body, color: C.slate, ...fBody }}>{b.date}</td>
                <td style={{ padding: "18px 24px", fontSize: T.body, color: C.slate, ...fBody }}>{b.time}</td>
                <td style={{ padding: "18px 24px" }}><StatusPill status={b.status} /></td>
                <td style={{ padding: "18px 24px", textAlign: "right", whiteSpace: "nowrap" }}>
                  {paymentDue ? (
                    <Btn size="sm" variant="dark" onClick={(e) => { e.stopPropagation(); nav("payment", { bookingId: b.id }); }}>Pay now</Btn>
                  ) : pendingCharge ? (
                    <Btn size="sm" variant="dark" onClick={(e) => { e.stopPropagation(); nav("additional-charge-review", { chargeId: pendingCharge.id, role: "client", backTo: "client-dashboard" }); }}>Review</Btn>
                  ) : (
                    <Btn size="sm" variant="outline" onClick={() => nav("client-booking-detail", { id: b.id })}>Open</Btn>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* Booking details — the client-side counterpart to the coach's booking detail page.
   Surfaces the same categories of information (party info, session details, notes,
   booking policy) but never exposes the Accept/Decline workflow, which is coach-only. */
export function ScreenClientBookingDetail({ nav, goBack, params, bookings = [], toast, cancelBooking, rescheduleBooking, sessionDisputes = [], additionalCharges = [] }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const { isDesktop } = useResponsive();
  const booking = bookings.find((b) => b.id === params.id);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  if (!booking) {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <TopBar title="Booking details" onBack={() => goBack("client-dashboard")} />
        <EmptyState icon={ClipboardList} title="Booking not found" body="This booking may have been removed." />
      </div>
    );
  }

  const coach = COACHES.find((c) => c.id === booking.coachId);
  const cn = coachNameFor(booking);
  const isPending = booking.status === BOOKING_STATUS.PENDING;
  const isAwaitingPayment = booking.status === BOOKING_STATUS.AWAITING_PAYMENT;
  const isUpcoming = booking.status === BOOKING_STATUS.CONFIRMED;
  const isLive = booking.status === BOOKING_STATUS.IN_PROGRESS;
  const isCompletionPending = booking.status === BOOKING_STATUS.COMPLETION_PENDING;
  const isPast = [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CANCELLED, BOOKING_STATUS.DECLINED, BOOKING_STATUS.EXPIRED].includes(booking.status);
  const priceLabel = typeof booking.price === "number" ? `$${booking.price.toFixed(2)}` : `$${booking.price}`;
  const relatedCase = sessionDisputes.find((item) => item.bookingId === booking.id);
  const acceptanceCharges = additionalCharges.filter((item) => (
    item.bookingId === booking.id
    && item.phase === ADDITIONAL_CHARGE_PHASE.ACCEPTANCE
    && ![ADDITIONAL_CHARGE_STATUS.CANCELLED, ADDITIONAL_CHARGE_STATUS.DECLINED].includes(item.status)
  ));
  const completionCharge = additionalCharges.find((item) => (
    item.bookingId === booking.id
    && item.phase === ADDITIONAL_CHARGE_PHASE.COMPLETION
    && item.status === ADDITIONAL_CHARGE_STATUS.PENDING
  )) || additionalCharges.find((item) => (
    item.bookingId === booking.id
    && item.phase === ADDITIONAL_CHARGE_PHASE.COMPLETION
    && item.status !== ADDITIONAL_CHARGE_STATUS.CANCELLED
  ));
  const requiredAcceptanceTotal = acceptanceCharges
    .filter((item) => item.kind === ADDITIONAL_CHARGE_KIND.REQUIRED)
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const requiredCheckoutTotal = Number(booking.price || 0) + requiredAcceptanceTotal;
  const pendingFinalCharge = completionCharge?.status === ADDITIONAL_CHARGE_STATUS.PENDING;

  const handleReschedule = (id, when) => {
    rescheduleBooking(id, when);
    toast(`Session rescheduled to ${when.date}, ${when.time}`);
    setRescheduleOpen(false);
  };

  const handleCancelConfirm = (id) => {
    cancelBooking(id);
    toast(isPending ? "Booking request withdrawn" : "Session cancelled");
    setCancelOpen(false);
    nav("client-dashboard");
  };

  const messageParams = {
    name: booking.coachName,
    handle: coach?.handle,
    context: `${booking.service} · ${booking.date}`,
    bookingId: booking.id,
    backTo: "client-booking-detail",
    backParams: { id: booking.id },
  };

  const goSupport = () => nav("support", {
    presetTab: "chat",
    bookingContext: `${booking.service} · ${booking.date}`,
    backTo: "client-booking-detail",
    backParams: { id: booking.id },
  });

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar title="Booking details" onBack={() => goBack("client-dashboard")} />
      <div style={{ flex: 1, overflowY: "auto", width: "100%", padding: isDesktop ? "32px 64px 48px" : "16px 18px 24px" }} className="cl-hide-scrollbar">

        <Card style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar name={cn.name} size={50} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: T.subtitleLg, fontWeight: 600, color: C.jet, ...fDisplay }}>{cn.name}</div>
              {cn.handle && <HandleTag handle={cn.handle} size={11.5} color={C.slateLight} />}
              {cn.revealed && <div style={{ fontSize: T.captionLg, color: C.slate, ...fBody }}>Full name shared with your booking partner</div>}
              {coach && <div style={{ fontSize: T.label, color: C.slate, ...fBody }}>{coach.suburb}</div>}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}`, flexWrap: "wrap" }}>
            {coach?.verified?.identity && (
              <Badge tone="orange" icon={ShieldCheck}>Verified coach</Badge>
            )}
            <StatusPill status={booking.status} />
          </div>
        </Card>

        {booking.status === BOOKING_STATUS.DECLINED && (
          <div style={{ marginBottom: 14 }}>
            <StatusBanner state="bookingDeclined" compact />
          </div>
        )}
        {booking.status === BOOKING_STATUS.EXPIRED && (
          <div style={{ marginBottom: 14 }}>
            <StatusBanner state="bookingExpired" compact />
          </div>
        )}

        <SectionLabel>Booking details</SectionLabel>
        <Card style={{ marginBottom: 14 }}>
          <Row label="Service" value={booking.service} />
          <Row label="Date" value={booking.date} />
          <Row label="Time" value={booking.time} />
          <Row label="Mode" value={booking.mode} />
          {booking.participants && <Row label="For" value={booking.participants} />}
          {booking.paidTotal ? (
            <>
              <Row label="Package price" value={priceLabel} />
              {Number(booking.acceptanceChargeTotal || 0) > 0 && <Row label="Accepted extras" value={`$${Number(booking.acceptanceChargeTotal).toFixed(2)}`} />}
              <Row label="Total paid" value={`$${Number(booking.paidTotal).toFixed(2)}`} bold last />
            </>
          ) : <Row label="Price" value={priceLabel} bold last />}
        </Card>

        <div style={{ marginBottom: 14 }}>
          <SessionJourneyTimeline booking={booking} role="client" />
        </div>

        {relatedCase && (
          <Card style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 11, background: C.warnTint, border: "none" }} onClick={() => nav("dispute-status", { caseId: relatedCase.id, role: "client", backTo: "client-booking-detail", bookingId: booking.id })}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: C.brandTint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Scale size={18} color={C.brand} /></div>
            <div style={{ flex: 1 }}><div style={{ fontSize: T.body, fontWeight: 700, color: C.jet, ...fBody }}>{relatedCase.status === "resolved" ? "Case decision available" : "Session report under review"}</div><div style={{ fontSize: T.captionLg, color: C.slate, marginTop: 2, ...fBody }}>{relatedCase.categoryLabel} · View status and outcome</div></div>
            <ChevronRight size={16} color={C.slateLight} />
          </Card>
        )}

        {isAwaitingPayment && acceptanceCharges.length > 0 && (
          <Card style={{ marginBottom: 14, padding: 16, background: C.brandTint, border: "none" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontSize: T.title, fontWeight: 700, color: C.jet, ...fDisplay }}>Your final price is ready</div>
                <div style={{ marginTop: 4, fontSize: T.captionLg, color: C.slate, lineHeight: 1.5, ...fBody }}>{acceptanceCharges.filter((item) => item.kind === ADDITIONAL_CHARGE_KIND.REQUIRED).length} required cost{acceptanceCharges.filter((item) => item.kind === ADDITIONAL_CHARGE_KIND.REQUIRED).length === 1 ? "" : "s"} included · {acceptanceCharges.filter((item) => item.kind === ADDITIONAL_CHARGE_KIND.OPTIONAL).length} optional add-on{acceptanceCharges.filter((item) => item.kind === ADDITIONAL_CHARGE_KIND.OPTIONAL).length === 1 ? "" : "s"}</div>
              </div>
              <div style={{ fontSize: T.titleLg, fontWeight: 700, color: C.jet, ...fDisplay }}>${requiredCheckoutTotal.toFixed(2)}</div>
            </div>
          </Card>
        )}

        {completionCharge && (
          <Card style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 11, background: pendingFinalCharge ? C.warnTint : C.white, border: pendingFinalCharge ? "none" : `1px solid ${C.border}` }} onClick={() => nav("additional-charge-review", { chargeId: completionCharge.id, role: "client", backTo: "client-booking-detail" })}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: C.white, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><BadgeDollarSign size={18} color={pendingFinalCharge ? C.warnStrong : C.brand} /></div>
            <div style={{ flex: 1 }}><div style={{ fontSize: T.body, fontWeight: 700, color: C.jet, ...fBody }}>{pendingFinalCharge ? "Final payment required" : "Final payment"} · ${Number(completionCharge.amount).toFixed(2)}</div><div style={{ fontSize: T.captionLg, color: C.slate, marginTop: 2, ...fBody }}>{completionCharge.reason} · {pendingFinalCharge ? "Pay before confirming completion" : completionCharge.status.replace("_", " ")}</div></div>
            <ChevronRight size={16} color={C.slateLight} />
          </Card>
        )}

        {booking.notes && (
          <>
            <SectionLabel>Your notes to the coach</SectionLabel>
            <Card style={{ marginBottom: 14 }}>
              <p style={{ margin: 0, fontSize: T.body, color: C.slate, lineHeight: 1.6, whiteSpace: "pre-line", ...fBody }}>{booking.notes}</p>
            </Card>
          </>
        )}

        {booking.safetyNotes && (
          <>
            <SectionLabel>Health & safety information shared</SectionLabel>
            <Card style={{ marginBottom: 14, display: "flex", alignItems: "flex-start", gap: 10, background: C.warnTint, border: "none" }}>
              <ShieldCheck size={17} color={C.warnStrong} style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: T.body, color: C.jet, lineHeight: 1.6, whiteSpace: "pre-line", ...fBody }}>{booking.safetyNotes}</p>
            </Card>
          </>
        )}

        <SectionLabel>Booking policy</SectionLabel>
        <Card style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", paddingBottom: 12, marginBottom: 12, borderBottom: `1px solid ${C.border}` }}>
            <Calendar size={15} color={C.slate} style={{ marginTop: 1, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: T.labelLg, fontWeight: 600, color: C.jet, marginBottom: 2, ...fBody }}>Cancellation policy</div>
              <div style={{ fontSize: T.label, color: C.slate, lineHeight: 1.5, ...fBody }}>
                {CONFIG.cancellationPolicy}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <AlertTriangle size={15} color={C.slate} style={{ marginTop: 1, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: T.labelLg, fontWeight: 600, color: C.jet, marginBottom: 2, ...fBody }}>No-show policy</div>
              <div style={{ fontSize: T.label, color: C.slate, lineHeight: 1.5, ...fBody }}>
                {coach?.noShowPolicy || "Failing to attend without notice may forfeit some or all of your session fee."}
              </div>
            </div>
          </div>
        </Card>

        {isUpcoming && (
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <button
              onClick={() => nav("session-prep", { coachId: booking.coachId, packageId: coach?.packages?.[0]?.id, date: booking.date })}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "10px 12px", borderRadius: 12, border: `1px solid ${C.border}`, background: C.white,
                cursor: "pointer", ...fBody,
              }}
            >
              <CalendarDays size={14} color={C.jet} />
              <span style={{ fontSize: T.labelLg, fontWeight: 600, color: C.jet }}>Session prep</span>
            </button>
          </div>
        )}

        {isPast && booking.status === BOOKING_STATUS.CANCELLED && booking.refundStatus && (
          <div style={{ marginBottom: 14 }}>
            <button
              onClick={() => nav("refund-status", { booking })}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
                borderRadius: 12, border: `1px solid ${C.border}`, background: C.white,
                cursor: "pointer", ...fBody,
              }}
            >
              <Clock size={15} color={C.brand} />
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={{ fontSize: T.labelLg, fontWeight: 600, color: C.jet, ...fBody }}>Refund status</div>
                <div style={{ fontSize: T.label, color: C.slate, marginTop: 2, ...fBody }}>
                  {booking.refundStatus === "refunded" ? "Refund complete" : "Refund in progress"}
                </div>
              </div>
              <ChevronRight size={16} color={C.slateLight} />
            </button>
          </div>
        )}

        {isAwaitingPayment && booking.paymentStatus === PAYMENT_STATUS.DUE && (
          <div style={{ marginBottom: 14 }}>
            <PaymentDeadlineCard booking={booking} role="client" />
          </div>
        )}

        {isUpcoming && (
          <div style={{ display: "flex", gap: 8, marginTop: 4, marginBottom: 14 }}>
            <Btn size="sm" variant="secondary" full onClick={() => setRescheduleOpen(true)}>Reschedule</Btn>
            <Btn size="sm" variant="outline" full onClick={() => setCancelOpen(true)}>Cancel</Btn>
            <Btn size="sm" variant="dark" icon={MessageCircle} ariaLabel={`Message ${cn.name}`} onClick={() => nav("chat-thread", messageParams)} />
          </div>
        )}

        {isLive && (
          <div style={{ display: "flex", gap: 8, marginTop: 4, marginBottom: 14 }}>
            <Btn size="sm" variant="dark" full icon={MessageCircle} ariaLabel={`Message ${cn.name}`} onClick={() => nav("chat-thread", messageParams)} />
          </div>
        )}

        {isPast && booking.status === BOOKING_STATUS.COMPLETED && !booking.reviewed && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
            <Btn full variant="outline" icon={Banknote} onClick={() => nav("funds-release-status", { bookingId: booking.id, role: "client", backTo: "client-booking-detail" })}>View payment release</Btn>
            <Btn full onClick={() => nav("leave-review", { bookingId: booking.id, name: cn.name || booking.coachName })}>Leave a review</Btn>
            <Btn full variant="secondary" icon={RefreshCcw} onClick={() => nav("coach-profile", { id: booking.coachId })}>Book again</Btn>
            {!relatedCase && <Btn full variant="ghost" icon={Scale} onClick={() => nav("dispute-create", { bookingId: booking.id, role: "client", category: "session_not_delivered", backTo: "client-booking-detail" })}>Report a session issue</Btn>}
          </div>
        )}
        {isPast && booking.status === BOOKING_STATUS.COMPLETED && booking.reviewed && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
            <Badge tone="success" icon={CheckCircle2} style={{ alignSelf: "flex-start" }}>Review submitted</Badge>
            <Btn full variant="outline" icon={Banknote} onClick={() => nav("funds-release-status", { bookingId: booking.id, role: "client", backTo: "client-booking-detail" })}>View payment release</Btn>
            <Btn full variant="secondary" icon={RefreshCcw} onClick={() => nav("coach-profile", { id: booking.coachId })}>Book again</Btn>
            {!relatedCase && <Btn full variant="ghost" icon={Scale} onClick={() => nav("dispute-create", { bookingId: booking.id, role: "client", category: "session_not_delivered", backTo: "client-booking-detail" })}>Report a session issue</Btn>}
          </div>
        )}
        {isPast && booking.status === BOOKING_STATUS.CANCELLED && (
          <div style={{ marginBottom: 14 }}>
            {booking.refundStatus === "processing" && <div style={{ marginBottom: 10 }}><StatusBanner state="refundProcessing" compact /></div>}
            {booking.refundStatus === "refunded" && <div style={{ marginBottom: 10 }}><StatusBanner state="paymentRefunded" message={`$${Number(booking.paidTotal || booking.price).toFixed(2)} was refunded to your original payment method.`} compact /></div>}
            <Btn full variant="secondary" icon={RefreshCcw} onClick={() => nav("coach-profile", { id: booking.coachId })}>Book again</Btn>
          </div>
        )}

        {isPast && [BOOKING_STATUS.DECLINED, BOOKING_STATUS.EXPIRED].includes(booking.status) && (
          <div style={{ marginBottom: 14 }}>
            <Btn full variant="secondary" icon={RefreshCcw} onClick={() => nav("coach-profile", { id: booking.coachId })}>Find another time</Btn>
          </div>
        )}

        <Btn full variant="outline" icon={LifeBuoy} onClick={goSupport}>Contact support</Btn>
      </div>

      {isPending && (
        <BottomActionBar>
          <Btn full variant="outline" icon={MessageCircle} onClick={() => nav("chat-thread", messageParams)}>Message</Btn>
          <Btn full variant="danger" onClick={() => setCancelOpen(true)}>Withdraw</Btn>
        </BottomActionBar>
      )}

      {isAwaitingPayment && booking.paymentStatus === PAYMENT_STATUS.DUE && (
        <BottomActionBar>
          <Btn full variant="outline" icon={MessageCircle} ariaLabel={`Message ${cn.name}`} title={`Message ${cn.name}`} onClick={() => nav("chat-thread", messageParams)}>Message</Btn>
          <Btn full onClick={() => nav("payment", { bookingId: booking.id })}>Review & pay ${requiredCheckoutTotal.toFixed(2)}</Btn>
        </BottomActionBar>
      )}

      {(isLive || isCompletionPending) && pendingFinalCharge && (
        <BottomActionBar>
          <Btn full icon={CreditCard} onClick={() => nav("additional-charge-payment", { chargeId: completionCharge.id, role: "client" })}>Pay final ${Number(completionCharge.amount).toFixed(2)}</Btn>
        </BottomActionBar>
      )}

      {isCompletionPending && !pendingFinalCharge && (
        <BottomActionBar>
          <div style={{ width: "100%", minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.fog, borderRadius: 12, padding: "10px 16px", color: C.slate, fontSize: T.body, fontWeight: 600, ...fBody }}>
            <Clock size={15} color={C.brand} />
            <span>Waiting for your coach to finish</span>
          </div>
        </BottomActionBar>
      )}

      {isUpcoming && (
        <BottomActionBar>
          <Btn full icon={PlayCircle} onClick={() => nav("client-session-start", { bookingId: booking.id })}>Start session</Btn>
        </BottomActionBar>
      )}

      {isLive && !pendingFinalCharge && (
        <BottomActionBar>
          <Btn full icon={CheckCircle2} onClick={() => nav("session-progress", { bookingId: booking.id, role: "client" })}>View live session</Btn>
        </BottomActionBar>
      )}

      <RescheduleSheet
        booking={rescheduleOpen ? booking : null}
        onClose={() => setRescheduleOpen(false)}
        onConfirm={handleReschedule}
      />
      <CancelSheet
        booking={cancelOpen ? booking : null}
        pending={isPending}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancelConfirm}
      />
    </div>
  );
}

export function ScreenLeaveReview({ nav, goBack, params, toast, bookings = [], setBookings }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const booking = params?.bookingId ? bookings.find((item) => item.id === params.bookingId) : null;
  const name = params?.name
    || booking?.coachName
    || COACHES[0].name;
  const coach = COACHES.find((item) => item.id === booking?.coachId)
    || COACHES.find((item) => item.name === name);
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState([]);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const options = ["Great communicator", "Punctual", "Well prepared", "Motivating", "Flexible"];
  const ratingLabels = ["", "Needs improvement", "Fair", "Good", "Great", "Excellent"];
  const maxReviewLength = 500;
  const toggle = (t) => setTags((arr) => arr.includes(t) ? arr.filter((x) => x !== t) : [...arr, t]);

  const submitReview = () => {
    if (!rating || submitting) return;
    setSubmitting(true);
    window.setTimeout(() => {
      if (booking?.id) {
        setBookings?.((items) => items.map((item) => item.id === booking.id
          ? { ...item, reviewed: true, review: { rating, tags, comment: review.trim() } }
          : item));
      }
      toast("Review sent - thank you!");
      nav("client-dashboard");
    }, 450);
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.white }}>
      <TopBar title="Leave a review" onBack={() => goBack ? goBack() : nav("client-dashboard")} />

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "16px 18px 32px" }} className="cl-hide-scrollbar">
        <Card style={{ padding: 16, background: C.fog, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar name={name} src={coach?.avatar} size={52} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: T.title, fontWeight: 700, color: C.jet, ...fDisplay }}>{name}</div>
              <div style={{ fontSize: T.body, color: C.slate, lineHeight: 1.45, marginTop: 2, ...fBody }}>
                {booking?.service || "Completed coaching session"}
              </div>
              {coach?.sport && <div style={{ marginTop: 6 }}><SportBadge sport={coach.sport} compact /></div>}
              {booking?.date && (
                <div style={{ fontSize: T.captionLg, color: C.slateLight, marginTop: 3, ...fBody }}>
                  {booking.date} · {booking.time}
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card style={{ padding: "18px 14px", textAlign: "center", marginBottom: 14 }}>
          <div style={{ fontSize: T.heading, fontWeight: 700, color: C.jet, ...fDisplay }}>How was your session?</div>
          <div style={{ fontSize: T.body, color: C.slate, marginTop: 4, ...fBody }}>Tap a star to share your overall experience.</div>
          <div role="radiogroup" aria-label="Session rating" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, marginTop: 12 }}>
            {[1, 2, 3, 4, 5].map((value) => {
              const active = value <= rating;
              return (
                <button
                  type="button"
                  role="radio"
                  aria-checked={rating === value}
                  aria-label={`${value} star${value === 1 ? "" : "s"}: ${ratingLabels[value]}`}
                  key={value}
                  onClick={() => setRating(value)}
                  style={{
                    width: LAYOUT.touchTarget, height: LAYOUT.touchTarget, padding: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "transparent", border: "none", borderRadius: LAYOUT.buttonRadius, cursor: "pointer",
                  }}
                >
                  <Star aria-hidden="true" size={30} strokeWidth={1.8} fill={active ? C.brand : "none"} color={active ? C.brand : C.border} />
                </button>
              );
            })}
          </div>
          <div aria-live="polite" style={{ minHeight: 18, fontSize: T.labelLg, fontWeight: 600, color: rating ? C.brand : C.slateLight, marginTop: 5, ...fBody }}>
            {rating ? ratingLabels[rating] : "No rating selected"}
          </div>
        </Card>

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: T.title, fontWeight: 700, color: C.jet, ...fDisplay }}>What stood out?</div>
          <div style={{ fontSize: T.body, color: C.slate, lineHeight: 1.45, marginTop: 3, marginBottom: 10, ...fBody }}>Choose any highlights that describe your session.</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {options.map((tag) => <Chip key={tag} active={tags.includes(tag)} onClick={() => toggle(tag)}>{tag}</Chip>)}
          </div>
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 7 }}>
            <label htmlFor="client-review" style={{ fontSize: T.title, fontWeight: 700, color: C.jet, ...fDisplay }}>Share more</label>
            <span style={{ fontSize: T.caption, color: C.slateLight, ...fBody }}>Optional</span>
          </div>
          <textarea
            id="client-review"
            name="client-review"
            value={review}
            maxLength={maxReviewLength}
            onChange={(event) => setReview(event.target.value)}
            placeholder="What did you enjoy, and what could help future clients?"
            rows={5}
            className="cl-input"
            style={{
              display: "block", width: "100%", minHeight: 112, boxSizing: "border-box",
              border: `1.5px solid ${C.border}`, borderRadius: LAYOUT.inputRadius, padding: "12px 13px",
              fontSize: T.bodyLg, lineHeight: 1.5, resize: "none", outline: "none",
              color: C.jet, background: C.white, ...fBody,
            }}
          />
          <div style={{ textAlign: "right", fontSize: T.caption, color: C.slateLight, marginTop: 5, ...fBody }}>{review.length}/{maxReviewLength}</div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: 12, borderRadius: LAYOUT.inputRadius, background: C.fog, marginTop: 14 }}>
          <ShieldCheck aria-hidden="true" size={17} color={C.brand} style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: T.captionLg, color: C.slate, lineHeight: 1.5, ...fBody }}>
            Reviews are available only after verified bookings and are checked before appearing publicly.
          </div>
        </div>
      </div>

      <div style={{ padding: "12px 18px", paddingBottom: "max(28px, env(safe-area-inset-bottom))", borderTop: `1px solid ${C.border}`, background: C.white, flexShrink: 0 }}>
        <Btn full disabled={!rating} loading={submitting} loadingText="Sending review…" icon={Star} onClick={submitReview}>Send review</Btn>
      </div>
    </div>
  );
}
