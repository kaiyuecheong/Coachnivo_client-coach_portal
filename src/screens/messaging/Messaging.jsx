import React, { useEffect, useState, useRef, useMemo } from "react";
import { HelpCircle, Paperclip, MapPin, Send, MoreVertical, Flag, Ban, Check, CheckCircle2, Calendar, ChevronRight, FileText, Navigation, AlertCircle, RotateCcw, Pin, PinOff, Trash2, MessageCircle, Search, X } from "lucide-react";
import { CL, CD, fDisplay, fBody, T, LAYOUT } from "../../theme/theme";
import { useApp } from "../../context/AppContext";
import { useResponsive } from "../../theme/responsive";
import { THREADS, COACH_THREADS, CHAT_MESSAGES, BOOKING_ENQUIRY_MESSAGES, COACHES } from "../../data/mockData";
import { Avatar, BackButton, BottomSheet, Btn, ConfirmDialog, EmptyState, TopBar, HandleTag, ThreadSkeleton } from "../../components/ui/Primitives";
import { StatusBanner } from "../../systems/StateSystem";
import { getPublicName } from "../../utils/name";
import { clientMetaFor } from "../../data/users";
import { BOOKING_STATUS } from "../../data/bookings";
import { BUSINESS_THREADS } from "../../data/businesses";

/** Privacy-safe display name for a thread participant. */
function threadParticipantName(withName, role) {
  if (role === "client") {
    const coach = COACHES.find((c) => c.name === withName);
    if (coach) return getPublicName(coach, "public").name;
  }
  return getPublicName({ name: withName, ...clientMetaFor(withName) }, "public").name;
}

/* ── Blocked Threads Store ─────────────────────────────────────────────── */

let blockedIds = new Set();
const subscribers = new Set();
const emit = () => subscribers.forEach(cb => cb(new Set(blockedIds)));
const blockThread = id => id && (blockedIds.add(id), emit());
const unblockThread = id => id && (blockedIds.delete(id), emit());

function useBlockedThreads() {
  const [blocked, setBlocked] = useState(() => new Set(blockedIds));
  React.useEffect(() => {
    subscribers.add(setBlocked);
    return () => subscribers.delete(setBlocked);
  }, []);
  return { blocked, isBlocked: id => blocked.has(id), block: blockThread, unblock: unblockThread };
}

/* ── Pinned / Deleted Threads Store ────────────────────────────────────── */
// Same lightweight module-level store pattern as blocked threads above, so
// pin/delete state persists across screen visits within the session and stays
// in sync for both the client and coach thread lists (ids are unique across
// THREADS/COACH_THREADS, so one store safely covers both roles).

let pinnedIds = new Set();
const pinSubscribers = new Set();
const emitPinned = () => pinSubscribers.forEach(cb => cb(new Set(pinnedIds)));
const pinThread = id => id && (pinnedIds.add(id), emitPinned());
const unpinThread = id => id && (pinnedIds.delete(id), emitPinned());

function usePinnedThreads() {
  const [pinned, setPinned] = useState(() => new Set(pinnedIds));
  React.useEffect(() => {
    pinSubscribers.add(setPinned);
    return () => pinSubscribers.delete(setPinned);
  }, []);
  return { pinned, isPinned: id => pinned.has(id), pin: pinThread, unpin: unpinThread };
}

let deletedIds = new Set();
const deleteSubscribers = new Set();
const emitDeleted = () => deleteSubscribers.forEach(cb => cb(new Set(deletedIds)));
const deleteThread = id => id && (deletedIds.add(id), emitDeleted());

function useDeletedThreads() {
  const [deleted, setDeleted] = useState(() => new Set(deletedIds));
  React.useEffect(() => {
    deleteSubscribers.add(setDeleted);
    return () => deleteSubscribers.delete(setDeleted);
  }, []);
  return { deleted, isDeleted: id => deleted.has(id), remove: deleteThread };
}

/* ── Shared Styles ─────────────────────────────────────────────────────── */

const iconBox = (bg) => ({
  width: 36, height: 36, borderRadius: 11, background: bg,
  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
});

const sheetBtn = (C) => (extra = {}) => ({
  display: "flex", alignItems: "center", gap: 12, padding: "14px 4px",
  background: "none", border: "none", borderBottom: `1px solid ${C.border}`,
  cursor: "pointer", textAlign: "left", ...extra,
});

const cancelBtn = (C) => ({
  padding: "14px 4px", background: "none", border: "none", cursor: "pointer",
  textAlign: "left", fontSize: T.bodyLg, fontWeight: 600, color: C.slate, ...fBody,
});

/* ── Messages Screen ───────────────────────────────────────────────────── */

