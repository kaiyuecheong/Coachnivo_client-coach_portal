/* =========================================================================
   BOOKING, MESSAGING, NOTIFICATION & ADMIN SEED DATA
   ========================================================================= */

/**
 * Authoritative prototype lifecycle.
 *
 * A coach accepting a request does not confirm the session. It moves the
 * booking to `awaiting_payment`; only a successful payment can move it to
 * `confirmed`. Terminal outcomes stay available for history and support.
 */
export const BOOKING_STATUS = Object.freeze({
  PENDING: "pending",
  AWAITING_PAYMENT: "awaiting_payment",
  CONFIRMED: "confirmed",
  IN_PROGRESS: "in_progress",
  COMPLETION_PENDING: "completion_pending",
  COMPLETED: "completed",
  DECLINED: "declined",
  EXPIRED: "expired",
  CANCELLED: "cancelled",
});

/** Session OTP runtime — how long a generated code stays valid, and how many
    wrong entries the coach gets before the code is voided. */
export const SESSION_OTP = Object.freeze({
  TTL_SECONDS: 600,
  MAX_ATTEMPTS: 3,
});

export const PAYMENT_STATUS = Object.freeze({
  NOT_REQUESTED: "not_requested",
  DUE: "due",
  HELD: "held",
  REFUND_PROCESSING: "refund_processing",
  REFUNDED: "refunded",
  RELEASED: "released",
});

export const PAYOUT_STATUS = Object.freeze({
  NOT_READY: "not_ready",
  PROCESSING: "processing",
  RELEASED: "released",
});

export const DISPUTE_STATUS = Object.freeze({
  SUBMITTED: "submitted",
  REVIEWING: "reviewing",
  RESOLVED: "resolved",
});

export const DISPUTE_OUTCOME = Object.freeze({
  CLIENT_REFUNDED: "client_refunded",
  COACH_COMPENSATED: "coach_compensated",
  DISMISSED: "dismissed",
});

export const ADDITIONAL_CHARGE_STATUS = Object.freeze({
  PENDING: "pending",
  PAID: "paid",
  DECLINED: "declined",
  DISPUTED: "disputed",
  CANCELLED: "cancelled",
});

export const ADDITIONAL_CHARGE_PHASE = Object.freeze({
  ACCEPTANCE: "acceptance",
  COMPLETION: "completion",
  IN_PROGRESS: "in_progress",
});

export const ADDITIONAL_CHARGE_KIND = Object.freeze({
  REQUIRED: "required",
  OPTIONAL: "optional",
});

export const BOOKING_LIFECYCLE = Object.freeze({
  [BOOKING_STATUS.PENDING]: {
    label: "Awaiting coach",
    paymentStatus: PAYMENT_STATUS.NOT_REQUESTED,
    next: [BOOKING_STATUS.AWAITING_PAYMENT, BOOKING_STATUS.DECLINED, BOOKING_STATUS.CANCELLED, BOOKING_STATUS.EXPIRED],
  },
  [BOOKING_STATUS.AWAITING_PAYMENT]: {
    label: "Payment due",
    paymentStatus: PAYMENT_STATUS.DUE,
    next: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.CANCELLED, BOOKING_STATUS.EXPIRED],
  },
  [BOOKING_STATUS.CONFIRMED]: {
    label: "Confirmed",
    paymentStatus: PAYMENT_STATUS.HELD,
    next: [BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.CANCELLED],
  },
  [BOOKING_STATUS.IN_PROGRESS]: {
    label: "Session in progress",
    paymentStatus: PAYMENT_STATUS.HELD,
    next: [BOOKING_STATUS.COMPLETION_PENDING, BOOKING_STATUS.CANCELLED],
  },
  [BOOKING_STATUS.COMPLETION_PENDING]: {
    label: "Confirm completion",
    paymentStatus: PAYMENT_STATUS.HELD,
    next: [BOOKING_STATUS.COMPLETED],
  },
  [BOOKING_STATUS.COMPLETED]: {
    label: "Completed",
    paymentStatus: PAYMENT_STATUS.RELEASED,
    next: [],
  },
  [BOOKING_STATUS.DECLINED]: {
    label: "Declined",
    paymentStatus: PAYMENT_STATUS.NOT_REQUESTED,
    next: [],
  },
  [BOOKING_STATUS.EXPIRED]: {
    label: "Expired",
    paymentStatus: PAYMENT_STATUS.NOT_REQUESTED,
    next: [],
  },
  [BOOKING_STATUS.CANCELLED]: {
    label: "Cancelled",
    paymentStatus: PAYMENT_STATUS.NOT_REQUESTED,
    next: [],
  },
});

export function withBookingLifecycle(booking) {
  const lifecycle = BOOKING_LIFECYCLE[booking.status] || BOOKING_LIFECYCLE[BOOKING_STATUS.PENDING];
  const payoutStatus = booking.payoutStatus
    || (booking.status === BOOKING_STATUS.COMPLETED
      ? PAYOUT_STATUS.RELEASED
      : booking.status === BOOKING_STATUS.COMPLETION_PENDING
        ? PAYOUT_STATUS.PROCESSING
        : PAYOUT_STATUS.NOT_READY);
  return { ...booking, paymentStatus: booking.paymentStatus || lifecycle.paymentStatus, payoutStatus };
}

