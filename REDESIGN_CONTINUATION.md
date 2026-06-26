# EVA Frontend — Redesign Continuation Guide

> Handoff doc written before a `/compact`. Captures everything done in this session +
> the exact recipe to finish the **remaining authenticated pages**. Pairs with
> `UI_DESIGN.md` (design system) and `REDESIGN_PLAYBOOK.md` (engineering).

---

## 0. Critical setup (read first)

- **THE repo is THIS one: `eva-project/frontend/eva-frontend-temp`.** It's the only git repo
  (`github.com/Alexey9911/eva-frontend`, branch `main`) and it auto-deploys to **Vercel**
  (project `eva-frontend-temp`). ⚠️ `entire-project/eva-temp/web` is a stale, NON-deployed
  copy — never edit it expecting production to change.
- **Dev server:** `npm run dev` → http://localhost:3000 (port in `vite.config.ts`).
- **Windows build:** the `npm run build` script fails on cmd (`'NODE_OPTIONS' is not recognized`).
  Build locally with: `$env:NODE_OPTIONS='--max-old-space-size=8192'; npx vite build`.
  (Vercel/Linux runs the npm script fine.)
- **Deploy:** `git push origin main` → Vercel builds → https://eva-frontend-temp.vercel.app
  (hard-refresh Ctrl+Shift+R to bypass cache). Watch deploy via the Vercel MCP `list_deployments`.
- **Typecheck has PRE-EXISTING errors** (lazyWithReload shim in App.tsx, HeaderBar unused
  props, a React-vs-DOM MouseEvent mismatch). These are NOT a gate — `vite build` uses esbuild
  and ignores types. Only worry about NEW errors in files you touch.

### Dev login bypass (build authenticated pages with NO backend)
The live `/api/*` needs a backend account on a whitelist. For local UI work there's a **dev-only**
bypass (compiled out of production via `import.meta.env.DEV`):
- Open **`http://localhost:3000/?devlogin=1`** → mock session, every gated page renders.
  `/?devlogout=1` clears it.
- `src/lib/api.ts` returns **mock data** for `getTraders` (2 sample traders "Alpha Scout",
  "Mean Reverter") + `getExchangeConfigs` when the bypass is active.
- `src/lib/httpClient.ts` rejects quietly (no logout, no "Server Error" toasts) under the bypass,
  so the rest of the panels show empty states instead of error spam.
- `src/contexts/AuthContext.tsx` sets the mock session; `src/App.tsx` gate is `!user || !token`.
- The per-trader detail endpoints (status/account/positions/decisions/statistics) are NOT mocked,
  so the dashboard renders its **layout** but the live numbers/charts stay empty. To see them
  populated you'd add more mocks OR get a real backend account.

---

## 1. What was done this session

1. **DarkVeil landing background — fixed + deployed.** It was crashing (invisible in prod). 3 bugs:
   - `precision lowp float` → fails to LINK on Windows/ANGLE (CPPN weights reach ±500). → `highp`.
   - `loseContext()` in the effect cleanup killed the context on React StrictMode's remount. → removed.
   - `resolutionScale < 1` shrank the *visible* canvas (OGL `setSize` also writes CSS size). →
     force `canvas.style.width/height = 100%`, scale only the backing store.
   - File: `src/components/three/DarkVeil.tsx`. Color is set in `LandingPage.tsx` via the wrapper
     `filter: hue-rotate(-56deg) saturate(1.25) brightness(1.0)` (dark blue) + a light vignette.
2. **Global focus-ring removed on click** (kept for keyboard): `index.css` →
   `*:focus:not(:focus-visible){ outline:none !important } html{ -webkit-tap-highlight-color:transparent }`.
3. **Freeze fix (navbar → /dashboard).** Root cause: `LandingPage` left its wallet-analysis
   `EventSource` + timers open on a soft SPA nav, colliding with the route swap (direct URL worked
   because it fully reloads). Fix: an unmount `useEffect` in `LandingPage.tsx` that closes
   `analysisSourceRef`.
4. **Navbar account menu redesigned** (`HeaderBar.tsx` + `.gl-user-*` in `index.css`): premium
   dark-metal pill with a **subtly animated blue glow border**, metallic avatar, Hugeicons chevron,
   and a dropdown with a Hugeicons (`Logout01Icon`) logout. Desktop + mobile.
5. **TraderDashboardPage — FULL redesign** (the big one). See §4.

---

## 2. Design system cheat-sheet (the `.gl-*` kit, source of truth = `index.css`)

