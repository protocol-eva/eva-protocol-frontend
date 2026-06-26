import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useSWR from 'swr'
import { goTo } from '../lib/nav'
import { Loader2 } from 'lucide-react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  TradeUpIcon,
  Shield01Icon,
  FlashIcon,
  ViewIcon,
  ViewOffSlashIcon,
  Copy01Icon,
  Tick02Icon,
  Layers01Icon,
  Target01Icon,
  Analytics02Icon,
  Search01Icon,
  Store01Icon,
  CloudUploadIcon,
  ChartLineData01Icon,
  Rocket01Icon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'sonner'
import { DashPage, StatCard, EmptyState } from '../components/dash/DashKit'

interface PublicStrategy {
  id: string
  name: string
  description: string
  author_email?: string
  is_public: boolean
  config_visible: boolean
  config?: any
  stats?: {
    used_by: number
    rating: number
  }
  created_at: string
  updated_at: string
}

const strategyStyles: Record<
  string,
  {
    color: string
    border: string
    glow: string
    shadow: string
    icon: any
    bg: string
  }
> = {
  scalper: {
    color: 'text-[var(--strategy-market-scalper-color)]',
    border: 'border-[var(--strategy-market-scalper-border)]',
    glow: 'shadow-[var(--strategy-market-scalper-glow)]',
    shadow: 'hover:shadow-[var(--strategy-market-scalper-shadow)]',
    bg: 'bg-[var(--strategy-market-accent-bg)]',
    icon: FlashIcon,
  },
  swing: {
    color: 'text-cyan-400',
    border: 'border-cyan-400/30',
    glow: 'shadow-[0_0_20px_rgba(34,211,238,0.15)]',
    shadow: 'hover:shadow-[0_0_30px_rgba(34,211,238,0.25)]',
    bg: 'bg-cyan-400/5',
    icon: TradeUpIcon,
  },
  arbitrage: {
    color: 'text-purple-400',
    border: 'border-purple-400/30',
    glow: 'shadow-[0_0_20px_rgba(192,132,252,0.15)]',
    shadow: 'hover:shadow-[0_0_30px_rgba(192,132,252,0.25)]',
    bg: 'bg-purple-400/5',
    icon: Layers01Icon,
  },
  conservative: {
    color: 'text-emerald-400',
    border: 'border-emerald-400/30',
    glow: 'shadow-[0_0_20px_rgba(52,211,153,0.15)]',
    shadow: 'hover:shadow-[0_0_30px_rgba(52,211,153,0.25)]',
    bg: 'bg-emerald-400/5',
    icon: Shield01Icon,
  },
  aggressive: {
    color: 'text-red-500',
    border: 'border-red-500/30',
    glow: 'shadow-[0_0_20px_rgba(239,68,68,0.15)]',
    shadow: 'hover:shadow-[0_0_30px_rgba(239,68,68,0.25)]',
    bg: 'bg-red-500/5',
    icon: Target01Icon,
  },
  default: {
    color: 'text-[var(--text-secondary)]',
    border: 'border-[var(--panel-border)]',
    glow: '',
    shadow: 'hover:shadow-[0_0_20px_var(--glass-border)]',
    bg: 'bg-[var(--glass-bg)]',
    icon: Analytics02Icon,
  },
}

function getStrategyStyle(name: string) {
  const lowerName = name.toLowerCase()
  if (lowerName.includes('scalp')) return strategyStyles.scalper
  if (lowerName.includes('swing')) return strategyStyles.swing
  if (lowerName.includes('arb')) return strategyStyles.arbitrage
  if (lowerName.includes('safe') || lowerName.includes('conserv'))
    return strategyStyles.conservative
  if (lowerName.includes('aggress') || lowerName.includes('high'))
    return strategyStyles.aggressive
  return strategyStyles.default
}

