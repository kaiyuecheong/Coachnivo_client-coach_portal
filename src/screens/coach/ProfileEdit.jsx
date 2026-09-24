import React, { useEffect, useState, useRef } from "react";
import {
  Camera, Edit3, Eye, EyeOff, Fingerprint, Lock, Shield, ShieldCheck, HelpCircle,
  LogOut, ChevronRight, Trash2, Plus, User,
  Banknote, CalendarClock, CalendarDays, Bell, MapPin, Film, Play, Image as ImageIcon,
  Share2, Award, X, Navigation, Star, Mail, AlertTriangle, Sparkles,
  Phone, MessageCircle, CheckCircle2,
} from "lucide-react";
import { CL, CD, fDisplay, fBody, T } from "../../theme/theme";
import { COACHES, LANGUAGE_OPTIONS, GENDER_OPTIONS, AU_SUBURBS, REVIEWS } from "../../data/mockData";
import {
  Avatar, ScreenHeader, SectionLabel, FormSection, Chip, Card, Toggle, Btn, BottomSheet, ConfirmDialog, Field,
  SearchMultiSelect, SearchSelect, ScrollFadeRow, SegTabs, FullscreenImageViewer, RequiredMark,
  SettingsRow, SettingsGroup, PasswordRequirements, passwordValid,
} from "../../components/ui/Primitives";
import { CoachProfileHero, CoachProfileAbout } from "../../components/ui/CoachProfileSections";
import { SportBadge, SportLabel, SportSearchMultiSelect } from "../../components/ui/SportUI";
import { POPULAR_SPORTS, SPORT_NAMES } from "../../data/sports";
import { HandleField } from "../../components/ui/PublicIdentityFields";
import { isValidHandle, getPublicName } from "../../utils/name";
import { formatCoachLocation } from "../../utils/coachProfile";
import { useApp } from "../../context/AppContext";
import { useResponsive } from "../../theme/responsive";
import { CONFIG } from "../../config";
import { AccountDetailsSheet } from "../../components/ui/AccountDetailsSheet";

const LOCATION_OPTIONS = AU_SUBURBS.map((s) => `${s.suburb}, ${s.state}`);

