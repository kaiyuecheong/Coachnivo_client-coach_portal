import React, { useState, useMemo } from "react";
import {
  CalendarDays, Clock, ChevronLeft, ChevronRight, CreditCard, Lock, Check, Plus, Trash2,
  Sunrise, Sun, Moon, Bell, BellOff, MessageCircle, MapPin, Send,
} from "lucide-react";
import { CL, CD, fDisplay, fBody, T } from "../../theme/theme";
import { useApp } from "../../context/AppContext";
import { useResponsive } from "../../theme/responsive";
import { COACHES } from "../../data/mockData";
import {
  Avatar, Card, Btn, TopBar, SectionLabel, Field, Row, RadioRow, BottomSheet,
  StepProgress, StatusPill, EmptyState, HandleTag, RequiredMark,
} from "../../components/ui/Primitives";
import { SportBadge, SportLabel } from "../../components/ui/SportUI";
import { StatusBanner } from "../../systems/StateSystem";
import { getPublicName } from "../../utils/name";
import { availabilityBlocksToWeekly } from "../../utils/coachProfile";
import {
  buildMonthGrid, sameDay, dayAvailability, slotsForDate, groupSlotsByPeriod,
  formatTimeRange12, formatFullDateFromDate, formatTime12,
} from "./Booking";

/* =========================================================================
   1. STANDALONE DATE & TIME PICKER
   -------------------------------------------------------------------------
   Full-screen calendar + time slot grid that lives inside the booking flow.
   When a user arrives without a preset date/time (deep link, back-button
   re-entry, or skipped the CoachProfile calendar), this screen lets them
   pick one without leaving the booking flow.
   ========================================================================= */

const WEEKDAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const PERIOD_ICONS = { Morning: Sunrise, Afternoon: Sun, Evening: Moon };