**Tokens:** `--accent-primary:#3d6bff`, `--binance-green:#0ECB81`, `--binance-red:#F6465D`,
`--text-primary:#F0F8FF`, `--text-secondary:#8B9CB6`, `--text-tertiary:#949E9C`,
`--chrome-50:#EFEFEF`, `--chrome-200:#B4B4B8`, `--panel-border`, `--surface-tertiary`.

**Panel families (wrap content in these):**
| Class | Use |
|---|---|
| `gl-panel` | basic card |
| `gl-metal-panel` | premium animated card (KPIs, hero header) — drift glow + rotating border |
| `gl-aurora-panel` | most glowy — hero / chart frames |
| `gl-onyx-panel` / `gl-onyx-panel-b` | data-heavy panels (lists, secondary) |
| `gl-prism-panel` | data tables (diagonal sheen + side glow) |
| `gl-liquid-panel` | rotating reflection card |

**Text:** `gl-metal-shine` (animated shine — section titles; stagger with
`style={{animationDelay:'-1.2s'}}`, `-2.4s`, `-3.6s`…), `gl-metal-text` (metallic value/number),
`gl-title-metal` / `gl-title-metal-blue` (hero headlines like login), `gl-gate-label`.

**Buttons:** `gl-navbar-btn` (primary filled CTA), `gl-text-link` (ghost), `gl-modal-btn-primary/ghost`.
**`lm-btn` / `lm-bar` = the WebGL "liquid metal" buttons** (`LiquidMetalButton` / `LiquidMetalBar`):
use **SPARINGLY — max 1 per page, only for THE single most important action** (each mounts a WebGL
context). They are the canvas-in-the-border buttons from login. Don't sprinkle them.

**Forms:** `gl-select-trigger/content/item`. **Page bg:** `gl-data-page` (ambient blue glow).
**Animated bg:** `gl-liquid-bg` for sparse pages.

**NEW classes added this session:**
- `.gl-user-trigger`, `.gl-user-avatar`, `.gl-user-email`, `.gl-user-chev`, `.gl-user-menu`,
  `.gl-user-menu-head/-label/-email`, `.gl-user-logout` — navbar account menu.
- `.dash-kpi-ico` / `.dash-ico` (blue icon chips), `.dash-chip` + `.dash-chip-val` (metadata pills),
  `.dash-live` + `.dash-live-dot` (live status pill), `.dash-select` (native `<select>` styled
  premium with chevron), `.dash-close-btn` (danger), `.dash-page-btn` (pagination), `.dash-prow`
  (clickable table row), `.dash-side-long/-short` (LONG/SHORT badges), `.dash-scroll` (thin
  scrollbar). All in `index.css` under "Trader dashboard helpers".

---

## 3. Icons — Hugeicons (MANDATORY, 0 emojis)

```tsx
import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'
import { Wallet01Icon, Robot01Icon /* … */ } from '@hugeicons/core-free-icons'

<HugeiconsIcon icon={Wallet01Icon} size={17} strokeWidth={1.8} className="..." />
```
- Sizes 16–20, strokeWidth 1.8–2.4. Color via CSS (no inline color prop needed).
- **Verify the exact export name exists** before importing — a wrong name breaks the build. Check:
  `node_modules/@hugeicons/core-free-icons/dist/types/index.d.ts`
  (e.g. `grep -oE "Wallet01Icon|..." that file`).
- Confirmed-available & used: `Wallet01Icon, Coins01Icon, Analytics02Icon, Layers01Icon,
  Target01Icon, Robot01Icon, Notebook01Icon, ChartLineData01Icon, ArrowUpRight01Icon,
  ArrowDownRight01Icon, Cancel01Icon, ViewIcon, ViewOffSlashIcon, Copy01Icon, Tick02Icon,
  Logout01Icon, ArrowDown01Icon, Settings01Icon, DashboardSquare01Icon, Award01Icon,
  Bitcoin01Icon, BubbleChatIcon, Book02Icon, Store01Icon, TestTube01Icon, Rocket01Icon,
  GridViewIcon, CreditCardIcon, MoneyBag02Icon, TradeUpIcon, TradeDownIcon, Clock01Icon`.

---

## 4. The dashboard recipe (copy this for the remaining pages)

`TraderDashboardPage.tsx` is the reference implementation. Pattern:

