// Light haptic feedback on supported devices (mostly Android/Chrome).
export function buzz(ms = 12) {
  try {
    if (navigator.vibrate) navigator.vibrate(ms)
  } catch {
    /* ignore */
  }
}
