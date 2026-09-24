import React from "react";
import { Check } from "lucide-react";
import { useColors } from "../../theme/ThemeContext";
import { useResponsive } from "../../theme/responsive";
import { useApp } from "../../context/AppContext";
import { LAYOUT, T, TD } from "../../theme/theme";
import { BrandLogo } from "../ui/Primitives";

/* =========================================================================
   FrameScroll — scrolling content region for registration forms.
   Adds 14px at the frame so, combined with each screen's own 18px content
   padding, the form sits at 32px from the card edge on desktop while the
   top bar / footers (which share the same 18px) stay aligned with the form.
   ========================================================================= */
function FrameScroll({ children }) {
  return (
    <div data-onboarding-frame style={{ position: "relative", flex: 1, minWidth: 0, minHeight: 0, overflow: "hidden" }}>
      <div style={{ height: "100%", overflowY: "auto", padding: "0 40px" }} className="cl-hide-scrollbar">{children}</div>
    </div>
  );
}

/* =========================================================================
   OnboardingFrame — branded, responsive shell for auth / onboarding forms.
     - Mobile (<1024): pass-through — screens keep their phone layout and
       bottom-stepper (unchanged experience).
     - Desktop (≥1024): top header with site logo matching portal header
       dimensions (64px height, 64px padding), and 64px outer padding on the
       login / registration container.
   Applied via the `withOnboardingFrame` HOC in the route registry so no
   screen file needs to change.
   ========================================================================= */

function StepRail({ step, total, steps }) {
  const C = useColors();
  const current = Math.min(Math.max(step, 1), total);
  return (
    <div aria-hidden="true" style={{ width: 200, flexShrink: 0, borderRight: `1px solid ${C.border}`, padding: "20px 20px", display: "flex", flexDirection: "column", gap: 0 }}>
      {(steps || Array.from({ length: total }, (_, i) => `Step ${i + 1}`)).map((label, index) => {
        const i = index + 1;
        const active = i === current;
        const done = i < current;
        return (
          <div key={i} style={{ display: "flex", gap: 12, minHeight: 54 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
              <span style={{
                width: 26, height: 26, borderRadius: 99, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: done ? C.brand : active ? C.brandTint : C.fog,
                border: `1.5px solid ${done || active ? C.brand : C.border}`,
                color: done ? C.white : active ? C.brand : C.slateLight,
                fontWeight: 800, fontSize: 12,
              }}>
                {done ? <Check size={13} strokeWidth={3} /> : i}
              </span>
              {i < total && <span style={{ width: 2, flex: 1, background: done ? C.brand : C.border, minHeight: 6, marginTop: 2 }} />}
            </div>
            <div style={{ minWidth: 0, paddingTop: 3 }}>
              <div style={{ fontSize: active ? 13 : 12, fontWeight: active ? 700 : 500, color: active ? C.jet : done ? C.jet : C.slate, lineHeight: 1.3 }}>{label}</div>
              {active && <div style={{ fontSize: 11, color: C.slate, marginTop: 1 }}>Step {i} of {total}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function OnboardingFrame({ step = 0, total = 0, label, steps, children }) {
  const C = useColors();
  const { darkMode } = useApp();
  const { isDesktop } = useResponsive();

  if (!isDesktop) return <>{children}</>;

  const hasRail = total > 0 && steps?.length > 1;

  return (
    <div className="cl-auth-bg" style={{ height: "100%", overflowY: "auto", display: "flex", flexDirection: "column" }}>
      {/* Top Header matching Portal Header size (64px), padding (0 64px), and position */}
      <header
        style={{
          height: LAYOUT.desktop.topBarH,
          background: C.white,
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 64px",
          boxSizing: "border-box",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <BrandLogo height={34} onDark={darkMode} />
        </div>
        {total > 0 && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 999, background: C.brandTint, color: C.brandIcon, fontSize: 12, fontWeight: 700 }}>
            Step {step} of {total}{label ? ` · ${label}` : ""}
          </span>
        )}
      </header>

      {/* Main Form container with 64px padding on login / onboarding page */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "64px" }}>
        <div style={{
          width: hasRail ? "min(100%, 920px)" : "min(100%, 560px)",
          height: "min(760px, calc(100vh - 128px - 64px))",
          maxHeight: "calc(100vh - 128px - 64px)",
          background: C.white,
          color: C.jet,
          borderRadius: 22,
          border: `1px solid ${C.border}`,
          boxShadow: "0 24px 60px -28px rgba(22,24,29,.35)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>
          <div style={{ flex: 1, minHeight: 0, display: "flex", padding: "24px 32px" }}>
            {hasRail && <StepRail step={step} total={total} steps={steps} />}
            <FrameScroll>{children}</FrameScroll>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Route-level wrapper — applies the frame without touching screen code. */
export const withOnboardingFrame = (meta) => (Component) => (props) => (
  <OnboardingFrame step={meta.step} total={meta.total} label={meta.label} steps={meta.steps}>
    <Component {...props} />
  </OnboardingFrame>
);