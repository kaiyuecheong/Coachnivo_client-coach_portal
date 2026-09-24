import React, { useEffect, useRef, useState } from "react";
import {
  Edit3, Bell, CreditCard, Lock, Shield, HelpCircle, LogOut, Users, ChevronRight,
  Mail, Phone, User, Plus, Trash2, Eye, EyeOff, AlertTriangle, Camera, MapPin, Target, Calendar, UserPlus, Download,
  CalendarDays, CreditCard as CardIcon, Stethoscope, UserCheck, History as HistoryIcon, MessageCircle, Star,
  Sparkles, Percent, ShieldCheck, CheckCircle2,
} from "lucide-react";
import { CL, CD, fDisplay, fBody, T } from "../../theme/theme";
import { useApp } from "../../context/AppContext";
import { useResponsive } from "../../theme/responsive";
import { Avatar, Btn, ScreenHeader, SectionLabel, FormSection, Toggle, BottomSheet, ConfirmDialog, Field, Chip, Card, Badge, EmptyState, TopBar, SegTabs, HandleTag, RequiredMark, SettingsRow, SettingsGroup, PasswordRequirements, passwordValid, FullscreenImageViewer } from "../../components/ui/Primitives";
import { HandleField } from "../../components/ui/PublicIdentityFields";
import { isValidHandle } from "../../utils/name";
import { getBookingCoachName } from "../../utils/name";
import { CLIENT_NOTIFICATIONS, COACHES } from "../../data/mockData";
import { POPULAR_SPORTS, SPORT_NAMES } from "../../data/sports";
import { SportBadge, SportSearchMultiSelect } from "../../components/ui/SportUI";
import { SportSkillLevelPicker } from "../../components/ui/SportSkillLevelPicker";
import { PAYMENT_STATUS } from "../../data/bookings";
import { ReceiptSheet } from "./Dashboard";
import { hasCompleteSportLevels, normaliseSportLevels } from "../../data/sportSkillLevels";
import { useLiveNotifications } from "../../systems/StateSystem";
import { LocationField } from "../../components/ui/LocationField";
import { AccountDetailsSheet } from "../../components/ui/AccountDetailsSheet";

const emptyChildDraft = {
  name: "", age: "", sport: [], sportLevels: {}, goals: "", location: null, preferences: "", hasPhoto: false,
  medicalConditions: "", allergies: "", medicalNotes: "",
  emergencyName: "", emergencyRelationship: "", emergencyMobile: "",
  guardianName: "", guardianRelationship: "", guardianMobile: "",
};
const emptyCardDraft = { number: "", name: "", expiry: "", cvc: "" };

