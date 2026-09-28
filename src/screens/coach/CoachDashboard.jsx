import React, { useState, useEffect } from "react";
import {
  WifiOff,
  Calendar,
  Star,
  Banknote,
  MessageCircle,
  Check,
  CornerUpLeft,
  Flag,
  Clock,
  ChevronRight,
} from "lucide-react";
import { CL, CD, fDisplay, fBody, T } from "../../theme/theme";
import { REVIEWS, CONFIG } from "../../data/mockData";
import {
  Avatar,
  Card,
  Btn,
  SectionLabel,
  StatusPill,
  StarRow,
  BottomSheet,
  Badge,
  HandleTag,
  ScreenHeader,
  Toggle,
  BookingCardSkeleton,
  EmptyState,
} from "../../components/ui/Primitives";
import { useReviewActions, DISPUTE_REASONS } from "../../systems/ReviewsSystem";
import { useApp } from "../../context/AppContext";
import { getBookingClientName } from "../../utils/name";
import { withClientMeta } from "../../data/users";
import { BOOKING_STATUS } from "../../data/bookings";
import { useResponsive } from "../../theme/responsive";
import { CardSlider } from "../../components/layout";

/** Name the coach should see for a booking's client — privacy-safe until the
    booking is confirmed, full name afterwards (partner reveal). */
function clientNameFor(booking) {
  return getBookingClientName(withClientMeta(booking));
}

