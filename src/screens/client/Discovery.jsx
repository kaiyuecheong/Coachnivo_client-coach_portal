import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, SlidersHorizontal, ArrowUpDown, ArrowDown, ChevronDown, ChevronRight, Navigation, Star, MapPin, Heart, X, LocateFixed, Calendar, MessageCircle, Sparkles, BadgeCheck, CheckCircle2, Clock, Award, Map as MapIcon, User, LogOut } from "lucide-react";
import { CL, CD, fDisplay, fBody, T, LAYOUT } from "../../theme/theme";
import { useApp } from "../../context/AppContext";

import { COACHES, ALL_SUBURBS, SUBURB_COORDS, PROMO_BANNERS } from "../../data/mockData";
import { getCoachMedia } from "../../data/media";
import { Card, Chip, Badge, SectionLabel, Avatar, Btn, BottomSheet, ConfirmDialog, Spinner, ScrollFadeRow, HandleTag, Skeleton } from "../../components/ui/Primitives";
import { PromoBannerCarousel } from "../../components/ui/PromoBannerCarousel";
import { SportBadge, SportIcon, SportSearchMultiSelect, SportTile } from "../../components/ui/SportUI";
import { POPULAR_SPORTS, SPORT_NAMES } from "../../data/sports";
import { getPublicName } from "../../utils/name";


import { haptic } from "../../utils/haptics";
import { usePullToRefresh } from "../../utils/usePullToRefresh";
import { NotificationBellButton, useUserLocation } from "../../systems/StateSystem";
import { StatusBanner } from "../../components/ui/Banners";
import { LocationField } from "../../components/ui/LocationField";
import { CoachMapView } from "../../components/map/CoachMapView";
import { CardSlider } from "../../components/layout";
import { useResponsive } from "../../theme/responsive";
import { haversineKm, getCoachAreaPoint, FALLBACK_USER_LOCATION, injectMapStyles, CUSTOM_RADIUS_MIN_KM, CUSTOM_RADIUS_MAX_KM } from "../../lib/mapUtils";

// Only the current in-app coach (Josh Whitfield, c2) has a live availability
// toggle driven by app state — every other coach in the directory is static
// mock data, so this is the one card that can flip to "Busy" at runtime.
const LIVE_AVAILABILITY_COACH_ID = "c2";

// Default filters across discover and map views. Radius defaults to null (Any distance)
// so sports and location filters show all relevant coaches unless a radius is explicitly chosen.
const DEFAULT_FILTERS = { sports: [], areas: [], maxPrice: 150, minRating: 0, radiusKm: null, favoritesOnly: false };
const NEARBY_RADIUS_PRESETS = [5, 10, 15, 25];
const SORT_OPTIONS = [
  { value: "recommended", label: "Recommended", detail: "Best overall matches for you" },
  { value: "distance", label: "Distance", detail: "Closest coaches first" },
  { value: "rating", label: "Highest rated", detail: "Top client ratings first" },
  { value: "price", label: "Price: low to high", detail: "Lowest session price first" },
];

const oneLine = { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
const NOOP = () => {};
const PTR_THRESHOLD = 62;

const getApproxCoachDistance = (origin, coach) => {
  const areaPoint = getCoachAreaPoint(coach);
  return areaPoint ? haversineKm(origin, areaPoint) : Infinity;
};

const getCoachAvailabilityStatus = (coach, unavailable) => {
  const isBusy = unavailable || coach.bookingAvailability === "busy";
  return isBusy
    ? { label: "Busy", tone: "neutral", icon: Clock }
    : { label: "Available", tone: "success", icon: Calendar };
};

const getCoachExperienceLabel = (experience) => {
  const raw = String(experience || "").trim();
  const numMatch = raw.match(/\d+/);
  if (numMatch) {
    const n = parseInt(numMatch[0], 10);
    return `${n} ${n === 1 ? "year" : "years"}`;
  }
  const clean = raw.replace(/\s*(coaching|experience)$/i, "").trim();
  return clean ? clean.replace(/\byrs?\b/gi, "years") : "";
};

export function CoachListCard({ coach, onOpen, unavailable, style }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const responsive = typeof useResponsive === "function" ? useResponsive() : null;
  const isDesktop = responsive ? responsive.isDesktop : false;
  const [isHovered, setIsHovered] = useState(false);
  const pub = getPublicName(coach, "public");
  const availabilityStatus = getCoachAvailabilityStatus(coach, unavailable);
  const experienceLabel = getCoachExperienceLabel(coach.experience);

  return (
    <Card
      onClick={onOpen}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      ariaLabel={`View ${pub.name}'s coach profile`}
      style={{
        marginBottom: 12,
        padding: isDesktop ? "16px 18px 16px" : "15px 15px 14px",
        borderRadius: 18,
        border: `1px solid ${C.border}`,
        boxShadow: darkMode
          ? (isHovered ? "0 4px 14px 0 rgba(0, 0, 0, 0.4)" : "none")
          : (isHovered ? "0 4px 12px 0 rgba(22, 24, 29, 0.05)" : "none"),
        background: C.white,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxSizing: "border-box",
        transition: "transform .24s cubic-bezier(0.16, 1, 0.3, 1), box-shadow .24s cubic-bezier(0.16, 1, 0.3, 1)",
        transform: isHovered ? "translateY(-2px)" : "translateY(0)",
        ...style,
      }}
    >
      <div>
        {/* Top Row: Avatar + Details + Availability Badge */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          {/* Avatar with Verified Ring */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <Avatar name={pub.name} src={coach.avatar} size={isDesktop ? 56 : 50} />
            {coach.verified?.identity && (
              <span
                aria-label="Verified coach"
                title="Verified coach"
                style={{
                  position: "absolute",
                  right: -2,
                  bottom: -2,
                  width: 20,
                  height: 20,
                  borderRadius: 999,
                  background: C.white,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <BadgeCheck size={18} color={C.white} fill={C.info} strokeWidth={2.4} />
              </span>
            )}
          </div>

          {/* Coach Name, Handle & Suburb */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, minWidth: 0 }}>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: isDesktop ? 17.5 : T.title,
                  color: C.jet,
                  letterSpacing: "-0.2px",
                  lineHeight: 1.25,
                  ...oneLine,
                  ...fDisplay,
                }}
              >
                {pub.name}
              </span>
            </div>

            {pub.handle && (
              <div style={{ marginTop: 2 }}>
                <HandleTag handle={pub.handle} size={isDesktop ? 12 : 11.5} color={C.slateLight} />
              </div>
            )}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4.5,
                marginTop: 4.5,
                minWidth: 0,
                color: C.slate,
                fontSize: isDesktop ? T.body : T.captionLg,
                ...fBody,
              }}
            >
              <MapPin size={isDesktop ? 13 : 12} color={C.brand} style={{ flexShrink: 0 }} />
              <span style={{ minWidth: 0, ...oneLine }}>{coach.suburb}</span>
            </div>
          </div>

          {/* Right-aligned vertical layout: Rating & Experience (horizontally aligned with coach's name) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              justifyContent: "flex-start",
              gap: 4,
              flexShrink: 0,
              textAlign: "right",
            }}
          >
            {/* Rating */}
            <div
              title={`${coach.rating.toFixed(1)} from ${coach.reviews} reviews`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: isDesktop ? 17.5 : T.title,
                fontWeight: 600,
                color: C.jet,
                letterSpacing: "-0.2px",
                lineHeight: 1.25,
                ...fDisplay,
              }}
            >
              <Star size={isDesktop ? 16 : 15} fill={C.brand} color={C.brand} aria-hidden="true" />
              <span>{coach.rating.toFixed(1)}</span>
              <span style={{ color: C.slateLight, fontWeight: 400, fontSize: isDesktop ? 13.5 : 12.5, ...fBody }}>
                ({coach.reviews})
              </span>
            </div>

            {/* Years of Experience */}
            {experienceLabel && (
              <div
                title={experienceLabel}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  color: C.slate,
                  fontSize: isDesktop ? 17 : T.title,
                  fontWeight: 500,
                  letterSpacing: "-0.2px",
                  lineHeight: 1.2,
                  ...fDisplay,
                }}
              >
                <Award size={isDesktop ? 16 : 15} color={C.brand} aria-hidden="true" style={{ flexShrink: 0 }} />
                <span>{experienceLabel}</span>
              </div>
            )}
          </div>
        </div>

        {/* Middle Row: Sports Badges + Availability Status */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            marginTop: 13,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, minWidth: 0 }}>
            {(coach.sports || [coach.sport]).map((sport) => (
              <SportBadge key={sport} sport={sport} compact />
            ))}
          </div>

          <Badge tone={availabilityStatus.tone} icon={availabilityStatus.icon} style={{ flexShrink: 0, whiteSpace: "nowrap" }}>
            {availabilityStatus.label}
          </Badge>
        </div>
      </div>

      {/* Card Footer: Starting Price & CTA Affordance */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginTop: 14,
          paddingTop: 12,
          borderTop: `1px solid ${C.border}`,
        }}
      >
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 600, color: C.slateLight, textTransform: "uppercase", letterSpacing: "0.45px", ...fBody }}>
            Starting from
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginTop: 1 }}>
            <span style={{ fontSize: isDesktop ? 21 : 19, fontWeight: 700, color: C.jet, lineHeight: 1.1, ...fDisplay }}>
              ${coach.packages[0].price}
            </span>
            <span style={{ fontSize: 11.5, color: C.slateLight, fontWeight: 500, ...fBody }}>
              / session
            </span>
          </div>
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: isDesktop ? "6px 13px" : "6px 11px",
            borderRadius: 10,
            background: C.fog,
            color: C.jet,
            fontSize: isDesktop ? 13 : 12.5,
            fontWeight: 700,
            border: `1px solid ${C.border}`,
            transition: "all .18s ease",
            flexShrink: 0,
            ...fBody,
          }}
        >
          <span>View</span>
          <ChevronRight size={13} color={C.slate} strokeWidth={2.4} aria-hidden="true" style={{ transform: isHovered ? "translateX(2px)" : "none", transition: "transform .18s ease" }} />
        </div>
      </div>
    </Card>
  );
}

