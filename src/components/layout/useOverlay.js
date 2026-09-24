import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

/* =========================================================================
   useOverlay — shared behavior for modal overlays (states, ESC, focus trap).
   ========================================================================= */

const FOCUSABLE =
  'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [href], [tabindex]:not([tabindex="-1"])';

export function useOverlay({ open, onClose, focusFirst = true, lockScroll = true, restoreFocus = true }) {
  const ref = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Focus management + scroll lock while open
  useLayoutEffect(() => {
    if (!open) return undefined;
    const node = ref.current;
    const previousFocus = document.activeElement;

    if (lockScroll) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }

    const focusable = () => Array.from(node?.querySelectorAll(FOCUSABLE) || []).filter((el) => el.offsetParent !== null);
    if (focusFirst) (focusable()[0] || node)?.focus({ preventScroll: true });

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current?.();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) {
        event.preventDefault();
        node?.focus({ preventScroll: true });
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (lockScroll) document.body.style.overflow = "";
      if (restoreFocus) previousFocus?.focus?.({ preventScroll: true });
    };
  }, [open, focusFirst, lockScroll, restoreFocus]);

  return { ref, close: useCallback(() => onCloseRef.current?.(), []) };
}