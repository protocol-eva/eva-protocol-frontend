import { useState, useEffect, useMemo } from 'react'
import { api } from '../lib/api'
import { useLanguage } from '../contexts/LanguageContext'
import { t } from '../i18n/translations'
import { MetricTooltip } from './MetricTooltip'
import { formatPrice, formatQuantity } from '../utils/format'
import { EmptyState, SectionHead } from './dash/DashKit'
import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'
import {
  Analytics02Icon,
  Target01Icon,
  MoneyBag02Icon,
  ChartIncreaseIcon,
  WeightScaleIcon,
  ChartDownIcon,
  TradeDownIcon,
  Award01Icon,
  ChartLineData01Icon,
  DollarCircleIcon,
  TradeUpIcon,
  Medal01Icon,
  FilterIcon,
  Loading03Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowLeftDoubleIcon,
  ArrowRightDoubleIcon,
} from '@hugeicons/core-free-icons'
import type {
  HistoricalPosition,
  TraderStats,
  SymbolStats,
  DirectionStats,
} from '../types'

interface PositionHistoryProps {
  traderId: string
}

// Format number with proper decimals (for large numbers)
function formatNumber(value: number, decimals: number = 2): string {
  if (Math.abs(value) >= 1000000) {
    return (value / 1000000).toFixed(2) + 'M'
  }
  if (Math.abs(value) >= 1000) {
    return (value / 1000).toFixed(2) + 'K'
  }
  return value.toFixed(decimals)
}

// Format duration from minutes
function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '-'
  if (minutes < 60) return `${minutes.toFixed(0)}m`
  if (minutes < 1440) return `${(minutes / 60).toFixed(1)}h`
  return `${(minutes / 1440).toFixed(1)}d`
}

// Format date
function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Stats Card Component with formula tooltip
function StatCard({
  title,
  value,
  suffix,
  color,
  icon,
  subtitle,
  metricKey,
  language = 'en',
}: {
  title: string
  value: string | number
  suffix?: string
  color?: string
  icon: IconSvgElement
  subtitle?: string
  metricKey?: string
  language?: string
}) {
  return (
    <div className="gl-metal-panel rounded-xl p-4 relative overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-2">
            <span
              className="text-[11px] font-semibold uppercase tracking-wider truncate"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {title}
            </span>
            {metricKey && (
              <MetricTooltip
                metricKey={metricKey}
                language={language}
                size={12}
              />
            )}
          </div>
          <div className="flex items-baseline gap-1">
            <span
              className="text-xl font-bold tabular-nums leading-none gl-metal-text"
              style={color ? { color } : undefined}
            >
              {value}
            </span>
            {suffix && (
              <span
                className="text-sm font-semibold"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {suffix}
              </span>
            )}
          </div>
          {subtitle && (
            <div
              className="text-[11px] mt-2 font-medium"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {subtitle}
            </div>
          )}
        </div>
        <span className="dash-kpi-ico shrink-0">
          <HugeiconsIcon icon={icon} size={18} strokeWidth={1.8} />
        </span>
      </div>
    </div>
  )
}

// Symbol Stats Row
function SymbolStatsRow({ stat }: { stat: SymbolStats }) {
  const totalPnl = stat.total_pnl || 0
  const winRate = stat.win_rate || 0
  const pnlColor = totalPnl >= 0 ? 'var(--binance-green)' : 'var(--binance-red)'
  const winRateColor =
    winRate >= 60
      ? 'var(--binance-green)'
      : winRate >= 40
        ? 'var(--nofx-gold)'
        : 'var(--binance-red)'

  return (
    <div className="dash-prow flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg">
      <div className="flex items-center gap-3 min-w-0">
        <span className="dash-chip dash-chip-val font-semibold tabular-nums">
          {(stat.symbol || '').replace('USDT', '')}
        </span>
        <span
          className="text-xs font-medium"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {stat.total_trades || 0} trades
        </span>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-right">
          <div
            className="text-[10px] uppercase tracking-wider font-semibold"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Win Rate
          </div>
          <div
            className="font-semibold tabular-nums"
            style={{ color: winRateColor }}
          >
            {winRate.toFixed(1)}%
          </div>
        </div>
        <div className="text-right min-w-[80px]">
          <div
            className="text-[10px] uppercase tracking-wider font-semibold"
            style={{ color: 'var(--text-tertiary)' }}
          >
            P&L
          </div>
          <div
            className="font-semibold tabular-nums"
            style={{ color: pnlColor }}
          >
            {totalPnl >= 0 ? '+' : ''}
            {formatNumber(totalPnl)}
          </div>
        </div>
      </div>
    </div>
  )
}

