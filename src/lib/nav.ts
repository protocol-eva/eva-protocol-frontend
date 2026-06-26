/**
 * SPA navigation — pathname-only routing (no legacy hash routes).
 *
 * Always use `goTo()` for in-app navigation so App.tsx, BrowserRouter, and
 * history stay in sync. Do not call pushState + setRoute separately.
 */
export type AppPage =
  | 'competition'
  | 'traders'
  | 'trader'
  | 'backtest'
  | 'strategy'
  | 'strategy-market'
  | 'data'
  | 'news'
  | 'debate'
  | 'faq'
  | 'login'
  | 'register'
  | 'tokenomics'
  | 'upgrade'

export const PAGE_PATHS: Record<AppPage, string> = {
  competition: '/competition',
  'strategy-market': '/strategy-market',
  data: '/data',
  news: '/news',
  traders: '/traders',
  trader: '/dashboard',
  backtest: '/backtest',
  strategy: '/strategy',
  debate: '/debate',
  faq: '/faq',
  login: '/login',
  register: '/register',
  tokenomics: '/tokenomics',
  upgrade: '/upgrade',
}

/** Map pathname → page id. Hash fragments are ignored (legacy hash routing removed). */
export function getPageFromPath(pathname: string): AppPage {
  const path = pathname.split('?')[0] || '/'
  if (path === '/traders') return 'traders'
  if (path === '/backtest') return 'backtest'
  if (path === '/strategy') return 'strategy'
  if (path === '/strategy-market') return 'strategy-market'
  if (path === '/data') return 'data'
  if (path === '/news') return 'news'
  if (path === '/debate') return 'debate'
  if (path === '/dashboard') return 'trader'
  if (path === '/tokenomics') return 'tokenomics'
  if (path === '/upgrade') return 'upgrade'
  if (path === '/faq' || path === '/docs') return 'faq'
  if (path === '/login') return 'login'
  if (path === '/register') return 'register'
  if (path === '/competition') return 'competition'
  return 'competition'
}

export function goTo(path: string): void {
  if (typeof window === 'undefined') return
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo({ top: 0 })
}
