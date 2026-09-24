/* =========================================================================
   COACHNIVO THEME SYSTEM
   -------------------------------------------------------------------------
   Two complete color palettes (light / dark) using:
     primaryColor   #0A1C2D   — main primary dark fill / dark mode
     brandColor     #EC5728   — main brand orange
     secondaryColor #EC5728   — brand shade 1 (highlights, accents)
     accentColor    #F38460   — brand shade 2 (lighter accent)
     surfaceColor   #FDF3EF   — page backgrounds / card surfaces
     brandTint      #FDECE6   — light soft brand fills (icon tiles, chips)

   IMPORTANT: text/neutral tokens (jet, jetSoft, slate, slateLight, border,
   onDark*) use #0A1C2D as the primary dark anchor. Primary CTA buttons are
   #0A1C2D in light mode, white in dark mode.

   Every token exists in both CL (light) and CD (dark) so components can
   switch at runtime:  const C = darkMode ? CD : CL;

   BELOW THE PALETTES: portal-oriented extensions — breakpoints, spacing
   scale, fluid/desktop type scale, and desktop LAYOUT overrides.
   ========================================================================= */

export const CL = {
  // ── primary palette (dark fill) ──────────────────────────────────
  primary: "#0A1C2D",
  primaryColor: "#0A1C2D",

  // ── brand palette ───────────────────────────────────────────────
  brandColor: "#EC5728",
  secondary: "#EC5728",
  accent: "#F38460",
  surface: "#FDF3EF",

  // ── neutral tokens (black / gray anchored on #0A1C2D) ───────────
  jet: "#0A1C2D",
  jetSoft: "#1B3147",
  slate: "#64748B",
  slateLight: "#94A3B8",
  border: "#E2E8F0",
  white: "#FFFFFF",
  black: "#0A1C2D",

  // ── brand semantic tokens (sunset orange) ────────────────────────
  brand: "#EC5728",
  brandTint: "#FDECE6",
  brandIcon: "#D44416",
  onBrand: "#FFFFFF",
  fog: "#F1F5F9",
  pageBg: "#FEFEFE",

  // ── functional tokens ───────────────────────────────────────────
  success: "#1E9E5A",
  successTint: "#E9F9EF",
  warnTint: "#FFF7ED",
  warnStrong: "#D97706",
  strong: "#D44416",
  strongTint: "#FDE8E1",
  error: "#DC2626",
  errorTint: "#FEE2E2",
  danger: "#D64545",
  dangerTint: "#FDECEC",
  dangerBorder: "#F3D2D2",
  dangerBorderSoft: "#E8A5A5",
  info: "#2563EB",
  live: "#22C55E",

  // ── text on dark backgrounds ────────────────────────────────────
  onDark: "#CBD5E1",
  onDarkMuted: "#94A3B8",
  onDarkFaint: "#64748B",
  onDarkDivider: "#1E3A54",
};

export const CD = {
  // ── primary palette ──────────────────────────────────────────────
  primary: "#06121E",
  primaryColor: "#06121E",

  // ── brand palette ───────────────────────────────────────────────
  brandColor: "#EC5728",
  secondary: "#F38460",
  accent: "#EC5728",
  surface: "#0B1B2B",

  // ── neutral tokens (inverted for dark bg with #06121E / #0B1B2B) ─
  jet: "#F1F5F9",
  jetSoft: "#E2E8F0",
  slate: "#94A3B8",
  slateLight: "#64748B",
  border: "#16304A",
  white: "#0B1B2B",
  black: "#FFFFFF",

  // ── brand semantic tokens (adjusted for dark bg) ───────────────
  brand: "#EC5728",
  brandTint: "#361B13",
  brandIcon: "#F38460",
  onBrand: "#FFFFFF",
  fog: "#122538",
  pageBg: "#06121E",
  card: "#0B1B2B",

  // ── functional tokens ───────────────────────────────────────────
  success: "#4CAF50",
  successTint: "#0A2518",
  warnTint: "#2A1D05",
  warnStrong: "#FBBF24",
  strong: "#EC5728",
  strongTint: "#2B160E",
  error: "#EF4444",
  errorTint: "#2D1010",
  danger: "#EF4444",
  dangerTint: "#2D1010",
  dangerBorder: "#401818",
  dangerBorderSoft: "#552020",
  info: "#60A5FA",
  live: "#4ADE80",

  // ── text on dark backgrounds ────────────────────────────────────
  onDark: "#CBD5E1",
  onDarkMuted: "#94A3B8",
  onDarkFaint: "#64748B",
  onDarkDivider: "#16304A",
};

export const C = CL;