// Direction Stats Card
function DirectionStatsCard({
  stat,
  language,
}: {
  stat: DirectionStats
  language: 'en' | 'zh'
}) {
  const isLong = (stat.side || '').toLowerCase() === 'long'
  const iconColor = isLong ? '#0ECB81' : '#F6465D'
  const totalPnl = stat.total_pnl || 0
  const winRate = stat.win_rate || 0
  const tradeCount = stat.trade_count || 0
  const avgPnl = stat.avg_pnl || 0
  const pnlColor = totalPnl >= 0 ? 'var(--binance-green)' : 'var(--binance-red)'

  return (
    <div className="gl-onyx-panel rounded-2xl overflow-hidden p-4">
      <div className="flex items-center gap-2.5 mb-3.5">
        <span
          className="inline-flex items-center justify-center rounded-lg"
          style={{
            width: 30,
            height: 30,
            background: `${iconColor}1f`,
            border: `1px solid ${iconColor}40`,
            color: iconColor,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 14px ${iconColor}26`,
          }}
        >
          <HugeiconsIcon
            icon={isLong ? TradeUpIcon : TradeDownIcon}
            size={17}
            strokeWidth={2}
          />
        </span>
        <span
          className="text-sm font-bold uppercase tracking-wider"
          style={{ color: iconColor }}
        >
          {stat.side || 'Unknown'}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <div>
          <div
            className="text-[10px] uppercase tracking-wider font-semibold mb-1.5"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {t('positionHistory.trades', language)}
          </div>
          <div
            className="font-semibold tabular-nums"
            style={{ color: 'var(--text-primary)' }}
          >
            {tradeCount}
          </div>
        </div>
        <div>
          <div
            className="text-[10px] uppercase tracking-wider font-semibold mb-1.5"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {t('positionHistory.winRate', language)}
          </div>
          <div
            className="font-semibold tabular-nums"
            style={{
              color:
                winRate >= 60
                  ? 'var(--binance-green)'
                  : winRate >= 40
                    ? 'var(--nofx-gold)'
                    : 'var(--binance-red)',
            }}
          >
            {winRate.toFixed(1)}%
          </div>
        </div>
        <div>
          <div
            className="text-[10px] uppercase tracking-wider font-semibold mb-1.5"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {t('positionHistory.totalPnL', language)}
          </div>
          <div
            className="font-semibold tabular-nums"
            style={{ color: pnlColor }}
          >
            {totalPnl >= 0 ? '+' : ''}
            {formatNumber(totalPnl)}
          </div>
        </div>
        <div>
          <div
            className="text-[10px] uppercase tracking-wider font-semibold mb-1.5"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {t('positionHistory.avgPnL', language)}
          </div>
          <div
            className="font-semibold tabular-nums"
            style={{
              color:
                avgPnl >= 0 ? 'var(--binance-green)' : 'var(--binance-red)',
            }}
          >
            {avgPnl >= 0 ? '+' : ''}
            {formatNumber(avgPnl)}
          </div>
        </div>
      </div>
    </div>
  )
}

// Position Row Component
function PositionRow({ position }: { position: HistoricalPosition }) {
  const side = position.side || ''
  const isLong = side.toUpperCase() === 'LONG'
  const realizedPnl = position.realized_pnl || 0
  const isProfitable = realizedPnl >= 0
  const pnlColor = isProfitable ? 'var(--binance-green)' : 'var(--binance-red)'

  // Calculate holding time
  const entryTime = position.entry_time
    ? new Date(position.entry_time).getTime()
    : 0
  const exitTime = position.exit_time
    ? new Date(position.exit_time).getTime()
    : 0
  const holdingMinutes =
    entryTime && exitTime && exitTime > entryTime
      ? (exitTime - entryTime) / 60000
      : 0

  // Calculate PnL percentage based on entry price
  const entryPrice = position.entry_price || 0
  const exitPrice = position.exit_price || 0
  let pnlPct = 0
  if (entryPrice > 0) {
    if (isLong) {
      pnlPct = ((exitPrice - entryPrice) / entryPrice) * 100
    } else {
      pnlPct = ((entryPrice - exitPrice) / entryPrice) * 100
    }
  }

  // Use entry_quantity for display (original position size)
  const displayQty = position.entry_quantity || position.quantity || 0

  return (
    <tr
      className="dash-prow transition-colors"
      style={{ borderBottom: '1px solid var(--panel-border)' }}
    >
      {/* Symbol */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <span
            className="font-semibold tabular-nums"
            style={{ color: 'var(--text-primary)' }}
          >
            {(position.symbol || '').replace('USDT', '')}
          </span>
          <span className={isLong ? 'dash-side-long' : 'dash-side-short'}>
            {side}
          </span>
        </div>
      </td>

      {/* Entry Price */}
      <td
        className="py-3 px-4 text-right tabular-nums"
        style={{ color: 'var(--text-primary)' }}
      >
        {formatPrice(entryPrice)}
      </td>

      {/* Exit Price */}
      <td
        className="py-3 px-4 text-right tabular-nums"
        style={{ color: 'var(--text-primary)' }}
      >
        {formatPrice(exitPrice)}
      </td>

      {/* Quantity */}
      <td
        className="py-3 px-4 text-right tabular-nums"
        style={{ color: 'var(--text-secondary)' }}
      >
        {formatQuantity(displayQty)}
      </td>

      {/* Position Value (Entry Price * Quantity) */}
      <td
        className="py-3 px-4 text-right tabular-nums"
        style={{ color: 'var(--text-primary)' }}
      >
        {formatNumber(entryPrice * displayQty)}
      </td>

      {/* P&L */}
      <td className="py-3 px-4 text-right">
        <div className="font-semibold tabular-nums" style={{ color: pnlColor }}>
          {isProfitable ? '+' : ''}
          {formatNumber(realizedPnl)}
        </div>
        <div className="text-xs tabular-nums" style={{ color: pnlColor }}>
          {pnlPct >= 0 ? '+' : ''}
          {pnlPct.toFixed(2)}%
        </div>
      </td>

      {/* Fee - show more precision for small fees */}
      <td
        className="py-3 px-4 text-right tabular-nums text-xs"
        style={{ color: 'var(--text-secondary)' }}
      >
        -
        {(position.fee || 0) < 0.01 && (position.fee || 0) > 0
          ? (position.fee || 0).toFixed(4)
          : (position.fee || 0).toFixed(2)}
      </td>

      {/* Duration */}
      <td
        className="py-3 px-4 text-center text-sm tabular-nums"
        style={{ color: 'var(--text-secondary)' }}
      >
        {formatDuration(holdingMinutes)}
      </td>

      {/* Exit Time */}
      <td
        className="py-3 px-4 text-right text-xs tabular-nums"
        style={{ color: 'var(--text-secondary)' }}
      >
        {formatDate(position.exit_time)}
      </td>
    </tr>
  )
}

export function PositionHistory({ traderId }: PositionHistoryProps) {
  const { language } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [positions, setPositions] = useState<HistoricalPosition[]>([])
  const [stats, setStats] = useState<TraderStats | null>(null)
  const [symbolStats, setSymbolStats] = useState<SymbolStats[]>([])
  const [directionStats, setDirectionStats] = useState<DirectionStats[]>([])

  // Pagination state
  const [pageSize, setPageSize] = useState<number>(20)
  const [currentPage, setCurrentPage] = useState<number>(1)

  // Filter state
  const [filterSymbol, setFilterSymbol] = useState<string>('all')
  const [filterSide, setFilterSide] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'time' | 'pnl' | 'pnl_pct'>('time')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        // Fetch more data than needed to support filtering, but respect pageSize for initial load
        const data = await api.getPositionHistory(
          traderId,
          Math.max(200, pageSize * 5)
        )
        setPositions(data.positions || [])
        setStats(data.stats)
        setSymbolStats(data.symbol_stats || [])
        setDirectionStats(data.direction_stats || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load history')
      } finally {
        setLoading(false)
      }
    }

    if (traderId) {
      fetchData()
    }
  }, [traderId, pageSize])

  // Get unique symbols for filter
  const uniqueSymbols = useMemo(() => {
    const symbols = new Set(positions.map((p) => p.symbol))
    return Array.from(symbols).sort()
  }, [positions])

  // Filtered and sorted positions (before pagination)
  const filteredAndSortedPositions = useMemo(() => {
    let result = [...positions]

    // Apply filters
    if (filterSymbol !== 'all') {
      result = result.filter((p) => p.symbol === filterSymbol)
    }
    if (filterSide !== 'all') {
      result = result.filter(
        (p) => (p.side || '').toUpperCase() === filterSide.toUpperCase()
      )
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'time':
          comparison =
            new Date(a.exit_time || 0).getTime() -
            new Date(b.exit_time || 0).getTime()
          break
        case 'pnl':
          comparison = (a.realized_pnl || 0) - (b.realized_pnl || 0)
          break
        case 'pnl_pct': {
          const aPrice = a.entry_price || 1
          const bPrice = b.entry_price || 1
          const aPct = (((a.exit_price || 0) - aPrice) / aPrice) * 100
          const bPct = (((b.exit_price || 0) - bPrice) / bPrice) * 100
          comparison = aPct - bPct
          break
        }
      }
      return sortOrder === 'desc' ? -comparison : comparison
    })

    return result
  }, [positions, filterSymbol, filterSide, sortBy, sortOrder])

  // Pagination calculations
  const totalFilteredCount = filteredAndSortedPositions.length
  const totalPages = Math.ceil(totalFilteredCount / pageSize)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filterSymbol, filterSide, sortBy, sortOrder, pageSize])

  // Paginated positions (for display)
  const paginatedPositions = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredAndSortedPositions.slice(startIndex, startIndex + pageSize)
  }, [filteredAndSortedPositions, currentPage, pageSize])

  // For backwards compatibility, keep filteredPositions as the paginated result
  const filteredPositions = paginatedPositions

  // Calculate profit/loss ratio (avg win / avg loss)
  const profitLossRatio = useMemo(() => {
    if (!stats) return 0
    const avgWin = stats.avg_win || 0
    const avgLoss = stats.avg_loss || 0
    if (avgLoss === 0) return avgWin > 0 ? Infinity : 0
    return avgWin / avgLoss
  }, [stats])

  if (loading) {
    return (
      <div
        className="gl-panel rounded-2xl overflow-hidden p-12 flex items-center justify-center gap-3"
        style={{ color: 'var(--text-secondary)' }}
      >
        <span
          className="animate-spin inline-flex"
          style={{ color: 'var(--accent-primary)' }}
        >
          <HugeiconsIcon icon={Loading03Icon} size={22} strokeWidth={2.2} />
        </span>
        <span className="text-sm font-medium">
          {t('positionHistory.loading', language)}
        </span>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="rounded-2xl overflow-hidden p-6 text-center text-sm font-medium"
        style={{
          background: 'var(--binance-red-bg)',
          border: '1px solid rgba(246, 70, 93, 0.3)',
          color: 'var(--binance-red)',
        }}
      >
        {error}
      </div>
    )
  }

  if (positions.length === 0) {
    return (
      <div className="gl-metal-panel rounded-2xl overflow-hidden">
        <EmptyState
          compact
          icon={Analytics02Icon}
          title={t('positionHistory.noHistory', language)}
          description={t('positionHistory.noHistoryDesc', language)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overall Stats - Row 1: Core Metrics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <StatCard
            icon={Analytics02Icon}
            title={t('positionHistory.totalTrades', language)}
            value={stats.total_trades || 0}
            subtitle={t('positionHistory.winLoss', language, {
              win: stats.win_trades || 0,
              loss: stats.loss_trades || 0,
            })}
            language={language}
          />
          <StatCard
            icon={Target01Icon}
            title={t('positionHistory.winRate', language)}
            value={(stats.win_rate || 0).toFixed(1)}
            suffix="%"
            color={
              (stats.win_rate || 0) >= 60
                ? 'var(--binance-green)'
                : (stats.win_rate || 0) >= 40
                  ? 'var(--nofx-gold)'
                  : 'var(--binance-red)'
            }
            metricKey="win_rate"
            language={language}
          />
          <StatCard
            icon={MoneyBag02Icon}
            title={t('positionHistory.totalPnL', language)}
            value={
              ((stats.total_pnl || 0) >= 0 ? '+' : '') +
              formatNumber(stats.total_pnl || 0)
            }
            color={
              (stats.total_pnl || 0) >= 0
                ? 'var(--binance-green)'
                : 'var(--binance-red)'
            }
            subtitle={`${t('positionHistory.fee', language)}: -${formatNumber(stats.total_fee || 0)}`}
            metricKey="total_return"
            language={language}
          />
          <StatCard
            icon={ChartIncreaseIcon}
            title={t('positionHistory.profitFactor', language)}
            value={(stats.profit_factor || 0).toFixed(2)}
            color={
              (stats.profit_factor || 0) >= 1.5
                ? 'var(--binance-green)'
                : (stats.profit_factor || 0) >= 1
                  ? 'var(--nofx-gold)'
                  : 'var(--binance-red)'
            }
            subtitle={t('positionHistory.profitFactorDesc', language)}
            metricKey="profit_factor"
            language={language}
          />
          <StatCard
            icon={WeightScaleIcon}
            title={t('positionHistory.plRatio', language)}
            value={
              profitLossRatio === Infinity ? '∞' : profitLossRatio.toFixed(2)
            }
            color={
              profitLossRatio >= 1.5
                ? 'var(--binance-green)'
                : profitLossRatio >= 1
                  ? 'var(--nofx-gold)'
                  : 'var(--binance-red)'
            }
            subtitle={t('positionHistory.plRatioDesc', language)}
            metricKey="expectancy"
            language={language}
          />
        </div>
      )}

      {/* Overall Stats - Row 2: Advanced Metrics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <StatCard
            icon={ChartLineData01Icon}
            title={t('positionHistory.sharpeRatio', language)}
            value={(stats.sharpe_ratio || 0).toFixed(2)}
            color={
              (stats.sharpe_ratio || 0) >= 1
                ? 'var(--binance-green)'
                : (stats.sharpe_ratio || 0) >= 0
                  ? 'var(--nofx-gold)'
                  : 'var(--binance-red)'
            }
            subtitle={t('positionHistory.sharpeRatioDesc', language)}
            metricKey="sharpe_ratio"
            language={language}
          />
          <StatCard
            icon={ChartDownIcon}
            title={t('positionHistory.maxDrawdown', language)}
            value={(stats.max_drawdown_pct || 0).toFixed(1)}
            suffix="%"
            color={
              (stats.max_drawdown_pct || 0) <= 10
                ? 'var(--binance-green)'
                : (stats.max_drawdown_pct || 0) <= 20
                  ? 'var(--nofx-gold)'
                  : 'var(--binance-red)'
            }
            metricKey="max_drawdown"
            language={language}
          />
          <StatCard
            icon={Award01Icon}
            title={t('positionHistory.avgWin', language)}
            value={'+' + formatNumber(stats.avg_win || 0)}
            color="var(--binance-green)"
            metricKey="avg_trade_pnl"
            language={language}
          />
          <StatCard
            icon={TradeDownIcon}
            title={t('positionHistory.avgLoss', language)}
            value={'-' + formatNumber(stats.avg_loss || 0)}
            color="var(--binance-red)"
            language={language}
          />
          <StatCard
            icon={DollarCircleIcon}
            title={t('positionHistory.netPnL', language)}
            value={
              ((stats.total_pnl || 0) - (stats.total_fee || 0) >= 0
                ? '+'
                : '') +
              formatNumber((stats.total_pnl || 0) - (stats.total_fee || 0))
            }
            color={
              (stats.total_pnl || 0) - (stats.total_fee || 0) >= 0
                ? 'var(--binance-green)'
                : 'var(--binance-red)'
            }
            subtitle={t('positionHistory.netPnLDesc', language)}
            language={language}
          />
        </div>
      )}

      {/* Direction Stats */}
      {directionStats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {directionStats.map((stat) => (
            <DirectionStatsCard
              key={stat.side}
              stat={stat}
              language={language}
            />
          ))}
        </div>
      )}

      {/* Symbol Performance */}
      {symbolStats.length > 0 && (
        <div className="gl-prism-panel rounded-2xl overflow-hidden">
          <SectionHead
            icon={Medal01Icon}
            title={t('positionHistory.symbolPerformance', language)}
            delay="-1.2s"
          />
          <div className="p-3 space-y-1 dash-scroll">
            {symbolStats.slice(0, 10).map((stat) => (
              <SymbolStatsRow key={stat.symbol} stat={stat} />
            ))}
          </div>
        </div>
      )}

      {/* Position List */}
      <div className="gl-prism-panel rounded-2xl overflow-hidden">
        <SectionHead
          icon={ChartLineData01Icon}
          title={t('positionHistory.closedAt', language)}
          delay="-2.4s"
        />

        {/* Filters */}
        <div
          className="flex flex-wrap items-center gap-4 p-4"
          style={{ borderBottom: '1px solid var(--panel-border)' }}
        >
          <div className="flex items-center gap-2">
            <span className="dash-ico">
              <HugeiconsIcon icon={FilterIcon} size={15} strokeWidth={1.9} />
            </span>
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {t('positionHistory.symbol', language)}
            </span>
            <select
              value={filterSymbol}
              onChange={(e) => setFilterSymbol(e.target.value)}
              className="dash-select text-sm"
            >
              <option value="all">
                {t('positionHistory.allSymbols', language)}
              </option>
              {uniqueSymbols.map((symbol) => (
                <option key={symbol} value={symbol}>
                  {(symbol || '').replace('USDT', '')}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {t('positionHistory.side', language)}
            </span>
            <div className="gl-seg">
              {['all', 'LONG', 'SHORT'].map((side) => (
                <button
                  key={side}
                  onClick={() => setFilterSide(side)}
                  data-active={filterSide === side ? 'true' : 'false'}
                  className="gl-seg-item capitalize"
                >
                  {side === 'all' ? t('positionHistory.all', language) : side}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {t('positionHistory.sort', language)}
            </span>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [by, order] = e.target.value.split('-') as [
                  'time' | 'pnl' | 'pnl_pct',
                  'asc' | 'desc',
                ]
                setSortBy(by)
                setSortOrder(order)
              }}
              className="dash-select text-sm"
            >
              <option value="time-desc">
                {t('positionHistory.latestFirst', language)}
              </option>
              <option value="time-asc">
                {t('positionHistory.oldestFirst', language)}
              </option>
              <option value="pnl-desc">
                {t('positionHistory.highestPnL', language)}
              </option>
              <option value="pnl-asc">
                {t('positionHistory.lowestPnL', language)}
              </option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto dash-scroll">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  borderBottom: '1px solid var(--panel-border)',
                }}
              >
                <th
                  className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {t('positionHistory.symbol', language)}
                </th>
                <th
                  className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {t('positionHistory.entry', language)}
                </th>
                <th
                  className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {t('positionHistory.exit', language)}
                </th>
                <th
                  className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {t('positionHistory.qty', language)}
                </th>
                <th
                  className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {t('positionHistory.value', language)}
                </th>
                <th
                  className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {t('positionHistory.pnl', language)}
                </th>
                <th
                  className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {t('positionHistory.fee', language)}
                </th>
                <th
                  className="py-3 px-4 text-center text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {t('positionHistory.duration', language)}
                </th>
                <th
                  className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {t('positionHistory.closedAt', language)}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPositions.map((position) => (
                <PositionRow key={position.id} position={position} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer with Pagination */}
        <div
          className="flex flex-wrap items-center justify-between gap-4 p-4 text-sm"
          style={{
            borderTop: '1px solid var(--panel-border)',
            color: 'var(--text-tertiary)',
          }}
        >
          {/* Left: Count info */}
          <div className="flex items-center gap-4">
            <span className="tabular-nums">
              {t('positionHistory.showingPositions', language, {
                count: totalFilteredCount,
                total: positions.length,
              })}
            </span>
            {totalFilteredCount > 0 && (
              <span className="tabular-nums">
                {t('positionHistory.totalPnL', language)}:{' '}
                <span
                  className="font-semibold"
                  style={{
                    color:
                      filteredAndSortedPositions.reduce(
                        (sum, p) => sum + (p.realized_pnl || 0),
                        0
                      ) >= 0
                        ? 'var(--binance-green)'
                        : 'var(--binance-red)',
                  }}
                >
                  {filteredAndSortedPositions.reduce(
                    (sum, p) => sum + (p.realized_pnl || 0),
                    0
                  ) >= 0
                    ? '+'
                    : ''}
                  {formatNumber(
                    filteredAndSortedPositions.reduce(
                      (sum, p) => sum + (p.realized_pnl || 0),
                      0
                    )
                  )}
                </span>
              </span>
            )}
          </div>

          {/* Right: Pagination controls */}
          <div className="flex items-center gap-3">
            {/* Page size selector */}
            <div className="flex items-center gap-2">
              <span
                className="text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {language === 'zh' ? '每页' : 'Per page'}
              </span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="dash-select text-sm"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* Page navigation */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="dash-page-btn disabled:opacity-30"
                  aria-label="First page"
                >
                  <HugeiconsIcon
                    icon={ArrowLeftDoubleIcon}
                    size={15}
                    strokeWidth={2}
                  />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="dash-page-btn disabled:opacity-30"
                  aria-label="Previous page"
                >
                  <HugeiconsIcon
                    icon={ArrowLeft01Icon}
                    size={15}
                    strokeWidth={2}
                  />
                </button>
                <span
                  className="px-3 text-xs font-semibold tabular-nums"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="dash-page-btn disabled:opacity-30"
                  aria-label="Next page"
                >
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    size={15}
                    strokeWidth={2}
                  />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="dash-page-btn disabled:opacity-30"
                  aria-label="Last page"
                >
                  <HugeiconsIcon
                    icon={ArrowRightDoubleIcon}
                    size={15}
                    strokeWidth={2}
                  />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
