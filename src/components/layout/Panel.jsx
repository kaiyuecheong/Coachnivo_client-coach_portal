import ReactDOM from "react-dom";
import { X } from "lucide-react";
import { useColors } from "../../theme/ThemeContext";
import { LAYOUT, TD } from "../../theme/theme";
import { useOverlay } from "./useOverlay";

/* =========================================================================
   Panel — slide-over drawer (right side) for desktop context panes:
   chat booking context, notification center, settings flyouts.
   On mobile it behaves as a bottom sheet so the gesture stays familiar.
   ========================================================================= */

export function Panel({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = LAYOUT.rail.panelW,
  side = "right",
  withBackdrop = true,
}) {
  const C = useColors();
  const { ref, close } = useOverlay({ open, onClose });

  if (!open) return null;

  const horizontal = side === "right" ? "flex-end" : "flex-start";

  const panel = (
    <div style={{ position: "fixed", inset: 0, zIndex: 115, display: "flex", alignItems: "flex-end", justifyContent: horizontal, ...(side === "right" ? {} : {}) }}>
      {withBackdrop && (
        <button
          type="button"
          className="cl-backdrop"
          aria-label="Dismiss panel"
          onClick={close}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none", background: "rgba(22,24,29,.40)", backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)", animation: "clBackdropIn .2s ease", cursor: "default", touchAction: "none" }}
        />
      )}
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title || "Panel"}
        tabIndex={-1}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: width,
          height: "100%",
          background: C.white,
          color: C.jet,
          borderTopLeftRadius: 22,
          borderBottomLeftRadius: side === "right" ? 0 : 22,
          borderTopRightRadius: side === "left" ? 0 : 22,
          borderBottomRightRadius: side === "left" ? 22 : 0,
          borderTop: `1px solid ${C.border}`,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 60px -24px rgba(0,0,0,.4)",
          overflow: "hidden",
          animation: side === "right" ? "clPanelInRight .28s cubic-bezier(.32,.72,0,1)" : "clPanelInLeft .28s cubic-bezier(.32,.72,0,1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, padding: "18px 20px 10px", flexShrink: 0, borderBottom: `1px solid ${C.border}` }}>
          <div style={{ minWidth: 0 }}>
            {title && <div style={{ fontSize: TD.title, fontWeight: 700, fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.015em" }}>{title}</div>}
            {subtitle && <div style={{ fontSize: 12.5, color: C.slate, marginTop: 2, lineHeight: 1.4 }}>{subtitle}</div>}
          </div>
          <button
            type="button"
            className="cl-close-btn"
            onClick={close}
            aria-label="Close panel"
            style={{ width: 34, height: 34, flexShrink: 0, borderRadius: 99, background: C.fog, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.slate }}
          >
            <X size={16} />
          </button>
        </div>
        <div style={{ overflowY: "auto", overscrollBehavior: "contain", padding: 18, flex: 1, minHeight: 0 }} className="cl-hide-scrollbar">
          {children}
        </div>
        {footer && <div style={{ flexShrink: 0, padding: "14px 20px 18px", borderTop: `1px solid ${C.border}` }}>{footer}</div>}
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return ReactDOM.createPortal(panel, document.body);
}