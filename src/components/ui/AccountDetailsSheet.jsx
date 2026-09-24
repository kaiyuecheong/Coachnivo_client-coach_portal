import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft, CheckCircle2, KeyRound, Lock, Mail, Phone, ShieldCheck, User, X,
} from "lucide-react";
import { CL, CD, fBody, fDisplay, T } from "../../theme/theme";
import { useApp } from "../../context/AppContext";
import { Badge, BottomSheet, Btn, Card, Field, FormSection, StepProgress } from "./Primitives";
import { HandleField } from "./PublicIdentityFields";
import { isValidHandle } from "../../utils/name";
import {
  comparablePhone, EMPTY_VERIFICATION_CODE, isAcceptedPrototypeCode,
  isValidPhone, normaliseEmail,
} from "../../utils/contactVerification";

const RESEND_COOLDOWN_SECONDS = 30;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const emptyCode = () => [...EMPTY_VERIFICATION_CODE];

const maskEmail = (value) => {
  const [local = "", domain = ""] = String(value || "").split("@");
  if (!domain) return value;
  return `${local.slice(0, 2)}${local.length > 2 ? "•••" : ""}@${domain}`;
};

const maskPhone = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length <= 4) return value;
  return `••••••${digits.slice(-4)}`;
};

function ContactStatus({ icon: Icon, label, value, actionLabel, editing, onAction }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  return (
    <div style={{ border: `1px solid ${editing ? C.brand : C.border}`, borderRadius: 15, padding: 12, background: editing ? (darkMode ? C.white : C.brandTint) : C.white }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 44 }}>
        <span style={{ width: 36, height: 36, borderRadius: 12, background: editing ? C.white : C.fog, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={16} color={editing ? C.brand : C.slate} aria-hidden="true" />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: T.captionLg, color: C.slate, ...fBody }}>{label}</span>
          <span style={{ display: "block", fontSize: T.body, color: C.jet, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...fBody }}>{value || "Not added"}</span>
        </span>
        {value ? <Badge tone="success" icon={CheckCircle2}>Verified</Badge> : null}
      </div>
      <button
        type="button"
        onClick={onAction}
        style={{
          width: "100%", minHeight: 44, marginTop: 8, borderRadius: 12,
          border: `1px solid ${editing ? C.border : C.brand}`,
          background: editing ? C.white : C.brandTint,
          color: editing ? C.slate : (C.brandIcon || C.brandColor), cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
          fontSize: T.body, fontWeight: 700, ...fBody,
        }}
      >
        {editing ? <X size={15} aria-hidden="true" /> : <Icon size={15} aria-hidden="true" />}
        {editing ? "Cancel change" : actionLabel}
      </button>
    </div>
  );
}

