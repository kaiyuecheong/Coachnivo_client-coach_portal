import React, { useState } from "react";
import {
  Star, ShieldCheck, Clock, TrendingUp, Repeat, MapPin, Navigation, Award, Sparkles, Languages, CheckCircle2, UserCheck, Info,
} from "lucide-react";
import { CL, CD, fDisplay, fBody, T } from "../../theme/theme";
import { useApp } from "../../context/AppContext";
import { Avatar, Badge, SectionLabel, Card, HandleTag, BottomSheet, Btn } from "./Primitives";
import { SportBadge, SportIcon } from "./SportUI";
import { CONFIG } from "../../config";

/* -------------------------------------------------------------------------
   CoverBanner — the sport-art / photo cover used at the top of every coach
   profile (public listing profile and "My coaching profile").
   ------------------------------------------------------------------------- */
export function CoverBanner({ sport, image, name, height = 150, rounded = false }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  return (
    <div style={{ height, position: "relative", flexShrink: 0, overflow: "hidden", borderRadius: rounded ? 24 : 0, background: `linear-gradient(145deg, ${CL.jet} 0%, ${CL.jetSoft} 58%, ${CL.slate} 100%)` }}>
      {image ? (
        <img src={image} alt={`${name || sport} coaching session`} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 42%", display: "block" }} />
      ) : (
        <>
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(120% 90% at 15% 0%, ${C.onDarkDivider}, transparent 55%)` }} />
          <div style={{ position: "absolute", top: -30, right: -20, width: 160, height: 100, background: C.brand, opacity: 0.9, transform: "rotate(-18deg)", clipPath: "polygon(20% 0%, 100% 0%, 80% 100%, 0% 100%)" }} />
          <div style={{ position: "absolute", top: -30, right: 40, width: 90, height: 100, background: CL.jet, opacity: 0.55, transform: "rotate(-18deg)", clipPath: "polygon(20% 0%, 100% 0%, 80% 100%, 0% 100%)" }} />
          <SportIcon sport={sport} size={140} color={CL.white} style={{ position: "absolute", bottom: -30, left: -20, opacity: 0.14, transform: "rotate(-8deg)" }} />
        </>
      )}
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, transparent 24%, ${CL.jet} 118%)`, opacity: image ? 0.9 : 0.25 }} />
    </div>
  );
}

/* -------------------------------------------------------------------------
   CoachProfileHero — full-width cover + seamless identity section (name,
   handle, sport, rating, verified badges, response stats). Shared verbatim
   between the client-facing coach profile and "My coaching profile".
   ------------------------------------------------------------------------- */
