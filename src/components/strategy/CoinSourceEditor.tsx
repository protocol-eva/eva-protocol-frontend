import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon,
  Cancel01Icon,
  DatabaseIcon,
  TradeUpIcon,
  TradeDownIcon,
  ListViewIcon,
  UnavailableIcon,
  ShuffleIcon,
} from '@hugeicons/core-free-icons'
import type { CoinSourceConfig } from '../../types'

interface CoinSourceEditorProps {
  config: CoinSourceConfig
  onChange: (config: CoinSourceConfig) => void
  disabled?: boolean
  language: string
}

export function CoinSourceEditor({
  config,
  onChange,
  disabled,
  language,
}: CoinSourceEditorProps) {
  const [newCoin, setNewCoin] = useState('')
  const [newExcludedCoin, setNewExcludedCoin] = useState('')

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      sourceType: { zh: '数据来源类型', en: 'Source Type' },
      static: { zh: '静态列表', en: 'Static List' },
      ai500: { zh: 'AI500 数据源', en: 'AI500 Data Provider' },
      oi_top: { zh: 'OI 持仓增加', en: 'OI Increase' },
      oi_low: { zh: 'OI 持仓减少', en: 'OI Decrease' },
      mixed: { zh: '混合模式', en: 'Mixed Mode' },
      staticCoins: { zh: '自定义币种', en: 'Custom Coins' },
      addCoin: { zh: '添加币种', en: 'Add Coin' },
      useAI500: { zh: '启用 AI500 数据源', en: 'Enable AI500 Data Provider' },
      ai500Limit: { zh: '数量上限', en: 'Limit' },
      useOITop: { zh: '启用 OI 持仓增加榜', en: 'Enable OI Increase' },
      oiTopLimit: { zh: '数量上限', en: 'Limit' },
      useOILow: { zh: '启用 OI 持仓减少榜', en: 'Enable OI Decrease' },
      oiLowLimit: { zh: '数量上限', en: 'Limit' },
      staticDesc: {
        zh: '手动指定交易币种列表',
        en: 'Manually specify trading coins',
      },
      ai500Desc: {
        zh: '使用 AI500 智能筛选的热门币种',
        en: 'Use AI500 smart-filtered popular coins',
      },
      oiTopDesc: {
        zh: '持仓增加榜，适合做多',
        en: 'OI increase ranking, for long',
      },
      oi_lowDesc: {
        zh: '持仓减少榜，适合做空',
        en: 'OI decrease ranking, for short',
      },
      mixedDesc: {
        zh: '组合多种数据源',
        en: 'Combine multiple sources',
      },
      mixedConfig: {
        zh: '组合数据源配置',
        en: 'Combined Sources Configuration',
      },
      mixedSummary: { zh: '已选组合', en: 'Selected Sources' },
      maxCoins: { zh: '最多', en: 'Up to' },
      coins: { zh: '个币种', en: 'coins' },
      dataSourceConfig: { zh: '数据源配置', en: 'Data Source Configuration' },
      excludedCoins: { zh: '排除币种', en: 'Excluded Coins' },
      excludedCoinsDesc: {
        zh: '这些币种将从所有数据源中排除，不会被交易',
        en: 'These coins will be excluded from all sources and will not be traded',
      },
      addExcludedCoin: { zh: '添加排除', en: 'Add Excluded' },
      evaDataNote: {
        zh: '使用 EVA API Key（在指标配置中设置）',
        en: 'Uses EVA API Key (set in Indicators config)',
      },
    }
    return translations[key]?.[language] || key
  }

  const sourceTypes = [
    { value: 'static', icon: ListViewIcon },
    { value: 'ai500', icon: DatabaseIcon },
    { value: 'oi_top', icon: TradeUpIcon },
    { value: 'oi_low', icon: TradeDownIcon },
    { value: 'mixed', icon: ShuffleIcon },
  ] as const

  // Calculate mixed mode summary
  const getMixedSummary = () => {
    const sources: string[] = []
    let totalLimit = 0

    if (config.use_ai500) {
      sources.push(`AI500(${config.ai500_limit || 10})`)
      totalLimit += config.ai500_limit || 10
    }
    if (config.use_oi_top) {
      sources.push(
        `${language === 'zh' ? 'OI增' : 'OI↑'}(${config.oi_top_limit || 10})`
      )
      totalLimit += config.oi_top_limit || 10
    }
    if (config.use_oi_low) {
      sources.push(
        `${language === 'zh' ? 'OI减' : 'OI↓'}(${config.oi_low_limit || 10})`
      )
      totalLimit += config.oi_low_limit || 10
    }
    if ((config.static_coins || []).length > 0) {
      sources.push(
        `${language === 'zh' ? '自定义' : 'Custom'}(${config.static_coins?.length || 0})`
      )
      totalLimit += config.static_coins?.length || 0
    }

    return { sources, totalLimit }
  }

  // xyz dex assets (stocks, forex, commodities) - should NOT get USDT suffix
  const xyzDexAssets = new Set([
    // Stocks
    'TSLA',
    'NVDA',
    'AAPL',
    'MSFT',
    'META',
    'AMZN',
    'GOOGL',
    'AMD',
    'COIN',
    'NFLX',
    'PLTR',
    'HOOD',
    'INTC',
    'MSTR',
    'TSM',
    'ORCL',
    'MU',
    'RIVN',
    'COST',
    'LLY',
    'CRCL',
    'SKHX',
    'SNDK',
    // Forex
    'EUR',
    'JPY',
    // Commodities
    'GOLD',
    'SILVER',
    // Index
    'XYZ100',
  ])

  const isXyzDexAsset = (symbol: string): boolean => {
    const base = symbol
      .toUpperCase()
      .replace(/^XYZ:/, '')
      .replace(/USDT$|USD$|-USDC$/, '')
    return xyzDexAssets.has(base)
  }

  const handleAddCoin = () => {
    if (!newCoin.trim()) return
    const symbol = newCoin.toUpperCase().trim()

    // For xyz dex assets (stocks, forex, commodities), use xyz: prefix without USDT
    let formattedSymbol: string
    if (isXyzDexAsset(symbol)) {
      // Remove xyz: prefix (case-insensitive) and any USD suffixes
      const base = symbol
        .replace(/^xyz:/i, '')
        .replace(/USDT$|USD$|-USDC$/i, '')
      formattedSymbol = `xyz:${base}`
    } else {
      formattedSymbol = symbol.endsWith('USDT') ? symbol : `${symbol}USDT`
    }

    const currentCoins = config.static_coins || []
    if (!currentCoins.includes(formattedSymbol)) {
      onChange({
        ...config,
        static_coins: [...currentCoins, formattedSymbol],
      })
    }
    setNewCoin('')
  }

  const handleRemoveCoin = (coin: string) => {
    onChange({
      ...config,
      static_coins: (config.static_coins || []).filter((c) => c !== coin),
    })
  }

  const handleAddExcludedCoin = () => {
    if (!newExcludedCoin.trim()) return
    const symbol = newExcludedCoin.toUpperCase().trim()

    // For xyz dex assets, use xyz: prefix without USDT
    let formattedSymbol: string
    if (isXyzDexAsset(symbol)) {
      const base = symbol
        .replace(/^xyz:/i, '')
        .replace(/USDT$|USD$|-USDC$/i, '')
      formattedSymbol = `xyz:${base}`
    } else {
      formattedSymbol = symbol.endsWith('USDT') ? symbol : `${symbol}USDT`
    }

    const currentExcluded = config.excluded_coins || []
    if (!currentExcluded.includes(formattedSymbol)) {
      onChange({
        ...config,
        excluded_coins: [...currentExcluded, formattedSymbol],
      })
    }
    setNewExcludedCoin('')
  }

  const handleRemoveExcludedCoin = (coin: string) => {
    onChange({
      ...config,
      excluded_coins: (config.excluded_coins || []).filter((c) => c !== coin),
    })
  }

  // EVA badge component
  const EVAOSBadge = () => (
    <span className="gl-badge gl-badge--info text-[9px]">EVA</span>
  )

  return (
    <div className="space-y-6">
      {/* Source Type Selector */}
      <div>
        <label className="gl-field-label">{t('sourceType')}</label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-2">
          {sourceTypes.map(({ value, icon }) => {
            const active = config.source_type === value
            return (
              <button
                key={value}
                onClick={() =>
                  !disabled &&
                  onChange({
                    ...config,
                    source_type: value as CoinSourceConfig['source_type'],
                  })
                }
                disabled={disabled}
                data-active={active ? 'true' : 'false'}
                className={`gl-onyx-panel rounded-xl p-4 text-center transition-all overflow-hidden ${
                  active
                    ? 'ring-1 ring-[var(--accent-primary)]/70 shadow-[0_0_22px_-6px_var(--accent-primary)]'
                    : 'opacity-80 hover:opacity-100'
                } ${disabled ? 'cursor-not-allowed' : 'active:scale-[0.98]'}`}
              >
                <span
                  className="dash-ico mx-auto mb-2.5"
                  style={active ? undefined : { filter: 'saturate(0.6)' }}
                >
                  <HugeiconsIcon icon={icon} size={18} strokeWidth={1.9} />
                </span>
                <div
                  className={`text-sm font-semibold ${active ? 'gl-metal-text' : 'text-[var(--text-primary)]'}`}
                >
                  {t(value)}
                </div>
                <div className="text-[11px] mt-1 leading-snug text-[var(--text-secondary)]">
                  {t(`${value}Desc`)}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Static Coins - only for static mode */}
      {config.source_type === 'static' && (
        <div>
          <label className="gl-field-label">{t('staticCoins')}</label>
          <div className="flex flex-wrap gap-2 mt-2 mb-3">
            {(config.static_coins || []).map((coin) => (
              <span key={coin} className="dash-chip flex items-center gap-1.5">
                <span className="dash-chip-val tabular-nums">{coin}</span>
                {!disabled && (
                  <button
                    onClick={() => handleRemoveCoin(coin)}
                    className="text-[var(--text-tertiary)] hover:text-[var(--binance-red)] transition-colors active:scale-90"
                  >
                    <HugeiconsIcon
                      icon={Cancel01Icon}
                      size={13}
                      strokeWidth={2.2}
                    />
                  </button>
                )}
              </span>
            ))}
          </div>
          {!disabled && (
            <div className="flex gap-2">
              <input
                type="text"
                value={newCoin}
                onChange={(e) => setNewCoin(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCoin()}
                placeholder="BTC, ETH, SOL..."
                className="gl-input flex-1"
              />
              <button
                onClick={handleAddCoin}
                className="gl-navbar-btn px-4 py-2 rounded-xl flex items-center gap-2 shrink-0"
              >
                <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={2} />
                {t('addCoin')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Excluded Coins */}
      <div className="gl-onyx-panel-b rounded-2xl p-4 sm:p-5 overflow-hidden">
        <div className="flex items-center gap-2.5 mb-2">
          <span className="dash-ico" style={{ color: 'var(--binance-red)' }}>
            <HugeiconsIcon icon={UnavailableIcon} size={16} strokeWidth={1.9} />
          </span>
          <label
            className="text-sm font-semibold uppercase tracking-wider gl-metal-shine"
            style={{ animationDelay: '-2.4s' }}
          >
            {t('excludedCoins')}
          </label>
        </div>
        <p className="gl-field-hint mb-3">{t('excludedCoinsDesc')}</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {(config.excluded_coins || []).map((coin) => (
            <span
              key={coin}
              className="dash-chip flex items-center gap-1.5"
              style={{
                borderColor:
                  'color-mix(in srgb, var(--binance-red) 32%, var(--panel-border))',
              }}
            >
              <span
                className="dash-chip-val tabular-nums"
                style={{ color: 'var(--binance-red)' }}
              >
                {coin}
              </span>
              {!disabled && (
                <button
                  onClick={() => handleRemoveExcludedCoin(coin)}
                  className="text-[var(--text-tertiary)] hover:text-[var(--binance-red)] transition-colors active:scale-90"
                >
                  <HugeiconsIcon
                    icon={Cancel01Icon}
                    size={13}
                    strokeWidth={2.2}
                  />
                </button>
              )}
            </span>
          ))}
          {(config.excluded_coins || []).length === 0 && (
            <span className="text-xs italic text-[var(--text-tertiary)]">
              {language === 'zh' ? '无' : 'None'}
            </span>
          )}
        </div>
        {!disabled && (
          <div className="flex gap-2">
            <input
              type="text"
              value={newExcludedCoin}
              onChange={(e) => setNewExcludedCoin(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddExcludedCoin()}
              placeholder="BTC, ETH, DOGE..."
              className="gl-input flex-1 text-sm"
            />
            <button
              onClick={handleAddExcludedCoin}
              className="gl-text-link px-4 py-2 rounded-xl flex items-center gap-2 text-sm shrink-0 active:scale-[0.98]"
            >
              <HugeiconsIcon
                icon={UnavailableIcon}
                size={15}
                strokeWidth={1.9}
              />
              {t('addExcludedCoin')}
            </button>
          </div>
        )}
      </div>

      {/* AI500 Options - only for ai500 mode */}
      {config.source_type === 'ai500' && (
        <div className="gl-onyx-panel rounded-2xl p-4 sm:p-5 overflow-hidden">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="dash-ico">
              <HugeiconsIcon icon={DatabaseIcon} size={16} strokeWidth={1.9} />
            </span>
            <span
              className="text-sm font-semibold uppercase tracking-wider gl-metal-shine"
              style={{ animationDelay: '-1.2s' }}
            >
              AI500 {t('dataSourceConfig')}
            </span>
            <EVAOSBadge />
          </div>

          <div className="space-y-4">
            <label
              className={`flex items-center justify-between gap-3 ${disabled ? '' : 'cursor-pointer'}`}
              onClick={() =>
                !disabled &&
                onChange({ ...config, use_ai500: !config.use_ai500 })
              }
            >
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {t('useAI500')}
              </span>
              <span
                className="gl-switch shrink-0"
                data-on={config.use_ai500 ? 'true' : 'false'}
                aria-hidden
              />
            </label>

            {config.use_ai500 && (
              <div className="flex items-center gap-3 pt-1">
                <span className="gl-field-label !mb-0">{t('ai500Limit')}</span>
                <select
                  value={config.ai500_limit || 10}
                  onChange={(e) =>
                    !disabled &&
                    onChange({
                      ...config,
                      ai500_limit: parseInt(e.target.value) || 10,
                    })
                  }
                  disabled={disabled}
                  className="dash-select tabular-nums"
                >
                  {[5, 10, 15, 20, 30, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <p className="gl-field-hint">{t('evaDataNote')}</p>
          </div>
        </div>
      )}

      {/* OI Top Options - only for oi_top mode */}
      {config.source_type === 'oi_top' && (
        <div className="gl-onyx-panel rounded-2xl p-4 sm:p-5 overflow-hidden">
          <div className="flex items-center gap-2.5 mb-4">
            <span
              className="dash-ico"
              style={{ color: 'var(--binance-green)' }}
            >
              <HugeiconsIcon icon={TradeUpIcon} size={16} strokeWidth={1.9} />
            </span>
            <span
              className="text-sm font-semibold uppercase tracking-wider gl-metal-shine"
              style={{ animationDelay: '-1.2s' }}
            >
              OI {language === 'zh' ? '持仓增加榜' : 'Increase'}{' '}
              {t('dataSourceConfig')}
            </span>
            <EVAOSBadge />
          </div>

          <div className="space-y-4">
            <label
              className={`flex items-center justify-between gap-3 ${disabled ? '' : 'cursor-pointer'}`}
              onClick={() =>
                !disabled &&
                onChange({ ...config, use_oi_top: !config.use_oi_top })
              }
            >
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {t('useOITop')}
              </span>
              <span
                className="gl-switch shrink-0"
                data-on={config.use_oi_top ? 'true' : 'false'}
                aria-hidden
              />
            </label>

            {config.use_oi_top && (
              <div className="flex items-center gap-3 pt-1">
                <span className="gl-field-label !mb-0">{t('oiTopLimit')}</span>
                <select
                  value={config.oi_top_limit || 10}
                  onChange={(e) =>
                    !disabled &&
                    onChange({
                      ...config,
                      oi_top_limit: parseInt(e.target.value) || 10,
                    })
                  }
                  disabled={disabled}
                  className="dash-select tabular-nums"
                >
                  {[5, 10, 15, 20, 30, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <p className="gl-field-hint">{t('evaDataNote')}</p>
          </div>
        </div>
      )}

      {/* OI Low Options - only for oi_low mode */}
      {config.source_type === 'oi_low' && (
        <div className="gl-onyx-panel rounded-2xl p-4 sm:p-5 overflow-hidden">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="dash-ico" style={{ color: 'var(--binance-red)' }}>
              <HugeiconsIcon icon={TradeDownIcon} size={16} strokeWidth={1.9} />
            </span>
            <span
              className="text-sm font-semibold uppercase tracking-wider gl-metal-shine"
              style={{ animationDelay: '-1.2s' }}
            >
              OI {language === 'zh' ? '持仓减少榜' : 'Decrease'}{' '}
              {t('dataSourceConfig')}
            </span>
            <EVAOSBadge />
          </div>

          <div className="space-y-4">
            <label
              className={`flex items-center justify-between gap-3 ${disabled ? '' : 'cursor-pointer'}`}
              onClick={() =>
                !disabled &&
                onChange({ ...config, use_oi_low: !config.use_oi_low })
              }
            >
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {t('useOILow')}
              </span>
              <span
                className="gl-switch shrink-0"
                data-on={config.use_oi_low ? 'true' : 'false'}
                aria-hidden
              />
            </label>

            {config.use_oi_low && (
              <div className="flex items-center gap-3 pt-1">
                <span className="gl-field-label !mb-0">{t('oiLowLimit')}</span>
                <select
                  value={config.oi_low_limit || 10}
                  onChange={(e) =>
                    !disabled &&
                    onChange({
                      ...config,
                      oi_low_limit: parseInt(e.target.value) || 10,
                    })
                  }
                  disabled={disabled}
                  className="dash-select tabular-nums"
                >
                  {[5, 10, 15, 20, 30, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <p className="gl-field-hint">{t('evaDataNote')}</p>
          </div>
        </div>
      )}

      {/* Mixed Mode - Unified Card Selector */}
      {config.source_type === 'mixed' && (
        <div className="gl-aurora-panel rounded-2xl p-4 sm:p-5 overflow-hidden">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="dash-ico">
              <HugeiconsIcon icon={ShuffleIcon} size={16} strokeWidth={1.9} />
            </span>
            <span
              className="text-sm font-semibold uppercase tracking-wider gl-metal-shine"
              style={{ animationDelay: '-3.6s' }}
            >
              {t('mixedConfig')}
            </span>
          </div>

          {/* 4 Source Cards in 2x2 Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {/* AI500 Card */}
            <div
              data-active={config.use_ai500 ? 'true' : 'false'}
              className={`gl-onyx-panel rounded-xl p-3.5 transition-all overflow-hidden ${
                disabled
                  ? 'cursor-not-allowed'
                  : 'cursor-pointer active:scale-[0.99]'
              } ${
                config.use_ai500
                  ? 'ring-1 ring-[var(--accent-primary)]/70 shadow-[0_0_20px_-7px_var(--accent-primary)]'
                  : 'opacity-80 hover:opacity-100'
              }`}
              onClick={() =>
                !disabled &&
                onChange({ ...config, use_ai500: !config.use_ai500 })
              }
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="dash-ico" style={{ width: 26, height: 26 }}>
                  <HugeiconsIcon
                    icon={DatabaseIcon}
                    size={14}
                    strokeWidth={1.9}
                  />
                </span>
                <span className="text-sm font-semibold gl-metal-text">
                  AI500
                </span>
                <EVAOSBadge />
                <span
                  className="gl-switch ml-auto shrink-0"
                  data-on={config.use_ai500 ? 'true' : 'false'}
                  aria-hidden
                />
              </div>
              {config.use_ai500 && (
                <div className="flex items-center gap-2 mt-3 pl-9">
                  <span className="gl-field-label !mb-0 !text-[10px]">
                    Limit
                  </span>
                  <select
                    value={config.ai500_limit || 10}
                    onChange={(e) => {
                      e.stopPropagation()
                      if (!disabled) {
                        onChange({
                          ...config,
                          ai500_limit: parseInt(e.target.value) || 10,
                        })
                      }
                    }}
                    disabled={disabled}
                    className="dash-select text-xs tabular-nums"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {[5, 10, 15, 20, 30, 50].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* OI Top Card */}
            <div
              data-active={config.use_oi_top ? 'true' : 'false'}
              className={`gl-onyx-panel rounded-xl p-3.5 transition-all overflow-hidden ${
                disabled
                  ? 'cursor-not-allowed'
                  : 'cursor-pointer active:scale-[0.99]'
              } ${
                config.use_oi_top
                  ? 'ring-1 ring-[var(--accent-primary)]/70 shadow-[0_0_20px_-7px_var(--accent-primary)]'
                  : 'opacity-80 hover:opacity-100'
              }`}
              onClick={() =>
                !disabled &&
                onChange({ ...config, use_oi_top: !config.use_oi_top })
              }
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="dash-ico"
                  style={{
                    width: 26,
                    height: 26,
                    color: 'var(--binance-green)',
                  }}
                >
                  <HugeiconsIcon
                    icon={TradeUpIcon}
                    size={14}
                    strokeWidth={1.9}
                  />
                </span>
                <span className="text-sm font-semibold gl-metal-text">
                  {language === 'zh' ? 'OI 增加' : 'OI Increase'}
                </span>
                <span
                  className="gl-switch ml-auto shrink-0"
                  data-on={config.use_oi_top ? 'true' : 'false'}
                  aria-hidden
                />
              </div>
              <p className="text-xs text-[var(--text-secondary)] pl-9 mb-1">
                {language === 'zh' ? '适合做多' : 'For long'}
              </p>
              {config.use_oi_top && (
                <div className="flex items-center gap-2 mt-3 pl-9">
                  <span className="gl-field-label !mb-0 !text-[10px]">
                    Limit
                  </span>
                  <select
                    value={config.oi_top_limit || 10}
                    onChange={(e) => {
                      e.stopPropagation()
                      if (!disabled) {
                        onChange({
                          ...config,
                          oi_top_limit: parseInt(e.target.value) || 10,
                        })
                      }
                    }}
                    disabled={disabled}
                    className="dash-select text-xs tabular-nums"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {[5, 10, 15, 20, 30, 50].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* OI Low Card */}
            <div
              data-active={config.use_oi_low ? 'true' : 'false'}
              className={`gl-onyx-panel rounded-xl p-3.5 transition-all overflow-hidden ${
                disabled
                  ? 'cursor-not-allowed'
                  : 'cursor-pointer active:scale-[0.99]'
              } ${
                config.use_oi_low
                  ? 'ring-1 ring-[var(--accent-primary)]/70 shadow-[0_0_20px_-7px_var(--accent-primary)]'
                  : 'opacity-80 hover:opacity-100'
              }`}
              onClick={() =>
                !disabled &&
                onChange({ ...config, use_oi_low: !config.use_oi_low })
              }
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="dash-ico"
                  style={{ width: 26, height: 26, color: 'var(--binance-red)' }}
                >
                  <HugeiconsIcon
                    icon={TradeDownIcon}
                    size={14}
                    strokeWidth={1.9}
                  />
                </span>
                <span className="text-sm font-semibold gl-metal-text">
                  {language === 'zh' ? 'OI 减少' : 'OI Decrease'}
                </span>
                <span
                  className="gl-switch ml-auto shrink-0"
                  data-on={config.use_oi_low ? 'true' : 'false'}
                  aria-hidden
                />
              </div>
              <p className="text-xs text-[var(--text-secondary)] pl-9 mb-1">
                {language === 'zh' ? '适合做空' : 'For short'}
              </p>
              {config.use_oi_low && (
                <div className="flex items-center gap-2 mt-3 pl-9">
                  <span className="gl-field-label !mb-0 !text-[10px]">
                    Limit
                  </span>
                  <select
                    value={config.oi_low_limit || 10}
                    onChange={(e) => {
                      e.stopPropagation()
                      if (!disabled) {
                        onChange({
                          ...config,
                          oi_low_limit: parseInt(e.target.value) || 10,
                        })
                      }
                    }}
                    disabled={disabled}
                    className="dash-select text-xs tabular-nums"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {[5, 10, 15, 20, 30, 50].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Static/Custom Card */}
            <div
              data-active={
                (config.static_coins || []).length > 0 ? 'true' : 'false'
              }
              className={`gl-onyx-panel rounded-xl p-3.5 transition-all overflow-hidden ${
                (config.static_coins || []).length > 0
                  ? 'ring-1 ring-[var(--accent-primary)]/70 shadow-[0_0_20px_-7px_var(--accent-primary)]'
                  : 'opacity-80 hover:opacity-100'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="dash-ico" style={{ width: 26, height: 26 }}>
                  <HugeiconsIcon
                    icon={ListViewIcon}
                    size={14}
                    strokeWidth={1.9}
                  />
                </span>
                <span className="text-sm font-semibold gl-metal-text">
                  {language === 'zh' ? '自定义' : 'Custom'}
                </span>
                {(config.static_coins || []).length > 0 && (
                  <span className="gl-badge gl-badge--info ml-auto tabular-nums">
                    {config.static_coins?.length}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(config.static_coins || []).slice(0, 3).map((coin) => (
                  <span
                    key={coin}
                    className="dash-chip flex items-center gap-1 !px-2 !py-0.5"
                  >
                    <span className="dash-chip-val !text-xs tabular-nums">
                      {coin}
                    </span>
                    {!disabled && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveCoin(coin)
                        }}
                        className="text-[var(--text-tertiary)] hover:text-[var(--binance-red)] transition-colors active:scale-90"
                      >
                        <HugeiconsIcon
                          icon={Cancel01Icon}
                          size={11}
                          strokeWidth={2.2}
                        />
                      </button>
                    )}
                  </span>
                ))}
                {(config.static_coins || []).length > 3 && (
                  <span className="text-xs text-[var(--text-secondary)] tabular-nums self-center">
                    +{(config.static_coins?.length || 0) - 3}
                  </span>
                )}
              </div>
              {!disabled && (
                <div className="flex gap-1.5 mt-2.5">
                  <input
                    type="text"
                    value={newCoin}
                    onChange={(e) => setNewCoin(e.target.value)}
                    onKeyDown={(e) => {
                      e.stopPropagation()
                      if (e.key === 'Enter') handleAddCoin()
                    }}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="BTC, ETH..."
                    className="gl-input flex-1 !px-2.5 !py-1.5 text-xs"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAddCoin()
                    }}
                    className="gl-navbar-btn px-2.5 rounded-lg flex items-center justify-center shrink-0"
                  >
                    <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          {(() => {
            const { sources, totalLimit } = getMixedSummary()
            if (sources.length === 0) return null
            return (
              <div className="gl-prism-panel rounded-xl p-3 overflow-hidden">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="gl-field-label !mb-0">
                    {t('mixedSummary')}
                  </span>
                  <span className="gl-metal-text font-semibold tabular-nums text-right">
                    {sources.join(' + ')}
                  </span>
                </div>
                <div className="text-[11px] text-[var(--text-secondary)] mt-1.5">
                  {t('maxCoins')}{' '}
                  <span className="tabular-nums text-[var(--text-primary)] font-semibold">
                    {totalLimit}
                  </span>{' '}
                  {t('coins')}
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
