import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { LocateFixed, SlidersHorizontal } from "lucide-react";
import { CL, CD, fBody, T } from "../../theme/theme";
import { useIsDesktop } from "../../theme/responsive";
import { useApp } from "../../context/AppContext";
import {
  loadLeaflet, getMapColors, injectMapStyles, coachAvatarMarkerIcon, getCoachAreaPoint, userLocationIcon,
  AUSTRALIA_CENTER, AUSTRALIA_ZOOM, FALLBACK_USER_LOCATION, LOCATE_ZOOM,
  MAP_STYLES, DEFAULT_MAP_STYLE_ID, DEFAULT_COACH_AREA_RADIUS_KM,
} from "../../lib/mapUtils";
import { getPublicName } from "../../utils/name";
import { MapSearchBar } from "./MapSearchBar";
import { LocationStatus } from "./LocationStatus";
import { SelectedCoachCard } from "./SelectedCoachCard";
import { MapStyleSwitcher } from "./MapStyleSwitcher";

/**
 * CoachMapView — real Leaflet + OpenStreetMap coach map.
 *
 * Split into this orchestrator (owns the Leaflet instance + all map state)
 * plus small, independently-memoised presentational components
 * (MapSearchBar, LocationStatus, MapStyleSwitcher, SelectedCoachCard).
 * None of those re-render the Leaflet map itself, and the map's own effects
 * only touch the specific Leaflet layers they own — so typing in the search
 * box or applying shared filters never forces Leaflet to redraw tiles, only
 * the marker layers that actually changed.
 */
