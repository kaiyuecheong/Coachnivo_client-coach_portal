import ReactDOM from "react-dom";
import { X } from "lucide-react";
import { useColors } from "../../theme/ThemeContext";
import { LAYOUT, TD } from "../../theme/theme";
import { useResponsive } from "../../theme/responsive";
import { useOverlay } from "./useOverlay";

/* =========================================================================
   Dialog — desktop modal (replaces the mobile BottomSheet on md/lg tiers).
   Centered card + scrim, focus trap, Esc-to-close, aria-modal.
   Rendered through a portal to <body> so it escapes any scroll container.
   ========================================================================= */

export function Dialog({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width,
  wide = false,
  maxHeight = "min(720px, 88vh)",
  hideClose = false,
  portal = true,
}) {
  const C = useColors();
  const { isDesktop } = useResponsive();
  const { ref, close } = useOverlay({ open, onClose });

  if (!open) return null;

  const panelWidth = width || (wide ? LAYOUT.rail.dialogWideW : LAYOUT.rail.dialogW);

  // Mobile tier: keep a bottom-sheet feel for familiarity (slide up).
  const isSheet = !isDesktop;

  const panel = (
    <div style={{ position: "fixed", inset: 0, zIndex: 120, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 16px" }}>
      <button
        type="button"
        aria-label="Dismiss dialog"
        onClick={close}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none", background: "rgba(22,24,29,.45)", backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)", animation: "clBackdropIn .2s ease", cursor: "default", touchAction: "none" }}
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title || "Dialog"}
        tabIndex={-1}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: panelWidth,
          maxHeight,
          background: C.white,
          color: C.jet,
          borderRadius: 22,
          border: `1px solid ${C.border}`,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 60px -20px rgba(0,0,0,.35)",
          overflow: "hidden",
          animation: "clScaleIn .22s cubic-bezier(.16, 1, 0.3, 1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, padding: "18px 20px 8px", flexShrink: 0 }}>
          <div style={{ minWidth: 0 }}>
            {title && <div style={{ fontSize: isSheet ? 17 : TD.titleLg, fontWeight: 700, fontFamily: "'Outfit', sans-serif", lineHeight: 1.25, letterSpacing: "-0.015em" }}>{title}</div>}
            {subtitle && <div style={{ fontSize: 12.5, color: C.slate, marginTop: 3, lineHeight: 1.4 }}>{subtitle}</div>}
          </div>
          {!hideClose && (
            <button
              type="button"
              onClick={close}
              aria-label="Close dialog"
              style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 99, background: darkMode ? "transparent" : C.fog, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.slate }}
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div style={{ overflowY: "auto", overscrollBehavior: "contain", padding: "8px 20px 20px", flex: 1, minHeight: 0 }} className="cl-hide-scrollbar">
          {children}
        </div>
        {footer && (
          <div style={{ flexShrink: 0, padding: "12px 20px 18px", borderTop: `1px solid ${C.border}`, background: C.white, display: "flex", flexDirection: "column", gap: 10 }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  if (!portal) return panel;
  if (typeof document === "undefined") return null;
  return ReactDOM.createPortal(panel, document.body);
}