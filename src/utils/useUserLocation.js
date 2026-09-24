import React, { useState, useEffect, useCallback } from "react";
import { FALLBACK_USER_LOCATION, DEFAULT_LOCATION_LABEL } from "../lib/mapUtils";

// Bounding box for Australia (approx. Lat -44 to -10, Lng 112 to 154)
function isWithinAustralia(lat, lng) {
  return lat <= -10 && lat >= -44 && lng >= 112 && lng <= 154;
}

/* =========================================================================
   USER LOCATION HOOK — Extracted to avoid circular dependencies between
   AppContext and StateSystem.
   Defaults to Chatswood, Sydney.
   ========================================================================= */
export function useUserLocation() {
  const [userLocation, setUserLocation] = useState(FALLBACK_USER_LOCATION);
  const [locating, setLocating] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [manualLabel, setManualLabel] = useState(DEFAULT_LOCATION_LABEL);

  const requestLocation = useCallback(() => {
    setLocating(true);
    setPermissionDenied(false);

    if (!navigator.geolocation) {
      setUserLocation(FALLBACK_USER_LOCATION);
      setManualLabel(DEFAULT_LOCATION_LABEL);
      setLocating(false);
      setPermissionDenied(true);
      return;
    }

    const fallbackTimer = setTimeout(() => {
      setUserLocation(FALLBACK_USER_LOCATION);
      setManualLabel(DEFAULT_LOCATION_LABEL);
      setLocating(false);
    }, 4000);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(fallbackTimer);
        const { latitude, longitude } = pos.coords;
        if (isWithinAustralia(latitude, longitude)) {
          setUserLocation({ lat: latitude, lng: longitude });
          setManualLabel(null);
        } else {
          // If browser/device coordinates are outside Australia (e.g. testing emulator),
          // maintain default location at Chatswood, Sydney
          setUserLocation(FALLBACK_USER_LOCATION);
          setManualLabel(DEFAULT_LOCATION_LABEL);
        }
        setLocating(false);
      },
      (err) => {
        clearTimeout(fallbackTimer);
        setUserLocation(FALLBACK_USER_LOCATION);
        setManualLabel(DEFAULT_LOCATION_LABEL);
        setLocating(false);
        setPermissionDenied(err?.code === 1);
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 }
    );
  }, []);

  const setManualLocation = useCallback((loc, label) => {
    setUserLocation(loc || FALLBACK_USER_LOCATION);
    setManualLabel(label || DEFAULT_LOCATION_LABEL);
    setLocating(false);
    setPermissionDenied(false);
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return { userLocation, locating, permissionDenied, manualLabel, requestLocation, setManualLocation };
}
