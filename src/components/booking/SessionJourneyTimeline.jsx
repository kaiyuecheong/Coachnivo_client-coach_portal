import React from "react";
import { Check, Clock3, KeyRound, LockKeyhole, Send, ShieldCheck, WalletCards } from "lucide-react";
import { CL, CD, T, fBody, fDisplay } from "../../theme/theme";
import { useApp } from "../../context/AppContext";
import { BOOKING_STATUS, PAYMENT_STATUS, PAYOUT_STATUS } from "../../data/bookings";
import { Badge, Card } from "../ui/Primitives";

const TERMINAL_STATUSES = [BOOKING_STATUS.CANCELLED, BOOKING_STATUS.DECLINED, BOOKING_STATUS.EXPIRED];

export function SessionJourneyTimeline({ booking, role = "client", compact = false }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  if (!booking) return null;

  const status = booking.status;
  const terminal = TERMINAL_STATUSES.includes(status);
  const accepted = ![BOOKING_STATUS.PENDING, BOOKING_STATUS.DECLINED].includes(status);
  const paid = [PAYMENT_STATUS.HELD, PAYMENT_STATUS.RELEASED].includes(booking.paymentStatus);
  const confirmed = [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.COMPLETION_PENDING, BOOKING_STATUS.COMPLETED].includes(status);
  const sessionStarted = [BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.COMPLETION_PENDING, BOOKING_STATUS.COMPLETED].includes(status);
  const completionConfirmed = status === BOOKING_STATUS.COMPLETED;
  const released = booking.payoutStatus === PAYOUT_STATUS.RELEASED || booking.paymentStatus === PAYMENT_STATUS.RELEASED;
  const refunding = booking.paymentStatus === PAYMENT_STATUS.REFUND_PROCESSING;
  const refunded = booking.paymentStatus === PAYMENT_STATUS.REFUNDED;
  const providerView = ["coach", "business", "businessCoach"].includes(role);
  const activeKey = terminal
    ? "stopped"
    : !accepted
      ? "request"
      : !paid
        ? "payment"
        : !confirmed
          ? "confirmed"
          : !sessionStarted
            ? "session"
            : !completionConfirmed
              ? "completion"
              : !released
                ? "release"
                : null;

  const steps = [
    { key: "request", label: "Request sent", detail: providerView ? "Received from the client" : booking.providerType === "business" ? "Sent to the organisation" : "Sent to the coach", complete: true, icon: Send },
    { key: "accepted", label: booking.providerType === "business" ? "Request accepted" : "Coach accepted", detail: accepted ? "Slot reserved for payment" : "Waiting for a response", complete: accepted, icon: Check },
    { key: "payment", label: refunded ? "Payment refunded" : refunding ? "Refund processing" : paid ? "Payment secured" : booking.paymentStatus === PAYMENT_STATUS.DUE ? "Payment due" : "Payment", detail: refunded ? "Returned to the original payment method" : refunding ? "Returning to the original payment method" : paid ? "Funds held securely" : booking.paymentStatus === PAYMENT_STATUS.DUE ? "Payment is due" : "Not collected", complete: paid || refunded, icon: LockKeyhole },
    { key: "confirmed", label: confirmed ? "Session confirmed" : "Session confirmation", detail: confirmed ? `${booking.date} · ${booking.time}` : "Confirms after payment", complete: confirmed, icon: ShieldCheck },
    { key: "session", label: sessionStarted ? "Session started" : "Session start", detail: sessionStarted ? "OTP verified by coach and client" : "Client generates a code, coach enters it", complete: sessionStarted, icon: KeyRound },
    { key: "completion", label: completionConfirmed ? "Completion confirmed" : "Session completion", detail: completionConfirmed ? "Coach-driven completion agreed" : "Coach ends and settles any final charges", complete: completionConfirmed, icon: Check },
    { key: "release", label: refunded ? "Refund complete" : refunding ? "Refund in progress" : released ? "Funds released" : "Funds release", detail: refunded ? "Customer refund completed" : refunding ? "Payment release stopped" : released ? (role === "business" ? "Settled to the business" : role === "businessCoach" ? "Business compensation tracked separately" : role === "coach" ? "Payout is on the way" : booking.providerType === "business" ? "Paid to the organisation" : "Paid to the coach") : "Releases after completion", complete: released || refunded, icon: WalletCards },
  ];

  const visibleSteps = compact ? steps.filter((_, index) => index === 0 || index === 2 || index >= 4) : steps;
  return (
    <Card style={{ padding: compact ? 14 : 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: compact ? 10 : 14 }}>
        <div style={{ fontSize: T.title, fontWeight: 700, color: C.jet, ...fDisplay }}>Session journey</div>
        {terminal && <Badge tone="neutral">Journey closed</Badge>}
      </div>
      <div>
        {visibleSteps.map((step, index) => {
          const active = activeKey === step.key || (activeKey === "request" && step.key === "accepted");
          const StepIcon = step.icon;
          const last = index === visibleSteps.length - 1;
          return (
            <div key={step.key} style={{ display: "grid", gridTemplateColumns: "30px minmax(0, 1fr)", gap: 11, minHeight: compact ? 47 : 52 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                  background: step.complete || active ? C.brandTint : C.fog,
                }}>
                  {active && !step.complete
                    ? <Clock3 size={13} color={C.brand} />
                    : <StepIcon size={13} color={step.complete ? C.brand : C.slateLight} strokeWidth={2.3} />}
                </div>
                {!last && <div style={{ flex: 1, width: 1.5, minHeight: compact ? 17 : 22, background: step.complete ? C.brand : C.border }} />}
              </div>
              <div style={{ paddingTop: 2, paddingBottom: last ? 0 : 10, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ fontSize: T.body, fontWeight: active || step.complete ? 650 : 500, color: step.complete || active ? C.jet : C.slateLight, ...fBody }}>{step.label}</span>
                  {active && !step.complete && <span style={{ width: 5, height: 5, borderRadius: 99, background: C.brand, animation: "clPulse 1.4s infinite" }} />}
                </div>
                {!compact && <div style={{ fontSize: T.captionLg, color: C.slate, marginTop: 3, ...fBody }}>{step.detail}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function PaymentDeadlineCard({ booking, role = "coach", children }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  if (!booking) return null;
  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "14px 15px", background: C.strongTint, display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ width: 34, height: 34, borderRadius: 11, background: C.white, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Clock3 size={17} color={C.strong} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: T.bodyLg, fontWeight: 700, color: C.jet, ...fDisplay }}>
            {role === "coach" ? "Waiting for client payment" : "Payment secures your session"}
          </div>
          <div style={{ fontSize: T.captionLg, color: C.slate, lineHeight: 1.5, marginTop: 3, ...fBody }}>
            Complete by <strong style={{ color: C.strong }}>{booking.paymentDeadline || "tomorrow, 6:00pm"}</strong>. The reserved slot releases automatically after the deadline.
          </div>
          {booking.paymentReminderSent && <Badge tone="orange" style={{ marginTop: 8 }}>Reminder sent</Badge>}
        </div>
      </div>
      {children && <div style={{ padding: 14, borderTop: `1px solid ${C.border}` }}>{children}</div>}
    </Card>
  );
}
