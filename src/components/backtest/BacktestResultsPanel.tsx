import { memo, useCallback, useEffect, useState } from 'react'
import useSWR, { type KeyedMutator } from 'swr'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  Download01Icon,
  Delete02Icon,
  TradeUpIcon,
  AlertCircleIcon,
  ChartBarLineIcon,
  AiBrain01Icon,
  Coins01Icon,
} from '@hugeicons/core-free-icons'
import { EmptyState } from '../dash/DashKit'
import { api } from '../../lib/api'
import { t, type Language } from '../../i18n/translations'
import { confirmToast } from '../../lib/notify'
import { DecisionCard } from '../DecisionCard'
import { MetricTooltip } from '../MetricTooltip'
import type {
  BacktestStatusPayload,
  BacktestEquityPoint,
  BacktestTradeEvent,
  BacktestMetrics,
  BacktestRunMetadata,
  BacktestRunsResponse,
  DecisionRecord,
} from '../../types'
import {
  type ViewTab,
  type ToastPayload,
  MAX_CHART_POINTS,
  SWR_OPTS,
  getStateColor,
  getStateIcon,
} from './backtestShared'
import {
  StatCard,
  ProgressRing,
  BacktestChart,
  CandlestickChartComponent,
  TradeTimeline,
  PositionsDisplay,
} from './BacktestCharts'

export interface BacktestResultsPanelProps {
  selectedRunId?: string
  onSelectRun: (runId: string | undefined) => void
  onRunDeleted?: (runId: string) => void
  viewTab: ViewTab
  onViewTabChange: (tab: ViewTab) => void
  runs: BacktestRunMetadata[]
  refreshRuns: KeyedMutator<BacktestRunsResponse>
  language: Language
  onToast: (toast: ToastPayload) => void
  formBalance: number
}

