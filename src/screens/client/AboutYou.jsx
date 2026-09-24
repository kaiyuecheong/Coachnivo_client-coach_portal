import React, { useState } from "react";
import {
  Phone, Camera, ShieldCheck, Plus, Users, User, CalendarDays,
  AlertTriangle, Stethoscope, UserCheck, Sparkles, Target,
} from "lucide-react";
import { CL, CD, fDisplay, fBody, T } from "../../theme/theme";
import { useApp } from "../../context/AppContext";
import { useResponsive } from "../../theme/responsive";
import { GENDER_OPTIONS } from "../../data/mockData";
import { SectionLabel, FormSection, Btn, TopBar, Field, Card, Avatar, Badge, RequiredMark } from "../../components/ui/Primitives";
import { HandleField } from "../../components/ui/PublicIdentityFields";
import { isValidHandle } from "../../utils/name";
import { LocationField } from "../../components/ui/LocationField";
import { SportBadge, SportSearchMultiSelect } from "../../components/ui/SportUI";
import { POPULAR_SPORTS, SPORT_NAMES } from "../../data/sports";
import { SportSkillLevelPicker } from "../../components/ui/SportSkillLevelPicker";
import { hasCompleteSportLevels, normaliseSportLevels } from "../../data/sportSkillLevels";
import { comparablePhone, isValidPhone } from "../../utils/contactVerification";

function StepHeader({ title, subtitle, onBack }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  return (
    <>
      {onBack && <TopBar title="" onBack={onBack} />}
      <div style={{ padding: "0 18px" }}>
        <div style={{ fontSize: T.display, fontWeight: 600, color: C.jet, ...fDisplay, marginBottom: 6, marginTop: onBack ? 0 : 4 }}>{title}</div>
        <div style={{ fontSize: T.body, color: C.slate, ...fBody, marginBottom: 20, lineHeight: 1.5 }}>{subtitle}</div>
      </div>
    </>
  );
}

