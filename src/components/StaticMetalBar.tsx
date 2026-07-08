import type { ReactNode } from 'react'

/** CSS-only submit/button — same shell as LiquidMetalBar without WebGL. Auth
 *  pages must not mount a second shader loop while the user is typing. */
export function StaticMetalBar({
  children,
  type = 'button',
  onClick,
  disabled = false,
  className = '',
}: {
  children: ReactNode
  type?: 'button' | 'submit'
  onClick?: () => void
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`lm-bar ${className}`}
    >
      <span className="lm-bar-inner">{children}</span>
    </button>
  )
}
