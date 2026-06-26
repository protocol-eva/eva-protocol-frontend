import { useState } from 'react'
import { motion } from 'framer-motion'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Award01Icon,
  ChampionIcon,
  Medal01Icon,
  StarIcon,
  CrownIcon,
  ChartLineData01Icon,
  Analytics02Icon,
  Wallet01Icon,
  UserGroupIcon,
  Layers01Icon,
  FlashIcon,
} from '@hugeicons/core-free-icons'
import useSWR from 'swr'
import { api } from '../lib/api'
import type { CompetitionData } from '../types'
import { ComparisonChart } from './ComparisonChart'
import { TraderConfigViewModal } from './TraderConfigViewModal'
import { getTraderColor } from '../utils/traderColors'
import { useLanguage } from '../contexts/LanguageContext'
import { t } from '../i18n/translations'
import { PunkAvatar, getTraderAvatar } from './PunkAvatar'
import { DashPage, EmptyState, StatCard, SectionHead } from './dash/DashKit'

export function CompetitionPage() {
  const { language } = useLanguage()
  const [selectedTrader, setSelectedTrader] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: competition } = useSWR<CompetitionData>(
    'competition',
    api.getCompetition,
    {
      refreshInterval: 15000, // 15秒刷新（竞赛数据不需要太频繁更新）
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  )

  const handleTraderClick = async (traderId: string) => {
    try {
      const traderConfig = await api.getTraderConfig(traderId)
      setSelectedTrader(traderConfig)
      setIsModalOpen(true)
    } catch (error) {
      console.error('Failed to fetch trader config:', error)
      // 对于未登录用户，不显示详细配置，这是正常行为
      // 竞赛页面主要用于查看排行榜和基本信息
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedTrader(null)
  }

  if (!competition) {
    return (
      <DashPage>
        <div className="space-y-5">
          <div className="gl-panel rounded-2xl p-6 animate-pulse">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-3 flex-1">
                <div
                  className="h-8 w-64 rounded"
                  style={{ background: 'var(--surface-tertiary)' }}
                ></div>
                <div
                  className="h-4 w-48 rounded"
                  style={{ background: 'var(--surface-tertiary)' }}
                ></div>
              </div>
              <div
                className="h-12 w-32 rounded"
                style={{ background: 'var(--surface-tertiary)' }}
              ></div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="gl-panel rounded-xl p-5 animate-pulse">
                <div
                  className="h-3 w-20 mb-3 rounded"
                  style={{ background: 'var(--surface-tertiary)' }}
                ></div>
                <div
                  className="h-8 w-28 rounded"
                  style={{ background: 'var(--surface-tertiary)' }}
                ></div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="gl-panel rounded-2xl p-6 animate-pulse">
              <div
                className="h-64 w-full rounded"
                style={{ background: 'var(--surface-tertiary)' }}
              ></div>
            </div>
            <div className="gl-panel rounded-2xl p-6 animate-pulse space-y-3">
              <div
                className="h-20 w-full rounded"
                style={{ background: 'var(--surface-tertiary)' }}
              ></div>
              <div
                className="h-20 w-full rounded"
                style={{ background: 'var(--surface-tertiary)' }}
              ></div>
              <div
                className="h-20 w-full rounded"
                style={{ background: 'var(--surface-tertiary)' }}
              ></div>
            </div>
          </div>
        </div>
      </DashPage>
    )
  }

  // 如果有数据返回但没有交易员，显示空状态
  if (!competition.traders || competition.traders.length === 0) {
    return (
      <DashPage>
        <EmptyState
          icon={Award01Icon}
          title={t('noTraders', language)}
          description={t('createFirstTrader', language)}
        />
      </DashPage>
    )
  }

  // 按收益率排序
  const sortedTraders = [...competition.traders].sort(
    (a, b) => b.total_pnl_pct - a.total_pnl_pct
  )

  // 找出领先者
  const leader = sortedTraders[0]

  // Derived summary metrics (read-only, display-only)
  const runningCount = sortedTraders.filter((tr) => tr.is_running).length
  const totalEquitySum = sortedTraders.reduce(
    (acc, tr) => acc + (tr.total_equity ?? 0),
    0
  )
  const avgPnlPct =
    sortedTraders.length > 0
      ? sortedTraders.reduce((acc, tr) => acc + (tr.total_pnl_pct ?? 0), 0) /
        sortedTraders.length
      : 0
  const leaderPnlPositive = (leader?.total_pnl ?? 0) >= 0
  const avgPositive = avgPnlPct >= 0

  const ease = [0.16, 1, 0.3, 1] as const

  return (
    <DashPage>
      {/* ── Hero / competition identity bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="gl-aurora-panel rounded-2xl p-4 sm:p-5 mb-5 overflow-hidden"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* title */}
          <div className="flex items-center gap-3.5 min-w-0">
            <span className="dash-kpi-ico shrink-0">
              <HugeiconsIcon icon={Award01Icon} size={24} strokeWidth={1.8} />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xl sm:text-2xl font-bold tracking-tight gl-metal-text leading-none">
                  {t('aiCompetition', language)}
                </span>
                <span className="dash-chip">
                  <HugeiconsIcon
                    icon={UserGroupIcon}
                    size={13}
                    strokeWidth={1.9}
                  />
                  <span className="dash-chip-val tabular-nums">
                    {competition.count}
                  </span>
                  {t('traders', language)}
                </span>
                <span className="dash-live">
                  <span className="dash-live-dot" />
                  {t('liveBattle', language)}
                </span>
              </div>
              <div
                className="mt-1.5 text-[11px]"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {t('realTimePnL', language)}
              </div>
            </div>
          </div>

          {/* leader callout */}
          <div
            className="flex items-center gap-3 rounded-xl px-4 py-3 shrink-0"
            style={{
              background: 'var(--surface-primary)',
              border: '1px solid var(--panel-border)',
            }}
          >
            <span
              className="dash-ico"
              style={{ color: 'var(--accent-primary)' }}
            >
              <HugeiconsIcon icon={CrownIcon} size={17} strokeWidth={1.9} />
            </span>
            <div className="text-left">
              <div
                className="text-[10px] font-semibold uppercase tracking-wider mb-0.5"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {t('leader', language)}
              </div>
              <div className="text-sm md:text-base font-bold gl-metal-text leading-none">
                {leader?.trader_name}
              </div>
              <div
                className="text-xs font-bold mt-1 tabular-nums"
                style={{
                  color: leaderPnlPositive
                    ? 'var(--binance-green)'
                    : 'var(--binance-red)',
                }}
              >
                {leaderPnlPositive ? '+' : ''}
                {leader?.total_pnl_pct?.toFixed(2) || '0.00'}%
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── KPI summary cards ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06, duration: 0.4, ease }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-5"
      >
        <StatCard
          title={t('leader', language)}
          value={`${leaderPnlPositive ? '+' : ''}${leader?.total_pnl_pct?.toFixed(2) || '0.00'}`}
          unit="%"
          positive={leaderPnlPositive}
          subtitle={leader?.trader_name}
          icon={ChampionIcon}
        />
        <StatCard
          title={t('traders', language)}
          value={`${competition.count}`}
          subtitle={`${runningCount} ${t('live', language)}`}
          icon={UserGroupIcon}
        />
        <StatCard
          title={t('equity', language)}
          value={totalEquitySum.toFixed(2)}
          unit="USDT"
          icon={Wallet01Icon}
        />
        <StatCard
          title={t('pnl', language)}
          value={`${avgPositive ? '+' : ''}${avgPnlPct.toFixed(2)}`}
          unit="%"
          positive={avgPositive}
          subtitle={t('realTimePnL', language)}
          icon={Analytics02Icon}
        />
      </motion.div>

      {/* Left/Right Split: Performance Chart + Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Left: Performance Comparison Chart */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.4, ease }}
          className="gl-aurora-panel rounded-2xl overflow-hidden"
        >
          <SectionHead
            icon={ChartLineData01Icon}
            title={t('performanceComparison', language)}
            delay="-1.2s"
            right={
              <span
                className="text-[11px] font-semibold"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {t('realTimePnL', language)}
              </span>
            }
          />
          <div className="p-4 sm:p-5">
            <ComparisonChart traders={sortedTraders.slice(0, 10)} />
          </div>
        </motion.div>

        {/* Right: Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.4, ease }}
          className="gl-prism-panel rounded-2xl overflow-hidden"
        >
          <SectionHead
            icon={Award01Icon}
            title={t('leaderboard', language)}
            delay="-2.4s"
            right={
              <span className="dash-live">
                <span className="dash-live-dot" />
                {t('live', language)}
              </span>
            }
          />
          <div className="p-3 sm:p-4 space-y-2.5">
            {sortedTraders.map((trader, index) => {
              const isLeader = index === 0
              const traderColor = getTraderColor(
                sortedTraders,
                trader.trader_id
              )
              const pnlPositive = (trader.total_pnl ?? 0) >= 0
              const rankIcon =
                index === 0
                  ? ChampionIcon
                  : index === 1
                    ? Medal01Icon
                    : index === 2
                      ? StarIcon
                      : null

              return (
                <div
                  key={trader.trader_id}
                  onClick={() => handleTraderClick(trader.trader_id)}
                  className="dash-prow rounded-xl p-3 cursor-pointer"
                  style={{
                    background: isLeader
                      ? 'var(--accent-primary-bg)'
                      : 'var(--surface-primary)',
                    border: isLeader
                      ? '1px solid var(--accent-primary-border)'
                      : '1px solid var(--panel-border)',
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Rank & Avatar & Name */}
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Rank Badge */}
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold tabular-nums shrink-0"
                        style={
                          index < 3
                            ? {
                                background: 'var(--accent-primary-bg)',
                                color: 'var(--accent-primary)',
                                border:
                                  '1px solid var(--accent-primary-border)',
                              }
                            : {
                                background: 'var(--surface-tertiary)',
                                color: 'var(--text-secondary)',
                              }
                        }
                      >
                        {rankIcon ? (
                          <HugeiconsIcon
                            icon={rankIcon}
                            size={15}
                            strokeWidth={1.9}
                          />
                        ) : (
                          index + 1
                        )}
                      </div>
                      {/* Punk Avatar */}
                      <div
                        className="rounded-lg overflow-hidden shrink-0"
                        style={{
                          border: '1px solid var(--panel-border)',
                          lineHeight: 0,
                        }}
                      >
                        <PunkAvatar
                          seed={getTraderAvatar(
                            trader.trader_id,
                            trader.trader_name
                          )}
                          size={36}
                          className="block"
                        />
                      </div>
                      <div className="min-w-0">
                        <div
                          className="font-bold text-sm truncate"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {trader.trader_name}
                        </div>
                        <div
                          className="text-[11px] font-mono font-semibold truncate"
                          style={{ color: traderColor }}
                        >
                          {trader.ai_model.toUpperCase()} +{' '}
                          {trader.exchange.toUpperCase()}
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-2 md:gap-3.5 flex-wrap md:flex-nowrap shrink-0">
                      {/* Total Equity */}
                      <div className="text-right hidden sm:block">
                        <div
                          className="text-[10px] font-semibold uppercase tracking-wider"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          {t('equity', language)}
                        </div>
                        <div
                          className="text-xs md:text-sm font-bold font-mono tabular-nums"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {trader.total_equity?.toFixed(2) || '0.00'}
                        </div>
                      </div>

                      {/* P&L */}
                      <div className="text-right min-w-[70px] md:min-w-[90px]">
                        <div
                          className="text-[10px] font-semibold uppercase tracking-wider"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          {t('pnl', language)}
                        </div>
                        <div
                          className="text-base md:text-lg font-bold font-mono tabular-nums leading-tight"
                          style={{
                            color: pnlPositive
                              ? 'var(--binance-green)'
                              : 'var(--binance-red)',
                          }}
                        >
                          {pnlPositive ? '+' : ''}
                          {trader.total_pnl_pct?.toFixed(2) || '0.00'}%
                        </div>
                        <div
                          className="text-[11px] font-mono tabular-nums"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {pnlPositive ? '+' : ''}
                          {trader.total_pnl?.toFixed(2) || '0.00'}
                        </div>
                      </div>

                      {/* Positions */}
                      <div className="text-right hidden md:block">
                        <div
                          className="text-[10px] font-semibold uppercase tracking-wider"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          {t('pos', language)}
                        </div>
                        <div
                          className="text-xs md:text-sm font-bold font-mono tabular-nums"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {trader.position_count}
                        </div>
                        <div
                          className="text-[11px] font-mono tabular-nums"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {trader.margin_used_pct.toFixed(1)}%
                        </div>
                      </div>

                      {/* Status */}
                      <div>
                        <span
                          className="inline-flex items-center justify-center w-7 h-7 rounded-lg"
                          style={
                            trader.is_running
                              ? {
                                  background: 'var(--binance-green-bg)',
                                  color: 'var(--binance-green)',
                                }
                              : {
                                  background: 'var(--binance-red-bg)',
                                  color: 'var(--binance-red)',
                                }
                          }
                          title={
                            trader.is_running
                              ? t('live', language)
                              : t('liveBattle', language)
                          }
                        >
                          <HugeiconsIcon
                            icon={FlashIcon}
                            size={14}
                            strokeWidth={2}
                          />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>

      {/* Head-to-Head Stats */}
      {competition.traders.length === 2 && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24, duration: 0.4, ease }}
          className="gl-onyx-panel rounded-2xl overflow-hidden"
        >
          <SectionHead
            icon={FlashIcon}
            title={t('headToHead', language)}
            delay="-3.6s"
          />
          <div className="grid grid-cols-2 gap-4 p-4 sm:p-5">
            {sortedTraders.map((trader, index) => {
              const isWinning = index === 0
              const opponent = sortedTraders[1 - index]

              // Check if both values are valid numbers
              const hasValidData =
                trader.total_pnl_pct != null &&
                opponent.total_pnl_pct != null &&
                !isNaN(trader.total_pnl_pct) &&
                !isNaN(opponent.total_pnl_pct)

              const gap = hasValidData
                ? trader.total_pnl_pct - opponent.total_pnl_pct
                : NaN

              return (
                <div
                  key={trader.trader_id}
                  className="p-4 sm:p-5 rounded-xl transition-all duration-300 hover:scale-[1.02]"
                  style={
                    isWinning
                      ? {
                          background: 'var(--binance-green-bg)',
                          border: '1px solid rgba(14, 203, 129, 0.35)',
                          boxShadow: '0 3px 18px rgba(14, 203, 129, 0.15)',
                        }
                      : {
                          background: 'var(--surface-primary)',
                          border: '1px solid var(--panel-border)',
                        }
                  }
                >
                  <div className="text-center">
                    {/* Winner crown */}
                    {isWinning && (
                      <div
                        className="flex justify-center mb-2"
                        style={{ color: 'var(--binance-green)' }}
                      >
                        <HugeiconsIcon
                          icon={CrownIcon}
                          size={18}
                          strokeWidth={1.9}
                        />
                      </div>
                    )}
                    {/* Avatar */}
                    <div className="flex justify-center mb-3">
                      <div
                        className="rounded-xl overflow-hidden"
                        style={{
                          border: '1px solid var(--panel-border)',
                          lineHeight: 0,
                        }}
                      >
                        <PunkAvatar
                          seed={getTraderAvatar(
                            trader.trader_id,
                            trader.trader_name
                          )}
                          size={56}
                          className="block"
                        />
                      </div>
                    </div>
                    <div
                      className="text-sm md:text-base font-bold mb-2 truncate"
                      style={{
                        color: getTraderColor(sortedTraders, trader.trader_id),
                      }}
                    >
                      {trader.trader_name}
                    </div>
                    <div
                      className="text-lg md:text-2xl font-bold font-mono tabular-nums mb-1"
                      style={{
                        color:
                          (trader.total_pnl ?? 0) >= 0
                            ? 'var(--binance-green)'
                            : 'var(--binance-red)',
                      }}
                    >
                      {trader.total_pnl_pct != null &&
                      !isNaN(trader.total_pnl_pct)
                        ? `${trader.total_pnl_pct >= 0 ? '+' : ''}${trader.total_pnl_pct.toFixed(2)}%`
                        : '—'}
                    </div>
                    {hasValidData && isWinning && gap > 0 && (
                      <div
                        className="inline-flex items-center gap-1 text-xs font-semibold"
                        style={{ color: 'var(--binance-green)' }}
                      >
                        <HugeiconsIcon
                          icon={Layers01Icon}
                          size={13}
                          strokeWidth={2}
                        />
                        {t('leadingBy', language, { gap: gap.toFixed(2) })}
                      </div>
                    )}
                    {hasValidData && !isWinning && gap < 0 && (
                      <div
                        className="text-xs font-semibold"
                        style={{ color: 'var(--binance-red)' }}
                      >
                        {t('behindBy', language, {
                          gap: Math.abs(gap).toFixed(2),
                        })}
                      </div>
                    )}
                    {!hasValidData && (
                      <div
                        className="text-xs font-semibold"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        —
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Trader Config View Modal */}
      <TraderConfigViewModal
        isOpen={isModalOpen}
        onClose={closeModal}
        traderData={selectedTrader}
      />
    </DashPage>
  )
}
