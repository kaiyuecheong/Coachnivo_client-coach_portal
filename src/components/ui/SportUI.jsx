import React from "react";
import { CL, CD, fBody, T, LAYOUT } from "../../theme/theme";
import { useApp } from "../../context/AppContext";
import { SPORT_NAMES, getSportDefinition, getSportLabel } from "../../data/sports";
import { SearchMultiSelect, SearchSelect } from "./Primitives";

function useColors() {
  const { darkMode } = useApp();
  return darkMode ? CD : CL;
}

export function SportIcon({ sport, size = 18, color = "currentColor", title, style }) {
  const definition = getSportDefinition(sport);
  return (
    <svg
      aria-hidden={title ? undefined : "true"}
      role={title ? "img" : undefined}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      focusable="false"
      style={{ display: "block", flexShrink: 0, ...style }}
    >
      {title && <title>{title}</title>}
      {definition.customIcon === "netball" ? (
        <g fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M4.2 7.5c4.6 2.3 10.7 1.6 15.4-2M4.9 17.7c4.5-2.6 10.6-2.1 14.4.8M9.1 3.5c1.8 4.2 1.2 10.8-2.4 15.2M15.1 4.1c-1.4 4.4-.6 10.6 2.4 14.2" />
        </g>
      ) : <path d={definition.icon} />}
    </svg>
  );
}

export function SportLabel({ sport, size = 16, color = "currentColor", label, style }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, minWidth: 0, color, ...style }}>
      <SportIcon sport={sport} size={size} />
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label || getSportLabel(sport)}</span>
    </span>
  );
}

export function SportBadge({ sport, selected = false, onClick, compact = false, label, style }) {
  const C = useColors();
  const Component = onClick ? "button" : "span";
  const bg = selected ? C.brand : C.brandTint;
  const fg = selected ? "#FFFFFF" : C.jet;
  const iconColor = selected ? "#FFFFFF" : C.brand;
  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      aria-pressed={onClick ? selected : undefined}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: compact ? 5 : 7,
        minHeight: 0,
        padding: compact ? "6px 10px" : "6px 13px",
        borderRadius: LAYOUT.pillRadius,
        border: "none",
        background: bg,
        color: fg,
        cursor: onClick ? "pointer" : "default",
        fontSize: compact ? T.captionLg : T.body,
        fontWeight: selected ? 700 : 600,
        lineHeight: 1,
        whiteSpace: "nowrap",
        boxSizing: "border-box",
        ...fBody,
        ...style,
      }}
    >
      <SportIcon sport={sport} size={compact ? 13 : 15} color={iconColor} />
      <span>{label || getSportLabel(sport)}</span>
    </Component>
  );
}

export function SportTile({ sport, selected = false, onClick, style }) {
  const C = useColors();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      style={{
        minHeight: 58, display: "flex", alignItems: "center", gap: 10,
        padding: "8px 10px", borderRadius: 14,
        border: `1px solid ${selected ? C.brand : C.border}`,
        background: selected ? C.brandTint : C.white,
        color: selected ? C.brand : C.jet,
        cursor: "pointer", textAlign: "left", fontSize: T.body, fontWeight: selected ? 700 : 600,
        boxSizing: "border-box", ...fBody, ...style,
      }}
    >
      <span style={{ width: 36, height: 36, borderRadius: 11, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: selected ? C.brand : C.brandTint, color: selected ? "#FFFFFF" : C.brand }}>
        <SportIcon sport={sport} size={20} color={selected ? "#FFFFFF" : C.brand} />
      </span>
      <span style={{ lineHeight: 1.2 }}>{getSportLabel(sport)}</span>
    </button>
  );
}

export function renderSportOption(sport) {
  const C = useColors();
  return <SportLabel sport={sport} size={17} color={C.brand} />;
}

export function SportSearchSelect({ options = SPORT_NAMES, allowCustom = true, ...props }) {
  return (
    <SearchSelect
      {...props}
      options={options}
      allowCustom={allowCustom}
      renderOption={renderSportOption}
      renderValue={renderSportOption}
    />
  );
}

export function SportSearchMultiSelect({ options = SPORT_NAMES, ...props }) {
  return (
    <SearchMultiSelect
      {...props}
      options={options}
      renderOption={renderSportOption}
      renderValue={renderSportOption}
    />
  );
}
