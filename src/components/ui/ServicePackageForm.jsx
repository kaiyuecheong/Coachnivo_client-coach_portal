import React, { useState } from "react";
import { DollarSign, Users, MapPin, Package, Clock, SlidersHorizontal } from "lucide-react";
import { CL, CD, fBody, T } from "../../theme/theme";
import { useApp } from "../../context/AppContext";
import { Chip, Btn, FormSection, RequiredMark } from "./Primitives";
import { SportSearchSelect } from "./SportUI";
import { SPORT_NAMES } from "../../data/sports";

export const PACKAGE_TYPE_OPTIONS = [
  "1:1 Coaching", "Group Training", "Family Sessions", "Team Program", "Skills Clinic", "Online Coaching",
  "Private Lesson", "Bootcamp", "Holiday Camp", "Assessment", "Workshop", "Squad Training",
];
export const SPORT_OPTIONS = SPORT_NAMES;
export const SESSION_DURATION_OPTIONS = [30, 45, 60, 90, 120];
// "Come to You" means the coach travels to the client's location, so no
// fixed venue is required — only an optional travel area/radius note.
export const DELIVERY_MODE_OPTIONS = ["In-person", "Online", "Come to You"];

export function emptyPackage() {
  return {
    name: "",
    packageTypes: [],
    sport: "",
    description: "",
    sessionDuration: 60,
    sessionDurationCustom: "",
    useCustomDuration: false,
    price: "",
    maxParticipants: "",
    deliveryMode: "",
    venue: "",
    travelArea: "",
    equipment: "",
  };
}

export function isPackageValid(pkg) {
  const durationOk = pkg.useCustomDuration ? pkg.sessionDurationCustom.trim().length > 0 : !!pkg.sessionDuration;
  const venueOk = pkg.deliveryMode === "In-person" ? pkg.venue.trim().length > 0 : true;
  return (
    pkg.name.trim().length > 0 &&
    pkg.packageTypes.length > 0 &&
    !!pkg.sport &&
    durationOk &&
    pkg.price !== "" && Number(pkg.price) > 0 &&
    pkg.maxParticipants !== "" && Number(pkg.maxParticipants) > 0 &&
    !!pkg.deliveryMode &&
    venueOk
  );
}

// Human-readable location for a package, used in summaries and lists.
export function packageLocationLabel(pkg) {
  if (pkg.deliveryMode === "Online") return "Online";
  if (pkg.deliveryMode === "Come to You") return pkg.travelArea ? `Come to You - ${pkg.travelArea}` : "Come to You";
  return pkg.venue || "Location TBC";
}

export function packageSummary(pkg) {
  const duration = pkg.useCustomDuration ? pkg.sessionDurationCustom : `${pkg.sessionDuration} min`;
  const parts = [
    (pkg.packageTypes || []).join(" + "), duration,
    pkg.price !== "" ? `$${pkg.price}` : null,
    pkg.maxParticipants !== "" ? `max ${pkg.maxParticipants}` : null,
    pkg.deliveryMode ? packageLocationLabel(pkg) : null,
  ];
  return parts.filter(Boolean).join(" · ");
}

/**
 * Converts a saved package record (the compact shape used elsewhere in the
 * app — client browsing, booking, etc.) into this form's working shape, so
 * an existing package can be loaded for editing.
 */
export function recordToPackageForm(rec) {
  const isPreset = SESSION_DURATION_OPTIONS.includes(rec.durationMinutes);
  // Older/compact records only ever stored a single type string — split it
  // back out so it still shows as (at least) one selected chip when editing.
  const legacyTypes = (rec.packageType || rec.type || "")
    .split("+").map((t) => t.trim()).filter(Boolean);
  return {
    ...emptyPackage(),
    name: rec.name || "",
    packageTypes: rec.packageTypes && rec.packageTypes.length ? rec.packageTypes : legacyTypes,
    sport: rec.sport || "",
    description: rec.description || "",
    sessionDuration: isPreset ? rec.durationMinutes : 60,
    sessionDurationCustom: !isPreset && rec.durationMinutes ? `${rec.durationMinutes} minutes` : "",
    useCustomDuration: !isPreset && !!rec.durationMinutes,
    price: rec.price != null ? String(rec.price) : "",
    maxParticipants: rec.maxParticipants != null ? String(rec.maxParticipants) : "1",
    deliveryMode: rec.locationType || rec.mode || "",
    venue: rec.locationType === "In-person" ? (rec.location || "") : "",
    travelArea: rec.locationType === "Come to You" ? (rec.location || "") : "",
    equipment: rec.equipment || "",
  };
}

