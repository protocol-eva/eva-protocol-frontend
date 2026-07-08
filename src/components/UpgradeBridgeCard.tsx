import { useMemo, useState } from 'react'
import { ArrowRightLeft, Info, Lock, Sparkles } from 'lucide-react'
import { useAppKitAccount } from '@reown/appkit/react'
import { SwapCard, type SwapIntent } from './SwapCard'
import { UPGRADE_SUPPORTED_CHAINS } from '../lib/upgradeConfig'
import { t, type Language } from '../i18n/translations'

interface UpgradeBridgeCardProps {
  eligible: boolean
  language?: Language
}

export function UpgradeBridgeCard({
  eligible,
  language = 'en',
}: UpgradeBridgeCardProps) {
  const { address } = useAppKitAccount()
  const [fromChain, setFromChain] = useState('8453')
  const [toChain, setToChain] = useState('42161')
  const [fromToken, setFromToken] = useState('USDC')
  const [toToken, setToToken] = useState('USDC')
  const [amount, setAmount] = useState('100')
  const [routeNonce, setRouteNonce] = useState(0)

  const tr = (key: string) => t(`upgradePage.bridge.${key}`, language)

  const intent = useMemo<SwapIntent>(
    () => ({
      action: 'swap',
      fromToken: fromToken.trim().toUpperCase(),
      toToken: toToken.trim().toUpperCase(),
      amount: amount.trim() || '100',
      fromChain,
      toChain,
    }),
    [amount, fromChain, fromToken, toChain, toToken]
  )

  return (
    <div
      className="rounded-3xl p-5 sm:p-6 space-y-4"
      style={{
        background: 'var(--surface-secondary)',
        border: '1px solid var(--panel-border)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ArrowRightLeft
              className="w-4 h-4"
              style={{ color: 'var(--accent-primary)' }}
            />
            <span
              className="text-xs uppercase tracking-[0.24em]"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {tr('subtitle')}
            </span>
          </div>
          <h3
            className="text-xl font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            {tr('title')}
          </h3>
          <p
            className="text-sm mt-2 max-w-xl"
            style={{ color: 'var(--text-secondary)' }}
          >
            {tr('blurb')}
          </p>
        </div>
        <div
          className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium flex items-center gap-1.5"
          style={{
            background: eligible
              ? 'rgba(14,203,129,0.12)'
              : 'rgba(255,255,255,0.04)',
            color: eligible ? '#0ECB81' : 'var(--text-tertiary)',
            border: `1px solid ${eligible ? 'rgba(14,203,129,0.25)' : 'var(--panel-border)'}`,
          }}
        >
          {eligible ? (
            <Sparkles className="w-3.5 h-3.5" />
          ) : (
            <Lock className="w-3.5 h-3.5" />
          )}
          {eligible ? tr('kicker') : tr('locked')}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label={tr('from')}>
          <select
            value={fromChain}
            onChange={(e) => setFromChain(e.target.value)}
            className="upgrade-select"
          >
            {UPGRADE_SUPPORTED_CHAINS.map((chain) => (
              <option key={chain.id} value={chain.id}>
                {chain.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={tr('to')}>
          <select
            value={toChain}
            onChange={(e) => setToChain(e.target.value)}
            className="upgrade-select"
          >
            {UPGRADE_SUPPORTED_CHAINS.map((chain) => (
              <option key={chain.id} value={chain.id}>
                {chain.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={tr('payToken')}>
          <input
            value={fromToken}
            onChange={(e) => setFromToken(e.target.value)}
            className="upgrade-input"
          />
        </Field>
        <Field label={tr('receiveToken')}>
          <input
            value={toToken}
            onChange={(e) => setToToken(e.target.value)}
            className="upgrade-input"
          />
        </Field>
        <Field label={tr('amount')}>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="upgrade-input"
          />
        </Field>
        <div className="flex items-end">
          <button
            onClick={() => setRouteNonce((v) => v + 1)}
            className="w-full rounded-2xl px-4 py-3 text-sm font-semibold transition-opacity"
            style={{
              background: eligible
                ? 'var(--accent-primary)'
                : 'var(--surface-tertiary)',
              color: eligible ? '#fff' : 'var(--text-tertiary)',
              opacity: eligible ? 1 : 0.7,
              cursor: eligible ? 'pointer' : 'not-allowed',
            }}
            disabled={!eligible}
          >
            {tr('route')}
          </button>
        </div>
      </div>

      <div
        className="flex items-start gap-2 text-xs"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <span>{tr('note')}</span>
      </div>

      {eligible && address ? (
        <SwapCard
          key={routeNonce}
          intent={intent}
          address={address}
          language={language}
        />
      ) : eligible ? (
        <div
          className="rounded-2xl px-4 py-3 text-sm"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--panel-border)',
            color: 'var(--text-tertiary)',
          }}
        >
          {tr('connectHint')}
        </div>
      ) : null}
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span
        className="text-[11px] uppercase tracking-[0.18em]"
        style={{ color: 'var(--text-tertiary)' }}
      >
        {label}
      </span>
      {children}
    </label>
  )
}
