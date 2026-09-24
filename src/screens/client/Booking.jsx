import React, { useState, useEffect } from "react";
import { haptic } from "../../utils/haptics";
import { COACHES, CONFIG } from "../../data/mockData";
import {
  ADDITIONAL_CHARGE_KIND, ADDITIONAL_CHARGE_PHASE, ADDITIONAL_CHARGE_STATUS, BOOKING_STATUS,
} from "../../data/bookings";

import {
  CreditCard, CheckCircle2, Check, Plus, Lock, Calendar, Navigation, MessageCircle,
  Users, User, ShieldCheck, Phone, Stethoscope, AlertTriangle, UserPlus, Send, Home,
  Repeat as RepeatIcon, Camera, CalendarDays,
} from "lucide-react";
import { CL, CD, fDisplay, fBody, T } from "../../theme/theme";
import { useApp } from "../../context/AppContext";
import { useResponsive } from "../../theme/responsive";
import { SplitView, Stack } from "../../components/layout";
import { BookingSummary, CHECKOUT_MAXW } from "../../components/booking/BookingSummary";
import {
  Avatar, Card, CheckboxRow, Chip, SectionLabel, Btn, TopBar, Toggle, Field, Row, RadioRow, BottomSheet, RequiredMark,
} from "../../components/ui/Primitives";
import { StatusBanner, ResultOverlay } from "../../systems/StateSystem";
import { SessionJourneyTimeline } from "../../components/booking/SessionJourneyTimeline";
import { getPublicName } from "../../utils/name";
import { calcAge } from "./AboutYou";

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function parseShortDate(str, year = 2026) {
  const m = /(\d{1,2})\s+([A-Za-z]{3})/.exec(str || "");
  if (!m) return null;
  const month = MONTH_ABBR.indexOf(m[2]);
  if (month < 0) return null;
  return new Date(year, month, parseInt(m[1], 10));
}
function sameCalendarDay(a, b) { return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function normTime(t) { return (t || "").replace(/\s+/g, "").toLowerCase(); }

/* ---- calendar helpers for the "Select Date & Time" screen — also reused
   by the Packages tab's inline availability calendar on the coach profile ---- */
export function addDays(d, n) { const r = new Date(d); r.setDate(d.getDate() + n); return r; }
export function startOfWeek(d) { const dow = (d.getDay() + 6) % 7; return addDays(d, -dow); } // Monday-start
export function buildMonthGrid(cursor) {
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
export function sameDay(a, b) { return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
export function isPastDay(d) { const t = new Date(); t.setHours(0, 0, 0, 0); const x = new Date(d); x.setHours(0, 0, 0, 0); return x < t; }
export const DOW_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Availability state for a calendar cell, based on how many slots the coach
// has open that day: none -> unavailable, 1-2 -> limited, 3+ -> available.
export function dayAvailability(date, coach, availability) {
  if (isPastDay(date)) return "unavailable";
  const abbrev = DOW_ABBR[date.getDay()];
  const slots = (availability || coach.availability)[abbrev];
  if (!slots || slots.length === 0) return "unavailable";
  if (slots.length <= 2) return "limited";
  return "available";
}

export function slotsForDate(date, coach, availability) {
  const abbrev = DOW_ABBR[date.getDay()];
  return (availability || coach.availability)[abbrev] || [];
}

// Buckets a coach's raw "HH:MM" slots into Morning / Afternoon / Evening.
export function groupSlotsByPeriod(slots) {
  const groups = { Morning: [], Afternoon: [], Evening: [] };
  slots.forEach((t) => {
    const h = parseInt(t.split(":")[0], 10);
    if (h < 12) groups.Morning.push(t);
    else if (h < 17) groups.Afternoon.push(t);
    else groups.Evening.push(t);
  });
  return groups;
}

export function formatFullDateFromDate(d) {
  return d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });
}

const REPEAT_FREQ_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "fortnightly", label: "Fortnightly" },
  { value: "monthly", label: "Monthly" },
];
const END_AFTER_OPTIONS = [
  { value: "4", label: "4 sessions" },
  { value: "8", label: "8 sessions" },
  { value: "date", label: "End date" },
];

function repeatSummaryText(repeat) {
  if (!repeat || repeat.freq === "once") return "One-time session";
  const freqLabel = repeat.freq === "weekly"
    ? `Every ${repeat.every || 1} week${(repeat.every || 1) > 1 ? "s" : ""}`
    : repeat.freq === "fortnightly" ? "Every 2 weeks" : "Every month";
  if (repeat.endType === "date") return `${freqLabel}, until ${repeat.endDate || "a selected date"}`;
  return `${freqLabel}, ends after ${repeat.endType} sessions`;
}

// How many sessions a repeat selection works out to — used to keep the
// session count and total price in the summary in sync with whatever the
// user has picked (or just 1, for a one-time session).
function computeSessionCount(repeat, anchorDate) {
  if (!repeat || repeat.freq === "once") return 1;
  if (repeat.endType === "4") return 4;
  if (repeat.endType === "8") return 8;
  if (repeat.endType === "date") {
    if (!anchorDate || !repeat.endDate) return null; // not enough info yet
    const start = new Date(anchorDate);
    const end = new Date(repeat.endDate);
    if (Number.isNaN(end.getTime()) || end <= start) return null;
    const diffDays = Math.floor((end - start) / 86400000);
    const intervalDays = repeat.freq === "weekly" ? 7 * (repeat.every || 1)
      : repeat.freq === "fortnightly" ? 14 : 30;
    return Math.max(1, Math.floor(diffDays / intervalDays) + 1);
  }
  return 1;
}

// A coach's package tells us whether more than one person can join the same
// booking. "1:1" / "1:1 Coaching" (and one-on-one term blocks) only ever have
// room for one participant. "Group", "Group Training" and "Family Sessions"
// packages can hold several.
function packageAllowsMultipleParticipants(pkg) {
  const text = `${pkg.type || pkg.packageType || ""} ${pkg.name || ""}`;
  return /group|family/i.test(text);
}

// "Mode of Delivery" — how the session is conducted.
function deliveryModeLabel(pkg) {
  return pkg.deliveryMode || pkg.mode || "In-person";
}

// The exact venue/address a client should show up to (or an explanation why
// there isn't one, for online / "come to you" sessions).
function venueLabel(pkg, coach) {
  const mode = deliveryModeLabel(pkg);
  if (/online|virtual/i.test(mode)) return "Online - link shared once the coach accepts";
  if (/come to you/i.test(mode)) return pkg.travelArea ? `Coach travels to you - ${pkg.travelArea}` : "Coach travels to your location";
  return pkg.venue || (coach && coach.venue) || "Venue to be confirmed by coach";
}