export function ScreenBookingSelectDateTime({ nav, params }) {
  const { darkMode, coachProfile, coachPackages, availabilityBlocks } = useApp();
  const C = darkMode ? CD : CL;
  const { isDesktop } = useResponsive();
  const listedCoach = COACHES.find((c) => c.id === params?.coachId) || COACHES[0];
  const coach = listedCoach.id === coachProfile?.id ? coachProfile : listedCoach;
  const pkg = coach.packages.find((p) => p.id === params?.packageId) || coach.packages[0];
  const availability = coach.id === coachProfile?.id && availabilityBlocks?.length
    ? availabilityBlocksToWeekly(availabilityBlocks, pkg, coachPackages)
    : coach.availability;
  const pub = getPublicName(coach, "public");

  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  const weeks = useMemo(() => buildMonthGrid(cursor), [cursor]);
  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const today = new Date();
  const isCurrentMonth = cursor.getFullYear() === today.getFullYear() && cursor.getMonth() === today.getMonth();

  const goPrev = () => { if (!isCurrentMonth) setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1)); };
  const goNext = () => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1));

  const pickDate = (d, state) => {
    if (state === "unavailable") return;
    setSelectedDate((prev) => (prev && sameDay(prev, d) ? null : d));
    setSelectedTime(null);
  };

  const daySlots = selectedDate ? slotsForDate(selectedDate, coach, availability) : [];
  const grouped = groupSlotsByPeriod(daySlots);
  const duration = pkg.duration || 60;

  const canContinue = selectedDate && selectedTime;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar title="Choose a time" onBack={() => nav("package-detail", { coachId: coach.id, packageId: pkg.id })} />

      <div style={{ flex: 1, overflowY: "auto", width: "100%", padding: isDesktop ? "64px" : "16px 18px 24px" }} className="cl-hide-scrollbar">
        <div style={{ fontSize: T.labelLg, color: C.slate, lineHeight: 1.5, marginBottom: 16, ...fBody }}>
          Pick a date and time for your {pkg.name} session with {pub.name}.
        </div>

        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <button type="button" aria-label="Previous month" onClick={goPrev} disabled={isCurrentMonth} style={{ width: 44, height: 44, borderRadius: 12, background: darkMode ? "transparent" : C.fog, border: darkMode ? `1px solid ${C.border}` : "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: isCurrentMonth ? "default" : "pointer", opacity: isCurrentMonth ? 0.4 : 1 }}>
              <ChevronLeft size={16} color={C.jet} />
            </button>
            <span style={{ fontSize: T.bodyLg, fontWeight: 700, color: C.jet, ...fDisplay }}>{monthLabel}</span>
            <button type="button" aria-label="Next month" onClick={goNext} style={{ width: 44, height: 44, borderRadius: 12, background: darkMode ? "transparent" : C.fog, border: darkMode ? `1px solid ${C.border}` : "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <ChevronRight size={16} color={C.jet} />
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 6 }}>
            {WEEKDAY_HEADERS.map((d) => (
              <div key={d} style={{ textAlign: "center", fontSize: T.micro, fontWeight: 700, color: C.slateLight, ...fBody }}>{d}</div>
            ))}
          </div>

          {weeks.map((row, ri) => (
            <div key={ri} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
              {row.map((d, di) => {
                const inRange = d.getMonth() === cursor.getMonth();
                const state = dayAvailability(d, coach, availability);
                const isSelected = selectedDate && sameDay(d, selectedDate);
                const isToday = sameDay(d, today);
                const disabled = !inRange || state === "unavailable";

                let background = C.white;
                let border = C.border;
                let color = C.jet;
                if ((state === "available" || state === "limited") && inRange) border = C.brand;
                if (disabled) color = C.slateLight;
                if (isToday && inRange && !isSelected) border = C.brand;
                if (isSelected) { background = C.brand; border = C.brand; color = C.white; }

                return (
                  <button
                    key={di}
                    onClick={() => pickDate(d, state)}
                    disabled={disabled}
                    style={{
                      aspectRatio: "1", borderRadius: 10, position: "relative",
                      border: `1.5px solid ${border}`, background,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      opacity: inRange ? 1 : 0.3, cursor: disabled ? "not-allowed" : "pointer", boxSizing: "border-box",
                    }}
                  >
                    <span style={{ fontSize: T.label, fontWeight: isSelected || isToday ? 700 : 500, color, ...fBody }}>{d.getDate()}</span>
                  </button>
                );
              })}
            </div>
          ))}

          <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap", justifyContent: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: T.tiny, color: C.slate, ...fBody }}>
              <span style={{ width: 9, height: 9, borderRadius: 3, border: `1.5px solid ${C.brand}` }} /> Available
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: T.tiny, color: C.slate, ...fBody }}>
              <span style={{ width: 9, height: 9, borderRadius: 3, background: C.fog, border: `1.5px solid ${C.border}` }} /> Unavailable
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: T.tiny, color: C.slate, ...fBody }}>
              <span style={{ width: 9, height: 9, borderRadius: 3, background: C.brand }} /> Selected
            </span>
          </div>
        </Card>

        {selectedDate && (
          <div>
            <SectionLabel>Available times for {formatFullDateFromDate(selectedDate)}</SectionLabel>
            {daySlots.length === 0 ? (
              <Card style={{ textAlign: "center" }}>
                <span style={{ fontSize: T.labelLg, color: C.slate, ...fBody }}>No time slots available on this day.</span>
              </Card>
            ) : (
              ["Morning", "Afternoon", "Evening"].filter((p) => grouped[p].length > 0).map((period) => {
                const PeriodIcon = PERIOD_ICONS[period];
                return (
                  <div key={period} style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <PeriodIcon size={13} color={C.slateLight} />
                      <span style={{ fontSize: T.captionLg, fontWeight: 700, color: C.slate, ...fBody }}>{period}</span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {grouped[period].map((t) => {
                        const active = selectedTime === t;
                        return (
                          <button
                            key={t}
                            onClick={() => setSelectedTime((prev) => (prev === t ? null : t))}
                            style={{
                              padding: "10px 16px", borderRadius: 999,
                              border: `1.5px solid ${active ? C.brand : C.border}`,
                              background: active ? C.brand : C.white,
                              color: active ? C.white : C.jet,
                              fontSize: T.labelLg, fontWeight: 600, cursor: "pointer", ...fBody,
                              boxShadow: active ? `0 2px 8px rgba(27, 94, 32, 0.2)` : "none",
                              transition: "background .15s ease, border-color .15s ease, color .15s ease, transform .15s ease",
                            }}
                          >
                            {formatTimeRange12(t, duration)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      <div style={{ padding: isDesktop ? "18px 64px 24px" : "14px 18px", paddingBottom: isDesktop ? 24 : "max(28px, env(safe-area-inset-bottom))", borderTop: `1px solid ${C.border}`, background: C.white, flexShrink: 0, boxSizing: "border-box" }}>
        <Btn
          full
          disabled={!canContinue}
          onClick={() => nav("booking-participants", {
            coachId: coach.id,
            packageId: pkg.id,
            presetDate: selectedDate.toISOString(),
            presetTime: selectedTime,
          })}
        >
          Continue
        </Btn>
      </div>
    </div>
  );
}

/* =========================================================================
   2. ADD PAYMENT METHOD
   -------------------------------------------------------------------------
   Card entry form for adding a new payment method. Simulates card validation
   and saves to a local list (in a real app this would hit a payment SDK).
   ========================================================================= */

export function ScreenPaymentAddCard({ nav, params, toast }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const { isDesktop } = useResponsive();

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [postcode, setPostcode] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const returnTo = params?.returnTo || "payment";
  const returnParams = params?.returnParams || params;

  const formatCardNumber = (v) => {
    const digits = v.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const formatExpiry = (v) => {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  };

  const isValid = cardNumber.replace(/\s/g, "").length === 16
    && expiry.length === 5
    && cvv.length >= 3
    && postcode.length >= 4
    && name.trim().length > 0;

  const detectBrand = () => {
    const num = cardNumber.replace(/\s/g, "");
    if (num.startsWith("4")) return "Visa";
    if (num.startsWith("5") || num.startsWith("2")) return "Mastercard";
    if (num.startsWith("3")) return "Amex";
    return null;
  };

  const brand = detectBrand();

  const save = () => {
    if (!isValid) return;
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast && toast("Card added successfully");
      nav(returnTo, returnParams);
    }, 800);
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar title="Add payment method" onBack={() => nav(returnTo, returnParams)} />

      <div style={{ flex: 1, overflowY: "auto", padding: isDesktop ? "64px" : "16px 18px 24px" }} className="cl-hide-scrollbar">
        <div style={{ maxWidth: isDesktop ? 600 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
          <div style={{ fontSize: T.labelLg, color: C.slate, lineHeight: 1.5, marginBottom: 20, ...fBody }}>
            Add a card to pay securely. Your details are encrypted and never stored on our servers.
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: T.labelLg, fontWeight: 600, color: C.jet, marginBottom: 6, ...fBody }}>Card number<RequiredMark /></div>
            <div className="cl-input" style={{ display: "flex", alignItems: "center", gap: 10, border: `1.5px solid ${C.border}`, borderRadius: 13, padding: "11px 13px", background: C.white }}>
              <CreditCard size={16} color={C.slateLight} />
              <input
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                style={{ flex: 1, border: "none", outline: "none", fontSize: T.bodyLg, color: C.jet, background: "transparent", ...fBody }}
              />
              {brand && (
                <span style={{ fontSize: T.caption, fontWeight: 700, color: C.brand, ...fBody }}>{brand}</span>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: T.labelLg, fontWeight: 600, color: C.jet, marginBottom: 6, ...fBody }}>Expiry<RequiredMark /></div>
              <input
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                placeholder="MM/YY"
                maxLength={5}
                className="cl-input"
                style={{ width: "100%", border: `1.5px solid ${C.border}`, borderRadius: 13, padding: "11px 13px", fontSize: T.bodyLg, outline: "none", boxSizing: "border-box", color: C.jet, background: C.white, ...fBody }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: T.labelLg, fontWeight: 600, color: C.jet, marginBottom: 6, ...fBody }}>CVV<RequiredMark /></div>
              <div className="cl-input" style={{ display: "flex", alignItems: "center", gap: 8, border: `1.5px solid ${C.border}`, borderRadius: 13, padding: "11px 13px", background: C.white }}>
                <Lock size={14} color={C.slateLight} />
                <input
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="123"
                  maxLength={4}
                  type="password"
                  style={{ flex: 1, border: "none", outline: "none", fontSize: T.bodyLg, color: C.jet, background: "transparent", ...fBody }}
                />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: T.labelLg, fontWeight: 600, color: C.jet, marginBottom: 6, ...fBody }}>Billing postcode<RequiredMark /></div>
            <input
              value={postcode}
              onChange={(e) => setPostcode(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="e.g. 3000"
              maxLength={4}
              className="cl-input"
              style={{ width: "100%", border: `1.5px solid ${C.border}`, borderRadius: 13, padding: "11px 13px", fontSize: T.bodyLg, outline: "none", boxSizing: "border-box", color: C.jet, background: C.white, ...fBody }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <Field label="Cardholder name" placeholder="As it appears on your card" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: C.fog, borderRadius: 12, padding: 12, marginTop: 8 }}>
            <Lock size={13} color={C.slateLight} style={{ marginTop: 2, flexShrink: 0 }} />
            <span style={{ fontSize: T.captionLg, color: C.slateLight, lineHeight: 1.5, ...fBody }}>Your card details are encrypted end-to-end. We never store your full card number.</span>
          </div>
        </div>
      </div>

      <div style={{
        padding: isDesktop ? "20px 64px 28px" : "14px 18px",
        paddingBottom: isDesktop ? "28px" : "max(28px, env(safe-area-inset-bottom))",
        borderTop: `1px solid ${C.border}`,
        background: C.white,
        flexShrink: 0,
      }}>
        <div style={{ maxWidth: isDesktop ? 600 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
          <Btn full disabled={!isValid || saving} loading={saving} loadingText="Saving card…" onClick={save}>
            Save card
          </Btn>
        </div>
      </div>
    </div>
  );
}



/* =========================================================================
   4. PRE-BOOKING INQUIRY
   -------------------------------------------------------------------------
   Contextual message screen that lets a client ask a coach a question about
   a specific package before committing to a booking. Pre-fills the message
   thread with package context.
   ========================================================================= */

export function ScreenPackageInquiry({ nav, params, toast }) {
  const { isDesktop } = useResponsive();
  const { darkMode, clientIdentity } = useApp();
  const C = darkMode ? CD : CL;

  const coach = COACHES.find((c) => c.id === params?.coachId) || COACHES[0];
  const pkg = coach.packages.find((p) => p.id === params?.packageId) || coach.packages[0];
  const pub = getPublicName(coach, "public");

  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const quickQuestions = [
    `Is ${pkg.name} suitable for beginners?`,
    "What equipment do I need to bring?",
    "Can you accommodate any specific needs?",
    "What's your cancellation policy for this package?",
  ];

  const send = () => {
    if (!message.trim()) return;
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
    }, 600);
  };

  if (sent) {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "0 18px" }}>
        <div style={{ width: 60, height: 60, borderRadius: 20, background: C.successTint, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <Send size={26} color={C.success} />
        </div>
        <div style={{ fontSize: T.headingLg, fontWeight: 600, color: C.jet, textAlign: "center", ...fDisplay }}>Message sent</div>
        <div style={{ fontSize: T.body, color: C.slate, marginTop: 6, textAlign: "center", maxWidth: 280, lineHeight: 1.5, ...fBody }}>
          {pub.name} will receive your question and respond shortly. You'll be notified when they reply.
        </div>
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
          <Btn full onClick={() => nav("chat-thread", { name: coach.name, handle: coach.handle })}>View conversation</Btn>
          <Btn full variant="secondary" onClick={() => nav("package-detail", { coachId: coach.id, packageId: pkg.id })}>Back to package</Btn>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar title="Ask a question" onBack={() => nav("package-detail", { coachId: coach.id, packageId: pkg.id })} />

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px 24px" }} className="cl-hide-scrollbar">
        <Card style={{ marginBottom: 16, display: "flex", gap: 12, alignItems: "center" }}>
          <Avatar name={pub.name} size={40} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: T.bodyLg, fontWeight: 700, color: C.jet, ...fDisplay }}>{pub.name}</div>
            <div style={{ marginTop: 4 }}><SportLabel sport={coach.sport} size={14} color={C.slate} style={{ fontSize: T.label, ...fBody }} /></div>
            <div style={{ fontSize: T.captionLg, color: C.slateLight, marginTop: 3, ...fBody }}>{coach.suburb}</div>
          </div>
        </Card>

        <Card style={{ marginBottom: 16, background: darkMode ? C.white : C.brandTint, border: darkMode ? `1px solid ${C.border}` : "none" }}>
          <div style={{ fontSize: T.captionLg, fontWeight: 600, color: C.brand, marginBottom: 4, ...fBody }}>Asking about</div>
          <div style={{ fontSize: T.bodyLg, fontWeight: 700, color: C.jet, ...fDisplay }}>{pkg.name}</div>
          <div style={{ fontSize: T.label, color: C.slate, marginTop: 2, ...fBody }}>${pkg.price} · {pkg.duration} min · {pkg.mode}</div>
        </Card>

        <SectionLabel>Quick questions</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
          {quickQuestions.map((q) => (
            <button
              key={q}
              onClick={() => setMessage(q)}
              style={{
                width: "100%", textAlign: "left", padding: "12px 14px", borderRadius: 12,
                border: `1px solid ${C.border}`, background: message === q ? C.brandTint : C.white,
                color: message === q ? (C.brandIcon || C.brandColor) : C.jet,
                fontSize: T.bodyLg, cursor: "pointer", ...fBody,
              }}
            >
              {q}
            </button>
          ))}
        </div>

        <SectionLabel required>Your message</SectionLabel>
        <div className="cl-input" style={{ display: "flex", alignItems: "flex-start", gap: 10, background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 13, padding: "11px 13px" }}>
          <MessageCircle size={16} color={C.slateLight} style={{ marginTop: 2, flexShrink: 0 }} />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Ask ${pub.name.split(" ")[0]} about ${pkg.name}…`}
            rows={4}
            style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: T.bodyLg, color: C.jet, resize: "none", ...fBody }}
          />
        </div>
      </div>

      <div style={{ padding: isDesktop ? "18px 64px 24px" : "14px 18px", paddingBottom: isDesktop ? 24 : "max(28px, env(safe-area-inset-bottom))", borderTop: `1px solid ${C.border}`, background: C.white, flexShrink: 0, boxSizing: "border-box" }}>
        <Btn full disabled={!message.trim() || sending} loading={sending} loadingText="Sending…" onClick={send}>
          Send message
        </Btn>
      </div>
    </div>
  );
}

/* =========================================================================
   5. WAITLIST / NOTIFY ME
   -------------------------------------------------------------------------
   Screen shown when a package is unavailable. Lets the client opt in to
   notifications when the coach opens new slots.
   ========================================================================= */

export function ScreenPackageWaitlist({ nav, params, toast }) {
  const { darkMode } = useApp();
  const { isDesktop } = useResponsive();
  const C = darkMode ? CD : CL;

  const coach = COACHES.find((c) => c.id === params?.coachId) || COACHES[0];
  const pkg = coach.packages.find((p) => p.id === params?.packageId) || coach.packages[0];
  const pub = getPublicName(coach, "public");

  const [notifEnabled, setNotifEnabled] = useState(true);
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSaved(true);
    toast && toast(notifEnabled ? "You'll be notified when slots open" : "Preference saved");
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar title="Join waitlist" onBack={() => nav("package-detail", { coachId: coach.id, packageId: pkg.id })} />

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px 24px" }} className="cl-hide-scrollbar">
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: 22, background: C.brandTint, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Bell size={32} color={C.brand} />
          </div>
        </div>

        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: T.headingLg, fontWeight: 600, color: C.jet, ...fDisplay }}>
            {pkg.name} is currently unavailable
          </div>
          <div style={{ fontSize: T.body, color: C.slate, marginTop: 6, lineHeight: 1.6, maxWidth: 300, marginLeft: "auto", marginRight: "auto", ...fBody }}>
            {pub.name} doesn't have any open slots for this package right now, but you can join the waitlist to be notified when availability opens up.
          </div>
        </div>

        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Avatar name={pub.name} size={40} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: T.bodyLg, fontWeight: 700, color: C.jet, ...fDisplay }}>{pub.name}</div>
              <div style={{ marginTop: 4 }}><SportLabel sport={coach.sport} size={14} color={C.slate} style={{ fontSize: T.label, ...fBody }} /></div>
              <div style={{ fontSize: T.captionLg, color: C.slateLight, marginTop: 3, ...fBody }}>{coach.suburb}</div>
            </div>
          </div>
        </Card>

        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {notifEnabled ? <Bell size={16} color={C.brand} /> : <BellOff size={16} color={C.slateLight} />}
              <span style={{ fontSize: T.bodyLg, fontWeight: 600, color: C.jet, ...fBody }}>Notify me when available</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={notifEnabled}
              aria-label="Notify me when this package is available"
              onClick={() => setNotifEnabled((v) => !v)}
              style={{
                width: 48, height: 28, borderRadius: 999,
                background: notifEnabled ? C.brand : C.border,
                border: "none", cursor: "pointer", position: "relative",
                transition: "background 0.2s ease",
              }}
            >
              <div style={{
                width: 22, height: 22, borderRadius: 999, background: C.white,
                position: "absolute", top: 3, left: notifEnabled ? 23 : 3,
                transition: "left 0.2s ease",
                boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
              }} />
            </button>
          </div>
          {notifEnabled && (
            <div style={{ fontSize: T.label, color: C.slate, marginTop: 8, lineHeight: 1.5, ...fBody }}>
              We'll send you a notification as soon as {pub.name.split(" ")[0]} opens new time slots for this package.
            </div>
          )}
        </Card>

        <Card>
          <div style={{ fontSize: T.bodyLg, fontWeight: 600, color: C.jet, marginBottom: 6, ...fDisplay }}>While you wait</div>
          <div style={{ fontSize: T.label, color: C.slate, lineHeight: 1.5, ...fBody }}>
            You can message {pub.name.split(" ")[0]} directly to discuss alternative times or packages that might work for you.
          </div>
          <div style={{ marginTop: 12 }}>
            <Btn size="sm" variant="outline" icon={MessageCircle} onClick={() => nav("chat-thread", { name: coach.name, handle: coach.handle })}>Message {pub.name.split(" ")[0]}</Btn>
          </div>
        </Card>
      </div>

      <div style={{ padding: isDesktop ? "18px 64px 24px" : "14px 18px", paddingBottom: isDesktop ? 24 : "max(28px, env(safe-area-inset-bottom))", borderTop: `1px solid ${C.border}`, background: C.white, flexShrink: 0, boxSizing: "border-box" }}>
        {saved ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 0" }}>
            <Check size={18} color={C.success} />
            <span style={{ fontSize: T.subtitleLg, fontWeight: 600, color: C.success, ...fBody }}>You're on the list</span>
          </div>
        ) : (
          <Btn full onClick={save}>Join waitlist</Btn>
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   6. SESSION PREPARATION
   -------------------------------------------------------------------------
   Pre-session checklist shown after booking is confirmed. Includes venue
   directions, equipment list, and preparation tips.
   ========================================================================= */

export function ScreenSessionPrep({ nav, params }) {
  const { darkMode } = useApp();
  const { isDesktop } = useResponsive();
  const C = darkMode ? CD : CL;

  const coach = COACHES.find((c) => c.id === params?.coachId) || COACHES[0];
  const pkg = coach.packages.find((p) => p.id === params?.packageId) || coach.packages[0];
  const pub = getPublicName(coach, "public");

  const mode = pkg.mode || "In-person";
  const isOnline = /online|virtual/i.test(mode);
  const isTravel = /come to you|travel/i.test(mode);
  const venue = pkg.venue || coach.venue || "Venue to be confirmed";

  const checklist = [
    { label: "Water bottle", checked: false },
    { label: "Comfortable sportswear", checked: false },
    { label: "Athletic shoes", checked: false },
    ...(pkg.equipment ? [{ label: pkg.equipment, checked: false }] : []),
    ...(isOnline ? [{ label: "Stable internet connection", checked: false }, { label: "Camera and microphone", checked: false }] : []),
  ];

  const [items, setItems] = useState(checklist);
  const toggle = (i) => setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, checked: !item.checked } : item));

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar title="Session prep" onBack={() => nav("client-dashboard")} />

      <div style={{ flex: 1, overflowY: "auto", padding: isDesktop ? "40px 64px 32px" : "16px 18px 24px" }} className="cl-hide-scrollbar">
        <Card style={{ marginBottom: 16, display: "flex", gap: 12, alignItems: "center" }}>
          <Avatar name={pub.name} size={44} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: T.subtitleLg, fontWeight: 700, color: C.jet, ...fDisplay }}>{pkg.name}</div>
            <div style={{ fontSize: T.label, color: C.slate, marginTop: 2, ...fBody }}>with {pub.name}</div>
          </div>
          <div style={{ fontSize: T.body, fontWeight: 600, color: C.brand, ...fBody }}>{params?.date || "Tomorrow"}</div>
        </Card>

        <SectionLabel>Venue & directions</SectionLabel>
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <MapPin size={15} color={C.brand} style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: T.body, fontWeight: 600, color: C.jet, ...fBody }}>{isOnline ? "Online Session" : venue}</div>
              <div style={{ fontSize: T.label, color: C.slate, marginTop: 2, lineHeight: 1.5, ...fBody }}>
                {isOnline
                  ? "A meeting link will be shared once your booking is confirmed."
                  : isTravel
                    ? `${pub.name.split(" ")[0]} will travel to your location.`
                    : `${coach.suburb}, Melbourne`}
              </div>
            </div>
          </div>
        </Card>

        <SectionLabel>What to bring</SectionLabel>
        <Card style={{ marginBottom: 16 }}>
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => toggle(i)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
                background: "none", border: "none", cursor: "pointer", textAlign: "left",
                borderBottom: i === items.length - 1 ? "none" : `1px solid ${C.border}`,
              }}
            >
              <div style={{
                width: 22, height: 22, borderRadius: 7, flexShrink: 0,
                border: `1.5px solid ${item.checked ? C.brand : C.border}`,
                background: item.checked ? C.brand : C.white,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {item.checked && <Check size={13} color={C.white} strokeWidth={3} />}
              </div>
              <span style={{
                fontSize: T.bodyLg, color: item.checked ? C.slateLight : C.jet,
                textDecoration: item.checked ? "line-through" : "none", ...fBody,
              }}>{item.label}</span>
            </button>
          ))}
        </Card>

        <SectionLabel>Tips for a great session</SectionLabel>
        <Card>
          <div style={{ fontSize: T.label, color: C.slate, lineHeight: 1.6, ...fBody }}>
            Arrive 5 minutes early to warm up. {isOnline ? "Test your camera and internet connection before the session starts." : `Make your way to ${venue} - look for ${pub.name.split(" ")[0]} near the entrance.`} Bring a positive attitude and be ready to work!
          </div>
        </Card>

        <div style={{ marginTop: 24, paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}>
          <Btn full onClick={() => nav("client-dashboard")}>Got it</Btn>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   7. REFUND STATUS
   -------------------------------------------------------------------------
   Shows the current state of a refund after a booking is cancelled —
   processing, completed, or disputed.
   ========================================================================= */

export function ScreenRefundStatus({ nav, params }) {
  const { darkMode } = useApp();
  const { isDesktop } = useResponsive();
  const C = darkMode ? CD : CL;

  const booking = params?.booking;
  const status = booking?.refundStatus || "processing";
  const amount = Number(booking?.paidTotal || booking?.price || 0);

  const steps = [
    { label: "Cancellation submitted", done: true, time: "Just now" },
    { label: "Refund processing", done: status !== "processing", time: status === "processing" ? "In progress" : "Completed" },
    { label: "Funds returned", done: status === "refunded", time: status === "refunded" ? "Returned to card •••• 4821" : "3–5 business days" },
  ];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar title="Refund status" onBack={() => nav("client-booking-detail", { id: booking?.id })} />

      <div style={{ flex: 1, overflowY: "auto", padding: isDesktop ? "40px 64px 32px" : "16px 18px 24px" }} className="cl-hide-scrollbar">
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20, margin: "0 auto 14px",
            background: status === "refunded" ? C.successTint : C.brandTint,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {status === "refunded"
              ? <Check size={28} color={C.success} />
              : <Clock size={28} color={C.brand} />
            }
          </div>
          <div style={{ fontSize: T.headingLg, fontWeight: 600, color: C.jet, ...fDisplay }}>
            {status === "refunded" ? "Refund complete" : "Refund in progress"}
          </div>
          <div style={{ fontSize: T.body, color: C.slate, marginTop: 4, ...fBody }}>
            ${amount.toFixed(2)} is being refunded to your original payment method.
          </div>
        </div>

        <Card style={{ marginBottom: 16 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: i === steps.length - 1 ? "none" : `1px solid ${C.border}` }}>
              <div style={{
                width: 22, height: 22, borderRadius: 999, flexShrink: 0, marginTop: 1,
                background: s.done ? C.success : C.fog,
                border: `1.5px solid ${s.done ? C.success : C.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {s.done && <Check size={12} color={C.white} strokeWidth={3} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: T.bodyLg, fontWeight: 600, color: s.done ? C.jet : C.slate, ...fBody }}>{s.label}</div>
                <div style={{ fontSize: T.label, color: C.slate, marginTop: 2, ...fBody }}>{s.time}</div>
              </div>
            </div>
          ))}
        </Card>

        <Card>
          <div style={{ fontSize: T.body, fontWeight: 600, color: C.jet, marginBottom: 6, ...fDisplay }}>Need help?</div>
          <div style={{ fontSize: T.label, color: C.slate, lineHeight: 1.5, ...fBody }}>
            If your refund hasn't arrived within 5 business days, contact our support team and we'll look into it for you.
          </div>
          <div style={{ marginTop: 12 }}>
            <Btn size="sm" variant="outline" onClick={() => nav("support")}>Contact support</Btn>
          </div>
        </Card>

        <div style={{ marginTop: 24, paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}>
          <Btn full onClick={() => nav("client-dashboard")}>Back to sessions</Btn>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   8. COACH RESPONSE / BOOKING MESSAGE
   -------------------------------------------------------------------------
   In-flow message thread for when a coach declines or requests changes
   to a booking. Shows the booking context alongside the conversation.
   ========================================================================= */

export function ScreenBookingMessage({ nav, params, toast }) {
  const { darkMode, clientIdentity } = useApp();
  const C = darkMode ? CD : CL;

  const coach = COACHES.find((c) => c.id === params?.coachId) || COACHES[0];
  const pub = getPublicName(coach, "public");
  const booking = params?.booking;
  const messageType = params?.type || "decline"; // "decline" | "modify" | "info"

  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const messages = [
    {
      from: "coach",
      text: messageType === "decline"
        ? `Hi, thanks for your interest in the ${booking?.service || "session"}. Unfortunately I'm unable to take on this booking at the moment. Feel free to check my other available times or message me to discuss alternatives.`
        : messageType === "modify"
        ? `Hi! I'd love to work with you on this, but the ${booking?.service || "session"} time you selected doesn't quite work for me. Would you be open to a different time? I have availability on weekdays after 4pm.`
        : `Thanks for your booking request! I just wanted to confirm - do you have any specific goals or areas you'd like to focus on during the session? This will help me prepare the best session plan for you.`,
      time: "2 hours ago",
    },
  ];

  const send = () => {
    if (!reply.trim()) return;
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast && toast("Reply sent");
      setReply("");
    }, 600);
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar title={pub.name} onBack={() => nav("client-dashboard")} />

      {booking && (
        <div style={{ padding: "10px 18px", background: C.fog, borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: T.label, fontWeight: 600, color: C.jet, ...fBody }}>{booking.service}</div>
          <div style={{ fontSize: T.captionLg, color: C.slate, ...fBody }}>{booking.date} · {booking.time}</div>
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px" }} className="cl-hide-scrollbar">
        {messageType === "decline" && (
          <div style={{ marginBottom: 16 }}>
            <StatusBanner state="bookingDeclined" compact />
          </div>
        )}
        {messageType === "modify" && (
          <div style={{ marginBottom: 16 }}>
            <StatusBanner state="scheduleConflict" compact />
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", gap: 10, marginBottom: 16, flexDirection: m.from === "coach" ? "row" : "row-reverse" }}>
            <Avatar name={m.from === "coach" ? pub.name : clientIdentity?.firstName || "You"} size={32} />
            <div style={{ maxWidth: "78%" }}>
              <div style={{
                padding: "12px 14px", borderRadius: 16,
                background: m.from === "coach" ? C.fog : C.brand,
                color: m.from === "coach" ? C.jet : C.white,
                fontSize: T.bodyLg, lineHeight: 1.55, ...fBody,
              }}>
                {m.text}
              </div>
              <div style={{ fontSize: T.tiny, color: C.slateLight, marginTop: 4, ...fBody }}>{m.time}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: "12px 18px", paddingBottom: "max(28px, env(safe-area-inset-bottom))", borderTop: `1px solid ${C.border}`, background: C.white, display: "flex", gap: 10, flexShrink: 0 }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, border: `1.5px solid ${C.border}`, borderRadius: 999, padding: "10px 14px", background: C.white }}>
          <input
            name="coach-response"
            aria-label="Reply to coach"
            autoComplete="off"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Type a reply…"
            onKeyDown={(e) => e.key === "Enter" && send()}
            style={{ flex: 1, border: "none", outline: "none", fontSize: T.bodyLg, color: C.jet, background: "transparent", ...fBody }}
          />
        </div>
        <button
          type="button"
          aria-label="Send reply"
          onClick={send}
          disabled={!reply.trim() || sending}
          style={{
            width: 42, height: 42, borderRadius: 999, flexShrink: 0,
            background: reply.trim() ? C.brand : C.fog,
            border: "none", cursor: reply.trim() ? "pointer" : "default",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.15s ease",
          }}
        >
          <Send size={17} color={reply.trim() ? C.white : C.slateLight} />
        </button>
      </div>
    </div>
  );
}

/* =========================================================================
   9. FULL-SCREEN AVAILABILITY CALENDAR
   -------------------------------------------------------------------------
   Expanded calendar view for browsing a coach's full availability. Opens
   as a full screen rather than the cramped inline calendar on the profile.
   ========================================================================= */

export function ScreenAvailabilityCalendar({ nav, params }) {
  const { darkMode, coachProfile, coachPackages, availabilityBlocks } = useApp();
  const C = darkMode ? CD : CL;

  const listedCoach = COACHES.find((c) => c.id === params?.coachId) || COACHES[0];
  const coach = listedCoach.id === coachProfile?.id ? coachProfile : listedCoach;
  const pkg = params?.packageId ? coach.packages.find((p) => p.id === params.packageId) : null;
  const availability = coach.id === coachProfile?.id && availabilityBlocks?.length
    ? availabilityBlocksToWeekly(availabilityBlocks, pkg, coachPackages)
    : coach.availability;
  const pub = getPublicName(coach, "public");

  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  const weeks = useMemo(() => buildMonthGrid(cursor), [cursor]);
  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const today = new Date();
  const isCurrentMonth = cursor.getFullYear() === today.getFullYear() && cursor.getMonth() === today.getMonth();

  const goPrev = () => { if (!isCurrentMonth) setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1)); };
  const goNext = () => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1));

  const pickDate = (d, state) => {
    if (state === "unavailable") return;
    setSelectedDate((prev) => (prev && sameDay(prev, d) ? null : d));
    setSelectedTime(null);
  };

  const daySlots = selectedDate ? slotsForDate(selectedDate, coach, availability) : [];
  const grouped = groupSlotsByPeriod(daySlots);
  const duration = pkg?.duration || 60;

  const confirm = () => {
    if (!selectedDate || !selectedTime) return;
    if (pkg) {
      nav("booking-participants", {
        coachId: coach.id,
        packageId: pkg.id,
        presetDate: selectedDate.toISOString(),
        presetTime: selectedTime,
      });
    } else {
      nav("coach-profile", { id: coach.id });
    }
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar title={`${pub.name}'s availability`} onBack={() => nav("coach-profile", { id: coach.id })} />

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px 24px" }} className="cl-hide-scrollbar">
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <button type="button" aria-label="Previous month" onClick={goPrev} disabled={isCurrentMonth} style={{ width: 44, height: 44, borderRadius: 12, background: darkMode ? "transparent" : C.fog, border: darkMode ? `1px solid ${C.border}` : "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: isCurrentMonth ? "default" : "pointer", opacity: isCurrentMonth ? 0.4 : 1 }}>
              <ChevronLeft size={16} color={C.jet} />
            </button>
            <span style={{ fontSize: T.bodyLg, fontWeight: 700, color: C.jet, ...fDisplay }}>{monthLabel}</span>
            <button type="button" aria-label="Next month" onClick={goNext} style={{ width: 44, height: 44, borderRadius: 12, background: darkMode ? "transparent" : C.fog, border: darkMode ? `1px solid ${C.border}` : "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <ChevronRight size={16} color={C.jet} />
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 6 }}>
            {WEEKDAY_HEADERS.map((d) => (
              <div key={d} style={{ textAlign: "center", fontSize: T.micro, fontWeight: 700, color: C.slateLight, ...fBody }}>{d}</div>
            ))}
          </div>

          {weeks.map((row, ri) => (
            <div key={ri} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
              {row.map((d, di) => {
                const inRange = d.getMonth() === cursor.getMonth();
                const state = dayAvailability(d, coach, availability);
                const isSelected = selectedDate && sameDay(d, selectedDate);
                const isToday = sameDay(d, today);
                const disabled = !inRange || state === "unavailable";

                let background = C.white;
                let border = C.border;
                let color = C.jet;
                if ((state === "available" || state === "limited") && inRange) border = C.brand;
                if (disabled) color = C.slateLight;
                if (isToday && inRange && !isSelected) border = C.brand;
                if (isSelected) { background = C.brand; border = C.brand; color = C.white; }

                return (
                  <button
                    key={di}
                    onClick={() => pickDate(d, state)}
                    disabled={disabled}
                    style={{
                      aspectRatio: "1", borderRadius: 10, position: "relative",
                      border: `1.5px solid ${border}`, background,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      opacity: inRange ? 1 : 0.3, cursor: disabled ? "not-allowed" : "pointer", boxSizing: "border-box",
                    }}
                  >
                    <span style={{ fontSize: T.label, fontWeight: isSelected || isToday ? 700 : 500, color, ...fBody }}>{d.getDate()}</span>
                  </button>
                );
              })}
            </div>
          ))}

          <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap", justifyContent: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: T.tiny, color: C.slate, ...fBody }}>
              <span style={{ width: 9, height: 9, borderRadius: 3, border: `1.5px solid ${C.brand}` }} /> Available
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: T.tiny, color: C.slate, ...fBody }}>
              <span style={{ width: 9, height: 9, borderRadius: 3, background: C.fog, border: `1.5px solid ${C.border}` }} /> Unavailable
            </span>
          </div>
        </Card>

        {selectedDate && (
          <div>
            <SectionLabel>{formatFullDateFromDate(selectedDate)}</SectionLabel>
            {daySlots.length === 0 ? (
              <Card style={{ textAlign: "center" }}>
                <span style={{ fontSize: T.labelLg, color: C.slate, ...fBody }}>No time slots available on this day.</span>
              </Card>
            ) : (
              ["Morning", "Afternoon", "Evening"].filter((p) => grouped[p].length > 0).map((period) => {
                const PeriodIcon = PERIOD_ICONS[period];
                return (
                  <div key={period} style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <PeriodIcon size={13} color={C.slateLight} />
                      <span style={{ fontSize: T.captionLg, fontWeight: 700, color: C.slate, ...fBody }}>{period}</span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {grouped[period].map((t) => {
                        const active = selectedTime === t;
                        return (
                          <button
                            key={t}
                            onClick={() => setSelectedTime((prev) => (prev === t ? null : t))}
                            style={{
                              padding: "10px 16px", borderRadius: 999,
                              border: `1.5px solid ${active ? C.brand : C.border}`,
                              background: active ? C.brand : C.white,
                              color: active ? C.white : C.jet,
                              fontSize: T.labelLg, fontWeight: 600, cursor: "pointer", ...fBody,
                              boxShadow: active ? `0 2px 8px rgba(27, 94, 32, 0.2)` : "none",
                              transition: "background .15s ease, border-color .15s ease, color .15s ease, transform .15s ease",
                            }}
                          >
                            {formatTimeRange12(t, duration)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {selectedDate && selectedTime && (
        <div style={{ padding: isDesktop ? "18px 64px 24px" : "14px 18px", paddingBottom: isDesktop ? 24 : "max(28px, env(safe-area-inset-bottom))", borderTop: `1px solid ${C.border}`, background: C.white, flexShrink: 0, boxSizing: "border-box" }}>
          <Btn full onClick={confirm}>
            {pkg ? "Continue to book" : "Confirm time"}
          </Btn>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   10. MULTI-PARTICIPANT DETAILS
   -------------------------------------------------------------------------
   Collects emergency contact and medical details for each participant in
   a group/family booking. Expands the basic participant selection from
   BookingParticipants into a per-person detail form.
   ========================================================================= */

export function ScreenBookingParticipantDetails({ nav, params, draft, toast }) {
  const { isDesktop } = useResponsive();
  const { darkMode, children, clientPrefs } = useApp();
  const C = darkMode ? CD : CL;

  const participantIds = params?.participants || draft?.participants || ["self"];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [details, setDetails] = useState(() => Object.fromEntries(participantIds.map((id) => {
    if (id === "self") {
      return [id, {
        emergencyName: clientPrefs?.emergencyName || "",
        emergencyPhone: clientPrefs?.emergencyMobile || "",
        conditions: clientPrefs?.medicalConditions || "",
        allergies: clientPrefs?.allergies || "",
      }];
    }
    const child = children.find((item) => item.id === id);
    return [id, {
      emergencyName: child?.emergencyName || "",
      emergencyPhone: child?.emergencyMobile || "",
      conditions: child?.medicalConditions || child?.medicalNotes || "",
      allergies: child?.allergies || "",
    }];
  })));

  const getParticipantLabel = (id) => {
    if (id === "self") return "You";
    const child = children.find((c) => c.id === id);
    return child?.name || "Participant";
  };

  const currentId = participantIds[currentIndex];
  const currentLabel = getParticipantLabel(currentId);
  const currentDetail = details[currentId] || { emergencyName: "", emergencyPhone: "", conditions: "", allergies: "" };
  const currentProfile = currentId === "self" ? clientPrefs : children.find((child) => child.id === currentId);
  const loadedSavedDetails = currentId === "self"
    ? !!(clientPrefs?.emergencyName || clientPrefs?.emergencyMobile || clientPrefs?.medicalConditions || clientPrefs?.allergies)
    : !!(currentProfile?.emergencyName || currentProfile?.emergencyMobile || currentProfile?.medicalConditions || currentProfile?.allergies || currentProfile?.medicalNotes);
  const isLast = currentIndex === participantIds.length - 1;

  const update = (field, value) => {
    setDetails((prev) => ({
      ...prev,
      [currentId]: { ...(prev[currentId] || { emergencyName: "", emergencyPhone: "", conditions: "", allergies: "" }), [field]: value },
    }));
  };

  const next = () => {
    if (!currentDetail.emergencyName.trim() || !currentDetail.emergencyPhone.trim()) {
      toast && toast("Add an emergency contact name and phone");
      return;
    }
    if (isLast) {
      toast && toast("All participant details saved");
      nav("booking-review", { ...params, participantDetails: details });
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar
        title="Participant details"
        onBack={() => {
          if (currentIndex > 0) setCurrentIndex((i) => i - 1);
          else nav("booking-participants", params);
        }}
      />

      <div style={{ padding: "16px 18px 0" }}>
        <StepProgress step={currentIndex + 1} total={participantIds.length} label={currentLabel} />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 18px 24px" }} className="cl-hide-scrollbar">
        <div style={{ fontSize: T.labelLg, color: C.slate, lineHeight: 1.5, marginBottom: 16, ...fBody }}>
          Add emergency contact and medical details for {currentLabel}. This helps keep everyone safe during the session.
        </div>

        {loadedSavedDetails && (
          <Card style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: 12, background: C.successTint, marginBottom: 16 }}>
            <Check size={16} color={C.success} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: T.labelLg, fontWeight: 700, color: C.jet, ...fBody }}>Saved details applied</div>
              <div style={{ fontSize: T.captionLg, color: C.slate, lineHeight: 1.45, marginTop: 2, ...fBody }}>We filled this from {currentId === "self" ? "your account" : `${currentLabel}'s profile`}. You can edit anything for this booking without changing the saved profile.</div>
            </div>
          </Card>
        )}

        <SectionLabel>Emergency contact</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
          <Field label="Contact name" placeholder="e.g. Jamie Chen" value={currentDetail.emergencyName} onChange={(e) => update("emergencyName", e.target.value)} required />
          <Field label="Contact phone" placeholder="04XX XXX XXX" type="tel" value={currentDetail.emergencyPhone} onChange={(e) => update("emergencyPhone", e.target.value.replace(/[^0-9+\s]/g, ""))} required />
        </div>

        <SectionLabel>Medical information (optional)</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Field label="Medical conditions" placeholder="e.g. asthma, diabetes" value={currentDetail.conditions} onChange={(e) => update("conditions", e.target.value)} />
          <Field label="Allergies" placeholder="e.g. peanut allergy" value={currentDetail.allergies} onChange={(e) => update("allergies", e.target.value)} />
        </div>
      </div>

      <div style={{ padding: isDesktop ? "18px 64px 24px" : "14px 18px", paddingBottom: isDesktop ? 24 : "max(28px, env(safe-area-inset-bottom))", borderTop: `1px solid ${C.border}`, background: C.white, flexShrink: 0, boxSizing: "border-box" }}>
        <Btn full onClick={next}>
          {isLast ? "Continue" : "Next participant"}
        </Btn>
      </div>
    </div>
  );
}
