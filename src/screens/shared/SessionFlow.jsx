import React, { useEffect, useRef, useState } from "react";
import {
  AlertTriangle, ArrowRight, BadgeCheck, CalendarDays, CheckCircle2, Clock3,
  KeyRound, LifeBuoy, MapPin, MessageCircle, Navigation, Phone,
  PlayCircle, ShieldCheck, Smartphone, Timer, Video, XCircle,
  BellRing, ChevronRight,
} from "lucide-react";
import { CL, CD, T, fBody, fDisplay, LAYOUT } from "../../theme/theme";
import { useApp } from "../../context/AppContext";
import { COACHES } from "../../data/coaches";
import { BOOKING_STATUS, SESSION_OTP } from "../../data/bookings";
import {
  Avatar, Badge, Btn, Card, EmptyState, Row, SectionLabel, StatusPill, TopBar, BottomSheet,
} from "../../components/ui/Primitives";
import { haptic } from "../../utils/haptics";

/* =========================================================================
   SESSION FLOW — OTP check-in + live session screens
   -------------------------------------------------------------------------
   Ride-hailing-style session start: the client generates a 6-digit code,
   shares it with the coach, and the coach enters it to start the session.
   Completion stays coach-driven (see SessionLifecycle.jsx).
   ========================================================================= */

function findBooking(id, role, bookings, coachBookings, businessBookings = []) {
  const preferred = role === "coach" ? coachBookings : bookings;
  const fallback = role === "coach" ? bookings : coachBookings;
  return preferred.find((item) => item.id === id) || fallback.find((item) => item.id === id) || businessBookings.find((item) => item.id === id);
}

function resolveSessionDetails(booking, role, coachProfile) {
  if (role === "coach") {
    const pkg = coachProfile?.packages?.find((p) => p.name === booking?.service);
    return {
      venue: pkg?.venue || pkg?.location || coachProfile?.venue || "Venue to be confirmed",
      equipment: pkg?.equipment || "",
      online: booking?.mode === "Virtual",
    };
  }
  const coach = COACHES.find((c) => c.id === booking?.coachId)
    || COACHES.find((c) => c.name === booking?.coachName);
  const pkg = coach?.packages?.find((p) => p.name === booking?.service);
  return {
    venue: booking?.venue || pkg?.venue || pkg?.location || coach?.venue || "Venue to be confirmed",
    equipment: pkg?.equipment || "",
    online: booking?.mode === "Virtual",
    suburb: coach?.suburb || "",
  };
}

