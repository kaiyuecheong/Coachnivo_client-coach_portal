import React, { useState, useEffect } from "react";
import {
  Search, Users, Mail, Eye, EyeOff, Check,
  Upload, CheckCircle2, ClipboardList, Clock, Lock, Camera,
  Plus, Trash2, CreditCard, ScanFace, FileCheck2, Smartphone, XCircle, ChevronRight,
} from "lucide-react";
import { CL, CD, fDisplay, fBody, LOGO_WHITE_SRC, T } from "../../theme/theme";
import { useApp } from "../../context/AppContext";
import { useResponsive } from "../../theme/responsive";
import {
  Btn, Card, Badge, Toggle, TopBar, Field, CheckboxRow, RadioRow,
  SearchMultiSelect, Avatar, Chip, BottomSheet, Spinner, LogoMark, RequiredMark,
  BrandLogo, PasswordRequirements, passwordValid,
} from "../../components/ui/Primitives";
import { SportSearchMultiSelect } from "../../components/ui/SportUI";
import { HandleField } from "../../components/ui/PublicIdentityFields";
import { LocationField } from "../../components/ui/LocationField";
import { isValidHandle } from "../../utils/name";
import { EMPTY_VERIFICATION_CODE, isAcceptedPrototypeCode, isValidPhone } from "../../utils/contactVerification";
import { getRoleHome, getRoleOnboarding } from "../../utils/roles";
import {
  LANGUAGE_OPTIONS, GENDER_OPTIONS, SPORT_OPTIONS_FULL,
  COACHING_CATEGORY_OPTIONS, SKILL_LEVEL_OPTIONS, AGE_GROUP_OPTIONS,
  COACHING_EXPERIENCE_LEVELS, COACHING_FORMAT_OPTIONS, ID_TYPE_OPTIONS,
  CERTIFICATION_TYPE_OPTIONS,
} from "../../data/mockData";