/* Step 1 of 3 — build your profile (mobile, age, location, profile pic) */
export function calcAge(dobStr) {
  if (!dobStr) return null;
  const birth = new Date(dobStr);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function ScreenAboutYouProfile({ nav, params, onComplete }) {
  const { isDesktop } = useResponsive();
  const { darkMode, clientIdentity, updateClientIdentity, isHandleTaken } = useApp();
  const C = darkMode ? CD : CL;
  const [mobile, setMobile] = useState(params?.mobile || clientIdentity.phone || "");
  const [location, setLocation] = useState(params?.location || null); // { suburb, state, postcode }
  const [dob, setDob] = useState(params?.dob || "");
  const [photo, setPhoto] = useState(params?.photo || null);
  const [handle, setHandle] = useState(clientIdentity.handle || "");

  const fullName = `${clientIdentity.firstName || ""} ${clientIdentity.lastName || ""}`.trim() || "";

  const photoInputRef = React.useRef(null);
  const onPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setPhoto(URL.createObjectURL(file));
    e.target.value = "";
  };

  const age = calcAge(dob);
  const isUnder18 = age !== null && age < 18;
  const ageVerified = age !== null && age >= 18;
  const phoneVerified = !!clientIdentity.phoneVerified
    && comparablePhone(mobile) === comparablePhone(clientIdentity.phone);

  // Continue stays disabled — and the user can't advance — until the date of
  // birth entered confirms they're 18 or older, and a valid, available
  // username has been chosen.
  const canContinue = isValidPhone(mobile) && !!location && ageVerified && isValidHandle(handle) && !isHandleTaken(handle);
  // The "who are you booking for?" step has been removed from the flow —
  // finishing this step takes the client straight to the setup success screen.
  const goNext = () => {
    if (!canContinue) return;
    const profilePrefs = { location, mobile, dob, age, hasPhoto: !!photo };
    updateClientIdentity?.({ handle });
    if (!phoneVerified) {
      nav("verify-phone", {
        phone: mobile,
        next: "client-setup-complete",
        nextParams: { ...profilePrefs, name: fullName },
        pendingClientPrefs: profilePrefs,
        backTo: "about-you-profile",
        backParams: { mobile, location, dob, photo },
      });
      return;
    }
    onComplete?.({ ...profilePrefs, phoneVerified: true });
    nav("client-setup-complete", { ...profilePrefs, name: fullName });
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <StepHeader title="Let's learn about you" subtitle="A few quick details to set up your profile." />

      <div style={{ flex: 1, overflowY: "auto", padding: "0 18px", paddingBottom: "max(28px, env(safe-area-inset-bottom))" }} className="cl-hide-scrollbar">
        <SectionLabel>Build your profile</SectionLabel>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20 }}>
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            style={{ position: "relative", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            {photo ? (
              <img src={photo} alt="Profile" style={{ width: 84, height: 84, borderRadius: 84, objectFit: "cover", display: "block" }} />
            ) : (
              <Avatar name={fullName || "You"} size={84} />
            )}
            <div style={{ position: "absolute", bottom: -2, right: -2, width: 28, height: 28, borderRadius: 28, background: C.brand, border: `2px solid ${C.white}`, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <Camera size={13} color={C.white} />
            </div>
          </button>
          <input ref={photoInputRef} type="file" accept="image/*" onChange={onPhotoChange} style={{ display: "none" }} />
          <div style={{ fontSize: T.captionLg, color: C.slateLight, marginTop: 8, ...fBody }}>Tap to upload a profile photo</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 16 }}>
          {phoneVerified ? (
            <Card style={{ padding: 12, display: "flex", alignItems: "center", gap: 10, background: C.successTint }}>
              <span style={{ width: 36, height: 36, borderRadius: 12, background: C.white, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Phone size={16} color={C.success} /></span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: T.captionLg, color: C.slate, ...fBody }}>Verified mobile</span>
                <span style={{ display: "block", fontSize: T.body, color: C.jet, fontWeight: 600, marginTop: 2, ...fBody }}>{mobile}</span>
              </span>
              <Badge tone="success">Verified</Badge>
            </Card>
          ) : (
            <div>
              <div style={{ fontSize: T.labelLg, fontWeight: 600, color: C.jet, marginBottom: 6, ...fBody }}>Mobile number<RequiredMark /></div>
              <div className="cl-input" style={{ display: "flex", alignItems: "center", gap: 8, background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 13, padding: "11px 13px" }}>
                <Phone size={16} color={C.slateLight} />
                <input
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/[^0-9+()\-\s]/g, ""))}
                  placeholder="04XX XXX XXX"
                  inputMode="tel"
                  autoComplete="tel"
                  style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: T.bodyLg, color: C.jet, ...fBody }}
                />
              </div>
              <div style={{ fontSize: T.captionLg, color: C.slate, marginTop: 5, lineHeight: 1.45, ...fBody }}>We’ll verify this number before setup is complete.</div>
            </div>
          )}

          <div>
            <LocationField
              value={location}
              onChange={setLocation}
              label="Location"
              placeholder="Search suburb or postcode…"
              helper="We only use this to find coaches nearby (never shared with other users)."
              required
            />
          </div>

          <div>
            <div style={{ fontSize: T.labelLg, fontWeight: 600, color: C.jet, marginBottom: 6, ...fBody }}>Date of birth<RequiredMark /></div>
            <div className="cl-input" style={{ display: "flex", alignItems: "center", gap: 8, background: C.white, borderRadius: 13, padding: "11px 13px", border: isUnder18 ? `1.5px solid ${C.danger}` : `1.5px solid ${C.border}` }}>
              <CalendarDays size={16} color={C.slateLight} />
              <input
                type="date"
                name="account-date-of-birth"
                aria-label="Date of birth"
                value={dob}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDob(e.target.value)}
                style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: T.bodyLg, color: C.jet, ...fBody }}
              />
            </div>
            <div style={{ fontSize: T.captionLg, color: C.slateLight, marginTop: 5, ...fBody }}>
              Account holders must be 18 or older
            </div>
          </div>

          <HandleField value={handle} onChange={setHandle} isTaken={isHandleTaken(handle)} required />
        </div>

        {isUnder18 && (
          <Card style={{ marginBottom: 16, background: C.dangerTint, border: `1px solid ${C.dangerBorder}` }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <AlertTriangle size={16} color={C.danger} style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: T.label, color: C.jet, lineHeight: 1.5, ...fBody }}>
                <strong>Must be 18+ to create an account.</strong> A parent or guardian can sign up and book coaching on your behalf.
              </div>
            </div>
          </Card>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: C.slateLight, fontSize: T.captionLg, padding: "8px 0 16px", ...fBody }}>
          <ShieldCheck size={14} color={C.brand} />
          <span>Your information is kept private and secure</span>
        </div>
      </div>

      <div style={{ padding: isDesktop ? "18px 64px 24px" : "14px 18px", paddingBottom: isDesktop ? 24 : "max(28px, env(safe-area-inset-bottom))", borderTop: `1px solid ${C.border}`, background: C.white, flexShrink: 0, boxSizing: "border-box" }}>
        <Btn full disabled={!canContinue} onClick={goNext}>
          Continue
        </Btn>
      </div>
    </div>
  );
}

