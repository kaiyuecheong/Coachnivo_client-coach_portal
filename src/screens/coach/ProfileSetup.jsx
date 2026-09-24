import React, { useRef, useState } from "react";
import { Camera, X, FileCheck2, Upload, FileText, Sparkles, TrendingUp, Award, Image as ImageIcon } from "lucide-react";
import { CL, CD, fDisplay, fBody, T } from "../../theme/theme";
import { useApp } from "../../context/AppContext";
import { Avatar, FormSection, Chip, Card, Btn, TopBar } from "../../components/ui/Primitives";
import { SportBadge, SportSearchMultiSelect } from "../../components/ui/SportUI";
import { POPULAR_SPORTS, SPORT_NAMES } from "../../data/sports";
const EXPERIENCE_OPTIONS = ["<1 year", "1–2 years", "3–5 years", "6–9 years", "10+ years"];

export function ScreenCoachProfileSetup({ nav, toast }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const [avatar, setAvatar] = useState(null);
  const [bio, setBio] = useState("");
  const [sports, setSports] = useState([]);
  const [experience, setExperience] = useState("");
  const [certs, setCerts] = useState([]);
  const [media, setMedia] = useState([]);

  const avatarInputRef = useRef(null);
  const certInputRef = useRef(null);
  const mediaInputRef = useRef(null);

  const toggleSport = (s) => setSports((arr) => (arr.includes(s) ? arr.filter((x) => x !== s) : [...arr, s]));

  const onAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setAvatar(URL.createObjectURL(file));
    e.target.value = "";
  };
  const onCertsChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) setCerts((c) => [...c, ...files.map((f) => ({ name: f.name }))]);
    e.target.value = "";
  };
  const removeCert = (i) => setCerts((c) => c.filter((_, idx) => idx !== i));

  const onMediaChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) {
      setMedia((m) => [
        ...m,
        ...files.map((f) => ({ name: f.name, url: URL.createObjectURL(f), type: f.type.startsWith("video") ? "video" : "image" })),
      ]);
    }
    e.target.value = "";
  };
  const removeMedia = (i) => setMedia((m) => m.filter((_, idx) => idx !== i));

  const complete = bio.trim().length > 0 && sports.length > 0 && !!experience;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "18px 20px 0", flex: 1, overflowY: "auto", paddingBottom: 100 }}>
        <TopBar title="Profile setup" />
        <div style={{ fontSize: T.body, color: C.slate, marginBottom: 18, ...fBody }}>
          Tell clients who you are - this shows up on your public coach profile.
        </div>

        <FormSection icon={Camera} label="Profile photo" hint="A clear photo helps clients feel confident in you.">
          <div style={{ textAlign: "center" }}>
            <div style={{ position: "relative", display: "inline-block" }}>
              {avatar ? (
                <img src={avatar} alt="Profile" style={{ width: 84, height: 84, borderRadius: 84, objectFit: "cover", display: "block" }} />
              ) : (
                <Avatar name="New Coach" size={84} />
              )}
              <button onClick={() => avatarInputRef.current?.click()} style={{ position: "absolute", bottom: -2, right: -2, width: 28, height: 28, borderRadius: 99, background: C.brand, border: `2px solid ${C.white}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <Camera size={13} color="#FFFFFF" />
              </button>
            </div>
            <input ref={avatarInputRef} type="file" accept="image/*" onChange={onAvatarChange} style={{ display: "none" }} />
            <div style={{ fontSize: T.captionLg, color: C.slateLight, marginTop: 8, ...fBody }}>Tap the camera icon to upload a profile photo</div>
          </div>
        </FormSection>

        <FormSection icon={FileText} label="Bio" hint="Introduce yourself and your coaching style." required>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell clients about your coaching background, philosophy and what makes you unique…"
            rows={4}
            style={{ width: "100%", border: `1.5px solid ${C.border}`, borderRadius: 14, padding: 13, fontSize: T.body, resize: "none", outline: "none", boxSizing: "border-box", ...fBody }}
          />
        </FormSection>

        <FormSection icon={Sparkles} label="Sports coached" hint="Choose every sport you coach." required>
          <div style={{ fontSize: T.captionLg, color: C.slateLight, marginBottom: 8, ...fBody }}>Popular in Australia</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            {POPULAR_SPORTS.slice(0, 10).map((sport) => (
              <SportBadge key={sport} sport={sport} selected={sports.includes(sport)} onClick={() => toggleSport(sport)} compact />
            ))}
          </div>
          <SportSearchMultiSelect options={SPORT_NAMES} value={sports} onChange={setSports} placeholder="Search all sports…" />
        </FormSection>

        <FormSection icon={TrendingUp} label="Experience" hint="How long have you been coaching?" required>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {EXPERIENCE_OPTIONS.map((e) => (
              <Chip key={e} active={experience === e} onClick={() => setExperience(e)}>{e}</Chip>
            ))}
          </div>
        </FormSection>

        <FormSection icon={Award} label="Accreditations" hint="Upload certifications that build trust with clients.">
          {certs.map((c, i) => (
            <Card key={i} style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <FileCheck2 size={16} color={C.brand} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: T.labelLg, color: C.jet, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...fBody }}>{c.name}</span>
              </div>
              <button onClick={() => removeCert(i)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexShrink: 0 }}>
                <X size={15} color={C.slateLight} />
              </button>
            </Card>
          ))}
          <button onClick={() => certInputRef.current?.click()} style={{ width: "100%", border: `1.5px dashed ${C.border}`, borderRadius: 14, padding: 14, background: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", boxSizing: "border-box" }}>
            <Upload size={15} color={C.slate} />
            <span style={{ fontSize: T.labelLg, color: C.slate, fontWeight: 600, ...fBody }}>Upload accreditation (PDF or image)</span>
          </button>
          <input ref={certInputRef} type="file" accept=".pdf,image/*" multiple onChange={onCertsChange} style={{ display: "none" }} />
        </FormSection>

        <FormSection icon={ImageIcon} label="Photos & video reels" hint="Showcase your coaching in action.">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 6 }}>
            {media.map((m, i) => (
              <div key={i} style={{ position: "relative", aspectRatio: "1", borderRadius: 12, overflow: "hidden", background: C.fog }}>
                {m.type === "video" ? (
                  <video src={m.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />
                ) : (
                  <img src={m.url} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
                <button onClick={() => removeMedia(i)} style={{ position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: 99, background: "rgba(22,24,29,.65)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <X size={11} color={C.white} />
                </button>
              </div>
            ))}
            <button onClick={() => mediaInputRef.current?.click()} style={{ aspectRatio: "1", borderRadius: 12, border: `1.5px dashed ${C.border}`, background: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Camera size={16} color={C.slate} />
            </button>
          </div>
          <input ref={mediaInputRef} type="file" accept="image/*,video/*" multiple onChange={onMediaChange} style={{ display: "none" }} />
          <div style={{ fontSize: T.caption, color: C.slateLight, ...fBody }}>Upload photos or short video reels that showcase your coaching in action.</div>
        </FormSection>

        <Btn full disabled={!complete} onClick={() => { toast("Profile details saved"); nav("coach-services-setup"); }}>
          Continue to Services Setup
        </Btn>
        {!complete && (
          <div style={{ fontSize: T.caption, color: C.slateLight, textAlign: "center", marginTop: 8, ...fBody }}>
            Add a bio, at least one sport and your experience level to continue.
          </div>
        )}
      </div>
    </div>
  );
}
