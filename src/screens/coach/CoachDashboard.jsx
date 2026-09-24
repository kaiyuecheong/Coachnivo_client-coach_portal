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
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: isDesktop ? "40px 64px 0" : "18px 18px 0",
        }}
      >
        {/* Header with Availability Toggle on Top Right */}
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

      <div style={{ flex: 1, overflowY: "auto", width: "100%", padding: isDesktop ? "24px 64px 64px" : "0 18px", paddingBottom: 116 }} className="cl-hide-scrollbar">
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
            style={{
              gridColumn: isDesktop ? "auto" : "span 3",
              padding: isDesktop ? 32 : 16,
              borderRadius: isDesktop ? 22 : 16,
              background: darkMode ? C.white : C.jet,
              border: darkMode ? `1px solid ${C.border}` : "none",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div style={{ fontSize: isDesktop ? 15 : T.caption, color: darkMode ? C.slate : C.onDarkMuted, ...fBody }}>
              This week's earnings
            </div>
            <div
              style={{
                fontSize: isDesktop ? 44 : 28,
                fontWeight: 800,
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
                fontWeight: 800,
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
                fontWeight: 800,
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
                fontWeight: 800,
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
              Next payout
            </div>
            <div
              style={{
                fontSize: isDesktop ? 44 : 24,
                fontWeight: 800,
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
        ) : (
          <>
        {/* Pending Requests */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: isDesktop ? 32 : 22,
            marginBottom: isDesktop ? 16 : 10,
          }}
        >
          <SectionLabel style={{ marginBottom: 0 }}>Pending requests</SectionLabel>

          <button
            onClick={() => nav("coach-bookings")}
            style={{
              minHeight: 44,
              padding: "0 4px",
              background: "none",
              border: "none",
              color: C.brand,
              fontSize: isDesktop ? 15 : T.label,
              fontWeight: 600,
              cursor: "pointer",
              ...fBody,
            }}
          >
            See all
          </button>
        </div>

        {pendingRequests.length === 0 ? (
          <div
            style={{
              fontSize: T.labelLg,
              color: C.slateLight,
              marginBottom: 6,
              ...fBody,
            }}
          >
            No active booking requests right now.
          </div>
        ) : (
          <CardSlider perView={isDesktop ? 3 : isTablet ? 2 : 1.15} gap={16}>
            {pendingRequests.map((b, i) => {
              const cn = clientNameFor(b);
              return (
                <Card
                  key={b.id}
                  style={{
                    height: "100%",
                    padding: isDesktop ? 24 : 16,
                    borderRadius: isDesktop ? 20 : 16,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    nav("coach-booking-detail", {
                      id: b.id,
                    })
                  }
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        marginBottom: 12,
                      }}
                    >
                      <Avatar name={cn.name} size={isDesktop ? 48 : 40} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: isDesktop ? 18 : T.bodyLg,
                            fontWeight: 600,
                            color: C.jet,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            ...fDisplay,
                          }}
                        >
                          {cn.name}
                        </div>
                        {cn.handle && <HandleTag handle={cn.handle} size={11} color={C.slateLight} />}
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: isDesktop ? 15 : T.body,
                        fontWeight: 600,
                        color: C.brand,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        ...fBody,
                      }}
                    >
                      {b.service}
                    </div>

                    <div style={{ fontSize: isDesktop ? 14 : T.captionLg, color: C.slate, marginTop: 4, ...fBody }}>
                      {b.date} · {b.time}
                    </div>

                    <div
                      style={{
                        fontSize: isDesktop ? 22 : T.subtitle,
                        fontWeight: 700,
                        color: C.jet,
                        marginTop: 8,
                        ...fDisplay,
                      }}
                    >
                      ${b.price}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      justifyContent: "flex-start",
                      marginTop: 16,
                      paddingTop: 14,
                      borderTop: `1px solid ${C.border}`,
                      alignItems: "center",
                    }}
                  >
                    <Btn
                      size={isDesktop ? "md" : "sm"}
                      variant="outline"
                      disabled={!!respondingId}
                      onClick={(e) => {
                        e.stopPropagation();
                        respondWithFeedback(
                          b.id,
                          BOOKING_STATUS.DECLINED,
                          "Booking declined"
                        );
                      }}
                    >
                      Decline
                    </Btn>

                    <Btn
                      size={isDesktop ? "md" : "sm"}
                      loading={respondingId === b.id}
                      loadingText="Accepting…"
                      disabled={!!respondingId && respondingId !== b.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        respondWithFeedback(
                          b.id,
                          BOOKING_STATUS.AWAITING_PAYMENT,
                          "Booking accepted"
                        );
                      }}
                    >
                      Accept
                    </Btn>
                  </div>
                </Card>
              );
            })}
          </CardSlider>
        )}

        {awaitingPayment.length > 0 && (
          <>
            <div style={{ marginTop: isDesktop ? 32 : 22, marginBottom: isDesktop ? 16 : 10 }}><SectionLabel style={{ marginBottom: 0 }}>Waiting for payment</SectionLabel></div>
            <CardSlider perView={isDesktop ? 3 : isTablet ? 2 : 1.15} gap={16}>
              {awaitingPayment.map((b) => {
                const cn = clientNameFor(b);
                return (
                  <Card
                    key={b.id}
                    onClick={() => nav("booking-awaiting-payment", { id: b.id })}
                    style={{
                      height: "100%",
                      padding: isDesktop ? 24 : 16,
                      borderRadius: isDesktop ? 20 : 16,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      cursor: "pointer",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 12 }}>
                        <Avatar name={cn.name} size={isDesktop ? 48 : 38} />
                        <StatusPill status={b.status} perspective="coach" />
                      </div>
                      <div style={{ fontSize: isDesktop ? 18 : T.body, fontWeight: 700, color: C.jet, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...fBody }}>{cn.name}</div>
                      <div style={{ fontSize: isDesktop ? 15 : T.captionLg, color: C.brand, fontWeight: 600, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...fBody }}>{b.service}</div>
                      <div style={{ fontSize: isDesktop ? 13.5 : T.caption, color: C.slate, marginTop: 2, ...fBody }}>{b.date}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 16, padding: isDesktop ? "10px 12px" : "8px 10px", borderRadius: 10, background: C.strongTint }}>
                      <Clock size={15} color={C.strong} style={{ flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: isDesktop ? 13 : T.label, color: C.slate, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...fBody }}>Reserved until {b.paymentDeadline || "tomorrow, 6:00pm"}</span>
                    </div>
                  </Card>
                );
              })}
            </CardSlider>
          </>
        )}

        {/* Upcoming Sessions */}
        <div
          style={{
            marginTop: isDesktop ? 32 : 22,
            marginBottom: isDesktop ? 16 : 10,
          }}
        >
          <SectionLabel style={{ marginBottom: 0 }}>Upcoming sessions</SectionLabel>
        </div>

        {upcoming.length === 0 ? (
          <div
            style={{
              fontSize: T.labelLg,
              color: C.slateLight,
              ...fBody,
            }}
          >
            Nothing scheduled yet.
          </div>
        ) : (
          <CardSlider perView={isDesktop ? 3 : isTablet ? 2 : 1.15} gap={16}>
            {upcoming.map((b, i) => {
              const cn = clientNameFor(b);
              return (
                <Card
                  key={b.id}
                  style={{
                    height: "100%",
                    padding: isDesktop ? 24 : 16,
                    borderRadius: isDesktop ? 20 : 16,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    cursor: "pointer",
                  }}
                  onClick={() => nav("coach-session-detail", { id: b.id })}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 12 }}>
                      <Avatar name={cn.name} size={isDesktop ? 48 : 38} />
                      <StatusPill status={b.status} perspective="coach" />
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: isDesktop ? 18 : T.body, fontWeight: 650, color: C.jet, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...fBody }}>{cn.name}</span>
                    </div>
                    {cn.handle && <HandleTag handle={cn.handle} size={11} color={C.slateLight} />}
                    <div style={{ fontSize: isDesktop ? 15 : T.captionLg, color: C.brand, fontWeight: 600, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...fBody }}>
                      {b.service || "Coaching Session"}
                    </div>
                  </div>
                  <div style={{ fontSize: isDesktop ? 13.5 : T.captionLg, color: C.slate, marginTop: 14, paddingTop: 10, borderTop: `1px solid ${C.border}`, ...fBody }}>
                    {b.date} · {b.time}
                  </div>
                </Card>
              );
            })}
          </CardSlider>
        )}
          </>
        )}

        {/* Recent Reviews */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: isDesktop ? 32 : 22,
            marginBottom: isDesktop ? 16 : 10,
          }}
        >
          <SectionLabel style={{ marginBottom: 0 }}>Recent reviews</SectionLabel>

          <button
            onClick={() => nav("coach-reviews")}
            style={{
              background: "none",
              border: "none",
              color: C.brand,
              fontSize: isDesktop ? 15 : T.label,
              fontWeight: 600,
              cursor: "pointer",
              ...fBody,
            }}
          >
            See all
          </button>
        </div>

        <CardSlider perView={isDesktop ? 3 : isTablet ? 2 : 1.15} gap={16}>
          {REVIEWS.map((r) => {
            const reply = getReply(r.id);
            const dispute = getDispute(r.id);
            return (
              <Card
                key={r.id}
                style={{
                  height: "100%",
                  padding: isDesktop ? 24 : 16,
                  borderRadius: isDesktop ? 20 : 16,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 6,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: isDesktop ? 16 : T.body, fontWeight: 600, color: C.jet, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...fBody }}>{r.name}</div>
                      {r.handle && <HandleTag handle={r.handle} size={10.5} color={C.slateLight} />}
                    </div>

                    <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: isDesktop ? 14 : T.labelLg, fontWeight: 700, color: C.jet, flexShrink: 0, ...fBody }}>
                      <Star size={13} fill={C.brand} color={C.brand} />
                      {r.rating.toFixed(1)}
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: isDesktop ? 14 : T.labelLg,
                      color: C.slate,
                      marginTop: 10,
                      lineHeight: 1.5,
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      ...fBody,
                    }}
                  >
                    {r.text}
                  </p>

                  {dispute && (
                    <div style={{ marginTop: 10 }}>
                      <Badge tone="orange" icon={Clock}>Dispute pending</Badge>
                    </div>
                  )}

                  {reply && (
                    <div style={{ marginTop: 10, background: C.fog, borderRadius: 10, padding: isDesktop ? "10px 12px" : "8px 10px" }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: C.brand, ...fBody }}>Your reply</div>
                      <p style={{ fontSize: 12.5, color: C.jet, marginTop: 3, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", ...fBody }}>{reply.text}</p>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.border}`, flexWrap: "wrap" }}>
                  <Btn size="sm" variant="secondary" icon={CornerUpLeft} onClick={() => openReply(r)}>
                    {reply ? "Edit reply" : "Reply"}
                  </Btn>
                  {!dispute && (
                    <Btn size="sm" variant="outline" icon={Flag} onClick={() => openDispute(r)}>
                      Report
                    </Btn>
                  )}
                </div>
              </Card>
            );
          })}
        </CardSlider>
      </div>

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
