/* Full-screen loading overlay — the EVA logo as a chrome outline with a glowing
   light segment that travels around the path on a seamless infinite loop.

   Ghostlink-style chrome look, but tuned for performance: NO per-frame SVG
   filters (feGaussianBlur on a moving dashed stroke is what caused the lag).
   The glow is a cheap GPU-composited CSS drop-shadow on the whole SVG instead.
   The loop is seamless by construction — the dash period equals pathLength
   (1850) and the animation shifts the dash by exactly one period, so there is
   no visible start/end, it just keeps flowing.

   Covers everything while the scene warms up, then fades out via `fadingOut`. */

export function LoadingScreen({ fadingOut }: { fadingOut: boolean }) {
  // EVA letterforms (E, V, A + the A counter) as one compound path, viewBox
  // 0 0 257 200. Stroking it traces the outline of every letter.
  const EVA_PATH =
    'M71.25 37.5H37.5V81.25H71.25V118.75H37.5V162.5H71.25V200H1.76951e-07V-2.98023e-06H71.25V37.5ZM136.48 -2.98023e-06H173.98L149.48 200H98.2305L73.7305 -2.98023e-06H111.23L123.98 160.25L136.48 -2.98023e-06ZM219.244 200L216.494 166H196.744L193.994 200H156.494L180.994 -2.98023e-06H232.244L256.744 200H219.244ZM199.744 128.5H213.494L206.744 39.75L199.744 128.5Z'

  return (
    <div
      className="eva-loader"
      data-fading={fadingOut ? 'true' : 'false'}
      aria-hidden
    >
      <svg
        className="eva-loader__svg"
        width="150"
        height="117"
        viewBox="0 0 257 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Chrome gradient — ghostlink (horizontal). */}
          <linearGradient
            id="elChromeGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#4a4a4a" />
            <stop offset="15%" stopColor="#e8e8e8" />
            <stop offset="30%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#b0b0b0" />
            <stop offset="70%" stopColor="#ffffff" />
            <stop offset="85%" stopColor="#e8e8e8" />
            <stop offset="100%" stopColor="#4a4a4a" />
          </linearGradient>
        </defs>

        {/* Guide stroke — subtle background outline so EVA is always readable. */}
        <path
          d={EVA_PATH}
          fill="none"
          stroke="#0a0a0a"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Wide faint halo riding the dash → fakes glow with no filter. */}
        <path
          className="eva-travel eva-travel--glow"
          pathLength={1800}
          d={EVA_PATH}
          fill="none"
          stroke="rgba(200, 220, 255, 0.22)"
          strokeWidth="20"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Travelling chrome segments. */}
        <path
          className="eva-travel"
          pathLength={1800}
          d={EVA_PATH}
          fill="none"
          stroke="url(#elChromeGradient)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Bright specular core riding the segments. */}
        <path
          className="eva-travel"
          pathLength={1800}
          d={EVA_PATH}
          fill="none"
          stroke="rgba(255, 255, 255, 0.95)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

export default LoadingScreen
