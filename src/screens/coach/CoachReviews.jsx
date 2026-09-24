import React, { useState, useEffect } from "react";
import {
  Star, CornerUpLeft, Flag, Check, CheckCircle2, Clock,
} from "lucide-react";
import { CL, CD, fDisplay, fBody, T } from "../../theme/theme";
import { REVIEWS } from "../../data/mockData";
import {
  Avatar, Card, Btn, SectionLabel, BottomSheet, Badge, HandleTag, TopBar, EmptyState, BookingCardSkeleton,
} from "../../components/ui/Primitives";
import { useReviewActions, DISPUTE_REASONS } from "../../systems/ReviewsSystem";
import { useApp } from "../../context/AppContext";
import { useResponsive } from "../../theme/responsive";

/* =========================================================================
   COACH REVIEWS — the coach-side reviews hub. Shows the rating summary
   (average + distribution), every review, the coach's public replies, and
   the report/dispute flow. Shares the ReviewsSystem store with the dashboard
   and the public client-facing profile, so replies and disputes stay in
   sync everywhere for the session.
   ========================================================================= */
export function ScreenCoachReviews({ nav, toast }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const { isDesktop } = useResponsive();
  const [loading, setLoading] = useState(true);
  const { getReply, getDispute, submitReply, submitDispute } = useReviewActions();

  useEffect(() => { const t = setTimeout(() => setLoading(false), 800); return () => clearTimeout(t); }, []);
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [disputeTarget, setDisputeTarget] = useState(null);
  const [disputeReason, setDisputeReason] = useState(null);
  const [disputeDetail, setDisputeDetail] = useState("");

  const ratingAvg = (REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length).toFixed(1);
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: REVIEWS.filter((r) => r.rating === star).length,
  }));

  const openReply = (r) => { setReplyText(getReply(r.id)?.text || ""); setReplyTarget(r); };
  const closeReply = () => { setReplyTarget(null); setReplyText(""); };
  const submitReplyAction = () => {
    if (!replyText.trim()) return;
    submitReply(replyTarget.id, replyText);
    toast?.("Reply posted");
    closeReply();
  };

  const openDispute = (r) => { setDisputeReason(null); setDisputeDetail(""); setDisputeTarget(r); };
  const closeDispute = () => { setDisputeTarget(null); setDisputeReason(null); setDisputeDetail(""); };
  const submitDisputeAction = () => {
    if (!disputeReason) return;
    submitDispute(disputeTarget.id, disputeReason, disputeDetail);
    toast?.("Dispute submitted to CoachNivo Support");
    closeDispute();
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar title="Reviews" onBack={() => nav("coach-profile-edit")} />

      <div style={{ flex: 1, overflowY: "auto", width: "100%", padding: isDesktop ? "32px 64px 48px" : "14px 18px 0", paddingBottom: isDesktop ? 48 : 116 }} className="cl-hide-scrollbar">
        {loading ? (
          <BookingCardSkeleton rows={4} />
        ) : (
          <>
        {/* Rating summary */}
        <Card style={{ marginBottom: 18, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <div style={{ fontSize: T.hero, fontWeight: 700, color: C.jet, ...fDisplay }}>{ratingAvg}</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 4 }}>
              <Star size={12} fill={C.brand} color={C.brand} />
              <span style={{ fontSize: T.label, color: C.slate, ...fBody }}>{REVIEWS.length} reviews</span>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 5 }}>
            {distribution.map((d) => {
              const pct = REVIEWS.length ? Math.round((d.count / REVIEWS.length) * 100) : 0;
              return (
                <div key={d.star} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, fontSize: T.micro, fontWeight: 600, color: C.slate, textAlign: "right", ...fBody }}>{d.star}</span>
                  <Star size={9} color={C.brand} fill={C.brand} />
                  <div style={{ flex: 1, height: 6, borderRadius: 99, background: C.fog, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", borderRadius: 99, background: C.brand }} />
                  </div>
                  <span style={{ width: 14, fontSize: T.micro, color: C.slateLight, ...fBody }}>{d.count}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Review list */}
        <SectionLabel>All reviews</SectionLabel>
        <div style={{ fontSize: T.labelLg, color: C.slateLight, marginTop: -4, marginBottom: 12, lineHeight: 1.5, ...fBody }}>
          Reply to reviews publicly - athletes see your responses on your profile.
        </div>

        {REVIEWS.length === 0 ? (
          <EmptyState icon={Star} title="No reviews yet" body="Reviews from verified bookings will show up here." />
        ) : (
          <div className="cl-stagger">
            {REVIEWS.map((r, i) => {
              const reply = getReply(r.id);
              const dispute = getDispute(r.id);
              return (
                <Card key={r.id} style={{ marginBottom: 10, animationDelay: `${Math.min(i, 8) * 45}ms` }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <Avatar name={r.name} size={34} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
                          <span style={{ fontSize: T.body, fontWeight: 600, color: C.jet, ...fBody }}>{r.name}</span>
                          {r.handle && <HandleTag handle={r.handle} size={10.5} color={C.slateLight} />}
                        </div>
                        <div style={{ fontSize: T.caption, color: C.slateLight, ...fBody }}>{r.date}</div>
                      </div>
                    </div>
                    <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: T.labelLg, fontWeight: 700, color: C.jet, ...fBody }}>
                      <Star size={12} fill={C.brand} color={C.brand} />
                      {r.rating.toFixed(1)}
                    </span>
                  </div>

                  <p style={{ fontSize: T.labelLg, color: C.slate, marginTop: 8, lineHeight: 1.5, ...fBody }}>{r.text}</p>

                  {r.verified && (
                    <div style={{ marginTop: 6 }}>
                      <Badge tone="neutral" icon={CheckCircle2}>Verified booking</Badge>
                    </div>
                  )}

                  {dispute && (
                    <div style={{ marginTop: 8 }}>
                      <Badge tone="orange" icon={Clock}>Dispute pending review</Badge>
                    </div>
                  )}

                  {reply && (
                    <div style={{ marginTop: 10, background: C.fog, borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ fontSize: T.caption, fontWeight: 700, color: C.brand, ...fBody }}>Your reply</div>
                      <p style={{ fontSize: T.labelLg, color: C.jet, marginTop: 3, lineHeight: 1.5, ...fBody }}>{reply.text}</p>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <Btn size="sm" variant="secondary" icon={CornerUpLeft} onClick={() => openReply(r)}>
                      {reply ? "Edit reply" : "Reply to review"}
                    </Btn>
                    {!dispute && (
                      <Btn size="sm" variant="outline" icon={Flag} onClick={() => openDispute(r)}>
                        Report
                      </Btn>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
          </>
        )}
      </div>

      {/* Reply sheet */}
      <BottomSheet open={!!replyTarget} onClose={closeReply} title="Reply to review" heightPct={52}>
        {replyTarget && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ flex: 1 }}>
              <div style={{ background: C.fog, borderRadius: 12, padding: "10px 12px", marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: T.labelLg, fontWeight: 600, color: C.jet, ...fBody }}>{replyTarget.name}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: T.labelLg, fontWeight: 700, color: C.jet, ...fBody }}>
                    <Star size={12} fill={C.brand} color={C.brand} />
                    {replyTarget.rating.toFixed(1)}
                  </span>
                </div>
                <p style={{ fontSize: T.labelLg, color: C.slate, marginTop: 4, lineHeight: 1.5, ...fBody }}>{replyTarget.text}</p>
              </div>
              <div style={{ fontSize: T.label, color: C.slate, marginBottom: 8, ...fBody }}>
                Your reply is public and will appear underneath this review on your profile.
              </div>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a public reply…"
                rows={4}
                autoFocus
                style={{
                  width: "100%", boxSizing: "border-box", background: C.white,
                  border: `1.5px solid ${C.border}`, borderRadius: 13, padding: "11px 13px",
                  fontSize: T.bodyLg, color: C.jet, outline: "none", resize: "none", ...fBody,
                }}
              />
            </div>
            <div style={{ padding: "14px 0 4px" }}>
              <Btn full onClick={submitReplyAction} style={!replyText.trim() ? { opacity: 0.5, pointerEvents: "none" } : undefined}>
                Post reply
              </Btn>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Report / dispute sheet */}
      <BottomSheet open={!!disputeTarget} onClose={closeDispute} title="Report this review"
        heightPct={disputeReason === "Something else" ? 76 : 64}>
        {disputeTarget && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ flex: 1, overflowY: "auto" }}>
              <div style={{ fontSize: T.body, color: C.slate, marginBottom: 14, ...fBody }}>
                Tell us why this review seems unfair or made in bad faith. CoachNivo Support will review it.
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {DISPUTE_REASONS.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setDisputeReason(reason)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "12px 14px", borderRadius: 12, cursor: "pointer", textAlign: "left",
                      border: `1.5px solid ${disputeReason === reason ? C.brand : C.border}`,
                      background: disputeReason === reason ? C.brandTint : C.white,
                    }}
                  >
                    <span style={{ fontSize: T.body, color: C.jet, ...fBody }}>{reason}</span>
                    {disputeReason === reason && <Check size={16} color={C.brand} />}
                  </button>
                ))}
              </div>
              {disputeReason === "Something else" && (
                <textarea
                  value={disputeDetail}
                  onChange={(e) => setDisputeDetail(e.target.value)}
                  placeholder="Tell us what's going on…"
                  rows={4}
                  autoFocus
                  style={{
                    width: "100%", boxSizing: "border-box", background: C.white, marginTop: 14,
                    border: `1.5px solid ${C.border}`, borderRadius: 13, padding: "11px 13px",
                    fontSize: T.bodyLg, color: C.jet, outline: "none", resize: "none", ...fBody,
                  }}
                />
              )}
            </div>
            <div style={{ padding: "14px 0 4px" }}>
              <Btn full onClick={submitDisputeAction} style={!disputeReason ? { opacity: 0.5, pointerEvents: "none" } : undefined}>
                Submit dispute
              </Btn>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