/* Banner layout card for the Coaches Near You slider — mirrors the package
   card: cover banner, overlapping avatar, rating, bio snippet, price + CTA. */
function CoachBannerCard({ coach, onOpen, unavailable, style }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const responsive = typeof useResponsive === "function" ? useResponsive() : null;
  const isDesktop = responsive ? responsive.isDesktop : false;
  const [isHovered, setIsHovered] = useState(false);
  const pub = getPublicName(coach, "public");
  const availabilityStatus = getCoachAvailabilityStatus(coach, unavailable);
  const experienceLabel = getCoachExperienceLabel(coach.experience);
  const bannerSrc = coach.coverPhoto || getCoachMedia(coach.id).find((m) => m.type === "photo")?.url;

  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
      aria-label={`View ${pub.name}'s coach profile`}
      style={{
        background: C.white,
        borderRadius: 20,
        border: `1px solid ${C.border}`,
        boxShadow: darkMode
          ? (isHovered ? "0 4px 14px 0 rgba(0, 0, 0, 0.4)" : "none")
          : (isHovered ? "0 4px 12px 0 rgba(22, 24, 29, 0.05)" : "none"),
        transform: isHovered ? "translateY(-2px)" : "translateY(0)",
        transition: "transform .24s cubic-bezier(.16,1,.3,1), box-shadow .24s cubic-bezier(.16,1,.3,1)",
        cursor: "pointer",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        boxSizing: "border-box",
        ...style,
      }}
    >
      {/* Cover banner */}
      <div style={{ position: "relative", height: 132, background: C.fog, overflow: "hidden" }}>
        {bannerSrc ? (
          <img src={bannerSrc} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${C.brandTint} 0%, color-mix(in srgb, ${C.brand} 18%, transparent) 100%)` }} />
        )}
        <div style={{ position: "absolute", top: 12, left: 12, zIndex: 2 }}>
          <Badge tone={availabilityStatus.tone} icon={availabilityStatus.icon}>
            {availabilityStatus.label}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "0 16px 16px", flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ marginTop: -30, marginBottom: 4 }}>
          <div style={{ position: "relative", width: 60 }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", border: `3px solid ${C.white}`, overflow: "hidden", background: C.white, boxShadow: "0 4px 12px rgba(0,0,0,.08)" }}>
              <Avatar name={pub.name} src={coach.avatar} size={54} />
            </div>
            {coach.verified?.identity && (
              <span title="Verified coach" style={{ position: "absolute", right: -4, bottom: -2, width: 20, height: 20, borderRadius: 99, background: C.white, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BadgeCheck size={18} color={C.white} fill={C.brand} strokeWidth={2.5} />
              </span>
            )}
          </div>
        </div>

        {/* Name & Handle + Right-aligned Rating & Experience */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginTop: 6 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <span style={{ fontWeight: 700, fontSize: isDesktop ? 16 : T.title, color: C.jet, letterSpacing: "-0.2px", ...oneLine, ...fDisplay }}>{pub.name}</span>
            {pub.handle && <div style={{ marginTop: 3 }}><HandleTag handle={pub.handle} size={isDesktop ? 13 : 12} color={C.slateLight} /></div>}
          </div>

          {/* Right-aligned vertical layout: Rating & Experience (horizontally aligned with coach's name) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              justifyContent: "flex-start",
              gap: 3,
              flexShrink: 0,
              textAlign: "right",
            }}
          >
            {/* Rating */}
            <div
              title={`${coach.rating.toFixed(1)} from ${coach.reviews} reviews`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: isDesktop ? 16 : T.title,
                fontWeight: 600,
                color: C.jet,
                letterSpacing: "-0.2px",
                lineHeight: 1.25,
                ...fDisplay,
              }}
            >
              <Star size={isDesktop ? 15.5 : 14.5} fill={C.brand} color={C.brand} aria-hidden="true" />
              <span>{coach.rating.toFixed(1)}</span>
              <span style={{ color: C.slateLight, fontWeight: 400, fontSize: isDesktop ? 13 : 12, ...fBody }}>({coach.reviews})</span>
            </div>

            {/* Years of Experience */}
            {experienceLabel && (
              <div
                title={experienceLabel}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  color: C.slate,
                  fontSize: isDesktop ? 15.5 : T.title,
                  fontWeight: 500,
                  letterSpacing: "-0.2px",
                  lineHeight: 1.2,
                  ...fDisplay,
                }}
              >
                <Award size={isDesktop ? 15.5 : 14.5} color={C.brand} aria-hidden="true" style={{ flexShrink: 0 }} />
                <span>{experienceLabel}</span>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 7, color: C.slate, fontSize: isDesktop ? 13 : T.captionLg, ...fBody }}>
          <MapPin size={12} color={C.brand} style={{ flexShrink: 0 }} />
          <span style={{ ...oneLine }}>{coach.suburb}</span>
          {coach.liveDistanceKm != null && isFinite(coach.liveDistanceKm) && (
            <span style={{ color: C.slateLight, flexShrink: 0 }}>• {Math.round(coach.liveDistanceKm)} km</span>
          )}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 16, marginBottom: 14 }}>
          {(coach.sports || [coach.sport]).slice(0, 3).map((sport) => <SportBadge key={sport} sport={sport} compact style={{ fontSize: 13 }} />)}
        </div>

        <div style={{ marginTop: "auto", paddingTop: 14, borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, color: C.slateLight, fontWeight: 600, ...fBody }}>Starting from</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
              <span style={{ fontSize: isDesktop ? 18 : 17, fontWeight: 700, color: C.jet, ...fDisplay }}>${coach.packages[0]?.price || 85}</span>
              <span style={{ fontSize: 11, color: C.slate, fontWeight: 500, ...fBody }}>/ session</span>
            </div>
          </div>
          <div style={{ padding: "7px 12px", borderRadius: 10, background: C.fog, color: C.jet, fontSize: 12.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, flexShrink: 0, border: `1px solid ${C.border}`, transition: "all .15s ease", ...fBody }}>
            <span>View</span>
            <ChevronRight size={13} color={C.slate} strokeWidth={2.4} style={{ transform: isHovered ? "translateX(2px)" : "none", transition: "transform .18s ease" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function TopRecommendationCard({ coach, onOpen }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const pub = getPublicName(coach, "public");
  const availabilityStatus = getCoachAvailabilityStatus(coach, false);
  const experienceLabel = getCoachExperienceLabel(coach.experience);
  return (
    <Card
      onClick={onOpen}
      ariaLabel={`View ${pub.name}'s coach profile`}
      style={{
        width: 172,
        flexShrink: 0,
        padding: "14px 13px 12px",
        borderRadius: 18,
        border: `1px solid ${C.border}`,
        boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
        background: C.white,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        animation: "clFadeUp .4s cubic-bezier(.22,1,.36,1) backwards",
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <div style={{ position: "relative" }}>
            <Avatar name={pub.name} src={coach.avatar} size={44} />
            {coach.verified?.identity && (
              <span aria-label="Verified coach" style={{ position: "absolute", right: -2, bottom: -2, width: 16, height: 16, borderRadius: 99, background: C.white, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BadgeCheck size={15} color={C.white} fill={C.info} />
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 3, padding: "3px 7px", borderRadius: 999, background: C.brandTint, color: C.brand, fontSize: T.caption, fontWeight: 700, ...fBody }}>
            <Star size={11} fill={C.brand} color={C.brand} />
            <span>{coach.rating.toFixed(1)}</span>
          </div>
        </div>

        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: T.body, fontWeight: 700, color: C.jet, letterSpacing: "-0.1px", ...oneLine, ...fDisplay }}>{pub.name}</div>
          <div style={{ marginTop: 6 }}>
            <SportBadge sport={coach.sport} compact />
          </div>
          <div title={experienceLabel} style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4, color: C.slateLight, fontSize: T.caption, ...fBody }}>
            <Award size={12} color={C.brand} aria-hidden="true" />
            <span style={{ minWidth: 0, ...oneLine }}>{experienceLabel}</span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
        <div>
          <div style={{ fontSize: T.micro, color: C.slateLight, lineHeight: 1, ...fBody }}>Starting</div>
          <div style={{ marginTop: 3, fontSize: T.bodyLg, fontWeight: 700, color: C.jet, lineHeight: 1, ...fDisplay }}>${coach.packages[0]?.price}</div>
        </div>
        <Badge tone={availabilityStatus.tone} icon={availabilityStatus.icon} style={{ padding: "3px 6px", fontSize: T.micro, whiteSpace: "nowrap" }}>
          {availabilityStatus.label}
        </Badge>
      </div>
    </Card>
  );
}