/**
 * Converts this form's working shape into the compact record shape stored
 * on the coach's package list (and read by client-facing screens, which
 * only expect id/name/type/duration/mode/price to be present).
 */
export function packageFormToRecord(pkg, existingId) {
  const durationMinutes = pkg.useCustomDuration
    ? (parseInt(pkg.sessionDurationCustom, 10) || null)
    : pkg.sessionDuration;
  const typeLabel = pkg.packageTypes.join(" + ");
  return {
    id: existingId || `pkg${Date.now()}`,
    name: pkg.name,
    type: typeLabel,
    packageType: typeLabel,
    packageTypes: pkg.packageTypes,
    sport: pkg.sport,
    description: pkg.description,
    duration: pkg.useCustomDuration ? pkg.sessionDurationCustom : pkg.sessionDuration,
    durationMinutes,
    price: Number(pkg.price),
    maxParticipants: Number(pkg.maxParticipants),
    mode: pkg.deliveryMode,
    locationType: pkg.deliveryMode,
    location: packageLocationLabel(pkg),
    equipment: pkg.equipment,
  };
}

/**
 * Controlled-ish package form for a single coaching service. Pass `initial`
 * to seed values (e.g. when editing), and receive the finished service
 * object via onSave.
 */
export function ServicePackageForm({ initial, onSave, onCancel, saveLabel = "Add Service" }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;

  const inputStyle = {
    width: "100%", border: `1.5px solid ${C.border}`, borderRadius: 13, padding: "11px 13px",
    fontSize: T.bodyLg, outline: "none", boxSizing: "border-box", background: C.white, color: C.jet, ...fBody,
  };
  const fieldWrapStyle = {
    display: "flex", alignItems: "center", gap: 6, border: `1.5px solid ${C.border}`,
    borderRadius: 13, padding: "11px 13px", boxSizing: "border-box", background: C.white,
  };
  const fieldInputStyle = { border: "none", outline: "none", flex: 1, fontSize: T.bodyLg, minWidth: 0, color: C.jet, ...fBody };
  const labelStyle = { fontSize: T.labelLg, fontWeight: 600, color: C.jet, marginBottom: 6, ...fBody };

  const [pkg, setPkg] = useState(() => ({ ...emptyPackage(), ...(initial || {}) }));
  const set = (patch) => setPkg((p) => ({ ...p, ...patch }));
  const valid = isPackageValid(pkg);

  return (
    <div>
      <FormSection icon={Package} label="Package basics" hint="Give your service a clear name and format.">
        <div style={{ marginBottom: 16 }}>
          <div style={labelStyle}>Service name<RequiredMark /></div>
          <input
            value={pkg.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="e.g. 1:1 Court Session"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={labelStyle}>Package type<RequiredMark /></div>
          <div style={{ fontSize: T.captionLg, color: C.slateLight, marginBottom: 8, marginTop: -4, ...fBody }}>
            Select every format this service can be booked as - you can pick more than one.
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {PACKAGE_TYPE_OPTIONS.map((t) => {
              const active = pkg.packageTypes.includes(t);
              return (
                <Chip
                  key={t}
                  active={active}
                  onClick={() => set({
                    packageTypes: active ? pkg.packageTypes.filter((x) => x !== t) : [...pkg.packageTypes, t],
                  })}
                >
                  {t}
                </Chip>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={labelStyle}>Sport category<RequiredMark /></div>
          <SportSearchSelect
            options={SPORT_OPTIONS}
            value={pkg.sport}
            onChange={(v) => set({ sport: v })}
            placeholder="Search a sport or add your own…"
          />
        </div>

        <div>
          <div style={labelStyle}>Description</div>
          <textarea
            value={pkg.description}
            onChange={(e) => set({ description: e.target.value })}
            rows={3}
            placeholder="What's included, who it's for, what to expect…"
            style={{ ...inputStyle, resize: "none" }}
          />
        </div>
      </FormSection>

      <FormSection icon={Clock} label="Session details" hint="How long a session runs and what it costs.">
        <div style={{ marginBottom: 16 }}>
          <div style={labelStyle}>Session duration<RequiredMark /></div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
            {SESSION_DURATION_OPTIONS.map((d) => (
              <Chip
                key={d}
                active={!pkg.useCustomDuration && pkg.sessionDuration === d}
                onClick={() => set({ sessionDuration: d, useCustomDuration: false })}
              >
                {d} minutes
              </Chip>
            ))}
            <Chip active={pkg.useCustomDuration} onClick={() => set({ useCustomDuration: true })}>Custom</Chip>
          </div>
          {pkg.useCustomDuration && (
            <input
              value={pkg.sessionDurationCustom}
              onChange={(e) => set({ sessionDurationCustom: e.target.value })}
              placeholder="e.g. 75 minutes"
              style={inputStyle}
            />
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={labelStyle}>Price<RequiredMark /></div>
          <div style={fieldWrapStyle}>
            <DollarSign size={14} color={C.slateLight} />
            <input
              value={pkg.price}
              onChange={(e) => set({ price: e.target.value.replace(/[^0-9.]/g, "") })}
              placeholder="e.g. 75"
              inputMode="decimal"
              style={fieldInputStyle}
            />
            <span style={{ fontSize: T.captionLg, color: C.slateLight, ...fBody }}>per session</span>
          </div>
        </div>

        <div>
          <div style={labelStyle}>Maximum participants per package<RequiredMark /></div>
          <div style={{ fontSize: T.captionLg, color: C.slateLight, marginBottom: 8, marginTop: -4, ...fBody }}>
            The most people who can join a single session of this specific package.
          </div>
          <div style={fieldWrapStyle}>
            <Users size={14} color={C.slateLight} />
            <input
              value={pkg.maxParticipants}
              onChange={(e) => set({ maxParticipants: e.target.value.replace(/[^0-9]/g, "") })}
              placeholder="e.g. 1"
              inputMode="numeric"
              style={fieldInputStyle}
            />
            <span style={{ fontSize: T.captionLg, color: C.slateLight, ...fBody }}>max people</span>
          </div>
        </div>
      </FormSection>

      <FormSection icon={MapPin} label="Location & delivery" hint="Where and how this package takes place.">
        <div style={{ marginBottom: 16 }}>
          <div style={labelStyle}>Delivery mode<RequiredMark /></div>
          <div style={{ fontSize: T.captionLg, color: C.slateLight, marginBottom: 8, marginTop: -4, ...fBody }}>
            Each package can have its own location - this doesn't need to match your other packages.
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 0, flexWrap: "wrap" }}>
            {DELIVERY_MODE_OPTIONS.map((m) => (
              <Chip
                key={m}
                active={pkg.deliveryMode === m}
                onClick={() => set({ deliveryMode: m, venue: m === "In-person" ? pkg.venue : "", travelArea: m === "Come to You" ? pkg.travelArea : "" })}
              >
                {m}
              </Chip>
            ))}
          </div>
        </div>

        {pkg.deliveryMode === "In-person" && (
          <div>
            <div style={labelStyle}>Venue<RequiredMark /></div>
            <div style={fieldWrapStyle}>
              <MapPin size={14} color={C.slateLight} />
              <input
                value={pkg.venue}
                onChange={(e) => set({ venue: e.target.value })}
                placeholder="e.g. Fitzroy Tennis Courts"
                style={fieldInputStyle}
              />
            </div>
          </div>
        )}

        {pkg.deliveryMode === "Come to You" && (
          <div>
            <div style={labelStyle}>Travel area (optional)</div>
            <div style={fieldWrapStyle}>
              <MapPin size={14} color={C.slateLight} />
              <input
                value={pkg.travelArea}
                onChange={(e) => set({ travelArea: e.target.value })}
                placeholder="e.g. Within 10km of Fitzroy"
                style={fieldInputStyle}
              />
            </div>
            <div style={{ fontSize: T.caption, color: C.slateLight, marginTop: 6, ...fBody }}>You'll travel to the client's location for this package.</div>
          </div>
        )}

        {pkg.deliveryMode === "Online" && (
          <div style={{ fontSize: T.captionLg, color: C.slateLight, ...fBody }}>Delivered virtually - no physical location needed.</div>
        )}
      </FormSection>

      <FormSection icon={SlidersHorizontal} label="Extras" hint="Anything athletes should bring or prepare.">
        <div style={labelStyle}>Equipment required (optional)</div>
        <input
          value={pkg.equipment}
          onChange={(e) => set({ equipment: e.target.value })}
          placeholder="e.g. Bring your own racquet"
          style={inputStyle}
        />
      </FormSection>

      <div style={{ display: "flex", gap: 8 }}>
        {onCancel && <Btn variant="outline" full onClick={onCancel}>Cancel</Btn>}
        <Btn full disabled={!valid} onClick={() => valid && onSave(pkg)}>{saveLabel}</Btn>
      </div>
    </div>
  );
}
