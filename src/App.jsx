import React, { useEffect, useRef, useState } from "react";
import {
  Home, Calendar, MessageCircle, User, ClipboardList, Bell, Sun, Moon, Compass,
  Search, Menu, X, ChevronDown, LogOut, ChevronLeft, Briefcase,
} from "lucide-react";

import { useColors } from "./theme/ThemeContext";
import { useResponsive } from "./theme/responsive";
import { KEYFRAMES, LAYOUT, useFonts } from "./theme/theme";
import { AppProvider, useApp } from "./context/AppContext";
import { ROUTES } from "./router/routes";
import { Toast, Spinner, Avatar, BrandLogo, ConfirmDialog } from "./components/ui/Primitives";

/* =========================================================================
   ERROR BOUNDARY — catches any screen-level exceptions gracefully
   ========================================================================= */
class ScreenErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Screen Error caught:", error, errorInfo);
  }
  componentDidUpdate(prevProps) {
    if (prevProps.screen !== this.props.screen) {
      this.setState({ hasError: false, error: null });
    }
  }
  render() {
    if (this.state.hasError) {
      const C = this.props.C;
      return (
        <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Something went wrong</div>
          <div style={{ fontSize: 14, color: C?.slate, lineHeight: 1.5, marginBottom: 16, maxWidth: 320 }}>
            {String(this.state.error?.message || "An unexpected error occurred.")}
          </div>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              this.props.onReset?.();
            }}
            style={{ padding: "10px 18px", borderRadius: 12, background: C?.black, color: C?.white, border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            Reset to Discover Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/** Minimal loading placeholder while lazy screen chunks stream in. */
function ScreenFallback() {
  const C = useColors();
  return (
    <div style={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Spinner size={22} color={C.slateLight} />
    </div>
  );
}

/* =========================================================================
   NAVIGATION MODEL — derived from the existing mobile tab definitions so
   labels/icons stay identical.
   ========================================================================= */
const CLIENT_NAV = [
  { value: "client-home", label: "Discover", icon: Home },
  { value: "client-dashboard", label: "Bookings", icon: Calendar },
  { value: "client-messages", label: "Messages", icon: MessageCircle },
  { value: "client-profile", label: "Account", icon: User },
];
const COACH_NAV = [
  { value: "coach-dashboard", label: "Dashboard", icon: Home },
  { value: "coach-calendar", label: "Calendar", icon: Calendar },
  { value: "coach-bookings", label: "Bookings", icon: ClipboardList },
  { value: "coach-messages", label: "Messages", icon: MessageCircle },
  { value: "coach-profile-edit", label: "Profile", icon: User },
];

/**
 * Screens that render without app chrome (no sidebar/rail, no header):
 * the splash screen and the full onboarding/registration flow.
 */
const AUTH_SCREENS = new Set([
  "splash", "get-started", "role-select", "auth", "forgot-password",
  "reset-code", "reset-password", "verify-email", "verify-phone",
  "coach-info", "coach-expertise", "about-you-profile",
  "account-type", "about-you-participants", "about-you-self",
  "client-setup-complete", "verification", "verification-pending",
  "verification-rejected", "coach-services-setup", "coach-availability-setup",
  "coach-payout-setup", "coach-setup-complete",
]);

/**
 * Screens that render as a centered modal overlay on top of the previous
 * screen rather than replacing it.
 */
const MODAL_SCREENS = new Set([
  "booking-request-sent",
  "booking-confirmation",
]);

/* =========================================================================
   HASH ROUTING — sync AppContext screen with the URL (#/screen).
   ========================================================================= */
function parseHash() {
  const raw = window.location.hash.replace(/^#\/?/, "");
  const screen = raw.split("?")[0];
  if (!screen || !ROUTES[screen]) return null;
  return { screen, params: {} };
}

function PortalShell() {
  useFonts();
  const app = useApp();
  const C = useColors();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const {
    screen, role, resetNav, toggleDarkMode, darkMode, toastMsg,
    clientNotifications, coachNotifications, clientIdentity,
  } = app;
  const [navInit, setNavInit] = useState(false);
  const [sideNavOpen, setSideNavOpen] = useState(true);
  const [mobileSideOpen, setMobileSideOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);

  // Track previous screen so modal can render behind the modal card
  const prevScreenRef = useRef(screen);
  const [bgScreen, setBgScreen] = useState(screen);
  const contentRef = useRef(null);

  const isModal = MODAL_SCREENS.has(screen);
  const isConfirmationScreen = screen === "booking-confirmation";

  // When navigating TO a modal screen, freeze bgScreen on the previous screen
  useEffect(() => {
    if (isModal) {
      // bgScreen stays as-is (the screen we came from)
    } else {
      setBgScreen(screen);
      prevScreenRef.current = screen;
    }
  }, [screen, isModal]);

  const roleNotifications = role === "coach" ? coachNotifications : clientNotifications;
  const unread = (roleNotifications || []).filter((n) => n.unread).length;
  const accountName = [clientIdentity?.firstName, clientIdentity?.lastName].filter(Boolean).join(" ") || "Account";
  const myAccountTarget = role === "coach" ? "coach-profile-edit" : "client-profile";
  const notifTarget = role === "coach" ? "coach-notifications" : "notifications";
  const roleLabel = role === "coach" ? "Coach" : "Client";

  const navModel = role === "coach" ? COACH_NAV : CLIENT_NAV;
  const isNaked = AUTH_SCREENS.has(screen);
  const accountShort = accountName.split(" ")[0];

  // Initial deep-link / default route
  useEffect(() => {
    const target = parseHash();
    if (target) resetNav(target.screen, target.params, role);
    setNavInit(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // URL <-> state sync
  useEffect(() => {
    if (!navInit) return;
    const expected = `#/${screen}`;
    if (window.location.hash !== expected) {
      window.history.replaceState(null, "", expected);
    }
    if (!isModal) contentRef.current?.scrollTo({ top: 0 });
  }, [navInit, screen, isModal]);

  useEffect(() => {
    const onHashChange = () => {
      const target = parseHash();
      if (target) resetNav(target.screen, target.params, role);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close mobile sidebar when screen changes
  useEffect(() => {
    setMobileSideOpen(false);
  }, [screen]);

  const ScreenComponent = ROUTES[screen] || ROUTES["splash"];
  const BgScreenComponent = isModal ? (ROUTES[bgScreen] || ROUTES["splash"]) : null;
  const screenProps = { ...app };

  const navTo = (value) => {
    if (value === screen) return;
    resetNav(value, {}, role);
  };

  const iconBtn = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    background: C.white,
    color: C.jet,
    cursor: "pointer",
    flexShrink: 0,
    padding: 0,
  };

  /* ── Shared sidebar nav list ────────────────────────────────────── */
  const SidebarNav = ({ collapsed, onNavItem }) => (
    <>
      <div style={{ padding: "16px 10px", display: "flex", flexDirection: "column", gap: 4 }}>
        {navModel.map((item) => {
          const active = (isModal ? bgScreen : screen) === item.value;
          const Icon = item.icon;
          return (
            <button
              type="button"
              key={item.value}
              onClick={() => { onNavItem?.(); navTo(item.value); }}
              title={collapsed ? item.label : undefined}
              aria-current={active ? "page" : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: collapsed ? "10px 0" : "10px 16px",
                justifyContent: collapsed ? "center" : "flex-start",
                borderRadius: 10,
                border: "none",
                background: active ? C.brandTint : "transparent",
                color: active ? C.brandIcon : C.slate,
                fontSize: 16,
                fontWeight: 500,
                cursor: "pointer",
                textAlign: "left",
                transition: "background .15s ease",
                fontFamily: "'Inter', sans-serif",
                minHeight: 44,
              }}
            >
              <Icon size={18} color={active ? C.brandIcon : C.slate} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </div>

      <div style={{ padding: "14px 10px", borderTop: `1px solid ${C.border}` }}>
        <button
          type="button"
          onClick={() => { onNavItem?.(); resetNav("support", {}, role); }}
          title={collapsed ? "Help & support" : undefined}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: collapsed ? "10px 0" : "10px 16px",
            justifyContent: collapsed ? "center" : "flex-start",
            borderRadius: 10,
            border: "none",
            background: "transparent",
            color: C.slate,
            fontSize: 16,
            fontWeight: 500,
            cursor: "pointer",
            width: "100%",
            textAlign: "left",
            fontFamily: "'Inter', sans-serif",
            minHeight: 44,
          }}
        >
          <Compass size={18} />
          {!collapsed && <span>Help & Support</span>}
        </button>
      </div>
    </>
  );

  /* ── Desktop sidebar (unchanged) ───────────────────────────────── */
  const Sidebar = ({ collapsed }) => (
    <aside
      style={{
        width: collapsed ? LAYOUT.desktop.iconRailW : LAYOUT.desktop.sideNavW,
        background: C.white,
        borderRight: `1px solid ${C.border}`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        flexShrink: 0,
        overflowY: "auto",
      }}
    >
      <SidebarNav collapsed={collapsed} />
    </aside>
  );

  /* ── Mobile sidebar drawer (slide-in overlay) ───────────────────── */
  const MobileSidebar = () => (
    <>
      {/* Scrim */}
      <div
        onClick={() => setMobileSideOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          zIndex: 120,
          animation: "clFadeIn .2s ease",
        }}
      />
      {/* Drawer panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: 280,
          background: C.white,
          borderRight: `1px solid ${C.border}`,
          zIndex: 121,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          animation: "clSlideRight .28s cubic-bezier(.22,1,.36,1)",
          boxShadow: "4px 0 24px rgba(0,0,0,0.12)",
          overflowY: "auto",
        }}
      >
        {/* Drawer header */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: `1px solid ${C.border}` }}>
            <div
              onClick={() => { setMobileSideOpen(false); navTo(role === "coach" ? "coach-dashboard" : "client-home"); }}
              style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
            >
              <BrandLogo height={28} onDark={darkMode} />
            </div>
            <button type="button" onClick={() => setMobileSideOpen(false)} aria-label="Close navigation" style={{ ...iconBtn, border: "none", background: "transparent" }}>
              <X size={20} color={C.slate} />
            </button>
          </div>
          <SidebarNav collapsed={false} onNavItem={() => setMobileSideOpen(false)} />
        </div>

        {/* Drawer footer: account info + sign out */}
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <Avatar name={accountName} size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.jet, fontFamily: "'Inter', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{accountName}</div>
              <div style={{ fontSize: 11, color: C.slate }}>{roleLabel} Account</div>
            </div>
          </div>
          <button type="button" onClick={() => { setMobileSideOpen(false); setSignOutConfirmOpen(true); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", border: "none", background: "transparent", color: C.danger, fontSize: 13, cursor: "pointer", fontFamily: "'Inter', sans-serif", width: "100%" }}>
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );

  /* ── Mobile header (shown on all non-naked mobile screens) ─────── */
  const mobileHeader = isMobile && !isNaked && (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        height: LAYOUT.topBarH,
        background: C.white,
        borderBottom: `1px solid ${C.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        padding: "0 14px",
        boxSizing: "border-box",
        flexShrink: 0,
      }}
    >
      {/* Left: hamburger */}
      <button type="button" aria-label="Open navigation menu" onClick={() => setMobileSideOpen(true)} style={{ ...iconBtn, border: "none", background: "transparent" }}>
        <Menu size={22} color={C.jet} />
      </button>

      {/* Center: brand */}
      <div
        onClick={() => navTo(role === "coach" ? "coach-dashboard" : "client-home")}
        style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", flex: 1, justifyContent: "center" }}
      >
        <BrandLogo height={28} onDark={darkMode} />
      </div>

      {/* Right: notifications + avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ position: "relative" }}>
          <button type="button" aria-label="View notifications" onClick={() => { setNotifOpen((v) => !v); }} style={{ ...iconBtn, border: "none", background: "transparent" }}>
            <Bell size={20} color={C.jet} />
            {unread > 0 && (
              <span style={{ position: "absolute", top: -2, right: -2, minWidth: 15, height: 15, borderRadius: 99, background: C.brand, color: "#FFFFFF", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 2px" }}>
                {unread}
              </span>
            )}
          </button>
          {notifOpen && (
            <>
              <button type="button" aria-label="Close notifications" onClick={() => setNotifOpen(false)} style={{ position: "fixed", inset: 0, border: "none", background: "transparent", cursor: "default", zIndex: 58 }} />
              <div style={{ position: "absolute", top: "calc(100% + 6px)", right: -14, width: "min(300px, 90vw)", maxHeight: 320, overflowY: "auto", background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, boxShadow: "0 18px 48px -18px rgba(22,24,29,.35)", padding: "8px 0", zIndex: 60 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 14px 8px", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: C.jet, fontFamily: "'Outfit', sans-serif" }}>Notifications</span>
                  <span style={{ fontSize: 11, color: C.slate }}>{unread} unread</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {(roleNotifications || []).slice(0, 5).map((item) => (
                    <div key={item.id} onClick={() => { setNotifOpen(false); resetNav(notifTarget, {}, role); }} style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, background: item.unread ? C.brandTint : "transparent", cursor: "pointer" }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: C.jet, fontFamily: "'Inter', sans-serif" }}>{item.title}</div>
                      <div style={{ fontSize: 11.5, color: C.slate, marginTop: 2, fontFamily: "'Inter', sans-serif" }}>{item.body}</div>
                      <div style={{ fontSize: 10, color: C.slateLight, marginTop: 4 }}>{item.time}</div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => { setNotifOpen(false); resetNav(notifTarget, {}, role); }} style={{ width: "100%", padding: "8px 0", textAlign: "center", border: "none", background: "transparent", color: C.brand, fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>
                  View all notifications
                </button>
              </div>
            </>
          )}
        </div>
        <button type="button" onClick={() => { resetNav(myAccountTarget, {}, role); }} style={{ ...iconBtn, border: "none", background: "transparent", padding: 0 }}>
          <Avatar name={accountName} size={30} />
        </button>
      </div>
    </header>
  );

  /* ── Desktop header (unchanged) ─────────────────────────────────── */
  const globalHeader = !isMobile && !isNaked && (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        height: LAYOUT.desktop.topBarH,
        background: C.white,
        borderBottom: `1px solid ${C.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "0 64px 0 14px",
        boxSizing: "border-box",
        flexShrink: 0,
      }}
    >
      {/* Left: hamburger toggle + brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button type="button" aria-label="Toggle navigation sidebar" onClick={() => setSideNavOpen((v) => !v)} style={iconBtn}>
          {sideNavOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
        <div onClick={() => navTo(role === "coach" ? "coach-dashboard" : "client-home")} style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
          <BrandLogo height={34} onDark={darkMode} />
        </div>
      </div>

      {/* Center: role switcher (client <-> coach UI) */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, margin: "0 24px", minWidth: 0 }}>
        <div role="group" aria-label="Switch between Client and Coach UI" style={{ display: "flex", gap: 4, padding: 4, background: C.fog, borderRadius: 12, border: `1px solid ${C.border}` }}>
          {[["client", "Client", User], ["coach", "Coach", Briefcase]].map(([key, label, Icon]) => {
            const active = role === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => { if (!active) resetNav(key === "coach" ? "coach-dashboard" : "client-home", {}, key); }}
                style={{ minWidth: 100, height: 36, borderRadius: 9, border: "none", background: active ? C.brand : "transparent", color: active ? "#FFFFFF" : C.slate, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                <Icon size={14} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: notifications popover + dark mode + profile */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ position: "relative" }}>
          <button type="button" aria-label="View notifications" onClick={() => setNotifOpen((v) => !v)} style={iconBtn}>
            <Bell size={17} />
            {unread > 0 && (
              <span style={{ position: "absolute", top: -3, right: -3, minWidth: 16, height: 16, borderRadius: 99, background: C.brand, color: "#FFFFFF", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>
                {unread}
              </span>
            )}
          </button>
          {notifOpen && (
            <>
              <button type="button" aria-label="Close notifications" onClick={() => setNotifOpen(false)} style={{ position: "fixed", inset: 0, border: "none", background: "transparent", cursor: "default", zIndex: 58 }} />
              <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, width: 340, maxHeight: 400, overflowY: "auto", background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: "0 18px 48px -18px rgba(22,24,29,.35)", padding: "10px 0", zIndex: 60 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 16px 10px", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: C.jet, fontFamily: "'Outfit', sans-serif" }}>Notifications</span>
                  <span style={{ fontSize: 14, color: C.slate }}>{unread} unread</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {(roleNotifications || []).slice(0, 5).map((item) => (
                    <div key={item.id} onClick={() => { setNotifOpen(false); resetNav(notifTarget, {}, role); }} style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, background: item.unread ? C.brandTint : "transparent", cursor: "pointer" }}>
                      <div style={{ fontSize: 14.5, fontWeight: 600, color: C.jet, fontFamily: "'Inter', sans-serif" }}>{item.title}</div>
                      <div style={{ fontSize: 14, color: C.slate, marginTop: 3, fontFamily: "'Inter', sans-serif" }}>{item.body}</div>
                      <div style={{ fontSize: 14, color: C.slateLight, marginTop: 4 }}>{item.time}</div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => { setNotifOpen(false); resetNav(notifTarget, {}, role); }} style={{ width: "100%", padding: "10px 0", textAlign: "center", border: "none", background: "transparent", color: C.brand, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  View all notifications
                </button>
              </div>
            </>
          )}
        </div>

        <button type="button" onClick={toggleDarkMode} title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"} style={iconBtn}>
          {darkMode ? <Sun size={17} color="#FACC15" /> : <Moon size={17} />}
        </button>

        <div style={{ position: "relative" }}>
          <button type="button" aria-label="Open account menu" onClick={() => setAccountMenuOpen((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 10px 4px 4px", borderRadius: 20, border: `1px solid ${C.border}`, background: C.white, cursor: "pointer" }}>
            <Avatar name={accountName} size={30} />
            <span style={{ fontSize: 14, fontWeight: 600, color: C.jet, fontFamily: "'Inter', sans-serif" }}>{accountShort}</span>
            <ChevronDown size={14} color={C.slate} />
          </button>
          {accountMenuOpen && (
            <>
              <button type="button" aria-label="Close account menu" onClick={() => setAccountMenuOpen(false)} style={{ position: "fixed", inset: 0, border: "none", background: "transparent", cursor: "default", zIndex: 58 }} />
              <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, width: 230, background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: "0 18px 48px -18px rgba(22,24,29,.35)", padding: 8, zIndex: 60, display: "flex", flexDirection: "column", gap: 3 }}>
                <div style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}`, marginBottom: 4 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.jet, fontFamily: "'Inter', sans-serif" }}>{accountName}</div>
                  <div style={{ fontSize: 14, color: C.slate, marginTop: 2 }}>{roleLabel} Account</div>
                </div>
                <button type="button" onClick={() => { setAccountMenuOpen(false); resetNav(myAccountTarget, {}, role); }} style={menuRowStyle(C)}><User size={16} /> <span>Account Settings</span></button>
                <button type="button" onClick={() => { setAccountMenuOpen(false); resetNav("support", {}, role); }} style={menuRowStyle(C)}><Compass size={16} /> <span>Help & Support</span></button>
                <div style={{ height: 1, background: C.border, margin: "4px 0" }} />
                <button type="button" onClick={() => { setAccountMenuOpen(false); setSignOutConfirmOpen(true); }} style={{ ...menuRowStyle(C), color: C.danger }}><LogOut size={16} /> <span>Sign Out</span></button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );

  /* ── Modal overlay (booking-request-sent, booking-confirmation) ─── */
  const modalOverlay = isModal && (
    <>
      {/* Scrim */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          zIndex: 80,
          display: "flex",
          alignItems: isMobile ? "flex-end" : "center",
          justifyContent: "center",
          animation: "clFadeIn .2s ease",
        }}
      >
        {/* Modal card */}
        <div
          className={isConfirmationScreen ? "cl-modal-screen" : undefined}
          style={{
            background: C.white,
            borderRadius: isMobile ? "24px 24px 0 0" : 24,
            width: isMobile ? "100%" : isConfirmationScreen ? "min(620px, 92vw)" : "min(480px, 90vw)",
            maxHeight: isMobile ? "90vh" : isConfirmationScreen ? "88vh" : "85vh",
            overflowY: "auto",
            position: "relative",
            boxShadow: "0 32px 80px -20px rgba(0,0,0,0.45)",
            animation: isMobile ? "clSlideUp .35s cubic-bezier(.22,1,.36,1)" : "clScaleIn .25s cubic-bezier(.22,1,.36,1)",
          }}
        >
          <ScreenErrorBoundary screen={screen} C={C} onReset={() => resetNav("client-home", {}, "client")}>
            <React.Suspense fallback={<div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}><Spinner size={32} /></div>}>
              <ScreenComponent {...screenProps} />
            </React.Suspense>
          </ScreenErrorBoundary>
        </div>
      </div>
    </>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100vw", height: "100vh", overflow: "hidden", background: C.white, color: C.jet }}>
      <style>{KEYFRAMES}</style>
      <style>{`
        @keyframes clSlideRight { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @keyframes clScaleIn { from { opacity: 0; transform: scale(0.94); } to { opacity: 1; transform: scale(1); } }
        @keyframes clFadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
      <a className="cl-skip-link" href="#portal-content">Skip to content</a>

      {/* Headers */}
      {mobileHeader}
      {globalHeader}

      <div style={{ display: "flex", flex: 1, minHeight: 0, minWidth: 0, position: "relative", overflow: "hidden" }}>
        {/* Desktop sidebar */}
        {!isMobile && !isNaked && sideNavOpen && <Sidebar collapsed={isTablet} />}

        {/* Mobile sidebar drawer */}
        {isMobile && !isNaked && mobileSideOpen && <MobileSidebar />}

        <main
          ref={contentRef}
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            background: C.pageBg || (darkMode ? C.fog : "#FEFEFE"),
            overflowY: "auto",
            overflowX: "hidden",
            position: "relative",
          }}
        >
          <div
            id="portal-content"
            style={{ height: "100%", minHeight: "100%", position: "relative" }}
          >
            {/* Background screen (shown behind modal, or the active screen) */}
            <div key={isModal ? bgScreen : screen} style={{ height: "100%", minHeight: "100%", animation: "clScreenIn .3s cubic-bezier(.22,1,.36,1)", ...(isModal ? { pointerEvents: "none", userSelect: "none", filter: "blur(1px)" } : {}) }}>
              <ScreenErrorBoundary screen={isModal ? bgScreen : screen} C={C} onReset={() => resetNav("client-home", {}, "client")}>
                <React.Suspense fallback={<div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}><Spinner size={32} /></div>}>
                  {isModal
                    ? (BgScreenComponent ? <BgScreenComponent {...screenProps} /> : null)
                    : <ScreenComponent {...screenProps} />
                  }
                </React.Suspense>
              </ScreenErrorBoundary>
            </div>

            {/* Modal overlay */}
            {modalOverlay}
          </div>
          <Toast toast={toastMsg} />

          <ConfirmDialog
            open={signOutConfirmOpen}
            onClose={() => setSignOutConfirmOpen(false)}
            onConfirm={async () => {
              await new Promise((r) => setTimeout(r, 600));
              setSignOutConfirmOpen(false);
              resetNav("get-started", {}, "client");
            }}
            title="Sign Out"
            description="Are you sure you want to sign out of your account?"
            confirmLabel="Sign Out"
            loadingText="Signing Out..."
            cancelLabel="Cancel"
            icon={LogOut}
            destructive={false}
          />
        </main>
      </div>
    </div>
  );
}

function menuRowStyle(C) {
  return {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 10px",
    borderRadius: 6,
    border: "none",
    background: "transparent",
    color: C.jet,
    fontSize: 14,
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "'Inter', sans-serif",
  };
}

/* =========================================================================
   ROOT — contextual app shell
   ========================================================================= */
export default function App() {
  return (
    <AppProvider>
      <PortalShell />
    </AppProvider>
  );
}