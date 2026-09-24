import React, { useState, useEffect, useMemo, useRef } from "react";
import { haptic } from "../../utils/haptics";
import {
  ArrowRight, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Clock,
  Heart, MapPin, MessageCircle, Play, Share2, ShieldCheck,
  Sparkles, Users, Wrench, CheckCircle2, Star,
} from "lucide-react";
import { CL, CD, fDisplay, fBody, T } from "../../theme/theme";
import { useApp } from "../../context/AppContext";
import { useResponsive } from "../../theme/responsive";
import { SplitView, RightSummary, Stack, CardSlider } from "../../components/layout";
import { COACHES, REVIEWS } from "../../data/mockData";
import { getCoachMedia } from "../../data/media";
import {
  Avatar, BackButton, Badge, BottomSheet, SegTabs, SectionLabel, Card, Btn,
  HandleTag, FullscreenImageViewer, StepProgress, ProfileSkeleton,
} from "../../components/ui/Primitives";
import { CoachProfileHero, CoachProfileAbout } from "../../components/ui/CoachProfileSections";
import { SportIcon } from "../../components/ui/SportUI";
import { getPublicName } from "../../utils/name";
import { availabilityBlocksToWeekly } from "../../utils/coachProfile";
import { StatusBanner } from "../../systems/StateSystem";
import { useReviewActions } from "../../systems/ReviewsSystem";
import {
  buildMonthGrid, sameDay, dayAvailability, slotsForDate, groupSlotsByPeriod, formatTimeRange12, formatFullDateFromDate, addDays, DOW_ABBR,
} from "./Booking";

const WEEKDAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIME_PERIODS = ["Morning", "Afternoon", "Evening"];

const LIVE_AVAILABILITY_COACH_ID = "c2";

// Packages don't carry their own schedule in the mock data model — only the
// coach does. To let the calendar genuinely narrow when a package is picked,
// derive a deterministic (stable, package-specific) subset of the coach's
// weekly availability from the package id, instead of just reusing the same
// coach-wide schedule for every package.
function derivePackageAvailability(coach, pkg) {
  const base = coach.availability || {};
  if (!pkg) return base;
  const seed = pkg.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const out = {};
  Object.entries(base).forEach(([day, slots], di) => {
    const kept = slots.filter((_, i) => (seed + di * 3 + i) % 2 === 0);
    if (kept.length) out[day] = kept;
  });
  return Object.keys(out).length ? out : base;
}

function getNextAvailableDate(coach, pkg, isCurrentCoach, availabilityBlocks, coachPackages) {
  const availability = isCurrentCoach && availabilityBlocks?.length
    ? availabilityBlocksToWeekly(availabilityBlocks, pkg, coachPackages)
    : derivePackageAvailability(coach, pkg);

  if (!availability || Object.keys(availability).length === 0) return null;

  const now = new Date();
  const curH = now.getHours();
  const curM = now.getMinutes();

  for (let i = 0; i < 28; i++) {
    const d = addDays(now, i);
    const abbrev = DOW_ABBR[d.getDay()];
    const slots = availability[abbrev];
    if (slots && slots.length > 0) {
      if (i === 0) {
        const hasFutureSlot = slots.some((t) => {
          const [h, m] = t.split(":").map(Number);
          return h > curH || (h === curH && m > curM);
        });
        if (hasFutureSlot) return d;
      } else {
        return d;
      }
    }
  }
  return null;
}

function formatNextAvailability(date) {
  if (!date) return "Check availability";
  const now = new Date();
  const tomorrow = addDays(now, 1);
  if (sameDay(date, now)) return "Next: Today";
  if (sameDay(date, tomorrow)) return "Next: Tomorrow";
  const formatted = date.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });
  return `Next: ${formatted}`;
}

function packageLocation(pkg, coach) {
  if ((pkg.mode || pkg.locationType) === "Online") return "Online";
  if ((pkg.mode || pkg.locationType) === "Come to You") return pkg.location || "Your preferred location";
  return pkg.venue || pkg.location || coach.venue || "Venue confirmed after booking";
}

function PackageMetric({ icon: Icon, label, value, C }) {
  return (
    <div style={{ minWidth: 0, padding: "12px 10px", borderRadius: 14, background: C.fog, border: `1px solid ${C.border}` }}>
      <Icon size={15} color={C.brand} aria-hidden="true" />
      <div style={{ fontSize: T.tiny, color: C.slateLight, marginTop: 8, ...fBody }}>{label}</div>
      <div style={{ fontSize: T.labelLg, fontWeight: 700, color: C.jet, marginTop: 2, lineHeight: 1.35, ...fBody }}>{value}</div>
    </div>
  );
}