export function StrategyMarketPage() {
  const { language } = useLanguage()
  const { token, user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const texts = {
    zh: {
      title: '策略市场',
      subtitle: 'STRATEGY MARKETPLACE',
      description: '发现、学习并复用社区精英交易员的策略配置',
      search: '搜索参数...',
      all: '全部协议',
      popular: '热门配置',
      recent: '最新提交',
      myStrategies: '我的库',
      noStrategies: '无信号',
      noStrategiesDesc: '当前频段未检测到策略信号',
      author: 'OPERATOR',
      createdAt: 'TIMESTAMP',
      viewConfig: 'DECRYPT CONFIG',
      hideConfig: 'ENCRYPT',
      copyConfig: 'CLONE CONFIG',
      copied: 'COPIED',
      configHidden: 'ENCRYPTED',
      configHiddenDesc: '配置参数已加密',
      indicators: 'INDICATORS',
      maxPositions: 'POS_LIMIT',
      maxLeverage: 'LEV_MAX',
      shareYours: 'UPLOAD_STRATEGY',
      makePublic: 'PUBLISH',
      loading: 'INITIALIZING...',
    },
    en: {
      title: 'STRATEGY MARKET',
      subtitle: 'GLOBAL STRATEGY DATABASE',
      description:
        'Discover, analyze, and clone high-performance trading algorithms',
      search: 'SEARCH PARAMETERS...',
      all: 'ALL PROTOCOLS',
      popular: 'TRENDING',
      recent: 'LATEST',
      myStrategies: 'MY LIBRARY',
      noStrategies: 'NO SIGNAL',
      noStrategiesDesc: 'No strategic signals detected in this frequency',
      author: 'OPERATOR',
      createdAt: 'TIMESTAMP',
      viewConfig: 'DECRYPT CONFIG',
      hideConfig: 'ENCRYPT',
      copyConfig: 'CLONE CONFIG',
      copied: 'COPIED',
      configHidden: 'ENCRYPTED',
      configHiddenDesc: 'Configuration parameters encrypted',
      indicators: 'INDICATORS',
      maxPositions: 'POS_LIMIT',
      maxLeverage: 'LEV_MAX',
      shareYours: 'UPLOAD_STRATEGY',
      makePublic: 'PUBLISH',
      loading: 'INITIALIZING...',
    },
  }

  const t = texts[language]

  // Fetch public strategies
  const { data: strategies, isLoading } = useSWR<PublicStrategy[]>(
    'public-strategies',
    async () => {
      const response = await fetch('/api/strategies/public')
      if (!response.ok) throw new Error('Failed to fetch strategies')
      const data = await response.json()
      return data.strategies || []
    },
    {
      refreshInterval: 60000,
      revalidateOnFocus: false,
    }
  )

  const filteredStrategies =
    strategies?.filter((s) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          s.name.toLowerCase().includes(query) ||
          s.description?.toLowerCase().includes(query)
        )
      }
      return true
    }) || []

  const handleCopyConfig = async (strategy: PublicStrategy) => {
    if (!strategy.config) return
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(strategy.config, null, 2)
      )
      setCopiedId(strategy.id)
      toast.success(t.copied)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date
      .toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
      .replace(',', '')
  }

  const getIndicatorList = (config: any) => {
    if (!config?.indicators) return []
    const indicators = []
    if (config.indicators.enable_ema) indicators.push('EMA')
    if (config.indicators.enable_macd) indicators.push('MACD')
    if (config.indicators.enable_rsi) indicators.push('RSI')
    if (config.indicators.enable_atr) indicators.push('ATR')
    if (config.indicators.enable_boll) indicators.push('BOLL')
    if (config.indicators.enable_volume) indicators.push('VOL')
    if (config.indicators.enable_oi) indicators.push('OI')
    if (config.indicators.enable_funding_rate) indicators.push('FR')
    return indicators
  }

  const totalCount = strategies?.length || 0
  const publicCount = strategies?.filter((s) => s.config_visible).length || 0
  const operatorCount = new Set(
    (strategies || []).map((s) => s.author_email).filter(Boolean)
  ).size

  return (
    <DashPage>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="gl-aurora-panel rounded-2xl overflow-hidden mb-6"
      >
        <div className="p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6">
          <span className="dash-kpi-ico shrink-0">
            <HugeiconsIcon icon={Store01Icon} size={30} strokeWidth={1.7} />
          </span>
          <div className="min-w-0">
            <h1 className="gl-title-metal-blue text-3xl sm:text-4xl font-bold tracking-tight leading-none">
              {t.title}
            </h1>
            <p
              className="mt-2 text-[11px] font-semibold uppercase tracking-[0.3em]"
              style={{ color: 'var(--accent-primary)' }}
            >
              {t.subtitle}
            </p>
            <p
              className="mt-3 text-sm max-w-2xl"
              style={{ color: 'var(--text-secondary)' }}
            >
              {t.description}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Summary StatCards */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-6"
      >
        <StatCard
          title={language === 'zh' ? '策略总数' : 'STRATEGIES'}
          value={String(totalCount)}
          icon={ChartLineData01Icon}
        />
        <StatCard
          title={language === 'zh' ? '公开配置' : 'PUBLIC CONFIGS'}
          value={String(publicCount)}
          icon={ViewIcon}
        />
        <StatCard
          title={t.author}
          value={String(operatorCount)}
          icon={Rocket01Icon}
        />
      </motion.div>

      {/* Search and Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="gl-onyx-panel rounded-2xl overflow-hidden mb-6"
      >
        <div className="p-4 sm:p-5 flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div
            className="relative flex-1 flex items-center rounded-xl px-3"
            style={{
              background: 'var(--surface-primary)',
              border: '1px solid var(--panel-border)',
            }}
          >
            <HugeiconsIcon
              icon={Search01Icon}
              size={17}
              strokeWidth={1.9}
              className="shrink-0"
              style={{ color: 'var(--text-tertiary)' }}
            />
            <input
              type="text"
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent py-3 px-3 text-sm focus:outline-none"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>

          {/* Category Filter */}
          <div
            className="flex gap-1.5 p-1 rounded-xl shrink-0"
            style={{
              background: 'var(--surface-primary)',
              border: '1px solid var(--panel-border)',
            }}
          >
            {['all', 'popular', 'recent'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-wider rounded-lg transition-all relative overflow-hidden ${
                  selectedCategory === cat
                    ? 'text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {selectedCategory === cat && (
                  <motion.div
                    layoutId="filter-highlight"
                    className="absolute inset-0 rounded-lg"
                    style={{
                      background: 'var(--surface-tertiary)',
                      border: '1px solid var(--panel-border)',
                    }}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">
                  {t[cat as keyof typeof t]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2
            className="w-9 h-9 animate-spin"
            style={{ color: 'var(--accent-primary)' }}
          />
          <p className="text-xs tracking-widest gl-metal-text">{t.loading}</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredStrategies.length === 0 && (
        <EmptyState
          icon={Store01Icon}
          title={t.noStrategies}
          description={t.noStrategiesDesc}
          compact
        />
      )}

      {/* Strategy Grid */}
      {!isLoading && filteredStrategies.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          <AnimatePresence>
            {filteredStrategies.map((strategy, i) => {
              const style = getStrategyStyle(strategy.name)
              const Icon = style.icon
              const indicators =
                strategy.config_visible && strategy.config
                  ? getIndicatorList(strategy.config)
                  : []

              return (
                <motion.div
                  key={strategy.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{
                    delay: Math.min(i * 0.05, 0.4),
                    duration: 0.4,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="group gl-metal-panel rounded-2xl overflow-hidden"
                >
                  <div className="p-5 relative">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-5">
                      <div className={`dash-ico ${style.color}`}>
                        <HugeiconsIcon
                          icon={Icon}
                          size={18}
                          strokeWidth={1.9}
                        />
                      </div>
                      <div className="text-[10px]">
                        {strategy.config_visible ? (
                          <div
                            className="dash-chip"
                            style={{
                              color: 'var(--binance-green)',
                              borderColor: 'rgba(14,203,129,0.25)',
                            }}
                          >
                            <HugeiconsIcon
                              icon={ViewIcon}
                              size={12}
                              strokeWidth={2}
                            />
                            <span
                              className="dash-chip-val"
                              style={{ color: 'var(--binance-green)' }}
                            >
                              PUBLIC_ACCESS
                            </span>
                          </div>
                        ) : (
                          <div className="dash-chip">
                            <HugeiconsIcon
                              icon={ViewOffSlashIcon}
                              size={12}
                              strokeWidth={2}
                            />
                            <span className="dash-chip-val">RESTRICTED</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Name and Description */}
                    <h3 className="text-base font-bold mb-2 tracking-tight uppercase truncate gl-metal-text">
                      {strategy.name}
                    </h3>
                    <p
                      className="text-xs mb-5 line-clamp-2 h-8 leading-relaxed"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {strategy.description || 'NO_DESCRIPTION_AVAILABLE'}
                    </p>

                    {/* Meta Data */}
                    <div className="grid grid-cols-2 gap-y-2 mb-5 text-[10px]">
                      <div className="flex flex-col">
                        <span
                          className="uppercase tracking-wider"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          {t.author}
                        </span>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          @{strategy.author_email?.split('@')[0] || 'UNKNOWN'}
                        </span>
                      </div>
                      <div className="flex flex-col text-right">
                        <span
                          className="uppercase tracking-wider"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          {t.createdAt}
                        </span>
                        <span
                          className="tabular-nums"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {formatDate(strategy.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Config / Indicators */}
                    <div
                      className="rounded-xl p-3 mb-4 min-h-[90px]"
                      style={{
                        background: 'var(--surface-primary)',
                        border: '1px solid var(--panel-border)',
                      }}
                    >
                      {strategy.config_visible && strategy.config ? (
                        <div className="space-y-3">
                          {/* Indicators */}
                          <div className="flex items-center gap-2 overflow-x-auto dash-scroll pb-1 flex-wrap">
                            {indicators.length > 0 ? (
                              indicators.map((ind) => (
                                <span
                                  key={ind}
                                  className="px-1.5 py-0.5 rounded-md text-[9px] whitespace-nowrap"
                                  style={{
                                    background: 'var(--surface-tertiary)',
                                    border: '1px solid var(--panel-border)',
                                    color: 'var(--text-primary)',
                                  }}
                                >
                                  {ind}
                                </span>
                              ))
                            ) : (
                              <span
                                className="text-[9px]"
                                style={{ color: 'var(--text-tertiary)' }}
                              >
                                NO_INDICATORS
                              </span>
                            )}
                          </div>

                          {/* Risk Control */}
                          {strategy.config.risk_control && (
                            <div className="flex justify-between items-center text-[10px]">
                              <div className="flex gap-3">
                                <div className="flex flex-col">
                                  <span
                                    className="scale-90 origin-left"
                                    style={{ color: 'var(--text-tertiary)' }}
                                  >
                                    LEV
                                  </span>
                                  <span
                                    className="font-bold tabular-nums"
                                    style={{ color: 'var(--text-primary)' }}
                                  >
                                    {strategy.config.risk_control
                                      .btc_eth_max_leverage || '-'}
                                    x
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span
                                    className="scale-90 origin-left"
                                    style={{ color: 'var(--text-tertiary)' }}
                                  >
                                    POS
                                  </span>
                                  <span
                                    className="font-bold tabular-nums"
                                    style={{ color: 'var(--text-primary)' }}
                                  >
                                    {strategy.config.risk_control
                                      .max_positions || '-'}
                                  </span>
                                </div>
                              </div>
                              <HugeiconsIcon
                                icon={Analytics02Icon}
                                size={13}
                                strokeWidth={1.9}
                                style={{ color: 'var(--text-tertiary)' }}
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          className="flex flex-col items-center justify-center h-full"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          <HugeiconsIcon
                            icon={ViewOffSlashIcon}
                            size={17}
                            strokeWidth={1.8}
                            className="mb-1 opacity-60"
                          />
                          <span className="text-[9px] uppercase tracking-widest">
                            {t.configHiddenDesc}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div>
                      {strategy.config_visible && strategy.config ? (
                        <button
                          onClick={() => handleCopyConfig(strategy)}
                          className="gl-navbar-btn w-full py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                          {copiedId === strategy.id ? (
                            <>
                              <HugeiconsIcon
                                icon={Tick02Icon}
                                size={14}
                                strokeWidth={2.2}
                                style={{ color: 'var(--binance-green)' }}
                              />
                              <span style={{ color: 'var(--binance-green)' }}>
                                {t.copied}
                              </span>
                            </>
                          ) : (
                            <>
                              <HugeiconsIcon
                                icon={Copy01Icon}
                                size={14}
                                strokeWidth={2}
                              />
                              {t.copyConfig}
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          disabled
                          className="w-full py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest cursor-not-allowed flex items-center justify-center gap-2"
                          style={{
                            background: 'var(--surface-primary)',
                            border: '1px solid var(--panel-border)',
                            color: 'var(--text-tertiary)',
                          }}
                        >
                          <HugeiconsIcon
                            icon={Shield01Icon}
                            size={13}
                            strokeWidth={1.9}
                          />
                          {t.hideConfig}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* CTA - Share Strategy */}
      {user && token && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 mb-8 flex justify-center"
        >
          <div
            className="gl-aurora-panel rounded-2xl overflow-hidden cursor-pointer group w-full max-w-2xl"
            onClick={() => goTo('/strategy')}
          >
            <div className="relative px-6 sm:px-8 py-5 flex items-center gap-4">
              <span className="dash-kpi-ico shrink-0">
                <HugeiconsIcon
                  icon={CloudUploadIcon}
                  size={24}
                  strokeWidth={1.8}
                />
              </span>
              <div className="text-left min-w-0 flex-1">
                <div className="text-sm font-bold uppercase tracking-wider gl-metal-text">
                  {t.shareYours}
                </div>
                <div
                  className="text-[10px] mt-0.5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {language === 'zh'
                    ? '为全球策略库贡献你的配置'
                    : 'CONTRIBUTE TO THE GLOBAL DATABASE'}
                </div>
              </div>
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={20}
                strokeWidth={2}
                className="shrink-0 group-hover:translate-x-1 transition-transform"
                style={{ color: 'var(--accent-primary)' }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </DashPage>
  )
}