export function updateFavicon(isDark) {
  if (typeof document === "undefined") return;
  const targetFavicon = isDark ? "/Favicon-white.png" : "/Favicon-dark.png";
  const links = document.querySelectorAll('link[rel*="icon"]');
  if (links.length === 0) {
    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/png";
    link.href = targetFavicon;
    document.head.appendChild(link);
  } else {
    links.forEach((l) => {
      if (!l.media || (l.media.includes("dark") && isDark) || (l.media.includes("light") && !isDark)) {
        l.href = targetFavicon;
      }
    });
  }
}

export function applyTheme(docElement, mode, themeColorOverride) {
  docElement.setAttribute("data-theme", mode);
  docElement.style.colorScheme = mode;
  const isDark = mode === "dark";
  const themeColor = themeColorOverride || (isDark ? CD.white : CL.white);
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = themeColor;
  updateFavicon(isDark);
}

/* =========================================================================
   TYPOGRAPHY — mobile baseline (unchanged from the mobile app)
   ========================================================================= */

/** Numeric baseline for every semantic step (mobile-proportioned). */
const T_NUMERIC = {
  micro: 12,
  tiny: 12,
  caption: 14,
  captionLg: 14,
  label: 14,
  labelLg: 16,
  support: 12.5,
  body: 13,
  bodyLg: 13.5,
  subtitle: 14,
  subtitleLg: 15,
  title: 16,
  titleLg: 17,
  heading: 18,
  headingLg: 20,
  display: 22,
  displayLg: 24,
  hero: 26,
  heroLg: 32,
};

/**
 * Semantic type tokens. All semantic steps are responsive via CSS variables
 * in index.css so every `fontSize: T.*` automatically scales to at least 14pt
 * on desktop (and 16pt for tabs/labels).
 */
export const T = {
  ...T_NUMERIC,
  micro: "var(--cl-text-micro)",
  tiny: "var(--cl-text-tiny)",
  caption: "var(--cl-text-caption)",
  captionLg: "var(--cl-text-caption-lg)",
  label: "var(--cl-text-label)",
  labelLg: "var(--cl-text-label-lg)",
  support: "var(--cl-text-support)",
  body: "var(--cl-text-body)",
  bodyLg: "var(--cl-text-body-lg)",
  subtitle: "var(--cl-text-subtitle)",
  subtitleLg: "var(--cl-text-subtitle-lg)",
  title: "var(--cl-text-title)",
  titleLg: "var(--cl-text-title-lg)",
  heading: "var(--cl-text-heading)",
  headingLg: "var(--cl-text-heading-lg)",
  display: "var(--cl-text-display)",
  displayLg: "var(--cl-text-display-lg)",
  hero: "var(--cl-text-hero)",
  heroLg: "var(--cl-text-hero-lg)",
};

/** Desktop-preferred values for the same semantic steps. Used as the max
    bound of the fluid scale and directly by desktop-only components.
    Guarantees no desktop text size is below 14pt, and tab labels are 16pt. */
export const TD = {
  micro: 14,
  tiny: 14,
  caption: 14,
  captionLg: 14,
  label: 14,
  labelLg: 16,
  support: 14,
  body: 16,
  bodyLg: 16,
  subtitle: 16,
  subtitleLg: 17,
  title: 18,
  titleLg: 19,
  heading: 21,
  headingLg: 23,
  display: 26,
  displayLg: 28,
  hero: 32,
  heroLg: 40,
};

/* =========================================================================
   PORTAL EXTENSIONS — BREAKPOINTS, SPACING, FLUID TYPE
   ========================================================================= */

/** Breakpoint tokens. Layout tiers are min-widths. */
export const BP = { sm: 640, md: 1024, lg: 1440 };

/** Spacing scale (px). Use SPACE[k] instead of raw pixel gutters so every
    tier scales from one grid unit. */
export const SPACE = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 32, 8: 48 };

/**
 * Fluid clamp between a mobile size and a desktop size.
 * Linear over 360px → 1600px viewports; safest fallback is [min, max]px.
 */
export function fluid(min, max, vwMin = 360, vwMax = 1600) {
  const minN = Number(min);
  const maxN = Number(max);
  const step = ((maxN - minN) / (vwMax - vwMin)).toFixed(6);
  return `clamp(${minN}px, calc(${minN}px + (100vw - ${vwMin}px) * ${step}), ${maxN}px)`;
}

/** Fluid mirror of the type scale (mobile min → desktop max). */
export const T_FLUID = Object.fromEntries(
  Object.keys(T_NUMERIC).map((key) => [key, fluid(T_NUMERIC[key], TD[key])])
);

/* =========================================================================
   LAYOUT RHYTHM — mobile baseline (unchanged) + desktop/tablet overrides
   ========================================================================= */

