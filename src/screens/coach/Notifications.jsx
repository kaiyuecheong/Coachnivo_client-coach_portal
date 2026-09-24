import React, { useState, useEffect } from "react";
import { Bell, Calendar, Check, MessageCircle, Percent, ShieldAlert, Star, Timer } from "lucide-react";
import { CL, CD, fBody, T } from "../../theme/theme";
import { useApp } from "../../context/AppContext";
import { EmptyState, TopBar, ThreadSkeleton } from "../../components/ui/Primitives";
import { withClientMeta } from "../../data/users";
import { useResponsive } from "../../theme/responsive";

const NOTIFICATION_ICON = {
  booking: Calendar,
  message: MessageCircle,
  review: Star,
  verification: ShieldAlert,
  promo: Percent,
  session: Timer,
};

export function ScreenCoachNotifications({ nav, coachNotifications: notifications = [], setCoachNotifications, coachBookings = [] }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const { isDesktop } = useResponsive();
  const [loading, setLoading] = useState(true);
  const unreadCount = notifications.filter((notification) => notification.unread).length;

  useEffect(() => { const t = setTimeout(() => setLoading(false), 800); return () => clearTimeout(t); }, []);

  const markAllRead = () => setCoachNotifications?.((items) => items.map((item) => ({ ...item, unread: false })));
  const openNotification = (notification) => {
    setCoachNotifications?.((items) => items.map((item) => item.id === notification.id ? { ...item, unread: false } : item));
    if (notification.type === "message") {
      nav("chat-thread", {
        name: notification.clientName || "Client",
        handle: notification.clientName ? withClientMeta({ clientName: notification.clientName }).clientHandle : undefined,
        threadId: notification.threadId,
        backTo: "coach-notifications",
      });
    } else if (notification.type === "verification") nav("coach-profile-edit");
    else if (notification.type === "session" && notification.bookingId) {
      const live = coachBookings.some((booking) => booking.id === notification.bookingId && booking.status === "in_progress");
      if (live) nav("session-progress", { bookingId: notification.bookingId, role: "coach" });
      else if (coachBookings.some((booking) => booking.id === notification.bookingId)) nav("coach-session-detail", { id: notification.bookingId });
      else nav("coach-bookings");
    }
    else if (notification.type === "booking") nav("coach-bookings");
    else if (notification.type === "review") nav("coach-dashboard");
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar title="Notifications" onBack={() => nav("coach-dashboard")} />
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: unreadCount > 0 ? (isDesktop ? "16px 64px 0" : "10px 18px 0") : "0" }}>
          {unreadCount > 0 && (
            <button type="button" onClick={markAllRead} style={{ display: "flex", alignItems: "center", gap: 5, alignSelf: "flex-start", background: "none", border: "none", color: C.brand, fontSize: T.labelLg, fontWeight: 600, cursor: "pointer", margin: "2px 0 12px", padding: "2px 0", ...fBody }}>
              <Check size={13} /> Mark all as read
            </button>
          )}
        </div>
        <div style={{ flex: 1, overflowY: "auto", width: "100%", padding: unreadCount > 0 ? (isDesktop ? "0 64px 48px" : "0 18px 24px") : (isDesktop ? "24px 64px 48px" : "16px 18px 24px") }} className="cl-hide-scrollbar">
          {loading ? (
            <ThreadSkeleton rows={5} />
          ) : notifications.length === 0 ? (
            <EmptyState icon={Bell} title="No notifications yet" body="Booking, message and payment updates will appear here." />
          ) : (
            <div className="cl-stagger">
              {notifications.map((notification, index) => {
                const Icon = NOTIFICATION_ICON[notification.type] || Bell;
                const warning = notification.type === "verification";
                return (
                  <button key={notification.id} type="button" onClick={() => openNotification(notification)} style={{ width: "100%", display: "flex", gap: 12, alignItems: "flex-start", padding: "14px 4px", background: "none", border: "none", borderBottom: `1px solid ${C.border}`, cursor: "pointer", textAlign: "left", animationDelay: `${Math.min(index, 8) * 45}ms` }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: warning ? C.warnTint : C.brandTint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={18} color={warning ? C.warnStrong : (C.brandIcon || C.brandColor)} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <span style={{ fontSize: T.bodyLg, fontWeight: 600, color: C.jet, ...fBody }}>{notification.title}</span>
                        <span style={{ fontSize: T.caption, color: C.slateLight, flexShrink: 0, ...fBody }}>{notification.time}</span>
                      </div>
                      <div style={{ fontSize: T.body, color: C.slate, marginTop: 4, lineHeight: 1.5, ...fBody }}>{notification.body}</div>
                    </div>
                    {notification.unread && <span style={{ width: 8, height: 8, borderRadius: 99, background: C.brand, flexShrink: 0, marginTop: 6 }} />}
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
