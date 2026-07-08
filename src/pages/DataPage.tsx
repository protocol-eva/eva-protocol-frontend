import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useLanguage } from '../contexts/LanguageContext'
import TokenSelect, { type TokenOption } from '../components/TokenSelect'

// ─── Types ───────────────────────────────────────────────────────────────────

interface TickerData {
  symbol: string
  price: string
  change: string
  changePercent: string
}

interface GlobalData {
  totalMarketCap: number
  btcDominance: number
  totalVolume: number
  marketCapChange: number
}

interface CoinRow {
  id: string
  rank: number
  name: string
  symbol: string
  image: string
  price: number
  change24h: number
  change7d: number
  marketCap: number
  volume: number
}

interface TrendingCoin {
  id: string
  name: string
  symbol: string
  thumb: string
  price: number
  change24h: number
  rank: number
  binanceSymbol: string
}

interface TopGainer {
  id: string
  name: string
  symbol: string
  image: string
  price: number
  change24h: number
  binanceSymbol: string
}

interface FearGreed {
  value: string
  classification: string
}

type BinanceTickerResponse = Array<{
  symbol: string
  lastPrice: string
  priceChangePercent: string
}>

type FearGreedResponse = {
  data?: Array<{ value: string; value_classification: string }>
} | null

// ─── Constants ────────────────────────────────────────────────────────────────

const TICKER_SYMBOLS = [
  'BTCUSDT',
  'ETHUSDT',
  'SOLUSDT',
  'BNBUSDT',
  'XRPUSDT',
  'DOGEUSDT',
  'ADAUSDT',
  'AVAXUSDT',
  'LINKUSDT',
  'DOTUSDT',
  'POLUSDT',
  'UNIUSDT',
  'LTCUSDT',
  'ATOMUSDT',
  'NEARUSDT',
  'APTUSDT',
  'ARBUSDT',
  'OPUSDT',
  'INJUSDT',
  'SUIUSDT',
  'TIAUSDT',
  'JUPUSDT',
  'WIFUSDT',
  'BONKUSDT',
  'PEPEUSDT',
]
const TICKER_DISPLAY: Record<string, string> = {
  BTCUSDT: 'BTC',
  ETHUSDT: 'ETH',
  SOLUSDT: 'SOL',
  BNBUSDT: 'BNB',
  XRPUSDT: 'XRP',
  DOGEUSDT: 'DOGE',
  ADAUSDT: 'ADA',
  AVAXUSDT: 'AVAX',
  LINKUSDT: 'LINK',
  DOTUSDT: 'DOT',
  POLUSDT: 'MATIC',
  UNIUSDT: 'UNI',
  LTCUSDT: 'LTC',
  ATOMUSDT: 'ATOM',
  NEARUSDT: 'NEAR',
  APTUSDT: 'APT',
  ARBUSDT: 'ARB',
  OPUSDT: 'OP',
  INJUSDT: 'INJ',
  SUIUSDT: 'SUI',
  TIAUSDT: 'TIA',
  JUPUSDT: 'JUP',
  WIFUSDT: 'WIF',
  BONKUSDT: 'BONK',
  PEPEUSDT: 'PEPE',
}
const TICKER_TTL = 30_000
const _tickerCache: { data?: BinanceTickerResponse; ts: number } = { ts: 0 }
let _tickerInFlight: Promise<BinanceTickerResponse> | null = null

function fetchTickerData(): Promise<BinanceTickerResponse> {
  const now = Date.now()
  if (_tickerCache.data && now - _tickerCache.ts < TICKER_TTL) {
    return Promise.resolve(_tickerCache.data)
  }
  if (_tickerInFlight) return _tickerInFlight

  const syms = JSON.stringify(TICKER_SYMBOLS)
  _tickerInFlight = fetch(
    `/binance/api/v3/ticker/24hr?symbols=${encodeURIComponent(syms)}`
  )
    .then((res) => res.json())
    .then((data: BinanceTickerResponse) => {
      if (Array.isArray(data)) _tickerCache.data = data
      _tickerCache.ts = Date.now()
      return Array.isArray(data) ? data : []
    })
    .catch(() => {
      _tickerCache.data = []
      _tickerCache.ts = Date.now()
      return []
    })
    .finally(() => {
      _tickerInFlight = null
    })

  return _tickerInFlight
}

const FNG_TTL = 60_000
const _fngCache: { data?: FearGreedResponse; ts: number } = { ts: 0 }
let _fngInFlight: Promise<FearGreedResponse> | null = null

function fetchFearGreed(): Promise<FearGreedResponse> {
  const now = Date.now()
  if (now - _fngCache.ts < FNG_TTL) {
    return Promise.resolve(_fngCache.data ?? null)
  }
  if (_fngInFlight) return _fngInFlight

  _fngInFlight = fetch('/feargreed/fng?limit=1')
    .then((r) => r.json())
    .then((data: FearGreedResponse) => {
      _fngCache.data = data
      _fngCache.ts = Date.now()
      return data
    })
    .catch(() => {
      _fngCache.data = null
      _fngCache.ts = Date.now()
      return null
    })
    .finally(() => {
      _fngInFlight = null
    })

  return _fngInFlight
}
// ─── Helpers ──────────────────────────────────────────────────────────────────

function trimTrailingZeros(s: string) {
  if (!s.includes('.')) return s
  return s.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')
}

function fmtFixed(n: number, decimals: number) {
  return trimTrailingZeros(n.toFixed(decimals))
}

