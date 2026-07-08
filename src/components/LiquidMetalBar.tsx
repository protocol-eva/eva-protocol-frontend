import { useEffect, useRef, type ReactNode } from 'react'
import { ShaderMount, liquidMetalFragmentShader } from '@paper-design/shaders'

/* ============================================================================
   LiquidMetalBar — the elongated cousin of LiquidMetalButton. Same animated
   "liquid metal" WebGL shader (@paper-design/shaders), but as the BORDER FRAME
   of a rounded-rectangle button with the label on a dark inner panel — the
   "canvas-in-the-border" look from the landing's wallet button, adapted to a
   compact CTA (Sign in / Create account).

   SAFETY: mounts a WebGL context → dispose() on unmount (no context leak).
   Honours prefers-reduced-motion + degrades to the static metal `.lm-bar` base
   if WebGL/the shader is unavailable.
   ========================================================================== */

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

type Props = {
  children: ReactNode
  type?: 'button' | 'submit'
  onClick?: () => void
  disabled?: boolean
  className?: string
}

export default function LiquidMetalBar({
  children,
  type = 'button',
  onClick,
  disabled = false,
  className = '',
}: Props) {
  const mountRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = mountRef.current
    if (!el) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    let mount: ShaderMount | null = null
    try {
      mount = new ShaderMount(
        el,
        liquidMetalFragmentShader,
        UNIFORMS,
        undefined,
        SPEED
      )
    } catch {
      /* WebGL unavailable → static metal `.lm-bar` base remains */
    }
    return () => {
      try {
        const gl = (
          mount as unknown as {
            gl?: WebGLRenderingContext | WebGL2RenderingContext
          } | null
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
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`lm-bar ${className}`}
    >
      <span ref={mountRef} className="lm-bar-shader" aria-hidden="true" />
      <span className="lm-bar-inner">{children}</span>
    </button>
  )
}