function AppleIcon({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 384 512" fill={color} style={{ flexShrink: 0 }}>
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

function SelectField({ label, value, onChange, options, placeholder = "Select…", required }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const fieldId = React.useId();
  const inputStyle = { width: "100%", border: `1.5px solid ${C.border}`, borderRadius: 13, padding: "11px 13px", fontSize: T.bodyLg, outline: "none", boxSizing: "border-box", background: C.white, color: C.jet, ...fBody };
  const labelStyle = { fontSize: T.labelLg, fontWeight: 600, color: C.jet, marginBottom: 6, ...fBody };
  return (
    <div>
      <label htmlFor={fieldId} style={{ ...labelStyle, display: "block" }}>{label}{required && <RequiredMark />}</label>
      <select
        id={fieldId}
        name={String(label).toLowerCase().replace(/[^a-z0-9]+/g, "-")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputStyle, appearance: "auto", background: C.white, color: value ? C.jet : C.slateLight }}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

const TERMS_POINTS = [
  "We collect your location to show nearby coaches and enable travel-radius search.",
  "Payment details are processed by our PCI-compliant payment partner - CoachNivo never stores full card numbers.",
  "If you're booking for someone under 18, a parent or guardian must provide consent before the session is confirmed.",
  "Coaches working with minors must hold a valid Working with Children Check, verified before their profile goes live.",
  "You can request a full export or deletion of your data at any time from Account Settings.",
];

function LegalSheet({ open, onClose }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  return (
    <BottomSheet open={open} onClose={onClose} title="Terms & Conditions" heightPct={60}>
      <Badge tone="neutral">Version 2.1 · Updated Jun 2026</Badge>
      <div style={{ marginTop: 14, fontSize: T.support, color: C.slate, lineHeight: 1.7, ...fBody }}>
        {TERMS_POINTS.map((t, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <Check size={14} color={C.brand} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{t}</span>
          </div>
        ))}
      </div>
    </BottomSheet>
  );
}

export function ScreenSplash({ nav }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const { isDesktop } = useResponsive();
  // Splash is purely branding + loading — it establishes the brand while the
  // app "warms up", then hands off automatically. No auth actions live here.
  useEffect(() => {
    const t = setTimeout(() => nav("get-started"), 1600);
    return () => clearTimeout(t);
  }, [nav]);

  return (
    <div style={{ height: "100vh", minHeight: "100vh", background: C.white, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 28, textAlign: "center" }}>
      <div style={{ animation: "clFadeUp .5s ease", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: isDesktop ? 20 : 14 }}>
        <BrandLogo height={isDesktop ? 56 : 40} onDark={darkMode} />
      </div>
      <div style={{ marginTop: 34 }}>
        <Spinner size={22} color={C.slateLight} />
      </div>
    </div>
  );
}

export function ScreenGetStarted({ nav }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const { isDesktop } = useResponsive();
  return (
    <div
      style={{
        height: "100%",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        overflow: "hidden",
        background: C.white,
      }}
    >
      {/* Background Image */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url("/splash-bg.png")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          zIndex: 1,
        }}
      />

      {/* Top Logo / Brand Accent */}
      <div
        style={{
          position: "absolute",
          top: isDesktop ? 18 : 48,
          left: isDesktop ? 64 : 20,
          zIndex: 3,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <BrandLogo height={isDesktop ? 34 : 28} onDark />
      </div>

      {/* Content Container Centered */}
      <div
        style={{
          position: "relative",
          zIndex: 3,
          width: "100%",
          maxWidth: isDesktop ? 560 : undefined,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "36px 24px 32px",
          textAlign: "center",
          animation: "clFadeUp .5s ease",
        }}
      >
        {/* Welcome Header */}
        <div
          style={{
            fontSize: isDesktop ? 56 : 36,
            fontWeight: 700,
            color: CL.white,
            lineHeight: 1.15,
            ...fDisplay,
          }}
        >
          Welcome to
        </div>

        {/* Main Title */}
        <div
          style={{
            fontSize: isDesktop ? 56 : 38,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            marginTop: 4,
            marginBottom: 12,
            color: C.brand,
            ...fDisplay,
          }}
        >
          CoachNivo
        </div>

        {/* Subtitle / Description */}
        <div
          style={{
            color: CL.onDark,
            fontSize: T.subtitleLg,
            lineHeight: 1.5,
            marginBottom: 28,
            maxWidth: isDesktop ? 460 : 310,
            ...fBody,
          }}
        >
          The best sports coaching app to elevate your performance and reach your goals!
        </div>

        {/* Action Buttons — fixed 200×48 */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <Btn
            variant="primary"
            onClick={() => nav("role-select")}
            style={{ width: 300, height: 48, minHeight: 48, padding: 0, boxSizing: "border-box", background: C.brand, color: "#FFFFFF" }}
          >
            Get Started
          </Btn>
          <Btn
            variant="secondary"
            onClick={() => nav("auth", { mode: "login", backTo: "get-started" })}
            style={{
              width: 300,
              height: 48,
              minHeight: 48,
              boxSizing: "border-box",
              padding: 0,
              borderRadius: 16,
              background: CL.white,
              border: `1px solid ${CL.border || "rgba(0, 0, 0, 0.08)"}`,
              color: CL.jet,
              fontSize: T.subtitle,
              fontWeight: 600,
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.15)",
            }}
          >
            Sign In
          </Btn>
        </div>
      </div>
    </div>
  );
}

function RoleOption({ role, title, body, icon: Icon, onClick, C }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cl-card cl-card--interactive"
      data-interactive="true"
      style={{
        width: "100%", textAlign: "left", background: C.white, border: `1.5px solid ${C.border}`,
        borderRadius: 18, padding: 16, display: "flex", gap: 14, alignItems: "center",
        cursor: "pointer", marginBottom: 12, outline: "none",
        boxShadow: "none",
      }}
    >
      <div style={{ width: 48, height: 48, borderRadius: 14, background: C.brandTint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={22} color={C.brand} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: C.jet, fontSize: T.subtitleLg, marginBottom: 3, ...fDisplay }}>{title}</div>
        <div style={{ fontSize: T.labelLg, color: C.slate, lineHeight: 1.45, ...fBody }}>{body}</div>
      </div>
      <ChevronRight size={18} color={C.slateLight} style={{ flexShrink: 0 }} />
    </button>
  );
}

export function ScreenRoleSelect({ nav, setRole }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;

  const handleSelectRole = (selectedRole) => {
    setRole?.(selectedRole);
    nav("auth", { mode: "signup", backTo: "role-select" }, selectedRole);
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.white }}>
      <TopBar title="" onBack={() => nav("get-started")} />
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px 24px" }} className="cl-hide-scrollbar">
        <div style={{ fontSize: T.displayLg, fontWeight: 600, color: C.jet, marginTop: 18, ...fDisplay }}>What brings you to CoachNivo?</div>
        <div style={{ fontSize: T.support, color: C.slate, marginTop: 6, marginBottom: 22, ...fBody }}>
          You can add a coaching profile later from the same account.
        </div>
        <RoleOption
          role="client"
          icon={Search}
          title="Find a coach"
          body="Search, book and pay for sessions with verified coaches near you."
          onClick={() => handleSelectRole("client")}
          C={C}
        />
        <RoleOption
          role="coach"
          icon={Users}
          title="Coach others"
          body="List your services, manage bookings and get paid automatically."
          onClick={() => handleSelectRole("coach")}
          C={C}
        />
      </div>
      <div style={{ padding: 16, display: "flex", justifyContent: "center", textAlign: "center" }}>
        <button
          type="button"
          onClick={() => nav("auth", { mode: "login", backTo: "role-select" })}
          style={{ background: "none", border: "none", color: C.slate, fontSize: T.support, cursor: "pointer", ...fBody }}
        >
          Have an existing account? <span style={{ color: C.brand, fontWeight: 600 }}>Sign In</span>
        </button>
      </div>
    </div>
  );
}

export function ScreenAuth({ nav, resetNav, params, role, toast, biometric, updateCoachOnboarding, updateClientIdentity, updateBusinessOnboarding }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const [mode, setMode] = useState(params?.mode || "login");
  useEffect(() => {
    if (params?.mode) setMode(params.mode);
  }, [params?.mode]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(params?.email || "");
  const [phone, setPhone] = useState(params?.phone || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [agree, setAgree] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const canSubmit = mode === "login"
    ? true
    : firstName.trim() && lastName.trim() && email.trim() && isValidPhone(phone) && passwordValid(password) && passwordsMatch && agree;
  const homeScreen = getRoleHome(role);
  const onboardingScreen = params?.next || (role === "businessCoach" ? "coach-info" : getRoleOnboarding(role));
  const onboardingParams = params?.invitation ? { invitation: true, backTo: params?.backTo || "business-coach-login" } : {};

  const proceedAfterAuth = (method) => {
    const isSocial = method === "apple" || method === "google";
    if (mode === "login") { resetNav(homeScreen, {}, role); return; }
    if (role === "coach" || role === "businessCoach") {
      const fn = firstName.trim() || (isSocial ? (method === "apple" ? "Apple" : "Google") : "");
      const ln = lastName.trim() || (isSocial ? "User" : "");
      updateCoachOnboarding?.({
        firstName: fn, lastName: ln, email: email.trim(),
        phone: phone.trim(), phoneVerified: false,
        name: `${fn} ${ln}`.trim(),
        namePrivacy: "initial",
      });
    }
    if (role === "client" && !isSocial) {
      // Legal name is collected for verification & payments only — the
      // username is set in the "About you" step.
      updateClientIdentity?.({
        firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(),
        phone: phone.trim(), phoneVerified: false,
      });
    }
    if (role === "business") {
      const fn = firstName.trim() || (isSocial ? (method === "apple" ? "Apple" : "Google") : "");
      const ln = lastName.trim() || (isSocial ? "User" : "");
      updateBusinessOnboarding?.({ representativeName: `${fn} ${ln}`.trim(), ownerEmail: email.trim(), phone: phone.trim(), phoneVerified: false });
    }
    if (isSocial) {
      nav("verify-phone", {
        phone: isValidPhone(phone) ? phone.trim() : "",
        next: onboardingScreen,
        nextParams: onboardingParams,
        authParams: { next: onboardingScreen, backTo: params?.backTo, invitation: params?.invitation },
      });
      return;
    }
    nav("verify-email", {
      email: email.trim(),
      next: "verify-phone",
      nextParams: {
        phone: phone.trim(),
        next: onboardingScreen,
        nextParams: onboardingParams,
        authParams: { next: onboardingScreen, backTo: params?.backTo, invitation: params?.invitation },
      },
      authParams: { next: onboardingScreen, backTo: params?.backTo, invitation: params?.invitation },
    });
  };

  const goCreateAccount = () => nav("role-select");

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflowX: "hidden" }}>
      <TopBar title="" onBack={() => nav(params?.backTo || "role-select")} />
      <div style={{ flex: 1, minWidth: 0, overflowY: "auto", overflowX: "hidden", padding: "16px 18px 24px" }} className="cl-hide-scrollbar">
      <div style={{ fontSize: T.displayLg, fontWeight: 600, color: C.jet, ...fDisplay }}>{mode === "signup" ? "Create your account" : "Welcome back"}</div>
      <div style={{ fontSize: T.support, color: C.slate, marginTop: 6, marginBottom: 20, ...fBody }}>
        {mode === "signup"
          ? (role === "coach" || role === "businessCoach" ? "Signing up as a Coach." : role === "business" ? "Signing up as a Business." : "Signing up as a Client.")
          : "Welcome back - sign in to your CoachNivo account."}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {mode === "signup" && (
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 10, width: "100%", minWidth: 0 }}>
            <Field label="First name" name="given-name" autoComplete="given-name" placeholder="Josh" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            <Field label="Last name" name="family-name" autoComplete="family-name" placeholder="Whitfield" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </div>
        )}

        <Field label="Email address" name="email" autoComplete="email" type="email" inputMode="email" placeholder="you@email.com" icon={Mail} value={email} onChange={(e) => setEmail(e.target.value)} required />
        {mode === "signup" && (
          <Field label="Phone number" name="phone" autoComplete="tel" type="tel" inputMode="tel" placeholder="04XX XXX XXX" icon={Smartphone} value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9+()\-\s]/g, ""))} required />
        )}
        <Field label="Password" name="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} placeholder="••••••••" type={showPw ? "text" : "password"} rightIcon={showPw ? EyeOff : Eye} onRight={() => setShowPw((s) => !s)} value={password} onChange={(e) => setPassword(e.target.value)} required />
        {mode === "signup" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <PasswordRequirements password={password} style={{ marginTop: -4 }} />
            <Field label="Confirm password" name="confirm-password" autoComplete="new-password" placeholder="••••••••" type={showConfirmPw ? "text" : "password"} rightIcon={showConfirmPw ? EyeOff : Eye} onRight={() => setShowConfirmPw((s) => !s)} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            {confirmPassword.length > 0 && !passwordsMatch && (
              <div style={{ fontSize: T.captionLg, color: C.danger, marginTop: 6, ...fBody }}>Passwords don't match</div>
            )}
          </div>
        )}
      </div>

      {mode === "login" && (
        <div style={{ textAlign: "right", marginTop: 10 }}>
          <button onClick={() => nav("forgot-password", { role, backTo: params?.backTo })} style={{ background: "none", border: "none", color: C.brand, fontWeight: 600, fontSize: T.labelLg, cursor: "pointer", ...fBody }}>
            Forgot password?
          </button>
        </div>
      )}

      {mode === "signup" && (
        <button type="button" role="checkbox" aria-checked={agree} onClick={() => setAgree((v) => !v)} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "none", border: "none", cursor: "pointer", textAlign: "left", marginTop: 14, padding: "6px 0" }}>
          <div style={{ width: 19, height: 19, borderRadius: 6, border: `1.5px solid ${agree ? C.brand : C.border}`, background: agree ? C.brand : C.white, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
            {agree && <Check size={12} color="#FFFFFF" />}
          </div>
          <span style={{ fontSize: T.labelLg, color: C.jet, lineHeight: 1.5, ...fBody }}>
            I agree to the{" "}
            <span onClick={(e) => { e.stopPropagation(); setShowTerms(true); }} style={{ color: C.brand, fontWeight: 600, textDecoration: "underline" }}>Terms & Conditions</span>
            <RequiredMark />
          </span>
        </button>
      )}

      <div style={{ marginTop: 18 }}>
        <Btn full disabled={!canSubmit} onClick={proceedAfterAuth} style={{ background: C.brand, color: "#FFFFFF" }}>{mode === "signup" ? "Create account" : "Sign in"}</Btn>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0" }}>
        <div style={{ flex: 1, height: 1, background: C.border }} />
        <span style={{ fontSize: T.label, color: C.slateLight, ...fBody }}>or</span>
        <div style={{ flex: 1, height: 1, background: C.border }} />
      </div>

      <Btn full variant="dark" icon={AppleIcon}  onClick={() => { toast(mode === "signup" ? "Signed up with Apple" : "Signed in with Apple"); proceedAfterAuth("apple"); }}>
        Continue with Apple
      </Btn>
      <div style={{ marginTop: 10 }}>
        <Btn full variant="outline"  onClick={() => { toast(mode === "signup" ? "Signed up with Google" : "Signed in with Google"); proceedAfterAuth("google"); }}>Continue with Google</Btn>
      </div>
      </div>

      <div style={{ marginTop: "auto", textAlign: "center", padding: 16 }}>
        <button onClick={mode === "signup" ? () => setMode("login") : goCreateAccount} style={{ background: "none", border: "none", color: C.slate, fontSize: T.support, cursor: "pointer", ...fBody }}>
          {mode === "signup" ? "Already have an account? " : "New to CoachNivo? "}
          <span style={{ color: C.brand, fontWeight: 600 }}>{mode === "signup" ? "Sign in" : "Create an account"}</span>
        </button>
      </div>

      <LegalSheet open={showTerms} onClose={() => setShowTerms(false)} />
    </div>
  );
}

