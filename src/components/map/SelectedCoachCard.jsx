import React from "react";
import { MapPin, ShieldCheck, ChevronRight, X } from "lucide-react";
import { CL, CD, fDisplay, fBody, T } from "../../theme/theme";
import { useApp } from "../../context/AppContext";
import { Avatar, HandleTag } from "../ui/Primitives";
import { SportBadge } from "../ui/SportUI";
import { getPublicName } from "../../utils/name";

// Isolated so selecting an approximate coach area does not re-render the map
// controls around it.
function SelectedCoachCardBase({ coach, onOpen, onClose }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  if (!coach) return null;
  const pub = getPublicName(coach, "public");
  return (
    <div style={{
      position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: 16, zIndex: 401, background: C.white,
      borderRadius: 20, padding: 14, boxShadow: "none", width: 600, maxWidth: "calc(100% - 32px)",
    }}>
      <button type="button" aria-label="Close selected coach card" onClick={onClose} style={{ position: "absolute", top: 2, right: 2, width: 44, height: 44, borderRadius: 999, background: "transparent", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
        <X size={16} color={C.slate} />
      </button>

      <div style={{ display: "flex", gap: 12, alignItems: "center", paddingRight: 30 }}>
        <Avatar name={pub.name} src={coach.avatar} size={48} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: T.title, color: C.jet, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", ...fDisplay }}>{pub.name}</div>
          {pub.handle && <HandleTag handle={pub.handle} size={11} color={C.slateLight} />}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
            {(coach.sports || [coach.sport]).map((s) => (
              <SportBadge key={s} sport={s} compact />
            ))}
            <span style={{ fontSize: T.label, color: C.slate, ...fBody }}>· ${coach.packages[0].price}/session</span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: T.captionLg, color: C.slate, display: "flex", alignItems: "center", gap: 4, ...fBody }}>
            <MapPin size={11} color={C.slateLight} style={{ flexShrink: 0 }} />
            <span style={{ minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{coach.suburb} · Approx. {coach.liveDistanceKm ?? coach.distanceKm} km</span>
          </div>
          <div style={{ fontSize: T.caption, color: C.brand, marginTop: 4, display: "flex", alignItems: "center", gap: 4, ...fBody }}>
            <ShieldCheck size={11} color={C.brand} style={{ flexShrink: 0 }} />
            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Venue shared after booking</span>
          </div>
        </div>
        <button type="button" aria-label={`Open ${pub.name}'s profile`} onClick={() => onOpen?.(coach.id)} style={{ minWidth: 92, height: 44, padding: "0 12px", borderRadius: 14, background: C.black, color: C.white, border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, cursor: "pointer", flexShrink: 0, fontSize: T.labelLg, fontWeight: 700, ...fBody }}>
          View <ChevronRight size={16} color={C.white} />
        </button>
      </div>
    </div>
  );
}

export const SelectedCoachCard = React.memo(SelectedCoachCardBase);
