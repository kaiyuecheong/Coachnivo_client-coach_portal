import React, { useState } from "react";
import { haptic } from "../../utils/haptics";
import {
  ArrowRight, BadgeDollarSign, CalendarDays, Info,
  LockKeyhole, MessageSquareText, Plus, ShieldCheck, Sparkles, Trash2,
} from "lucide-react";
import { CL, CD, fBody, fDisplay, T, LAYOUT } from "../../theme/theme";
import { useApp } from "../../context/AppContext";
import { ADDITIONAL_CHARGE_KIND, BOOKING_STATUS } from "../../data/bookings";
import {
  Badge, BottomSheet, Btn, Card, EmptyState, Field, Row, SectionLabel, StepProgress, TopBar,
} from "../../components/ui/Primitives";

function CostTypeBadge({ kind }) {
  const required = kind === ADDITIONAL_CHARGE_KIND.REQUIRED;
  return <Badge tone="orange">{required ? "Required" : "Optional"}</Badge>;
}

function CostEditor({ open, kind, onClose, onSave }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const required = kind === ADDITIONAL_CHARGE_KIND.REQUIRED;
  const valid = reason.trim().length >= 3 && Number(amount) > 0;

  const save = () => {
    if (!valid) return;
    onSave({
      id: `draft-cost-${Date.now()}`,
      kind,
      reason: reason.trim(),
      amount: Number(amount),
      note: note.trim() || (required
        ? "Required to deliver this session as booked."
        : "Available to add at checkout if you would like it."),
    });
    setReason("");
    setAmount("");
    setNote("");
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={required ? "Add required cost" : "Add optional add-on"}
      heightPct={66}
      footer={<Btn full disabled={!valid} icon={Plus} onClick={save}>Add to payment request</Btn>}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ padding: 12, borderRadius: 14, background: required ? C.warnTint : C.brandTint, display: "flex", gap: 10 }}>
          {required ? <LockKeyhole size={17} color={C.warnStrong} style={{ flexShrink: 0, marginTop: 1 }} /> : <Sparkles size={17} color={C.brand} style={{ flexShrink: 0, marginTop: 1 }} />}
          <div style={{ fontSize: T.captionLg, lineHeight: 1.5, color: C.slate, ...fBody }}>
            {required
              ? "The client must pay this amount with the package price to confirm their booking."
              : "The client can choose this add-on at checkout. It is never selected automatically."}
          </div>
        </div>
        <Field label={required ? "Cost name" : "Add-on name"} placeholder={required ? "e.g. Court hire" : "e.g. Video feedback"} value={reason} onChange={(event) => setReason(event.target.value)} required />
        <Field label="Amount" placeholder="0.00" value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" icon={BadgeDollarSign} required />
        <div>
          <label style={{ display: "block", fontSize: T.labelLg, fontWeight: 600, color: C.jet, marginBottom: 6, ...fBody }}>Client-facing explanation</label>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Explain what this covers and why it applies."
            style={{ width: "100%", minHeight: 92, resize: "none", boxSizing: "border-box", padding: 13, borderRadius: LAYOUT.inputRadius, border: `1.5px solid ${C.border}`, outline: "none", background: C.white, color: C.jet, fontSize: T.body, lineHeight: 1.5, ...fBody }}
          />
        </div>
      </div>
    </BottomSheet>
  );
}