/* =========================================================================
   FORGOT PASSWORD — three-step reset flow shared by both roles: email →
   6-digit code → new password. Prototype scope, so any well-formed input
   is accepted and simply advances the flow (mirrors login/signup here).
   ========================================================================= */
export function ScreenForgotPassword({ nav, params, role, toast }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const effectiveRole = params?.role || role;
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const canSubmit = email.trim().length > 3 && email.includes("@");

  const submit = () => {
    if (!canSubmit || sending) return;
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast(`Reset code sent to ${email}`);
      nav("reset-code", { email, role: effectiveRole, backTo: params?.backTo });
    }, 900);
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar title="" onBack={() => nav("auth", { mode: "login", backTo: params?.backTo })} />
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px 24px" }} className="cl-hide-scrollbar">
      <div style={{ width: 52, height: 52, borderRadius: 16, background: C.brandTint, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
        <Lock size={22} color={C.brand} />
      </div>
      <div style={{ fontSize: T.displayLg, fontWeight: 600, color: C.jet, ...fDisplay }}>Forgot your password?</div>
      <div style={{ fontSize: T.support, color: C.slate, marginTop: 6, marginBottom: 24, lineHeight: 1.55, ...fBody }}>
        Enter the email on your {effectiveRole === "coach" ? "coach" : effectiveRole === "business" ? "business" : "client"} account and we'll send you a 6-digit code to reset it.
      </div>
      <Field label="Email address" placeholder="you@email.com" icon={Mail} value={email} onChange={(e) => setEmail(e.target.value)} required />
      <div style={{ marginTop: 22 }}>
        <Btn full disabled={!canSubmit} loading={sending} loadingText="Sending…" onClick={submit}>Send reset code</Btn>
      </div>
      </div>
      <div style={{ marginTop: "auto", textAlign: "center", padding: 16 }}>
        <button onClick={() => nav("auth", { mode: "login", backTo: params?.backTo })} style={{ background: "none", border: "none", color: C.slate, fontSize: T.support, cursor: "pointer", ...fBody }}>
          Remembered it? <span style={{ color: C.brand, fontWeight: 600 }}>Back to sign in</span>
        </button>
      </div>
    </div>
  );
}

export function ScreenResetCode({ nav, params, toast }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const email = params?.email || "";
  const role = params?.role;
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const inputsRef = React.useRef([]);
  const code = digits.join("");
  const canSubmit = code.length === 6;

  const setDigit = (i, raw) => {
    const v = raw.replace(/[^0-9]/g, "").slice(-1);
    setDigits((d) => { const n = [...d]; n[i] = v; return n; });
    if (v && i < 5) inputsRef.current[i + 1]?.focus();
  };
  const onKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputsRef.current[i - 1]?.focus();
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar title="" onBack={() => nav("forgot-password", { role: params?.role, backTo: params?.backTo })} />
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px 24px" }} className="cl-hide-scrollbar">
      <div style={{ width: 52, height: 52, borderRadius: 16, background: C.brandTint, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
        <Smartphone size={22} color={C.brand} />
      </div>
      <div style={{ fontSize: T.displayLg, fontWeight: 600, color: C.jet, ...fDisplay }}>Enter the code<RequiredMark /></div>
      <div style={{ fontSize: T.support, color: C.slate, marginTop: 6, marginBottom: 26, lineHeight: 1.55, ...fBody }}>
        We sent a 6-digit code to <span style={{ color: C.jet, fontWeight: 600 }}>{email || "your email"}</span>.
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-start" }}>
        {digits.map((d, i) => (
          <input
            key={i}
            name={`reset-code-${i + 1}`}
            aria-label={`Reset code digit ${i + 1} of 6`}
            autoComplete={i === 0 ? "one-time-code" : "off"}
            ref={(el) => (inputsRef.current[i] = el)}
            value={d}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            inputMode="numeric"
            maxLength={1}
            style={{
              flex: "0 1 60px", minWidth: 0, aspectRatio: "1 / 1", height: "auto", textAlign: "center", fontSize: T.headingLg, fontWeight: 700,
              border: `1.5px solid ${d ? C.brand : C.border}`, borderRadius: 13, outline: "none",
              color: C.jet, boxSizing: "border-box", ...fDisplay,
            }}
          />
        ))}
      </div>
      <div style={{ marginTop: 24 }}>
        <Btn full disabled={!canSubmit} onClick={() => nav("reset-password", { email, role, backTo: params?.backTo })}>Verify code</Btn>
      </div>
      <div style={{ marginTop: 16, textAlign: "center" }}>
        <button onClick={() => toast(`Code resent to ${email || "your email"}`)} style={{ background: "none", border: "none", color: C.slate, fontSize: T.support, cursor: "pointer", ...fBody }}>
          Didn't get it? <span style={{ color: C.brand, fontWeight: 600 }}>Resend code</span>
        </button>
      </div>
      </div>
    </div>
  );
}

export function ScreenResetPassword({ nav, params, toast }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const role = params?.role;
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const match = password.length > 0 && password === confirm;
  const canSubmit = passwordValid(password) && match;

  const submit = () => {
    if (!canSubmit) return;
    toast("Password reset - sign in with your new password");
    nav("auth", { mode: "login", backTo: params?.backTo });
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar title="" onBack={() => nav("reset-code", { email: params?.email, role, backTo: params?.backTo })} />
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px 24px" }} className="cl-hide-scrollbar">
      <div style={{ width: 52, height: 52, borderRadius: 16, background: C.brandTint, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
        <Check size={22} color={C.brand} />
      </div>
      <div style={{ fontSize: T.displayLg, fontWeight: 600, color: C.jet, ...fDisplay }}>Set a new password</div>
      <div style={{ fontSize: T.support, color: C.slate, marginTop: 6, marginBottom: 22, lineHeight: 1.55, ...fBody }}>
        Choose a new password for your account.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Field label="New password" placeholder="••••••••" type={showPw ? "text" : "password"} rightIcon={showPw ? EyeOff : Eye} onRight={() => setShowPw((s) => !s)} value={password} onChange={(e) => setPassword(e.target.value)} required />
        <PasswordRequirements password={password} style={{ marginTop: -4 }} />
        <div>
          <Field label="Confirm new password" placeholder="••••••••" type={showConfirm ? "text" : "password"} rightIcon={showConfirm ? EyeOff : Eye} onRight={() => setShowConfirm((s) => !s)} value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          {confirm.length > 0 && !match && (
            <div style={{ fontSize: T.captionLg, color: C.danger, marginTop: 6, ...fBody }}>Passwords don't match</div>
          )}
        </div>
      </div>
      <div style={{ marginTop: 22 }}>
        <Btn full disabled={!canSubmit} onClick={submit}>Reset password</Btn>
      </div>
      </div>
    </div>
  );
}

/* =========================================================================
   EMAIL VERIFICATION — new-account email check, separate from the forgot-
   password reset-code flow. Client and coach signups land here before Face
   ID setup. Any 6-digit code verifies; 000000 simulates an invalid/expired
   code so that state is demoable. Resend runs on a 30s cooldown and shows a
   confirmation banner + toast, with an inline countdown.
   ========================================================================= */
export function ScreenVerifyEmail({ nav, params, toast, role }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const email = params?.email || "your email";
  const next = params?.next || getRoleOnboarding(role);
  const nextParams = params?.nextParams || {};

  const [phase, setPhase] = useState("code"); // "code" | "error" | "success"
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const inputsRef = React.useRef([]);
  const code = digits.join("");
  const canVerify = code.length === 6;
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  const setDigit = (i, raw) => {
    const v = raw.replace(/[^0-9]/g, "").slice(-1);
    setDigits((d) => { const n = [...d]; n[i] = v; return n; });
    if (v && i < 5) inputsRef.current[i + 1]?.focus();
  };
  const onKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputsRef.current[i - 1]?.focus();
  };

  const resendCode = () => {
    setResent(true);
    setDigits(["", "", "", "", "", ""]);
    setPhase("code");
    setSecondsLeft(30);
    toast("A new code has been sent");
  };

  const verify = () => {
    if (!canVerify) return;
    if (code === "000000") { setPhase("error"); return; }
    setPhase("success");
  };

  const changeEmail = () => nav("auth", { mode: "signup", email, ...(params?.authParams || {}) });

  const continueAfterVerify = () => nav(next, nextParams);

  const mmss = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar title="" onBack={changeEmail} />
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px 24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }} className="cl-hide-scrollbar">
        {phase === "success" ? (
          <div style={{ width: "100%", maxWidth: 360, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginTop: 44 }}>
              <div style={{ width: 84, height: 84, borderRadius: 26, background: C.successTint, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <CheckCircle2 size={40} color={C.success} />
              </div>
              <div style={{ fontSize: T.displayLg, fontWeight: 600, color: C.jet, textAlign: "center", ...fDisplay }}>Your email is verified</div>
              <div style={{ fontSize: T.support, color: C.slate, marginTop: 8, lineHeight: 1.6, textAlign: "center", ...fBody }}>
                Thanks for confirming - let's continue setting up your account.
              </div>
            </div>
            <div style={{ marginTop: 28 }}>
              <Btn full onClick={continueAfterVerify}>Continue</Btn>
            </div>
          </div>
        ) : (
          <div style={{ width: "100%", maxWidth: 360, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: phase === "error" ? C.dangerTint : C.brandTint, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
              {phase === "error" ? <XCircle size={22} color={C.danger} /> : <Mail size={22} color={C.brand} />}
            </div>
            <div style={{ fontSize: T.displayLg, fontWeight: 600, color: C.jet, textAlign: "center", ...fDisplay }}>Verify your email<RequiredMark /></div>
            <div style={{ fontSize: T.support, color: C.slate, marginTop: 6, marginBottom: 24, lineHeight: 1.55, textAlign: "center", ...fBody }}>
              We've sent a verification code to <span style={{ color: C.jet, fontWeight: 600 }}>{email}</span>. Enter it below to activate your account.
            </div>

            {resent && phase === "code" && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.successTint, borderRadius: 12, padding: "10px 12px", marginBottom: 14, width: "100%", boxSizing: "border-box" }}>
                <CheckCircle2 size={14} color={C.success} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: T.labelLg, color: C.success, fontWeight: 600, ...fBody }}>A new code has been sent</span>
              </div>
            )}

            {phase === "error" && (
              <div style={{ background: C.dangerTint, border: `1px solid ${C.dangerBorder}`, borderRadius: 12, padding: "12px 14px", marginBottom: 14, width: "100%", boxSizing: "border-box", textAlign: "center" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <XCircle size={15} color={C.danger} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: T.body, fontWeight: 700, color: C.danger, ...fBody }}>Invalid or expired code</span>
                </div>
                <div style={{ fontSize: T.labelLg, color: C.slate, marginTop: 4, lineHeight: 1.5, ...fBody }}>
                  That code doesn't match or has expired. Check the email we sent, or request a new code.
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 8, width: "100%", justifyContent: "space-between", boxSizing: "border-box" }}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  name={`verification-code-${i + 1}`}
                  aria-label={`Verification code digit ${i + 1} of 6`}
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  ref={(el) => (inputsRef.current[i] = el)}
                  value={d}
                  onChange={(e) => setDigit(i, e.target.value)}
                  onKeyDown={(e) => onKeyDown(i, e)}
                  inputMode="numeric"
                  maxLength={1}
                  style={{
                    flex: 1, minWidth: 0, aspectRatio: "1 / 1", height: "auto", textAlign: "center", fontSize: T.headingLg, fontWeight: 700,
                    border: `1.5px solid ${phase === "error" ? C.dangerBorderSoft : d ? C.brand : C.border}`,
                    borderRadius: 13, outline: "none", color: C.jet, boxSizing: "border-box", background: C.white, ...fDisplay,
                  }}
                />
              ))}
            </div>

            <div style={{ marginTop: 24, width: "100%" }}>
              <Btn full disabled={!canVerify} onClick={verify}>Verify email</Btn>
            </div>

            <div style={{ marginTop: 16, display: "flex", justifyContent: "center", alignItems: "center", gap: 6, fontSize: T.support, ...fBody }}>
              {phase === "error" && (
                <button onClick={() => { setPhase("code"); setDigits(["", "", "", "", "", ""]); }} style={{ background: "none", border: "none", color: C.brand, fontWeight: 600, cursor: "pointer", fontSize: T.support, ...fBody }}>
                  Try again
                </button>
              )}
              {phase === "error" && <span style={{ color: C.slateLight }}>·</span>}
              {secondsLeft > 0 ? (
                <span style={{ color: C.slateLight }}>Resend code in {mmss}</span>
              ) : (
                <button onClick={resendCode} style={{ background: "none", border: "none", color: C.brand, fontWeight: 600, cursor: "pointer", fontSize: T.support, ...fBody }}>
                  {phase === "error" ? "Resend new code" : "Resend code"}
                </button>
              )}
            </div>

            <div style={{ marginTop: 18, textAlign: "center" }}>
              <button onClick={changeEmail} style={{ background: "none", border: "none", color: C.slate, fontSize: T.support, cursor: "pointer", ...fBody }}>
                Wrong email? <span style={{ color: C.brand, fontWeight: 600 }}>Change email</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   PHONE VERIFICATION — shared onboarding step for client and coach signups.
   The prototype accepts any complete numeric code except an all-zero code;
   no generated code is exposed in the UI.
   ========================================================================= */