export function CoachMapView({ coaches = [], radiusKm = null, activeFilterCount = 0, onOpenFilters, onOpen, onClose }) {
  const { darkMode } = useApp();
  const isDesktop = useIsDesktop();
  const C = darkMode ? CD : CL;
  const colors = getMapColors(darkMode);
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const markersRef = useRef({});
  const areaCirclesRef = useRef({});
  const userMarkerRef = useRef(null);
  const radiusCircleRef = useRef(null);
  const tileLayerRef = useRef(null);
  const overlayLayerRef = useRef(null);
  const userLocationRef = useRef(null);
  const selectHandlerRef = useRef(() => {});
  const watchIdRef = useRef(null);
  const hasAutoCenteredRef = useRef(false);
  const skipNextStyleSwapRef = useRef(true); // the init effect already lays down the initial style's tiles

  const [ready, setReady] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(true);
  const [locationFixed, setLocationFixed] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [mapStyleId, setMapStyleId] = useState(DEFAULT_MAP_STYLE_ID);

  // Discovery accepts only suburb-level area points. Exact home/venue
  // coordinates are intentionally not supported by this client map.
  const geoCoaches = useMemo(() => coaches
    .map(c => ({ ...c, areaPoint: getCoachAreaPoint(c) }))
    .filter(c => c.areaPoint), [coaches]);

  const searchFiltered = useMemo(() => {
    if (!searchText.trim()) return geoCoaches;
    const q = searchText.trim().toLowerCase();
    return geoCoaches.filter(c => c.suburb.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.sport.toLowerCase().includes(q) || (c.sports && c.sports.some(s => s.toLowerCase().includes(q))));
  }, [geoCoaches, searchText]);

  // The parent owns the shared filter state; this map search only narrows the
  // already-filtered results further without creating a second filter model.
  const visibleCoaches = searchFiltered;
  const visibleCoachKey = visibleCoaches
    .map(c => `${c.id}:${c.areaPoint.lat}:${c.areaPoint.lng}:${c.areaRadiusKm || DEFAULT_COACH_AREA_RADIUS_KM}:${c.liveDistanceKm ?? ""}`)
    .join("|");

  const suggestions = useMemo(() => {
    if (!searchText.trim()) return [];
    const q = searchText.trim().toLowerCase();
    const candidates = [
      ...coaches.map(c => ({ label: c.suburb, type: "location" })),
      ...coaches.map(c => ({ label: c.name, type: "coach" })),
      ...coaches.flatMap(c => (c.sports || [c.sport]).map(s => ({ label: s, type: "sport" }))),
    ];
    return candidates
      .filter((item, index) => candidates.findIndex((other) => other.label === item.label && other.type === item.type) === index)
      .filter(item => item.label.toLowerCase().includes(q)).slice(0, 5);
  }, [coaches, searchText]);

  const deselectCoach = useCallback(() => setSelectedCoach(null), []);

  // Kept in a ref (refreshed every render) so marker click handlers — bound
  // once at marker creation — always see the current coach-area logic
  // instead of a stale closure from whenever the marker was first added.
  selectHandlerRef.current = coach => {
    const map = mapRef.current;
    if (!map || !coach?.areaPoint) return;
    setSelectedCoach(coach);
    const safeZoom = Math.min(Math.max(map.getZoom(), 12), 14);
    map.flyTo([coach.areaPoint.lat, coach.areaPoint.lng], safeZoom, {
      duration: 0.75, easeLinearity: 0.2,
    });
  };

  // --- Init map once, tear down on unmount. No artificial loading delay —
  // the map appears the moment Leaflet is ready; Locate Me and coach taps
  // handle their own smooth flyTo/flyToBounds animations instead. ---
  useEffect(() => {
    let cancelled = false;
    injectMapStyles(colors);
    loadLeaflet().then(L => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      leafletRef.current = L;
      const map = L.map(containerRef.current, { zoomControl: false, attributionControl: true })
        .setView(AUSTRALIA_CENTER, AUSTRALIA_ZOOM);
      const style = MAP_STYLES.find(s => s.id === mapStyleId) || MAP_STYLES[0];
      tileLayerRef.current = L.tileLayer(style.url, { maxZoom: style.maxZoom, attribution: style.attribution }).addTo(map);
      if (style.overlayUrl) {
        overlayLayerRef.current = L.tileLayer(style.overlayUrl, { maxZoom: style.maxZoom }).addTo(map);
      }
      L.control.zoom({ position: "topright" }).addTo(map);
      map.attributionControl.setPosition("bottomleft");
      mapRef.current = map;
      setReady(true);
    }).catch(() => {});

    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
      markersRef.current = {};
      areaCirclesRef.current = {};
      userMarkerRef.current = null;
      radiusCircleRef.current = null;
      tileLayerRef.current = null;
      overlayLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Swap the base tile layer (and hybrid's label overlay) when the user
  // picks a different map style, without tearing down the whole map. ---
  useEffect(() => {
    if (!ready) return;
    if (skipNextStyleSwapRef.current) { skipNextStyleSwapRef.current = false; return; }
    const L = leafletRef.current, map = mapRef.current;
    const style = MAP_STYLES.find(s => s.id === mapStyleId) || MAP_STYLES[0];
    if (tileLayerRef.current) map.removeLayer(tileLayerRef.current);
    if (overlayLayerRef.current) { map.removeLayer(overlayLayerRef.current); overlayLayerRef.current = null; }
    tileLayerRef.current = L.tileLayer(style.url, { maxZoom: style.maxZoom, attribution: style.attribution }).addTo(map);
    tileLayerRef.current.setZIndex(0);
    if (style.overlayUrl) {
      overlayLayerRef.current = L.tileLayer(style.overlayUrl, { maxZoom: style.maxZoom }).addTo(map);
      overlayLayerRef.current.setZIndex(1);
    }
  }, [ready, mapStyleId]);

  // --- Location tracking: auto-enabled on mount, stays "fixed" (live) via
  // watchPosition rather than a single one-off read, so the blue dot and any
  // active radius filter keep following the user without any manual toggle. ---
  useEffect(() => {
    if (!navigator.geolocation) { setUserLocation(FALLBACK_USER_LOCATION); setLocating(false); return; }
    let gotFirstFix = false;
    const fallbackTimer = setTimeout(() => {
      if (!gotFirstFix) { setUserLocation(FALLBACK_USER_LOCATION); setLocating(false); }
    }, 6000);

    watchIdRef.current = navigator.geolocation.watchPosition(
      pos => {
        gotFirstFix = true;
        clearTimeout(fallbackTimer);
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        setLocationFixed(true);
      },
      () => {
        if (!gotFirstFix) { clearTimeout(fallbackTimer); setUserLocation(FALLBACK_USER_LOCATION); setLocating(false); }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
    );

    return () => {
      clearTimeout(fallbackTimer);
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);
  useEffect(() => { userLocationRef.current = userLocation; }, [userLocation]);

  // --- Default view: as soon as we have a real fix (or the fallback kicks
  // in) auto-zoom straight to it instead of sitting on the whole-Australia
  // view. Only happens once — later location updates just move the dot. ---
  useEffect(() => {
    if (!ready || !userLocation || hasAutoCenteredRef.current) return;
    hasAutoCenteredRef.current = true;
    mapRef.current.setView([userLocation.lat, userLocation.lng], LOCATE_ZOOM, { animate: true });
  }, [ready, userLocation]);

  // --- "You are here" blue dot ---
  useEffect(() => {
    if (!ready || !userLocation) return;
    const L = leafletRef.current, map = mapRef.current;
    if (userMarkerRef.current) userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
    else userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userLocationIcon(L), zIndexOffset: 500, interactive: false, keyboard: false }).addTo(map);
  }, [ready, userLocation]);

  // --- Radius circle overlay, redrawn whenever the radius or user location changes ---
  useEffect(() => {
    if (!ready) return;
    const L = leafletRef.current, map = mapRef.current;
    if (radiusCircleRef.current) { map.removeLayer(radiusCircleRef.current); radiusCircleRef.current = null; }
    if (radiusKm == null) return;
    const origin = userLocationRef.current || FALLBACK_USER_LOCATION;
    radiusCircleRef.current = L.circle([origin.lat, origin.lng], {
      radius: radiusKm * 1000, color: C.info, weight: 1.5, opacity: 0.4, fillColor: C.info, fillOpacity: 0.07,
    }).addTo(map);
    map.flyToBounds(radiusCircleRef.current.getBounds(), { padding: [40, 40], duration: 0.6 });
  }, [ready, radiusKm, userLocation?.lat, userLocation?.lng, darkMode]);

  // --- Approximate coach areas: a soft suburb-radius circle plus a profile
  // avatar at its centre. Neither layer represents an exact venue address. ---
  useEffect(() => {
    if (!ready) return;
    const L = leafletRef.current, map = mapRef.current;
    const nextIds = new Set(visibleCoaches.map(c => c.id));
    Object.keys(markersRef.current).forEach(id => {
      if (!nextIds.has(id)) { map.removeLayer(markersRef.current[id]); delete markersRef.current[id]; }
    });
    Object.keys(areaCirclesRef.current).forEach(id => {
      if (!nextIds.has(id)) { map.removeLayer(areaCirclesRef.current[id]); delete areaCirclesRef.current[id]; }
    });
    visibleCoaches.forEach(c => {
      const isSelected = selectedCoach?.id === c.id;
      const publicName = getPublicName(c, "public").name;
      const radiusMetres = (c.areaRadiusKm || DEFAULT_COACH_AREA_RADIUS_KM) * 1000;
      const areaStyle = {
        radius: radiusMetres, color: C.brand, weight: isSelected ? 2 : 1.5,
        opacity: isSelected ? 0.75 : 0.48, fillColor: C.brand,
        fillOpacity: isSelected ? 0.14 : 0.08, dashArray: "6 7", interactive: false,
      };
      if (areaCirclesRef.current[c.id]) {
        areaCirclesRef.current[c.id].setLatLng([c.areaPoint.lat, c.areaPoint.lng]);
        areaCirclesRef.current[c.id].setRadius(radiusMetres);
        areaCirclesRef.current[c.id].setStyle(areaStyle);
      } else {
        areaCirclesRef.current[c.id] = L.circle([c.areaPoint.lat, c.areaPoint.lng], areaStyle).addTo(map);
        areaCirclesRef.current[c.id].bringToBack();
      }

      const icon = coachAvatarMarkerIcon(C, L, c, isSelected);
      if (markersRef.current[c.id]) {
        markersRef.current[c.id].setLatLng([c.areaPoint.lat, c.areaPoint.lng]);
        markersRef.current[c.id].setIcon(icon);
        markersRef.current[c.id].__coachData = c;
      } else {
        const marker = L.marker([c.areaPoint.lat, c.areaPoint.lng], {
          icon, zIndexOffset: 300, keyboard: true,
          title: `${publicName} · approximate coach area`,
          alt: `Approximate coach area for ${publicName}`,
        });
        marker.__coachData = c;
        marker.on("click", () => selectHandlerRef.current(marker.__coachData));
        marker.addTo(map);
        markersRef.current[c.id] = marker;
      }
    });
  }, [ready, visibleCoachKey, selectedCoach?.id, darkMode]);

  // --- Zoom/pan to search matches ---
  useEffect(() => {
    if (!ready || !mapRef.current || !searchText.trim()) return;
    const L = leafletRef.current, map = mapRef.current;
    if (!searchFiltered.length) return;
    const bounds = L.latLngBounds(searchFiltered.map(c => [c.areaPoint.lat, c.areaPoint.lng]));
    map.flyToBounds(bounds, { padding: [70, 120], maxZoom: 12, duration: 0.6 });
  }, [ready, searchText]);

  const selectSuggestion = useCallback(s => { setSearchText(s.label); setShowSuggestions(false); }, []);
  const clearSearch = useCallback(() => setSearchText(""), []);
  const recenter = useCallback(() => {
    if (!mapRef.current) return;
    const loc = userLocationRef.current || FALLBACK_USER_LOCATION;
    mapRef.current.flyTo([loc.lat, loc.lng], LOCATE_ZOOM, { duration: 0.9, easeLinearity: 0.2 });
  }, []);

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 90, background: C.fog }}>
      {/* MAP — real Leaflet + OpenStreetMap tiles, panning/zooming handled by Leaflet itself */}
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />

      <MapSearchBar
        value={searchText}
        onChange={val => { setSearchText(val); setShowSuggestions(true); }}
        onClear={clearSearch}
        onClose={onClose}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
        showSuggestions={showSuggestions}
        suggestions={suggestions}
        onSelectSuggestion={selectSuggestion}
      />

      {ready && <LocationStatus locating={locating} fixed={locationFixed} />}
      {ready && (
        <button
          type="button"
          aria-label="Open map filters"
          aria-pressed={activeFilterCount > 0}
          onClick={onOpenFilters}
          style={{ position: "absolute", top: 78, right: 16, zIndex: 401, minWidth: 96, minHeight: 44, padding: "0 12px", borderRadius: 14, border: "none", background: activeFilterCount > 0 ? C.brandTint : C.white, color: activeFilterCount > 0 ? C.brand : C.jet, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", boxShadow: "none" }}
        >
          <SlidersHorizontal size={15} aria-hidden="true" />
          <span style={{ fontSize: T.labelLg, fontWeight: 700, ...fBody }}>Filters</span>
          {activeFilterCount > 0 && (
            <span aria-label={`${activeFilterCount} active filter categories`} style={{ minWidth: 20, height: 20, padding: "0 5px", borderRadius: 7, background: C.brand, color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: T.micro, fontWeight: 800, ...fBody }}>{activeFilterCount}</span>
          )}
        </button>
      )}

      {/* MAP STYLE — sits directly above the Locate Me button, bottom-right */}
      {ready && <MapStyleSwitcher styleId={mapStyleId} onChange={setMapStyleId} bottom={!isDesktop && selectedCoach ? 210 : 76} />}

      {/* RECENTER — bottom-right, flies back to the user's live location */}
      <button type="button" aria-label="Recenter map on my location" onClick={recenter} style={{ position: "absolute", bottom: !isDesktop && selectedCoach ? 158 : 24, right: 16, zIndex: 401, width: 44, height: 44, borderRadius: 12, background: C.white, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "bottom .2s ease", boxShadow: "none" }}>
        <LocateFixed size={19} color={C.jet} />
      </button>

      <SelectedCoachCard coach={selectedCoach} onOpen={onOpen} onClose={deselectCoach} />
    </div>
  );
}
