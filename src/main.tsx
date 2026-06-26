import { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { Toaster } from 'sonner'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { WagmiProvider } from 'wagmi'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient, wagmiAdapter } from './config/wallet'
import { ErrorBoundary } from './components/ErrorBoundary'
import { LoadingScreen } from './components/LoadingScreen'

// NOTE: React.StrictMode is intentionally OFF. In dev it double-mounts every
// component, which means the heavy WebGL scenes (CoinField + the liquid-metal
// shader) create → dispose → recreate their GL contexts on every mount. With
// the landing's 3D scene that double-churn stalls the GPU on re-navigation
// (go to a page, come back → freeze). StrictMode's double-invoke is dev-only
// and never runs in production, so removing it costs nothing at runtime and
// makes dev behave like prod. (See audit: main.tsx StrictMode × WebGL churn.)
ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <ErrorBoundary name="root">
      <Toaster
        theme="dark"
        richColors
        closeButton
        position="top-center"
        duration={2200}
        toastOptions={{
          className: 'nofx-toast',
          style: {
            background: '#0b0e11',
            border: '1px solid var(--panel-border)',
            color: 'var(--text-primary)',
          },
        }}
      />
      <WagmiProvider config={wagmiAdapter.wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          {/* Top-level Suspense — App's early returns render LAZY pages
                (LandingPage, DataPage, AuthGate…) with NO local boundary. In
                production those chunks load on demand, so navigating to one that
                isn't loaded yet suspends; without this boundary React bails and
                the page "doesn't change" (the prod-only back/home nav bug). */}
          <Suspense fallback={<LoadingScreen fadingOut={false} />}>
            <App />
          </Suspense>
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorBoundary>
  </BrowserRouter>
)

// --- First-paint splash (#app-loader in index.html) ---------------------------
// Keep the EVA splash up until the web fonts have actually loaded so the
// fallback -> web-font swap happens behind it (no visible FOUT), with a small
// minimum on-screen time so the animation never just flashes, and a hard cap so
// a slow/failed font fetch can never trap the user on the loader.
const SPLASH_MIN_MS = 600
const SPLASH_MAX_MS = 2800
const splashStart = performance.now()

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const fontsReady = (): Promise<unknown> => {
  if (typeof document === 'undefined' || !('fonts' in document))
    return Promise.resolve()
  return Promise.all([
    document.fonts.load('400 1em "Inter"'),
    document.fonts.load('700 1em "Inter"'),
    document.fonts.load('400 1em "Public Sans"'),
    document.fonts.load('600 1em "Public Sans"'),
  ])
    .then(() => document.fonts.ready)
    .catch(() => undefined)
}

const hideAppLoader = () => {
  const el = document.getElementById('app-loader')
  if (!el) return
  el.classList.add('is-hidden')
  const remove = () => el.remove()
  el.addEventListener('transitionend', remove, { once: true })
  // Fallback in case the fade transition is skipped (e.g. reduced-motion).
  setTimeout(remove, 800)
}

Promise.race([fontsReady(), delay(SPLASH_MAX_MS)])
  .then(() =>
    delay(Math.max(0, SPLASH_MIN_MS - (performance.now() - splashStart)))
  )
  .then(hideAppLoader)