export function ScreenMessages(props) {
  const { nav, role, isFirstTimeClient } = props;
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const { isDesktop } = useResponsive();

  if (isDesktop) {
    return <DesktopTwoPanelMessages {...props} />;
  }

  const { isBlocked, unblock } = useBlockedThreads();
  const { isPinned, pin, unpin } = usePinnedThreads();
  const { isDeleted, remove } = useDeletedThreads();
  const [loading, setLoading] = useState(true);
  const rawThreads = role === "coach" || role === "businessCoach" ? COACH_THREADS : role === "business" ? BUSINESS_THREADS : THREADS;
  // Pinned threads first, then unread, then original order; deleted threads drop out entirely.
  const threads = [...rawThreads]
    .filter(t => !isDeleted(t.id))
    .sort((a, b) => (isPinned(b.id) ? 1 : 0) - (isPinned(a.id) ? 1 : 0) || (b.unread > 0 ? 1 : 0) - (a.unread > 0 ? 1 : 0));
  const [blockedThread, setBlockedThread] = useState(null);
  const [optionsThread, setOptionsThread] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => { const t = setTimeout(() => setLoading(false), 800); return () => clearTimeout(t); }, []);

  // First-time clients haven't sent a booking request yet, so there's nothing
  // to chat about — show a single unified empty state instead of the (mock)
  // thread list, pointing them back at Discover.
  const showEmptyChat = role === "client" && isFirstTimeClient;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar
        title="Messages"
        onBack={role === "business" ? () => nav("business-more") : role === "businessCoach" ? () => nav("business-coach-account") : undefined}
        right={
          <button type="button" aria-label="Open help and support" onClick={() => nav("support")} style={{ width: LAYOUT.touchTarget, height: LAYOUT.touchTarget, padding: 0, background: "transparent", border: "none", borderRadius: LAYOUT.pillRadius, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <HelpCircle size={22} color={C.jet} />
          </button>
        }
      />

      <div style={{ flex: 1, overflowY: "auto", width: "100%", padding: isDesktop ? "32px 64px 48px" : "0 18px", paddingBottom: isDesktop ? 48 : 116 }} className="cl-hide-scrollbar">
        {loading ? (
          <div style={{ paddingTop: 8 }}><ThreadSkeleton rows={5} /></div>
        ) : showEmptyChat ? (
          <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <EmptyState
              large
              icon={MessageCircle}
              title="No Conversations Yet"
              body="Your conversations with coaches will appear here. Once you send a booking request, you can chat with the coach to discuss your session and ask any questions before your booking is confirmed."
              ctaLabel="Find My Coaches"
              onCta={() => nav("client-home")}
            />
          </div>
        ) : (
        <>
        {threads.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: C.slate, fontSize: T.body, ...fBody }}>No conversations here.</div>
        )}
        <div className="cl-stagger">
        {threads.map((t, i) => {
          const blocked = isBlocked(t.id);
          const pinned = isPinned(t.id);
          const participantName = threadParticipantName(t.withName, role);
          return (
            <div
              key={t.id}
              role="button"
              tabIndex={0}
              onClick={() => blocked
                ? setBlockedThread(t)
                : nav("chat-thread", { name: t.withName, context: t.context, threadId: t.id })
              }
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                if (blocked) setBlockedThread(t);
                else nav("chat-thread", { name: t.withName, context: t.context, threadId: t.id });
              }}
              style={{
                width: "100%", display: "flex", gap: 12, alignItems: "center",
                padding: "12px 4px", background: pinned ? C.fog : "none", borderRadius: pinned ? 13 : 0,
                border: "none", borderBottom: pinned ? "none" : `1px solid ${C.border}`, cursor: "pointer",
                textAlign: "left", opacity: blocked ? 0.68 : 1, marginBottom: pinned ? 4 : 0,
                animationDelay: `${Math.min(i, 8) * 45}ms`,
              }}
            >
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{ filter: blocked ? "grayscale(1)" : "none" }}>
                  <Avatar name={participantName} size={46} />
                </div>
                {blocked && (
                  <div style={{
                    position: "absolute", right: -3, bottom: -3, width: 19, height: 19,
                    borderRadius: 99, background: C.white, border: `1px solid ${C.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Ban size={11} color={C.slateLight} />
                  </div>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
                  {pinned && <Pin size={11} color={C.brand} style={{ flexShrink: 0 }} fill={C.brand} />}
                  <span style={{ fontSize: T.subtitle, fontWeight: 600, color: blocked ? C.slate : C.jet, ...fDisplay, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {participantName}
                  </span>
                </div>
                {blocked ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3, fontSize: T.labelLg, color: C.slateLight, fontWeight: 500, ...fBody }}>
                    <Ban size={11} style={{ flexShrink: 0 }} />
                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      <span style={{ textDecoration: "line-through" }}>Blocked</span> · Tap to unblock
                    </span>
                  </div>
                ) : (
                  <div style={{
                    fontSize: T.labelLg, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    color: t.unread > 0 ? C.jet : C.slate, fontWeight: t.unread > 0 ? 600 : 400, ...fBody,
                  }}>
                    <span style={{ color: C.brand, fontWeight: 600 }}>{t.context}</span>
                    <span style={{ color: C.slateLight, fontWeight: 400 }}> · </span>
                    {t.lastMsg}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, alignSelf: "stretch" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "center", gap: 5 }}>
                  <span style={{ fontSize: T.caption, color: C.slateLight, ...fBody }}>{t.time}</span>
                  {!blocked && t.unread > 0 && (
                    <span style={{
                      width: 18, height: 18, borderRadius: 99, background: C.brand,
                      color: "#FFFFFF", fontSize: T.micro, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {t.unread}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  aria-label={`Conversation options for ${participantName}`}
                  onClick={(e) => { e.stopPropagation(); setOptionsThread(t); }}
                  style={{ width: 28, height: 28, minWidth: 28, minHeight: 28, padding: 0, background: "transparent", border: "none", borderRadius: LAYOUT.pillRadius, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <MoreVertical size={16} color={C.slateLight} />
                </button>
              </div>
            </div>
          );
        })}
        </div>
        </>
        )}
      </div>

      <BottomSheet open={!!blockedThread} onClose={() => setBlockedThread(null)}
        title={blockedThread?.withName || "Conversation blocked"} heightPct={30}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <button onClick={() => { unblock(blockedThread.id); setBlockedThread(null); }} style={sheetBtn(C)()}>
            <div style={iconBox(C.successTint)}><CheckCircle2 size={16} color={C.success} /></div>
            <div>
              <div style={{ fontSize: T.bodyLg, fontWeight: 600, color: C.success, ...fBody }}>Unblock {blockedThread?.withName}</div>
              <div style={{ fontSize: T.label, color: C.slate, marginTop: 2, ...fBody }}>They can message and book you again</div>
            </div>
          </button>
          <button onClick={() => setBlockedThread(null)} style={cancelBtn(C)}>Cancel</button>
        </div>
      </BottomSheet>

      {/* Per-thread options: pin/unpin + delete */}
      <BottomSheet open={!!optionsThread} onClose={() => setOptionsThread(null)}
        title={optionsThread?.withName || "Conversation options"} heightPct={36}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <button
            onClick={() => {
              isPinned(optionsThread.id) ? unpin(optionsThread.id) : pin(optionsThread.id);
              setOptionsThread(null);
            }}
            style={sheetBtn(C)()}
          >
            <div style={iconBox(C.brandTint)}>
              {isPinned(optionsThread?.id) ? <PinOff size={16} color={C.brand} /> : <Pin size={16} color={C.brand} />}
            </div>
            <div>
              <div style={{ fontSize: T.bodyLg, fontWeight: 600, color: C.jet, ...fBody }}>
                {isPinned(optionsThread?.id) ? "Unpin conversation" : "Pin conversation"}
              </div>
              <div style={{ fontSize: T.label, color: C.slate, marginTop: 2, ...fBody }}>
                {isPinned(optionsThread?.id) ? "Move it back with the rest" : "Keep it at the top of your list"}
              </div>
            </div>
          </button>
          <button
            onClick={() => { setDeleteTarget(optionsThread); setOptionsThread(null); }}
            style={sheetBtn(C)()}
          >
            <div style={iconBox(C.dangerTint)}><Trash2 size={16} color={C.danger} /></div>
            <div>
              <div style={{ fontSize: T.bodyLg, fontWeight: 600, color: C.danger, ...fBody }}>Delete conversation</div>
              <div style={{ fontSize: T.label, color: C.slate, marginTop: 2, ...fBody }}>Removes it from your messages</div>
            </div>
          </button>
        </div>
      </BottomSheet>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { remove(deleteTarget.id); setDeleteTarget(null); }}
        title="Delete this conversation?"
        description={`Your chat history with ${deleteTarget?.withName || "this person"} will be removed from Messages. This can't be undone.`}
        confirmLabel="Delete"
        icon={Trash2}
      />
    </div>
  );
}

/* ── Confirm Dialog ────────────────────────────────────────────────────── */

function CenteredDialog({ open, onClose, children }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: "absolute", inset: 0, zIndex: 998,
      background: "rgba(17,18,22,0.45)", display: "flex",
      alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "100%", maxWidth: 320, background: C.white,
        borderRadius: 20, padding: "22px 20px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
      }}>
        {children}
      </div>
    </div>
  );
}

/* ── Conversation Options Flow ─────────────────────────────────────────── */

const REPORT_REASONS = ["Harassment or bullying", "Inappropriate messages", "Spam or scam", "Unsafe behaviour", "Something else"];

function ConversationOptionsFlow({ otherName, onReportSubmit, onBlockConfirm, isBlocked, onUnblock, pendingBookingAction, step, setStep, blockStep, setBlockStep, selectedReason, setSelectedReason, customReason, setCustomReason }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const closeAll = () => { setStep(null); setBlockStep(null); setSelectedReason(null); setCustomReason(""); };
  const canSubmit = selectedReason && (selectedReason !== "Something else" || customReason.trim().length > 0);
  const pendingActionLabel = pendingBookingAction === "decline" ? "declined" : "withdrawn";
  const blockDescription = pendingBookingAction
    ? `${pendingBookingAction === "decline" ? "The pending booking request" : "Your pending booking request"} will be ${pendingActionLabel}. You and ${otherName} won't be able to message or make new bookings together. You can unblock them later in settings.`
    : `You and ${otherName} won't be able to message or make new bookings together. You can unblock them later in settings.`;

  return (
    <>
      {/* Options Sheet */}
      <BottomSheet open={step === "options"} onClose={closeAll} heightPct={isBlocked ? 24 : 28}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <button onClick={() => setStep("report-reason")} style={sheetBtn(C)()}>
            <div style={iconBox(C.brandTint)}><Flag size={16} color={C.brand} /></div>
            <div>
              <div style={{ fontSize: T.bodyLg, fontWeight: 600, color: C.jet, ...fBody }}>Report conversation</div>
              <div style={{ fontSize: T.label, color: C.slate, marginTop: 2, ...fBody }}>Flag this conversation for review by CoachNivo Support</div>
            </div>
          </button>

          {isBlocked ? (
            <button onClick={() => { onUnblock(); closeAll(); }} style={sheetBtn(C)()}>
              <div style={iconBox(C.successTint)}><CheckCircle2 size={16} color={C.success} /></div>
              <div>
                <div style={{ fontSize: T.bodyLg, fontWeight: 600, color: C.success, ...fBody }}>Unblock {otherName}</div>
                <div style={{ fontSize: T.label, color: C.slate, marginTop: 2, ...fBody }}>Allow them to message and book you again</div>
              </div>
            </button>
          ) : (
            <button onClick={() => { setStep(null); setBlockStep("confirm"); }} style={sheetBtn(C)()}>
              <div style={iconBox(C.dangerTint)}><Ban size={16} color={C.danger} /></div>
              <div>
                <div style={{ fontSize: T.bodyLg, fontWeight: 600, color: C.danger, ...fBody }}>Block {otherName}</div>
                <div style={{ fontSize: T.label, color: C.slate, marginTop: 2, ...fBody }}>
                  {pendingBookingAction ? `The pending request will be ${pendingActionLabel}` : "Stop messages and new bookings together"}
                </div>
              </div>
            </button>
          )}
        </div>
      </BottomSheet>

      {/* Report Reason Sheet */}
      <BottomSheet open={step === "report-reason"} onClose={closeAll} title="Report conversation"
        heightPct={selectedReason === "Something else" ? 74 : 62}>
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <div style={{ flex: 1, overflowY: "auto" }}>
            <div style={{ fontSize: T.body, color: C.slate, marginBottom: 14, ...fBody }}>Why are you reporting this conversation?</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {REPORT_REASONS.map(r => (
                <button key={r} onClick={() => setSelectedReason(r)} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 14px", borderRadius: 12, cursor: "pointer", textAlign: "left",
                  border: `1.5px solid ${selectedReason === r ? C.brand : C.border}`,
                  background: selectedReason === r ? C.brandTint : C.white,
                }}>
                  <span style={{ fontSize: T.body, color: C.jet, ...fBody }}>{r}</span>
                  {selectedReason === r && <Check size={16} color={C.brand} />}
                </button>
              ))}
            </div>
            {selectedReason === "Something else" && (
              <textarea value={customReason} onChange={e => setCustomReason(e.target.value)}
                placeholder="Tell us what's going on…" rows={4} autoFocus
                style={{
                  width: "100%", boxSizing: "border-box", background: C.white, marginTop: 14,
                  border: `1.5px solid ${C.border}`, borderRadius: 13, padding: "11px 13px",
                  fontSize: T.bodyLg, color: C.jet, outline: "none", resize: "none", ...fBody,
                }} />
            )}
          </div>
          <div style={{ padding: "14px 0 4px", display: "flex", flexDirection: "column", gap: 10 }}>
            <Btn full onClick={() => { onReportSubmit(); setStep("report-success"); }}
              style={!canSubmit ? { opacity: 0.5, pointerEvents: "none" } : undefined}>
              Submit report
            </Btn>
            <button onClick={closeAll} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "10px 0", fontSize: T.bodyLg, fontWeight: 600, color: C.slate, ...fBody }}>
              Cancel
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Report Success Sheet */}
      <BottomSheet open={step === "report-success"} onClose={closeAll} title="" heightPct={36}>
        <SuccessPanel title="Report submitted" body="Thanks for letting us know. CoachNivo Support will review this conversation." onDone={closeAll} />
      </BottomSheet>

      {/* Block Confirm Dialog */}
      <ConfirmDialog
        open={blockStep === "confirm"}
        onClose={closeAll}
        onConfirm={() => { onBlockConfirm(); setBlockStep("success"); }}
        title={`Block ${otherName}?`}
        description={blockDescription}
        confirmLabel={pendingBookingAction ? `${pendingBookingAction === "decline" ? "Decline" : "Withdraw"} & block` : "Block"}
        icon={Ban}
      />

      {/* Block Success Dialog */}
      <CenteredDialog open={blockStep === "success"} onClose={closeAll}>
        <SuccessPanel
          title={`${otherName} blocked`}
          body={pendingBookingAction ? `The pending request was ${pendingActionLabel}. You can no longer message or make new bookings together.` : "You can no longer message or make new bookings together."}
          onDone={closeAll}
        />
      </CenteredDialog>
    </>
  );
}

