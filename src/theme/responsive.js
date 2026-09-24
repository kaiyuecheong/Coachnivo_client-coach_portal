import { useEffect, useMemo, useState } from "react";
import { BP } from "./theme";

/* =========================================================================
   RESPONSIVE — breakpoint + pointer detection
   -------------------------------------------------------------------------
   Single source of truth for tier decisions in the portal. Components use
   this hook (or the plain helpers) instead of ad-hoc window checks.
   Generation source: Phase 3 responsive strategy.
   ========================================================================= */

export const TIERS = Object.freeze({ MOBILE: "sm", TABLET: "md", DESKTOP: "lg" });

/** Plain (non-reactive) breakpoint lookup for a given viewport width. */
export function getBreakpoint(width = typeof window !== "undefined" ? window.innerWidth : 0) {
  if (width < BP.sm) return TIERS.MOBILE;
  if (width < BP.md) return TIERS.TABLET;
  return TIERS.DESKTOP;
}

export function tierIndex(breakpoint) {
  return breakpoint === TIERS.MOBILE ? 0 : breakpoint === TIERS.TABLET ? 1 : 2;
}

/** Reactive matchMedia helper. */
export function useMediaQuery(query, initial = false) {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : initial
  );

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mql = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    setMatches(mql.matches);
    // matchMedia.addEventListener is standard; fall back to legacy addListener.
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    }
    mql.addListener(onChange);
    return () => mql.removeListener(onChange);
  }, [query]);

  return matches;
}

/**
 * useResponsive() — reactive tier + pointer capability.
 *
 * @returns {{
 *   breakpoint: "sm"|"md"|"lg",
 *   tier, isMobile, isTablet, isDesktop,
 *   isTouch, isHover,
 *   matches: { sm, md, lg },
 * }}
 */
export function useResponsive() {
  const sm = useMediaQuery(`(min-width: ${BP.sm}px)`);
  const md = useMediaQuery(`(min-width: ${BP.md}px)`);
  const lg = useMediaQuery(`(min-width: ${BP.lg}px)`);
  const hoverPointer = useMediaQuery("(hover: hover) and (pointer: fine)");
  const coarsePointer = useMediaQuery("(pointer: coarse)");

  return useMemo(() => {
    const breakpoint = lg ? TIERS.DESKTOP : md ? TIERS.TABLET : TIERS.MOBILE;
    return {
      breakpoint,
      tier: breakpoint,
      isMobile: !sm,
      isTablet: sm && !md,
      isDesktop: md,
      // Pointer: prefer hover capable; a stylus/touch may report both but we
      // only claim "touch" when coarse (finger) is the primary pointer.
      isTouch: coarsePointer,
      isHover: hoverPointer,
      matches: { sm, md, lg },
    };
  }, [sm, md, lg, hoverPointer, coarsePointer]);
}

/** Convenience: "is at least tablet (>= 640)" */
export function useIsTabletUp() {
  return useMediaQuery(`(min-width: ${BP.sm}px)`);
}

/** Convenience: "is at least desktop (>= 1024)" */
export function useIsDesktop() {
  return useMediaQuery(`(min-width: ${BP.md}px)`);
}