export function ScreenClientProfile({ nav, resetNav, biometric, setBiometric, toast, addCoachRole, children = [], addChild, updateChild, removeChild, bookings = [], clientPrefs, onComplete }) {
  const { darkMode, clientIdentity, updateClientIdentity, isHandleTaken, pushNotification } = useApp();
  const C = darkMode ? CD : CL;
  const { isDesktop } = useResponsive();
  const [sheet, setSheet] = useState(null); // which bottom sheet is open
  const [removalTarget, setRemovalTarget] = useState(null);
  const [editingChildId, setEditingChildId] = useState(null); // null = creating new
  const [childDraft, setChildDraft] = useState(emptyChildDraft);

  // Name & email live in app identity state (collected at sign-up), not in
  // the "about you" onboarding data — so they're editable here too.
  const profile = {
    name: `${clientIdentity.firstName || ""} ${clientIdentity.lastName || ""}`.trim() || "You",
    email: clientIdentity.email || "",
    phone: clientIdentity.phone || clientPrefs?.mobile || "",
  };
  const getInitialEditDraft = () => {
    const sports = Array.isArray(clientPrefs?.sports) && clientPrefs.sports.length
      ? clientPrefs.sports
      : Array.isArray(clientPrefs?.sport) ? clientPrefs.sport : [];
    return {
      name: `${clientIdentity.firstName || ""} ${clientIdentity.lastName || ""}`.trim() || "You",
      handle: clientIdentity.handle || "",
      photo: clientIdentity.photo || clientIdentity.avatar || null,
      address: clientPrefs?.address || "",
      location: clientPrefs?.location || null,
      sports,
      sportLevels: normaliseSportLevels(sports, clientPrefs?.sportLevels, clientPrefs?.skillLevel),
      goals: clientPrefs?.goals || "",
      medicalConditions: clientPrefs?.medicalConditions || "",
      allergies: clientPrefs?.allergies || "",
      medicalNotes: clientPrefs?.medicalNotes || "",
      emergencyName: clientPrefs?.emergencyName || "",
      emergencyRelationship: clientPrefs?.emergencyRelationship || "",
      emergencyMobile: clientPrefs?.emergencyMobile || "",
    };
  };
  const [editDraft, setEditDraft] = useState(getInitialEditDraft);
  const [desktopTab, setDesktopTab] = useState("personal");
  const [handleEdited, setHandleEdited] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const profilePhotoInputRef = useRef(null);
  const profilePhoto = clientIdentity.photo || clientIdentity.avatar || null;

  const openNewChild = () => { setEditingChildId(null); setChildDraft(emptyChildDraft); setSheet("child"); };
  const openEditChild = (child) => {
    const sport = Array.isArray(child.sport) ? child.sport : [];
    setEditingChildId(child.id);
    setChildDraft({
      ...emptyChildDraft,
      ...child,
      sport,
      sportLevels: normaliseSportLevels(sport, child.sportLevels, child.skillLevel),
    });
    setSheet("child");
  };
  const setDraftSports = (sport) => setChildDraft((draft) => ({
    ...draft,
    sport,
    sportLevels: normaliseSportLevels(sport, draft.sportLevels, draft.skillLevel),
  }));
  const toggleDraftSport = (sport) => setDraftSports(childDraft.sport.includes(sport)
    ? childDraft.sport.filter((item) => item !== sport)
    : [...childDraft.sport, sport]);
  const saveChild = () => {
    if (!childDraft.name.trim()) { toast("Give this profile a name first"); return; }
    if (childDraft.sport.length > 0 && !hasCompleteSportLevels(childDraft.sport, childDraft.sportLevels)) {
      toast("Add an experience level for every selected sport");
      return;
    }
    if (editingChildId) { updateChild(editingChildId, childDraft); toast(`${childDraft.name}'s profile updated`); }
    else { addChild(childDraft); toast(`${childDraft.name}'s profile added`); }
    setSheet(null);
  };
  const deleteChild = () => {
    if (editingChildId) removeChild(editingChildId);
    toast("Profile removed");
    setRemovalTarget(null);
    setSheet(null);
  };

  const [notifPrefs, setNotifPrefs] = useState({
    push: true, email: true, sms: false, whatsapp: false, bookingReminders: true, messages: true, promos: false,
  });
  const toggleNotif = (key) => setNotifPrefs((p) => ({ ...p, [key]: !p[key] }));

  const [cards, setCards] = useState([
    { id: 1, brand: "Visa", last4: "4242", exp: "08/28", isDefault: true, name: "Alex Morgan" },
    { id: 2, brand: "Mastercard", last4: "8891", exp: "02/27", isDefault: false, name: "Alex Morgan" },
  ]);
  const [editingCardId, setEditingCardId] = useState(null);
  const removeCard = (id) => setCards((c) => c.filter((card) => card.id !== id));
  const confirmCardRemoval = () => {
    removeCard(removalTarget.id);
    toast("Payment method removed");
    setRemovalTarget(null);
  };
  const makeDefault = (id) => setCards((c) => c.map((card) => ({ ...card, isDefault: card.id === id })));

  const [cardDraft, setCardDraft] = useState(emptyCardDraft);
  const cardBrandFromNumber = (num) => (num.replace(/\s/g, "").startsWith("4") ? "Visa" : num.replace(/\s/g, "").startsWith("5") ? "Mastercard" : "Card");
  const canSaveCard = editingCardId
    ? cardDraft.name.trim().length > 0 && /^\d{2}\/\d{2}$/.test(cardDraft.expiry)
    : cardDraft.number.replace(/\s/g, "").length >= 12 && cardDraft.name.trim().length > 0 && /^\d{2}\/\d{2}$/.test(cardDraft.expiry) && cardDraft.cvc.length >= 3;
  const openAddCard = () => { setEditingCardId(null); setCardDraft(emptyCardDraft); setSheet("addCard"); };
  const openEditCard = (card) => {
    setEditingCardId(card.id);
    setCardDraft({
      number: `•••• •••• •••• ${card.last4}`,
      name: card.name || profile.name || "Alex Morgan",
      expiry: card.exp || "",
      cvc: "",
    });
    setSheet("addCard");
  };
  const saveCard = () => {
    if (!canSaveCard) { toast("Check your card details and try again"); return; }
    const digits = cardDraft.number.replace(/\s/g, "");
    if (editingCardId) {
      setCards((c) =>
        c.map((card) => {
          if (card.id !== editingCardId) return card;
          const isNewNumber = digits.length >= 12 && !digits.includes("•");
          return {
            ...card,
            name: cardDraft.name.trim(),
            exp: cardDraft.expiry,
            brand: isNewNumber ? cardBrandFromNumber(digits) : card.brand,
            last4: isNewNumber ? digits.slice(-4) : card.last4,
          };
        })
      );
      toast("Payment method updated");
    } else {
      setCards((c) => [
        ...c,
        {
          id: Date.now(),
          brand: cardBrandFromNumber(digits),
          last4: digits.slice(-4),
          name: cardDraft.name.trim() || profile.name,
          exp: cardDraft.expiry,
          isDefault: c.length === 0,
        },
      ]);
      toast("Payment method added");
    }
    setEditingCardId(null);
    setSheet(isDesktop ? null : "payment");
  };

  // Edit profile is for public and coaching-preference data. Login email and
  // phone are intentionally handled by the verified account-details flow.
  const openEditProfile = () => {
    setHandleEdited(false);
    setEditDraft(getInitialEditDraft());
    setSheet("edit");
  };
  const onProfilePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (file) setEditDraft((draft) => ({ ...draft, photo: URL.createObjectURL(file) }));
    event.target.value = "";
  };
  const setEditSports = (sports) => setEditDraft((draft) => ({
    ...draft,
    sports,
    sportLevels: normaliseSportLevels(sports, draft.sportLevels, draft.skillLevel),
  }));
  const toggleEditSport = (sport) => setEditSports(editDraft.sports.includes(sport)
    ? editDraft.sports.filter((item) => item !== sport)
    : [...editDraft.sports, sport]);
  const saveProfile = () => {
    if (!editDraft.name.trim()) { toast("Add your name first"); return; }
    if (!isValidHandle(editDraft.handle)) { toast("Pick a valid username - 3–24 characters"); return; }
    if (isHandleTaken(editDraft.handle) && editDraft.handle.trim().toLowerCase() !== (clientIdentity.handle || "").trim().toLowerCase()) {
      toast("That username's taken - try another");
      return;
    }
    if (editDraft.sports.length > 0 && !hasCompleteSportLevels(editDraft.sports, editDraft.sportLevels)) {
      toast("Add an experience level for every selected sport");
      return;
    }
    const parts = editDraft.name.trim().split(/\s+/);
    updateClientIdentity({
      firstName: parts[0] || "",
      lastName: parts.slice(1).join(" ") || "",
      handle: editDraft.handle.trim(),
      photo: editDraft.photo,
    });
    if (onComplete) {
      onComplete({
        ...clientPrefs,
        address: editDraft.address,
        location: editDraft.location,
        sport: editDraft.sports,
        sports: editDraft.sports,
        sportLevels: editDraft.sportLevels,
        goals: editDraft.goals,
        medicalConditions: editDraft.medicalConditions,
        allergies: editDraft.allergies,
        medicalNotes: editDraft.medicalNotes,
        emergencyName: editDraft.emergencyName,
        emergencyRelationship: editDraft.emergencyRelationship,
        emergencyMobile: editDraft.emergencyMobile,
      });
    }
    toast("Profile updated");
    setSheet(null);
  };

  const saveAccountDetails = ({ name, username, email, phone }) => {
    const contactChanged = email.trim().toLowerCase() !== profile.email.trim().toLowerCase()
      || phone.replace(/\D/g, "") !== profile.phone.replace(/\D/g, "");
    const parts = name.trim().split(/\s+/);
    updateClientIdentity({
      firstName: parts[0] || "",
      lastName: parts.slice(1).join(" ") || "",
      handle: username,
      email,
      phone,
      phoneVerified: !!phone,
    });
    onComplete?.({ ...clientPrefs, mobile: phone });
    if (contactChanged) {
      pushNotification?.({
        audience: "client",
        type: "verification",
        title: "Contact details changed",
        body: "Your verified email or phone number was updated. If this wasn't you, contact support now.",
      });
    }
  };

  const [showPw, setShowPw] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const pwdOk = passwordValid(newPw) && newPw === confirmPw;

  const [deactivateStep, setDeactivateStep] = useState("confirm");
  const [deactivationCode, setDeactivationCode] = useState(["", "", "", "", "", ""]);
  const [deactivationError, setDeactivationError] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const deactivationInputsRef = useRef([]);

  useEffect(() => {
    if (resendSeconds <= 0) return undefined;
    const timer = window.setInterval(() => setResendSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  const resetDeactivation = () => {
    setDeactivateStep("confirm");
    setDeactivationCode(["", "", "", "", "", ""]);
    setDeactivationError(false);
    setResendSeconds(0);
  };
  const openDeactivate = () => {
    resetDeactivation();
    setSheet("deactivate");
  };
  const closeDeactivate = () => {
    setSheet(null);
    resetDeactivation();
  };
  const sendDeactivationCode = () => {
    if (!profile.email) {
      toast("Add an email before deactivating");
      return;
    }
    setDeactivateStep("verify");
    setDeactivationCode(["", "", "", "", "", ""]);
    setDeactivationError(false);
    setResendSeconds(30);
    toast("Verification code sent");
    window.setTimeout(() => deactivationInputsRef.current[0]?.focus(), 120);
  };
  const setDeactivationDigit = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setDeactivationCode((current) => current.map((item, itemIndex) => itemIndex === index ? digit : item));
    setDeactivationError(false);
    if (digit && index < 5) deactivationInputsRef.current[index + 1]?.focus();
  };
  const onDeactivationKeyDown = (index, event) => {
    if (event.key === "Backspace" && !deactivationCode[index] && index > 0) deactivationInputsRef.current[index - 1]?.focus();
  };
  const onDeactivationPaste = (event) => {
    const digits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split("");
    if (!digits.length) return;
    event.preventDefault();
    setDeactivationCode(Array.from({ length: 6 }, (_, index) => digits[index] || ""));
    setDeactivationError(false);
    deactivationInputsRef.current[Math.min(digits.length, 6) - 1]?.focus();
  };
  const verifyAndDeactivate = () => {
    const code = deactivationCode.join("");
    if (code.length !== 6 || code === "000000") {
      setDeactivationError(true);
      return;
    }
    closeDeactivate();
    toast("Account deactivated securely");
    resetNav("splash", {}, "client");
  };
  const resendDeactivationCode = () => {
    setDeactivationCode(["", "", "", "", "", ""]);
    setDeactivationError(false);
    setResendSeconds(30);
    toast("New verification code sent");
    deactivationInputsRef.current[0]?.focus();
  };

const closeSheet = () => setSheet(null);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <input ref={profilePhotoInputRef} type="file" accept="image/*" onChange={onProfilePhotoChange} style={{ display: "none" }} />
      <div style={{ padding: isDesktop ? "40px 64px 0" : "18px 18px 0" }}>
        <ScreenHeader title="Account" subtitle="Profile, family and account preferences." style={{ marginBottom: isDesktop ? 28 : 18 }} />
      </div>

      <div style={{ flex: 1, overflowY: "auto", width: "100%", padding: isDesktop ? "0 64px 64px" : "0 18px", paddingBottom: isDesktop ? 64 : 116, boxSizing: "border-box" }} className="cl-hide-scrollbar">
        {isDesktop ? (
          <div style={{ width: "100%", boxSizing: "border-box" }}>
            <div style={{ display: "grid", gridTemplateColumns: "320px minmax(0, 1fr)", gap: 32, alignItems: "start", width: "100%" }}>
              {/* Left Sidebar: Profile Summary & Category Navigation */}
              <div style={{ position: "sticky", top: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Profile Hero Card */}
                <Card style={{ padding: 24, borderRadius: 20 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                    <div style={{ position: "relative", marginBottom: 12 }}>
                      <button
                        type="button"
                        aria-label={`Open ${profile.name}'s profile photo`}
                        disabled={!profilePhoto}
                        onClick={() => setAvatarOpen(true)}
                        style={{ width: 80, height: 80, padding: 0, border: "none", borderRadius: 99, background: "transparent", cursor: profilePhoto ? "zoom-in" : "default" }}
                      >
                        <Avatar name={profile.name} src={profilePhoto} size={80} />
                      </button>
                      <button
                        type="button"
                        aria-label="Upload new photo"
                        onClick={() => profilePhotoInputRef.current?.click()}
                        style={{
                          position: "absolute", bottom: 0, right: 0, width: 28, height: 28, borderRadius: 99,
                          background: C.brand, color: "#FFFFFF", border: `2px solid ${C.white}`,
                          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                          boxShadow: "0 2px 8px rgba(0,0,0,.15)",
                        }}
                      >
                        <Camera size={13} color="#FFFFFF" />
                      </button>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 750, color: C.jet, ...fDisplay }}>{profile.name}</div>
                    <div style={{ fontSize: 14, color: C.slate, marginTop: 2, ...fBody }}>{profile.email}</div>
                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                      <HandleTag handle={clientIdentity.handle} size={13} color={C.brand} />
                      <Badge tone="neutral">Client Account</Badge>
                    </div>
                  </div>
                </Card>

                {/* Category Navigation Menu */}
                <Card style={{ padding: 8, borderRadius: 20 }}>
                  {[
                    { id: "personal", label: "Personal Info", icon: User, desc: "Name, handle, preferences" },
                    { id: "family", label: "Family & Participants", icon: Users, badge: children.length, desc: `${children.length} profile${children.length === 1 ? "" : "s"}` },
                    { id: "payment", label: "Payment Methods", icon: CreditCard, badge: cards.length, desc: `${cards.length} card${cards.length === 1 ? "" : "s"}` },
                    { id: "notifications", label: "Notifications", icon: Bell, desc: "Reminders & delivery channels" },
                    { id: "security", label: "Security & Login", icon: ShieldCheck, desc: "Password & contact details" },
                    { id: "support", label: "Support & Legal", icon: HelpCircle, desc: "FAQs & privacy policy" },
                  ].map((item) => {
                    const active = desktopTab === item.id;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setDesktopTab(item.id)}
                        style={{
                          width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                          borderRadius: 14, border: "none",
                          background: active ? (darkMode ? "#232834" : C.brandTint) : "transparent",
                          color: active ? C.brand : C.jet,
                          cursor: "pointer", textAlign: "left", transition: "all .15s ease",
                          marginBottom: 2,
                        }}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: active ? (darkMode ? C.brand : C.white) : (darkMode ? "#1C2029" : C.fog),
                          color: active ? (darkMode ? C.white : C.brand) : C.slate,
                          boxShadow: active ? "0 2px 6px rgba(0,0,0,.06)" : "none",
                        }}>
                          <Icon size={18} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14.5, fontWeight: active ? 700 : 600, ...fBody, color: active ? C.brand : C.jet }}>
                            {item.label}
                          </div>
                          <div style={{ fontSize: 12, color: C.slateLight, marginTop: 1, ...fBody }}>{item.desc}</div>
                        </div>
                        {item.badge !== undefined && (
                          <span style={{
                            fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                            background: active ? C.brand : C.fog, color: active ? C.white : C.slate,
                          }}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}

                  <div style={{ height: 1, background: C.border, margin: "8px 6px" }} />

                  <button
                    type="button"
                    onClick={() => nav("client-history")}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                      borderRadius: 12, border: "none", background: "transparent", color: C.jet, cursor: "pointer", textAlign: "left",
                    }}
                  >
                    <HistoryIcon size={17} color={C.slate} />
                    <span style={{ fontSize: 14, fontWeight: 600, ...fBody, flex: 1 }}>Session History</span>
                    <ChevronRight size={14} color={C.slateLight} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSheet("logout")}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                      borderRadius: 12, border: "none", background: "transparent", color: C.danger, cursor: "pointer", textAlign: "left",
                    }}
                  >
                    <LogOut size={17} color={C.danger} />
                    <span style={{ fontSize: 14, fontWeight: 600, ...fBody, flex: 1 }}>Sign Out</span>
                  </button>
                </Card>
              </div>

              {/* Right Panel: Active Category Content */}
              <div style={{ minWidth: 0 }}>
                {desktopTab === "personal" && (
                  <div>
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: C.jet, ...fDisplay }}>Personal Information</div>
                      <div style={{ fontSize: 14, color: C.slate, marginTop: 4, ...fBody }}>Update your profile details, handle, and coaching preferences.</div>
                    </div>

                    <Card style={{ padding: 32, borderRadius: 24, marginBottom: 20 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 20, paddingBottom: 24, borderBottom: `1px solid ${C.border}` }}>
                        <Avatar name={editDraft.name || profile.name} src={editDraft.photo || profilePhoto} size={72} />
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: C.jet, ...fDisplay }}>Profile Photo</div>
                          <div style={{ fontSize: 13, color: C.slate, marginTop: 2, ...fBody }}>A clear photo helps your coaches recognize you at sessions.</div>
                          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                            <Btn size="sm" variant="secondary" onClick={() => profilePhotoInputRef.current?.click()}>Change photo</Btn>
                            {editDraft.photo && (
                              <Btn size="sm" variant="outline" onClick={() => setEditDraft((d) => ({ ...d, photo: null }))}>Remove</Btn>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 18 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                          <Field
                            label="First name"
                            placeholder="Your first name"
                            value={editDraft.name.split(" ")[0] || ""}
                            onChange={(e) => {
                              const rest = editDraft.name.split(" ").slice(1).join(" ");
                              setEditDraft((d) => ({ ...d, name: `${e.target.value} ${rest}`.trim() }));
                            }}
                            required
                          />
                          <Field
                            label="Last name"
                            placeholder="Your last name"
                            value={editDraft.name.split(" ").slice(1).join(" ") || ""}
                            onChange={(e) => {
                              const first = editDraft.name.split(" ")[0] || "";
                              setEditDraft((d) => ({ ...d, name: `${first} ${e.target.value}`.trim() }));
                            }}
                            required
                          />
                        </div>

                        <div>
                          <HandleField
                            value={editDraft.handle}
                            onChange={(val) => { setHandleEdited(true); setEditDraft((d) => ({ ...d, handle: val })); }}
                            isTaken={isHandleTaken(editDraft.handle) && editDraft.handle.trim().toLowerCase() !== (clientIdentity.handle || "").trim().toLowerCase()}
                            required
                          />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                          <Field
                            label="Email address"
                            value={profile.email}
                            disabled
                            hint="Managed securely via Login & Security"
                          />
                          <Field
                            label="Phone number"
                            value={profile.phone || ""}
                            disabled
                            hint="Managed securely via Login & Security"
                          />
                        </div>

                        <LocationField
                          value={editDraft.location}
                          onChange={(loc) => setEditDraft((d) => ({ ...d, location: loc }))}
                          label="Primary location / Suburb"
                          placeholder="Search suburb or postcode…"
                        />

                        <Field
                          label="Coaching goals & aspirations"
                          placeholder="e.g. Improve sprint technique, prepare for club trials, build cardio endurance…"
                          value={editDraft.goals}
                          onChange={(e) => setEditDraft((d) => ({ ...d, goals: e.target.value }))}
                        />

                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: C.jet, marginBottom: 8, ...fBody }}>
                            Sports of interest
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                            {POPULAR_SPORTS.slice(0, 10).map((s) => (
                              <SportBadge key={s} sport={s} selected={editDraft.sports.includes(s)} onClick={() => toggleEditSport(s)} compact />
                            ))}
                          </div>
                          <SportSearchMultiSelect options={SPORT_NAMES} value={editDraft.sports} onChange={setEditSports} placeholder="Search all sports…" />
                        </div>

                        {editDraft.sports.length > 0 && (
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: C.jet, marginBottom: 8, ...fBody }}>
                              Experience level by sport
                            </div>
                            <SportSkillLevelPicker
                              sports={editDraft.sports}
                              value={editDraft.sportLevels}
                              onChange={(sportLevels) => setEditDraft((draft) => ({ ...draft, sportLevels }))}
                            />
                          </div>
                        )}
                      </div>

                      <div style={{ marginTop: 28, paddingTop: 20, borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end", gap: 12 }}>
                        <Btn variant="secondary" onClick={() => setEditDraft(getInitialEditDraft())}>Discard changes</Btn>
                        <Btn onClick={saveProfile}>Save changes</Btn>
                      </div>
                    </Card>
                  </div>
                )}

                {desktopTab === "family" && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                      <div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: C.jet, ...fDisplay }}>Family & Participants</div>
                        <div style={{ fontSize: 14, color: C.slate, marginTop: 4, ...fBody }}>Manage child and athlete profiles to quickly select them when booking sessions.</div>
                      </div>
                      <Btn icon={UserPlus} onClick={openNewChild}>Add family member</Btn>
                    </div>

                    {children.length === 0 ? (
                      <Card style={{ padding: 48, borderRadius: 24, textAlign: "center" }}>
                        <EmptyState
                          icon={Users}
                          title="No participant profiles yet"
                          body="Create profiles for your children or family athletes so coaches can see their skill levels and safety notes."
                          action={<Btn icon={UserPlus} onClick={openNewChild}>Add participant profile</Btn>}
                        />
                      </Card>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 20 }}>
                        {children.map((child) => (
                          <Card key={child.id} style={{ padding: 24, borderRadius: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                  <Avatar name={child.name || "Child"} size={52} />
                                  <div>
                                    <div style={{ fontSize: 18, fontWeight: 750, color: C.jet, ...fDisplay }}>{child.name || "Unnamed profile"}</div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                                      <Badge tone="neutral">{child.age ? `Age ${child.age}` : "Age not set"}</Badge>
                                      {child.location && <span style={{ fontSize: 13, color: C.slate }}>· {child.location.suburb || child.location.name}</span>}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  aria-label={`Delete profile for ${child.name}`}
                                  onClick={() => setRemovalTarget({ type: "child", id: child.id, name: child.name })}
                                  style={{ width: 36, height: 36, borderRadius: 10, background: C.fog, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.slate }}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>

                              <div style={{ marginTop: 18 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: C.slate, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
                                  Sports & Skill Levels
                                </div>
                                {child.sport?.length ? (
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                    {child.sport.map((sport) => {
                                      const level = child.sportLevels?.[sport];
                                      return (
                                        <span key={sport} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 10, background: C.fog, fontSize: 13, fontWeight: 600, color: C.jet }}>
                                          <SportBadge sport={sport} compact />
                                          {level && <span style={{ fontSize: 11, color: C.slate, fontWeight: 500 }}>({level})</span>}
                                        </span>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div style={{ fontSize: 13, color: C.slateLight, fontStyle: "italic" }}>No sports added yet</div>
                                )}
                              </div>

                              {(child.guardianName || child.guardianMobile) && (
                                <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 12, background: C.fog, fontSize: 13, color: C.slate }}>
                                  <div style={{ fontWeight: 600, color: C.jet }}>Guardian: {child.guardianName || "Parent"} {child.guardianRelationship ? `(${child.guardianRelationship})` : ""}</div>
                                  {child.guardianMobile && <div style={{ marginTop: 2 }}>{child.guardianMobile}</div>}
                                </div>
                              )}
                            </div>

                            <div style={{ marginTop: 20, paddingTop: 14, borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end" }}>
                              <Btn size="sm" variant="outline" icon={Edit3} onClick={() => openEditChild(child)}>
                                Edit profile
                              </Btn>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {desktopTab === "payment" && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                      <div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: C.jet, ...fDisplay }}>Payment Methods</div>
                        <div style={{ fontSize: 14, color: C.slate, marginTop: 4, ...fBody }}>Manage your saved cards, default payment method, and billing.</div>
                      </div>
                      <Btn icon={Plus} onClick={openAddCard}>Add payment method</Btn>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 20, marginBottom: 24 }}>
                      {cards.map((card) => (
                        <div
                          key={card.id}
                          style={{
                            padding: 28,
                            borderRadius: 24,
                            background: "linear-gradient(135deg, #F38460 0%, #EC5728 48%, #D44416 100%)",
                            color: "#FFFFFF",
                            position: "relative",
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            minHeight: 260,
                            border: card.isDefault ? "2px solid rgba(255,255,255,0.75)" : "1px solid rgba(255,255,255,0.25)",
                            boxShadow: card.isDefault
                              ? "0 4px 20px -4px rgba(236, 87, 40, 0.28), 0 2px 6px -1px rgba(0, 0, 0, 0.06)"
                              : "0 2px 8px -2px rgba(0, 0, 0, 0.05)",
                            transition: "all 0.25s ease",
                          }}
                        >
                          {/* Ambient decorative background glows */}
                          <div
                            style={{
                              position: "absolute",
                              top: -40,
                              right: -40,
                              width: 180,
                              height: 180,
                              borderRadius: "50%",
                              background: "radial-gradient(circle, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 70%)",
                              pointerEvents: "none",
                            }}
                          />
                          <div
                            style={{
                              position: "absolute",
                              bottom: -50,
                              left: -30,
                              width: 160,
                              height: 160,
                              borderRadius: "50%",
                              background: "radial-gradient(circle, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0) 70%)",
                              pointerEvents: "none",
                            }}
                          />

                          {/* Top Row: Brand & Default Status */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 2 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span
                                style={{
                                  fontSize: 17,
                                  fontWeight: 900,
                                  letterSpacing: 1.5,
                                  color: "#FFFFFF",
                                  fontStyle: card.brand === "Visa" ? "italic" : "normal",
                                  ...fDisplay,
                                  textShadow: "0 1px 2px rgba(0,0,0,0.15)",
                                }}
                              >
                                {card.brand.toUpperCase()}
                              </span>
                              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2.4" strokeLinecap="round">
                                <path d="M8.5 16.5a5 5 0 0 1 0-7" />
                                <path d="M12 19a8.5 8.5 0 0 0 0-14" />
                                <path d="M15.5 21.5a12 12 0 0 0 0-19" />
                              </svg>
                            </div>

                            <div>
                              {card.isDefault ? (
                                <span
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 800,
                                    padding: "5px 12px",
                                    borderRadius: 99,
                                    background: "rgba(255,255,255,0.24)",
                                    backdropFilter: "blur(8px)",
                                    WebkitBackdropFilter: "blur(8px)",
                                    color: "#FFFFFF",
                                    border: "1px solid rgba(255,255,255,0.45)",
                                    letterSpacing: 0.6,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 5,
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
                                  }}
                                >
                                  <CheckCircle2 size={13} /> DEFAULT
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => makeDefault(card.id)}
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: "#FFFFFF",
                                    background: "rgba(255,255,255,0.18)",
                                    backdropFilter: "blur(8px)",
                                    WebkitBackdropFilter: "blur(8px)",
                                    border: "1px solid rgba(255,255,255,0.32)",
                                    borderRadius: 10,
                                    padding: "6px 13px",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease",
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.30)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.55)"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.18)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.32)"; }}
                                >
                                  Make default
                                </button>
                              )}
                            </div>
                          </div>

                          {/* EMV Chip */}
                          <div style={{ position: "relative", zIndex: 2, marginTop: 12 }}>
                            <div
                              style={{
                                width: 44,
                                height: 32,
                                borderRadius: 7,
                                background: "linear-gradient(135deg, #FFF0C2 0%, #F5D374 50%, #C99726 100%)",
                                border: "1px solid rgba(255, 255, 255, 0.4)",
                                boxShadow: "inset 0 1px 2px rgba(255,255,255,0.7), 0 2px 6px rgba(0,0,0,0.18)",
                                position: "relative",
                                overflow: "hidden",
                              }}
                            >
                              <div style={{ position: "absolute", inset: "4px 5px", border: "1px solid rgba(130, 85, 10, 0.32)", borderRadius: 4 }} />
                              <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "rgba(130, 85, 10, 0.32)" }} />
                              <div style={{ position: "absolute", top: 0, bottom: 0, left: "45%", width: 1, background: "rgba(130, 85, 10, 0.32)" }} />
                            </div>
                          </div>

                          {/* Card Number */}
                          <div style={{ position: "relative", zIndex: 2, marginTop: 18, marginBottom: 18 }}>
                            <div
                              style={{
                                fontSize: 22,
                                letterSpacing: 3.5,
                                fontFamily: "monospace",
                                fontWeight: 700,
                                color: "#FFFFFF",
                                textShadow: "0 2px 4px rgba(0,0,0,0.22)",
                              }}
                            >
                              •••• •••• •••• {card.last4}
                            </div>
                          </div>

                          {/* Bottom Row: Details + Actions */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", position: "relative", zIndex: 2 }}>
                            <div style={{ display: "flex", gap: 24, alignItems: "flex-end" }}>
                              <div>
                                <div style={{ fontSize: 9.5, fontWeight: 750, color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: 1 }}>Cardholder</div>
                                <div style={{ fontSize: 13.5, fontWeight: 750, color: "#FFFFFF", marginTop: 3, textTransform: "uppercase", letterSpacing: 0.6, textShadow: "0 1px 2px rgba(0,0,0,0.15)" }}>
                                  {card.name || profile.name || "Alex Morgan"}
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: 9.5, fontWeight: 750, color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: 1 }}>Expires</div>
                                <div style={{ fontSize: 13.5, fontWeight: 750, color: "#FFFFFF", marginTop: 3, letterSpacing: 0.5, textShadow: "0 1px 2px rgba(0,0,0,0.15)" }}>
                                  {card.exp}
                                </div>
                              </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <button
                                type="button"
                                aria-label={`Edit ${card.brand} card ending in ${card.last4}`}
                                onClick={() => openEditCard(card)}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                  padding: "7px 13px",
                                  borderRadius: 10,
                                  background: "rgba(255,255,255,0.20)",
                                  backdropFilter: "blur(8px)",
                                  WebkitBackdropFilter: "blur(8px)",
                                  border: "1px solid rgba(255,255,255,0.35)",
                                  color: "#FFFFFF",
                                  fontSize: 12.5,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  transition: "all 0.15s ease",
                                  boxShadow: "0 2px 6px rgba(0,0,0,0.10)",
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.32)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.60)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.20)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)"; }}
                              >
                                <Edit3 size={13.5} />
                                Edit
                              </button>
                              <button
                                type="button"
                                aria-label={`Remove ${card.brand} card ending in ${card.last4}`}
                                onClick={() => setRemovalTarget({ type: "card", id: card.id, name: `${card.brand} ending in ${card.last4}` })}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: 36,
                                  height: 36,
                                  borderRadius: 10,
                                  background: "rgba(255,255,255,0.20)",
                                  backdropFilter: "blur(8px)",
                                  WebkitBackdropFilter: "blur(8px)",
                                  border: "1px solid rgba(255,255,255,0.35)",
                                  color: "#FFFFFF",
                                  cursor: "pointer",
                                  transition: "all 0.15s ease",
                                  boxShadow: "0 2px 6px rgba(0,0,0,0.10)",
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(220,38,38,0.35)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.60)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.20)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)"; }}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Billing & Receipts Banner */}
                    <Card style={{ padding: 24, borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: C.brandTint, display: "flex", alignItems: "center", justifyContent: "center", color: C.brand, flexShrink: 0 }}>
                          <HistoryIcon size={22} />
                        </div>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 750, color: C.jet, ...fDisplay }}>Billing & Session Receipts</div>
                          <div style={{ fontSize: 13, color: C.slate, marginTop: 2, ...fBody }}>Access your detailed booking invoices, receipt downloads, and transaction history.</div>
                        </div>
                      </div>
                      <Btn variant="outline" onClick={() => nav("client-history")}>View history</Btn>
                    </Card>
                  </div>
                )}

                {desktopTab === "notifications" && (
                  <div>
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: C.jet, ...fDisplay }}>Notification Preferences</div>
                      <div style={{ fontSize: 14, color: C.slate, marginTop: 4, ...fBody }}>Choose which updates you receive and how we reach you.</div>
                    </div>

                    <Card style={{ padding: 28, borderRadius: 20, marginBottom: 20 }}>
                      <div style={{ fontSize: 16, fontWeight: 750, color: C.jet, marginBottom: 16, ...fDisplay }}>
                        Session & Booking Updates
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 650, color: C.jet }}>Booking Reminders</div>
                            <div style={{ fontSize: 13, color: C.slate, marginTop: 2 }}>Get alerts 24 hours and 1 hour before scheduled coaching sessions.</div>
                          </div>
                          <Toggle on={notifPrefs.bookingReminders} onClick={() => { toggleNotif("bookingReminders"); toast("Notification preference updated"); }} />
                        </div>
                        <div style={{ height: 1, background: C.border }} />
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 650, color: C.jet }}>Direct Messages</div>
                            <div style={{ fontSize: 13, color: C.slate, marginTop: 2 }}>Receive alerts when your coach messages you or sends session preparation notes.</div>
                          </div>
                          <Toggle on={notifPrefs.messages} onClick={() => { toggleNotif("messages"); toast("Notification preference updated"); }} />
                        </div>
                        <div style={{ height: 1, background: C.border }} />
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 650, color: C.jet }}>Coaching Tips & Recommendations</div>
                            <div style={{ fontSize: 13, color: C.slate, marginTop: 2 }}>Receive personalized drill recommendations and special coaching workshops.</div>
                          </div>
                          <Toggle on={notifPrefs.promos} onClick={() => { toggleNotif("promos"); toast("Notification preference updated"); }} />
                        </div>
                      </div>
                    </Card>

                    <Card style={{ padding: 28, borderRadius: 20 }}>
                      <div style={{ fontSize: 16, fontWeight: 750, color: C.jet, marginBottom: 16, ...fDisplay }}>
                        Delivery Channels
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 650, color: C.jet }}>Push Notifications</div>
                            <div style={{ fontSize: 13, color: C.slate, marginTop: 2 }}>Instant alerts on this device.</div>
                          </div>
                          <Toggle on={notifPrefs.push} onClick={() => { toggleNotif("push"); toast("Push notifications updated"); }} />
                        </div>
                        <div style={{ height: 1, background: C.border }} />
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 650, color: C.jet }}>Email Notifications</div>
                            <div style={{ fontSize: 13, color: C.slate, marginTop: 2 }}>Receipts, calendar invites, and session summaries sent to {profile.email}.</div>
                          </div>
                          <Toggle on={notifPrefs.email} onClick={() => { toggleNotif("email"); toast("Email preferences updated"); }} />
                        </div>
                        <div style={{ height: 1, background: C.border }} />
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 650, color: C.jet }}>SMS Text Messages</div>
                            <div style={{ fontSize: 13, color: C.slate, marginTop: 2 }}>Critical booking updates and last-minute weather changes.</div>
                          </div>
                          <Toggle on={notifPrefs.sms} onClick={() => { toggleNotif("sms"); toast("SMS preferences updated"); }} />
                        </div>
                        <div style={{ height: 1, background: C.border }} />
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 650, color: C.jet }}>WhatsApp Notifications</div>
                            <div style={{ fontSize: 13, color: C.slate, marginTop: 2 }}>Direct session alerts delivered right to your WhatsApp account.</div>
                          </div>
                          <Toggle on={notifPrefs.whatsapp} onClick={() => { toggleNotif("whatsapp"); toast("WhatsApp preferences updated"); }} />
                        </div>
                      </div>
                    </Card>
                  </div>
                )}

                {desktopTab === "security" && (
                  <div>
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: C.jet, ...fDisplay }}>Security & Login</div>
                      <div style={{ fontSize: 14, color: C.slate, marginTop: 4, ...fBody }}>Manage your credentials, password, and account security.</div>
                    </div>

                    <Card style={{ padding: 28, borderRadius: 20, marginBottom: 20 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 750, color: C.jet, ...fDisplay }}>Login & Contact Details</div>
                          <div style={{ fontSize: 13, color: C.slate, marginTop: 2 }}>Your verified email and mobile phone used for account access and two-factor safety.</div>
                        </div>
                        <Btn size="sm" variant="outline" onClick={() => setSheet("accountDetails")}>Update details</Btn>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 12 }}>
                        <div style={{ padding: "14px 16px", borderRadius: 14, background: C.fog, border: `1px solid ${C.border}` }}>
                          <div style={{ fontSize: 12, color: C.slate, fontWeight: 600 }}>Login Email</div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: C.jet, marginTop: 4 }}>{profile.email}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
                            <Badge tone="success" icon={CheckCircle2}>Verified</Badge>
                          </div>
                        </div>
                        <div style={{ padding: "14px 16px", borderRadius: 14, background: C.fog, border: `1px solid ${C.border}` }}>
                          <div style={{ fontSize: 12, color: C.slate, fontWeight: 600 }}>Mobile Phone</div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: C.jet, marginTop: 4 }}>{profile.phone || "Not provided"}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
                            <Badge tone={profile.phone ? "success" : "neutral"} icon={profile.phone ? CheckCircle2 : null}>
                              {profile.phone ? "Active" : "Add phone"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </Card>

                    <Card style={{ padding: 28, borderRadius: 20, marginBottom: 20 }}>
                      <div style={{ fontSize: 16, fontWeight: 750, color: C.jet, marginBottom: 4, ...fDisplay }}>Password & Authentication</div>
                      <div style={{ fontSize: 13, color: C.slate, marginBottom: 16 }}>Ensure your account is using a secure, unique password.</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <Field
                          label="New password"
                          type={showPw ? "text" : "password"}
                          placeholder="At least 8 characters"
                          icon={Lock}
                          value={newPw}
                          onChange={(e) => setNewPw(e.target.value)}
                          action={<button type="button" onClick={() => setShowPw(!showPw)} style={{ background: "none", border: "none", cursor: "pointer", color: C.slate, padding: 0 }}>{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>}
                        />
                        <Field
                          label="Confirm new password"
                          type={showPw ? "text" : "password"}
                          placeholder="Re-enter password"
                          icon={Lock}
                          value={confirmPw}
                          onChange={(e) => setConfirmPw(e.target.value)}
                        />
                      </div>
                      {newPw && (
                        <div style={{ marginTop: 12 }}>
                          <PasswordRequirements password={newPw} />
                        </div>
                      )}
                      <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
                        <Btn disabled={!pwdOk} onClick={() => { setNewPw(""); setConfirmPw(""); toast("Password updated successfully"); }}>Update password</Btn>
                      </div>

                      <div style={{ height: 1, background: C.border, margin: "22px 0" }} />

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 650, color: C.jet }}>Biometric Authentication</div>
                          <div style={{ fontSize: 13, color: C.slate, marginTop: 2 }}>Allow instant login via Face ID, Touch ID, or Windows Hello.</div>
                        </div>
                        <Toggle on={biometric} onClick={() => { setBiometric(!biometric); toast(biometric ? "Biometric login disabled" : "Biometric login enabled"); }} />
                      </div>
                    </Card>

                    <Card style={{ padding: 24, borderRadius: 20, border: `1px solid ${C.dangerBorder}`, background: C.dangerTint }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: C.danger }}>Deactivate Account</div>
                          <div style={{ fontSize: 13, color: C.danger, opacity: 0.85, marginTop: 2 }}>Permanently close your CoachNivo account. All active bookings will be cancelled.</div>
                        </div>
                        <Btn variant="danger" size="sm" onClick={openDeactivate}>Deactivate...</Btn>
                      </div>
                    </Card>
                  </div>
                )}

                {desktopTab === "support" && (
                  <div>
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: C.jet, ...fDisplay }}>Support & Legal</div>
                      <div style={{ fontSize: 14, color: C.slate, marginTop: 4, ...fBody }}>Get help with your bookings, account settings, and review trust & safety policies.</div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                      <Card style={{ padding: 28, borderRadius: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ width: 44, height: 44, borderRadius: 12, background: C.brandTint, display: "flex", alignItems: "center", justifyContent: "center", color: C.brand, marginBottom: 16 }}>
                            <HelpCircle size={22} />
                          </div>
                          <div style={{ fontSize: 18, fontWeight: 750, color: C.jet, ...fDisplay }}>Help Center & FAQs</div>
                          <div style={{ fontSize: 13.5, color: C.slate, marginTop: 6, lineHeight: 1.5 }}>
                            Browse frequently asked questions regarding sessions, payment holds, refunds, and parent guidelines.
                          </div>
                        </div>
                        <div style={{ marginTop: 24 }}>
                          <Btn full onClick={() => nav("support")}>Visit Help Center</Btn>
                        </div>
                      </Card>

                      <Card style={{ padding: 28, borderRadius: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ width: 44, height: 44, borderRadius: 12, background: C.fog, display: "flex", alignItems: "center", justifyContent: "center", color: C.slate, marginBottom: 16 }}>
                            <Shield size={22} />
                          </div>
                          <div style={{ fontSize: 18, fontWeight: 750, color: C.jet, ...fDisplay }}>Privacy & Safety Policy</div>
                          <div style={{ fontSize: 13.5, color: C.slate, marginTop: 6, lineHeight: 1.5 }}>
                            Learn how your personal details, child participant information, and WWCC safety standards are protected.
                          </div>
                        </div>
                        <div style={{ marginTop: 24 }}>
                          <Btn full variant="outline" onClick={() => setSheet("privacy")}>Read Privacy Policy</Btn>
                        </div>
                      </Card>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Mobile View */
          <>
            {/* Profile summary — scrolls with the page */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "6px 0 26px" }}>
              <button
                type="button"
                aria-label={`Open ${profile.name}'s profile photo`}
                disabled={!profilePhoto}
                onClick={() => setAvatarOpen(true)}
                style={{ width: 58, height: 58, padding: 0, border: "none", borderRadius: 99, background: "transparent", cursor: profilePhoto ? "zoom-in" : "default", flexShrink: 0 }}
              >
                <Avatar name={profile.name} src={profilePhoto} size={58} />
              </button>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: T.title, fontWeight: 600, color: C.jet, ...fDisplay }}>{profile.name}</div>
                <div style={{ fontSize: T.labelLg, color: C.slate, marginTop: 2, ...fBody }}>{profile.email}</div>
                <div style={{ marginTop: 3 }}><HandleTag handle={clientIdentity.handle} size={12} color={C.brand} /></div>
              </div>
            </div>

            {/* Family */}
            <div style={{ marginBottom: 24 }}>
              <SectionLabel style={{ marginBottom: 10 }}>Family</SectionLabel>
              <div className="cl-stagger">
              {children.map((child, i) => {
                const ageLabel = child.age ? `Age ${child.age}` : "Age not set";
                return (
                  <button
                    key={child.id}
                    onClick={() => openEditChild(child)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 16px 12px 12px", marginBottom: 10,
                      background: C.white, border: `1px solid ${C.border}`, borderRadius: 16,
                      boxShadow: "0 1px 2px rgba(22,24,29,.04)", cursor: "pointer", textAlign: "left",
                      animationDelay: `${Math.min(i, 8) * 45}ms`,
                    }}
                  >
                    <Avatar name={child.name || "Child"} size={40} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: T.bodyLg, fontWeight: 600, color: C.jet, ...fBody }}>{child.name || "Unnamed profile"}</div>
                      <div style={{ fontSize: T.label, color: C.slate, marginTop: 1, ...fBody }}>{ageLabel}</div>
                      {child.sport?.length ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 5 }}>
                          {child.sport.slice(0, 2).map((sport) => <SportBadge key={sport} sport={sport} compact />)}
                          {child.sport.length > 2 && <Badge tone="neutral">+{child.sport.length - 2}</Badge>}
                        </div>
                      ) : <div style={{ fontSize: T.caption, color: C.slateLight, marginTop: 3, ...fBody }}>Sport not set</div>}
                    </div>
                    <ChevronRight size={16} color={C.slateLight} style={{ flexShrink: 0 }} />
                  </button>
                );
              })}
              </div>
              <div style={{ marginTop: 10 }}>
                <Btn full variant="secondary" icon={UserPlus} onClick={openNewChild}>Add a child profile</Btn>
              </div>
            </div>

            <SettingsGroup title="Profile">
              <SettingsRow icon={Edit3} label="Edit profile" onClick={openEditProfile} />
              <SettingsRow icon={Bell} label="Notification preferences" onClick={() => setSheet("notif")} />
              <SettingsRow icon={CreditCard} label="Payment methods" onClick={() => setSheet("payment")} />
              <SettingsRow icon={HistoryIcon} label="History" onClick={() => nav("client-history")} />
            </SettingsGroup>

            <SettingsGroup title="Security">
              <SettingsRow icon={ShieldCheck} label="Login & contact details" onClick={() => setSheet("accountDetails")} />
              <SettingsRow icon={Lock} label="Change password" onClick={() => setSheet("password")} />
            </SettingsGroup>

            <SettingsGroup title="Privacy">
              <SettingsRow icon={Shield} label="Privacy policy" onClick={() => setSheet("privacy")} />
            </SettingsGroup>

            <SettingsGroup title="Support">
              <SettingsRow icon={HelpCircle} label="Help & FAQs" onClick={() => nav("support")} />
            </SettingsGroup>

            <SettingsGroup title="Session">
              <SettingsRow icon={LogOut} label="Sign Out" onClick={() => setSheet("logout")} />
              <SettingsRow icon={AlertTriangle} label="Deactivate account" danger onClick={openDeactivate} />
            </SettingsGroup>
          </>
        )}
      </div>

      {/* Child / participant profile */}
      <BottomSheet open={sheet === "child"} onClose={() => setSheet(null)} title={editingChildId ? "Edit child profile" : "Add child profile"} heightPct={90}>
        <FormSection icon={Camera} label="Profile photo" hint="A photo helps coaches recognise your child at sessions.">
          <div style={{ display: "flex", justifyContent: "center" }}>
            <button
              onClick={() => setChildDraft((d) => ({ ...d, hasPhoto: !d.hasPhoto }))}
              style={{ position: "relative", background: "none", border: "none", cursor: "pointer" }}
            >
              {childDraft.hasPhoto ? <Avatar name={childDraft.name || "Child"} size={72} /> : (
                <div style={{ width: 72, height: 72, borderRadius: 72, background: C.fog, border: `1.5px dashed ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Camera size={20} color={C.slateLight} />
                </div>
              )}
              <div style={{ position: "absolute", bottom: -2, right: -2, width: 24, height: 24, borderRadius: 24, background: C.brand, border: `2px solid ${C.white}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Camera size={11} color={C.white} />
              </div>
            </button>
          </div>
        </FormSection>

        <FormSection icon={User} label="About them" hint="Basic details for this participant.">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Child's name" placeholder="e.g. Ava" icon={User} value={childDraft.name} onChange={(e) => setChildDraft((d) => ({ ...d, name: e.target.value }))} required />
            <Field label="Age" placeholder="e.g. 9" value={childDraft.age} onChange={(e) => setChildDraft((d) => ({ ...d, age: e.target.value }))} />
            <LocationField
              value={childDraft.location}
              onChange={(loc) => setChildDraft((d) => ({ ...d, location: loc }))}
              label="Location"
              placeholder="Search suburb or postcode…"
            />
          </div>
        </FormSection>

        <FormSection icon={UserCheck} label="Guardian information" hint="The parent or legal guardian responsible for this participant.">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Field label="Guardian name" placeholder="e.g. Jamie Chen" icon={UserCheck} value={childDraft.guardianName} onChange={(e) => setChildDraft((d) => ({ ...d, guardianName: e.target.value }))} />
            <Field label="Relationship to participant" placeholder="e.g. Parent" value={childDraft.guardianRelationship} onChange={(e) => setChildDraft((d) => ({ ...d, guardianRelationship: e.target.value }))} />
            <Field label="Mobile number" placeholder="04XX XXX XXX" icon={Phone} type="tel" value={childDraft.guardianMobile} onChange={(e) => setChildDraft((d) => ({ ...d, guardianMobile: e.target.value.replace(/[^0-9+\s]/g, "") }))} />
          </div>
        </FormSection>

        <FormSection icon={Sparkles} label="Sport & interests" hint="Sports they love - helps coaches match the right sessions.">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {POPULAR_SPORTS.slice(0, 10).map((s) => (
              <SportBadge key={s} sport={s} selected={childDraft.sport.includes(s)} onClick={() => toggleDraftSport(s)} compact />
            ))}
          </div>
          <div style={{ marginTop: 10 }}>
            <SportSearchMultiSelect options={SPORT_NAMES} value={childDraft.sport} onChange={setDraftSports} placeholder="Search all sports…" />
          </div>
        </FormSection>

        <FormSection icon={Target} label="Experience by sport" hint="Choose the closest current level for every selected sport.">
          <SportSkillLevelPicker
            sports={childDraft.sport}
            value={childDraft.sportLevels}
            onChange={(sportLevels) => setChildDraft((draft) => ({ ...draft, sportLevels }))}
          />
        </FormSection>

        <FormSection icon={Target} label="Coaching goals" hint="What they'd like to get out of coaching.">
          <div className="cl-input" style={{ display: "flex", alignItems: "flex-start", gap: 10, background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 13, padding: "11px 13px" }}>
            <Target size={16} color={C.slateLight} style={{ marginTop: 2, flexShrink: 0 }} />
            <textarea
              value={childDraft.goals}
              onChange={(e) => setChildDraft((d) => ({ ...d, goals: e.target.value }))}
              placeholder="e.g. build confidence for club trials"
              rows={2}
              style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: T.bodyLg, color: C.jet, resize: "none", ...fBody }}
            />
          </div>
        </FormSection>

        <FormSection icon={Users} label="Coaching preferences" hint="Any preferences that help coaches prepare for sessions.">
          <div className="cl-input" style={{ display: "flex", alignItems: "flex-start", gap: 10, background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 13, padding: "11px 13px" }}>
            <Users size={16} color={C.slateLight} style={{ marginTop: 2, flexShrink: 0 }} />
            <textarea
              value={childDraft.preferences}
              onChange={(e) => setChildDraft((d) => ({ ...d, preferences: e.target.value }))}
              placeholder="e.g. prefers a female coach, mornings only"
              rows={2}
              style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: T.bodyLg, color: C.jet, resize: "none", ...fBody }}
            />
          </div>
        </FormSection>

        <FormSection icon={Stethoscope} label="Medical information (optional)" hint="Anything a coach should know to keep sessions safe.">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Field label="Medical conditions" placeholder="e.g. asthma" icon={Stethoscope} value={childDraft.medicalConditions} onChange={(e) => setChildDraft((d) => ({ ...d, medicalConditions: e.target.value }))} />
            <Field label="Allergies" placeholder="e.g. bee stings, peanuts" icon={AlertTriangle} value={childDraft.allergies} onChange={(e) => setChildDraft((d) => ({ ...d, allergies: e.target.value }))} />
            <div>
              <div style={{ fontSize: T.labelLg, fontWeight: 600, color: C.jet, marginBottom: 6, ...fBody }}>Additional notes</div>
              <textarea
                value={childDraft.medicalNotes}
                onChange={(e) => setChildDraft((d) => ({ ...d, medicalNotes: e.target.value }))}
                placeholder="Anything else a coach should know"
                rows={2}
                style={{ width: "100%", border: `1.5px solid ${C.border}`, borderRadius: 13, padding: "11px 13px", fontSize: T.bodyLg, outline: "none", boxSizing: "border-box", resize: "none", ...fBody }}
              />
            </div>
          </div>
        </FormSection>

        <FormSection icon={Phone} label="Emergency contact (optional)" hint="Who coaches can reach if they can't get hold of you.">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Field label="Contact name" placeholder="e.g. Mia Chen" icon={UserCheck} value={childDraft.emergencyName} onChange={(e) => setChildDraft((d) => ({ ...d, emergencyName: e.target.value }))} />
            <Field label="Relationship" placeholder="e.g. Mother" value={childDraft.emergencyRelationship} onChange={(e) => setChildDraft((d) => ({ ...d, emergencyRelationship: e.target.value }))} />
            <Field label="Mobile number" placeholder="04XX XXX XXX" icon={Phone} type="tel" value={childDraft.emergencyMobile} onChange={(e) => setChildDraft((d) => ({ ...d, emergencyMobile: e.target.value.replace(/[^0-9+\s]/g, "") }))} />
          </div>
        </FormSection>

        {editingChildId && (
          <FormSection icon={HistoryIcon} label="Booking history" hint="Sessions booked for this profile.">
            {(() => {
              const history = bookings.filter((b) => b.participant === childDraft.name);
              if (history.length === 0) {
                return <div style={{ fontSize: T.labelLg, color: C.slateLight, ...fBody }}>No sessions booked yet for {childDraft.name || "this profile"}.</div>;
              }
              return history.map((b) => (
                <Card key={b.id} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: T.body, fontWeight: 600, color: C.jet, ...fBody }}>{b.service}</div>
                      <div style={{ fontSize: T.captionLg, color: C.slate, marginTop: 2, ...fBody }}>{(() => { const cn = getBookingCoachName(b, COACHES.find((c) => c.id === b.coachId)); return cn.name; })()} · {b.date}</div>
                    </div>
                    <Badge tone={b.status === "completed" ? "success" : "orange"}>{b.status}</Badge>
                  </div>
                </Card>
              ));
            })()}
          </FormSection>
        )}

        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 10 }}>
          <Btn full onClick={saveChild}>{editingChildId ? "Save changes" : "Add profile"}</Btn>
          {editingChildId && (
            <Btn full variant="danger" icon={Trash2} onClick={() => setRemovalTarget({ type: "child", id: editingChildId, name: childDraft.name })}>Remove profile</Btn>
          )}
        </div>
      </BottomSheet>

      {/* Edit profile — mirrors the public profile and the "About you"
          onboarding (address, postal code, sports, goals), prefilled with
          whatever the person already gave us so nothing has to be re-entered from scratch. */}
      <BottomSheet open={sheet === "edit"} onClose={closeSheet} title="Edit profile" heightPct={88}>
        {editDraft && (
          <>
<FormSection icon={Camera} label="Profile photo" hint="A friendly photo helps coaches recognise you at sessions.">
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <button type="button" aria-label="Change profile photo" onClick={() => profilePhotoInputRef.current?.click()} style={{ position: "relative", width: 76, height: 76, padding: 0, background: "none", border: "none", cursor: "pointer" }}>
                {editDraft.photo ? (
                  <img src={editDraft.photo} alt="Profile" style={{ width: 76, height: 76, borderRadius: 76, objectFit: "cover", display: "block" }} />
                ) : (
                  <Avatar name={editDraft.name || "You"} src={clientIdentity.avatar} size={76} />
                )}
                <span aria-hidden="true" style={{ position: "absolute", right: -2, bottom: -2, width: 28, height: 28, borderRadius: 999, background: C.brand, border: `2px solid ${C.white}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(22,24,29,.16)" }}><Camera size={13} color={C.white} /></span>
              </button>
              <input ref={profilePhotoInputRef} type="file" accept="image/*" onChange={onProfilePhotoChange} style={{ display: "none" }} />
              <div style={{ fontSize: T.captionLg, color: C.slateLight, marginTop: 8, ...fBody }}>Tap to change your profile photo</div>
            </div>
          </FormSection>

          <FormSection icon={User} label="Identity" hint="Your legal name stays private until a booking is confirmed.">
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label="Full name" placeholder="Sarah Lin" icon={User} value={editDraft.name} onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))} required />
              <HandleField
                value={editDraft.handle}
                onChange={(v) => { setHandleEdited(true); setEditDraft((d) => ({ ...d, handle: v })); }}
                isTaken={isHandleTaken(editDraft.handle)}
                showStatus={handleEdited && editDraft.handle.trim() !== String(clientIdentity.handle || "").trim()}
                required
              />
            </div>
          </FormSection>

          <FormSection icon={MapPin} label="Location" hint="Only used to find coaches nearby - never shown to them.">
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label="Address" placeholder="Enter your address" icon={MapPin} value={editDraft.address} onChange={(e) => setEditDraft((d) => ({ ...d, address: e.target.value }))} />
              <LocationField
                value={editDraft.location}
                onChange={(loc) => setEditDraft((d) => ({ ...d, location: loc }))}
                label="Suburb & postcode"
                placeholder="Search suburb or postcode…"
              />
            </div>
          </FormSection>

          <FormSection icon={Sparkles} label="Your sport" hint="What you're into and what you'd like to work on.">
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ fontSize: T.labelLg, fontWeight: 600, color: C.jet, marginBottom: 6, ...fBody }}>Sports you're into</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {POPULAR_SPORTS.slice(0, 10).map((s) => (
                    <SportBadge key={s} sport={s} selected={editDraft.sports.includes(s)} onClick={() => toggleEditSport(s)} compact />
                  ))}
                </div>
                <div style={{ marginTop: 10 }}>
                  <SportSearchMultiSelect options={SPORT_NAMES} value={editDraft.sports} onChange={setEditSports} placeholder="Search all sports…" />
                </div>
              </div>
              <div>
                <div style={{ fontSize: T.labelLg, fontWeight: 600, color: C.jet, marginBottom: 7, ...fBody }}>Experience by sport</div>
                <SportSkillLevelPicker
                  sports={editDraft.sports}
                  value={editDraft.sportLevels}
                  onChange={(sportLevels) => setEditDraft((draft) => ({ ...draft, sportLevels }))}
                />
              </div>
              <div>
                <div style={{ fontSize: T.labelLg, fontWeight: 600, color: C.jet, marginBottom: 6, ...fBody }}>Coaching goals</div>
                <div className="cl-input" style={{ display: "flex", alignItems: "flex-start", gap: 10, background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 13, padding: "11px 13px" }}>
                  <Target size={16} color={C.slateLight} style={{ marginTop: 2, flexShrink: 0 }} />
                  <textarea
                    value={editDraft.goals}
                    onChange={(e) => setEditDraft((d) => ({ ...d, goals: e.target.value }))}
                    placeholder="e.g. build confidence for club trials, improve fitness, learn the basics…"
                    rows={3}
                    style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: T.bodyLg, color: C.jet, resize: "none", ...fBody }}
                  />
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection icon={Stethoscope} label="Medical information (optional)" hint="Anything a coach should know to keep sessions safe.">
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label="Medical conditions" placeholder="e.g. asthma" icon={Stethoscope} value={editDraft.medicalConditions} onChange={(e) => setEditDraft((d) => ({ ...d, medicalConditions: e.target.value }))} />
              <Field label="Allergies" placeholder="e.g. bee stings, peanuts" icon={AlertTriangle} value={editDraft.allergies} onChange={(e) => setEditDraft((d) => ({ ...d, allergies: e.target.value }))} />
              <div>
                <div style={{ fontSize: T.labelLg, fontWeight: 600, color: C.jet, marginBottom: 6, ...fBody }}>Additional notes</div>
                <textarea
                  value={editDraft.medicalNotes}
                  onChange={(e) => setEditDraft((d) => ({ ...d, medicalNotes: e.target.value }))}
                  placeholder="Anything else a coach should know"
                  rows={2}
                  style={{ width: "100%", border: `1.5px solid ${C.border}`, borderRadius: 13, padding: "11px 13px", fontSize: T.bodyLg, outline: "none", boxSizing: "border-box", resize: "none", background: C.white, color: C.jet, ...fBody }}
                />
              </div>
            </div>
          </FormSection>

          <FormSection icon={Phone} label="Emergency contact (optional)" hint="Who coaches can reach if they can't get hold of you.">
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label="Contact name" placeholder="e.g. Mia Chen" icon={UserCheck} value={editDraft.emergencyName} onChange={(e) => setEditDraft((d) => ({ ...d, emergencyName: e.target.value }))} />
              <Field label="Relationship" placeholder="e.g. Partner" value={editDraft.emergencyRelationship} onChange={(e) => setEditDraft((d) => ({ ...d, emergencyRelationship: e.target.value }))} />
              <Field label="Mobile number" placeholder="04XX XXX XXX" icon={Phone} type="tel" value={editDraft.emergencyMobile} onChange={(e) => setEditDraft((d) => ({ ...d, emergencyMobile: e.target.value.replace(/[^0-9+\s]/g, "") }))} />
            </div>
          </FormSection>

            <Btn full onClick={saveProfile}>Save changes</Btn>
          </>
        )}
      </BottomSheet>

      <AccountDetailsSheet
        open={sheet === "accountDetails"}
        onClose={closeSheet}
        details={{ name: profile.name, username: clientIdentity.handle || "", email: profile.email, phone: profile.phone }}
        onSave={saveAccountDetails}
        isHandleTaken={isHandleTaken}
        toast={toast}
        accountLabel="client account"
      />

{/* Notification preferences */}
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
          <SettingsRow icon={CalendarDays} label="Booking reminders" sub="Reminders before your sessions" right={<Toggle label="Booking reminders" on={notifPrefs.bookingReminders} onClick={() => toggleNotif("bookingReminders")} />} />
          <SettingsRow icon={MessageCircle} label="Messages" sub="New messages from coaches" right={<Toggle label="Messages" on={notifPrefs.messages} onClick={() => toggleNotif("messages")} />} />
          <SettingsRow icon={Sparkles} label="Promotions & offers" sub="Deals and product news" right={<Toggle label="Promotions & offers" on={notifPrefs.promos} onClick={() => toggleNotif("promos")} />} />
        </SettingsGroup>
        <div style={{ marginTop: 8 }}>
          <Btn full onClick={() => { toast("Notification preferences saved"); closeSheet(); }}>Save preferences</Btn>
        </div>
      </BottomSheet>

      {/* Payment methods */}
      <BottomSheet open={sheet === "payment"} onClose={closeSheet} title="Payment methods" heightPct={70}>
        <SettingsGroup>
          {cards.map((card) => (
            <SettingsRow
              key={card.id}
              icon={CardIcon}
              label={`${card.brand} •••• ${card.last4}`}
              sub={`Expires ${card.exp}${card.isDefault ? " · Default" : ""}${card.name ? ` · ${card.name}` : ""}`}
              right={(
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {!card.isDefault && (
                    <button onClick={() => makeDefault(card.id)} style={{ background: "none", border: "none", color: C.brand, fontSize: T.label, fontWeight: 600, cursor: "pointer", flexShrink: 0, ...fBody }}>Set default</button>
                  )}
                  <button
                    onClick={() => openEditCard(card)}
                    aria-label={`Edit ${card.brand} ending in ${card.last4}`}
                    style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 4, flexShrink: 0 }}
                  >
                    <Edit3 size={15} color={C.slate} />
                  </button>
                  <button onClick={() => setRemovalTarget({ type: "card", id: card.id, name: `${card.brand} ending in ${card.last4}` })} aria-label={`Remove ${card.brand} ending in ${card.last4}`} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 4, flexShrink: 0 }}>
                    <Trash2 size={15} color={C.slateLight} />
                  </button>
                </div>
              )}
            />
          ))}
        </SettingsGroup>
        <div style={{ marginTop: 16 }}>
          <Btn full variant="secondary" icon={Plus} onClick={openAddCard}>Add payment method</Btn>
        </div>
      </BottomSheet>

      {/* Add / Edit payment method */}
      <BottomSheet
        open={sheet === "addCard"}
        onClose={() => { setEditingCardId(null); setSheet(isDesktop ? null : "payment"); }}
        title={editingCardId ? "Edit payment method" : "Add payment method"}
        heightPct={68}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field
            label="Card number"
            placeholder="1234 5678 9012 3456"
            icon={CardIcon}
            value={cardDraft.number}
            onChange={(e) => setCardDraft((d) => ({ ...d, number: e.target.value.replace(/[^\d\s]/g, "") }))}
            helper={editingCardId ? "Enter full 16 digits to change card, or keep existing" : undefined}
            required={!editingCardId}
          />
          <Field
            label="Name on card"
            placeholder="Alex Morgan"
            icon={User}
            value={cardDraft.name}
            onChange={(e) => setCardDraft((d) => ({ ...d, name: e.target.value }))}
            required
          />
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <Field
                label="Expiry"
                placeholder="MM/YY"
                icon={CalendarDays}
                value={cardDraft.expiry}
                onChange={(e) => setCardDraft((d) => ({ ...d, expiry: e.target.value.replace(/[^\d/]/g, "") }))}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <Field
                label="CVC"
                placeholder="123"
                icon={Lock}
                value={cardDraft.cvc}
                onChange={(e) => setCardDraft((d) => ({ ...d, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                helper={editingCardId ? "Optional when updating" : undefined}
                required={!editingCardId}
              />
            </div>
          </div>
        </div>
        <div style={{ fontSize: T.captionLg, color: C.slateLight, marginTop: 14, lineHeight: 1.5, ...fBody }}>
          Payments are processed by our PCI-compliant payment partner - CoachNivo never stores your full card number.
        </div>
        <div style={{ marginTop: 20 }}>
          <Btn full disabled={!canSaveCard} onClick={saveCard}>{editingCardId ? "Update card" : "Save card"}</Btn>
        </div>
      </BottomSheet>

      {/* Change password */}
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

      {/* Privacy policy */}
      <BottomSheet open={sheet === "privacy"} onClose={closeSheet} title="Privacy policy" heightPct={75}>
        <div style={{ fontSize: T.body, color: C.slate, lineHeight: 1.6, ...fBody }}>
          <p style={{ marginBottom: 12 }}>CoachNivo collects only the information needed to connect you with coaches and manage your bookings, such as your profile details, session history, and payment information.</p>
          <p style={{ marginBottom: 12 }}>We never sell your personal data. Information is shared with coaches only as needed to fulfil a booking, and with payment processors to complete transactions securely.</p>
          <p>You can request a copy of your data or ask us to delete your account at any time from this Account tab.</p>
        </div>
        <div style={{ marginTop: 20 }}>
          <Btn full variant="secondary" onClick={closeSheet}>Close</Btn>
        </div>
      </BottomSheet>

      {/* Sign out confirmation */}
      <ConfirmDialog
        open={sheet === "logout"}
        onClose={closeSheet}
        onConfirm={async () => {
          await new Promise((r) => setTimeout(r, 600));
          closeSheet();
          resetNav("get-started", {}, "client");
        }}
        title="Sign Out"
        description="Are you sure you want to sign out of your account?"
        confirmLabel="Sign Out"
        loadingText="Signing Out..."
        cancelLabel="Cancel"
        icon={LogOut}
        destructive={false}
      />

      {/* Secure account deactivation */}
      <BottomSheet open={sheet === "deactivate"} onClose={closeDeactivate} title={deactivateStep === "confirm" ? "Deactivate account" : "Verify deactivation"} heightPct={deactivateStep === "confirm" ? 52 : 68}>
        {deactivateStep === "confirm" ? (
          <>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: C.dangerTint, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <AlertTriangle size={23} color={C.danger} />
            </div>
            <div style={{ fontSize: T.title, fontWeight: 700, color: C.jet, marginBottom: 7, ...fDisplay }}>Take a break from CoachNivo?</div>
            <div style={{ fontSize: T.body, color: C.slate, lineHeight: 1.6, marginBottom: 16, ...fBody }}>
              Your profile will be hidden and upcoming bookings will be cancelled. You can restore your account by signing in again within 30 days.
            </div>
            <Card style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 18, background: C.fog }}>
              <Mail size={17} color={C.slate} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: T.body, fontWeight: 600, color: C.jet, ...fBody }}>Email verification required</div>
                <div style={{ fontSize: T.captionLg, color: C.slate, lineHeight: 1.5, marginTop: 3, ...fBody }}>We’ll send a six-digit code to {profile.email || "your registered email"} before deactivating.</div>
              </div>
            </Card>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Btn full variant="danger" icon={Mail} onClick={sendDeactivationCode}>Send verification code</Btn>
              <Btn full variant="secondary" onClick={closeDeactivate}>Keep my account</Btn>
            </div>
          </>
        ) : (
          <>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: C.brandTint, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <Mail size={22} color={C.brand} />
            </div>
            <div style={{ fontSize: T.title, fontWeight: 700, color: C.jet, ...fDisplay }}>Check your email</div>
            <div style={{ fontSize: T.body, color: C.slate, lineHeight: 1.55, marginTop: 6, marginBottom: 18, ...fBody }}>
              Enter the six-digit code sent to <span style={{ color: C.jet, fontWeight: 600 }}>{profile.email}</span>.
            </div>

            {deactivationError && (
              <div role="alert" style={{ display: "flex", gap: 8, padding: "10px 12px", borderRadius: 12, border: `1px solid ${C.dangerBorder}`, background: C.dangerTint, marginBottom: 14 }}>
                <AlertTriangle size={15} color={C.danger} style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: T.labelLg, color: C.danger, lineHeight: 1.45, ...fBody }}>That code is invalid or incomplete. Check the email or request a new code.</span>
              </div>
            )}

            <div onPaste={onDeactivationPaste} style={{ display: "flex", gap: 8, justifyContent: "flex-start" }}>
              {deactivationCode.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => { deactivationInputsRef.current[index] = element; }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  aria-label={`Deactivation code digit ${index + 1} of 6`}
                  value={digit}
                  maxLength={1}
                  onChange={(event) => setDeactivationDigit(index, event.target.value)}
                  onKeyDown={(event) => onDeactivationKeyDown(index, event)}
                  style={{ flex: "0 1 60px", aspectRatio: "1 / 1", height: "auto", minWidth: 0, boxSizing: "border-box", borderRadius: 13, border: `1.5px solid ${deactivationError ? C.dangerBorderSoft : digit ? C.brand : C.border}`, background: C.white, color: C.jet, textAlign: "center", outline: "none", fontSize: T.heading, fontWeight: 700, ...fDisplay }}
                />
              ))}
            </div>

            <div style={{ minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 8 }}>
              {resendSeconds > 0 ? (
                <span style={{ fontSize: T.body, color: C.slateLight, ...fBody }}>Resend code in 0:{String(resendSeconds).padStart(2, "0")}</span>
              ) : (
                <button type="button" onClick={resendDeactivationCode} style={{ minHeight: 44, padding: "0 10px", border: "none", background: "transparent", color: C.brand, cursor: "pointer", fontSize: T.body, fontWeight: 600, ...fBody }}>Resend code</button>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
              <Btn full variant="danger" disabled={deactivationCode.join("").length !== 6} onClick={verifyAndDeactivate}>Verify & deactivate</Btn>
              <Btn full variant="secondary" onClick={() => { setDeactivateStep("confirm"); setDeactivationError(false); }}>Back</Btn>
            </div>
          </>
        )}
      </BottomSheet>

      <ConfirmDialog
        open={!!removalTarget}
        onClose={() => setRemovalTarget(null)}
        onConfirm={removalTarget?.type === "child" ? deleteChild : confirmCardRemoval}
        title={removalTarget?.type === "child" ? "Remove this child profile?" : "Remove this payment method?"}
        description={removalTarget?.type === "child"
          ? `${removalTarget?.name || "This profile"} and their saved safety details will be removed. Existing booking records will remain in your history.`
          : `${removalTarget?.name || "This card"} will no longer be available for future bookings.`}
        confirmLabel={removalTarget?.type === "child" ? "Remove profile" : "Remove card"}
        icon={Trash2}
      />

      <FullscreenImageViewer
        open={avatarOpen}
        onClose={() => setAvatarOpen(false)}
        src={profilePhoto}
        alt={`${profile.name} profile photo`}
      />

    </div>
  );
}

/* =========================================================================
   HISTORY — full page covering both transaction history (Payments) and a
   timeline of other completed activity (Activity), so it's a single place
   to look back on the account rather than payments-only. Tapping a payment
   row opens the lifecycle-aware release status for completed payments and
   keeps a lightweight receipt sheet for refunds or still-held funds.
   ========================================================================= */
const CLIENT_ACTIVITY_ICON = { booking: Calendar, message: MessageCircle, review: Star, availability: Sparkles, promo: Percent, payment: CreditCard, verification: ShieldCheck };

export function ScreenClientHistory({ nav, bookings = [], clientNotifications = [] }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const { isDesktop } = useResponsive();
  const [tab, setTab] = useState("payments");
  const [receiptTarget, setReceiptTarget] = useState(null);
  const [activity] = useLiveNotifications(clientNotifications, CLIENT_NOTIFICATIONS);
  const paidBookings = bookings.filter((b) => [
    PAYMENT_STATUS.HELD,
    PAYMENT_STATUS.RELEASED,
    PAYMENT_STATUS.REFUND_PROCESSING,
    PAYMENT_STATUS.REFUNDED,
  ].includes(b.paymentStatus));

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar title="History" onBack={() => nav("client-profile")} />
      <div style={{ padding: isDesktop ? "32px 64px 0" : "16px 18px 0", marginBottom: 16 }}>
        <SegTabs
          items={[{ value: "payments", label: "Payments" }, { value: "activity", label: "Activity" }]}
          value={tab}
          onChange={setTab}
        />
      </div>

      <div style={{ flex: 1, overflowY: "auto", width: "100%", padding: isDesktop ? "24px 64px 48px" : "0 18px", paddingBottom: isDesktop ? 48 : "max(28px, env(safe-area-inset-bottom))" }} className="cl-hide-scrollbar">
        {tab === "payments" && (
          <>
            {paidBookings.length === 0 && (
              <EmptyState icon={CreditCard} title="No payments yet" body="Your session receipts will show up here." />
            )}
            <div className="cl-stagger">
              {paidBookings.map((b, i) => (
                <Card key={b.id} onClick={() => b.paymentStatus === PAYMENT_STATUS.RELEASED
                  ? nav("funds-release-status", { bookingId: b.id, role: "client", backTo: "client-history" })
                  : setReceiptTarget(b)} style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center", animationDelay: `${Math.min(i, 8) * 45}ms` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar name={(() => { const cn = getBookingCoachName(b, COACHES.find((c) => c.id === b.coachId)); return cn.name; })()} size={40} />
                  <div>
                    <div style={{ fontSize: T.bodyLg, fontWeight: 600, color: C.jet, ...fBody }}>{b.service}</div>
                    <div style={{ fontSize: T.captionLg, color: C.slate, marginTop: 2, ...fBody }}>{b.date} · {(() => { const cn = getBookingCoachName(b, COACHES.find((c) => c.id === b.coachId)); return cn.name; })()}</div>
                    <div style={{ marginTop: 5 }}><Badge tone={b.paymentStatus === PAYMENT_STATUS.RELEASED ? "success" : "orange"}>{b.paymentStatus === PAYMENT_STATUS.RELEASED ? "Payment released" : b.paymentStatus === PAYMENT_STATUS.HELD ? "Securely held" : "Refund update"}</Badge></div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontSize: T.subtitle, fontWeight: 700, color: b.status === "cancelled" ? C.slateLight : C.jet, ...fDisplay }}>${Number(b.paidTotal || b.price || 0).toFixed(2)}</div>
                  <ChevronRight size={16} color={C.slateLight} />
                </div>
              </Card>
            ))}
            </div>
          </>
        )}

        {tab === "activity" && (
          <>
            {activity.length === 0 && (
              <EmptyState icon={HistoryIcon} title="No activity yet" body="Booking updates, payments and other account activity will show up here." />
            )}
            <div className="cl-stagger">
            {activity.map((n, i) => {
              const Icon = CLIENT_ACTIVITY_ICON[n.type] || HistoryIcon;
              return (
                <Card key={n.id} style={{ marginBottom: 10, display: "flex", gap: 12, alignItems: "flex-start", animationDelay: `${Math.min(i, 8) * 45}ms` }}>
                  <div style={{ width: 36, height: 36, borderRadius: 11, background: C.brandTint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={16} color={C.brandIcon || C.brandColor} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontSize: T.body, fontWeight: 600, color: C.jet, ...fBody }}>{n.title}</span>
                      <span style={{ fontSize: T.tiny, color: C.slateLight, flexShrink: 0, ...fBody }}>{n.time}</span>
                    </div>
                    <div style={{ fontSize: T.labelLg, color: C.slate, marginTop: 3, lineHeight: 1.45, ...fBody }}>{n.body}</div>
                  </div>
                </Card>
              );
            })}
            </div>
          </>
        )}
      </div>

      <ReceiptSheet booking={receiptTarget} onClose={() => setReceiptTarget(null)} />
    </div>
  );
}