export const INITIAL_BOOKINGS = [
  // Pending — awaiting coach's response
  { id: "b2", coachId: "c2", coachName: "Noah Kelly", clientName: "Sarah Lin", service: "1:1 Programming Session", date: "Fri, 25 Jul", time: "6:00am", mode: "In-person", status: "pending", price: 65, reviewed: false, participants: "You", notes: "Coming back from a shoulder injury - cleared for light training, will bring physio notes." },
  { id: "b5", coachId: "c1", coachName: "Isla Ferguson", clientName: "Sarah Lin", service: "Group Clinic", date: "Fri, 21 Aug", time: "3:00pm", mode: "In-person", status: "awaiting_payment", paymentDeadline: "Tomorrow, 6:00pm", paymentReminderSent: false, price: 42, reviewed: false, participants: "You", notes: "" },
  { id: "b6", coachId: "c5", coachName: "Chloe Dawson", clientName: "Sarah Lin", service: "Virtual Swing Review", date: "Sun, 10 Aug", time: "9:00am", mode: "Virtual", status: "pending", price: 40, reviewed: false, participants: "You", notes: "" },
  { id: "b7", coachId: "c6", coachName: "Liam O'Connor", clientName: "Sarah Lin", service: "Small Group Ride", date: "Thu, 14 Aug", time: "5:30pm", mode: "In-person", status: "pending", price: 42, reviewed: false, participants: "You", notes: "" },
  { id: "b18", coachId: "c7", coachName: "Priya Sharma", clientName: "Sarah Lin", service: "Pickleball Strategy & Dinking Clinic", date: "Mon, 18 Aug", time: "5:00pm", mode: "In-person", status: "pending", price: 32, reviewed: false, participants: "You", notes: "First time trying pickleball tactics with competitive paddle drills." },
  { id: "b19", coachId: "c10", coachName: "Tyler Koa Henderson", clientName: "Sarah Lin", service: "1:1 Stroke Correction & HD Video Analysis", date: "Tue, 19 Aug", time: "6:30am", mode: "In-person", status: "awaiting_payment", paymentDeadline: "Today, 11:59pm", paymentReminderSent: true, price: 75, reviewed: false, participants: "You", notes: "Focus on freestyle bilateral breathing." },

  // Upcoming — confirmed on calendar
  { id: "s1", coachId: "c2", coachName: "Noah Kelly", clientName: "Sarah Lin", clientHandle: "sarahlin", service: "1:1 Programming Session", date: "Thu, 20 Aug", time: "6:00am", mode: "In-person", status: "completion_pending", paymentStatus: "held", payoutStatus: "not_ready", completionConfirmedBy: "coach", completionConfirmations: ["coach"], price: 65, reviewed: false, participants: "You", notes: "Focus on clean return-to-training technique." },
  { id: "b1", coachId: "c1", coachName: "Isla Ferguson", clientName: "Sarah Lin", service: "1:1 Court Session", date: "Tue, 22 Jul", time: "4:00pm", mode: "In-person", status: "confirmed", price: 72, reviewed: false, participants: "You", notes: "", sessionCode: "738291", codeGeneratedAt: "Just now" },
  { id: "b8", coachId: "c3", coachName: "Ruby Hendricks", clientName: "Sarah Lin", service: "1:1 Beach Session", date: "Thu, 6 Aug", time: "7:00am", mode: "In-person", status: "in_progress", paymentStatus: "held", price: 65, reviewed: false, participants: "You", notes: "", sessionCode: "482931", codeGeneratedAt: "Just now", sessionStartedAt: "Just now" },
  { id: "b9", coachId: "c4", coachName: "Marcus Ude", clientName: "Sarah Lin", service: "1:1 Pad Session", date: "Sat, 8 Aug", time: "10:00am", mode: "In-person", status: "confirmed", price: 68, reviewed: false, participants: "You", notes: "" },
  { id: "b10", coachId: "c6", coachName: "Liam O'Connor", clientName: "Sarah Lin", service: "Small Group Ride", date: "Wed, 12 Aug", time: "5:00pm", mode: "In-person", status: "confirmed", price: 42, reviewed: false, participants: "You", notes: "" },
  { id: "b20", coachId: "c8", coachName: "Declan Murphy", clientName: "Sarah Lin", service: "1:1 Kicking Mechanics & Decision Making", date: "Sat, 22 Aug", time: "9:00am", mode: "In-person", status: "confirmed", price: 70, reviewed: false, participants: "You", notes: "Working on drop punt ball drop stability." },
  { id: "b21", coachId: "c13", coachName: "Aisha Al-Mansoor", clientName: "Sarah Lin", service: "1:1 Running Gait & Cadence Analysis", date: "Wed, 26 Aug", time: "7:00am", mode: "In-person", status: "confirmed", price: 70, reviewed: false, participants: "You", notes: "Preparing for Sydney Half Marathon." },
  { id: "b24", coachId: "c17", coachName: "Sienna Bennett", clientName: "Sarah Lin", service: "1:1 Studio Reformer Private", date: "Mon, 24 Aug", time: "6:30am", mode: "In-person", status: "confirmed", price: 80, reviewed: false, participants: "You", notes: "Focus on pelvic alignment and deep core." },
  { id: "b25", coachId: "c20", coachName: "Mia Vasilev", clientName: "Sarah Lin", service: "1:1 High Performance Stroke Lab", date: "Tue, 25 Aug", time: "7:00am", mode: "In-person", status: "confirmed", price: 78, reviewed: false, participants: "You", notes: "Topspin forehand unit turn." },
  { id: "b26", coachId: "c25", coachName: "Lucas Silva", clientName: "Sarah Lin", service: "1:1 Ball Mastery & 1v1 Dominance", date: "Wed, 26 Aug", time: "4:00pm", mode: "In-person", status: "confirmed", price: 70, reviewed: false, participants: "You", notes: "Sole-of-foot ball manipulation." },

  // Completed — past sessions
  { id: "b3", coachId: "c3", coachName: "Ruby Hendricks", clientName: "Sarah Lin", service: "1:1 Beach Session", date: "Sun, 13 Jul", time: "8:00am", mode: "In-person", status: "completed", price: 65, reviewed: false, participants: "You", notes: "" },
  { id: "b4", coachId: "c5", coachName: "Chloe Dawson", clientName: "Sarah Lin", service: "Virtual Swing Review", date: "Wed, 9 Jul", time: "7:00am", mode: "Virtual", status: "completed", price: 40, reviewed: true, participants: "You", notes: "" },
  { id: "b11", coachId: "c1", coachName: "Isla Ferguson", clientName: "Sarah Lin", service: "1:1 Court Session", date: "Thu, 16 Jul", time: "4:00pm", mode: "In-person", status: "completed", price: 72, reviewed: true, participants: "You", notes: "" },
  { id: "b12", coachId: "c2", coachName: "Noah Kelly", clientName: "Sarah Lin", service: "1:1 Programming Session", date: "Tue, 21 Jul", time: "6:00am", mode: "In-person", status: "completed", price: 65, reviewed: false, participants: "You", notes: "" },
  { id: "b13", coachId: "c4", coachName: "Marcus Ude", clientName: "Sarah Lin", service: "1:1 Pad Session", date: "Fri, 24 Jul", time: "5:00pm", mode: "In-person", status: "completed", price: 68, reviewed: false, participants: "You", notes: "" },
  { id: "b14", coachId: "c6", coachName: "Liam O'Connor", clientName: "Sarah Lin", service: "Small Group Ride", date: "Sat, 25 Jul", time: "11:00am", mode: "In-person", status: "completed", price: 42, reviewed: true, participants: "You", notes: "" },
  { id: "b22", coachId: "c7", coachName: "Priya Sharma", clientName: "Sarah Lin", service: "1:1 Tennis Technical Coaching", date: "Tue, 28 Jul", time: "7:00am", mode: "In-person", status: "completed", price: 75, reviewed: true, participants: "You", notes: "Topspin slice serve progression." },
  { id: "b23", coachId: "c9", coachName: "Elena Rostova", clientName: "Sarah Lin", service: "1:1 Floor & Flexibility Mastery", date: "Fri, 31 Jul", time: "9:00am", mode: "In-person", status: "completed", price: 78, reviewed: true, participants: "You", notes: "Hip opening and hamstring flexibility drills." },

  // Closed outcomes
  { id: "b15", coachId: "c2", coachName: "Noah Kelly", clientName: "Sarah Lin", service: "1:1 Programming Session", date: "Mon, 27 Jul", time: "6:00am", mode: "In-person", status: "declined", price: 65, reviewed: false, participants: "You", notes: "Coach away at regional competition." },
  { id: "b16", coachId: "c6", coachName: "Liam O'Connor", clientName: "Sarah Lin", service: "Small Group Ride", date: "Tue, 28 Jul", time: "4:00pm", mode: "In-person", status: "expired", price: 42, reviewed: false, participants: "You", notes: "Booking request window lapsed." },
  { id: "b17", coachId: "c3", coachName: "Ruby Hendricks", clientName: "Sarah Lin", service: "1:1 Beach Session", date: "Wed, 29 Jul", time: "6:45am", mode: "In-person", status: "cancelled", paymentStatus: "refunded", refundStatus: "refunded", price: 65, reviewed: false, participants: "You", notes: "Dangerous surf conditions / swell advisory." },
].map(withBookingLifecycle);

