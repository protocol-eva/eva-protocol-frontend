# EVA — Ghostlink Redesign Playbook

Single source of truth for the EVA frontend visual overhaul (ghostlink-style:
super‑black + chrome + bloom). Read this before touching any page. The goal:
perfect the design system here, then **copy/paste the same styles into the
remaining ~15 pages** without re-inventing anything.

> Rule of thumb: **keep every page's structure/UX exactly as-is — only change the
> visuals.** Reuse the CSS utility classes and tokens below; don't hand-roll new
> styles per page.

---

## 0. Project map, commands, deploy

### Folders (under `D:\Alexey\threeJS journey\DEV-CRYPTO\`)
- **`eva-project/frontend/eva-frontend-temp`** ← **THE working copy. Edit + deploy this.**
- `eva-project/entire-project/eva-temp/web` — the *same* frontend, an older stale
  backup (no 3D). Ignore it for dev. (`entire-project/eva-temp` also holds the Go
  backend.)
- `eva-project/eva-backend-temp` — Go backend (optional; UI runs without it —
  the `/api/config` console errors are just the missing backend).
- `ghostlink-new-token-main` — **the reference design** we copy from
  (`components/Navbar/Navbar.module.css`, `components/Hero/*`,
  `components/Canvas3D/Canvas3DBrave.jsx`, `components/LoadingScreen/*`,
  `styles/globals.css`).

### Run / build
```bash
cd "frontend/eva-frontend-temp"
npm install
npm run dev          # → http://localhost:3000  (port is 3000, NOT 5173 — README is wrong)
npx vite build       # → dist/  (~2 min; the wallet stack makes it slow)
```

### Deploy (Vercel)
- Vercel CLI is installed + logged in as `alexey9911`. Project: `eva-frontend-temp`.
- GitHub repo (private): **`https://github.com/Alexey9911/eva-frontend`** — connected
  to Vercel, so **`git push origin main` auto-deploys to production**:
  - **Public production URL: https://eva-frontend-temp.vercel.app**
- Preview deploy (auth-protected, open while logged into Vercel):
  ```bash
  vercel deploy --yes        # preview URL
  # vercel deploy --prod     # production (only when explicitly wanted)
  ```
- Commit style: end messages with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Secrets: `.env.local` (has `VITE_GMGN_API_KEY`) is git-ignored — never commit it.

### Verifying visuals
The headless preview tool **cannot screenshot continuously-animating pages**
(CSS animations or the live WebGL canvas hang the capture). Verify with
`preview_inspect` (computed styles) + `preview_eval` (DOM/WebGL state) +
`preview_console_logs` instead, or look at the live Vercel URL on a real GPU.

---

## 1. Design tokens (the palette) — `src/index.css`

The whole theme is **CSS-variable driven**. We appended a **"GHOSTLINK THEME"
override block at the very end of `src/index.css`** (later `:root` wins, so it
re-skins the entire app without renaming anything). Key values:

```
/* accent — electric blue, reserved for interaction/glints/focus */
--accent-primary:            #3d6bff;
--accent-primary-hover:      #6189ff;
--accent-primary-active:     #2a54e6;
--accent-primary-bg:         rgba(61,107,255,0.10);
--accent-primary-border:     rgba(135,160,255,0.18);
--accent-primary-border-strong: rgba(135,160,255,0.45);

/* chrome / light scale */
--chrome-50:#ffffff; --chrome-200:#e7ebf5; --chrome-400:#aeb6c9; --chrome-600:#6b7488;

/* surfaces — matte-metal black */
--background:        #050505;
--surface-primary:   #050505;
--surface-secondary: rgba(20,21,26,0.72);
--surface-tertiary:  rgba(30,31,38,0.72);
--panel-bg:          rgba(13,13,16,0.85);
--panel-border:      rgba(255,255,255,0.08);
--glass-bg:          rgba(10,10,12,0.60);
--glass-border:      rgba(255,255,255,0.07);

/* text */
--text-primary:#f1f5fd; --text-secondary:#9aa3b6; --text-tertiary:#6b7488;

/* header/tabs */
--header-bg: rgba(7,7,9,0.66);  --header-logo:#ffffff;
--header-nav-active:#ffffff;     --header-border: rgba(255,255,255,0.07);
--header-btn-bg:#f1f5fd;         --header-btn-text:#06070b;

/* chrome wordmark gradient (used by .hero-logo-letter) */
--logo-gradient-from:#ffffff; --logo-gradient-to:#7e8aa3;

/* w3m (reown modal) accent */
--w3m-accent:#3d6bff; --w3m-color-mix:#050505;

font-family: "Public Sans", ... ;
```

