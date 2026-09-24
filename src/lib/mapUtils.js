import { CL, CD } from "../theme/theme";

/* =========================================================================
   MAP UTILITIES — framework-agnostic helpers shared by the map components.
   Kept out of the component tree so none of this re-runs on re-render, and
   so the CDN script/style tags are only ever injected once per page.
   ========================================================================= */

export function getMapColors(darkMode) {
  return darkMode ? CD : CL;
}

export const LEAFLET_CSS_URL = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
export const LEAFLET_JS_URL = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

export const AUSTRALIA_CENTER = [-25.2744, 133.7751];
export const AUSTRALIA_ZOOM = 4;
// Fallback "you are here" point (Chatswood, Sydney) used as the default location
// whenever the browser lacks geolocation or is outside Australia.
export const FALLBACK_USER_LOCATION = { lat: -33.7969, lng: 151.1830 };
export const DEFAULT_LOCATION_LABEL = "Chatswood, Sydney";
// Zoom level used the first time we auto-centre on the user's real location.
export const LOCATE_ZOOM = 13;
// Preset quick-filter distances shown as chips; anything above 10km lives in
// the custom slider instead (which tops out at CUSTOM_RADIUS_MAX_KM).
export const RADIUS_PRESETS_KM = [5, 10];
export const CUSTOM_RADIUS_MIN_KM = 1;
export const CUSTOM_RADIUS_MAX_KM = 50;
export const DEFAULT_COACH_AREA_RADIUS_KM = 1.2;

/* =========================================================================
   MAP STYLES — base tile layers the user can switch between. All are free,
   keyless tile sources. "hybrid" additionally layers boundary/label tiles
   on top of the satellite imagery.
   ========================================================================= */
export const MAP_STYLES = [
  {
    id: "street",
    label: "Street",
    description: "Roads, buildings & parks - best for everyday use",
    swatch: "#CFE3D6",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19,
  },
  {
    id: "satellite",
    label: "Satellite",
    description: "Real aerial imagery",
    swatch: "#3A4A2E",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
    maxZoom: 19,
  },
  {
    id: "terrain",
    label: "Terrain",
    description: "Elevation, hills & mountains - great for running/cycling",
    swatch: "#D9C9A3",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
    maxZoom: 13,
  },
  {
    id: "dark",
    label: "Dark",
    description: "Dark UI - premium, night-friendly interface",
    swatch: "#1B1E24",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
    maxZoom: 20,
  },
  {
    id: "light",
    label: "Light / Minimal",
    description: "Simplified roads & labels - clean modern look",
    swatch: "#F1F1EE",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
    maxZoom: 20,
  },
  {
    id: "topo",
    label: "Topographic",
    description: "Contour lines & elevation detail",
    swatch: "#E4D9B8",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors, SRTM &copy; OpenTopoMap",
    maxZoom: 17,
  },
  {
    id: "outdoor",
    label: "Outdoor",
    description: "Trails, parks & cycling routes highlighted",
    swatch: "#CFE0B8",
    url: "https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors &copy; CyclOSM",
    maxZoom: 20,
  },
  {
    id: "hybrid",
    label: "Hybrid",
    description: "Satellite imagery with roads & labels overlaid",
    swatch: "#5B6B4A",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    overlayUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
    maxZoom: 19,
  },
];
export const DEFAULT_MAP_STYLE_ID = "street";

const MAP_STYLE_ID = "cl-leaflet-style";

/* --- CDN loading, memoised on window so remounting the map view (e.g.
   toggling List/Map) never re-fetches or double-initialises Leaflet. --- */
