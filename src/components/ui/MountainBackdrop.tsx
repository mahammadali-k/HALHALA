/**
 * Decorative dark-purple mountain range (inline SVG, no image request). Used behind the hero and the footer bar.
 * Place inside a `relative` parent; it fills it and sits behind the content.
 */
export function MountainBackdrop({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 1440 600" preserveAspectRatio="xMidYMax slice" className={`pointer-events-none absolute inset-0 -z-10 h-full w-full ${className}`}>
      <defs>
        <linearGradient id="mb-far" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3b1f7a" stopOpacity=".55" /><stop offset="1" stopColor="#09070d" stopOpacity="0" /></linearGradient>
        <linearGradient id="mb-near" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#24124d" stopOpacity=".9" /><stop offset="1" stopColor="#09070d" /></linearGradient>
        <radialGradient id="mb-fog" cx=".7" cy=".55" r=".6"><stop offset="0" stopColor="#7c4fe0" stopOpacity=".28" /><stop offset="1" stopColor="#7c4fe0" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="1440" height="600" fill="url(#mb-fog)" />
      <path d="M0 420 120 330 210 380 330 250 430 330 540 210 650 320 760 180 880 300 990 230 1100 330 1220 260 1330 340 1440 290V600H0Z" fill="url(#mb-far)" stroke="#8a5fe0" strokeOpacity=".28" />
      <path d="M0 500 90 440 200 480 340 380 470 470 600 400 720 490 860 420 1000 500 1140 430 1280 490 1440 450V600H0Z" fill="url(#mb-near)" stroke="#8a5fe0" strokeOpacity=".4" />
    </svg>
  )
}
