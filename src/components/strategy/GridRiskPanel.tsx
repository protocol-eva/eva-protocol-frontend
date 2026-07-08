import { useState, useEffect, useCallback } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Shield01Icon,
  TradeUpIcon,
  AlertCircleIcon,
  Activity01Icon,
  PackageIcon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  GaugeIcon,
} from '@hugeicons/core-free-icons'
import type { GridRiskInfo } from '../../types'

interface GridRiskPanelProps {
  traderId: string
  language?: string
  refreshInterval?: number // ms, default 5000
}

export function GridRiskPanel({
  traderId,
  language = 'en',
  refreshInterval = 5000,
}: GridRiskPanelProps) {
  const [riskInfo, setRiskInfo] = useState<GridRiskInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      // Section titles
      gridRisk: { zh: '网格风控', en: 'Grid Risk' },
      leverageInfo: { zh: '杠杆', en: 'Leverage' },
      positionInfo: { zh: '仓位', en: 'Position' },
      liquidationInfo: { zh: '清算', en: 'Liquidation' },
      marketState: { zh: '市场', en: 'Market' },
      boxState: { zh: '箱体', en: 'Box' },

      // Leverage
      currentLeverage: { zh: '当前', en: 'Current' },
      effectiveLeverage: { zh: '有效', en: 'Effective' },
      recommendedLeverage: { zh: '建议', en: 'Recommend' },

      // Position
      currentPosition: { zh: '当前', en: 'Current' },
      maxPosition: { zh: '最大', en: 'Max' },
      positionPercent: { zh: '占比', en: 'Usage' },

      // Liquidation
      liquidationPrice: { zh: '清算价', en: 'Liq Price' },
      liquidationDistance: { zh: '距离', en: 'Distance' },

      // Market
      regimeLevel: { zh: '波动', en: 'Regime' },
      currentPrice: { zh: '价格', en: 'Price' },
      breakoutLevel: { zh: '突破', en: 'Breakout' },
      breakoutDirection: { zh: '方向', en: 'Direction' },

      // Box
      shortBox: { zh: '短期', en: 'Short' },
      midBox: { zh: '中期', en: 'Mid' },
      longBox: { zh: '长期', en: 'Long' },

      // Regime levels
      narrow: { zh: '窄幅', en: 'Narrow' },
      standard: { zh: '标准', en: 'Standard' },
      wide: { zh: '宽幅', en: 'Wide' },
      volatile: { zh: '剧烈', en: 'Volatile' },
      trending: { zh: '趋势', en: 'Trending' },

      // Breakout levels
      none: { zh: '无', en: 'None' },
      short: { zh: '短期', en: 'Short' },
      mid: { zh: '中期', en: 'Mid' },
      long: { zh: '长期', en: 'Long' },

      // Directions
      up: { zh: '↑', en: '↑' },
      down: { zh: '↓', en: '↓' },

      // Status
      loading: { zh: '加载中...', en: 'Loading...' },
      error: { zh: '加载失败', en: 'Load Failed' },
      noData: { zh: '暂无数据', en: 'No Data' },
    }
    return translations[key]?.[language] || key
  }

  const fetchRiskInfo = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/traders/${traderId}/grid-risk`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      setRiskInfo(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [traderId])

  useEffect(() => {
    fetchRiskInfo()
    const interval = setInterval(fetchRiskInfo, refreshInterval)
    return () => clearInterval(interval)
  }, [fetchRiskInfo, refreshInterval])

  const getRegimeColor = (regime: string) => {
    switch (regime) {
      case 'narrow':
        return '#0ECB81'
      case 'standard':
        return 'var(--accent-primary)'
      case 'wide':
        return '#F7931A'
      case 'volatile':
        return '#F6465D'
      case 'trending':
        return '#8B5CF6'
      default:
        return '#848E9C'
    }
  }

  const getBreakoutColor = (level: string) => {
    switch (level) {
      case 'none':
        return '#0ECB81'
      case 'short':
        return 'var(--accent-primary)'
      case 'mid':
        return '#F7931A'
      case 'long':
        return '#F6465D'
      default:
        return '#848E9C'
    }
  }

  const getPositionColor = (percent: number) => {
    if (percent < 50) return '#0ECB81'
    if (percent < 80) return 'var(--accent-primary)'
    return '#F6465D'
  }

  const formatPrice = (price: number) => {
    if (price === 0) return '-'
    if (price >= 1000)
      return price.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    if (price >= 1) return price.toFixed(4)
    return price.toFixed(6)
  }

  const formatUSD = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  if (loading) {
    return (
      <div className="gl-panel rounded-xl overflow-hidden animate-pulse">
        <div className="flex items-center gap-2.5 px-4 py-3.5">
          <span className="dash-ico">
            <HugeiconsIcon icon={Shield01Icon} size={16} strokeWidth={1.9} />
          </span>
          <div
            className="h-3 w-24 rounded-full"
            style={{ background: 'var(--surface-tertiary)' }}
          />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="gl-panel rounded-xl overflow-hidden">
        <div
          className="flex items-center gap-2.5 px-4 py-3.5 text-xs font-medium"
          style={{ color: 'var(--binance-red)' }}
        >
          <HugeiconsIcon icon={AlertCircleIcon} size={16} strokeWidth={1.9} />
          <span>
            {t('error')}: {error}
          </span>
        </div>
      </div>
    )
  }

  if (!riskInfo) {
    return (
      <div className="gl-panel rounded-xl overflow-hidden">
        <div
          className="flex items-center gap-2.5 px-4 py-3.5 text-xs font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          <HugeiconsIcon icon={Shield01Icon} size={16} strokeWidth={1.9} />
          <span>{t('noData')}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="gl-metal-panel rounded-2xl overflow-hidden">
      {/* Collapsible Header */}
      <div
        className="flex items-center justify-between gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-white/[0.03] active:scale-[0.997]"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="dash-ico">
            <HugeiconsIcon icon={Shield01Icon} size={16} strokeWidth={1.9} />
          </span>
          <h2
            className="text-sm font-semibold uppercase tracking-wider gl-metal-shine truncate"
            style={{ animationDelay: '-1.2s' }}
          >
            {t('gridRisk')}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {/* Summary badges when collapsed */}
          <span
            className="px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wide"
            style={{
              background: getRegimeColor(riskInfo.regime_level) + '1F',
              color: getRegimeColor(riskInfo.regime_level),
              border: `1px solid ${getRegimeColor(riskInfo.regime_level)}33`,
            }}
          >
            {t(riskInfo.regime_level || 'standard')}
          </span>
          <span className="text-sm font-bold tabular-nums gl-metal-text leading-none">
            {riskInfo.effective_leverage.toFixed(1)}x
          </span>
          <span
            className="text-sm font-bold tabular-nums leading-none"
            style={{ color: getPositionColor(riskInfo.position_percent) }}
          >
            {riskInfo.position_percent.toFixed(0)}%
          </span>
          <span
            className="ml-0.5 flex items-center justify-center rounded-lg transition-colors"
            style={{
              width: 26,
              height: 26,
              background: 'var(--surface-tertiary)',
              color: 'var(--text-secondary)',
            }}
          >
            <HugeiconsIcon
              icon={expanded ? ArrowUp01Icon : ArrowDown01Icon}
              size={15}
              strokeWidth={2}
            />
          </span>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div
          className="px-4 pb-4 space-y-3 border-t pt-3"
          style={{ borderColor: 'var(--panel-border)' }}
        >
          {/* Row 1: Leverage & Position */}
          <div className="grid grid-cols-2 gap-3">
            {/* Leverage */}
            <div className="gl-onyx-panel rounded-xl p-3 overflow-hidden">
              <div className="flex items-center gap-1.5 mb-2.5">
                <HugeiconsIcon
                  icon={TradeUpIcon}
                  size={14}
                  strokeWidth={1.9}
                  style={{ color: 'var(--accent-primary)' }}
                />
                <span
                  className="text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {t('leverageInfo')}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                <div>
                  <div
                    className="text-[10px] uppercase tracking-wide mb-0.5"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {t('currentLeverage')}
                  </div>
                  <div className="font-bold tabular-nums gl-metal-text">
                    {riskInfo.current_leverage}x
                  </div>
                </div>
                <div>
                  <div
                    className="text-[10px] uppercase tracking-wide mb-0.5"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {t('effectiveLeverage')}
                  </div>
                  <div
                    className="font-bold tabular-nums"
                    style={{ color: 'var(--accent-primary)' }}
                  >
                    {riskInfo.effective_leverage.toFixed(2)}x
                  </div>
                </div>
                <div>
                  <div
                    className="text-[10px] uppercase tracking-wide mb-0.5"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {t('recommendedLeverage')}
                  </div>
                  <div
                    className="font-bold tabular-nums"
                    style={{
                      color:
                        riskInfo.current_leverage >
                        riskInfo.recommended_leverage
                          ? 'var(--binance-red)'
                          : 'var(--binance-green)',
                    }}
                  >
                    {riskInfo.recommended_leverage}x
                  </div>
                </div>
              </div>
            </div>

            {/* Position */}
            <div className="gl-onyx-panel rounded-xl p-3 overflow-hidden">
              <div className="flex items-center gap-1.5 mb-2.5">
                <HugeiconsIcon
                  icon={Activity01Icon}
                  size={14}
                  strokeWidth={1.9}
                  style={{ color: 'var(--accent-primary)' }}
                />
                <span
                  className="text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {t('positionInfo')}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                <div>
                  <div
                    className="text-[10px] uppercase tracking-wide mb-0.5"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {t('currentPosition')}
                  </div>
                  <div className="font-bold tabular-nums gl-metal-text">
                    {formatUSD(riskInfo.current_position)}
                  </div>
                </div>
                <div>
                  <div
                    className="text-[10px] uppercase tracking-wide mb-0.5"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {t('maxPosition')}
                  </div>
                  <div className="font-bold tabular-nums gl-metal-text">
                    {formatUSD(riskInfo.max_position)}
                  </div>
                </div>
                <div>
                  <div
                    className="text-[10px] uppercase tracking-wide mb-0.5"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {t('positionPercent')}
                  </div>
                  <div
                    className="font-bold tabular-nums"
                    style={{
                      color: getPositionColor(riskInfo.position_percent),
                    }}
                  >
                    {riskInfo.position_percent.toFixed(1)}%
                  </div>
                </div>
              </div>
              {/* Mini progress bar */}
              <div
                className="h-1.5 mt-2.5 rounded-full overflow-hidden"
                style={{
                  background: 'var(--surface-tertiary)',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)',
                }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(riskInfo.position_percent, 100)}%`,
                    background: `linear-gradient(90deg, ${getPositionColor(riskInfo.position_percent)}99, ${getPositionColor(riskInfo.position_percent)})`,
                    boxShadow: `0 0 8px ${getPositionColor(riskInfo.position_percent)}66`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Row 2: Market State & Liquidation */}
          <div className="grid grid-cols-2 gap-3">
            {/* Market State */}
            <div className="gl-onyx-panel rounded-xl p-3 overflow-hidden">
              <div className="flex items-center gap-1.5 mb-2.5">
                <HugeiconsIcon
                  icon={GaugeIcon}
                  size={14}
                  strokeWidth={1.9}
                  style={{ color: 'var(--accent-primary)' }}
                />
                <span
                  className="text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {t('marketState')}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div
                    className="text-[10px] uppercase tracking-wide mb-0.5"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {t('regimeLevel')}
                  </div>
                  <div
                    className="font-bold"
                    style={{ color: getRegimeColor(riskInfo.regime_level) }}
                  >
                    {t(riskInfo.regime_level || 'standard')}
                  </div>
                </div>
                <div>
                  <div
                    className="text-[10px] uppercase tracking-wide mb-0.5"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {t('currentPrice')}
                  </div>
                  <div className="font-bold tabular-nums gl-metal-text">
                    {formatPrice(riskInfo.current_price)}
                  </div>
                </div>
                <div>
                  <div
                    className="text-[10px] uppercase tracking-wide mb-0.5"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {t('breakoutLevel')}
                  </div>
                  <div
                    className="font-bold"
                    style={{ color: getBreakoutColor(riskInfo.breakout_level) }}
                  >
                    {t(riskInfo.breakout_level || 'none')}
                  </div>
                </div>
                <div>
                  <div
                    className="text-[10px] uppercase tracking-wide mb-0.5"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {t('breakoutDirection')}
                  </div>
                  <div
                    className="font-bold inline-flex items-center gap-1"
                    style={{
                      color:
                        riskInfo.breakout_direction === 'up'
                          ? 'var(--binance-green)'
                          : riskInfo.breakout_direction === 'down'
                            ? 'var(--binance-red)'
                            : 'var(--text-secondary)',
                    }}
                  >
                    {riskInfo.breakout_direction ? (
                      <HugeiconsIcon
                        icon={
                          riskInfo.breakout_direction === 'up'
                            ? ArrowUp01Icon
                            : ArrowDown01Icon
                        }
                        size={14}
                        strokeWidth={2.4}
                      />
                    ) : (
                      '-'
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Liquidation */}
            <div className="gl-onyx-panel rounded-xl p-3 overflow-hidden">
              <div className="flex items-center gap-1.5 mb-2.5">
                <HugeiconsIcon
                  icon={AlertCircleIcon}
                  size={14}
                  strokeWidth={1.9}
                  style={{ color: 'var(--binance-red)' }}
                />
                <span
                  className="text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {t('liquidationInfo')}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div
                    className="text-[10px] uppercase tracking-wide mb-0.5"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {t('liquidationPrice')}
                  </div>
                  <div
                    className="font-bold tabular-nums"
                    style={{ color: 'var(--binance-red)' }}
                  >
                    {riskInfo.liquidation_price > 0
                      ? formatPrice(riskInfo.liquidation_price)
                      : '-'}
                  </div>
                </div>
                <div>
                  <div
                    className="text-[10px] uppercase tracking-wide mb-0.5"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {t('liquidationDistance')}
                  </div>
                  <div
                    className="font-bold tabular-nums"
                    style={{ color: 'var(--binance-red)' }}
                  >
                    {riskInfo.liquidation_distance > 0
                      ? `${riskInfo.liquidation_distance.toFixed(1)}%`
                      : '-'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Box State */}
          <div className="gl-onyx-panel rounded-xl p-3 overflow-hidden">
            <div className="flex items-center gap-1.5 mb-2.5">
              <HugeiconsIcon
                icon={PackageIcon}
                size={14}
                strokeWidth={1.9}
                style={{ color: 'var(--accent-primary)' }}
              />
              <span
                className="text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-secondary)' }}
              >
                {t('boxState')}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="flex justify-between gap-1">
                <span
                  className="text-[10px] uppercase tracking-wide"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {t('shortBox')}
                </span>
                <span
                  className="font-semibold tabular-nums"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {formatPrice(riskInfo.short_box_lower)} -{' '}
                  {formatPrice(riskInfo.short_box_upper)}
                </span>
              </div>
              <div className="flex justify-between gap-1">
                <span
                  className="text-[10px] uppercase tracking-wide"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {t('midBox')}
                </span>
                <span
                  className="font-semibold tabular-nums"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {formatPrice(riskInfo.mid_box_lower)} -{' '}
                  {formatPrice(riskInfo.mid_box_upper)}
                </span>
              </div>
              <div className="flex justify-between gap-1">
                <span
                  className="text-[10px] uppercase tracking-wide"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {t('longBox')}
                </span>
                <span
                  className="font-semibold tabular-nums"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {formatPrice(riskInfo.long_box_lower)} -{' '}
                  {formatPrice(riskInfo.long_box_upper)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
