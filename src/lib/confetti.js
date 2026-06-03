// Dependency-free confetti burst. Spawns short-lived particles, then cleans up.
const COLORS = ['#c9f64f', '#5cc8ff', '#46e08a', '#ffffff', '#a7d63f']

export function celebrate() {
  if (typeof document === 'undefined') return
  const root = document.createElement('div')
  root.style.cssText =
    'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden'
  document.body.appendChild(root)

  const n = 90
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i')
    const size = 6 + Math.random() * 7
    const left = Math.random() * 100
    const dx = (Math.random() - 0.5) * 240
    const rot = Math.random() * 720 - 360
    const dur = 900 + Math.random() * 900
    const delay = Math.random() * 180
    p.style.cssText = `position:absolute;top:-16px;left:${left}vw;width:${size}px;height:${
      size * (0.5 + Math.random())
    }px;background:${COLORS[(Math.random() * COLORS.length) | 0]};
      border-radius:${Math.random() > 0.5 ? '2px' : '50%'};opacity:1;
      transform:translateY(0) rotate(0deg);
      animation:confFall ${dur}ms cubic-bezier(.3,.6,.4,1) ${delay}ms forwards;
      --dx:${dx}px;--rot:${rot}deg`
    root.appendChild(p)
  }

  if (!document.getElementById('conf-kf')) {
    const style = document.createElement('style')
    style.id = 'conf-kf'
    style.textContent =
      '@keyframes confFall{to{transform:translate(var(--dx),105vh) rotate(var(--rot));opacity:.9}}'
    document.head.appendChild(style)
  }
  setTimeout(() => root.remove(), 2200)
}
