import { useState, useEffect } from "react";

/* =========================================================================
   REVIEW REPLIES & DISPUTES
   -------------------------------------------------------------------------
   Lightweight module-level store (same pattern as the blocked/pinned/deleted
   thread stores in Messaging.jsx) so a coach's public reply to a review, or
   a filed dispute, stays in sync everywhere that review is shown — the
   coach's own dashboard and the public client-facing coach profile — for
   the lifetime of the session.
   ========================================================================= */

let replies = new Map();   // reviewId -> { text, time }
let disputes = new Map();  // reviewId -> { reason, detail, status: "pending" }
const subscribers = new Set();
const emit = () => subscribers.forEach((cb) => cb());

export function submitReviewReply(reviewId, text) {
  if (!reviewId || !text?.trim()) return;
  replies = new Map(replies).set(reviewId, { text: text.trim(), time: "Just now" });
  emit();
}

export function submitReviewDispute(reviewId, reason, detail) {
  if (!reviewId || !reason) return;
  disputes = new Map(disputes).set(reviewId, { reason, detail: detail?.trim() || "", status: "pending" });
  emit();
}

export function useReviewActions() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const cb = () => setTick((t) => t + 1);
    subscribers.add(cb);
    return () => subscribers.delete(cb);
  }, []);
  return {
    getReply: (reviewId) => replies.get(reviewId) || null,
    getDispute: (reviewId) => disputes.get(reviewId) || null,
    submitReply: submitReviewReply,
    submitDispute: submitReviewDispute,
  };
}

export const DISPUTE_REASONS = [
  "Rating doesn't match the review text",
  "Review is abusive or contains inappropriate content",
  "Client didn't attend / this booking didn't happen",
  "Review violates guidelines",
  "Something else",
];
