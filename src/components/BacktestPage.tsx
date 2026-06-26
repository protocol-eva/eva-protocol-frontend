import { useCallback, useEffect, useState } from 'react'
import useSWR from 'swr'
import { HugeiconsIcon } from '@hugeicons/react'
import { FlashIcon, TestTube01Icon } from '@hugeicons/core-free-icons'
import { DashPage } from './dash/DashKit'
import { api } from '../lib/api'
import { useLanguage } from '../contexts/LanguageContext'
import { t } from '../i18n/translations'
import {
  type ViewTab,
  type ToastPayload,
  SWR_OPTS,
} from './backtest/backtestShared'
import { BacktestConfigPanel } from './backtest/BacktestConfigPanel'
import { BacktestResultsPanel } from './backtest/BacktestResultsPanel'

export function BacktestPage() {
  const { language } = useLanguage()
  const tr = useCallback(
    (key: string, params?: Record<string, string | number>) =>
      t(`backtestPage.${key}`, language, params),
    [language]
  )

  const [viewTab, setViewTab] = useState<ViewTab>('overview')
  const [pageVisible, setPageVisible] = useState(() =>
    typeof document === 'undefined' ? true : !document.hidden
  )
  const [selectedRunId, setSelectedRunId] = useState<string>()
  const [compareRunIds, setCompareRunIds] = useState<string[]>([])
  const [toast, setToast] = useState<ToastPayload | null>(null)
  const [wizardResetSignal, setWizardResetSignal] = useState(0)
  const [formBalance, setFormBalance] = useState(1000)

  const { data: runsResp, mutate: refreshRuns } = useSWR(
    ['backtest-runs'],
    () => api.getBacktestRuns({ limit: 100, offset: 0 }),
    { ...SWR_OPTS, refreshInterval: pageVisible ? 10000 : 0 }
  )
  const runs = runsResp?.items ?? []

  useEffect(() => {
    const onVisibilityChange = () => setPageVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () =>
      document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  useEffect(() => {
    if (!selectedRunId && runs.length > 0) {
      setSelectedRunId(runs[0].run_id)
    }
  }, [runs, selectedRunId])

  const handleToast = useCallback(
    (payload: ToastPayload) => setToast(payload),
    []
  )
  const toggleCompare = useCallback((runId: string) => {
    setCompareRunIds((prev) =>
      prev.includes(runId)
        ? prev.filter((id) => id !== runId)
        : [...prev, runId].slice(-3)
    )
  }, [])

  return (
    <DashPage>
      <div className="space-y-6">
        {toast && (
          <div
            className="p-3 rounded-xl text-sm"
            style={{
              background:
                toast.tone === 'error'
                  ? 'var(--binance-red-bg)'
                  : toast.tone === 'success'
                    ? 'var(--binance-green-bg)'
                    : 'var(--accent-primary-bg)',
              color:
                toast.tone === 'error'
                  ? 'var(--binance-red)'
                  : toast.tone === 'success'
                    ? 'var(--binance-green)'
                    : 'var(--accent-primary)',
              border: `1px solid ${toast.tone === 'error' ? 'var(--binance-red-border)' : toast.tone === 'success' ? 'var(--binance-green-border)' : 'var(--accent-primary-border)'}`,
            }}
          >
            {toast.text}
          </div>
        )}

        <div className="gl-metal-panel rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <span className="dash-kpi-ico shrink-0">
              <HugeiconsIcon
                icon={TestTube01Icon}
                size={22}
                strokeWidth={1.8}
              />
            </span>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight gl-metal-text leading-none">
                {tr('title')}
              </h1>
              <p
                className="text-sm mt-1.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                {tr('subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setWizardResetSignal((n) => n + 1)}
            className="gl-navbar-btn px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2"
          >
            <HugeiconsIcon icon={FlashIcon} size={16} strokeWidth={2} />
            {language === 'zh' ? '新建回测' : 'New Backtest'}
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <BacktestConfigPanel
            selectedRunId={selectedRunId}
            onSelectRun={setSelectedRunId}
            compareRunIds={compareRunIds}
            onToggleCompare={toggleCompare}
            runs={runs}
            refreshRuns={refreshRuns}
            language={language}
            onToast={handleToast}
            onRunStarted={setSelectedRunId}
            wizardResetSignal={wizardResetSignal}
            onFormBalanceChange={setFormBalance}
          />
          <BacktestResultsPanel
            selectedRunId={selectedRunId}
            onSelectRun={setSelectedRunId}
            onRunDeleted={(runId) =>
              setCompareRunIds((prev) => prev.filter((id) => id !== runId))
            }
            viewTab={viewTab}
            onViewTabChange={setViewTab}
            runs={runs}
            refreshRuns={refreshRuns}
            language={language}
            onToast={handleToast}
            formBalance={formBalance}
          />
        </div>
      </div>
    </DashPage>
  )
}
