import React from "react";
import { PartyPopper } from "lucide-react";
import { CL, CD, fDisplay, fBody, T } from "../../theme/theme";
import { useApp } from "../../context/AppContext";
import { Btn } from "../../components/ui/Primitives";

/**
 * Shown at the very end of the client onboarding journey (after the "About
 * you" / participant steps), mirroring ScreenCoachSetupComplete on the coach
 * side. Gives a clear "you're done" moment before dropping the client into
 * the Discover tab.
 */
export function ScreenClientSetupComplete({ resetNav, params, setIsFirstTimeClient, setDiscoveryPrefs, setBookings, setShowPostSignupGuide }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const name = params?.name ? params.name.split(" ")[0] : "";

  const startExploring = () => {
    // A client who's just finished signing up genuinely has no bookings,
    // chats or coach preferences yet — enter first-time-client mode and
    // clear out the demo/mock bookings so Discover, Bookings and Messages
    // all show their real empty states instead of the seeded sample data.
    setIsFirstTimeClient?.(true);
    setDiscoveryPrefs?.(null);
    setBookings?.([]);
    // Land on Discover with the 5-step post-sign-up guide queued up.
    setShowPostSignupGuide?.(true);
    resetNav("client-home", {}, "client");
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "18px 18px 0", textAlign: "center", marginTop: 48 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 22, background: C.brandTint,
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px",
        }}>
          <PartyPopper size={32} color={C.brand} />
        </div>
        <div style={{ fontSize: T.display, fontWeight: 600, color: C.jet, ...fDisplay }}>You're All Set{name ? `, ${name}` : ""}!</div>
        <div style={{ fontSize: T.bodyLg, color: C.slate, marginTop: 10, lineHeight: 1.6, maxWidth: 300, marginLeft: "auto", marginRight: "auto", ...fBody }}>
          Your profile is complete and you're ready to start booking. Discover coaches near you, book sessions, and manage everything from your dashboard.
        </div>
      </div>

      <div style={{ marginTop: "auto", padding: "14px 18px", paddingBottom: "max(28px, env(safe-area-inset-bottom))", borderTop: `1px solid ${C.border}`, background: C.white, flexShrink: 0 }}>
        <Btn full onClick={startExploring}>Start exploring</Btn>
      </div>
    </div>
  );
}
