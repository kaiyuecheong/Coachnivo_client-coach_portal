import React, { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, Layers3 } from "lucide-react";
import { CL, CD, fDisplay, fBody, T, LAYOUT } from "../../theme/theme";
import { useApp } from "../../context/AppContext";
import { useResponsive } from "../../theme/responsive";
import { SportIcon } from "./SportUI";
import { haptic } from "../../utils/haptics";

const oneLine = { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };

export function PromoBannerCarousel({ banners = [], onSelectBanner, style }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const { isDesktop } = useResponsive();
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredSide, setHoveredSide] = useState(null);
  const railRef = useRef(null);
  const scrollTimerRef = useRef(null);

  useEffect(() => () => {
    if (scrollTimerRef.current) window.clearTimeout(scrollTimerRef.current);
  }, []);

  const handleScroll = () => {
    if (!railRef.current) return;
    if (scrollTimerRef.current) window.clearTimeout(scrollTimerRef.current);

    scrollTimerRef.current = window.setTimeout(() => {
      const rail = railRef.current;
      if (!rail) return;
      const cards = [...rail.querySelectorAll("button[data-package-slide]")];
      const firstOffset = cards[0]?.offsetLeft || 0;
      const nextIndex = cards.reduce((closest, card, index) => {
        const distance = Math.abs((card.offsetLeft - firstOffset) - rail.scrollLeft);
        return distance < closest.distance ? { index, distance } : closest;
      }, { index: 0, distance: Infinity }).index;
      setActiveIndex(nextIndex);
    }, 70);
  };

  const goToSlide = (index) => {
    const rail = railRef.current;
    if (!rail) return;
    const cards = [...rail.querySelectorAll("button[data-package-slide]")];
    const card = cards[index];
    if (!card) return;
    haptic(8);
    setActiveIndex(index);
    rail.scrollTo({
      left: card.offsetLeft - (cards[0]?.offsetLeft || 0),
      behavior: "smooth",
    });
  };
  const goToSlideRef = useRef(goToSlide);
  goToSlideRef.current = goToSlide;

  // Autoplay — advances every few seconds; resets when the user navigates.
  useEffect(() => {
    if (!banners.length) return undefined;
    const id = window.setInterval(() => {
      goToSlideRef.current((activeIndex + 1) % banners.length);
    }, 4000);
    return () => window.clearInterval(id);
  }, [banners.length, activeIndex]);

  if (!banners.length) return null;

  const arrowBtnStyle = (side) => {
    const isHovered = hoveredSide === side;
    return {
      width: 38,
      height: 38,
      borderRadius: 99,
      border: `1.5px solid ${isHovered ? C.brand : C.border}`,
      background: isHovered ? C.brand : C.white,
      color: isHovered ? "#FFFFFF" : C.jet,
      boxShadow: isHovered
        ? `0 6px 18px color-mix(in srgb, ${C.brand} 35%, transparent)`
        : "0 4px 14px rgba(0,0,0,.08)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      padding: 0,
      transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
      transform: isHovered ? "scale(1.05)" : "scale(1)",
    };
  };

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label="Popular coaching packages"
      style={{ width: "100%", marginBottom: 22, ...style }}
    >
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, marginBottom: 24 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: C.jet, fontSize: isDesktop ? 24 : T.title, fontWeight: 700, ...fDisplay }}>
            Popular coaching packages
          </div>
          <div style={{ marginTop: 2, color: C.slate, fontSize: isDesktop ? T.body : T.captionLg, ...fBody }}>
            Group formats with more value per session
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button
            type="button"
            aria-label="Previous packages"
            onClick={() => goToSlide((activeIndex - 1 + banners.length) % banners.length)}
            onMouseEnter={() => setHoveredSide("left")}
            onMouseLeave={() => setHoveredSide(null)}
            style={arrowBtnStyle("left")}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            aria-label="Next packages"
            onClick={() => goToSlide((activeIndex + 1) % banners.length)}
            onMouseEnter={() => setHoveredSide("right")}
            onMouseLeave={() => setHoveredSide(null)}
            style={arrowBtnStyle("right")}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div
        ref={railRef}
        onScroll={handleScroll}
        className="cl-hide-scrollbar cl-swipe-row"
        style={{
          display: "flex",
          gap: 12,
          margin: isDesktop ? "0 -64px" : "0 -18px",
          padding: isDesktop ? "2px 0 4px" : "2px 18px 4px",
          paddingLeft: isDesktop ? 64 : undefined,
          overflowX: "auto",
          overflowY: "visible",
          overscrollBehaviorX: "contain",
          scrollPaddingInline: isDesktop ? undefined : 18,
          scrollPaddingLeft: isDesktop ? 64 : undefined,
          scrollSnapType: "x proximity",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {banners.map((banner, index) => (
          <button
            key={banner.id || index}
            data-package-slide="true"
            type="button"
            aria-label={`${banner.title}. ${banner.packageMeta}. ${banner.priceTag}. View package.`}
            aria-current={activeIndex === index ? "true" : undefined}
            onClick={() => {
              haptic(10);
              onSelectBanner?.(banner);
            }}
            style={{
              position: "relative",
              flex: isDesktop ? "0 0 calc((100% - 24px) / 2.25)" : "0 0 calc(100% - 40px)",
              minWidth: 0,
              aspectRatio: "16 / 9",
              minHeight: LAYOUT.touchTarget,
              padding: 0,
              overflow: "hidden",
              scrollSnapAlign: "start",
              border: `0px`,
              borderRadius: LAYOUT.cardRadius,
              color: CL.white,
              cursor: "pointer",
              textAlign: "left",
              userSelect: "none",
              outline: "none",
            }}
          >
            <img
              src={banner.image}
              alt=""
              aria-hidden="true"
              draggable="false"
              loading={index === 0 ? "eager" : "lazy"}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: banner.imagePosition || "center",
              }}
            />

            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(to top, color-mix(in srgb, ${CL.black} 92%, transparent) 0%, color-mix(in srgb, ${CL.black} 64%, transparent) 43%, color-mix(in srgb, ${CL.black} 8%, transparent) 76%)`,
              }}
            />

            <span
              style={{
                position: "relative",
                zIndex: 1,
                height: "100%",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                padding: 12,
              }}
            >
              <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span
                  style={{
                    minHeight: 22,
                    minWidth: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "0 7px",
                    borderRadius: LAYOUT.pillRadius,
                    background: `color-mix(in srgb, ${C.brandColor} 90%, ${CL.black})`,
                    color: CL.white,
                    fontSize: T.micro,
                    fontWeight: 700,
                    letterSpacing: ".35px",
                    textTransform: "uppercase",
                    ...fBody,
                  }}
                >
                  <SportIcon sport={banner.sport} size={10} color={CL.white} />
                  <span style={oneLine}>{banner.sport}</span>
                </span>

                <span
                  style={{
                    minHeight: 22,
                    flexShrink: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "0 7px",
                    border: `1px solid color-mix(in srgb, ${CL.white} 28%, transparent)`,
                    borderRadius: LAYOUT.pillRadius,
                    background: `color-mix(in srgb, ${CL.black} 42%, transparent)`,
                    color: CL.white,
                    fontSize: T.micro,
                    fontWeight: 700,
                    ...fBody,
                  }}
                >
                  <Layers3 size={10} strokeWidth={2.4} aria-hidden="true" />
                  {banner.badge}
                </span>
              </span>

              <span style={{ marginTop: "auto", minWidth: 0 }}>
                <span
                  style={{
                    display: "block",
                    color: CL.white,
                    fontSize: isDesktop ? 22 : T.titleLg,
                    fontWeight: 700,
                    lineHeight: 1.15,
                    letterSpacing: "-.2px",
                    ...oneLine,
                    ...fDisplay,
                  }}
                >
                  {banner.title}
                </span>

                <span
                  style={{
                    display: "block",
                    marginTop: 4,
                    color: CL.onDark,
                    fontSize: isDesktop ? T.body : T.captionLg,
                    fontWeight: 500,
                    ...oneLine,
                    ...fBody,
                  }}
                >
                  {banner.packageMeta}
                </span>

                <span style={{ minHeight: 36, marginTop: 6, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <span style={{ minWidth: 0, color: CL.white, fontSize: isDesktop ? T.bodyLg : T.labelLg, fontWeight: 700, ...oneLine, ...fDisplay }}>
                    {banner.priceTag}
                  </span>
                  <span
                    style={{
                      minHeight: 30,
                      flexShrink: 0,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                      padding: "0 9px",
                      border: `1px solid color-mix(in srgb, ${CL.white} 24%, transparent)`,
                      borderRadius: 10,
                      background: `color-mix(in srgb, ${CL.white} 14%, transparent)`,
                      color: CL.white,
                      fontSize: T.captionLg,
                      fontWeight: 700,
                      ...fBody,
                    }}
                  >
                    View
                    <ArrowUpRight size={13} strokeWidth={2.4} aria-hidden="true" />
                  </span>
                </span>
              </span>
            </span>
          </button>
        ))}
      </div>

      {banners.length > 1 && (
        <div
          role="group"
          aria-label="Choose coaching package"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            marginTop: 16,
          }}
        >
          {banners.map((banner, index) => {
            const isActive = activeIndex === index;
            return (
              <button
                key={banner.id || index}
                type="button"
                aria-label={`Show ${banner.title}`}
                aria-current={isActive ? "true" : undefined}
                onClick={() => goToSlide(index)}
                style={{
                  minWidth: 0,
                  minHeight: 0,
                  width: "auto",
                  height: "auto",
                  padding: "4px 2px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "none",
                  outline: "none",
                  boxShadow: "none",
                  borderRadius: LAYOUT.pillRadius,
                  background: "transparent",
                  cursor: "pointer",
                  transform: "none",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: isActive ? 20 : 6,
                    height: 6,
                    borderRadius: LAYOUT.pillRadius,
                    background: isActive ? C.brand : (C.border || "#E7E8EC"),
                    opacity: isActive ? 1 : 0.65,
                    boxShadow: "none",
                    transition: "all .24s cubic-bezier(.22,1,.36,1)",
                  }}
                />
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
