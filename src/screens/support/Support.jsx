import React, { useState } from "react";
import { Search, ChevronDown, Send } from "lucide-react";
import { CL, CD, fBody, fDisplay, T } from "../../theme/theme";
import { useApp } from "../../context/AppContext";
import { useResponsive } from "../../theme/responsive";
import { FAQS } from "../../data/mockData";
import { TopBar, SegTabs, Card } from "../../components/ui/Primitives";

/* =========================================================================
   Support — desktop shows a two-column help centre (category rail + content);
   mobile keeps the tabbed single-column layout.
   ========================================================================= */
export function ScreenSupport({ nav, params = {}, role }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const { isDesktop } = useResponsive();
  const [tab, setTab] = useState(params.presetTab || "faq");
  const [openIdx, setOpenIdx] = useState(null);
  const [chatStarted, setChatStarted] = useState(!!params.bookingContext);
  const [query, setQuery] = useState("");
  // A topic (e.g. "verification") overrides the role-based FAQ set so a screen
  // can deep-link straight to the help articles most relevant to it.
  const faqTopic = params.faqTopic || (role === "coach" ? "coach" : "client");
  const faqs = (FAQS[faqTopic] || FAQS[role === "coach" ? "coach" : "client"]).filter((f) => f.q.toLowerCase().includes(query.toLowerCase()));
  const backTarget = params.backTo || (role === "coach" ? "coach-dashboard" : "client-home");
  const TABS = [{ value: "faq", label: "FAQs" }, { value: "chat", label: "Contact support" }];

  const faqContent = (
    <div className="cl-hide-scrollbar" style={{ flex: 1, overflowY: "auto", width: "100%", padding: isDesktop ? "0 0 24px" : "0 18px 24px" }}>
      <div className="cl-input" style={{ display: "flex", alignItems: "center", gap: 8, border: `1.5px solid ${C.border}`, background: C.white, borderRadius: 13, padding: "11px 13px", marginBottom: 16 }}>
        <Search size={15} color={C.slateLight} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search help articles"
          style={{ border: "none", outline: "none", background: "none", flex: 1, fontSize: T.bodyLg, color: C.jet, ...fBody }} />
      </div>
      <div style={{ marginTop: 12 }} className="cl-stagger">
        {faqs.map((f, i) => (
          <Card key={i} style={{ marginBottom: 10, animationDelay: `${Math.min(i, 8) * 45}ms` }} onClick={() => setOpenIdx(openIdx === i ? null : i)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: T.bodyLg, fontWeight: 600, color: C.jet, flex: 1, paddingRight: 10, ...fBody }}>{f.q}</span>
              <ChevronDown size={16} color={C.slateLight} style={{ transform: openIdx === i ? "rotate(180deg)" : "none", transition: "transform .2s ease", flexShrink: 0 }} />
            </div>
            {openIdx === i && (
              <div style={{ marginTop: 10, animation: "clFadeUp .22s ease" }}>
                <p style={{ fontSize: T.labelLg, color: C.slate, lineHeight: 1.6, ...fBody }}>{f.a}</p>
                <button onClick={(e) => { e.stopPropagation(); setTab("chat"); setChatStarted(true); }} style={{ background: "none", border: "none", color: C.brand, fontWeight: 600, fontSize: T.label, marginTop: 8, cursor: "pointer", ...fBody }}>
                  Didn't solve it? Contact support →
                </button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );

  const chatContent = (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: isDesktop ? "6px 0" : "6px 18px" }} className="cl-hide-scrollbar">
        <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 10 }}>
          <div style={{ maxWidth: "80%", background: C.fog, borderRadius: 16, borderBottomLeftRadius: 4, padding: "10px 13px", fontSize: T.body, color: C.jet, lineHeight: 1.5, animation: "clSlideUp .3s ease", ...fBody }}>
            Hi Sarah 👋 I'm the CoachNivo support assistant. I can see your account details{params.bookingContext ? " and this booking" : params.faqTopic === "verification" ? " and your verification application" : " and recent booking"} already - what can I help with?
          </div>
        </div>
        {chatStarted && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
            <div style={{ maxWidth: "80%", background: C.brand, color: "#FFFFFF", borderRadius: 16, borderBottomRightRadius: 4, padding: "10px 13px", fontSize: T.body, lineHeight: 1.5, animation: "clSlideUp .3s ease", ...fBody }}>
              {params.bookingContext ? `I have a question about my ${params.bookingContext} booking.` : "The FAQ didn't quite answer my question."}
            </div>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "flex-start" }}>
          <div style={{ maxWidth: "80%", background: C.fog, borderRadius: 16, borderBottomLeftRadius: 4, padding: "10px 13px", fontSize: T.body, color: C.jet, lineHeight: 1.5, animation: "clSlideUp .3s ease", ...fBody }}>
            Got it - connecting you with a member of our team now. Average reply time is under 10 minutes.
          </div>
        </div>
      </div>
      <div style={{ padding: isDesktop ? "12px 0 max(16px, env(safe-area-inset-bottom))" : "12px 18px", paddingBottom: isDesktop ? undefined : "max(28px, env(safe-area-inset-bottom))", display: "flex", gap: 8, borderTop: `1px solid ${C.border}`, background: C.white }}>
        <input name="support-message" autoComplete="off" aria-label="Describe your issue" placeholder="Describe your issue…" style={{ flex: 1, border: `1.5px solid ${C.border}`, borderRadius: 13, padding: "11px 13px", fontSize: T.bodyLg, outline: "none", color: C.jet, background: C.white, ...fBody }} />
        <button style={{ width: 38, height: 38, borderRadius: 99, background: C.black, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 12px -3px rgba(0,0,0,.28)" }}>
          <Send size={15} color={C.white} />
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar title="Support" onBack={() => nav(backTarget, params.backParams || {})} />

      {isDesktop ? (
        <div style={{ flex: 1, minHeight: 0, display: "flex", width: "100%", padding: "32px 64px 32px", gap: 32, boxSizing: "border-box" }}>
          <nav aria-label="Support sections" style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: T.caption, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: C.slateLight, marginBottom: 6, ...fBody }}>Help centre</div>
            {TABS.map((t) => {
              const active = tab === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTab(t.value)}
                  aria-current={active ? "page" : undefined}
                  style={{ textAlign: "left", minHeight: 44, padding: "0 14px", borderRadius: 11, border: "none", cursor: "pointer", background: active ? C.brandTint : "transparent", color: active ? C.brandIcon : C.slate, fontWeight: active ? 700 : 500, fontSize: T.body, ...fBody }}
                >
                  {t.label}
                </button>
              );
            })}
          </nav>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
            {tab === "faq" ? faqContent : chatContent}
          </div>
        </div>
      ) : (
        <>
          <div style={{ padding: "16px 18px 0", marginBottom: 12 }}>
            <SegTabs value={tab} onChange={setTab} items={TABS} />
          </div>
          {tab === "faq" ? faqContent : chatContent}
        </>
      )}
    </div>
  );
}