export function formatTime12(t) {
  const [hStr, mStr] = t.split(":");
  let h = parseInt(hStr, 10);
  const period = h >= 12 ? "pm" : "am";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${mStr} ${period}`;
}

// Adds a number of minutes to an "HH:MM" slot start time, wrapping past
// midnight if needed, and returns the result in the same "HH:MM" shape.
export function addMinutesToTime(t, minutesToAdd) {
  const [hStr, mStr] = t.split(":");
  const total = (parseInt(hStr, 10) * 60 + parseInt(mStr, 10) + (minutesToAdd || 0) + 1440) % 1440;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Renders a slot as a clear start-to-end range, e.g. "9:00 AM – 10:00 AM",
// given the slot's "HH:MM" start time and the session duration in minutes.
export function formatTimeRange12(t, durationMinutes) {
  const start = formatTime12(t);
  if (!durationMinutes) return start;
  const end = formatTime12(addMinutesToTime(t, durationMinutes));
  return `${start} – ${end}`;
}

// Booking steps are normally reached with coachId/packageId (or a draft)
// carried over from the previous step, but they can also be opened directly
// (screen directory, stale history, reset state). Rather than crashing on
// missing params, fall back to the first coach in the directory and their
// first package so the flow always has something coherent to render.
export function resolveBookingCoachPkg(params, draft, coachOverride) {
  const coachId = params?.coachId ?? draft?.coach?.id;
  const coach = coachOverride?.id === coachId
    ? coachOverride
    : COACHES.find((c) => c.id === coachId) || COACHES[0];
  const pkg = (coach?.packages || []).find((p) => p.id === (params?.packageId ?? draft?.pkg?.id)) || coach?.packages?.[0];
  return { coach, pkg };
}

export function buildFallbackDraft(params, draft, coachOverride) {
  if (draft && draft.coach && draft.pkg) return draft;
  const { coach, pkg } = resolveBookingCoachPkg(params, draft, coachOverride);
  return {
    coach, pkg,
    day: params?.presetDate ? formatFullDateFromDate(new Date(params.presetDate)) : "",
    time: params?.presetTime ? formatTimeRange12(params.presetTime, pkg.duration) : "",
    mode: pkg.mode,
    participants: params?.participants || ["self"],
    repeat: { freq: "once" },
    sessionCount: 1,
    total: pkg.price,
  };
}

// Blank participant profile draft for the inline "Add Child Profile" modal —
// same shape as the one on the Account screen, so a child created mid-booking
// looks and behaves exactly like one added from the Account tab. The booking
// sheet only asks for the essentials (name, DOB, photo, mobile); everything
// else is filled in later from Account → Family.
const emptyChildDraft = {
  name: "", dob: "", age: "", sport: [], sportLevels: {}, goals: "", location: null, preferences: "", hasPhoto: false,
  medicalConditions: "", allergies: "",
  guardianName: "", guardianRelationship: "", guardianMobile: "",
};

/**
 * First step of the booking flow: "Who's attending?" — asked before date and
 * time are chosen, so the coach's availability check and the review page
 * both already know who the session is for.
 */
export function ScreenBookingParticipants({ nav, params, children = [], addChild, toast }) {
  const { darkMode, clientIdentity, coachProfile } = useApp();
  const C = darkMode ? CD : CL;
  const { isDesktop } = useResponsive();
  const { coach, pkg } = resolveBookingCoachPkg(params, null, coachProfile);
  const pub = getPublicName(coach, "public");
  const allowsMultiple = packageAllowsMultipleParticipants(pkg);
  // The package's "Maximum participants" (set by the coach) caps how many
  // people the client can add to a single booking of this package.
  const maxParticipants = pkg.maxParticipants || (allowsMultiple ? 99 : 1);

  const initialParticipants = Array.isArray(params?.participants) && params.participants.length
    ? params.participants
    : ["self"];
  const [participants, setParticipants] = useState(initialParticipants);
  const toggleParticipant = (key) => setParticipants((p) => {
    if (!allowsMultiple) return p.includes(key) ? p : [key]; // 1:1 single selection acts like a radio button
    if (p.includes(key)) return p.filter((x) => x !== key);
    if (p.length >= maxParticipants) return p; // package is at capacity — ignore further taps
    return [...p, key];
  });
  // Selects a participant outright (rather than toggling), used once a child
  // profile is created so it lands pre-selected without a second tap.
  const selectParticipant = (key) => setParticipants((p) => {
    if (!allowsMultiple) return [key];
    if (p.includes(key)) return p;
    if (p.length >= maxParticipants) return p;
    return [...p, key];
  });

  const atCapacity = allowsMultiple && participants.length >= maxParticipants;
  const canContinue = participants.length > 0;
  const selfSelected = participants.includes("self");

  const selfName = `${clientIdentity?.firstName || ""} ${clientIdentity?.lastName || ""}`.trim() || "Myself";

  // Inline "Add Child Profile" — a slide-in modal on top of this screen
  // rather than a redirect out to the Account tab, so a parent can create
  // the participant without losing their place in the booking flow.
  const [childModalOpen, setChildModalOpen] = useState(false);
  const [childDraft, setChildDraft] = useState(emptyChildDraft);
  const openAddChild = () => { setChildDraft(emptyChildDraft); setChildModalOpen(true); };
  const saveChildAndSelect = () => {
    if (!childDraft.name.trim()) { toast && toast("Give this profile a name first"); return; }
    const newId = Date.now();
    const age = calcAge(childDraft.dob);
    addChild({ ...childDraft, id: newId, age: age !== null ? String(age) : "" });
    selectParticipant(newId);
    toast && toast(`${childDraft.name}'s profile added`);
    setChildModalOpen(false);
  };
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar title="Who's attending?" onBack={() => nav("package-detail", { coachId: coach.id, packageId: pkg.id, presetDate: params.presetDate, presetTime: params.presetTime })} />

      <div style={{ padding: isDesktop ? "32px 64px 0" : "16px 18px 0" }}>
        <Card style={{ marginBottom: 22, display: "flex", gap: 12, alignItems: "center", border: `1px solid ${C.border}`, boxShadow: "0 1px 2px rgba(22,24,29,.04)" }}>
          <Avatar name={pub.name} size={44} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: T.subtitleLg, fontWeight: 700, color: C.jet, letterSpacing: "-0.1px", ...fDisplay }}>{pkg.name}</div>
            <div style={{ fontSize: T.labelLg, color: C.slate, marginTop: 2, ...fBody }}>with {pub.name}</div>
          </div>
          <div style={{ marginLeft: "auto", fontSize: T.title, fontWeight: 800, color: C.jet, whiteSpace: "nowrap", ...fDisplay }}>
            ${pkg.price}
          </div>
        </Card>
      </div>

      <div style={{ flex: 1, overflowY: "auto", width: "100%", padding: isDesktop ? "24px 64px 40px" : "0 18px", paddingBottom: isDesktop ? 40 : "max(28px, env(safe-area-inset-bottom))" }} className="cl-hide-scrollbar">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <SectionLabel required>Select who's coming</SectionLabel>
          <span style={{ fontSize: T.caption, fontWeight: 600, color: C.slateLight, ...fBody }}>
            {participants.length}/{maxParticipants} max
          </span>
        </div>
        <div style={{ fontSize: T.labelLg, color: C.slate, marginBottom: 16, lineHeight: 1.5, ...fBody }}>
          {allowsMultiple
            ? `This is a group session (up to ${maxParticipants} participants can join). Select yourself, one child, or several. Each participant keeps their own booking history.`
            : "This is a 1:1 session, so pick a single participant (yourself or a child profile)."}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          {/* Myself Card */}
          <button
            type="button"
            onClick={atCapacity && !selfSelected ? undefined : () => toggleParticipant("self")}
            disabled={atCapacity && !selfSelected}
            style={{
              width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 14,
              padding: "13px 15px", borderRadius: 16,
              background: selfSelected ? (darkMode ? C.jetSoft : C.fog) : C.white,
              border: `1.5px solid ${selfSelected ? C.black : C.border}`,
              opacity: atCapacity && !selfSelected ? 0.45 : 1,
              cursor: atCapacity && !selfSelected ? "not-allowed" : "pointer",
              transition: "background .15s ease, border-color .15s ease, opacity .15s ease, box-shadow .15s ease, transform .15s ease",
              boxShadow: selfSelected ? "0 2px 8px rgba(0,0,0,0.06)" : "0 1px 3px rgba(0,0,0,0.02)",
            }}
          >
            <Avatar name={selfName} size={42} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: T.bodyLg, fontWeight: 700, color: C.jet, ...fBody }}>
                {selfName}
              </div>
              <div style={{ fontSize: T.captionLg, color: C.slate, marginTop: 2, ...fBody }}>
                Account holder (You)
              </div>
            </div>
            <div
              style={{
                width: 22, height: 22, borderRadius: 99,
                border: `1.5px solid ${selfSelected ? C.black : C.border}`,
                background: selfSelected ? C.black : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, transition: "background .15s ease, border-color .15s ease",
              }}
            >
              {selfSelected && <Check size={13} color={C.white} strokeWidth={3} />}
            </div>
          </button>

          {/* Child Profiles (above Add Child Profile) */}
          {children.map((c) => {
            const isSelected = participants.includes(c.id);
            const disabled = atCapacity && !isSelected;
            const childSubtitle = c.age
              ? `${c.age} years old`
              : (c.dob ? `${calcAge(c.dob)} years old` : "Child profile");

            return (
              <button
                key={c.id}
                type="button"
                onClick={disabled ? undefined : () => toggleParticipant(c.id)}
                disabled={disabled}
                style={{
                  width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 14,
                  padding: "13px 15px", borderRadius: 16,
                  background: isSelected ? (darkMode ? C.jetSoft : C.fog) : C.white,
                  border: `1.5px solid ${isSelected ? C.black : C.border}`,
                  opacity: disabled ? 0.45 : 1,
                  cursor: disabled ? "not-allowed" : "pointer",
                  transition: "background .15s ease, border-color .15s ease, opacity .15s ease, box-shadow .15s ease, transform .15s ease",
                  boxShadow: isSelected ? "0 2px 8px rgba(0,0,0,0.06)" : "0 1px 3px rgba(0,0,0,0.02)",
                }}
              >
                <Avatar name={c.name || "Child"} size={42} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: T.bodyLg, fontWeight: 700, color: C.jet, ...fBody }}>
                    {c.name || "Child Profile"}
                  </div>
                  <div style={{ fontSize: T.captionLg, color: C.slate, marginTop: 2, ...fBody }}>
                    {childSubtitle}
                  </div>
                </div>
                <div
                  style={{
                    width: 22, height: 22, borderRadius: 99,
                    border: `1.5px solid ${isSelected ? C.black : C.border}`,
                    background: isSelected ? C.black : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, transition: "background .15s ease, border-color .15s ease",
                  }}
                >
                  {isSelected && <Check size={13} color={C.white} strokeWidth={3} />}
                </div>
              </button>
            );
          })}

          {/* Add Child Profile Button */}
          <button
            type="button"
            onClick={atCapacity ? undefined : openAddChild}
            disabled={atCapacity}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "14px 16px", borderRadius: 16,
              background: C.fog,
              border: `1.5px dashed ${C.border}`,
              color: atCapacity ? C.slateLight : C.jet,
              fontSize: T.bodyLg, fontWeight: 600,
              cursor: atCapacity ? "not-allowed" : "pointer",
              opacity: atCapacity ? 0.5 : 1,
              transition: "background .15s ease, border-color .15s ease, color .15s ease, opacity .15s ease, transform .15s ease",
              ...fBody,
            }}
          >
            <Plus size={18} color={atCapacity ? C.slateLight : C.jet} strokeWidth={2.2} />
            Add Child Profile
          </button>
        </div>
      </div>

      <div style={{ padding: isDesktop ? "18px 64px 24px" : "14px 18px", paddingBottom: isDesktop ? 24 : "max(28px, env(safe-area-inset-bottom))", borderTop: `1px solid ${C.border}`, background: C.white, flexShrink: 0, boxSizing: "border-box" }}>
        <Btn
          full
          disabled={!canContinue}
          onClick={() => {
            const includesChildProfile = participants.some((id) => id !== "self" && children.some((child) => child.id === id));
            nav(
              includesChildProfile ? "booking-participant-details" : "booking-review",
              { coachId: coach.id, packageId: pkg.id, participants, presetDate: params.presetDate, presetTime: params.presetTime }
            );
          }}
        >
          Continue
        </Btn>
      </div>

      {/* Slide-in "Add Child Profile" modal — creates the participant right
          here in the booking flow, then returns to this screen with them
          selected, instead of redirecting out to the Account tab. Only the
          essentials are asked here; the rest lives on the Account edit sheet. */}
      <BottomSheet open={childModalOpen} onClose={() => setChildModalOpen(false)} title="Add child profile" heightPct={60}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <button
            onClick={() => setChildDraft((d) => ({ ...d, hasPhoto: !d.hasPhoto }))}
            style={{ position: "relative", background: "none", border: "none", cursor: "pointer" }}
          >
            {childDraft.hasPhoto ? <Avatar name={childDraft.name || "Child"} size={72} /> : (
              <div style={{ width: 72, height: 72, borderRadius: 72, background: C.fog, border: `1.5px dashed ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Camera size={20} color={C.slateLight} />
              </div>
            )}
            <div style={{ position: "absolute", bottom: -2, right: -2, width: 24, height: 24, borderRadius: 24, background: C.brand, border: `2px solid ${C.white}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Camera size={11} color={C.white} />
            </div>
          </button>
        </div>

        <div style={{ fontSize: T.labelLg, color: C.slate, lineHeight: 1.5, marginBottom: 16, textAlign: "center", ...fBody }}>
          We'll keep this quick - add sports, skill level and medical details anytime from Account.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Child's name" placeholder="e.g. Ava" icon={User} value={childDraft.name} onChange={(e) => setChildDraft((d) => ({ ...d, name: e.target.value }))} required />
          <div>
            <div style={{ fontSize: T.labelLg, fontWeight: 600, color: C.jet, marginBottom: 6, ...fBody }}>Date of birth</div>
            <div className="cl-input" style={{ display: "flex", alignItems: "center", gap: 8, border: `1.5px solid ${C.border}`, borderRadius: 13, padding: "11px 13px", background: C.white }}>
              <CalendarDays size={16} color={C.slateLight} />
              <input
                type="date"
                value={childDraft.dob}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setChildDraft((d) => ({ ...d, dob: e.target.value }))}
                style={{ flex: 1, border: "none", outline: "none", fontSize: T.bodyLg, color: C.jet, background: "transparent", ...fBody }}
              />
            </div>
            <div style={{ fontSize: T.caption, color: C.slateLight, marginTop: 5, ...fBody }}>
              {childDraft.dob ? `${calcAge(childDraft.dob)} years old` : "Recommended so coaches can prepare"}
            </div>
          </div>
          <Field label="Mobile number" placeholder="04XX XXX XXX" icon={Phone} type="tel" value={childDraft.guardianMobile} onChange={(e) => setChildDraft((d) => ({ ...d, guardianMobile: e.target.value.replace(/[^0-9+\s]/g, "") }))} />
        </div>

        <div style={{ marginTop: 22 }}>
          <Btn full onClick={saveChildAndSelect}>Add profile & select</Btn>
        </div>
      </BottomSheet>
    </div>
  );
}

/**
 * Unified Review & Confirm Booking screen:
 * Consolidates session date/time overview, participant confirmation,
 * optional recurring schedule, child safeguarding details (if minor),
 * pre-session message, cancellation notice, price breakdown, and submission.
 */
export function ScreenBookingReview({ nav, goBack, params, draft, setDraft, toast, children = [], bookings = [], addBooking }) {
  const { darkMode, clientIdentity, clientPrefs, coachProfile } = useApp();
  const C = darkMode ? CD : CL;
  const { isDesktop } = useResponsive();
  const { coach, pkg } = resolveBookingCoachPkg(params, draft, coachProfile);
  const pub = getPublicName(coach, "public");

  const participantIds = Array.isArray(params?.participants) && params.participants.length
    ? params.participants
    : (Array.isArray(draft?.participants) ? draft.participants : ["self"]);
  const selectedChildren = children.filter((c) => participantIds.includes(c.id));
  const participantNames = participantIds.map((id) => {
    if (id === "self") return "You";
    return children.find((child) => String(child.id) === String(id))?.name || "Participant";
  });
  const participantSummary = participantNames.length > 2
    ? `${participantNames.slice(0, 2).join(", ")} +${participantNames.length - 2}`
    : (participantNames.length ? participantNames.join(" and ") : "You");

  const changeParticipant = () => nav("booking-participants", {
    coachId: coach.id,
    packageId: pkg.id,
    participants: participantIds,
    presetDate: params.presetDate,
    presetTime: params.presetTime,
  });

  const selectedDate = params.presetDate ? new Date(params.presetDate) : (draft?.day ? new Date(draft.day) : null);
  const time = params.presetTime || draft?.time || null;
  const hasDateTime = !!selectedDate && !!time;

  // Repeat booking state (optional)
  const savedRepeat = draft && draft.coach?.id === coach.id && draft.pkg?.id === pkg.id
    ? draft.repeat
    : null;
  const [repeatEnabled, setRepeatEnabled] = useState(!!savedRepeat && savedRepeat.freq !== "once");
  const [repeatFreq, setRepeatFreq] = useState(savedRepeat && savedRepeat.freq !== "once" ? savedRepeat.freq : "weekly");
  const [repeatEvery, setRepeatEvery] = useState(savedRepeat?.every || 1);
  const [endAfterType, setEndAfterType] = useState(savedRepeat?.endType || "4");
  const [endDate, setEndDate] = useState(savedRepeat?.endDate || "");

  const repeat = repeatEnabled
    ? { freq: repeatFreq, every: repeatEvery, endType: endAfterType, endDate }
    : { freq: "once" };

  // Conflict detection
  const conflictBooking = hasDateTime
    ? bookings.find((b) => {
        if (!["pending", "confirmed"].includes(b.status)) return false;
        const bd = parseShortDate(b.date);
        return sameCalendarDay(bd, selectedDate) && normTime(b.time) === normTime(formatTime12(time));
      })
    : null;

  const sessionCount = hasDateTime ? computeSessionCount(repeat, params.presetDate) : 1;
  const needsEndDate = repeatEnabled && endAfterType === "date" && !endDate;
  const subtotal = pkg.price * sessionCount;
  const fee = Math.round(subtotal * CONFIG.serviceFeeRate * 100) / 100;
  const totalPrice = subtotal + fee;

  // Minor / safeguarding
  const isMinor = (c) => {
    const age = Number(c.age);
    return c.age === "" || c.age === undefined || c.age === null || Number.isNaN(age) || age < 18;
  };
  const minorParticipants = selectedChildren.filter(isMinor);
  const includesMinor = minorParticipants.length > 0;
  const accountName = `${clientIdentity?.firstName || ""} ${clientIdentity?.lastName || ""}`.trim();
  const accountPhone = clientPrefs?.mobile || "";
  const savedGuardianProfile = minorParticipants.find((child) => child.guardianName || child.guardianMobile);
  const savedEmergencyProfile = minorParticipants.find((child) => child.emergencyName && child.emergencyMobile)
    || children.find((child) => child.emergencyName && child.emergencyMobile);
  const savedAccountEmergency = clientPrefs?.emergencyName && clientPrefs?.emergencyMobile
    ? {
      emergencyName: clientPrefs.emergencyName,
      emergencyRelationship: clientPrefs.emergencyRelationship,
      emergencyMobile: clientPrefs.emergencyMobile,
    }
    : null;
  const participantDetails = params?.participantDetails || {};
  const detailFromEarlierStep = minorParticipants
    .map((child) => participantDetails[child.id])
    .find((detail) => detail?.emergencyName || detail?.emergencyPhone || detail?.conditions || detail?.allergies);

  const childrenMissingEmergencyContact = minorParticipants.filter((child) => !(child.emergencyName && child.emergencyMobile));
  const needsEmergencyContact = childrenMissingEmergencyContact.length > 0;

  const [guardianName, setGuardianName] = useState(savedGuardianProfile?.guardianName || "");
  const [guardianRelationship, setGuardianRelationship] = useState(savedGuardianProfile?.guardianRelationship || "");
  const [guardianPhone, setGuardianPhone] = useState(savedGuardianProfile?.guardianMobile || "");
  const [guardianSource, setGuardianSource] = useState(savedGuardianProfile ? "profile" : "manual");
  const [emergencyName, setEmergencyName] = useState(detailFromEarlierStep?.emergencyName || "");
  const [emergencyPhone, setEmergencyPhone] = useState(detailFromEarlierStep?.emergencyPhone || "");
  const [emergencySource, setEmergencySource] = useState(detailFromEarlierStep ? "booking" : "manual");
  const [conditions, setConditions] = useState(
    [detailFromEarlierStep?.conditions, detailFromEarlierStep?.allergies].filter(Boolean).join(" · "),
  );
  const [bookingNotes, setBookingNotes] = useState(draft?.bookingNotes || "");
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    if (emergencySource !== "guardian") return;
    setEmergencyName(guardianName);
    setEmergencyPhone(guardianPhone);
  }, [emergencySource, guardianName, guardianPhone]);

  const guardianDetailsComplete = guardianName.trim() && guardianRelationship.trim() && guardianPhone.trim();
  const emergencyDetailsComplete = !needsEmergencyContact || (emergencyName.trim() && emergencyPhone.trim());
  const minorDetailsComplete = guardianDetailsComplete && emergencyDetailsComplete;
  const canContinue = hasDateTime && !conflictBooking && !needsEndDate && (!includesMinor || (consent && minorDetailsComplete));

  const applyAccountGuardian = () => {
    setGuardianName(accountName);
    setGuardianRelationship("Parent or legal guardian");
    setGuardianPhone(accountPhone);
    setGuardianSource("account");
  };

  const applySavedGuardian = () => {
    if (!savedGuardianProfile) return;
    setGuardianName(savedGuardianProfile.guardianName || "");
    setGuardianRelationship(savedGuardianProfile.guardianRelationship || "");
    setGuardianPhone(savedGuardianProfile.guardianMobile || "");
    setGuardianSource("profile");
  };

  const applyGuardianAsEmergency = () => {
    setEmergencyName(guardianName);
    setEmergencyPhone(guardianPhone);
    setEmergencySource("guardian");
  };

  const applySavedEmergency = (contact, source) => {
    if (!contact) return;
    setEmergencyName(contact.emergencyName || "");
    setEmergencyPhone(contact.emergencyMobile || "");
    setEmergencySource(source);
  };

  const DetailChoice = ({ active, icon: Icon, title, detail, onClick, disabled }) => (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={active}
      style={{
        width: "100%", minHeight: 52, display: "flex", alignItems: "center", gap: 10,
        padding: "9px 11px", textAlign: "left", borderRadius: 13,
        border: `1px solid ${active ? C.brand : C.border}`,
        background: active ? C.brandTint : C.white,
        cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1,
      }}
    >
      <div style={{ width: 34, height: 34, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: active ? C.white : C.fog }}>
        <Icon aria-hidden="true" size={16} color={active ? C.brand : C.slate} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: T.labelLg, fontWeight: 700, color: C.jet, ...fBody }}>{title}</div>
        <div style={{ fontSize: T.caption, color: C.slate, lineHeight: 1.4, marginTop: 2, ...fBody }}>{detail}</div>
      </div>
      {active && <CheckCircle2 aria-hidden="true" size={17} color={C.brand} />}
    </button>
  );

  const handleSubmit = () => {
    if (!canContinue) return;
    const profileSafetyNotes = minorParticipants
      .filter((c) => c.emergencyName || c.emergencyMobile || c.medicalConditions || c.allergies || c.medicalNotes)
      .map((c) => {
        const bits = [];
        if (c.medicalConditions) bits.push(`Medical: ${c.medicalConditions}`);
        if (c.allergies) bits.push(`Allergies: ${c.allergies}`);
        if (c.medicalNotes) bits.push(c.medicalNotes);
        if (c.emergencyName || c.emergencyMobile) {
          bits.push(`Emergency contact: ${c.emergencyName || "-"}${c.emergencyRelationship ? ` (${c.emergencyRelationship})` : ""}${c.emergencyMobile ? ` - ${c.emergencyMobile}` : ""}`);
        }
        return `${c.name || "Participant"} - ${bits.join("; ")}`;
      }).join("\n");
    const safetyNotes = [conditions.trim(), profileSafetyNotes].filter(Boolean).join("\n");
    const finalDraft = {
      coach, pkg,
      day: selectedDate ? formatFullDateFromDate(selectedDate) : "",
      time: time ? formatTimeRange12(time, pkg.duration) : "",
      mode: pkg.mode,
      participants: participantSummary,
      repeat,
      sessionCount,
      total: totalPrice,
      includesMinor,
      guardianName, guardianRelationship, guardianPhone,
      emergencyName, emergencyPhone,
      bookingNotes: bookingNotes.trim(), safetyNotes,
    };
    setDraft(finalDraft);
    const newId = addBooking(finalDraft);
    if (!newId) {
      toast("Could not create this booking. Please try again.");
      return;
    }
    toast("Booking request sent");
    nav("booking-request-sent", { id: newId, coachName: coach.name });
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.white }}>
      <TopBar title="Review & confirm" onBack={changeParticipant} />

      <div style={{ flex: 1, overflowY: "auto", width: "100%", padding: isDesktop ? "64px" : "16px 18px 24px" }} className="cl-hide-scrollbar">
        {/* Coach & Package Overview Card */}
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
            <Avatar name={pub.name} size={44} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: T.subtitleLg, fontWeight: 700, color: C.jet, ...fDisplay }}>{pkg.name}</div>
              <div style={{ fontSize: T.captionLg, color: C.slate, marginTop: 2, ...fBody }}>with {pub.name} · {pkg.duration} min</div>
            </div>
            <div style={{ fontSize: T.titleLg, fontWeight: 800, color: C.jet, whiteSpace: "nowrap", ...fDisplay }}>${pkg.price}</div>
          </div>
          {hasDateTime && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
              <Calendar size={15} color={C.brand} />
              <span style={{ fontSize: T.body, fontWeight: 600, color: C.jet, ...fBody }}>
                {formatFullDateFromDate(selectedDate)} · {formatTimeRange12(time, pkg.duration)}
              </span>
            </div>
          )}
        </Card>

        {/* Participants Pill */}
        <div
          role="note"
          aria-label={`Booking participants: ${participantSummary}`}
          style={{
            display: "flex", alignItems: "center", gap: 10, marginBottom: 16, padding: "11px 12px",
            borderRadius: 14, border: `1px solid ${C.border}`, background: C.fog,
          }}
        >
          <div style={{ width: 34, height: 34, borderRadius: 11, background: C.brandTint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Users size={16} color={C.brand} aria-hidden="true" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: T.labelLg, fontWeight: 700, color: C.jet, ...fBody }}>Attending: {participantSummary}</div>
            <div style={{ marginTop: 2, fontSize: T.caption, lineHeight: 1.4, color: C.slate, ...fBody }}>
              Change who is attending this session.
            </div>
          </div>
          <Btn variant="ghost" size="sm" onClick={changeParticipant}>Change</Btn>
        </div>

        {/* Schedule conflict warning */}
        {hasDateTime && conflictBooking && (
          <div style={{ marginBottom: 16 }}>
            <StatusBanner
              state="scheduleConflict"
              message={`You already have ${conflictBooking.service} with ${(() => { const cc = COACHES.find((c) => c.id === conflictBooking.coachId); return getPublicName(cc || { name: conflictBooking.coachName }, "confirmed").name; })()} at this time.`}
              onPrimary={() => nav("coach-profile", { id: coach.id })}
              primaryLabel="Choose new time"
              onSecondary={() => nav("client-booking-detail", { id: conflictBooking.id })}
              secondaryLabel="View booking"
              equalActions
            />
          </div>
        )}

        {/* Optional Repeat Booking */}
        {hasDateTime && !conflictBooking && (
          <>
            <SectionLabel>Repeat Booking (Optional)</SectionLabel>
            <Card style={{ marginTop: 8, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <RepeatIcon size={15} color={C.jet} />
                  <span style={{ fontSize: T.bodyLg, fontWeight: 600, color: C.jet, ...fBody }}>Repeat this session</span>
                </div>
                <Toggle label="Repeat this session" on={repeatEnabled} onClick={() => setRepeatEnabled((v) => !v)} />
              </div>

              {repeatEnabled && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: T.label, color: C.slate, marginBottom: 10, ...fBody }}>How often would you like to repeat this session?</div>
                  {REPEAT_FREQ_OPTIONS.map((o) => (
                    <RadioRow key={o.value} label={o.label} selected={repeatFreq === o.value} onClick={() => setRepeatFreq(o.value)} />
                  ))}

                  {repeatFreq === "weekly" && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: T.labelLg, fontWeight: 600, color: C.jet, marginBottom: 6, ...fBody }}>Repeat every</div>
                      <div className="cl-input" style={{ display: "flex", alignItems: "center", gap: 8, border: `1.5px solid ${C.border}`, borderRadius: 13, padding: "11px 13px", background: C.white }}>
                        <RepeatIcon size={14} color={C.slateLight} />
                        <input
                          type="number" min={1} value={repeatEvery}
                          onChange={(e) => setRepeatEvery(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          style={{ border: "none", outline: "none", width: 40, fontSize: T.body, color: C.jet, ...fBody }}
                        />
                        <span style={{ fontSize: T.labelLg, color: C.slate, ...fBody }}>week{repeatEvery > 1 ? "s" : ""}</span>
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: T.labelLg, fontWeight: 600, color: C.jet, marginBottom: 6, ...fBody }}>End after</div>
                    {END_AFTER_OPTIONS.map((o) => (
                      <RadioRow key={o.value} label={o.label} selected={endAfterType === o.value} onClick={() => setEndAfterType(o.value)} />
                    ))}
                    {endAfterType === "date" && (
                      <input
                        type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                        style={{ width: "100%", border: `1.5px solid ${C.border}`, borderRadius: 13, padding: "11px 13px", fontSize: T.bodyLg, outline: "none", boxSizing: "border-box", marginTop: 6, color: C.jet, background: C.white, ...fBody }}
                      />
                    )}
                    {needsEndDate && (
                      <div style={{ fontSize: T.caption, color: C.slateLight, marginTop: 6, ...fBody }}>Pick an end date to see how many sessions that covers.</div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          </>
        )}

        {/* Child Safeguarding details (if minor) */}
        {includesMinor && (
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 12 }}>
              <ShieldCheck size={16} color={C.brand} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: T.bodyLg, fontWeight: 600, color: C.jet, ...fDisplay }}>Child safety details</div>
                <div style={{ fontSize: T.label, color: C.slate, marginTop: 2, lineHeight: 1.55, ...fBody }}>
                  This booking includes a participant under 18, so we share a few extra details with your coach to keep sessions safe. {pub.name.split(" ")[0]} holds the required Working with Children Check.
                </div>
              </div>
            </div>

            {minorParticipants.map((c) => {
              const hasSavedEmergency = !!(c.emergencyName && c.emergencyMobile);
              const hasSavedMedical = !!(c.medicalConditions || c.allergies || c.medicalNotes);
              const hasSavedSafetyInfo = hasSavedEmergency || hasSavedMedical;
              const hasSavedGuardian = !!c.guardianName;
              return (
                <div key={c.id} style={{ background: C.fog, borderRadius: 12, padding: "10px 12px", marginBottom: 10 }}>
                  <Row label="Participant" value={c.name || "Unnamed profile"} />
                  <Row label="Age" value={c.age || "Not set"} last={!hasSavedSafetyInfo && !hasSavedGuardian} />
                  {hasSavedGuardian && (
                    <Row label="Guardian on file" value={`${c.guardianName}${c.guardianRelationship ? ` (${c.guardianRelationship})` : ""}`} last={!hasSavedSafetyInfo} />
                  )}
                  {hasSavedSafetyInfo && (
                    <>
                      <Row label="Medical conditions" value={c.medicalConditions || "None declared"} />
                      <Row label="Allergies" value={c.allergies || "None declared"} />
                      {c.medicalNotes && <Row label="Medical notes" value={c.medicalNotes} />}
                      <Row label="Emergency contact" value={c.emergencyName ? `${c.emergencyName}${c.emergencyRelationship ? ` (${c.emergencyRelationship})` : ""}` : "Not set"} />
                      <Row label="Emergency phone" value={c.emergencyMobile || "Not set"} last />
                    </>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 8 }}>
                    {hasSavedEmergency ? (
                      <>
                        <CheckCircle2 size={12} color={C.success} />
                        <span style={{ fontSize: T.caption, color: C.success, fontWeight: 600, ...fBody }}>Complete safety contact loaded from this profile</span>
                      </>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <AlertTriangle size={12} color={C.brand} />
                        <span style={{ fontSize: T.caption, color: C.brand, fontWeight: 600, ...fBody }}>{hasSavedMedical ? "Medical notes loaded; add an emergency contact below" : "No safety contact saved - choose one below"}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            <div style={{ marginTop: 4 }}>
              <SectionLabel>Guardian details</SectionLabel>
              <div style={{ fontSize: T.captionLg, color: C.slate, lineHeight: 1.5, marginTop: -5, marginBottom: 10, ...fBody }}>
                Use details already saved to CoachNivo, or enter a different guardian for this booking.
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                <DetailChoice
                  active={guardianSource === "account"}
                  icon={User}
                  title="Use my account details"
                  detail={`${accountName || "Account holder"}${accountPhone ? ` · ${accountPhone}` : " · Add your phone below"}`}
                  onClick={applyAccountGuardian}
                  disabled={!accountName}
                />
                {savedGuardianProfile && (
                  <DetailChoice
                    active={guardianSource === "profile"}
                    icon={ShieldCheck}
                    title="Use saved guardian"
                    detail={`${savedGuardianProfile.guardianName || "Saved guardian"}${savedGuardianProfile.guardianRelationship ? ` · ${savedGuardianProfile.guardianRelationship}` : ""}`}
                    onClick={applySavedGuardian}
                  />
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Field label="Guardian full name" name="guardian-name" autoComplete="name" placeholder="e.g. Jamie Chen" icon={User} value={guardianName} onChange={(e) => { setGuardianName(e.target.value); setGuardianSource("manual"); }} required />
                <Field label="Relationship to participant" name="guardian-relationship" placeholder="e.g. Parent or legal guardian" value={guardianRelationship} onChange={(e) => { setGuardianRelationship(e.target.value); setGuardianSource("manual"); }} required />
                <Field label="Guardian phone" name="guardian-phone" autoComplete="tel" inputMode="tel" placeholder="04XX XXX XXX" icon={Phone} type="tel" value={guardianPhone} onChange={(e) => { setGuardianPhone(e.target.value.replace(/[^0-9+\s]/g, "")); setGuardianSource("manual"); }} required />
              </div>
            </div>

            {needsEmergencyContact && (
              <>
                <div style={{ marginTop: 14 }}>
                  <SectionLabel>Emergency contact</SectionLabel>
                  <div style={{ fontSize: T.captionLg, color: C.slate, lineHeight: 1.5, marginTop: -5, marginBottom: 10, ...fBody }}>
                    This can be the guardian or another trusted adult who can be reached during the session.
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                    {detailFromEarlierStep && (
                      <DetailChoice
                        active={emergencySource === "booking"}
                        icon={CheckCircle2}
                        title="Use details entered earlier"
                        detail={`${detailFromEarlierStep.emergencyName || "Booking contact"}${detailFromEarlierStep.emergencyPhone ? ` · ${detailFromEarlierStep.emergencyPhone}` : ""}`}
                        onClick={() => {
                          setEmergencyName(detailFromEarlierStep.emergencyName || "");
                          setEmergencyPhone(detailFromEarlierStep.emergencyPhone || "");
                          setEmergencySource("booking");
                        }}
                      />
                    )}
                    <DetailChoice
                      active={emergencySource === "guardian"}
                      icon={ShieldCheck}
                      title="Same as guardian"
                      detail={guardianName && guardianPhone ? `${guardianName} · ${guardianPhone}` : "Complete the guardian name and phone first"}
                      onClick={applyGuardianAsEmergency}
                      disabled={!guardianName.trim() || !guardianPhone.trim()}
                    />
                    {savedAccountEmergency && (
                      <DetailChoice
                        active={emergencySource === "account"}
                        icon={Phone}
                        title="Use account emergency contact"
                        detail={`${savedAccountEmergency.emergencyName} · ${savedAccountEmergency.emergencyMobile}`}
                        onClick={() => applySavedEmergency(savedAccountEmergency, "account")}
                      />
                    )}
                    {savedEmergencyProfile && (
                      <DetailChoice
                        active={emergencySource === "profile"}
                        icon={Users}
                        title="Use saved family contact"
                        detail={`${savedEmergencyProfile.emergencyName} · ${savedEmergencyProfile.emergencyMobile}`}
                        onClick={() => applySavedEmergency(savedEmergencyProfile, "profile")}
                      />
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <Field label="Emergency contact name" name="emergency-contact-name" autoComplete="name" placeholder="e.g. Alex Chen" icon={User} value={emergencyName} onChange={(e) => { setEmergencyName(e.target.value); setEmergencySource("manual"); }} required />
                    <Field label="Emergency contact phone" name="emergency-contact-phone" autoComplete="tel" inputMode="tel" placeholder="04XX XXX XXX" icon={Phone} type="tel" value={emergencyPhone} onChange={(e) => { setEmergencyPhone(e.target.value.replace(/[^0-9+\s]/g, "")); setEmergencySource("manual"); }} required />
                  </div>
                </div>

                <div style={{ marginTop: 14 }}>
                  <SectionLabel>Relevant medical conditions or allergies</SectionLabel>
                  <div className="cl-input" style={{ display: "flex", alignItems: "flex-start", gap: 10, background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 13, padding: "11px 13px" }}>
                    <Stethoscope size={16} color={C.slateLight} style={{ marginTop: 2, flexShrink: 0 }} />
                    <textarea
                      value={conditions}
                      onChange={(e) => setConditions(e.target.value)}
                      placeholder="e.g. asthma (carries inhaler), peanut allergy - leave blank if none"
                      rows={2}
                      style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: T.bodyLg, color: C.jet, resize: "none", ...fBody }}
                    />
                  </div>
                </div>
              </>
            )}

            <div style={{ marginTop: 14, borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 10, background: C.warnTint, borderRadius: 12, padding: 10 }}>
                <AlertTriangle size={14} color={C.warnStrong} style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: T.captionLg, color: C.jet, lineHeight: 1.5, ...fBody }}>Safeguarding: sessions involving minors require a checked-in guardian or approved drop-off arrangement.</span>
              </div>
              <button onClick={() => setConsent(!consent)} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                <div style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${consent ? C.brand : C.border}`, background: consent ? C.brand : C.white, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                  {consent && <CheckCircle2 size={12} color={C.white} />}
                </div>
                <span style={{ fontSize: T.label, color: C.jet, lineHeight: 1.5, ...fBody }}>I confirm I am the parent or legal guardian and consent to this booking.<RequiredMark /></span>
              </button>
            </div>
          </Card>
        )}

        {/* Message for Coach (Optional) */}
        <div style={{ marginBottom: 16 }}>
          <SectionLabel
            icon={MessageCircle}
            hint={`Optional · Share a goal, accessibility need, or anything ${pub.name.split(" ")[0]} should know before the session.`}
          >
            Message for your coach
          </SectionLabel>
          <div
            className="cl-input"
            style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              minHeight: 96, padding: "12px 13px", borderRadius: 13,
              border: `1.5px solid ${C.border}`, background: C.white, marginTop: 6,
            }}
          >
            <MessageCircle aria-hidden="true" size={17} color={C.slateLight} style={{ marginTop: 2, flexShrink: 0 }} />
            <textarea
              aria-label="Message for your coach"
              name="booking-notes"
              value={bookingNotes}
              onChange={(event) => setBookingNotes(event.target.value)}
              placeholder="e.g. I’d like to focus on footwork and shooting technique."
              maxLength={500}
              rows={3}
              style={{
                flex: 1, minHeight: 70, padding: 0, border: "none", outline: "none",
                resize: "none", background: "transparent", color: C.jet,
                fontSize: T.bodyLg, lineHeight: 1.5, ...fBody,
              }}
            />
          </div>
          <div style={{ marginTop: 4, textAlign: "right", fontSize: T.caption, color: C.slateLight, ...fBody }}>
            {bookingNotes.length}/500
          </div>
        </div>

        {/* Cancellation policy */}
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: T.body, fontWeight: 600, color: C.jet, marginBottom: 4, ...fDisplay }}>Cancellation policy</div>
          <div style={{ fontSize: T.captionLg, color: C.slate, lineHeight: 1.5, ...fBody }}>{CONFIG.cancellationPolicy}</div>
        </Card>

        {/* Price Breakdown */}
        <Card style={{ marginBottom: 8 }}>
          <Row label={sessionCount > 1 ? `Session (×${sessionCount})` : "Session"} value={`$${pkg.price.toFixed(2)}${sessionCount > 1 ? ` × ${sessionCount} = $${subtotal.toFixed(2)}` : ""}`} />
          <Row label="Service fee" value={`$${fee.toFixed(2)}`} />
          <Row label="Total" value={`$${totalPrice.toFixed(2)}`} bold last />
        </Card>
      </div>

      {/* Sticky Bottom Action */}
      <div style={{ padding: isDesktop ? "18px 64px 24px" : "14px 18px", paddingBottom: isDesktop ? 24 : "max(28px, env(safe-area-inset-bottom))", borderTop: `1px solid ${C.border}`, background: C.white, flexShrink: 0, boxSizing: "border-box" }}>
        <Btn full disabled={!canContinue} onClick={handleSubmit}>Submit request</Btn>
      </div>
    </div>
  );
}

export const ScreenBookingDateTime = ScreenBookingReview;

export function ScreenPayment({ nav, params, draft, bookings = [], additionalCharges = [], toast, markBookingPaid, biometric, offline }) {
  const { darkMode, coachProfile } = useApp();
  const C = darkMode ? CD : CL;
  const { isDesktop } = useResponsive();
  const booking = params?.bookingId ? bookings.find((item) => item.id === params.bookingId) : null;
  const bookingCoachSeed = booking ? COACHES.find((coach) => coach.id === booking.coachId) : null;
  const bookingCoach = bookingCoachSeed?.id === coachProfile?.id ? coachProfile : bookingCoachSeed;
  const bookingPackage = bookingCoach?.packages.find((pkg) => pkg.name === booking.service) || bookingCoach?.packages[0];
  const bookingDraft = booking && bookingCoach && bookingPackage ? {
    coach: bookingCoach,
    pkg: bookingPackage,
    day: booking.date,
    time: booking.time,
    mode: booking.mode,
    participants: booking.participants || "You",
    repeat: { freq: "once" },
    sessionCount: 1,
    total: Number(booking.paidTotal || booking.price),
  } : null;
  const d = buildFallbackDraft(params, bookingDraft || draft, coachProfile);
  const pub = getPublicName(d.coach, "public");
  const [confirming, setConfirming] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null); // null | "success" | "failed" | "cancelled"
  const [selectedOptionalIds, setSelectedOptionalIds] = useState([]);
  const busy = confirming || processing || result === "success";
  const acceptanceCharges = booking ? additionalCharges.filter((charge) => (
    charge.bookingId === booking.id
    && charge.phase === ADDITIONAL_CHARGE_PHASE.ACCEPTANCE
    && charge.status === ADDITIONAL_CHARGE_STATUS.PENDING
  )) : [];
  const requiredCharges = acceptanceCharges.filter((charge) => charge.kind === ADDITIONAL_CHARGE_KIND.REQUIRED);
  const optionalCharges = acceptanceCharges.filter((charge) => charge.kind === ADDITIONAL_CHARGE_KIND.OPTIONAL);
  const requiredChargeTotal = requiredCharges.reduce((sum, charge) => sum + Number(charge.amount || 0), 0);
  const selectedOptionalTotal = optionalCharges
    .filter((charge) => selectedOptionalIds.includes(charge.id))
    .reduce((sum, charge) => sum + Number(charge.amount || 0), 0);
  const basePrice = Number(booking?.price ?? d.total ?? 0);
  const paymentTotal = basePrice + requiredChargeTotal + selectedOptionalTotal;
  const toggleOptional = (id) => setSelectedOptionalIds((ids) => (
    ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]
  ));

  const pay = (forceFail = false) => {
    if (busy) return;
    if (offline) { toast("You're offline - reconnect to pay"); return; }
    if (!booking || booking.status !== BOOKING_STATUS.AWAITING_PAYMENT) {
      toast("This booking does not have a payment due");
      return;
    }
    setResult(null);
    processAndFinish(forceFail);
  };
  // Simulates submitting the charge to the payment processor before we show success/failure —
  // without this, tapping Pay looked identical whether the charge went through or not.
  const processAndFinish = (forceFail) => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      if (forceFail) {
        setResult("failed");
        return;
      }
      markBookingPaid?.(params.bookingId, selectedOptionalIds);
      haptic([12, 60, 18]);
      toast("Payment confirmed");
      setResult("success");
      setTimeout(() => nav("booking-confirmation", { bookingId: params.bookingId }), 700);
    }, 900);
  };

  const cancelPayment = () => {
    if (busy) return;
    setResult("cancelled");
  };

  if (isDesktop) {
    const summaryRows = [
      { label: "Package", value: `$${basePrice.toFixed(2)}` },
      ...requiredCharges.map((c) => ({ label: c.reason, value: `$${Number(c.amount).toFixed(2)}` })),
      ...(requiredChargeTotal + selectedOptionalTotal > 0
        ? [{ label: "Add-ons & fees", value: `$${(requiredChargeTotal + selectedOptionalTotal).toFixed(2)}` }]
        : []),
    ];
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", position: "relative" }}>
        <TopBar title="Review & pay" onBack={() => nav("client-booking-detail", { id: params?.bookingId })} />
        <div style={{ flex: 1, overflowY: "auto" }} className="cl-hide-scrollbar">
          <div style={{ width: "100%", boxSizing: "border-box", padding: isDesktop ? "64px" : "16px 18px 32px" }}>
            {offline && <StatusBanner state="actionBlockedOffline" compact style={{ marginBottom: 16 }} />}
            {result === "failed" && (
              <StatusBanner state="paymentFailed" onPrimary={() => pay(false)} onSecondary={cancelPayment} primaryLabel="Try again" secondaryLabel="Cancel payment" style={{ marginBottom: 16 }} />
            )}
            {result === "cancelled" && (
              <StatusBanner state="paymentCancelled" onPrimary={() => setResult(null)} primaryLabel="Resume payment" style={{ marginBottom: 16 }} />
            )}
            <SplitView
              ratio="minmax(0, 1fr) 360px"
              gap={28}
              left={
                <Stack gap={18}>
                  {optionalCharges.length > 0 && (
                    <div>
                      <SectionLabel>Optional add-ons</SectionLabel>
                      <Card style={{ padding: "6px 14px" }}>
                        {optionalCharges.map((charge, index) => (
                          <div key={charge.id} style={{ padding: "6px 0", borderBottom: index < optionalCharges.length - 1 ? `1px solid ${C.border}` : "none" }}>
                            <CheckboxRow label={`${charge.reason} · $${Number(charge.amount).toFixed(2)}`} checked={selectedOptionalIds.includes(charge.id)} onClick={() => toggleOptional(charge.id)} />
                            <div style={{ padding: "0 0 8px 29px", marginTop: -5, fontSize: T.captionLg, color: C.slate, lineHeight: 1.45, ...fBody }}>{charge.note}</div>
                          </div>
                        ))}
                      </Card>
                      <div style={{ marginTop: 7, fontSize: T.caption, color: C.slateLight, lineHeight: 1.45, ...fBody }}>Optional items are off by default. Choose only what you want.</div>
                    </div>
                  )}

                  <div>
                    <Btn full variant="dark" disabled={busy || offline} onClick={() => pay(false)}>Pay ${paymentTotal.toFixed(2)} with Pay</Btn>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0" }}>
                      <div style={{ flex: 1, height: 1, background: C.border }} /><span style={{ fontSize: T.captionLg, color: C.slateLight, ...fBody }}>or pay by card</span><div style={{ flex: 1, height: 1, background: C.border }} />
                    </div>
                    <SectionLabel>Saved payment methods</SectionLabel>
                    <Card style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 34, height: 24, borderRadius: 5, background: C.jet, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <CreditCard size={13} color={C.white} />
                      </div>
                      <div style={{ fontSize: T.body, color: C.jet, fontWeight: 500, ...fBody }}>Visa •••• 4821</div>
                      <CheckCircle2 size={16} color={C.brand} style={{ marginLeft: "auto" }} />
                    </Card>
                    <Btn variant="outline" size="sm" icon={Plus} onClick={() => nav("payment-add-card", params)}>Add new card</Btn>
                    <div style={{ marginTop: 18 }}>
                      <Field label="Promo code" placeholder="Enter code" />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <Lock size={13} color={C.slateLight} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: T.captionLg, color: C.slateLight, lineHeight: 1.5, ...fBody }}>Funds are held securely and only released to {pub.name.split(" ")[0]} once you confirm the session is complete.</span>
                  </div>

                  <button onClick={() => pay(true)} disabled={busy || offline} style={{ display: "block", margin: "0 auto", background: "none", border: "none", cursor: busy || offline ? "default" : "pointer", fontSize: T.caption, color: C.slateLight, textDecoration: "underline", ...fBody }}>
                    Use a test card that declines (simulate failure)
                  </button>
                </Stack>
              }
              right={<BookingSummary
                coach={d.coach}
                service={booking?.service || d.pkg.name}
                date={booking?.date || d.day}
                time={booking?.time || d.time}
                rows={summaryRows}
                total={`$${paymentTotal.toFixed(2)}`}
                note={`Funds are held securely and only released to ${pub.name.split(" ")[0]} once you confirm the session is complete.`}
                actions={
                  <>
                    <Btn full loading={processing} loadingText="Processing payment…" disabled={(busy && !processing) || offline} onClick={() => pay(false)}>Pay ${paymentTotal.toFixed(2)} & confirm</Btn>
                    {result !== "failed" && result !== "cancelled" && (
                      <button onClick={cancelPayment} disabled={busy} style={{ display: "block", width: "100%", minHeight: 40, marginTop: 6, background: "none", border: "none", cursor: busy ? "default" : "pointer", fontSize: T.labelLg, color: C.slate, fontWeight: 600, ...fBody }}>Cancel payment</button>
                    )}
                  </>
                }
              />}
            />
          </div>
        </div>
        <ResultOverlay open={processing} state="paymentProcessing" />
        <ResultOverlay open={result === "success"} state="paymentSuccess" title="Payment confirmed" message="Funds are held securely until the session is complete." />
      </div>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", position: "relative" }}>
      <TopBar title="Review & pay" onBack={() => nav("client-booking-detail", { id: params?.bookingId })} />
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px 24px" }} className="cl-hide-scrollbar">
        {offline && (
          <div style={{ marginBottom: 16 }}>
            <StatusBanner state="actionBlockedOffline" compact />
          </div>
        )}
        {result === "failed" && (
          <div style={{ marginBottom: 16 }}>
            <StatusBanner
              state="paymentFailed"
              onPrimary={() => pay(false)}
              onSecondary={cancelPayment}
              primaryLabel="Try again"
              secondaryLabel="Cancel payment"
            />
          </div>
        )}
        {result === "cancelled" && (
          <div style={{ marginBottom: 16 }}>
            <StatusBanner state="paymentCancelled" onPrimary={() => setResult(null)} primaryLabel="Resume payment" />
          </div>
        )}
        <Card style={{ marginBottom: 18, padding: 16, background: darkMode ? C.white : C.brandTint, border: darkMode ? `1px solid ${C.border}` : "none" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: T.captionLg, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", color: C.brand, ...fBody }}>Booking payment</div>
              <div style={{ fontSize: T.titleLg, fontWeight: 760, color: C.jet, marginTop: 4, ...fDisplay }}>{booking?.service || d.pkg.name}</div>
              <div style={{ fontSize: T.captionLg, color: C.slate, marginTop: 3, ...fBody }}>{booking?.date || d.day} · {booking?.time || d.time}</div>
            </div>
            <div style={{ fontSize: T.headingLg, fontWeight: 800, color: C.jet, ...fDisplay }}>${paymentTotal.toFixed(2)}</div>
          </div>
          <Row label="Package" value={`$${basePrice.toFixed(2)}`} />
          {requiredCharges.map((charge) => <Row key={charge.id} label={charge.reason} value={`$${Number(charge.amount).toFixed(2)}`} />)}
          <Row label="Required today" value={`$${(basePrice + requiredChargeTotal).toFixed(2)}`} bold last />
        </Card>

        {optionalCharges.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <SectionLabel>Optional add-ons</SectionLabel>
            <Card style={{ padding: "6px 14px" }}>
              {optionalCharges.map((charge, index) => (
                <div key={charge.id} style={{ padding: "6px 0", borderBottom: index < optionalCharges.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <CheckboxRow label={`${charge.reason} · $${Number(charge.amount).toFixed(2)}`} checked={selectedOptionalIds.includes(charge.id)} onClick={() => toggleOptional(charge.id)} />
                  <div style={{ padding: "0 0 8px 29px", marginTop: -5, fontSize: T.captionLg, color: C.slate, lineHeight: 1.45, ...fBody }}>{charge.note}</div>
                </div>
              ))}
            </Card>
            <div style={{ marginTop: 7, fontSize: T.caption, color: C.slateLight, lineHeight: 1.45, ...fBody }}>Optional items are off by default. Choose only what you want.</div>
          </div>
        )}

        <Btn full variant="dark" disabled={busy || offline} onClick={() => pay(false)}>Pay ${paymentTotal.toFixed(2)} with Pay</Btn>
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
          <div style={{ flex: 1, height: 1, background: C.border }} /><span style={{ fontSize: T.captionLg, color: C.slateLight, ...fBody }}>or pay by card</span><div style={{ flex: 1, height: 1, background: C.border }} />
        </div>
        <SectionLabel>Saved payment methods</SectionLabel>
        <Card style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 24, borderRadius: 5, background: C.jet, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CreditCard size={13} color={C.white} />
          </div>
          <div style={{ fontSize: T.body, color: C.jet, fontWeight: 500, ...fBody }}>Visa •••• 4821</div>
          <CheckCircle2 size={16} color={C.brand} style={{ marginLeft: "auto" }} />
        </Card>
        <Btn variant="outline" size="sm" icon={Plus} onClick={() => nav("payment-add-card", params)}>Add new card</Btn>

        <div style={{ marginTop: 20 }}>
          <Field label="Promo code" placeholder="Enter code" />
        </div>

        <Card style={{ marginTop: 20 }}>
          <Row label="Package" value={`$${basePrice.toFixed(2)}`} />
          {requiredChargeTotal > 0 && <Row label="Required costs" value={`$${requiredChargeTotal.toFixed(2)}`} />}
          {selectedOptionalTotal > 0 && <Row label="Selected add-ons" value={`$${selectedOptionalTotal.toFixed(2)}`} />}
          <Row label="Total due today" value={`$${paymentTotal.toFixed(2)}`} bold last />
        </Card>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 14 }}>
          <Lock size={13} color={C.slateLight} style={{ marginTop: 2, flexShrink: 0 }} />
          <span style={{ fontSize: T.captionLg, color: C.slateLight, lineHeight: 1.5, ...fBody }}>Funds are held securely and only released to {pub.name.split(" ")[0]} once you confirm the session is complete.</span>
        </div>

        <button
          onClick={() => pay(true)}
          disabled={busy || offline}
          style={{ display: "block", margin: "18px auto 0", background: "none", border: "none", cursor: busy || offline ? "default" : "pointer", fontSize: T.caption, color: C.slateLight, textDecoration: "underline", ...fBody }}
        >
          Use a test card that declines (simulate failure)
        </button>
      </div>
      <div style={{ padding: isDesktop ? "18px 64px 24px" : "14px 18px", paddingBottom: isDesktop ? 24 : "max(28px, env(safe-area-inset-bottom))", borderTop: `1px solid ${C.border}`, background: C.white, display: "flex", gap: 10, flexShrink: 0, boxSizing: "border-box" }}>
        {result !== "failed" && result !== "cancelled" && (
          <button onClick={cancelPayment} disabled={busy} style={{ background: "none", border: "none", cursor: busy ? "default" : "pointer", fontSize: T.labelLg, color: C.slate, fontWeight: 600, padding: "0 4px", ...fBody }}>
            Cancel
          </button>
        )}
        <div style={{ flex: 1 }}>
          <Btn full loading={processing} loadingText="Processing payment…" disabled={(busy && !processing) || offline} onClick={() => pay(false)}>Pay ${paymentTotal.toFixed(2)} & confirm</Btn>
        </div>
      </div>

      <ResultOverlay open={processing} state="paymentProcessing" />
      <ResultOverlay open={result === "success"} state="paymentSuccess" title="Payment confirmed" message="Funds are held securely until the session is complete." />
    </div>
  );
}

export function ScreenBookingConfirmation({ nav, params, draft, bookings = [], toast }) {
  const { darkMode, coachProfile } = useApp();
  const { isDesktop } = useResponsive();
  const C = darkMode ? CD : CL;
  const booking = params?.bookingId ? bookings.find((item) => item.id === params.bookingId) : null;
  const bookingCoachSeed = booking ? COACHES.find((coach) => coach.id === booking.coachId) : null;
  const bookingCoach = bookingCoachSeed?.id === coachProfile?.id ? coachProfile : bookingCoachSeed;
  const bookingPackage = bookingCoach?.packages.find((pkg) => pkg.name === booking.service) || bookingCoach?.packages[0];
  const bookingDraft = booking && bookingCoach && bookingPackage ? {
    coach: bookingCoach,
    pkg: bookingPackage,
    day: booking.date,
    time: booking.time,
    mode: booking.mode,
    participants: booking.participants || "You",
    total: Number(booking.paidTotal || booking.price),
  } : null;
  const d = buildFallbackDraft(params, bookingDraft || draft, coachProfile);
  const pub = getPublicName(d.coach, "public");
  const [synced, setSynced] = useState(false);
  const [locShare, setLocShare] = useState(false);
  const confirmedBooking = booking || {
    id: "preview-confirmed",
    status: BOOKING_STATUS.CONFIRMED,
    paymentStatus: "held",
    payoutStatus: "not_ready",
    date: d.day,
    time: d.time,
  };
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>
      <div style={{ flex: 1, overflowY: "auto" }} className="cl-hide-scrollbar cl-modal-screen">
        <div
          style={{
            boxSizing: "border-box",
            padding: isDesktop ? "24px" : "16px",
            maxWidth: isDesktop ? 800 : "100%",
            margin: "0 auto",
            width: "100%",
          }}
        >
          <div style={{ padding: isDesktop ? "0 0 24px" : "18px 22px 4px", textAlign: "center", marginBottom: 14 }}>
            <div style={{ width: 68, height: 68, borderRadius: 23, background: C.successTint, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", boxShadow: `0 14px 28px -22px ${C.success}` }}>
              <CheckCircle2 size={31} color={C.success} />
            </div>
            <div style={{ fontSize: T.display, fontWeight: 750, color: C.jet, letterSpacing: "-0.35px", ...fDisplay }}>You’re officially booked</div>
            <div style={{ fontSize: T.body, color: C.slate, lineHeight: 1.55, marginTop: 6, ...fBody }}>
              Payment is secured and your session with {pub.name} is confirmed.
            </div>
          </div>

          <Card style={{ marginBottom: 14 }}>
            <Row label="Service" value={d.pkg.name} />
            <Row label="When" value={`${d.day} at ${d.time}`} />
            <Row label="Location" value={d.mode} />
            <Row label="Payment" value={`$${Number(d.total || booking?.price || 0).toFixed(2)} · secured`} />
            {d.participants && <Row label="For" value={d.participants} last />}
          </Card>

          <div style={{ marginBottom: 14 }}>
            <SessionJourneyTimeline booking={confirmedBooking} role="client" compact />
          </div>

          <Card style={{ marginBottom: 14, background: C.successTint, border: "none" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <ShieldCheck size={18} color={C.success} style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: T.body, fontWeight: 700, color: C.jet, ...fBody }}>Your payment stays protected</div>
                <div style={{ fontSize: T.captionLg, color: C.slate, lineHeight: 1.5, marginTop: 3, ...fBody }}>Funds are held securely and released to {pub.name.split(" ")[0]} only after session completion is confirmed.</div>
              </div>
            </div>
          </Card>

          <Card style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Calendar size={16} color={C.jet} />
                <span style={{ fontSize: T.body, color: C.jet, fontWeight: 500, ...fBody }}>Sync to device calendar</span>
              </div>
              <Toggle label="Add session to calendar" on={synced} onClick={() => { setSynced((v) => !v); toast(!synced ? "Added to your calendar" : "Removed from calendar"); }} />
            </div>
          </Card>
          <Card style={{ marginBottom: isDesktop ? 20 : 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Navigation size={16} color={C.jet} />
                <span style={{ fontSize: T.body, color: C.jet, fontWeight: 500, ...fBody }}>Share live location during session</span>
              </div>
              <Toggle label="Share live location for this session" on={locShare} onClick={() => setLocShare((v) => !v)} />
            </div>
          </Card>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: isDesktop ? 28 : 20 }}>
            <Btn full onClick={() => nav("client-booking-detail", { id: booking?.id || params?.bookingId })}>View session details</Btn>
            <Btn full variant="outline" icon={MessageCircle} onClick={() => nav("chat-thread", { name: d.coach.name, handle: d.coach.handle, bookingId: booking?.id })}>Message {pub.name.split(" ")[0]}</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Shown right after a client submits a booking request (replacing the old
 * immediate-payment confirmation). No payment has been collected yet — the
 * coach still needs to review, and possibly message the client, before
 * accepting or declining.
 */
export function ScreenBookingRequestSent({ nav, params }) {
  const { darkMode } = useApp();
  const { isDesktop } = useResponsive();
  const C = darkMode ? CD : CL;
  const coach = COACHES.find((c) => c.name === params?.coachName) || COACHES[0];
  const pub = getPublicName(coach, "public");
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: isDesktop ? "center" : "flex-start", padding: isDesktop ? "64px" : "32px 18px", paddingBottom: isDesktop ? "64px" : "max(40px, env(safe-area-inset-bottom))" }} className="cl-hide-scrollbar">
        <div style={{ width: isDesktop ? "100%" : "auto", maxWidth: 480, textAlign: "center" }}>
          <div style={{ width: 60, height: 60, borderRadius: 20, background: C.brandTint, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <Send size={26} color={C.brand} />
          </div>
          <div style={{ fontSize: T.headingLg, fontWeight: 600, color: C.jet, ...fDisplay }}>Booking Request Sent</div>
          <div style={{ fontSize: T.body, color: C.slate, marginTop: 8, lineHeight: 1.6, maxWidth: 300, marginLeft: "auto", marginRight: "auto", ...fBody }}>
            Your booking request has been sent to the coach for review. You'll receive a notification once the coach accepts, requests more information, or declines your request.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 28 }}>
            <Btn full icon={Home} onClick={() => nav("client-home")}>Return to home</Btn>
            <Btn full variant="secondary" icon={MessageCircle} onClick={() => nav("chat-thread", { name: coach.name, handle: coach.handle })}>Message Coach</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
