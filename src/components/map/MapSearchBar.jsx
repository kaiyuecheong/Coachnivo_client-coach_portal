import React from "react";
import { Search, X, MapPin } from "lucide-react";
import { CL, CD, fBody, T } from "../../theme/theme";
import { useApp } from "../../context/AppContext";
import { SportIcon } from "../ui/SportUI";

// Split out from the map so typing in the search field doesn't re-render the
// Leaflet map/marker tree on every keystroke — only this bar re-renders.
function MapSearchBarBase({ value, onChange, onClear, onClose, onFocus, onBlur, showSuggestions, suggestions, onSelectSuggestion }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 401 }}>
      {/* Full-width, flush to the edges, with a flat map-toolbar treatment. */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, background: C.white,
        padding: "14px 16px", boxShadow: "none",
      }}>
        <button type="button" aria-label="Close map search" onClick={onClose} style={{ width: 44, height: 44, borderRadius: 12, background: darkMode ? "transparent" : C.fog, border: darkMode ? `1px solid ${C.border}` : "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
          <X size={18} color={C.jet} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
          <Search size={15} color={C.slateLight} style={{ flexShrink: 0 }} />
          <input
            name="map-location-search"
            type="text"
            role="searchbox"
            inputMode="search"
            autoComplete="off"
            aria-label="Search map locations"
            value={value}
            onChange={e => onChange(e.target.value)}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder="Search location…"
            style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontSize: T.subtitle, color: C.jet, ...fBody }}
          />
          {value && (
            <button type="button" aria-label="Clear map search" onMouseDown={e => e.preventDefault()} onClick={onClear} style={{ width: 44, height: 44, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <X size={14} color={C.slateLight} />
            </button>
          )}
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div style={{ margin: "0 16px", padding: 6, background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "none" }}>
          {suggestions.map(s => (
            <button key={`${s.type}-${s.label}`} onMouseDown={() => onSelectSuggestion(s)} style={{ width: "100%", minHeight: 44, textAlign: "left", padding: "10px", background: "none", border: "none", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: T.body, color: C.jet, ...fBody }}>
              {s.type === "sport" ? <SportIcon sport={s.label} size={15} color={C.brand} /> : <MapPin size={13} color={C.slateLight} />}{s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export const MapSearchBar = React.memo(MapSearchBarBase);