function fmtTickerPrice(n: number) {
  if (n >= 1000)
    return `$${trimTrailingZeros(
      n.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    )}`
  if (n >= 1) return `$${fmtFixed(n, 4)}`
  return `$${fmtFixed(n, 6)}`
}

// ─── CoinGecko cache (prevents rate-limit on rapid reloads) ──────────────────

const _cgCache: Record<string, { data: unknown; ts: number }> = {}
const _cgInFlight: Partial<Record<string, Promise<unknown>>> = {}
const CG_TTL = 70_000 // 70 s — slightly longer than CoinGecko's 1-min cache window

async function cgFetch(path: string): Promise<unknown> {
  const now = Date.now()
  const hit = _cgCache[path]
  if (hit && now - hit.ts < CG_TTL) return hit.data
  if (_cgInFlight[path]) return _cgInFlight[path]

  _cgInFlight[path] = fetch(`/coingecko${path}`)
    .then((res) => res.json())
    .then((data) => {
      _cgCache[path] = { data, ts: Date.now() }
      return data
    })
    .catch(() => {
      _cgCache[path] = { data: null, ts: Date.now() }
      return null
    })
    .finally(() => {
      delete _cgInFlight[path]
    })

  return _cgInFlight[path]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number, digits = 2) {
  if (n >= 1e12) return `$${fmtFixed(n / 1e12, digits)}T`
  if (n >= 1e9) return `$${fmtFixed(n / 1e9, digits)}B`
  if (n >= 1e6) return `$${fmtFixed(n / 1e6, digits)}M`
  return `$${trimTrailingZeros(
    n.toLocaleString('en-US', { maximumFractionDigits: digits })
  )}`
}

function fmtPrice(n: number) {
  if (n >= 1000)
    return `$${trimTrailingZeros(
      n.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    )}`
  if (n >= 1) return `$${fmtFixed(n, 4)}`
  return `$${fmtFixed(n, 6)}`
}

function fearGreedColor(val: string) {
  const n = parseInt(val)
  if (n <= 25) return '#ef4444'
  if (n <= 45) return '#f97316'
  if (n <= 55) return '#eab308'
  if (n <= 75) return '#84cc16'
  return '#10b981'
}

// ─── TickerBar ────────────────────────────────────────────────────────────────

function TickerBar() {
  const updateDOM = useCallback((sym: string, data: TickerData) => {
    // Update both copies (original + duplicate for seamless loop)
    ;[`ticker-${sym}-a`, `ticker-${sym}-b`].forEach((id) => {
      const el = document.getElementById(id)
      if (!el) return
      const priceEl = el.querySelector<HTMLSpanElement>('[data-price]')
      const pctEl = el.querySelector<HTMLSpanElement>('[data-pct]')
      if (priceEl) priceEl.textContent = data.price
      if (pctEl) {
        pctEl.textContent = data.changePercent
        pctEl.style.color = data.changePercent.startsWith('+')
          ? '#10b981'
          : '#ef4444'
      }
    })
  }, [])

  useEffect(() => {
    const fetchTicker = async () => {
      try {
        // Binance public API — no key, 1200 req/min, symbols already in Binance format
        const data = await fetchTickerData()
        if (!Array.isArray(data)) return
        data.forEach((t) => {
          const price = parseFloat(t.lastPrice)
          const change = parseFloat(t.priceChangePercent)
          if (!isFinite(price)) return
          updateDOM(t.symbol, {
            symbol: TICKER_DISPLAY[t.symbol] ?? t.symbol,
            price: fmtTickerPrice(price),
            change: '',
            changePercent: `${change >= 0 ? '+' : ''}${fmtFixed(change, 2)}%`,
          })
        })
      } catch {
        /* ignore */
      }
    }

    fetchTicker()
    const timer = setInterval(fetchTicker, 30_000)
    return () => clearInterval(timer)
  }, [updateDOM])

  // Render static skeleton — DOM is updated directly via updateDOM, no re-renders
  const renderItems = (suffix: 'a' | 'b') =>
    TICKER_SYMBOLS.map((sym) => (
      <span
        key={`${sym}-${suffix}`}
        id={`ticker-${sym}-${suffix}`}
        className="inline-flex items-center gap-0.5 text-xs font-medium shrink-0"
      >
        <span style={{ color: 'var(--text-secondary)' }}>
          {TICKER_DISPLAY[sym] ?? sym}:
        </span>
        <span
          data-price
          style={{
            color: 'var(--text-primary)',
            fontVariantNumeric: 'tabular-nums',
            minWidth: '7ch',
            display: 'inline-block',
            textAlign: 'right',
          }}
        >
          —
        </span>
        <span
          data-pct
          style={{
            color: 'var(--text-tertiary)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          —
        </span>
      </span>
    ))

  return (
    <div
      className="w-full overflow-hidden border-b"
      style={{
        borderColor: 'rgba(255,255,255,0.06)',
        background:
          'linear-gradient(180deg, rgba(20,24,33,0.72) 0%, rgba(11,13,19,0.72) 100%)',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.04), 0 1px 0 rgba(0,0,0,0.5)',
      }}
    >
      <div className="flex items-center">
        {/* Scrolling tickers */}
        <div className="flex-1 overflow-hidden ticker-fade">
          <div className="ticker-scroll flex gap-8 px-6 py-2.5 whitespace-nowrap">
            {renderItems('a')}
            {renderItems('b')}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── MiniLineChart ────────────────────────────────────────────────────────────

function MiniLineChart({
  points,
  pct = 0,
  width = 96,
  height = 40,
}: {
  points?: number[]
  pct?: number
  width?: number
  height?: number
}) {
  const data =
    points && points.length >= 2
      ? points
      : (() => {
          // fallback: fake data shaped by pct
          return Array.from({ length: 14 }, (_, i) => {
            const trend = (pct / 100) * (i / 13)
            const noise =
              Math.sin(i * 2.4 + Math.abs(pct) * 0.3) * 0.012 +
              Math.cos(i * 1.1 + Math.abs(pct) * 0.7) * 0.008
            return 1 + trend + noise
          })
        })()

  const first = data[0]
  const last = data[data.length - 1]
  const isPos = last >= first
  const color = isPos ? '#10b981' : '#ef4444'
  const fillColor = isPos ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.15)'

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 0.001
  const pad = 2

  const coords = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (width - pad * 2) + pad
    const y = height - pad - ((v - min) / range) * (height - pad * 2)
    return [x, y] as [number, number]
  })

  const linePath = coords
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ')
  const fillPath = `${linePath} L${(width - pad).toFixed(1)},${height} L${pad},${height} Z`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      className="shrink-0"
    >
      <path d={fillPath} fill={fillColor} />
      <path
        d={linePath}
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ─── MiniSparkline ────────────────────────────────────────────────────────────

function MiniSparkline({ change7d }: { change7d: number }) {
  const isPos = change7d >= 0
  const color = isPos ? '#10b981' : '#ef4444'
  const bgColor = isPos ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.12)'
  // Fake sparkline using 7 bars of varying heights based on the overall trend
  const seed = Math.abs(change7d * 137.5) % 100
  const bars = [0.4, 0.6, 0.5, 0.7, 0.55, 0.8, isPos ? 1.0 : 0.3].map(
    (base, i) => {
      const noise = ((seed * (i + 1) * 17) % 30) / 100
      return Math.max(0.15, Math.min(1, base + (isPos ? noise : -noise)))
    }
  )
  return (
    <div
      className="flex items-end gap-0.5 px-1 py-0.5 rounded"
      style={{ background: bgColor, width: 56, height: 28 }}
    >
      {bars.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm"
          style={{
            height: `${h * 20}px`,
            background: color,
            opacity: 0.7 + i * 0.04,
          }}
        />
      ))}
    </div>
  )
}

