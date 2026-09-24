import React, { useState, useEffect } from "react";
import { Banknote, Percent, Wallet, ChevronRight } from "lucide-react";
import { CL, CD, fDisplay, fBody, T } from "../../theme/theme";
import { useApp } from "../../context/AppContext";
import { CONFIG } from "../../data/mockData";
import { Card, Badge, SectionLabel, Row, TopBar, StatSkeleton, BookingCardSkeleton, Skeleton } from "../../components/ui/Primitives";
import { getBookingClientName } from "../../utils/name";
import { withClientMeta } from "../../data/users";
import { BOOKING_STATUS, PAYOUT_STATUS } from "../../data/bookings";
import { useResponsive } from "../../theme/responsive";

const STAT_LIMIT = 8;

export function ScreenCoachEarnings({ nav, goBack, coachBookings }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const { isDesktop } = useResponsive();
  const [loading, setLoading] = useState(true);
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
      <div style={{ fontSize: T.titleLg, fontWeight: 800, color: C.jet, lineHeight: 1.1, ...fDisplay }}>{value}</div>
      <div style={{ fontSize: T.caption, color: C.slateLight, marginTop: 3, ...fBody }}>{label}</div>
    </div>
  );

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.white }}>
      <TopBar title="Earnings & payouts" onBack={() => goBack("coach-profile-edit")} />

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", width: "100%", padding: isDesktop ? "32px 64px 48px" : "16px 18px max(28px, env(safe-area-inset-bottom))" }} className="cl-hide-scrollbar">

        {loading ? (
          <>
            <Skeleton w="100%" h={120} radius={20} style={{ marginBottom: 16 }} />
            <StatSkeleton count={3} />
            <div style={{ marginTop: 16 }}>
              <BookingCardSkeleton rows={3} />
            </div>
          </>
        ) : (
          <>
        <div style={{
          background: darkMode ? C.white : C.jet,
          border: darkMode ? `1px solid ${C.border}` : "none",
          borderRadius: 20,
          padding: 20,
          marginBottom: 16,
        }}>
          <div style={{ fontSize: T.captionLg, color: darkMode ? C.slate : C.onDarkMuted, ...fBody }}>Released earnings</div>
          <div style={{ fontSize: T.heroLg, fontWeight: 800, color: darkMode ? C.jet : C.white, marginTop: 4, ...fDisplay }}>${net}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <Badge tone={darkMode ? "default" : "dark"} icon={Banknote}>Next payout Fri</Badge>
            <Badge tone={darkMode ? "default" : "dark"} icon={Percent}>{Math.round(CONFIG.commissionRate * 100)}% commission</Badge>
          </div>
          {processing.length > 0 && <div style={{ fontSize: T.captionLg, color: darkMode ? C.slateLight : C.onDark, marginTop: 12, ...fBody }}>{processing.length} payout{processing.length === 1 ? "" : "s"} currently processing</div>}
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {stat(released.length, "Paid-out sessions")}
          {stat(avgNet ? `$${avgNet}` : "-", "Avg per session")}
          {stat(pendingTotal ? `$${pendingTotal}` : "$0", "Pending payouts")}
        </div>

        <Card style={{ marginBottom: 16 }}>
          <Row label="Gross earnings" value={`$${gross}`} />
          <Row label="Platform commission" value={`-$${commission}`} />
          <Row label="Net payout" value={`$${net}`} bold last />
        </Card>

        {chartData.length > 0 && (
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
              <span style={{ fontSize: T.subtitle, fontWeight: 700, color: C.jet, ...fDisplay }}>Payout flow</span>
              <span style={{ fontSize: T.caption, color: C.slateLight, ...fBody }}>net per completed session</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 7, height: 78 }}>
              {chartData.map((b) => {
                const value = netOf(b);
                const isReleased = b.payoutStatus === PAYOUT_STATUS.RELEASED;
                return (
                  <div key={b.id} title={`${b.service}: $${value}`} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                    <div style={{
                      width: "100%", maxWidth: 26, borderRadius: "6px 6px 2px 2px",
                      height: Math.max(8, Math.round((value / maxNet) * 62)),
                      background: isReleased ? C.brand : C.brandTint,
                    }} />
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 7, marginTop: 6 }}>
              {chartData.map((b) => (
                <div key={b.id} style={{ flex: 1, minWidth: 0, textAlign: "center", fontSize: T.micro, color: C.slateLight, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", ...fBody }}>
                  {(b.date || "").split(" ").slice(-2).join(" ")}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 14, marginTop: 10 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: T.caption, color: C.slate, ...fBody }}>
                <span aria-hidden="true" style={{ width: 9, height: 9, borderRadius: 3, background: C.brand }} /> Released
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: T.caption, color: C.slate, ...fBody }}>
                <span aria-hidden="true" style={{ width: 9, height: 9, borderRadius: 3, background: C.brandTint }} /> In progress
              </span>
            </div>
          </Card>
        )}

        {processing.length > 0 && (
          <>
            <SectionLabel>Processing payouts</SectionLabel>
            <div className="cl-stagger">
              {processing.map((b, i) => (
                <Card key={b.id} onClick={() => nav("funds-release-status", { bookingId: b.id, role: "coach", backTo: "coach-earnings" })} style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center", animationDelay: `${Math.min(i, 8) * 45}ms` }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: T.body, fontWeight: 600, color: C.jet, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", ...fBody }}>{b.service}</div>
                    <div style={{ fontSize: T.captionLg, color: C.slate, ...fBody }}>{b.date} · {getBookingClientName(withClientMeta(b)).name}</div>
                  </div>
                  <Badge tone="orange">+${netOf(b)}</Badge>
                </Card>
              ))}
            </div>
          </>
        )}

        <SectionLabel>Payout method</SectionLabel>
        <Card ariaLabel="Edit payout method" onClick={() => nav("coach-payout-setup", { mode: "edit" })} style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
          <Wallet size={17} color={C.jet} />
          <span style={{ fontSize: T.body, color: C.jet, fontWeight: 500, ...fBody }}>Bank account ···· 2210</span>
          <ChevronRight size={15} color={C.slateLight} style={{ marginLeft: "auto" }} />
        </Card>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <SectionLabel>Recent transactions</SectionLabel>
          {completed.length > STAT_LIMIT && (
            <button type="button" onClick={() => nav("coach-history")} style={{ minHeight: 44, padding: "0 4px", background: "transparent", border: "none", color: C.brand, fontWeight: 600, fontSize: T.label, cursor: "pointer", ...fBody }}>
              View all
            </button>
          )}
        </div>
        {completed.length === 0 && (
          <div style={{ fontSize: T.labelLg, color: C.slate, padding: "6px 2px 2px", ...fBody }}>No completed sessions yet.</div>
        )}
        <div className="cl-stagger">
          {completed.slice(0, STAT_LIMIT).map((b, i) => (
            <Card key={b.id} onClick={() => nav("funds-release-status", { bookingId: b.id, role: "coach", backTo: "coach-earnings" })} style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center", animationDelay: `${Math.min(i, 8) * 45}ms` }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: T.body, fontWeight: 600, color: C.jet, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", ...fBody }}>{b.service}</div>
                <div style={{ fontSize: T.captionLg, color: C.slate, ...fBody }}>{b.date} · {getBookingClientName(withClientMeta(b)).name}</div>
                <div style={{ marginTop: 5 }}><Badge tone="orange">{b.payoutStatus === PAYOUT_STATUS.RELEASED ? "Payout released" : "Processing"}</Badge></div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: T.bodyLg, fontWeight: 700, color: C.brand, ...fDisplay }}>+${netOf(b)}</span>
                <ChevronRight size={14} color={C.slateLight} />
              </div>
            </Card>
          ))}
        </div>
          </>
        )}
      </div>
    </div>
  );
}