export function AccountDetailsSheet({
  open,
  onClose,
  details,
  onSave,
  isHandleTaken,
  toast,
  accountLabel = "account",
}) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const [draft, setDraft] = useState({ name: "", username: "", email: "", phone: "" });
  const [contactEdits, setContactEdits] = useState({ email: false, phone: false });
  const [step, setStep] = useState("form");
  const [currentPassword, setCurrentPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [pendingDetails, setPendingDetails] = useState(null);
  const [targets, setTargets] = useState([]);
  const [targetIndex, setTargetIndex] = useState(0);
  const [code, setCode] = useState(emptyCode);
  const [verificationError, setVerificationError] = useState("");
  const [resendSeconds, setResendSeconds] = useState(0);
  const codeInputsRef = useRef([]);

  const originalName = details?.name || "";
  const originalUsername = details?.username || "";
  const originalEmail = details?.email || "";
  const originalPhone = details?.phone || "";

  useEffect(() => {
    if (!open) return;
    setDraft({
      name: originalName,
      username: originalUsername,
      email: originalEmail,
      phone: originalPhone,
    });
    setContactEdits({ email: false, phone: false });
    setStep("form");
    setCurrentPassword("");
    setFormError("");
    setPendingDetails(null);
    setTargets([]);
    setTargetIndex(0);
    setCode(emptyCode());
    setVerificationError("");
    setResendSeconds(0);
  }, [open, originalName, originalUsername, originalEmail, originalPhone]);

  useEffect(() => {
    if (resendSeconds <= 0) return undefined;
    const timer = window.setInterval(() => setResendSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  const emailChanged = contactEdits.email;
  const phoneChanged = contactEdits.phone;
  const identityChanged = draft.name.trim() !== originalName.trim()
    || draft.username.trim().toLowerCase() !== originalUsername.trim().toLowerCase();
  const hasChanges = identityChanged || emailChanged || phoneChanged;
  const contactChanged = emailChanged || phoneChanged;

  const prepareVerification = (target) => {
    setCode(emptyCode());
    setVerificationError("");
    setResendSeconds(RESEND_COOLDOWN_SECONDS);
    toast?.(`Verification code sent to your ${target.type}`);
    window.setTimeout(() => codeInputsRef.current[0]?.focus(), 120);
  };

  const saveVerifiedDetails = (nextDetails) => {
    onSave?.(nextDetails);
    toast?.("Account details updated securely");
    onClose?.();
  };

  const reviewChanges = () => {
    const nextDetails = {
      name: draft.name.trim(),
      username: draft.username.trim(),
      email: normaliseEmail(draft.email),
      phone: draft.phone.trim(),
    };
    if (!nextDetails.name) { setFormError("Add your full name to continue."); return; }
    if (!isValidHandle(nextDetails.username)) { setFormError("Choose a username with 3–24 letters, numbers, dots or underscores."); return; }
    if (isHandleTaken?.(nextDetails.username)) { setFormError("That username is already taken. Try another one."); return; }
    if (!EMAIL_PATTERN.test(nextDetails.email)) { setFormError("Enter a valid email address, such as name@example.com."); return; }
    if (emailChanged && normaliseEmail(nextDetails.email) === normaliseEmail(originalEmail)) { setFormError("Enter a different email address to continue."); return; }
    if (phoneChanged && !nextDetails.phone) { setFormError("Enter a new phone number rather than leaving this security field empty."); return; }
    if (nextDetails.phone && !isValidPhone(nextDetails.phone)) { setFormError("Enter a valid phone number with 8–15 digits."); return; }
    if (phoneChanged && comparablePhone(nextDetails.phone) === comparablePhone(originalPhone)) { setFormError("Enter a different phone number to continue."); return; }
    if (contactChanged && !currentPassword.trim()) { setFormError("Enter your current password before changing email or phone."); return; }

    setFormError("");
    const nextTargets = [
      ...(emailChanged ? [{ type: "email", value: nextDetails.email }] : []),
      ...(phoneChanged ? [{ type: "phone", value: nextDetails.phone }] : []),
    ];
    if (!nextTargets.length) {
      saveVerifiedDetails(nextDetails);
      return;
    }
    setPendingDetails(nextDetails);
    setTargets(nextTargets);
    setTargetIndex(0);
    setStep("verify");
    prepareVerification(nextTargets[0]);
  };

  const setCodeDigit = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setCode((current) => current.map((item, itemIndex) => itemIndex === index ? digit : item));
    setVerificationError("");
    if (digit && index < 5) codeInputsRef.current[index + 1]?.focus();
  };

  const onCodeKeyDown = (index, event) => {
    if (event.key === "Backspace" && !code[index] && index > 0) codeInputsRef.current[index - 1]?.focus();
  };

  const onCodePaste = (event) => {
    const digits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split("");
    if (!digits.length) return;
    event.preventDefault();
    setCode(Array.from({ length: 6 }, (_, index) => digits[index] || ""));
    setVerificationError("");
    codeInputsRef.current[Math.min(digits.length, 6) - 1]?.focus();
  };

  const verifyCode = () => {
    if (!isAcceptedPrototypeCode(code.join(""))) {
      setVerificationError("That code isn't valid. Enter any six-digit code except all zeros.");
      return;
    }

    const nextIndex = targetIndex + 1;
    if (nextIndex < targets.length) {
      setTargetIndex(nextIndex);
      prepareVerification(targets[nextIndex]);
      return;
    }
    saveVerifiedDetails(pendingDetails);
  };

  const resendCode = () => {
    if (resendSeconds > 0) return;
    prepareVerification(targets[targetIndex]);
  };

  const activeTarget = targets[targetIndex];
  const targetLabel = activeTarget?.type === "email" ? "new email address" : "new phone number";
  const maskedTarget = activeTarget?.type === "email" ? maskEmail(activeTarget?.value) : maskPhone(activeTarget?.value);

  const toggleContactEdit = (type) => {
    setFormError("");
    const editing = !contactEdits[type];
    setContactEdits((current) => ({ ...current, [type]: editing }));
    setDraft((draftValue) => ({
      ...draftValue,
      [type]: editing ? "" : type === "email" ? originalEmail : originalPhone,
    }));
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Login & contact details" heightPct={88}>
      {step === "form" ? (
        <>
          <div style={{ fontSize: T.body, color: C.slate, lineHeight: 1.55, marginBottom: 18, ...fBody }}>
            Keep your {accountLabel} identity and recovery details up to date. Your email and phone stay unchanged until verification is complete.
          </div>

          <FormSection icon={User} label="Identity" hint="Your name and unique username can be updated immediately.">
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label="Full name" placeholder="e.g. Sarah Lin" icon={User} value={draft.name} onChange={(event) => { setFormError(""); setDraft((current) => ({ ...current, name: event.target.value })); }} required />
              <HandleField value={draft.username} onChange={(value) => { setFormError(""); setDraft((current) => ({ ...current, username: value })); }} isTaken={isHandleTaken?.(draft.username)} showStatus={draft.username.trim().toLowerCase() !== originalUsername.trim().toLowerCase()} required />
            </div>
          </FormSection>

          <FormSection icon={ShieldCheck} label="Verified contact details" hint="We use these for sign-in, recovery and important booking updates.">
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <ContactStatus icon={Mail} label="Current email" value={originalEmail} actionLabel="Change email address" editing={contactEdits.email} onAction={() => toggleContactEdit("email")} />
              {contactEdits.email ? (
                <div style={{ animation: "clFadeUp .22s ease both" }}>
                  <Field label="New email address" placeholder="Enter your new email" icon={Mail} type="email" autoComplete="email" value={draft.email} onChange={(event) => { setFormError(""); setDraft((current) => ({ ...current, email: event.target.value })); }} required />
                </div>
              ) : null}
              <ContactStatus icon={Phone} label="Current phone" value={originalPhone} actionLabel="Change phone number" editing={contactEdits.phone} onAction={() => toggleContactEdit("phone")} />
              {contactEdits.phone ? (
                <div style={{ animation: "clFadeUp .22s ease both" }}>
                  <Field label="New phone number" placeholder="Enter your new phone number" icon={Phone} type="tel" autoComplete="tel" value={draft.phone} onChange={(event) => { setFormError(""); setDraft((current) => ({ ...current, phone: event.target.value.replace(/[^0-9+()\-\s]/g, "") })); }} required />
                </div>
              ) : null}
              <div style={{ fontSize: T.captionLg, color: C.slate, lineHeight: 1.5, ...fBody }}>
                Your current contact stays active until the new destination is verified. We’ll also add a security alert to your account.
              </div>
            </div>
          </FormSection>

          {contactChanged ? (
            <FormSection icon={Lock} label="Confirm it's you" hint="Sensitive account changes require your current credentials.">
              <Field label="Current password" placeholder="Enter your current password" icon={Lock} type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => { setFormError(""); setCurrentPassword(event.target.value); }} required />
            </FormSection>
          ) : null}

          {formError ? (
            <div role="alert" style={{ marginBottom: 12, padding: "10px 12px", borderRadius: 12, background: C.dangerTint, color: C.danger, fontSize: T.labelLg, lineHeight: 1.45, ...fBody }}>{formError}</div>
          ) : null}
          <Btn full disabled={!hasChanges} onClick={reviewChanges}>{contactChanged ? "Verify and save" : "Save changes"}</Btn>
        </>
      ) : (
        <>
          <StepProgress step={targetIndex + 1} total={targets.length} label={`Verify ${activeTarget?.type}`} />
          <Card style={{ textAlign: "center", padding: 18, marginBottom: 18, background: darkMode ? C.white : C.brandTint }}>
            <span style={{ width: 48, height: 48, margin: "0 auto 12px", borderRadius: 16, background: C.white, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <KeyRound size={21} color={C.brand} aria-hidden="true" />
            </span>
            <div style={{ fontSize: T.title, fontWeight: 700, color: C.jet, ...fDisplay }}>Check your {activeTarget?.type}</div>
            <div style={{ fontSize: T.body, color: C.slate, lineHeight: 1.5, marginTop: 6, ...fBody }}>
              Enter the six-digit code sent to your {targetLabel} <span style={{ color: C.jet, fontWeight: 600 }}>{maskedTarget}</span>.
            </div>
          </Card>

          <div style={{ display: "flex", justifyContent: "flex-start", gap: 8, marginBottom: 12 }} onPaste={onCodePaste}>
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(element) => { codeInputsRef.current[index] = element; }}
                aria-label={`Verification digit ${index + 1}`}
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                maxLength={1}
                value={digit}
                onChange={(event) => setCodeDigit(index, event.target.value)}
                onKeyDown={(event) => onCodeKeyDown(index, event)}
                style={{ flex: "0 1 60px", minWidth: 0, aspectRatio: "1 / 1", height: "auto", boxSizing: "border-box", borderRadius: 12, border: `1.5px solid ${verificationError ? C.danger : C.border}`, background: C.white, color: C.jet, textAlign: "center", fontSize: T.heading, fontWeight: 700, outline: "none", ...fDisplay }}
              />
            ))}
          </div>

          {verificationError ? (
            <div role="alert" style={{ textAlign: "center", color: C.danger, fontSize: T.labelLg, lineHeight: 1.45, marginBottom: 12, ...fBody }}>{verificationError}</div>
          ) : null}

          <Btn full disabled={code.join("").length !== 6} onClick={verifyCode} icon={CheckCircle2}>Verify code</Btn>
          <button type="button" disabled={resendSeconds > 0} onClick={resendCode} style={{ width: "100%", minHeight: 44, marginTop: 6, border: "none", background: "transparent", color: resendSeconds > 0 ? C.slateLight : C.brand, cursor: resendSeconds > 0 ? "default" : "pointer", fontSize: T.body, fontWeight: 600, ...fBody }}>
            {resendSeconds > 0 ? `Send a new code in ${resendSeconds}s` : "Send a new code"}
          </button>
          <button type="button" onClick={() => { setStep("form"); setCode(emptyCode()); setVerificationError(""); }} style={{ width: "100%", minHeight: 44, border: "none", background: "transparent", color: C.slate, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: T.body, fontWeight: 600, ...fBody }}>
            <ArrowLeft size={15} aria-hidden="true" /> Edit details
          </button>
        </>
      )}
    </BottomSheet>
  );
}