// ─── ConverterWidget ──────────────────────────────────────────────────────────

function ConverterWidget({ coins }: { coins: CoinRow[]; isEn: boolean }) {
  const [fromAmt, setFromAmt] = useState('1')
  const [fromId, setFromId] = useState('bitcoin')
  const [toId, setToId] = useState('usd')

  const fromCoin = coins.find((c) => c.id === fromId)
  const toCoin = coins.find((c) => c.id === toId)

  const fromPrice = fromCoin?.price ?? 0
  const toPrice = toId === 'usd' ? 1 : (toCoin?.price ?? 0)
  const result =
    toPrice > 0 ? (parseFloat(fromAmt || '0') * fromPrice) / toPrice : 0

  const tokenOpts: TokenOption[] = coins.slice(0, 8).map((c) => ({
    value: c.id,
    label: c.symbol.toUpperCase(),
    image: c.image,
  }))
  const fromOptions = tokenOpts
  const toOptions: TokenOption[] = [
    { value: 'usd', label: 'USD' },
    ...tokenOpts,
  ]

  // blue-black field style shared by the amount input + result box (matches the
  // TokenSelect trigger so the whole converter reads as one cohesive unit)
  // translucent dark glass so the orange aurora glows through behind the fields
  const fieldStyle: React.CSSProperties = {
    background: 'rgba(12,8,6,0.40)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderTopColor: 'rgba(255,210,160,0.22)',
    color: 'var(--text-primary)',
    backdropFilter: 'blur(7px)',
    WebkitBackdropFilter: 'blur(7px)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
  }

  return (
    <div className="p-4 flex flex-col gap-2.5">
      {/* From */}
      <div className="flex gap-2">
        <input
          type="number"
          value={fromAmt}
          min="0"
          onChange={(e) => setFromAmt(e.target.value)}
          className="min-w-0 flex-1 text-sm px-3 h-[38px] rounded-[10px] outline-none tabular-nums font-semibold"
          style={fieldStyle}
        />
        <div className="w-[104px] shrink-0">
          <TokenSelect
            value={fromId}
            onChange={setFromId}
            options={fromOptions}
            ariaLabel="From token"
          />
        </div>
      </div>
      {/* Swap */}
      <div className="flex items-center justify-center">
        <span
          className="text-base leading-none"
          style={{ color: 'var(--accent-primary)' }}
        >
          ⇅
        </span>
      </div>
      {/* To */}
      <div className="flex gap-2">
        <div
          className="min-w-0 flex-1 text-sm px-3 h-[38px] flex items-center rounded-[10px] tabular-nums font-bold truncate"
          style={fieldStyle}
        >
          {isNaN(result) || !isFinite(result)
            ? '—'
            : result >= 1000
              ? trimTrailingZeros(
                  result.toLocaleString('en-US', { maximumFractionDigits: 2 })
                )
              : fmtFixed(result, toId === 'usd' ? 2 : 4)}
        </div>
        <div className="w-[104px] shrink-0">
          <TokenSelect
            value={toId}
            onChange={setToId}
            options={toOptions}
            ariaLabel="To token"
          />
        </div>
      </div>
    </div>
  )
}

