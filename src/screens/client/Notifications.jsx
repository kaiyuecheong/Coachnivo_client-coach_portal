import React, { useState, useEffect } from "react";
import { Bell, Calendar, MessageCircle, Star, Sparkles, Percent, CreditCard, Check, ShieldCheck, Timer } from "lucide-react";
import { CL, CD, fDisplay, fBody, T } from "../../theme/theme";
import { useApp } from "../../context/AppContext";
import { TopBar, EmptyState, ThreadSkeleton } from "../../components/ui/Primitives";
import { useResponsive } from "../../theme/responsive";

const NOTIF_ICON = { booking: Calendar, message: MessageCircle, review: Star, availability: Sparkles, promo: Percent, payment: CreditCard, verification: ShieldCheck, session: Timer };

// Dedicated screen instead of a bottom sheet — gives notifications room to
// breathe (full list, no clipped height) and a natural place to grow into
// per-notification detail/management later, instead of being squeezed into
// a sheet meant for quick glances.
export function ScreenNotifications({
  nav, clientNotifications: notifications = [], setClientNotifications: setNotifications,
  bookings = [], toast,
}) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const { isDesktop } = useResponsive();
  const [loading, setLoading] = useState(true);
  const unreadCount = notifications.filter((n) => n.unread).length;

  useEffect(() => { const t = setTimeout(() => setLoading(false), 800); return () => clearTimeout(t); }, []);

  const markAllRead = () => setNotifications?.((arr) => arr.map((n) => ({ ...n, unread: false })));

  const openNotification = (n) => {
    setNotifications?.((arr) => arr.map((x) => (x.id === n.id ? { ...x, unread: false } : x)));
    if (n.type === "message") nav("chat-thread", { name: n.coachName, handle: n.coachHandle });
    else if (n.type === "availability" && n.coachId) nav("coach-profile", { id: n.coachId });
    else if (n.type === "verification") nav("client-profile");
    else if (n.type === "payment" && n.chargeId) {
      nav("additional-charge-review", { chargeId: n.chargeId, role: "client", backTo: "notifications" });
    }
    else if (n.type === "session" && n.bookingId) {
      const live = bookings.some((booking) => booking.id === n.bookingId && booking.status === "in_progress");
      if (live) nav("session-progress", { bookingId: n.bookingId, role: "client" });
      else if (bookings.some((booking) => booking.id === n.bookingId)) nav("client-booking-detail", { id: n.bookingId });
      else nav("client-dashboard");
    }
    else if (["booking", "review", "payment"].includes(n.type)) {
      const bookingExists = n.bookingId && bookings.some((booking) => booking.id === n.bookingId);
      if (n.bookingId && !bookingExists) {
        toast?.("This booking update is no longer available");
        nav("client-dashboard");
        return;
      }
      nav(bookingExists ? "client-booking-detail" : "client-dashboard", bookingExists ? { id: n.bookingId } : {});
    }
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar title="Notifications" onBack={() => nav("client-home")} />

      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: unreadCount > 0 ? (isDesktop ? "16px 64px 0" : "10px 18px 0") : "0" }}>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              style={{ display: "flex", alignItems: "center", gap: 5, alignSelf: "flex-start", background: "none", border: "none", color: C.brand, fontSize: T.labelLg, fontWeight: 600, cursor: "pointer", margin: "2px 0 12px", padding: "2px 0", ...fBody }}
            >
              <Check size={13} /> Mark all as read
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: "auto", width: "100%", padding: unreadCount > 0 ? (isDesktop ? "0 64px 48px" : "0 18px 24px") : (isDesktop ? "24px 64px 48px" : "16px 18px 24px") }} className="cl-hide-scrollbar">
          {loading ? (
            <ThreadSkeleton rows={5} />
          ) : notifications.length === 0 ? (
            <EmptyState icon={Bell} title="No notifications yet" body="Updates about your bookings, messages and offers will show up here." />
          ) : (
            <div className="cl-stagger">
              {notifications.map((n, i) => {
                const Icon = NOTIF_ICON[n.type] || Bell;
                return (
                  <button
                    key={n.id}
                    onClick={() => openNotification(n)}
                    style={{ width: "100%", display: "flex", gap: 12, alignItems: "flex-start", padding: "14px 4px", background: "none", border: "none", borderBottom: `1px solid ${C.border}`, cursor: "pointer", textAlign: "left", animationDelay: `${Math.min(i, 8) * 45}ms` }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: C.brandTint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={18} color={C.brandIcon || C.brandColor} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <span style={{ fontSize: T.bodyLg, fontWeight: 600, color: C.jet, ...fBody }}>{n.title}</span>
                        <span style={{ fontSize: T.caption, color: C.slateLight, flexShrink: 0, ...fBody }}>{n.time}</span>
                      </div>
                      <div style={{ fontSize: T.body, color: C.slate, marginTop: 4, lineHeight: 1.5, ...fBody }}>{n.body}</div>
                    </div>
                    {n.unread && <span style={{ width: 8, height: 8, borderRadius: 99, background: C.brand, flexShrink: 0, marginTop: 6 }} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