function ListSkeleton({ rows = 4 }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  return (
    <div aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} style={{ marginBottom: 12, padding: 14, borderRadius: LAYOUT.cardRadius, border: `1px solid ${C.border}`, background: C.white, opacity: 1 - i * 0.15 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <Skeleton w={56} h={56} radius={99} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <Skeleton w="58%" h={13} radius={7} />
              <Skeleton w="34%" h={10} radius={7} style={{ marginTop: 9 }} />
              <Skeleton w="46%" h={22} radius={8} style={{ marginTop: 12 }} />
            </div>
            <Skeleton w={44} h={13} radius={7} style={{ flexShrink: 0 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------
   Post-sign-up guided tour — a 5-step centered modal shown the moment a
   client lands on Discover right after finishing onboarding. Steps 1–4 are
   pure orientation (Continue advances); step 5 hands off straight into the
   Personalised Coach Recommendation modal via its own "Find My Coaches" CTA,
   with "Skip for Now" as the escape hatch at every step.
   ------------------------------------------------------------------------- */
const GUIDE_STEPS = [
  {
    icon: Search,
    header: "Find Coaches That Match You",
    description: "Search for coaches based on your sport, location, price range, availability, and ratings to find options that fit your needs.",
    cta: "Continue",
  },
  {
    icon: Star,
    header: "Find the Right Fit",
    description: "Explore coach profiles, watch their reels, view their rates, and read reviews to help you choose a coach with confidence.",
    cta: "Continue",
  },
  {
    icon: Calendar,
    header: "Book When You're Ready",
    description: "Choose a session that works for you and book with confidence. Depending on the coach, you can either book instantly or send a booking request for approval.",
    cta: "Continue",
  },
  {
    icon: MessageCircle,
    header: "Chat With Your Coach",
    description: "Have a question before or after your session? Message your coach directly through CoachNivo to discuss your booking and coaching needs.",
    cta: "Continue",
  },
  {
    icon: Sparkles,
    header: "Let's Find Your Perfect Coach",
    description: "Answer a few quick questions about what you're looking for, and we'll curate coach recommendations based on your interests, goals, and location.",
    cta: "Find My Coaches",
    secondaryCta: "Skip for Now",
  },
];

export function PostSignupGuideModal({ open, onClose, onFindCoaches }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const [step, setStep] = useState(0);

  // Always start from step 1 whenever the guide (re)opens.
  useEffect(() => { if (open) setStep(0); }, [open]);

  if (!open) return null;

  const total = GUIDE_STEPS.length;
  const isLast = step === total - 1;
  const current = GUIDE_STEPS[step];
  const Icon = current.icon;

  const handlePrimary = () => {
    if (isLast) onFindCoaches();
    else setStep(s => s + 1);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: C.white, display: "flex", alignItems: "center", justifyContent: "center", padding: 40, boxSizing: "border-box", overflowY: "auto" }}>
      <button type="button" onClick={onClose} aria-label="Skip for now" style={{ position: "absolute", top: 20, right: 20, width: 44, height: 44, borderRadius: 999, background: C.fog, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <X size={16} color={C.slate} />
      </button>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Welcome to CoachNivo"
        style={{
          width: "min(100%, 560px)",
          display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
          animation: "clPopIn .22s cubic-bezier(.32,.72,0,1)",
        }}
      >
        <div style={{ width: 84, height: 84, borderRadius: 26, background: C.brandTint, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, flexShrink: 0, overflow: "hidden" }}>
          <Icon size={34} color={C.brand} style={{ flexShrink: 0 }} />
        </div>

        <div style={{ fontSize: T.displayLg, fontWeight: 700, color: C.jet, ...fDisplay }}>{current.header}</div>
        <div style={{ fontSize: T.subtitleLg, color: C.slate, marginTop: 16, lineHeight: 1.65, ...fBody }}>{current.description}</div>

        <div style={{ width: "100%", marginTop: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <Btn full onClick={handlePrimary}>{current.cta}</Btn>
          {current.secondaryCta && (
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 0", fontSize: T.bodyLg, fontWeight: 600, color: C.slate, ...fBody }}>
              {current.secondaryCta}
            </button>
          )}
        </div>

        {/* Progress indicator — one dot per step, filled = current, plus "x of n" */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 48, flexShrink: 0 }}>
          {Array.from({ length: total }, (_, i) => (
            <span key={i} style={{
              width: 8, height: 8, borderRadius: 99, flexShrink: 0,
              background: i === step ? C.brand : C.border, transition: "background .15s ease",
            }} />
          ))}
        </div>
        <div style={{ fontSize: T.body, fontWeight: 600, color: C.slateLight, marginTop: 8, flexShrink: 0, ...fBody }}>
          {step + 1} of {total}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   Personalised Coach Recommendation modal — shown when a first-time client
   taps "Find My Coaches" on the empty Discover screen. Collects location,
   search radius, sport interests and (optional) goals, then hands the
   preferences back so the caller can populate the Coach Listings section.
   ------------------------------------------------------------------------- */
export function PersonalisedRecommendationModal({ open, onClose, onSubmit }) {
  const { darkMode, clientPrefs } = useApp();
  const C = darkMode ? CD : CL;
  const [location, setLocation] = useState(null);
  const [radiusKm, setRadiusKm] = useState(10);
  const isPresetRadius = NEARBY_RADIUS_PRESETS.includes(radiusKm);
  const [showCustomRadius, setShowCustomRadius] = useState(false);
  const [customRadius, setCustomRadius] = useState("");
  const [sports, setSports] = useState([]);
  // Brief "processing" delay after submit so the platform visibly appears to
  // crunch the client's preferences before handing back curated matches,
  // rather than snapping straight to results.
  const [submitting, setSubmitting] = useState(false);

  // The location saved during account creation is reused here so the client
  // isn't asked for it twice; the same structured suburb picker as account
  // setup lets them detect their position or search for a different suburb.
  const savedLocation = clientPrefs?.location || null;

  // Reset the form every time the sheet is (re)opened so a previous session's
  // input doesn't linger if the client closes it and comes back later.
  useEffect(() => {
    if (open) {
      setLocation(savedLocation);
      setRadiusKm(10);
      setShowCustomRadius(false);
      setCustomRadius("");
      setSports([]);
      setSubmitting(false);
    }
  }, [open]);

  const toggleSport = (s) => setSports((arr) => (arr.includes(s) ? arr.filter((x) => x !== s) : [...arr, s]));

  const applyCustomRadius = () => {
    const val = Number(customRadius);
    if (val >= CUSTOM_RADIUS_MIN_KM && val <= CUSTOM_RADIUS_MAX_KM) { setRadiusKm(val); setShowCustomRadius(false); }
  };

  const canSubmit = !!location;

  const handleSubmit = () => {
    setSubmitting(true);
    // Simulated processing delay — gives the "generating recommendations"
    // state a moment to register before the sheet closes into results.
    setTimeout(() => {
      onSubmit({
        locationText: location.suburb,
        radiusKm,
        sports,
      });
    }, 1400);
  };

  return (
    <BottomSheet open={open} onClose={submitting ? () => {} : onClose} title="Personalise Your Recommendations" heightPct={92}>
      <SectionLabel required>Your Location</SectionLabel>
      <div style={{ marginBottom: 26 }}>
        <LocationField
          value={location}
          onChange={setLocation}
          label=""
          placeholder="Search suburb or postcode…"
          helper="We'll use this to find coaches near you."
        />
      </div>
      <div style={{ marginBottom: 26 }}>
        {showCustomRadius ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="number" min={CUSTOM_RADIUS_MIN_KM} max={CUSTOM_RADIUS_MAX_KM} value={customRadius}
              onChange={(e) => setCustomRadius(e.target.value)}
              placeholder={`${CUSTOM_RADIUS_MIN_KM}–${CUSTOM_RADIUS_MAX_KM}`}
              style={{ flex: 1, boxSizing: "border-box", background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 13, padding: "11px 13px", fontSize: T.bodyLg, color: C.jet, outline: "none", ...fBody }}
            />
            <span style={{ fontSize: T.bodyLg, color: C.slate, ...fBody }}>km</span>
            <button onClick={applyCustomRadius} style={{ padding: "11px 16px", borderRadius: 12, border: "none", background: C.black, color: C.white, fontSize: T.labelLg, fontWeight: 700, cursor: "pointer", ...fBody }}>Set</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {NEARBY_RADIUS_PRESETS.map((km) => (
              <Chip key={km} active={radiusKm === km} onClick={() => setRadiusKm(km)}>{km} km</Chip>
            ))}
            <Chip active={!isPresetRadius} onClick={() => { setCustomRadius(String(radiusKm)); setShowCustomRadius(true); }}>
              {!isPresetRadius ? `Custom · ${radiusKm} km` : "Custom"}
            </Chip>
          </div>
        )}
      </div>

      <SectionLabel>Sports Interests</SectionLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 26 }}>
        {POPULAR_SPORTS.slice(0, 10).map((s) => <SportBadge key={s} sport={s} selected={sports.includes(s)} onClick={() => toggleSport(s)} compact />)}
      </div>
      <div style={{ marginTop: -12, marginBottom: 26 }}>
        <SportSearchMultiSelect options={SPORT_NAMES} value={sports} onChange={setSports} placeholder="Search all sports…" />
      </div>

      <Btn full disabled={!canSubmit} loading={submitting} loadingText="Finding your matches…" onClick={handleSubmit}>Find My Coaches</Btn>
    </BottomSheet>
  );
}

export function ScreenClientHome({ nav, params = {}, favorites = [], toggleFav, filters, onFiltersChange, clientNotifications: notifications = [], coachAvailableNow, isFirstTimeClient, discoveryPrefs, setDiscoveryPrefs, showPostSignupGuide, setShowPostSignupGuide }) {
  const { darkMode, clientIdentity, resetNav } = useApp();
  const C = darkMode ? CD : CL;
  const { isDesktop, isTablet, isMobile } = useResponsive();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountName = [clientIdentity?.firstName, clientIdentity?.lastName].filter(Boolean).join(" ") || "Your account";
  const accountEmail = clientIdentity?.email || "";
  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const unreadCount = safeNotifications.filter(n => n?.unread).length;

  const accountMenuCluster = (
    <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative" }}>
      <NotificationBellButton count={unreadCount} onClick={() => nav("notifications")} />
      <button type="button" aria-label="Open account menu" onClick={() => setAccountMenuOpen((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 6px 4px 4px", borderRadius: 999, border: `1px solid ${C.border}`, background: C.fog, cursor: "pointer" }}>
        <Avatar name={accountName} size={32} />
        <ChevronDown size={14} color={C.slate} />
      </button>
      {accountMenuOpen && (
        <>
          <button type="button" aria-label="Close account menu" onClick={() => setAccountMenuOpen(false)} style={{ position: "fixed", inset: 0, border: "none", background: "transparent", cursor: "default", zIndex: 60 }} />
          <div style={{ position: "absolute", top: "calc(100% + 10px)", right: 0, width: 248, background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, boxShadow: "0 18px 48px -18px rgba(22,24,29,.4)", padding: 8, zIndex: 61 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderBottom: `1px solid ${C.border}`, marginBottom: 8 }}>
              <Avatar name={accountName} size={40} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: T.bodyLg, fontWeight: 700, color: C.jet, ...oneLine, ...fDisplay }}>{accountName}</div>
                <div style={{ fontSize: T.captionLg, color: C.slate, ...oneLine, ...fBody }}>{accountEmail || "Manage your account"}</div>
              </div>
            </div>
            {[
              { icon: User, label: "My account", to: () => nav("client-profile") },
              { icon: Calendar, label: "Bookings", to: () => nav("client-dashboard") },
              { icon: MessageCircle, label: "Help & support", to: () => nav("support") },
            ].map((row) => (
              <button key={row.label} type="button" onClick={() => { setAccountMenuOpen(false); row.to(); }} style={{ width: "100%", minHeight: 44, display: "flex", alignItems: "center", gap: 10, padding: "0 12px", border: "none", borderRadius: 10, background: "transparent", color: C.jet, fontSize: T.body, fontWeight: 500, cursor: "pointer", textAlign: "left", ...fBody }}>
                <row.icon size={16} color={C.slate} />
                {row.label}
              </button>
            ))}
            <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 6, paddingTop: 6 }}>
              <button type="button" onClick={() => { setAccountMenuOpen(false); setSignOutConfirmOpen(true); }} style={{ width: "100%", minHeight: 44, display: "flex", alignItems: "center", gap: 10, padding: "0 12px", border: "none", borderRadius: 10, background: "transparent", color: C.danger, fontSize: T.body, fontWeight: 600, cursor: "pointer", textAlign: "left", ...fBody }}>
                <LogOut size={16} /> Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
  const heroText = darkMode ? C.jet : CL.white;
  const heroMuted = `color-mix(in srgb, ${heroText} 76%, transparent)`;
  const heroBackground = darkMode
    ? "#0B1B2B"
    : `linear-gradient(145deg, ${C.brandColor} 0%, ${C.brand} 62%, color-mix(in srgb, ${C.secondary} 76%, ${C.accent} 24%) 100%)`;
  // A coach profile opened from the map returns here with this flag so the
  // user lands back on the map, not the underlying Discover list.
  const [mapOpen, setMapOpen] = useState(() => params.mapOpen === true);
  const [prefsModalOpen, setPrefsModalOpen] = useState(false);
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);
  const [activeSheet, setActiveSheet] = useState(null);
  const [sortBy, setSortBy] = useState("recommended");
  const [filterDraft, setFilterDraft] = useState(DEFAULT_FILTERS);
  const [locationQuery, setLocationQuery] = useState("");
  const [listLoading, setListLoading] = useState(false);

  // Pull-to-refresh replays the skeleton refresh for a tactile "checking for
  // new coaches" moment on real devices (no-op with a mouse).
  const handleRefresh = () => {
    haptic(12);
    setListLoading(true);
    setTimeout(() => setListLoading(false), 750);
  };
  const ptr = usePullToRefresh({ onRefresh: handleRefresh, threshold: PTR_THRESHOLD });
  const ptrReady = ptr.pull >= PTR_THRESHOLD;
  // Defaults to the tightest "Nearby" (0–5 km) band; the control for changing
  // it lives in Filters, same as sport/area/price/rating.
  const { userLocation, locating, permissionDenied, manualLabel, requestLocation, setManualLocation } = useUserLocation();

  // The pulse CSS the location pill reuses is normally injected by the map
  // view — bring it in here too so it still looks right before opening the map.
  // Re-runs on dark-mode flips so pulse/accent colors stay in sync.
  useEffect(() => { injectMapStyles(C); }, [C]);

  const [localFilters, setLocalFilters] = useState(DEFAULT_FILTERS);
  const appliedFilters = useMemo(() => {
    const src = filters || localFilters;
    return {
      ...DEFAULT_FILTERS,
      ...(src || {}),
      sports: (src && Array.isArray(src.sports)) ? src.sports : DEFAULT_FILTERS.sports,
      areas: (src && Array.isArray(src.areas)) ? src.areas : DEFAULT_FILTERS.areas,
    };
  }, [filters, localFilters]);
  const updateAppliedFilters = patch => {
    const next = { ...appliedFilters, ...patch };
    if (onFiltersChange) onFiltersChange(next);
    setLocalFilters(next);
  };
  const setAppliedFilters = updateAppliedFilters;
  const radiusKm = appliedFilters.radiusKm ?? null;
  const safeFavorites = Array.isArray(favorites) ? favorites : [];

  // First-time clients haven't told us what they're looking for yet, so the
  // Coach Listings section stays empty and prompts for preferences instead
  // of showing every coach in the directory.
  const showRecommendationPrompt = !discoveryPrefs;

  const handleBannerSelect = (banner) => {
    haptic(10);
    if (banner.coachId) {
      nav("coach-profile", { id: banner.coachId });
    } else if (banner.sport) {
      updateAppliedFilters({ sports: [banner.sport] });
    }
  };

  const handlePrefsSubmit = (prefs) => {
    haptic(12);
    setDiscoveryPrefs?.(prefs);
    updateAppliedFilters({
      sports: prefs.sports,
      radiusKm: prefs.radiusKm,
      areas: prefs.locationText ? [prefs.locationText] : appliedFilters.areas,
    });
    setPrefsModalOpen(false);
  };

  // Live distance from wherever the user actually is right now, falling back
  // to the same default point the map uses until a real fix comes in.
  const origin = userLocation || FALLBACK_USER_LOCATION;
  const nearestLocationLabel = useMemo(() => {
    if (manualLabel) return manualLabel;
    const nearest = Object.entries(SUBURB_COORDS).reduce((best, [label, coords]) => {
      const distance = haversineKm(origin, coords);
      return !best || distance < best.distance ? { label, distance } : best;
    }, null);
    return nearest?.label || "Chatswood, Sydney";
  }, [manualLabel, permissionDenied, origin.lat, origin.lng]);
  const withDistance = useMemo(
    () => COACHES.map(c => ({ ...c, liveDistanceKm: Math.round(getApproxCoachDistance(origin, c) * 10) / 10 })),
    [origin.lat, origin.lng]
  );

  // Shared list/map filtering. Both discovery surfaces consume the same
  // applied sport, area, price, rating, distance, and saved-coach criteria.
  const searchAndAreaFiltered = useMemo(() => withDistance.filter(c => {
    const matchesAreas = !appliedFilters.areas?.length || appliedFilters.areas.some(a => (c.suburb || "").toLowerCase().includes(a.toLowerCase()));
    const matchesSport = !appliedFilters.sports?.length || appliedFilters.sports.some(sp => {
      const spLower = sp.toLowerCase();
      return (c.sport && c.sport.toLowerCase() === spLower)
        || (c.sports && c.sports.some(s => s.toLowerCase() === spLower))
        || (c.tags && c.tags.some(t => t.toLowerCase() === spLower))
        || (c.packages && c.packages.some(p => (p.sport && p.sport.toLowerCase() === spLower) || (p.name && p.name.toLowerCase().includes(spLower))));
    });
    const matchesPrice = c.packages && c.packages[0] ? c.packages[0].price <= (appliedFilters.maxPrice ?? DEFAULT_FILTERS.maxPrice) : true;
    const matchesRating = c.rating >= (appliedFilters.minRating ?? 0);
    const matchesFavorite = !appliedFilters.favoritesOnly || safeFavorites.includes(c.id);
    return matchesAreas && matchesSport && matchesPrice && matchesRating && matchesFavorite;
  }), [withDistance, appliedFilters, safeFavorites]);
  const filtered = useMemo(() => {
    const matches = searchAndAreaFiltered.filter(c => radiusKm == null || c.liveDistanceKm <= radiusKm);
    return [...matches].sort((a, b) => {
      if (sortBy === "rating") return b.rating - a.rating || a.liveDistanceKm - b.liveDistanceKm;
      if (sortBy === "price") return a.packages[0].price - b.packages[0].price || b.rating - a.rating;
      if (sortBy === "distance") return a.liveDistanceKm - b.liveDistanceKm;
      const score = coach => (coach.rating * 20) - coach.liveDistanceKm;
      return score(b) - score(a);
    });
  }, [searchAndAreaFiltered, radiusKm, sortBy]);

  // Count filter categories rather than every selected value, keeping the
  // sticky control compact even when several sports or areas are selected.
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.areas?.length) count += 1;
    if (appliedFilters.sports?.length) count += 1;
    const maxPrice = appliedFilters.maxPrice ?? DEFAULT_FILTERS.maxPrice;
    if (maxPrice !== DEFAULT_FILTERS.maxPrice) count += 1;
    const minRating = appliedFilters.minRating ?? 0;
    if (minRating > 0) count += 1;
    if (appliedFilters.radiusKm != null) count += 1;
    if (appliedFilters.favoritesOnly) count += 1;
    return count;
  }, [appliedFilters]);
  const hasActiveFilters = activeFilterCount > 0;
  const appliedFilterTokens = [
    ...(appliedFilters.sports || []).map(sport => ({
      key: `sport-${sport}`,
      label: sport,
      icon: <SportIcon sport={sport} size={13} color={C.brand} />,
      remove: () => updateAppliedFilters({ sports: appliedFilters.sports.filter(item => item.toLowerCase() !== sport.toLowerCase()) }),
    })),
    ...(appliedFilters.areas || []).map(area => ({
      key: `area-${area}`,
      label: area,
      icon: <MapPin size={13} color={C.brand} aria-hidden="true" />,
      remove: () => updateAppliedFilters({ areas: appliedFilters.areas.filter(item => item !== area) }),
    })),
    ...((appliedFilters.maxPrice ?? DEFAULT_FILTERS.maxPrice) !== DEFAULT_FILTERS.maxPrice ? [{
      key: "price",
      label: `Up to $${appliedFilters.maxPrice}`,
      remove: () => updateAppliedFilters({ maxPrice: DEFAULT_FILTERS.maxPrice }),
    }] : []),
    ...((appliedFilters.minRating ?? 0) > 0 ? [{
      key: "rating",
      label: `${appliedFilters.minRating}+ rating`,
      icon: <Star size={12} color={C.brand} fill={C.brand} aria-hidden="true" />,
      remove: () => updateAppliedFilters({ minRating: 0 }),
    }] : []),
    ...(appliedFilters.radiusKm != null ? [{
      key: "distance",
      label: `Within ${appliedFilters.radiusKm} km`,
      remove: () => updateAppliedFilters({ radiusKm: null }),
    }] : []),
    ...(appliedFilters.favoritesOnly ? [{
      key: "favorites",
      label: "Saved coaches",
      icon: <Heart size={12} color={C.brand} fill={C.brand} aria-hidden="true" />,
      remove: () => updateAppliedFilters({ favoritesOnly: false }),
    }] : []),
  ];
  const visibleFilterTokens = appliedFilterTokens;

  // Filter and sort changes briefly show shimmer rows so list updates read as
  // a deliberate refresh rather than an abrupt swap.
  useEffect(() => {
    setListLoading(true);
    const timer = setTimeout(() => setListLoading(false), 520);
    return () => clearTimeout(timer);
  }, [appliedFilters, sortBy]);

  // "Recommended for you" rail — top-rated, high-match coaches based on the client's profile
  const recommendedCoaches = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => (b.rating * 20 + b.reviews) - (a.rating * 20 + a.reviews));
    return sorted.length > 0 ? sorted.slice(0, 8) : [];
  }, [filtered]);

  const toggleQuickSport = sport => {
    const current = appliedFilters.sports || [];
    const exists = current.some(s => s.toLowerCase() === sport.toLowerCase());
    const next = exists
      ? current.filter(s => s.toLowerCase() !== sport.toLowerCase())
      : [...current, sport];
    haptic(8);
    updateAppliedFilters({ sports: next });
  };

  const openFilters = () => {
    setFilterDraft({ ...appliedFilters, sports: [...appliedFilters.sports], areas: [...appliedFilters.areas] });
    setActiveSheet("filters");
  };
  const updateDraft = patch => setFilterDraft(current => ({ ...current, ...patch }));
  const draftPreviewCount = useMemo(() => COACHES.filter(c => {
    const distance = getApproxCoachDistance(origin, c);
    const matchesSport = !filterDraft.sports?.length || filterDraft.sports.some(sp => {
      const spLower = sp.toLowerCase();
      return (c.sport && c.sport.toLowerCase() === spLower)
        || (c.sports && c.sports.some(s => s.toLowerCase() === spLower))
        || (c.tags && c.tags.some(t => t.toLowerCase() === spLower))
        || (c.packages && c.packages.some(p => (p.sport && p.sport.toLowerCase() === spLower) || (p.name && p.name.toLowerCase().includes(spLower))));
    });
    const matchesArea = !filterDraft.areas?.length || filterDraft.areas.some(a => (c.suburb || "").toLowerCase().includes(a.toLowerCase()));
    const matchesPrice = c.packages && c.packages[0] ? c.packages[0].price <= (filterDraft.maxPrice ?? DEFAULT_FILTERS.maxPrice) : true;
    const matchesRating = c.rating >= (filterDraft.minRating ?? 0);
    const matchesFav = !filterDraft.favoritesOnly || safeFavorites.includes(c.id);
    const matchesRadius = filterDraft.radiusKm == null || distance <= filterDraft.radiusKm;
    return matchesSport && matchesArea && matchesPrice && matchesRating && matchesFav && matchesRadius;
  }).length, [filterDraft, origin.lat, origin.lng, safeFavorites]);
  const locationSuggestions = locationQuery.trim()
    ? ALL_SUBURBS.filter(s => s.toLowerCase().includes(locationQuery.trim().toLowerCase())).slice(0, 5)
    : ["Chatswood, Sydney", ...ALL_SUBURBS.filter(s => s !== "Chatswood, Sydney")].slice(0, 4);
  const chooseLocation = suburb => {
    const coords = SUBURB_COORDS[suburb];
    if (coords) setManualLocation(coords, suburb);
    setLocationQuery("");
    setActiveSheet(null);
  };

  const prefsModal = (
    <PersonalisedRecommendationModal
      open={prefsModalOpen}
      onClose={() => setPrefsModalOpen(false)}
      onSubmit={handlePrefsSubmit}
    />
  );

  const guideModal = (
    <PostSignupGuideModal
      open={!!showPostSignupGuide}
      onClose={() => setShowPostSignupGuide?.(false)}
      onFindCoaches={() => { setShowPostSignupGuide?.(false); setPrefsModalOpen(true); }}
    />
  );

  const sortSheet = (
    <BottomSheet open={activeSheet === "sort"} onClose={() => setActiveSheet(null)} title="Sort coaches" heightPct={54}>
      <div style={{ fontSize: T.body, color: C.slate, marginBottom: 8, ...fBody }}>Choose how results are ordered.</div>
      <div role="radiogroup" aria-label="Sort coaches">
      {SORT_OPTIONS.map(option => {
        const selected = sortBy === option.value;
        return (
          <button key={option.value} type="button" role="radio" aria-checked={selected} onClick={() => { haptic(8); setSortBy(option.value); setActiveSheet(null); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, textAlign: "left", padding: "12px", marginBottom: 8, background: selected ? C.brandTint : C.fog, border: "none", borderRadius: 14, cursor: "pointer" }}>
            <span aria-hidden="true" style={{ width: 21, height: 21, borderRadius: 999, border: `2px solid ${selected ? C.brand : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {selected && <span style={{ width: 11, height: 11, borderRadius: 999, background: C.brand }} />}
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: T.bodyLg, fontWeight: 700, color: C.jet, ...fBody }}>{option.label}</span>
              <span style={{ display: "block", fontSize: T.captionLg, color: C.slate, marginTop: 2, ...fBody }}>{option.detail}</span>
            </span>
          </button>
        );
      })}
      </div>
    </BottomSheet>
  );

  const locationSheet = (
    <BottomSheet open={activeSheet === "location"} onClose={() => setActiveSheet(null)} title="Choose your location" heightPct={68}>
      <button type="button" onClick={() => { requestLocation(); setActiveSheet(null); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", borderRadius: 14, border: `1px solid ${C.brand}`, background: C.brandTint, color: C.brand, cursor: "pointer", textAlign: "left" }}>
        <span style={{ width: 38, height: 38, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: C.white, flexShrink: 0 }}>
          {locating ? <Spinner size={16} color={C.brand} /> : <LocateFixed size={18} />}
        </span>
        <span style={{ flex: 1 }}>
          <span style={{ display: "block", fontSize: T.bodyLg, fontWeight: 700, ...fBody }}>{locating ? "Locating you…" : "Use current location"}</span>
          <span style={{ display: "block", fontSize: T.captionLg, color: C.slate, marginTop: 2, ...fBody }}>Update nearby coach distances</span>
        </span>
        <ChevronRight size={17} />
      </button>

      <div style={{ position: "relative", marginTop: 16 }}>
        <div className="cl-input" style={{ minHeight: 48, display: "flex", alignItems: "center", gap: 9, padding: "0 13px", borderRadius: 13, border: `1.5px solid ${C.border}`, background: C.white }}>
          <Search size={16} color={C.slateLight} />
          <input name="location-search" type="search" autoComplete="off" aria-label="Search suburb or area" value={locationQuery} onChange={e => setLocationQuery(e.target.value)} placeholder="Search suburb or area" style={{ flex: 1, minWidth: 0, minHeight: 44, padding: 0, border: "none", outline: "none", background: "transparent", fontSize: T.bodyLg, color: C.jet, ...fBody }} />
        </div>
      </div>

      <div style={{ marginTop: 18, marginBottom: 4, fontSize: T.labelLg, fontWeight: 700, color: C.jet, ...fDisplay }}>{locationQuery ? "Matching locations" : "Popular nearby"}</div>
      {locationSuggestions.map(suburb => (
        <button key={suburb} type="button" onClick={() => chooseLocation(suburb)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 11, padding: "8px 10px", marginBottom: 6, border: "none", borderRadius: 14, background: C.fog, color: C.jet, cursor: "pointer", textAlign: "left" }}>
          <span style={{ width: 36, height: 36, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: C.fog, flexShrink: 0 }}><MapPin size={16} color={C.brand} /></span>
          <span style={{ flex: 1, fontSize: T.bodyLg, fontWeight: 600, ...fBody }}>{suburb}</span>
          <ChevronRight size={16} color={C.slateLight} />
        </button>
      ))}
    </BottomSheet>
  );

  const filterSheet = (
    <BottomSheet
      open={activeSheet === "filters"}
      onClose={() => setActiveSheet(null)}
      title="Filters"
      heightPct={88}
      footer={(
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="outline" onClick={() => setFilterDraft({ ...DEFAULT_FILTERS, sports: [], areas: [] })}>Reset</Btn>
          <div style={{ flex: 1 }}>
            <Btn full onClick={() => { haptic(12); setAppliedFilters(filterDraft); setActiveSheet(null); }}>Show {draftPreviewCount} result{draftPreviewCount === 1 ? "" : "s"}</Btn>
          </div>
        </div>
      )}
    >
      <div style={{ fontSize: T.body, color: C.slate, lineHeight: 1.5, marginBottom: 20, ...fBody }}>Refine results without leaving Discover.</div>

      {/*
        Coach-only portal: the provider toggle (coaches ⇄ businesses) and the
        connected "Looking for" choice were excluded with the business scope.
      */}
      <SectionLabel>Favorites</SectionLabel>
      <button
        type="button"
        aria-pressed={!!filterDraft.favoritesOnly}
        onClick={() => updateDraft({ favoritesOnly: !filterDraft.favoritesOnly })}
        style={{ width: "100%", minHeight: 56, display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", marginBottom: 24, border: "none", borderRadius: 16, background: filterDraft.favoritesOnly ? C.brandTint : C.fog, color: C.jet, cursor: "pointer", textAlign: "left" }}
      >
        <span style={{ width: 38, height: 38, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: C.white, flexShrink: 0 }}>
          <Heart size={17} color={filterDraft.favoritesOnly ? C.brand : C.slate} fill={filterDraft.favoritesOnly ? C.brand : "none"} />
        </span>
        <span style={{ minWidth: 0, flex: 1 }}>
          <span style={{ display: "block", fontSize: T.bodyLg, fontWeight: 700, color: C.jet, ...fBody }}>Favorites only</span>
          <span style={{ display: "block", marginTop: 2, fontSize: T.captionLg, color: C.slate, ...fBody }}>Show coaches you have saved</span>
        </span>
        <span aria-hidden="true" style={{ width: 42, height: 24, padding: 3, boxSizing: "border-box", borderRadius: 999, background: filterDraft.favoritesOnly ? C.brand : C.border, display: "flex", justifyContent: filterDraft.favoritesOnly ? "flex-end" : "flex-start", transition: "background .18s ease" }}>
          <span style={{ width: 18, height: 18, borderRadius: 999, background: C.white }} />
        </span>
      </button>

      <SectionLabel>Distance</SectionLabel>
      <div style={{ display: "grid", gap: 8, marginBottom: 24 }}>
        {[...NEARBY_RADIUS_PRESETS.map(km => ({ value: km, label: `Within ${km} km` })), { value: null, label: "Any distance" }].map((option) => {
          const selected = filterDraft.radiusKm === option.value;
          return (
            <button key={option.label} type="button" role="radio" aria-checked={selected} onClick={() => updateDraft({ radiusKm: option.value })} style={{ width: "100%", minHeight: 48, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px", border: "none", borderRadius: 13, background: selected ? C.brandTint : C.fog, color: C.jet, cursor: "pointer", textAlign: "left", fontSize: T.bodyLg, fontWeight: selected ? 700 : 500, ...fBody }}>
              {option.label}
              <span aria-hidden="true" style={{ width: 20, height: 20, borderRadius: 999, border: `2px solid ${selected ? C.brand : C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>{selected && <span style={{ width: 10, height: 10, borderRadius: 999, background: C.brand }} />}</span>
            </button>
          );
        })}
      </div>

      <SectionLabel>Sport</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        {POPULAR_SPORTS.slice(0, 10).map((sport) => {
          const selected = filterDraft.sports?.some(s => s.toLowerCase() === sport.toLowerCase());
          return (
            <SportTile
              key={sport}
              sport={sport}
              selected={selected}
              onClick={() => updateDraft({
                sports: selected
                  ? (filterDraft.sports || []).filter(x => x.toLowerCase() !== sport.toLowerCase())
                  : [...(filterDraft.sports || []), sport]
              })}
            />
          );
        })}
      </div>
      <div style={{ marginBottom: 24 }}>
        <SportSearchMultiSelect options={SPORT_NAMES} value={filterDraft.sports || []} onChange={(sports) => updateDraft({ sports })} placeholder="Search all sports…" />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <SectionLabel>Maximum price</SectionLabel>
        <span style={{ fontSize: T.body, fontWeight: 700, color: C.brand, ...fBody }}>${filterDraft.maxPrice ?? DEFAULT_FILTERS.maxPrice}/session</span>
      </div>
      <input type="range" name="filter-maximum-price" aria-label={`Maximum price per session, $${filterDraft.maxPrice ?? DEFAULT_FILTERS.maxPrice}`} min="20" max="150" step="5" value={filterDraft.maxPrice ?? DEFAULT_FILTERS.maxPrice} onChange={e => updateDraft({ maxPrice: Number(e.target.value) })} style={{ width: "100%", accentColor: C.brand, margin: "0 0 26px" }} />

      <SectionLabel>Minimum rating</SectionLabel>
      <div role="radiogroup" aria-label="Minimum rating" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", padding: 3, background: C.fog, borderRadius: 13, marginBottom: 8 }}>
        {[0, 3, 4, 4.5].map(rating => {
          const selected = (filterDraft.minRating ?? 0) === rating;
          return <button key={rating} type="button" role="radio" aria-checked={selected} onClick={() => updateDraft({ minRating: rating })} style={{ minHeight: 44, padding: "0 6px", border: "none", borderRadius: 10, background: selected ? C.white : "transparent", color: selected ? C.jet : C.slate, boxShadow: "none", cursor: "pointer", fontSize: T.labelLg, fontWeight: selected ? 700 : 500, ...fBody }}>{rating ? `${rating}+` : "Any"}</button>;
        })}
      </div>
    </BottomSheet>
  );

  // First-time client, no preferences submitted yet — the Coach Listings
  // section stays empty and prompts for preferences instead of showing
  // every coach in the directory.
  if (showRecommendationPrompt) {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", position: "relative" }}>
        <div style={{ padding: isDesktop ? "64px 64px 0" : "18px 18px 0" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: isDesktop ? "0 64px 40px" : "0 28px 40px" }}>
          <div style={{ width: 72, height: 72, borderRadius: 22, background: C.brandTint, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
            <Sparkles size={30} color={C.brand} />
          </div>
          <div style={{ fontSize: T.display, fontWeight: 700, color: C.jet, ...fDisplay }}>Let's Find Your Perfect Coach</div>
          <div style={{ fontSize: T.bodyLg, color: C.slate, marginTop: 10, lineHeight: 1.6, maxWidth: 300, ...fBody }}>
            Answer a few quick questions about what you're looking for, and we'll curate coach recommendations based on your interests, goals, and location.
          </div>
          <div style={{ marginTop: 26, display: "flex", justifyContent: "center" }}>
            <Btn onClick={() => setPrefsModalOpen(true)}>Find My Coaches</Btn>
          </div>
        </div>
        {prefsModal}
        {guideModal}
      </div>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", position: "relative", background: C.pageBg }}>
      <div
        ref={ptr.scrollRef}
        className="cl-hide-scrollbar"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          overscrollBehavior: "contain",
          paddingBottom: 116,
          width: "100%",
          transform: `translateY(${ptr.pull}px)`, transition: ptr.pull ? "none" : "transform .3s cubic-bezier(.22,1,.36,1)",
        }}
      >
        <div style={{ position: "relative", padding: isDesktop ? "64px 64px 48px" : "18px 18px 42px" }}>
          <div aria-hidden="true" style={{ position: "absolute", inset: 0, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, background: darkMode ? "#0B1B2B" : `radial-gradient(circle at 92% 8%, color-mix(in srgb, ${heroText} 16%, transparent) 0%, transparent 34%), ${heroBackground}`, pointerEvents: "none" }} />
          <div style={{ position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <button type="button" onClick={() => setActiveSheet("location")} aria-label={`Change location, currently ${nearestLocationLabel}`} style={{ minWidth: 0, flex: 1, display: "flex", alignItems: "center", gap: 10, padding: 0, border: "none", background: "none", cursor: "pointer", textAlign: "left" }}>
              <span style={{ width: 42, height: 42, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", background: `color-mix(in srgb, ${heroText} 15%, transparent)`, color: heroText, flexShrink: 0 }}>
                {locating ? <Spinner size={17} color={heroText} /> : <MapPin size={19} />}
              </span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0 }}>
                  <span style={{ fontSize: T.title, fontWeight: 600, color: heroText, ...oneLine, ...fDisplay }}>{locating ? "Finding your location…" : nearestLocationLabel}</span>
                  <ChevronDown size={16} color={heroMuted} style={{ flexShrink: 0 }} />
                </span>
                <span style={{ display: "block", fontSize: T.captionLg, color: heroMuted, marginTop: 2, ...fBody }}>{permissionDenied && !manualLabel ? "Approximate area · tap to change" : "Tap to change location"}</span>
              </span>
            </button>
            {/* notification + account menu now live in the white header above */}
          </div>

          <div style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: isDesktop ? 34 : T.displayLg, lineHeight: 1.12, fontWeight: 700, letterSpacing: "-0.5px", color: heroText, textWrap: "balance", ...fDisplay }}>Discover your next coach</div>
              <div style={{ marginTop: 6, fontSize: isDesktop ? T.title : T.body, color: heroMuted, ...fBody }}>Trusted local experts for your goals.</div>
            </div>
            {isDesktop && (
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button type="button" onClick={() => setActiveSheet("sort")} style={{ minHeight: 44, display: "flex", alignItems: "center", gap: 9, padding: "0 14px", borderRadius: 12, border: `1px solid ${C.border}`, background: C.white, color: C.jet, cursor: "pointer", textAlign: "left" }}>
                  <ArrowUpDown size={15} color={C.slate} aria-hidden="true" />
                  <span style={{ fontSize: T.body, fontWeight: 700, ...fBody }}>Sort</span>
                  <ChevronDown size={13} color={C.slateLight} aria-hidden="true" />
                </button>
                <button type="button" aria-pressed={hasActiveFilters} onClick={openFilters} style={{ minHeight: 44, display: "flex", alignItems: "center", gap: 9, padding: "0 14px", borderRadius: 12, border: `1px solid ${hasActiveFilters ? C.brand : C.border}`, background: C.white, color: hasActiveFilters ? C.brand : C.jet, cursor: "pointer", textAlign: "left" }}>
                  <SlidersHorizontal size={15} color={hasActiveFilters ? C.brand : C.slate} aria-hidden="true" />
                  <span style={{ fontSize: T.body, fontWeight: 700, ...fBody }}>Filters</span>
                  {hasActiveFilters && <span aria-label={`${activeFilterCount} active filter categories`} style={{ minWidth: 22, height: 22, padding: "0 6px", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: C.brand, color: "#FFFFFF", fontSize: T.caption, fontWeight: 700, ...fBody }}>{activeFilterCount}</span>}
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            aria-label="Search coaches, packages and sports"
            onClick={() => nav("client-search")}
            style={{
              width: "100%", minHeight: 50, marginTop: 16, display: "flex", alignItems: "center", gap: 10,
              border: `1.5px solid ${C.border}`, background: C.white, borderRadius: 14, padding: "0 14px",
              cursor: "pointer", textAlign: "left", boxShadow: "0 1px 2px rgba(22,24,29,.04)",
            }}
          >
            <Search size={16} color={C.slateLight} aria-hidden="true" />
            <span style={{ flex: 1, minWidth: 0, fontSize: T.bodyLg, color: C.slateLight, ...fBody }}>Search coaches, packages or sports…</span>
            <ChevronRight size={16} color={C.slateLight} aria-hidden="true" />
          </button>

          <div style={{ margin: isDesktop ? "24px -64px 0" : "18px -18px 0", padding: isDesktop ? "0 64px" : "0 18px", overflowX: "auto" }} className="cl-hide-scrollbar">
            <div style={{ display: "flex", gap: 8, width: "max-content", paddingBottom: 2 }}>
              <Chip
                compact
                active={!appliedFilters.sports?.length}
                onClick={() => { if (appliedFilters.sports?.length) { haptic(8); updateAppliedFilters({ sports: [] }); } }}
              >
                All sports
              </Chip>
              {POPULAR_SPORTS.slice(0, 10).map(sport => {
                const active = appliedFilters.sports?.some(s => s.toLowerCase() === sport.toLowerCase());
                return (
                  <Chip key={sport} compact active={active} onClick={() => toggleQuickSport(sport)}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <SportIcon sport={sport} size={13} color={C.brand} />
                      {sport}
                    </span>
                  </Chip>
                );
              })}
            </div>
          </div>
          </div>
        </div>

        {!isDesktop && (
        <div style={{ position: "sticky", top: 0, zIndex: 30, marginTop: -28, padding: "0 18px 10px", background: `linear-gradient(to bottom, transparent 0 28px, ${C.white} 28px 100%)` }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.15fr .85fr", gap: 8, padding: 6, borderRadius: 18, border: `1px solid ${C.border}`, background: C.white, boxShadow: "none", width: "100%" }}>
          <button type="button" onClick={() => setActiveSheet("sort")} style={{ minWidth: 0, minHeight: 44, display: "flex", alignItems: "center", gap: 9, padding: "0 12px", borderRadius: 12, border: "none", background: C.fog, color: C.jet, cursor: "pointer", textAlign: "left" }}>
            <ArrowUpDown size={15} color={C.slate} aria-hidden="true" />
            <span style={{ minWidth: 0, flex: 1 }}>
              <span style={{ display: "block", fontSize: T.caption, color: C.slate, ...fBody }}>Sort</span>
              <span style={{ display: "block", fontSize: T.labelLg, fontWeight: 700, ...oneLine, ...fBody }}>{SORT_OPTIONS.find(option => option.value === sortBy)?.label || "Recommended"}</span>
            </span>
            <ChevronDown size={13} color={C.slateLight} aria-hidden="true" />
          </button>
          <button type="button" aria-pressed={hasActiveFilters} onClick={openFilters} style={{ minWidth: 0, minHeight: 44, display: "flex", alignItems: "center", gap: 9, padding: "0 12px", borderRadius: 12, border: "none", background: hasActiveFilters ? C.brandTint : C.fog, color: hasActiveFilters ? C.brand : C.jet, cursor: "pointer", textAlign: "left" }}>
            <SlidersHorizontal size={15} aria-hidden="true" />
            <span style={{ flex: 1, fontSize: T.body, fontWeight: 700, ...fBody }}>Filters</span>
            {hasActiveFilters && <span aria-label={`${activeFilterCount} active filter categories`} style={{ minWidth: 22, height: 22, padding: "0 6px", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: C.brand, color: "#FFFFFF", fontSize: T.caption, fontWeight: 700, ...fBody }}>{activeFilterCount}</span>}
          </button>
          </div>
        </div>
        )}

        <div style={{ padding: isDesktop ? "48px 64px 64px" : "16px 18px 0" }}>
          {hasActiveFilters && (
            <section aria-label="Applied filters" style={{ marginBottom: 18, animation: "clFadeUp .28s cubic-bezier(.22,1,.36,1)" }}>
              <div aria-live="polite" style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 58, padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 16, background: C.brandTint, boxShadow: "0 1px 2px rgba(22,24,29,.04)" }}>
                <span aria-hidden="true" style={{ width: 36, height: 36, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: C.white }}>
                  <CheckCircle2 size={18} color={C.brand} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: T.subtitle, fontWeight: 700, color: C.jet, ...fDisplay }}>
                    {listLoading ? "Updating matches…" : `${filtered.length} coach${filtered.length === 1 ? "" : "es"} match`}
                  </span>
                  <span style={{ display: "block", marginTop: 2, fontSize: T.captionLg, color: C.slate, ...fBody }}>
                    {activeFilterCount} filter {activeFilterCount === 1 ? "is" : "categories are"} shaping these results
                  </span>
                </span>
                <button type="button" onClick={() => updateAppliedFilters(DEFAULT_FILTERS)} style={{ minWidth: 64, minHeight: 44, padding: "0 8px", border: "none", borderRadius: 12, background: "transparent", color: C.brand, cursor: "pointer", fontSize: T.labelLg, fontWeight: 700, ...fBody }}>
                  Clear all
                </button>
              </div>

              <div className="cl-hide-scrollbar" style={{ display: "flex", gap: 7, margin: isDesktop ? "6px -64px 0" : "6px -18px 0", padding: isDesktop ? "0 64px" : "0 18px", overflowX: "auto", scrollSnapType: "x proximity" }}>
                {visibleFilterTokens.map(token => (
                  <button
                    key={token.key}
                    type="button"
                    aria-label={`Remove ${token.label} filter`}
                    onClick={token.remove}
                    style={{ minHeight: 44, flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 6, padding: "0 10px", border: `1px solid ${C.border}`, borderRadius: 999, background: C.white, color: C.jet, cursor: "pointer", scrollSnapAlign: "start", fontSize: T.labelLg, fontWeight: 600, ...fBody }}
                  >
                    {token.icon}
                    <span>{token.label}</span>
                    <X size={13} color={C.slateLight} aria-hidden="true" />
                  </button>
                ))}
              </div>
            </section>
          )}

          {!hasActiveFilters && (
            <>
              <PromoBannerCarousel
                banners={PROMO_BANNERS}
                onSelectBanner={handleBannerSelect}
                style={isDesktop ? { marginBottom: 48 } : {}}
              />
            </>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div style={{ minWidth: 0 }}>
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: isDesktop ? 22 : T.title, fontWeight: 700, color: C.jet, ...fDisplay }}>
                  {appliedFilters.favoritesOnly ? <><Heart size={15} color={C.brand} fill={C.brand} /> Saved coaches</> : hasActiveFilters ? <><SlidersHorizontal size={15} color={C.brand} /> Filtered coaches</> : <><Navigation size={15} color={C.brand} /> Coaches near you</>}
                </div>
                <div style={{ fontSize: isDesktop ? T.body : T.captionLg, color: C.slate, marginTop: 2, ...oneLine, ...fBody }}>
                  <span key={filtered.length} style={{ display: "inline-block", fontWeight: 700, animation: "clScaleIn .28s cubic-bezier(.22,1,.36,1)" }}>{filtered.length}</span>
                  {" "}match{filtered.length === 1 ? "" : "es"} near {nearestLocationLabel}
                </div>
              </>
            </div>
          </div>

          {listLoading ? (
            <ListSkeleton />
          ) : filtered.length === 0 ? (
            <StatusBanner state="noResults" style={{ marginTop: 10 }} onPrimary={() => updateAppliedFilters(DEFAULT_FILTERS)} onSecondary={() => updateAppliedFilters({ sports: [], radiusKm: null })} secondaryLabel="Browse all coaches" />
          ) : (
            <div style={{ position: "relative", margin: isDesktop ? "0 -64px" : undefined, padding: isDesktop ? "0 64px" : undefined }}>
            <CardSlider perView={isDesktop ? 4 : isTablet ? 2 : 1.15} peek={isDesktop ? 0 : 0.15} gap={14} ariaLabel="Coach results">
              {filtered.slice(0, 8).map((c, i) => (
<CoachBannerCard
                  key={c.id}
                  coach={c}
                  unavailable={c.id === LIVE_AVAILABILITY_COACH_ID && !coachAvailableNow}
                  style={{ marginBottom: 0, height: "100%" }}
                  onOpen={() => nav("coach-profile", { id: c.id })}
                />
              ))}
            </CardSlider>
          </div>
          )}
        </div>
      </div>

      <div aria-live="polite" style={{ position: "absolute", top: 10, left: 0, right: 0, display: "flex", justifyContent: "center", pointerEvents: "none", zIndex: 45 }}>
        <div
          style={{
            display: ptr.refreshing || ptr.pull > 8 ? "flex" : "none", alignItems: "center", gap: 7, padding: "7px 13px",
            borderRadius: 999, background: C.jet, color: C.white, fontSize: T.captionLg, fontWeight: 600, ...fBody,
            boxShadow: "0 8px 20px rgba(0,0,0,.18)",
            opacity: ptr.refreshing ? 1 : (ptr.pull / PTR_THRESHOLD) * 0.94,
            transform: `translateY(${ptr.refreshing ? 0 : -4 + Math.min(ptr.pull / PTR_THRESHOLD, 1) * 4}px)`,
            transition: "opacity .18s ease, transform .18s ease",
          }}
        >
          {ptr.refreshing
            ? <Spinner size={13} color={C.white} />
            : <ArrowDown size={13} style={{ transform: ptrReady ? "rotate(180deg)" : "none", transition: "transform .18s ease" }} />}
          {ptr.refreshing ? "Refreshing…" : ptrReady ? "Release to refresh" : "Pull to refresh"}
        </div>
      </div>

      {sortSheet}
      {locationSheet}
      {filterSheet}

      {!mapOpen && (
        <button
          type="button"
          aria-label="Open coach map"
          onClick={() => setMapOpen(true)}
          style={{
            position: isMobile ? "absolute" : "fixed",
            right: isMobile ? 18 : 24,
            bottom: isMobile ? 92 : 20,
            zIndex: 34,
            display: "flex", alignItems: "center", gap: 8,
            height: 44, padding: "0 14px", borderRadius: 999,
            border: `1px solid ${C.border}`, background: C.white,
            color: C.brandIcon, boxShadow: "0 6px 18px -8px rgba(22,24,29,.28)",
            cursor: "pointer",
          }}
        >
          <MapIcon size={17} aria-hidden="true" />
          {isDesktop && <span style={{ fontSize: 13, fontWeight: 600, ...fBody }}>Map</span>}
        </button>
      )}

      {mapOpen && (
        <CoachMapView
          coaches={filtered}
          radiusKm={radiusKm}
          activeFilterCount={activeFilterCount}
          onOpenFilters={openFilters}
          onOpen={id => nav("coach-profile", { id, returnToMap: true })}
          onClose={() => setMapOpen(false)}
        />
      )}

      <ConfirmDialog
        open={signOutConfirmOpen}
        onClose={() => setSignOutConfirmOpen(false)}
        onConfirm={async () => {
          await new Promise((r) => setTimeout(r, 600));
          setSignOutConfirmOpen(false);
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
    </div>
  );
}
