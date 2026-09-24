import React, { useState, useEffect } from "react";
import {
  Banknote, Wallet, ChevronRight, CheckCircle2, Calendar, MessageCircle,
  ShieldAlert, Star, Percent, History as HistoryIcon,
} from "lucide-react";
import { CL, CD, fDisplay, fBody, T } from "../../theme/theme";
import { CONFIG, COACH_NOTIFICATIONS } from "../../data/mockData";
import { Card, Row, SectionLabel, EmptyState, TopBar, SegTabs, BottomSheet, Avatar, BookingCardSkeleton } from "../../components/ui/Primitives";
import { useApp } from "../../context/AppContext";
import { useLiveNotifications } from "../../systems/StateSystem";
import { getBookingClientName } from "../../utils/name";
import { withClientMeta } from "../../data/users";
import { useResponsive } from "../../theme/responsive";

const COACH_ACTIVITY_ICON = {
  message: MessageCircle,
  verification: ShieldAlert,
  booking: Calendar,
  review: Star,
  promo: Percent,
  payment: Banknote,
};

/* =========================================================================
   COACH HISTORY — the coach-side counterpart to the client History screen:
   Payments (completed session payouts) and Activity (bookings, messages,
   verification, reviews, promos — everything else that's happened).
   ========================================================================= */
export function ScreenCoachHistory({ nav, coachBookings = [], coachNotifications = [] }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const { isDesktop } = useResponsive();
  const [tab, setTab] = useState("payments");
  const [loading, setLoading] = useState(true);
  const [receiptTarget, setReceiptTarget] = useState(null);
  const [activity] = useLiveNotifications(coachNotifications, COACH_NOTIFICATIONS);
  const completed = coachBookings.filter((b) => b.status === "completed");

  useEffect(() => { const t = setTimeout(() => setLoading(false), 800); return () => clearTimeout(t); }, []);

  function PayoutReceiptSheet({ booking, onClose }) {
    const gross = booking?.price || 0;
    const commission = Math.round(gross * CONFIG.commissionRate * 100) / 100;
    const net = Math.round((gross - commission) * 100) / 100;
    return (
      <BottomSheet open={!!booking} onClose={onClose} title="Payout details" heightPct={68}>
        {booking && (
          <>
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: C.successTint, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                <CheckCircle2 size={24} color={C.success} />
              </div>
              <div style={{ fontSize: T.headingLg, fontWeight: 700, color: C.jet, ...fDisplay }}>+${net.toFixed(2)}</div>
              <div style={{ fontSize: T.label, color: C.slate, marginTop: 2, ...fBody }}>Paid out · {booking.date}</div>
            </div>

            <Card style={{ marginBottom: 14 }}>
              <Row label="Service" value={booking.service} />
              <Row label="Client" value={getBookingClientName(withClientMeta(booking)).name} />
              <Row label="Date" value={booking.date} />
              <Row label="Time" value={booking.time} last />
            </Card>

            <Card style={{ marginBottom: 18 }}>
              <Row label="Session fee" value={`$${gross.toFixed(2)}`} />
              <Row label="Platform commission" value={`-$${commission.toFixed(2)}`} />
              <Row label="Net payout" value={`$${net.toFixed(2)}`} bold last />
            </Card>
          </>
        )}
      </BottomSheet>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar title="History" onBack={() => nav("coach-profile-edit")} />
      <div style={{ padding: isDesktop ? "32px 64px 0" : "16px 18px 0", marginBottom: 12 }}>
        <SegTabs
          items={[{ value: "payments", label: "Payments" }, { value: "activity", label: "Activity" }]}
          value={tab}
          onChange={setTab}
        />
      </div>

      <div style={{ flex: 1, overflowY: "auto", width: "100%", padding: isDesktop ? "0 64px 48px" : "0 18px", paddingBottom: "max(28px, env(safe-area-inset-bottom))" }} className="cl-hide-scrollbar">
        {loading ? (
          <BookingCardSkeleton rows={4} />
        ) : tab === "payments" ? (
          <>
            {completed.length === 0 && (
              <EmptyState icon={Banknote} title="No payouts yet" body="Completed sessions and their payouts will show up here." />
            )}
            <div className="cl-stagger">
            {completed.map((b, i) => (
              <Card key={b.id} onClick={() => nav("funds-release-status", { bookingId: b.id, role: "coach", backTo: "coach-history" })} style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center", animationDelay: `${Math.min(i, 8) * 45}ms` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar name={getBookingClientName(withClientMeta(b)).name} size={40} />
                  <div>
                    <div style={{ fontSize: T.bodyLg, fontWeight: 600, color: C.jet, ...fBody }}>{b.service}</div>
                    <div style={{ fontSize: T.captionLg, color: C.slate, marginTop: 2, ...fBody }}>{b.date} · {getBookingClientName(withClientMeta(b)).name}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontSize: T.subtitle, fontWeight: 700, color: C.brand, ...fDisplay }}>+${Math.round(Number(b.paidTotal || b.price || 0) * (1 - CONFIG.commissionRate))}</div>
                  <ChevronRight size={16} color={C.slateLight} />
                </div>
              </Card>
            ))}
            </div>
          </>
        ) : tab === "activity" ? (
          <>
            {activity.length === 0 && (
              <EmptyState icon={HistoryIcon} title="No activity yet" body="Booking updates, messages, verification and other activity will show up here." />
            )}
            <div className="cl-stagger">
            {activity.map((n, i) => {
              const Icon = COACH_ACTIVITY_ICON[n.type] || HistoryIcon;
              return (
                <Card key={n.id} style={{ marginBottom: 10, display: "flex", gap: 12, alignItems: "flex-start", animationDelay: `${Math.min(i, 8) * 45}ms` }}>
                  <div style={{ width: 36, height: 36, borderRadius: 11, background: C.brandTint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={16} color={C.brandIcon || C.brandColor} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontSize: T.body, fontWeight: 600, color: C.jet, ...fBody }}>{n.title}</span>
                      <span style={{ fontSize: T.tiny, color: C.slateLight, flexShrink: 0, ...fBody }}>{n.time}</span>
                    </div>
                    <div style={{ fontSize: T.labelLg, color: C.slate, marginTop: 3, lineHeight: 1.45, ...fBody }}>{n.body}</div>
                  </div>
                </Card>
              );
            })}
            </div>
          </>
        ) : null}
      </div>

      <PayoutReceiptSheet booking={receiptTarget} onClose={() => setReceiptTarget(null)} />
    </div>
  );
}