/* ── Success Panel (shared) ────────────────────────────────────────────── */

function SuccessPanel({ title, body, onDone }) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  return (
    <div style={{ textAlign: "center", padding: "10px 8px" }}>
      <div style={{ ...iconBox(C.successTint), width: 56, height: 56, borderRadius: 18, margin: "0 auto 14px" }}>
        <CheckCircle2 size={26} color={C.success} />
      </div>
      <div style={{ fontSize: T.titleLg, fontWeight: 600, color: C.jet, ...fDisplay, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: T.body, color: C.slate, lineHeight: 1.5, marginBottom: 20, ...fBody }}>{body}</div>
      <Btn full onClick={onDone}>Done</Btn>
    </div>
  );
}

/* ── Chat Conversation Pane ────────────────────────────────────────────── */

export function ChatConversationPane({
  activeThread, contactName, context, handle, threadId: explicitThreadId,
  role, nav, goBack, toast, offline, bookings, coachBookings, businessBookings,
  respondBooking, cancelBooking, isDesktop, backTarget, onBack, params
}) {
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const { isBlocked, block, unblock } = useBlockedThreads();

  const otherName = contactName || activeThread?.withName || params?.name || "User";
  const threadId = explicitThreadId || activeThread?.id || params?.threadId || params?.bookingId || otherName;
  const blocked = isBlocked(threadId);
  const isCoachActor = role === "coach" || role === "businessCoach";
  const coach = role === "client" ? COACHES.find((c) => c.name === otherName) : null;

  const bookingPool = (role === "businessCoach" ? businessBookings : role === "coach" ? coachBookings : role === "business" ? businessBookings : bookings) || [];
  const explicitBooking = (params?.bookingId || activeThread?.bookingId)
    ? bookingPool.find((booking) => booking.id === (params?.bookingId || activeThread?.bookingId))
    : null;
  const threadContext = context || activeThread?.context || params?.context;
  const isBookingConversation = !!threadContext?.startsWith("Booking");
  const bookingStatusPriority = { confirmed: 0, awaiting_payment: 1, pending: 2, completed: 3 };
  const inferredBooking = isBookingConversation
    ? [...bookingPool]
      .filter((booking) => isCoachActor
        ? String(booking.clientName || "").replace(/\s*\(u18\)\s*/i, "").startsWith(String(otherName || "").replace(/\s*\(u18\)\s*/i, ""))
        : role === "business"
          ? booking.clientName === otherName
          : booking.coachName === otherName)
      .sort((a, b) => (bookingStatusPriority[a.status] ?? 9) - (bookingStatusPriority[b.status] ?? 9))[0]
    : null;
  const relatedBooking = explicitBooking || inferredBooking || null;
  const pendingBookingAction = relatedBooking?.status === BOOKING_STATUS.PENDING
    ? (role === "coach" ? "decline" : role === "businessCoach" ? null : "withdraw")
    : null;
  const locationUnlocked = relatedBooking
    ? (relatedBooking.status === "confirmed" || relatedBooking.status === "completed")
    : !!threadContext?.startsWith("Booking");

  const pub = isCoachActor
    ? getPublicName(
      { name: otherName, ...clientMetaFor(otherName) },
      relatedBooking && ["confirmed", "completed"].includes(relatedBooking.status) ? "confirmed" : "public"
    )
    : (coach
      ? getPublicName(coach, relatedBooking && ["confirmed", "completed"].includes(relatedBooking?.status) ? "confirmed" : "public")
      : { name: otherName, handle: (handle || params?.handle) ? `@${(handle || params?.handle).replace(/^@/, "")}` : null });

  const [messages, setMessages] = useState(
    ((params?.bookingId || activeThread?.bookingId) && BOOKING_ENQUIRY_MESSAGES[params?.bookingId || activeThread?.bookingId]) || CHAT_MESSAGES
  );
  const [input, setInput] = useState("");
  const [step, setStep] = useState(null);
  const [blockStep, setBlockStep] = useState(null);
  const [selectedReason, setSelectedReason] = useState(null);
  const [customReason, setCustomReason] = useState("");
  const [locationSheet, setLocationSheet] = useState(false);
  const fileInputRef = useRef(null);
  const messageListRef = useRef(null);
  const msgIdRef = useRef(1000);
  const nextMsgId = () => (msgIdRef.current += 1);

  useEffect(() => {
    const list = messageListRef.current;
    if (!list) return;
    list.scrollTop = list.scrollHeight;
  }, [messages.length]);

  const deliver = (id) => {
    setMessages((m) => m.map((msg) => (msg.id === id ? { ...msg, status: "sending" } : msg)));
    setTimeout(() => {
      if (offline) {
        setMessages((m) => m.map((msg) => (msg.id === id ? { ...msg, status: "failed" } : msg)));
      } else {
        setMessages((m) => m.map((msg) => (msg.id === id ? { ...msg, status: "sent" } : msg)));
      }
    }, 700);
  };

  const send = () => {
    if (!input.trim() || blocked) return;
    const id = nextMsgId();
    setMessages(m => [...m, { id, from: "me", text: input, time: "now", status: "sending" }]);
    setInput("");
    deliver(id);
  };

  const retryMessage = (id) => {
    setMessages((m) => m.map((msg) => (msg.id === id ? { ...msg, status: "sending" } : msg)));
    deliver(id);
  };

  const handleAttachmentPick = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const isAllowedType = /^image\/|^video\/|^application\/pdf$/.test(file.type)
        || /\.(pdf)$/i.test(file.name);
      const maxBytes = (file.type.startsWith("video/") ? 100 : 25) * 1024 * 1024;
      if (!isAllowedType) {
        toast?.("Only images, PDFs, and videos can be shared here");
      } else if (file.size > maxBytes) {
        toast?.(`${file.name} is too large to send (max ${maxBytes / (1024 * 1024)}MB)`);
      } else {
        setMessages(m => [...m, { id: m.length + 1, from: "me", type: "attachment", fileName: file.name, fileSize: file.size, time: "now" }]);
        toast?.(`${file.name} sent`);
      }
    }
    e.target.value = "";
  };

  const shareLocation = () => {
    if (!locationUnlocked) return;
    setMessages(m => [...m, { id: m.length + 1, from: "me", type: "location", time: "now" }]);
    setLocationSheet(false);
    toast?.("Location shared");
  };

  const openBooking = () => {
    if (!relatedBooking) return;
    if (!isCoachActor) {
      nav("client-booking-detail", { id: relatedBooking.id });
      return;
    }
    if (role === "businessCoach") {
      nav("business-coach-booking-detail", { id: relatedBooking.id });
      return;
    }
    const coachRoute = ["confirmed", "completed"].includes(relatedBooking.status)
      ? "coach-session-detail"
      : relatedBooking.status === "awaiting_payment" ? "booking-awaiting-payment" : "coach-booking-detail";
    nav(coachRoute, { id: relatedBooking.id });
  };

  return (
    <div style={{ height: "100%", minWidth: 0, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", background: C.white }}>
      {/* Header */}
      <div style={{ flexShrink: 0, borderBottom: `1px solid ${C.border}`, background: C.white }}>
        <div style={{ minHeight: LAYOUT.topBarH, boxSizing: "border-box", padding: isDesktop ? "8px 24px" : `6px ${LAYOUT.pagePadX}px`, display: "flex", alignItems: "center", gap: 10 }}>
          {!isDesktop && onBack && (
            <BackButton onClick={onBack} />
          )}
          <button
            type="button"
            disabled={!coach}
            aria-label={coach ? `View ${pub.name}'s coach profile` : undefined}
            onClick={coach ? () => nav("coach-profile", { id: coach.id }) : undefined}
            style={{
              flex: 1, minWidth: 0, minHeight: LAYOUT.touchTarget, padding: 0,
              display: "flex", alignItems: "center", gap: 10, textAlign: "left",
              background: "transparent", border: "none", borderRadius: LAYOUT.inputRadius,
              cursor: coach ? "pointer" : "default", opacity: 1,
            }}
          >
            <Avatar name={pub.name} size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
                <span style={{ minWidth: 0, fontSize: T.subtitle, fontWeight: 700, color: C.jet, ...fDisplay, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {pub.name}
                </span>
                {coach && <ChevronRight aria-hidden="true" size={14} color={C.slateLight} style={{ flexShrink: 0 }} />}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 1, fontSize: 12, color: C.slate, ...fBody }}>
                {threadContext && (
                  <span style={{ color: C.brand, fontWeight: 600 }}>{threadContext}</span>
                )}
                {pub.handle && (
                  <span style={{ color: C.slateLight }}>{pub.handle}</span>
                )}
              </div>
            </div>
          </button>

          {relatedBooking && !blocked && (
            <button
              type="button"
              onClick={openBooking}
              aria-label={`View booking for ${relatedBooking.service}`}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px",
                background: C.fog, border: `1px solid ${C.border}`, borderRadius: LAYOUT.pillRadius,
                cursor: "pointer", fontSize: T.caption, fontWeight: 600, color: C.jet, ...fBody,
                flexShrink: 0, transition: "background .15s ease",
              }}
            >
              <Calendar aria-hidden="true" size={14} color={C.brand} />
              <span>View Booking</span>
            </button>
          )}

          <button
            type="button"
            aria-label="Conversation options"
            onClick={() => setStep("options")}
            style={{
              width: LAYOUT.touchTarget, height: LAYOUT.touchTarget, borderRadius: LAYOUT.pillRadius,
              background: "transparent", border: "none", display: "flex", alignItems: "center",
              justifyContent: "center", cursor: "pointer", flexShrink: 0, color: C.slate,
            }}
          >
            <MoreVertical size={20} color={C.jet} />
          </button>
        </div>

        {!isDesktop && relatedBooking && !blocked && (
          <div style={{ padding: "0 14px 10px" }}>
            <button
              type="button"
              onClick={openBooking}
              aria-label={`View booking for ${relatedBooking.service}`}
              style={{
                width: "100%", minHeight: LAYOUT.touchTarget, padding: "8px 11px",
                display: "flex", alignItems: "center", gap: 9, textAlign: "left",
                background: C.fog, border: `1px solid ${C.border}`, borderRadius: LAYOUT.inputRadius,
                cursor: "pointer",
              }}
            >
              <Calendar aria-hidden="true" size={16} color={C.brand} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: T.labelLg, fontWeight: 700, color: C.jet, ...fBody }}>View booking</span>
                <span style={{ display: "block", fontSize: T.caption, color: C.slate, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", ...fBody }}>{relatedBooking.service} · {relatedBooking.date}</span>
              </span>
              <ChevronRight aria-hidden="true" size={15} color={C.slateLight} />
            </button>
          </div>
        )}
      </div>

      {/* Message Stream */}
      <div
        ref={messageListRef}
        className="cl-hide-scrollbar"
        style={{
          flex: 1, minHeight: 0, overflowY: "auto", overscrollBehavior: "contain",
          padding: isDesktop ? "24px 32px 18px" : "14px 16px 12px",
          display: "flex", flexDirection: "column", gap: 10, background: C.white,
        }}
      >
        <div style={{ alignSelf: "center", padding: "4px 12px", borderRadius: LAYOUT.pillRadius, background: C.fog, border: `1px solid ${C.border}`, fontSize: T.caption, fontWeight: 600, color: C.slate, ...fBody }}>
          Today
        </div>

        {messages.map((m) => (
          <div key={m.id} style={{ display: "flex", justifyContent: m.from === "me" ? "flex-end" : "flex-start", animation: "clSlideUp .25s ease" }}>
            {m.type === "attachment" ? (
              <div style={{
                maxWidth: isDesktop ? "60%" : "75%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 16,
                borderBottomRightRadius: m.from === "me" ? 4 : 16, borderBottomLeftRadius: m.from === "me" ? 16 : 4,
                background: m.from === "me" ? C.brandTint : C.fog, border: `1px solid ${m.from === "me" ? "transparent" : C.border}`, ...fBody,
              }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: C.white, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>
                  <FileText size={16} color={C.brand} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: T.labelLg, fontWeight: 600, color: C.jet, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.fileName}</div>
                  <div style={{ fontSize: T.caption, color: C.slate, marginTop: 1 }}>{Math.max(1, Math.round((m.fileSize || 0) / 1024))} KB</div>
                </div>
              </div>
            ) : m.type === "location" ? (
              <div style={{
                maxWidth: isDesktop ? "60%" : "75%", borderRadius: 16, overflow: "hidden",
                borderBottomRightRadius: m.from === "me" ? 4 : 16, borderBottomLeftRadius: m.from === "me" ? 16 : 4,
                background: m.from === "me" ? C.brandTint : C.fog, border: `1px solid ${C.border}`,
              }}>
                <div style={{
                  height: 80, background: `repeating-linear-gradient(45deg, ${C.border} 0 6px, ${C.fog} 6px 12px)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: 99, background: C.brand, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,.25)" }}>
                    <MapPin size={17} color="#FFFFFF" />
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", fontSize: T.labelLg, fontWeight: 600, color: C.jet, ...fBody }}>
                  <Navigation size={13} color={C.brand} /> Live location shared
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: m.from === "me" ? "flex-end" : "flex-start", maxWidth: isDesktop ? "60%" : "75%" }}>
                <div style={{
                  padding: "10px 15px", borderRadius: 18,
                  borderBottomRightRadius: m.from === "me" ? 4 : 18,
                  borderBottomLeftRadius: m.from === "me" ? 18 : 4,
                  background: m.status === "failed" ? C.dangerTint : m.from === "me" ? C.brand : C.fog,
                  color: m.status === "failed" ? C.danger : m.from === "me" ? "#FFFFFF" : C.jet,
                  border: m.from === "me" ? "none" : `1px solid ${C.border}`,
                  fontSize: T.bodyLg, lineHeight: 1.5, ...fBody,
                }}>
                  {m.text}
                </div>
                {m.from === "me" && m.status && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 5, marginTop: 4, fontSize: T.tiny, fontWeight: 600, ...fBody,
                    color: m.status === "failed" ? C.danger : m.status === "sending" ? C.slateLight : C.success,
                  }}>
                    {m.status === "sending" && <>Sending…</>}
                    {m.status === "sent" && <><Check size={11} /> {m.time && m.time !== "now" ? `${m.time} · ` : ""}Sent</>}
                    {m.status === "failed" && (
                      <>
                        <AlertCircle size={11} /> Not delivered
                        <button onClick={() => retryMessage(m.id)} style={{ display: "flex", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", color: C.danger, fontWeight: 700, fontSize: T.tiny, padding: 0, marginLeft: 4, ...fBody }}>
                          <RotateCcw size={10} /> Retry
                        </button>
                      </>
                    )}
                  </div>
                )}
                {(m.from !== "me" || !m.status) && m.time && (
                  <div style={{ marginTop: 4, fontSize: T.tiny, color: C.slateLight, ...fBody }}>{m.time}</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {offline && (
        <div style={{ padding: "0 24px 8px" }}>
          <StatusBanner state="offline" compact />
        </div>
      )}

      {/* Bottom Composer */}
      {blocked ? (
        <div style={{ padding: isDesktop ? "14px 24px 20px" : "14px 18px 22px", background: C.white }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.fog, borderRadius: 12, padding: "12px 16px", fontSize: T.labelLg, color: C.slate, lineHeight: 1.5, ...fBody }}>
            <Ban size={16} color={C.danger} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>You blocked {otherName}.</span>
            <button onClick={() => unblock(threadId)} style={{ fontSize: T.labelLg, fontWeight: 600, color: C.white, background: C.jet, border: "none", borderRadius: 8, padding: "7px 14px", cursor: "pointer", whiteSpace: "nowrap", ...fBody }}>
              Unblock
            </button>
          </div>
        </div>
      ) : (
        <div style={{
          width: "100%", minWidth: 0, boxSizing: "border-box",
          padding: isDesktop ? "12px 24px 18px" : "8px 12px",
          paddingBottom: isDesktop ? 18 : "max(24px, env(safe-area-inset-bottom))",
          display: "flex", alignItems: "center", gap: 8,
          background: C.white, flexShrink: 0,
        }}>
          <input ref={fileInputRef} type="file" accept="image/*,application/pdf,video/*" onChange={handleAttachmentPick} style={{ display: "none" }} />
          <div
            className="cl-input"
            style={{
              flex: "1 1 0", minWidth: 0, height: 46, boxSizing: "border-box",
              display: "flex", alignItems: "center", border: `1.5px solid ${C.border}`,
              borderRadius: 14, padding: "0 6px 0 14px", background: C.white,
              transition: "border-color .15s ease",
            }}
          >
            <input
              name="message"
              autoComplete="off"
              aria-label="Message"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={`Message ${pub.name}…`}
              style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontSize: T.bodyLg, color: C.jet, ...fBody }}
            />
            <button
              type="button"
              aria-label="Attach a file"
              title="Attach an image, video, or PDF"
              onClick={() => fileInputRef.current?.click()}
              style={{ width: 36, height: 36, padding: 0, marginLeft: 2, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", borderRadius: LAYOUT.pillRadius, cursor: "pointer", color: C.slate }}
            >
              <Paperclip size={18} />
            </button>
            <button
              type="button"
              aria-label={locationUnlocked ? "Share your location" : "Location sharing is available after confirmation"}
              onClick={() => setLocationSheet(true)}
              title={locationUnlocked ? "Share your location" : "Available once the booking is confirmed"}
              style={{ width: 36, height: 36, padding: 0, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", borderRadius: LAYOUT.pillRadius, cursor: "pointer", opacity: locationUnlocked ? 1 : 0.4, color: C.slate }}
            >
              <MapPin size={18} />
            </button>
          </div>

          <button
            type="button"
            aria-label="Send message"
            disabled={!input.trim()}
            onClick={send}
            style={{
              width: 46, height: 46, padding: 0, borderRadius: 14,
              background: input.trim() ? C.jet : C.fog,
              color: input.trim() ? C.white : C.slateLight,
              border: "none", display: "flex", alignItems: "center", justifyContent: "center",
              cursor: input.trim() ? "pointer" : "default", flexShrink: 0,
              transition: "background .15s ease, color .15s ease",
            }}
          >
            <Send size={18} />
          </button>
        </div>
      )}

      {/* Location Share Sheet */}
      <BottomSheet open={locationSheet} onClose={() => setLocationSheet(false)} title="Share your location" heightPct={34}>
        {locationUnlocked ? (
          <>
            <div style={{ fontSize: T.body, color: C.slate, lineHeight: 1.55, marginBottom: 18, ...fBody }}>
              {otherName} will be able to see your live location for this session. You can stop sharing at any time.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Btn full icon={Navigation} onClick={shareLocation}>Share current location</Btn>
              <Btn full variant="secondary" onClick={() => setLocationSheet(false)}>Cancel</Btn>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: C.fog, borderRadius: 12, padding: "12px 14px", marginBottom: 18 }}>
              <AlertCircle size={16} color={C.slate} style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: T.body, color: C.slate, lineHeight: 1.55, ...fBody }}>
                Your live location can only be shared once your booking with {otherName} is confirmed. This protects you from sharing it with unpaid or unverified contacts.
              </div>
            </div>
            <Btn full variant="secondary" onClick={() => setLocationSheet(false)}>Got it</Btn>
          </>
        )}
      </BottomSheet>

      {/* Report / Block Options */}
      <ConversationOptionsFlow
        otherName={otherName}
        isBlocked={blocked}
        pendingBookingAction={pendingBookingAction}
        onUnblock={() => unblock(threadId)}
        onReportSubmit={() => toast?.(`Report submitted (${selectedReason === "Something else" ? customReason.trim() : selectedReason})`)}
        onBlockConfirm={() => {
          if (pendingBookingAction === "decline") {
            respondBooking?.(relatedBooking.id, BOOKING_STATUS.DECLINED);
          } else if (pendingBookingAction === "withdraw") {
            cancelBooking?.(relatedBooking.id);
          }
          block(threadId);
          toast?.(pendingBookingAction
            ? `Pending request ${pendingBookingAction === "decline" ? "declined" : "withdrawn"}; ${otherName} blocked`
            : `${otherName} has been blocked`);
        }}
        step={step} setStep={setStep}
        blockStep={blockStep} setBlockStep={setBlockStep}
        selectedReason={selectedReason} setSelectedReason={setSelectedReason}
        customReason={customReason} setCustomReason={setCustomReason}
      />
    </div>
  );
}

/* ── Unified Two-Panel Desktop Messages Layout ─────────────────────────── */

function DesktopTwoPanelMessages(props) {
  const { nav, role, isFirstTimeClient, params, initialSelectedId } = props;
  const { darkMode } = useApp();
  const C = darkMode ? CD : CL;
  const { isBlocked } = useBlockedThreads();
  const { isPinned, pin, unpin } = usePinnedThreads();
  const { isDeleted, remove } = useDeletedThreads();

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [optionsThread, setOptionsThread] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const rawThreads = role === "coach" || role === "businessCoach"
    ? COACH_THREADS
    : role === "business"
      ? BUSINESS_THREADS
      : THREADS;

  const threads = useMemo(() => {
    let list = [...rawThreads]
      .filter((t) => !isDeleted(t.id))
      .sort((a, b) => (isPinned(b.id) ? 1 : 0) - (isPinned(a.id) ? 1 : 0) || (b.unread > 0 ? 1 : 0) - (a.unread > 0 ? 1 : 0));

    const targetName = params?.name;
    if (targetName && !list.some((t) => t.withName === targetName || t.id === params?.threadId)) {
      list = [
        {
          id: params?.threadId || `thread-${targetName.toLowerCase().replace(/\s+/g, "-")}`,
          withName: targetName,
          context: params?.context || "New conversation",
          lastMsg: "Start a conversation…",
          time: "Now",
          unread: 0,
          bookingId: params?.bookingId,
          handle: params?.handle,
        },
        ...list,
      ];
    }
    return list;
  }, [rawThreads, isDeleted, isPinned, params?.name, params?.threadId, params?.context, params?.bookingId, params?.handle]);

  const [selectedThreadId, setSelectedThreadId] = useState(() => {
    if (initialSelectedId) return initialSelectedId;
    if (params?.threadId) return params.threadId;
    if (params?.name) {
      const match = threads.find((t) => t.withName === params.name);
      if (match) return match.id;
    }
    return threads[0]?.id || null;
  });

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const filteredThreads = useMemo(() => {
    if (!searchQuery.trim()) return threads;
    const q = searchQuery.toLowerCase();
    return threads.filter(
      (t) =>
        t.withName.toLowerCase().includes(q) ||
        (t.context && t.context.toLowerCase().includes(q)) ||
        (t.lastMsg && t.lastMsg.toLowerCase().includes(q))
    );
  }, [threads, searchQuery]);

  const activeThread = useMemo(() => {
    if (!selectedThreadId) return threads[0] || null;
    return threads.find((t) => t.id === selectedThreadId || t.withName === selectedThreadId) || threads[0] || null;
  }, [threads, selectedThreadId]);

  const showEmptyChat = role === "client" && isFirstTimeClient;

  return (
    <div style={{ height: "100%", width: "100%", display: "flex", overflow: "hidden", background: C.white }}>
      {/* ── Left Panel: Contacts & Conversation List ──────────────────────── */}
      <aside
        aria-label="Conversation list"
        style={{
          width: 360,
          minWidth: 320,
          maxWidth: 400,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          borderRight: `1px solid ${C.border}`,
          background: C.white,
          flexShrink: 0,
        }}
      >
        {/* Panel Header */}
        <div style={{
          padding: "16px 20px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${C.border}`,
          flexShrink: 0,
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.jet, ...fDisplay }}>Messages</h1>
            <span style={{ fontSize: 12, color: C.slate, ...fBody }}>
              {filteredThreads.length} conversation{filteredThreads.length === 1 ? "" : "s"}
            </span>
          </div>

          <button
            type="button"
            aria-label="Help and support"
            onClick={() => nav("support")}
            style={{
              width: 36, height: 36, borderRadius: LAYOUT.pillRadius,
              background: "transparent", border: `1px solid ${C.border}`,
              cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", color: C.slate,
              transition: "background .15s ease",
            }}
          >
            <HelpCircle size={18} />
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ padding: "12px 16px 10px", flexShrink: 0, borderBottom: `1px solid ${C.border}` }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 9, background: C.fog,
            borderRadius: 12, padding: "0 12px", height: 38, border: `1px solid ${C.border}`,
          }}>
            <Search size={15} color={C.slate} style={{ flexShrink: 0 }} />
            <input
              type="text"
              aria-label="Search conversations"
              placeholder="Search conversations…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1, minWidth: 0, border: "none", outline: "none",
                background: "transparent", fontSize: 13, color: C.jet, ...fBody,
              }}
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearchQuery("")}
                style={{
                  background: "transparent", border: "none", padding: 0,
                  cursor: "pointer", display: "flex", alignItems: "center",
                  color: C.slate,
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Conversation List Scrollable Body */}
        <div
          className="cl-hide-scrollbar"
          style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}
        >
          {loading ? (
            <div style={{ padding: "8px 6px" }}>
              <ThreadSkeleton rows={5} />
            </div>
          ) : showEmptyChat ? (
            <div style={{ padding: "40px 16px", textAlign: "center" }}>
              <div style={{
                width: 48, height: 48, borderRadius: 16, background: C.brandTint,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 12px",
              }}>
                <MessageCircle size={22} color={C.brand} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.jet, ...fDisplay, marginBottom: 4 }}>
                No Conversations Yet
              </div>
              <div style={{ fontSize: 12.5, color: C.slate, lineHeight: 1.4, ...fBody }}>
                Once you send a booking request, your messages with coaches appear here.
              </div>
            </div>
          ) : filteredThreads.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 16px", color: C.slate, fontSize: 13, ...fBody }}>
              {searchQuery ? `No conversations matching "${searchQuery}"` : "No conversations here."}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {filteredThreads.map((t) => {
                const blocked = isBlocked(t.id);
                const pinned = isPinned(t.id);
                const isSelected = activeThread?.id === t.id;
                const participantName = threadParticipantName(t.withName, role);

                return (
                  <div
                    key={t.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedThreadId(t.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedThreadId(t.id);
                      }
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 12px",
                      borderRadius: 12,
                      cursor: "pointer",
                      textAlign: "left",
                      background: isSelected
                        ? (darkMode ? "#222733" : C.brandTint)
                        : pinned
                          ? C.fog
                          : "transparent",
                      border: isSelected
                        ? `1px solid ${darkMode ? "#333C4E" : "#FBCBB3"}`
                        : "1px solid transparent",
                      opacity: blocked ? 0.65 : 1,
                      transition: "background .15s ease, border-color .15s ease",
                      boxSizing: "border-box",
                    }}
                  >
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <div style={{ filter: blocked ? "grayscale(1)" : "none" }}>
                        <Avatar name={participantName} size={44} />
                      </div>
                      {blocked && (
                        <div style={{
                          position: "absolute", right: -3, bottom: -3, width: 18, height: 18,
                          borderRadius: 99, background: C.white, border: `1px solid ${C.border}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <Ban size={10} color={C.slateLight} />
                        </div>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
                        {pinned && <Pin size={11} color={C.brand} style={{ flexShrink: 0 }} fill={C.brand} />}
                        <span style={{
                          fontSize: 14,
                          fontWeight: isSelected || t.unread > 0 ? 700 : 600,
                          color: blocked ? C.slate : C.jet,
                          ...fDisplay,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}>
                          {participantName}
                        </span>
                      </div>

                      <div style={{
                        fontSize: 12.5,
                        marginTop: 2,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        color: t.unread > 0 ? C.jet : C.slate,
                        fontWeight: t.unread > 0 ? 600 : 400,
                        ...fBody,
                      }}>
                        {blocked ? (
                          <span style={{ color: C.slateLight }}>Blocked</span>
                        ) : (
                          <>
                            {t.context && <span style={{ color: C.brand, fontWeight: 600 }}>{t.context} · </span>}
                            {t.lastMsg}
                          </>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                      <span style={{ fontSize: 11, color: C.slateLight, ...fBody }}>{t.time}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        {!blocked && t.unread > 0 && (
                          <span style={{
                            minWidth: 18, height: 18, borderRadius: 99, background: C.brand,
                            color: "#FFFFFF", fontSize: 10.5, fontWeight: 700, padding: "0 4px",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            {t.unread}
                          </span>
                        )}
                        <button
                          type="button"
                          aria-label={`Options for ${participantName}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOptionsThread(t);
                          }}
                          style={{
                            width: 24, height: 24, padding: 0, background: "transparent",
                            border: "none", borderRadius: LAYOUT.pillRadius, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: C.slateLight,
                          }}
                        >
                          <MoreVertical size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      {/* ── Right Panel: Active Conversation ──────────────────────────────── */}
      <main
        aria-label="Conversation detail"
        style={{
          flex: 1,
          minWidth: 0,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: C.white,
          position: "relative",
        }}
      >
        {activeThread && !showEmptyChat ? (
          <ChatConversationPane
            key={activeThread.id}
            activeThread={activeThread}
            contactName={activeThread.withName}
            context={activeThread.context}
            handle={activeThread.handle}
            threadId={activeThread.id}
            isDesktop={true}
            {...props}
          />
        ) : (
          <div style={{
            flex: 1,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 32,
            textAlign: "center",
            background: C.white,
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 20, background: C.brandTint,
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 16,
            }}>
              <MessageCircle size={32} color={C.brand} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.jet, ...fDisplay, marginBottom: 8 }}>
              Select a conversation
            </div>
            <div style={{ fontSize: 13.5, color: C.slate, maxWidth: 320, lineHeight: 1.5, ...fBody }}>
              Choose a contact from the list on the left to start messaging and manage your sessions.
            </div>
          </div>
        )}
      </main>

      <BottomSheet
        open={!!optionsThread}
        onClose={() => setOptionsThread(null)}
        title={optionsThread?.withName || "Conversation options"}
        heightPct={36}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <button
            onClick={() => {
              isPinned(optionsThread.id) ? unpin(optionsThread.id) : pin(optionsThread.id);
              setOptionsThread(null);
            }}
            style={sheetBtn(C)()}
          >
            <div style={iconBox(C.brandTint)}>
              {isPinned(optionsThread?.id) ? <PinOff size={16} color={C.brand} /> : <Pin size={16} color={C.brand} />}
            </div>
            <div>
              <div style={{ fontSize: T.bodyLg, fontWeight: 600, color: C.jet, ...fBody }}>
                {isPinned(optionsThread?.id) ? "Unpin conversation" : "Pin conversation"}
              </div>
              <div style={{ fontSize: T.label, color: C.slate, marginTop: 2, ...fBody }}>
                {isPinned(optionsThread?.id) ? "Move it back with the rest" : "Keep it at the top of your list"}
              </div>
            </div>
          </button>
          <button
            onClick={() => {
              setDeleteTarget(optionsThread);
              setOptionsThread(null);
            }}
            style={sheetBtn(C)()}
          >
            <div style={iconBox(C.dangerTint)}><Trash2 size={16} color={C.danger} /></div>
            <div>
              <div style={{ fontSize: T.bodyLg, fontWeight: 600, color: C.danger, ...fBody }}>Delete conversation</div>
              <div style={{ fontSize: T.label, color: C.slate, marginTop: 2, ...fBody }}>Removes it from your messages</div>
            </div>
          </button>
        </div>
      </BottomSheet>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          remove(deleteTarget.id);
          setDeleteTarget(null);
        }}
        title="Delete this conversation?"
        description={`Your chat history with ${deleteTarget?.withName || "this person"} will be removed from Messages. This can't be undone.`}
        confirmLabel="Delete"
        icon={Trash2}
      />
    </div>
  );
}

/* ── Chat Thread Screen (Direct Route Entry Point) ─────────────────────── */

export function ScreenChatThread(props) {
  const { goBack, params, role } = props;
  const { isDesktop } = useResponsive();

  // On desktop viewports, render the complete two-panel layout with this contact active!
  if (isDesktop) {
    return <DesktopTwoPanelMessages {...props} initialSelectedId={params?.threadId || params?.name} />;
  }

  const backTarget = params?.backTo || (role === "coach" ? "coach-messages" : role === "businessCoach" ? "business-coach-messages" : role === "business" ? "business-messages" : "client-messages");

  return (
    <ChatConversationPane
      contactName={params?.name}
      context={params?.context}
      handle={params?.handle}
      threadId={params?.threadId || params?.bookingId || params?.name}
      isDesktop={false}
      onBack={() => goBack(backTarget, params?.backParams || {})}
      {...props}
    />
  );
}
