import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'
import {
  ArrowUpRight01Icon,
  ArrowDownRight01Icon,
} from '@hugeicons/core-free-icons'

/**
 * DashKit — shared premium UI primitives for every authenticated page.
 *
 * These are the reusable pieces extracted from the TraderDashboardPage redesign so
 * that /traders, /strategy, /strategy-market, /backtest, /competition and /debate all
 * share ONE source of truth for the metallic / glow look.
 *
 * Design rules baked in:
 *  - Hugeicons only (no emojis, no lucide).
 *  - Metallic titles via `gl-metal-shine` / `gl-metal-text`.
 *  - Green icon chips via `dash-ico` / `dash-kpi-ico`.
 *  - Premium panels via the `gl-*-panel` families (applied by the page, not here).
 */

// ──────────────────────────────────────────────────────────────────────────
// Page shell — ambient blue glow background + centered max-width column.
// Wrap every authenticated page in this so spacing/background stay identical.
// ──────────────────────────────────────────────────────────────────────────
export function DashPage({
  children,
  className = '',
  maxWidth = 1600,
}: {
  children: ReactNode
  className?: string
  maxWidth?: number
}) {
  return (
    <div className={`gl-data-page min-h-screen pb-16 ${className}`}>
      <div
        className="w-full mx-auto px-4 md:px-8 relative z-10 pt-6"
        style={{ maxWidth }}
      >
        {children}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// EmptyState — centered premium empty / error state (icon chip + metallic title).
// ──────────────────────────────────────────────────────────────────────────
export function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
}: {
  icon: IconSvgElement
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
  /** compact = inline panel empty state (no full viewport height). */
  compact?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-center relative z-10 px-6 ${compact ? 'py-14' : 'min-h-[60vh]'}`}
    >
      <div className="text-center max-w-md mx-auto">
        <div
          className="mx-auto mb-6 rounded-2xl flex items-center justify-center dash-kpi-ico"
          style={{
            width: compact ? 56 : 80,
            height: compact ? 56 : 80,
            borderRadius: compact ? 16 : 20,
          }}
        >
          <HugeiconsIcon
            icon={icon}
            size={compact ? 26 : 34}
            strokeWidth={1.6}
          />
        </div>
        <h2
          className={`font-bold mb-3 gl-metal-text ${compact ? 'text-lg' : 'text-2xl'}`}
        >
          {title}
        </h2>
        {description && (
          <p
            className={`mb-7 ${compact ? 'text-sm' : 'text-base'}`}
            style={{ color: 'var(--text-secondary)' }}
          >
            {description}
          </p>
        )}
        {action && (
          <button
            onClick={action.onClick}
            className="gl-navbar-btn px-6 py-3 rounded-xl text-sm font-semibold"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// StatCard — KPI metric card (gl-metal-panel + metallic value + up/down arrow).
// ──────────────────────────────────────────────────────────────────────────
export function StatCard({
  title,
  value,
  unit,
  change,
  positive,
  subtitle,
  icon,
}: {
  title: string
  value: string
  unit?: string
  change?: number
  positive?: boolean
  subtitle?: string
  icon: IconSvgElement
}) {
  return (
    <div className="gl-metal-panel rounded-xl p-4 sm:p-5 relative overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div
            className="text-[11px] font-semibold uppercase tracking-wider mb-2"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {title}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-[1.7rem] font-bold tracking-tight tabular-nums gl-metal-text leading-none">
              {value}
            </span>
            {unit && (
              <span
                className="text-[11px] font-semibold"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {unit}
              </span>
            )}
          </div>
          {change !== undefined && (
            <div
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold"
              style={{
                color: positive ? 'var(--binance-green)' : 'var(--binance-red)',
              }}
            >
              <HugeiconsIcon
                icon={positive ? ArrowUpRight01Icon : ArrowDownRight01Icon}
                size={14}
                strokeWidth={2.4}
              />
              <span className="tabular-nums">
                {positive ? '+' : ''}
                {change.toFixed(2)}%
              </span>
            </div>
          )}
          {subtitle && (
            <div
              className="mt-2 text-[11px] font-medium"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {subtitle}
            </div>
          )}
        </div>
        <span className="dash-kpi-ico">
          <HugeiconsIcon icon={icon} size={19} strokeWidth={1.8} />
        </span>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// SectionHead — metallic shine title + green icon chip + optional right slot.
// Stagger the shine across a page with delay='-1.2s', '-2.4s', '-3.6s', …
// ──────────────────────────────────────────────────────────────────────────
export function SectionHead({
  icon,
  title,
  delay = '-1.2s',
  right,
}: {
  icon: IconSvgElement
  title: string
  delay?: string
  right?: ReactNode
}) {
  return (
    <div
      className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b"
      style={{ borderColor: 'var(--panel-border)' }}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="dash-ico">
          <HugeiconsIcon icon={icon} size={16} strokeWidth={1.9} />
        </span>
        <h2
          className="text-sm font-semibold uppercase tracking-wider gl-metal-shine truncate"
          style={{ animationDelay: delay }}
        >
          {title}
        </h2>
      </div>
      {right}
    </div>
  )
}