function PackageBookingSheet({
  open, onClose, onComplete, pkg, coach, liveAvailability, coachPackages,
  initialStep = 1, initialDate, initialTime,
}) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const [step, setStep] = useState(initialStep);
  const [cursor, setCursor] = useState(() => {
    const date = initialDate ? new Date(initialDate) : new Date();
    date.setDate(1);
    return date;
  });
  const [selectedDate, setSelectedDate] = useState(() => initialDate ? new Date(initialDate) : null);
  const [selectedTime, setSelectedTime] = useState(initialTime || null);
  const [timesOpen, setTimesOpen] = useState(true);

  const isCurrentCoach = coach.id === COACHES[1].id;
  const availability = useMemo(() => (
    isCurrentCoach && liveAvailability?.length
      ? availabilityBlocksToWeekly(liveAvailability, pkg, coachPackages)
      : derivePackageAvailability(coach, pkg)
  ), [coach, coachPackages, isCurrentCoach, liveAvailability, pkg]);
  const weeks = useMemo(() => buildMonthGrid(cursor), [cursor]);
  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const today = new Date();
  const isCurrentMonth = cursor.getFullYear() === today.getFullYear() && cursor.getMonth() === today.getMonth();
  const daySlots = selectedDate ? slotsForDate(selectedDate, coach, availability) : [];
  const groupedSlots = groupSlotsByPeriod(daySlots);
  const duration = pkg.durationMinutes || pkg.duration || 60;
  const typeLabel = pkg.packageTypes?.length ? pkg.packageTypes.join(" + ") : (pkg.packageType || pkg.type || "Coaching session");
  const locationLabel = packageLocation(pkg, coach);
  const participantLabel = pkg.maxParticipants > 1 ? `Up to ${pkg.maxParticipants}` : "Private";
  const prepCopy = pkg.equipment
    ? pkg.equipment
    : "Wear comfortable sports clothing and bring water. Your coach will confirm anything else before the session.";

  const chooseDate = (date, availabilityState) => {
    if (availabilityState === "unavailable") return;
    setSelectedDate(date);
    setSelectedTime(null);
    setTimesOpen(true);
  };

  const footer = step === 1 ? (
    <Btn full icon={CalendarDays} onClick={() => setStep(2)}>Choose date & time</Btn>
  ) : (
    <div style={{ display: "grid", gridTemplateColumns: "108px 1fr", gap: 10 }}>
      <Btn full variant="outline" onClick={() => setStep(1)}>Back</Btn>
      <Btn
        full
        icon={ArrowRight}
        disabled={!selectedDate || !selectedTime}
        onClick={() => onComplete(selectedDate.toISOString(), selectedTime)}
      >
        Review package
      </Btn>
    </div>
  );

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={step === 1 ? "Package overview" : "Choose your session"}
      heightPct={92}
      footer={footer}
    >
      <StepProgress step={step} total={2} label={step === 1 ? "Review what’s included" : "Pick a date and start time"} />

      {step === 1 ? (
        <div key="overview" style={{ animation: "clFadeUp .24s ease" }}>
          <div style={{ padding: 16, borderRadius: 18, background: C.brandTint, border: `1px solid ${C.border}`, marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
              <div style={{ minWidth: 0 }}>
                <h2 style={{ margin: "0 0 0", fontSize: T.headingLg, lineHeight: 1.2, fontWeight: 800, color: C.jet, ...fDisplay }}>{pkg.name}</h2>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5, fontSize: T.labelLg, color: C.slate, ...fBody }}>
                  <SportIcon sport={pkg.sport || coach.sport} size={13} color={C.brand} />
                  {pkg.sport || coach.sport} · {typeLabel}
                </div>
              </div>
              <div style={{ flexShrink: 0, textAlign: "right" }}>
                <div style={{ fontSize: T.display, fontWeight: 800, color: C.brand, ...fDisplay }}>${pkg.price}</div>
                <div style={{ fontSize: T.caption, color: C.slate, marginTop: 2, ...fBody }}>package price</div>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, marginBottom: 20 }}>
            <PackageMetric icon={Clock} label="Duration" value={`${duration} min`} C={C} />
            <PackageMetric icon={Users} label="Group size" value={participantLabel} C={C} />
            <PackageMetric icon={MapPin} label="Format" value={pkg.mode || pkg.locationType || "In-person"} C={C} />
          </div>

          <SectionLabel>What to expect</SectionLabel>
          <p style={{ margin: "6px 0 18px", fontSize: T.bodyLg, color: C.slate, lineHeight: 1.65, ...fBody }}>
            {pkg.description || `A focused ${pkg.sport || coach.sport} session shaped around your goals, experience, and pace.`}
          </p>

          <Card style={{ marginBottom: 18, padding: 14 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ width: 38, height: 38, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 12, background: C.brandTint }}>
                <Wrench size={17} color={C.brand} aria-hidden="true" />
              </div>
              <div>
                <div style={{ fontSize: T.body, fontWeight: 700, color: C.jet, ...fBody }}>Prepare for your session</div>
                <div style={{ marginTop: 4, fontSize: T.labelLg, color: C.slate, lineHeight: 1.55, ...fBody }}>{prepCopy}</div>
              </div>
            </div>
          </Card>

          <SectionLabel>Session location</SectionLabel>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, paddingBottom: 4 }}>
            <MapPin size={16} color={C.brand} aria-hidden="true" />
            <div>
              <div style={{ fontSize: T.body, fontWeight: 650, color: C.jet, ...fBody }}>{locationLabel}</div>
              <div style={{ fontSize: T.captionLg, color: C.slate, marginTop: 2, ...fBody }}>Full joining details are shared after booking.</div>
            </div>
          </div>
        </div>
      ) : (
        <div key="schedule" style={{ animation: "clFadeUp .24s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, marginBottom: 16, borderRadius: 16, background: C.fog, border: `1px solid ${C.border}` }}>
            <div style={{ width: 40, height: 40, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 12, background: C.brandTint }}>
              <SportIcon sport={pkg.sport || coach.sport} size={18} color={C.brand} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: T.body, fontWeight: 700, color: C.jet, ...fDisplay }}>{pkg.name}</div>
              <div style={{ fontSize: T.captionLg, color: C.slate, marginTop: 2, ...fBody }}>{duration} min · ${pkg.price} · {pkg.mode || pkg.locationType || "In-person"}</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => !isCurrentMonth && setCursor((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
              disabled={isCurrentMonth}
              style={{ width: 44, height: 44, borderRadius: 12, background: darkMode ? "transparent" : C.fog, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: isCurrentMonth ? "default" : "pointer", opacity: isCurrentMonth ? 0.45 : 1 }}
            >
              <ChevronLeft size={16} color={C.jet} />
            </button>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: T.caption, fontWeight: 750, color: C.brand, textTransform: "uppercase", letterSpacing: ".7px", ...fBody }}>Select a date</div>
              <div style={{ marginTop: 2, fontSize: T.title, fontWeight: 700, color: C.jet, ...fDisplay }}>{monthLabel}</div>
            </div>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setCursor((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
              style={{ width: 44, height: 44, borderRadius: 12, background: darkMode ? "transparent" : C.fog, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <ChevronRight size={16} color={C.jet} />
            </button>
          </div>

          <Card style={{ padding: 10, marginBottom: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 6 }}>
              {WEEKDAY_HEADERS.map((day) => (
                <div key={day} style={{ textAlign: "center", fontSize: T.micro, fontWeight: 700, color: C.slateLight, ...fBody }}>{day.slice(0, 1)}</div>
              ))}
            </div>

            {weeks.map((row) => (
              <div key={row[0].toISOString()} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
                {row.map((date) => {
                  const inMonth = date.getMonth() === cursor.getMonth();
                  const availabilityState = dayAvailability(date, coach, availability);
                  const isSelected = selectedDate && sameDay(date, selectedDate);
                  const isToday = sameDay(date, today);
                  const disabled = !inMonth || availabilityState === "unavailable";
                  return (
                    <button
                      key={date.toISOString()}
                      type="button"
                      aria-label={date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                      aria-pressed={Boolean(isSelected)}
                      disabled={disabled}
                      onClick={() => chooseDate(date, availabilityState)}
                      style={{
                        minWidth: 0, height: 44, borderRadius: 11,
                        border: `1.5px solid ${isSelected ? C.brand : (isToday ? C.brand : C.border)}`,
                        background: isSelected ? C.brand : C.white,
                        color: isSelected ? C.white : (disabled ? C.slateLight : C.jet),
                        opacity: inMonth ? (disabled ? 0.45 : 1) : 0.2,
                        fontSize: T.label, fontWeight: isSelected || isToday ? 700 : 500,
                        cursor: disabled ? "default" : "pointer", ...fBody,
                      }}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            ))}
          </Card>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 14 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: T.tiny, color: C.slate, ...fBody }}><span style={{ width: 8, height: 8, borderRadius: 99, background: C.brand }} />Available</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: T.tiny, color: C.slate, ...fBody }}><span style={{ width: 8, height: 8, borderRadius: 99, background: C.border }} />Unavailable</span>
          </div>

          {selectedDate ? (
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 18, overflow: "hidden", animation: "clFadeUp .28s ease" }}>
              <button
                type="button"
                onClick={() => setTimesOpen((value) => !value)}
                aria-expanded={timesOpen}
                style={{ width: "100%", minHeight: 58, padding: "10px 14px", border: "none", background: C.fog, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, textAlign: "left", cursor: "pointer" }}
              >
                <div>
                  <div style={{ fontSize: T.body, fontWeight: 700, color: C.jet, ...fBody }}>Available start times</div>
                  <div style={{ fontSize: T.captionLg, color: C.slate, marginTop: 2, ...fBody }}>{formatFullDateFromDate(selectedDate)}</div>
                </div>
                <ChevronDown size={18} color={C.slate} style={{ transform: timesOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s ease" }} />
              </button>

              {timesOpen ? (
                <div style={{ padding: "14px 14px 4px", animation: "clFadeUp .2s ease" }}>
                  {daySlots.length ? TIME_PERIODS.filter((period) => groupedSlots[period].length).map((period) => (
                    <div key={period} style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: T.caption, fontWeight: 700, color: C.slateLight, marginBottom: 8, textTransform: "uppercase", letterSpacing: ".6px", ...fBody }}>{period}</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                        {groupedSlots[period].map((time) => {
                          const active = selectedTime === time;
                          return (
                            <button
                              key={time}
                              type="button"
                              aria-pressed={active}
                              onClick={() => setSelectedTime(time)}
                              style={{ minWidth: 0, minHeight: 44, padding: "9px 8px", borderRadius: 12, border: `1.5px solid ${active ? C.brand : C.border}`, background: active ? C.brandTint : C.white, color: active ? C.brand : C.jet, fontSize: T.labelLg, fontWeight: 650, cursor: "pointer", ...fBody }}
                            >
                              {formatTimeRange12(time, duration)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )) : (
                    <div style={{ padding: "4px 0 14px", fontSize: T.labelLg, color: C.slate, textAlign: "center", ...fBody }}>No start times are available on this date.</div>
                  )}
                </div>
              ) : null}
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 14, borderRadius: 16, background: C.fog, border: `1px solid ${C.border}` }}>
              <Sparkles size={17} color={C.brand} aria-hidden="true" />
              <div style={{ fontSize: T.labelLg, color: C.slate, lineHeight: 1.5, ...fBody }}>Choose an available date to reveal start times.</div>
            </div>
          )}
        </div>
      )}
    </BottomSheet>
  );
}

export function ScreenCoachProfile({ nav, goBack, params = {}, favorites = [], toggleFav, coachAvailableNow }) {
  const { darkMode, coachMedia, coachProfile, coachPackages, availabilityBlocks, toast } = useApp();
  const C = darkMode ? CD : CL;
  const isPreview = Boolean(params.preview || params.previewMode);
  const [loading, setLoading] = useState(true);
  const listedCoach = COACHES.find((c) => c.id === (params?.id || params?.coachId)) || COACHES[0];
  const coach = (listedCoach.id === COACHES[1].id || isPreview) ? coachProfile : listedCoach;
  const media = (coach.id === COACHES[1].id || isPreview) ? coachMedia : getCoachMedia(coach.id);
  const pub = getPublicName(coach, "public");
  const { getReply } = useReviewActions();
  const [tab, setTab] = useState(params.tab || "packages");
  useEffect(() => {
    if (params?.tab) setTab(params.tab);
  }, [params?.tab]);
  const [selectedPkgId, setSelectedPkgId] = useState(params.openSchedule ? params.packageId : null);
  const [packageSheetStep, setPackageSheetStep] = useState(params.openSchedule ? 2 : 1);
  const [reviewPage, setReviewPage] = useState(1);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [packagePickerOpen, setPackagePickerOpen] = useState(false);

  const handleBookSession = () => {
    if (isPreview || unavailable || !activePackages.length) return;
    if (activePackages.length === 1) {
      setSelectedPkgId(activePackages[0].id);
      setPackageSheetStep(1);
    } else {
      setPackagePickerOpen(true);
    }
  };
  const REVIEWS_PER_PAGE = 5;
  const reviewPageCount = Math.max(1, Math.ceil(REVIEWS.length / REVIEWS_PER_PAGE));
  const pagedReviews = REVIEWS.slice((reviewPage - 1) * REVIEWS_PER_PAGE, reviewPage * REVIEWS_PER_PAGE);
  useEffect(() => { setReviewPage(1); }, [tab, coach.id]);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 800); return () => clearTimeout(t); }, []);
  const selectedPkg = coach.packages.find((p) => p.id === selectedPkgId) || null;
  const safeFavorites = Array.isArray(favorites) ? favorites : [];
  const fav = safeFavorites.includes(coach.id);
  const heroImage = coach.coverPhoto || media.find((item) => item.type === "photo")?.url;
  const unavailable = coach.id === LIVE_AVAILABILITY_COACH_ID && coachAvailableNow === false;
  const isCurrentCoach = coach.id === LIVE_AVAILABILITY_COACH_ID || isPreview;
  const handleFavourite = () => {
    if (isPreview) return;
    haptic(8);
    toggleFav?.(coach.id);
    toast?.(fav ? "Removed from saved coaches" : "Coach saved to favourites");
  };
  const handleShare = () => toast?.("Profile link ready to share");
  const handleBack = () => {
    if (isPreview) {
      nav("coach-profile-edit");
      return;
    }
    if (params.returnToMap) {
      nav("client-home", { mapOpen: true });
      return;
    }
    goBack("client-home");
  };

  const activePackages = coach.packages.filter((pkg) => pkg.active !== false);
  const startingPrice = activePackages.length ? Math.min(...activePackages.map((pkg) => pkg.price)) : null;
  const { isDesktop } = useResponsive();

  // Desktop booking summary rail — mirrors the mobile bottom action bar.
  const firstActive = activePackages.length ? activePackages[0] : coach.packages[0];
  const railNextDate = firstActive && !unavailable
    ? getNextAvailableDate(coach, firstActive, isCurrentCoach, availabilityBlocks, coachPackages)
    : null;
  const railNextLabel = formatNextAvailability(railNextDate);
  const openFirstPackage = () => {
    if (!firstActive) return;
    setPackageSheetStep(1);
    setSelectedPkgId(firstActive.id);
  };

const summaryRail = (
    <RightSummary sticky>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Star size={16} fill={C.brand} color={C.brand} />
            <span style={{ fontSize: T.heading, fontWeight: 800, color: C.jet, ...fDisplay }}>{coach.rating.toFixed(1)}</span>
            <span style={{ fontSize: 16, color: C.slate }}>({coach.reviews} reviews)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {coach.verified?.identity && <Badge tone="success" icon={CheckCircle2}>Verified coach</Badge>}
            <Badge tone="neutral" icon={MapPin}>{coach.suburb}</Badge>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 16, paddingTop: 16 }}>
          <div style={{ fontSize: 16, color: C.slate, ...fBody }}>Starting from</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.jet, lineHeight: 1.1, marginTop: 2, ...fDisplay }}>
            {startingPrice != null ? `$${startingPrice}` : "—"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: 16, color: C.slate, ...fBody }}>
            <CalendarDays size={16} color={C.brand} />
            <span>{railNextLabel}</span>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 16, paddingTop: 16 }}>
          {isPreview ? (
            <Btn full disabled variant="secondary" style={{ opacity: 0.75, cursor: "not-allowed" }}>Book a session</Btn>
          ) : unavailable ? (
            <Btn full disabled variant="secondary">Unavailable for new bookings</Btn>
          ) : (
            <Btn full icon={CalendarDays} onClick={handleBookSession}>Book a session</Btn>
          )}
          <div style={{ marginTop: 10 }}>
            {isPreview ? (
              <Btn full disabled variant="outline" style={{ opacity: 0.75, cursor: "not-allowed" }}>
                Message {pub.name.split(" ")[0]}
              </Btn>
            ) : (
              <Btn full variant="outline" icon={MessageCircle} onClick={() => nav("chat-thread", { name: coach.name, handle: coach.handle })}>
                Message {pub.name.split(" ")[0]}
              </Btn>
            )}
          </div>
        </div>
      </div>
    </RightSummary>
  );

  const tabPane = (
    <>
      {unavailable && (
        <div style={{ marginTop: 14 }}>
          <StatusBanner
            state="coachUnavailable"
            onPrimary={() => nav("chat-thread", { name: coach.name, handle: coach.handle })}
            primaryLabel="Notify me when available"
            onSecondary={() => nav("chat-thread", { name: coach.name, handle: coach.handle })}
            secondaryLabel="Message coach"
          />
        </div>
      )}

      <div style={{ marginTop: 14 }}>
        <SegTabs value={tab} onChange={setTab} items={[
          { value: "packages", label: "Packages" }, { value: "about", label: "About" },
          { value: "reels", label: "Reels" }, { value: "reviews", label: "Reviews" },
        ]} />
      </div>

      {tab === "about" && (
        <div style={{ marginTop: 16 }}>
          <CoachProfileAbout coach={coach} />
        </div>
      )}

      {tab === "reels" && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: T.labelLg, color: C.slate, lineHeight: 1.5, marginBottom: 12, ...fBody }}>A look inside {pub.name}'s coaching sessions.</div>
          <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(3, minmax(0, 1fr))" : "1fr 1fr", gap: isDesktop ? 14 : 8 }}>
            {media.map((item) => (
              <button key={item.id} type="button" aria-label={`Open ${item.caption}`} onClick={() => nav("coach-media", { coachId: coach.id, mediaId: item.id })} style={{ aspectRatio: isDesktop ? "16/10" : "3/4", padding: 0, overflow: "hidden", borderRadius: 14, border: `1px solid ${C.border}`, background: C.fog, position: "relative", cursor: "pointer" }}>
                {item.type === "reel" ? (
                  <video src={item.url} muted loop autoPlay playsInline preload="metadata" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                ) : (
                  <img src={item.url} alt={item.caption} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                )}
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 45%, rgba(0,0,0,.56))" }} />
                {item.type === "reel" && <span style={{ position: "absolute", top: 8, right: 8, width: 30, height: 30, borderRadius: 99, background: "rgba(22,24,29,.60)", display: "flex", alignItems: "center", justifyContent: "center" }}><Play size={13} color={C.white} fill={C.white} /></span>}
                <span style={{ position: "absolute", left: 9, right: 9, bottom: 9, textAlign: "left", color: C.white, fontSize: T.caption, fontWeight: 600, lineHeight: 1.25, ...fBody }}>{item.caption}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === "packages" && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Badge tone="neutral" icon={ShieldCheck} style={{ color: C.jet }}>{activePackages.length} available</Badge>
            <span style={{ fontSize: T.captionLg, color: C.slateLight, ...fBody }}>Tap a package to see everything included</span>
          </div>

          <div
            className="cl-stagger"
            style={{
              display: "grid",
              gridTemplateColumns: isDesktop ? "repeat(2, minmax(0, 1fr))" : "1fr",
              gap: isDesktop ? 16 : 12,
              width: "100%",
            }}
          >
            {coach.packages.map((p, i) => {
              const isInactive = p.active === false || unavailable;
              const duration = p.durationMinutes || p.duration || 60;
              const format = p.mode || p.locationType || "In-person";
              const groupSize = p.maxParticipants > 1 ? `Up to ${p.maxParticipants} people` : "Private session";
              const nextDate = !isInactive ? getNextAvailableDate(coach, p, isCurrentCoach, availabilityBlocks, coachPackages) : null;
              const nextAvailability = formatNextAvailability(nextDate);
              return (
                <Card
                  key={p.id}
                  ariaLabel={isPreview ? `${p.name} (preview only)` : isInactive ? `${p.name}, currently unavailable` : `View ${p.name}`}
                  onClick={isPreview || isInactive ? undefined : () => {
                    setPackageSheetStep(1);
                    setSelectedPkgId(p.id);
                  }}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: isDesktop ? 32 : 18,
                    borderRadius: isDesktop ? 20 : undefined,
                    background: isInactive ? C.fog : C.white,
                    opacity: isInactive ? 0.58 : 1,
                    cursor: isPreview || isInactive ? "default" : "pointer",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    animationDelay: `${Math.min(i, 8) * 45}ms`,
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
                        <div style={{ width: isDesktop ? 44 : 40, height: isDesktop ? 44 : 40, flexShrink: 0, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: isInactive ? C.fog : C.brandTint }}>
                          <SportIcon sport={p.sport || coach.sport} size={isDesktop ? 20 : 18} color={isInactive ? C.slateLight : C.brand} />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: isDesktop ? 17 : T.subtitle, fontWeight: 750, color: C.jet, lineHeight: 1.25, ...fDisplay }}>{p.name}</div>
                          <div style={{ fontSize: isDesktop ? 13.5 : 12, color: C.slate, marginTop: 3, ...fBody }}>{p.sport || coach.sport} · {p.packageType || p.type || "Coaching session"}</div>
                        </div>
                      </div>
                      <div style={{ flexShrink: 0, textAlign: "right" }}>
                        <div style={{ fontSize: isDesktop ? 22 : T.title, fontWeight: 800, color: C.jet, ...fDisplay }}>${p.price}</div>
                        <div style={{ fontSize: T.tiny, color: C.slateLight, marginTop: 1, ...fBody }}>package</div>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 10px", marginTop: isDesktop ? 16 : 12, padding: isDesktop ? "11px 14px" : "9px 11px", borderRadius: 12, background: C.fog }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: isDesktop ? 13.5 : 12, color: C.slate, ...fBody }}><Clock size={13} color={C.brand} />{duration} min</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: isDesktop ? 13.5 : 12, color: C.slate, ...fBody }}><Users size={13} color={C.brand} />{groupSize}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: isDesktop ? 13.5 : 12, color: C.slate, ...fBody }}><MapPin size={13} color={C.brand} />{format}</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginTop: isDesktop ? 18 : 14 }}>
                    {isInactive ? (
                      <Badge tone="neutral">Currently unavailable</Badge>
                    ) : (
                      <Badge tone="neutral" icon={CalendarDays}>{nextAvailability}</Badge>
                    )}
                    {isPreview ? (
                      <Btn
                        size="sm"
                        disabled
                        style={{
                          minHeight: isDesktop ? 40 : 36,
                          height: isDesktop ? 40 : 36,
                          padding: isDesktop ? "0 18px" : "0 14px",
                          borderRadius: 12,
                          fontSize: isDesktop ? 13.5 : 12.5,
                          fontWeight: 700,
                          opacity: 0.65,
                          cursor: "not-allowed",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Book session
                      </Btn>
                    ) : !isInactive ? (
                      <Btn
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPackageSheetStep(1);
                          setSelectedPkgId(p.id);
                        }}
                        style={{
                          minHeight: isDesktop ? 40 : 36,
                          height: isDesktop ? 40 : 36,
                          padding: isDesktop ? "0 18px" : "0 14px",
                          borderRadius: 12,
                          fontSize: isDesktop ? 13.5 : 12.5,
                          fontWeight: 700,
                          gap: 6,
                          whiteSpace: "nowrap",
                        }}
                      >
                        Book session
                        <ChevronRight size={15} />
                      </Btn>
                    ) : null}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

{tab === "reviews" && (
        <div style={{ marginTop: 16 }}>
          {/* Reviews Rating Breakdown Header */}
          <Card style={{ padding: isDesktop ? "24px 28px" : "18px 16px", marginBottom: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "220px 1fr" : "1fr", gap: isDesktop ? 32 : 18, alignItems: "center" }}>
              {/* Overall Score */}
              <div style={{ textAlign: isDesktop ? "left" : "center", borderRight: isDesktop ? `1px solid ${C.border}` : "none", paddingRight: isDesktop ? 24 : 0, borderBottom: !isDesktop ? `1px solid ${C.border}` : "none", paddingBottom: !isDesktop ? 16 : 0 }}>
                <div style={{ fontSize: 44, fontWeight: 800, color: C.jet, lineHeight: 1, letterSpacing: "-1px", ...fDisplay }}>
                  {(coach.rating || 4.9).toFixed(1)}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: isDesktop ? "flex-start" : "center", gap: 3, margin: "8px 0 4px" }}>
                  {[1, 2, 3, 4, 5].map((st) => (
                    <Star key={st} size={18} fill={st <= Math.round(coach.rating || 5) ? C.brand : "none"} color={C.brand} />
                  ))}
                </div>
                <div style={{ fontSize: T.body, fontWeight: 600, color: C.jet, ...fBody }}>
                  Based on {coach.reviews || REVIEWS.length} reviews
                </div>
                <div style={{ fontSize: T.caption, color: C.slateLight, marginTop: 3, ...fBody }}>
                  Top 5% rated coach on Coach Nivo
                </div>
              </div>

              {/* Breakdown Distribution */}
              <div style={{ display: "flex", flexDirection: "column", gap: 7, width: "100%" }}>
                {[
                  { stars: 5, pct: 92 },
                  { stars: 4, pct: 8 },
                  { stars: 3, pct: 0 },
                  { stars: 2, pct: 0 },
                  { stars: 1, pct: 0 },
                ].map((row) => (
                  <div key={row.stars} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: T.captionLg, color: C.slate, ...fBody }}>
                    <span style={{ width: 38, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                      {row.stars} <Star size={11} fill={C.brand} color={C.brand} />
                    </span>
                    <div style={{ flex: 1, height: 7, borderRadius: 99, background: C.fog, overflow: "hidden" }}>
                      <div style={{ width: `${row.pct}%`, height: "100%", background: C.brand, borderRadius: 99, transition: "width .3s ease" }} />
                    </div>
                    <span style={{ width: 34, textAlign: "right", color: C.slateLight, fontSize: T.caption }}>
                      {row.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Verified Guarantee banner */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
              <ShieldCheck size={18} color={C.success} style={{ flexShrink: 0 }} />
              <div style={{ fontSize: T.captionLg, color: C.slate, lineHeight: 1.45, ...fBody }}>
                <strong style={{ color: C.jet, fontWeight: 650 }}>100% Verified Reviews:</strong> All reviews are submitted by verified clients after completing paid sessions.
              </div>
            </div>
          </Card>

          {/* Reviews List / Grid — single column (matches mobile) on every tier */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: 14,
            }}
          >
            {pagedReviews.map((r, i) => {
              const reply = getReply(r.id);
              return (
                <Card key={r.id} style={{ animationDelay: `${Math.min(i, 8) * 45}ms`, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar name={r.name} size={36} />
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            <span style={{ fontSize: T.body, fontWeight: 700, color: C.jet, ...fBody }}>{r.name}</span>
                            {r.handle && <HandleTag handle={r.handle} size={11} color={C.slateLight} />}
                            {r.verified && (
                              <span style={{ fontSize: 11, fontWeight: 600, color: C.success, display: "inline-flex", alignItems: "center", gap: 3, background: C.successTint, padding: "2px 7px", borderRadius: 99 }}>
                                <CheckCircle2 size={11} color={C.success} /> Verified
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: T.caption, color: C.slateLight, marginTop: 2, ...fBody }}>{r.date}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                        {[...Array(5)].map((_, idx) => (
                          <Star key={idx} size={13} fill={idx < r.rating ? C.brand : "none"} color={C.brand} />
                        ))}
                      </div>
                    </div>
                    <p style={{ fontSize: T.body, color: C.slate, marginTop: 12, lineHeight: 1.6, ...fBody }}>{r.text}</p>
                  </div>
                  {reply && (
                    <div style={{ marginTop: 12, background: C.fog, borderRadius: 12, padding: "10px 14px", borderLeft: `3px solid ${C.brand}` }}>
                      <div style={{ fontSize: T.caption, fontWeight: 700, color: C.brand, ...fBody }}>Reply from {pub.name}</div>
                      <p style={{ fontSize: T.labelLg, color: C.jet, marginTop: 3, lineHeight: 1.5, ...fBody }}>{reply.text}</p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {reviewPageCount > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 20 }}>
              <button
                type="button"
                aria-label="Previous reviews page"
                onClick={() => setReviewPage((p) => Math.max(1, p - 1))}
                disabled={reviewPage === 1}
                style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.border}`, background: C.white, display: "flex", alignItems: "center", justifyContent: "center", cursor: reviewPage === 1 ? "default" : "pointer", opacity: reviewPage === 1 ? 0.4 : 1 }}
              >
                <ChevronLeft size={16} color={C.jet} />
              </button>
              <span style={{ fontSize: T.labelLg, fontWeight: 600, color: C.slate, ...fBody }}>
                Page {reviewPage} of {reviewPageCount}
              </span>
              <button
                type="button"
                aria-label="Next reviews page"
                onClick={() => setReviewPage((p) => Math.min(reviewPageCount, p + 1))}
                disabled={reviewPage === reviewPageCount}
                style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.border}`, background: C.white, display: "flex", alignItems: "center", justifyContent: "center", cursor: reviewPage === reviewPageCount ? "default" : "pointer", opacity: reviewPage === reviewPageCount ? 0.4 : 1 }}
              >
                <ChevronRight size={16} color={C.jet} />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", position: "relative" }}>
      {isPreview && (
        <div style={{
          background: C.brandTint,
          borderBottom: `1.5px solid ${C.brand}`,
          padding: isDesktop ? "12px 64px" : "10px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(8px)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <ShieldCheck size={18} color={C.brand} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: isDesktop ? 14 : 12, fontWeight: 650, color: C.jet, ...fBody }}>
              Public Profile Preview: This is how your profile appears to athletes.
            </span>
          </div>
          <button
            type="button"
            onClick={() => nav("coach-profile-edit")}
            style={{
              padding: isDesktop ? "6px 16px" : "5px 12px",
              borderRadius: 10,
              background: C.jet,
              color: C.white,
              border: "none",
              fontSize: isDesktop ? 13 : 12,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
              ...fBody,
            }}
          >
            Exit Preview
          </button>
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 100 }} className="cl-hide-scrollbar">
        {loading ? (
          <ProfileSkeleton />
        ) : (
          <div style={{ width: "100%", boxSizing: "border-box" }}>
            <div style={{ position: "relative", marginBottom: isDesktop ? 16 : 0 }}>
              <CoachProfileHero
                coach={coach}
                pub={pub}
                heroImage={heroImage}
                avatarSrc={coach.avatar}
                coverHeight={isDesktop ? 500 : 240}
                rounded={false}
                isDesktop={isDesktop}
                onAvatarClick={() => setAvatarOpen(true)}
                overlay={
                  <>
                    <div style={{ position: "absolute", top: isDesktop ? 24 : 12, left: isDesktop ? 64 : 12, pointerEvents: "auto" }}>
                      <BackButton floating onClick={handleBack} />
                    </div>
                    <div style={{ position: "absolute", top: isDesktop ? 24 : 12, right: isDesktop ? 64 : 12, display: "flex", gap: 8, pointerEvents: "auto" }}>
                      <button
                        type="button"
                        className="cl-floating-action-btn"
                        aria-label={fav ? "Remove coach from favourites" : "Add coach to favourites"}
                        aria-pressed={fav}
                        onClick={handleFavourite}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 99,
                          background: fav ? C.brand : C.white,
                          border: `1px solid ${fav ? C.brand : C.border}`,
                          color: fav ? "#FFFFFF" : C.jet,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          boxShadow: "0 4px 14px rgba(22,24,29,.12)",
                          padding: 0,
                          flexShrink: 0,
                        }}
                      >
                        <Heart size={18} color="currentColor" fill={fav ? "currentColor" : "none"} />
                      </button>
                      <button
                        type="button"
                        className="cl-floating-action-btn"
                        aria-label="Share coach profile"
                        onClick={handleShare}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 99,
                          background: C.white,
                          border: `1px solid ${C.border}`,
                          color: C.jet,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          boxShadow: "0 4px 14px rgba(22,24,29,.12)",
                          padding: 0,
                          flexShrink: 0,
                        }}
                      >
                        <Share2 size={18} color="currentColor" />
                      </button>
                    </div>
                  </>
                }
              />
            </div>

            <div style={{ width: "100%", boxSizing: "border-box", padding: isDesktop ? "0 64px 64px" : "0 18px" }}>
              {isDesktop ? (
                <SplitView
                  ratio="minmax(0, 1fr) 340px"
                  gap={28}
                  left={<div style={{ minWidth: 0 }}>{tabPane}</div>}
                  right={summaryRail}
                />
              ) : (
                <>{tabPane}</>
              )}
            </div>
          </div>
        )}
      </div>

      {!isDesktop && (
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: C.white, borderTop: `1px solid ${C.border}`, padding: "14px 18px", paddingBottom: "max(28px, env(safe-area-inset-bottom))", display: "flex", alignItems: "center", gap: 12 }}>
        {isPreview ? (
          <div style={{ flex: 1 }}>
            <Btn full disabled variant="secondary" style={{ opacity: 0.75, cursor: "not-allowed" }}>Book a session</Btn>
          </div>
        ) : unavailable ? (
          <div style={{ flex: 1 }}>
            <Btn full disabled variant="secondary">Unavailable for new bookings</Btn>
          </div>
        ) : tab === "packages" ? (
          <div style={{ flex: 1 }}>
            <Btn full variant="outline" icon={MessageCircle} onClick={() => nav("chat-thread", { name: coach.name, handle: coach.handle })}>Help me choose</Btn>
          </div>
        ) : (
          <div style={{ flex: 1 }}>
            <Btn full onClick={() => setTab("packages")}>View packages</Btn>
          </div>
        )}
        {!isPreview && tab !== "packages" ? (
          <button type="button" aria-label={`Message ${pub.name}`} onClick={() => nav("chat-thread", { name: coach.name, handle: coach.handle })} style={{ width: 46, height: 46, borderRadius: 14, background: C.fog, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <MessageCircle size={18} color={C.jet} />
          </button>
        ) : null}
      </div>
      )}

<BottomSheet
        open={packagePickerOpen}
        onClose={() => setPackagePickerOpen(false)}
        title="Choose a package"
      >
        <div style={{ padding: "4px 0 16px" }}>
          <div style={{ fontSize: T.body, color: C.slate, marginBottom: 14, ...fBody }}>
            Select a package to view details and schedule your session with {pub.name}.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {activePackages.map((pkg) => (
              <Card
                key={pkg.id}
                onClick={() => {
                  setPackagePickerOpen(false);
                  setSelectedPkgId(pkg.id);
                  setPackageSheetStep(1);
                }}
                style={{
                  cursor: "pointer",
                  padding: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  border: `1px solid ${C.border}`,
                  transition: "border-color .15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: C.brandTint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <SportIcon sport={pkg.sport || coach.sport} size={18} color={C.brand} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: T.body, fontWeight: 750, color: C.jet, ...fDisplay }}>{pkg.name}</div>
                    <div style={{ fontSize: T.captionLg, color: C.slate, marginTop: 2, ...fBody }}>
                      {pkg.durationMinutes || pkg.duration || 60} min · {pkg.mode || pkg.locationType || "In-person"}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: T.title, fontWeight: 800, color: C.jet, ...fDisplay }}>${pkg.price}</div>
                  <div style={{ fontSize: 11, color: C.slateLight, ...fBody }}>package</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </BottomSheet>
      <FullscreenImageViewer open={avatarOpen} onClose={() => setAvatarOpen(false)} src={coach.avatar} alt={`${pub.name} profile photo`} />
      {selectedPkg ? (
        <PackageBookingSheet
          key={selectedPkg.id}
          open
          pkg={selectedPkg}
          coach={coach}
          liveAvailability={availabilityBlocks}
          coachPackages={coachPackages}
          initialStep={packageSheetStep}
          initialDate={params.openSchedule ? params.presetDate : undefined}
          initialTime={params.openSchedule ? params.presetTime : undefined}
          onClose={() => setSelectedPkgId(null)}
          onComplete={(presetDate, presetTime) => nav("package-detail", {
            coachId: coach.id,
            packageId: selectedPkg.id,
            presetDate,
            presetTime,
          })}
        />
      ) : null}
    </div>
  );
}
