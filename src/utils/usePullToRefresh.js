import { useEffect, useRef, useState } from "react";

/* Touch-driven pull-to-refresh for a scroll container. Engages only when the
   container is at scrollTop 0; applies rubber-band resistance and releases
   into a refresh once the pull passes `threshold`. Mouse-only environments
   (e.g. the desktop Studio shell) simply never engage. Attach `scrollRef` to
   the scrolling element and drive the indicator from `pull`/`refreshing`. */
export function usePullToRefresh({ onRefresh, threshold = 62, maxPull = 110 } = {}) {
  const scrollRef = useRef(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const pullRef = useRef(0);
  const refreshingRef = useRef(false);
  refreshingRef.current = refreshing;
  const onRefreshRef = useRef(onRefresh);
  useEffect(() => { onRefreshRef.current = onRefresh; }, [onRefresh]);

  const setPullTracked = (value) => {
    pullRef.current = value;
    setPull(value);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || typeof window === "undefined" || !("ontouchstart" in window)) return undefined;

    let startY = 0;
    let tracking = false;
    let pulling = false;

    const onStart = (event) => {
      if (refreshingRef.current) return;
      if (el.scrollTop <= 0) {
        startY = event.touches[0].clientY;
        tracking = true;
        pulling = false;
      }
    };

    const onMove = (event) => {
      if (!tracking || refreshingRef.current) return;
      const delta = event.touches[0].clientY - startY;
      if (delta > 4 && el.scrollTop <= 0) {
        pulling = true;
        event.preventDefault();
        setPullTracked(Math.min(delta * 0.45, maxPull));
      } else if (pulling && delta <= 0) {
        setPullTracked(0);
      }
    };

    const onEnd = () => {
      if (!tracking) return;
      tracking = false;
      const current = pullRef.current;
      setPullTracked(0);
      if (!refreshingRef.current && current >= threshold) {
        setRefreshing(true);
        Promise.resolve(onRefreshRef.current?.()).finally(() => {
          setTimeout(() => setRefreshing(false), 400);
        });
      }
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    el.addEventListener("touchcancel", onEnd);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
  }, [maxPull, threshold]);

  return { scrollRef, pull, refreshing };
}