export function ScreenCoachDashboard({
  nav,
  coachBookings,
  respondBooking,
  coachNotifications = [],
  verified,
  toast,
  offline,
  coachAvailableNow,
  setCoachAvailableNow,
}) {
  const { darkMode, coachIdentity } = useApp();
  const C = darkMode ? CD : CL;
  const { isDesktop, isTablet } = useResponsive();
  const [respondingId, setRespondingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const { getReply, getDispute, submitReply, submitDispute } = useReviewActions();

  useEffect(() => { const t = setTimeout(() => setLoading(false), 800); return () => clearTimeout(t); }, []);
  const [replyTarget, setReplyTarget] = useState(null); // review being replied to
  const [replyText, setReplyText] = useState("");
  const [disputeTarget, setDisputeTarget] = useState(null); // review being disputed
  const [disputeReason, setDisputeReason] = useState(null);
  const [disputeDetail, setDisputeDetail] = useState("");

  const openReply = (r) => { setReplyText(getReply(r.id)?.text || ""); setReplyTarget(r); };
  const closeReply = () => { setReplyTarget(null); setReplyText(""); };
  const submitReplyAction = () => {
    if (!replyText.trim()) return;
    submitReply(replyTarget.id, replyText);
    toast?.("Reply posted");
    closeReply();
  };

  const openDispute = (r) => { setDisputeReason(null); setDisputeDetail(""); setDisputeTarget(r); };
  const closeDispute = () => { setDisputeTarget(null); setDisputeReason(null); setDisputeDetail(""); };
  const submitDisputeAction = () => {
    if (!disputeReason) return;
    submitDispute(disputeTarget.id, disputeReason, disputeDetail);
    toast?.("Dispute submitted to CoachNivo Support");
    closeDispute();
  };
  const notifications = coachNotifications;

  const pendingRequests = coachBookings.filter((b) => b.status === BOOKING_STATUS.PENDING);
  const awaitingPayment = coachBookings.filter((b) => b.status === BOOKING_STATUS.AWAITING_PAYMENT);
  const pending = [...pendingRequests, ...awaitingPayment];
  const upcoming = coachBookings.filter((b) => [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.COMPLETION_PENDING].includes(b.status));
  const completed = coachBookings.filter((b) => b.status === BOOKING_STATUS.COMPLETED);

  const earningsThisWeek = upcoming.reduce((s, b) => s + b.price, 0);
  const grossPaid = completed.reduce((s, b) => s + b.price, 0);
  const commission = Math.round(grossPaid * CONFIG.commissionRate);

  const unreadCount = notifications.filter((n) => n.unread).length;
  const ratingAvg = (REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length).toFixed(1);

  const respondWithFeedback = (id, status, message) => {
    // Guard against acting on a request that's no longer pending (already
    // handled from the full Bookings screen, for instance).
    const target = coachBookings.find((b) => b.id === id);
    if (!target || target.status !== BOOKING_STATUS.PENDING) {
      toast("This request has already been handled");
      return;
    }
    setRespondingId(id);

    setTimeout(() => {
      respondBooking(id, status);
      setRespondingId(null);
      toast(message);
    }, 600);
  };

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        padding: isDesktop ? "40px 64px 64px" : "18px 18px 116px",
        boxSizing: "border-box",
      }}
      className="cl-hide-scrollbar"
    >
      {/* Header with Availability Toggle on Top Right */}
      <div style={{ marginBottom: isDesktop ? 24 : 16 }}>
        <ScreenHeader
          title={`${(coachIdentity.name || "Coach").split(" ")[0]}'s dashboard`}
          subtitle="Bookings, messages and coaching activity."
          action={
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: coachAvailableNow ? C.white : C.dangerTint,
                border: `1.5px solid ${coachAvailableNow ? C.border : C.dangerBorder}`,
                borderRadius: 14,
                padding: isDesktop ? "8px 16px" : "6px 10px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: 99,
                    background: coachAvailableNow ? C.success : C.danger,
                    flexShrink: 0,
                    boxShadow: coachAvailableNow ? `0 0 6px ${C.success}` : "none",
                  }}
                />
                <div>
                  <div style={{ fontSize: isDesktop ? 14 : 12, fontWeight: 700, color: C.jet, lineHeight: 1.2, ...fBody }}>
                    {coachAvailableNow ? "Available for bookings" : "Unavailable"}
                  </div>
                  {isDesktop && (
                    <div style={{ fontSize: 12, color: coachAvailableNow ? C.slateLight : C.danger, lineHeight: 1.2, marginTop: 2, ...fBody }}>
                      {coachAvailableNow ? "Clients can discover & book" : "Hidden from bookings"}
                    </div>
                  )}
                </div>
              </div>
              <Toggle
                label="Available for bookings"
                on={coachAvailableNow}
                onClick={() => {
                  const next = !coachAvailableNow;
                  setCoachAvailableNow(next);
                  toast?.(next ? "You're now available for bookings" : "You're now marked unavailable");
                }}
              />
            </div>
          }
        />
      </div>
        {/* Offline Status */}
        {offline && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: darkMode ? C.white : C.jet,
              color: darkMode ? C.jet : C.white,
              border: `1px solid ${C.border}`,
              padding: "9px 12px",
              borderRadius: 12,
              marginBottom: 16,
              fontSize: T.label,
              ...fBody,
            }}
          >
            <WifiOff size={14} color={C.brand} />
            Offline - showing your last synced data.
          </div>
        )}

        {/* 5 Stats: 1 row of 5 on desktop, 2 rows (2 cols, then 3 cols) on mobile */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isDesktop ? "repeat(5, minmax(0, 1fr))" : "repeat(6, 1fr)",
            gap: isDesktop ? 16 : 10,
            marginTop: isDesktop ? 8 : 12,
            marginBottom: isDesktop ? 24 : 16,
          }}
        >
          {/* Row 1 / Card 1: This week's earnings */}
          <Card
            onClick={() => nav("coach-earnings")}
            ariaLabel="View earnings and payouts"
            style={{
              gridColumn: isDesktop ? "auto" : "span 3",
              padding: isDesktop ? 32 : 16,
              borderRadius: isDesktop ? 22 : 16,
              background: darkMode ? C.white : C.jet,
              border: darkMode ? `1px solid ${C.border}` : "none",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              cursor: "pointer",
            }}
          >
            <div style={{ fontSize: isDesktop ? 15 : T.caption, color: darkMode ? C.slate : C.onDarkMuted, ...fBody }}>
              This week's earnings
            </div>
            <div
              style={{
                fontSize: isDesktop ? 44 : 28,
                fontWeight: 700,
                color: darkMode ? C.jet : C.white,
                marginTop: 6,
                lineHeight: 1.05,
                ...fDisplay,
              }}
            >
              ${earningsThisWeek}
            </div>
            <div style={{ fontSize: isDesktop ? 13.5 : T.tiny, color: darkMode ? C.slateLight : C.onDark, marginTop: 6, ...fBody }}>
              projected payout
            </div>
          </Card>

          {/* Row 1 / Card 2: Pending requests */}
          <Card
            style={{
              gridColumn: isDesktop ? "auto" : "span 3",
              padding: isDesktop ? 32 : 16,
              borderRadius: isDesktop ? 22 : 16,
              background: darkMode ? C.white : C.brandTint,
              border: `1px solid ${darkMode ? C.border : (C.brandBorder || C.border)}`,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div style={{ fontSize: isDesktop ? 15 : T.caption, color: C.brand, fontWeight: 650, ...fBody }}>
              Pending requests
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
              {pending.length}
            </div>
            <div style={{ fontSize: isDesktop ? 13.5 : T.tiny, color: darkMode ? C.slateLight : C.slate, marginTop: 6, ...fBody }}>
              requires action
            </div>
          </Card>

          {/* Row 2 / Card 3: Upcoming sessions */}
          <Card
            style={{
              gridColumn: isDesktop ? "auto" : "span 2",
              padding: isDesktop ? 32 : "14px 10px",
              borderRadius: isDesktop ? 22 : 16,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div style={{ fontSize: isDesktop ? 15 : 12, lineHeight: 1.2, color: C.slate, fontWeight: 600, ...fBody }}>
              Upcoming sessions
            </div>
            <div
              style={{
                fontSize: isDesktop ? 44 : 24,
                fontWeight: 700,
                color: C.jet,
                marginTop: 6,
                lineHeight: 1.05,
                ...fDisplay,
              }}
            >
              {upcoming.length}
            </div>
            <div style={{ fontSize: isDesktop ? 13.5 : 11, color: C.slateLight, marginTop: 6, ...fBody }}>
              on schedule
            </div>
          </Card>

          {/* Row 2 / Card 4: Rating */}
          <Card
            style={{
              gridColumn: isDesktop ? "auto" : "span 2",
              padding: isDesktop ? 32 : "14px 10px",
              borderRadius: isDesktop ? 22 : 16,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div style={{ fontSize: isDesktop ? 15 : 12, lineHeight: 1.2, color: C.slate, fontWeight: 600, ...fBody }}>
              Rating
            </div>
            <div
              style={{
                fontSize: isDesktop ? 44 : 24,
                fontWeight: 700,
                color: C.jet,
                marginTop: 6,
                lineHeight: 1.05,
                ...fDisplay,
              }}
            >
              {ratingAvg}
            </div>
            <div
              style={{
                fontSize: isDesktop ? 13.5 : 11,
                color: C.brand,
                marginTop: 6,
                fontWeight: 650,
                display: "flex",
                alignItems: "center",
                gap: 4,
                ...fBody,
              }}
            >
              <Star size={11} fill={C.brand} color={C.brand} /> client avg
            </div>
          </Card>

          {/* Row 2 / Card 5: Next payout */}
          <Card
            onClick={() => nav("coach-earnings")}
            ariaLabel="View earnings and payouts"
            style={{
              gridColumn: isDesktop ? "auto" : "span 2",
              padding: isDesktop ? 32 : "14px 10px",
              borderRadius: isDesktop ? 22 : 16,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              cursor: "pointer",
            }}
          >
            <div style={{ fontSize: isDesktop ? 15 : 12, lineHeight: 1.2, color: C.slate, fontWeight: 600, ...fBody }}>
              Next payout
            </div>
            <div
              style={{
                fontSize: isDesktop ? 44 : 24,
                fontWeight: 700,
                color: C.jet,
                marginTop: 6,
                lineHeight: 1.05,
                ...fDisplay,
              }}
            >
              Fri
            </div>
            <div style={{ fontSize: isDesktop ? 13.5 : 11, color: C.slateLight, marginTop: 6, ...fBody }}>
              auto transfer
            </div>
          </Card>
        </div>

        {loading ? (
          <>
            <div style={{ marginTop: 22, marginBottom: 10 }}><SectionLabel>Pending requests</SectionLabel></div>
            <BookingCardSkeleton rows={2} />
            <div style={{ marginTop: 18, marginBottom: 10 }}><SectionLabel>Upcoming sessions</SectionLabel></div>
            <BookingCardSkeleton rows={2} />
          </>
        ) : isDesktop ? (
          /* ── Structured Desktop Layout (Zero unnecessary sliders) ── */
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.6fr) minmax(0, 1fr)",
              gap: 24,
              alignItems: "start",
            }}
          >
            {/* Left Column: Core Operations & Schedule */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24, minWidth: 0 }}>
              {/* 1. Pending Booking Requests */}
              <Card style={{ padding: 24, borderRadius: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.jet, fontFamily: "'Outfit', sans-serif" }}>
                      Pending requests
                    </h2>
                    {pendingRequests.length > 0 && (
                      <Badge tone="orange">{pendingRequests.length} action required</Badge>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => nav("coach-bookings")}
                    style={{
                      background: "none",
                      border: "none",
                      color: C.brand,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      padding: 0,
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    <span>See all bookings</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                {pendingRequests.length === 0 ? (
                  <div
                    style={{
                      padding: "28px 16px",
                      textAlign: "center",
                      background: C.fog,
                      borderRadius: 14,
                      border: `1px dashed ${C.border}`,
                    }}
                  >
                    <Check size={24} color={C.success} style={{ margin: "0 auto 8px" }} />
                    <div style={{ fontSize: 15, fontWeight: 600, color: C.jet, fontFamily: "'Inter', sans-serif" }}>
                      No pending requests
                    </div>
                    <div style={{ fontSize: 14, color: C.slate, marginTop: 3, fontFamily: "'Inter', sans-serif" }}>
                      You're completely up to date with client bookings.
                    </div>
                  </div>
                ) : (
                  <CardSlider perView={3} gap={14}>
                    {pendingRequests.map((b) => {
                      const cn = clientNameFor(b);
                      return (
                        <div
                          key={b.id}
                          style={{
                            background: darkMode ? "#1A222D" : C.white,
                            border: `1px solid ${C.border}`,
                            borderRadius: 16,
                            padding: 16,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            height: "100%",
                            boxSizing: "border-box",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.02)",
                          }}
                        >
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                                <Avatar name={cn.name} size={38} />
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontSize: 15, fontWeight: 700, color: C.jet, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'Outfit', sans-serif" }}>
                                    {cn.name}
                                  </div>
                                  {cn.handle && <HandleTag handle={cn.handle} size={10.5} color={C.slateLight} />}
                                </div>
                              </div>
                              <div style={{ fontSize: 17, fontWeight: 700, color: C.jet, fontFamily: "'Outfit', sans-serif" }}>
                                ${b.price}
                              </div>
                            </div>

                            <div style={{ fontSize: 14, fontWeight: 600, color: C.brand, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'Inter', sans-serif" }}>
                              {b.service}
                            </div>
                            <div style={{ fontSize: 13, color: C.slate, marginTop: 3, display: "flex", alignItems: "center", gap: 4, fontFamily: "'Inter', sans-serif" }}>
                              <Clock size={12} color={C.slateLight} />
                              <span>{b.date} · {b.time}</span>
                            </div>
                          </div>

                          <div style={{ display: "flex", gap: 6, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                            <Btn
                              size="sm"
                              variant="outline"
                              disabled={!!respondingId}
                              onClick={(e) => {
                                e.stopPropagation();
                                respondWithFeedback(b.id, BOOKING_STATUS.DECLINED, "Booking declined");
                              }}
                              style={{ flex: 1, padding: "0 10px", minHeight: 38 }}
                            >
                              Decline
                            </Btn>
                            <Btn
                              size="sm"
                              loading={respondingId === b.id}
                              loadingText="…"
                              disabled={!!respondingId && respondingId !== b.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                respondWithFeedback(b.id, BOOKING_STATUS.AWAITING_PAYMENT, "Booking accepted");
                              }}
                              style={{ flex: 1.2, padding: "0 10px", minHeight: 38 }}
                            >
                              Accept
                            </Btn>
                          </div>
                        </div>
                      );
                    })}
                  </CardSlider>
                )}
              </Card>

              {/* Awaiting Client Payment (Dedicated Container) */}
              {awaitingPayment.length > 0 && (
                <Card style={{ padding: 24, borderRadius: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.jet, fontFamily: "'Outfit', sans-serif" }}>
                        Awaiting client payment
                      </h2>
                      <Badge tone="orange">{awaitingPayment.length} reserved</Badge>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {awaitingPayment.map((b) => {
                      const cn = clientNameFor(b);
                      return (
                        <div
                          key={b.id}
                          onClick={() => nav("booking-awaiting-payment", { id: b.id })}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "14px 16px",
                            borderRadius: 14,
                            background: C.strongTint,
                            border: `1px solid ${C.border}`,
                            cursor: "pointer",
                            gap: 12,
                          }}
                          className="cl-table-row"
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                            <Avatar name={cn.name} size={38} />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 15, fontWeight: 700, color: C.jet, fontFamily: "'Inter', sans-serif" }}>
                                {cn.name} <span style={{ fontWeight: 400, color: C.slate }}>· {b.service}</span>
                              </div>
                              <div style={{ fontSize: 13.5, color: C.slate, marginTop: 2, fontFamily: "'Inter', sans-serif" }}>
                                {b.date} · ${b.price}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                            <span style={{ fontSize: 13.5, fontWeight: 600, color: C.strong, display: "flex", alignItems: "center", gap: 4, fontFamily: "'Inter', sans-serif" }}>
                              <Clock size={14} />
                              Reserved
                            </span>
                            <ChevronRight size={16} color={C.slate} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* 2. Upcoming Schedule & Sessions */}
              <Card style={{ padding: 24, borderRadius: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.jet, fontFamily: "'Outfit', sans-serif" }}>
                      Upcoming schedule
                    </h2>
                    <Badge tone="neutral">{upcoming.length} confirmed</Badge>
                  </div>
                  <button
                    type="button"
                    onClick={() => nav("coach-calendar")}
                    style={{
                      background: "none",
                      border: "none",
                      color: C.brand,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      padding: 0,
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    <span>Open calendar</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                {upcoming.length === 0 ? (
                  <div
                    style={{
                      padding: "32px 16px",
                      textAlign: "center",
                      background: C.fog,
                      borderRadius: 14,
                      border: `1px dashed ${C.border}`,
                    }}
                  >
                    <Calendar size={26} color={C.slateLight} style={{ margin: "0 auto 8px" }} />
                    <div style={{ fontSize: 15, fontWeight: 600, color: C.jet, fontFamily: "'Inter', sans-serif" }}>
                      No upcoming sessions scheduled
                    </div>
                    <div style={{ fontSize: 14, color: C.slate, marginTop: 3, marginBottom: 14, fontFamily: "'Inter', sans-serif" }}>
                      Keep your calendar availability updated so clients can book slots.
                    </div>
                    <Btn size="sm" variant="outline" onClick={() => nav("coach-calendar")}>
                      Manage availability
                    </Btn>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {upcoming.map((b) => {
                      const cn = clientNameFor(b);
                      return (
                        <div
                          key={b.id}
                          onClick={() => nav("coach-session-detail", { id: b.id })}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "14px 16px",
                            borderRadius: 14,
                            background: C.white,
                            border: `1px solid ${C.border}`,
                            cursor: "pointer",
                            gap: 14,
                          }}
                          className="cl-table-row"
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
                            {/* Date / Time pill */}
                            <div
                              style={{
                                padding: "8px 12px",
                                borderRadius: 10,
                                background: C.fog,
                                textAlign: "center",
                                minWidth: 80,
                                flexShrink: 0,
                              }}
                            >
                              <div style={{ fontSize: 14, fontWeight: 700, color: C.jet, lineHeight: 1.1, fontFamily: "'Outfit', sans-serif" }}>
                                {b.date.split(" ")[0]} {b.date.split(" ")[1]}
                              </div>
                              <div style={{ fontSize: 12, color: C.slate, marginTop: 2, fontFamily: "'Inter', sans-serif" }}>
                                {b.time}
                              </div>
                            </div>

                            <Avatar name={cn.name} size={40} />

                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontSize: 15, fontWeight: 700, color: C.jet, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'Inter', sans-serif" }}>
                                  {cn.name}
                                </span>
                                {cn.handle && <HandleTag handle={cn.handle} size={11} color={C.slateLight} />}
                              </div>
                              <div style={{ fontSize: 14, color: C.brand, fontWeight: 600, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'Inter', sans-serif" }}>
                                {b.service || "Coaching Session"}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                            <StatusPill status={b.status} perspective="coach" />
                            <ChevronRight size={16} color={C.slateLight} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>

            {/* Right Column: Shortcuts, Earnings Breakdown & Recent Reviews */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24, minWidth: 0 }}>
              {/* Widget 1: Quick Actions & Management Shortcuts */}
              <Card style={{ padding: 22, borderRadius: 20 }}>
                <h2 style={{ margin: "0 0 14px", fontSize: 18, fontWeight: 700, color: C.jet, fontFamily: "'Outfit', sans-serif" }}>
                  Quick management
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { label: "Availability & Calendar", desc: "Manage weekly slots & holidays", icon: Calendar, action: () => nav("coach-calendar", { tab: "availability", section: "availability" }) },
                    { label: "Packages & Pricing", desc: "Edit services, rates & tiers", icon: Banknote, action: () => nav("coach-profile-edit", { tab: "business" }) },
                    { label: "Client Messages", desc: unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? "s" : ""}` : "Chat & session coordination", icon: MessageCircle, badge: unreadCount > 0 ? unreadCount : null, action: () => nav("coach-messages") },
                    { label: "Public Profile Preview", desc: "See how clients view your page", icon: Star, action: () => nav("coach-profile", { preview: true, tab: "reviews" }) },
                  ].map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={item.action}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 12px",
                          borderRadius: 12,
                          border: `1px solid ${C.border}`,
                          background: C.white,
                          cursor: "pointer",
                          textAlign: "left",
                          gap: 10,
                        }}
                        className="cl-table-row"
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 10,
                              background: C.fog,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: C.brand,
                              flexShrink: 0,
                            }}
                          >
                            <Icon size={16} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 14.5, fontWeight: 650, color: C.jet, fontFamily: "'Inter', sans-serif" }}>
                              {item.label}
                            </div>
                            <div style={{ fontSize: 12.5, color: C.slate, marginTop: 1, fontFamily: "'Inter', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {item.desc}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                          {item.badge && (
                            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: C.brand, color: "#FFFFFF" }}>
                              {item.badge}
                            </span>
                          )}
                          <ChevronRight size={14} color={C.slateLight} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* Widget 2: Earnings & Automated Payout Summary (Moved above Client feedback) */}
              <Card
                onClick={() => nav("coach-earnings")}
                ariaLabel="View earnings and payouts"
                style={{ padding: 22, borderRadius: 20, cursor: "pointer" }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Banknote size={18} color={C.brand} />
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.jet, fontFamily: "'Outfit', sans-serif" }}>
                      Payout breakdown
                    </h2>
                  </div>
                  <ChevronRight size={16} color={C.slateLight} />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: C.slate, fontFamily: "'Inter', sans-serif" }}>
                    <span>Projected this week</span>
                    <span style={{ fontWeight: 700, color: C.jet }}>${earningsThisWeek}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: C.slate, fontFamily: "'Inter', sans-serif" }}>
                    <span>Completed revenue</span>
                    <span style={{ fontWeight: 700, color: C.jet }}>${grossPaid}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: C.slate, fontFamily: "'Inter', sans-serif" }}>
                    <span>Platform commission ({Math.round(CONFIG.commissionRate * 100)}%)</span>
                    <span style={{ fontWeight: 600, color: C.slateLight }}>-${commission}</span>
                  </div>
                </div>

                <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.slate, fontFamily: "'Inter', sans-serif" }}>
                  <Clock size={14} color={C.brand} style={{ flexShrink: 0 }} />
                  <span>Next automated transfer: <strong>Friday</strong></span>
                </div>
              </Card>

              {/* Widget 3: Recent Reviews */}
              <Card style={{ padding: 22, borderRadius: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.jet, fontFamily: "'Outfit', sans-serif" }}>
                      Client feedback
                    </h2>
                    <Badge tone="orange">{ratingAvg} ★</Badge>
                  </div>
                  <button
                    type="button"
                    onClick={() => nav("coach-reviews")}
                    style={{
                      background: "none",
                      border: "none",
                      color: C.brand,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: 0,
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    See all
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {REVIEWS.slice(0, 3).map((r) => {
                    const reply = getReply(r.id);
                    const dispute = getDispute(r.id);
                    return (
                      <div
                        key={r.id}
                        style={{
                          padding: 14,
                          borderRadius: 14,
                          background: C.white,
                          border: `1px solid ${C.border}`,
                          boxShadow: "0 1px 4px rgba(0,0,0,0.02)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                          <div>
                            <div style={{ fontSize: 14.5, fontWeight: 700, color: C.jet, fontFamily: "'Inter', sans-serif" }}>
                              {r.name}
                            </div>
                            {r.handle && <HandleTag handle={r.handle} size={10} color={C.slateLight} />}
                          </div>
                          <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 14, fontWeight: 700, color: C.jet, fontFamily: "'Inter', sans-serif" }}>
                            <Star size={13} fill={C.brand} color={C.brand} />
                            {r.rating.toFixed(1)}
                          </span>
                        </div>

                        <p
                          style={{
                            fontSize: 14,
                            color: C.slate,
                            margin: "8px 0 0",
                            lineHeight: 1.45,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          "{r.text}"
                        </p>

                        {reply && (
                          <div style={{ marginTop: 8, background: C.white, borderRadius: 8, padding: "6px 10px", border: `1px solid ${C.border}` }}>
                            <div style={{ fontSize: 11.5, fontWeight: 700, color: C.brand, fontFamily: "'Inter', sans-serif" }}>Your reply</div>
                            <p style={{ fontSize: 12.5, color: C.jet, margin: "2px 0 0", lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", fontFamily: "'Inter', sans-serif" }}>{reply.text}</p>
                          </div>
                        )}

                        <div style={{ display: "flex", gap: 8, marginTop: 10, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
                          <Btn size="sm" variant="secondary" icon={CornerUpLeft} onClick={() => openReply(r)}>
                            {reply ? "Edit reply" : "Reply"}
                          </Btn>
                          {!dispute && (
                            <Btn size="sm" variant="outline" icon={Flag} onClick={() => openDispute(r)}>
                              Report
                            </Btn>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </div>
        ) : (
          /* ── Mobile / Tablet View (Touch-optimized based on desktop design) ── */
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* 1. Pending Booking Requests */}
            <Card style={{ padding: 16, borderRadius: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.jet, ...fDisplay }}>
                    Pending requests
                  </h2>
                  {pendingRequests.length > 0 && (
                    <Badge tone="orange">{pendingRequests.length}</Badge>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => nav("coach-bookings")}
                  style={{
                    background: "none",
                    border: "none",
                    color: C.brand,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    padding: 0,
                    ...fBody,
                  }}
                >
                  <span>See all</span>
                  <ChevronRight size={13} />
                </button>
              </div>

              {pendingRequests.length === 0 ? (
                <div
                  style={{
                    padding: "20px 14px",
                    textAlign: "center",
                    background: C.fog,
                    borderRadius: 12,
                    border: `1px dashed ${C.border}`,
                  }}
                >
                  <Check size={20} color={C.success} style={{ margin: "0 auto 6px" }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.jet, ...fBody }}>
                    No pending requests
                  </div>
                  <div style={{ fontSize: 12, color: C.slate, marginTop: 2, ...fBody }}>
                    You're completely up to date with client bookings.
                  </div>
                </div>
              ) : (
                <CardSlider perView={isTablet ? 2 : 1.12} gap={12}>
                  {pendingRequests.map((b) => {
                    const cn = clientNameFor(b);
                    return (
                      <div
                        key={b.id}
                        style={{
                          background: darkMode ? "#1A222D" : C.white,
                          border: `1px solid ${C.border}`,
                          borderRadius: 14,
                          padding: 14,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          height: "100%",
                          boxSizing: "border-box",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                              <Avatar name={cn.name} size={36} />
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 14.5, fontWeight: 700, color: C.jet, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...fDisplay }}>
                                  {cn.name}
                                </div>
                                {cn.handle && <HandleTag handle={cn.handle} size={10} color={C.slateLight} />}
                              </div>
                            </div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: C.jet, ...fDisplay }}>
                              ${b.price}
                            </div>
                          </div>

                          <div style={{ fontSize: 13.5, fontWeight: 600, color: C.brand, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...fBody }}>
                            {b.service}
                          </div>
                          <div style={{ fontSize: 12.5, color: C.slate, marginTop: 2, display: "flex", alignItems: "center", gap: 4, ...fBody }}>
                            <Clock size={12} color={C.slateLight} />
                            <span>{b.date} · {b.time}</span>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 6, marginTop: 12, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                          <Btn
                            size="sm"
                            variant="outline"
                            disabled={!!respondingId}
                            onClick={(e) => {
                              e.stopPropagation();
                              respondWithFeedback(b.id, BOOKING_STATUS.DECLINED, "Booking declined");
                            }}
                            style={{ flex: 1, minHeight: 36, padding: "0 8px" }}
                          >
                            Decline
                          </Btn>
                          <Btn
                            size="sm"
                            loading={respondingId === b.id}
                            loadingText="…"
                            disabled={!!respondingId && respondingId !== b.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              respondWithFeedback(b.id, BOOKING_STATUS.AWAITING_PAYMENT, "Booking accepted");
                            }}
                            style={{ flex: 1.2, minHeight: 36, padding: "0 8px" }}
                          >
                            Accept
                          </Btn>
                        </div>
                      </div>
                    );
                  })}
                </CardSlider>
              )}
            </Card>

            {/* Awaiting Client Payment (Dedicated Container - Mobile) */}
            {awaitingPayment.length > 0 && (
              <Card style={{ padding: 16, borderRadius: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.jet, ...fDisplay }}>
                      Awaiting client payment
                    </h2>
                    <Badge tone="orange">{awaitingPayment.length}</Badge>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {awaitingPayment.map((b) => {
                    const cn = clientNameFor(b);
                    return (
                      <div
                        key={b.id}
                        onClick={() => nav("booking-awaiting-payment", { id: b.id })}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 12px",
                          borderRadius: 12,
                          background: C.strongTint,
                          border: `1px solid ${C.border}`,
                          cursor: "pointer",
                          gap: 10,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                          <Avatar name={cn.name} size={32} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 700, color: C.jet, ...fBody }}>
                              {cn.name} <span style={{ fontWeight: 400, color: C.slate }}>· {b.service}</span>
                            </div>
                            <div style={{ fontSize: 12, color: C.slate, marginTop: 1, ...fBody }}>
                              {b.date} · ${b.price}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                          <span style={{ fontSize: 11.5, fontWeight: 600, color: C.strong, display: "flex", alignItems: "center", gap: 3, ...fBody }}>
                            <Clock size={11} />
                            Reserved
                          </span>
                          <ChevronRight size={13} color={C.slate} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* 2. Upcoming Schedule */}
            <Card style={{ padding: 16, borderRadius: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.jet, ...fDisplay }}>
                    Upcoming schedule
                  </h2>
                  <Badge tone="neutral">{upcoming.length}</Badge>
                </div>
                <button
                  type="button"
                  onClick={() => nav("coach-calendar")}
                  style={{
                    background: "none",
                    border: "none",
                    color: C.brand,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    padding: 0,
                    ...fBody,
                  }}
                >
                  <span>Calendar</span>
                  <ChevronRight size={13} />
                </button>
              </div>

              {upcoming.length === 0 ? (
                <div
                  style={{
                    padding: "20px 14px",
                    textAlign: "center",
                    background: C.fog,
                    borderRadius: 12,
                    border: `1px dashed ${C.border}`,
                  }}
                >
                  <Calendar size={22} color={C.slateLight} style={{ margin: "0 auto 6px" }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.jet, ...fBody }}>
                    No upcoming sessions
                  </div>
                  <div style={{ fontSize: 12, color: C.slate, marginTop: 2, marginBottom: 10, ...fBody }}>
                    Keep your calendar open for bookings.
                  </div>
                  <Btn size="sm" variant="outline" onClick={() => nav("coach-calendar")}>
                    Manage availability
                  </Btn>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {upcoming.slice(0, 5).map((b) => {
                    const cn = clientNameFor(b);
                    return (
                      <div
                        key={b.id}
                        onClick={() => nav("coach-session-detail", { id: b.id })}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 12px",
                          borderRadius: 12,
                          background: C.white,
                          border: `1px solid ${C.border}`,
                          cursor: "pointer",
                          gap: 10,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                          <div
                            style={{
                              padding: "6px 8px",
                              borderRadius: 8,
                              background: C.fog,
                              textAlign: "center",
                              minWidth: 54,
                              flexShrink: 0,
                            }}
                          >
                            <div style={{ fontSize: 12, fontWeight: 700, color: C.jet, lineHeight: 1.1, ...fDisplay }}>
                              {b.date.split(" ")[0]} {b.date.split(" ")[1]}
                            </div>
                            <div style={{ fontSize: 10.5, color: C.slate, marginTop: 1, ...fBody }}>
                              {b.time}
                            </div>
                          </div>

                          <Avatar name={cn.name} size={34} />

                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 700, color: C.jet, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...fBody }}>
                              {cn.name}
                            </div>
                            <div style={{ fontSize: 12, color: C.brand, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...fBody }}>
                              {b.service || "Coaching Session"}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                          <StatusPill status={b.status} perspective="coach" />
                          <ChevronRight size={14} color={C.slateLight} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* 3. Quick Management Shortcuts */}
            <Card style={{ padding: 16, borderRadius: 18 }}>
              <h2 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: C.jet, ...fDisplay }}>
                Quick management
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { label: "Calendar", desc: "Slots & holidays", icon: Calendar, action: () => nav("coach-calendar", { tab: "availability", section: "availability" }) },
                  { label: "Packages", desc: "Pricing & tiers", icon: Banknote, action: () => nav("coach-profile-edit", { tab: "business" }) },
                  { label: "Messages", desc: unreadCount > 0 ? `${unreadCount} unread` : "Client chat", icon: MessageCircle, badge: unreadCount > 0 ? unreadCount : null, action: () => nav("coach-messages") },
                  { label: "Profile", desc: "Public preview", icon: Star, action: () => nav("coach-profile", { preview: true, tab: "reviews" }) },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={item.action}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        padding: "12px 10px",
                        borderRadius: 12,
                        border: `1px solid ${C.border}`,
                        background: C.white,
                        cursor: "pointer",
                        textAlign: "left",
                        gap: 6,
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 8,
                          background: C.fog,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: C.brand,
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={15} />
                      </div>
                      <div style={{ width: "100%" }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: C.jet, display: "flex", alignItems: "center", justifyContent: "space-between", ...fBody }}>
                          <span>{item.label}</span>
                          {item.badge && (
                            <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 5px", borderRadius: 99, background: C.brand, color: "#FFFFFF" }}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11.5, color: C.slate, marginTop: 1, ...fBody }}>
                          {item.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* 4. Payout Breakdown (Moved above Client Feedback on Mobile) */}
            <Card
              onClick={() => nav("coach-earnings")}
              ariaLabel="View earnings and payouts"
              style={{ padding: 16, borderRadius: 18, cursor: "pointer" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Banknote size={17} color={C.brand} />
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.jet, ...fDisplay }}>
                    Payout breakdown
                  </h2>
                </div>
                <ChevronRight size={15} color={C.slateLight} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, color: C.slate, ...fBody }}>
                  <span>Projected this week</span>
                  <span style={{ fontWeight: 700, color: C.jet }}>${earningsThisWeek}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, color: C.slate, ...fBody }}>
                  <span>Completed revenue</span>
                  <span style={{ fontWeight: 700, color: C.jet }}>${grossPaid}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, color: C.slate, ...fBody }}>
                  <span>Platform commission ({Math.round(CONFIG.commissionRate * 100)}%)</span>
                  <span style={{ fontWeight: 600, color: C.slateLight }}>-${commission}</span>
                </div>
              </div>

              <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: C.slate, ...fBody }}>
                <Clock size={13} color={C.brand} style={{ flexShrink: 0 }} />
                <span>Next automated transfer: <strong>Friday</strong></span>
              </div>
            </Card>

            {/* 5. Client Feedback (White background cards) */}
            <Card style={{ padding: 16, borderRadius: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.jet, ...fDisplay }}>
                    Client feedback
                  </h2>
                  <Badge tone="orange">{ratingAvg} ★</Badge>
                </div>
                <button
                  type="button"
                  onClick={() => nav("coach-reviews")}
                  style={{
                    background: "none",
                    border: "none",
                    color: C.brand,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: 0,
                    ...fBody,
                  }}
                >
                  See all
                </button>
              </div>

              <CardSlider perView={isTablet ? 2 : 1.12} gap={12}>
                {REVIEWS.map((r) => {
                  const reply = getReply(r.id);
                  const dispute = getDispute(r.id);
                  return (
                    <div
                      key={r.id}
                      style={{
                        padding: 14,
                        borderRadius: 14,
                        background: C.white,
                        border: `1px solid ${C.border}`,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        height: "100%",
                        boxSizing: "border-box",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.02)",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: C.jet, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...fBody }}>
                              {r.name}
                            </div>
                            {r.handle && <HandleTag handle={r.handle} size={10} color={C.slateLight} />}
                          </div>
                          <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 13, fontWeight: 700, color: C.jet, flexShrink: 0, ...fBody }}>
                            <Star size={12} fill={C.brand} color={C.brand} />
                            {r.rating.toFixed(1)}
                          </span>
                        </div>

                        <p
                          style={{
                            fontSize: 13,
                            color: C.slate,
                            margin: "8px 0 0",
                            lineHeight: 1.4,
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            ...fBody,
                          }}
                        >
                          "{r.text}"
                        </p>

                        {reply && (
                          <div style={{ marginTop: 8, background: C.fog, borderRadius: 8, padding: "6px 8px" }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: C.brand, ...fBody }}>Your reply</div>
                            <p style={{ fontSize: 12, color: C.jet, margin: "2px 0 0", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", ...fBody }}>{reply.text}</p>
                          </div>
                        )}
                      </div>

                      <div style={{ display: "flex", gap: 6, marginTop: 10, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
                        <Btn size="sm" variant="secondary" icon={CornerUpLeft} onClick={() => openReply(r)} style={{ minHeight: 34, padding: "0 10px" }}>
                          {reply ? "Edit" : "Reply"}
                        </Btn>
                        {!dispute && (
                          <Btn size="sm" variant="outline" icon={Flag} onClick={() => openDispute(r)} style={{ minHeight: 34, padding: "0 10px" }}>
                            Report
                          </Btn>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardSlider>
            </Card>
          </div>
        )}

      {/* Reply to Review Sheet */}
      <BottomSheet open={!!replyTarget} onClose={closeReply} title="Reply to review" heightPct={52}>
        {replyTarget && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ flex: 1 }}>
              <div style={{ background: C.fog, borderRadius: 12, padding: "10px 12px", marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: T.labelLg, fontWeight: 600, color: C.jet, ...fBody }}>{replyTarget.name}</span>
                  <StarRow value={replyTarget.rating} size={11} />
                </div>
                <p style={{ fontSize: T.labelLg, color: C.slate, marginTop: 4, lineHeight: 1.5, ...fBody }}>{replyTarget.text}</p>
              </div>
              <div style={{ fontSize: T.label, color: C.slate, marginBottom: 8, ...fBody }}>
                Your reply is public and will appear underneath this review on your profile.
              </div>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a public reply…"
                rows={4}
                autoFocus
                style={{
                  width: "100%", boxSizing: "border-box", background: C.white,
                  border: `1.5px solid ${C.border}`, borderRadius: 13, padding: "11px 13px",
                  fontSize: T.bodyLg, color: C.jet, outline: "none", resize: "none", ...fBody,
                }}
              />
            </div>
            <div style={{ padding: "14px 0 4px" }}>
              <Btn full onClick={submitReplyAction} style={!replyText.trim() ? { opacity: 0.5, pointerEvents: "none" } : undefined}>
                Post reply
              </Btn>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Report / Dispute Review Sheet */}
      <BottomSheet open={!!disputeTarget} onClose={closeDispute} title="Report this review"
        heightPct={disputeReason === "Something else" ? 76 : 64}>
        {disputeTarget && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ flex: 1, overflowY: "auto" }}>
              <div style={{ fontSize: T.body, color: C.slate, marginBottom: 14, ...fBody }}>
                Tell us why this review seems unfair or made in bad faith. CoachNivo Support will review it.
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {DISPUTE_REASONS.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setDisputeReason(reason)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "12px 14px", borderRadius: 12, cursor: "pointer", textAlign: "left",
                      border: `1.5px solid ${disputeReason === reason ? C.brand : C.border}`,
                      background: disputeReason === reason ? C.brandTint : C.white,
                    }}
                  >
                    <span style={{ fontSize: T.body, color: C.jet, ...fBody }}>{reason}</span>
                    {disputeReason === reason && <Check size={16} color={C.brand} />}
                  </button>
                ))}
              </div>
              {disputeReason === "Something else" && (
                <textarea
                  value={disputeDetail}
                  onChange={(e) => setDisputeDetail(e.target.value)}
                  placeholder="Tell us what's going on…"
                  rows={4}
                  autoFocus
                  style={{
                    width: "100%", boxSizing: "border-box", background: C.white, marginTop: 14,
                    border: `1.5px solid ${C.border}`, borderRadius: 13, padding: "11px 13px",
                    fontSize: T.bodyLg, color: C.jet, outline: "none", resize: "none", ...fBody,
                  }}
                />
              )}
            </div>
            <div style={{ padding: "14px 0 4px" }}>
              <Btn full onClick={submitDisputeAction} style={!disputeReason ? { opacity: 0.5, pointerEvents: "none" } : undefined}>
                Submit dispute
              </Btn>
            </div>
          </div>
        )}
      </BottomSheet>

    </div>
  );
}