```tsx
<div className="gl-data-page min-h-screen pb-16">
  <div className="w-full max-w-[1600px] mx-auto px-4 md:px-8 relative z-10 pt-6">
    {/* identity / header bar */}  <motion.div className="gl-metal-panel rounded-2xl p-4 sm:p-5 mb-5"> … </motion.div>
    {/* KPI row */}                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5"> <StatCard …/> </div>
    {/* hero/chart */}            <div className="gl-aurora-panel rounded-2xl"> <SectionHead …/> … </div>
    {/* data table */}           <div className="gl-prism-panel rounded-2xl"> <SectionHead …/> <table> rows=.dash-prow </div>
    {/* list panel */}           <div className="gl-onyx-panel rounded-2xl"> … </div>
  </div>
</div>
```
Reusable helpers already in the file (lift them to shared components when doing more pages):
- `EmptyState({icon, title, description, action})` — premium empty/error state (Hugeicon chip +
  `gl-metal-text` title + `gl-navbar-btn`). NO emojis.
- `StatCard({title, value, unit, change, positive, subtitle, icon})` — `gl-metal-panel` +
  `dash-kpi-ico` + `gl-metal-text` value + up/down Hugeicon arrow colored green/red.
- `SectionHead({icon, title, delay, right})` — `dash-ico` chip + `gl-metal-shine` title + a right slot.

Conventions: numbers `tabular-nums`; gains/losses use `--binance-green/red`; entrance via
framer-motion `initial/animate` with staggered `delay` (0, 0.06, …); mobile = `grid-cols-2`
stats / 1-col main / `overflow-x-auto dash-scroll` tables / chips wrap; reduced-motion is already
handled by the kit.

**Signature element of the dashboard:** the identity bar is a live `gl-metal-panel` (animated
border) with a green **pulsing status dot** + a `LIVE`/`IDLE` chip driven by `status.is_running`.

---

## 5. Remaining pages to redesign (the roadmap — "todo de todo")

All reachable from the navbar **Platform** dropdown; all authenticated (use `/?devlogin=1` to view).
Apply the §4 recipe to each:

- [x] `/dashboard` — **TraderDashboardPage** ✅ done (page shell). Child widgets below still pending.
- [ ] `/traders` — **AITradersPage** (trader list / create / manage)
- [ ] `/strategy` — **StrategyStudioPage** (+ the editors in `components/strategy/*`)
- [ ] `/strategy-market` — **StrategyMarketPage**
- [ ] `/backtest` — **BacktestPage**
- [ ] `/competition` — **CompetitionPage**
- [ ] `/debate` — **DebateArenaPage**

**Child widgets still on OLD styling** (they now sit inside premium panels but their internals
aren't reskinned — matters once real data shows):
- `components/ChartTabs.tsx` (+ `EquityChart`, `AdvancedChart`) — the chart UI/tabs/controls
- `components/DecisionCard.tsx` — each AI decision card
- `components/PositionHistory.tsx` — closed-trades table + stats
- `components/strategy/GridRiskPanel.tsx`
- modals: `ConfirmDialog`, `TraderConfigModal`, `traders/ExchangeConfigModal`, etc.

**Per-page checklist:** devlogin → view → wrap in `gl-data-page` → `SectionHead`s → replace
emojis + lucide icons with Hugeicons → choose panels (metal/aurora/onyx/prism) → use `.dash-*`
helpers → metallic titles → mobile pass → verify with a `preview_eval` querySelector check
(`hasEmoji:false`, panels present) → typecheck the touched file only.

---

## 6. Files changed this session (all in `frontend/eva-frontend-temp`)

| File | Change |
|---|---|
| `src/components/three/DarkVeil.tsx` | highp, no loseContext, resolutionScale CSS fix (DEPLOYED) |
| `src/pages/LandingPage.tsx` | veil color (dark blue) + freeze unmount cleanup |
| `src/contexts/AuthContext.tsx` | dev-login bypass session |
| `src/lib/httpClient.ts` | dev-bypass 401/error suppression |
| `src/lib/api.ts` | dev-bypass mock traders/exchanges |
| `src/components/HeaderBar.tsx` | premium account menu (Hugeicons) |
| `src/pages/TraderDashboardPage.tsx` | FULL premium rewrite |
| `src/index.css` | focus-ring policy, `.gl-user-*`, `.dash-*` helpers |

**Deployed to production:** DarkVeil fix (commits `27fd606`, `f8afee2`). Everything else (dev-bypass,
focus-ring, freeze, user menu, dashboard) is **committed-or-local** — confirm `git status` and
push when ready.

---

## 7. Verification gotchas (this environment)

- The full app **won't mount in the headless Claude_Preview** (heavy web3 cold-transform hang) and
  **screenshots time out** on animated pages. Verify by: navigate the preview, then `preview_eval`
  a `document.querySelector(...)` / `body.innerText` check (it usually mounts with a sized viewport
  after `/?devlogin=1`). The user's real browser renders everything fine via HMR.
- WebGL canvases: pass `depth:false` to OGL renderers; `highp` precision; never `loseContext()` in
  StrictMode cleanup.
