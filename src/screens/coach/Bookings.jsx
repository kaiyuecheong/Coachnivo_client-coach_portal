import React, { useState, useMemo, useEffect } from "react";
import {
  ClipboardList, Info, MessagesSquare, MessageCircle,
  ChevronLeft, ChevronRight, CalendarX2, BellRing, CalendarClock,
  CheckCircle2, Banknote, LifeBuoy, LockKeyhole, Scale, BadgeDollarSign, Clock, PlayCircle,
  Calendar as CalendarIcon, CalendarDays, Sparkles, ArrowRight, X, ShieldCheck,
} from "lucide-react";
import { CL, CD, fDisplay, fBody, T } from "../../theme/theme";
import { CLIENT_PROFILES, BOOKING_ENQUIRY_MESSAGES, CONFIG } from "../../data/mockData";
import {
  Avatar, BottomActionBar, Card, SegTabs, ViewModeToggle, ScreenHeader, EmptyState, StatusPill, Btn, TopBar, Row, SectionLabel, Badge, HandleTag, BottomSheet, BookingCardSkeleton,
} from "../../components/ui/Primitives";
import { useApp } from "../../context/AppContext";
import { useResponsive } from "../../theme/responsive";
import { getBookingClientName } from "../../utils/name";
import { withClientMeta } from "../../data/users";
import {
  ADDITIONAL_CHARGE_KIND, ADDITIONAL_CHARGE_PHASE, ADDITIONAL_CHARGE_STATUS, BOOKING_STATUS,
} from "../../data/bookings";
import { PaymentDeadlineCard, SessionJourneyTimeline } from "../../components/booking/SessionJourneyTimeline";

/** Name the coach should see for a booking's client — privacy-safe until the
    booking is confirmed, full name afterwards (partner reveal). */
