import React from "react";
import { PartyPopper } from "lucide-react";
import { CL, CD, fDisplay, fBody, T } from "../../theme/theme";
import { useApp } from "../../context/AppContext";
import { Btn } from "../../components/ui/Primitives";

export function ScreenCoachSetupComplete({ resetNav, setReachedDashboardAfterVerification }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const goToDashboard = () => {
    if (setReachedDashboardAfterVerification) setReachedDashboardAfterVerification(true);
    resetNav("coach-dashboard", {}, "coach");
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ textAlign: "center", marginTop: 48, padding: "18px 18px 0" }}>
        <div style={{
          width: 72, height: 72, borderRadius: 22, background: C.brandTint,
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px",
        }}>
          <PartyPopper size={32} color={C.brand} />
        </div>
        <div style={{ fontSize: T.display, fontWeight: 600, color: C.jet, ...fDisplay }}>You're All Set!</div>
        <div style={{ fontSize: T.bodyLg, color: C.slate, marginTop: 10, lineHeight: 1.6, maxWidth: 300, marginLeft: "auto", marginRight: "auto", ...fBody }}>
          Congratulations! Your setup is complete and you're ready to go. You can now manage your services, bookings, availability, and earnings from your dashboard.
        </div>
      </div>

      <div style={{ marginTop: "auto", padding: "14px 18px", paddingBottom: "max(28px, env(safe-area-inset-bottom))", borderTop: `1px solid ${C.border}`, background: C.white }}>
        <Btn full onClick={goToDashboard}>Go to dashboard</Btn>
      </div>
    </div>
  );
}
