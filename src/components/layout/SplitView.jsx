import { useResponsive } from "../../theme/responsive";
import { useColors } from "../../theme/ThemeContext";
import { LAYOUT } from "../../theme/theme";

/* =========================================================================
   SplitView — master/detail splitter.
     - Desktop (≥1024): side-by-side panes. `left` = rail/summary,
       `right` = content. Left can be sticky.
     - Below desktop: panes stack vertically (left above right) so mobile
       flows keep their existing single-column order.
   Used by coach profile + booking checkout + messaging on desktop.
   ========================================================================= */

export function SplitView({
  left,
  right,
  minLeft = 340,
  ratio = null, // e.g. "1fr 2fr" — overrides minLeft when provided
  gap = 24,
  stickyLeft = false,
  leftStyle,
  rightStyle,
  style,
  order = { left: 1, right: 2 },
}) {
  const { isDesktop } = useResponsive();

  if (!isDesktop) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: typeof gap === "number" ? `${gap}px` : gap, ...style }}>
        <div style={{ order: order.left, ...leftStyle }}>{left}</div>
        <div style={{ order: order.right, ...rightStyle }}>{right}</div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: ratio || `${minLeft}px minmax(0, 1fr)`,
        gap: typeof gap === "number" ? `${gap}px` : gap,
        alignItems: "start",
        ...style,
      }}
    >
      <div style={{ minWidth: 0, ...(stickyLeft ? { position: "sticky", top: 16 } : {}), ...leftStyle }}>{left}</div>
      <div style={{ minWidth: 0, ...rightStyle }}>{right}</div>
    </div>
  );
}

/** RightSummary — helper card column for sticky booking/order sidebars. */
export function RightSummary({ sticky = true, children, style }) {
  const C = useColors();
  return (
    <div
      style={{
        background: C.white,
        border: `1px solid ${C.border}`,
        borderRadius: LAYOUT.desktop.cardRadius,
        padding: 18,
        boxShadow: "0 6px 24px -18px rgba(22,24,29,0.35)",
        ...(sticky ? { position: "sticky", top: 84 } : {}),
        ...style,
      }}
    >
      {children}
    </div>
  );
}