export function ScreenCoachAcceptBooking({ nav, params, coachBookings = [], acceptBookingWithCharges, toast }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const booking = coachBookings.find((item) => item.id === params?.id);
  const [step, setStep] = useState(1);
  const [costs, setCosts] = useState([]);
  const [editorKind, setEditorKind] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!booking || booking.status !== BOOKING_STATUS.PENDING) {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.white }}>
        <TopBar title="Accept booking" onBack={() => nav("coach-bookings")} />
        <EmptyState icon={CalendarDays} title="Request unavailable" body="This request may already have been accepted, declined, or withdrawn." />
      </div>
    );
  }

  const requiredCosts = costs.filter((cost) => cost.kind === ADDITIONAL_CHARGE_KIND.REQUIRED);
  const optionalCosts = costs.filter((cost) => cost.kind === ADDITIONAL_CHARGE_KIND.OPTIONAL);
  const requiredTotal = requiredCosts.reduce((sum, cost) => sum + cost.amount, 0);
  const optionalTotal = optionalCosts.reduce((sum, cost) => sum + cost.amount, 0);
  const dueNow = Number(booking.price || 0) + requiredTotal;

  const addCost = (cost) => {
    setCosts((items) => [...items, cost]);
    setEditorKind(null);
  };
  const removeCost = (id) => setCosts((items) => items.filter((item) => item.id !== id));
  const accept = () => {
    if (submitting) return;
    haptic(12);
    setSubmitting(true);
    window.setTimeout(() => {
      const accepted = acceptBookingWithCharges?.(booking.id, costs);
      setSubmitting(false);
      if (!accepted) {
        toast?.("This request is no longer available");
        nav("coach-bookings");
        return;
      }
      toast?.("Accepted - payment request sent");
      nav("booking-awaiting-payment", { id: booking.id });
    }, 650);
  };

  const costList = (items, { EmptyIcon, emptyTitle, emptyCopy }) => items.length ? items.map((cost, index) => (
    <div
      key={cost.id}
      style={{
        display: "flex", alignItems: "flex-start", gap: 11, padding: 12,
        marginBottom: index < items.length - 1 ? 8 : 0,
        borderRadius: 14, background: C.white,
      }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 11, background: cost.kind === ADDITIONAL_CHARGE_KIND.REQUIRED ? C.warnTint : C.brandTint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {cost.kind === ADDITIONAL_CHARGE_KIND.REQUIRED ? <LockKeyhole size={16} color={C.warnStrong} /> : <Sparkles size={16} color={C.brand} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
          <span style={{ fontSize: T.body, fontWeight: 700, color: C.jet, ...fBody }}>{cost.reason}</span>
          <CostTypeBadge kind={cost.kind} />
        </div>
        <div style={{ marginTop: 3, fontSize: T.captionLg, color: C.slate, lineHeight: 1.45, ...fBody }}>{cost.note}</div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: T.body, fontWeight: 750, color: C.jet, ...fDisplay }}>${cost.amount.toFixed(2)}</div>
        <button type="button" aria-label={`Remove ${cost.reason}`} onClick={() => removeCost(cost.id)} style={{ width: 36, height: 36, marginTop: 2, border: "none", background: "transparent", color: C.slateLight, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 10 }}><Trash2 size={15} /></button>
      </div>
    </div>
  )) : (
    <div style={{ display: "flex", alignItems: "center", gap: 11, padding: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: 12, background: C.white, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <EmptyIcon size={16} color={C.slateLight} />
      </div>
      <div>
        <div style={{ fontSize: T.body, fontWeight: 700, color: C.jet, ...fBody }}>{emptyTitle}</div>
        <div style={{ marginTop: 2, fontSize: T.captionLg, color: C.slate, lineHeight: 1.45, ...fBody }}>{emptyCopy}</div>
      </div>
    </div>
  );

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.white }}>
      <TopBar title="Accept booking" onBack={() => step === 2 ? setStep(1) : nav("coach-booking-detail", { id: booking.id })} />
      <div style={{ flex: 1, overflowY: "auto", padding: `${LAYOUT.pagePadTop}px ${LAYOUT.pagePadX}px 26px` }} className="cl-hide-scrollbar">
        <StepProgress step={step} total={2} label={step === 1 ? "Review the request" : "Build the payment"} />

        {step === 1 ? (
          <>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: T.heading, fontWeight: 760, color: C.jet, letterSpacing: "-.25px", ...fDisplay }}>Everything you need to decide</div>
              <div style={{ marginTop: 5, fontSize: T.body, color: C.slate, lineHeight: 1.55, ...fBody }}>Review the session and client notes before setting the final payment.</div>
            </div>
            <Card style={{ marginBottom: 14, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 13 }}>
                <div>
                  <div style={{ fontSize: T.titleLg, fontWeight: 750, color: C.jet, ...fDisplay }}>{booking.service}</div>
                  <div style={{ marginTop: 4, fontSize: T.captionLg, color: C.slate, ...fBody }}>Requested by {booking.clientName}</div>
                </div>
                <div style={{ fontSize: T.titleLg, fontWeight: 780, color: C.jet, ...fDisplay }}>${Number(booking.price).toFixed(2)}</div>
              </div>
              <Row label="Date" value={booking.date} />
              <Row label="Time" value={booking.time} />
              <Row label="Format" value={booking.mode} />
              <Row label="Participants" value={booking.participants || "Client"} last />
            </Card>
            <SectionLabel>Message from client</SectionLabel>
            <Card style={{ marginBottom: 14, background: booking.notes ? C.brandTint : C.fog, border: "none" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
                <MessageSquareText size={18} color={booking.notes ? C.brand : C.slateLight} style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: T.body, fontWeight: 700, color: C.jet, ...fBody }}>{booking.notes ? "Before the session" : "No message added"}</div>
                  <div style={{ marginTop: 4, fontSize: T.captionLg, color: C.slate, lineHeight: 1.55, whiteSpace: "pre-line", ...fBody }}>{booking.notes || "The client did not add a message for this booking."}</div>
                </div>
              </div>
            </Card>
            {booking.safetyNotes && (
              <>
                <SectionLabel>Health & safety information</SectionLabel>
                <Card style={{ marginBottom: 14, display: "flex", alignItems: "flex-start", gap: 11, background: C.warnTint }}>
                  <ShieldCheck size={18} color={C.warnStrong} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div style={{ fontSize: T.captionLg, color: C.jet, lineHeight: 1.55, whiteSpace: "pre-line", ...fBody }}>{booking.safetyNotes}</div>
                </Card>
              </>
            )}
            <Card style={{ display: "flex", gap: 10, background: C.fog }}>
              <Info size={17} color={C.brand} style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: T.captionLg, color: C.slate, lineHeight: 1.55, ...fBody }}>On the next step you can add transparent required costs and optional package add-ons before sending the payment request.</div>
            </Card>
          </>
        ) : (
          <>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: T.heading, fontWeight: 760, color: C.jet, letterSpacing: "-.25px", ...fDisplay }}>Set a clear, final price</div>
              <div style={{ marginTop: 5, fontSize: T.body, color: C.slate, lineHeight: 1.55, ...fBody }}>Required costs are included in checkout. Optional add-ons stay off until the client chooses them.</div>
            </div>

            <Card style={{ marginBottom: 15, padding: 16 }}>
              <div style={{ display: "flex", gap: 11, alignItems: "center" }}>
                <div style={{ width: 40, height: 40, borderRadius: 13, background: C.brandTint, display: "flex", alignItems: "center", justifyContent: "center" }}><ShieldCheck size={19} color={C.brand} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: T.body, fontWeight: 700, color: C.jet, ...fBody }}>Package price</div>
                  <div style={{ fontSize: T.captionLg, color: C.slate, marginTop: 2, ...fBody }}>{booking.service}</div>
                </div>
                <div style={{ fontSize: T.title, fontWeight: 780, color: C.jet, ...fDisplay }}>${Number(booking.price).toFixed(2)}</div>
              </div>
            </Card>

            <SectionLabel>Required costs</SectionLabel>
            <Card style={{ marginBottom: 8, padding: 8, border: "none", boxShadow: "none", background: C.fog }}>
              {costList(requiredCosts, {
                EmptyIcon: LockKeyhole,
                emptyTitle: "Package price only",
                emptyCopy: "Add a cost only when it is required to deliver this session.",
              })}
            </Card>
            <Btn full variant="secondary" icon={Plus} onClick={() => setEditorKind(ADDITIONAL_CHARGE_KIND.REQUIRED)}>Add required cost</Btn>

            <div style={{ marginTop: 20 }}><SectionLabel>Optional add-ons</SectionLabel></div>
            <Card style={{ marginBottom: 8, padding: 8, border: "none", boxShadow: "none", background: C.fog }}>
              {costList(optionalCosts, {
                EmptyIcon: Sparkles,
                emptyTitle: "No add-ons yet",
                emptyCopy: "Offer extras the client can choose during checkout.",
              })}
            </Card>
            <Btn full variant="secondary" icon={Sparkles} onClick={() => setEditorKind(ADDITIONAL_CHARGE_KIND.OPTIONAL)}>Add optional add-on</Btn>

            <Card style={{ marginTop: 20, padding: 16, background: darkMode ? C.white : C.brandTint, border: darkMode ? `1px solid ${C.border}` : "none" }}>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: T.captionLg, color: C.slate, ...fBody }}>Required at checkout</div>
                <div style={{ fontSize: T.headingLg, fontWeight: 800, color: C.jet, marginTop: 2, ...fDisplay }}>${dueNow.toFixed(2)}</div>
              </div>
              <Row label="Package" value={`$${Number(booking.price).toFixed(2)}`} />
              <Row label="Required costs" value={`$${requiredTotal.toFixed(2)}`} />
              <Row label="Optional choices available" value={optionalCosts.length ? `${optionalCosts.length} · up to $${optionalTotal.toFixed(2)}` : "None"} last />
            </Card>
          </>
        )}
      </div>

      <div style={{ padding: `12px ${LAYOUT.pagePadX}px max(${LAYOUT.ctaPadBottom}px, env(safe-area-inset-bottom))`, borderTop: `1px solid ${C.border}`, background: C.white }}>
        {step === 1 ? (
          <Btn full icon={ArrowRight} onClick={() => setStep(2)}>Continue to payment setup</Btn>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: T.captionLg, color: C.slate, ...fBody }}>Client must pay</span>
              <span style={{ fontSize: T.title, fontWeight: 800, color: C.jet, ...fDisplay }}>${dueNow.toFixed(2)}</span>
            </div>
            <Btn full loading={submitting} loadingText="Sending payment request…" icon={BadgeDollarSign} onClick={accept}>Accept & request payment</Btn>
          </>
        )}
      </div>

      <CostEditor open={!!editorKind} kind={editorKind} onClose={() => setEditorKind(null)} onSave={addCost} />
    </div>
  );
}