export function CoachProfileHero({
  coach,
  pub,
  heroImage,
  avatarSrc,
  overlay,
  sport,
  sports,
  suburb,
  coverHeight = 240,
  rounded = false,
  isDesktop = false,
  style,
  onAvatarClick,
}) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const [verifyOpen, setVerifyOpen] = useState(false);
  const sportLine = sport || coach.sport;
  const suburbLine = suburb || coach.suburb;
  const sportValues = sports && sports.length ? sports : (coach.sports && coach.sports.length ? coach.sports : [sportLine]);
  const verifiedObj = coach.verified || {};
  const verificationChecks = [
    verifiedObj.identity && "Identity verified",
    verifiedObj.wwcc && "WWCC verified",
    verifiedObj.quals && "Accreditations checked",
  ].filter(Boolean);
  const stats = [
    { icon: Clock, label: "Response", value: (coach.responseTime || "").replace("Usually replies within ", "") },
    { icon: TrendingUp, label: "Acceptance", value: `${coach.acceptanceRate}%` },
    { icon: Repeat, label: "Repeat clients", value: `${coach.repeatClientRate}%` },
  ];
  const avatarSize = isDesktop ? 112 : 92;
  const btnPad = isDesktop ? 5 : 4;
  const halfOffset = Math.round((avatarSize + btnPad * 2) / 2);
  const spacerHeight = halfOffset + (isDesktop ? 14 : 10);
  return (
    <div style={style}>
      <div style={{ position: "relative" }}>
        <CoverBanner sport={coach.sport} image={heroImage} name={pub.name} height={coverHeight} rounded={rounded} />
        {overlay && (
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {overlay}
          </div>
        )}
      </div>

      <div style={{
        marginTop: -34,
        padding: isDesktop ? "0 64px 24px" : (rounded ? "0 28px 24px" : "0 18px 18px"),
        position: "relative",
        zIndex: 2,
        background: C.white,
        borderRadius: rounded ? 24 : "24px 24px 0 0",
        border: rounded ? `1px solid ${C.border}` : undefined,
        boxShadow: rounded ? "0 4px 20px rgba(22,24,29,.05)" : undefined,
      }}>
        <div style={{ height: spacerHeight }} />
        <div style={{ position: "absolute", top: -halfOffset, left: isDesktop ? 64 : (rounded ? 28 : 18) }}>
          <button
            type="button"
            aria-label="View profile photo full screen"
            onClick={onAvatarClick}
            disabled={!onAvatarClick}
            style={{
              padding: btnPad, borderRadius: 99, background: C.white,
              boxShadow: "0 8px 24px rgba(22,24,29,.14)",
              border: "none", display: "block", cursor: onAvatarClick ? "pointer" : "default",
            }}
          >
            <Avatar name={pub.name} src={avatarSrc} size={avatarSize} />
          </button>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: isDesktop ? 30 : 25, fontWeight: 700, color: C.jet, lineHeight: 1.15, ...fDisplay }}>{pub.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
              <HandleTag handle={pub.handle} size={15} color={C.slateLight} />
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 16, color: C.slate, ...fBody }}>
                <MapPin size={15} color={C.brand} style={{ flexShrink: 0 }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{suburbLine}</span>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {sportValues.map((value) => <SportBadge key={value} sport={value} compact />)}
            </div>
          </div>
          <div style={{ minWidth: 104, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", textAlign: "right", paddingTop: 2 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, fontSize: isDesktop ? 20 : 18, fontWeight: 700, color: C.jet, ...fBody }}>
              <Star size={16} fill={C.brand} color={C.brand} /> {coach.rating.toFixed(1)}
            </div>
            <div style={{ fontSize: 16, color: C.slate, marginTop: 2, ...fBody }}>{coach.reviews} reviews</div>
            {verificationChecks.length > 0 && (
                <button
                  type="button"
                  aria-label={`Verified coach with ${verificationChecks.length} checks. Tap to view verification details.`}
                  onClick={() => setVerifyOpen(true)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 4, marginTop: 8,
                    padding: "4px 8px", minHeight: 0,
                    background: C.brandTint, color: C.brandIcon,
                    border: "none", borderRadius: 8,
                    cursor: "pointer",
                    fontSize: T.captionLg, fontWeight: 600, whiteSpace: "nowrap", ...fBody
                  }}
                >
                  <ShieldCheck size={11.5} aria-hidden="true" />
                  Verified
                  <span style={{ minWidth: 14, height: 14, borderRadius: 99, background: C.brand, color: "#FFFFFF", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9.5, fontWeight: 700, lineHeight: 1, padding: "0 2px", ...fBody }}>{verificationChecks.length}</span>
                </button>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, marginTop: 14 }}>
          {stats.map((s) => (
            <div key={s.label} style={{ minWidth: 0, background: C.fog, border: `1px solid ${C.border}`, borderRadius: 13, padding: isDesktop ? "12px 8px 10px" : "10px 5px 9px", textAlign: "center" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                <s.icon size={isDesktop ? 16 : 14} color={C.brand} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: isDesktop ? 20 : 17, fontWeight: 700, color: C.jet, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...fDisplay }}>{s.value}</span>
              </div>
              <div style={{ fontSize: isDesktop ? 14 : T.support, color: C.slate, marginTop: 4, lineHeight: 1.2, ...fBody }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <BottomSheet
        open={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        title="Verified credentials"
        heightPct={78}
        footer={<Btn full onClick={() => setVerifyOpen(false)}>Done</Btn>}
      >
        <div style={{ animation: "clFadeUp .2s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: darkMode ? C.white : C.brandTint, borderRadius: 16, border: `1px solid ${C.border}`, marginBottom: 16 }}>
            <div style={{ padding: 2.5, borderRadius: 99, background: C.white, boxShadow: "0 2px 6px rgba(0,0,0,.08)", display: "inline-flex", flexShrink: 0 }}>
              <Avatar name={pub.name} src={avatarSrc} size={44} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: T.subtitle, fontWeight: 700, color: C.jet, ...fDisplay }}>{pub.name}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 7px", borderRadius: 999, background: C.brand, color: "#FFFFFF", fontSize: T.micro, fontWeight: 700, ...fBody }}>
                  <ShieldCheck size={11} /> {verificationChecks.length} Verified
                </span>
              </div>
              <div style={{ fontSize: T.caption, color: C.slate, marginTop: 2, ...fBody }}>
                Independently verified by CoachNivo Trust &amp; Safety
              </div>
            </div>
          </div>

          <SectionLabel>Verification checklist</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8, marginBottom: 18 }}>
            {/* Identity */}
            <div style={{ padding: "12px 14px", background: C.fog, borderRadius: 14, border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <UserCheck size={16} color={verifiedObj.identity ? C.brand : C.slate} />
                  <span style={{ fontSize: T.body, fontWeight: 600, color: C.jet, ...fBody }}>Government ID</span>
                </div>
                <Badge tone={verifiedObj.identity ? "success" : "neutral"} icon={verifiedObj.identity ? CheckCircle2 : null}>
                  {verifiedObj.identity ? "Verified" : "Pending"}
                </Badge>
              </div>
              <div style={{ fontSize: T.captionLg, color: C.slate, marginTop: 6, lineHeight: 1.45, ...fBody }}>
                {verifiedObj.identity
                  ? "Government-issued photo identification verified against official records."
                  : "Government ID verification is currently pending review."}
              </div>
            </div>

            {/* WWCC */}
            <div style={{ padding: "12px 14px", background: C.fog, borderRadius: 14, border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <ShieldCheck size={16} color={verifiedObj.wwcc ? C.brand : C.slate} />
                  <span style={{ fontSize: T.body, fontWeight: 600, color: C.jet, ...fBody }}>Working with Children (WWCC)</span>
                </div>
                <Badge tone={verifiedObj.wwcc ? "success" : "neutral"} icon={verifiedObj.wwcc ? CheckCircle2 : null}>
                  {verifiedObj.wwcc ? "Active" : "Adult athletes only"}
                </Badge>
              </div>
              <div style={{ fontSize: T.captionLg, color: C.slate, marginTop: 6, lineHeight: 1.45, ...fBody }}>
                {verifiedObj.wwcc
                  ? "Valid working-with-children clearance on file. Cleared for coaching minors and school-age athletes."
                  : "WWCC is not on file. This coach is approved for coaching adult athletes (18+) only."}
              </div>
            </div>

            {/* Qualifications / Accreditations */}
            <div style={{ padding: "12px 14px", background: C.fog, borderRadius: 14, border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Award size={16} color={verifiedObj.quals ? C.brand : C.slate} />
                  <span style={{ fontSize: T.body, fontWeight: 600, color: C.jet, ...fBody }}>Qualifications &amp; Accreditations</span>
                </div>
                <Badge tone={verifiedObj.quals ? "success" : "neutral"} icon={verifiedObj.quals ? CheckCircle2 : null}>
                  {verifiedObj.quals ? "Verified" : "Pending"}
                </Badge>
              </div>
              {coach.accreditations && coach.accreditations.length > 0 ? (
                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 5 }}>
                  {coach.accreditations.map((acc, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: T.captionLg, color: C.jetSoft, ...fBody }}>
                      <CheckCircle2 size={13} color={C.brand} style={{ flexShrink: 0 }} />
                      <span>{acc}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: T.captionLg, color: C.slate, marginTop: 6, lineHeight: 1.45, ...fBody }}>
                  {verifiedObj.quals ? "Sport-specific coaching licenses and certifications confirmed." : "Certifications under review."}
                </div>
              )}
            </div>
          </div>

          {/* Trust notes */}
          <SectionLabel>Verification notes</SectionLabel>
          <div style={{ marginTop: 8, padding: "12px 14px", background: C.fog, borderRadius: 14, border: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <Info size={15} color={C.brand} style={{ marginTop: 2, flexShrink: 0 }} />
              <div style={{ fontSize: T.captionLg, color: C.slate, lineHeight: 1.5, ...fBody }}>
                All credentials are independently reviewed by the CoachNivo Trust &amp; Safety team before coach profiles can accept bookings. Verifications are refreshed annually.
              </div>
            </div>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

/* -------------------------------------------------------------------------
   CoachProfileAbout — the About tab content shared by both profile layouts:
   Bio → Experience (+ languages) → Specialties → Location & travel →
   Accreditations → platform cancellation policy.
   ------------------------------------------------------------------------- */
export function CoachProfileAbout({ coach, data = {}, showCancellationPolicy = true }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const bio = data.bio || coach?.bio;
  const experience = data.experience || (coach?.yearsExperience ? `${coach.yearsExperience} yrs coaching` : coach?.experience);
  const languages = (data.languages && data.languages.length ? data.languages : coach?.languages) || ["English"];
  const specialties = (data.specialties && data.specialties.length ? data.specialties : coach?.tags) || [];
  const accreditations = data.accreditations || coach?.accreditations || [];
  const venue = data.venue || coach?.venue;
  const suburbLine = data.suburb || coach?.suburb;
  const travelRadiusKm = data.travelRadiusKm ?? coach?.travelRadiusKm;
  const willingToTravel = data.willingToTravel ?? coach?.willingToTravel;

  return (
    <div>
      <SectionLabel>Bio</SectionLabel>
      <p style={{ fontSize: T.bodyLg, color: C.slate, lineHeight: 1.6, marginBottom: 14, ...fBody }}>{bio}</p>

      {(experience || languages.length > 0) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
          {experience && (
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 999,
              background: C.fog,
              border: `1px solid ${C.border}`,
              fontSize: T.captionLg,
              fontWeight: 600,
              color: C.jet,
              ...fBody,
            }}>
              <Award size={13} color={C.brand} style={{ flexShrink: 0 }} />
              {experience}
            </span>
          )}
          {languages.length > 0 && (
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 999,
              background: C.fog,
              border: `1px solid ${C.border}`,
              fontSize: T.captionLg,
              fontWeight: 600,
              color: C.jet,
              ...fBody,
            }}>
              <Languages size={13} color={C.slateLight} style={{ flexShrink: 0 }} />
              Speaks {languages.join(", ")}
            </span>
          )}
        </div>
      )}

      {specialties.length > 0 && (
        <>
          <SectionLabel>Specialties</SectionLabel>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
            {specialties.map((s) => (
              <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 999, background: C.fog, border: `1px solid ${C.border}`, fontSize: T.captionLg, fontWeight: 600, color: C.jet, ...fBody }}>
                <Sparkles size={11} color={C.brand} />
                {s}
              </span>
            ))}
          </div>
        </>
      )}

      <SectionLabel>Location & travel</SectionLabel>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
          <MapPin size={15} color={C.brand} style={{ marginTop: 1, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: T.body, fontWeight: 600, color: C.jet, ...fBody }}>{venue}</div>
            <div style={{ fontSize: T.captionLg, color: C.slate, marginTop: 1, ...fBody }}>{suburbLine}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <Navigation size={15} color={C.brand} style={{ marginTop: 1, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: T.body, fontWeight: 600, color: C.jet, ...fBody }}>
              {travelRadiusKm ? `Travels up to ${travelRadiusKm}km` : "Travel distance to be confirmed"}
            </div>
            <div style={{ fontSize: T.captionLg, color: C.slate, marginTop: 1, ...fBody }}>
              {willingToTravel ? "Willing to travel to your location" : "In-venue sessions only - travel not offered"}
            </div>
          </div>
        </div>
      </Card>

      {accreditations.length > 0 && (
        <>
          <SectionLabel>Accreditations</SectionLabel>
          <Card style={{ marginBottom: 16 }}>
            {accreditations.map((q, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: i === accreditations.length - 1 ? "none" : `1px solid ${C.border}` }}>
                <Award size={14} color={C.brand} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: T.body, color: C.jet, ...fBody }}>{q}</span>
              </div>
            ))}
          </Card>
        </>
      )}

      {showCancellationPolicy && (
        <>
          <SectionLabel>Cancellation policy</SectionLabel>
          <p style={{ fontSize: T.bodyLg, color: C.slate, lineHeight: 1.6, marginBottom: 6, ...fBody }}>{CONFIG.cancellationPolicy}</p>
        </>
      )}
    </div>
  );
}
