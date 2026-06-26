import { useState, useEffect } from 'react'
import type { AIModel, Exchange, CreateTraderRequest, Strategy } from '../types'
import { useLanguage } from '../contexts/LanguageContext'
import { t } from '../i18n/translations'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  PencilEdit01Icon,
  Add01Icon,
  Cancel01Icon,
  SparklesIcon,
  LinkSquare01Icon,
  UserAdd01Icon,
  Settings01Icon,
  Wallet01Icon,
  Target01Icon,
  Coins01Icon,
  RefreshIcon,
  InformationCircleIcon,
} from '@hugeicons/core-free-icons'
import { httpClient } from '../lib/httpClient'

// 提取下划线后面的名称部分
function getShortName(fullName: string): string {
  const parts = fullName.split('_')
  return parts.length > 1 ? parts[parts.length - 1] : fullName
}

// 交易所注册链接配置
const EXCHANGE_REGISTRATION_LINKS: Record<
  string,
  { url: string; hasReferral?: boolean }
> = {
  binance: {
    url: 'https://www.binance.com/join?ref=EVAENG',
    hasReferral: true,
  },
  okx: { url: 'https://www.okx.com/join/1865360', hasReferral: true },
  bybit: { url: 'https://partner.bybit.com/b/83856', hasReferral: true },
  hyperliquid: {
    url: 'https://app.hyperliquid.xyz/join/AITRADING',
    hasReferral: true,
  },
  aster: {
    url: 'https://www.asterdex.com/en/referral/fdfc0e',
    hasReferral: true,
  },
  lighter: {
    url: 'https://app.lighter.xyz/?referral=68151432',
    hasReferral: true,
  },
}

import type { TraderConfigData } from '../types'

// 表单内部状态类型
interface FormState {
  trader_id?: string
  trader_name: string
  ai_model: string
  exchange_id: string
  strategy_id: string
  is_cross_margin: boolean
  show_in_competition: boolean
  scan_interval_minutes: number
  initial_balance?: number
}

interface TraderConfigModalProps {
  isOpen: boolean
  onClose: () => void
  traderData?: TraderConfigData | null
  isEditMode?: boolean
  availableModels?: AIModel[]
  availableExchanges?: Exchange[]
  onSave?: (data: CreateTraderRequest) => Promise<void>
}

