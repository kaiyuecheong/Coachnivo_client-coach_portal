import React, { useState, useEffect } from "react";
import { Banknote, Percent, Wallet, ChevronRight, User, Landmark, Hash, FileText } from "lucide-react";
import { CL, CD, fDisplay, fBody, T } from "../../theme/theme";
import { useApp } from "../../context/AppContext";
import { CONFIG } from "../../data/mockData";
import {
  Card, Badge, SectionLabel, Row, TopBar, StatSkeleton,
  BookingCardSkeleton, Skeleton, BottomSheet, Btn, FormSection, RequiredMark,
} from "../../components/ui/Primitives";
import { getBookingClientName } from "../../utils/name";
import { withClientMeta } from "../../data/users";
import { BOOKING_STATUS, PAYOUT_STATUS } from "../../data/bookings";
import { useResponsive } from "../../theme/responsive";

const STAT_LIMIT = 8;

export function ScreenCoachEarnings({ nav, goBack, coachBookings, toast }) {
  const { darkMode, toast: appToast, coachPayoutMethod, setCoachPayoutMethod } = useApp();
  const showToast = toast || appToast;
  const C = darkMode ? CD : CL;
  const { isDesktop } = useResponsive();
  const [loading, setLoading] = useState(true);
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [draftPayout, setDraftPayout] = useState({
    accountHolder: coachPayoutMethod?.accountHolder || "Noah Kelly",
    bankName: coachPayoutMethod?.bankName || "Commonwealth Bank",
    accountNumber: coachPayoutMethod?.accountNumber || "10202210",
    routingNumber: coachPayoutMethod?.routingNumber || "062000",
    taxInfo: coachPayoutMethod?.taxInfo || "",
  });

  const handleOpenPayoutModal = () => {
    setDraftPayout({
      accountHolder: coachPayoutMethod?.accountHolder || "Noah Kelly",
      bankName: coachPayoutMethod?.bankName || "Commonwealth Bank",
      accountNumber: coachPayoutMethod?.accountNumber || "10202210",
      routingNumber: coachPayoutMethod?.routingNumber || "062000",
      taxInfo: coachPayoutMethod?.taxInfo || "",
    });
    setPayoutModalOpen(true);
  };

  const canSavePayout = draftPayout.accountHolder.trim().length > 0
    && draftPayout.bankName.trim().length > 0
    && draftPayout.accountNumber.trim().length > 0
    && draftPayout.routingNumber.trim().length > 0;

  const handleSavePayout = () => {
    if (!canSavePayout) return;
    setCoachPayoutMethod?.(draftPayout);
    showToast?.("Payout method updated");
    setPayoutModalOpen(false);
  };

  const labelStyle = { fontSize: isDesktop ? 14 : T.labelLg, fontWeight: 700, color: C.jet, marginBottom: 6, ...fBody };
  const fieldWrapStyle = {
    display: "flex", alignItems: "center", gap: 8, border: `1.5px solid ${C.border}`,
    borderRadius: 13, padding: isDesktop ? "10px 12px" : "11px 13px", boxSizing: "border-box", background: C.white,
  };
  const fieldInputStyle = { border: "none", outline: "none", flex: 1, fontSize: isDesktop ? 15 : T.bodyLg, minWidth: 0, color: C.jet, background: "transparent", ...fBody };

  const completed = coachBookings.filter((b) => b.status === BOOKING_STATUS.COMPLETED);

  useEffect(() => { const t = setTimeout(() => setLoading(false), 800); return () => clearTimeout(t); }, []);
  const released = completed.filter((b) => b.payoutStatus === PAYOUT_STATUS.RELEASED);
  const processing = coachBookings.filter((b) => b.payoutStatus === PAYOUT_STATUS.PROCESSING);
  const netOf = (b) => Math.round(Number(b.paidTotal || b.price || 0) * (1 - CONFIG.commissionRate));
  const gross = released.reduce((s, b) => s + Number(b.paidTotal || b.price || 0), 0);
  const commission = Math.round(gross * CONFIG.commissionRate);
  const net = gross - commission;
  const avgNet = released.length ? Math.round(released.reduce((s, b) => s + netOf(b), 0) / released.length) : 0;
  const pendingTotal = processing.reduce((s, b) => s + netOf(b), 0);
  const chartData = completed.slice(-STAT_LIMIT);
  const maxNet = Math.max(...chartData.map(netOf), 1);

  const stat = (value, label) => (
    <div key={label} style={{ flex: 1, minWidth: 0, background: C.fog, borderRadius: 14, padding: "10px 12px" }}>
      <div style={{ fontSize: T.titleLg, fontWeight: 700, color: C.jet, lineHeight: 1.1, ...fDisplay }}>{value}</div>
      <div style={{ fontSize: T.caption, color: C.slateLight, marginTop: 3, ...fBody }}>{label}</div>
    </div>
  );

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.white }}>
      <TopBar title="Earnings & payouts" onBack={() => goBack("coach-profile-edit")} />

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", width: "100%", padding: isDesktop ? "24px 64px 48px" : "16px 18px max(28px, env(safe-area-inset-bottom))" }} className="cl-hide-scrollbar">

        {loading ? (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isDesktop ? "repeat(4, minmax(0, 1fr))" : "repeat(2, 1fr)",
                gap: isDesktop ? 16 : 10,
                marginTop: isDesktop ? 8 : 12,
                marginBottom: isDesktop ? 24 : 16,
              }}
            >
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} w="100%" h={isDesktop ? 160 : 100} radius={isDesktop ? 22 : 16} />
              ))}
            </div>
            <Skeleton w="100%" h={isDesktop ? 180 : 130} radius={isDesktop ? 22 : 16} style={{ marginBottom: isDesktop ? 24 : 16 }} />
            <Skeleton w="100%" h={isDesktop ? 220 : 170} radius={isDesktop ? 22 : 16} style={{ marginBottom: isDesktop ? 24 : 16 }} />
            <div style={{ marginTop: 16 }}>
              <BookingCardSkeleton rows={3} />
            </div>
          </>
        ) : (
          <>
            {/* 4 Stats Highlights in a single row on desktop, 2x2 on mobile (similar to coach-dashboard) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isDesktop ? "repeat(4, minmax(0, 1fr))" : "repeat(2, 1fr)",
                gap: isDesktop ? 16 : 10,
                marginTop: isDesktop ? 8 : 12,
                marginBottom: isDesktop ? 24 : 16,
              }}
            >
              {/* Card 1: Released earnings */}
              <Card
                style={{
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
                  Released earnings
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
                  ${net}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  <Badge tone={darkMode ? "default" : "dark"} icon={Banknote}>Next payout Fri</Badge>
                </div>
              </Card>

              {/* Card 2: Pending payouts */}
              <Card
                style={{
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
                  Pending payouts
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
                  ${pendingTotal || 0}
                </div>
                <div style={{ fontSize: isDesktop ? 13.5 : T.tiny, color: darkMode ? C.slateLight : C.slate, marginTop: 6, ...fBody }}>
                  {processing.length > 0 ? `${processing.length} processing` : "no pending funds"}
                </div>
              </Card>

              {/* Card 3: Paid-out sessions */}
              <Card
                style={{
                  padding: isDesktop ? 32 : 16,
                  borderRadius: isDesktop ? 22 : 16,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ fontSize: isDesktop ? 15 : 12, lineHeight: 1.2, color: C.slate, fontWeight: 600, ...fBody }}>
                  Paid-out sessions
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
                  {released.length}
                </div>
                <div style={{ fontSize: isDesktop ? 13.5 : 11, color: C.slateLight, marginTop: 6, ...fBody }}>
                  completed
                </div>
              </Card>

              {/* Card 4: Avg per session */}
              <Card
                style={{
                  padding: isDesktop ? 32 : 16,
                  borderRadius: isDesktop ? 22 : 16,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ fontSize: isDesktop ? 15 : 12, lineHeight: 1.2, color: C.slate, fontWeight: 600, ...fBody }}>
                  Avg per session
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
                  {avgNet ? `$${avgNet}` : "-"}
                </div>
                <div style={{ fontSize: isDesktop ? 13.5 : 11, color: C.slateLight, marginTop: 6, ...fBody }}>
                  net average
                </div>
              </Card>
            </div>

            {/* Earnings Breakdown Container with 32px padding */}
            <Card
              style={{
                padding: isDesktop ? 32 : 16,
                borderRadius: isDesktop ? 22 : 16,
                marginBottom: isDesktop ? 24 : 16,
              }}
            >
              <div style={{ fontSize: isDesktop ? 20 : 17, fontWeight: 700, color: C.jet, letterSpacing: "-0.01em", marginBottom: isDesktop ? 16 : 12, ...fDisplay }}>
                Earnings breakdown
              </div>
              <Row label="Gross earnings" value={`$${gross}`} />
              <Row label="Platform commission" value={`-$${commission} (${Math.round(CONFIG.commissionRate * 100)}%)`} />
              <Row label="Net payout" value={`$${net}`} bold last />
            </Card>

            {/* Payout Flow Chart Container with 32px padding */}
            {chartData.length > 0 && (
              <Card
                style={{
                  padding: isDesktop ? 32 : 16,
                  borderRadius: isDesktop ? 22 : 16,
                  marginBottom: isDesktop ? 24 : 16,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: isDesktop ? 16 : 12 }}>
                  <span style={{ fontSize: isDesktop ? 20 : 17, fontWeight: 700, color: C.jet, letterSpacing: "-0.01em", ...fDisplay }}>Payout flow</span>
                  <span style={{ fontSize: isDesktop ? 13.5 : T.caption, color: C.slateLight, ...fBody }}>net per completed session</span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: isDesktop ? 96 : 78 }}>
                  {chartData.map((b) => {
                    const value = netOf(b);
                    const isReleased = b.payoutStatus === PAYOUT_STATUS.RELEASED;
                    return (
                      <div key={b.id} title={`${b.service}: $${value}`} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                        <div style={{
                          width: "100%", maxWidth: isDesktop ? 36 : 26, borderRadius: "6px 6px 2px 2px",
                          height: Math.max(8, Math.round((value / maxNet) * (isDesktop ? 80 : 62))),
                          background: isReleased ? C.brand : C.brandTint,
                          transition: "height .2s ease",
                        }} />
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  {chartData.map((b) => (
                    <div key={b.id} style={{ flex: 1, minWidth: 0, textAlign: "center", fontSize: isDesktop ? 12 : T.micro, color: C.slateLight, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", ...fBody }}>
                      {(b.date || "").split(" ").slice(-2).join(" ")}
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 14 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: isDesktop ? 13 : T.caption, color: C.slate, ...fBody }}>
                    <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 3, background: C.brand }} /> Released
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: isDesktop ? 13 : T.caption, color: C.slate, ...fBody }}>
                    <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 3, background: C.brandTint }} /> In progress
                  </span>
                </div>
              </Card>
            )}

            {/* Processing Payouts */}
            {processing.length > 0 && (
              <>
                <SectionLabel>Processing payouts</SectionLabel>
                <div className="cl-stagger" style={{ marginBottom: isDesktop ? 24 : 16 }}>
                  {processing.map((b, i) => (
                    <Card
                      key={b.id}
                      onClick={() => nav("funds-release-status", { bookingId: b.id, role: "coach", backTo: "coach-earnings" })}
                      style={{
                        padding: isDesktop ? 24 : 14,
                        borderRadius: isDesktop ? 18 : 14,
                        marginBottom: 10,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        animationDelay: `${Math.min(i, 8) * 45}ms`,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: isDesktop ? 16 : T.body, fontWeight: 600, color: C.jet, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", ...fBody }}>{b.service}</div>
                        <div style={{ fontSize: isDesktop ? 13.5 : T.captionLg, color: C.slate, marginTop: 2, ...fBody }}>{b.date} · {getBookingClientName(withClientMeta(b)).name}</div>
                      </div>
                      <Badge tone="orange">+${netOf(b)}</Badge>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {/* Payout Method Container with 32px padding */}
            <SectionLabel>Payout method</SectionLabel>
            <Card
              ariaLabel="Edit payout method"
              onClick={handleOpenPayoutModal}
              style={{
                padding: isDesktop ? 32 : 16,
                borderRadius: isDesktop ? 22 : 16,
                marginBottom: isDesktop ? 24 : 20,
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: C.brandTint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Wallet size={20} color={C.brand} />
              </div>
              <div>
                <div style={{ fontSize: isDesktop ? 16 : T.body, color: C.jet, fontWeight: 700, ...fBody }}>
                  {coachPayoutMethod?.bankName || "Bank account"} ···· {coachPayoutMethod?.accountNumber ? coachPayoutMethod.accountNumber.slice(-4) : "2210"}
                </div>
                <div style={{ fontSize: isDesktop ? 13 : T.caption, color: C.slate, marginTop: 2, ...fBody }}>
                  Direct deposit · Active
                </div>
              </div>
              <ChevronRight size={18} color={C.slateLight} style={{ marginLeft: "auto" }} />
            </Card>

            {/* Recent Transactions */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <SectionLabel>Recent transactions</SectionLabel>
              {completed.length > STAT_LIMIT && (
                <button type="button" onClick={() => nav("coach-history")} style={{ minHeight: 44, padding: "0 4px", background: "transparent", border: "none", color: C.brand, fontWeight: 700, fontSize: isDesktop ? 14 : T.label, cursor: "pointer", ...fBody }}>
                  View all
                </button>
              )}
            </div>
            {completed.length === 0 && (
              <div style={{ fontSize: T.labelLg, color: C.slate, padding: "6px 2px 2px", ...fBody }}>No completed sessions yet.</div>
            )}
            <div className="cl-stagger">
              {completed.slice(0, STAT_LIMIT).map((b, i) => (
                <Card
                  key={b.id}
                  onClick={() => nav("funds-release-status", { bookingId: b.id, role: "coach", backTo: "coach-earnings" })}
                  style={{
                    padding: isDesktop ? 24 : 14,
                    borderRadius: isDesktop ? 18 : 14,
                    marginBottom: 10,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    animationDelay: `${Math.min(i, 8) * 45}ms`,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: isDesktop ? 16 : T.body, fontWeight: 700, color: C.jet, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", ...fBody }}>{b.service}</div>
                    <div style={{ fontSize: isDesktop ? 13.5 : T.captionLg, color: C.slate, marginTop: 2, ...fBody }}>{b.date} · {getBookingClientName(withClientMeta(b)).name}</div>
                    <div style={{ marginTop: 6 }}><Badge tone="orange">{b.payoutStatus === PAYOUT_STATUS.RELEASED ? "Payout released" : "Processing"}</Badge></div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    <span style={{ fontSize: isDesktop ? 18 : T.bodyLg, fontWeight: 700, color: C.brand, ...fDisplay }}>+${netOf(b)}</span>
                    <ChevronRight size={16} color={C.slateLight} />
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Edit Payout Method Popup Modal */}
      <BottomSheet
        open={payoutModalOpen}
        onClose={() => setPayoutModalOpen(false)}
        title="Edit payout method"
        maxWidth={540}
        footer={
          <div style={{ display: "flex", gap: 10, width: "100%" }}>
            <Btn
              variant="outline"
              onClick={() => setPayoutModalOpen(false)}
              style={{ flex: 1 }}
            >
              Cancel
            </Btn>
            <Btn
              disabled={!canSavePayout}
              onClick={handleSavePayout}
              style={{ flex: 1.5 }}
            >
              Save changes
            </Btn>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 4 }}>
          <div style={{ fontSize: isDesktop ? 14 : T.body, color: C.slate, lineHeight: 1.5, ...fBody }}>
            Keep your payout details current so future earnings reach the right account.
          </div>

          <FormSection icon={Landmark} label="Bank details" hint="Where we'll send your earnings.">
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={labelStyle}>Account holder name<RequiredMark /></div>
                <div className="cl-input" style={fieldWrapStyle}>
                  <User size={16} color={C.slateLight} />
                  <input
                    value={draftPayout.accountHolder}
                    onChange={(e) => setDraftPayout((prev) => ({ ...prev, accountHolder: e.target.value }))}
                    placeholder="e.g. Noah Kelly"
                    style={fieldInputStyle}
                  />
                </div>
              </div>

              <div>
                <div style={labelStyle}>Bank name<RequiredMark /></div>
                <div className="cl-input" style={fieldWrapStyle}>
                  <Landmark size={16} color={C.slateLight} />
                  <input
                    value={draftPayout.bankName}
                    onChange={(e) => setDraftPayout((prev) => ({ ...prev, bankName: e.target.value }))}
                    placeholder="e.g. Commonwealth Bank"
                    style={fieldInputStyle}
                  />
                </div>
              </div>

              <div>
                <div style={labelStyle}>Account number<RequiredMark /></div>
                <div className="cl-input" style={fieldWrapStyle}>
                  <Hash size={16} color={C.slateLight} />
                  <input
                    value={draftPayout.accountNumber}
                    onChange={(e) => setDraftPayout((prev) => ({ ...prev, accountNumber: e.target.value.replace(/[^0-9]/g, "") }))}
                    placeholder="e.g. 10202210"
                    inputMode="numeric"
                    style={fieldInputStyle}
                  />
                </div>
              </div>

              <div>
                <div style={labelStyle}>BSB / Routing number<RequiredMark /></div>
                <div className="cl-input" style={fieldWrapStyle}>
                  <Hash size={16} color={C.slateLight} />
                  <input
                    value={draftPayout.routingNumber}
                    onChange={(e) => setDraftPayout((prev) => ({ ...prev, routingNumber: e.target.value.replace(/[^0-9]/g, "") }))}
                    placeholder="e.g. 062-000"
                    inputMode="numeric"
                    style={fieldInputStyle}
                  />
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection icon={FileText} label="Tax information (optional)" hint="Only required in some regions — leave blank if not applicable.">
            <div>
              <div style={labelStyle}>Tax identification (if required)</div>
              <div className="cl-input" style={fieldWrapStyle}>
                <FileText size={16} color={C.slateLight} />
                <input
                  value={draftPayout.taxInfo}
                  onChange={(e) => setDraftPayout((prev) => ({ ...prev, taxInfo: e.target.value }))}
                  placeholder="e.g. ABN or Tax File Number"
                  style={fieldInputStyle}
                />
              </div>
            </div>
          </FormSection>
        </div>
      </BottomSheet>
    </div>
  );
}