/** Recurring weekly availability blocks for the current coach (Noah Kelly). */
export const INITIAL_AVAILABILITY_BLOCKS = [
  { id: "ab1", days: ["Tue", "Thu"], start: "06:00", end: "07:30", packageIds: ["p1"] },
  { id: "ab2", days: ["Tue"], start: "17:30", end: "19:00", packageIds: ["p1", "p2"] },
  { id: "ab3", days: ["Sat"], start: "08:00", end: "10:00", packageIds: ["p2", "p3"] },
];

export const COACH_BOOKINGS = [
  // Pending — awaiting coach's accept/decline
  { id: "b2", coachId: "c2", coachName: "Noah Kelly", clientName: "Sarah Lin", clientHandle: "sarahlin", service: "1:1 Programming Session", date: "Fri, 25 Jul", time: "6:00am", mode: "In-person", status: "pending", paymentStatus: "not_requested", payoutStatus: "not_ready", price: 65, participants: "You", notes: "Coming back from a shoulder injury - cleared for light training, will bring physio notes." },
  { id: "cb2", clientName: "Marcus Webb", service: "Junior Group (max 4)", date: "Wed, 23 Jul", time: "5:00pm", mode: "In-person", status: "pending", price: 30, notes: "First session for his son, age 9." },
  { id: "cb3", clientName: "The Chen Family (u18)", service: "1:1 Court Session", date: "Sat, 26 Jul", time: "9:00am", mode: "In-person", status: "pending", price: 72, notes: "Booking for two children, guardian consent provided at checkout." },
  { id: "cb5", clientName: "Aiden Cross", service: "1:1 Court Session", date: "Fri, 21 Aug", time: "6:30am", mode: "In-person", status: "awaiting_payment", paymentDeadline: "Tomorrow, 6:00pm", paymentReminderSent: false, price: 72, notes: "" },
  { id: "cb6", clientName: "Grace Liu", service: "Junior Group (max 4)", date: "Thu, 30 Jul", time: "4:30pm", mode: "In-person", status: "pending", price: 30, notes: "Wants to try group coaching for the first time." },
  { id: "cb17", clientName: "Leo Tanaka", service: "1:1 Programming Session", date: "Mon, 24 Aug", time: "7:00am", mode: "In-person", status: "pending", price: 65, notes: "Focusing on kettlebell clean & jerk technique." },
  { id: "cb18", clientName: "Hannah Smith", service: "Injury Return Assessment", date: "Wed, 26 Aug", time: "6:00am", mode: "In-person", status: "pending", price: 85, notes: "Cleared 6 weeks post-ACL reconstruction." },

  // Upcoming — confirmed on calendar
  { id: "s1", coachId: "c2", coachName: "Noah Kelly", clientName: "Sarah Lin", clientHandle: "sarahlin", service: "1:1 Programming Session", date: "Thu, 20 Aug", time: "6:00am", mode: "In-person", status: "completion_pending", paymentStatus: "held", payoutStatus: "not_ready", completionConfirmedBy: "coach", completionConfirmations: ["coach"], price: 65, notes: "Focus on clean return-to-training technique." },
  { id: "cb1", clientName: "Sarah Lin", service: "1:1 Court Session", date: "Tue, 22 Jul", time: "4:00pm", mode: "In-person", status: "confirmed", price: 72, notes: "", sessionCode: "738291", codeGeneratedAt: "Just now" },
  { id: "cb7", clientName: "Ravi Patel", service: "1:1 Court Session", date: "Tue, 29 Jul", time: "7:00am", mode: "In-person", status: "in_progress", paymentStatus: "held", price: 72, notes: "", sessionCode: "739150", codeGeneratedAt: "Just now", sessionStartedAt: "Just now" },
  { id: "cb8", clientName: "Owen King", service: "1:1 Court Session", date: "Fri, 1 Aug", time: "5:30pm", mode: "In-person", status: "confirmed", price: 72, notes: "" },
  { id: "cb9", clientName: "The Nguyen Family (u18)", service: "Junior Group (max 4)", date: "Sun, 3 Aug", time: "10:00am", mode: "In-person", status: "confirmed", price: 30, notes: "" },
  { id: "cb19", clientName: "Jordan Lee", service: "Small Group WOD (max 3)", date: "Sat, 22 Aug", time: "8:00am", mode: "In-person", status: "confirmed", price: 38, notes: "Metcon conditioning session." },

  // Completed — past sessions
  { id: "cb4", clientName: "Ravi Patel", service: "8-Week Term Block", date: "Mon, 14 Jul", time: "7:00am", mode: "In-person", status: "completed", price: 500, notes: "" },
  { id: "cb10", clientName: "Sarah Lin", service: "1:1 Court Session", date: "Wed, 9 Jul", time: "4:00pm", mode: "In-person", status: "completed", price: 72, notes: "" },
  { id: "cb11", clientName: "Marcus Webb", service: "Junior Group (max 4)", date: "Thu, 17 Jul", time: "5:00pm", mode: "In-person", status: "completed", price: 30, notes: "" },
  { id: "cb12", clientName: "The Chen Family (u18)", service: "1:1 Court Session", date: "Sun, 20 Jul", time: "9:00am", mode: "In-person", status: "completed", price: 72, notes: "" },
  { id: "cb13", clientName: "Owen King", service: "1:1 Court Session", date: "Mon, 21 Jul", time: "6:00am", mode: "In-person", status: "completed", price: 72, notes: "" },
  { id: "cb20", clientName: "Hannah Smith", service: "1:1 Programming Session", date: "Wed, 23 Jul", time: "6:00am", mode: "In-person", status: "completed", price: 65, notes: "" },

  // Closed outcomes
  { id: "cb14", clientName: "Priya Desai", service: "Junior Group (max 4)", date: "Tue, 22 Jul", time: "5:00pm", mode: "In-person", status: "declined", price: 30, notes: "Schedule conflict with existing booking." },
  { id: "cb15", clientName: "Alex Morgan", service: "1:1 Court Session", date: "Fri, 24 Jul", time: "7:00am", mode: "In-person", status: "expired", price: 72, notes: "Payment window expired." },
  { id: "cb16", clientName: "Jordan Lee", service: "1:1 Court Session", date: "Sat, 25 Jul", time: "8:00am", mode: "In-person", status: "cancelled", paymentStatus: "refunded", refundStatus: "refunded", price: 72, notes: "Cancelled by client before cutoff." },
].map(withBookingLifecycle);

