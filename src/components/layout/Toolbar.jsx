import { useColors } from "../../theme/ThemeContext";
import { T } from "../../theme/theme";

/* =========================================================================
   Toolbar — horizontal action/filter bar.
     - Plain flex row; `wrap` on small widths; optional sticky header.
   ========================================================================= */

export function Toolbar({ children, justify = "space-between", wrap = true, sticky = false, label, style }) {
  const C = useColors();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: wrap ? "wrap" : "nowrap",
        gap: 12,
        justifyContent: justify,
        ...(label ? { marginBottom: 12 } : {}),
        ...(sticky ? { position: "sticky", top: 0, zIndex: 20 } : {}),
        ...style,
      }}
    >
      {label && (
        <span style={{ fontSize: T.labelLg, fontWeight: 700, color: C.jet, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
      )}
      {children}
    </div>
  );
}

/** ToolbarSpacer — pushes following items to the end. */
export function ToolbarSpacer({ flex = 1 }) {
  return <span aria-hidden="true" style={{ flex }} />;
}