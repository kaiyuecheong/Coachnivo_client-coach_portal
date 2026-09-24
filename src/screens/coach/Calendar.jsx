import React, { useState, useMemo, useEffect } from "react";
import {
  Calendar as CalendarIcon, Trash2, Plus, Clock, ChevronLeft, ChevronRight,
  Ban, CheckCircle2, AlertCircle, CalendarDays, Sparkles, X, ShieldAlert,
  ExternalLink, User,
} from "lucide-react";
import { CL, CD, fDisplay, fBody, T } from "../../theme/theme";
import {
  Card, ScreenHeader, SectionLabel, Btn, ConfirmDialog, Toggle, Chip,
  EmptyState, SegTabs, Avatar, StatusPill, Badge, ViewModeToggle,
} from "../../components/ui/Primitives";
import { Dialog } from "../../components/layout/Dialog";
import { useApp } from "../../context/AppContext";
import { BOOKING_STATUS } from "../../data/bookings";
import { useResponsive } from "../../theme/responsive";

const DAY_OPTIONS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DOW_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// "14:30" -> "2:30 PM"
function to12h(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m || 0).padStart(2, "0")} ${period}`;
}

function parseBookingDate(str, year = 2026) {
  if (!str) return null;
  const m = /(\d{1,2})\s+([A-Za-z]{3})/.exec(str || "");
  if (!m) return null;
  const month = MONTH_ABBR.indexOf(m[2]);
  if (month < 0) return null;
  return new Date(year, month, parseInt(m[1], 10));
}

function sameDay(a, b) {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function addDays(d, n) {
  const r = new Date(d);
  r.setDate(d.getDate() + n);
  return r;
}

function startOfWeek(d) {
  const dow = (d.getDay() + 6) % 7;
  return addDays(d, -dow);
}

function formatDateShort(d) {
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

function formatDateISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

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
    for (let i = 0; i < 7; i++) {
      row.push(cur);
      cur = addDays(cur, 1);
    }
    weeks.push(row);
  }
  return weeks;
}

function parseCalendarBadge(dateStr) {
  if (!dateStr) return { weekday: "-", dayNumber: "-" };
  const str = String(dateStr).trim();
  const dayMatch = str.match(/\b([0-3]?\d)\b/);
  const dayNumber = dayMatch ? dayMatch[1] : "-";
  const weekdayMatch = str.match(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*/i);
  if (weekdayMatch) {
    return { weekday: weekdayMatch[1].slice(0, 3).toUpperCase(), dayNumber };
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const dows = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    return { weekday: dows[parsed.getDay()], dayNumber: String(parsed.getDate()) };
  }
  const alpha = str.match(/[a-zA-Z]{3}/);
  return { weekday: alpha ? alpha[0].toUpperCase() : "-", dayNumber };
}

export function ScreenCoachCalendar({
  nav, toast, coachPackages = [], availabilityBlocks = [], setAvailabilityBlocks, coachBookings = [],
}) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const { isDesktop, isTablet } = useResponsive();

  const [section, setSection] = useState("schedule"); // "schedule" | "availability"
  const [view, setView] = useState("list"); // "list" | "calendar"
  const [calMode, setCalMode] = useState("month"); // "month" | "week"
  const [synced, setSynced] = useState(true);

  // One-off exceptions (dates blocked out)
  const [exceptions, setExceptions] = useState([
    { id: "e1", date: "Sat, 2 Aug", iso: "2026-08-02", reason: "Personal leave" },
  ]);

  // Modal dialog states for Add Availability & Add Exception
  const [showAddAvailModal, setShowAddAvailModal] = useState(false);
  const [showAddExModal, setShowAddExModal] = useState(false);
  const [removalTarget, setRemovalTarget] = useState(null);

  // Form states for Add Availability
  const [availDays, setAvailDays] = useState(["Mon"]);
  const [availStart, setAvailStart] = useState("09:00");
  const [availEnd, setAvailEnd] = useState("17:00");
  const [availPkgIds, setAvailPkgIds] = useState([]);

  // Form states for Add Exception
  const [exDateInput, setExDateInput] = useState("");
  const [exReasonInput, setExReasonInput] = useState("");

  // Dated bookings
  const datedBookings = useMemo(() => {
    return coachBookings.map((b) => ({ ...b, _date: parseBookingDate(b.date) }));
  }, [coachBookings]);

  const scheduledSessions = useMemo(() => {
    return datedBookings.filter((b) =>
      [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.COMPLETION_PENDING].includes(b.status)
    );
  }, [datedBookings]);

  // Calendar dates navigation
  const initialDate = useMemo(() => {
    return (datedBookings.find((b) => b._date)?._date) || new Date();
  }, [datedBookings]);

  const [cursor, setCursor] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState(initialDate);

  const monthWeeks = useMemo(() => buildMonthGrid(cursor), [cursor]);
  const headerLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const weekRow = useMemo(() => {
    const start = startOfWeek(selectedDate || cursor);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selectedDate, cursor]);

  const isToday = (d) => sameDay(d, new Date());
  const goPrev = () => {
    if (calMode === "month") {
      setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1));
    } else {
      setSelectedDate((d) => addDays(d, -7));
      setCursor((c) => addDays(c, -7));
    }
  };
  const goNext = () => {
    if (calMode === "month") {
      setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1));
    } else {
      setSelectedDate((d) => addDays(d, 7));
      setCursor((c) => addDays(c, 7));
    }
  };
  const goToday = () => {
    const now = new Date();
    setCursor(now);
    setSelectedDate(now);
  };

  // Helper matching functions
  const blocksForDate = (d) => availabilityBlocks.filter((b) => b.days.includes(DOW_ABBR[d.getDay()]));
  const exceptionForDate = (d) => {
    const short = formatDateShort(d);
    const iso = formatDateISO(d);
    return exceptions.find((ex) => ex.date === short || ex.iso === iso);
  };
  const bookingsOnDate = (d) => datedBookings.filter((b) => b._date && sameDay(b._date, d));

  const selectedBlocks = blocksForDate(selectedDate);
  const selectedException = exceptionForDate(selectedDate);
  const selectedDayBookings = bookingsOnDate(selectedDate);

  // Time slots for week view
  const weekSlotRange = useMemo(() => {
    let minHour = 6;
    let maxHour = 20;
    availabilityBlocks.forEach((b) => {
      const s = parseTimeSlotHour(b.start);
      const e = parseTimeSlotHour(b.end);
      if (s && s.hour < minHour) minHour = Math.max(0, s.hour);
      if (e && e.hour > maxHour) maxHour = Math.min(23, e.hour);
    });
    datedBookings.forEach((b) => {
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
  }, [availabilityBlocks, datedBookings]);

  // Handlers for Add Availability Modal
  const openAddAvailability = (targetDate) => {
    const dateToUse = targetDate || selectedDate || new Date();
    const dayName = DOW_ABBR[dateToUse.getDay()];
    setAvailDays([dayName]);
    setAvailStart("08:00");
    setAvailEnd("17:00");
    setAvailPkgIds(coachPackages.map((p) => p.id));
    setShowAddAvailModal(true);
  };

  const toggleAvailDay = (d) => {
    setAvailDays((a) => (a.includes(d) ? a.filter((x) => x !== d) : [...a, d]));
  };
  const toggleAvailPkg = (id) => {
    setAvailPkgIds((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  };

  const handleSaveAvailability = () => {
    if (availDays.length === 0) { toast("Pick at least one day of the week"); return; }
    if (!availStart || !availEnd) { toast("Set a valid start and end time"); return; }
    if (availStart >= availEnd) { toast("End time must be after start time"); return; }
    if (availPkgIds.length === 0 && coachPackages.length > 0) {
      toast("Select at least one package for this availability slot"); return;
    }

    const newBlock = {
      id: "ab_" + Date.now(),
      days: [...availDays],
      start: availStart,
      end: availEnd,
      packageIds: availPkgIds.length > 0 ? [...availPkgIds] : coachPackages.map((p) => p.id),
    };

    setAvailabilityBlocks((prev) => [...prev, newBlock]);
    toast(`Availability added for ${availDays.join(", ")} (${to12h(availStart)} - ${to12h(availEnd)})`);
    setShowAddAvailModal(false);
  };

  // Handlers for Add Exception Modal
  const openAddException = (targetDate) => {
    const dateToUse = targetDate || selectedDate || new Date();
    setExDateInput(formatDateISO(dateToUse));
    setExReasonInput("");
    setShowAddExModal(true);
  };

  const handleSaveException = () => {
    if (!exDateInput) { toast("Pick a date to block out"); return; }
    const parts = exDateInput.split("-");
    const dObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const shortDate = formatDateShort(dObj);
    const reasonText = exReasonInput.trim() || "Personal leave";

    const newEx = {
      id: "ex_" + Date.now(),
      date: shortDate,
      iso: exDateInput,
      reason: reasonText,
    };

    setExceptions((prev) => [...prev, newEx]);
    toast(`Exception added: ${shortDate} is now blocked (${reasonText})`);
    setShowAddExModal(false);
  };

  // Handlers for Deletion & Confirmation
  const removeBlock = (id) => {
    setAvailabilityBlocks((prev) => prev.filter((b) => b.id !== id));
    toast("Availability slot removed");
  };

  const removeException = (id) => {
    setExceptions((prev) => prev.filter((e) => e.id !== id));
    toast("Exception removed. Date unblocked.");
  };

  const confirmRemoval = () => {
    if (removalTarget?.type === "availability") removeBlock(removalTarget.id);
    if (removalTarget?.type === "exception") removeException(removalTarget.id);
    setRemovalTarget(null);
  };

  const packageName = (id) => coachPackages.find((p) => p.id === id)?.name || "Package";

  const timeInputStyle = {
    width: "100%",
    border: `1.5px solid ${C.border}`,
    borderRadius: 13,
    padding: "10px 12px",
    fontSize: T.bodyLg,
    outline: "none",
    boxSizing: "border-box",
    color: C.jet,
    background: C.white,
    ...fBody,
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Top Header & Section Controls */}
      <div style={{ padding: isDesktop ? "40px 64px 0" : "18px 18px 0", width: "100%", boxSizing: "border-box" }}>
        <div style={{ marginBottom: 16 }}>
          <ScreenHeader
            title="Calendar & Availability"
            subtitle="Manage your bookable hours, exceptions, and live client sessions."
            style={{ marginBottom: 0 }}
          />
        </div>

        {/* Top Tab Switcher */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: isDesktop ? 12 : 16, marginBottom: isDesktop ? 14 : 18 }}>
          <div style={{ width: isDesktop ? "auto" : "100%", minWidth: isDesktop ? 260 : "100%" }}>
            <SegTabs
              value={section}
              onChange={setSection}
              items={[
                { value: "schedule", label: `Schedule (${scheduledSessions.length})` },
                { value: "availability", label: "Availability" },
              ]}
            />
          </div>

          {section === "availability" && (
            <div style={{ width: isDesktop ? "auto" : "100%", display: "flex", alignItems: "center", gap: 10 }}>
              <SegTabs
                style={{ width: isDesktop ? "fit-content" : "100%", minWidth: isDesktop ? 230 : undefined }}
                value={view}
                onChange={setView}
                items={[
                  { value: "list", label: "List View" },
                  { value: "calendar", label: "Calendar View" },
                ]}
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          width: "100%",
          padding: isDesktop ? "24px 64px 64px" : "0 18px",
          paddingBottom: 116,
          boxSizing: "border-box",
        }}
        className="cl-hide-scrollbar"
      >
        {section === "schedule" ? (
          /* =========================================================================
             SCHEDULE VIEW (Confirmed upcoming delivery)
             ========================================================================= */
          <>
            <Card style={{
              marginBottom: 20,
              padding: isDesktop ? 32 : 18,
              borderRadius: isDesktop ? 22 : 16,
              background: darkMode ? C.white : C.jet,
              border: darkMode ? `1px solid ${C.border}` : "none",
            }}>
              <div style={{ fontSize: isDesktop ? 16 : T.captionLg, color: darkMode ? C.slate : C.onDarkMuted, ...fBody }}>Confirmed schedule</div>
              <div style={{ fontSize: isDesktop ? 52 : T.hero, fontWeight: 800, color: darkMode ? C.jet : C.white, marginTop: 4, lineHeight: 1.05, ...fDisplay }}>
                {scheduledSessions.length}
              </div>
              <div style={{ fontSize: isDesktop ? 16 : T.captionLg, color: darkMode ? C.slateLight : C.onDark, marginTop: 4, ...fBody }}>
                upcoming sessions ready to deliver
              </div>
            </Card>

            <SectionLabel>Upcoming sessions</SectionLabel>
            {scheduledSessions.length === 0 ? (
              <EmptyState icon={CalendarIcon} title="Your schedule is clear" body="Confirmed client sessions will appear here once booked." />
            ) : (
              <div
                style={{
                  display: isDesktop || isTablet ? "grid" : "block",
                  gridTemplateColumns: isDesktop ? "repeat(3, minmax(0, 1fr))" : isTablet ? "repeat(2, minmax(0, 1fr))" : undefined,
                  gap: isDesktop ? 20 : 14,
                }}
              >
                {scheduledSessions.map((booking) => {
                  const badge = parseCalendarBadge(booking.date);
                  return (
                    <Card
                      key={booking.id}
                      onClick={() => nav("coach-session-detail", { id: booking.id })}
                      className="cl-card cl-card--interactive"
                      data-interactive="true"
                      style={{
                        marginBottom: isDesktop ? 0 : 10,
                        padding: isDesktop ? 20 : 16,
                        borderRadius: 18,
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
                          <div style={{ width: 48, height: 50, borderRadius: 12, background: C.brandTint, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: "2px" }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: C.brand, textTransform: "uppercase", letterSpacing: 0.4, lineHeight: 1, ...fBody }}>{badge.weekday}</span>
                            <span style={{ fontSize: 18, fontWeight: 800, color: C.jet, marginTop: 2, lineHeight: 1, ...fDisplay }}>{badge.dayNumber}</span>
                          </div>
                          <Avatar name={booking.clientName} size={38} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14.5, fontWeight: 700, color: C.jet, ...fBody, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{booking.clientName}</div>
                            <div style={{ fontSize: 13, color: C.slate, marginTop: 2, ...fBody, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{booking.service}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: C.slateLight, marginTop: 4, ...fBody }}>
                              <Clock size={12} color={C.brand} />
                              {booking.time} · {booking.mode}
                            </div>
                          </div>
                        </div>
                        <div style={{ flexShrink: 0 }}>
                          <StatusPill status={booking.status} perspective="coach" />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        ) : view === "calendar" ? (
          /* =========================================================================
             RICH CALENDAR VIEW (Matching Coach Bookings format)
             ========================================================================= */
          <div
            style={{
              display: isDesktop ? "grid" : "block",
              gridTemplateColumns: isDesktop ? "minmax(0, 1.65fr) minmax(360px, 1fr)" : undefined,
              gap: isDesktop ? 28 : 20,
              alignItems: "start",
              width: "100%",
            }}
          >
            {/* Left Column: Interactive Month/Week Calendar Grid */}
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
                    flexWrap: "wrap",
                    gap: 10,
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

                    {/* Month Cells Grid */}
                    <div style={{ display: "flex", flexDirection: "column", gap: isDesktop ? 6 : 4 }}>
                      {monthWeeks.map((row, ri) => (
                        <div key={ri} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: isDesktop ? 6 : 4 }}>
                          {row.map((d, di) => {
                            const inRange = d.getMonth() === cursor.getMonth();
                            const isSelected = sameDay(d, selectedDate);
                            const isCurToday = isToday(d);
                            const dayEx = exceptionForDate(d);
                            const dayBlocks = blocksForDate(d);
                            const dayBookings = bookingsOnDate(d);

                            const isBlocked = !!dayEx;
                            const isAvailable = !isBlocked && dayBlocks.length > 0;
                            const totalEvents = dayBookings.length + (isBlocked ? 1 : dayBlocks.length);

                            return (
                              <div
                                key={di}
                                onClick={() => setSelectedDate(d)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === "Enter" && setSelectedDate(d)}
                                style={{
                                  minHeight: isDesktop ? 92 : 48,
                                  width: "100%",
                                  borderRadius: 12,
                                  cursor: "pointer",
                                  border: isSelected
                                    ? `2px solid ${C.brand}`
                                    : isBlocked
                                    ? `1px solid ${C.dangerBorder || "rgba(220,38,38,0.3)"}`
                                    : isCurToday
                                    ? `1.5px solid ${C.brand}60`
                                    : `1px solid ${C.border}`,
                                  background: isSelected
                                    ? (darkMode ? "rgba(241,90,41,0.18)" : "#FFF7F4")
                                    : isBlocked
                                    ? (darkMode ? "rgba(220,38,38,0.15)" : "#FEF2F2")
                                    : isAvailable
                                    ? (darkMode ? "rgba(16,185,129,0.08)" : "#F0FDF4")
                                    : inRange
                                    ? C.white
                                    : C.fog,
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "flex-start",
                                  justifyContent: "flex-start",
                                  position: "relative",
                                  padding: isDesktop ? "6px 6px 5px" : "4px 3px",
                                  opacity: inRange ? 1 : 0.42,
                                  boxShadow: isSelected ? "0 4px 14px rgba(241, 90, 41, 0.14)" : "none",
                                  transition: "all 0.15s ease",
                                  textAlign: "left",
                                  boxSizing: "border-box",
                                  overflow: "hidden",
                                }}
                              >
                                {/* Cell Top Row (Day number + badges) */}
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: isDesktop ? 3 : 0 }}>
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
                                      background: isCurToday ? C.brand : "transparent",
                                      color: isCurToday ? "#FFFFFF" : isSelected ? C.brand : inRange ? C.jet : C.slateLight,
                                      lineHeight: 1,
                                      ...fDisplay,
                                    }}
                                  >
                                    {d.getDate()}
                                  </span>

                                  {/* Status indicator dot / icons */}
                                  <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                    {isBlocked && (
                                      <span style={{ width: 6, height: 6, borderRadius: 99, background: C.danger }} title={`Blocked: ${dayEx.reason}`} />
                                    )}
                                    {!isBlocked && isAvailable && (
                                      <span style={{ width: 6, height: 6, borderRadius: 99, background: C.success }} title="Available" />
                                    )}
                                    {dayBookings.length > 0 && (
                                      <span style={{ width: 6, height: 6, borderRadius: 99, background: C.brand }} title={`${dayBookings.length} bookings`} />
                                    )}
                                  </div>
                                </div>

                                {/* Desktop In-Cell Items */}
                                {isDesktop && (
                                  <div style={{ display: "flex", flexDirection: "column", gap: 2.5, width: "100%", marginTop: 2 }}>
                                    {isBlocked && (
                                      <div
                                        title={`Blocked: ${dayEx.reason}`}
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 3,
                                          padding: "2px 4px",
                                          borderRadius: 4,
                                          background: darkMode ? "rgba(220,38,38,0.25)" : "#FEE2E2",
                                          borderLeft: `2.5px solid ${C.danger}`,
                                          fontSize: 9.5,
                                          color: C.danger,
                                          fontWeight: 700,
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                          ...fBody,
                                        }}
                                      >
                                        <Ban size={10} style={{ flexShrink: 0 }} />
                                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                          {dayEx.reason || "Blocked"}
                                        </span>
                                      </div>
                                    )}

                                    {!isBlocked && dayBlocks.slice(0, 1).map((b) => (
                                      <div
                                        key={b.id}
                                        title={`Available: ${to12h(b.start)} - ${to12h(b.end)}`}
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 3,
                                          padding: "2px 4px",
                                          borderRadius: 4,
                                          background: darkMode ? "rgba(16,185,129,0.2)" : "#DCFCE7",
                                          borderLeft: `2.5px solid ${C.success}`,
                                          fontSize: 9.5,
                                          color: C.successDark || "#15803d",
                                          fontWeight: 700,
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                          ...fBody,
                                        }}
                                      >
                                        <Clock size={10} style={{ flexShrink: 0 }} />
                                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                          {to12h(b.start).replace(":00", "").replace(" ", "")}–{to12h(b.end).replace(":00", "").replace(" ", "")}
                                        </span>
                                      </div>
                                    ))}

                                    {dayBookings.slice(0, 1).map((b) => (
                                      <div
                                        key={b.id}
                                        title={`${b.time} · ${b.clientName} (${b.service})`}
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 3,
                                          padding: "2px 4px",
                                          borderRadius: 4,
                                          background: isSelected ? (darkMode ? "rgba(241,90,41,0.28)" : "#FFE8DF") : C.brandTint,
                                          borderLeft: `2.5px solid ${C.brand}`,
                                          fontSize: 9.5,
                                          color: C.brand,
                                          fontWeight: 700,
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                          ...fBody,
                                        }}
                                      >
                                        <span style={{ fontWeight: 800, flexShrink: 0 }}>{b.time?.split(" ")[0]}</span>
                                        <span style={{ color: C.jet, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                          {b.clientName}
                                        </span>
                                      </div>
                                    ))}

                                    {totalEvents > 2 && (
                                      <span style={{ fontSize: 9, fontWeight: 750, color: C.slate, paddingLeft: 2 }}>
                                        +{totalEvents - 2} more
                                      </span>
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
                  /* Weekly Time-Grid Calendar */
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
                        }}
                      >
                        <div style={{ fontSize: 10, fontWeight: 700, color: C.slateLight, textAlign: "center", alignSelf: "center", ...fBody }}>
                          TIME
                        </div>
                        {weekRow.map((d, di) => {
                          const isSelected = sameDay(d, selectedDate);
                          const isCurToday = isToday(d);
                          const isBlocked = !!exceptionForDate(d);
                          return (
                            <div
                              key={di}
                              onClick={() => setSelectedDate(d)}
                              style={{
                                textAlign: "center",
                                cursor: "pointer",
                                padding: "4px 2px",
                                borderRadius: 8,
                                background: isSelected ? C.brandTint : "transparent",
                                transition: "background 0.15s ease",
                              }}
                            >
                              <div style={{ fontSize: 10.5, fontWeight: 700, color: isSelected ? C.brand : C.slate, textTransform: "uppercase", letterSpacing: 0.3, ...fBody }}>
                                {WEEKDAY_HEADERS[di]}
                              </div>
                              <div
                                style={{
                                  fontSize: 14,
                                  fontWeight: isSelected || isCurToday ? 800 : 600,
                                  color: isCurToday ? C.white : isSelected ? C.brand : isBlocked ? C.danger : C.jet,
                                  width: 24,
                                  height: 24,
                                  borderRadius: 99,
                                  background: isCurToday ? C.brand : "transparent",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  marginTop: 2,
                                  ...fDisplay,
                                }}
                              >
                                {d.getDate()}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Week Hourly Slots */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                        {weekSlotRange.map((hour) => (
                          <div
                            key={hour}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "52px repeat(7, minmax(0, 1fr))",
                              gap: 0,
                              minHeight: 48,
                              borderBottom: `1px solid ${C.border}30`,
                            }}
                          >
                            <div
                              style={{
                                fontSize: 10.5,
                                fontWeight: 600,
                                color: C.slateLight,
                                textAlign: "right",
                                paddingRight: 8,
                                paddingTop: 6,
                                ...fBody,
                              }}
                            >
                              {formatHourLabel(hour)}
                            </div>

                            {weekRow.map((d, di) => {
                              const isSelected = sameDay(d, selectedDate);
                              const dayEx = exceptionForDate(d);
                              const dayBlocks = blocksForDate(d);
                              const dayBookings = bookingsOnDate(d);

                              const hourBookings = dayBookings.filter((b) => {
                                const p = parseTimeSlotHour(b.time);
                                return p && p.hour === hour;
                              });

                              const isSlotAvailable = !dayEx && dayBlocks.some((b) => {
                                const s = parseTimeSlotHour(b.start);
                                const e = parseTimeSlotHour(b.end);
                                return s && e && hour >= s.hour && hour < e.hour;
                              });

                              return (
                                <div
                                  key={di}
                                  onClick={() => setSelectedDate(d)}
                                  style={{
                                    borderLeft: `1px solid ${C.border}30`,
                                    background: isSelected
                                      ? (darkMode ? "rgba(241,90,41,0.06)" : "rgba(241,90,41,0.03)")
                                      : dayEx
                                      ? (darkMode ? "rgba(220,38,38,0.06)" : "#FEF2F240")
                                      : isSlotAvailable
                                      ? (darkMode ? "rgba(16,185,129,0.06)" : "#F0FDF460")
                                      : "transparent",
                                    padding: "3px 4px",
                                    cursor: "pointer",
                                    position: "relative",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 2,
                                  }}
                                >
                                  {hourBookings.map((b) => (
                                    <div
                                      key={b.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        nav("coach-session-detail", { id: b.id });
                                      }}
                                      style={{
                                        padding: "3px 6px",
                                        borderRadius: 6,
                                        background: C.brand,
                                        color: "#FFFFFF",
                                        fontSize: 10,
                                        fontWeight: 700,
                                        lineHeight: 1.2,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        boxShadow: "0 2px 6px rgba(241,90,41,0.3)",
                                        ...fBody,
                                      }}
                                    >
                                      {b.clientName}
                                    </div>
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Calendar Legend */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.border}`, justifyContent: "center" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: C.slate, ...fBody }}>
                    <span style={{ width: 8, height: 8, borderRadius: 99, background: C.success }} /> Available Window
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: C.slate, ...fBody }}>
                    <span style={{ width: 8, height: 8, borderRadius: 99, background: C.danger }} /> Blocked / Exception
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: C.slate, ...fBody }}>
                    <span style={{ width: 8, height: 8, borderRadius: 99, background: C.brand }} /> Client Booking
                  </span>
                </div>
              </Card>
            </div>

            {/* Right Column: Selected Day Details & Direct Actions */}
            <div style={{ width: "100%" }}>
              <Card style={{ padding: isDesktop ? "24px 22px" : "18px 16px", borderRadius: 20, marginBottom: 16, display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Day Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 750, color: C.jet, margin: 0, ...fDisplay }}>
                      {selectedDate.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
                    </h3>
                    <div style={{ fontSize: 12.5, color: C.slate, marginTop: 2, ...fBody }}>
                      {selectedException ? "Status: Blocked" : selectedBlocks.length > 0 ? "Status: Bookable" : "Status: Off Schedule"}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {isToday(selectedDate) && <Badge tone="brand">Today</Badge>}
                    {selectedException ? (
                      <Badge tone="danger">Blocked</Badge>
                    ) : selectedBlocks.length > 0 ? (
                      <Badge tone="success">Available</Badge>
                    ) : (
                      <Badge tone="neutral">No slots</Badge>
                    )}
                  </div>
                </div>

                {/* Day Quick Actions */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <Btn
                    variant="outline"
                    size="sm"
                    icon={Plus}
                    onClick={() => openAddAvailability(selectedDate)}
                    style={{ background: C.white }}
                  >
                    Add Availability
                  </Btn>
                  <Btn
                    variant="outline"
                    size="sm"
                    icon={Ban}
                    onClick={() => openAddException(selectedDate)}
                    style={{ color: C.danger, borderColor: C.dangerBorder || C.border, background: C.white }}
                  >
                    Add Exception
                  </Btn>
                </div>

                {/* Blocked Exception Details on Selected Day */}
                {selectedException && (
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: C.danger, marginBottom: 8, ...fDisplay }}>Active Exception</div>
                    <Card style={{ padding: "12px 14px", background: darkMode ? "rgba(220,38,38,0.15)" : "#FEF2F2", border: `1px solid ${C.dangerBorder || "rgba(220,38,38,0.3)"}`, borderRadius: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Ban size={16} color={C.danger} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: C.jet, ...fBody }}>Blocked all day</div>
                            <div style={{ fontSize: 12, color: C.slate, marginTop: 1, ...fBody }}>Reason: {selectedException.reason}</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setRemovalTarget({ type: "exception", id: selectedException.id, label: selectedException.date })}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
                          title="Remove exception"
                        >
                          <Trash2 size={16} color={C.danger} />
                        </button>
                      </div>
                    </Card>
                  </div>
                )}

                {/* Recurring Availability Slots on Selected Day */}
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.jet, marginBottom: 10, ...fDisplay }}>
                    Bookable Time Slots ({selectedBlocks.length})
                  </div>
                  {selectedBlocks.length === 0 && !selectedException && (
                    <div style={{ padding: "14px 12px", background: C.fog, borderRadius: 12, textAlign: "center", fontSize: 12.5, color: C.slate, ...fBody }}>
                      No weekly availability slots on this weekday.
                    </div>
                  )}
                  {selectedBlocks.map((b) => (
                    <Card key={b.id} style={{ padding: "12px 14px", borderRadius: 14, marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <Clock size={14} color={C.brand} />
                            <span style={{ fontSize: 13.5, fontWeight: 700, color: C.jet, ...fBody }}>
                              {to12h(b.start)} – {to12h(b.end)}
                            </span>
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                            {b.packageIds.map((id) => (
                              <Chip key={id} active style={{ fontSize: 11, padding: "2px 8px" }}>
                                {packageName(id)}
                              </Chip>
                            ))}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setRemovalTarget({ type: "availability", id: b.id, label: `${b.days.join(", ")} · ${to12h(b.start)}–${to12h(b.end)}` })}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
                          title="Remove slot"
                        >
                          <Trash2 size={15} color={C.slateLight} />
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Client Sessions on Selected Day */}
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.jet, marginBottom: 10, ...fDisplay }}>
                    Booked Client Sessions ({selectedDayBookings.length})
                  </div>
                  {selectedDayBookings.length === 0 ? (
                    <div style={{ padding: "14px 12px", background: C.fog, borderRadius: 12, textAlign: "center", fontSize: 12.5, color: C.slate, ...fBody }}>
                      No sessions booked for this day yet.
                    </div>
                  ) : (
                    selectedDayBookings.map((b) => (
                      <Card
                        key={b.id}
                        onClick={() => nav("coach-session-detail", { id: b.id })}
                        className="cl-card cl-card--interactive"
                        data-interactive="true"
                        style={{ padding: "12px 14px", borderRadius: 14, marginBottom: 8, cursor: "pointer" }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                            <Avatar name={b.clientName} size={32} />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: C.jet, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...fBody }}>
                                {b.clientName}
                              </div>
                              <div style={{ fontSize: 11.5, color: C.slate, marginTop: 1, ...fBody }}>
                                {b.time} · {b.service}
                              </div>
                            </div>
                          </div>
                          <StatusPill status={b.status} perspective="coach" />
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </Card>

              {/* Sync settings widget */}
              <Card style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderRadius: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <CalendarIcon size={16} color={C.brand} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.jet, ...fBody }}>Sync with device calendar</div>
                    <div style={{ fontSize: 11.5, color: C.slate, ...fBody }}>{synced ? "Connected - Google Calendar" : "Not connected"}</div>
                  </div>
                </div>
                <Toggle label="Sync with device calendar" on={synced} onClick={() => { setSynced((v) => !v); toast(!synced ? "Calendar connected" : "Calendar disconnected"); }} />
              </Card>
            </div>
          </div>
        ) : (
          /* =========================================================================
             LIST VIEW (All weekly slots & exceptions)
             ========================================================================= */
          <>
            <Card style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <CalendarIcon size={17} color={C.jet} />
                <div>
                  <div style={{ fontSize: T.body, fontWeight: 600, color: C.jet, ...fBody }}>Sync with device calendar</div>
                  <div style={{ fontSize: T.caption, color: C.slate, ...fBody }}>{synced ? "Connected - Google Calendar" : "Not connected"}</div>
                </div>
              </div>
              <Toggle label="Sync with device calendar" on={synced} onClick={() => { setSynced((v) => !v); toast(!synced ? "Calendar connected" : "Calendar disconnected"); }} />
            </Card>

            <div style={{ marginBottom: 10 }}>
              <SectionLabel style={{ margin: 0 }}>Weekly Availability Slots</SectionLabel>
            </div>

            {availabilityBlocks.length === 0 && (
              <EmptyState icon={Clock} title="No availability set" body="Add a time slot so clients can start booking you." />
            )}

            {availabilityBlocks.map((b) => (
              <Card key={b.id} style={{ marginBottom: 10, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: T.body, fontWeight: 700, color: C.jet, ...fBody }}>{b.days.join(", ")}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                      <Clock size={13} color={C.brand} />
                      <span style={{ fontSize: T.label, color: C.slate, ...fBody }}>{to12h(b.start)} – {to12h(b.end)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setRemovalTarget({ type: "availability", id: b.id, label: `${b.days.join(", ")} · ${to12h(b.start)}–${to12h(b.end)}` })}
                    aria-label="Remove availability"
                    style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 4 }}
                  >
                    <Trash2 size={16} color={C.slateLight} />
                  </button>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                  {b.packageIds.map((id) => <Chip key={id} active>{packageName(id)}</Chip>)}
                </div>
              </Card>
            ))}

            <Btn
              full
              variant="outline"
              icon={Plus}
              onClick={() => openAddAvailability(selectedDate)}
              style={{ marginTop: 12, background: C.white }}
            >
              Add Availability
            </Btn>

            <div style={{ marginTop: 32 }}>
              <div style={{ marginBottom: 10 }}>
                <SectionLabel style={{ margin: 0 }}>One-Off Blocked Exceptions</SectionLabel>
              </div>

              {exceptions.length === 0 && (
                <div style={{ padding: "16px 14px", background: C.fog, borderRadius: 14, textAlign: "center", fontSize: 13, color: C.slate, ...fBody }}>
                  No exceptions added. All weekly slots are active.
                </div>
              )}

              {exceptions.map((ex) => (
                <Card key={ex.id} style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Ban size={16} color={C.danger} />
                    <div>
                      <div style={{ fontSize: T.body, fontWeight: 700, color: C.jet, ...fBody }}>{ex.date} — Blocked</div>
                      <div style={{ fontSize: T.captionLg, color: C.slate, marginTop: 1, ...fBody }}>Reason: {ex.reason}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setRemovalTarget({ type: "exception", id: ex.id, label: ex.date })}
                    aria-label={`Remove exception for ${ex.date}`}
                    style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 4 }}
                  >
                    <Trash2 size={16} color={C.danger} />
                  </button>
                </Card>
              ))}

              <Btn
                full
                variant="outline"
                icon={Ban}
                onClick={() => openAddException(selectedDate)}
                style={{ marginTop: 12, color: C.danger, borderColor: C.dangerBorder || C.border, background: C.white }}
              >
                Add Exception
              </Btn>
            </div>
          </>
        )}
      </div>

      {/* =========================================================================
         MODALS & DIALOGS
         ========================================================================= */}

      {/* 1. Add Availability Modal */}
      <Dialog
        open={showAddAvailModal}
        onClose={() => setShowAddAvailModal(false)}
        title="Add Bookable Availability"
        subtitle="Set recurring weekly hours when clients can book your coaching."
      >
        <div>
          {/* Days selector */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.jet, marginBottom: 8, ...fBody }}>Days of the Week</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {DAY_OPTIONS.map((d) => (
                <Chip key={d} active={availDays.includes(d)} onClick={() => toggleAvailDay(d)}>
                  {d}
                </Chip>
              ))}
            </div>
          </div>

          {/* Time range */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.jet, marginBottom: 6, ...fBody }}>
                Start Time
              </label>
              <input
                type="time"
                value={availStart}
                onChange={(e) => setAvailStart(e.target.value)}
                style={timeInputStyle}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.jet, marginBottom: 6, ...fBody }}>
                End Time
              </label>
              <input
                type="time"
                value={availEnd}
                onChange={(e) => setAvailEnd(e.target.value)}
                style={timeInputStyle}
              />
            </div>
          </div>

          {/* Packages selection */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.jet, marginBottom: 8, ...fBody }}>
              Available for Packages
            </div>
            {coachPackages.length === 0 ? (
              <div style={{ fontSize: 12.5, color: C.slateLight, ...fBody }}>
                No active packages found. Slot will apply to all services.
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {coachPackages.map((p) => (
                  <Chip key={p.id} active={availPkgIds.includes(p.id)} onClick={() => toggleAvailPkg(p.id)}>
                    {p.name}
                  </Chip>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn variant="outline" size="sm" onClick={() => setShowAddAvailModal(false)}>
              Cancel
            </Btn>
            <Btn size="sm" onClick={handleSaveAvailability}>
              Save Availability
            </Btn>
          </div>
        </div>
      </Dialog>

      {/* 2. Add Exception Modal */}
      <Dialog
        open={showAddExModal}
        onClose={() => setShowAddExModal(false)}
        title="Add Blocked Date (Exception)"
        subtitle="Block out an entire date for holidays, personal leave, or tournaments."
      >
        <div>
          {/* Date Picker */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.jet, marginBottom: 6, ...fBody }}>
              Date to Block
            </label>
            <input
              type="date"
              value={exDateInput}
              onChange={(e) => setExDateInput(e.target.value)}
              style={timeInputStyle}
            />
          </div>

          {/* Reason Input */}
          <div style={{ marginBottom: 22 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.jet, marginBottom: 6, ...fBody }}>
              Reason / Note
            </label>
            <input
              type="text"
              placeholder="e.g. Personal leave, Holiday, Doctor appointment"
              value={exReasonInput}
              onChange={(e) => setExReasonInput(e.target.value)}
              style={timeInputStyle}
            />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn variant="outline" size="sm" onClick={() => setShowAddExModal(false)}>
              Cancel
            </Btn>
            <Btn size="sm" onClick={handleSaveException} style={{ background: C.danger, color: C.white }}>
              Block Date
            </Btn>
          </div>
        </div>
      </Dialog>

      {/* 3. Confirm Removal Dialog */}
      <ConfirmDialog
        open={!!removalTarget}
        onClose={() => setRemovalTarget(null)}
        onConfirm={confirmRemoval}
        title={removalTarget?.type === "availability" ? "Remove availability slot?" : "Remove blocked exception?"}
        description={
          removalTarget?.type === "availability"
            ? `${removalTarget?.label || "This slot"} will no longer be offered on the calendar.`
            : `${removalTarget?.label || "This date"} will become available according to your regular schedule.`
        }
        confirmLabel="Remove"
        icon={Trash2}
      />
    </div>
  );
}