/** Role-facing exception records used by the client and coach prototypes. */
export const SESSION_DISPUTES = [
  {
    id: "case-101",
    bookingId: "s1",
    filedByRole: "client",
    category: "session_not_delivered",
    categoryLabel: "Session didn’t happen",
    description: "I arrived before the scheduled start time and waited for 25 minutes, but the coach did not arrive.",
    amountRequested: 65,
    status: DISPUTE_STATUS.REVIEWING,
    evidence: ["Gym check-in · 5:52am", "Message thread · 6 messages"],
    includeChat: true,
    submittedAt: "Today, 6:28am",
    updatedAt: "Today, 9:10am",
    supportNote: "A resolution specialist is checking the session messages and arrival records.",
  },
  {
    id: "case-102",
    bookingId: "b3",
    filedByRole: "client",
    category: "coach_no_show",
    categoryLabel: "Coach no-show",
    description: "The coach could not attend and confirmed this in the session chat.",
    amountRequested: 65,
    status: DISPUTE_STATUS.RESOLVED,
    outcome: DISPUTE_OUTCOME.CLIENT_REFUNDED,
    evidence: ["Session chat included", "Arrival check-in verified"],
    includeChat: true,
    submittedAt: "11 Aug, 8:24am",
    updatedAt: "12 Aug, 2:40pm",
    decisionNote: "The attendance record supports the client’s no-show claim. A full refund has been approved.",
  },
  {
    id: "case-103",
    bookingId: "cb10",
    filedByRole: "coach",
    category: "client_no_show",
    categoryLabel: "Client no-show",
    description: "I was at the venue for the full arrival window and the client did not attend or respond.",
    amountRequested: 72,
    status: DISPUTE_STATUS.RESOLVED,
    outcome: DISPUTE_OUTCOME.COACH_COMPENSATED,
    evidence: ["Venue check-in · 3:48pm", "Unanswered session messages"],
    includeChat: true,
    submittedAt: "10 Aug, 4:32pm",
    updatedAt: "11 Aug, 12:05pm",
    decisionNote: "The booking and check-in records meet the coach’s published no-show policy. Compensation has been released.",
  },
  {
    id: "case-104",
    bookingId: "b17",
    filedByRole: "client",
    category: "weather_hazard",
    categoryLabel: "Severe Weather Cancellation",
    description: "Surf conditions exceeded safe limits with coastal gale warning. Coach advised cancelling.",
    amountRequested: 65,
    status: DISPUTE_STATUS.RESOLVED,
    outcome: DISPUTE_OUTCOME.CLIENT_REFUNDED,
    evidence: ["BOM Marine Hazard Warning", "Chat confirmation from coach"],
    includeChat: true,
    submittedAt: "29 Jul, 7:15am",
    updatedAt: "29 Jul, 10:00am",
    decisionNote: "Confirmed hazardous weather condition. Full refund processed.",
  },
];

