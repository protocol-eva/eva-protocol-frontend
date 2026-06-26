import { useEffect, useRef, type ReactNode } from 'react'
import { ShaderMount, liquidMetalFragmentShader } from '@paper-design/shaders'

/* ============================================================================
   LiquidMetalButton — the chat-box Connect Wallet button. A rounded-SQUARE
   button whose BORDER is an animated "liquid metal" WebGL shader
   (@paper-design/shaders), with the icon on a dark realistic inner panel — the
   same "canvas-in-the-border" structure as the login LiquidMetalBar (no green
   ring; hover/connected give a subtle blue-white glow, not a hue change).

   PERF / SAFETY: this mounts a SECOND WebGL context on the landing (CoinField
   is the first). It MUST release it on unmount or we leak the context — the
   same exhaustion that caused the earlier tab crash. dispose() runs in the
   effect cleanup. Honours prefers-reduced-motion (static metal base, no shader)
   and degrades gracefully if WebGL is unavailable.
   ========================================================================== */

type Props = {
  /** diameter in px */
  size?: number
  connected?: boolean
  onClick?: () => void
  title?: string
  ariaLabel?: string
  /** centred icon */
  children?: ReactNode
}

// the pen's exact uniforms + speed
const UNIFORMS = {
  u_repetition: 1.5,
  u_softness: 0.5,
  u_shiftRed: 0.3,
  u_shiftBlue: 0.3,
  u_distortion: 0,
  u_contour: 0,
  u_angle: 100,
  u_scale: 1.5,
  u_shape: 1,
  u_offsetX: 0.1,
  u_offsetY: -0.1,
}
const SPEED = 0.6

export default function LiquidMetalButton({
  size = 54,
  connected = false,
  onClick,
  title,
  ariaLabel,
  children,
}: Props) {
  const mountRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = mountRef.current
    if (!el) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

    let mount: ShaderMount | null = null
    try {
      // (parentElement, fragmentShader, uniforms, webGlContextAttributes?, speed?)
      mount = new ShaderMount(
        el,
        liquidMetalFragmentShader,
        UNIFORMS,
        undefined,
        SPEED
      )
    } catch {
      /* WebGL unavailable → the static metal base (::before) remains */
    }
    return () => {
      try {
        const gl = (
          mount as unknown as
            | { gl?: WebGLRenderingContext | WebGL2RenderingContext }
            | null
        )?.gl
        mount?.dispose()
        gl?.getExtension('WEBGL_lose_context')?.loseContext()
      } catch {
        /* context already gone */
      }
    }
  }, [])

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
      className={`lm-btn${connected ? ' is-connected' : ''}`}
      style={{ ['--lm-size' as string]: `${size}px` }}
    >
      <span ref={mountRef} className="lm-shader" aria-hidden="true" />
      <span className="lm-outline" aria-hidden="true">
        <span className="lm-icon">{children}</span>
      </span>
    </button>
  )
}