// ─── Main DataPage ────────────────────────────────────────────────────────────

export function DataPage() {
  const { language } = useLanguage()
  const isEn = language !== 'zh'

  const chartRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(false)

  const switchToSymbol = useCallback((_binanceSymbol: string) => {
    // Reserved for future chart symbol switching
  }, [])

  // Global market data
  const [global, setGlobal] = useState<GlobalData | null>(null)
  const [fearGreed, setFearGreed] = useState<FearGreed | null>(null)

  // Chart history
  const [marketCapPoints, setMarketCapPoints] = useState<number[]>([])
  const [volumePoints, setVolumePoints] = useState<number[]>([])

  // Coins table
  const [coins, setCoins] = useState<CoinRow[]>([])
  const [coinsLoading, setCoinsLoading] = useState(true)

  // Trending
  const [trending, setTrending] = useState<TrendingCoin[]>([])

  // Gainers
  const [gainers, setGainers] = useState<TopGainer[]>([])

  // ── Fetch global + fear & greed ──
  const fetchGlobal = useCallback(async () => {
    try {
      // NOTE: no trailing slash before the query — Netlify's :splat redirect does
      // NOT match `/feargreed/fng/?...` (it falls through to index.html → HTML).
      // And fear&greed is wrapped in .catch so a failure can't reject the whole
      // batch and blank the Market Cap / Volume / Dominance cards too.
      const [globalJson, fngJson] = (await Promise.all([
        cgFetch('/api/v3/global'),
        fetchFearGreed(),
      ])) as [{ data?: Record<string, unknown> }, FearGreedResponse]
      const d = globalJson?.data
      if (d) {
        if (!mountedRef.current) return
        const dd = d as any
        setGlobal({
          totalMarketCap: dd.total_market_cap?.usd ?? 0,
          btcDominance: dd.market_cap_percentage?.btc ?? 0,
          totalVolume: dd.total_volume?.usd ?? 0,
          marketCapChange: dd.market_cap_change_percentage_24h_usd ?? 0,
        })
      }
      const fng = fngJson?.data?.[0]
      if (fng) {
        if (!mountedRef.current) return
        setFearGreed({
          value: fng.value,
          classification: fng.value_classification,
        })
      }
    } catch {
      /* fail silently */
    }
  }, [])

  // ── Fetch top coins + derive gainers from same response ──
  const fetchCoins = useCallback(async () => {
    try {
      const json = (await cgFetch(
        '/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=7d,24h'
      )) as any[]
      if (!Array.isArray(json)) return
      if (!mountedRef.current) return
      setCoins(
        json.slice(0, 20).map((c) => ({
          id: c.id,
          rank: c.market_cap_rank,
          name: c.name,
          symbol: c.symbol.toUpperCase(),
          image: c.image,
          price: c.current_price,
          change24h: c.price_change_percentage_24h ?? 0,
          change7d: c.price_change_percentage_7d_in_currency ?? 0,
          marketCap: c.market_cap,
          volume: c.total_volume,
        }))
      )
      const sorted = [...json]
        .filter((c) => (c.price_change_percentage_24h ?? 0) > 0)
        .sort(
          (a, b) =>
            (b.price_change_percentage_24h ?? 0) -
            (a.price_change_percentage_24h ?? 0)
        )
      setGainers(
        sorted.slice(0, 5).map((c) => ({
          id: c.id,
          name: c.name,
          symbol: c.symbol.toUpperCase(),
          image: c.image,
          price: c.current_price,
          change24h: c.price_change_percentage_24h ?? 0,
          binanceSymbol: `${c.symbol.toUpperCase()}USDT`,
        }))
      )
      if (mountedRef.current) setCoinsLoading(false)
    } catch {
      /* fail silently */
    }
    if (mountedRef.current) setCoinsLoading(false)
  }, [])

  // ── Fetch trending (CoinGecko trending search) ──
  const fetchTrending = useCallback(async () => {
    try {
      const json = (await cgFetch('/api/v3/search/trending')) as any
      if (!json?.coins) return
      if (!mountedRef.current) return

      setTrending(
        (json.coins as any[]).slice(0, 7).map((c: any) => ({
          id: c.item.id,
          name: c.item.name,
          symbol: c.item.symbol,
          thumb: c.item.thumb,
          price: c.item.data?.price ?? 0,
          change24h: c.item.data?.price_change_percentage_24h?.usd ?? 0,
          rank: c.item.market_cap_rank ?? 0,
          binanceSymbol: `${c.item.symbol.toUpperCase()}USDT`,
        }))
      )
    } catch {
      /* fail silently */
    }
  }, [])

  const fetchChart = useCallback(async () => {
    try {
      const json = (await cgFetch(
        '/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=7&interval=hourly'
      )) as any
      if (!json?.market_caps) return
      if (!mountedRef.current) return
      const mcPts: number[] = (json.market_caps ?? []).map(
        (p: [number, number]) => p[1]
      )
      if (mcPts.length >= 2) setMarketCapPoints(mcPts)
      const volPts: number[] = (json.total_volumes ?? [])
        .slice(-24)
        .map((p: [number, number]) => p[1])
      if (volPts.length >= 2) setVolumePoints(volPts)
    } catch {
      /* fail silently */
    }
  }, [])

  // Stagger all initial fetches to avoid CoinGecko free-tier rate limits
  useEffect(() => {
    mountedRef.current = true
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))
    const loadAll = async () => {
      fetchGlobal()
      await delay(500)
      if (!mountedRef.current) return
      fetchCoins()
      await delay(500)
      if (!mountedRef.current) return
      fetchTrending()
      await delay(500)
      if (!mountedRef.current) return
      fetchChart()
    }
    loadAll()

    const globalTimer = setInterval(fetchGlobal, 120_000)
    const coinsTimer = setInterval(fetchCoins, 90_000)
    const trendingTimer = setInterval(fetchTrending, 120_000)
    const chartTimer = setInterval(fetchChart, 600_000)
    return () => {
      mountedRef.current = false
      clearInterval(globalTimer)
      clearInterval(coinsTimer)
      clearInterval(trendingTimer)
      clearInterval(chartTimer)
    }
  }, [fetchGlobal, fetchCoins, fetchTrending, fetchChart])

  const pctColor = (v: number) => (v >= 0 ? '#10b981' : '#ef4444')

  return (
    <div className="min-h-screen relative gl-data-page">
      {/* blue ambient depth comes from .gl-data-page (not a flat black) */}
      {/* SVG turbulence filter that warps the converter's smoke plumes into
          organic wisps (referenced by .gl-conv-aurora via filter: url(#gl-smoke)) */}
      <svg
        width="0"
        height="0"
        aria-hidden="true"
        style={{ position: 'absolute', pointerEvents: 'none' }}
      >
        <filter
          id="gl-smoke"
          x="-40%"
          y="-40%"
          width="180%"
          height="180%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.011 0.016"
            numOctaves={2}
            seed={11}
            result="n"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale={42}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>

      <div className="relative z-10" style={{ paddingTop: '64px' }}>
        {/* ── Ticker Bar ── */}
        <TickerBar />

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 space-y-8">
          {/* ── Page header ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-end justify-between"
          >
            <h1
              className="text-2xl sm:text-3xl font-bold tracking-tight gl-metal-shine"
              style={{ letterSpacing: '-0.03em' }}
            >
              {isEn ? 'Market Overview' : '市场概览'}
            </h1>
          </motion.div>

          {/* ── Highlights: Stat Cards + Trending + Top Gainers ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-3"
          >
            {/* Left column: Market Cap + 24h Volume stacked */}
            <div className="flex flex-col gap-3">
              {/* Market Cap */}
              <div
                className="flex items-center justify-between gap-3 rounded-xl p-4 flex-1 overflow-hidden gl-metal-panel"
                style={{}}
              >
                <div className="flex flex-col flex-1 min-w-0">
                  <div
                    className="text-xl font-bold tracking-tight tabular-nums gl-metal-text"
                    style={{ letterSpacing: '-0.02em' }}
                  >
                    {global ? fmt(global.totalMarketCap) : '—'}
                  </div>
                  <div
                    className="mt-1 flex flex-wrap items-center gap-1.5 text-sm font-semibold"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {isEn ? 'Market Cap' : '总市值'}
                    {global && (
                      <span
                        style={{ color: pctColor(global.marketCapChange) }}
                        className="text-xs font-semibold"
                      >
                        {global.marketCapChange >= 0 ? '+' : ''}
                        {fmtFixed(global.marketCapChange, 1)}%
                      </span>
                    )}
                  </div>
                </div>
                {global && (
                  <MiniLineChart
                    points={marketCapPoints}
                    pct={global.marketCapChange}
                  />
                )}
              </div>

              {/* 24h Volume */}
              <div
                className="flex items-center justify-between gap-3 rounded-xl p-4 flex-1 overflow-hidden gl-metal-panel"
                style={{}}
              >
                <div className="flex flex-col flex-1 min-w-0">
                  <div
                    className="text-xl font-bold tracking-tight tabular-nums gl-metal-text"
                    style={{ letterSpacing: '-0.02em' }}
                  >
                    {global ? fmt(global.totalVolume) : '—'}
                  </div>
                  <div
                    className="mt-1 flex flex-wrap items-center gap-1.5 text-sm font-semibold"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {isEn ? '24h Trading Volume' : '24h 交易量'}
                    {volumePoints.length >= 2 &&
                      (() => {
                        const volPct =
                          ((volumePoints[volumePoints.length - 1] -
                            volumePoints[0]) /
                            volumePoints[0]) *
                          100
                        return (
                          <span
                            style={{ color: pctColor(volPct) }}
                            className="text-xs font-semibold"
                          >
                            {volPct >= 0 ? '+' : ''}
                            {fmtFixed(volPct, 1)}%
                          </span>
                        )
                      })()}
                  </div>
                </div>
                {(() => {
                  const volPct =
                    volumePoints.length >= 2
                      ? ((volumePoints[volumePoints.length - 1] -
                          volumePoints[0]) /
                          volumePoints[0]) *
                        100
                      : (global?.marketCapChange ?? 0)
                  return (
                    <MiniLineChart
                      points={volumePoints}
                      pct={volPct}
                      width={96}
                      height={40}
                    />
                  )
                })()}
              </div>

              {/* BTC Dominance + Fear & Greed side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-4 gl-onyx-panel" style={{}}>
                  <div className="text-lg font-bold tabular-nums gl-metal-text">
                    {global ? `${fmtFixed(global.btcDominance, 1)}%` : '—'}
                  </div>
                  <div
                    className="mt-1 text-xs font-semibold"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {isEn ? 'BTC Dominance' : 'BTC 主导率'}
                  </div>
                </div>
                <div className="rounded-xl p-4 gl-onyx-panel" style={{}}>
                  <div
                    className="text-lg font-bold tabular-nums"
                    style={{
                      color: fearGreed
                        ? fearGreedColor(fearGreed.value)
                        : 'var(--text-primary)',
                    }}
                  >
                    {fearGreed ? fearGreed.value : '—'}
                  </div>
                  <div
                    className="mt-1 text-xs font-semibold"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {fearGreed
                      ? fearGreed.classification
                      : isEn
                        ? 'Fear & Greed'
                        : '恐慌贪婪'}
                  </div>
                </div>
              </div>
            </div>

            {/* Middle column: Trending */}
            <div
              className="rounded-xl overflow-hidden gl-onyx-panel"
              style={{}}
            >
              <div className="flex justify-between items-center pt-3.5 mb-2 px-4">
                <span
                  className="font-semibold text-sm gl-metal-shine"
                  style={{ animationDelay: '-1.2s' }}
                >
                  {isEn ? 'Trending' : '热门'}
                </span>
              </div>
              <div>
                {trending.length === 0
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 px-4 py-2.5 animate-pulse"
                      >
                        <div
                          className="w-6 h-6 rounded-full shrink-0"
                          style={{ background: 'var(--surface-tertiary)' }}
                        />
                        <div
                          className="flex-1 h-3 rounded"
                          style={{ background: 'var(--surface-tertiary)' }}
                        />
                        <div
                          className="w-12 h-3 rounded"
                          style={{ background: 'var(--surface-tertiary)' }}
                        />
                      </div>
                    ))
                  : trending.slice(0, 5).map((coin) => (
                      <div
                        key={coin.id}
                        className="flex justify-between items-center px-4 py-2.5 rounded-lg mx-1 transition-colors cursor-pointer"
                        onClick={() => switchToSymbol(coin.binanceSymbol)}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            'rgba(70,100,180,0.10)')
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = 'transparent')
                        }
                      >
                        <div className="flex items-center gap-2 min-w-0 max-w-[55%]">
                          <img
                            src={coin.thumb}
                            alt={coin.symbol}
                            className="w-6 h-6 rounded-full shrink-0"
                          />
                          <span
                            className="text-xs font-semibold truncate"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {coin.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className="text-xs font-medium tabular-nums"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {coin.price > 0 ? fmtPrice(coin.price) : '—'}
                          </span>
                          <span
                            className="text-xs font-semibold tabular-nums"
                            style={{ color: pctColor(coin.change24h) }}
                          >
                            {coin.change24h >= 0 ? '+' : ''}
                            {fmtFixed(coin.change24h, 1)}%
                          </span>
                        </div>
                      </div>
                    ))}
              </div>
            </div>

            {/* Right column: Top Gainers */}
            <div
              className="rounded-xl overflow-hidden gl-onyx-panel-b"
              style={{}}
            >
              <div className="flex justify-between items-center pt-3.5 mb-2 px-4">
                <span
                  className="font-semibold text-sm gl-metal-shine"
                  style={{ animationDelay: '-2.4s' }}
                >
                  {isEn ? 'Top Gainers' : '涨幅最大'}
                </span>
              </div>
              <div>
                {gainers.length === 0
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 px-4 py-2.5 animate-pulse"
                      >
                        <div
                          className="w-6 h-6 rounded-full shrink-0"
                          style={{ background: 'var(--surface-tertiary)' }}
                        />
                        <div
                          className="flex-1 h-3 rounded"
                          style={{ background: 'var(--surface-tertiary)' }}
                        />
                        <div
                          className="w-12 h-3 rounded"
                          style={{ background: 'var(--surface-tertiary)' }}
                        />
                      </div>
                    ))
                  : gainers.map((coin) => (
                      <div
                        key={coin.id}
                        className="flex justify-between items-center px-4 py-2.5 rounded-lg mx-1 transition-colors cursor-pointer"
                        onClick={() => switchToSymbol(coin.binanceSymbol)}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            'rgba(70,100,180,0.10)')
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = 'transparent')
                        }
                      >
                        <div className="flex items-center gap-2 min-w-0 max-w-[55%]">
                          <img
                            src={coin.image}
                            alt={coin.symbol}
                            className="w-6 h-6 rounded-full shrink-0"
                          />
                          <span
                            className="text-xs font-semibold truncate"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {coin.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className="text-xs font-medium tabular-nums"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {fmtPrice(coin.price)}
                          </span>
                          <span
                            className="text-xs font-semibold tabular-nums"
                            style={{ color: pctColor(coin.change24h) }}
                          >
                            {coin.change24h >= 0 ? '+' : ''}
                            {fmtFixed(coin.change24h, 1)}%
                          </span>
                        </div>
                      </div>
                    ))}
              </div>
            </div>
          </motion.div>

          {/* ── Stats Panel ── */}
          <motion.div
            ref={chartRef}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-4 items-start"
          >
            {/* Statistics panel (narrower — converter now sits to its right) */}
            <div
              className="rounded-2xl overflow-hidden gl-aurora-panel min-w-0"
              style={{}}
            >
              <div
                className="px-4 py-3 border-b"
                style={{ borderColor: 'var(--panel-border)' }}
              >
                <span
                  className="text-xs font-semibold uppercase tracking-wider gl-metal-shine"
                  style={{ animationDelay: '-3.6s' }}
                >
                  {isEn ? 'Market Statistics' : '市场数据'}
                </span>
              </div>
              <div
                className="divide-y"
                style={{ borderColor: 'var(--panel-border)' }}
              >
                {(() => {
                  const btc = coins.find((c) => c.id === 'bitcoin') || coins[0]
                  const eth = coins.find((c) => c.id === 'ethereum') || coins[1]
                  if (!btc) return null
                  const totalMcap = coins.reduce((s, c) => s + c.marketCap, 0)
                  const rows = [
                    {
                      label: isEn ? 'BTC Price' : 'BTC 价格',
                      value: fmtPrice(btc.price),
                      sub: `${btc.change24h >= 0 ? '+' : ''}${fmtFixed(btc.change24h, 2)}%`,
                      subColor: pctColor(btc.change24h),
                    },
                    {
                      label: isEn ? 'ETH Price' : 'ETH 价格',
                      value: eth ? fmtPrice(eth.price) : '—',
                      sub: eth
                        ? `${eth.change24h >= 0 ? '+' : ''}${fmtFixed(eth.change24h, 2)}%`
                        : '',
                      subColor: eth ? pctColor(eth.change24h) : 'inherit',
                    },
                    {
                      label: isEn ? 'BTC Market Cap' : 'BTC 市值',
                      value: fmt(btc.marketCap),
                      sub: null,
                      subColor: '',
                    },
                    {
                      label: isEn ? 'BTC 24h Volume' : 'BTC 24h 成交量',
                      value: fmt(btc.volume),
                      sub: null,
                      subColor: '',
                    },
                    {
                      label: isEn ? 'Total Market Cap' : '总市值',
                      value: fmt(totalMcap),
                      sub: global
                        ? `${global.marketCapChange >= 0 ? '+' : ''}${fmtFixed(global.marketCapChange ?? 0, 2)}%`
                        : null,
                      subColor: global ? pctColor(global.marketCapChange) : '',
                    },
                    {
                      label: isEn ? 'BTC Dominance' : 'BTC 占比',
                      value: global
                        ? `${fmtFixed(global.btcDominance, 1)}%`
                        : '—',
                      sub: null,
                      subColor: '',
                    },
                    {
                      label: isEn ? 'Total Volume 24h' : '24h 总成交量',
                      value: global ? fmt(global.totalVolume) : '—',
                      sub: null,
                      subColor: '',
                    },
                  ]
                  return rows.map((row, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-4 py-2.5"
                      style={{ borderColor: 'var(--panel-border)' }}
                    >
                      <span
                        className="text-xs"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        {row.label}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-xs font-semibold tabular-nums"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {row.value}
                        </span>
                        {row.sub && (
                          <span
                            className="text-[10px] font-semibold tabular-nums"
                            style={{ color: row.subColor }}
                          >
                            {row.sub}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                })()}
              </div>
            </div>

            {/* Converter widget */}
            <div
              className="gl-conv-panel rounded-2xl overflow-hidden"
              style={{
                border: '1px solid var(--panel-border)',
                boxShadow:
                  '0 2px 4px rgba(0,0,0,0.3), 0 12px 32px rgba(0,0,0,0.4)',
              }}
            >
              <div className="gl-conv-aurora" aria-hidden="true" />
              <div className="gl-conv-scrim" aria-hidden="true" />
              <div
                className="px-4 py-3 border-b"
                style={{ borderColor: 'rgba(255,255,255,0.10)' }}
              >
                <span
                  className="text-xs font-semibold uppercase tracking-wider gl-metal-shine"
                  style={{ animationDelay: '-4.8s' }}
                >
                  {isEn ? 'Converter' : '换算器'}
                </span>
              </div>
              <ConverterWidget coins={coins} isEn={isEn} />
            </div>
          </motion.div>

          {/* ── Bottom: Top Coins Table ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              className="rounded-2xl overflow-hidden gl-prism-panel"
              style={{}}
            >
              <div
                className="flex items-center justify-between px-5 py-4 border-b"
                style={{ borderColor: 'var(--panel-border)' }}
              >
                <h2
                  className="text-sm font-semibold gl-metal-shine"
                  style={{ animationDelay: '-6s' }}
                >
                  {isEn ? 'Top 20 by Market Cap' : '市值前 20'}
                </h2>
                <span
                  className="text-xs"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {isEn ? 'Live prices' : '实时价格'}
                </span>
              </div>

              {coinsLoading ? (
                <div className="space-y-0">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 px-5 py-3.5 animate-pulse"
                      style={{ borderBottom: '1px solid var(--panel-border)' }}
                    >
                      <div
                        className="w-5 h-3 rounded"
                        style={{ background: 'var(--surface-tertiary)' }}
                      />
                      <div
                        className="w-6 h-6 rounded-full"
                        style={{ background: 'var(--surface-tertiary)' }}
                      />
                      <div
                        className="w-20 h-3 rounded"
                        style={{ background: 'var(--surface-tertiary)' }}
                      />
                      <div className="flex-1" />
                      <div
                        className="w-16 h-3 rounded"
                        style={{ background: 'var(--surface-tertiary)' }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[320px]">
                    <thead>
                      <tr
                        style={{
                          borderBottom: '1px solid var(--panel-border)',
                        }}
                      >
                        {[
                          { label: '#', align: 'left', hide: false },
                          {
                            label: isEn ? 'Name' : '名称',
                            align: 'left',
                            hide: false,
                          },
                          {
                            label: isEn ? 'Price' : '价格',
                            align: 'right',
                            hide: false,
                          },
                          { label: '24h %', align: 'right', hide: false },
                          { label: '7d %', align: 'right', hide: true },
                          {
                            label: isEn ? 'Market Cap' : '市值',
                            align: 'right',
                            hide: true,
                          },
                          {
                            label: isEn ? 'Volume (24h)' : '24h 成交量',
                            align: 'right',
                            hide: true,
                          },
                          {
                            label: isEn ? '7d Trend' : '7日走势',
                            align: 'center',
                            hide: true,
                          },
                        ].map((h, i) => (
                          <th
                            key={i}
                            className={`px-2 sm:px-4 py-3 text-[11px] font-semibold uppercase tracking-wider ${h.hide ? 'hidden lg:table-cell' : ''} text-${h.align}`}
                            style={{ color: 'var(--text-tertiary)' }}
                          >
                            {h.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {coins.map((coin, idx) => (
                        <tr
                          key={coin.id}
                          className="transition-colors cursor-pointer"
                          style={{
                            borderBottom:
                              idx < coins.length - 1
                                ? '1px solid var(--panel-border)'
                                : 'none',
                          }}
                          onClick={() =>
                            switchToSymbol(coin.symbol.toUpperCase() + 'USDT')
                          }
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                              'rgba(70,100,180,0.10)')
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = 'transparent')
                          }
                        >
                          <td
                            className="px-2 sm:px-4 py-3.5 text-xs tabular-nums text-left w-6 sm:w-8"
                            style={{ color: 'var(--text-tertiary)' }}
                          >
                            {coin.rank}
                          </td>
                          <td className="px-2 sm:px-4 py-3.5 text-left">
                            <div className="flex items-center gap-2">
                              <img
                                src={coin.image}
                                alt={coin.symbol}
                                className="w-6 h-6 rounded-full shrink-0"
                              />
                              <div className="min-w-0">
                                <div
                                  className="text-xs font-semibold leading-tight truncate"
                                  style={{ color: 'var(--text-primary)' }}
                                >
                                  {coin.name}
                                </div>
                                <div
                                  className="text-[10px] font-medium uppercase"
                                  style={{ color: 'var(--text-tertiary)' }}
                                >
                                  {coin.symbol}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td
                            className="px-2 sm:px-4 py-3.5 text-xs text-right tabular-nums font-semibold"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {fmtPrice(coin.price)}
                          </td>
                          <td className="px-2 sm:px-4 py-3.5 text-xs text-right tabular-nums">
                            <span
                              className="inline-flex items-center gap-0.5 px-1 sm:px-1.5 py-0.5 rounded-md text-[11px] font-semibold"
                              style={{
                                background:
                                  coin.change24h >= 0
                                    ? 'rgba(16,185,129,0.12)'
                                    : 'rgba(239,68,68,0.12)',
                                color: pctColor(coin.change24h),
                              }}
                            >
                              {coin.change24h >= 0 ? '▲' : '▼'}{' '}
                              {fmtFixed(Math.abs(coin.change24h), 2)}%
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-right tabular-nums hidden lg:table-cell">
                            <span
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-semibold"
                              style={{
                                background:
                                  coin.change7d >= 0
                                    ? 'rgba(16,185,129,0.12)'
                                    : 'rgba(239,68,68,0.12)',
                                color: pctColor(coin.change7d),
                              }}
                            >
                              {coin.change7d >= 0 ? '▲' : '▼'}{' '}
                              {fmtFixed(Math.abs(coin.change7d), 2)}%
                            </span>
                          </td>
                          <td
                            className="px-4 py-3.5 text-xs text-right tabular-nums hidden lg:table-cell"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {fmt(coin.marketCap)}
                          </td>
                          <td
                            className="px-4 py-3.5 text-xs text-right tabular-nums hidden lg:table-cell"
                            style={{ color: 'var(--text-tertiary)' }}
                          >
                            <div>{fmt(coin.volume)}</div>
                            <div
                              className="text-[10px] mt-0.5"
                              style={{
                                color: 'var(--text-tertiary)',
                                opacity: 0.6,
                              }}
                            >
                              {coin.marketCap > 0
                                ? `${fmtFixed((coin.volume / coin.marketCap) * 100, 1)}% mcap`
                                : ''}
                            </div>
                          </td>
                          {/* 7d sparkline bar */}
                          <td className="px-4 py-3.5 hidden lg:table-cell">
                            <div className="flex items-center justify-center">
                              <MiniSparkline change7d={coin.change7d} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Ticker scroll animation */}
      <style>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-scroll {
          animation: ticker-scroll 80s linear infinite;
          width: max-content;
        }
        .ticker-scroll:hover {
          animation-play-state: paused;
        }
        /* dark edge fade — content fades out into the dark at both ends */
        .ticker-fade {
          -webkit-mask-image: linear-gradient(to right, transparent 0%, rgba(0,0,0,0.15) 6%, #000 16%, #000 84%, rgba(0,0,0,0.15) 94%, transparent 100%);
          mask-image: linear-gradient(to right, transparent 0%, rgba(0,0,0,0.15) 6%, #000 16%, #000 84%, rgba(0,0,0,0.15) 94%, transparent 100%);
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
