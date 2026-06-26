import { HugeiconsIcon } from '@hugeicons/react'
import {
  Shield01Icon,
  AlertCircleIcon,
  Coins01Icon,
} from '@hugeicons/core-free-icons'
import type { RiskControlConfig } from '../../types'

interface RiskControlEditorProps {
  config: RiskControlConfig
  onChange: (config: RiskControlConfig) => void
  disabled?: boolean
  language: string
}

export function RiskControlEditor({
  config,
  onChange,
  disabled,
  language,
}: RiskControlEditorProps) {
  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      positionLimits: { zh: '仓位限制', en: 'Position Limits' },
      maxPositions: { zh: '最大持仓数量', en: 'Max Positions' },
      maxPositionsDesc: {
        zh: '同时持有的最大币种数量',
        en: 'Maximum coins held simultaneously',
      },
      // Trading leverage (exchange leverage)
      tradingLeverage: {
        zh: '交易杠杆（交易所杠杆）',
        en: 'Trading Leverage (Exchange)',
      },
      btcEthLeverage: {
        zh: 'BTC/ETH 交易杠杆',
        en: 'BTC/ETH Trading Leverage',
      },
      btcEthLeverageDesc: {
        zh: '交易所开仓使用的杠杆倍数',
        en: 'Exchange leverage for opening positions',
      },
      altcoinLeverage: { zh: '山寨币交易杠杆', en: 'Altcoin Trading Leverage' },
      altcoinLeverageDesc: {
        zh: '交易所开仓使用的杠杆倍数',
        en: 'Exchange leverage for opening positions',
      },
      // Position value ratio (risk control) - CODE ENFORCED
      positionValueRatio: {
        zh: '仓位价值比例（代码强制）',
        en: 'Position Value Ratio (CODE ENFORCED)',
      },
      positionValueRatioDesc: {
        zh: '单仓位名义价值 / 账户净值，由代码强制执行',
        en: 'Position notional value / equity, enforced by code',
      },
      btcEthPositionValueRatio: {
        zh: 'BTC/ETH 仓位价值比例',
        en: 'BTC/ETH Position Value Ratio',
      },
      btcEthPositionValueRatioDesc: {
        zh: '单仓最大名义价值 = 净值 × 此值（代码强制）',
        en: 'Max position value = equity × this ratio (CODE ENFORCED)',
      },
      altcoinPositionValueRatio: {
        zh: '山寨币仓位价值比例',
        en: 'Altcoin Position Value Ratio',
      },
      altcoinPositionValueRatioDesc: {
        zh: '单仓最大名义价值 = 净值 × 此值（代码强制）',
        en: 'Max position value = equity × this ratio (CODE ENFORCED)',
      },
      riskParameters: { zh: '风险参数', en: 'Risk Parameters' },
      minRiskReward: { zh: '最小风险回报比', en: 'Min Risk/Reward Ratio' },
      minRiskRewardDesc: {
        zh: '开仓要求的最低盈亏比',
        en: 'Minimum profit ratio for opening',
      },
      maxMarginUsage: {
        zh: '最大保证金使用率（代码强制）',
        en: 'Max Margin Usage (CODE ENFORCED)',
      },
      maxMarginUsageDesc: {
        zh: '保证金使用率上限，由代码强制执行',
        en: 'Maximum margin utilization, enforced by code',
      },
      entryRequirements: { zh: '开仓要求', en: 'Entry Requirements' },
      minPositionSize: { zh: '最小开仓金额', en: 'Min Position Size' },
      minPositionSizeDesc: {
        zh: 'USDT 最小名义价值',
        en: 'Minimum notional value in USDT',
      },
      minConfidence: { zh: '最小信心度', en: 'Min Confidence' },
      minConfidenceDesc: {
        zh: 'AI 开仓信心度阈值',
        en: 'AI confidence threshold for entry',
      },
    }
    return translations[key]?.[language] || key
  }

  const updateField = <K extends keyof RiskControlConfig>(
    key: K,
    value: RiskControlConfig[K]
  ) => {
    if (!disabled) {
      onChange({ ...config, [key]: value })
    }
  }

  return (
    <div className="space-y-7">
      {/* Position Limits */}
      <div className="gl-onyx-panel rounded-2xl overflow-hidden p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="dash-ico shrink-0">
            <HugeiconsIcon icon={Shield01Icon} size={18} strokeWidth={1.9} />
          </div>
          <h3 className="gl-metal-shine text-sm font-semibold tracking-wide uppercase">
            {t('positionLimits')}
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-5">
          <div className="gl-metal-panel rounded-xl overflow-hidden p-4">
            <label className="gl-field-label">{t('maxPositions')}</label>
            <p className="gl-field-hint mb-2.5">{t('maxPositionsDesc')}</p>
            <input
              type="number"
              value={config.max_positions ?? 3}
              onChange={(e) =>
                updateField('max_positions', parseInt(e.target.value) || 3)
              }
              disabled={disabled}
              min={1}
              max={10}
              className="gl-input w-32 tabular-nums"
            />
          </div>
        </div>

        {/* Trading Leverage (Exchange) */}
        <div className="flex items-center gap-2 mb-3">
          <HugeiconsIcon
            icon={Coins01Icon}
            size={15}
            strokeWidth={1.9}
            style={{ color: 'var(--accent-primary)' }}
          />
          <p
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: 'var(--accent-primary)' }}
          >
            {t('tradingLeverage')}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="gl-metal-panel rounded-xl overflow-hidden p-4">
            <label className="gl-field-label">{t('btcEthLeverage')}</label>
            <p className="gl-field-hint mb-3">{t('btcEthLeverageDesc')}</p>
            <div className="flex items-center gap-3">
              <input
                type="range"
                value={config.btc_eth_max_leverage ?? 5}
                onChange={(e) =>
                  updateField('btc_eth_max_leverage', parseInt(e.target.value))
                }
                disabled={disabled}
                min={1}
                max={20}
                className="flex-1"
                style={{ accentColor: 'var(--accent-primary)' }}
              />
              <span
                className="gl-metal-text w-12 text-center text-sm font-semibold tabular-nums"
                style={{ color: 'var(--accent-primary)' }}
              >
                {config.btc_eth_max_leverage ?? 5}x
              </span>
            </div>
          </div>

          <div className="gl-metal-panel rounded-xl overflow-hidden p-4">
            <label className="gl-field-label">{t('altcoinLeverage')}</label>
            <p className="gl-field-hint mb-3">{t('altcoinLeverageDesc')}</p>
            <div className="flex items-center gap-3">
              <input
                type="range"
                value={config.altcoin_max_leverage ?? 5}
                onChange={(e) =>
                  updateField('altcoin_max_leverage', parseInt(e.target.value))
                }
                disabled={disabled}
                min={1}
                max={20}
                className="flex-1"
                style={{ accentColor: 'var(--accent-primary)' }}
              />
              <span
                className="gl-metal-text w-12 text-center text-sm font-semibold tabular-nums"
                style={{ color: 'var(--accent-primary)' }}
              >
                {config.altcoin_max_leverage ?? 5}x
              </span>
            </div>
          </div>
        </div>

        {/* Position Value Ratio (Risk Control - CODE ENFORCED) */}
        <div className="mb-3">
          <div className="flex items-center gap-2">
            <HugeiconsIcon
              icon={Shield01Icon}
              size={15}
              strokeWidth={1.9}
              style={{ color: 'var(--binance-green)' }}
            />
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--binance-green)' }}
            >
              {t('positionValueRatio')}
            </p>
          </div>
          <p className="gl-field-hint mt-1.5">{t('positionValueRatioDesc')}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div
            className="gl-metal-panel rounded-xl overflow-hidden p-4"
            style={{
              boxShadow:
                '0 0 0 1px color-mix(in srgb, var(--binance-green) 45%, transparent) inset',
            }}
          >
            <label className="gl-field-label">
              {t('btcEthPositionValueRatio')}
            </label>
            <p className="gl-field-hint mb-3">
              {t('btcEthPositionValueRatioDesc')}
            </p>
            <div className="flex items-center gap-3">
              <input
                type="range"
                value={config.btc_eth_max_position_value_ratio ?? 5}
                onChange={(e) =>
                  updateField(
                    'btc_eth_max_position_value_ratio',
                    parseFloat(e.target.value)
                  )
                }
                disabled={disabled}
                min={0.5}
                max={10}
                step={0.5}
                className="flex-1"
                style={{ accentColor: 'var(--binance-green)' }}
              />
              <span
                className="gl-metal-text w-12 text-center text-sm font-semibold tabular-nums"
                style={{ color: 'var(--binance-green)' }}
              >
                {config.btc_eth_max_position_value_ratio ?? 5}x
              </span>
            </div>
          </div>

          <div
            className="gl-metal-panel rounded-xl overflow-hidden p-4"
            style={{
              boxShadow:
                '0 0 0 1px color-mix(in srgb, var(--binance-green) 45%, transparent) inset',
            }}
          >
            <label className="gl-field-label">
              {t('altcoinPositionValueRatio')}
            </label>
            <p className="gl-field-hint mb-3">
              {t('altcoinPositionValueRatioDesc')}
            </p>
            <div className="flex items-center gap-3">
              <input
                type="range"
                value={config.altcoin_max_position_value_ratio ?? 1}
                onChange={(e) =>
                  updateField(
                    'altcoin_max_position_value_ratio',
                    parseFloat(e.target.value)
                  )
                }
                disabled={disabled}
                min={0.5}
                max={10}
                step={0.5}
                className="flex-1"
                style={{ accentColor: 'var(--binance-green)' }}
              />
              <span
                className="gl-metal-text w-12 text-center text-sm font-semibold tabular-nums"
                style={{ color: 'var(--binance-green)' }}
              >
                {config.altcoin_max_position_value_ratio ?? 1}x
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Parameters */}
      <div className="gl-onyx-panel rounded-2xl overflow-hidden p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="dash-ico shrink-0">
            <HugeiconsIcon
              icon={AlertCircleIcon}
              size={18}
              strokeWidth={1.9}
              style={{ color: 'var(--binance-red)' }}
            />
          </div>
          <h3
            className="gl-metal-shine text-sm font-semibold tracking-wide uppercase"
            style={{ animationDelay: '-1.2s' }}
          >
            {t('riskParameters')}
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="gl-metal-panel rounded-xl overflow-hidden p-4">
            <label className="gl-field-label">{t('minRiskReward')}</label>
            <p className="gl-field-hint mb-3">{t('minRiskRewardDesc')}</p>
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-semibold tabular-nums"
                style={{ color: 'var(--text-secondary)' }}
              >
                1:
              </span>
              <input
                type="number"
                value={config.min_risk_reward_ratio ?? 3}
                onChange={(e) =>
                  updateField(
                    'min_risk_reward_ratio',
                    parseFloat(e.target.value) || 3
                  )
                }
                disabled={disabled}
                min={1}
                max={10}
                step={0.5}
                className="gl-input w-20 tabular-nums"
              />
            </div>
          </div>

          <div
            className="gl-metal-panel rounded-xl overflow-hidden p-4"
            style={{
              boxShadow:
                '0 0 0 1px color-mix(in srgb, var(--binance-green) 45%, transparent) inset',
            }}
          >
            <label className="gl-field-label">{t('maxMarginUsage')}</label>
            <p className="gl-field-hint mb-3">{t('maxMarginUsageDesc')}</p>
            <div className="flex items-center gap-3">
              <input
                type="range"
                value={(config.max_margin_usage ?? 0.9) * 100}
                onChange={(e) =>
                  updateField(
                    'max_margin_usage',
                    parseInt(e.target.value) / 100
                  )
                }
                disabled={disabled}
                min={10}
                max={100}
                className="flex-1"
                style={{ accentColor: 'var(--binance-green)' }}
              />
              <span
                className="gl-metal-text w-12 text-center text-sm font-semibold tabular-nums"
                style={{ color: 'var(--binance-green)' }}
              >
                {Math.round((config.max_margin_usage ?? 0.9) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Entry Requirements */}
      <div className="gl-onyx-panel rounded-2xl overflow-hidden p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="dash-ico shrink-0">
            <HugeiconsIcon
              icon={Shield01Icon}
              size={18}
              strokeWidth={1.9}
              style={{ color: 'var(--binance-green)' }}
            />
          </div>
          <h3
            className="gl-metal-shine text-sm font-semibold tracking-wide uppercase"
            style={{ animationDelay: '-2.4s' }}
          >
            {t('entryRequirements')}
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="gl-metal-panel rounded-xl overflow-hidden p-4">
            <label className="gl-field-label">{t('minPositionSize')}</label>
            <p className="gl-field-hint mb-3">{t('minPositionSizeDesc')}</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={config.min_position_size ?? 12}
                onChange={(e) =>
                  updateField(
                    'min_position_size',
                    parseFloat(e.target.value) || 12
                  )
                }
                disabled={disabled}
                min={10}
                max={1000}
                className="gl-input w-24 tabular-nums"
              />
              <span
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: 'var(--text-secondary)' }}
              >
                USDT
              </span>
            </div>
          </div>

          <div className="gl-metal-panel rounded-xl overflow-hidden p-4">
            <label className="gl-field-label">{t('minConfidence')}</label>
            <p className="gl-field-hint mb-3">{t('minConfidenceDesc')}</p>
            <div className="flex items-center gap-3">
              <input
                type="range"
                value={config.min_confidence ?? 75}
                onChange={(e) =>
                  updateField('min_confidence', parseInt(e.target.value))
                }
                disabled={disabled}
                min={50}
                max={100}
                className="flex-1"
                style={{ accentColor: 'var(--binance-green)' }}
              />
              <span
                className="gl-metal-text w-12 text-center text-sm font-semibold tabular-nums"
                style={{ color: 'var(--binance-green)' }}
              >
                {config.min_confidence ?? 75}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