export const ADDITIONAL_CHARGES = [
  {
    id: "charge-101",
    bookingId: "s1",
    reason: "Extra session time",
    note: "We agreed in chat to extend the programming session by 20 minutes to finish the return-to-training plan.",
    amount: 18,
    evidence: "Session extension note · 1 attachment",
    phase: ADDITIONAL_CHARGE_PHASE.COMPLETION,
    kind: ADDITIONAL_CHARGE_KIND.REQUIRED,
    status: ADDITIONAL_CHARGE_STATUS.PENDING,
    createdAt: "Today, 8:12am",
    dueAt: "Pay before confirming completion",
  },
  {
    id: "charge-201",
    bookingId: "b5",
    reason: "Indoor court hire",
    note: "This venue fee is required for the group clinic and is charged at cost.",
    amount: 8,
    evidence: "Included with booking acceptance",
    phase: ADDITIONAL_CHARGE_PHASE.ACCEPTANCE,
    kind: ADDITIONAL_CHARGE_KIND.REQUIRED,
    status: ADDITIONAL_CHARGE_STATUS.PENDING,
    createdAt: "Today, 9:04am",
    dueAt: "Pay with your booking",
  },
  {
    id: "charge-202",
    bookingId: "b5",
    reason: "Video technique review",
    note: "Optional: receive a short annotated video recap after the clinic.",
    amount: 15,
    evidence: "Optional package add-on",
    phase: ADDITIONAL_CHARGE_PHASE.ACCEPTANCE,
    kind: ADDITIONAL_CHARGE_KIND.OPTIONAL,
    status: ADDITIONAL_CHARGE_STATUS.PENDING,
    createdAt: "Today, 9:04am",
    dueAt: "Choose at checkout",
  },
  {
    id: "charge-301",
    bookingId: "b18",
    reason: "Professional Racquet Restringing",
    note: "Synthetic gut string replacement and fresh ergonomic overgrip before matchplay.",
    amount: 25,
    evidence: "Stringing log receipt",
    phase: ADDITIONAL_CHARGE_PHASE.ACCEPTANCE,
    kind: ADDITIONAL_CHARGE_KIND.OPTIONAL,
    status: ADDITIONAL_CHARGE_STATUS.PENDING,
    createdAt: "Yesterday, 4:30pm",
    dueAt: "Optional add-on at checkout",
  },
];

export const REVIEWS = [
  { id: "r1", name: "Sarah L.", handle: "sarahlin", rating: 5, text: "Isla spotted a positioning issue in my first session that nobody else had picked up on. Genuinely improved my game.", verified: true, date: "3 weeks ago" },
  { id: "r2", name: "Priya D.", handle: "priyad", rating: 5, text: "Great with my two kids - patient but pushes them just enough.", verified: true, date: "1 month ago" },
  { id: "r3", name: "Owen K.", handle: "owenk", rating: 4, text: "Solid technical feedback, sessions run a little over time but worth it.", verified: true, date: "2 months ago" },
  { id: "r4", name: "Marcus W.", handle: "marcuswebb", rating: 5, text: "Clear session plan every week and I can feel the progress. Booking a full term.", verified: true, date: "3 months ago" },
  { id: "r5", name: "Grace L.", handle: "graceliu", rating: 4, text: "Really good coach - just wish there were a few more evening slots available.", verified: true, date: "4 months ago" },
  { id: "r6", name: "The Chen Family", handle: "thechens", rating: 5, text: "Our daughter's confidence has grown so much since she started. Couldn't ask for more.", verified: true, date: "5 months ago" },
  { id: "r7", name: "Hannah S.", handle: "hannahs", rating: 5, text: "Priya’s dual coaching in Tennis and Pickleball is brilliant. Her court positioning drills transformed our doubles synergy.", verified: true, date: "2 weeks ago" },
  { id: "r8", name: "Leo T.", handle: "leot", rating: 5, text: "Declan’s kicking biomechanics session with video replay fixed a 3-year slice in my drop punt. Highly recommend for any serious AFL junior.", verified: true, date: "3 weeks ago" },
  { id: "r9", name: "Jordan L.", handle: "jordanl", rating: 5, text: "Tyler Koa’s underwater stroke analysis identified my catch slip immediately. Shaved 4 seconds off my 100m freestyle in just 3 sessions.", verified: true, date: "1 month ago" },
];

