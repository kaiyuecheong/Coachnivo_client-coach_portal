/* Lightweight tactile feedback. Silently no-ops on devices without a
   vibration motor (iOS Safari, desktop browsers). */
export function haptic(pattern = 10) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* unsupported */
  }
}