export function ScreenVerifyPhone({ nav, params, toast, role, updateClientIdentity, updateCoachOnboarding, updateBusinessOnboarding, onComplete }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const initialPhone = params?.phone || "";
  const next = params?.next || getRoleOnboarding(role);
  const nextParams = params?.nextParams || { next: getRoleOnboarding(role) };
  const [phone, setPhone] = useState(initialPhone);
  const [stage, setStage] = useState(initialPhone ? "code" : "phone");
  const [phase, setPhase] = useState("code");
  const [digits, setDigits] = useState(() => [...EMPTY_VERIFICATION_CODE]);
  const [secondsLeft, setSecondsLeft] = useState(initialPhone ? 30 : 0);
  const [resent, setResent] = useState(false);
  const inputsRef = React.useRef([]);
  const code = digits.join("");

  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const timer = window.setTimeout(() => setSecondsLeft((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  const setDigit = (index, rawValue) => {
    const digit = rawValue.replace(/\D/g, "").slice(-1);
    setDigits((current) => current.map((item, itemIndex) => itemIndex === index ? digit : item));
    setPhase("code");
    if (digit && index < 5) inputsRef.current[index + 1]?.focus();
  };

  const onCodeKeyDown = (index, event) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) inputsRef.current[index - 1]?.focus();
  };

  const onCodePaste = (event) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split("");
    if (!pasted.length) return;
    event.preventDefault();
    setDigits(Array.from({ length: 6 }, (_, index) => pasted[index] || ""));
    setPhase("code");
    inputsRef.current[Math.min(pasted.length, 6) - 1]?.focus();
  };

  const sendCode = () => {
    if (!isValidPhone(phone)) return;
    setStage("code");
    setPhase("code");
    setDigits([...EMPTY_VERIFICATION_CODE]);
    setSecondsLeft(30);
    setResent(false);
    toast?.("Verification code sent");
    window.setTimeout(() => inputsRef.current[0]?.focus(), 120);
  };

  const resendCode = () => {
    if (secondsLeft > 0) return;
    setDigits([...EMPTY_VERIFICATION_CODE]);
    setPhase("code");
    setSecondsLeft(30);
    setResent(true);
    toast?.("A new code has been sent");
    window.setTimeout(() => inputsRef.current[0]?.focus(), 120);
  };

  const verify = () => {
    if (!isAcceptedPrototypeCode(code)) {
      setPhase("error");
      return;
    }
    const verifiedPhone = phone.trim();
    if (role === "coach" || role === "businessCoach") updateCoachOnboarding?.({ phone: verifiedPhone, phoneVerified: true });
    else if (role === "business") updateBusinessOnboarding?.({ phone: verifiedPhone, phoneVerified: true });
    else updateClientIdentity?.({ phone: verifiedPhone, phoneVerified: true });
    if (params?.pendingClientPrefs) onComplete?.({ ...params.pendingClientPrefs, mobile: verifiedPhone, phoneVerified: true });
    setPhase("success");
  };

  const continueAfterVerify = () => nav(next, nextParams);
  const editPhone = () => {
    setPhone("");
    setStage("phone");
    setPhase("code");
    setDigits([...EMPTY_VERIFICATION_CODE]);
    setSecondsLeft(0);
    setResent(false);
  };
  const back = () => params?.backTo
    ? nav(params.backTo, params.backParams || {})
    : nav("auth", { mode: "signup", phone, ...(params?.authParams || {}) });
  const mmss = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.white }}>
      {phase !== "success" ? <TopBar title="" onBack={stage === "code" ? editPhone : back} /> : null}
      <div className="cl-hide-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "16px 18px 28px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        {phase === "success" ? (
          <>
            <div style={{ textAlign: "center", marginTop: 64 }}>
              <div style={{ width: 84, height: 84, borderRadius: 26, background: C.successTint, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <CheckCircle2 size={40} color={C.success} />
              </div>
              <div style={{ fontSize: T.displayLg, fontWeight: 600, color: C.jet, ...fDisplay }}>Your phone is verified</div>
              <div style={{ fontSize: T.support, color: C.slate, marginTop: 8, lineHeight: 1.6, ...fBody }}>
                Your number is ready for secure sign-in, recovery and important session updates.
              </div>
            </div>
            <div style={{ marginTop: 28 }}><Btn full onClick={continueAfterVerify}>Continue</Btn></div>
          </>
        ) : stage === "phone" ? (
          <>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: C.brandTint, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
              <Smartphone size={23} color={C.brand} />
            </div>
            <div style={{ fontSize: T.displayLg, fontWeight: 600, color: C.jet, ...fDisplay }}>Add your phone number</div>
            <div style={{ fontSize: T.support, color: C.slate, marginTop: 6, marginBottom: 24, lineHeight: 1.55, ...fBody }}>
              We’ll verify this number for account recovery and important booking updates.
            </div>
            <Field label="Phone number" name="onboarding-phone" autoComplete="tel" type="tel" inputMode="tel" placeholder="04XX XXX XXX" icon={Smartphone} value={phone} onChange={(event) => setPhone(event.target.value.replace(/[^0-9+()\-\s]/g, ""))} required />
            <div style={{ marginTop: 22 }}><Btn full disabled={!isValidPhone(phone)} onClick={sendCode}>Send verification code</Btn></div>
          </>
        ) : (
          <>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: phase === "error" ? C.dangerTint : C.brandTint, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
              {phase === "error" ? <XCircle size={23} color={C.danger} /> : <Smartphone size={23} color={C.brand} />}
            </div>
            <div style={{ fontSize: T.displayLg, fontWeight: 600, color: C.jet, ...fDisplay }}>Verify your phone<RequiredMark /></div>
            <div style={{ fontSize: T.support, color: C.slate, marginTop: 6, marginBottom: 24, lineHeight: 1.55, ...fBody }}>
              Enter the six-digit code sent to <span style={{ color: C.jet, fontWeight: 600 }}>{phone}</span>.
            </div>

            {resent && phase === "code" ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.successTint, borderRadius: 12, padding: "10px 12px", marginBottom: 14 }}>
                <CheckCircle2 size={14} color={C.success} />
                <span style={{ fontSize: T.labelLg, color: C.success, fontWeight: 600, ...fBody }}>A new code has been sent</span>
              </div>
            ) : null}

            {phase === "error" ? (
              <div role="alert" style={{ background: C.dangerTint, border: `1px solid ${C.dangerBorder}`, borderRadius: 12, padding: "12px 14px", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <XCircle size={15} color={C.danger} />
                  <span style={{ fontSize: T.body, fontWeight: 700, color: C.danger, ...fBody }}>Invalid verification code</span>
                </div>
                <div style={{ fontSize: T.labelLg, color: C.slate, marginTop: 4, lineHeight: 1.5, ...fBody }}>Enter any six-digit code except all zeros.</div>
              </div>
            ) : null}

            <div onPaste={onCodePaste} style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => { inputsRef.current[index] = element; }}
                  name={`phone-verification-code-${index + 1}`}
                  aria-label={`Phone verification code digit ${index + 1} of 6`}
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(event) => setDigit(index, event.target.value)}
                  onKeyDown={(event) => onCodeKeyDown(index, event)}
                  style={{ flex: "0 1 60px", minWidth: 0, aspectRatio: "1 / 1", height: "auto", textAlign: "center", fontSize: T.headingLg, fontWeight: 700, border: `1.5px solid ${phase === "error" ? C.dangerBorderSoft : digit ? C.brand : C.border}`, borderRadius: 13, outline: "none", background: C.white, color: C.jet, boxSizing: "border-box", ...fDisplay }}
                />
              ))}
            </div>

            <div style={{ marginTop: 24 }}><Btn full disabled={code.length !== 6} onClick={verify}>Verify phone</Btn></div>
            <div style={{ marginTop: 16, display: "flex", justifyContent: "center", alignItems: "center", gap: 6, fontSize: T.support, ...fBody }}>
              {phase === "error" ? (
                <button type="button" onClick={() => { setPhase("code"); setDigits([...EMPTY_VERIFICATION_CODE]); }} style={{ minHeight: 44, background: "none", border: "none", color: C.brand, fontWeight: 600, cursor: "pointer", fontSize: T.support, ...fBody }}>Try again</button>
              ) : null}
              {phase === "error" ? <span style={{ color: C.slateLight }}>·</span> : null}
              {secondsLeft > 0 ? <span style={{ color: C.slateLight }}>Resend code in {mmss}</span> : (
                <button type="button" onClick={resendCode} style={{ minHeight: 44, background: "none", border: "none", color: C.brand, fontWeight: 600, cursor: "pointer", fontSize: T.support, ...fBody }}>Resend code</button>
              )}
            </div>
            <div style={{ marginTop: 6, textAlign: "center" }}>
              <button type="button" onClick={editPhone} style={{ minHeight: 44, background: "none", border: "none", color: C.slate, cursor: "pointer", fontSize: T.support, ...fBody }}>Use a different number</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* Face ID / biometric setup screen removed from the portal. */