function mmss(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/* -------------------------------------------------------------------------
   CodeBoxes — 6-digit OTP input with auto-advance, paste, and backspace
   ------------------------------------------------------------------------- */
function CodeBoxes({ digits, onSetDigit, disabled = false, error = false, onKeyDown }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const inputsRef = useRef([]);

  const setDigit = (i, raw) => {
    const v = raw.replace(/[^0-9]/g, "").slice(-1);
    onSetDigit(i, v);
    if (v && i < 5) inputsRef.current[i + 1]?.focus();
  };
  const handleKeyDown = (i, e) => {
    if (onKeyDown) onKeyDown(e);
    if (e.key === "Backspace" && !digits[i] && i > 0) inputsRef.current[i - 1]?.focus();
  };
  const handlePaste = (e) => {
    const text = (e.clipboardData?.getData("text") || "").replace(/[^0-9]/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = [...digits];
    text.split("").forEach((ch, idx) => { if (idx < 6) next[idx] = ch; });
    text.split("").forEach((_, idx) => onSetDigit(idx, next[idx]));
    const focusIndex = Math.min(text.length, 5);
    inputsRef.current[focusIndex]?.focus();
  };

  return (
    <div
      style={{
        display: "flex", gap: 8, justifyContent: "flex-start",
        animation: error ? "clShake .4s ease" : "none",
      }}
    >
      {digits.map((d, i) => (
        <input
          key={i}
          name={`session-code-${i + 1}`}
          aria-label={`Session code digit ${i + 1} of 6`}
          autoComplete={i === 0 ? "one-time-code" : "off"}
          ref={(el) => { inputsRef.current[i] = el; }}
          value={d}
          disabled={disabled}
          onChange={(e) => setDigit(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          inputMode="numeric"
          maxLength={1}
          style={{
            flex: "0 1 60px", minWidth: 0, aspectRatio: "1 / 1", height: "auto", textAlign: "center",
            fontSize: T.headingLg, fontWeight: 700,
            border: `1.5px solid ${error ? C.error : d ? C.brand : C.border}`,
            borderRadius: 14, outline: "none", color: C.jet, boxSizing: "border-box",
            background: disabled ? C.fog : C.white, ...fDisplay,
            caretColor: C.brand,
          }}
        />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------
   BigCodeDisplay — read-only 6-digit display for the client
   ------------------------------------------------------------------------- */
function BigCodeDisplay({ code, color }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const digits = String(code || "").padEnd(6, "•").split("");
  return (
    <div
      role="group"
      aria-label={`Your six-digit session PIN is ${digits.join(" ")}`}
      style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 4, width: "100%" }}
    >
      {digits.map((d, i) => (
        <span
          key={i}
          style={{
            minWidth: 0, textAlign: "center", lineHeight: 1,
            fontSize: T.heroLg, fontWeight: 700, color: color || C.jet,
            letterSpacing: "0.5px", ...fDisplay,
          }}
        >
          {d}
        </span>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------
   ScreenClientSessionStart — client reviews details and generates the code
   ------------------------------------------------------------------------- */
export function ScreenClientSessionStart({
  nav, goBack, params, bookings = [], coachBookings = [], businessBookings = [], generateSessionCode, toast,
}) {
  const { darkMode, coachProfile } = useApp();
  const C = darkMode ? CD : CL;
  const booking = findBooking(params?.bookingId, "client", bookings, coachBookings, businessBookings);
  const [generating, setGenerating] = useState(false);

  if (!booking) {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <TopBar title="Start session" onBack={() => goBack("client-dashboard")} />
        <EmptyState icon={CalendarDays} title="Session not found" body="This session may no longer be available." />
      </div>
    );
  }

  const details = resolveSessionDetails(booking, "client", coachProfile);
  const person = booking.coachName || "your coach";
  const coach = COACHES.find((item) => item.id === booking.coachId)
    || COACHES.find((item) => item.name === booking.coachName);
  const hasActiveCode = !!booking.sessionCode && booking.status === BOOKING_STATUS.CONFIRMED;

  const handleGenerate = () => {
    if (generating) return;
    if (hasActiveCode) {
      nav("client-session-code", { bookingId: booking.id });
      return;
    }
    setGenerating(true);
    haptic(12);
    window.setTimeout(() => {
      const code = generateSessionCode?.(booking.id);
      setGenerating(false);
      if (code) {
        nav("client-session-code", { bookingId: booking.id });
      } else {
        toast("Check-in isn't available yet");
      }
    }, 350);
  };

  const goLive = () => nav("session-progress", { bookingId: booking.id, role: "client" });

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.white }}>
      <TopBar title="Start session" onBack={() => nav("client-booking-detail", { id: booking.id })} right={<StatusPill status={booking.status} />} />
      <div style={{ flex: 1, overflowY: "auto", padding: `12px ${LAYOUT.pagePadX}px 26px` }} className="cl-hide-scrollbar">
        <div style={{ textAlign: "center", padding: "8px 10px 22px" }}>
          <div style={{ width: 66, height: 66, borderRadius: 22, background: C.black, margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <PlayCircle size={30} color={C.white} strokeWidth={2} />
          </div>
          <div style={{ fontSize: T.display, fontWeight: 750, color: C.jet, letterSpacing: "-0.35px", ...fDisplay }}>Meet your coach</div>
          <div style={{ fontSize: T.body, color: C.slate, lineHeight: 1.55, marginTop: 7, ...fBody }}>
            When you're together, show {person.split(" ")[0]} your check-in PIN to begin the session.
          </div>
        </div>

        <SectionLabel>Session details</SectionLabel>
        <Card style={{ marginBottom: 12, padding: 15 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 11 }}>
            <Avatar name={person} size={42} src={coach?.avatar} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: T.subtitle, fontWeight: 700, color: C.jet, ...fDisplay }}>{booking.service}</div>
              <div style={{ fontSize: T.captionLg, color: C.slate, marginTop: 3, ...fBody }}>with {person}</div>
            </div>
          </div>
          <Row label="Date" value={booking.date} />
          <Row label="Time" value={booking.time} />
          <Row label="Format" value={booking.mode} last />
        </Card>

        <SectionLabel>{details.online ? "How you'll connect" : "Where to meet"}</SectionLabel>
        <Card style={{ marginBottom: 12, padding: 15 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
            <div style={{ width: 40, height: 40, borderRadius: 13, background: C.brandTint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {details.online ? <Video size={18} color={C.brandIcon || C.brand} /> : <MapPin size={18} color={C.brandIcon || C.brand} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: T.body, fontWeight: 700, color: C.jet, ...fBody }}>{details.online ? "Online session" : details.venue}</div>
              <div style={{ fontSize: T.captionLg, color: C.slate, lineHeight: 1.5, marginTop: 3, ...fBody }}>
                {details.online
                  ? "Your coach will meet you here at the scheduled time. Make sure your camera and connection are ready."
                  : `${details.suburb ? `${details.suburb} · ` : ""}Arrive a few minutes early and look out for your coach.`}
              </div>
            </div>
          </div>
          {!details.online && (
            <Btn full variant="outline" icon={Navigation} style={{ marginTop: 13 }} onClick={() => { haptic(8); toast(`Opening directions to ${details.venue}`); }}>
              Get directions
            </Btn>
          )}
        </Card>

        {details.equipment && (
          <>
            <SectionLabel>What to bring</SectionLabel>
            <Card style={{ marginBottom: 12, padding: 15 }}>
              <p style={{ margin: 0, fontSize: T.body, color: C.slate, lineHeight: 1.6, ...fBody }}>{details.equipment}</p>
            </Card>
          </>
        )}

        {booking.safetyNotes && (
          <>
            <SectionLabel>Health & safety information</SectionLabel>
            <Card style={{ marginBottom: 12, display: "flex", alignItems: "flex-start", gap: 10, background: C.warnTint, border: "none" }}>
              <AlertTriangle size={17} color={C.warnStrong} style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: T.body, color: C.jet, lineHeight: 1.6, whiteSpace: "pre-line", ...fBody }}>{booking.safetyNotes}</p>
            </Card>
          </>
        )}

        <Card style={{ display: "flex", gap: 11, alignItems: "flex-start", background: C.fog }}>
          <ShieldCheck size={19} color={C.jet} style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: T.body, fontWeight: 700, color: C.jet, ...fBody }}>Your payment is protected</div>
            <div style={{ fontSize: T.captionLg, color: C.slate, lineHeight: 1.55, marginTop: 4, ...fBody }}>CoachNivo holds your payment securely and releases it only after the session is complete.</div>
          </div>
        </Card>
      </div>

      <div style={{ padding: `12px ${LAYOUT.pagePadX}px max(${LAYOUT.ctaPadBottom}px, env(safe-area-inset-bottom))`, borderTop: `1px solid ${C.border}`, background: C.white, display: "flex", flexDirection: "column", gap: 9 }}>
        {booking.status === BOOKING_STATUS.IN_PROGRESS && (
          <Btn full icon={BadgeCheck} onClick={goLive}>View live session</Btn>
        )}
        {booking.status !== BOOKING_STATUS.IN_PROGRESS && (
          <>
            <Btn full loading={generating} loadingText="Preparing check-in…" icon={KeyRound} onClick={handleGenerate}>
              Show check-in PIN
            </Btn>
            <Btn full variant="outline" icon={MessageCircle} onClick={() => nav("chat-thread", { name: booking.coachName, context: `${booking.service} · ${booking.date}`, bookingId: booking.id, backTo: "client-session-start", backParams: { bookingId: booking.id } })}>
              Message {person.split(" ")[0]}
            </Btn>
          </>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   ScreenClientSessionCode — calm, ride-style PIN handoff + coach details
   ------------------------------------------------------------------------- */
export function ScreenClientSessionCode({
  nav, goBack, params, bookings = [], coachBookings = [], businessBookings = [], generateSessionCode, toast,
}) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const booking = findBooking(params?.bookingId, "client", bookings, coachBookings, businessBookings);
  const [starting, setStarting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // Seeded demo codes may not carry an expiry — give them a fresh TTL window
  // while keeping that implementation detail out of the customer experience.
  const [fallbackExpiresAt] = useState(() => Date.now() + SESSION_OTP.TTL_SECONDS * 1000);

  const code = booking?.sessionCode;
  const storedExpiresAt = Number(booking?.codeExpiresAt || 0);
  const expiresAt = storedExpiresAt > 0 ? storedExpiresAt : fallbackExpiresAt;
  const [expired, setExpired] = useState(() => (
    !!code && booking?.status === BOOKING_STATUS.CONFIRMED && expiresAt <= Date.now()
  ));

  useEffect(() => {
    if (!code || booking?.status !== BOOKING_STATUS.CONFIRMED) {
      setExpired(false);
      return undefined;
    }
    const remainingMs = expiresAt - Date.now();
    if (remainingMs <= 0) {
      setExpired(true);
      return undefined;
    }
    setExpired(false);
    const timeout = window.setTimeout(() => setExpired(true), remainingMs + 50);
    return () => window.clearTimeout(timeout);
  }, [code, expiresAt, booking?.status]);

  // Coach verified the code — celebrate briefly, then jump to the live screen.
  useEffect(() => {
    if (booking?.status === BOOKING_STATUS.IN_PROGRESS && !starting) {
      setStarting(true);
      haptic([10, 60, 10]);
      window.setTimeout(() => nav("session-progress", { bookingId: booking.id, role: "client" }), 1400);
    }
  }, [booking?.status, starting, booking?.id, nav]);

  if (!booking) {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <TopBar title="Session PIN" subtitle="Show this to your coach at check-in." onBack={() => goBack("client-dashboard")} />
        <EmptyState icon={KeyRound} title="Session not found" body="This session may no longer be available." />
      </div>
    );
  }

  const person = booking.coachName || "your coach";
  const shortName = person.split(" ")[0];
  const coach = COACHES.find((item) => item.id === booking.coachId)
    || COACHES.find((item) => item.name === booking.coachName);
  const details = resolveSessionDetails(booking, "client");
  const unavailable = !code || expired;
  const heroMuted = darkMode ? C.slate : C.onDark;
  const heroDivider = darkMode ? C.border : C.onDarkDivider;

  const refreshPin = () => {
    if (refreshing) return;
    setRefreshing(true);
    haptic(12);
    window.setTimeout(() => {
      const next = generateSessionCode?.(booking.id);
      setRefreshing(false);
      if (next) toast("Your check-in PIN is ready");
      else toast("Check-in isn't available yet");
    }, 350);
  };

  const callCoach = () => {
    haptic(8);
    toast(`Calling ${shortName}…`);
  };

  const messageCoach = () => nav("chat-thread", {
    name: booking.coachName,
    context: `${booking.service} · ${booking.date}`,
    bookingId: booking.id,
    backTo: "client-session-code",
    backParams: { bookingId: booking.id },
  });

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.white }}>
      <TopBar title="Session PIN" subtitle="Show this to your coach at check-in." onBack={() => nav("client-session-start", { bookingId: booking.id })} />

      {starting && (
        <div style={{ position: "absolute", inset: 0, zIndex: 40, background: C.white, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 28, animation: "clFadeIn .25s ease" }}>
          <div style={{ width: 92, height: 92, borderRadius: 30, background: darkMode ? C.fog : C.black, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, animation: "clPopIn .35s cubic-bezier(.22,1,.36,1)" }}>
            <CheckCircle2 size={44} color={darkMode ? C.success : C.white} />
          </div>
          <div style={{ fontSize: T.displayLg, fontWeight: 750, color: C.jet, ...fDisplay }}>Check-in confirmed</div>
          <div style={{ fontSize: T.body, color: C.slate, lineHeight: 1.55, marginTop: 8, textAlign: "center", ...fBody }}>
            {shortName} confirmed the PIN. Your session is starting…
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: `16px ${LAYOUT.pagePadX}px max(${LAYOUT.ctaPadBottom}px, env(safe-area-inset-bottom))` }} className="cl-hide-scrollbar">
        <Card style={{ padding: 22, borderRadius: 26, marginBottom: 20, background: darkMode ? C.white : C.black, border: `1px solid ${darkMode ? C.border : C.black}`, boxShadow: darkMode ? "none" : "0 16px 34px rgba(0,0,0,.16)", animation: "clFadeUp .35s ease" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <ShieldCheck size={16} color={darkMode ? C.brand : C.white} strokeWidth={2.2} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: T.label, fontWeight: 700, letterSpacing: "0.7px", color: darkMode ? C.slate : C.white, textTransform: "uppercase", ...fBody }}>
                Session check-in
              </span>
            </div>
            {!unavailable && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: T.captionLg, fontWeight: 600, color: heroMuted, ...fBody }}>
                <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: LAYOUT.pillRadius, background: C.brand }} />
                Ready
              </span>
            )}
          </div>

          <div style={{ marginTop: 28 }}>
            <div style={{ fontSize: T.displayLg, fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.45px", color: darkMode ? C.jet : C.white, ...fDisplay }}>
              {unavailable ? "Your PIN isn't ready" : `Check in with ${shortName}`}
            </div>
            <div style={{ marginTop: 8, fontSize: T.body, lineHeight: 1.55, color: heroMuted, ...fBody }}>
              {unavailable
                ? "Get a new PIN when you're with your coach."
                : `Show ${shortName} this PIN when you meet.`}
            </div>
          </div>

          {!unavailable && (
            <div style={{ marginTop: 30, padding: "22px 0 20px", borderTop: `1px solid ${heroDivider}`, borderBottom: `1px solid ${heroDivider}` }}>
              <BigCodeDisplay code={code} color={darkMode ? C.jet : C.white} />
            </div>
          )}

          <div style={{ marginTop: unavailable ? 24 : 18, fontSize: T.captionLg, lineHeight: 1.5, color: heroMuted, ...fBody }}>
            {unavailable
              ? "We'll prepare it securely for this session."
              : "Your coach enters the PIN to confirm you're together and begin."}
          </div>
        </Card>

        {unavailable && (
          <Btn full icon={KeyRound} loading={refreshing} loadingText="Preparing check-in…" style={{ marginBottom: 20 }} onClick={refreshPin}>
            Get check-in PIN
          </Btn>
        )}

        <SectionLabel>Your coach</SectionLabel>
        <Card style={{ padding: 16, marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar name={person} src={coach?.avatar} size={58} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                <div style={{ fontSize: T.title, fontWeight: 700, color: C.jet, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...fDisplay }}>{person}</div>
                {coach?.verified?.identity && <BadgeCheck aria-label="Verified coach" size={16} color={C.brand} fill={C.brandTint} style={{ flexShrink: 0 }} />}
              </div>
              <div style={{ marginTop: 3, fontSize: T.captionLg, color: C.slate, ...fBody }}>
                {[coach?.sport, coach?.rating ? `${coach.rating} rating` : null].filter(Boolean).join(" · ") || "Your coach"}
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
            <Btn full variant="secondary" icon={Phone} onClick={callCoach}>Call</Btn>
            <Btn full variant="outline" icon={MessageCircle} onClick={messageCoach}>Message</Btn>
          </div>
        </Card>

        <SectionLabel>Session</SectionLabel>
        <Card style={{ padding: 16 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 11, paddingBottom: 13, marginBottom: 13, borderBottom: `1px solid ${C.border}` }}>
            <div style={{ width: 40, height: 40, borderRadius: 13, background: C.fog, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <PlayCircle size={18} color={C.jet} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: T.bodyLg, fontWeight: 700, color: C.jet, lineHeight: 1.35, ...fBody }}>{booking.service}</div>
              <div style={{ marginTop: 3, fontSize: T.captionLg, color: C.slate, ...fBody }}>{booking.mode}</div>
            </div>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <CalendarDays size={17} color={C.slate} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1, minWidth: 0, fontSize: T.body, color: C.jet, ...fBody }}>{booking.date}</span>
              <span style={{ fontSize: T.body, fontWeight: 600, color: C.jet, ...fBody }}>{booking.time}</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
              {details.online ? <Video size={17} color={C.slate} style={{ flexShrink: 0, marginTop: 1 }} /> : <MapPin size={17} color={C.slate} style={{ flexShrink: 0, marginTop: 1 }} />}
              <span style={{ minWidth: 0, fontSize: T.body, lineHeight: 1.45, color: C.jet, ...fBody }}>{details.online ? "Online session" : details.venue}</span>
            </div>
          </div>

          {!details.online && (
            <Btn full variant="outline" icon={Navigation} style={{ marginTop: 16 }} onClick={() => { haptic(8); toast(`Opening directions to ${details.venue}`); }}>
              Get directions
            </Btn>
          )}
        </Card>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   ScreenCoachSessionStart — coach enters the client's code to go live
   ------------------------------------------------------------------------- */
export function ScreenCoachSessionStart({
  nav, goBack, params, bookings = [], coachBookings = [], businessBookings = [], verifySessionCode, toast, pushNotification,
}) {
  const { darkMode, coachProfile } = useApp();
  const C = darkMode ? CD : CL;
  const role = params?.role || "coach";
  const backTo = params?.backTo || (role === "businessCoach" ? "business-coach-booking-detail" : "coach-session-detail");
  const backParams = params?.backParams || { id: params?.bookingId };
  const booking = findBooking(params?.bookingId, "coach", bookings, coachBookings, businessBookings);
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);
  const [voidedCode, setVoidedCode] = useState(false);
  const [started, setStarted] = useState(false);
  const [now, setNow] = useState(Date.now());
  const inputsRef = useRef([]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (booking?.status === BOOKING_STATUS.IN_PROGRESS && !started) {
      setStarted(true);
      haptic([10, 60, 10]);
      window.setTimeout(() => nav("session-progress", { bookingId: booking.id, role, backTo, backParams }), 1400);
    }
  }, [booking?.status, started, booking?.id, nav]);

  // A fresh client code clears any previous failed-attempt state (a voided
  // code disappearing must NOT clear the void notice — only a new code does).
  const prevCodeRef = useRef(booking?.sessionCode);
  useEffect(() => {
    const nextCode = booking?.sessionCode;
    if (nextCode && nextCode !== prevCodeRef.current) {
      setVoidedCode(false);
      setError(null);
    }
    prevCodeRef.current = nextCode;
  }, [booking?.sessionCode]);

  if (!booking) {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <TopBar title="Start session" onBack={() => goBack("coach-bookings")} />
        <EmptyState icon={KeyRound} title="Session not found" body="This session may no longer be available." />
      </div>
    );
  }

  const details = resolveSessionDetails(booking, "coach", coachProfile);
  const client = booking.clientName || "your client";
  const hasCode = !!booking.sessionCode;
  const codeExpired = hasCode && Number(booking.codeExpiresAt || 0) > 0 && Number(booking.codeExpiresAt) < now;
  const attemptsUsed = Number(booking.codeAttempts || 0);
  const attemptsLeft = Math.max(0, SESSION_OTP.MAX_ATTEMPTS - attemptsUsed);
  const canStart = booking.status === BOOKING_STATUS.CONFIRMED;

  const setDigit = (i, v) => {
    setDigits((d) => { const n = [...d]; n[i] = v; return n; });
    setError(null);
    if (v && i < 5) inputsRef.current[i + 1]?.focus();
  };
  const onKeyDown = (e) => {
    if (e.key === "Enter" && digits.every(Boolean)) verify();
  };

  const nudgeClient = () => {
    haptic(10);
    pushNotification?.({
      audience: "client",
      type: "session",
      title: `${booking.coachName || "Your coach"} is waiting`,
      body: `Open your session and share the check-in code so ${booking.coachName || "your coach"} can start ${booking.service}.`,
      bookingId: booking.id,
    });
    toast("Nudge sent to client");
  };

  const verify = () => {
    if (!canStart || verifying) return;
    const code = digits.join("");
    if (code.length !== 6) return;
    setVerifying(true);
    haptic(10);
    window.setTimeout(() => {
      const result = verifySessionCode?.(booking.id, code);
      setVerifying(false);
      if (!result) {
        setError("Something went wrong — please try again");
        return;
      }
      if (result.ok) {
        setStarted(true);
        haptic([10, 60, 10]);
        window.setTimeout(() => nav("session-progress", { bookingId: booking.id, role, backTo, backParams }), 1400);
        return;
      }
      if (result.reason === "expired") {
        setError("This code has expired — ask the client for a new one");
        return;
      }
      if (result.reason === "voided") {
        setError(null);
        setVoidedCode(true);
        setDigits(["", "", "", "", "", ""]);
        return;
      }
      setError(`Code doesn't match — ${result.attemptsLeft} attempt${result.attemptsLeft === 1 ? "" : "s"} left`);
      setDigits(["", "", "", "", "", ""]);
      if (result.attemptsLeft > 0) inputsRef.current[0]?.focus();
    }, 700);
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.white }}>
      <TopBar title="Start session" onBack={() => nav(backTo, backParams)} right={<StatusPill status={booking.status} />} />

      {started && (
        <div style={{ position: "absolute", inset: 0, zIndex: 40, background: C.white, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 28, animation: "clFadeIn .25s ease" }}>
          <div style={{ width: 92, height: 92, borderRadius: 30, background: C.successTint, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, animation: "clPopIn .35s cubic-bezier(.22,1,.36,1)" }}>
            <CheckCircle2 size={44} color={C.success} />
          </div>
          <div style={{ fontSize: T.displayLg, fontWeight: 750, color: C.jet, ...fDisplay }}>Session started!</div>
          <div style={{ fontSize: T.body, color: C.slate, lineHeight: 1.55, marginTop: 8, textAlign: "center", ...fBody }}>
            Code verified — {booking.service} with {client.split(" ")[0]} is now live.
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: `12px ${LAYOUT.pagePadX}px 26px` }} className="cl-hide-scrollbar">
        <div style={{ textAlign: "center", padding: "6px 10px 20px" }}>
          <div style={{ width: 66, height: 66, borderRadius: 22, background: C.brandTint, margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <KeyRound size={30} color={C.brand} strokeWidth={2} />
          </div>
          <div style={{ fontSize: T.display, fontWeight: 750, color: C.jet, letterSpacing: "-0.35px", ...fDisplay }}>
            {hasCode ? "Enter the client's code" : "Waiting for a code"}
          </div>
          <div style={{ fontSize: T.body, color: C.slate, lineHeight: 1.55, marginTop: 7, ...fBody }}>
            {hasCode
              ? `${client.split(" ")[0]} is ready. Enter the 6-digit code they share with you to start the session.`
              : `${client.split(" ")[0]} hasn't generated their check-in code yet. Ask them to open the session in their app.`}
          </div>
        </div>

        <SectionLabel>Session</SectionLabel>
        <Card style={{ marginBottom: 12, padding: 15 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 11 }}>
            <Avatar name={client} size={42} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: T.subtitle, fontWeight: 700, color: C.jet, ...fDisplay }}>{booking.service}</div>
              <div style={{ fontSize: T.captionLg, color: C.slate, marginTop: 3, ...fBody }}>with {client}</div>
            </div>
          </div>
          <Row label="Date" value={booking.date} />
          <Row label="Time" value={booking.time} />
          <Row label="Format" value={booking.mode} last />
        </Card>

        <SectionLabel>{details.online ? "Connection" : "Venue"}</SectionLabel>
        <Card style={{ marginBottom: 14, padding: 15 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
            <div style={{ width: 40, height: 40, borderRadius: 13, background: C.brandTint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {details.online ? <Video size={18} color={C.brandIcon || C.brand} /> : <MapPin size={18} color={C.brandIcon || C.brand} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: T.body, fontWeight: 700, color: C.jet, ...fBody }}>{details.online ? "Online session" : details.venue}</div>
              <div style={{ fontSize: T.captionLg, color: C.slate, lineHeight: 1.5, marginTop: 3, ...fBody }}>
                {details.online ? "The client is admitted after the code is verified." : "Confirm you're both at the venue before entering the code."}
              </div>
            </div>
          </div>
        </Card>

        {canStart && hasCode && !codeExpired && !voidedCode && (
          <>
            <SectionLabel>Session code</SectionLabel>
            <Card style={{ marginBottom: 14, padding: 18 }}>
              <CodeBoxes digits={digits} onSetDigit={setDigit} onKeyDown={onKeyDown} error={!!error && error.includes("doesn't match")} />
              {error && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 7, marginTop: 12, background: C.errorTint, borderRadius: 11, padding: "9px 11px" }}>
                  <XCircle size={15} color={C.error} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: T.captionLg, color: C.error, lineHeight: 1.5, ...fBody }}>{error}</span>
                </div>
              )}
              {!error && attemptsUsed > 0 && (
                <div style={{ fontSize: T.caption, color: C.warnStrong, marginTop: 12, ...fBody }}>
                  {attemptsLeft} of {SESSION_OTP.MAX_ATTEMPTS} attempts remaining
                </div>
              )}
              <Btn full icon={ArrowRight} style={{ marginTop: 16 }} loading={verifying} loadingText="Verifying…" disabled={digits.join("").length !== 6} onClick={verify}>
                Verify & start session
              </Btn>
            </Card>
          </>
        )}

        {canStart && voidedCode && (
          <Card style={{ marginBottom: 14, display: "flex", gap: 11, alignItems: "flex-start", background: C.errorTint, border: "none" }}>
            <XCircle size={19} color={C.error} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: T.body, fontWeight: 700, color: C.jet, ...fBody }}>Too many incorrect attempts</div>
              <div style={{ fontSize: T.captionLg, color: C.slate, lineHeight: 1.55, marginTop: 3, ...fBody }}>This code is no longer valid. Ask {client.split(" ")[0]} to generate a fresh one.</div>
              <Btn full variant="outline" icon={BellRing} style={{ marginTop: 12 }} onClick={nudgeClient}>Ask for a new code</Btn>
            </div>
          </Card>
        )}

        {canStart && !hasCode && !voidedCode && (
          <Card style={{ marginBottom: 14, display: "flex", gap: 11, alignItems: "flex-start" }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: C.brandTint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Smartphone size={18} color={C.brandIcon || C.brand} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: T.body, fontWeight: 700, color: C.jet, ...fBody }}>
                No code yet
                <span style={{ width: 6, height: 6, borderRadius: 99, background: C.brand, animation: "clPulse 1.4s infinite" }} />
              </div>
              <div style={{ fontSize: T.captionLg, color: C.slate, lineHeight: 1.55, marginTop: 3, ...fBody }}>
                The code appears once {client.split(" ")[0]} opens the session. It's valid for {Math.round(SESSION_OTP.TTL_SECONDS / 60)} minutes after they generate it.
              </div>
              <Btn full variant="outline" icon={BellRing} style={{ marginTop: 12 }} onClick={nudgeClient}>Nudge client</Btn>
            </div>
          </Card>
        )}

        {canStart && hasCode && codeExpired && (
          <Card style={{ marginBottom: 14, display: "flex", gap: 11, alignItems: "flex-start", background: C.warnTint, border: "none" }}>
            <XCircle size={19} color={C.warnStrong} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: T.body, fontWeight: 700, color: C.jet, ...fBody }}>This code has expired</div>
              <div style={{ fontSize: T.captionLg, color: C.slate, lineHeight: 1.55, marginTop: 3, ...fBody }}>Ask {client.split(" ")[0]} to generate a fresh code — codes stay valid for {Math.round(SESSION_OTP.TTL_SECONDS / 60)} minutes.</div>
              <Btn full variant="outline" icon={BellRing} style={{ marginTop: 12 }} onClick={nudgeClient}>Ask for a new code</Btn>
            </div>
          </Card>
        )}

        {booking.status === BOOKING_STATUS.IN_PROGRESS && !started && (
          <Card style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 11, background: C.successTint, border: "none" }}>
            <BadgeCheck size={19} color={C.success} />
            <div style={{ flex: 1, fontSize: T.body, fontWeight: 700, color: C.jet, ...fBody }}>Session is live</div>
            <ChevronRight size={16} color={C.slateLight} />
          </Card>
        )}

        <Card style={{ display: "flex", gap: 11, alignItems: "flex-start", background: C.successTint, border: "none" }}>
          <ShieldCheck size={19} color={C.success} style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: T.body, fontWeight: 700, color: C.jet, ...fBody }}>Verified start protects both of you</div>
            <div style={{ fontSize: T.captionLg, color: C.slate, lineHeight: 1.55, marginTop: 4, ...fBody }}>The code proves the client is present and agrees to start. Your payout stays protected by CoachNivo until completion.</div>
          </div>
        </Card>
      </div>

      <div style={{ padding: `12px ${LAYOUT.pagePadX}px max(${LAYOUT.ctaPadBottom}px, env(safe-area-inset-bottom))`, borderTop: `1px solid ${C.border}`, background: C.white }}>
        {booking.status === BOOKING_STATUS.IN_PROGRESS && (
          <Btn full icon={BadgeCheck} onClick={() => nav("session-progress", { bookingId: booking.id, role: "coach" })}>View live session</Btn>
        )}
        {booking.status === BOOKING_STATUS.COMPLETION_PENDING && (
          <Btn full icon={ArrowRight} onClick={() => nav("coach-session-completion", { bookingId: booking.id, role: "coach", backTo: "coach-session-detail" })}>Finish session</Btn>
        )}
        {booking.status === BOOKING_STATUS.CONFIRMED && (
          <Btn full variant="outline" icon={MessageCircle} onClick={() => nav("chat-thread", { name: booking.clientName, context: `${booking.service} · ${booking.date}`, bookingId: booking.id, backTo: "coach-session-start", backParams: { bookingId: booking.id } })}>
            Message {client.split(" ")[0]}
          </Btn>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   ScreenSessionProgress — live session screen for both roles
   ------------------------------------------------------------------------- */
export function ScreenSessionProgress({
  nav, goBack, params, role: appRole, bookings = [], coachBookings = [], businessBookings = [], additionalCharges = [], toast,
}) {
  const { darkMode, coachProfile } = useApp();
  const C = darkMode ? CD : CL;
  const role = params?.role || appRole || "client";
  const providerView = ["coach", "business", "businessCoach"].includes(role);
  const booking = findBooking(params?.bookingId, role, bookings, coachBookings, businessBookings);
  const [seconds, setSeconds] = useState(0);
  const [endSheetOpen, setEndSheetOpen] = useState(false);

  useEffect(() => {
    if (booking?.status !== BOOKING_STATUS.IN_PROGRESS) return undefined;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [booking?.status]);

  if (!booking) {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <TopBar title="Session" onBack={() => goBack(role === "businessCoach" ? "business-coach-bookings" : role === "business" ? "business-bookings" : role === "coach" ? "coach-bookings" : "client-dashboard")} />
        <EmptyState icon={Timer} title="Session not found" body="This session may no longer be available." />
      </div>
    );
  }

  const details = resolveSessionDetails(booking, role, coachProfile);
  const person = providerView ? booking.clientName : booking.coachName;
  const live = booking.status === BOOKING_STATUS.IN_PROGRESS;
  const completed = booking.status === BOOKING_STATUS.COMPLETED;
  const pendingCharge = additionalCharges.find((charge) => (
    charge.bookingId === booking.id
    && charge.phase === "completion"
    && charge.status === "pending"
  ));

  const backScreen = params?.backTo || (role === "businessCoach" ? "business-coach-booking-detail" : role === "business" ? "business-booking-detail" : role === "coach" ? "coach-session-detail" : "client-booking-detail");
  const backParams = params?.backParams || { id: booking.id };
  const messageName = providerView ? booking.clientName : booking.coachName;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.white }}>
      <TopBar title="Live session" onBack={() => nav(backScreen, backParams)} right={live ? <Badge tone="success" icon={CheckCircle2}>Live</Badge> : <StatusPill status={booking.status} />} />

      <div style={{ flex: 1, overflowY: "auto", padding: `12px ${LAYOUT.pagePadX}px 26px` }} className="cl-hide-scrollbar">
        {/* Hero band */}
        <Card style={{ marginBottom: 12, padding: 18, background: live ? C.jet : C.fog, border: "none", textAlign: "center" }}>
          {live ? (
            <>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, borderRadius: 99, background: C.successTint, padding: "5px 12px" }}>
                <span style={{ width: 7, height: 7, borderRadius: 99, background: C.live, animation: "clPulse 1.2s infinite" }} />
                <span style={{ fontSize: T.label, fontWeight: 700, color: C.success, ...fBody }}>Session in progress</span>
              </div>
              <div style={{ fontSize: T.hero, fontWeight: 800, color: C.white, letterSpacing: "-0.5px", marginTop: 10, ...fDisplay }}>{mmss(seconds)}</div>
              <div style={{ fontSize: T.captionLg, color: C.onDarkMuted, marginTop: 3, ...fBody }}>
                {booking.sessionStartedAt ? `Started ${booking.sessionStartedAt}` : `Started just now`} · keep going!
              </div>
            </>
          ) : (
            <>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, borderRadius: 99, background: C.fog, padding: "5px 12px" }}>
                <Clock3 size={13} color={C.slate} />
                <span style={{ fontSize: T.label, fontWeight: 700, color: C.slate, ...fBody }}>
                  {completed ? "Session completed" : "Session ended"}
                </span>
              </div>
              <div style={{ fontSize: T.heading, fontWeight: 750, color: C.jet, marginTop: 10, ...fDisplay }}>
                {completed ? "Great work today" : "Wrapping up"}
              </div>
              <div style={{ fontSize: T.captionLg, color: C.slate, marginTop: 4, lineHeight: 1.5, ...fBody }}>
                {completed ? "The session is complete and the held payment has been released." : "Your coach is finishing the session — we'll keep you posted on any final steps."}
              </div>
            </>
          )}
        </Card>

        {/* Partner */}
        <SectionLabel>{providerView ? "Your client" : "Your coach"}</SectionLabel>
        <Card style={{ marginBottom: 12, padding: 15 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 11 }}>
            <Avatar name={person} size={46} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: T.subtitle, fontWeight: 700, color: C.jet, ...fDisplay }}>{person}</div>
              <div style={{ fontSize: T.captionLg, color: C.slate, marginTop: 3, ...fBody }}>{booking.service}</div>
            </div>
          </div>
          <Row label="Date" value={booking.date} />
          <Row label="Time" value={booking.time} />
          <Row label="Format" value={booking.mode} last />
          {live && (
            <div style={{ display: "flex", gap: 8, marginTop: 13 }}>
              <Btn full size="sm" variant="secondary" icon={MessageCircle} onClick={() => nav("chat-thread", { name: messageName, context: `${booking.service} · ${booking.date}`, bookingId: booking.id, backTo: "session-progress", backParams: { bookingId: booking.id, role } })}>Message</Btn>
              <Btn full size="sm" variant="outline" icon={Phone} onClick={() => { haptic(8); toast(`Calling ${person.split(" ")[0]}…`); }}>Call</Btn>
            </div>
          )}
        </Card>

        {/* Venue / connection */}
        <SectionLabel>{details.online ? "Connection" : "Venue"}</SectionLabel>
        <Card style={{ marginBottom: 12, padding: 15 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
            <div style={{ width: 40, height: 40, borderRadius: 13, background: C.brandTint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {details.online ? <Video size={18} color={C.brandIcon || C.brand} /> : <MapPin size={18} color={C.brandIcon || C.brand} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: T.body, fontWeight: 700, color: C.jet, ...fBody }}>{details.online ? "Online session" : details.venue}</div>
              <div style={{ fontSize: T.captionLg, color: C.slate, lineHeight: 1.5, marginTop: 3, ...fBody }}>
                {details.online ? "Stay connected — your coach is with you on the call." : "You're both checked in at the venue."}
              </div>
            </div>
          </div>
          {!details.online && (
            <Btn full variant="outline" icon={Navigation} style={{ marginTop: 13 }} onClick={() => { haptic(8); toast(`Opening directions to ${details.venue}`); }}>
              Get directions
            </Btn>
          )}
        </Card>

        {/* Final charge (client) */}
        {pendingCharge && role === "client" && !live && (
          <Card style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 11, background: C.warnTint, border: "none" }} onClick={() => nav("additional-charge-payment", { chargeId: pendingCharge.id, role: "client", backTo: "session-progress" })}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: C.white, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Smartphone size={17} color={C.warnStrong} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: T.body, fontWeight: 700, color: C.jet, ...fBody }}>Final payment · ${Number(pendingCharge.amount).toFixed(2)}</div>
              <div style={{ fontSize: T.captionLg, color: C.slate, marginTop: 2, ...fBody }}>{pendingCharge.reason} · Pay to complete the session</div>
            </div>
            <ChevronRight size={16} color={C.slateLight} />
          </Card>
        )}

        {/* In-session support */}
        <SectionLabel>{live ? "During your session" : "Support"}</SectionLabel>
        <Card style={{ marginBottom: 12, padding: 0, overflow: "hidden" }}>
          <button
            type="button"
            onClick={() => nav("support", { presetTab: "chat", bookingContext: `${booking.service} · ${booking.date}`, backTo: "session-progress", backParams: { bookingId: booking.id, role } })}
            style={{ width: "100%", minHeight: 56, padding: "0 15px", background: "none", border: "none", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 11, cursor: "pointer", textAlign: "left" }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 11, background: C.brandTint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <LifeBuoy size={17} color={C.brandIcon || C.brand} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: T.body, fontWeight: 700, color: C.jet, ...fBody }}>Get help during the session</div>
              <div style={{ fontSize: T.captionLg, color: C.slate, marginTop: 2, ...fBody }}>CoachNivo support is one tap away</div>
            </div>
            <ChevronRight size={16} color={C.slateLight} />
          </button>
          <button
            type="button"
            onClick={() => nav("dispute-create", { bookingId: booking.id, role, category: providerView ? "client_no_show" : "session_not_delivered", backTo: "session-progress", backParams: { bookingId: booking.id, role, backTo: backScreen, backParams } })}
            style={{ width: "100%", minHeight: 56, padding: "0 15px", background: "none", border: "none", display: "flex", alignItems: "center", gap: 11, cursor: "pointer", textAlign: "left" }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 11, background: C.dangerTint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <AlertTriangle size={17} color={C.danger} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: T.body, fontWeight: 700, color: C.jet, ...fBody }}>Report an issue</div>
              <div style={{ fontSize: T.captionLg, color: C.slate, marginTop: 2, ...fBody }}>Safety or no-show concerns</div>
            </div>
            <ChevronRight size={16} color={C.slateLight} />
          </button>
        </Card>

        <Card style={{ display: "flex", gap: 11, alignItems: "flex-start", background: C.successTint, border: "none" }}>
          <ShieldCheck size={19} color={C.success} style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: T.body, fontWeight: 700, color: C.jet, ...fBody }}>Session protected</div>
            <div style={{ fontSize: T.captionLg, color: C.slate, lineHeight: 1.55, marginTop: 4, ...fBody }}>
              {providerView
                ? role === "businessCoach" ? "Customer payment is protected and managed by your organisation." : `$${Number(booking.paidTotal || booking.price).toFixed(2)} is held securely and releases when the session completes.`
                : "Your payment stays held by CoachNivo until the session is complete."}
            </div>
          </div>
        </Card>
      </div>

      <div style={{ padding: `12px ${LAYOUT.pagePadX}px max(${LAYOUT.ctaPadBottom}px, env(safe-area-inset-bottom))`, borderTop: `1px solid ${C.border}`, background: C.white }}>
        {live && providerView && (
          <Btn full icon={CheckCircle2} onClick={() => setEndSheetOpen(true)}>End session</Btn>
        )}
        {live && role === "client" && (
          <div style={{ width: "100%", minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.fog, borderRadius: 12, padding: "10px 16px", color: C.slate, fontSize: T.body, fontWeight: 600, ...fBody }}>
            <Clock3 size={15} color={C.brand} />
            <span>Your coach ends the session when you're done</span>
          </div>
        )}
        {!live && providerView && !completed && (
          <Btn full icon={ArrowRight} onClick={() => nav("coach-session-completion", { bookingId: booking.id, role, backTo: backScreen, backParams })}>Finish session</Btn>
        )}
        {!live && role === "client" && completed && (
          <Btn full icon={CheckCircle2} onClick={() => nav("funds-release-status", { bookingId: booking.id, role: "client", backTo: backScreen })}>View payment release</Btn>
        )}
        {!live && role === "client" && !completed && (
          <Btn full variant="outline" icon={CalendarDays} onClick={() => nav(backScreen, { id: booking.id })}>Back to session details</Btn>
        )}
      </div>

      <BottomSheet open={endSheetOpen} onClose={() => setEndSheetOpen(false)} title="End this session?" heightPct={56}>
        <div style={{ fontSize: T.body, color: C.slate, lineHeight: 1.55, marginBottom: 14, ...fBody }}>
          {role === "businessCoach" ? "End the session when delivery is complete. Your organisation manages customer charges and payment release." : "Once you end the session, you can add any agreed final charges — like extra time, equipment, or venue costs — before the funds are released."}
        </div>
        <Card style={{ marginBottom: 18, display: "flex", gap: 11, alignItems: "flex-start", background: C.fog, border: "none" }}>
          <ShieldCheck size={18} color={C.brand} style={{ flexShrink: 0 }} />
          <div style={{ fontSize: T.captionLg, color: C.slate, lineHeight: 1.55, ...fBody }}>
            {role === "businessCoach" ? "Your session record will be sent to the business for payment reconciliation." : pendingCharge
              ? `A final payment of $${Number(pendingCharge.amount).toFixed(2)} is waiting for ${(booking.clientName || "your client").split(" ")[0]} — the session completes once it's paid.`
              : "No charges yet — you can finish without one, and the held payment releases right away."}
          </div>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Btn full onClick={() => { haptic(12); setEndSheetOpen(false); nav("coach-session-completion", { bookingId: booking.id, role, backTo: "session-progress", backParams: { bookingId: booking.id, role, backTo: backScreen, backParams } }); }}>
            Continue to finish
          </Btn>
          <Btn full variant="secondary" onClick={() => setEndSheetOpen(false)}>Keep session live</Btn>
        </div>
      </BottomSheet>
    </div>
  );
}
