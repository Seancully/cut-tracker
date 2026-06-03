// Tiny pub/sub toast bus — call toast('Saved') anywhere.
const listeners = new Set()
let seq = 0

export function toast(msg, type = 'ok') {
  const t = { id: ++seq, msg, type }
  listeners.forEach((l) => l(t))
}
export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