export function ScreenCoachInfo({ nav, params, coachOnboarding, updateCoachOnboarding }) {
  const { darkMode, isHandleTaken } = useApp();
  const C = darkMode ? CD : CL;
  const inputStyle = { width: "100%", border: `1.5px solid ${C.border}`, borderRadius: 13, padding: "11px 13px", fontSize: T.bodyLg, outline: "none", boxSizing: "border-box", background: C.white, color: C.jet, ...fBody };
  const labelStyle = { fontSize: T.labelLg, fontWeight: 600, color: C.jet, marginBottom: 6, ...fBody };
  const [photo, setPhoto] = useState(coachOnboarding.photo || null);
  const [name, setName] = useState(coachOnboarding.name || "");
  const [handle, setHandle] = useState(coachOnboarding.handle || "");
  const [namePrivacy, setNamePrivacy] = useState(coachOnboarding.namePrivacy || "initial");
  const [bio, setBio] = useState(coachOnboarding.bio || "");
  const [yearsExperience, setYearsExperience] = useState(coachOnboarding.yearsExperience || "");
  const [gender, setGender] = useState(coachOnboarding.gender || "");
  const [languages, setLanguages] = useState(coachOnboarding.languages || []);
  const [location, setLocation] = useState(coachOnboarding.location || null);

  const photoInputRef = React.useRef(null);
  const onPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setPhoto(URL.createObjectURL(file));
    e.target.value = "";
  };

  const experienceOptions = [...Array.from({ length: 29 }, (_, i) => `${i + 1} year${i === 0 ? "" : "s"}`), "30+ years"];

  const complete = name.trim() && bio.trim() && yearsExperience && languages.length > 0 && location && isValidHandle(handle) && !isHandleTaken(handle);

  const proceed = () => {
    updateCoachOnboarding({ photo, name, handle, namePrivacy, bio, yearsExperience, gender, languages, location });
    nav("coach-expertise", params?.invitation ? { invitation: true, backTo: params?.backTo } : {});
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar title="" onBack={() => nav("auth", { mode: "signup", next: "coach-info", invitation: params?.invitation, backTo: params?.backTo })} />
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px 24px" }} className="cl-hide-scrollbar">

        <div style={{ fontSize: T.displayLg, fontWeight: 600, color: C.jet, ...fDisplay }}>Coach information</div>
        <div style={{ fontSize: T.support, color: C.slate, marginTop: 8, marginBottom: 20, lineHeight: 1.55, ...fBody }}>
          This is what clients see first - your photo, name and story help them decide if you're the right coach for them.
        </div>

        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <button type="button" onClick={() => photoInputRef.current?.click()} style={{ position: "relative", background: "none", border: "none", cursor: "pointer", padding: 0, display: "inline-block" }}>
            {photo ? (
              <img src={photo} alt="Profile" style={{ width: 84, height: 84, borderRadius: 84, objectFit: "cover", display: "block" }} />
            ) : (
              <Avatar name={name || "New Coach"} size={84} />
            )}
            <div style={{ position: "absolute", bottom: -2, right: -2, width: 28, height: 28, borderRadius: 99, background: C.brand, border: `2px solid ${C.white}`, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <Camera size={13} color="#FFFFFF" />
            </div>
          </button>
          <input ref={photoInputRef} type="file" accept="image/*" onChange={onPhotoChange} style={{ display: "none" }} />
          <div style={{ fontSize: T.captionLg, color: C.slateLight, marginTop: 8, ...fBody }}>Tap to upload a profile photo</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
<div>
            <div style={labelStyle}>Full name<RequiredMark /></div>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="How clients will see you" style={inputStyle} />
          </div>

          <HandleField value={handle} onChange={setHandle} isTaken={isHandleTaken(handle)} required />

          <div>
            <div style={labelStyle}>Bio<RequiredMark /></div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="Write a short introduction about your coaching background, philosophy, and what athletes can expect from your sessions"
              style={{ ...inputStyle, resize: "none" }}
            />
          </div>

          <SelectField label="Years of coaching experience" value={yearsExperience} onChange={setYearsExperience} options={experienceOptions} placeholder="Select years of experience" required />

          <SelectField label="Gender (optional)" value={gender} onChange={setGender} options={GENDER_OPTIONS} placeholder="Prefer not to say" />

          <div>
            <div style={labelStyle}>Languages spoken<RequiredMark /></div>
            <SearchMultiSelect options={LANGUAGE_OPTIONS} value={languages} onChange={setLanguages} placeholder="Search languages…" />
          </div>

          <LocationField
            value={location}
            onChange={setLocation}
            label="Location"
            placeholder="Search suburb, city or postcode…"
            required
          />
        </div>

        <div style={{ marginTop: 24 }}>
          <Btn full disabled={!complete} onClick={proceed}>Continue</Btn>
        </div>
      </div>
    </div>
  );
}

export function ScreenCoachExpertise({ nav, params, coachOnboarding, updateCoachOnboarding }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const [primarySports, setPrimarySports] = useState(coachOnboarding.primarySports || []);
  const [secondarySports, setSecondarySports] = useState(coachOnboarding.secondarySports || []);
  const [categories, setCategories] = useState(coachOnboarding.coachingCategories || []);
  const [skillLevels, setSkillLevels] = useState(coachOnboarding.skillLevels || []);
  const [ageGroups, setAgeGroups] = useState(coachOnboarding.ageGroups || []);
  const [experienceLevel, setExperienceLevel] = useState(coachOnboarding.coachingExperienceLevel || "");
  const [formats, setFormats] = useState(coachOnboarding.coachingFormats || []);

  const toggleIn = (setter, arr, v) => setter(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const complete = primarySports.length > 0 && categories.length > 0 && skillLevels.length > 0
    && ageGroups.length > 0 && !!experienceLevel && formats.length > 0;

  const proceed = () => {
    updateCoachOnboarding({
      primarySports, secondarySports, coachingCategories: categories, skillLevels, ageGroups,
      coachingExperienceLevel: experienceLevel, coachingFormats: formats,
    });
    nav("verification", params?.invitation ? { invitation: true, backTo: params?.backTo } : {});
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar title="" onBack={() => nav("coach-info", params?.invitation ? { invitation: true, backTo: params?.backTo } : {})} />
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px 24px" }} className="cl-hide-scrollbar">

        <div style={{ fontSize: T.displayLg, fontWeight: 600, color: C.jet, ...fDisplay }}>Coaching expertise</div>
        <div style={{ fontSize: T.support, color: C.slate, marginTop: 8, marginBottom: 20, lineHeight: 1.55, ...fBody }}>
          Help clients find you by sharing the sports, formats and skill levels you coach.
        </div>

        <div style={{ marginBottom: 4, fontSize: T.title, fontWeight: 700, color: C.jet, ...fDisplay }}>Primary sport<RequiredMark /></div>
        <div style={{ fontSize: T.captionLg, color: C.slate, marginBottom: 8, ...fBody }}>Select the main sport or discipline you specialise in.</div>
        <SportSearchMultiSelect options={SPORT_OPTIONS_FULL} value={primarySports} onChange={setPrimarySports} placeholder="Search sports…" />

        <div style={{ marginTop: 20, marginBottom: 4, fontSize: T.title, fontWeight: 700, color: C.jet, ...fDisplay }}>Secondary sports (optional)</div>
        <div style={{ fontSize: T.captionLg, color: C.slate, marginBottom: 8, ...fBody }}>Add any additional sports or disciplines you coach.</div>
        <SportSearchMultiSelect options={SPORT_OPTIONS_FULL.filter((s) => !primarySports.includes(s))} value={secondarySports} onChange={setSecondarySports} placeholder="Search sports…" />

        <div style={{ marginTop: 22, marginBottom: 2, fontSize: T.title, fontWeight: 700, color: C.jet, ...fDisplay }}>Coaching categories<RequiredMark /></div>
        <div style={{ fontSize: T.captionLg, color: C.slate, marginBottom: 4, ...fBody }}>Select all coaching services you provide.</div>
        <div>
          {COACHING_CATEGORY_OPTIONS.map((c) => (
            <CheckboxRow key={c} label={c} checked={categories.includes(c)} onClick={() => toggleIn(setCategories, categories, c)} />
          ))}
        </div>

        <div style={{ marginTop: 18, marginBottom: 2, fontSize: T.subtitleLg, fontWeight: 700, color: C.jet, ...fDisplay }}>Athlete skill levels<RequiredMark /></div>
        <div style={{ fontSize: T.captionLg, color: C.slate, marginBottom: 4, ...fBody }}>Select the experience levels you coach.</div>
        <div>
          {SKILL_LEVEL_OPTIONS.map((s) => (
            <CheckboxRow key={s} label={s} checked={skillLevels.includes(s)} onClick={() => toggleIn(setSkillLevels, skillLevels, s)} />
          ))}
        </div>

        <div style={{ marginTop: 18, marginBottom: 2, fontSize: T.subtitleLg, fontWeight: 700, color: C.jet, ...fDisplay }}>Age groups<RequiredMark /></div>
        <div style={{ fontSize: T.captionLg, color: C.slate, marginBottom: 4, ...fBody }}>Select the age groups you work with.</div>
        <div>
          {AGE_GROUP_OPTIONS.map((a) => (
            <CheckboxRow key={a} label={a} checked={ageGroups.includes(a)} onClick={() => toggleIn(setAgeGroups, ageGroups, a)} />
          ))}
        </div>

        <div style={{ marginTop: 18, marginBottom: 2, fontSize: T.labelLg, fontWeight: 700, color: C.jet, ...fDisplay }}>Coaching experience<RequiredMark /></div>
        <div style={{ fontSize: T.captionLg, color: C.slate, marginBottom: 4, ...fBody }}>Specify your level of coaching experience.</div>
        <div>
          {COACHING_EXPERIENCE_LEVELS.map((l) => (
            <RadioRow key={l} label={l} selected={experienceLevel === l} onClick={() => setExperienceLevel(l)} />
          ))}
        </div>

        <div style={{ marginTop: 18, marginBottom: 2, fontSize: T.labelLg, fontWeight: 700, color: C.jet, ...fDisplay }}>Preferred coaching format<RequiredMark /></div>
        <div style={{ fontSize: T.captionLg, color: C.slate, marginBottom: 4, ...fBody }}>Select how you deliver coaching sessions.</div>
        <div style={{ marginBottom: 8 }}>
          {COACHING_FORMAT_OPTIONS.map((f) => (
            <CheckboxRow key={f} label={f} checked={formats.includes(f)} onClick={() => toggleIn(setFormats, formats, f)} />
          ))}
        </div>

        <div style={{ marginTop: 20 }}>
          <Btn full disabled={!complete} onClick={proceed}>Continue</Btn>
        </div>
      </div>
    </div>
  );
}

let qualIdCounter = 1;
function emptyQualification() {
  return { id: "q" + qualIdCounter++, type: "", name: "", uploaded: false };
}

export function ScreenVerification({ nav, toast, submitVerification, coachOnboarding, params }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const resubmitting = !!params?.resubmit;
  const inputStyle = { width: "100%", border: `1.5px solid ${C.border}`, borderRadius: 13, padding: "11px 13px", fontSize: T.bodyLg, outline: "none", boxSizing: "border-box", background: C.white, color: C.jet, ...fBody };
  const labelStyle = { fontSize: T.labelLg, fontWeight: 600, color: C.jet, marginBottom: 6, ...fBody };
  const [idType, setIdType] = useState(resubmitting ? "Driver licence" : "");
  const [idUploaded, setIdUploaded] = useState(false);
  const [selfieUploaded, setSelfieUploaded] = useState(resubmitting);
  const [worksWithMinors, setWorksWithMinors] = useState(resubmitting);
  const [wwccNumber, setWwccNumber] = useState("");
  const [wwccExpiry, setWwccExpiry] = useState("");
  const [wwccUploaded, setWwccUploaded] = useState(false);
  const [qualifications, setQualifications] = useState(resubmitting
    ? [{ id: "q-approved", type: "Coaching accreditation", name: "Level 2 Coaching Certificate", uploaded: true }]
    : [emptyQualification()]);

  const updateQual = (id, patch) => setQualifications((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  const addQualification = () => setQualifications((qs) => [...qs, emptyQualification()]);
  const removeQualification = (id) => setQualifications((qs) => qs.filter((q) => q.id !== id));

  const wwccOk = !worksWithMinors || (wwccNumber.trim() && wwccExpiry && wwccUploaded);
  const qualsOk = qualifications.length > 0 && qualifications.every((q) => q.type && q.name.trim() && q.uploaded);
  const allDone = !!idType && idUploaded && selfieUploaded && wwccOk && qualsOk;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar title="" onBack={() => nav("coach-expertise", params?.invitation ? { invitation: true, backTo: params?.backTo } : {})} />
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px 24px" }} className="cl-hide-scrollbar">

        <div style={{ fontSize: T.displayLg, fontWeight: 600, color: C.jet, ...fDisplay }}>Get verified</div>
        <div style={{ fontSize: T.support, color: C.slate, marginTop: 8, marginBottom: 18, lineHeight: 1.55, ...fBody }}>
          {resubmitting ? "Update the two documents highlighted by our review team. Your approved selfie and accreditation stay on file." : "Verification builds trust with clients and unlocks bookings. Most reviews complete within 2 business days."}
        </div>

        {resubmitting && (
          <Card style={{ marginBottom: 18, background: C.warnTint, border: "none" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <Upload size={18} color={C.brand} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: T.body, fontWeight: 700, color: C.jet, ...fBody }}>Resubmission in progress</div>
                <div style={{ fontSize: T.captionLg, color: C.slate, lineHeight: 1.5, marginTop: 3, ...fBody }}>Replace your photo ID and WWCC image with clear, uncropped copies. You won’t need to restart verification.</div>
              </div>
            </div>
          </Card>
        )}

        <div style={{ fontSize: T.labelLg, fontWeight: 700, color: C.jet, marginBottom: 8, ...fDisplay }}>Government-issued photo ID<RequiredMark /></div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
          {ID_TYPE_OPTIONS.map((t) => (
            <Chip key={t} active={idType === t} onClick={() => { setIdType(t); setIdUploaded(false); }}>{t}</Chip>
          ))}
        </div>
        <Card style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
              <div style={{ width: 36, height: 36, borderRadius: 11, background: C.brandTint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <CreditCard size={16} color={C.brand} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: T.bodyLg, color: C.jet, ...fBody }}>{idType || "Select an ID type above"}</div>
                <div style={{ fontSize: T.captionLg, color: C.slate, marginTop: 1, ...fBody }}>Front & back, clear and unedited</div>
              </div>
            </div>
            {idUploaded ? <Badge tone="success" icon={CheckCircle2}>Uploaded</Badge> :
              <Btn size="sm" variant="secondary" icon={Upload} disabled={!idType} onClick={() => setIdUploaded(true)}>Upload</Btn>}
          </div>
        </Card>

        <div style={{ fontSize: T.labelLg, fontWeight: 700, color: C.jet, marginBottom: 8, ...fDisplay }}>Selfie verification<RequiredMark /></div>
        <Card style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
              <div style={{ width: 36, height: 36, borderRadius: 11, background: C.brandTint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <ScanFace size={16} color={C.brand} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: T.bodyLg, color: C.jet, ...fBody }}>Take or upload a selfie</div>
                <div style={{ fontSize: T.captionLg, color: C.slate, marginTop: 1, ...fBody }}>We'll match it against your ID</div>
              </div>
            </div>
            {selfieUploaded ? <Badge tone="success" icon={CheckCircle2}>Uploaded</Badge> :
              <Btn size="sm" variant="secondary" icon={Camera} onClick={() => setSelfieUploaded(true)}>Upload</Btn>}
          </div>
        </Card>

        <div style={{ fontSize: T.labelLg, fontWeight: 700, color: C.jet, marginBottom: 4, ...fDisplay }}>Working with Children Check (WWCC)</div>
        <div style={{ fontSize: T.captionLg, color: C.slate, marginBottom: 8, ...fBody }}>Required if you coach athletes under 18.</div>
        <Card style={{ marginBottom: worksWithMinors ? 12 : 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: T.bodyLg, fontWeight: 600, color: C.jet, ...fBody }}>Do you coach athletes under 18 years of age?</div>
            <Toggle label="I work with children under 18" on={worksWithMinors} onClick={() => setWorksWithMinors((v) => !v)} />
          </div>
        </Card>

        {worksWithMinors && (
          <Card style={{ marginBottom: 18 }}>
            <div style={{ marginBottom: 12 }}>
              <div style={labelStyle}>WWCC number<RequiredMark /></div>
              <input value={wwccNumber} onChange={(e) => setWwccNumber(e.target.value)} placeholder="e.g. WWC1234567E" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={labelStyle}>Expiry date<RequiredMark /></div>
              <input type="date" value={wwccExpiry} onChange={(e) => setWwccExpiry(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: T.labelLg, color: C.slate, ...fBody }}>WWCC certificate<RequiredMark /></div>
              {wwccUploaded ? <Badge tone="success" icon={CheckCircle2}>Uploaded</Badge> :
                <Btn size="sm" variant="secondary" icon={Upload} onClick={() => setWwccUploaded(true)}>Upload</Btn>}
            </div>
          </Card>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
          <div style={{ fontSize: T.labelLg, fontWeight: 700, color: C.jet, ...fDisplay }}>Coaching accreditations<RequiredMark /></div>
        </div>
        <div style={{ fontSize: T.captionLg, color: C.slate, marginBottom: 10, ...fBody }}>Add your coaching accreditations, First Aid, CPR or sports-specific certifications.</div>

        {qualifications.map((q, i) => (
          <Card key={q.id} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: T.labelLg, fontWeight: 700, color: C.slate, ...fBody }}>Accreditation {i + 1}</div>
              {qualifications.length > 1 && (
                <button onClick={() => removeQualification(q.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: C.slateLight, fontSize: T.captionLg, ...fBody }}>
                  <Trash2 size={13} /> Remove
                </button>
              )}
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={labelStyle}>Certificate type<RequiredMark /></div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {CERTIFICATION_TYPE_OPTIONS.map((t) => (
                  <Chip key={t} active={q.type === t} onClick={() => updateQual(q.id, { type: t })}>{t}</Chip>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={labelStyle}>Accreditation / certificate name<RequiredMark /></div>
              <input value={q.name} onChange={(e) => updateQual(q.id, { name: e.target.value })} placeholder="e.g. Tennis Australia Club Professional" style={inputStyle} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: T.caption, color: C.slateLight, ...fBody }}>PDF, JPG or PNG · Max 10MB</div>
              {q.uploaded ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Badge tone="success" icon={FileCheck2}>Uploaded</Badge>
                  <Btn size="sm" variant="outline" onClick={() => updateQual(q.id, { uploaded: false })}>Replace</Btn>
                </div>
              ) : (
                <Btn size="sm" variant="secondary" icon={Upload} onClick={() => updateQual(q.id, { uploaded: true })}>Upload</Btn>
              )}
            </div>
          </Card>
        ))}
        <Btn variant="outline" size="sm" icon={Plus} full onClick={addQualification}>Add another accreditation</Btn>

        <div style={{ marginTop: 22, paddingBottom: 8 }}>
          <Btn full disabled={!allDone} onClick={() => {
            const documents = [
              { key: "id", label: `${idType} - Identity document`, detail: "Uploaded" },
              { key: "selfie", label: "Selfie verification", detail: "Uploaded" },
              ...(worksWithMinors ? [{ key: "wwcc", label: "Working with Children Check", detail: `${wwccNumber} - expires ${wwccExpiry}` }] : []),
              ...qualifications.map((q) => ({ key: q.id, label: `${q.type} - ${q.name}`, detail: "Certificate uploaded" })),
            ];
            submitVerification({ documents, worksWithMinors });
            toast("Documents submitted for review");
            nav("verification-pending", params?.invitation ? { invitation: true } : {});
          }}>
            Submit for review
          </Btn>
          {!allDone && (
            <div style={{ fontSize: T.caption, color: C.slateLight, textAlign: "center", marginTop: 8, ...fBody }}>
              Complete your ID, selfie{worksWithMinors ? ", WWCC" : ""} and accreditation details to submit.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ScreenVerificationPending({ nav, params, role, verificationStatus, setReachedDashboardAfterVerification, simulateVerificationDecision }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const rejected = verificationStatus === "rejected" || params?.variant === "rejected";
  const approved = verificationStatus === "approved";
  const businessCoachInvite = role === "businessCoach" || params?.invitation;
  const goToSetup = () => {
    if (approved && setReachedDashboardAfterVerification) setReachedDashboardAfterVerification(true);
    nav(businessCoachInvite ? "business-coach-home" : "coach-create-package");
  };
  const simulateLinkStyle = { background: "none", border: "none", cursor: "pointer", fontSize: T.caption, color: C.slateLight, textDecoration: "underline", ...fBody };
  if (rejected) {
    const documents = [
      { label: "Photo ID", detail: "Glare obscures the expiry date and the lower edge is cropped.", action: true },
      { label: "Selfie verification", detail: "Identity match confirmed.", action: false },
      { label: "Working with Children Check", detail: "The expiry date is not readable in the uploaded image.", action: true },
      { label: "Coaching accreditation", detail: "Level 2 Coaching Certificate approved.", action: false },
    ];
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <TopBar title="Verification review" onBack={() => nav(businessCoachInvite ? "business-coach-login" : "coach-dashboard")} />
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 18px 24px" }} className="cl-hide-scrollbar">
          <div style={{ textAlign: "center", padding: "5px 10px 20px" }}>
            <div style={{ width: 68, height: 68, borderRadius: 22, background: C.dangerTint, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 15px" }}>
              <XCircle size={30} color={C.danger} />
            </div>
            <Badge tone="neutral" icon={Clock}>Action needed</Badge>
            <div style={{ fontSize: T.display, fontWeight: 700, color: C.jet, marginTop: 11, ...fDisplay }}>Two documents need an update</div>
            <div style={{ fontSize: T.support, color: C.slate, lineHeight: 1.6, margin: "7px auto 0", maxWidth: 310, ...fBody }}>Your application is saved. Replace the items below and we’ll prioritise the new review.</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {documents.map((document) => (
              <Card key={document.label} style={{ display: "flex", gap: 11, alignItems: "flex-start", background: document.action ? C.warnTint : C.white, border: document.action ? "none" : `1px solid ${C.border}` }}>
                <div style={{ width: 34, height: 34, borderRadius: 11, background: document.action ? C.brandTint : C.successTint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {document.action ? <Upload size={16} color={C.brand} /> : <CheckCircle2 size={16} color={C.success} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                    <div style={{ fontSize: T.body, fontWeight: 700, color: C.jet, ...fBody }}>{document.label}</div>
                    <Badge tone={document.action ? "orange" : "success"}>{document.action ? "Replace" : "Approved"}</Badge>
                  </div>
                  <div style={{ fontSize: T.captionLg, color: C.slate, lineHeight: 1.5, marginTop: 4, ...fBody }}>{document.detail}</div>
                </div>
              </Card>
            ))}
          </div>

          <Card style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "flex-start", background: C.fog }}>
            <Lock size={17} color={C.brand} style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: T.captionLg, color: C.slate, lineHeight: 1.55, ...fBody }}>Approved documents remain securely on file. Resubmitting does not affect your profile or require a new application.</div>
          </Card>
        </div>
        <div style={{ padding: "12px 18px 28px", borderTop: `1px solid ${C.border}`, background: C.white, display: "flex", flexDirection: "column", gap: 9 }}>
          <Btn full icon={Upload} onClick={() => nav("verification", { resubmit: true, invitation: businessCoachInvite })}>Update documents</Btn>
          <Btn full variant="outline" onClick={() => nav("support", { presetTab: "contact", faqTopic: "verification", backTo: "verification-rejected" })}>Ask verification support</Btn>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "28px 20px 0", height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ textAlign: "center", marginTop: 20 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 20,
          background: approved ? C.successTint : C.brandTint,
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
        }}>
          {approved ? <CheckCircle2 size={28} color={C.success} /> : <ClipboardList size={28} color={C.brand} />}
        </div>
        <div style={{ fontSize: T.headingLg, fontWeight: 600, color: C.jet, ...fDisplay }}>
          {approved ? "Your application has been successfully verified" : "Verification submitted"}
        </div>
        <div style={{ fontSize: T.support, color: C.slate, marginTop: 8, lineHeight: 1.6, maxWidth: 300, marginLeft: "auto", marginRight: "auto", ...fBody }}>
          {approved
            ? (businessCoachInvite ? "An admin has approved your documents. Your verified business coach workspace is ready." : "An admin has reviewed and approved your documents. Create your first package to start accepting bookings.")
            : "Your documents have been submitted successfully and are now awaiting review by a CoachNivo administrator. This usually takes up to 2 business days - we'll notify you as soon as a decision is made."}
        </div>
        {!approved && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", marginTop: 18 }}>
            <Badge tone="orange" icon={Clock}>Pending review</Badge>
          </div>
        )}
        {approved && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", marginTop: 18 }}>
            <Badge tone="success" icon={CheckCircle2}>Verified</Badge>
          </div>
        )}
      </div>

      <div style={{ marginTop: "auto", padding: "14px 0", display: "flex", flexDirection: "column", gap: 10 }}>
        <Btn full disabled={!approved} onClick={goToSetup}>{businessCoachInvite ? "Open coach workspace" : "Create your first package"}</Btn>
        {!approved && (
          <div style={{ fontSize: T.captionLg, color: C.slateLight, textAlign: "center", lineHeight: 1.5, ...fBody }}>
            This unlocks once an admin approves your application.
          </div>
        )}
        <Btn full variant="ghost" onClick={() => nav("support", { faqTopic: "verification", backTo: "verification-pending" })}>Contact support</Btn>
        {!approved && !rejected && (
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 2 }}>
            <button onClick={() => simulateVerificationDecision(true)} style={simulateLinkStyle}>Simulate admin approval (success)</button>
            <button onClick={() => simulateVerificationDecision(false)} style={simulateLinkStyle}>Simulate admin rejection (rejected)</button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ScreenAdminLogin({ nav, toast }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const [showPw, setShowPw] = useState(false);
  return (
    <div style={{ height: "100%", background: C.white, display: "flex", flexDirection: "column", padding: "40px 24px 28px" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ textAlign: "center", marginBottom: 30, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <BrandLogo height={28} onDark={darkMode} style={{ marginBottom: 12 }} />
          <div style={{ fontSize: T.body, color: C.onDarkMuted, marginTop: 4, ...fBody }}>Sign in with your CoachNivo admin credentials</div>
        </div>

<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
  <div>
    <div
      style={{
        fontSize: T.label,
        fontWeight: 600,
        color: C.jet,
        marginBottom: 6,
        ...fBody,
      }}
    >
      Email
    </div>

    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        border: `1.5px solid ${C.border}`,
        background: C.white,
        borderRadius: 13,
        padding: "11px 13px",
      }}
    >
      <Mail size={16} color={C.slate} />

      <input
        type="email"
        placeholder="you@coachnivo.com"
        style={{
          border: "none",
          outline: "none",
          flex: 1,
          fontSize: T.subtitle,
          background: "transparent",
          color: C.jet,
          ...fBody,
        }}
      />
    </div>
  </div>

  <div>
    <div
      style={{
        fontSize: T.label,
        fontWeight: 600,
        color: C.jet,
        marginBottom: 6,
        ...fBody,
      }}
    >
      Password
    </div>

    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        border: `1.5px solid ${C.border}`,
        background: C.white,
        borderRadius: 13,
        padding: "11px 13px",
      }}
    >
      <Lock size={16} color={C.slate} />

      <input
        type={showPw ? "text" : "password"}
        placeholder="••••••••"
        style={{
          border: "none",
          outline: "none",
          flex: 1,
          fontSize: T.subtitle,
          background: "transparent",
          color: C.jet,
          ...fBody,
        }}
      />

      <button
        onClick={() => setShowPw((s) => !s)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          padding: 2,
        }}
      >
        {showPw ? (
          <EyeOff size={16} color={C.slate} />
        ) : (
          <Eye size={16} color={C.slate} />
        )}
      </button>
    </div>
  </div>

  <div style={{ textAlign: "right" }}>
    <button
      style={{
        background: "none",
        border: "none",
        color: C.brand,
        fontSize: T.labelLg,
        fontWeight: 600,
        cursor: "pointer",
        ...fBody,
      }}
    >
      Forgot password?
    </button>
  </div>
</div>

        <div style={{ marginTop: 20 }}>
          <Btn full onClick={() => { toast("Welcome back, Admin"); nav("admin-home"); }}>Log in</Btn>
        </div>
      </div>

      <div style={{ textAlign: "center", fontSize: T.captionLg, color: C.onDarkFaint, lineHeight: 1.6, ...fBody }}>
        Admin access is restricted to authorised CoachNivo staff and is logged for audit purposes.
      </div>
    </div>
  );
}