export const THREADS = [
  { id: "t1", withName: "Isla Ferguson", withRole: "coach", context: "Booking · Tue 4:00pm", lastMsg: "Sounds great, see you at the courts!", time: "9:41am", unread: 0 },
  { id: "t2", withName: "Noah Kelly", withRole: "coach", context: "Enquiry", lastMsg: "Do you have any morning slots next week?", time: "Yesterday", unread: 2 },
  { id: "t3", withName: "Ruby Hendricks", withRole: "coach", context: "Booking · Sun 8:00am", lastMsg: "I've sent through the drill sheet, take a look 🙂", time: "Mon", unread: 0 },
  { id: "t4", withName: "Priya Sharma", withRole: "coach", context: "Enquiry · Pickleball & Tennis", lastMsg: "Yes, I provide composite paddles for the clinic!", time: "2 days ago", unread: 1 },
  { id: "t5", withName: "Tyler Koa Henderson", withRole: "coach", context: "Booking · Tue 6:30am", lastMsg: "Don't forget to bring your optical goggles for video tracking.", time: "3 days ago", unread: 0 },
];

export const COACH_THREADS = [
  { id: "ct1", withName: "Sarah Lin", withRole: "client", context: "Booking · Tue 4:00pm", lastMsg: "Sounds great, see you at the courts!", time: "9:41am", unread: 0 },
  { id: "ct2", withName: "Marcus Webb", withRole: "client", context: "Enquiry", lastMsg: "Do you run sessions on weekends?", time: "Yesterday", unread: 1 },
  { id: "ct3", withName: "The Chen Family", withRole: "client", context: "Booking · Sat 9:00am", lastMsg: "Perfect, thank you for confirming!", time: "Mon", unread: 0 },
  { id: "ct4", withName: "Leo Tanaka", withRole: "client", context: "Enquiry · Strength & S&C", lastMsg: "I have clearance from my physiotherapist for barbell work.", time: "Yesterday", unread: 1 },
];

export const CHAT_MESSAGES = [
  { id: 1, from: "them", text: "Hi! Looking forward to Tuesday's session.", time: "9:12am" },
  { id: 2, from: "me", text: "Me too - should I bring my own gear?", time: "9:15am" },
  { id: 3, from: "them", text: "Either is fine, I've got spares on hand.", time: "9:20am" },
  { id: 4, from: "them", text: "Sounds great, see you at the courts!", time: "9:41am" },
];

export const BOOKING_ENQUIRY_MESSAGES = {
  cb2: [
    { id: 1, from: "them", text: "Hi! Is 5pm still free for a junior group session on Wednesday?", time: "10:02am" },
    { id: 2, from: "me", text: "Yep, that slot's open - how many kids will be joining?", time: "10:10am" },
    { id: 3, from: "them", text: "Just my son this time, he's 9 and new to netball.", time: "10:12am" },
  ],
  cb3: [
    { id: 1, from: "them", text: "Hi Isla, we'd like to book for both our kids (u18) Saturday morning.", time: "Yesterday" },
  ],
  cb17: [
    { id: 1, from: "them", text: "Hi Noah, I’d like to book the Monday 7am slot for Olympic lifting programming.", time: "Yesterday" },
    { id: 2, from: "me", text: "Great! Please bring your lifting shoes and any mobility bands you like using.", time: "Yesterday" },
  ],
};

export const CLIENT_PROFILES = {
  "Sarah Lin": { memberSince: "Jan 2025", totalSessions: 16, homeSuburb: "Bondi, Sydney", notes: "Regular client - usually books weekly sessions across netball and strength.", verifiedPayment: true },
  "Marcus Webb": { memberSince: "Jun 2026", totalSessions: 1, homeSuburb: "Fitzroy, Melbourne", notes: "First-time booking with you. New to CoachNivo.", verifiedPayment: true },
  "The Chen Family (u18)": { memberSince: "Mar 2026", totalSessions: 5, homeSuburb: "Bondi, Sydney", notes: "Books for two children (ages 10 & 13). Guardian consent on file.", verifiedPayment: true },
  "Ravi Patel": { memberSince: "Sep 2024", totalSessions: 22, homeSuburb: "Parramatta, Sydney", notes: "Long-term client, term-block subscriber.", verifiedPayment: true },
  "Aiden Cross": { memberSince: "Jul 2026", totalSessions: 0, homeSuburb: "Bondi, Sydney", notes: "First-time booking with you. New to CoachNivo.", verifiedPayment: true },
  "Grace Liu": { memberSince: "May 2026", totalSessions: 2, homeSuburb: "Randwick, Sydney", notes: "Prefers group sessions over 1:1.", verifiedPayment: true },
  "Owen King": { memberSince: "Feb 2026", totalSessions: 8, homeSuburb: "Bondi, Sydney", notes: "Regular client - books most weeks.", verifiedPayment: true },
  "The Nguyen Family (u18)": { memberSince: "Jun 2026", totalSessions: 3, homeSuburb: "Bondi, Sydney", notes: "Books for one child (age 11). Guardian consent on file.", verifiedPayment: true },
  "Hannah Smith": { memberSince: "Apr 2026", totalSessions: 4, homeSuburb: "Fitzroy, Melbourne", notes: "Post-ACL rehab athlete, very diligent with warmup protocol.", verifiedPayment: true },
  "Leo Tanaka": { memberSince: "May 2026", totalSessions: 6, homeSuburb: "Richmond, Melbourne", notes: "AFL junior state squad hopeful.", verifiedPayment: true },
};

