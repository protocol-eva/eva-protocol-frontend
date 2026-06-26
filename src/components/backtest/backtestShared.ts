import { createElement, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Activity01Icon,
  CheckmarkCircle01Icon,
  CancelCircleIcon,
  PauseIcon,
  Clock01Icon,
} from '@hugeicons/core-free-icons'
import type { BacktestEquityPoint } from '../../types'

export type WizardStep = 1 | 2 | 3
export type ViewTab = 'overview' | 'chart' | 'trades' | 'decisions' | 'compare'

export const TIMEFRAME_OPTIONS = [
  '1m',
  '3m',
  '5m',
  '15m',
  '30m',
  '1h',
  '4h',
  '1d',
]
export const POPULAR_SYMBOLS = [
  'BTCUSDT',
  'ETHUSDT',
  'SOLUSDT',
  'BNBUSDT',
  'XRPUSDT',
  'DOGEUSDT',
]
export const MAX_CHART_POINTS = 400
export const SWR_OPTS = {
  revalidateOnFocus: false,
  dedupingInterval: 2000,
} as const

export const toLocalInput = (date: Date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

export function downsampleSeries<T>(points: T[], maxPoints: number): T[] {
  if (points.length <= maxPoints) return points
  const step = Math.ceil(points.length / maxPoints)
  const sampled: T[] = []
  for (let i = 0; i < points.length; i += step) sampled.push(points[i])
  const last = points[points.length - 1]
  if (sampled[sampled.length - 1] !== last) sampled.push(last)
  return sampled
}

export function findClosestEquityIndex(
  equity: BacktestEquityPoint[],
  tradeTs: number
): number {
  if (!equity.length) return -1
  let lo = 0
  let hi = equity.length - 1
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2)
    if (equity[mid].ts < tradeTs) lo = mid + 1
    else hi = mid
  }
  if (lo === 0) return 0
  const prev = equity[lo - 1]
  const curr = equity[lo]
  return Math.abs(prev.ts - tradeTs) <= Math.abs(curr.ts - tradeTs)
    ? lo - 1
    : lo
}

export function getStateColor(state: string) {
  switch (state) {
    case 'running':
      return 'var(--accent-primary)'
    case 'completed':
      return 'var(--binance-green)'
    case 'failed':
    case 'liquidated':
      return 'var(--binance-red)'
    case 'paused':
      return 'var(--text-secondary)'
    default:
      return 'var(--text-secondary)'
  }
}

const stateIconProps = { size: 15, strokeWidth: 1.9 } as const

export function getStateIcon(state: string): ReactNode {
  switch (state) {
    case 'running':
      return createElement(HugeiconsIcon, {
        icon: Activity01Icon,
        ...stateIconProps,
      })
    case 'completed':
      return createElement(HugeiconsIcon, {
        icon: CheckmarkCircle01Icon,
        ...stateIconProps,
      })
    case 'failed':
    case 'liquidated':
      return createElement(HugeiconsIcon, {
        icon: CancelCircleIcon,
        ...stateIconProps,
      })
    case 'paused':
      return createElement(HugeiconsIcon, {
        icon: PauseIcon,
        ...stateIconProps,
      })
    default:
      return createElement(HugeiconsIcon, {
        icon: Clock01Icon,
        ...stateIconProps,
      })
  }
}

export type ToastPayload = { text: string; tone: 'info' | 'error' | 'success' }

export type BacktestFormState = {
  runId: string
  symbols: string
  timeframes: string[]
  decisionTf: string
  cadence: number
  start: string
  end: string
  balance: number
  fee: number
  slippage: number
  btcEthLeverage: number
  altcoinLeverage: number
  fill: string
  prompt: string
  promptTemplate: string
  customPrompt: string
  overridePrompt: boolean
  cacheAI: boolean
  replayOnly: boolean
  aiModelId: string
  strategyId: string
}

export function createDefaultFormState(now = new Date()): BacktestFormState {
  return {
    runId: '',
    symbols: 'BTCUSDT,ETHUSDT,SOLUSDT',
    timeframes: ['3m', '15m', '4h'],
    decisionTf: '3m',
    cadence: 20,
    start: toLocalInput(new Date(now.getTime() - 3 * 24 * 3600 * 1000)),
    end: toLocalInput(now),
    balance: 1000,
    fee: 5,
    slippage: 2,
    btcEthLeverage: 5,
    altcoinLeverage: 5,
    fill: 'next_open',
    prompt: 'baseline',
    promptTemplate: 'default',
    customPrompt: '',
    overridePrompt: false,
    cacheAI: false,
    replayOnly: false,
    aiModelId: '',
    strategyId: '',
  }
}