### Fonts
- **Body:** `Public Sans` (Google Fonts `@import` at the top of `index.css`).
- **Display:** `Druk Cond` (very condensed heavy) — file copied from ghostlink to
  `public/font/DrukCond-Super.woff2`; `@font-face` is in the override block. Also
  `Guti Regular` (`public/font/GutiRegular.woff2`).

### Palette decision
Black + chrome/white (bloom highlights) + electric‑blue `#3d6bff` accent. To shift
the accent hue later, change `--accent-primary*` in the override block — one place.

---

## 2. Reusable style utilities (THE COPY/PASTE KIT) — defined in `src/index.css`

Use these classes on every page instead of writing new styles.

| Class | What it does | Use on |
|---|---|---|
| `.chrome-text` | white→silver gradient text-clip + soft bloom | headings, brand text |
| `.display-font` | applies `Druk Cond` | big display words |
| `.eva-shimmer` | animated chrome shimmer (already re-skinned from orange) | "EVA PROTOCOL"-style wordmarks |
| `.gl-panel` | matte-metal card: dark gradient + beveled chrome borders + layered shadows | cards, panels, modals |
| `.gl-center-glow` | very subtle dark radial center glow | section backgrounds |
| `.gl-navbar` | the floating matte-metal **pill navbar** container | header bar |
| `.gl-nav-links button, .gl-nav-links a` | nav links: `#cfd3de`, white + glow on hover; `.header-nav-active` → white glow | wrap nav link groups |
| `.gl-text-link` | plain glow text link (grey → white glow) | "Log in", text links |
| `.gl-navbar-btn` | matte-metal pill button (gradient + bevel + hover lift) | primary CTAs ("Sign Up") |
| `.eva-loader` + `.eva-loader-inner` + `.eva-loader-word` + `.eva-loader-dots` | full-screen loading overlay (EVA word + 3 wave dots), `data-fading="true"` fades it | loading states |

The matte-metal recipe (copy into any container that needs the ghostlink card look)
is `.gl-panel`:
```css
background: linear-gradient(180deg, rgba(26,26,30,.92) 0%, rgba(10,10,12,.95) 100%);
border: 1px solid rgba(255,255,255,.06);
border-top-color: rgba(255,255,255,.16);     /* light from above */
border-bottom-color: rgba(0,0,0,.85);          /* shadow below */
box-shadow: inset 0 1px 0 rgba(255,255,255,.10), inset 0 0 30px rgba(0,0,0,.5),
            0 20px 60px rgba(0,0,0,.5), 0 4px 12px rgba(0,0,0,.4);
```

---

## 3. The navbar (HeaderBar) — `src/components/HeaderBar.tsx`

Copied ghostlink's floating **matte-metal pill** (`.dNav`). Structure unchanged;
only the wrapper + link classes changed:

```tsx
<nav className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-5"
     style={{ paddingTop: 'clamp(12px, 2vh, 20px)' }}>
  <div className="gl-navbar flex items-center justify-between mx-auto">
    {/* logo */}
    <span className="... chrome-text display-font" style={{ letterSpacing: '0.06em' }}>EVA</span>
    {/* left nav group: add gl-nav-links so links get the glow style */}
    <div className="flex items-center gap-1 gl-nav-links"> ...tabs... </div>
    {/* right: Log in = gl-text-link ; Sign Up = gl-navbar-btn rounded-full */}
  </div>
</nav>
```
- `.gl-navbar` = `width:100%; max-width:1280px; height:60px; border-radius:28px` +
  matte-metal gradient + beveled borders + multi-layer shadows + `backdrop-filter:blur(12px) saturate(120%)`.
