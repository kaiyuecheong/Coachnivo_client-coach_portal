import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft, ChevronRight, ChevronDown, Check, Star, CheckCircle2, Search, Wifi, Battery, AlertTriangle, CalendarDays, List, X,
} from "lucide-react";
import { CL, CD, fDisplay, fBody, T, TD, LAYOUT } from "../../theme/theme";
import { useApp } from "../../context/AppContext";
import { useResponsive } from "../../theme/responsive";
import { initials, hashColor, avatarForName } from "../../utils/avatar";

/* =========================================================================
   SHARED UI PRIMITIVES
   Every component calls useApp() to get darkMode, then computes C so the
   entire UI switches between CL (light) and CD (dark) at runtime.
   ========================================================================= */

function useColors() {
  try {
    const app = useApp();
    const darkMode = app?.darkMode ?? false;
    return (darkMode ? CD : CL) || CL;
  } catch (e) {
    return CL;
  }
}

/** Brand-orange asterisk marking a field/section as required. */
export function RequiredMark() {
  const C = useColors();
  return (
    <span aria-hidden="true" title="Required" style={{ color: C.brand, fontWeight: 700, marginLeft: 1 }}>*</span>
  );
}

export function Spinner({ size = 15, color }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: size, height: size, borderRadius: "50%", flexShrink: 0,
        border: "2px solid currentColor", borderTopColor: "transparent",
        opacity: 0.9, color: color || "currentColor",
        animation: "clSpin .7s linear infinite", display: "inline-block",
      }}
    />
  );
}

export function Btn({ children, onClick, variant = "primary", full, icon: Icon, disabled, loading, loadingText, size = "md", type = "button", ariaLabel, title, style, className }) {
  const C = useColors();
  const iconOnly = !!Icon && !children;
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    borderRadius: LAYOUT.buttonRadius, fontWeight: 600, cursor: (disabled || loading) ? "default" : "pointer",
    border: "1px solid transparent",
    transition: "opacity .16s ease, transform .14s cubic-bezier(.2,.7,.3,1), background .15s ease, box-shadow .16s ease, filter .14s ease",
    opacity: disabled ? 0.5 : 1, width: full ? "100%" : "auto", minWidth: iconOnly && !full ? 56 : undefined, minHeight: 56,
    boxSizing: "border-box",
    padding: iconOnly ? 0 : "0 24px",
    fontSize: size === "sm" ? T.body : T.subtitleLg, ...fBody,
  };
  const { darkMode } = useApp();
  const variants = {
    primary: { background: C.black, color: C.white, boxShadow: "0 6px 16px -6px rgba(0,0,0,.28)" },
    dark: { background: C.jet, color: C.white },
    secondary: { background: darkMode ? "transparent" : C.fog, color: C.jet, border: `1px solid ${C.border}` },
    outline: { background: "transparent", color: C.jet, border: `1px solid ${C.border}` },
    ghost: { background: "transparent", color: C.slate },
    danger: { background: "transparent", color: C.danger, border: `1px solid ${C.dangerBorder}` },
  };
  const btnClass = ["cl-btn", `cl-btn--${variant}`, full ? "cl-btn--full" : "", className].filter(Boolean).join(" ");
  return (
    <button type={type} disabled={disabled || loading} aria-busy={loading || undefined} aria-label={ariaLabel} title={title} onClick={(disabled || loading) ? undefined : onClick} className={btnClass} style={{ ...base, ...variants[variant], ...style }}>
      {loading ? <Spinner size={size === "sm" ? 13 : 15} /> : (Icon && <Icon aria-hidden="true" size={size === "sm" ? 14 : 17} strokeWidth={2.3} />)}
      {loading ? (loadingText || children) : children}
    </button>
  );
}

export function ScrollFadeRow({ children, style, className }) {
  const C = useColors();
  const ref = useRef(null);
  const [state, setState] = useState({ left: false, right: false });

  const measure = () => {
    const el = ref.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setState({
      left: scrollLeft > 4,
      right: scrollLeft + clientWidth < scrollWidth - 4,
    });
  };

  useEffect(() => {
    measure();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, [children]);

  return (
    <div style={{ position: "relative" }}>
      <div ref={ref} onScroll={measure} className={["cl-hide-scrollbar", className].filter(Boolean).join(" ")} style={style}>
        {children}
      </div>
      {state.left && (
        <div style={{ position: "absolute", top: 0, bottom: 4, left: 0, width: 28, pointerEvents: "none", background: `linear-gradient(90deg, ${C.white}, rgba(255,255,255,0))` }} />
      )}
      {state.right && (
        <div style={{ position: "absolute", top: 0, bottom: 4, right: 0, width: 28, pointerEvents: "none", background: `linear-gradient(270deg, ${C.white}, rgba(255,255,255,0))` }} />
      )}
    </div>
  );
}

export function Card({ children, style, onClick, ariaLabel, className }) {
  const C = useColors();
  return (
    <div
      onClick={onClick}
      onKeyDown={onClick ? (event) => {
        if (event.currentTarget !== event.target) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick(event);
        }
      } : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ariaLabel}
      data-interactive={onClick ? "true" : "false"}
      className={["cl-card", onClick ? "cl-card--interactive" : "", className].filter(Boolean).join(" ")}
      style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: LAYOUT.cardRadius, padding: 14, cursor: onClick ? "pointer" : "default", ...style }}
    >
      {children}
    </div>
  );
}

export function Chip({ children, active, onClick, icon: Icon, compact, className }) {
  const C = useColors();
  return (
    <button
      type="button"
      onClick={onClick}
      className={["cl-btn", "cl-chip", className].filter(Boolean).join(" ")}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6, padding: compact ? "3px 11px" : "6px 12px",
        borderRadius: LAYOUT.pillRadius, minHeight: compact ? 30 : 40,
        fontSize: T.body, fontWeight: compact ? 600 : 500, whiteSpace: "nowrap", border: `1px solid ${active ? C.brand : C.border}`,
        background: active ? C.brandTint : C.white, color: active ? (C.brandIcon || C.brandColor) : C.jet, ...fBody,
      }}
    >
      {Icon && <Icon size={compact ? 14 : 15} />}
      {children}
    </button>
  );
}

