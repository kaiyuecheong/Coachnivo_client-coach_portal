import React, { useState } from "react";
import { Layers, Check } from "lucide-react";
import { CL, CD, fBody, T } from "../../theme/theme";
import { useApp } from "../../context/AppContext";
import { MAP_STYLES } from "../../lib/mapUtils";

// Sits directly above the "Locate Me" button, bottom-right. Collapsed it's a
// single icon button; tapping it pops a short list of map visual styles
// upward so it never gets covered by the selected-coach card below it.
function MapStyleSwitcherBase({ styleId, onChange, bottom }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const [open, setOpen] = useState(false);
  const current = MAP_STYLES.find(s => s.id === styleId) || MAP_STYLES[0];

  return (
    <div style={{ position: "absolute", bottom, right: 16, zIndex: 402, transition: "bottom .2s ease" }}>
      {open && (
        <div style={{
          position: "absolute", bottom: 52, right: 0, width: 236,
          background: C.white, borderRadius: 14, padding: 6,
          boxShadow: "none", border: `1px solid ${C.border}`,
          maxHeight: 320, overflowY: "auto",
        }}>
          <div style={{ padding: "6px 8px 8px", fontSize: T.caption, fontWeight: 700, color: C.slate, textTransform: "uppercase", letterSpacing: 0.4, ...fBody }}>
            Map style
          </div>
          {MAP_STYLES.map(s => {
            const active = s.id === styleId;
            return (
              <button
                key={s.id}
                onClick={() => { onChange(s.id); setOpen(false); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 8px", borderRadius: 10, border: "none", cursor: "pointer", textAlign: "left",
                  background: active ? C.brandTint : "transparent",
                }}
              >
                <span style={{ width: 26, height: 26, borderRadius: 7, background: s.swatch, flexShrink: 0, border: `1px solid ${C.border}` }} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: T.labelLg, fontWeight: 700, color: C.jet, ...fBody }}>{s.label}</div>
                  <div style={{ fontSize: T.tiny, color: C.slate, lineHeight: 1.3, ...fBody }}>{s.description}</div>
                </span>
                {active && <Check size={15} color={C.brand} style={{ flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      )}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: 44, height: 44, borderRadius: 12, background: C.white,
          border: `1px solid ${open ? C.brand : C.border}`, display: "flex", alignItems: "center",
          justifyContent: "center", cursor: "pointer", boxShadow: "none",
        }}
        title={`Map style: ${current.label}`}
      >
        <Layers size={18} color={open ? C.brand : C.jet} />
      </button>
    </div>
  );
}

export const MapStyleSwitcher = React.memo(MapStyleSwitcherBase);