export function loadLeaflet() {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.L) return Promise.resolve(window.L);
  if (window.__clLeafletPromise) return window.__clLeafletPromise;
  window.__clLeafletPromise = new Promise((resolve, reject) => {
    if (!document.getElementById("cl-leaflet-css")) {
      const link = document.createElement("link");
      link.id = "cl-leaflet-css";
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS_URL;
      document.head.appendChild(link);
    }
    const existing = document.getElementById("cl-leaflet-js");
    if (existing) {
      existing.addEventListener("load", () => resolve(window.L));
      existing.addEventListener("error", reject);
      return;
    }
    const script = document.createElement("script");
    script.id = "cl-leaflet-js";
    script.src = LEAFLET_JS_URL;
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return window.__clLeafletPromise;
}

export function injectMapStyles(C = CL) {
  if (document.getElementById(MAP_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = MAP_STYLE_ID;
  style.textContent = `
    @keyframes clLocatePulse { 0% { transform: scale(.6); opacity: .45; } 70% { transform: scale(2.4); opacity: 0; } 100% { transform: scale(2.4); opacity: 0; } }
    @keyframes clFixedBlink { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }
    .cl-user-dot-wrap { width: 20px; height: 20px; position: relative; }
    .cl-user-dot-wrap::before { content: ""; position: absolute; inset: -16px; border-radius: 50%; background: rgba(59,130,246,.38); animation: clLocatePulse 2.2s ease-out infinite; }
    .cl-user-dot-wrap::after { content: ""; position: absolute; inset: 0; border-radius: 50%; background: #3B82F6; border: 3px solid ${C.white}; box-shadow: 0 1px 5px rgba(0,0,0,.35); }
    .cl-coach-avatar-marker { position: relative; box-sizing: border-box; width: 52px; height: 52px; padding: 3px; border-radius: 50%; background: var(--cl-marker-surface); border: 2px solid var(--cl-marker-ring); box-shadow: none; cursor: pointer; transition: transform .16s ease; }
    .cl-coach-avatar-marker::before { content: ""; position: absolute; inset: -8px; border-radius: 50%; border: 1.5px solid var(--cl-marker-ring); background: var(--cl-marker-ring); opacity: .12; }
    .cl-coach-avatar-marker.selected { transform: scale(1.1); box-shadow: none; }
    .cl-coach-avatar-marker.selected { border-width: 3px; }
    .cl-coach-avatar-marker.selected::before { inset: -10px; opacity: .18; }
    .cl-coach-avatar-shell { position: relative; z-index: 1; width: 100%; height: 100%; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; background: var(--cl-marker-tint); color: var(--cl-marker-ink); font: 700 15px/1 'Outfit', sans-serif; }
    .cl-coach-avatar-shell img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .leaflet-top.leaflet-right { top: 132px !important; }
    .cl-hide-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
    .cl-hide-scrollbar::-webkit-scrollbar { display: none; }
    .leaflet-control-zoom { border: none !important; border-radius: 12px !important; overflow: hidden; box-shadow: none !important; margin-right: 16px !important; }
    .leaflet-control-zoom a { width: 34px !important; height: 34px !important; line-height: 34px !important; color: ${C.jet} !important; }
    .leaflet-control-zoom a:first-child { border-bottom: 1px solid ${C.border} !important; }
    .leaflet-touch .leaflet-bar { border: none; }
    .leaflet-popup-content-wrapper, .leaflet-popup-tip { display: none; }
    .leaflet-container { font-family: 'Inter', sans-serif; background: #F4F5F7; }
  `;
  document.head.appendChild(style);
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}

export function getCoachAreaPoint(coach) {
  if (typeof coach?.areaLat !== "number" || typeof coach?.areaLng !== "number") return null;
  return { lat: coach.areaLat, lng: coach.areaLng };
}

export function coachAvatarMarkerIcon(C, L, coach, selected) {
  const initial = escapeHtml((coach?.name || "C").trim().charAt(0).toUpperCase() || "C");
  const avatar = coach?.avatar
    ? `<img src="${escapeHtml(coach.avatar)}" alt="" draggable="false" />`
    : initial;
  const html = `
    <div class="cl-coach-avatar-marker${selected ? " selected" : ""}"
      style="--cl-marker-ring:${C.brand};--cl-marker-surface:${C.white};--cl-marker-tint:${C.brandTint};--cl-marker-ink:${C.brandIcon}">
      <div class="cl-coach-avatar-shell">${avatar}</div>
    </div>`;
  return L.divIcon({ className: "", html, iconSize: [52, 52], iconAnchor: [26, 26] });
}

export function userLocationIcon(L) {
  return L.divIcon({
    className: "",
    html: `<div class="cl-user-dot-wrap"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

// Great-circle distance in km — used for the radius filter (fast, no network call).
export function haversineKm(a, b) {
  const R = 6371;
  const toRad = deg => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