export function Skeleton({ w = "100%", h = 12, radius = 8, style }) {
  const C = useColors();
  return (
    <span
      aria-hidden="true"
      style={{
        display: "block", width: w, height: h, borderRadius: radius,
        background: `linear-gradient(90deg, ${C.fog} 25%, ${C.white} 55%, ${C.fog} 85%)`,
        backgroundSize: "200% 100%", animation: "clSkeleton 1.4s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

export function CoachCardSkeleton({ rows = 3 }) {
  const C = useColors();
  return (
    <div aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} style={{ marginBottom: 12, padding: 14, borderRadius: LAYOUT.cardRadius, border: `1px solid ${C.border}`, background: C.white, opacity: 1 - i * 0.12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "52px minmax(0, 1fr) auto", gap: 12, alignItems: "start" }}>
            <Skeleton w={52} h={52} radius={99} style={{ flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <Skeleton w="58%" h={13} radius={7} />
              <Skeleton w="34%" h={10} radius={7} style={{ marginTop: 7 }} />
              <Skeleton w="46%" h={10} radius={7} style={{ marginTop: 8 }} />
            </div>
            <div style={{ textAlign: "right" }}>
              <Skeleton w={44} h={16} radius={7} style={{ flexShrink: 0 }} />
              <Skeleton w={32} h={9} radius={7} style={{ marginTop: 6, flexShrink: 0 }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
            <Skeleton w={56} h={22} radius={99} />
            <Skeleton w={48} h={22} radius={99} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ThreadSkeleton({ rows = 4 }) {
  const C = useColors();
  return (
    <div aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 4px", borderBottom: `1px solid ${C.border}`, opacity: 1 - i * 0.1 }}>
          <Skeleton w={46} h={46} radius={99} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <Skeleton w="40%" h={12} radius={7} />
              <Skeleton w={32} h={9} radius={7} />
            </div>
            <Skeleton w="70%" h={10} radius={7} style={{ marginTop: 8 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatSkeleton({ count = 3 }) {
  const C = useColors();
  return (
    <div aria-hidden="true" style={{ display: "flex", gap: 8 }}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={{ flex: 1, background: C.fog, borderRadius: 14, padding: "10px 12px", opacity: 1 - i * 0.1 }}>
          <Skeleton w="60%" h={16} radius={7} />
          <Skeleton w="80%" h={9} radius={7} style={{ marginTop: 6 }} />
        </div>
      ))}
    </div>
  );
}

export function BookingCardSkeleton({ rows = 3 }) {
  const C = useColors();
  return (
    <div aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} style={{ marginBottom: 12, padding: 14, borderRadius: LAYOUT.cardRadius, border: `1px solid ${C.border}`, background: C.white, opacity: 1 - i * 0.12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <Skeleton w="55%" h={13} radius={7} />
              <Skeleton w="40%" h={10} radius={7} style={{ marginTop: 8 }} />
            </div>
            <Skeleton w={64} h={22} radius={99} style={{ flexShrink: 0 }} />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <Skeleton w={72} h={10} radius={7} />
            <Skeleton w={48} h={10} radius={7} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  const C = useColors();
  return (
    <div aria-hidden="true">
      <Skeleton w="100%" h={188} radius={0} style={{ flexShrink: 0 }} />
      <div style={{ padding: "0 18px", marginTop: -32 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 14 }}>
          <Skeleton w={72} h={72} radius={99} style={{ border: `3px solid ${C.white}` }} />
          <div style={{ flex: 1, paddingBottom: 4 }}>
            <Skeleton w="50%" h={16} radius={7} />
            <Skeleton w="30%" h={10} radius={7} style={{ marginTop: 6 }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <Skeleton w={80} h={28} radius={99} />
          <Skeleton w={72} h={28} radius={99} />
          <Skeleton w={64} h={28} radius={99} />
        </div>
        <div style={{ marginTop: 18 }}>
          <Skeleton w="100%" h={12} radius={7} />
          <Skeleton w="90%" h={12} radius={7} style={{ marginTop: 6 }} />
          <Skeleton w="65%" h={12} radius={7} style={{ marginTop: 6 }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 18 }}>
          <Skeleton w="100%" h={56} radius={14} />
          <Skeleton w="100%" h={56} radius={14} />
          <Skeleton w="100%" h={56} radius={14} />
        </div>
      </div>
    </div>
  );
}

export function Badge({ tone = "neutral", children, icon: Icon, style }) {
  const C = useColors();
    const tones = {
    neutral: { bg: C.fog, fg: C.slate },
    orange: { bg: C.brandTint, fg: C.brandIcon || C.brandColor },
    brand: { bg: C.brandTint, fg: C.brandIcon || C.brandColor },
    success: { bg: C.successTint, fg: C.success },
    dark: { bg: C.jet, fg: C.white },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: t.bg,
        color: t.fg,
        fontSize: T.captionLg,
        fontWeight: 600,
        padding: "4px 8px",
        borderRadius: 8,
        ...fBody,
        ...style,
      }}
    >
      {Icon && <Icon size={11.5} />}
      {children}
    </span>
  );
}

export function StepProgress({ step, total, label }) {
  const C = useColors();
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        {Array.from({ length: total }, (_, i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 99, background: i < step ? C.brand : C.border }} />
        ))}
      </div>
      <div style={{ fontSize: T.captionLg, fontWeight: 600, color: C.slateLight, ...fBody }}>
        Step {step} of {total}{label ? ` - ${label}` : ""}
      </div>
    </div>
  );
}

export function CheckboxRow({ label, checked, onClick }) {
  const C = useColors();
  return (
    <button
      type="button"
      onClick={onClick}
      role="checkbox"
      aria-checked={checked}
      style={{
        display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
        background: "none", border: "none", cursor: "pointer", padding: "8px 0", minHeight: LAYOUT.touchTarget,
      }}
    >
      <div style={{
        width: 19, height: 19, borderRadius: 6, flexShrink: 0,
        border: `1.5px solid ${checked ? C.brand : C.border}`, background: checked ? C.brand : C.white,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {checked && <CheckCircle2Fill color={C.white} />}
      </div>
      <span style={{ fontSize: T.bodyLg, color: C.jet, ...fBody }}>{label}</span>
    </button>
  );
}

function CheckCircle2Fill({ color }) {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <path d="M20 6L9 17l-5-5" stroke={color || "currentColor"} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function RadioRow({ label, selected, onClick }) {
  const C = useColors();
  return (
    <button
      type="button"
      onClick={onClick}
      role="radio"
      aria-checked={selected}
      style={{
        display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
        background: "none", border: "none", cursor: "pointer", padding: "8px 0", minHeight: LAYOUT.touchTarget,
      }}
    >
      <div style={{
        width: 19, height: 19, borderRadius: 99, flexShrink: 0,
        border: `1.5px solid ${selected ? C.brand : C.border}`, background: C.white,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {selected && <div style={{ width: 10, height: 10, borderRadius: 99, background: C.brand }} />}
      </div>
      <span style={{ fontSize: T.bodyLg, color: C.jet, ...fBody }}>{label}</span>
    </button>
  );
}

export function SearchMultiSelect({ options, value, onChange, placeholder = "Search…", renderOption, renderValue }) {
  const C = useColors();
  const inputId = React.useId();
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);

  const filtered = options
    .filter((o) => !value.includes(o))
    .filter((o) => query.length > 0 && o.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 6);

  const add = (o) => { onChange([...value, o]); setQuery(""); setOpen(false); };
  const remove = (o) => onChange(value.filter((v) => v !== o));

  return (
    <div>
      {value.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: value.length ? 8 : 0 }}>
          {value.map((v) => (
            <span key={v} style={{
              display: "inline-flex", alignItems: "center", gap: 4, minHeight: 32, boxSizing: "border-box", padding: "4px 8px", borderRadius: LAYOUT.pillRadius,
              fontSize: T.labelLg, fontWeight: 500, border: `1px solid ${C.brand}`, background: C.brandTint, color: C.brandIcon || C.brandColor, ...fBody,
            }}>
              {renderValue ? renderValue(v) : v}
              <button type="button" onClick={() => remove(v)} aria-label={`Remove ${v}`} style={{ width: 20, height: 20, minWidth: 20, minHeight: 20, flexShrink: 0, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, color: C.brandIcon || C.brandColor }}>
                <svg width={11} height={11} viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" /></svg>
              </button>
            </span>
          ))}
        </div>
      )}
      <div style={{ position: "relative" }}>
        <div className="cl-input" style={{ display: "flex", alignItems: "center", gap: 8, border: `1.5px solid ${C.border}`, borderRadius: LAYOUT.inputRadius, padding: "11px 13px", background: C.white }}>
          <Search size={15} color={C.slateLight} />
          <input
            id={inputId}
            name="multi-select-search"
            type="search"
            autoComplete="off"
            aria-label={placeholder}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder={placeholder}
            style={{ border: "none", outline: "none", flex: 1, fontSize: T.bodyLg, minWidth: 0, background: "transparent", color: C.jet, ...fBody }}
          />
        </div>
        {open && filtered.length > 0 && (
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: C.white, border: `1px solid ${C.border}`, borderRadius: 13, boxShadow: "0 10px 24px rgba(0,0,0,.10)", zIndex: 30, maxHeight: 190, overflowY: "auto", animation: "clFadeUp .18s ease" }}>
            {filtered.map((o) => (
              <button
                type="button"
                key={o}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => add(o)}
                style={{ display: "block", width: "100%", minHeight: LAYOUT.touchTarget, textAlign: "left", padding: "10px 13px", background: "none", border: "none", cursor: "pointer", fontSize: T.body, color: C.jet, ...fBody }}
              >
                {renderOption ? renderOption(o) : o}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function SearchSelect({ options = [], value, onChange, placeholder = "Select…", allowCustom = true, renderOption, renderValue, name = "single-select-search", ariaLabel, disabled }) {
  const C = useColors();
  const inputId = React.useId();
  const containerRef = React.useRef(null);
  const searchInputRef = React.useRef(null);
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);

  // Close when tapping outside
  React.useEffect(() => {
    if (!open) return;
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [open]);

  // Focus search input on open if search bar is present
  React.useEffect(() => {
    if (open && (options.length > 5 || allowCustom)) {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [open, options.length, allowCustom]);

  const filtered = query.trim()
    ? options.filter((o) => String(o).toLowerCase().includes(query.trim().toLowerCase()))
    : options;
  const trimmed = query.trim();
  const showAddCustom = allowCustom && trimmed.length > 0 && !options.some((o) => String(o).toLowerCase() === trimmed.toLowerCase());

  const choose = (v) => {
    onChange(v);
    setQuery("");
    setOpen(false);
  };

  const toggleOpen = () => {
    if (disabled) return;
    setOpen((prev) => !prev);
    setQuery("");
  };

  const showSearch = options.length > 5 || allowCustom;

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <button
        type="button"
        id={inputId}
        name={name}
        aria-label={ariaLabel || placeholder}
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={toggleOpen}
        className="cl-input"
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          minHeight: LAYOUT.touchTarget,
          boxSizing: "border-box",
          border: `1.5px solid ${open ? C.brand : C.border}`,
          borderRadius: LAYOUT.inputRadius,
          padding: "0 14px",
          background: C.white,
          cursor: disabled ? "not-allowed" : "pointer",
          textAlign: "left",
          boxShadow: open ? `0 0 0 3px ${C.brandTint}` : "none",
          transition: "border-color .15s ease, box-shadow .15s ease",
        }}
      >
        <div style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {value ? (
            <span style={{ fontSize: T.bodyLg, color: C.jet, fontWeight: 500, ...fBody }}>
              {renderValue ? renderValue(value) : value}
            </span>
          ) : (
            <span style={{ fontSize: T.bodyLg, color: C.slateLight, fontWeight: 400, ...fBody }}>
              {placeholder}
            </span>
          )}
        </div>
        <ChevronDown
          size={18}
          color={open ? C.brand : C.slate}
          aria-hidden="true"
          style={{
            flexShrink: 0,
            marginLeft: 8,
            transition: "transform .2s cubic-bezier(.2,.7,.3,1), color .15s ease",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 5px)",
            left: 0,
            right: 0,
            background: C.white,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            boxShadow: "0 12px 30px rgba(0,0,0,.12), 0 2px 6px rgba(0,0,0,.04)",
            zIndex: 60,
            overflow: "hidden",
            animation: "clFadeUp .18s cubic-bezier(.2,.7,.3,1)",
          }}
        >
          {showSearch && (
            <div
              style={{
                padding: "8px 12px",
                borderBottom: `1px solid ${C.border}`,
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: C.fog,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Search size={14} color={C.slateLight} style={{ flexShrink: 0 }} />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search options…"
                autoComplete="off"
                style={{
                  border: "none",
                  outline: "none",
                  width: "100%",
                  fontSize: T.body,
                  background: "transparent",
                  color: C.jet,
                  ...fBody,
                }}
              />
            </div>
          )}

          <div style={{ maxHeight: 210, overflowY: "auto" }}>
            {filtered.length === 0 && !showAddCustom ? (
              <div style={{ padding: "14px 12px", textAlign: "center", fontSize: T.captionLg, color: C.slateLight, ...fBody }}>
                No options found
              </div>
            ) : (
              filtered.map((o) => {
                const isSelected = o === value;
                return (
                  <button
                    type="button"
                    key={o}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => choose(o)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      minHeight: 42,
                      textAlign: "left",
                      padding: "10px 14px",
                      background: isSelected ? C.brandTint : "transparent",
                      border: "none",
                      borderBottom: `1px solid ${C.border}15`,
                      cursor: "pointer",
                      fontSize: T.body,
                      color: isSelected ? C.brand : C.jet,
                      fontWeight: isSelected ? 600 : 400,
                      transition: "background .12s ease",
                      ...fBody,
                    }}
                  >
                    <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {renderOption ? renderOption(o) : o}
                    </span>
                    {isSelected && <Check size={16} color={C.brand} style={{ flexShrink: 0, marginLeft: 8 }} />}
                  </button>
                );
              })
            )}

            {showAddCustom && (
              <button
                type="button"
                onClick={() => choose(trimmed)}
                style={{
                  display: "block",
                  width: "100%",
                  minHeight: 42,
                  textAlign: "left",
                  padding: "10px 14px",
                  background: "transparent",
                  border: "none",
                  borderTop: `1px solid ${C.border}`,
                  cursor: "pointer",
                  fontSize: T.body,
                  color: C.brand,
                  fontWeight: 600,
                  ...fBody,
                }}
              >
                + Add "{trimmed}"
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function StatusPill({ status, perspective = "client" }) {
  const C = useColors();
  const providerView = perspective === "coach" || perspective === "business" || perspective === "provider";
  const map = {
    pending: { label: providerView ? "Needs response" : "Awaiting coach", tone: "orange", pulse: true },
    awaiting_payment: { label: providerView ? "Awaiting payment" : "Payment due", tone: "orange", pulse: true },
    confirmed: { label: "Confirmed", tone: "success" },
    in_progress: { label: "Live now", tone: "success", pulse: true },
    completion_pending: { label: providerView ? "Finish session" : "Finishing up", tone: "orange", pulse: true },
    completed: { label: "Completed", tone: "neutral" },
    cancelled: { label: "Cancelled", tone: "neutral" },
    declined: { label: "Declined", tone: "danger" },
    expired: { label: "Expired", tone: "neutral" },
    failed: { label: "Failed", tone: "danger" },
    refunded: { label: "Refunded", tone: "success" },
    live: { label: "Live now", tone: "orange", pulse: true },
  };
  const m = map[status] || map.pending;
  const colors = {
    orange: { bg: C.brandTint, fg: C.brand },
    success: { bg: C.successTint, fg: C.success },
    neutral: { bg: C.fog, fg: C.slate },
    danger: { bg: C.dangerTint, fg: C.danger },
  }[m.tone];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0, whiteSpace: "nowrap",
      color: colors.fg,
      fontSize: T.captionLg, fontWeight: 700, padding: "4px 8px", borderRadius: 8,
      background: colors.bg, ...fBody,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 99, background: "currentColor", animation: m.pulse ? "clPulse 1.4s infinite" : "none" }} />
      {m.label}
    </span>
  );
}

export function HandleTag({ handle, size = 12, color }) {
  const C = useColors();
  if (!handle) return null;
  const h = String(handle).startsWith("@") ? handle : `@${handle}`;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      fontSize: size, fontWeight: 600, color: color || C.slateLight, ...fBody,
    }}>
      {h}
    </span>
  );
}

export function Avatar({ name, size = 42, ring, src }) {
  const C = useColors();
  const label = String(name || "User");
  const localSrc = src || avatarForName(label);
  const dicebearSrc = `https://api.dicebear.com/10.x/initials/svg?initialsVariant=default:1&lettersProbability=100&lettersVariant=single:1&seed=${encodeURIComponent(label)}`;
  return (
    <div style={{
      position: "relative", width: size, height: size, borderRadius: size, overflow: "hidden",
      background: hashColor(name), color: C.white,
      display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: size * 0.36,
      flexShrink: 0, boxShadow: ring ? `0 0 0 2px ${C.white}, 0 0 0 3.5px ${C.brand}` : "none", ...fDisplay,
    }}>
      <span>{initials(name)}</span>
      <img
        src={localSrc || dicebearSrc}
        alt={`${label} avatar`}
        width={size}
        height={size}
        loading={size >= 64 ? "eager" : "lazy"}
        decoding="async"
        onError={(e) => {
          const fallback = avatarForName(label);
          if (fallback && !e.currentTarget.dataset.retry) {
            e.currentTarget.dataset.retry = "1";
            e.currentTarget.src = fallback;
          } else {
            e.currentTarget.style.display = "none";
          }
        }}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
    </div>
  );
}

export function StarRow({ value, size = 13 }) {
  const C = useColors();
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} fill={i <= Math.round(value) ? C.brand : "none"} color={i <= Math.round(value) ? C.brand : C.slateLight} />
      ))}
    </span>
  );
}

export function Toggle({ on, onClick, label = "Toggle setting" }) {
  const C = useColors();
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onClick} style={{ width: 48, height: LAYOUT.touchTarget, borderRadius: LAYOUT.pillRadius, background: "transparent", position: "relative", flexShrink: 0, border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span aria-hidden="true" style={{ width: 42, height: 25, borderRadius: LAYOUT.pillRadius, background: on ? C.brand : C.border, position: "relative", transition: "background .2s ease", display: "block" }}>
        <span style={{ position: "absolute", top: 2.5, left: on ? 20 : 2.5, width: 20, height: 20, borderRadius: LAYOUT.pillRadius, background: C.white, transition: "left .15s ease", boxShadow: "0 1px 2px rgba(0,0,0,.2)" }} />
      </span>
    </button>
  );
}

export function SegTabs({ items, value, onChange, strong, style }) {
  const C = useColors();
  let darkMode = false;
  try {
    const app = useApp();
    darkMode = app?.darkMode ?? false;
  } catch (e) {
    darkMode = false;
  }
  const trackBg = darkMode ? "#14171E" : "#F4F5F7";
  const trackBorder = darkMode ? "#282D3A" : C.border;

  return (
    <div
      role="tablist"
      style={{
        display: "flex",
        width: "100%",
        background: trackBg,
        border: `1px solid ${trackBorder}`,
        borderRadius: 13,
        padding: 4,
        gap: 4,
        boxShadow: darkMode ? "inset 0 1px 2px rgba(0,0,0,0.35)" : "none",
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
        ...style,
      }}
    >
      {items.map((it) => {
        const active = value === it.value;
        const Icon = it.icon;
        const label = it.label;
        const ariaLabel = it.ariaLabel || (typeof label === "string" ? label : it.value);

        const activeBg = active
          ? strong
            ? C.jet
            : (darkMode ? "#252934" : C.white)
          : "transparent";

        const activeColor = active
          ? strong
            ? (darkMode ? "#121418" : C.white)
            : (darkMode ? "#F3F4F6" : C.jet)
          : C.slate;

        const activeShadow = active
          ? strong
            ? (darkMode ? "0 1px 3px rgba(0,0,0,.35)" : "0 1px 3px rgba(0,0,0,.15)")
            : (darkMode ? "0 1px 3px rgba(0,0,0,.3)" : "0 1px 3px rgba(0,0,0,.08), 0 1px 1px rgba(0,0,0,.04)")
          : "none";

        return (
          <button
            type="button"
            role="tab"
            aria-selected={active}
            key={it.value}
            onClick={() => onChange(it.value)}
            aria-label={ariaLabel}
            title={ariaLabel}
            style={{
              flex: 1,
              minHeight: 44,
              padding: label ? "10px 18px" : "10px 14px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              background: activeBg,
              color: activeColor,
              fontWeight: active ? 700 : 600,
              fontSize: 16,
              boxShadow: activeShadow,
              transition: "background .15s ease, color .15s ease, box-shadow .15s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              whiteSpace: "nowrap",
              ...fBody,
            }}
          >
            {Icon && (
              <Icon
                size={18}
                color={activeColor}
                fill={it.fillActive && active ? activeColor : "none"}
              />
            )}
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function ViewModeToggle({ value, onChange, ariaLabel = "View mode" }) {
  const C = useColors();
  let darkMode = false;
  try {
    const app = useApp();
    darkMode = app?.darkMode ?? false;
  } catch (e) {
    darkMode = false;
  }
  const trackBg = darkMode ? "#14171E" : "#F4F5F7";
  const trackBorder = darkMode ? "#282D3A" : C.border;

  const options = [
    { value: "list", label: "List view", icon: List },
    { value: "calendar", label: "Calendar view", icon: CalendarDays },
  ];
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      style={{
        display: "inline-flex",
        alignItems: "center",
        overflow: "hidden",
        borderRadius: 12,
        border: `1px solid ${trackBorder}`,
        background: trackBg,
        boxShadow: darkMode ? "inset 0 1px 2px rgba(0,0,0,0.35)" : "inset 0 1px 2px rgba(0,0,0,0.04)",
        padding: 2,
        gap: 2,
        flexShrink: 0,
      }}
    >
      {options.map((option) => {
        const active = value === option.value;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={option.label}
            title={option.label}
            onClick={() => onChange(option.value)}
            style={{
              width: LAYOUT.touchTarget,
              height: LAYOUT.touchTarget,
              padding: 0,
              borderRadius: 10,
              border: "none",
              background: active ? (darkMode ? C.jet : C.jet) : "transparent",
              color: active ? (darkMode ? "#121418" : C.white) : C.slate,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: active ? "0 1px 3px rgba(22,24,29,.12)" : "none",
              transition: "background .15s ease, color .15s ease, box-shadow .15s ease",
            }}
          >
            <Icon size={15} strokeWidth={2.1} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}

export function BackButton({ onClick, floating = false, ariaLabel = "Go back" }) {
  const C = useColors();
  const { darkMode } = useApp();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="cl-arrow-btn"
      style={{
        width: LAYOUT.touchTarget, height: LAYOUT.touchTarget,
        borderRadius: LAYOUT.pillRadius, background: floating ? C.white : (darkMode ? "transparent" : C.fog),
        border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", boxShadow: floating ? "0 4px 14px rgba(22,24,29,.12)" : "none",
        transition: "transform .16s ease, background .18s ease, color .18s ease, border-color .18s ease, box-shadow .18s ease", padding: 0, flexShrink: 0,
        color: C.jet,
      }}
    >
      <ChevronLeft aria-hidden="true" size={19} color="currentColor" style={{ marginRight: 1 }} />
    </button>
  );
}

const HEADER_DESCRIPTIONS = {
  "Support": "Get help with your account, bookings and payments.",
  "Confirm session": "Review the details before you confirm this session.",
  "Funds status": "See how your session funds are being handled.",
  "Payout status": "Track when your earnings will reach your account.",
  "Payment status": "Track the status of your payment.",
  "Report a session issue": "Tell us what happened so we can help resolve it.",
  "Review your report": "Check the details before submitting your report.",
  "Additional payment": "Request an approved additional payment for this session.",
  "Client preview": "Review how this request will appear to your client.",
  "Payment request": "Review the payment request before sending it.",
  "Review request": "Review the details before responding.",
  "Secure payment": "Your payment is processed securely through CoachNivo.",
  "Coaching services": "Create the sessions athletes can book with you.",
  "Reels & photos": "Show athletes what your coaching looks like in action.",
  "Profile setup": "Complete your profile so athletes can find and trust you.",
  "Payout method": "Keep your payout details up to date.",
  "Payout setup": "Add where you’d like to receive your earnings.",
  "Notifications": "Stay up to date with activity on your account.",
  "History": "Review your past sessions and transactions.",
  "Earnings & payouts": "See your earnings, fees and payout activity.",
  "Reviews": "Read feedback from the athletes you coach.",
  "Availability setup": "Set the times athletes can book with you.",
  "Package details": "Review the session details before booking.",
  "Choose a time": "Pick a time that works best for you.",
  "Add payment method": "Add a secure payment method for bookings.",
  "Ask a question": "Send the coach a quick message before you book.",
  "Join waitlist": "Get notified when a place becomes available.",
  "Session prep": "Get ready for your upcoming coaching session.",
  "Refund status": "Track the progress of your refund.",
  "Filters": "Narrow your results to find the right coach faster.",
  "Booking details": "Review your session, payment and booking updates.",
  "Leave a review": "Share feedback to help other athletes choose confidently.",
  "Who's attending?": "Choose who this coaching session is for.",
  "Confirm Session": "Check the details before you request this session.",
  "Review booking": "Make sure everything looks right before you book.",
  "Payment": "Complete your booking with a secure payment.",
  "Session details": "Review session details and coordinate next steps.",
  "Verification review": "We’re reviewing your details before activating your profile.",
};

function headerDescriptionFor(title) {
  if (typeof title !== "string") return "Review the details and take the next step.";
  if (HEADER_DESCRIPTIONS[title]) return HEADER_DESCRIPTIONS[title];
  if (title.endsWith("'s availability")) return "Browse available times and choose what works for you.";
  return "Review the details and take the next step.";
}

export function ScreenHeader({ title, subtitle, action, style, titleStyle }) {
  const C = useColors();
  const { isDesktop } = useResponsive();
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, ...style }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: isDesktop ? 26 : T.heading, fontWeight: 700, color: C.jet, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...fDisplay, ...titleStyle }}>{title}</div>
        {subtitle && <div style={{ fontSize: isDesktop ? 16 : T.caption, color: C.slate, lineHeight: 1.3, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...fBody }}>{subtitle}</div>}
      </div>
      {action && <div style={{ flexShrink: 0, paddingTop: 1 }}>{action}</div>}
    </div>
  );
}

export function TopBar({ title, subtitle, onBack, right, border }) {
  const C = useColors();
  const { darkMode } = useApp();
  const { isDesktop } = useResponsive();
  const hasBorder = border !== undefined ? border : !!title;
  const supportingCopy = title ? (subtitle || headerDescriptionFor(title)) : null;
  return (
    <div className="cl-topbar" style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      minHeight: isDesktop ? (supportingCopy ? 76 : LAYOUT.desktop.topBarH) : (supportingCopy ? 64 : LAYOUT.topBarH),
      padding: isDesktop ? "12px 64px" : `8px ${LAYOUT.pagePadX}px`, boxSizing: "border-box",
      position: "sticky", top: 0, zIndex: 25,
      background: !title && !hasBorder ? "transparent" : (darkMode ? "rgba(6,18,30,0.86)" : "rgba(255,255,255,0.86)"),
      backdropFilter: !title && !hasBorder ? "none" : "blur(14px)",
      WebkitBackdropFilter: !title && !hasBorder ? "none" : "blur(14px)",
      borderBottom: hasBorder ? `1px solid ${C.border}` : "none",
    }}>
      {onBack && <BackButton onClick={onBack} />}
      {title && (
        <div style={{ flex: 1, minWidth: 0, marginLeft: onBack ? 10 : 0 }}>
          <div style={{ fontSize: isDesktop ? 21 : T.titleLg, fontWeight: 700, color: C.jet, letterSpacing: "-0.2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...fDisplay }}>{title}</div>
          {supportingCopy && <div style={{ fontSize: isDesktop ? 16 : T.captionLg, color: C.slate, lineHeight: 1.35, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...fBody }}>{supportingCopy}</div>}
        </div>
      )}
      <div style={{ minWidth: LAYOUT.touchTarget, minHeight: LAYOUT.touchTarget, display: "flex", justifyContent: "flex-end", alignItems: "center", flexShrink: 0 }}>{right}</div>
    </div>
  );
}

/** Fixed footer for screen-level decisions and primary actions. */
export function BottomActionBar({ children, stack = false, equal = true, style }) {
  const C = useColors();
  const { isDesktop } = useResponsive();
  return (
    <div style={{
      position: "relative", zIndex: 24, flexShrink: 0,
      padding: isDesktop
        ? "14px 64px 16px"
        : `12px ${LAYOUT.pagePadX}px max(${LAYOUT.ctaPadBottom}px, env(safe-area-inset-bottom))`,
      borderTop: `1px solid ${C.border}`, background: C.white,
      boxShadow: "0 -8px 20px rgba(22,24,29,.06)",
      display: "flex", flexDirection: stack ? "column" : "row", alignItems: "center", gap: 10,
      ...style,
    }}>
      {React.Children.map(children, (child) => {
        if (!child) return null;
        if (!equal || stack) return child;
        return (
          <div style={{ flex: "1 1 0px", minWidth: 0, display: "flex", width: "100%" }}>
            {React.isValidElement(child)
              ? React.cloneElement(child, { full: true, style: { width: "100%", flex: 1, ...(child.props.style || {}) } })
              : child}
          </div>
        );
      })}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, body, ctaLabel, onCta, large }) {
  const C = useColors();
  return (
    <div style={{ textAlign: "center", padding: large ? "20px 20px" : "40px 20px", color: C.slate, animation: "clFadeUp .35s ease" }}>
      <div style={{
        width: large ? 72 : 52, height: large ? 72 : 52, borderRadius: large ? 22 : 16, background: large ? C.brandTint : C.fog,
        display: "flex", alignItems: "center", justifyContent: "center", margin: large ? "0 auto 18px" : "0 auto 14px",
      }}>
        <Icon aria-hidden="true" size={large ? 30 : 22} color={large ? C.brand : C.slateLight} />
      </div>
      <div style={{ fontSize: large ? T.display : undefined, fontWeight: 700, color: C.jet, marginBottom: large ? 10 : 4, ...fDisplay }}>{title}</div>
      <div style={{ fontSize: large ? T.bodyLg : T.body, lineHeight: large ? 1.6 : 1.5, maxWidth: large ? 300 : undefined, marginLeft: "auto", marginRight: "auto" }}>{body}</div>
      {ctaLabel && onCta && (
        <div style={{ marginTop: large ? 24 : 18, ...(large ? {} : { display: "inline-block" }) }}>
          <Btn full={large} onClick={onCta}>{ctaLabel}</Btn>
        </div>
      )}
    </div>
  );
}

/* Shared password rule set — keep validation and the live checklist in sync. */
export function passwordValid(pw) {
  return typeof pw === "string" && pw.length >= 6 && /\d/.test(pw) && /[A-Z]/.test(pw);
}

export function PasswordRequirements({ password, style }) {
  const C = useColors();
  const checks = [
    { ok: password.length >= 6, label: "At least 6 characters" },
    { ok: /\d/.test(password), label: "At least one number" },
    { ok: /[A-Z]/.test(password), label: "At least one uppercase letter" },
  ];
  const failed = checks.filter((c) => !c.ok);
  if (!password || failed.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, ...style }}>
      {failed.map((c) => (
        <span key={c.label} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: T.captionLg, fontWeight: 500, color: C.slateLight, ...fBody }}>
          <span aria-hidden="true" style={{ width: 13, height: 13, borderRadius: 99, border: `1.5px solid ${C.border}`, flexShrink: 0, display: "inline-block" }} />
          {c.label}
        </span>
      ))}
    </div>
  );
}

export function Toast({ toast, style }) {
  const C = useColors();
  if (!toast) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: "fixed",
        bottom: 32,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        pointerEvents: "none",
        width: "max-content",
        maxWidth: "min(calc(100vw - 32px), 520px)",
        display: "flex",
        justifyContent: "center",
        ...style,
      }}
    >
      <div
        style={{
          background: C.jet,
          color: C.white,
          padding: "10px 18px",
          borderRadius: 99,
          fontSize: T.body,
          fontWeight: 550,
          display: "flex",
          alignItems: "center",
          gap: 10,
          boxShadow: "0 12px 32px rgba(0,0,0,.24), 0 2px 6px rgba(0,0,0,.12)",
          animation: "clToastIn .3s cubic-bezier(.22,1,.36,1)",
          pointerEvents: "auto",
          whiteSpace: "nowrap",
          ...fBody,
        }}
      >
        <span style={{ width: 22, height: 22, borderRadius: 99, background: C.brandTint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <CheckCircle2 size={13} color={C.brand} />
        </span>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{toast}</span>
      </div>
    </div>
  );
}

/** Brand wordmark. Uses the black logo on light backgrounds and the white
    logo on dark backgrounds. Sized by height (intrinsic width is preserved). */
export function BrandLogo({ height = 28, onDark = false, alt = "CoachNivo", style }) {
  return (
    <img
      src={onDark ? "/coachnivo-logo_white.png" : "/coachnivo-logo_black.png"}
      alt={alt}
      style={{ display: "block", height, width: "auto", objectFit: "contain", ...style }}
    />
  );
}

export function LogoMark({ size = 28, onDark = false }) {
  return <BrandLogo height={size} onDark={onDark} />;
}

export function LogoMarkWhite({ size = 28 }) {
  return <BrandLogo height={size} onDark />;
}

export function Wordmark({ size = 20, dark }) {
  const C = useColors();
  return (
    <span style={{ fontSize: size, fontWeight: 600, ...fDisplay }}>
      <span style={{ color: dark ? C.white : C.jet }}>Coach</span>
      <span style={{ color: dark ? C.onDark : C.slateLight, fontWeight: 500 }}>Link</span>
    </span>
  );
}

export function BottomTabs({ items, value, onChange }) {
  const C = useColors();
  const activeColor = C.brandIcon || C.brand;
  const inactiveColor = C.slate;
  const glassSurface = `linear-gradient(145deg, color-mix(in srgb, ${C.white} 82%, transparent), color-mix(in srgb, ${C.surface} 64%, transparent))`;
  const glassBorder = `color-mix(in srgb, ${C.border} 62%, ${C.white})`;
  const glassShadow = `0 14px 34px -12px color-mix(in srgb, ${C.border} 88%, transparent), inset 0 1px 0 color-mix(in srgb, ${C.white} 72%, transparent)`;
  const activePillBg = `linear-gradient(180deg, color-mix(in srgb, ${C.brandTint} 88%, ${C.white}), color-mix(in srgb, ${C.brandTint} 70%, transparent))`;

  return (
    <div
      role="tablist"
      aria-label="Primary navigation"
      style={{
        position: "absolute",
        bottom: "max(12px, env(safe-area-inset-bottom))",
        left: 12,
        right: 12,
        background: glassSurface,
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        border: `1px solid ${glassBorder}`,
        boxShadow: glassShadow,
        borderRadius: 22,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "6px 6px",
        zIndex: 40,
        boxSizing: "border-box",
        overflow: "hidden",
        isolation: "isolate",
        transition: "background .25s ease, border-color .25s ease, box-shadow .25s ease",
        animation: "clSlideUp .45s cubic-bezier(.22,1,.36,1)",
      }}
    >
      <span aria-hidden="true" style={{
        position: "absolute", inset: 1, borderRadius: 21, pointerEvents: "none",
        background: `linear-gradient(180deg, color-mix(in srgb, ${C.white} 34%, transparent), transparent 54%)`,
        zIndex: 0,
      }} />
      {items.map((it) => {
        const active = value === it.value;
        const Icon = it.icon;

        return (
          <button
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={it.label}
            key={it.value}
            onClick={() => onChange(it.value)}
            style={{
              flex: 1,
              minWidth: 0,
              minHeight: 48,
              background: active ? activePillBg : "transparent",
              border: "none",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              padding: "6px 2px",
              borderRadius: 16,
              position: "relative",
              zIndex: 1,
              boxShadow: active ? `inset 0 1px 0 color-mix(in srgb, ${C.white} 68%, transparent), 0 4px 12px -8px color-mix(in srgb, ${C.brand} 55%, transparent)` : "none",
              transition: "background .22s cubic-bezier(0.16, 1, 0.3, 1), color .22s ease",
            }}
          >
            {it.badge ? (
              <span
                style={{
                  position: "absolute",
                  top: 4,
                  right: "26%",
                  width: 6,
                  height: 6,
                  borderRadius: 99,
                  background: C.brand,
                  animation: "clPulse 1.6s infinite",
                }}
              />
            ) : null}

            <Icon
              size={19}
              strokeWidth={active ? 2.3 : 1.8}
              color={active ? activeColor : inactiveColor}
              style={{ flexShrink: 0, transition: "color 0.2s ease, transform 0.2s ease", transform: active ? "scale(1.05)" : "scale(1)", animation: active ? "clTabBounce .35s cubic-bezier(.34,1.56,.64,1)" : "none" }}
            />

            <span
              style={{
                fontSize: T.tiny,
                fontWeight: active ? 700 : 500,
                color: active ? activeColor : inactiveColor,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                width: "100%",
                textAlign: "center",
                lineHeight: 1.1,
                letterSpacing: "-0.1px",
                ...fBody,
              }}
            >
              {it.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function SectionLabel({ children, icon: Icon, hint, style, required }) {
  const C = useColors();
  const { isDesktop } = useResponsive();
  return (
    <div style={{ marginBottom: isDesktop ? 16 : 12, ...style }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {Icon && (
          <span style={{ width: isDesktop ? 28 : 24, height: isDesktop ? 28 : 24, borderRadius: 8, flexShrink: 0, background: C.brandTint, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <Icon size={isDesktop ? 15 : 13} color={C.brand} />
          </span>
        )}
        <span style={{ fontSize: isDesktop ? 20 : 17, fontWeight: 700, color: C.jet, letterSpacing: "-0.01em", ...fDisplay }}>{children}{required && <RequiredMark />}</span>
      </div>
      {hint && (
        <div style={{ fontSize: isDesktop ? 15 : T.body, color: C.slate, marginTop: 4, lineHeight: 1.5, ...fBody }}>{hint}</div>
      )}
    </div>
  );
}

/** Grouped form section — header row (optional icon + label + hint) with its
    fields wrapped in a soft card. The shared "premium" building block for all
    edit / setup forms across the app. */
export function FormSection({ icon: Icon, label, hint, children, style, cardStyle, required }) {
  const C = useColors();
  return (
    <Card style={{ marginBottom: 14, ...cardStyle }}>
      <SectionLabel icon={Icon} hint={hint} required={required} style={{ marginBottom: hint ? 12 : 14 }}>
        {label}
      </SectionLabel>
      <div style={style}>{children}</div>
    </Card>
  );
}

export function Row({ label, value, bold, last }) {
  const C = useColors();
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "9px 0", borderBottom: last ? "none" : `1px solid ${C.border}` }}>
      <span style={{ fontSize: T.body, color: C.slate, ...fBody }}>{label}</span>
      <span style={{ fontSize: T.body, color: C.jet, fontWeight: bold ? 700 : 500, textAlign: "right", ...fBody }}>{value}</span>
    </div>
  );
}

/* -------------------------------------------------------------------------
   SETTINGS PRIMITIVES
   Consistent, premium list rows and grouped cards used by the client and
   coach account/settings screens (and their sheets). Rows render inside a
   SettingsGroup card, which supplies the outer border, radius and dividers.
   ------------------------------------------------------------------------- */

/** A single settings/menu row with a tinted icon tile, label + optional
    sub-copy, and a chevron (or custom right control). Pass `last` to drop
    the divider; `danger` tones the row for destructive actions. */
export function SettingsRow({ icon: Icon, label, sub, onClick, right, danger, last, style }) {
  const C = useColors();
  const Component = onClick ? "button" : "div";
  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      aria-label={onClick && !label ? label : undefined}
      style={{
        width: "100%", minHeight: 52, display: "flex", alignItems: "center", gap: 12,
        padding: "10px 14px", boxSizing: "border-box",
        background: "none", border: "none",
        borderBottom: last ? "none" : `1px solid ${C.border}`,
        cursor: onClick ? "pointer" : "default", textAlign: "left",
        transition: "background .15s ease", ...style,
      }}
    >
      {Icon && (
        <span style={{ width: 34, height: 34, borderRadius: 11, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", background: danger ? C.dangerTint : C.fog }}>
          <Icon size={16} color={danger ? C.danger : C.slate} />
        </span>
      )}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: T.bodyLg, color: danger ? C.danger : C.jet, fontWeight: 600, lineHeight: 1.3, ...fBody }}>{label}</span>
        {sub && <span style={{ display: "block", fontSize: T.captionLg, color: C.slate, marginTop: 2, lineHeight: 1.4, ...fBody }}>{sub}</span>}
      </span>
      {right !== undefined ? right : (onClick ? <ChevronRight size={16} color={C.slateLight} style={{ flexShrink: 0 }} /> : null)}
    </Component>
  );
}

/** Grouped settings card — renders `title` (SectionLabel) above a Card whose
    rows share one border, radius and consistent internal dividers. */
export function SettingsGroup({ title, children, style, cardStyle }) {
  const C = useColors();
  const rows = React.Children.toArray(children).filter(Boolean);
  const wrapped = rows.map((child, index) =>
    React.cloneElement(child, {
      ...(child.props || {}),
      last: index === rows.length - 1,
    })
  );
  return (
    <div style={{ marginBottom: 24, ...style }}>
      {title && <SectionLabel style={{ marginBottom: 10 }}>{title}</SectionLabel>}
      <Card style={{ padding: 0, borderRadius: LAYOUT.cardRadius, overflow: "hidden", ...cardStyle }}>
        {wrapped}
      </Card>
    </div>
  );
}

export function Field({ label, placeholder, type = "text", icon: Icon, rightIcon: RightIcon, onRight, rightLabel, show = true, value, onChange, name, autoComplete, inputMode, required }) {
  const C = useColors();
  const generatedId = React.useId();
  if (!show) return null;
  const fieldName = name || String(label || "field").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return (
    <div style={{ width: "100%", minWidth: 0 }}>
      <label htmlFor={generatedId} style={{ display: "block", fontSize: T.labelLg, fontWeight: 600, color: C.jet, marginBottom: 6, ...fBody }}>{label}{required && <RequiredMark />}</label>
      <div className="cl-input" style={{ width: "100%", minWidth: 0, display: "flex", alignItems: "center", gap: 8, minHeight: 48, boxSizing: "border-box", border: `1.5px solid ${C.border}`, borderRadius: LAYOUT.inputRadius, padding: RightIcon ? "0 4px 0 13px" : "0 13px", background: C.white }}>
        {Icon && <Icon aria-hidden="true" size={16} color={C.slateLight} />}
        <input id={generatedId} name={fieldName} autoComplete={autoComplete || (type === "email" ? "email" : "off")} inputMode={inputMode || (type === "tel" ? "tel" : undefined)} required={required} placeholder={placeholder} type={type} value={value} onChange={onChange} style={{ border: "none", outline: "none", flex: 1, minWidth: 0, minHeight: 44, padding: 0, fontSize: T.bodyLg, background: "transparent", color: C.jet, ...fBody }} />
        {RightIcon && <button type="button" aria-label={rightLabel || `Show or hide ${label}`} onClick={onRight} style={{ width: 44, height: 44, padding: 0, flexShrink: 0, background: "none", border: "none", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.slateLight }}><RightIcon aria-hidden="true" size={16} /></button>}
      </div>
    </div>
  );
}

/** Shared confirmation for irreversible or high-impact actions. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  icon: Icon = AlertTriangle,
  destructive = false,
  variant,
  loading: externalLoading,
  loadingText,
}) {
  const C = useColors();
  const [internalLoading, setInternalLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setInternalLoading(false);
    }
  }, [open]);

  const isLoading = externalLoading !== undefined ? externalLoading : internalLoading;

  const handleConfirm = async (e) => {
    if (isLoading) return;
    if (onConfirm) {
      try {
        const res = onConfirm(e);
        if (res && typeof res.then === "function") {
          setInternalLoading(true);
          await res;
        }
      } catch (err) {
        console.error("Confirm error:", err);
      } finally {
        setInternalLoading(false);
      }
    }
  };

  return (
    <BottomSheet open={open} onClose={isLoading ? () => {} : onClose} title={title} maxWidth={440}>
      <div style={{ textAlign: "center", paddingTop: 4 }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            background: destructive ? C.dangerTint : C.brandTint,
            color: destructive ? C.danger : C.brand,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <Icon aria-hidden="true" size={24} />
        </div>
        {description && (
          <div style={{ fontSize: T.bodyLg, color: C.slate, lineHeight: 1.55, paddingBottom: 20, ...fBody }}>
            {description}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Btn
            full
            variant={variant || (destructive ? "danger" : "primary")}
            icon={Icon}
            loading={isLoading}
            loadingText={loadingText}
            disabled={isLoading}
            onClick={handleConfirm}
            style={destructive ? { background: C.danger, color: "#FFFFFF", border: "none" } : undefined}
          >
            {confirmLabel}
          </Btn>
          <Btn full variant="secondary" onClick={isLoading ? undefined : onClose} disabled={isLoading}>
            {cancelLabel}
          </Btn>
        </div>
      </div>
    </BottomSheet>
  );
}

export function BottomSheet({ open, onClose, title, children, footer, heightPct = 70, maxWidth, width }) {
  const C = useColors();
  const { isDesktop } = useResponsive();
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const titleId = React.useId();
  onCloseRef.current = onClose;

  useLayoutEffect(() => {
    if (!open) return undefined;
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const selector = 'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])';
    const focusable = () => Array.from(dialog?.querySelectorAll(selector) || []);
    (focusable()[0] || dialog)?.focus({ preventScroll: true });

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current?.();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) {
        event.preventDefault();
        dialog?.focus({ preventScroll: true });
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus?.({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;
  const modalWidth = width || maxWidth || 560;

  const sheet = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: isDesktop ? "24px" : "16px",
        boxSizing: "border-box",
        overflow: "hidden",
        overscrollBehavior: "contain",
      }}
    >
      <button
        type="button"
        className="cl-backdrop"
        aria-label="Dismiss dialog"
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          border: "none",
          borderRadius: 0,
          background: "rgba(22,24,29,.50)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          animation: "clBackdropIn .2s ease",
          cursor: "default",
          touchAction: "none",
        }}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : "Dialog"}
        tabIndex={-1}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: `min(100%, ${modalWidth}px)`,
          maxHeight: "min(90vh, 780px)",
          background: C.white,
          borderRadius: 22,
          border: `1px solid ${C.border}`,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 60px -15px rgba(0,0,0,.35), 0 0 1px rgba(0,0,0,.2)",
          animation: "clScaleIn .22s cubic-bezier(.16, 1, 0.3, 1)",
          overflow: "hidden",
        }}
      >
        {title ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: isDesktop ? "22px 32px 14px" : "18px 20px 12px",
              borderBottom: `1px solid ${C.borderLight || C.border}`,
              flexShrink: 0,
            }}
          >
            <div
              id={titleId}
              style={{
                fontSize: isDesktop ? 20 : 18,
                fontWeight: 700,
                color: C.jet,
                letterSpacing: "-0.2px",
                lineHeight: 1.25,
                ...fDisplay,
              }}
            >
              {title}
            </div>
            <button
              type="button"
              className="cl-close-btn"
              aria-label="Close dialog"
              onClick={onClose}
              style={{
                width: 34,
                height: 34,
                flexShrink: 0,
                borderRadius: 99,
                background: C.fog,
                border: `1px solid ${C.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: C.slate,
              }}
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="cl-close-btn"
            aria-label="Close dialog"
            onClick={onClose}
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              zIndex: 10,
              width: 34,
              height: 34,
              flexShrink: 0,
              borderRadius: 99,
              background: C.fog,
              border: `1px solid ${C.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: C.slate,
            }}
          >
            <X size={16} />
          </button>
        )}
        <div
          style={{
            overflowY: "auto",
            overscrollBehavior: "contain",
            padding: isDesktop ? "22px 32px 32px" : "18px 20px 24px",
            flex: 1,
            minHeight: 0,
          }}
          className="cl-hide-scrollbar"
        >
          {children}
        </div>
        {footer && (
          <div
            style={{
              flexShrink: 0,
              padding: isDesktop ? "16px 32px 24px" : "14px 20px 18px",
              borderTop: `1px solid ${C.borderLight || C.border}`,
              background: C.white,
              boxShadow: "0 -8px 20px rgba(22,24,29,.04)",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(sheet, document.body)
    : sheet;
}

export function SignalBars({ color = "currentColor" }) {
  return (
    <svg width="17" height="11" viewBox="0 0 17 11" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
      <rect x="0.5" y="7.5" width="2.5" height="3" rx="0.5" fill={color} />
      <rect x="4.5" y="5.5" width="2.5" height="5" rx="0.5" fill={color} />
      <rect x="8.5" y="3" width="2.5" height="7.5" rx="0.5" fill={color} />
      <rect x="12.5" y="0.5" width="2.5" height="10" rx="0.5" fill={color} />
    </svg>
  );
}

/* =========================================================================
   FullscreenImageViewer — Instagram-style lightbox for profile photos and
   other images. Tapping the photo (or the X) closes it; Escape works too.
   ========================================================================= */
export function FullscreenImageViewer({ open, onClose, src, alt = "Photo" }) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current?.();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  if (!open || !src) return null;
  const viewer = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      style={{
        position: "fixed", inset: 0, zIndex: 99999, overflow: "hidden",
        background: "rgba(10,11,13,.96)",
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: "clBackdropIn .2s ease",
      }}
    >
      <button
        type="button"
        aria-label="Close photo"
        onClick={onClose}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none", background: "transparent", cursor: "zoom-out", touchAction: "none" }}
      />
      <img
        src={src}
        alt={alt}
        onClick={onClose}
        style={{
          position: "relative", maxWidth: "min(92vw, 900px)", maxHeight: "90vh",
          objectFit: "contain", borderRadius: 14, cursor: "zoom-out",
          animation: "clPopIn .22s cubic-bezier(.34,1.56,.64,1)",
        }}
      />
      <button
        type="button"
        aria-label="Close photo"
        onClick={onClose}
        style={{
          position: "absolute", top: 16, right: 16, width: 44, height: 44, borderRadius: 99,
          background: "rgba(22,24,29,.62)", border: "1px solid rgba(255,255,255,.16)",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
        }}
      >
        <X size={18} color="#FFFFFF" />
      </button>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(viewer, document.body)
    : viewer;
}

export function BatteryIcon({ color = "currentColor", level = 82 }) {
  return (
    <svg width="22" height="11" viewBox="0 0 22 11" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
      <rect x="0.5" y="0.5" width="18" height="10" rx="3" stroke={color} strokeWidth="1" opacity="0.8" />
      <path d="M20 3.75C20.4 3.75 20.6 4.0 20.6 4.5V6.5C20.6 7.0 20.4 7.25 20 7.25" fill={color} opacity="0.8" />
      <rect x="2" y="2" width={15 * (level / 100)} height="7" rx="1.5" fill={color} />
    </svg>
  );
}

export function StatusBar({ dark, overlay, background }) {
  const C = useColors();
  const { darkMode } = useApp();
  const color = dark ? (darkMode ? C.black : C.white) : C.jet;

  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      height: 48, padding: "0 22px",
      fontSize: T.body, fontWeight: 600, color, ...fBody,
      boxSizing: "border-box", pointerEvents: "none", zIndex: 90,
      background,
      ...(overlay ? { position: "absolute", top: 0, left: 0, right: 0, width: "100%" } : {}),
    }}>
      <span style={{
        fontWeight: "700", fontSize: 13.5, letterSpacing: "-0.2px", lineHeight: "1",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif"
      }}>
        9:41
      </span>
      <div style={{ display: "flex", gap: 5, alignItems: "center", height: "100%" }}>
        <SignalBars color={color} />
        <Wifi size={13} color={color} strokeWidth={2.5} style={{ display: "block" }} />
        <BatteryIcon color={color} level={85} />
      </div>
    </div>
  );
}
