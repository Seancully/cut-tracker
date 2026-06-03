// Brand mark: a descending trend line plotted on a grid — "planning the cut".
// Pure vector so it also rasterises cleanly into the PWA icons.
export default function Logo({ size = 42 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-label="Sean's Cut logo">
      <defs>
        <linearGradient id="lg-tile" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d8ff62" />
          <stop offset="1" stopColor="#a7d63f" />
        </linearGradient>
        <clipPath id="lg-clip">
          <rect width="512" height="512" rx="120" />
        </clipPath>
        <linearGradient id="lg-line" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#15210a" />
          <stop offset="1" stopColor="#1d3110" />
        </linearGradient>
      </defs>
      <g clipPath="url(#lg-clip)">
        <rect width="512" height="512" fill="url(#lg-tile)" />
        <g stroke="#15210a" strokeOpacity="0.12" strokeWidth="4">
          {[64, 128, 192, 256, 320, 384, 448].map((p) => (
            <line key={'v' + p} x1={p} y1="0" x2={p} y2="512" />
          ))}
          {[64, 128, 192, 256, 320, 384, 448].map((p) => (
            <line key={'h' + p} x1="0" y1={p} x2="512" y2={p} />
          ))}
        </g>
        <polyline
          points="100,156 182,244 250,200 326,300 404,360"
          fill="none"
          stroke="url(#lg-line)"
          strokeWidth="26"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="100" cy="156" r="15" fill="#15210a" />
        <circle cx="404" cy="360" r="26" fill="#15210a" />
        <circle cx="404" cy="360" r="11" fill="#d8ff62" />
      </g>
    </svg>
  )
}