/* Step 2 of 3 — account type: who is this booking for? */
export function ScreenAccountType({ nav, params }) {
  const { isDesktop } = useResponsive();
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const [accountType, setAccountType] = useState(null); // "self" | "child"

  const goNext = () => {
    if (accountType === "child") nav("about-you-participants", { ...params });
    else if (accountType === "self") nav("about-you-self", { ...params });
  };

  const Option = ({ value, icon: Icon, title, body }) => {
    const active = accountType === value;
    return (
      <button
        onClick={() => setAccountType(value)}
        style={{ width: "100%", textAlign: "left", background: active ? C.brandTint : C.white, border: `1.5px solid ${active ? C.brand : C.border}`, borderRadius: 18, padding: 16, display: "flex", gap: 14, alignItems: "flex-start", cursor: "pointer", marginBottom: 12 }}
      >
        <div style={{ width: 44, height: 44, borderRadius: 13, background: active ? C.brand : C.fog, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={20} color={active ? C.white : C.slate} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: C.jet, fontSize: T.subtitleLg, marginBottom: 3, ...fDisplay }}>{title}</div>
          <div style={{ fontSize: T.labelLg, color: C.slate, lineHeight: 1.5, ...fBody }}>{body}</div>
        </div>
        <div style={{ width: 20, height: 20, borderRadius: 99, border: `1.5px solid ${active ? C.brand : C.border}`, background: C.white, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
          {active && <div style={{ width: 10, height: 10, borderRadius: 99, background: C.brand }} />}
        </div>
      </button>
    );
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <StepHeader title="Who are you booking for?" subtitle="Parents and guardians can keep a separate profile for each child." onBack={() => nav("about-you-profile")} />

      <div style={{ flex: 1, overflowY: "auto", padding: "0 18px", paddingBottom: "max(28px, env(safe-area-inset-bottom))" }} className="cl-hide-scrollbar">
        <SectionLabel>Participants</SectionLabel>
        <Option value="self" icon={User} title="Myself" body="I'll be the one attending coaching sessions." />
        <Option value="child" icon={Users} title="My Child / Children" body="I'm booking sessions on behalf of one or more children." />

        <Card style={{ marginTop: 8, marginBottom: 20, background: C.fog, border: "none" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <ShieldCheck size={16} color={C.brand} style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: T.label, color: C.slate, lineHeight: 1.6, ...fBody }}>
              Keeping each child on their own participant profile means coaches see only that child's age and needs - bookings, history and messages stay separate per child.
            </div>
          </div>
        </Card>
      </div>

      <div style={{ padding: isDesktop ? "18px 64px 24px" : "14px 18px", paddingBottom: isDesktop ? 24 : "max(28px, env(safe-area-inset-bottom))", borderTop: `1px solid ${C.border}`, background: C.white, flexShrink: 0, boxSizing: "border-box" }}>
        <Btn full disabled={!accountType} onClick={goNext}>Continue</Btn>
      </div>
    </div>
  );
}

/* Shared field set used by both the participant (child) setup flow and the
   "tell us about yourself" individual setup flow. */
export const emptyParticipantDraft = {
  name: "", dob: "", gender: "", location: null,
  sport: [], sportLevels: {}, goals: "",
  medicalConditions: "", allergies: "", medicalNotes: "",
  emergencyName: "", emergencyRelationship: "", emergencyMobile: "",
  guardianName: "", guardianRelationship: "", guardianMobile: "",
};

// showGuardianInfo renders the Guardian information block — only relevant when
// this field set is being used to create/edit a CHILD's participant profile,
// since an adult booking for themselves doesn't need a guardian on file.
export function ParticipantFields({ draft, setDraft, showGuardianInfo = false }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const inputStyle = {
    width: "100%", border: `1.5px solid ${C.border}`, borderRadius: 13, padding: "11px 13px",
    fontSize: T.bodyLg, outline: "none", boxSizing: "border-box", background: C.white, color: C.jet, ...fBody,
  };
  const labelStyle = { fontSize: T.labelLg, fontWeight: 600, color: C.jet, marginBottom: 6, ...fBody };

  const patch = (p) => setDraft((d) => ({ ...d, ...p }));
  const age = calcAge(draft.dob);
  const setSports = (sports) => setDraft((current) => ({
    ...current,
    sport: sports,
    sportLevels: normaliseSportLevels(sports, current.sportLevels, current.skillLevel),
  }));
  const toggleSport = (sport) => setSports(draft.sport.includes(sport)
    ? draft.sport.filter((item) => item !== sport)
    : [...draft.sport, sport]);

  return (
    <>
      <FormSection icon={User} label="Basic information" hint="Name, date of birth and location.">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Participant name" placeholder="e.g. Ava Chen" icon={Users} value={draft.name} onChange={(e) => patch({ name: e.target.value })} required />

          <div>
            <div style={labelStyle}>Date of birth<RequiredMark /></div>
            <div className="cl-input" style={{ display: "flex", alignItems: "center", gap: 8, border: `1.5px solid ${C.border}`, borderRadius: 13, padding: "11px 13px" }}>
              <CalendarDays size={16} color={C.slateLight} />
              <input
                type="date"
                name="participant-date-of-birth"
                aria-label="Participant date of birth"
                value={draft.dob}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => patch({ dob: e.target.value })}
                style={{ flex: 1, border: "none", outline: "none", fontSize: T.bodyLg, color: C.jet, ...fBody }}
              />
            </div>
          </div>

          <div>
            <div style={labelStyle}>Age</div>
            <div style={{ border: `1.5px solid ${C.border}`, borderRadius: 13, padding: "11px 13px", background: C.fog }}>
              <span style={{ fontSize: T.bodyLg, color: age !== null ? C.jet : C.slateLight, ...fBody }}>
                {age !== null ? `${age} years old` : "Auto-calculated from date of birth"}
              </span>
            </div>
          </div>

          <div>
            <div style={labelStyle}>Gender (optional)</div>
            <select
              name="participant-gender"
              aria-label="Gender (optional)"
              value={draft.gender}
              onChange={(e) => patch({ gender: e.target.value })}
              style={{ ...inputStyle, appearance: "auto", background: C.white, color: draft.gender ? C.jet : C.slateLight }}
            >
              <option value="">Prefer not to say</option>
              {GENDER_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <LocationField
            value={draft.location}
            onChange={(loc) => patch({ location: loc })}
            label="Location"
            placeholder="Search suburb or postcode…"
            helper="Used to find and match coaches near you."
          />
        </div>
      </FormSection>

      {showGuardianInfo && (
        <FormSection icon={UserCheck} label="Guardian information" hint="The parent or legal guardian responsible for this participant.">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Field label="Guardian name" placeholder="e.g. Jamie Chen" icon={UserCheck} value={draft.guardianName} onChange={(e) => patch({ guardianName: e.target.value })} required />
            <Field label="Relationship to participant" placeholder="e.g. Parent" value={draft.guardianRelationship} onChange={(e) => patch({ guardianRelationship: e.target.value })} required />
            <Field label="Mobile number" placeholder="04XX XXX XXX" icon={Phone} type="tel" value={draft.guardianMobile} onChange={(e) => patch({ guardianMobile: e.target.value.replace(/[^0-9+\s]/g, "") })} required />
          </div>
        </FormSection>
      )}

      <FormSection icon={Sparkles} label="Sport interests" hint="Sports they love - helps coaches match the right sessions.">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
          {POPULAR_SPORTS.slice(0, 10).map((s) => (
            <SportBadge key={s} sport={s} selected={draft.sport.includes(s)} onClick={() => toggleSport(s)} compact />
          ))}
        </div>
        <SportSearchMultiSelect options={SPORT_NAMES} value={draft.sport} onChange={setSports} placeholder="Search all sports…" />
      </FormSection>

      <FormSection icon={Target} label="Experience by sport" hint="Choose the closest current level for every selected sport.">
        <SportSkillLevelPicker
          sports={draft.sport}
          value={draft.sportLevels}
          onChange={(sportLevels) => patch({ sportLevels })}
        />
      </FormSection>

      <FormSection icon={Target} label="Coaching goals" hint="What they'd like to get out of coaching.">
        <textarea
          value={draft.goals}
          onChange={(e) => patch({ goals: e.target.value })}
          placeholder="e.g. build confidence for club trials, improve fitness, learn the basics…"
          rows={3}
          style={{ ...inputStyle, resize: "none" }}
        />
      </FormSection>

      <FormSection icon={Stethoscope} label="Medical information (optional)" hint="Anything a coach should know to keep sessions safe.">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Medical conditions" placeholder="e.g. asthma" icon={Stethoscope} value={draft.medicalConditions} onChange={(e) => patch({ medicalConditions: e.target.value })} />
          <Field label="Allergies" placeholder="e.g. bee stings, peanuts" icon={AlertTriangle} value={draft.allergies} onChange={(e) => patch({ allergies: e.target.value })} />
          <div>
            <div style={labelStyle}>Additional notes</div>
            <textarea
              value={draft.medicalNotes}
              onChange={(e) => patch({ medicalNotes: e.target.value })}
              placeholder="Anything else a coach should know"
              rows={2}
              style={{ ...inputStyle, resize: "none" }}
            />
          </div>
        </div>
      </FormSection>

      <FormSection icon={UserCheck} label="Emergency contact (optional)" hint="Who coaches can reach if they can't get hold of you.">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Contact name" placeholder="e.g. Mia Chen" icon={UserCheck} value={draft.emergencyName} onChange={(e) => patch({ emergencyName: e.target.value })} />
          <Field label="Relationship" placeholder="e.g. Mother" value={draft.emergencyRelationship} onChange={(e) => patch({ emergencyRelationship: e.target.value })} />
          <Field label="Mobile number" placeholder="04XX XXX XXX" icon={Phone} value={draft.emergencyMobile} onChange={(e) => patch({ emergencyMobile: e.target.value.replace(/[^0-9+\s]/g, "") })} />
        </div>
      </FormSection>
    </>
  );
}

/* Step 3 of 3 (child path) — add one or more participant profiles. Each save
   persists immediately via addChild; there is no limit on how many can be added. */
export function ScreenAboutYouParticipants({ nav, params, addChild, toast }) {
  const { isDesktop } = useResponsive();
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const [draft, setDraft] = useState(emptyParticipantDraft);
  const [savedCount, setSavedCount] = useState(0);

  const canSave = draft.name.trim().length > 0 && !!draft.dob
    && hasCompleteSportLevels(draft.sport, draft.sportLevels)
    && draft.guardianName.trim().length > 0 && draft.guardianRelationship.trim().length > 0 && draft.guardianMobile.trim().length > 0;

  const persist = () => {
    const age = calcAge(draft.dob);
    addChild({ ...draft, age: age !== null ? age : "" });
    setSavedCount((n) => n + 1);
  };

  const saveAndFinish = () => {
    if (!canSave) return;
    persist();
    nav("client-setup-complete");
  };

  const saveAndAddAnother = () => {
    if (!canSave) return;
    const name = draft.name.trim();
    persist();
    setDraft(emptyParticipantDraft);
    if (toast) toast(`${name}'s profile saved - add the next participant below`);
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <StepHeader
        title="Add a participant"
        subtitle="Create a profile for each child you would like to book coaching sessions for. You can add and manage multiple participant profiles at any time."
        onBack={() => nav("account-type", params)}
      />
      <div style={{ flex: 1, overflowY: "auto", padding: "0 18px", paddingBottom: "max(28px, env(safe-area-inset-bottom))" }} className="cl-hide-scrollbar">
        {savedCount > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Badge tone="success">{savedCount} participant{savedCount === 1 ? "" : "s"} added so far</Badge>
          </div>
        )}
        <ParticipantFields draft={draft} setDraft={setDraft} showGuardianInfo />
      </div>
      <div style={{ padding: isDesktop ? "18px 64px 24px" : "14px 18px", paddingBottom: isDesktop ? 24 : "max(28px, env(safe-area-inset-bottom))", borderTop: `1px solid ${C.border}`, background: C.white, display: "flex", flexDirection: "column", gap: 10, flexShrink: 0, boxSizing: "border-box" }}>
        <Btn full disabled={!canSave} onClick={saveAndFinish}>Save participant</Btn>
        <Btn full variant="outline" icon={Plus} disabled={!canSave} onClick={saveAndAddAnother}>Add another participant</Btn>
      </div>
    </div>
  );
}

/* Step 3 of 3 (self path) — same field set as the participant flow, for the
   account holder's own profile. */
export function ScreenAboutYouSelf({ nav, params, onComplete }) {
  const { isDesktop } = useResponsive();
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const [draft, setDraft] = useState(emptyParticipantDraft);
  const canContinue = draft.name.trim().length > 0 && !!draft.dob
    && hasCompleteSportLevels(draft.sport, draft.sportLevels);

  const finish = () => {
    if (!canContinue) return;
    const age = calcAge(draft.dob);
    const prefs = { ...params, ...draft, age: age !== null ? age : "" };
    if (onComplete) onComplete(prefs);
    nav("client-setup-complete", { name: draft.name });
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <StepHeader
        title="Tell us about yourself"
        subtitle="Help us recommend suitable coaches and personalise your coaching experience."
        onBack={() => nav("account-type", params)}
      />
      <div style={{ flex: 1, overflowY: "auto", padding: "0 18px", paddingBottom: "max(28px, env(safe-area-inset-bottom))" }} className="cl-hide-scrollbar">
        <ParticipantFields draft={draft} setDraft={setDraft} />
      </div>
      <div style={{ padding: isDesktop ? "18px 64px 24px" : "14px 18px", paddingBottom: isDesktop ? 24 : "max(28px, env(safe-area-inset-bottom))", borderTop: `1px solid ${C.border}`, background: C.white, flexShrink: 0, boxSizing: "border-box" }}>
        <Btn full disabled={!canContinue} onClick={finish}>Continue</Btn>
      </div>
    </div>
  );
}
