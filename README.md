# EVA Protocol — Frontend

Web client for **EVA**, an AI-powered crypto trading operating system. Users configure autonomous trading agents, build strategies, run backtests, compete on live leaderboards, and monitor markets — all from a single React SPA.

**Repository:** [github.com/protocol-eva/eva-protocol-frontend](https://github.com/protocol-eva/eva-protocol-frontend)

---

## Features

### Public (no login)

| Route | Description |
|-------|-------------|
| `/` | Landing page — product overview, wallet connect, onboarding |
| `/data` | **Markets** — live tickers, global stats, top coins, trending, gainers, charts |
| `/news` | **Crypto news** — aggregated headlines (CoinDesk, Cointelegraph, Decrypt, The Block, Blockworks) |
| `/tokenomics` | $EVA token supply, allocation, utility |
| `/upgrade` | Premium plan upgrades |
| `/faq`, `/docs` | Documentation & FAQ |
| `/login`, `/register` | Auth with optional 2FA / OTP |

### Platform (authenticated)

| Route | Description |
|-------|-------------|
| `/dashboard` | Trader dashboard — equity, positions, decisions, charts |
| `/traders` | Create & manage AI trading agents |
| `/strategy` | **Strategy Studio** — visual strategy builder, prompt preview, test runs |
| `/strategy-market` | Browse & clone community strategies |
| `/backtest` | Historical backtesting with equity/trade/decision views |
| `/competition` | Live AI trader leaderboard |
| `/debate` | **AI Debate Arena** — multi-agent market debates with live streaming |

### Also included

- **Wallet integration** — Reown AppKit (MetaMask, WalletConnect, etc.) via Wagmi/Viem
- **Cross-chain swap widget** — Squid Router (`SwapCard`, inline swap)
- **Advanced charts** — Lightweight Charts, Recharts, TradingView-style panels
- **AI decision transparency** — expandable chain-of-thought on each trade decision
- **i18n** — English default, Chinese (`zh`) support
- **Dark-first UI** — metallic/glass design system (`gl-*`, `DashKit` primitives)
- **3D visuals** — Three.js / R3F landing & auth backgrounds (lazy-loaded)

---

## Tech stack

| Layer | Libraries |
|-------|-----------|
| UI | React 18, TypeScript, Tailwind CSS, Framer Motion |
| Build | Vite 6, code-split lazy routes |
| Data | SWR, Axios (`httpClient`), TanStack Query (wallet) |
| State | Zustand, React Context (auth, theme, language) |
| Charts | Lightweight Charts, Recharts |
| Web3 | Reown AppKit, Wagmi 3, Viem |
| 3D | Three.js, React Three Fiber, OGL |
| UI primitives | Radix UI, Hugeicons, Lucide |
| Quality | ESLint 9, Prettier, Vitest, Husky, lint-staged |

---

## Requirements

- **Node.js** ≥ 18 (20+ recommended)
- **EVA backend** running on port `8080` for full platform features ([eva-backend](https://github.com/protocol-eva/eva-backend))

---

## Quick start

```bash
git clone https://github.com/protocol-eva/eva-protocol-frontend.git
cd eva-protocol-frontend
npm install
cp .env.example .env.local   # optional — see Environment variables
npm run dev
```

Dev server: **http://localhost:3000** (port 3000 is configured in `vite.config.ts`).

If port 3000 is taken, Vite picks the next free port — check the terminal output.

### Local backend proxy

In dev, Vite proxies API traffic to the Go backend:

| Prefix | Target |
|--------|--------|
| `/api` | `http://localhost:8080` |
| `/binance` | Binance public API |
| `/coingecko` | CoinGecko API |
| `/feargreed` | Fear & Greed Index |
| `/gmgn` | gmgn.ai |

Start the backend before testing authenticated pages:

```bash
# in eva-backend repo
docker compose up -d nofx
curl http://localhost:8080/api/health   # → {"status":"ok"}
```

---

## Environment variables

Copy `.env.example` → `.env.local`. All variables are **optional** — public pages work without them.

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | Backend base URL in production (e.g. `https://api.oko-agent.io`). Empty in dev → Vite proxy |
| `VITE_REOWN_PROJECT_ID` | Reown / WalletConnect project ID ([dashboard.reown.com](https://dashboard.reown.com)) |
| `VITE_SQUID_INTEGRATOR_ID` | Squid Router integrator ID for cross-chain swaps |
| `VITE_GMGN_API_KEY` | Reserved for GMGN integration (unused) |

Only `VITE_*` vars are exposed to the browser.

---

## Scripts

```bash
npm run dev          # Vite dev server
npm run build        # Production build → dist/
npm run preview      # Preview production build locally
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint
npm run lint:fix     # ESLint + auto-fix
npm run format       # Prettier
npm run test         # Vitest (unit tests)
```

Recommended before pushing:

```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

---

## Production deployment

Hosted on **Vercel** as a static SPA.

- **Build command:** `npm run build`
- **Output:** `dist/`
- **Rewrites:** `vercel.json` proxies `/api` to the production backend and public market-data APIs
- **CI:** `.github/workflows/deploy.yml` triggers a Vercel deploy on push to `main`

Set `VITE_API_BASE_URL` in the Vercel project settings if the backend is on a separate domain. Keep `vercel.json` rewrites in sync with `vite.config.ts` proxy prefixes.

---

## Project structure

```
eva-protocol-frontend/
├── src/
│   ├── App.tsx                 # Route shell, lazy-loaded pages, auth gate
│   ├── pages/                  # Top-level routes (Landing, Data, News, …)
│   ├── components/
│   │   ├── nav/                # Navbar config & menus (navConfig.tsx)
│   │   ├── backtest/           # Backtest panels (split from monolith)
│   │   ├── strategy/           # Strategy Studio editors
│   │   ├── dash/               # Shared authenticated page primitives
│   │   ├── landing/            # Landing page sections
│   │   ├── docs/               # Documentation layout
│   │   └── faq/                # FAQ layout
│   ├── lib/
│   │   ├── api.ts              # Backend API client
│   │   ├── httpClient.ts       # Axios wrapper + auth interceptors
│   │   ├── config.ts           # System config + apiUrl helper
│   │   └── nav.ts              # SPA navigation helpers
│   ├── contexts/               # Auth, theme, language
│   ├── hooks/
│   ├── i18n/
│   └── types.ts
├── vercel.json                 # Production API rewrites
├── vite.config.ts              # Dev server + proxies
└── .env.example
```

Navigation routes are defined once in `src/components/nav/navConfig.tsx`.

---

## Architecture notes

- **SPA routing** — pathname-based (`goTo()`, no hash routes). Each major page is `React.lazy` code-split.
- **Auth** — JWT in `localStorage`; `httpClient` attaches `Authorization` header; 401 redirects to `/login`.
- **API paths** — Most calls use `/api/...` via `httpClient` or `apiUrl()`. Backtest & some endpoints use `fetch` with `VITE_API_BASE_URL` support.
- **Error boundaries** — Per-page boundaries keep the header alive if a single route crashes.
- **Confirm dialogs** — Global confirm host avoids re-rendering the entire app on modal open.

---

## Related repos

| Repo | Role |
|------|------|
| [protocol-eva/eva-backend](https://github.com/protocol-eva/eva-backend) | Go API — traders, strategies, backtest, news RSS, auth |
| [protocol-eva/eva-protocol-frontend](https://github.com/protocol-eva/eva-protocol-frontend) | This repo |

---

## License

See repository license file. EVA is experimental software — not financial advice. Trade at your own risk.
