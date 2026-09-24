import React, { Children, useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useColors } from "../../theme/ThemeContext";
import { useResponsive } from "../../theme/responsive";

/* =========================================================================
   CardSlider — renders a listing as a horizontal row of cards with a
   scroll-snap slider (swipe on touch, arrow controls on hover devices).
   Cards keep a fixed width so overflow scrolls instead of stacking.
   ========================================================================= */

export function CardSlider({
  children,
  itemWidth = 320,
  perView,
  peek = 0,
  gap = 16,
  style,
  showArrows = true,
  showIndicator = true,
  ariaLabel,
}) {
  const C = useColors();
  const { isHover } = useResponsive();
  const ref = useRef(null);
  const [edges, setEdges] = useState({ start: false, end: false });
  const [hoveredSide, setHoveredSide] = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [canScroll, setCanScroll] = useState(false);

  // Fluid sizing: `perView` shows that many cards per screen (+`peek` of the
  // next card); otherwise a fixed card width is used.
  const cardWidth = perView
    ? `calc((100% - ${gap * (perView - 1)}px) / ${perView + peek})`
    : `${itemWidth}px`;

  const validChildren = Children.toArray(children).filter(Boolean);
  const totalItems = validChildren.length;
  const pageCount = perView
    ? Math.max(1, Math.ceil(totalItems / perView))
    : Math.max(1, Math.ceil(totalItems / 2));

  const measure = () => {
    const el = ref.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const scrollable = maxScroll > 4;
    setCanScroll(scrollable);
    setEdges({
      start: el.scrollLeft > 4,
      end: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
    if (scrollable) {
      setScrollProgress(Math.min(1, Math.max(0, el.scrollLeft / maxScroll)));
    } else {
      setScrollProgress(0);
    }
  };

  useEffect(() => {
    measure();
    const el = ref.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, [children, perView]);

  const scroll = (dir) => {
    const el = ref.current;
    if (!el) return;
    const step = perView ? Math.max((el.clientWidth / perView) * 0.85, 180) : (itemWidth + gap);
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  const scrollToPage = (pageIndex) => {
    const el = ref.current;
    if (!el || pageCount <= 1) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const targetScroll = (pageIndex / (pageCount - 1)) * maxScroll;
    el.scrollTo({ left: targetScroll, behavior: "smooth" });
  };

  const activePage = Math.min(pageCount - 1, Math.max(0, Math.round(scrollProgress * (pageCount - 1))));

  const arrow = (side) => {
    const isHovered = hoveredSide === side;
    return {
      position: "absolute",
      top: "50%",
      transform: isHovered ? "translateY(-52%)" : "translateY(-50%)",
      [side]: -12,
      width: 38,
      height: 38,
      borderRadius: 99,
      border: `1.5px solid ${isHovered ? C.brand : C.border}`,
      background: isHovered ? C.brand : C.white,
      color: isHovered ? "#FFFFFF" : C.jet,
      boxShadow: isHovered
        ? "0 6px 18px rgba(255,107,0,.35)"
        : "0 4px 14px rgba(0,0,0,.08)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      zIndex: 10,
      padding: 0,
      transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
    };
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div
        ref={ref}
        role="list"
        aria-label={ariaLabel}
        onScroll={measure}
        style={{
          display: "flex",
          gap,
          overflowX: "auto",
          overflowY: "visible",
          scrollSnapType: "x proximity",
          overscrollBehaviorX: "contain",
          padding: "8px 4px 12px",
          margin: "-8px -4px -12px",
          ...style,
        }}
        className="cl-hide-scrollbar"
      >
        {validChildren.map((child, i) => (
          <div
            key={i}
            role="listitem"
            style={{
              flex: `0 0 ${cardWidth}`,
              width: perView ? "100%" : itemWidth,
              maxWidth: perView ? undefined : itemWidth,
              scrollSnapAlign: "start",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {child}
          </div>
        ))}
      </div>

      {showArrows && isHover && edges.start && (
        <button
          type="button"
          aria-label="Scroll backwards"
          onClick={() => scroll(-1)}
          onMouseEnter={() => setHoveredSide("left")}
          onMouseLeave={() => setHoveredSide(null)}
          style={arrow("left")}
        >
          <ChevronLeft size={18} />
        </button>
      )}
      {showArrows && isHover && edges.end && (
        <button
          type="button"
          aria-label="Scroll forwards"
          onClick={() => scroll(1)}
          onMouseEnter={() => setHoveredSide("right")}
          onMouseLeave={() => setHoveredSide(null)}
          style={arrow("right")}
        >
          <ChevronRight size={18} />
        </button>
      )}

      {showIndicator && pageCount > 1 && canScroll && (
        <div
          role="group"
          aria-label="Slider pagination"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            marginTop: 16,
          }}
        >
          {Array.from({ length: pageCount }, (_, i) => {
            const isActive = i === activePage;
            return (
              <button
                key={i}
                type="button"
                aria-label={`Go to page ${i + 1}`}
                aria-current={isActive ? "true" : undefined}
                onClick={() => scrollToPage(i)}
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
                  borderRadius: 99,
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
                    borderRadius: 99,
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
    </div>
  );
}