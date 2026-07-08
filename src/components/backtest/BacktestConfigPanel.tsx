import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'
import useSWR, { type KeyedMutator } from 'swr'
import { Loader2 } from 'lucide-react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowRight01Icon,
  ArrowLeft01Icon,
  FlashIcon,
  Coins01Icon,
  Settings01Icon,
  Layers01Icon,
  RotateClockwiseIcon,
  ViewIcon,
} from '@hugeicons/core-free-icons'
import { SectionHead } from '../dash/DashKit'
import { api } from '../../lib/api'
import { t, type Language } from '../../i18n/translations'
import type {
  AIModel,
  BacktestRunMetadata,
  BacktestRunsResponse,
  Strategy,
} from '../../types'
import {
  type WizardStep,
  type ToastPayload,
  TIMEFRAME_OPTIONS,
  POPULAR_SYMBOLS,
  SWR_OPTS,
  toLocalInput,
  createDefaultFormState,
  getStateColor,
  getStateIcon,
} from './backtestShared'

export interface BacktestConfigPanelProps {
  selectedRunId?: string
  onSelectRun: (runId: string) => void
  compareRunIds: string[]
  onToggleCompare: (runId: string) => void
  runs: BacktestRunMetadata[]
  refreshRuns: KeyedMutator<BacktestRunsResponse>
  language: Language
  onToast: (toast: ToastPayload) => void
  onRunStarted: (runId: string) => void
  wizardResetSignal?: number
  onFormBalanceChange?: (balance: number) => void
}