export const LAYOUT = {
  statusBarH: 48,
  topBarH: 56,
  pagePadX: 18,
  pagePadTop: 16,
  headerPadTop: 6,
  tabClearance: 116,       // scroll padding on tab screens so content clears the floating tab island
  ctaPadBottom: 28,        // minimum safe-area padding for bottom-fixed action bars
  touchTarget: 44,
  cardRadius: 18,
  inputRadius: 13,
  buttonRadius: 14,
  sheetRadius: 26,
  pillRadius: 999,

  // ── portal overrides (Phase 4) ──────────────────────────────────
  desktop: {
    pagePadX: 64,
    pagePadTop: 40,
    topBarH: 64,
    sideNavW: 248,
    iconRailW: 72,
    contentMaxW: 1280,
    cardRadius: 20,
    inputRadius: 12,
    buttonRadius: 12,
    controlH: 44,
  },
  tablet: {
    pagePadX: 24,
    pagePadTop: 20,
    topBarH: 60,
  },

  /** Widths used by SplitView / dialogs / panels. */
  rail: {
    summaryW: 340,
    dialogW: 480,
    dialogWideW: 620,
    panelW: 380,
    mastheadH: 64,
  },
};

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

export const CONTAINER_MAX_WIDTHS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1440,
  full: "100%",
};

export const WEB_SHADOWS = {
  subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)",
  card: "0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.04)",
  dropdown: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  modal: "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
};

/* =========================================================================
   FONTS
   ========================================================================= */

const FONT_IMPORT_ID = "coachnivo-fonts";
export function useFonts() {
  const linkId = FONT_IMPORT_ID;
  if (typeof document === "undefined") return;
  if (document.getElementById(linkId)) return;
  const link = document.createElement("link");
  link.id = linkId;
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap";
  document.head.appendChild(link);
}

export const fDisplay = { fontFamily: "'Outfit', sans-serif" };
export const fBody = { fontFamily: "'Inter', sans-serif" };

/* =========================================================================
   ASSETS
   ========================================================================= */

export const LOGO_WHITE_SRC = "/coachnivo-logo_white.png";
export const LOGO_BLACK_SRC = "/coachnivo-logo_black.png";
export const LOGO_SRCS = {
  black: "/coachnivo-logo_black.png",
  white: "/coachnivo-logo_white.png",
  logo: "/coachnivo-logo_black.png",
};

/* =========================================================================
   KEYFRAMES — carried from the mobile app so transistions stay identical
   ========================================================================= */

export const KEYFRAMES = `
@keyframes clPulse { 0%,100%{opacity:1} 50%{opacity:.25} }
@keyframes clFadeUp { from{opacity:0; transform:translateY(6px)} to{opacity:1; transform:translateY(0)} }
@keyframes clFadeIn { from{opacity:0} to{opacity:1} }
@keyframes clSlideUp { from{opacity:0; transform:translateY(14px)} to{opacity:1; transform:translateY(0)} }
@keyframes clScaleIn { from{opacity:0; transform:scale(.94)} to{opacity:1; transform:scale(1)} }
@keyframes clSheetUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
@keyframes clPanelInRight { from{transform:translateX(100%)} to{transform:translateX(0)} }
@keyframes clPanelInLeft { from{transform:translateX(-100%)} to{transform:translateX(0)} }
@keyframes clBackdropIn { from{opacity:0} to{opacity:1} }
@keyframes clSpin { to { transform: rotate(360deg); } }
@keyframes clPopIn { from{opacity:0; transform:scale(.85)} to{opacity:1; transform:scale(1)} }
@keyframes clScreenIn { from{opacity:0; transform:translateY(10px) scale(.995)} to{opacity:1; transform:translateY(0) scale(1)} }
@keyframes clToastIn { from{opacity:0; transform:translateY(10px) scale(.97)} to{opacity:1; transform:translateY(0) scale(1)} }
@keyframes clTabBounce { 0%{transform:translateY(0)} 40%{transform:translateY(-3px)} 100%{transform:translateY(0)} }
@keyframes clTouchFade { 0%{opacity:.85; transform:translate(-50%,-50%) scale(.55)} 55%{opacity:.35} 100%{opacity:0; transform:translate(-50%,-50%) scale(1.2)} }
@keyframes clSkeleton { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
@keyframes clHeroFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
@keyframes clShake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
.cl-hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.cl-hide-scrollbar::-webkit-scrollbar { display: none; width: 0; height: 0; }
.cl-swipe-row { -webkit-overflow-scrolling: touch; touch-action: pan-x; scroll-snap-type: x proximity; overscroll-behavior-x: contain; }
.cl-swipe-row > * { scroll-snap-align: start; }
.cl-pressable { transition: transform .14s cubic-bezier(.2,.7,.3,1), opacity .18s ease; }
.cl-pressable:active { transform: scale(.97); }
/* List entrances stay quiet: a single opacity fade (per-card slide-up reads as
   a template default — frontend-design skill). Action-driven motion stays. */
.cl-stagger > * { animation: clFadeIn .3s ease backwards; }
`;