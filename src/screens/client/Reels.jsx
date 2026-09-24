import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Volume2, VolumeX, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { CL, fBody, fDisplay, T } from "../../theme/theme";
import { useApp } from "../../context/AppContext";
import { useResponsive } from "../../theme/responsive";
import { COACHES } from "../../data/mockData";
import { getCoachMedia, getBusinessMediaSource } from "../../data/media";
import { Avatar, BackButton, HandleTag, ConfirmDialog } from "../../components/ui/Primitives";
import { getPublicName } from "../../utils/name";

const oneLine = { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };

/** Full-screen viewer for reels and session photos with horizontal navigation arrows
    supporting both portrait and landscape formats. */
export function ScreenCoachMedia({ nav, goBack, params = {} }) {
  const { coachMedia, coachProfile, removeMedia, businessMedia, removeBusinessMedia, toast, businesses } = useApp();
  const { isDesktop } = useResponsive();
  const C = CL;
  const isBusinessMedia = !!params.businessId;
  const business = isBusinessMedia ? (businesses || []).find((item) => item.id === params.businessId) : null;
  const listedCoach = COACHES.find((item) => item.id === params.coachId) || COACHES[0];
  const coach = listedCoach.id === COACHES[1].id ? coachProfile : listedCoach;
  const isManaging = params.manage === true;
  const mediaSource = isBusinessMedia ? getBusinessMediaSource(business?.id) : coach.id;
  const businessItems = businessMedia?.filter((item) => item.businessId === business?.id);
  const media = useMemo(
    () => (isBusinessMedia ? (businessItems?.length ? businessItems : getCoachMedia(mediaSource)) : (coach.id !== COACHES[1].id ? getCoachMedia(mediaSource) : coachMedia)),
    [isBusinessMedia, businessItems, coach.id, mediaSource, coachMedia],
  );
  const initialIndex = Math.max(0, media.findIndex((item) => item.id === params.mediaId));
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [muted, setMuted] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [touchStartX, setTouchStartX] = useState(null);
  const [aspectMap, setAspectMap] = useState({});
  const videoRefs = useRef({});
  const pub = getPublicName(coach, "public");
  const returnTo = isManaging
    ? (isBusinessMedia ? "business-media" : "coach-reels")
    : (isBusinessMedia ? "business-public-profile" : "coach-profile");
  const returnParams = isManaging ? {} : (isBusinessMedia ? { id: business?.id } : { id: coach.id });
  const displayName = isBusinessMedia ? (business?.tradingName || "CoachNivo business") : pub.name;
  const displayAvatar = isBusinessMedia ? business?.profile?.logo : coach.avatar;
  const displayHandle = isBusinessMedia ? null : pub.handle;
  const displayLocation = isBusinessMedia
    ? business?.registeredAddress?.split(",").slice(-2).join(",").trim()
    : coach.suburb;

  const handlePrev = () => {
    if (activeIndex > 0) setActiveIndex((prev) => prev - 1);
  };

  const handleNext = () => {
    if (activeIndex < media.length - 1) setActiveIndex((prev) => prev + 1);
  };

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "ArrowLeft") handlePrev();
      else if (e.key === "ArrowRight") handleNext();
      else if (e.key === "Escape") goBack(returnTo, returnParams);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, media.length]);

  // Video playback sync
  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([index, video]) => {
      if (!video) return;
      if (Number(index) === activeIndex) {
        video.currentTime = 0;
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, [activeIndex]);

  useEffect(() => {
    setActiveIndex((index) => Math.min(index, Math.max(0, media.length - 1)));
  }, [media.length]);

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const remaining = media.filter((item) => item.id !== deleteTarget.id);
    if (isBusinessMedia) {
      removeBusinessMedia?.(deleteTarget.id);
    } else {
      removeMedia?.(deleteTarget.id);
    }
    setDeleteTarget(null);
    toast?.(deleteTarget.type === "reel" ? "Reel removed" : "Photo removed");
    if (!remaining.length) {
      goBack(isBusinessMedia ? "business-media" : "coach-reels");
      return;
    }
    const nextIndex = Math.min(activeIndex, remaining.length - 1);
    setActiveIndex(nextIndex);
  };

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (diff > 45) handleNext();
    else if (diff < -45) handlePrev();
    setTouchStartX(null);
  };

  if (!media.length) {
    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: C.black, color: C.white, padding: 24, textAlign: "center" }}>
        <div>
          <div style={{ fontSize: T.heading, fontWeight: 700, ...fDisplay }}>No highlights yet</div>
          <button type="button" onClick={() => goBack(returnTo, returnParams)} style={{ minHeight: 44, marginTop: 14, border: "none", background: "transparent", color: C.white, cursor: "pointer", fontSize: T.bodyLg, fontWeight: 600, ...fBody }}>Go back</button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        position: "relative",
        background: "#08090B",
        overflow: "hidden",
        userSelect: "none",
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Horizontal Carousel Track */}
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          transform: `translateX(-${activeIndex * 100}%)`,
          transition: "transform 0.32s cubic-bezier(0.25, 1, 0.5, 1)",
          willChange: "transform",
        }}
      >
        {media.map((item, index) => {
          const isLandscape = aspectMap[item.id] === "landscape" || item.aspect === "landscape" || item.orientation === "landscape" || item.format === "landscape" || item.type === "photo";
          return (
            <div
              key={item.id}
              style={{
                width: "100%",
                height: "100%",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                padding: isDesktop ? "36px 80px" : "0",
                boxSizing: "border-box",
                background: "#08090B",
              }}
            >
              {/* Media Frame (adapts cleanly to Portrait vs Landscape) */}
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: isLandscape
                    ? (isDesktop ? "calc(88vh * 16 / 9)" : "100%")
                    : (isDesktop ? "min(480px, 48vh)" : "100%"),
                  maxWidth: isDesktop
                    ? (isLandscape ? "calc(100vw - 160px)" : "min(480px, 48vh)")
                    : "100%",
                  height: isLandscape
                    ? (isDesktop ? "88vh" : "auto")
                    : (isDesktop ? "88vh" : "100%"),
                  maxHeight: isDesktop ? "88vh" : "100%",
                  aspectRatio: isLandscape ? "16/9" : (isDesktop ? "9/16" : undefined),
                  borderRadius: isDesktop ? 22 : 0,
                  overflow: "hidden",
                  background: "#0E1015",
                  boxShadow: isDesktop ? "0 24px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.1)" : "none",
                }}
              >
                {item.type === "reel" ? (
                  <video
                    ref={(el) => { videoRefs.current[index] = el; }}
                    src={item.url}
                    muted={muted}
                    loop
                    playsInline
                    preload={index === activeIndex ? "auto" : "metadata"}
                    onLoadedMetadata={(e) => {
                      const { videoWidth, videoHeight } = e.target;
                      if (videoWidth && videoHeight) {
                        setAspectMap((prev) => ({
                          ...prev,
                          [item.id]: videoWidth / videoHeight >= 1.15 ? "landscape" : "portrait",
                        }));
                      }
                    }}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                      background: "#000",
                    }}
                  />
                ) : (
                  <img
                    src={item.url}
                    alt={item.caption}
                    onLoad={(e) => {
                      const { naturalWidth, naturalHeight } = e.target;
                      if (naturalWidth && naturalHeight) {
                        setAspectMap((prev) => ({
                          ...prev,
                          [item.id]: naturalWidth / naturalHeight >= 1.15 ? "landscape" : "portrait",
                        }));
                      }
                    }}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                      background: "#000",
                    }}
                  />
                )}

                {/* Subtle gradient overlay at bottom for readability */}
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    background: "linear-gradient(180deg, rgba(0,0,0,.45) 0%, transparent 22%, transparent 56%, rgba(0,0,0,.85) 100%)",
                  }}
                />

                

                {/* Bottom metadata & controls */}
                <div
                  style={{
                    position: "absolute",
                    left: 18,
                    right: 18,
                    bottom: isDesktop ? 22 : 36,
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 14,
                    color: C.white,
                    zIndex: 10,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <button
                      type="button"
                      onClick={() => nav(returnTo, returnParams)}
                      style={{
                        padding: 0,
                        border: "none",
                        background: "transparent",
                        color: C.white,
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <Avatar name={displayName} src={displayAvatar} size={42} />
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: T.bodyLg, fontWeight: 700, ...oneLine, ...fDisplay }}>
                          {displayName}
                        </span>
                        {displayHandle && <HandleTag handle={displayHandle} size={11} color={C.onDark} />}
                      </span>
                    </button>
                    <div style={{ fontSize: T.bodyLg, fontWeight: 600, lineHeight: 1.35, marginTop: 10, textShadow: "0 2px 6px rgba(0,0,0,0.8)", ...fBody }}>
                      {item.caption}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5, fontSize: T.label, color: C.onDark, ...fBody }}>
                      <MapPin size={13} />
                      {displayLocation}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center", flexShrink: 0 }}>
                    {isManaging && (
                      <MediaAction C={C} destructive label={`Delete ${item.type === "reel" ? "reel" : "photo"}`} onClick={() => setDeleteTarget(item)}>
                        <Trash2 size={20} />
                      </MediaAction>
                    )}
                    {item.type === "reel" && (
                      <MediaAction C={C} label={muted ? "Turn sound on" : "Mute reel"} onClick={() => setMuted((val) => !val)}>
                        {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                      </MediaAction>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Left Navigation Arrow */}
      {activeIndex > 0 && (
        <button
          type="button"
          aria-label="Previous reel"
          onClick={handlePrev}
          style={{
            position: "absolute",
            left: isDesktop ? 24 : 10,
            top: "50%",
            transform: "translateY(-50%)",
            width: isDesktop ? 52 : 42,
            height: isDesktop ? 52 : 42,
            borderRadius: 999,
            background: "rgba(22, 24, 29, 0.78)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: C.white,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 25,
            boxShadow: "0 10px 28px rgba(0,0,0,0.5)",
            transition: "transform .16s cubic-bezier(0.16, 1, 0.3, 1), background .18s ease, border-color .18s ease, box-shadow .18s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = C.brand;
            e.currentTarget.style.borderColor = C.brand;
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(241, 90, 41, 0.55)";
            e.currentTarget.style.transform = "translateY(-50%) scale(1.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(22, 24, 29, 0.78)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
            e.currentTarget.style.boxShadow = "0 10px 28px rgba(0,0,0,0.5)";
            e.currentTarget.style.transform = "translateY(-50%) scale(1)";
          }}
        >
          <ChevronLeft size={isDesktop ? 28 : 22} color="#FFFFFF" />
        </button>
      )}

      {/* Right Navigation Arrow */}
      {activeIndex < media.length - 1 && (
        <button
          type="button"
          aria-label="Next reel"
          onClick={handleNext}
          style={{
            position: "absolute",
            right: isDesktop ? 24 : 10,
            top: "50%",
            transform: "translateY(-50%)",
            width: isDesktop ? 52 : 42,
            height: isDesktop ? 52 : 42,
            borderRadius: 999,
            background: "rgba(22, 24, 29, 0.78)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 25,
            boxShadow: "0 10px 28px rgba(0,0,0,0.5)",
            transition: "transform .16s cubic-bezier(0.16, 1, 0.3, 1), background .18s ease, border-color .18s ease, box-shadow .18s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = C.brand;
            e.currentTarget.style.borderColor = C.brand;
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(241, 90, 41, 0.55)";
            e.currentTarget.style.transform = "translateY(-50%) scale(1.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(22, 24, 29, 0.78)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
            e.currentTarget.style.boxShadow = "0 10px 28px rgba(0,0,0,0.5)";
            e.currentTarget.style.transform = "translateY(-50%) scale(1)";
          }}
        >
          <ChevronRight size={isDesktop ? 28 : 22} color="#FFFFFF" />
        </button>
      )}

      {/* Top Floating Controls */}
      <div style={{ position: "absolute", top: isDesktop ? 24 : 52, left: isDesktop ? 24 : 16, zIndex: 30 }}>
        <BackButton floating onClick={() => goBack(returnTo, returnParams)} />
      </div>

      <div
        style={{
          position: "absolute",
          top: isDesktop ? 28 : 60,
          right: isDesktop ? 24 : 18,
          color: C.white,
          fontSize: T.label,
          fontWeight: 700,
          background: "rgba(0,0,0,0.5)",
          padding: "5px 12px",
          borderRadius: 99,
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.12)",
          zIndex: 30,
          ...fBody,
        }}
      >
        {activeIndex + 1} / {media.length}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={`Delete this ${deleteTarget?.type === "reel" ? "reel" : "photo"}?`}
        description="It will be permanently removed from your public profile. This can't be undone."
        confirmLabel={`Delete ${deleteTarget?.type === "reel" ? "reel" : "photo"}`}
        icon={Trash2}
      />
    </div>
  );
}

function MediaAction({ C, label, onClick, destructive = false, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={{
        width: 44,
        height: 44,
        padding: 0,
        border: `1px solid ${C.onDarkDivider}`,
        borderRadius: 999,
        background: C.jetSoft,
        color: C.white,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      }}
    >
      {children}
    </button>
  );
}