- **GOTCHA:** the pill must be a normal block centered with `mx-auto` (NOT a flex
  child) or `width:100%` collapses to content width. (Also: a 0-width preview
  viewport will make it look 38px — that's the tool, not the CSS.)
- Logo click + all in-app nav use **`goTo()`** (see §6), not `window.location.href`.

---

## 4. Loading screen + reveal timing — `src/components/LoadingScreen.tsx`

Full-screen black overlay: chrome **EVA** word on top + **3 bouncing wave dots**
(`@keyframes evaDotWave`, dot delays 0 / .16s / .32s). `App.tsx`'s config spinner
renders the **same** `<LoadingScreen fadingOut={false} />` so there's no flash.

Timing is coordinated in `LandingPage.tsx` (so the coins are caught mid-bounce, no pop):
- `coinsEnabled` true at **200 ms** (mount the canvas behind the loader),
- walls active at **900 ms**,
- at **HOLD = 1500 ms**: `setLoaderFading(true)` + `setSceneRevealed(true)` (the
  idle section fades in over 0.9s while the loader fades out over `FADE = 700 ms`),
- loader unmounts at `HOLD + FADE`.

Debug: `/?loader` holds the dots on screen with no canvas (for inspection).

---

## 5. The 3D coin canvas — `src/components/three/CoinField.tsx`

Floating chrome coins with **rapier physics** that **collide with the chat box**.
It is a faithful port of ghostlink's **WebGL** coin scene (`Canvas3DBrave.jsx`),
plus a hyperrealism pass. Lazy-loaded (only the landing pulls it).

**Why it looks like real chrome (the load-bearing facts):**
- **camera fov 17.5** at z=15 (narrow = coins look big; a wide fov makes them tiny),
- strong lighting (ambient 1.4 + directionals + point lights) — specular glints,
- **`<Environment>` built from `<Lightformer>` panels** (offline, no HDRI download):
  chrome = 100% reflected environment, so the env is what makes metal not look gray,
- coins: `metalness 1`, `roughness ~0.15`, `envMapIntensity ~1.35`,
- renderer `gl.toneMapping = NoToneMapping` (ACES is in the composer — don't double it),
- **`@react-three/postprocessing`** EffectComposer: `ToneMapping(ACES) → Bloom(mipmapBlur)
  → ChromaticAberration (RGB split) → HueSaturation + BrightnessContrast → Vignette
  → Noise (film grain) → SMAA`.
- **No N8AO / No SSR** on purpose (high cost, ~0 gain on floating coins) → holds ~60fps.

**Coins:** `coinModels = [EvaCoin.glb, solanacoin-v1.glb]` in `public/3dmodels/`.
The `EvaCoin.glb` (the user's coin, replaced ghostlink's `nolvicoin`) has 2 simple
materials (`Material.001`, `Material.002`, no `symbolMaterial`) → both get the chrome
treatment (uniform chrome). `coinRepeat` controls count (13 desktop), `coinColliderRadius
0.66`, group `scale 0.7`.

**Chat-box collision:** `<ChatBoxCollider collisionRef={...}>` maps the chat box's
DOM rect → a kinematic cuboid collider every frame so coins bounce off it (responsive).
The rect is **cached via ResizeObserver** (NOT read every frame — see §7).

**leva (live tuning):** `useControls` exposes material + every effect knob.
The panel shows at **`/?tune`** (`<Leva hidden={!TUNE}/>`). Defaults are baked in,
so non-tune users just get the tuned look.

**Debug URL flags:** `/?tune` (leva), `/?debug` (rapier collider wireframes),
`/?nocoins` (skip the canvas), `/?freeze` (stop the loop after settle for capture),
`/?loader` (hold the loader).

**3D stack (React-18 compatible, pinned):** `three@0.169`, `@react-three/fiber@8`,
`@react-three/drei@9`, `@react-three/rapier@1`, `@react-three/postprocessing@2`,
`leva@0.9`. They're in `vite.config.ts` `optimizeDeps.include` to avoid a dev
re-optimize/reload loop.

---

## 6. Performance architecture — **RULES you must follow on every page**

The browser was freezing/crashing when navigating. Root causes + the rules that
prevent regressions:

1. **Any WebGL `<Canvas>` MUST dispose on unmount.** Browsers cap live WebGL
   contexts (~8–16); leaking them on re-entry → GPU OOM → tab crash. CoinField has
   a `<DisposeGuard>` (calls `gl.dispose()` + `gl.forceContextLoss()` on unmount) +
   disposes manual textures. **Never add a 3D canvas without this.**
2. **Never call `getBoundingClientRect()` (or any layout read) inside `useFrame`.**
   It forces synchronous layout 60×/sec → main-thread lock. Cache via
   `ResizeObserver` / `resize` / `scroll`.
3. **Cap DPR** (`dpr={[1,1.4]}`) and add drei `<AdaptiveDpr pixelated/>` + `<AdaptiveEvents/>`.
4. **SPA navigation — use `goTo()` from `src/lib/nav.ts`, NEVER `window.location.href`.**
   `window.location.href` does a **full page reload** (re-parses the 2.6 MB+ bundle
   and, while the 3D was live, re-created the GPU pipeline). `goTo(path)` does
   `history.pushState` + dispatches `popstate`; `App.tsx` listens and re-renders the
   route → no reload, the landing's canvas unmounts cleanly.
   ```ts
   import { goTo } from '../lib/nav'
   onClick={() => goTo('/tokenomics')}
   ```
   (Still TODO: a few pages — TokenomicsPage, UpgradePage, TradePage, AuthGatePage,
   StrategyMarketPage, AgentGrid — still use `window.location.href`; convert them to
   `goTo` when you touch them.)
5. **Code-splitting:** every page is `React.lazy` in `App.tsx` with the **named-export
   shim** and one top-level `<Suspense>`. When you add/replace a page, follow the same
   pattern:
   ```ts
   const FooPage = lazy(() => import('./pages/FooPage').then(m => ({ default: m.FooPage })))
   ```
   This dropped the initial bundle from **4.9 MB → 2.65 MB** and moved the 3D
   (3.4 MB) + charts + markdown into lazy chunks. **Don't add static page imports back.**
6. Throttle high-frequency handlers (e.g. the cursor glow uses a ref + `requestAnimationFrame`,
   not `setState` per `mousemove`).

**Still pending (optional, biggest remaining win, riskiest):** the wallet stack
(Reown/Wagmi/viem/Solana) is still eager in `main.tsx` (~2.6 MB on every page).
Deferring it (lazy `initWallet()`, route-gate `<WagmiProvider>`, and **relocate the
top-level `useAppKitTheme()` in `App.tsx`** into a child that only renders inside the
wallet provider) would cut initial load to ~1 MB — but if the `useAppKitTheme`
relocation is missed, every non-wallet route white-screens. Do it isolated + test
every route.

---

## 7. ⭐ THE RECIPE — how to reskin a page (do this ~15×)

Most pages already shift to dark because they read `var(--surface-*) / var(--text-*) /
var(--accent-primary)`. The work is replacing **hardcoded orange** and applying the kit.

1. **Find the orange.** In the page file, search/replace literals:
   - `#FF6600` → `var(--accent-primary)` (or `#3d6bff`)
   - `#FF8520` → `#9fb4ff`
   - `rgba(255,102,0,a)` →
     - if it's a **border/divider/subtle bg** → `rgba(255,255,255,a)` (chrome),
     - if it's an **active/accent glint** → `rgba(61,107,255,a)` (blue).
   - (LandingPage already done — use it as the worked example.)
2. **Cards/panels** → add `.gl-panel` (or reuse `--panel-bg` + `--panel-border`).
3. **Headings / brand text** → `.chrome-text` (+ `.display-font` for big words).
4. **Primary buttons** → `.gl-navbar-btn` (or accent-blue bg + white text). **Text/
   secondary links** → `.gl-text-link`.
5. **Inputs** → matte: `background: linear-gradient(180deg, rgba(24,25,30,.9), rgba(9,9,12,.94))`,
   `border: 1px solid rgba(255,255,255,.10)` with `border-top` `rgba(255,255,255,.18)`;
   focus glint = blue (`box-shadow: 0 0 0 3px rgba(61,107,255,.12)`). (See the
   LandingPage chat box for the exact pattern.)
6. **Navigation** → replace `window.location.href` with `goTo(path)`.
7. **Background** → page wrappers already use `var(--surface-primary)` (#050505).
   Add `.gl-center-glow` for a subtle center light if the section needs depth.
8. **DON'T touch structure/logic/UX** — only classes, inline styles, colors.

Worked references to copy from: `LandingPage.tsx` (idle phase — chat box, accents),
`HeaderBar.tsx` (navbar), `index.css` (the utility classes + token block).

Pages still on the old orange (the ~15 to do): TraderDashboardPage, AITradersPage,
CompetitionPage, StrategyStudioPage, StrategyMarketPage, DebateArenaPage, BacktestPage,
DataPage, TokenomicsPage, UpgradePage, DocsPage/FAQ, TradePage, LoginPage, RegisterPage,
ResetPasswordPage, AuthGatePage. (Their per-page CSS vars in `index.css` lines ~62–355
still hold `rgba(255,102,0,...)` — only the *core* tokens were remapped so far.)

---

## 8. Files we created / changed (map)
- `src/index.css` — appended GHOSTLINK THEME block (tokens, fonts, all `.gl-*`/`.chrome-text`/`.eva-loader` utilities, navbar, social hover).
- `src/components/LoadingScreen.tsx` — **new** (EVA + 3 dots).
- `src/components/three/CoinField.tsx` — **new** (the 3D coin canvas).
- `src/lib/nav.ts` — **new** (`goTo` SPA navigation).
- `src/data/faqData.ts` — **recreated** (was missing → blank screen; 9 categories, 51 items from i18n keys).
- `src/components/HeaderBar.tsx` — floating matte-metal pill navbar + `goTo`.
- `src/pages/LandingPage.tsx` — idle reskin + CoinField + loader timing + cursor-glow rAF + `goTo`.
- `src/App.tsx` — lazy pages + `<Suspense>`; config spinner → `<LoadingScreen>`.
- `src/lib/config.ts` — clear poisoned config promise on error.
- `vite.config.ts` — `optimizeDeps.include` for the 3D/leva stack; `chunkSizeWarningLimit`.
- `public/3dmodels/EvaCoin.glb`, `solanacoin-v1.glb`, `nolvicoin-v1.glb`; `public/font/DrukCond-Super.woff2`, `GutiRegular.woff2`.

## 9. Git history (key commits, branch `main`)
- `ad4db4c` — initial: ghostlink reskin + 3D coin hero + recreated faqData.
- `a1f50f0` — loading screen, hyperrealistic pipeline, EvaCoin, ghostlink navbar.
- `2d759e3` — perf: fix browser freeze/crash (GPU disposal, SPA nav, code-split).

## 10. Lessons / gotchas
- The freeze was the **new 3D feature** (missing GPU disposal) + the **pre-existing
  un-split 4.9 MB bundle** + per-frame layout read — not a "which folder" issue
  (the two frontends are identical code).
- Don't remove `React.StrictMode` to "fix" dev double-mount — it just hides leaks.
- The dev preview's GPU/screenshot wedges after heavy 3D reloads; verify on Vercel.
- WebGPU/TSL from ghostlink's main `Canvas3D.jsx` was avoided — its WebGL fallback
  (`Canvas3DBrave`) is what we ported (reliable on React 18 / fiber 8).

---

## 11. Production deploy & data (Vercel frontend + Railway backend) — the part that cost days

The app is a fork of a self-hosted trading bot (Docker + nginx + Go backend). Taking
ONLY the frontend to Vercel broke everything data-related. **This is config, not bad
code.** Architecture now:

```
Vercel (this repo, the reskinned UI)
  ├── /api/*       → rewrite → Railway: eva-backend  (Go, login/traders/config/etc.)
  ├── /coingecko,  → rewrite → Railway: eva-proxy    (Node caching proxy → public APIs)
  │   /binance,
  │   /feargreed
  └── /(.*)        → /index.html  (SPA fallback, LAST)
```

- **`vite.config.ts` proxies are DEV-ONLY.** `/api`→localhost:8080 and
  `/binance,/coingecko,/feargreed,/gmgn`→public APIs only exist under `vite`. In prod
  they don't, so every fetch returned `index.html` → `Unexpected token <`. Prod
  proxying lives in **`vercel.json` rewrites**.
- **Backend (`eva-backend`) on Railway**: project `0ee12e55-…`, URL
  `https://eva-backend-production-6ed5.up.railway.app`. Deployed from the original repo's
  `Dockerfile.railway` (all-in-one GHCR image, SQLite on a Railway **volume** at
  `/app/data`, fixed secrets `JWT_SECRET`/`DATA_ENCRYPTION_KEY`/`RSA_PRIVATE_KEY`,
  `DB_TYPE=sqlite`). Source: `D:\Descargas\eva-backend-main`. CORS is `*`. Redeploy:
  `railway up -d -y` from that dir. **Keep `VITE_API_BASE_URL` UNSET** in Vercel — the
  `/api` rewrite handles it same-origin.
- **Market data needs a PROXY, not direct.** Binance (`api.binance.com`→451) and
  CoinGecko (→403) **block Vercel's datacenter IPs** (work in local dev from your home
  IP). Railway's IP is NOT blocked. So `eva-proxy` (project `7e7a54bb-…`, URL
  `https://eva-proxy-production.up.railway.app`, code in `../../eva-proxy/`: tiny Node
  `server.js`) forwards `/coingecko,/binance(→data-api.binance.vision),/feargreed` with
  per-URL caching (45s/12s/5m) + **serve-stale-on-429** so the dashboard stays populated
  on the free CoinGecko tier with no API key. Redeploy:
  `railway up -d -y --service 89a3c7d8-…` from `../../eva-proxy` (Git Bash mangles
  `-m /app/data` → prefix volume cmds with `MSYS_NO_PATHCONV=1`).
- **GOTCHAS:**
  - Vercel `:path*` rewrites do **NOT match a trailing slash**: `/feargreed/fng/?x` →
    falls through to index.html (HTML). Call without it: `/feargreed/fng?x`. (This blanked
    the Market Overview cards because global + fear&greed shared one `Promise.all`.)
  - Use `data-api.binance.vision`, not `api.binance.com` (geo-block).
  - A missing `/api/config` is **non-fatal** — App no longer gates on `configError`
    (was `if (!user||!token||configError) → AuthGate`, which locked every page in prod).
  - `gl.depth=false` on the CoinField Canvas fixes the prod-only ANGLE
    `glBlitFramebuffer` depth-stencil error.

## 12. Routing & navigation — the prod-only "navbar freeze" (cost a full day)

**Symptom (prod only, never localhost):** click logo/nav → URL changes but content stays
frozen on the old page; scroll works, navbar dead, no console error.

**Single source of truth:** `App.tsx` has ONE state, `route` (pathname);
`currentPage` is DERIVED via `getPageFromPath(route)`. **Never** add a second
`currentPage` state or inline `setRoute`+`setCurrentPage` (the old dual-state desync was
"URL changes but content doesn't"). Navigate via `navigateToPage(page)` or `goTo(path)`
(`src/lib/nav.ts` = `pushState` + synthetic `popstate`); the popstate handler is the only
writer of `route`.

**The freeze = code-splitting without safety nets.** Every page is `lazy()`. Navigating
to a not-yet-loaded chunk SUSPENDS; dev has all chunks warm so it never shows. Three
fixes — **all REQUIRED for any new lazy page:**
1. **Top-level `<Suspense>`** around `<App/>` in `main.tsx` (the lazy early-returns had no
   boundary → froze).
2. **`lazyWithReload`** wrapper in `App.tsx` — after a redeploy an open tab's old hashed
   chunk 404s → `import()` rejects → suspends forever → reload ONCE for fresh assets
   (guarded by a sessionStorage flag, reset on mount).
3. **`startTransition`** around every route `setState` → keeps the current page
   interactive while the next chunk loads, then swaps (no freeze).

**SPA links:** internal `<a href="/x">` do a full 4.9MB bundle reload. HeaderBar's
login/register use `spaGo(e, path)` — plain click = `goTo` (SPA), cmd/ctrl/middle-click =
native new tab. (Other internal `<a>` in HeroSection/Login/Register/404 still full-reload;
low priority.)

> Full design docs (the 5 premium panel variants etc.) live in `UI_DESIGN.md`.
> Git history is long now — use `git log --oneline` instead of a hand list.
