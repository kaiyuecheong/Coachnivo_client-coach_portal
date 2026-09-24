import React from "react";
import { CalendarDays, CreditCard, LockKeyhole, User } from "lucide-react";
import { Field } from "./Primitives";

export const EMPTY_PAYMENT_CARD = Object.freeze({ name: "", number: "", expiry: "", cvc: "", postcode: "" });

export function paymentCardBrand(number) {
  const digits = String(number || "").replace(/\D/g, "");
  if (digits.startsWith("4")) return "Visa";
  if (/^5[1-5]/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "Amex";
  return "Card";
}

export function isPaymentCardValid(card) {
  const digits = String(card?.number || "").replace(/\D/g, "");
  return !!card?.name?.trim()
    && digits.length >= 15
    && /^\d{2}\/\d{2}$/.test(String(card?.expiry || "").trim())
    && /^\d{3,4}$/.test(String(card?.cvc || "").trim())
    && String(card?.postcode || "").trim().length >= 4;
}

export function PaymentCardForm({ value, onChange }) {
  const set = (key, transform = (next) => next) => (event) => onChange({ ...value, [key]: transform(event.target.value) });
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Field label="Name on card" placeholder="e.g., Priya Nair" icon={User} autoComplete="cc-name" value={value.name} onChange={set("name")} required />
      <Field label="Card number" placeholder="4242 4242 4242 4242" icon={CreditCard} autoComplete="cc-number" inputMode="numeric" value={value.number} onChange={set("number", (next) => next.replace(/[^\d\s]/g, "").slice(0, 23))} required />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Field label="Expiry" placeholder="MM/YY" icon={CalendarDays} autoComplete="cc-exp" inputMode="numeric" value={value.expiry} onChange={set("expiry", (next) => next.replace(/[^\d/]/g, "").slice(0, 5))} required />
        <Field label="CVC" placeholder="123" icon={LockKeyhole} autoComplete="cc-csc" inputMode="numeric" value={value.cvc} onChange={set("cvc", (next) => next.replace(/\D/g, "").slice(0, 4))} required />
      </div>
      <Field label="Billing postcode" placeholder="e.g., 4218" autoComplete="postal-code" inputMode="numeric" value={value.postcode} onChange={set("postcode", (next) => next.replace(/[^a-zA-Z0-9 -]/g, "").slice(0, 10))} required />
    </div>
  );
}
