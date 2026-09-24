import React, { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { CL, CD, fBody, T } from "../../theme/theme";
import { useApp } from "../../context/AppContext";
import { RADIUS_PRESETS_KM, CUSTOM_RADIUS_MIN_KM, CUSTOM_RADIUS_MAX_KM } from "../../lib/mapUtils";

// Isolated so dragging the custom-radius slider (which changes on every pixel)
// only re-renders this small control, not the whole map + coach pin tree.
function RadiusFilterBase({ radiusKm, onChange, resultCount }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;

  const pill = active => ({
    display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0,
    padding: "7px 12px", borderRadius: 999, fontSize: T.labelLg, fontWeight: 600,
    border: `1px solid ${active ? C.brand : C.border}`,
    background: active ? C.brandTint : C.white, color: active ? C.brand : C.jet,
    cursor: "pointer", whiteSpace: "nowrap", ...fBody,
  });

  const isPreset = radiusKm != null && RADIUS_PRESETS_KM.includes(radiusKm);
  const isCustom = radiusKm != null && !isPreset;
  const [showCustom, setShowCustom] = useState(false);
  const [customVal, setCustomVal] = useState(String(radiusKm && !isPreset ? radiusKm : 20));

  const clamp = n => Math.min(CUSTOM_RADIUS_MAX_KM, Math.max(CUSTOM_RADIUS_MIN_KM, n));
  const apply = () => {
    const n = Number(customVal);
    if (!Number.isFinite(n)) return;
    const clamped = clamp(Math.round(n));
    setCustomVal(String(clamped));
    onChange(clamped);
    setShowCustom(false);
  };

  return (
    <div style={{ position: "absolute", top: 78, right: 16, left: showCustom ? 16 : "auto", zIndex: 401 }}>
      {showCustom ? (
        <div style={{ background: C.white, borderRadius: 14, padding: "12px 14px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: T.label, fontWeight: 700, color: C.jet, ...fBody }}>Custom radius</span>
            <span style={{ fontSize: T.caption, color: C.slate, ...fBody }}>{CUSTOM_RADIUS_MIN_KM}–{CUSTOM_RADIUS_MAX_KM} km</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, border: `1px solid ${C.border}`, borderRadius: 10, padding: "4px 4px 4px 12px" }}>
            <input
              type="number" inputMode="numeric" min={CUSTOM_RADIUS_MIN_KM} max={CUSTOM_RADIUS_MAX_KM} step={1}
              value={customVal}
              onChange={e => setCustomVal(e.target.value)}
              onBlur={() => setCustomVal(v => (v === "" ? v : String(clamp(Math.round(Number(v)) || CUSTOM_RADIUS_MIN_KM))))}
              onKeyDown={e => { if (e.key === "Enter") apply(); }}
              style={{ flex: 1, minWidth: 0, border: "none", outline: "none", fontSize: T.headingLg, fontWeight: 700, color: C.jet, background: "transparent", ...fBody }}
            />
            <span style={{ fontSize: T.labelLg, fontWeight: 600, color: C.slate, flexShrink: 0, ...fBody }}>km</span>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button onClick={() => setShowCustom(false)} style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: `1px solid ${C.border}`, background: C.white, color: C.jet, fontSize: T.labelLg, fontWeight: 600, cursor: "pointer", ...fBody }}>Close</button>
            <button onClick={apply} style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: "none", background: C.black, color: C.white, fontSize: T.labelLg, fontWeight: 700, cursor: "pointer", ...fBody }}>Apply</button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 7, overflowX: "auto", maxWidth: "100%", paddingBottom: 2 }} className="cl-hide-scrollbar">
          <button onClick={() => onChange(null)} style={{ ...pill(radiusKm == null), background: C.white, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>All</button>
          {RADIUS_PRESETS_KM.map(km => (
            <button key={km} onClick={() => onChange(km)} style={{ ...pill(radiusKm === km), boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>{km} km</button>
          ))}
          <button onClick={() => setShowCustom(true)} style={{ ...pill(isCustom), boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
            <SlidersHorizontal size={12} /> {isCustom ? `${radiusKm} km` : "Custom"}
          </button>
        </div>
      )}
      {!showCustom && radiusKm != null && (
        <div style={{ marginTop: 6, fontSize: T.caption, color: C.slate, textAlign: "right", ...fBody }}>
          {resultCount} coach{resultCount === 1 ? "" : "es"} within {radiusKm} km
        </div>
      )}
    </div>
  );
}

export const RadiusFilter = React.memo(RadiusFilterBase);
