import React from "react";
import { AtSign, CheckCircle2, XCircle } from "lucide-react";
import { CL, CD, fDisplay, fBody, T } from "../../theme/theme";
import { useApp } from "../../context/AppContext";
import { Field } from "./Primitives";
import { isValidHandle } from "../../utils/name";

/* =========================================================================
   PUBLIC IDENTITY FORM FIELDS
   -------------------------------------------------------------------------
   Shared username input used across client onboarding, coach onboarding,
   client account settings and coach profile settings.
   ========================================================================= */

/** Username input with live validity / availability feedback. */
export function HandleField({ value, onChange, isTaken, showStatus = true, label = "Username", placeholder = "shane22", helper, required }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const trimmed = String(value || "").trim();
  const valid = isValidHandle(trimmed);
  const available = valid && !isTaken;

  let status = null;
  if (showStatus && trimmed && !valid) {
    status = { tone: "error", icon: XCircle, text: "Use 3 to 24 characters with lowercase letters, numbers, dots, or underscores." };
  } else if (showStatus && trimmed && valid && isTaken) {
    status = { tone: "error", icon: XCircle, text: "That username is already taken. Try adding a number or underscore." };
  } else if (showStatus && trimmed && available) {
    status = { tone: "success", icon: CheckCircle2, text: "Username is available!" };
  }

  const defaultDesc = helper || "Used for mentions, messaging, and reviews. Your full name stays private until bookings are confirmed.";

  return (
    <div>
      <Field
        label={label}
        placeholder={placeholder}
        icon={AtSign}
        value={value}
        onChange={(e) => onChange(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""))}
        required={required}
      />
      {status ? (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
          <status.icon size={13} color={status.tone === "success" ? C.success : C.error} />
          <span style={{ fontSize: T.captionLg, color: status.tone === "success" ? C.success : C.error, ...fBody }}>
            {status.text}
          </span>
        </div>
      ) : null}
      <div style={{ fontSize: T.captionLg, color: C.slateLight, marginTop: status ? 4 : 6, lineHeight: 1.5, ...fBody }}>
        {defaultDesc}
      </div>
    </div>
  );
}