export const BacktestConfigPanel = memo(function BacktestConfigPanel({
  selectedRunId,
  onSelectRun,
  compareRunIds,
  onToggleCompare,
  runs,
  refreshRuns,
  language,
  onToast,
  onRunStarted,
  wizardResetSignal = 0,
  onFormBalanceChange,
}: BacktestConfigPanelProps) {
  const tr = useCallback(
    (key: string, params?: Record<string, string | number>) =>
      t(`backtestPage.${key}`, language, params),
    [language]
  )

  const now = useMemo(() => new Date(), [])
  const [wizardStep, setWizardStep] = useState<WizardStep>(1)
  const [isStarting, setIsStarting] = useState(false)
  const [formState, setFormState] = useState(() => createDefaultFormState(now))

  const { data: aiModels } = useSWR<AIModel[]>(
    'ai-models',
    api.getModelConfigs,
    { ...SWR_OPTS, refreshInterval: 60000 }
  )
  const { data: strategies } = useSWR<Strategy[]>(
    'strategies',
    api.getStrategies,
    { ...SWR_OPTS, refreshInterval: 60000 }
  )

  const selectedModel = aiModels?.find((m) => m.id === formState.aiModelId)
  const selectedStrategy = strategies?.find(
    (s) => s.id === formState.strategyId
  )

  const strategyHasDynamicCoins = useMemo(() => {
    if (!selectedStrategy) return false
    const coinSource = selectedStrategy.config?.coin_source
    if (!coinSource) return false

    if (
      coinSource.source_type === 'ai500' ||
      coinSource.source_type === 'oi_top'
    ) {
      return true
    }
    if (
      coinSource.source_type === 'mixed' &&
      (coinSource.use_ai500 || coinSource.use_oi_top)
    ) {
      return true
    }

    const srcType = coinSource.source_type as string
    if (!srcType) {
      if (coinSource.use_ai500 || coinSource.use_oi_top) {
        return true
      }
    }

    return false
  }, [selectedStrategy])

  const coinSourceDescription = useMemo(() => {
    if (!selectedStrategy?.config?.coin_source) return null
    const cs = selectedStrategy.config.coin_source

    let sourceType = cs.source_type as string
    if (!sourceType) {
      if (cs.use_ai500 && cs.use_oi_top) {
        sourceType = 'mixed'
      } else if (cs.use_ai500) {
        sourceType = 'ai500'
      } else if (cs.use_oi_top) {
        sourceType = 'oi_top'
      } else if (cs.static_coins?.length) {
        sourceType = 'static'
      }
    }

    switch (sourceType) {
      case 'ai500':
        return { type: 'AI500', limit: cs.ai500_limit || 30 }
      case 'oi_top':
        return { type: 'OI Top', limit: cs.oi_top_limit || 30 }
      case 'mixed': {
        const sources = []
        if (cs.use_ai500) sources.push(`AI500(${cs.ai500_limit || 30})`)
        if (cs.use_oi_top) sources.push(`OI Top(${cs.oi_top_limit || 30})`)
        if (cs.static_coins?.length)
          sources.push(`Static(${cs.static_coins.length})`)
        return { type: 'Mixed', desc: sources.join(' + ') }
      }
      case 'static':
        return { type: 'Static', coins: cs.static_coins || [] }
      default:
        return null
    }
  }, [selectedStrategy])

  useEffect(() => {
    if (wizardResetSignal > 0) setWizardStep(1)
  }, [wizardResetSignal])

  useEffect(() => {
    if (!formState.aiModelId && aiModels?.length) {
      const enabled = aiModels.find((m) => m.enabled)
      if (enabled) setFormState((s) => ({ ...s, aiModelId: enabled.id }))
    }
  }, [aiModels, formState.aiModelId])

  useEffect(() => {
    onFormBalanceChange?.(formState.balance)
  }, [formState.balance, onFormBalanceChange])

  const handleFormChange = (
    key: string,
    value: string | number | boolean | string[]
  ) => {
    setFormState((prev) => ({ ...prev, [key]: value }))
  }

  const handleStart = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedModel?.enabled) {
      onToast({ text: tr('toasts.selectModel'), tone: 'error' })
      return
    }

    try {
      setIsStarting(true)
      const start = new Date(formState.start).getTime()
      const end = new Date(formState.end).getTime()
      if (end <= start) throw new Error(tr('toasts.invalidRange'))

      const userSymbols = formState.symbols
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      const symbolsToSend =
        userSymbols.length === 0 && strategyHasDynamicCoins ? [] : userSymbols

      const payload = await api.startBacktest({
        run_id: formState.runId.trim() || undefined,
        strategy_id: formState.strategyId || undefined,
        symbols: symbolsToSend,
        timeframes: formState.timeframes,
        decision_timeframe: formState.decisionTf,
        decision_cadence_nbars: formState.cadence,
        start_ts: Math.floor(start / 1000),
        end_ts: Math.floor(end / 1000),
        initial_balance: formState.balance,
        fee_bps: formState.fee,
        slippage_bps: formState.slippage,
        fill_policy: formState.fill,
        prompt_variant: formState.prompt,
        prompt_template: formState.promptTemplate,
        custom_prompt: formState.customPrompt.trim() || undefined,
        override_prompt: formState.overridePrompt,
        cache_ai: formState.cacheAI,
        replay_only: formState.replayOnly,
        ai_model_id: formState.aiModelId,
        leverage: {
          btc_eth_leverage: formState.btcEthLeverage,
          altcoin_leverage: formState.altcoinLeverage,
        },
      })

      onToast({
        text: tr('toasts.startSuccess', { id: payload.run_id }),
        tone: 'success',
      })
      onRunStarted(payload.run_id)
      setWizardStep(1)
      await refreshRuns()
    } catch (error: unknown) {
      const errMsg =
        error instanceof Error ? error.message : tr('toasts.startFailed')
      onToast({ text: errMsg, tone: 'error' })
    } finally {
      setIsStarting(false)
    }
  }

  const handleRerun = async (runId: string) => {
    try {
      const cfg = await api.getBacktestConfig(runId)
      const startDate = cfg.start_ts
        ? new Date(cfg.start_ts * 1000)
        : new Date(now.getTime() - 3 * 24 * 3600 * 1000)
      const endDate = cfg.end_ts ? new Date(cfg.end_ts * 1000) : now
      setFormState((prev) => ({
        ...prev,
        runId,
        symbols: Array.isArray(cfg.symbols)
          ? cfg.symbols.join(',')
          : (cfg.symbols as unknown as string) || 'BTCUSDT',
        timeframes: cfg.timeframes || ['3m', '15m', '4h'],
        decisionTf: cfg.decision_timeframe || '3m',
        cadence: cfg.decision_cadence_nbars || 20,
        start: toLocalInput(startDate),
        end: toLocalInput(endDate),
        balance: cfg.initial_balance || 1000,
        fee: cfg.fee_bps || 5,
        slippage: cfg.slippage_bps || 2,
        btcEthLeverage: cfg.leverage?.btc_eth_leverage ?? 5,
        altcoinLeverage: cfg.leverage?.altcoin_leverage ?? 5,
        fill: cfg.fill_policy || 'next_open',
        prompt: cfg.prompt_variant || 'baseline',
        promptTemplate: cfg.prompt_template || 'default',
        customPrompt: cfg.custom_prompt || '',
        overridePrompt: cfg.override_prompt ?? false,
        cacheAI: true,
        replayOnly: cfg.replay_only ?? false,
        aiModelId: cfg.ai_model_id || prev.aiModelId,
        strategyId: cfg.strategy_id || prev.strategyId,
      }))
      setWizardStep(1)
      onToast({
        text:
          language === 'zh'
            ? '已加载配置，缓存已启用'
            : 'Config loaded, cache enabled for re-run',
        tone: 'success',
      })
    } catch (err) {
      onToast({
        text:
          err instanceof Error
            ? err.message
            : language === 'zh'
              ? '加载配置失败'
              : 'Failed to load config',
        tone: 'error',
      })
    }
  }

  const quickRanges = [
    { label: language === 'zh' ? '24小时' : '24h', hours: 24 },
    { label: language === 'zh' ? '3天' : '3d', hours: 72 },
    { label: language === 'zh' ? '7天' : '7d', hours: 168 },
    { label: language === 'zh' ? '30天' : '30d', hours: 720 },
  ]

  const applyQuickRange = (hours: number) => {
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - hours * 3600 * 1000)
    handleFormChange('start', toLocalInput(startDate))
    handleFormChange('end', toLocalInput(endDate))
  }

  return (
    <div className="space-y-4">
      <div className="gl-aurora-panel rounded-2xl overflow-hidden">
        <SectionHead
          icon={Settings01Icon}
          title={language === 'zh' ? '回测配置' : 'Configuration'}
          delay="-1.2s"
        />
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <button
                  onClick={() => setWizardStep(step as WizardStep)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold tabular-nums transition-all"
                  style={{
                    background:
                      wizardStep >= step
                        ? 'var(--accent-primary)'
                        : 'var(--surface-tertiary)',
                    color:
                      wizardStep >= step ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  {step}
                </button>
                {step < 3 && (
                  <div
                    className="w-8 h-0.5 mx-1"
                    style={{
                      background:
                        wizardStep > step
                          ? 'var(--accent-primary)'
                          : 'var(--surface-tertiary)',
                    }}
                  />
                )}
              </div>
            ))}
            <span
              className="ml-2 text-xs"
              style={{ color: 'var(--text-secondary)' }}
            >
              {wizardStep === 1
                ? language === 'zh'
                  ? '选择模型'
                  : 'Select Model'
                : wizardStep === 2
                  ? language === 'zh'
                    ? '配置参数'
                    : 'Configure'
                  : language === 'zh'
                    ? '确认启动'
                    : 'Confirm'}
            </span>
          </div>

          <form onSubmit={handleStart}>
            {wizardStep === 1 && (
              <div key="step1" className="space-y-4">
                <div>
                  <label
                    className="block text-xs mb-2"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {tr('form.aiModelLabel')}
                  </label>
                  <select
                    className="dash-select w-full"
                    style={{ padding: '11px 32px 11px 12px' }}
                    value={formState.aiModelId}
                    onChange={(e) =>
                      handleFormChange('aiModelId', e.target.value)
                    }
                  >
                    <option value="">{tr('form.selectAiModel')}</option>
                    {aiModels?.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.provider})
                        {!m.enabled
                          ? language === 'zh'
                            ? ' (未启用)'
                            : ' (disabled)'
                          : ''}
                      </option>
                    ))}
                  </select>
                  {selectedModel && (
                    <div className="mt-2 flex items-center gap-2 text-xs flex-wrap">
                      <span
                        className="px-2 py-0.5 rounded"
                        style={{
                          background: selectedModel.enabled
                            ? 'var(--binance-green-bg)'
                            : 'var(--binance-red-bg)',
                          color: selectedModel.enabled
                            ? 'var(--binance-green)'
                            : 'var(--binance-red)',
                        }}
                      >
                        {selectedModel.enabled
                          ? tr('form.enabled')
                          : tr('form.disabled')}
                      </span>
                      {selectedModel.hasSystemKey && (
                        <span
                          className="px-2 py-0.5 rounded"
                          style={{
                            background: 'var(--accent-primary-bg)',
                            color: 'var(--accent-primary)',
                          }}
                        >
                          {language === 'zh' ? '系统 Key' : 'System Key'}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label
                    className="block text-xs mb-2"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {language === 'zh'
                      ? '策略配置（可选）'
                      : 'Strategy (Optional)'}
                  </label>
                  <select
                    className="dash-select w-full"
                    style={{ padding: '11px 32px 11px 12px' }}
                    value={formState.strategyId}
                    onChange={(e) =>
                      handleFormChange('strategyId', e.target.value)
                    }
                  >
                    <option value="">
                      {language === 'zh'
                        ? '不使用保存的策略'
                        : 'No saved strategy'}
                    </option>
                    {strategies?.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                        {s.is_active
                          ? language === 'zh'
                            ? ' · 启用'
                            : ' · Active'
                          : ''}
                        {s.is_default
                          ? language === 'zh'
                            ? ' · 默认'
                            : ' · Default'
                          : ''}
                      </option>
                    ))}
                  </select>
                  {formState.strategyId && coinSourceDescription && (
                    <div
                      className="mt-2 p-2.5 rounded-lg"
                      style={{
                        background: 'var(--accent-primary-bg)',
                        border: '1px solid var(--accent-primary-border)',
                      }}
                    >
                      <div className="flex items-center gap-2 text-xs">
                        <HugeiconsIcon
                          icon={Coins01Icon}
                          size={13}
                          strokeWidth={1.9}
                          style={{ color: 'var(--accent-primary)' }}
                        />
                        <span style={{ color: 'var(--accent-primary)' }}>
                          {language === 'zh' ? '币种来源:' : 'Coin Source:'}
                        </span>
                        <span
                          className="font-medium"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {coinSourceDescription.type}
                          {coinSourceDescription.limit &&
                            ` (${coinSourceDescription.limit})`}
                          {coinSourceDescription.desc &&
                            ` - ${coinSourceDescription.desc}`}
                        </span>
                      </div>
                      {strategyHasDynamicCoins && (
                        <div
                          className="text-xs mt-1.5 flex items-center gap-1.5"
                          style={{ color: 'var(--accent-primary)' }}
                        >
                          <HugeiconsIcon
                            icon={FlashIcon}
                            size={12}
                            strokeWidth={2}
                          />
                          {language === 'zh'
                            ? '清空下方币种输入框即可使用策略的动态币种'
                            : "Clear the symbols field below to use strategy's dynamic coins"}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label
                    className="block text-xs mb-2"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {tr('form.symbolsLabel')}
                    {strategyHasDynamicCoins && (
                      <span
                        className="ml-2"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        (
                        {language === 'zh'
                          ? '可选 - 策略已配置币种来源'
                          : 'Optional - strategy has coin source'}
                        )
                      </span>
                    )}
                  </label>
                  {!strategyHasDynamicCoins && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {POPULAR_SYMBOLS.map((sym) => {
                        const isSelected = formState.symbols.includes(sym)
                        return (
                          <button
                            key={sym}
                            type="button"
                            onClick={() => {
                              const current = formState.symbols
                                .split(',')
                                .map((s) => s.trim())
                                .filter(Boolean)
                              const updated = isSelected
                                ? current.filter((s) => s !== sym)
                                : [...current, sym]
                              handleFormChange('symbols', updated.join(','))
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                            style={{
                              background: isSelected
                                ? 'var(--accent-primary-bg)'
                                : 'var(--surface-secondary)',
                              border: `1px solid ${isSelected ? 'var(--accent-primary-border)' : 'var(--panel-border)'}`,
                              color: isSelected
                                ? 'var(--accent-primary)'
                                : 'var(--text-secondary)',
                            }}
                          >
                            {sym.replace('USDT', '')}
                          </button>
                        )
                      })}
                    </div>
                  )}
                  <div className="relative">
                    <textarea
                      className="w-full p-2.5 rounded-lg text-xs font-mono"
                      style={{
                        background: 'var(--surface-primary)',
                        border: '1px solid var(--panel-border)',
                        color: 'var(--text-primary)',
                      }}
                      value={formState.symbols}
                      onChange={(e) =>
                        handleFormChange('symbols', e.target.value)
                      }
                      rows={2}
                      placeholder={
                        strategyHasDynamicCoins
                          ? language === 'zh'
                            ? '留空将使用策略配置的币种来源'
                            : 'Leave empty to use strategy coin source'
                          : ''
                      }
                    />
                    {strategyHasDynamicCoins && formState.symbols && (
                      <button
                        type="button"
                        onClick={() => handleFormChange('symbols', '')}
                        className="absolute top-2 right-2 px-2.5 py-1 rounded-lg text-xs font-semibold"
                        style={{
                          background: 'var(--accent-primary)',
                          color: '#fff',
                        }}
                      >
                        {language === 'zh'
                          ? '清空使用策略币种'
                          : 'Clear to use strategy'}
                      </button>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setWizardStep(2)}
                  disabled={!selectedModel?.enabled}
                  className="gl-navbar-btn w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {language === 'zh' ? '下一步' : 'Next'}
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    size={16}
                    strokeWidth={2}
                  />
                </button>
              </div>
            )}

            {wizardStep === 2 && (
              <div key="step2" className="space-y-4">
                <div>
                  <label
                    className="block text-xs mb-2"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {tr('form.timeRangeLabel')}
                  </label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {quickRanges.map((r) => (
                      <button
                        key={r.hours}
                        type="button"
                        onClick={() => applyQuickRange(r.hours)}
                        className="px-3 py-1 rounded text-xs"
                        style={{
                          background: 'var(--surface-secondary)',
                          border: '1px solid var(--surface-tertiary)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="datetime-local"
                      className="p-2 rounded-lg text-xs"
                      style={{
                        background: 'var(--surface-primary)',
                        border: '1px solid var(--surface-tertiary)',
                        color: 'var(--text-primary)',
                      }}
                      value={formState.start}
                      onChange={(e) =>
                        handleFormChange('start', e.target.value)
                      }
                    />
                    <input
                      type="datetime-local"
                      className="p-2 rounded-lg text-xs"
                      style={{
                        background: 'var(--surface-primary)',
                        border: '1px solid var(--surface-tertiary)',
                        color: 'var(--text-primary)',
                      }}
                      value={formState.end}
                      onChange={(e) => handleFormChange('end', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label
                    className="block text-xs mb-2"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {language === 'zh' ? '时间周期' : 'Timeframes'}
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {TIMEFRAME_OPTIONS.map((tf) => {
                      const isSelected = formState.timeframes.includes(tf)
                      return (
                        <button
                          key={tf}
                          type="button"
                          onClick={() => {
                            const updated = isSelected
                              ? formState.timeframes.filter((t) => t !== tf)
                              : [...formState.timeframes, tf]
                            if (updated.length > 0)
                              handleFormChange('timeframes', updated)
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                          style={{
                            background: isSelected
                              ? 'var(--accent-primary-bg)'
                              : 'var(--surface-secondary)',
                            border: `1px solid ${isSelected ? 'var(--accent-primary-border)' : 'var(--panel-border)'}`,
                            color: isSelected
                              ? 'var(--accent-primary)'
                              : 'var(--text-secondary)',
                          }}
                        >
                          {tf}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      className="block text-xs mb-1"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {tr('form.initialBalanceLabel')}
                    </label>
                    <input
                      type="number"
                      className="w-full p-2 rounded-lg text-xs"
                      style={{
                        background: 'var(--surface-primary)',
                        border: '1px solid var(--surface-tertiary)',
                        color: 'var(--text-primary)',
                      }}
                      value={formState.balance}
                      onChange={(e) =>
                        handleFormChange('balance', Number(e.target.value))
                      }
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs mb-1"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {tr('form.decisionTfLabel')}
                    </label>
                    <select
                      className="dash-select w-full"
                      style={{ padding: '8px 30px 8px 10px', fontSize: 12 }}
                      value={formState.decisionTf}
                      onChange={(e) =>
                        handleFormChange('decisionTf', e.target.value)
                      }
                    >
                      {formState.timeframes.map((tf) => (
                        <option key={tf} value={tf}>
                          {tf}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setWizardStep(1)}
                    className="flex-1 py-2 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
                    style={{
                      background: 'var(--surface-secondary)',
                      border: '1px solid var(--panel-border)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <HugeiconsIcon
                      icon={ArrowLeft01Icon}
                      size={16}
                      strokeWidth={2}
                    />
                    {language === 'zh' ? '上一步' : 'Back'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setWizardStep(3)}
                    className="gl-navbar-btn flex-1 py-2 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    {language === 'zh' ? '下一步' : 'Next'}
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      size={16}
                      strokeWidth={2}
                    />
                  </button>
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <div key="step3" className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      className="block text-xs mb-1"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {tr('form.btcEthLeverageLabel')}
                    </label>
                    <input
                      type="number"
                      className="w-full p-2 rounded-lg text-xs"
                      style={{
                        background: 'var(--surface-primary)',
                        border: '1px solid var(--surface-tertiary)',
                        color: 'var(--text-primary)',
                      }}
                      value={formState.btcEthLeverage}
                      onChange={(e) =>
                        handleFormChange(
                          'btcEthLeverage',
                          Number(e.target.value)
                        )
                      }
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs mb-1"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {tr('form.altcoinLeverageLabel')}
                    </label>
                    <input
                      type="number"
                      className="w-full p-2 rounded-lg text-xs"
                      style={{
                        background: 'var(--surface-primary)',
                        border: '1px solid var(--surface-tertiary)',
                        color: 'var(--text-primary)',
                      }}
                      value={formState.altcoinLeverage}
                      onChange={(e) =>
                        handleFormChange(
                          'altcoinLeverage',
                          Number(e.target.value)
                        )
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label
                      className="block text-xs mb-1"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {tr('form.feeLabel')}
                    </label>
                    <input
                      type="number"
                      className="w-full p-2 rounded-lg text-xs"
                      style={{
                        background: 'var(--surface-primary)',
                        border: '1px solid var(--surface-tertiary)',
                        color: 'var(--text-primary)',
                      }}
                      value={formState.fee}
                      onChange={(e) =>
                        handleFormChange('fee', Number(e.target.value))
                      }
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs mb-1"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {tr('form.slippageLabel')}
                    </label>
                    <input
                      type="number"
                      className="w-full p-2 rounded-lg text-xs"
                      style={{
                        background: 'var(--surface-primary)',
                        border: '1px solid var(--surface-tertiary)',
                        color: 'var(--text-primary)',
                      }}
                      value={formState.slippage}
                      onChange={(e) =>
                        handleFormChange('slippage', Number(e.target.value))
                      }
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs mb-1"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {tr('form.cadenceLabel')}
                    </label>
                    <input
                      type="number"
                      className="w-full p-2 rounded-lg text-xs"
                      style={{
                        background: 'var(--surface-primary)',
                        border: '1px solid var(--surface-tertiary)',
                        color: 'var(--text-primary)',
                      }}
                      value={formState.cadence}
                      onChange={(e) =>
                        handleFormChange('cadence', Number(e.target.value))
                      }
                    />
                  </div>
                </div>

                <div>
                  <label
                    className="block text-xs mb-1"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {language === 'zh' ? '策略风格' : 'Strategy Style'}
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {['baseline', 'aggressive', 'conservative', 'scalping'].map(
                      (p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => handleFormChange('prompt', p)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                          style={{
                            background:
                              formState.prompt === p
                                ? 'var(--accent-primary-bg)'
                                : 'var(--surface-secondary)',
                            border: `1px solid ${formState.prompt === p ? 'var(--accent-primary-border)' : 'var(--panel-border)'}`,
                            color:
                              formState.prompt === p
                                ? 'var(--accent-primary)'
                                : 'var(--text-secondary)',
                          }}
                        >
                          {tr(`form.promptPresets.${p}`)}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div
                  className="flex flex-wrap gap-4 text-xs"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formState.cacheAI}
                      onChange={(e) =>
                        handleFormChange('cacheAI', e.target.checked)
                      }
                      className="accent-[var(--accent-primary)]"
                    />
                    {tr('form.cacheAiLabel')}
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formState.replayOnly}
                      onChange={(e) =>
                        handleFormChange('replayOnly', e.target.checked)
                      }
                      className="accent-[var(--accent-primary)]"
                    />
                    {tr('form.replayOnlyLabel')}
                  </label>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setWizardStep(2)}
                    className="flex-1 py-2 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
                    style={{
                      background: 'var(--surface-secondary)',
                      border: '1px solid var(--panel-border)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <HugeiconsIcon
                      icon={ArrowLeft01Icon}
                      size={16}
                      strokeWidth={2}
                    />
                    {language === 'zh' ? '上一步' : 'Back'}
                  </button>
                  <button
                    type="submit"
                    disabled={isStarting}
                    className="gl-navbar-btn flex-1 py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isStarting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <HugeiconsIcon
                        icon={FlashIcon}
                        size={16}
                        strokeWidth={2}
                      />
                    )}
                    {isStarting ? tr('starting') : tr('start')}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      <div className="gl-onyx-panel rounded-2xl overflow-hidden">
        <SectionHead
          icon={Layers01Icon}
          title={tr('runList.title')}
          delay="-2.4s"
          right={
            <span
              className="text-[11px] font-bold px-2.5 py-1 rounded-lg tabular-nums"
              style={{
                color: 'var(--accent-primary)',
                background: 'var(--accent-primary-bg)',
                border: '1px solid var(--accent-primary-border)',
              }}
            >
              {runs.length} {language === 'zh' ? '条' : 'runs'}
            </span>
          }
        />
        <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto dash-scroll">
          {runs.length === 0 ? (
            <div
              className="py-8 text-center text-sm"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {tr('emptyStates.noRuns')}
            </div>
          ) : (
            runs.map((run) => (
              <div
                key={run.run_id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectRun(run.run_id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelectRun(run.run_id)
                  }
                }}
                className="w-full p-3 rounded-xl text-left transition-all cursor-pointer"
                style={{
                  background:
                    run.run_id === selectedRunId
                      ? 'var(--accent-primary-bg)'
                      : 'var(--surface-secondary)',
                  border: `1px solid ${run.run_id === selectedRunId ? 'var(--accent-primary-border)' : 'var(--panel-border)'}`,
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="font-mono text-xs truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {run.run_id.slice(0, 20)}...
                  </span>
                  <span
                    className="flex items-center gap-1 text-xs font-semibold shrink-0"
                    style={{ color: getStateColor(run.state) }}
                  >
                    {getStateIcon(run.state)}
                    {tr(`states.${run.state}`)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span
                    className="text-xs tabular-nums"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {run.summary.progress_pct.toFixed(0)}% · $
                    {run.summary.equity_last.toFixed(0)}
                  </span>
                  <div className="flex items-center gap-1">
                    {(run.state === 'completed' ||
                      run.state === 'failed' ||
                      run.state === 'stopped') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRerun(run.run_id)
                        }}
                        className="p-1.5 rounded-lg transition-colors hover:bg-[var(--surface-tertiary)]"
                        title={tr('actions.rerunUseCache')}
                      >
                        <HugeiconsIcon
                          icon={RotateClockwiseIcon}
                          size={13}
                          strokeWidth={2}
                          style={{ color: 'var(--accent-primary)' }}
                        />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleCompare(run.run_id)
                      }}
                      className="p-1.5 rounded-lg transition-colors hover:bg-[var(--surface-tertiary)]"
                      style={{
                        background: compareRunIds.includes(run.run_id)
                          ? 'var(--accent-primary-bg)'
                          : 'transparent',
                      }}
                      title={
                        language === 'zh' ? '添加到对比' : 'Add to compare'
                      }
                    >
                      <HugeiconsIcon
                        icon={ViewIcon}
                        size={13}
                        strokeWidth={2}
                        style={{
                          color: compareRunIds.includes(run.run_id)
                            ? 'var(--accent-primary)'
                            : 'var(--text-tertiary)',
                        }}
                      />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
})
