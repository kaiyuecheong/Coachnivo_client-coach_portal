export const EMPTY_VERIFICATION_CODE = ["", "", "", "", "", ""];
export const VERIFICATION_CODE_LENGTH = EMPTY_VERIFICATION_CODE.length;

export const normaliseEmail = (value) => String(value || "").trim().toLowerCase();
export const phoneDigits = (value) => String(value || "").replace(/\D/g, "");
export const comparablePhone = (value) => phoneDigits(value).replace(/^61(?=\d{9}$)/, "0");

export function isValidPhone(value) {
  const digits = phoneDigits(value);
  return digits.length >= 8 && digits.length <= 15;
}

// Prototype rule: any complete numeric code succeeds except an all-zero code.
// Production verification must be performed by a trusted backend.
export function isAcceptedPrototypeCode(value) {
  const code = String(value || "");
  return /^\d{6}$/.test(code) && !/^0+$/.test(code);
}
