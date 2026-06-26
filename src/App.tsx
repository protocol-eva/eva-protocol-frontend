import {
  useEffect,
  useState,
  lazy,
  Suspense,
  startTransition,
  type ComponentType,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useSWR from 'swr'
import { api } from './lib/api'
// Always-on, lightweight components stay statically imported:
import { LoginRequiredOverlay } from './components/LoginRequiredOverlay'
import { LoadingScreen } from './components/LoadingScreen'
import HeaderBar from './components/HeaderBar'
import { OnboardingDialog } from './components/OnboardingDialog'
import { ErrorBoundary } from './components/ErrorBoundary'

// ── Every page is lazy-loaded (code-split) so the initial bundle is small and
//    each route only pulls its own chunk + shared vendor chunks. These are
//    NAMED exports, so the `.then(m => ({ default: m.X }))` shim is required. ──
//
// lazyWithReload: if a chunk import FAILS — the #1 production cause of "URL
// changes but the page stays frozen": after a redeploy the open tab still
// references the OLD hashed chunk filename, which now 404s, so the lazy render
// suspends FOREVER and the navbar locks up — reload ONCE to pull fresh assets
// instead of hanging. (Combined with the top-level <Suspense> in main.tsx and
// startTransition on navigation, this kills the prod-only nav freeze.)
function lazyWithReload(
  factory: () => Promise<{ default: ComponentType<any> }>
) {
  return lazy(() =>
    factory().catch((err) => {
      const KEY = 'eva:chunk-reloaded'
      if (
        typeof sessionStorage !== 'undefined' &&
        !sessionStorage.getItem(KEY)
      ) {
        sessionStorage.setItem(KEY, '1')
        window.location.reload()
        return new Promise<{ default: ComponentType<any> }>(() => {})
      }
      throw err
    })
  )
}

const TraderDashboardPage = lazyWithReload(() =>
  import('./pages/TraderDashboardPage').then((m) => ({
    default: m.TraderDashboardPage,
  }))
)
const AITradersPage = lazyWithReload(() =>
  import('./components/AITradersPage').then((m) => ({
    default: m.AITradersPage,
  }))
)
const LoginPage = lazyWithReload(() =>
  import('./components/LoginPage').then((m) => ({ default: m.LoginPage }))
)
const RegisterPage = lazyWithReload(() =>
  import('./components/RegisterPage').then((m) => ({ default: m.RegisterPage }))
)
const ResetPasswordPage = lazyWithReload(() =>
  import('./components/ResetPasswordPage').then((m) => ({
    default: m.ResetPasswordPage,
  }))
)
const CompetitionPage = lazyWithReload(() =>
  import('./components/CompetitionPage').then((m) => ({
    default: m.CompetitionPage,
  }))
)
const LandingPage = lazyWithReload(() =>
  import('./pages/LandingPage').then((m) => ({ default: m.LandingPage }))
)
const TradePage = lazyWithReload(() =>
  import('./pages/TradePage').then((m) => ({ default: m.TradePage }))
)
const TokenomicsPage = lazyWithReload(() =>
  import('./pages/TokenomicsPage').then((m) => ({ default: m.TokenomicsPage }))
)
const UpgradePage = lazyWithReload(() =>
  import('./pages/UpgradePage').then((m) => ({ default: m.UpgradePage }))
)
const DocsPage = lazyWithReload(() =>
  import('./pages/DocsPage').then((m) => ({ default: m.DocsPage }))
)
const StrategyStudioPage = lazyWithReload(() =>
  import('./pages/StrategyStudioPage').then((m) => ({
    default: m.StrategyStudioPage,
  }))
)
const DebateArenaPage = lazyWithReload(() =>
  import('./pages/DebateArenaPage').then((m) => ({
    default: m.DebateArenaPage,
  }))
)
const StrategyMarketPage = lazyWithReload(() =>
  import('./pages/StrategyMarketPage').then((m) => ({
    default: m.StrategyMarketPage,
  }))
)
const DataPage = lazyWithReload(() =>
  import('./pages/DataPage').then((m) => ({ default: m.DataPage }))
)
const NewsPage = lazyWithReload(() =>
  import('./pages/NewsPage').then((m) => ({ default: m.NewsPage }))
)
const AuthGatePage = lazyWithReload(() =>
  import('./components/AuthGatePage').then((m) => ({ default: m.AuthGatePage }))
)
const BacktestPage = lazyWithReload(() =>
  import('./components/BacktestPage').then((m) => ({ default: m.BacktestPage }))
)
import { LanguageProvider, useLanguage } from './contexts/LanguageContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { useAppKitTheme } from '@reown/appkit/react'
import { ConfirmDialogProvider } from './components/ConfirmDialog'
import { t } from './i18n/translations'
import { useSystemConfig } from './hooks/useSystemConfig'
import { APPKIT_THEME_VARIABLES } from './config/appkitTheme'
import { goTo, getPageFromPath, PAGE_PATHS, type AppPage } from './lib/nav'

import { OFFICIAL_LINKS } from './constants/branding'
import type {
  SystemStatus,
  AccountInfo,
  Position,
  DecisionRecord,
  Statistics,
  TraderInfo,
  Exchange,
} from './types'

type Page = AppPage

function App() {
  const { language, setLanguage } = useLanguage()
  const { user, token, logout, isLoading } = useAuth()
  const { loading: configLoading } = useSystemConfig()
  const { setThemeMode, setThemeVariables } = useAppKitTheme()
  const [route, setRoute] = useState(window.location.pathname)

  useEffect(() => {
    setThemeMode('dark')
    setThemeVariables(APPKIT_THEME_VARIABLES)
  }, [setThemeMode, setThemeVariables])

  // Debug log + reset the stale-chunk reload guard once the app mounts OK, so a
  // later failed chunk (after the NEXT redeploy) can reload again.
  useEffect(() => {
    console.log('[App] Mounted. Route:', window.location.pathname)
    try {
      sessionStorage.removeItem('eva:chunk-reloaded')
    } catch {
      /* ignore */
    }
  }, [])

  // Login required overlay state
  const [loginOverlayOpen, setLoginOverlayOpen] = useState(false)
  const [loginOverlayFeature, setLoginOverlayFeature] = useState('')

  const handleLoginRequired = (featureName: string) => {
    setLoginOverlayFeature(featureName)
    setLoginOverlayOpen(true)
  }

  const navigateToPage = (page: Page) => {
    const path = PAGE_PATHS[page]
    if (path) goTo(path)
  }

  // `route` (pathname) is the single source of truth; page id is derived from it.
  const currentPage = getPageFromPath(route)
  // 从 URL 参数读取初始 trader 标识（格式: name-id前4位）
  const [selectedTraderSlug, setSelectedTraderSlug] = useState<
    string | undefined
  >(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('trader') || undefined
  })
  const [selectedTraderId, setSelectedTraderId] = useState<string | undefined>()

  // 生成 trader URL slug（name + ID 前 4 位）
  const getTraderSlug = (trader: TraderInfo) => {
    const idPrefix = trader.trader_id.slice(0, 4)
    return `${trader.trader_name}-${idPrefix}`
  }

  // 从 slug 解析并匹配 trader
  const findTraderBySlug = (slug: string, traderList: TraderInfo[]) => {
    // slug 格式: name-xxxx (xxxx 是 ID 前 4 位)
    const lastDashIndex = slug.lastIndexOf('-')
    if (lastDashIndex === -1) {
      // 没有 dash，直接按 name 匹配
      return traderList.find((t) => t.trader_name === slug)
    }
    const name = slug.slice(0, lastDashIndex)
    const idPrefix = slug.slice(lastDashIndex + 1)
    return traderList.find(
      (t) => t.trader_name === name && t.trader_id.startsWith(idPrefix)
    )
  }
  const [lastUpdate, setLastUpdate] = useState<string>('--:--:--')
  const [decisionsLimit, setDecisionsLimit] = useState<number>(5)

  // 监听URL变化，同步页面状态 — the ONE handler that keeps route + currentPage in
  // sync on browser Back/Forward and on goTo()'s synthetic popstate.
  useEffect(() => {
    const handleRouteChange = () => {
      const path = window.location.pathname
      const traderParam = new URLSearchParams(window.location.search).get(
        'trader'
      )
      if (traderParam) setSelectedTraderSlug(traderParam)
      // `route` (pathname) is the single source of truth; `currentPage` derives
      // from it, so they can never desync. startTransition so a Back/logo nav to
      // a not-yet-loaded lazy page doesn't freeze the UI.
      startTransition(() => setRoute(path))
    }

    window.addEventListener('popstate', handleRouteChange)
    return () => {
      window.removeEventListener('popstate', handleRouteChange)
    }
  }, [])

  // 切换页面时更新URL hash (当前通过按钮直接调用setCurrentPage，这个函数暂时保留用于未来扩展)
  // const navigateToPage = (page: Page) => {
  //   setCurrentPage(page);
  //   window.location.hash = page === 'competition' ? '' : 'trader';
  // };

  // 获取trader列表（仅在用户登录时）
  const { data: traders, error: tradersError } = useSWR<TraderInfo[]>(
    user && token ? 'traders' : null,
    api.getTraders,
    {
      refreshInterval: 10000,
      shouldRetryOnError: false, // 避免在后端未运行时无限重试
    }
  )

  // 获取exchanges列表（用于显示交易所名称）
  const { data: exchanges } = useSWR<Exchange[]>(
    user && token ? 'exchanges' : null,
    api.getExchangeConfigs,
    {
      refreshInterval: 60000, // 1分钟刷新一次
      shouldRetryOnError: false,
    }
  )

  // 当获取到traders后，根据 URL 中的 trader slug 设置选中的 trader，或默认选中第一个
  useEffect(() => {
    if (traders && traders.length > 0 && !selectedTraderId) {
      if (selectedTraderSlug) {
        // 通过 slug 找到对应的 trader
        const trader = findTraderBySlug(selectedTraderSlug, traders)
        if (trader) {
          setSelectedTraderId(trader.trader_id)
        } else {
          // 如果找不到，选中第一个
          setSelectedTraderId(traders[0].trader_id)
        }
      } else {
        setSelectedTraderId(traders[0].trader_id)
      }
    }
  }, [traders, selectedTraderId, selectedTraderSlug])

  // 如果在trader页面，获取该trader的数据
  const { data: status } = useSWR<SystemStatus>(
    currentPage === 'trader' && selectedTraderId
      ? `status-${selectedTraderId}`
      : null,
    () => api.getStatus(selectedTraderId),
    {
      refreshInterval: 15000, // 15秒刷新（配合后端15秒缓存）
      revalidateOnFocus: false, // 禁用聚焦时重新验证，减少请求
      dedupingInterval: 10000, // 10秒去重，防止短时间内重复请求
    }
  )

  const { data: account } = useSWR<AccountInfo>(
    currentPage === 'trader' && selectedTraderId
      ? `account-${selectedTraderId}`
      : null,
    () => api.getAccount(selectedTraderId),
    {
      refreshInterval: 15000, // 15秒刷新（配合后端15秒缓存）
      revalidateOnFocus: false, // 禁用聚焦时重新验证，减少请求
      dedupingInterval: 10000, // 10秒去重，防止短时间内重复请求
    }
  )

  const { data: positions } = useSWR<Position[]>(
    currentPage === 'trader' && selectedTraderId
      ? `positions-${selectedTraderId}`
      : null,
    () => api.getPositions(selectedTraderId),
    {
      refreshInterval: 15000, // 15秒刷新（配合后端15秒缓存）
      revalidateOnFocus: false, // 禁用聚焦时重新验证，减少请求
      dedupingInterval: 10000, // 10秒去重，防止短时间内重复请求
    }
  )

  const { data: decisions } = useSWR<DecisionRecord[]>(
    currentPage === 'trader' && selectedTraderId
      ? `decisions/latest-${selectedTraderId}-${decisionsLimit}`
      : null,
    () => api.getLatestDecisions(selectedTraderId, decisionsLimit),
    {
      refreshInterval: 30000, // 30秒刷新（决策更新频率较低）
      revalidateOnFocus: false,
      dedupingInterval: 20000,
    }
  )

  const { data: stats } = useSWR<Statistics>(
    currentPage === 'trader' && selectedTraderId
      ? `statistics-${selectedTraderId}`
      : null,
    () => api.getStatistics(selectedTraderId),
    {
      refreshInterval: 30000, // 30秒刷新（统计数据更新频率较低）
      revalidateOnFocus: false,
      dedupingInterval: 20000,
    }
  )

  useEffect(() => {
    if (account) {
      const now = new Date().toLocaleTimeString()
      setLastUpdate(now)
    }
  }, [account])

  const selectedTrader = traders?.find((t) => t.trader_id === selectedTraderId)

  // (Removed two redundant route listeners that duplicated/contradicted the
  // single handleRouteChange above — they had no cases for /tokenomics,
  // /upgrade, /docs which is exactly why navigation desynced.)

  // Show the loading screen while checking auth or config — same look as the
  // landing loader, so there's no orange flash before the page mounts.
  if (isLoading || configLoading) {
    return <LoadingScreen fadingOut={false} />
  }

  // Handle specific routes regardless of authentication
  if (route === '/login') {
    return <LoginPage />
  }
  if (route === '/register') {
    return <RegisterPage />
  }
  if (route === '/faq' || route === '/docs') {
    // Documentation: NO global navbar here (it cluttered this page) — DocsLayout
    // is a self-contained full-screen layout with its own back button.
    return (
      <div
        className="min-h-screen"
        style={{
          background: 'var(--surface-primary)',
          color: 'var(--text-primary)',
        }}
      >
        <DocsPage />
        <LoginRequiredOverlay
          isOpen={loginOverlayOpen}
          onClose={() => setLoginOverlayOpen(false)}
          featureName={loginOverlayFeature}
        />
      </div>
    )
  }
  if (route === '/reset-password') {
    return <ResetPasswordPage />
  }
  if (route === '/trade') {
    return <TradePage />
  }
  if (route === '/tokenomics') {
    return <TokenomicsPage />
  }
  if (route === '/upgrade') {
    return <UpgradePage />
  }
  // Data page - publicly accessible even without login
  if (route === '/data' && (!user || !token)) {
    return (
      <div
        className="min-h-screen"
        style={{
          background: 'var(--surface-primary)',
          color: 'var(--text-primary)',
        }}
      >
        <HeaderBar
          isLoggedIn={false}
          currentPage="data"
          language={language}
          onLanguageChange={setLanguage}
          user={null}
          onLogout={logout}
          onLoginRequired={handleLoginRequired}
          onPageChange={navigateToPage}
        />
        <main className="pt-16">
          <DataPage />
        </main>
        <LoginRequiredOverlay
          isOpen={loginOverlayOpen}
          onClose={() => setLoginOverlayOpen(false)}
          featureName={loginOverlayFeature}
        />
      </div>
    )
  }
  // News page - publicly accessible even without login
  if (route === '/news' && (!user || !token)) {
    return (
      <div
        className="min-h-screen"
        style={{
          background: 'var(--surface-primary)',
          color: 'var(--text-primary)',
        }}
      >
        <HeaderBar
          isLoggedIn={false}
          currentPage="news"
          language={language}
          onLanguageChange={setLanguage}
          user={null}
          onLogout={logout}
          onLoginRequired={handleLoginRequired}
          onPageChange={navigateToPage}
        />
        <main className="pt-16">
          <NewsPage />
        </main>
        <LoginRequiredOverlay
          isOpen={loginOverlayOpen}
          onClose={() => setLoginOverlayOpen(false)}
          featureName={loginOverlayFeature}
        />
      </div>
    )
  }
  // Show landing page for root route
  if (route === '/' || route === '') {
    return <LandingPage />
  }

  // Redirect to auth gate only when NOT authenticated. A failed *optional*
  // system-config fetch must not lock authenticated users out of the whole app
  // — in production the /api/config endpoint may be absent, which used to gate
  // every page behind "Sign in required". Pages handle their own data failures.
  if (!user || !token) {
    return <AuthGatePage returnPath={route} />
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'var(--surface-primary)',
        color: 'var(--text-primary)',
      }}
    >
      <HeaderBar
        isLoggedIn={!!user}
        currentPage={
          currentPage as Parameters<typeof HeaderBar>[0]['currentPage']
        }
        language={language}
        onLanguageChange={setLanguage}
        user={user}
        onLogout={logout}
        onLoginRequired={handleLoginRequired}
        onPageChange={navigateToPage}
      />

      {/* Main Content with Page Transitions — wrapped in a page-level boundary
          so a single broken page shows a fallback and the HEADER stays alive
          (you can navigate away) instead of the whole SPA white-screening.
          resetKey={currentPage} clears the error automatically on navigation. */}
      <main className="min-h-screen pt-16">
        <ErrorBoundary name="page" resetKey={currentPage}>
          <AnimatePresence initial={false}>
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
            >
              <Suspense fallback={<LoadingScreen fadingOut={false} />}>
                {currentPage === 'competition' ? (
                  <CompetitionPage />
                ) : currentPage === 'data' ? (
                  <DataPage />
                ) : currentPage === 'news' ? (
                  <NewsPage />
                ) : currentPage === 'strategy-market' ? (
                  <StrategyMarketPage />
                ) : currentPage === 'traders' ? (
                  <AITradersPage
                    onTraderSelect={(traderId: string) => {
                      setSelectedTraderId(traderId)
                      goTo('/dashboard')
                    }}
                  />
                ) : currentPage === 'backtest' ? (
                  <BacktestPage />
                ) : currentPage === 'strategy' ? (
                  <StrategyStudioPage />
                ) : currentPage === 'debate' ? (
                  <DebateArenaPage />
                ) : (
                  <TraderDashboardPage
                    selectedTrader={selectedTrader}
                    status={status}
                    account={account}
                    positions={positions}
                    decisions={decisions}
                    decisionsLimit={decisionsLimit}
                    onDecisionsLimitChange={setDecisionsLimit}
                    stats={stats}
                    lastUpdate={lastUpdate}
                    language={language}
                    traders={traders}
                    tradersError={tradersError}
                    selectedTraderId={selectedTraderId}
                    onTraderSelect={(traderId: string) => {
                      setSelectedTraderId(traderId)
                      // 更新 URL 参数（使用 slug: name-id前4位）
                      const trader = traders?.find(
                        (t) => t.trader_id === traderId
                      )
                      if (trader) {
                        const url = new URL(window.location.href)
                        url.searchParams.set('trader', getTraderSlug(trader))
                        window.history.replaceState({}, '', url.toString())
                      }
                    }}
                    onNavigateToTraders={() => goTo('/traders')}
                    exchanges={exchanges}
                  />
                )}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </ErrorBoundary>
      </main>

      {/* Footer - Hidden on debate page */}
      {currentPage !== 'debate' && (
        <footer
          className="mt-16"
          style={{
            borderTop: '1px solid var(--footer-border)',
            background: 'var(--footer-bg)',
          }}
        >
          <div
            className="max-w-[1920px] mx-auto px-6 py-6 text-center text-sm"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <p>{t('footerTitle', language)}</p>
            <p className="mt-1">{t('footerWarning', language)}</p>
            <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
              {[
                {
                  href: OFFICIAL_LINKS.github,
                  label: 'GitHub',
                  icon: (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                    </svg>
                  ),
                },
                {
                  href: OFFICIAL_LINKS.twitter,
                  label: 'Twitter',
                  icon: (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  ),
                },
                {
                  href: OFFICIAL_LINKS.telegram,
                  label: 'Telegram',
                  icon: (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                    </svg>
                  ),
                },
              ].map(({ href, label, icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-all hover:scale-105"
                  style={{
                    background: 'var(--surface-secondary)',
                    color: 'var(--text-tertiary)',
                    border: '1px solid var(--panel-border)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--text-primary)'
                    e.currentTarget.style.borderColor =
                      'var(--surface-tertiary)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-tertiary)'
                    e.currentTarget.style.borderColor = 'var(--panel-border)'
                  }}
                >
                  {icon}
                  {label}
                </a>
              ))}
            </div>
          </div>
        </footer>
      )}

      {/* Login Required Overlay */}
      <LoginRequiredOverlay
        isOpen={loginOverlayOpen}
        onClose={() => setLoginOverlayOpen(false)}
        featureName={loginOverlayFeature}
      />

      <OnboardingDialog language={language} />
    </div>
  )
}

// Wrap App with providers
export default function AppWithProviders() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <ConfirmDialogProvider>
            <ErrorBoundary name="app">
              <Suspense fallback={<LoadingScreen fadingOut={false} />}>
                <App />
              </Suspense>
            </ErrorBoundary>
          </ConfirmDialogProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