export const FAQS = {
  client: [
    { q: "How do I book a session?", a: "Search for a coach, open their profile, choose a package, then pick a time. Your booking request will be sent to the coach for review." },
    { q: "When am I charged?", a: "Payment is requested after the coach accepts your booking request. Once you pay, funds are held securely and released to the coach after the session is confirmed complete." },
    { q: "What if I need to cancel?", a: "Open the booking from your dashboard and select Cancel or Reschedule. Refunds follow the individual coach's cancellation policy, shown at checkout." },
    { q: "How do refunds work?", a: "Approved refunds are returned to your original payment method within 5–10 business days." },
    { q: "Can I book a coach who coaches two sports?", a: "Yes! Multi-sport coaches offer distinct packages for each sport they coach. You can filter by either sport or select specific packages on their profile." },
    { q: "Is my payment information secure?", a: "Yes - CoachNivo never stores full card details. Payments are processed through an encrypted, PCI-compliant provider." },
  ],
  coach: [
    { q: "How do I get verified?", a: "Submit an identity document and, if you coach under-18s, a Working with Children Check. Most reviews complete within 2 business days." },
    { q: "Can I coach multiple sports on one profile?", a: "Yes! In Onboarding or Profile Edit, select your Primary Sport and any Secondary Sports. You can create customized packages for each sport with separate pricing and venues." },
    { q: "When do I get paid?", a: "You end the session from the live session screen. If there are no final charges, funds release right away; if you add a final charge, the payout releases automatically once the client pays it. It's always minus CoachNivo's commission, and typically lands in 2–3 business days." },
    { q: "How does the session check-in code work?", a: "When the client arrives, they generate a 6-digit code in their app. Enter it on your start-session screen to begin the session - it proves you're both at the right session and keeps the payout protected." },
    { q: "Can I set my own cancellation policy?", a: "Yes - choose Flexible, Moderate or Strict from your Services tab. This is shown to clients before they book." },
    { q: "How do booking requests work?", a: "When a client sends a booking request, you review the details and choose to accept or decline. Once accepted, the client is notified to confirm and pay." },
  ],
  verification: [
    { q: "How long does verification take?", a: "Most reviews complete within 2 business days. We'll notify you the moment a decision is made - you'll also see it reflected on the verification screen." },
    { q: "What documents do I need?", a: "A government-issued photo ID plus a selfie to match it. If you coach athletes under 18, you'll also need a Working with Children Check, and an accreditation upload is required." },
    { q: "Why was my verification rejected?", a: "Usually a photo was unclear, expired, or didn't match your ID. You'll be told exactly which document failed - resubmit it from the verification screen and the review restarts." },
    { q: "Can I accept bookings while verification is pending?", a: "Not yet - your profile stays hidden until you're approved. You can keep setting up your services, availability and payouts in the meantime." },
  ],
  business: [
    { q: "When will my business appear in search?", a: "Your organisation becomes discoverable after the launch checklist is complete and CoachNivo approves the application. You can keep building your roster, profile and programs while review is underway." },
    { q: "Does business approval verify every coach?", a: "No. Each coach completes their own identity and credential checks. Programs for children can only use coaches with the required current safeguarding documents." },
    { q: "How does the Starter trial work?", a: "New Starter subscriptions receive their first month free. Billing begins at $49 AUD per month after the trial unless you change or cancel the plan." },
    { q: "Who assigns a coach to a program booking?", a: "Each program can let the client choose a coach or allow your organisation to assign an eligible verified coach based on availability." },
  ],
};

export const CLIENT_NOTIFICATIONS = [
  { id: "n4", type: "payment", title: "Additional payment requested", body: "Noah Kelly requested $18.00 for extra session time.", time: "Just now", unread: true, bookingId: "s1", chargeId: "charge-101" },
  { id: "n6", type: "session", title: "Session code generated", body: "Your session code for Ruby Hendricks is ready to share with your coach.", time: "Just now", unread: true, bookingId: "b8" },
  { id: "n1", type: "booking", title: "Booking confirmed", body: "Your session with Isla Ferguson is confirmed for Tue, 4:00pm.", time: "9:41am", unread: true, coachId: "c1", coachName: "Isla Ferguson" },
  { id: "n2", type: "message", title: "New message from Noah Kelly", body: "Do you have any morning slots next week?", time: "Yesterday", unread: true, coachName: "Noah Kelly" },
  { id: "n3", type: "review", title: "How was your session?", body: "Leave a quick review for Ruby Hendricks to help other clients.", time: "2 days ago", unread: true, coachName: "Ruby Hendricks" },
  { id: "n7", type: "booking", title: "New Multi-Sport Coach nearby", body: "Priya Sharma (Tennis & Pickleball) just opened slots in Fitzroy!", time: "2 days ago", unread: false, coachId: "c7", coachName: "Priya Sharma" },
  { id: "n5", type: "promo", title: "10% off your next booking", body: "Use code WELCOME10 at checkout before it expires.", time: "5 days ago", unread: false },
];

export const COACH_VERIFICATION_DOCS = [
  { key: "wwcc", label: "Working with Children Check", expiresOn: "24 Aug 2026", daysLeft: 18 },
  { key: "quals", label: "Accreditation renewal", expiresOn: "30 Sep 2026", daysLeft: 55 },
  { key: "first_aid", label: "HLTAID011 Provide First Aid", expiresOn: "15 Dec 2026", daysLeft: 132 },
];

