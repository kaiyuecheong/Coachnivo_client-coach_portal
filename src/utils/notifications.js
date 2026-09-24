/* =========================================================================
   NOTIFICATION HELPERS
   -------------------------------------------------------------------------
   Shared icon mapping and helpers used by Discovery, CoachDashboard,
   Notifications, and other screens that render notification items.
   ========================================================================= */
import {
  Calendar, MessageCircle, Star, Sparkles, Percent, CreditCard, ShieldAlert,
} from "lucide-react";

/** Map notification `type` to a Lucide icon component. */
export const NOTIF_ICON = {
  booking: Calendar,
  message: MessageCircle,
  review: Star,
  availability: Sparkles,
  promo: Percent,
  payment: CreditCard,
  verification: ShieldAlert,
};
