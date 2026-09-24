import { useColors } from "../../theme/ThemeContext";
import { LAYOUT } from "../../theme/theme";
import { useResponsive } from "../../theme/responsive";

/* =========================================================================
   ContentPage — outer page column with responsive gutters + max width.
   Every converted screen wraps its root in this primitive (Phase 5).
   ========================================================================= */

export function ContentPage({
  children,
  maxWidth = LAYOUT.desktop.contentMaxW,
  top,
  bottom,
  flush = false,
  style,
}) {
  const C = useColors();
  const { isMobile } = useResponsive();

  const padX = isMobile ? LAYOUT.pagePadX : LAYOUT.desktop.pagePadX;
  const padTop = top ?? (isMobile ? LAYOUT.pagePadTop : LAYOUT.desktop.pagePadTop);
  const padBottom = bottom ?? (flush ? 0 : isMobile ? 108 : 56);

  return (
    <div
      style={{
        width: "100%",
        maxWidth,
        marginInline: "auto",
        padding: `${padTop}px ${padX}px ${padBottom}px`,
        color: C.jet,
        ...style,
      }}
    >
      {children}
    </div>
  );
}