function clientNameFor(booking) {
  return getBookingClientName(withClientMeta(booking));
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

export function ScreenCoachBookings({ nav, coachBookings }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const { isDesktop, isTablet } = useResponsive();
  const [tab, setTab] = useState("pending");
  const [view, setView] = useState("list");
  const [loading, setLoading] = useState(true);
  const [calMode, setCalMode] = useState("month");
  useEffect(() => { const t = setTimeout(() => setLoading(false), 800); return () => clearTimeout(t); }, []);

  const dated = useMemo(() => coachBookings.map((b) => ({ ...b, _date: parseBookingDate(b.date) })), [coachBookings]);
  const initialDate = useMemo(() => (dated.find((b) => b._date)?._date) || new Date(), [dated]);
  const [cursor, setCursor] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState(initialDate);

  const list = coachBookings.filter((b) => tab === "pending"
    ? [BOOKING_STATUS.PENDING, BOOKING_STATUS.AWAITING_PAYMENT].includes(b.status)
    : tab === "upcoming"
      ? [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.COMPLETION_PENDING].includes(b.status)
      : [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.DECLINED, BOOKING_STATUS.EXPIRED, BOOKING_STATUS.CANCELLED].includes(b.status));
  const emptyState = {
    pending: { title: "No booking requests", body: "New requests and payments awaiting action will appear here." },
    upcoming: { title: "No upcoming sessions", body: "Confirmed sessions will appear here once they are booked." },
    completed: { title: "No completed bookings", body: "Finished and closed bookings will appear here." },
  }[tab];
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
    const upcoming = dated
      .filter(
        (b) =>
          b._date &&
          b._date >= today &&
          [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.COMPLETION_PENDING, BOOKING_STATUS.PENDING].includes(b.status)
      )
      .sort((a, b) => a._date - b._date);
    return upcoming[0] || null;
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

  const renderBookingCard = (b, i) => {
    const cn = clientNameFor(b);
    const detailScreen = b.status === BOOKING_STATUS.PENDING
      ? "coach-booking-detail"
      : b.status === BOOKING_STATUS.AWAITING_PAYMENT
        ? "booking-awaiting-payment"
        : "coach-session-detail";
    return (
    <Card
      key={b.id}
      ariaLabel={`Open ${b.service} booking with ${cn.name}`}
      onClick={() => nav(detailScreen, { id: b.id })}
      style={{
        marginBottom: isDesktop || isTablet ? 0 : 12,
        padding: isDesktop ? 24 : 16,
        borderRadius: isDesktop ? 20 : 16,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        cursor: "pointer",
        ...(i !== undefined ? { animationDelay: `${Math.min(i, 8) * 45}ms` } : {}),
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar name={cn.name} size={isDesktop ? 48 : 44} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, minWidth: 0 }}>
              <div style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: isDesktop ? 17 : T.bodyLg, fontWeight: 700, color: C.jet, ...fDisplay }}>{cn.name}</div>
              {cn.handle && <HandleTag handle={cn.handle} size={11.5} color={C.slateLight} />}
            </div>
            <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: isDesktop ? 14.5 : T.body, fontWeight: 600, color: C.brand, marginTop: 2, ...fBody }}>{b.service}</div>
          </div>
          <ChevronRight size={17} color={C.slateLight} style={{ flexShrink: 0 }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: isDesktop ? 13.5 : T.captionLg, color: C.slate, marginTop: 10, lineHeight: 1.35, ...fBody }}>
          <Clock size={13} color={C.brand} /> {b.date} · {b.time}
        </div>
        <div style={{ fontSize: isDesktop ? 12.5 : T.caption, color: C.slateLight, marginTop: 2, ...fBody }}>{b.mode}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
        <StatusPill status={b.status} perspective="coach" />
        {b.status === BOOKING_STATUS.COMPLETED && (
          <span style={{ fontSize: isDesktop ? 13 : T.label, color: C.success, fontWeight: 600, textAlign: "right", ...fBody }}>
            ${Math.round(b.price * (1 - CONFIG.commissionRate))} payout
          </span>
        )}
      </div>
    </Card>
    );
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>
      <div style={{ padding: isDesktop ? "40px 64px 0" : "18px 18px 0", width: "100%", boxSizing: "border-box" }}>
        <ScreenHeader
          title="Client Bookings & Requests"
          subtitle={view === "list" ? "Review incoming booking requests, manage confirmed sessions, and monitor completed appointments." : "Interactive schedule and session timeline."}
          action={<ViewModeToggle value={view} onChange={setView} ariaLabel="Booking view" />}
          style={{ marginBottom: 20 }}
        />
        
        {view === "list" && (
          <div style={{ width: "100%", maxWidth: "100%", marginBottom: 8 }}>
            <SegTabs value={tab} onChange={setTab} items={[
              { value: "pending", label: `Requests (${coachBookings.filter((b) => [BOOKING_STATUS.PENDING, BOOKING_STATUS.AWAITING_PAYMENT].includes(b.status)).length})` },
              { value: "upcoming", label: `Upcoming (${coachBookings.filter((b) => [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.COMPLETION_PENDING].includes(b.status)).length})` },
              { value: "completed", label: `Completed (${coachBookings.filter((b) => [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.DECLINED, BOOKING_STATUS.EXPIRED, BOOKING_STATUS.CANCELLED].includes(b.status)).length})` },
            ]} />
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto", width: "100%", padding: isDesktop ? "24px 64px 64px" : "14px 18px 0", paddingBottom: 116, boxSizing: "border-box" }} className="cl-hide-scrollbar">
        {view === "list" && (
          <>
            {loading ? (
              <BookingCardSkeleton rows={4} />
            ) : (
              <>
                {list.length === 0 && <EmptyState icon={ClipboardList} title={emptyState.title} body={emptyState.body} />}
                <div
                  style={{
                    display: isDesktop || isTablet ? "grid" : "block",
                    gridTemplateColumns: isDesktop ? "repeat(3, minmax(0, 1fr))" : isTablet ? "repeat(2, minmax(0, 1fr))" : undefined,
                    gap: isDesktop ? 20 : 16,
                  }}
                  className="cl-stagger"
                >
                  {list.map((b, i) => renderBookingCard(b, i))}
                </div>
              </>
            )}
          </>
        )}
        {view === "calendar" && (
          <div
            style={{
              display: isDesktop ? "grid" : "block",
              gridTemplateColumns: isDesktop ? "minmax(0, 1.65fr) minmax(360px, 1fr)" : undefined,
              gap: isDesktop ? 28 : 20,
              alignItems: "start",
              width: "100%",
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
                    <span style={{ fontSize: isDesktop ? 17.5 : 16, fontWeight: 750, color: C.jet, ...fDisplay }}>
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
                                      const cn = clientNameFor(b);
                                      return (
                                        <div
                                          key={b.id}
                                          title={`${b.time} · ${b.service} (${cn.name})`}
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
                                              fontWeight: 800,
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
                                          fontWeight: 750,
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
                                      const cn = clientNameFor(b);
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

                                      const detailScreen = b.status === BOOKING_STATUS.PENDING
                                        ? "coach-booking-detail"
                                        : b.status === BOOKING_STATUS.AWAITING_PAYMENT
                                          ? "booking-awaiting-payment"
                                          : "coach-session-detail";

                                      return (
                                        <div
                                          key={b.id}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedDate(d);
                                            nav(detailScreen, { id: b.id });
                                          }}
                                          title={`${b.time} · ${b.service} (${cn.name}) - ${b.status}`}
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
                                            <span style={{ fontSize: 9, fontWeight: 800, color: toneText, lineHeight: 1, ...fDisplay }}>
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
                                            {cn.name}
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
                      Scheduled session
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: C.slate, ...fBody }}>
                      <span style={{ width: 8, height: 8, borderRadius: 99, background: C.brand }} />
                      Today
                    </span>
                  </div>
                  <span style={{ fontSize: 11.5, color: C.slateLight, ...fBody }}>
                    Click a day to view bookings
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
                    <div style={{ fontSize: 10.5, fontWeight: 750, color: C.brand, textTransform: "uppercase", letterSpacing: 0.4, ...fBody }}>
                      Next Upcoming Session
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.jet, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", ...fDisplay }}>
                      {nextUpcomingBooking.date} · {nextUpcomingBooking.time} ({clientNameFor(nextUpcomingBooking).name})
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
                    <h3 style={{ fontSize: isDesktop ? 18 : 16, fontWeight: 750, color: C.jet, margin: 0, ...fDisplay }}>
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
                    body={`You don't have any bookings on ${selectedDate.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}.`}
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
                        Jump to next booking ({nextUpcomingBooking.date})
                      </Btn>
                    </div>
                  )}
                </Card>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }} className="cl-stagger">
                  {bookingsOnDate(selectedDate).map((b, i) => renderBookingCard(b, i))}
                </div>
              )}

              </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ScreenCoachBookingDetail({
  nav, goBack, params, coachBookings = [], respondBooking, sendPaymentReminder,
  expireAwaitingPayment, rescheduleBooking, toast, sessionDisputes = [], additionalCharges = [],
}) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const { isDesktop } = useResponsive();
  const booking = coachBookings.find((b) => b.id === params?.id);
  const [responding, setResponding] = useState(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  if (!booking) return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar title="Session details" onBack={() => goBack("coach-bookings")} />
      <EmptyState icon={ClipboardList} title="Booking not found" body="This booking may have been removed." />
    </div>
  );

  const relatedCase = sessionDisputes.find((item) => item.bookingId === booking.id);
  const acceptanceCharges = additionalCharges.filter((item) => (
    item.bookingId === booking.id
    && item.phase === ADDITIONAL_CHARGE_PHASE.ACCEPTANCE
    && ![ADDITIONAL_CHARGE_STATUS.CANCELLED, ADDITIONAL_CHARGE_STATUS.DECLINED].includes(item.status)
  ));
  const completionCharge = additionalCharges.find((item) => (
    item.bookingId === booking.id
    && item.phase === ADDITIONAL_CHARGE_PHASE.COMPLETION
    && item.status !== ADDITIONAL_CHARGE_STATUS.CANCELLED
  ));
  const requiredAcceptanceTotal = acceptanceCharges
    .filter((item) => item.kind === ADDITIONAL_CHARGE_KIND.REQUIRED)
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const completionConfirmations = booking.completionConfirmations || (booking.completionConfirmedBy ? [booking.completionConfirmedBy] : []);
  const coachConfirmedCompletion = completionConfirmations.includes("coach");

  const titleByStatus = {
    [BOOKING_STATUS.PENDING]: "Booking request",
    [BOOKING_STATUS.AWAITING_PAYMENT]: "Waiting for payment",
    [BOOKING_STATUS.CONFIRMED]: "Upcoming session",
    [BOOKING_STATUS.IN_PROGRESS]: "Live session",
    [BOOKING_STATUS.COMPLETION_PENDING]: "Finishing up",
    [BOOKING_STATUS.COMPLETED]: "Completed session",
    [BOOKING_STATUS.DECLINED]: "Declined request",
    [BOOKING_STATUS.EXPIRED]: "Expired request",
    [BOOKING_STATUS.CANCELLED]: "Cancelled session",
  };
  const profile = CLIENT_PROFILES[booking.clientName] || { memberSince: "-", totalSessions: 0, homeSuburb: "-", notes: "", verifiedPayment: true };
  const cn = clientNameFor(booking);
  const hasThread = !!BOOKING_ENQUIRY_MESSAGES[booking.id];
  const detailRoute = booking.status === BOOKING_STATUS.PENDING
    ? "coach-booking-detail"
    : booking.status === BOOKING_STATUS.AWAITING_PAYMENT
      ? "booking-awaiting-payment"
      : "coach-session-detail";

  const respond = (status) => {
    if (booking.status !== BOOKING_STATUS.PENDING) {
      toast("This request has already been handled");
      nav("coach-bookings");
      return;
    }
    setResponding(status);
    setTimeout(() => {
      respondBooking(booking.id, status);
      toast(status === BOOKING_STATUS.AWAITING_PAYMENT ? "Accepted - payment requested" : "Booking declined");
      nav("coach-bookings");
    }, 600);
  };

  const remindClient = () => {
    if (sendPaymentReminder?.(booking.id)) toast("Payment reminder sent");
  };

  const releaseSlot = () => {
    if (expireAwaitingPayment?.(booking.id)) {
      toast("Acceptance withdrawn and slot released");
      nav("coach-bookings");
    }
  };

  const saveReschedule = (when) => {
    rescheduleBooking?.(booking.id, when, "coach");
    setRescheduleOpen(false);
    toast(`Session moved to ${when.date}, ${when.time}`);
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", position: "relative", background: C.bg }}>
      <style>{`
        @media (min-width: 860px) {
          .coach-booking-detail-split {
            display: grid !important;
            grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr) !important;
            width: 100% !important;
            gap: 28px !important;
          }
        }
      `}</style>
      <TopBar title={titleByStatus[booking.status] || "Session Details"} onBack={() => goBack("coach-bookings")} right={<StatusPill status={booking.status} perspective="coach" />} />
      <div style={{ flex: 1, overflowY: "auto", padding: isDesktop ? "32px 64px 64px" : "20px 18px 100px", width: "100%", boxSizing: "border-box" }} className="cl-hide-scrollbar">
        <div className="coach-booking-detail-split">
          {/* Left Column: Client Profile & Session Details */}
          <div>
            <Card style={{ marginBottom: 16, padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Avatar name={cn.name} size={54} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: T.title, fontWeight: 750, color: C.jet, ...fDisplay }}>{cn.name}</div>
                  {cn.handle && <HandleTag handle={cn.handle} size={11.5} color={C.slateLight} />}
                  {profile.homeSuburb && profile.homeSuburb !== "-" && (
                    <div style={{ fontSize: T.body, color: C.slate, marginTop: 4, ...fBody }}>📍 {profile.homeSuburb}</div>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: 32, marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                <div>
                  <div style={{ fontSize: T.title, fontWeight: 750, color: C.jet, ...fDisplay }}>{profile.totalSessions}</div>
                  <div style={{ fontSize: T.captionLg, color: C.slate, ...fBody }}>Sessions with you</div>
                </div>
                <div>
                  <div style={{ fontSize: T.title, fontWeight: 750, color: C.jet, ...fDisplay }}>{profile.memberSince}</div>
                  <div style={{ fontSize: T.captionLg, color: C.slate, ...fBody }}>Client since</div>
                </div>
              </div>
              {profile.notes && (
                <div style={{ display: "flex", gap: 8, marginTop: 14, background: C.fog, borderRadius: 12, padding: 12 }}>
                  <Info size={15} color={C.brand} style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: T.body, color: C.slate, lineHeight: 1.55, ...fBody }}>{profile.notes}</span>
                </div>
              )}
            </Card>

            <SectionLabel>Session Overview</SectionLabel>
            <Card style={{ marginBottom: 16, padding: "16px 18px", marginTop: 8 }}>
              <Row label="Service" value={booking.service} />
              <Row label="Date" value={booking.date} />
              <Row label="Time" value={booking.time} />
              <Row label="Format" value={booking.mode} />
              {booking.paidTotal ? (
                <>
                  <Row label="Package price" value={`$${Number(booking.price).toFixed(2)}`} />
                  {Number(booking.acceptanceChargeTotal || 0) > 0 && <Row label="Accepted extras" value={`$${Number(booking.acceptanceChargeTotal).toFixed(2)}`} />}
                  <Row label="Session total value" value={`$${Number(booking.paidTotal).toFixed(2)}`} bold last />
                </>
              ) : <Row label="Session total value" value={`$${Number(booking.price).toFixed(2)}`} bold last />}
            </Card>

            {booking.notes && (
              <>
                <SectionLabel>Message from Client</SectionLabel>
                <Card style={{ marginBottom: 16, marginTop: 8, padding: 16, background: C.white }}>
                  <p style={{ margin: 0, fontSize: T.body, color: C.slate, lineHeight: 1.6, whiteSpace: "pre-line", ...fBody }}>{booking.notes}</p>
                </Card>
              </>
            )}

            {booking.safetyNotes && (
              <>
                <SectionLabel>Health & Safety Notes</SectionLabel>
                <Card style={{ marginBottom: 16, marginTop: 8, display: "flex", alignItems: "flex-start", gap: 10, background: C.warnTint, padding: 16 }}>
                  <ShieldCheck size={18} color={C.warnStrong} style={{ flexShrink: 0, marginTop: 2 }} />
                  <p style={{ margin: 0, fontSize: T.body, color: C.jet, lineHeight: 1.6, whiteSpace: "pre-line", ...fBody }}>{booking.safetyNotes}</p>
                </Card>
              </>
            )}
          </div>

          {/* Right Column: Payment Status, Timeline & Direct Chat */}
          <div>
            {booking.status === BOOKING_STATUS.AWAITING_PAYMENT && (
              <div style={{ marginBottom: 16 }}>
                <PaymentDeadlineCard booking={booking} role="coach">
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn full size="sm" icon={BellRing} disabled={booking.paymentReminderSent} onClick={remindClient}>
                      {booking.paymentReminderSent ? "Reminder sent" : "Send reminder"}
                    </Btn>
                    <Btn size="sm" variant="outline" icon={MessageCircle} ariaLabel={`Message ${cn.name}`} title={`Message ${cn.name}`} onClick={() => nav("chat-thread", { name: booking.clientName, bookingId: booking.id, backTo: detailRoute, backParams: { id: booking.id } })} />
                  </div>
                </PaymentDeadlineCard>
                {acceptanceCharges.length > 0 && (
                  <Card style={{ marginTop: 10, padding: 16, background: darkMode ? C.white : C.brandTint, border: darkMode ? `1px solid ${C.border}` : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: T.bodyLg, fontWeight: 700, color: C.jet, ...fBody }}>Payment sent for review</div>
                        <div style={{ fontSize: T.captionLg, color: C.slate, marginTop: 3, ...fBody }}>{acceptanceCharges.filter((item) => item.kind === ADDITIONAL_CHARGE_KIND.REQUIRED).length} required · {acceptanceCharges.filter((item) => item.kind === ADDITIONAL_CHARGE_KIND.OPTIONAL).length} optional</div>
                      </div>
                      <div style={{ fontSize: T.title, fontWeight: 780, color: C.jet, ...fDisplay }}>${(Number(booking.price) + requiredAcceptanceTotal).toFixed(2)}</div>
                    </div>
                    <div style={{ fontSize: T.caption, color: C.slateLight, lineHeight: 1.45, ...fBody }}>Optional add-ons are added only if the client selects them.</div>
                  </Card>
                )}
              </div>
            )}

            {[BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.COMPLETION_PENDING].includes(booking.status) && (
              <Card style={{ marginBottom: 16, display: "flex", gap: 12, alignItems: "flex-start", background: C.successTint, border: "none", padding: 16 }}>
                <LockKeyhole size={20} color={C.success} style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: T.bodyLg, fontWeight: 700, color: C.jet, ...fBody }}>${Number(booking.paidTotal || booking.price).toFixed(2)} Secured in Escrow</div>
                  <div style={{ fontSize: T.captionLg, color: C.slate, lineHeight: 1.55, marginTop: 3, ...fBody }}>Funds are safely held by CoachNivo and automatically released upon session completion.</div>
                </div>
              </Card>
            )}

            <div style={{ marginBottom: 16 }}>
              <SectionLabel>Session Journey Timeline</SectionLabel>
              <div style={{ marginTop: 8 }}>
                <SessionJourneyTimeline booking={booking} role="coach" />
              </div>
            </div>

            {relatedCase && (
              <Card style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12, background: C.warnTint, border: "none", padding: 16 }} onClick={() => nav("dispute-status", { caseId: relatedCase.id, role: "coach", backTo: detailRoute, bookingId: booking.id })}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: C.brandTint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Scale size={18} color={C.brand} /></div>
                <div style={{ flex: 1 }}><div style={{ fontSize: T.bodyLg, fontWeight: 700, color: C.jet, ...fBody }}>{relatedCase.status === "resolved" ? "Case decision available" : "Session report under review"}</div><div style={{ fontSize: T.captionLg, color: C.slate, marginTop: 2, ...fBody }}>{relatedCase.categoryLabel} · View financial outcome</div></div>
                <ChevronRight size={16} color={C.slateLight} />
              </Card>
            )}

            {completionCharge && (
              <Card style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12, padding: 16 }} onClick={() => nav("additional-charge-review", { chargeId: completionCharge.id, role: "coach", backTo: detailRoute })}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: C.brandTint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><BadgeDollarSign size={18} color={C.brand} /></div>
                <div style={{ flex: 1 }}><div style={{ fontSize: T.bodyLg, fontWeight: 700, color: C.jet, ...fBody }}>Final payment · ${Number(completionCharge.amount).toFixed(2)}</div><div style={{ fontSize: T.captionLg, color: C.slate, marginTop: 2, ...fBody }}>{completionCharge.reason} · {completionCharge.status === ADDITIONAL_CHARGE_STATUS.PENDING ? "Waiting for client" : completionCharge.status.replace("_", " ")}</div></div>
                <ChevronRight size={16} color={C.slateLight} />
              </Card>
            )}

            <SectionLabel>{booking.status === BOOKING_STATUS.PENDING ? "Client Coordination" : "Direct Messaging"}</SectionLabel>
            <Card style={{ marginBottom: 16, marginTop: 8, display: "flex", alignItems: "center", gap: 14, padding: 16 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: C.brandTint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <MessagesSquare size={18} color={C.brand} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: T.bodyLg, fontWeight: 700, color: C.jet, ...fBody }}>Chat with {cn.name.split(" ")[0]}</div>
                <div style={{ fontSize: T.captionLg, color: C.slate, marginTop: 2, ...fBody }}>{hasThread ? "Resume existing chat thread" : "Discuss training goals & location"}</div>
              </div>
              <Btn size="sm" variant="secondary" icon={MessageCircle} onClick={() => nav("chat-thread", { name: booking.clientName, context: `${booking.service} · ${booking.date}`, bookingId: booking.id, backTo: detailRoute, backParams: { id: booking.id } })}>Open Chat</Btn>
            </Card>

            {booking.status === BOOKING_STATUS.COMPLETED && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                <Btn full icon={Banknote} onClick={() => nav("funds-release-status", { bookingId: booking.id, role: "coach", backTo: "coach-session-detail" })}>View Payout Release Status</Btn>
                {!relatedCase && <Btn full variant="ghost" icon={Scale} onClick={() => nav("dispute-create", { bookingId: booking.id, role: "coach", category: "client_no_show", backTo: "coach-session-detail" })}>Report an Issue</Btn>}
              </div>
            )}

            {![BOOKING_STATUS.PENDING, BOOKING_STATUS.COMPLETED].includes(booking.status) && (
              <button onClick={() => nav("support", { presetTab: "faq", faqTopic: "coach", bookingId: booking.id, backTo: detailRoute })} style={{ width: "100%", minHeight: 44, marginTop: 10, border: "none", background: "transparent", display: "flex", gap: 8, alignItems: "center", justifyContent: "center", color: C.slate, cursor: "pointer", fontSize: T.body, fontWeight: 600, ...fBody }}>
                <LifeBuoy size={16} /> Need help with this session?
              </button>
            )}
          </div>
        </div>
      </div>

      {booking.status === BOOKING_STATUS.PENDING && (
        <BottomActionBar equal>
          <Btn full variant="outline" loading={responding === BOOKING_STATUS.DECLINED} onClick={() => respond(BOOKING_STATUS.DECLINED)}>Decline</Btn>
          <Btn full variant="primary" loading={responding === BOOKING_STATUS.AWAITING_PAYMENT} onClick={() => respond(BOOKING_STATUS.AWAITING_PAYMENT)}>Review & accept</Btn>
        </BottomActionBar>
      )}

      {booking.status === BOOKING_STATUS.AWAITING_PAYMENT && (
        <BottomActionBar equal>
          <Btn full variant="outline" icon={Clock} onClick={remindClient}>Send reminder</Btn>
          <Btn full variant="danger" icon={X} onClick={releaseSlot}>Withdraw & release</Btn>
        </BottomActionBar>
      )}

      {booking.status === BOOKING_STATUS.CONFIRMED && (
        <BottomActionBar equal>
          <Btn full variant="outline" icon={CalendarClock} onClick={() => setRescheduleOpen(true)}>Reschedule</Btn>
          <Btn full variant="primary" icon={PlayCircle} onClick={() => nav("session-active", { bookingId: booking.id, role: "coach", backTo: "coach-session-detail" })}>Start session</Btn>
        </BottomActionBar>
      )}

      {booking.status === BOOKING_STATUS.IN_PROGRESS && (
        <BottomActionBar equal>
          <Btn full variant="primary" icon={PlayCircle} onClick={() => nav("session-active", { bookingId: booking.id, role: "coach", backTo: "coach-session-detail" })}>Return to Active Session</Btn>
        </BottomActionBar>
      )}

      {booking.status === BOOKING_STATUS.COMPLETION_PENDING && (
        <BottomActionBar equal>
          <Btn full variant="primary" icon={CheckCircle2} onClick={() => nav("session-summary-receipt", { bookingId: booking.id, role: "coach", backTo: "coach-session-detail" })}>Review & Complete</Btn>
        </BottomActionBar>
      )}

      <BottomSheet open={rescheduleOpen} onClose={() => setRescheduleOpen(false)} title="Propose new session time">
        <div style={{ fontSize: T.captionLg, color: C.slate, marginBottom: 14, ...fBody }}>Choose from your available upcoming slots to suggest to {booking.clientName}:</div>
        {[
          { date: "Sat, 22 Aug", time: "8:00am" },
          { date: "Tue, 25 Aug", time: "6:00am" },
        ].map((when) => (
          <button key={`${when.date}-${when.time}`} onClick={() => saveReschedule(when)} style={{ width: "100%", minHeight: 58, marginBottom: 9, padding: "11px 13px", borderRadius: 14, border: `1px solid ${C.border}`, background: C.white, display: "flex", alignItems: "center", gap: 11, cursor: "pointer", textAlign: "left" }}>
            <div style={{ width: 36, height: 36, borderRadius: 11, background: C.brandTint, display: "flex", alignItems: "center", justifyContent: "center" }}><CalendarClock size={17} color={C.brand} /></div>
            <div>
              <div style={{ fontSize: T.body, color: C.jet, fontWeight: 700, ...fBody }}>{when.date}</div>
              <div style={{ fontSize: T.captionLg, color: C.slate, marginTop: 2, ...fBody }}>{when.time} · Available</div>
            </div>
            <ChevronRight size={16} color={C.slateLight} style={{ marginLeft: "auto" }} />
          </button>
        ))}
      </BottomSheet>
    </div>
  );
}
