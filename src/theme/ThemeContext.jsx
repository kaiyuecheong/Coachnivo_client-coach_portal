import React, { createContext, useContext, useEffect, useState } from "react";
import { applyTheme, CL, CD } from "./theme";
import { loadStored, saveStored, STORAGE_KEYS } from "../utils/persistence";
import { useApp } from "../context/AppContext";

/* =========================================================================
   THEME CONTEXT — dark/light for the portal shell
   -------------------------------------------------------------------------
   The app now owns dark mode (AppContext). useColors() prefers AppContext's
   darkMode so the whole tree uses one source of truth; ThemeProvider remains
   as a standalone fallback for scaffolding/isolated previews.
   ========================================================================= */

const ThemeContext = createContext({ darkMode: false, toggleDarkMode: () => {} });

export function useThemeMode() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeMode() must be used inside <ThemeProvider>");
  return ctx;
}

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => loadStored(STORAGE_KEYS.darkMode, false) === true);

  useEffect(() => {
    applyTheme(document.documentElement, darkMode ? "dark" : "light");
    saveStored(STORAGE_KEYS.darkMode, darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((v) => !v);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

/** Colors for the current mode — single source of truth is AppContext. */
export function useColors() {
  let darkMode = false;
  try {
    const app = useApp();
    if (app) darkMode = !!app.darkMode;
  } catch {
    darkMode = useContext(ThemeContext).darkMode;
  }
  return darkMode ? CD : CL;
}