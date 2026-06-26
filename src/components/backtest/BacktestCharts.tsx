import { memo, useEffect, useMemo, useRef, useState } from 'react'
import {
  createChart,
  ColorType,
  CrosshairMode,
  CandlestickSeries,
  createSeriesMarkers,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type UTCTimestamp,
  type SeriesMarker,
} from 'lightweight-charts'
import { Loader2 } from 'lucide-react'
import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'
import {
  TradeUpIcon,
  TradeDownIcon,
  Activity01Icon,
  ChartBarLineIcon,
  AlertCircleIcon,
  CancelCircleIcon,
  Clock01Icon,
  ArrowUpRight01Icon,
  ArrowDownRight01Icon,
} from '@hugeicons/core-free-icons'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceDot,
} from 'recharts'
import { api } from '../../lib/api'
import { MetricTooltip } from '../MetricTooltip'
import type {
  BacktestPositionStatus,
  BacktestEquityPoint,
  BacktestTradeEvent,
  BacktestKlinesResponse,
} from '../../types'
import {
  downsampleSeries,
  findClosestEquityIndex,
  MAX_CHART_POINTS,
} from './backtestShared'
import type { Language } from '../../i18n/translations'

export const StatCard = memo(function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  trend,
  color = 'var(--text-primary)',
  metricKey,
  language = 'en',
}: {
  icon: IconSvgElement
  label: string
  value: string | number
  suffix?: string
  trend?: 'up' | 'down' | 'neutral'
  color?: string
  metricKey?: string
  language?: string
}) {
  const trendColors = {
    up: 'var(--binance-green)',
    down: 'var(--binance-red)',
    neutral: 'var(--text-secondary)',
  }

  return (
    <div className="gl-metal-panel rounded-xl p-4 relative overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-2">
            <span
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {label}
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
              className="text-xl font-bold tabular-nums gl-metal-text"
              style={color === 'var(--text-primary)' ? undefined : { color }}
            >
              {value}
            </span>
            {suffix && (
              <span
                className="text-[11px] font-semibold"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {suffix}
              </span>
            )}
            {trend && trend !== 'neutral' && (
              <span
                className="inline-flex items-center"
                style={{ color: trendColors[trend] }}
              >
                <HugeiconsIcon
                  icon={
                    trend === 'up' ? ArrowUpRight01Icon : ArrowDownRight01Icon
                  }
                  size={16}
                  strokeWidth={2.4}
                />
              </span>
            )}
          </div>
        </div>
        <span className="dash-kpi-ico shrink-0">
          <HugeiconsIcon icon={Icon} size={19} strokeWidth={1.8} />
        </span>
      </div>
    </div>
  )
})

export const ProgressRing = memo(function ProgressRing({
  progress,
  size = 120,
}: {
  progress: number
  size?: number
}) {
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--surface-tertiary)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--accent-primary)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <span className="text-2xl font-bold tabular-nums gl-metal-text">
          {progress.toFixed(0)}%
        </span>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Complete
        </span>
      </div>
    </div>
  )
})