export const COACH_NOTIFICATIONS = [
  { id: "cn1", type: "message", title: "New message from Marcus Webb", body: "Do you run sessions on weekends?", time: "Yesterday", unread: true, threadId: "ct2", clientName: "Marcus Webb" },
  { id: "cn6", type: "session", title: "Session in progress", body: "Your session with Ravi Patel is live — the client's code was verified.", time: "Just now", unread: true, bookingId: "cb7" },
  { id: "cn2", type: "verification", title: "Working with Children Check expiring soon", body: "Your WWCC expires in 18 days - renew it to keep accepting under-18 bookings.", time: "Today", unread: true },
  { id: "cn3", type: "booking", title: "New booking request", body: "Marcus Webb requested a 1:1 Programming Session for Sat, 9:00am.", time: "2 hours ago", unread: true },
  { id: "cn4", type: "review", title: "New 5-star review", body: "Sarah L. left you a review after your last session.", time: "3 days ago", unread: false },
  { id: "cn5", type: "booking", title: "Booking Accepted by Client", body: "Aiden Cross paid for the 1:1 Court Session on Fri, 21 Aug.", time: "4 days ago", unread: false },
];

export const ADMIN_VERIFICATION_QUEUE = [
  {
    id: "v1", name: "Ravi Patel", sport: "Boxing", type: "Identity + WWCC",
    suburb: "Parramatta, Sydney", experience: "6 yrs coaching",
    documents: [
      { key: "id", label: "Identity document", detail: "Driver's licence - front & back, uploaded" },
      { key: "wwcc", label: "Working with Children Check", detail: "NSW WWCC, valid to 2028" },
    ],
    submittedByUser: false,
  },
  {
    id: "v2", name: "Nina Torres", sport: "Cycling", type: "Accreditations",
    suburb: "Geelong, Melbourne", experience: "3 yrs coaching",
    documents: [
      { key: "quals", label: "Accreditations", detail: "Cycling Australia Level 2 certificate" },
    ],
    submittedByUser: false,
  },
  {
    id: "v3", name: "Priya Sharma", sport: "Tennis & Pickleball", type: "Multi-Sport Dual Accreditation",
    suburb: "Fitzroy, Melbourne", experience: "7 yrs coaching",
    documents: [
      { key: "id", label: "Identity document", detail: "Australian Passport verified" },
      { key: "wwcc", label: "Working with Children Check", detail: "VIC Working with Children Check (Employee)" },
      { key: "quals", label: "Tennis Australia Club Pro", detail: "Club Professional qualification verified" },
      { key: "quals2", label: "Pickleball Australia Coach", detail: "Level 1 Coach accreditation" },
    ],
    submittedByUser: false,
  },
  {
    id: "v4", name: "Declan Murphy", sport: "AFL & S&C", type: "WWCC + ASCA Level 2",
    suburb: "Richmond, Melbourne", experience: "8 yrs coaching",
    documents: [
      { key: "id", label: "Identity document", detail: "Driver's licence uploaded" },
      { key: "wwcc", label: "WWCC Check", detail: "Valid to 2029" },
      { key: "quals", label: "ASCA Strength Coach", detail: "ASCA Level 2 accreditation certificate" },
    ],
    submittedByUser: false,
  },
];

export const ADMIN_DISPUTES = [
  {
    id: "d1", booking: "#4821", issue: "No-show claim", parties: "Sarah Lin vs. Noah Kelly",
    service: "1:1 Programming Session", date: "Fri, 18 Jul", amount: 65,
    filedBy: "Sarah Lin", summary: "Client says the coach didn't show up for the scheduled session and is requesting a full refund.",
    evidence: [
      { type: "Screenshot", label: "Location check-in showing client at the gym at session time" },
      { type: "Message log", label: "Chat thread with no response from coach after 4:10pm" },
    ],
    messages: [
      { from: "Sarah Lin", text: "I was at the gym at 6am but Noah never turned up.", time: "Fri, 6:20am" },
      { from: "Noah Kelly", text: "I'm so sorry - I had a family emergency and couldn't get to my phone in time.", time: "Fri, 9:02am" },
      { from: "CoachNivo Support", text: "Thanks both - reviewing the booking and check-in logs now.", time: "Fri, 11:40am" },
    ],
  },
  {
    id: "d2", booking: "#4790", issue: "Refund request", parties: "Marcus Webb vs. Isla Ferguson",
    service: "Junior Group (max 4)", date: "Wed, 16 Jul", amount: 30,
    filedBy: "Marcus Webb", summary: "Client says the group session was cut short by 20 minutes and is asking for a partial refund.",
    evidence: [
      { type: "Message log", label: "Coach confirms session ended early due to court closure" },
    ],
    messages: [
      { from: "Marcus Webb", text: "The session ended 20 minutes early because the court closed for maintenance.", time: "Wed, 5:45pm" },
      { from: "Isla Ferguson", text: "That's right, the venue closed the courts early without much notice.", time: "Wed, 6:10pm" },
    ],
  },
];

export const ADMIN_FLAGGED = [
  { id: "f1", type: "Review", reason: "Reported as spam", content: "\"Best coach!! visit my site...\"" },
  { id: "f2", type: "Reel", reason: "Reported: inappropriate", content: "Uploaded 2 days ago" },
];

export const ADMIN_RECENT_BOOKINGS = [
  { id: "ab1", client: "Sarah Lin", coach: "Isla Ferguson", amount: 72, status: "confirmed" },
  { id: "ab2", client: "Marcus Webb", coach: "Noah Kelly", amount: 65, status: "pending" },
  { id: "ab3", client: "The Chen Family", coach: "Isla Ferguson", amount: 72, status: "completed" },
  { id: "ab4", client: "Owen Kelly", coach: "Ruby Hendricks", amount: 65, status: "completed" },
  { id: "ab5", client: "Hannah Smith", coach: "Priya Sharma", amount: 75, status: "confirmed" },
  { id: "ab6", client: "Leo Tanaka", coach: "Declan Murphy", amount: 70, status: "completed" },
];
