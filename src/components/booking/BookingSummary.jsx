import { useColors } from "../../theme/ThemeContext";
import { LAYOUT, T } from "../../theme/theme";
import { RightSummary, Stack, Row as FlexRow } from "../../components/layout";
import { Avatar } from "../../components/ui/Primitives";
import { getPublicName } from "../../utils/name";

/* =========================================================================
   BookingSummary — sticky order-summary rail for the desktop booking
   checkout and booking detail. Mobile screens keep their own inline summary;
   ≥1024px screens put the order info in this rail via SplitView.
   ========================================================================= */

export function BookingSummary({
  coach,
  avatar = coach?.avatar,
  name,
  handle,
  service,
  date,
  time,
  detail,
  rows = [],
  total,
  totalLabel = "Total",
  note,
  actions,
  sticky = true,
  C: colorOverride,
}) {
  const colors = useColors();
  const C = colorOverride || colors;
  const pub = name ? { name, handle } : coach ? getPublicName(coach, "public") : null;

  return (
    <RightSummary sticky={sticky}>
      <Stack gap={12}>
        {coach && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar name={pub?.name || "Coach"} src={avatar} size={44} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: T.title, fontWeight: 700, color: C.jet, ...({ fontFamily: "'Outfit', sans-serif" }) }}>
                {pub?.name || name}
              </div>
              {pub?.handle && <div style={{ fontSize: T.captionLg, color: C.slate, ...({ fontFamily: "'Inter', sans-serif" }) }}>{pub.handle}</div>}
            </div>
          </div>
        )}

        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 4 }}>
          <div style={{ fontSize: T.bodyLg, fontWeight: 700, color: C.jet, ...({ fontFamily: "'Outfit', sans-serif" }) }}>{service}</div>
          {(date || detail) && (
            <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 6, fontSize: T.body, color: C.slate, ...({ fontFamily: "'Inter', sans-serif" }) }}>
              {date && <span>{date}{time ? ` · ${time}` : ""}</span>}
              {detail && <span style={{ color: C.slateLight, fontSize: T.captionLg }}>{detail}</span>}
            </div>
          )}
        </div>

        {rows.length > 0 && (
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 4 }}>
            {rows.map((row, i) => (
              <FlexRow key={i} wrap={false} justify="space-between" style={{ padding: "7px 0", borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <span style={{ fontSize: T.body, color: C.slate, ...({ fontFamily: "'Inter', sans-serif" }) }}>{row.label}</span>
                <b style={{ fontSize: T.body, color: C.jet, fontWeight: row.bold ? 800 : 600, ...({ fontFamily: "'Inter', sans-serif" }) }}>{row.value}</b>
              </FlexRow>
            ))}
            {total != null && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, marginTop: 2, borderTop: `1px solid ${C.border}` }}>
                <span style={{ fontSize: T.bodyLg, fontWeight: 700, color: C.jet, ...({ fontFamily: "'Inter', sans-serif" }) }}>{totalLabel}</span>
                <span style={{ fontSize: T.heading, fontWeight: 800, color: C.jet, ...({ fontFamily: "'Outfit', sans-serif" }) }}>{total}</span>
              </div>
            )}
          </div>
        )}

        {note && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: T.captionLg, color: C.slateLight, lineHeight: 1.5, ...({ fontFamily: "'Inter', sans-serif" }) }}>
            <span>{note}</span>
          </div>
        )}

        {actions && <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>{actions}</div>}
      </Stack>
    </RightSummary>
  );
}

export const CHECKOUT_MAXW = 1160;