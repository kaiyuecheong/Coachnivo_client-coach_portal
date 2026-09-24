import React, { useEffect, useRef, useState } from "react";
import { Bell, CheckCircle2 } from "lucide-react";
import { CL, CD, fBody, T } from "../theme/theme";
import { useApp } from "../context/AppContext";
import { useUserLocation } from "../utils/useUserLocation";

/* =========================================================================
   STATE SYSTEM
   -------------------------------------------------------------------------
   Live state helpers (notifications, action flow, bell trigger). The status
   banner layer — STATE_CATALOG, StatusBanner, ResultOverlay, InlineStatus —
   now lives in components/ui/Banners.jsx and is re-exported here so existing
   imports keep working.
   ========================================================================= */

export { useUserLocation };
export { StatusBanner, ResultOverlay, InlineStatus } from "../components/ui/Banners";
export { STATE_CATALOG, getTones } from "../components/ui/Banners";

/* =========================================================================
   COLOR HELPER — returns C (current palette) for use in components
   ========================================================================= */
function useColors() {
  try {
    const app = useApp();
    const darkMode = app?.darkMode ?? false;
    return (darkMode ? CD : CL) || CL;
  } catch (e) {
    return CL;
  }
}

/* -------------------------------------------------------------------------
   NotificationBellButton — reusable premium trigger with unread-count badge
   ------------------------------------------------------------------------- */
export function NotificationBellButton({ count = 0, onClick, color }) {
  const C = useColors();
  const capped = count > 9 ? "9+" : count;
  return (
    <button
      type="button"
      aria-label={count > 0 ? `Notifications, ${count} unread` : "Notifications"}
      onClick={onClick}
      style={{
        width: 44, height: 44, flexShrink: 0, cursor: "pointer",
        background: "none", border: "none", padding: 0,
        display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
      }}
    >
      <Bell size={22} color={color || C.jet} strokeWidth={1.8} />
      {count > 0 && (
        <span style={{
          position: "absolute", top: 2, right: 0, minWidth: 17, height: 17, padding: "0 4px",
          boxSizing: "border-box", background: C.brand, borderRadius: 99, border: `1.5px solid ${C.white}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: T.caption, fontWeight: 700, color: "#FFFFFF", lineHeight: 1, ...fBody,
        }}>
          {capped}
        </span>
      )}
    </button>
  );
}

/* -------------------------------------------------------------------------
   useLiveNotifications — merges live notifications on top of seed list
   ------------------------------------------------------------------------- */
export function useLiveNotifications(runtime = [], initialSeed = []) {
  const [items, setItems] = useState(initialSeed);
  const seen = useRef(new Set(initialSeed.map((item) => item.id)));
  useEffect(() => {
    const fresh = runtime.filter((n) => !seen.current.has(n.id));
    if (fresh.length) {
      fresh.forEach((n) => seen.current.add(n.id));
      setItems((arr) => [...fresh, ...arr]);
    }
  }, [runtime]);
  return [items, setItems];
}

/* -------------------------------------------------------------------------
   ActionFlow — horizontal trail: Action -> Processing -> Result -> Notify
   ------------------------------------------------------------------------- */
export function ActionFlow({ steps, activeIndex }) {
  const C = useColors();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 14 }}>
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{
              width: 16, height: 16, borderRadius: 99, flexShrink: 0,
              background: i <= activeIndex ? C.brand : C.border,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {i < activeIndex && <CheckCircle2 size={11} color="#FFFFFF" />}
            </span>
            <span style={{ fontSize: T.tiny, fontWeight: 700, color: i <= activeIndex ? C.jet : C.slateLight, ...fBody, whiteSpace: "nowrap" }}>{s}</span>
          </div>
          {i < steps.length - 1 && <div style={{ flex: 1, height: 1, background: i < activeIndex ? C.brand : C.border, minWidth: 8 }} />}
        </React.Fragment>
      ))}
    </div>
  );
}