export const BacktestResultsPanel = memo(function BacktestResultsPanel({
  selectedRunId,
  onSelectRun,
  onRunDeleted,
  viewTab,
  onViewTabChange,
  runs,
  refreshRuns,
  language,
  onToast,
  formBalance,
}: BacktestResultsPanelProps) {
  const tr = useCallback(
    (key: string, params?: Record<string, string | number>) =>
      t(`backtestPage.${key}`, language, params),
    [language]
  )

  const [pageVisible, setPageVisible] = useState(() =>
    typeof document === 'undefined' ? true : !document.hidden
  )

  const isRunActive = (state: string | undefined) =>
    state === 'running' || state === 'paused'

  const pollMs = pageVisible ? undefined : 0
  const activePoll = (ms: number) => (pageVisible ? ms : 0)
  const needsEquity = viewTab === 'overview' || viewTab === 'chart'
  const needsTrades = needsEquity || viewTab === 'trades'
  const needsDecisions = viewTab === 'decisions'

  useEffect(() => {
    const onVisibilityChange = () => setPageVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () =>
      document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  const { data: status } = useSWR<BacktestStatusPayload>(
    selectedRunId ? ['bt-status', selectedRunId] : null,
    () => api.getBacktestStatus(selectedRunId!),
    {
      ...SWR_OPTS,
      refreshInterval: (data) =>
        pollMs === 0 ? 0 : isRunActive(data?.state) ? 3000 : data ? 0 : 5000,
    }
  )

  const { data: equity } = useSWR<BacktestEquityPoint[]>(
    selectedRunId && needsEquity ? ['bt-equity', selectedRunId] : null,
    () => api.getBacktestEquity(selectedRunId!, '1m', MAX_CHART_POINTS),
    {
      ...SWR_OPTS,
      refreshInterval: isRunActive(status?.state) ? activePoll(5000) : 0,
    }
  )

  const { data: trades } = useSWR<BacktestTradeEvent[]>(
    selectedRunId && needsTrades ? ['bt-trades', selectedRunId] : null,
    () => api.getBacktestTrades(selectedRunId!, 500),
    {
      ...SWR_OPTS,
      refreshInterval: isRunActive(status?.state) ? activePoll(5000) : 0,
    }
  )

  const { data: metrics } = useSWR<BacktestMetrics>(
    selectedRunId ? ['bt-metrics', selectedRunId] : null,
    () => api.getBacktestMetrics(selectedRunId!),
    {
      ...SWR_OPTS,
      refreshInterval: isRunActive(status?.state) ? activePoll(15000) : 0,
    }
  )

  const { data: decisions } = useSWR<DecisionRecord[]>(
    selectedRunId && needsDecisions ? ['bt-decisions', selectedRunId] : null,
    () => api.getBacktestDecisions(selectedRunId!, 30),
    {
      ...SWR_OPTS,
      refreshInterval: isRunActive(status?.state) ? activePoll(8000) : 0,
    }
  )

  const selectedRun = runs.find((r) => r.run_id === selectedRunId)

  const handleControl = async (action: 'pause' | 'resume' | 'stop') => {
    if (!selectedRunId) return
    try {
      if (action === 'pause') await api.pauseBacktest(selectedRunId)
      if (action === 'resume') await api.resumeBacktest(selectedRunId)
      if (action === 'stop') await api.stopBacktest(selectedRunId)
      onToast({
        text: tr('toasts.actionSuccess', { action, id: selectedRunId }),
        tone: 'success',
      })
      await refreshRuns()
    } catch (error: unknown) {
      const errMsg =
        error instanceof Error ? error.message : tr('toasts.actionFailed')
      onToast({ text: errMsg, tone: 'error' })
    }
  }

  const handleDelete = async () => {
    if (!selectedRunId) return
    const confirmed = await confirmToast(
      tr('toasts.confirmDelete', { id: selectedRunId }),
      {
        title: language === 'zh' ? '确认删除' : 'Confirm Delete',
        okText: language === 'zh' ? '删除' : 'Delete',
        cancelText: language === 'zh' ? '取消' : 'Cancel',
      }
    )
    if (!confirmed) return
    const runIdToDelete = selectedRunId
    try {
      onSelectRun(undefined)
      onRunDeleted?.(runIdToDelete)
      refreshRuns(
        (current) => {
          if (!current) return current
          return {
            ...current,
            total: Math.max(0, current.total - 1),
            items: current.items.filter((r) => r.run_id !== runIdToDelete),
          }
        },
        { revalidate: false }
      )
      await api.deleteBacktestRun(runIdToDelete)
      onToast({ text: tr('toasts.deleteSuccess'), tone: 'success' })
      await refreshRuns()
    } catch (error: unknown) {
      const errMsg =
        error instanceof Error ? error.message : tr('toasts.deleteFailed')
      onToast({ text: errMsg, tone: 'error' })
      await refreshRuns()
    }
  }

  const handleExport = async () => {
    if (!selectedRunId) return
    try {
      const blob = await api.exportBacktest(selectedRunId)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${selectedRunId}_export.zip`
      link.click()
      URL.revokeObjectURL(url)
      onToast({
        text: tr('toasts.exportSuccess', { id: selectedRunId }),
        tone: 'success',
      })
    } catch (error: unknown) {
      const errMsg =
        error instanceof Error ? error.message : tr('toasts.exportFailed')
      onToast({ text: errMsg, tone: 'error' })
    }
  }

  return (
    <div className="xl:col-span-2 space-y-4">
      {!selectedRunId ? (
        <div className="gl-aurora-panel rounded-2xl overflow-hidden">
          <EmptyState
            icon={AiBrain01Icon}
            title={tr('emptyStates.selectRun')}
            description={
              language === 'zh'
                ? '从左侧选择一次回测以查看结果'
                : 'Select a backtest run from the left to view results'
            }
            compact
          />
        </div>
      ) : (
        <>
          <div className="gl-prism-panel rounded-2xl p-4 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <ProgressRing
                  progress={
                    status?.progress_pct ??
                    selectedRun?.summary.progress_pct ??
                    0
                  }
                  size={80}
                />
                <div>
                  <h2
                    className="font-mono font-bold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {selectedRunId}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                      style={{
                        background: `${getStateColor(status?.state ?? selectedRun?.state ?? '')}20`,
                        color: getStateColor(
                          status?.state ?? selectedRun?.state ?? ''
                        ),
                      }}
                    >
                      {getStateIcon(status?.state ?? selectedRun?.state ?? '')}
                      {tr(`states.${status?.state ?? selectedRun?.state}`)}
                    </span>
                    {selectedRun?.summary.decision_tf && (
                      <span
                        className="text-xs"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {selectedRun.summary.decision_tf} ·{' '}
                        {selectedRun.summary.symbol_count} symbols
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {(status?.state === 'running' ||
                  selectedRun?.state === 'running') && (
                  <>
                    <button
                      onClick={() => handleControl('pause')}
                      className="p-2 rounded-lg transition-all hover:bg-[var(--surface-tertiary)]"
                      style={{ border: '1px solid var(--panel-border)' }}
                      title={tr('actions.pause')}
                    >
                      <HugeiconsIcon
                        icon={PauseIcon}
                        size={16}
                        strokeWidth={1.9}
                        style={{ color: 'var(--accent-primary)' }}
                      />
                    </button>
                    <button
                      onClick={() => handleControl('stop')}
                      className="p-2 rounded-lg transition-all hover:bg-[var(--surface-tertiary)]"
                      style={{ border: '1px solid var(--panel-border)' }}
                      title={tr('actions.stop')}
                    >
                      <HugeiconsIcon
                        icon={StopIcon}
                        size={16}
                        strokeWidth={1.9}
                        style={{ color: 'var(--binance-red)' }}
                      />
                    </button>
                  </>
                )}
                {status?.state === 'paused' && (
                  <button
                    onClick={() => handleControl('resume')}
                    className="p-2 rounded-lg transition-all hover:bg-[var(--surface-tertiary)]"
                    style={{ border: '1px solid var(--panel-border)' }}
                    title={tr('actions.resume')}
                  >
                    <HugeiconsIcon
                      icon={PlayIcon}
                      size={16}
                      strokeWidth={1.9}
                      style={{ color: 'var(--binance-green)' }}
                    />
                  </button>
                )}
                <button
                  onClick={handleExport}
                  className="p-2 rounded-lg transition-all hover:bg-[var(--surface-tertiary)]"
                  style={{ border: '1px solid var(--panel-border)' }}
                  title={tr('detail.exportLabel')}
                >
                  <HugeiconsIcon
                    icon={Download01Icon}
                    size={16}
                    strokeWidth={1.9}
                    style={{ color: 'var(--text-primary)' }}
                  />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 rounded-lg transition-all hover:bg-[var(--surface-tertiary)]"
                  style={{ border: '1px solid var(--panel-border)' }}
                  title={tr('detail.deleteLabel')}
                >
                  <HugeiconsIcon
                    icon={Delete02Icon}
                    size={16}
                    strokeWidth={1.9}
                    style={{ color: 'var(--binance-red)' }}
                  />
                </button>
              </div>
            </div>

            {(status?.note || status?.last_error) && (
              <div
                className="mt-3 p-2.5 rounded-lg text-xs flex items-center gap-2"
                style={{
                  background: 'var(--binance-red-bg)',
                  border: '1px solid rgba(246,70,93,0.3)',
                  color: 'var(--binance-red)',
                }}
              >
                <HugeiconsIcon
                  icon={AlertCircleIcon}
                  size={16}
                  strokeWidth={1.9}
                  className="flex-shrink-0"
                />
                {status?.note || status?.last_error}
              </div>
            )}

            {status?.positions && status.positions.length > 0 && (
              <PositionsDisplay
                positions={status.positions}
                language={language}
              />
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              icon={Coins01Icon}
              label={language === 'zh' ? '当前净值' : 'Equity'}
              value={(
                status?.equity ??
                selectedRun?.summary?.equity_last ??
                formBalance ??
                0
              ).toFixed(2)}
              suffix="USDT"
              language={language}
            />
            <StatCard
              icon={TradeUpIcon}
              label={language === 'zh' ? '总收益率' : 'Return'}
              value={`${(metrics?.total_return_pct ?? 0).toFixed(2)}%`}
              trend={(metrics?.total_return_pct ?? 0) >= 0 ? 'up' : 'down'}
              color={
                (metrics?.total_return_pct ?? 0) >= 0
                  ? 'var(--binance-green)'
                  : 'var(--binance-red)'
              }
              metricKey="total_return"
              language={language}
            />
            <StatCard
              icon={AlertCircleIcon}
              label={language === 'zh' ? '最大回撤' : 'Max DD'}
              value={`${(metrics?.max_drawdown_pct ?? selectedRun?.summary?.max_drawdown_pct ?? 0).toFixed(2)}%`}
              color="var(--binance-red)"
              metricKey="max_drawdown"
              language={language}
            />
            <StatCard
              icon={ChartBarLineIcon}
              label={language === 'zh' ? '夏普比率' : 'Sharpe'}
              value={(metrics?.sharpe_ratio ?? 0).toFixed(2)}
              metricKey="sharpe_ratio"
              language={language}
            />
          </div>

          <div className="gl-onyx-panel-b rounded-2xl overflow-hidden">
            <div
              className="flex border-b"
              style={{ borderColor: 'var(--panel-border)' }}
            >
              {(['overview', 'chart', 'trades', 'decisions'] as ViewTab[]).map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => onViewTabChange(tab)}
                    className="px-4 py-3 text-sm font-semibold transition-colors relative"
                    style={{
                      color:
                        viewTab === tab
                          ? 'var(--accent-primary)'
                          : 'var(--text-secondary)',
                      borderBottom:
                        viewTab === tab
                          ? '2px solid var(--accent-primary)'
                          : '2px solid transparent',
                    }}
                  >
                    {tab === 'overview'
                      ? language === 'zh'
                        ? '概览'
                        : 'Overview'
                      : tab === 'chart'
                        ? language === 'zh'
                          ? '图表'
                          : 'Chart'
                        : tab === 'trades'
                          ? language === 'zh'
                            ? '交易'
                            : 'Trades'
                          : language === 'zh'
                            ? 'AI决策'
                            : 'Decisions'}
                  </button>
                )
              )}
            </div>

            <div className="p-4">
              {viewTab === 'overview' && (
                <div>
                  {equity && equity.length > 0 ? (
                    <BacktestChart
                      key={selectedRunId}
                      equity={equity}
                      trades={trades ?? []}
                    />
                  ) : (
                    <div
                      className="py-12 text-center"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      {tr('charts.equityEmpty')}
                    </div>
                  )}

                  {metrics && !('error' in metrics) && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                      <div
                        className="p-3 rounded-lg"
                        style={{ background: 'var(--surface-secondary)' }}
                      >
                        <div
                          className="flex items-center gap-1 text-xs"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {language === 'zh' ? '胜率' : 'Win Rate'}
                          <MetricTooltip
                            metricKey="win_rate"
                            language={language}
                            size={11}
                          />
                        </div>
                        <div
                          className="text-lg font-bold"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {(metrics.win_rate ?? 0).toFixed(1)}%
                        </div>
                      </div>
                      <div
                        className="p-3 rounded-lg"
                        style={{ background: 'var(--surface-secondary)' }}
                      >
                        <div
                          className="flex items-center gap-1 text-xs"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {language === 'zh' ? '盈亏因子' : 'Profit Factor'}
                          <MetricTooltip
                            metricKey="profit_factor"
                            language={language}
                            size={11}
                          />
                        </div>
                        <div
                          className="text-lg font-bold"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {(metrics.profit_factor ?? 0).toFixed(2)}
                        </div>
                      </div>
                      <div
                        className="p-3 rounded-lg"
                        style={{ background: 'var(--surface-secondary)' }}
                      >
                        <div
                          className="text-xs"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {language === 'zh' ? '总交易数' : 'Total Trades'}
                        </div>
                        <div
                          className="text-lg font-bold"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {metrics.trades ?? 0}
                        </div>
                      </div>
                      <div
                        className="p-3 rounded-lg"
                        style={{ background: 'var(--surface-secondary)' }}
                      >
                        <div
                          className="text-xs"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {language === 'zh' ? '最佳币种' : 'Best Symbol'}
                        </div>
                        <div
                          className="text-lg font-bold"
                          style={{ color: 'var(--binance-green)' }}
                        >
                          {metrics.best_symbol?.replace('USDT', '') || '-'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {viewTab === 'chart' && (
                <div className="space-y-6">
                  <div>
                    <h4
                      className="text-sm font-medium mb-3"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {language === 'zh' ? '资金曲线' : 'Equity Curve'}
                    </h4>
                    {equity && equity.length > 0 ? (
                      <BacktestChart
                        key={`${selectedRunId}-chart`}
                        equity={equity}
                        trades={trades ?? []}
                      />
                    ) : (
                      <div
                        className="py-12 text-center"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        {tr('charts.equityEmpty')}
                      </div>
                    )}
                  </div>

                  {selectedRunId && trades && trades.length > 0 && (
                    <div>
                      <h4
                        className="text-sm font-medium mb-3"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {language === 'zh'
                          ? 'K线图 & 交易标记'
                          : 'Candlestick & Trade Markers'}
                      </h4>
                      <CandlestickChartComponent
                        runId={selectedRunId}
                        trades={trades}
                        language={language}
                      />
                    </div>
                  )}
                </div>
              )}

              {viewTab === 'trades' && <TradeTimeline trades={trades ?? []} />}

              {viewTab === 'decisions' && (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {decisions && decisions.length > 0 ? (
                    decisions.map((d) => (
                      <DecisionCard
                        key={`${d.cycle_number}-${d.timestamp}`}
                        decision={d}
                        language={language}
                      />
                    ))
                  ) : (
                    <div
                      className="py-12 text-center"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      {tr('decisionTrail.emptyHint')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
})
