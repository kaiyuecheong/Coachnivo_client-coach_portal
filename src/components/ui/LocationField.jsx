import React, { useState, useEffect, useRef } from "react";
import { MapPin, Search, LocateFixed, CheckCircle2 } from "lucide-react";
import { CL, CD, fBody, T, LAYOUT } from "../../theme/theme";
import { useApp } from "../../context/AppContext";
import { AU_SUBURBS } from "../../data/mockData";
import { haversineKm } from "../../lib/mapUtils";
import { Spinner, RequiredMark } from "./Primitives";

const FALLBACK_SUBURB = AU_SUBURBS.find((s) => s.suburb === "Chatswood" && s.postcode === "2067") || AU_SUBURBS.find((s) => s.suburb === "Chatswood") || AU_SUBURBS[0];

function nearestSuburb(lat, lng) {
  // If coordinates are outside Australia (e.g. overseas testing environment), default to Chatswood
  const isAustralia = lat <= -10 && lat >= -44 && lng >= 112 && lng <= 154;
  if (!isAustralia) return FALLBACK_SUBURB;

  let best = null;
  let bestKm = Infinity;
  for (const s of AU_SUBURBS) {
    if (s.lat == null || s.lng == null) continue;
    const km = haversineKm({ lat, lng }, { lat: s.lat, lng: s.lng });
    if (km < bestKm) { bestKm = km; best = s; }
  }
  return best || FALLBACK_SUBURB;
}

/* Shared structured location picker — { suburb, state, postcode } — used by
   coach onboarding, client setup, participant profiles and account editing.
   Includes a "use my current location" detector with a locating state. */
export function LocationField({ value, onChange, label = "Location", name = "location", helper, placeholder = "Search address, suburb or postcode…", required }) {
  const { darkMode, toast } = useApp();
  const C = darkMode ? CD : CL;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const detectRequestRef = useRef(0);

  useEffect(() => () => {
    detectRequestRef.current += 1;
  }, []);

  const searchTokens = query.toLowerCase().split(/[\s,]+/).filter(Boolean);
  const filtered = AU_SUBURBS.filter((s) =>
    searchTokens.length > 0 && searchTokens.some((token) => s.suburb.toLowerCase().includes(token) || (token.length >= 3 && s.postcode.includes(token)))
  ).slice(0, 6);

  const pick = (s) => {
    detectRequestRef.current += 1;
    setLocating(false);
    onChange?.(s);
    setQuery("");
    setOpen(false);
  };

  const detect = () => {
    if (locating) return;
    const fallback = FALLBACK_SUBURB;
    const requestId = detectRequestRef.current + 1;
    detectRequestRef.current = requestId;

    // Always give the user a usable result immediately. Browser geolocation can
    // be unavailable, denied, or left pending in a prototype/browser preview.
    setLocating(false);
    onChange?.(fallback);
    setQuery("");
    setOpen(false);
    if (toast) toast(`Using ${fallback.suburb} as your default area`);

    if (!navigator.geolocation) {
      return;
    }

    // Best effort: replace the default only if the browser returns a location.
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (detectRequestRef.current !== requestId) return;
        const nearest = nearestSuburb(pos.coords.latitude, pos.coords.longitude);
        if (!nearest) return;
        onChange?.(nearest);
        if (toast && nearest.suburb !== fallback.suburb) toast(`Location detected - ${nearest.suburb}`);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  const labelStyle = { fontSize: T.labelLg, fontWeight: 600, color: C.jet, marginBottom: 6, ...fBody };

  return (
    <div>
      {label && <div style={labelStyle}>{label}{required && <RequiredMark />}</div>}

      {value ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 64, boxSizing: "border-box", border: `1.5px solid ${C.border}`, borderRadius: LAYOUT.inputRadius, padding: "9px 13px", background: C.white, animation: "clFadeUp .25s ease" }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: C.brandTint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <MapPin size={17} color={C.brand} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: T.bodyLg, fontWeight: 600, color: C.jet, ...fBody }}>{value.suburb}, {value.state}</span>
              <span style={{ fontSize: T.caption, fontWeight: 700, color: C.slate, background: C.fog, borderRadius: 999, padding: "2px 8px", ...fBody }}>{value.postcode}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { detectRequestRef.current += 1; setLocating(false); onChange?.(null); }}
            style={{ minHeight: LAYOUT.touchTarget, background: "none", border: "none", color: C.brand, fontSize: T.label, fontWeight: 600, cursor: "pointer", padding: "6px 4px", ...fBody }}
          >
            Change
          </button>
        </div>
      ) : (
        <div style={{ position: "relative" }}>
          <div className="cl-input" style={{ display: "flex", alignItems: "center", gap: 10, border: `1.5px solid ${C.border}`, borderRadius: LAYOUT.inputRadius, padding: "0 4px 0 13px", background: C.white, minHeight: 52 }}>
            <Search size={16} color={C.slateLight} />
            <input
              value={locating ? "" : query}
              disabled={locating}
              name={name}
              autoComplete="off"
              onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
              placeholder={placeholder}
              aria-label={label || "Search suburb or postcode"}
              style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: T.bodyLg, color: C.jet, minWidth: 0, height: 52, ...fBody }}
            />
            <div aria-hidden="true" style={{ width: 1, height: 24, background: C.border, flexShrink: 0 }} />
            <button
              type="button"
              onClick={detect}
              onMouseDown={(e) => e.preventDefault()}
              disabled={locating}
              aria-label={locating ? "Detecting your current location" : "Detect my current location"}
              title={locating ? "Detecting your current location" : "Detect my current location"}
              style={{ width: LAYOUT.touchTarget, height: LAYOUT.touchTarget, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "none", borderRadius: 12, background: C.brandTint, color: C.brandIcon || C.brand, cursor: locating ? "default" : "pointer", opacity: locating ? 0.7 : 1 }}
            >
              {locating ? <Spinner size={15} color={C.brand} /> : <LocateFixed size={18} strokeWidth={2.2} />}
            </button>
          </div>

          {open && !locating && filtered.length > 0 && (
            <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: C.white, border: `1px solid ${C.border}`, borderRadius: 13, boxShadow: "0 10px 24px rgba(0,0,0,.10)", zIndex: 30, maxHeight: 200, overflowY: "auto", padding: 4, animation: "clFadeUp .18s ease" }}>
              {filtered.map((s) => (
                <button
                  key={`${s.suburb}-${s.postcode}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(s)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, width: "100%", textAlign: "left", padding: "10px 12px", background: "none", border: "none", borderRadius: 11, cursor: "pointer", ...fBody }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 9, fontSize: T.bodyLg, color: C.jet, fontWeight: 500, minWidth: 0 }}>
                    <MapPin size={14} color={C.slateLight} style={{ flexShrink: 0 }} />
                    <span>{s.suburb}, {s.state}</span>
                  </span>
                  <span style={{ fontSize: T.label, color: C.slateLight, flexShrink: 0 }}>{s.postcode}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {helper && (
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: T.captionLg, color: C.slateLight, marginTop: 6, ...fBody }}>
          <CheckCircle2 size={12} color={C.brand} />
          {helper}
        </div>
      )}
    </div>
  );
}
