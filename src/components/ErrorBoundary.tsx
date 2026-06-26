import { Component, type ReactNode, type ErrorInfo } from 'react'

/* ============================================================================
   ErrorBoundary — a REAL boundary that shows a recoverable fallback instead of
   blanking the whole app.

   The old root boundary (main.tsx) rendered `null` on ANY error and called
   setState() inside render() — so a single thrown render anywhere = total white
   screen + potential re-render loop (the page froze so hard you couldn't even
   open devtools). This replaces that behaviour:

   - getDerivedStateFromError stores the error (no setState-in-render).
   - render() shows a dark, on-brand fallback card with the message + actions.
   - resetKey: when it changes (e.g. the route/page changes), the boundary
     clears its error automatically — THIS is what fixes "navigate away, the URL
     changes but the broken page is stuck / I can't go back."
   - Benign browser-extension DOM errors (Grammarly et al. mutate the DOM and
     throw insertBefore/removeChild) are swallowed silently — not our bug.

   Use it granularly: one around the lazy <Suspense> page area (resetKey=route),
   one around the 3D <Canvas> so a lost WebGL context only drops the coins, and
   one at the root as a last resort.
   ========================================================================== */

type Props = {
  children: ReactNode
  /** When this value changes, a currently-shown error is cleared. Pass the
   *  current route/page so navigating away always recovers. */
  resetKey?: string | number
  /** Render-prop fallback. If omitted, a default dark card is shown. */
  fallback?: (error: Error, reset: () => void) => ReactNode
  /** Identifies this boundary in console logs. */
  name?: string
  /** Hide the default fallback entirely (render nothing). Use for non-critical
   *  decorative subtrees like the 3D canvas, where a blank is better than a card. */
  silent?: boolean
}

type State = { error: Error | null }

const BENIGN =
  /insertBefore|removeChild|appendChild|NotFoundError|The node to be removed/i

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidUpdate(prev: Props) {
    // Recover automatically when the thing we're guarding changes (navigation).
    if (this.state.error && prev.resetKey !== this.props.resetKey) {
      this.setState({ error: null })
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (BENIGN.test(error.message || '')) {
      // Browser-extension DOM mutation, not an app bug — recover silently.
      this.setState({ error: null })
      return
    }
    const tag = this.props.name ? `:${this.props.name}` : ''
    console.error(`[ErrorBoundary${tag}]`, error, info.componentStack)
  }

  reset = () => this.setState({ error: null })

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    if (this.props.silent) return null
    if (this.props.fallback) return this.props.fallback(error, this.reset)
    return <DefaultFallback error={error} reset={this.reset} />
  }
}

function DefaultFallback({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div
      role="alert"
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'var(--surface-primary, #08090c)',
        color: 'var(--text-primary, #e6e8ed)',
      }}
    >
      <div
        style={{
          maxWidth: 520,
          width: '100%',
          borderRadius: 16,
          padding: '28px 26px',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 14%), linear-gradient(180deg, #16171c 0%, #0d0e12 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderTop: '1px solid rgba(255,255,255,0.18)',
          boxShadow: '0 22px 55px rgba(0,0,0,0.6)',
        }}
      >
        <div
          style={{
            fontSize: 13,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(16,185,129,0.9)',
            fontWeight: 800,
          }}
        >
          Something broke on this page
        </div>
        <p
          style={{
            marginTop: 10,
            fontSize: 14,
            lineHeight: 1.5,
            color: 'rgba(255,255,255,0.62)',
          }}
        >
          The rest of the app is fine — only this view hit an error. You can
          retry it or go back to the home page.
        </p>
        <pre
          style={{
            marginTop: 14,
            padding: '10px 12px',
            borderRadius: 10,
            background: 'rgba(0,0,0,0.45)',
            border: '1px solid rgba(255,255,255,0.06)',
            fontSize: 12,
            color: '#ff9b9b',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxHeight: 140,
            overflow: 'auto',
          }}
        >
          {error.message || String(error)}
        </pre>
        <div style={{ marginTop: 18, display: 'flex', gap: 10 }}>
          <button
            onClick={reset}
            style={{
              flex: 1,
              padding: '11px 16px',
              borderRadius: 12,
              border: '1px solid rgba(16,185,129,0.4)',
              background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
          <button
            onClick={() => {
              window.history.pushState({}, '', '/')
              window.dispatchEvent(new PopStateEvent('popstate'))
              reset()
            }}
            style={{
              flex: 1,
              padding: '11px 16px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.85)',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Go home
          </button>
        </div>
      </div>
    </div>
  )
}

export default ErrorBoundary