export const BacktestChart = memo(function BacktestChart({
  equity,
  trades,
}: {
  equity: BacktestEquityPoint[]
  trades: BacktestTradeEvent[]
}) {
  const chartData = useMemo(() => {
    return downsampleSeries(equity, MAX_CHART_POINTS).map((point) => ({
      time: new Date(point.ts).toLocaleString(),
      ts: point.ts,
      equity: point.equity,
      pnl_pct: point.pnl_pct,
    }))
  }, [equity])

  const tradeMarkers = useMemo(() => {
    if (!trades.length || !chartData.length) return []
    const tsToIndex = new Map(chartData.map((d, i) => [d.ts, i]))
    const sampledEquity = downsampleSeries(equity, MAX_CHART_POINTS)
    return trades
      .filter((t) => t.action.includes('open') || t.action.includes('close'))
      .map((trade) => {
        const closestIdx = findClosestEquityIndex(sampledEquity, trade.ts)
        if (closestIdx < 0) return null
        const closest = sampledEquity[closestIdx]
        return {
          index: tsToIndex.get(closest.ts) ?? -1,
          ts: closest.ts,
          equity: closest.equity,
          isOpen: trade.action.includes('open'),
        }
      })
      .filter((m): m is NonNullable<typeof m> => m !== null && m.index >= 0)
      .slice(-30)
  }, [trades, equity, chartData])

  return (
    <div className="w-full" style={{ height: 300 }}>
      <ResponsiveContainer width="100%" height={300} minWidth={0}>
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--accent-primary)"
                stopOpacity={0.4}
              />
              <stop
                offset="95%"
                stopColor="var(--accent-primary)"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(43, 49, 57, 0.5)" strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            tick={{ fill: '#848E9C', fontSize: 10 }}
            axisLine={{ stroke: '#2B3139' }}
            tickLine={{ stroke: '#2B3139' }}
            hide
          />
          <YAxis
            tick={{ fill: '#848E9C', fontSize: 10 }}
            axisLine={{ stroke: '#2B3139' }}
            tickLine={{ stroke: '#2B3139' }}
            width={60}
            domain={['auto', 'auto']}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--surface-secondary)',
              border: '1px solid var(--surface-tertiary)',
              borderRadius: 8,
              color: 'var(--text-primary)',
            }}
            labelStyle={{ color: 'var(--text-secondary)' }}
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Equity']}
          />
          <Area
            type="monotone"
            dataKey="equity"
            stroke="var(--accent-primary)"
            strokeWidth={2}
            fill="url(#equityGradient)"
            dot={false}
            activeDot={{ r: 4, fill: 'var(--accent-primary)' }}
          />
          {tradeMarkers.map((marker, idx) => (
            <ReferenceDot
              key={`${marker.ts}-${idx}`}
              x={marker.index}
              y={marker.equity}
              r={4}
              fill={marker.isOpen ? '#0ECB81' : '#F6465D'}
              stroke={marker.isOpen ? '#0ECB81' : '#F6465D'}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
})

type BacktestKline = BacktestKlinesResponse['klines'][number]

export function buildTradeMarkers(
  klines: BacktestKline[],
  symbolTrades: BacktestTradeEvent[]
): SeriesMarker<UTCTimestamp>[] {
  if (!klines.length || !symbolTrades.length) return []

  return symbolTrades
    .map((trade) => {
      const tradeTime = Math.floor(trade.ts / 1000)
      const closestKline = klines.reduce((prev, curr) =>
        Math.abs(curr.time - tradeTime) < Math.abs(prev.time - tradeTime)
          ? curr
          : prev
      )
      const isOpen = trade.action.includes('open')
      const isLong = trade.side === 'long' || trade.action.includes('long')
      const pnl = trade.realized_pnl

      let text = ''
      let color = '#0ECB81'

      if (isOpen) {
        if (isLong) {
          text = `▲ Long @${trade.price.toFixed(2)}`
          color = '#0ECB81'
        } else {
          text = `▼ Short @${trade.price.toFixed(2)}`
          color = '#F6465D'
        }
      } else {
        const pnlStr =
          pnl >= 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`
        text = `✕ ${pnlStr}`
        color = pnl >= 0 ? '#0ECB81' : '#F6465D'
      }

      return {
        time: closestKline.time as UTCTimestamp,
        position: isOpen
          ? isLong
            ? ('belowBar' as const)
            : ('aboveBar' as const)
          : isLong
            ? ('aboveBar' as const)
            : ('belowBar' as const),
        color,
        shape: 'circle' as const,
        size: 2,
        text,
      }
    })
    .sort((a, b) => (a.time as number) - (b.time as number))
}

export const CandlestickChartComponent = memo(
  function CandlestickChartComponent({
    runId,
    trades,
    language,
  }: {
    runId: string
    trades: BacktestTradeEvent[]
    language: Language
  }) {
    const chartContainerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<IChartApi | null>(null)
    const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
    const klinesRef = useRef<BacktestKline[]>([])

    const symbols = useMemo(() => {
      const symbolSet = new Set(trades.map((t) => t.symbol))
      return Array.from(symbolSet).sort()
    }, [trades])

    const [selectedSymbol, setSelectedSymbol] = useState<string>(
      symbols[0] || ''
    )
    const [selectedTimeframe, setSelectedTimeframe] = useState<string>('15m')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const CHART_TIMEFRAMES = ['1m', '3m', '5m', '15m', '30m', '1h', '4h', '1d']

    useEffect(() => {
      if (symbols.length > 0 && !symbols.includes(selectedSymbol)) {
        setSelectedSymbol(symbols[0])
      }
    }, [symbols, selectedSymbol])

    const symbolTrades = useMemo(() => {
      return trades.filter((t) => t.symbol === selectedSymbol)
    }, [trades, selectedSymbol])

    useEffect(() => {
      if (!chartContainerRef.current || !selectedSymbol || !runId) return

      const container = chartContainerRef.current
      let cancelled = false

      const chart = createChart(container, {
        layout: {
          background: { type: ColorType.Solid, color: '#0B0E11' },
          textColor: '#848E9C',
        },
        grid: {
          vertLines: { color: 'rgba(43, 49, 57, 0.5)' },
          horzLines: { color: 'rgba(43, 49, 57, 0.5)' },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
        },
        rightPriceScale: {
          borderColor: '#2B3139',
        },
        timeScale: {
          borderColor: '#2B3139',
          timeVisible: true,
          secondsVisible: false,
        },
        width: container.clientWidth,
        height: 400,
      })

      chartRef.current = chart

      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#0ECB81',
        downColor: '#F6465D',
        borderUpColor: '#0ECB81',
        borderDownColor: '#F6465D',
        wickUpColor: '#0ECB81',
        wickDownColor: '#F6465D',
      })
      candleSeriesRef.current = candleSeries
      klinesRef.current = []

      setIsLoading(true)
      setError(null)

      api
        .getBacktestKlines(runId, selectedSymbol, selectedTimeframe)
        .then((data: BacktestKlinesResponse) => {
          if (cancelled) return

          klinesRef.current = data.klines
          const klineData: CandlestickData<UTCTimestamp>[] = data.klines.map(
            (k) => ({
              time: k.time as UTCTimestamp,
              open: k.open,
              high: k.high,
              low: k.low,
              close: k.close,
            })
          )
          candleSeries.setData(klineData)
          createSeriesMarkers(
            candleSeries,
            buildTradeMarkers(data.klines, symbolTrades)
          )
          chart.timeScale().fitContent()
          setIsLoading(false)
        })
        .catch((err) => {
          if (cancelled) return
          setError(err instanceof Error ? err.message : 'Failed to load klines')
          setIsLoading(false)
        })

      const handleResize = () => {
        if (chartContainerRef.current) {
          chart.applyOptions({ width: chartContainerRef.current.clientWidth })
        }
      }
      window.addEventListener('resize', handleResize)

      return () => {
        cancelled = true
        window.removeEventListener('resize', handleResize)
        chart.remove()
        chartRef.current = null
        candleSeriesRef.current = null
        klinesRef.current = []
      }
    }, [runId, selectedSymbol, selectedTimeframe])

    useEffect(() => {
      const series = candleSeriesRef.current
      const klines = klinesRef.current
      if (!series || klines.length === 0) return
      createSeriesMarkers(series, buildTradeMarkers(klines, symbolTrades))
    }, [symbolTrades])

    if (symbols.length === 0) {
      return (
        <div
          className="py-12 text-center"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {language === 'zh' ? '没有交易记录' : 'No trades to display'}
        </div>
      )
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="dash-ico">
              <HugeiconsIcon
                icon={ChartBarLineIcon}
                size={15}
                strokeWidth={1.9}
              />
            </span>
            <span
              className="text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              {language === 'zh' ? '币种' : 'Symbol'}
            </span>
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="dash-select"
            >
              {symbols.map((sym) => (
                <option key={sym} value={sym}>
                  {sym}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <HugeiconsIcon
              icon={Clock01Icon}
              size={14}
              strokeWidth={1.9}
              style={{ color: 'var(--text-secondary)' }}
            />
            <span
              className="text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              {language === 'zh' ? '周期' : 'Interval'}
            </span>
            <div
              className="flex rounded-lg overflow-hidden"
              style={{ border: '1px solid var(--panel-border)' }}
            >
              {CHART_TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setSelectedTimeframe(tf)}
                  className="px-2.5 py-1 text-xs font-semibold transition-colors"
                  style={{
                    background:
                      selectedTimeframe === tf
                        ? 'var(--accent-primary)'
                        : 'var(--surface-secondary)',
                    color:
                      selectedTimeframe === tf
                        ? '#fff'
                        : 'var(--text-secondary)',
                  }}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            ({symbolTrades.length} {language === 'zh' ? '笔交易' : 'trades'})
          </span>
        </div>

        <div
          ref={chartContainerRef}
          className="w-full rounded-lg overflow-hidden"
          style={{ background: 'var(--surface-primary)', minHeight: 400 }}
        >
          {isLoading && (
            <div
              className="flex items-center justify-center h-[400px]"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Loader2 className="animate-spin mr-2" size={16} />
              {language === 'zh' ? '加载K线数据...' : 'Loading kline data...'}
            </div>
          )}
          {error && (
            <div
              className="flex items-center justify-center h-[400px]"
              style={{ color: 'var(--binance-red)' }}
            >
              <HugeiconsIcon
                icon={AlertCircleIcon}
                size={16}
                strokeWidth={1.9}
                className="mr-2"
              />
              {error}
            </div>
          )}
        </div>

        <div
          className="flex items-center gap-4 text-xs"
          style={{ color: 'var(--text-secondary)' }}
        >
          <div className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: 'var(--binance-green)' }}
            />
            <span>{language === 'zh' ? '开仓/盈利' : 'Open/Profit'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: 'var(--binance-red)' }}
            />
            <span>{language === 'zh' ? '亏损平仓' : 'Loss Close'}</span>
          </div>
          <span style={{ color: 'var(--text-tertiary)' }}>|</span>
          <span className="inline-flex items-center gap-1.5">
            <HugeiconsIcon
              icon={TradeUpIcon}
              size={13}
              strokeWidth={2}
              style={{ color: 'var(--binance-green)' }}
            />{' '}
            Long
            <span style={{ color: 'var(--text-tertiary)' }}>·</span>
            <HugeiconsIcon
              icon={TradeDownIcon}
              size={13}
              strokeWidth={2}
              style={{ color: 'var(--binance-red)' }}
            />{' '}
            Short
            <span style={{ color: 'var(--text-tertiary)' }}>·</span>
            <HugeiconsIcon
              icon={CancelCircleIcon}
              size={13}
              strokeWidth={2}
            />{' '}
            {language === 'zh' ? '平仓' : 'Close'}
          </span>
        </div>
      </div>
    )
  }
)

export const TradeTimeline = memo(function TradeTimeline({
  trades,
}: {
  trades: BacktestTradeEvent[]
}) {
  const recentTrades = useMemo(() => [...trades].slice(-20).reverse(), [trades])

  if (recentTrades.length === 0) {
    return (
      <div
        className="py-12 text-center"
        style={{ color: 'var(--text-tertiary)' }}
      >
        No trades yet
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
      {recentTrades.map((trade, idx) => {
        const isOpen = trade.action.includes('open')
        const isLong = trade.action.includes('long')
        const bgColor = isOpen
          ? 'var(--binance-green-bg)'
          : 'var(--binance-red-bg)'
        const borderColor = isOpen
          ? 'rgba(14, 203, 129, 0.3)'
          : 'rgba(246, 70, 93, 0.3)'
        const iconColor = isOpen ? '#0ECB81' : '#F6465D'

        return (
          <div
            key={`${trade.ts}-${trade.symbol}-${idx}`}
            className="p-3 rounded-lg flex items-center gap-3"
            style={{ background: bgColor, border: `1px solid ${borderColor}` }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: `${iconColor}20` }}
            >
              <HugeiconsIcon
                icon={isLong ? TradeUpIcon : TradeDownIcon}
                size={16}
                strokeWidth={2}
                style={{ color: iconColor }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="font-mono font-bold text-sm"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {trade.symbol.replace('USDT', '')}
                </span>
                <span
                  className="px-2 py-0.5 rounded text-xs font-medium"
                  style={{ background: `${iconColor}20`, color: iconColor }}
                >
                  {trade.action.replace('_', ' ').toUpperCase()}
                </span>
                {trade.leverage && (
                  <span
                    className="text-xs"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {trade.leverage}x
                  </span>
                )}
              </div>
              <div
                className="text-xs mt-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                {new Date(trade.ts).toLocaleString()} · Qty:{' '}
                {trade.qty.toFixed(4)} · ${trade.price.toFixed(2)}
              </div>
            </div>
            <div className="text-right">
              <div
                className="font-mono font-bold"
                style={{
                  color:
                    trade.realized_pnl >= 0
                      ? 'var(--binance-green)'
                      : 'var(--binance-red)',
                }}
              >
                {trade.realized_pnl >= 0 ? '+' : ''}
                {trade.realized_pnl.toFixed(2)}
              </div>
              <div
                className="text-xs"
                style={{ color: 'var(--text-secondary)' }}
              >
                USDT
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
})

export const PositionsDisplay = memo(function PositionsDisplay({
  positions,
  language,
}: {
  positions: BacktestPositionStatus[]
  language: Language
}) {
  if (!positions || positions.length === 0) {
    return null
  }

  const totalUnrealizedPnL = positions.reduce(
    (sum, p) => sum + p.unrealized_pnl,
    0
  )
  const totalMargin = positions.reduce((sum, p) => sum + p.margin_used, 0)

  return (
    <div
      className="mt-3 p-3 rounded-lg"
      style={{
        background: 'var(--panel-bg)',
        border: '1px solid var(--surface-tertiary)',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={Activity01Icon}
            size={16}
            strokeWidth={1.9}
            style={{ color: 'var(--accent-primary)' }}
          />
          <span
            className="text-sm font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            {language === 'zh' ? '当前持仓' : 'Active Positions'}
          </span>
          <span
            className="px-1.5 py-0.5 rounded text-xs"
            style={{
              background: 'var(--accent-primary-bg)',
              color: 'var(--accent-primary)',
            }}
          >
            {positions.length}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span style={{ color: 'var(--text-secondary)' }}>
            {language === 'zh' ? '保证金' : 'Margin'}: ${totalMargin.toFixed(2)}
          </span>
          <span
            className="font-medium"
            style={{
              color:
                totalUnrealizedPnL >= 0
                  ? 'var(--binance-green)'
                  : 'var(--binance-red)',
            }}
          >
            {language === 'zh' ? '浮盈' : 'Unrealized'}:{' '}
            {totalUnrealizedPnL >= 0 ? '+' : ''}${totalUnrealizedPnL.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        {positions.map((pos) => {
          const isLong = pos.side === 'long'
          const pnlColor = pos.unrealized_pnl >= 0 ? '#0ECB81' : '#F6465D'

          return (
            <div
              key={`${pos.symbol}-${pos.side}`}
              className="flex items-center justify-between p-2 rounded"
              style={{ background: 'var(--surface-secondary)' }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded flex items-center justify-center"
                  style={{ background: isLong ? '#0ECB8120' : '#F6465D20' }}
                >
                  <HugeiconsIcon
                    icon={isLong ? TradeUpIcon : TradeDownIcon}
                    size={14}
                    strokeWidth={2}
                    style={{
                      color: isLong
                        ? 'var(--binance-green)'
                        : 'var(--binance-red)',
                    }}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="font-mono font-bold text-sm"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {pos.symbol.replace('USDT', '')}
                    </span>
                    <span
                      className="px-1 py-0.5 rounded text-[10px] font-medium"
                      style={{
                        background: isLong ? '#0ECB8120' : '#F6465D20',
                        color: isLong
                          ? 'var(--binance-green)'
                          : 'var(--binance-red)',
                      }}
                    >
                      {isLong ? 'LONG' : 'SHORT'} {pos.leverage}x
                    </span>
                  </div>
                  <div
                    className="text-[10px]"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {language === 'zh' ? '数量' : 'Qty'}:{' '}
                    {pos.quantity.toFixed(4)} ·{' '}
                    {language === 'zh' ? '保证金' : 'Margin'}: $
                    {pos.margin_used.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-2 text-xs">
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {language === 'zh' ? '开仓' : 'Entry'}: $
                    {pos.entry_price.toFixed(2)}
                  </span>
                  <span style={{ color: 'var(--text-primary)' }}>
                    {language === 'zh' ? '现价' : 'Mark'}: $
                    {pos.mark_price.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                  <span
                    className="font-mono font-bold"
                    style={{ color: pnlColor }}
                  >
                    {pos.unrealized_pnl >= 0 ? '+' : ''}$
                    {pos.unrealized_pnl.toFixed(2)}
                  </span>
                  <span
                    className="px-1 py-0.5 rounded text-[10px] font-medium"
                    style={{ background: `${pnlColor}20`, color: pnlColor }}
                  >
                    {pos.unrealized_pnl_pct >= 0 ? '+' : ''}
                    {pos.unrealized_pnl_pct.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})
