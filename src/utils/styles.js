/* =========================================================================
   SHARED INLINE STYLE OBJECTS
   -------------------------------------------------------------------------
   Factory functions that accept C (current palette) so they work in both
   light and dark mode. Callers do: const C = useColors(); style={inputStyle(C)}
   ========================================================================= */
import { fBody, T } from "../theme/theme";

export const oneLine = {
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

export function inputStyle(C) {
  return {
    width: "100%",
    border: `1.5px solid ${C.border}`,
    borderRadius: 13,
    padding: "11px 13px",
    fontSize: T.bodyLg,
    outline: "none",
    boxSizing: "border-box",
    background: C.white,
    color: C.jet,
    ...fBody,
  };
}

export function labelStyle(C) {
  return {
    fontSize: T.labelLg,
    fontWeight: 600,
    color: C.jet,
    marginBottom: 6,
    ...fBody,
  };
}