function OptionCard({ icon: Icon, title, desc, selected, onClick }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left",
        padding: 14, borderRadius: 16, marginBottom: 10, cursor: "pointer",
        border: `1.5px solid ${selected ? C.brand : C.border}`,
        background: selected ? C.brandTint : C.white,
        transition: "border-color .15s ease, background .15s ease",
      }}
    >
      {Icon && (
        <div style={{ width: 36, height: 36, borderRadius: 12, background: selected ? C.white : C.fog, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={16} color={selected ? C.brand : C.slate} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: T.bodyLg, fontWeight: 600, color: C.jet, ...fBody }}>{title}</div>
        {desc && <div style={{ fontSize: T.captionLg, color: C.slate, marginTop: 2, lineHeight: 1.45, ...fBody }}>{desc}</div>}
      </div>
      <div style={{
        width: 20, height: 20, borderRadius: 99, flexShrink: 0,
        border: `1.5px solid ${selected ? C.brand : C.border}`, background: C.white,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {selected && <div style={{ width: 8, height: 8, borderRadius: 99, background: C.brand }} />}
      </div>
    </button>
  );
}

export function ScreenCoachProfileEdit({ nav, resetNav, toast, coachPackages, savePackage, removePackage, biometric, setBiometric, coachMedia = [], coachAvailableNow, setCoachAvailableNow }) {
  const { darkMode, coachOnboarding, coachProfile, updateCoachOnboarding, isHandleTaken, pushNotification } = useApp();
  const { isDesktop } = useResponsive();
  const C = darkMode ? CD : CL;
  const coach = coachProfile;

  // Specialties — surface onboarding expertise (categories, skill levels,
  // age groups, formats) when the coach filled it in, otherwise the
  // directory tags seeded for this coach.
  const expertiseBits = [
    ...(coachOnboarding.coachingCategories || []),
    ...(coachOnboarding.skillLevels || []),
    ...(coachOnboarding.ageGroups || []),
    ...(coachOnboarding.coachingFormats || []),
    ...(coachOnboarding.secondarySports || []),
  ];
  const specialties = expertiseBits.length > 0 ? [...new Set(expertiseBits)].slice(0, 8) : coach.tags;

  const [profile, setProfile] = useState({
    photo: coachOnboarding.photo || coach.avatar,
    coverPhoto: coachOnboarding.coverPhoto || coachMedia.find((item) => item.type === "photo")?.url || "",
    name: coachOnboarding.name || coach.name,
    handle: coachOnboarding.handle || coach.handle,
    namePrivacy: coachOnboarding.namePrivacy || coach.namePrivacy,
    bio: coachOnboarding.bio ?? coach.bio,
    yearsExperience: coachOnboarding.yearsExperience ?? (coach.experience.match(/\d+/) || [""])[0],
    gender: coachOnboarding.gender || "",
    languages: Array.isArray(coachOnboarding.languages) ? coachOnboarding.languages : ["English"],
    sports: Array.isArray(coachOnboarding.sports) && coachOnboarding.sports.length
      ? coachOnboarding.sports
      : (Array.isArray(coachOnboarding.primarySports) && coachOnboarding.primarySports.length
        ? [...coachOnboarding.primarySports, ...(coachOnboarding.secondarySports || [])]
        : [coach.sport]),
    location: formatCoachLocation(coachOnboarding.location, coach.suburb),
    venue: coachOnboarding.venue ?? coach.venue,
    travelRadiusKm: coachOnboarding.travelRadiusKm ?? coach.travelRadiusKm,
    willingToTravel: coachOnboarding.willingToTravel ?? coach.willingToTravel,
    accreditations: Array.isArray(coachOnboarding.accreditations) ? [...coachOnboarding.accreditations] : [...coach.accreditations],
  });
  const [draft, setDraft] = useState(null);
  const [handleEdited, setHandleEdited] = useState(false);
  const [draftAccreditation, setDraftAccreditation] = useState("");
  const [avatarOpen, setAvatarOpen] = useState(false);
  const photoInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const openEditProfile = () => { setHandleEdited(false); setDraftAccreditation(""); setDraft({ ...profile, accreditations: [...(profile.accreditations || [])] }); setSheet("edit"); };
  const setDraftField = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const onPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setDraftField({ photo: URL.createObjectURL(file) });
    e.target.value = "";
  };
  const onCoverChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setDraftField({ coverPhoto: URL.createObjectURL(file) });
    e.target.value = "";
  };
  const addDraftAccreditation = () => {
    const v = draftAccreditation.trim();
    if (!v) return;
    setDraftField({ accreditations: [...(draft.accreditations || []), v] });
    setDraftAccreditation("");
  };
  const removeDraftAccreditation = (i) => setDraftField({ accreditations: draft.accreditations.filter((_, idx) => idx !== i) });
  const saveProfile = () => {
    if (!draft.name.trim()) { toast("Add your name first"); return; }
    if (!isValidHandle(draft.handle)) { toast("Pick a valid username - 3–24 characters"); return; }
    if (isHandleTaken(draft.handle, [coach.handle, profile.handle])) { toast("That username's taken - try another"); return; }
    if (!draft.sports || draft.sports.length === 0) { toast("Pick at least one sport you coach"); return; }
    setProfile(draft);
    updateCoachOnboarding?.({
      name: draft.name,
      handle: draft.handle,
      namePrivacy: draft.namePrivacy,
      photo: draft.photo,
      coverPhoto: draft.coverPhoto,
      bio: draft.bio,
      yearsExperience: draft.yearsExperience,
      gender: draft.gender,
      languages: draft.languages,
      sports: draft.sports,
      primarySports: draft.sports.slice(0, 1),
      secondarySports: draft.sports.slice(1),
      location: draft.location,
      venue: draft.venue,
      travelRadiusKm: draft.travelRadiusKm,
      willingToTravel: draft.willingToTravel,
      accreditations: draft.accreditations,
    });
    toast("Profile changes saved and published");
    setDraft(null);
    setSheet(null);
  };

  const toggleActive = (pkg) => {
    const nowActive = !(pkg.active !== false);
    savePackage({ ...pkg, active: nowActive });
    toast(nowActive ? `${pkg.name} enabled` : `${pkg.name} paused - hidden from clients`);
  };

  const [notifPrefs, setNotifPrefs] = useState({
    push: true, email: true, sms: false, whatsapp: false,
    bookingRequests: true, bookingConfirmations: true, messages: true, paymentUpdates: true,
  });
  const toggleNotif = (key) => setNotifPrefs((p) => ({ ...p, [key]: !p[key] }));

  const [sheet, setSheet] = useState(null);
  const closeSheet = () => setSheet(null);
  const [showPw, setShowPw] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const pwdOk = passwordValid(newPw) && newPw === confirmPw;
  const [tab, setTab] = useState("profile");
  const [deleteStep, setDeleteStep] = useState("confirm");
  const [deleteCode, setDeleteCode] = useState(["", "", "", "", "", ""]);
  const [deleteError, setDeleteError] = useState(false);
  const [deleteResendSeconds, setDeleteResendSeconds] = useState(0);
  const deleteInputsRef = useRef([]);
  const coachEmail = coachOnboarding.email || "noah.kelly@email.com";
  const coachPhone = coachOnboarding.phone || "0412 555 018";

  const saveAccountDetails = ({ name, username, email, phone }) => {
    const contactChanged = email.trim().toLowerCase() !== coachEmail.trim().toLowerCase()
      || phone.replace(/\D/g, "") !== coachPhone.replace(/\D/g, "");
    setProfile((current) => ({ ...current, name, handle: username }));
    updateCoachOnboarding?.({ name, handle: username, email, phone, phoneVerified: !!phone });
    if (contactChanged) {
      pushNotification?.({
        audience: "coach",
        type: "verification",
        title: "Contact details changed",
        body: "Your verified email or phone number was updated. If this wasn't you, contact support now.",
      });
    }
  };

  useEffect(() => {
    if (deleteResendSeconds <= 0) return undefined;
    const timer = window.setInterval(() => setDeleteResendSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [deleteResendSeconds]);

  const resetDeleteFlow = () => {
    setDeleteStep("confirm");
    setDeleteCode(["", "", "", "", "", ""]);
    setDeleteError(false);
    setDeleteResendSeconds(0);
  };
  const openDeleteFlow = () => {
    resetDeleteFlow();
    setSheet("delete");
  };
  const closeDeleteFlow = () => {
    setSheet(null);
    resetDeleteFlow();
  };
  const sendDeleteCode = () => {
    if (!coachEmail) {
      toast("Add an email before deleting your account");
      return;
    }
    setDeleteStep("verify");
    setDeleteCode(["", "", "", "", "", ""]);
    setDeleteError(false);
    setDeleteResendSeconds(30);
    toast("Verification code sent");
    window.setTimeout(() => deleteInputsRef.current[0]?.focus(), 120);
  };
  const setDeleteDigit = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setDeleteCode((current) => current.map((item, itemIndex) => itemIndex === index ? digit : item));
    setDeleteError(false);
    if (digit && index < 5) deleteInputsRef.current[index + 1]?.focus();
  };
  const onDeleteKeyDown = (index, event) => {
    if (event.key === "Backspace" && !deleteCode[index] && index > 0) deleteInputsRef.current[index - 1]?.focus();
  };
  const onDeletePaste = (event) => {
    const digits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split("");
    if (!digits.length) return;
    event.preventDefault();
    setDeleteCode(Array.from({ length: 6 }, (_, index) => digits[index] || ""));
    setDeleteError(false);
    deleteInputsRef.current[Math.min(digits.length, 6) - 1]?.focus();
  };
  const verifyAndDelete = () => {
    const code = deleteCode.join("");
    if (code.length !== 6 || code === "000000") {
      setDeleteError(true);
      return;
    }
    closeDeleteFlow();
    toast("Coach account deleted securely");
    resetNav("splash", {}, "client");
  };
  const resendDeleteCode = () => {
    setDeleteCode(["", "", "", "", "", ""]);
    setDeleteError(false);
    setDeleteResendSeconds(30);
    toast("New verification code sent");
    deleteInputsRef.current[0]?.focus();
  };

  const pubMe = getPublicName({ name: profile.name, handle: profile.handle, namePrivacy: profile.namePrivacy }, "public");
  const heroPhoto = profile.coverPhoto || coachMedia.find((m) => m.type === "photo")?.url;
  const aboutData = {
    bio: profile.bio,
    experience: profile.yearsExperience ? `${profile.yearsExperience} yrs coaching` : coach.experience,
    languages: profile.languages,
    specialties,
    suburb: profile.location,
    venue: profile.venue,
    travelRadiusKm: profile.travelRadiusKm,
    willingToTravel: profile.willingToTravel,
    accreditations: profile.accreditations,
  };
  const handleShare = () => toast("Profile link ready to share");
  const reviewAvg = (REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length).toFixed(1);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: isDesktop ? "40px 64px 0" : "18px 18px 0", width: "100%", boxSizing: "border-box" }}>
        <ScreenHeader title="My coaching profile" subtitle="What athletes see when they discover you." style={{ marginBottom: 18 }} />

        <div style={{ marginBottom: 8, maxWidth: "100%", width: "100%" }}>
          <SegTabs
            items={[
              { value: "profile", label: "Profile" },
              { value: "business", label: "Business" },
              { value: "settings", label: "Settings" },
            ]}
            value={tab}
            onChange={setTab}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", width: "100%", padding: isDesktop ? "24px 64px 64px" : "14px 18px 0", paddingBottom: isDesktop ? 64 : 116, boxSizing: "border-box" }} className="cl-hide-scrollbar">
        {tab === "profile" && (
        <div style={{ display: isDesktop ? "grid" : "block", gridTemplateColumns: isDesktop ? "minmax(0, 1fr) 340px" : undefined, gap: isDesktop ? 28 : undefined, alignItems: "start" }}>
          {/* Main Column */}
          <div style={{ minWidth: 0 }}>
            <div style={{ borderRadius: isDesktop ? 20 : 0, overflow: "hidden", marginBottom: isDesktop ? 20 : 0 }}>
              <CoachProfileHero
                coach={coach}
                pub={pubMe}
                heroImage={heroPhoto}
                avatarSrc={profile.photo}
                sport={profile.sports[0]}
                sports={profile.sports}
                suburb={profile.location}
                coverHeight={isDesktop ? 220 : 188}
                style={{ margin: isDesktop ? "0" : "-14px -18px 0" }}
                onAvatarClick={() => setAvatarOpen(true)}
                overlay={
                  <button type="button" aria-label="Share coach profile" onClick={handleShare} style={{ position: "absolute", top: 12, right: 12, pointerEvents: "auto", width: 44, height: 44, borderRadius: 99, background: CL.jetSoft, opacity: 0.94, border: `1px solid ${CL.onDarkDivider}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 8px 20px rgba(0,0,0,.18)" }}>
                    <Share2 size={18} color={CL.white} />
                  </button>
                }
              />
            </div>

            {/* Mobile-only action button */}
            {!isDesktop && (
              <div style={{ display: "flex", gap: 8, margin: "16px 0 22px" }}>
                <div style={{ flex: 1 }}>
                  <Btn full variant="secondary" size="sm" icon={Edit3} onClick={openEditProfile}>Edit profile</Btn>
                </div>
              </div>
            )}

            <CoachProfileAbout coach={coach} data={aboutData} showCancellationPolicy={false} />

            <div style={{ marginTop: 22 }}>
              <SectionLabel>Reels & photos</SectionLabel>
              {coachMedia.length === 0 ? (
                <div style={{ fontSize: T.labelLg, color: C.slateLight, marginBottom: 22, ...fBody }}>
                  No reels or photos yet - add some so athletes can see you coach.
                </div>
              ) : (
                <div className="cl-hide-scrollbar" style={{ display: isDesktop ? "grid" : "flex", gridTemplateColumns: isDesktop ? "repeat(auto-fill, minmax(110px, 1fr))" : undefined, gap: isDesktop ? 12 : 8, overflowX: isDesktop ? "visible" : "auto", paddingBottom: 4, marginBottom: 14 }}>
                  {coachMedia.slice(0, isDesktop ? 8 : 6).map((item) => {
                    const isReel = item.type === "reel";
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-label={`Manage ${item.caption || "media"}`}
                        onClick={() => nav("coach-reels")}
                        style={{ width: isDesktop ? "100%" : 76, minWidth: isDesktop ? 0 : 76, minHeight: 0, aspectRatio: "3 / 4", padding: 0, overflow: "hidden", borderRadius: 14, flexShrink: 0, cursor: "pointer", background: C.fog, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}
                      >
                        {item.url ? (
                          isReel
                            ? <video src={item.url} muted loop autoPlay playsInline preload="metadata" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                            : <img src={item.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        ) : (
                          <div style={{ width: 26, height: 26, borderRadius: 99, background: C.jet, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {isReel ? <Play size={11} color={C.white} fill={C.white} /> : <ImageIcon size={12} color={C.white} />}
                          </div>
                        )}
                        {item.url && isReel && (
                          <div style={{ position: "absolute", bottom: 6, left: 6, width: 22, height: 22, borderRadius: 99, background: C.jet, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Play size={9} color={C.white} fill={C.white} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => nav("coach-reels")}
                    style={{
                      width: isDesktop ? "100%" : 76, aspectRatio: "3/4", borderRadius: 14, flexShrink: 0, cursor: "pointer",
                      background: C.fog, border: `1px dashed ${C.border}`, display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center", gap: 4,
                    }}
                  >
                    <ChevronRight size={14} color={C.slate} />
                    <span style={{ fontSize: T.tiny, fontWeight: 600, color: C.slate, ...fBody }}>See all {coachMedia.length}</span>
                  </button>
                </div>
              )}
              <div style={{ marginBottom: 4 }}>
                <Btn full variant="outline" size="sm" icon={Film} onClick={() => nav("coach-reels")}>Manage reels & photos</Btn>
              </div>
            </div>

            <div style={{ marginTop: 22 }}>
              <SectionLabel>Reviews</SectionLabel>
              <Card style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ textAlign: "center", flexShrink: 0 }}>
                  <div style={{ fontSize: T.hero, fontWeight: 700, color: C.jet, ...fDisplay }}>{reviewAvg}</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 4 }}>
                    <Star size={12} fill={C.brand} color={C.brand} />
                    <span style={{ fontSize: T.label, color: C.slate, ...fBody }}>{REVIEWS.length} reviews</span>
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: T.body, fontWeight: 600, color: C.jet, ...fBody }}>Athletes rate you {reviewAvg} / 5</div>
                  <div style={{ fontSize: T.label, color: C.slate, marginTop: 3, lineHeight: 1.5, ...fBody }}>
                    Every review comes from a verified booking. Replying publicly helps build trust.
                  </div>
                </div>
              </Card>
              <Btn full variant="outline" size="sm" icon={Star} onClick={() => nav("coach-reviews")}>Manage reviews</Btn>
            </div>
          </div>

          {/* Desktop Sticky Sidebar */}
          {isDesktop && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 24 }}>
              {/* Quick Actions Card */}
              <Card style={{ padding: 20 }}>
                <div style={{ fontSize: T.subtitleLg, fontWeight: 700, color: C.jet, marginBottom: 14, ...fDisplay }}>Profile Actions</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <Btn full icon={Edit3} onClick={openEditProfile}>Edit Profile Details</Btn>
                  <Btn full variant="secondary" icon={Eye} onClick={() => nav("coach-profile", { coachId: coach.id, preview: true })}>View Public Profile</Btn>
                  <Btn full variant="outline" icon={Share2} onClick={handleShare}>Share Profile Link</Btn>
                </div>
              </Card>

              {/* Available for bookings toggle */}
              <Card style={{
                padding: 18,
                background: coachAvailableNow ? C.white : C.dangerTint,
                border: `1.5px solid ${coachAvailableNow ? C.border : C.dangerBorder}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                      background: coachAvailableNow ? C.successTint : C.dangerTint,
                      border: coachAvailableNow ? "none" : `1px solid ${C.dangerBorder}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ width: 8, height: 8, borderRadius: 99, background: coachAvailableNow ? C.success : C.danger }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: T.bodyLg, fontWeight: 600, color: C.jet, ...fBody }}>
                        {coachAvailableNow ? "Available for bookings" : "Unavailable"}
                      </div>
                    </div>
                  </div>
                  <Toggle
                    label="Available for bookings"
                    on={coachAvailableNow}
                    onClick={() => {
                      const next = !coachAvailableNow;
                      setCoachAvailableNow(next);
                      toast(next ? "You're now available for bookings" : "You're now marked unavailable");
                    }}
                  />
                </div>
                <div style={{ fontSize: T.captionLg, color: coachAvailableNow ? C.slateLight : C.danger, lineHeight: 1.45, ...fBody }}>
                  {coachAvailableNow ? "Athletes can discover your profile and send new booking requests." : "Your profile is hidden from search and athletes cannot book you."}
                </div>
              </Card>

              {/* Profile Highlights Card */}
              <Card style={{ padding: 18, background: C.fog, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: T.labelLg, fontWeight: 700, color: C.jet, marginBottom: 12, ...fDisplay }}>Profile Highlights</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: T.label, color: C.slate, ...fBody }}>Experience</span>
                    <span style={{ fontSize: T.label, fontWeight: 600, color: C.jet, ...fBody }}>{profile.yearsExperience ? `${profile.yearsExperience} Years` : "Experienced"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: T.label, color: C.slate, ...fBody }}>Primary Sport</span>
                    <span style={{ fontSize: T.label, fontWeight: 600, color: C.jet, ...fBody }}>{profile.sports[0] || "Coach"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: T.label, color: C.slate, ...fBody }}>Location</span>
                    <span style={{ fontSize: T.label, fontWeight: 600, color: C.jet, ...fBody }}>{profile.location}</span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
        )}

        {tab === "business" && (
        <div style={{ display: isDesktop ? "grid" : "block", gridTemplateColumns: isDesktop ? "repeat(2, minmax(0, 1fr))" : undefined, gap: isDesktop ? 24 : undefined, alignItems: "start" }}>
          <div>
            <SectionLabel>Service packages</SectionLabel>
            {coachPackages.length === 0 && (
              <div style={{ fontSize: T.labelLg, color: C.slateLight, marginBottom: 10, ...fBody }}>No packages yet - add your first service below.</div>
            )}
            {coachPackages.map((p) => {
              const isActive = p.active !== false;
              return (
                <Card
                  key={p.id}
                  onClick={() => nav("coach-edit-package", { id: p.id })}
                  style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 12 }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: T.bodyLg, fontWeight: 600, color: C.jet, ...fBody }}>{p.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                      <span style={{ fontSize: T.subtitleLg, fontWeight: 700, color: C.jet, ...fDisplay }}>${p.price}</span>
                      <SportLabel sport={p.sport || coach.sport} size={14} color={C.slate} style={{ fontSize: T.captionLg, ...fBody }} />
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}>
                    <Toggle label={`${p.name} active`} on={isActive} onClick={() => toggleActive(p)} />
                  </div>
                </Card>
              );
            })}
            <div style={{ marginBottom: 22 }}>
              <Btn variant="outline" size="sm" icon={Plus} full onClick={() => nav("coach-create-package")}>Add service package</Btn>
            </div>
          </div>

          <div>
            <div style={{ marginBottom: 24 }}>
              <SettingsGroup title="Earnings">
                <SettingsRow icon={Banknote} label="Earnings & payouts" sub="Transactions and payout method" onClick={() => nav("coach-earnings")} />
              </SettingsGroup>
            </div>

            <div>
              <SectionLabel>Cancellation policy</SectionLabel>
              <Card style={{ marginBottom: 12, background: darkMode ? C.white : C.brandTint }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <Shield size={16} color={C.brand} style={{ marginTop: 1, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: T.body, fontWeight: 600, color: C.jet, ...fBody }}>One policy for every coach</div>
                    <div style={{ fontSize: T.labelLg, color: C.slate, marginTop: 3, lineHeight: 1.5, ...fBody }}>{CONFIG.cancellationPolicy}</div>
                    <div style={{ fontSize: T.captionLg, color: C.slate, marginTop: 4, ...fBody }}>This standard CoachNivo policy applies to all bookings and can't be changed per coach.</div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
        )}

        {tab === "settings" && (
        <div style={{ display: isDesktop ? "grid" : "block", gridTemplateColumns: isDesktop ? "repeat(2, minmax(0, 1fr))" : undefined, gap: isDesktop ? 24 : undefined, alignItems: "start" }}>
          <div>
            <SettingsGroup title="Notifications">
              <SettingsRow icon={Bell} label="Notification preferences" onClick={() => setSheet("notif")} />
            </SettingsGroup>

            <SettingsGroup title="Security">
              <SettingsRow icon={ShieldCheck} label="Login & contact details" onClick={() => setSheet("accountDetails")} />
              <SettingsRow icon={Fingerprint} label="Biometric login" right={<Toggle label="Biometric login" on={biometric} onClick={() => setBiometric((v) => !v)} />} />
              <SettingsRow icon={Lock} label="Change password" onClick={() => setSheet("password")} />
            </SettingsGroup>
          </div>

          <div>
            <SettingsGroup title="Privacy & support">
              <SettingsRow icon={Shield} label="Privacy policy" onClick={() => setSheet("privacy")} />
              <SettingsRow icon={HelpCircle} label="Support centre" onClick={() => nav("support")} />
            </SettingsGroup>

            <SettingsGroup title="Account">
              <SettingsRow icon={LogOut} label="Sign out" onClick={() => setSheet("signout")} />
            </SettingsGroup>

            <SettingsGroup title="Danger zone">
              <SettingsRow icon={Trash2} label="Delete account" danger onClick={openDeleteFlow} />
            </SettingsGroup>
          </div>
        </div>
        )}
      </div>

      <BottomSheet open={sheet === "edit"} onClose={() => { setSheet(null); setDraft(null); }} title="Edit profile" heightPct={90}>
        {draft && (
          <>
            <FormSection icon={ImageIcon} label="Photos" hint="A great cover and profile photo help you stand out.">
              <button
                type="button"
                aria-label="Change cover photo"
                onClick={() => coverInputRef.current?.click()}
                style={{ width: "100%", height: 132, padding: 0, position: "relative", overflow: "hidden", borderRadius: 18, border: `1px solid ${C.border}`, background: C.fog, cursor: "pointer", display: "block" }}
              >
                {draft.coverPhoto ? (
                  <img src={draft.coverPhoto} alt="Cover preview" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                ) : (
                  <span style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ImageIcon size={24} color={C.slateLight} />
                  </span>
                )}
                <span aria-hidden="true" style={{ position: "absolute", right: 10, bottom: 10, width: 36, height: 36, borderRadius: 999, background: C.brand, border: `2px solid ${C.white}`, color: "#FFFFFF", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(22,24,29,.18)" }}>
                  <Camera size={15} color="#FFFFFF" />
                </span>
              </button>
              <input ref={coverInputRef} type="file" accept="image/*" onChange={onCoverChange} style={{ display: "none" }} />
              <div style={{ textAlign: "center", fontSize: T.captionLg, color: C.slateLight, marginTop: 8, ...fBody }}>Tap to change your cover photo</div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 18 }}>
                <button type="button" aria-label="Change profile photo" onClick={() => photoInputRef.current?.click()} style={{ position: "relative", width: 76, height: 76, padding: 0, background: "none", border: "none", cursor: "pointer" }}>
                  {draft.photo ? (
                    <img src={draft.photo} alt="Profile" style={{ width: 76, height: 76, borderRadius: 76, objectFit: "cover", display: "block" }} />
                  ) : (
                    <Avatar name={draft.name || "You"} src={coach.avatar} size={76} />
                  )}
                  <span aria-hidden="true" style={{ position: "absolute", bottom: -2, right: -2, width: 28, height: 28, borderRadius: 999, background: C.brand, border: `2px solid ${C.white}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(22,24,29,.16)" }}><Camera size={13} color="#FFFFFF" /></span>
                </button>
                <input ref={photoInputRef} type="file" accept="image/*" onChange={onPhotoChange} style={{ display: "none" }} />
                <div style={{ fontSize: T.captionLg, color: C.slateLight, marginTop: 8, ...fBody }}>Tap to change your profile photo</div>
              </div>
            </FormSection>

            <FormSection icon={User} label="About you" hint="Your name and username - how athletes see and recognise you.">
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Field label="Full name" placeholder="How athletes will see you" icon={User} value={draft.name} onChange={(e) => setDraftField({ name: e.target.value })} required />
                <HandleField value={draft.handle} onChange={(v) => { setHandleEdited(true); setDraftField({ handle: v }); }} isTaken={isHandleTaken(draft.handle, [coach.handle, profile.handle])} showStatus={handleEdited && draft.handle.trim() !== String(profile.handle || "").trim()} required />

                <div>
                  <div style={{ fontSize: T.labelLg, fontWeight: 600, color: C.jet, marginBottom: 6, ...fBody }}>Bio</div>
                  <textarea
                    value={draft.bio}
                    onChange={(e) => setDraftField({ bio: e.target.value })}
                    rows={4}
                    placeholder="Tell athletes about your coaching background, philosophy and what to expect"
                    style={{ width: "100%", border: `1.5px solid ${C.border}`, borderRadius: 13, padding: "11px 13px", fontSize: T.bodyLg, resize: "none", outline: "none", boxSizing: "border-box", background: C.white, color: C.jet, ...fBody }}
                  />
                </div>

                <Field label="Years of coaching experience" placeholder="e.g. 6" icon={CalendarClock} value={draft.yearsExperience} onChange={(e) => setDraftField({ yearsExperience: e.target.value.replace(/[^0-9]/g, "") })} />

                <div>
                  <div style={{ fontSize: T.labelLg, fontWeight: 600, color: C.jet, marginBottom: 6, ...fBody }}>Gender (optional)</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {[...GENDER_OPTIONS, "Prefer not to say"].map((g) => (
                      <Chip key={g} active={draft.gender === g} onClick={() => setDraftField({ gender: draft.gender === g ? "" : g })}>{g}</Chip>
                    ))}
                  </div>
                </div>
              </div>
            </FormSection>

            <FormSection icon={Sparkles} label="Coaching profile" hint="What you coach, where you're based and the languages you speak.">
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <div style={{ fontSize: T.labelLg, fontWeight: 600, color: C.jet, marginBottom: 6, ...fBody }}>Sports<RequiredMark /></div>
                  <div style={{ fontSize: T.captionLg, color: C.slateLight, marginBottom: 7, ...fBody }}>Popular in Australia</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 10 }}>
                    {POPULAR_SPORTS.slice(0, 10).map((s) => {
                      const active = draft.sports.includes(s);
                      return (
                        <SportBadge
                          key={s}
                          sport={s}
                          selected={active}
                          compact
                          onClick={() => setDraftField({ sports: active ? draft.sports.filter((x) => x !== s) : [...draft.sports, s] })}
                        />
                      );
                    })}
                  </div>
                  <SportSearchMultiSelect options={SPORT_NAMES} value={draft.sports} onChange={(v) => setDraftField({ sports: v })} placeholder="Search all sports…" />
                  {draft.sports.length === 0 && (
                    <div style={{ fontSize: T.captionLg, color: C.danger, marginTop: 6, ...fBody }}>Pick at least one sport so athletes can find you.</div>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: T.labelLg, fontWeight: 600, color: C.jet, marginBottom: 6, ...fBody }}>Languages</div>
                  <SearchMultiSelect options={LANGUAGE_OPTIONS} value={draft.languages} onChange={(v) => setDraftField({ languages: v })} placeholder="Search languages…" />
                </div>

                <div>
                  <div style={{ fontSize: T.labelLg, fontWeight: 600, color: C.jet, marginBottom: 6, ...fBody }}>Location</div>
                  <SearchSelect options={LOCATION_OPTIONS} value={draft.location} onChange={(v) => setDraftField({ location: v })} placeholder="Search suburb or city…" />
                </div>
              </div>
            </FormSection>

            <FormSection icon={MapPin} label="Where you coach" hint="Your usual venue and how far you're willing to travel.">
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Field label="Session venue" placeholder="e.g. Fremantle Fitness Box" icon={MapPin} value={draft.venue} onChange={(e) => setDraftField({ venue: e.target.value })} />
                <Field label="Travel radius (km)" placeholder="e.g. 5" icon={Navigation} value={String(draft.travelRadiusKm ?? "")} onChange={(e) => setDraftField({ travelRadiusKm: e.target.value.replace(/[^0-9]/g, "") })} />
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "4px 0" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: T.bodyLg, fontWeight: 600, color: C.jet, ...fBody }}>Willing to travel to athletes</div>
                    <div style={{ fontSize: T.label, color: C.slate, marginTop: 2, ...fBody }}>Offer sessions at your athletes' location</div>
                  </div>
                  <Toggle label="Willing to travel to athletes" on={!!draft.willingToTravel} onClick={() => setDraftField({ willingToTravel: !draft.willingToTravel })} />
                </div>
              </div>
            </FormSection>

            <FormSection icon={Award} label="Accreditations" hint="Certifications and qualifications that help athletes trust you.">
              <div>
                {(draft.accreditations || []).map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 4px", borderBottom: i === (draft.accreditations || []).length - 1 ? "none" : `1px solid ${C.border}` }}>
                    <Award size={15} color={C.success} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1, minWidth: 0, fontSize: T.bodyLg, color: C.jet, ...fBody }}>{a}</span>
                    <button type="button" aria-label={`Remove ${a}`} onClick={() => removeDraftAccreditation(i)} style={{ width: 32, height: 32, borderRadius: 10, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <X size={15} color={C.slateLight} />
                    </button>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <input
                    value={draftAccreditation}
                    onChange={(e) => setDraftAccreditation(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addDraftAccreditation(); } }}
                    placeholder="e.g. CrossFit Level 2 Trainer"
                    style={{ flex: 1, minWidth: 0, border: `1.5px solid ${C.border}`, borderRadius: 13, padding: "10px 13px", fontSize: T.bodyLg, outline: "none", boxSizing: "border-box", background: C.white, color: C.jet, ...fBody }}
                  />
                  <Btn size="sm" variant="outline" icon={Plus} onClick={addDraftAccreditation}>Add</Btn>
                </div>
              </div>
            </FormSection>

            <div style={{ marginTop: 22, display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <Btn full onClick={saveProfile}>Save changes</Btn>
              </div>
            </div>
          </>
        )}
      </BottomSheet>

      <AccountDetailsSheet
        open={sheet === "accountDetails"}
        onClose={closeSheet}
        details={{ name: profile.name, username: profile.handle, email: coachEmail, phone: coachPhone }}
        onSave={saveAccountDetails}
        isHandleTaken={(handle) => isHandleTaken(handle, [coach.handle, profile.handle])}
        toast={toast}
        accountLabel="coach account"
      />

      <BottomSheet open={sheet === "notif"} onClose={closeSheet} title="Notification preferences" heightPct={84}>
        <SettingsGroup title="Channels">
          <SettingsRow icon={Bell} label="Push notifications" sub="Alerts on this device" right={<Toggle label="Push notifications" on={notifPrefs.push} onClick={() => toggleNotif("push")} />} />
          <SettingsRow icon={Mail} label="Email notifications" sub="Receipts, confirmations & digests" right={<Toggle label="Email notifications" on={notifPrefs.email} onClick={() => toggleNotif("email")} />} />
          <SettingsRow icon={Phone} label="SMS notifications" sub="Urgent day-of updates" right={<Toggle label="SMS notifications" on={notifPrefs.sms} onClick={() => toggleNotif("sms")} />} />
          <SettingsRow icon={MessageCircle} label="WhatsApp notifications" sub="Urgent day-of updates" right={<Toggle label="WhatsApp notifications" on={notifPrefs.whatsapp} onClick={() => toggleNotif("whatsapp")} />} />
        </SettingsGroup>
        <div style={{ fontSize: T.captionLg, color: C.slateLight, margin: "-14px 0 24px", lineHeight: 1.5, ...fBody }}>
          Payment receipts and booking confirmations are always sent by email.
        </div>
        <SettingsGroup title="Updates">
          <SettingsRow icon={CalendarDays} label="Booking requests" sub="New requests waiting on your response" right={<Toggle label="Booking requests" on={notifPrefs.bookingRequests} onClick={() => toggleNotif("bookingRequests")} />} />
          <SettingsRow icon={CheckCircle2} label="Booking confirmations" sub="When a session is confirmed" right={<Toggle label="Booking confirmations" on={notifPrefs.bookingConfirmations} onClick={() => toggleNotif("bookingConfirmations")} />} />
          <SettingsRow icon={MessageCircle} label="Messages" sub="New messages from athletes" right={<Toggle label="Messages" on={notifPrefs.messages} onClick={() => toggleNotif("messages")} />} />
          <SettingsRow icon={Banknote} label="Payment updates" sub="Payouts, receipts and earnings" right={<Toggle label="Payment updates" on={notifPrefs.paymentUpdates} onClick={() => toggleNotif("paymentUpdates")} />} />
        </SettingsGroup>
        <div style={{ marginTop: 8 }}>
          <Btn full onClick={() => { toast("Notification preferences saved"); closeSheet(); }}>Save preferences</Btn>
        </div>
      </BottomSheet>

      <BottomSheet open={sheet === "password"} onClose={closeSheet} title="Change password" heightPct={62}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Current password" placeholder="••••••••" icon={Lock} type={showPw ? "text" : "password"} rightIcon={showPw ? EyeOff : Eye} onRight={() => setShowPw((v) => !v)} required />
          <div>
            <Field label="New password" placeholder="••••••••" icon={Lock} type={showPw ? "text" : "password"} value={newPw} onChange={(e) => setNewPw(e.target.value)} required />
            <PasswordRequirements password={newPw} style={{ marginTop: 8 }} />
          </div>
          <Field label="Confirm new password" placeholder="••••••••" icon={Lock} type={showPw ? "text" : "password"} value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required />
        </div>
        <div style={{ marginTop: 20 }}>
          <Btn full disabled={!pwdOk} onClick={() => { toast("Password updated"); setNewPw(""); setConfirmPw(""); closeSheet(); }}>Update password</Btn>
        </div>
      </BottomSheet>

      <BottomSheet open={sheet === "privacy"} onClose={closeSheet} title="Privacy policy" heightPct={75}>
        <div style={{ fontSize: T.body, color: C.slate, lineHeight: 1.6, ...fBody }}>
          <p style={{ marginBottom: 12 }}>CoachNivo collects the information needed to run your coaching business on the platform, including your profile details, service packages, booking history and payout information.</p>
          <p style={{ marginBottom: 12 }}>We never sell your personal data. Your public profile is shown to prospective clients; payout and identity details are only shared with our payment and verification partners.</p>
          <p>You can request a copy of your data or ask us to delete your account at any time from this Profile tab.</p>
        </div>
        <div style={{ marginTop: 20 }}>
          <Btn full variant="secondary" onClick={closeSheet}>Close</Btn>
        </div>
      </BottomSheet>

      <ConfirmDialog
        open={sheet === "signout"}
        onClose={closeSheet}
        onConfirm={async () => {
          await new Promise((r) => setTimeout(r, 600));
          closeSheet();
          resetNav("get-started", {}, "client");
        }}
        title="Sign Out"
        description="Are you sure you want to sign out of your coach account?"
        confirmLabel="Sign Out"
        loadingText="Signing Out..."
        cancelLabel="Cancel"
        icon={LogOut}
        destructive={false}
      />

      <BottomSheet open={sheet === "delete"} onClose={closeDeleteFlow} title={deleteStep === "confirm" ? "Delete account" : "Verify deletion"} heightPct={deleteStep === "confirm" ? 58 : 68}>
        {deleteStep === "confirm" ? (
          <>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: C.dangerTint, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <AlertTriangle size={23} color={C.danger} />
            </div>
            <div style={{ fontSize: T.title, fontWeight: 700, color: C.jet, marginBottom: 7, ...fDisplay }}>Delete your coach account?</div>
            <div style={{ fontSize: T.body, color: C.slate, lineHeight: 1.6, marginBottom: 16, ...fBody }}>
              Your public profile, packages and coaching history will be permanently removed. Upcoming bookings will be cancelled and clients notified. This can’t be undone.
            </div>
            <Card style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 18, background: C.fog }}>
              <Mail size={17} color={C.slate} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: T.body, fontWeight: 600, color: C.jet, ...fBody }}>Email verification required</div>
                <div style={{ fontSize: T.captionLg, color: C.slate, lineHeight: 1.5, marginTop: 3, ...fBody }}>We’ll send a six-digit code to {coachEmail} before deleting your account.</div>
              </div>
            </Card>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Btn full variant="danger" icon={Mail} onClick={sendDeleteCode}>Send verification code</Btn>
              <Btn full variant="secondary" onClick={closeDeleteFlow}>Keep my account</Btn>
            </div>
          </>
        ) : (
          <>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: C.brandTint, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <Mail size={22} color={C.brand} />
            </div>
            <div style={{ fontSize: T.title, fontWeight: 700, color: C.jet, ...fDisplay }}>Check your email</div>
            <div style={{ fontSize: T.body, color: C.slate, lineHeight: 1.55, marginTop: 6, marginBottom: 18, ...fBody }}>
              Enter the six-digit code sent to <span style={{ color: C.jet, fontWeight: 600 }}>{coachEmail}</span>.
            </div>

            {deleteError && (
              <div role="alert" style={{ display: "flex", gap: 8, padding: "10px 12px", borderRadius: 12, border: `1px solid ${C.dangerBorder}`, background: C.dangerTint, marginBottom: 14 }}>
                <AlertTriangle size={15} color={C.danger} style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: T.labelLg, color: C.danger, lineHeight: 1.45, ...fBody }}>That code is invalid or incomplete. Check your email or request a new code.</span>
              </div>
            )}

            <div onPaste={onDeletePaste} style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 7 }}>
              {deleteCode.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => { deleteInputsRef.current[index] = element; }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  aria-label={`Account deletion code digit ${index + 1} of 6`}
                  value={digit}
                  maxLength={1}
                  onChange={(event) => setDeleteDigit(index, event.target.value)}
                  onKeyDown={(event) => onDeleteKeyDown(index, event)}
                  style={{ width: "100%", height: 52, minWidth: 0, boxSizing: "border-box", borderRadius: 13, border: `1.5px solid ${deleteError ? C.dangerBorderSoft : digit ? C.brand : C.border}`, background: C.white, color: C.jet, textAlign: "center", outline: "none", fontSize: T.heading, fontWeight: 700, ...fDisplay }}
                />
              ))}
            </div>

            <div style={{ minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 8 }}>
              {deleteResendSeconds > 0 ? (
                <span style={{ fontSize: T.body, color: C.slateLight, ...fBody }}>Resend code in 0:{String(deleteResendSeconds).padStart(2, "0")}</span>
              ) : (
                <button type="button" onClick={resendDeleteCode} style={{ minHeight: 44, padding: "0 10px", border: "none", background: "transparent", color: C.brand, cursor: "pointer", fontSize: T.body, fontWeight: 600, ...fBody }}>Resend code</button>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
              <Btn full variant="danger" disabled={deleteCode.join("").length !== 6} onClick={verifyAndDelete}>Verify & delete account</Btn>
              <Btn full variant="secondary" onClick={() => { setDeleteStep("confirm"); setDeleteError(false); }}>Back</Btn>
            </div>
          </>
        )}
      </BottomSheet>

      <FullscreenImageViewer open={avatarOpen} onClose={() => setAvatarOpen(false)} src={profile.photo} alt="Profile photo" />
    </div>
  );
}
