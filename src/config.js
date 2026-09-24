/* =========================================================================
   APP CONFIG
   -------------------------------------------------------------------------
   Application-wide constants. Separated from mock data so business rules
   are easy to find and adjust independently.
   ========================================================================= */

export const CONFIG = {
  /** Platform service fee charged to the client (6%). */
  serviceFeeRate: 0.06,
  /** Commission deducted from coach earnings (15%). */
  commissionRate: 0.15,
  /** Single platform-wide cancellation policy shown on every coach profile and booking. */
  cancellationPolicy:
    "Free cancellation up to 24 hours before your session. Cancellations inside 24 hours are refunded at 50%.",
};
