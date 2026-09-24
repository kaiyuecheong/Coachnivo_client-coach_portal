import { useResponsive } from "../../theme/responsive";

/* =========================================================================
   Grid — responsive column grid with per-tier column counts.
   Usage: <Grid cols={1} sm={2} md={3} lg={4} gap={20}>…</Grid>
   Each child is a minmax(0,1fr) track so cards never overflow.
   ========================================================================= */

export function Grid({
  cols = 1,
  sm,
  md,
  lg,
  gap = 20,
  align,
  justify,
  style,
  children,
}) {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const columns = isDesktop ? (lg ?? md ?? sm ?? cols) : isTablet ? (md ?? sm ?? cols) : cols;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap: typeof gap === "number" ? `${gap}px` : gap,
        alignItems: align,
        justifyContent: justify,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Column — explicit span for a Grid track. */
export function Column({ span = 1, minWidth = 0, style, children }) {
  return <div style={{ gridColumn: `span ${span}`, minWidth, ...style }}>{children}</div>;
}

/** Stack — vertical flex with gap (mobile-friendly spacer). */
export function Stack({ gap = 16, divider = false, align, style, children }) {
  const items = Array.isArray(children) ? children : [children];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: typeof gap === "number" ? `${gap}px` : gap, alignItems: align, ...style }}>
      {items.map((child, index) => (
        <div key={index} style={{ width: "100%", ...(divider && index > 0 ? { borderTop: "1px solid var(--cl-border)", paddingTop: gap / 2 } : {}) }}>
          {child}
        </div>
      ))}
    </div>
  );
}

/** Row — horizontal flex with gap; wraps on small screens. */
export function Row({ gap = 12, wrap = true, align = "center", justify, style, children }) {
  return (
    <div style={{ display: "flex", alignItems: align, justifyContent: justify, gap: typeof gap === "number" ? `${gap}px` : gap, flexWrap: wrap ? "wrap" : "nowrap", ...style }}>
      {children}
    </div>
  );
}