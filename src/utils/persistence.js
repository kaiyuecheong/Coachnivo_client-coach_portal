/* Namespaced localStorage helpers so prototype state (favourites, filters,
   dark mode, discovery preferences) survives reloads without leaking keys.
   All access is guarded — storage can be unavailable or full. */

const PREFIX = "coachnivo.";

export const STORAGE_KEYS = {
  darkMode: "dark-mode",
  favorites: "favorites",
  clientFilters: "client-filters",
  discoveryPrefs: "discovery-prefs",
};

export function loadStored(key, fallback) {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw == null) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function saveStored(key, value) {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* unavailable */
  }
}

export function clearStored(key) {
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    /* unavailable */
  }
}
