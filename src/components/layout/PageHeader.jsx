import React from "react";
import { ChevronLeft } from "lucide-react";
import { useColors } from "../../theme/ThemeContext";
import { LAYOUT, T, TD } from "../../theme/theme";
import { useApp } from "../../context/AppContext";

/* =========================================================================
   PageHeader — page-level title block.
     - Mobile: compact row (optional back button) + title/subtitle.
     - Desktop: optional breadcrumb trail above a larger title, actions on
       the right aligned to the baseline.
   Replaces the mobile `TopBar`/`ScreenHeader` usage on portal pages.
   ========================================================================= */

export function BackButton({ onClick, ariaLabel = "Go back", ghost, style }) {
  const C = useColors();
  const { darkMode } = useApp();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        width: 44,
        height: 44,
        flexShrink: 0,
        borderRadius: LAYOUT.pillRadius,
        background: ghost || darkMode ? "transparent" : C.fog,
        border: `1px solid ${ghost ? "transparent" : C.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        padding: 0,
        color: C.jet,
        transition: "background 0.14s ease, transform 0.14s ease",
        ...style,
      }}
    >
      <ChevronLeft size={19} strokeWidth={2.1} />
    </button>
  );
}

export function Breadcrumbs({ items, onNavigate, style }) {
  const C = useColors();
  if (!items?.length) return null;
  return (
    <nav aria-label="Breadcrumb" style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, ...style }}>
      {items.map((item, index) => {
        const last = index === items.length - 1;
        return (
          <React.Fragment key={`${item.label}-${index}`}>
            {index > 0 && <span aria-hidden="true" style={{ color: C.slateLight, fontSize: 12 }}>/</span>}
            {item.onClick && !last ? (
              <button
                type="button"
                onClick={item.onClick}
                style={{
                  border: "none",
                  background: "none",
                  padding: 0,
                  fontSize: 12,
                  fontWeight: 500,
                  color: C.slate,
                  cursor: "pointer",
                  textDecoration: "underline",
                  textUnderlineOffset: 2,
                }}
              >
                {item.label}
              </button>
            ) : (
              <span style={{ fontSize: 12, fontWeight: 600, color: last ? C.jet : C.slate }}>{item.label}</span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export function PageHeader({
  title,
  subtitle,
  onBack,
  breadcrumbs,
  onBreadcrumb,
  actions,
  icon: Icon,
  size = "default",
  margin = true,
  style,
}) {
  const C = useColors();
  const { isMobile } = useResponsive();

  const titleSize = isMobile
    ? size === "large" ? T.hero : T.heading
    : size === "large" ? 30 : TD.heading;

  const container = {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: margin ? (isMobile ? 18 : 22) : 0,
    ...style,
  };

  const left = (
    <div style={{ minWidth: 0, flex: 1 }}>
      {!isMobile && <Breadcrumbs items={breadcrumbs} onNavigate={onBreadcrumb} style={{ marginBottom: 8 }} />}
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        {onBack && <BackButton onClick={onBack} />}
        {Icon && (
          <span
            aria-hidden="true"
            style={{
              width: isMobile ? 36 : 44,
              height: isMobile ? 36 : 44,
              borderRadius: 13,
              flexShrink: 0,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: C.brandTint,
              color: C.brand,
            }}
          >
            <Icon size={isMobile ? 18 : 21} />
          </span>
        )}
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              margin: 0,
              fontSize: titleSize,
              lineHeight: 1.15,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: C.jet,
              fontFamily: "'Outfit', sans-serif",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p style={{ margin: "4px 0 0", fontSize: isMobile ? 12.5 : 16, lineHeight: 1.4, color: C.slate, fontFamily: "'Inter', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const right = actions ? (
    <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>{actions}</div>
  ) : null;

  if (isMobile && !actions) return <div>{left}</div>;

  return (
    <div style={container}>
      {left}
      {right}
    </div>
  );
}