export function TraderConfigModal({
  isOpen,
  onClose,
  traderData,
  isEditMode = false,
  availableModels = [],
  availableExchanges = [],
  onSave,
}: TraderConfigModalProps) {
  const { language } = useLanguage()
  const [formData, setFormData] = useState<FormState>({
    trader_name: '',
    ai_model: '',
    exchange_id: '',
    strategy_id: '',
    is_cross_margin: true,
    show_in_competition: true,
    scan_interval_minutes: 3,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [isFetchingBalance, setIsFetchingBalance] = useState(false)
  const [balanceFetchError, setBalanceFetchError] = useState<string>('')

  // 获取用户的策略列表
  useEffect(() => {
    const fetchStrategies = async () => {
      try {
        const result = await httpClient.get<{ strategies: Strategy[] }>(
          '/api/strategies'
        )
        if (result.success && result.data?.strategies) {
          const strategyList = result.data.strategies
          setStrategies(strategyList)
          // 如果没有选择策略，默认选中激活的策略
          if (!formData.strategy_id && !isEditMode) {
            const activeStrategy = strategyList.find((s) => s.is_active)
            if (activeStrategy) {
              setFormData((prev) => ({
                ...prev,
                strategy_id: activeStrategy.id,
              }))
            } else if (strategyList.length > 0) {
              setFormData((prev) => ({
                ...prev,
                strategy_id: strategyList[0].id,
              }))
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch strategies:', error)
      }
    }
    if (isOpen) {
      fetchStrategies()
    }
  }, [isOpen])

  useEffect(() => {
    if (traderData) {
      setFormData({
        ...traderData,
        strategy_id: traderData.strategy_id || '',
      })
    } else if (!isEditMode) {
      setFormData({
        trader_name: '',
        ai_model: availableModels[0]?.id || '',
        exchange_id: availableExchanges[0]?.id || '',
        strategy_id: '',
        is_cross_margin: true,
        show_in_competition: true,
        scan_interval_minutes: 3,
      })
    }
  }, [traderData, isEditMode, availableModels, availableExchanges])

  if (!isOpen) return null

  const handleInputChange = (field: keyof FormState, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFetchCurrentBalance = async () => {
    if (!isEditMode || !traderData?.trader_id) {
      setBalanceFetchError(t('fetchBalanceEditModeOnly', language))
      return
    }

    setIsFetchingBalance(true)
    setBalanceFetchError('')

    try {
      const result = await httpClient.get<{
        total_equity?: number
        balance?: number
      }>(`/api/account?trader_id=${traderData.trader_id}`)

      if (result.success && result.data) {
        const currentBalance =
          result.data.total_equity || result.data.balance || 0
        setFormData((prev) => ({ ...prev, initial_balance: currentBalance }))
        toast.success(t('balanceFetched', language))
      } else {
        throw new Error(result.message || t('balanceFetchFailed', language))
      }
    } catch (error) {
      console.error(t('balanceFetchFailed', language) + ':', error)
      setBalanceFetchError(t('balanceFetchNetworkError', language))
    } finally {
      setIsFetchingBalance(false)
    }
  }

  const handleSave = async () => {
    if (!onSave) return

    setIsSaving(true)
    try {
      const saveData: CreateTraderRequest = {
        name: formData.trader_name,
        ai_model_id: formData.ai_model,
        exchange_id: formData.exchange_id,
        strategy_id: formData.strategy_id,
        is_cross_margin: formData.is_cross_margin,
        show_in_competition: formData.show_in_competition,
        scan_interval_minutes: formData.scan_interval_minutes,
      }

      // 只在编辑模式时包含initial_balance
      if (isEditMode && formData.initial_balance !== undefined) {
        saveData.initial_balance = formData.initial_balance
      }

      await toast.promise(onSave(saveData), {
        loading: t('saving', language),
        success: t('saveSuccess', language),
        error: t('saveFailed', language),
      })
      onClose()
    } catch (error) {
      console.error(t('saveFailed', language) + ':', error)
    } finally {
      setIsSaving(false)
    }
  }

  const selectedStrategy = strategies.find((s) => s.id === formData.strategy_id)

  return (
    <div className="gl-modal-overlay" onClick={onClose}>
      <div
        className="gl-modal-panel gl-glow-border max-w-2xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="gl-modal-head">
          <div className="flex items-center gap-3">
            <div className="dash-ico">
              <HugeiconsIcon
                icon={isEditMode ? PencilEdit01Icon : Add01Icon}
                size={20}
                strokeWidth={1.9}
              />
            </div>
            <div>
              <h2 className="gl-modal-title gl-metal-text">
                {isEditMode
                  ? t('editTrader', language)
                  : t('createTrader', language)}
              </h2>
              <p
                className="text-sm mt-0.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                {isEditMode
                  ? t('editTraderConfig', language)
                  : t('selectStrategyAndConfigParams', language)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="gl-modal-close"
            aria-label={language === 'zh' ? '关闭' : 'Close'}
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={1.9} />
          </button>
        </div>

        {/* Content */}
        <div className="gl-modal-scroll dash-scroll space-y-6">
          {/* Basic Info */}
          <div className="gl-onyx-panel rounded-2xl overflow-hidden p-5">
            <h3 className="text-base font-semibold gl-metal-shine mb-5 flex items-center gap-2.5">
              <span className="dash-ico shrink-0">
                <HugeiconsIcon
                  icon={Settings01Icon}
                  size={16}
                  strokeWidth={1.9}
                />
              </span>
              {t('basicConfig', language)}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="gl-field-label">
                  {t('traderNameRequired', language)}
                </label>
                <input
                  type="text"
                  value={formData.trader_name}
                  onChange={(e) =>
                    handleInputChange('trader_name', e.target.value)
                  }
                  className="gl-input"
                  placeholder={t('enterTraderNamePlaceholder', language)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="gl-field-label">
                    {t('aiModelRequired', language)}
                  </label>
                  <select
                    value={formData.ai_model}
                    onChange={(e) =>
                      handleInputChange('ai_model', e.target.value)
                    }
                    className="dash-select"
                  >
                    {availableModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {getShortName(model.name || model.id).toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="gl-field-label">
                    {t('exchangeRequired', language)}
                  </label>
                  <select
                    value={formData.exchange_id}
                    onChange={(e) =>
                      handleInputChange('exchange_id', e.target.value)
                    }
                    className="dash-select"
                  >
                    {availableExchanges.map((exchange) => (
                      <option key={exchange.id} value={exchange.id}>
                        {getShortName(
                          exchange.name || exchange.exchange_type || exchange.id
                        ).toUpperCase()}
                        {exchange.account_name
                          ? ` - ${exchange.account_name}`
                          : ''}
                      </option>
                    ))}
                  </select>
                  {/* Exchange Registration Link */}
                  {formData.exchange_id &&
                    (() => {
                      // Find the selected exchange to get its type
                      const selectedExchange = availableExchanges.find(
                        (e) => e.id === formData.exchange_id
                      )
                      const exchangeType =
                        selectedExchange?.exchange_type?.toLowerCase() || ''
                      const regLink = EXCHANGE_REGISTRATION_LINKS[exchangeType]
                      if (!regLink) return null
                      return (
                        <a
                          href={regLink.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="gl-text-link mt-2 inline-flex items-center gap-1.5 text-xs"
                        >
                          <HugeiconsIcon
                            icon={UserAdd01Icon}
                            size={14}
                            strokeWidth={1.9}
                          />
                          <span>{t('noExchangeAccount', language)}</span>
                          {regLink.hasReferral && (
                            <span className="gl-badge gl-badge--info text-[10px]">
                              {t('discount', language)}
                            </span>
                          )}
                          <HugeiconsIcon
                            icon={LinkSquare01Icon}
                            size={12}
                            strokeWidth={1.9}
                          />
                        </a>
                      )
                    })()}
                </div>
              </div>
            </div>
          </div>

          {/* Strategy Selection */}
          <div className="gl-onyx-panel rounded-2xl overflow-hidden p-5">
            <h3
              className="text-base font-semibold gl-metal-shine mb-5 flex items-center gap-2.5"
              style={{ animationDelay: '-1.2s' }}
            >
              <span className="dash-ico shrink-0">
                <HugeiconsIcon
                  icon={SparklesIcon}
                  size={16}
                  strokeWidth={1.9}
                />
              </span>
              {t('selectTradingStrategy', language)}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="gl-field-label">
                  {t('useStrategy', language)}
                </label>
                <select
                  value={formData.strategy_id}
                  onChange={(e) =>
                    handleInputChange('strategy_id', e.target.value)
                  }
                  className="dash-select"
                >
                  <option value="">{t('noStrategyManual', language)}</option>
                  {strategies.map((strategy) => (
                    <option key={strategy.id} value={strategy.id}>
                      {strategy.name}
                      {strategy.is_active ? t('activeStrategy', language) : ''}
                      {strategy.is_default ? t('default', language) : ''}
                    </option>
                  ))}
                </select>
                {strategies.length === 0 && (
                  <p className="gl-field-hint">
                    {t('noStrategyHint', language)}
                  </p>
                )}
              </div>

              {/* Strategy Preview */}
              {selectedStrategy && (
                <div className="mt-3 p-4 gl-metal-panel rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="gl-metal-text text-sm font-semibold">
                      {t('strategyDetails', language)}
                    </span>
                    {selectedStrategy.is_active && (
                      <span className="gl-badge gl-badge--buy text-xs">
                        {t('activating', language)}
                      </span>
                    )}
                  </div>
                  <p
                    className="text-sm mb-3"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {selectedStrategy.description ||
                      (language === 'zh' ? '无描述' : 'No description')}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div
                      className="flex items-center gap-1.5"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <HugeiconsIcon
                        icon={Coins01Icon}
                        size={13}
                        strokeWidth={1.9}
                        className="shrink-0"
                        style={{ color: 'var(--accent-primary)' }}
                      />
                      {t('coinSource', language)}:{' '}
                      {selectedStrategy.config.coin_source.source_type ===
                      'static'
                        ? '固定币种'
                        : selectedStrategy.config.coin_source.source_type ===
                            'ai500'
                          ? 'AI500'
                          : selectedStrategy.config.coin_source.source_type ===
                              'oi_top'
                            ? 'OI Top'
                            : '混合'}
                    </div>
                    <div
                      className="flex items-center gap-1.5 tabular-nums"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <HugeiconsIcon
                        icon={Target01Icon}
                        size={13}
                        strokeWidth={1.9}
                        className="shrink-0"
                        style={{ color: 'var(--accent-primary)' }}
                      />
                      {t('marginLimit', language)}:{' '}
                      {(
                        (selectedStrategy.config.risk_control
                          ?.max_margin_usage || 0.9) * 100
                      ).toFixed(0)}
                      %
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Trading Parameters */}
          <div className="gl-onyx-panel rounded-2xl overflow-hidden p-5">
            <h3
              className="text-base font-semibold gl-metal-shine mb-5 flex items-center gap-2.5"
              style={{ animationDelay: '-2.4s' }}
            >
              <span className="dash-ico shrink-0">
                <HugeiconsIcon
                  icon={Target01Icon}
                  size={16}
                  strokeWidth={1.9}
                />
              </span>
              {t('tradingParams', language)}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="gl-field-label">
                    {t('marginMode', language)}
                  </label>
                  <div className="gl-seg">
                    <button
                      type="button"
                      onClick={() => handleInputChange('is_cross_margin', true)}
                      className="gl-seg-item"
                      data-active={formData.is_cross_margin ? 'true' : 'false'}
                    >
                      {t('crossMargin', language)}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleInputChange('is_cross_margin', false)
                      }
                      className="gl-seg-item"
                      data-active={!formData.is_cross_margin ? 'true' : 'false'}
                    >
                      {t('isolatedMargin', language)}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="gl-field-label">
                    {t('aiScanInterval', language)}
                  </label>
                  <input
                    type="number"
                    value={formData.scan_interval_minutes}
                    onChange={(e) => {
                      const parsedValue = Number(e.target.value)
                      const safeValue = Number.isFinite(parsedValue)
                        ? Math.max(3, parsedValue)
                        : 3
                      handleInputChange('scan_interval_minutes', safeValue)
                    }}
                    className="gl-input tabular-nums"
                    min="3"
                    max="60"
                    step="1"
                  />
                  <p className="gl-field-hint">
                    {t('scanIntervalRecommend', language)}
                  </p>
                </div>
              </div>

              {/* Competition visibility */}
              <div>
                <label className="gl-field-label">
                  {t('competitionDisplay', language)}
                </label>
                <div className="gl-seg">
                  <button
                    type="button"
                    onClick={() =>
                      handleInputChange('show_in_competition', true)
                    }
                    className="gl-seg-item"
                    data-active={
                      formData.show_in_competition ? 'true' : 'false'
                    }
                  >
                    {t('show', language)}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleInputChange('show_in_competition', false)
                    }
                    className="gl-seg-item"
                    data-active={
                      !formData.show_in_competition ? 'true' : 'false'
                    }
                  >
                    {t('hide', language)}
                  </button>
                </div>
                <p className="gl-field-hint">
                  {t('hiddenInCompetition', language)}
                </p>
              </div>

              {/* Initial Balance (Edit mode only) */}
              {isEditMode && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="gl-field-label mb-0">
                      {t('initialBalanceLabel', language)}
                    </label>
                    <button
                      type="button"
                      onClick={handleFetchCurrentBalance}
                      disabled={isFetchingBalance}
                      className="gl-navbar-btn inline-flex items-center gap-1.5 px-3 py-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <HugeiconsIcon
                        icon={RefreshIcon}
                        size={13}
                        strokeWidth={1.9}
                        className={isFetchingBalance ? 'animate-spin' : ''}
                      />
                      {isFetchingBalance
                        ? t('fetching', language)
                        : t('fetchCurrentBalance', language)}
                    </button>
                  </div>
                  <input
                    type="number"
                    value={formData.initial_balance || 0}
                    onChange={(e) =>
                      handleInputChange(
                        'initial_balance',
                        Number(e.target.value)
                      )
                    }
                    className="gl-input tabular-nums"
                    min="100"
                    step="0.01"
                  />
                  <p className="gl-field-hint">
                    {t('balanceUpdateHint', language)}
                  </p>
                  {balanceFetchError && (
                    <p className="gl-field-error">{balanceFetchError}</p>
                  )}
                </div>
              )}

              {/* Create mode info */}
              {!isEditMode && (
                <div className="gl-metal-panel rounded-xl overflow-hidden p-3 flex items-center gap-2.5">
                  <HugeiconsIcon
                    icon={InformationCircleIcon}
                    size={18}
                    strokeWidth={1.9}
                    className="shrink-0"
                    style={{ color: 'var(--accent-primary)' }}
                  />
                  <span
                    className="text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {t('autoFetchBalanceInfo', language)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="gl-modal-foot">
          <button
            onClick={onClose}
            className="gl-modal-btn-ghost px-6 py-3 rounded-xl font-semibold text-sm"
          >
            {t('cancel', language)}
          </button>
          {onSave && (
            <button
              onClick={handleSave}
              disabled={
                isSaving ||
                !formData.trader_name ||
                !formData.ai_model ||
                !formData.exchange_id
              }
              className="gl-modal-btn-primary inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <HugeiconsIcon
                icon={isEditMode ? Wallet01Icon : Add01Icon}
                size={16}
                strokeWidth={1.9}
              />
              {isSaving
                ? t('saving', language)
                : isEditMode
                  ? t('editTrader', language)
                  : t('createTraderButton', language)}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
