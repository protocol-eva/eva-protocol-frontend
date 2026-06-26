# EVA UI Design System

## 🗺️ Project Roadmap (build order)

The plan: **perfect the design system on two reference surfaces, then replicate
the same patterns across every remaining section** (don't re-invent per page).

1. ✅ **Main landing tab** (navbar + chatbox + wallet button + 3D coins) — done.
2. 🔨 **Trading / Data section** (`/data`, `src/pages/DataPage.tsx`) — IN PROGRESS.
   Full visual redesign to the realistic dark **negro-azulado** aesthetic with
   depth + shadows (NOT logic/structure). Reference: the chatbox shell + ghostlink
   Roadmap section. Established the reusable **`.gl-panel`** (realistic blue panel)
   + green-for-up data colors here.
3. 🔨 **Reskin remaining sections** one-by-one, reusing the `/data` premium panel
   family (`.gl-metal-panel` / `.gl-onyx-panel` / `.gl-aurora-panel` / `.gl-prism-panel`
   / `.gl-onyx-panel-b`) + `gl-data-page` bg + `.gl-metal-shine` animated titles.
   - ✅ **Tokenomics** (`/tokenomics`, `src/pages/TokenomicsPage.tsx`) — done. Key stats
     use **four DIFFERENT** variants (`STAT_PANELS` = metal/onyx/onyx-b/prism) so the
     animated border light travels differently per card (no repeated pattern); allocation
     = **onyx** (dark "trading-modal" look, NOT aurora — aurora read too blue on a big
     panel), vesting = prism, utility = alternating onyx/onyx-b, CTA = onyx-b; metallic
     `gl-metal-shine` titles. **De-blue rule:** the hero glow is a faint halo only —
     blue lives in ACCENTS (badges, %, buttons, active states), the base is dark metal.
   - ✅ **Upgrade** (`/upgrade`, `UpgradePage.tsx` + `UpgradeDeepThinkPanel.tsx`) — done.
     `gl-data-page` bg, eligibility card = metal panel, MetricCards + Deep Think = onyx,
     metallic `gl-metal-text` headings, blue-gradient buttons, old teal `51,153,140`→blue.
     Gate labels ("Unlocks at 150,000 EVA" / "Locked" / "Active") use **`.gl-gate-label`**.
   - ✅ **Login + Register** (`/login`, `/register`) — done. Different treatment (NOT the
     panel family): full-screen `LightPillar` WebGL bg + left poster panel + `LiquidMetalBar`
     CTAs + metallic headline + field icons. See "Login / Register WebGL" below.
   - ⏭️ Pages left: TraderDashboard, AITraders, Competition, StrategyStudio,
     StrategyMarket, DebateArena, Backtest, Docs, Trade, Reset, AuthGate.

   **Per-page rule of thumb (the look the user signed off on):** base = dark metal
   (onyx is the favourite/darkest), blue ONLY as accents, vary panel variants across a
   section so border-illumination never reads as a repeated pattern. `/data` is the
   reference; aurora is reserved for tall/narrow panels (its bloom reads too blue when
   stretched wide).

**Realism rules (apply everywhere):** lean on CSS (gradients + box-shadow +
borders), no `backdrop-filter` over heavy/3D content, strong contrast (bright
text/values on the blue-black panels), green `#10b981` = up / red `#ef4444` =
down for all market data. See [Data colors](#data-colors--market-convention).

---



Design decisions, tokens, and component recipes. Every visual technique
is documented here with the rationale and code references so future
sessions can extend without re-inventing.

---

## Color Palette

### Chrome / Metal ramp
| Token | Value | Usage |
|---|---|---|
| `--chrome-50` | `#f5f6f8` | Nav link text (super-white) |
| `--chrome-100` | `#e6e8ed` | Secondary UI text |
| `--chrome-200` | `#c8ccd6` | Muted text, icons at rest |

### Crypto Green (candle bull color)
| Name | Hex | Usage |
|---|---|---|
| `green-900` | `#064e3b` | Ring dark edge |
| `green-700` | `#047857` | Ring mid |
| `green-500` | `#10b981` | Ring bright (emerald-500) |
| `green-400` | `#34d399` | Ring peak highlight |
| TradingView green | `#089981` | Reference — TradingView candle bull |

Rationale: Emerald-500 (`#10b981`) reads "crypto bull" at a glance, pairs
perfectly with dark backgrounds, and sits far from the blue accent primary
so there is no visual competition.

---

## Navbar Pill (`.gl-navbar`)

**Concept:** fully opaque metal disc — no backdrop-filter, zero transparency bleed.

```css
.gl-navbar {
  width: 100%; max-width: 1320px; height: 62px; padding: 0 28px;
  border-radius: 30px;
  background:
    linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0) 16%),
    linear-gradient(180deg, #323232 0%, #1e1e1e 42%, #0d0d0d 72%, #181818 100%);
  border: 1px solid rgba(255,255,255,0.07);
  border-top: 1px solid rgba(255,255,255,0.28);   /* fake top-light */
  border-bottom: 1px solid rgba(0,0,0,0.85);       /* fake bottom-shadow */
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.18),
    inset 0 -1px 0 rgba(255,255,255,0.04),
    inset 0 0 34px rgba(0,0,0,0.85),
    0 18px 40px rgba(0,0,0,0.55),
    0 6px 16px rgba(0,0,0,0.4);
}
```

**Color update:** the body gradient is now **blue-tinted dark** (`#222630 →
#16191f → #0c0e13 → #131825` — B channel highest in each stop), matching the
chatbox shell's "negro azulado" instead of the old neutral grays. Same metal
recipe, blue family.

**Fake-lighting trick:** `border-top` at 28% white simulates an overhead
light source. `border-bottom` at 85% black grounds the pill. The two
stacked `inset 0 1px/−1px` box-shadows reinforce both edges from inside.
No `backdrop-filter` = zero GPU overdraw from transparency.

**Nav links:** Public Sans 500, 15 px, `--chrome-50` (near-white). No
colour on active state — just opacity difference.

---

## Unified Dropdown Navbar (`.gl-nav-*` desktop, `.gl-mnav-*` mobile)

**The problem it solves:** the old navbar showed a flat list of links that *grew*
once you entered a page (home showed a few; inner pages dumped ~10 links inline).
Now there's ONE consistent set of entries on every page, with the app consolidated
behind tidy dropdowns.

**Single source of truth:** `src/components/nav/navConfig.tsx` exports `NAV` — an
ordered list of entries (`{kind:'group'}` dropdown or `{kind:'link'}`). Desktop +
mobile both render from it, so they can never drift. Each leaf carries `page`, `path`,
`label`/`zh`, `desc`/`descZh`, a Hugeicons `icon`, and `requiresAuth`.

**Information architecture (4 entries):**
| Entry | Type | Contains |
|---|---|---|
| **Platform** | mega dropdown (2-col + descriptions) | Dashboard, AI Traders, Strategies, Strategy Market, Backtest, Live Competition, AI Debate (all `requiresAuth`) |
| **Markets** | link | `/data` |
| **Token** | dropdown (1-col) | Tokenomics, Upgrade |
| **Docs** | link | `/faq` |

**Components:** `src/components/nav/NavMenu.tsx` exports `DesktopNav` + `MobileNav`.
- Desktop dropdowns open on **hover** (with a 110 ms close-delay so the diagonal trip
  to the panel doesn't drop it) AND on **click** (touch/keyboard). The chevron
  (`ArrowDown01Icon`) flips 180° while open via `data-open="true"`. A transparent
  `::before` bridge spans the 10 px trigger→panel gap so hover never drops.
- Auth-gated leaves route through `onLeaf`, which the HeaderBar wires to either
  `onPageChange` (navigate) or `onLoginRequired` (login overlay) — same UX everywhere.
- Mobile: every leaf is a tappable row with its icon chip + label + description,
  grouped under section headers. Same `NAV`, so the user's old "mobile links missing"
  complaint can't recur.

**CSS (`index.css`, after the navbar pill):** `.gl-nav-trigger`/`.gl-nav-link` (top
level), `.gl-nav-chev` (rotates), `.gl-nav-dropdown` (dark-metal float, `.--mega` =
2-col grid), `.gl-nav-dd-item` (icon chip + label + desc, blue hover), `.gl-mnav-*`
(mobile rows). Pure CSS, compositor-only, electric-blue `#3d6bff` accent; the panel
reuses `.gl-expand-in` for the open animation. Verify open-state via
`preview_click`/dispatched events (the dropdown only renders when `open`).

---

## Liquid Metal Button (`.lm-btn`)

File: `src/components/LiquidMetalButton.tsx`
Library: `@paper-design/shaders` v0.0.76 → `ShaderMount` + `liquidMetalFragmentShader`
Icons: `@phosphor-icons/react` v2.1.10, weight `"bold"`

**Visual concept:** the RING is the star. Dark interior + subtle WebGL shimmer
(texture only); the 4 px iridescent conic ring carries all the personality.

### Layers (back → front, z-index)
| z | Element | Role |
|---|---|---|
| 0 | `::before` | Near-black disc `#080808` — defines the circle shape |
| 1 | `.lm-shader` (canvas) | WebGL liquid-metal, `opacity: 0.32` — subtle shimmer |
| 2 | `.lm-outline::before` | Iridescent conic ring, 4 px thick |
| 3 | `.lm-icon` | Phosphor icon, `44%` of `--lm-size` |

### Green ring (conic gradient)
```css
background: conic-gradient(
  from 0deg,
  #064e3b, #065f46, #047857, #059669,
  #10b981, #34d399, #059669,
  #047857, #065f46, #064e3b
);
```
At rest: `filter: grayscale(1) brightness(0.85)` → dark chrome ring.
On hover/connected: `filter: grayscale(0) brightness(1.2)` + `animation: lm-ring-spin 3s linear infinite` → spinning emerald ring.

### Spin animation (pure CSS, GPU-composited via transform)
```css
@keyframes lm-ring-spin { to { transform: rotate(360deg); } }
```
Applied on `.lm-btn:hover .lm-outline::before` and `.lm-btn.is-connected .lm-outline::before`.

### Hover glow
`filter: drop-shadow(0 0 12px rgba(16, 185, 129, 0.52))` on `.lm-btn:hover`.

### Size prop
`--lm-size` CSS variable → controls `width/height` of `.lm-btn`. Set via
`style={{ ['--lm-size']: '${size}px' }}`. All children scale from it.

### WebGL safety
- Second WebGL context (CoinField is the first). `ShaderMount.dispose()` called in `useEffect` cleanup → no context leak on navigation.
- Respects `prefers-reduced-motion` (skips `new ShaderMount()`).
- Falls back to the `::before` dark disc + CSS ring if WebGL unavailable.

### Performance notes
- Spin animation uses `transform: rotate` → compositor-only, zero layout/paint.
- Ring is a pseudo-element mask trick (no real DOM node).
- Shader canvas is `opacity: 0.32` — partial alpha compositing has negligible cost.

---

## Chatbox Shell (`.gl-chatbox-shell`)

File: `src/pages/LandingPage.tsx` (wraps the `chatBoxRef` div)

**Concept:** same metal DNA as the navbar pill but shaped as a wide container.
Pure CSS — no `backdrop-filter`, no WebGL, no video.

```css
.gl-chatbox-shell {
  border-radius: 20px;
  padding: 6px;
  background:
    linear-gradient(180deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0) 16%),
    linear-gradient(180deg, #1d1e24 0%, #111318 55%, #0c0d11 100%);
  border: 1px solid rgba(255,255,255,0.08);
  border-top: 1px solid rgba(255,255,255,0.22);
  border-bottom: 1px solid rgba(0,0,0,0.82);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.10),
    inset 0 -1px 0 rgba(255,255,255,0.03),
    inset 0 0 32px rgba(0,0,0,0.78),
    0 22px 55px rgba(0,0,0,0.68),
    0 8px 22px rgba(0,0,0,0.52);
  -webkit-tap-highlight-color: transparent;
}
/* the text input keeps caret + text selection; everything else in the shell
   is non-selectable so clicking never paints a selection rectangle */
.gl-chatbox-shell,
.gl-chatbox-shell button { user-select: none; }
.gl-chatbox-shell input { user-select: text; }
.gl-chatbox-shell button:focus,
.gl-chatbox-shell button:focus-visible { outline: none; }
```

The input inside is `background: transparent; border: none` so it visually
merges into the shell. The send button (ArrowRight/ChevronDown) keeps its own
accent-primary blue styling for the "active send" state.

**Removed (decisions):**
- The `:focus-within` green accent was tried and **removed** — too noisy; the
  green identity lives ONLY on the wallet button ring now (the user liked it
  there, not on the big shell).
- `user-select: none` + `-webkit-tap-highlight-color: transparent` kill the
  ugly selection rectangle that appeared when clicking the shell.

**Physics collider note:** `chatBoxRef` is on the inner flex div (NOT on the
shell wrapper), so the Rapier CuboidCollider continues to track the correct
position. Coins bounce off the inner div bounds, which sit 6 px inset from
the visual shell — acceptable and visually consistent.

---

## Realistic Panel (`.gl-panel`) — the section building block

The reusable card for every section. Same blue-black DNA as the chatbox shell.
No `border-radius` (composes with Tailwind `rounded-xl`/`rounded-2xl`).

```css
.gl-panel {
  background:
    linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 15%),  /* top sheen */
    linear-gradient(180deg, #1a1d25 0%, #13151c 50%, #0d0e13 100%);               /* blue-black body */
  border: 1px solid rgba(255,255,255,0.06);
  border-top-color: rgba(255,255,255,0.16);   /* light from above */
  border-bottom-color: rgba(0,0,0,0.8);        /* shadow below */
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.08),
    inset 0 -1px 0 rgba(0,0,0,0.45),
    inset 0 0 30px rgba(0,0,0,0.45),
    0 20px 50px rgba(0,0,0,0.55),
    0 6px 16px rgba(0,0,0,0.42);
}
```

**How to apply (the recipe used on DataPage):** add `gl-panel` to a card's
className and **remove any inline `background`/`border`** (inline overrides the
class) — set `style={{}}` if the attribute is still needed for other props.

Companion utilities:
- `.gl-row` + `.gl-row:hover` — blue-tinted hover for clickable list/table rows
  (pure CSS; replaces inline `onMouseEnter` gray-hover handlers).
- `.gl-panel-head` — subtle top-lit divider strip for a panel's header row.

## Token dropdown (`TokenSelect` + `.gl-select-*`)

Polished, accessible token picker. Component: `src/components/TokenSelect.tsx`,
built on **Radix UI Select** (`@radix-ui/react-select` — the primitive shadcn
wraps), styled with the blue-black `.gl-select-*` kit. Shows each token's logo
(CoinGecko `coin.image`; fiat → a glyph chip). Use anywhere a dropdown is needed:

```tsx
<TokenSelect value={id} onChange={setId}
  options={[{ value:'bitcoin', label:'BTC', image: coin.image }, …]} ariaLabel="From token" />
```

`.gl-select-trigger` (button), `.gl-select-content` (dropdown panel, animated
`glSelIn`), `.gl-select-item` (rows, blue `[data-highlighted]` hover),
`.gl-select-logo` (round logo / `.gl-select-logo-fiat` glyph). Radix is in
`vite.config.ts` `optimizeDeps.include`. **This is our dropdown for all sections.**

## Animated metal panel (`.gl-metal-panel`)

Premium "alive" card (used on Market Statistics; reusable). Pure CSS, compositor-friendly.
- Dark brushed blue-black interior (`#15171f → #0d0e14`) with a faint diagonal **sheen
  that drifts** across (`gl-metal-sheen`, 8.5s).
- An **animated border**: a soft light travels around the edge — a conic gradient on a
  masked 1px ring whose `--gl-bd-angle` spins via `@property` (`gl-border-spin`, 7s).
- `.gl-metal-panel > *` is lifted above the sheen; `prefers-reduced-motion` freezes both.
Apply alongside `rounded-2xl overflow-hidden` (replaces `.gl-panel` on a card).

## Data colors — market convention

For all market/price data, **green = up, red = down** (crypto candle convention,
and it pairs with the wallet button's green ring):
- up / positive: `#10b981` (text), `rgba(16,185,129,0.12–0.14)` (pill bg)
- down / negative: `#ef4444` (text), `rgba(239,68,68,0.12)` (pill bg)

The old template used orange `#FF6600` for "up" — banned. DataPage's `pctColor`,
ticker, mini line-charts, sparklines and %-pills were all swept to green.

## Premium kit (reusable globals) — pure CSS, 60fps

Defined in `index.css`. Use across every section for the premium metallic feel.

| Class | Effect | Use on |
|---|---|---|
| `.gl-metal-text` | chrome/metallic gradient clipped to glyphs + engraved shadow | titles, subtitles, key values |
| `.gl-metal-shine` | metallic + slow moving sheen sweep (`glMetalShine`, 7s) | the main hero/section heading only |
| `.gl-gate-label` | static brushed-chrome + STRONG bloom (NOT the animated shiny sweep); `--gl-gate-glow` tints the glow, `.gl-gate-label--unlocked` = emerald | gate/status labels ("Unlocks at 150,000 EVA", "Locked", "Active") |
| `.gl-glow-border` | animated conic glow RING (masked edge, spins via `--gl-bd-angle`) + breathing outer blue bloom. Keep `overflow` visible | premium modals/cards (sign-in overlay, login card) |
| `.gl-title-metal` / `.gl-title-metal-blue` | WHITE-base / BLUE-base metallic headline; a bright highlight catch sweeps across (`glMetalShine`) | login/register hero "TRADE **SMARTER** FASTER" (blue = accent word) |
| `.gl-edge-glow` | a bright blue glow segment travels up & down an element's RIGHT edge (+ faint static hairline) | login/register left poster panel |
| `.gl-modal-btn-primary` / `.gl-modal-btn-ghost` | blue-gradient + glow / dark ghost, both with lift-on-hover | modal/auth CTAs |
| `.gl-panel:hover` | illuminate-on-hover: 1px lift + brighter top + faint blue glow | already on every `.gl-panel` |
| `.gl-expand-in` | smooth expand-from-top (`glExpandIn`, 0.3s) | dropdowns / command panels |

Notes:
- Metallic text needs the inline `color` REMOVED (it uses `-webkit-text-fill-color: transparent`). Don't put it on text whose color is semantic (e.g. the Fear & Greed value, % up/down).
- All animations honor `prefers-reduced-motion`.
- For heavier award-level motion later, the **awwwards-animations** skill (GSAP/Motion/Lenis) is available; keep simple micro-interactions pure-CSS to avoid debug overhead.

## Liquid background (`.gl-liquid-bg` / `<LiquidBackdrop/>`)

Sparse dark pages (login, tokenomics, upgrade) looked empty where lots of background
showed. `<LiquidBackdrop/>` (`src/components/LiquidBackdrop.tsx`) renders a fixed
`.gl-liquid-bg` layer with two soft, heavily-blurred **deep-blue** gradient blobs
anchored at the **left & right screen edges** that drift slowly (different hue + timing
so they never sync). Pure CSS (`transform`/`opacity` only), reduced-motion aware.

**Wiring (important):** the layer sits at `z-index: 0`, so the page's real content must
be lifted with `relative z-10` (the page wrapper keeps its opaque `gl-data-page` bg at
the back; the liquid paints above it, behind content; the fixed navbar stays at z-50).
Deep/dark blue on purpose — NOT bright (matches the "blue only as accent, dark metal
base" rule).

## Leva removed (3D coins)

The Leva debug panel (`?tune`) was removed completely from `CoinField.tsx` — the look is
now fixed in a plain `ctrl` constant (ACES Filmic, exposure 1.0, chrome material, bloom,
subtle CA, grade, vignette+grain; experimental effects OFF). The `leva` package is
uninstalled and the `#leva__root` CSS is gone. To re-grade the coins, edit `ctrl`.

> ⚠️ **`optimizeDeps` gotcha (cost a debugging session):** when you UNINSTALL a dep, you
> MUST also remove it from `vite.config.ts` → `optimizeDeps.include`. Leaving `'leva'`
> there after uninstall made the **dev server** fail with `Failed to resolve dependency:
> leva` → the optimizer wedged → **every page rendered an empty `#root`** (no error in the
> browser console; the clue is in the Vite *server* logs). It does NOT affect the prod
> build (Rollup ignores `optimizeDeps`), so the deploy was fine. Fix: drop it from
> `optimizeDeps.include` + `rm -rf node_modules/.vite` + restart.

## Login / Register WebGL (LightPillar + LiquidMetalBar)

`/login` (`LoginPage.tsx`) + `/register` (`RegisterPage.tsx`) share one layout.

**Background — `LightPillar`** (`src/components/three/LightPillar.tsx`, ported from React
Bits, three.js ray-marched pillar; `tanh()`→WebGL1-safe `tanhv()` so it compiles under
ANGLE; disposes + `forceContextLoss` on unmount; silent `ErrorBoundary`). Full-screen
`fixed inset-0 z-0`. **Final colour (dark metal, subtle blue — matches the panels):**
`topColor #5e7cc0`, `bottomColor #080b16`, `intensity 0.82`, `glowAmount 0.0052`,
`pillarWidth 2.4`. (Earlier `#6f96ff`/intensity 1 was too neon.)

**Layout — BULLETPROOF centering (the prior layout pushed the form off-screen):**
root `min-h-screen relative overflow-hidden`; left panel is a **`<aside>` `fixed left-0
top-0 h-screen w-[500px] z-20`** (explicit `h-screen` = always full height) with
`.gl-edge-glow` (a glow segment that travels up/down the right edge); the form is a
**`absolute inset-0 z-10 overflow-y-auto lg:pl-[500px]`** wrapper containing a `min-h-full
flex items-center justify-center` → it centres AND can never overflow off-screen, at any
viewport height. NO mirror-`spacer` div (that was the "spaghetti"). NEVER go back to
`min-h-screen flex` in-flow centering here.

**Poster image:** the user's portada lives at **`/public/login-poster.png`** (≈544×990).
It's the panel BACKGROUND (`<img absolute inset-0 w-full h-full object-cover object-center`
`+ transform: scale(1.06)` so it fills edge-to-edge, no right-side gap), under a dark
**scrim** gradient, with the headline + EVA PROTOCOL on top (`relative z-10`). `onError`
hides the img → the dark panel gradient shows as fallback.

**Headline metallic:** `TRADE`/`FASTER` (+ `START`/`TODAY`) = **`.gl-title-metal`**
(WHITE base + a moving bright shine catch); the accent word `SMARTER`/`TRADING` =
**`.gl-title-metal-blue`** (blue-chrome shine + blue glow). Both animate `glMetalShine`.

**Field icons (Hugeicons, imported in the page):** `Mail01Icon` inside the email input,
`LockPasswordIcon` inside password/confirm (absolute-left span + input `paddingLeft 42px`),
`Activity03Icon` (pulsing) next to "ALL SYSTEMS OPERATIONAL".

**CTAs (Sign in / Create account) — `LiquidMetalBar`** (`.lm-bar`): the `@paper-design/
shaders` liquid-metal shader as the animated BORDER frame with the label on a dark inner
panel — the landing wallet button's "canvas-in-border" look, compact (auto-width, NOT a
full-width slab). WebGL `try`-caught + reduced-motion aware → static metal fallback.

> The sign-in **overlay** (`LoginRequiredOverlay`, Dashboard gate) uses the transparent
> `blur(14px)` backdrop + `.gl-glow-border` modal + `.gl-modal-btn-*` (see those classes).

## Navbar dropdowns — deep dark, not bright blue

`.gl-nav-dropdown` + `.gl-nav-dd-ico` were re-toned to a **deep dark-metal blue-black**
(`#14161d → #0a0b10`, faint cool top-sheen, deep-blue icon chips that only brighten to
electric blue on hover) — the earlier version read too light/bright blue.

## Advanced effects (pure CSS, no WebGL)

Designed via a CSS-expert workflow. Both are 60fps, compositor-only, reduced-motion aware.

- **`.gl-conv-*` — animated emerald aurora** (converter background). Layered radial
  "blobs" over an OPAQUE deep floor (`#0b1411`) so green reads as light through dark
  glass; blob centers + a conic sheen animate via registered `@property` vars (GPU
  interpolates them — no JS/rAF), SVG grain kills banding, a `.gl-conv-scrim` keeps
  the blue-black inputs legible. `@supports` transform-drift fallback for old engines.
  Markup: `.gl-conv-panel` + `.gl-conv-aurora` + `.gl-conv-scrim` as first children;
  a CSS rule lifts real content above. **No WebGL context** (deliberate — perf + the
  SPA-nav crash history).
- **`.gl-streak-*` — bloom "heat" bars** (top-2 rows of Trending/Top Gainers). A
  left-anchored emerald gradient row-background whose WIDTH = `glStreakWidth(change24h)`
  (sqrt-eased, clamped 16–92%, set ONCE inline via `--gl-streak-w`; never animate width).
  Bloom = inset box-shadow on the leading edge; only opacity breathes. `.gl-streak-row--lead`
  (rank #1) is brighter. Width transitions 600ms on data refresh.

## Performance Budget

| Feature | Technique | GPU cost |
|---|---|---|
| Navbar pill | CSS gradients + box-shadow | Compositor only |
| Chatbox shell | CSS gradients + box-shadow | Compositor only |
| LM button ring | CSS mask + conic-gradient rotate | Compositor only |
| LM button shader | WebGL canvas, opacity 0.32 | Low — 1 draw call |
| CoinField | Three.js + Rapier physics | Heavy — keep isolated/lazy |

Rule: if it can be done with `box-shadow`, `border`, or `transform` → do that.
Reach for `backdrop-filter` only if the context is lightweight (no 3D behind).
Never add a second WebGL context without disposing the old one.

### ⚠️ Crash gotcha — `backdrop-filter` over the live 3D scene
The Commands dropdown originally had `backdrop-filter: blur(28px)`. Opening it
**on top of the animating CoinField WebGL canvas** forced the browser to
re-blur the entire 3D framebuffer every frame → the page **hard-froze** (could
not even open devtools). Fix: opaque dark gradient, **zero** `backdrop-filter`
on any element that overlays the 3D landing. Confirmed `getComputedStyle`
sweep: 0 elements with backdrop-filter on the landing.

---

## Icon Library

Three sets coexist, by surface:

**1. Hugeicons — the NAVBAR icon system** (`@hugeicons/react` + `@hugeicons/core-free-icons`, MIT).
A newer, premium, non-generic set chosen so each nav glyph reads as exactly what the
link does. ALL nav icon imports live in **one place** — `src/components/nav/navConfig.tsx`
— so the library is swappable from a single file.
```tsx
import { HugeiconsIcon } from '@hugeicons/react'
import { DashboardSquare01Icon } from '@hugeicons/core-free-icons'
<HugeiconsIcon icon={DashboardSquare01Icon} size={18} strokeWidth={1.8} className="gl-nav-ico" />
```
Icons render `<svg>` with `currentColor`, so the wrapping `.gl-nav-ico` / `.gl-nav-dd-ico`
class drives colour (chrome at rest → electric-blue `#bcd0ff` on hover, with a blue glow).

**2. Phosphor Icons** (`@phosphor-icons/react` v2.1.10) — wallet button + decorative.
```tsx
import { Wallet } from '@phosphor-icons/react'
<Wallet weight="bold" />   // thin | light | regular | bold | fill | duotone
```

**3. Lucide** (`lucide-react`) — legacy/page-level icons (copy, chevrons, page utility
icons like the Tokenomics utility cards). Migrate opportunistically; no need to sweep.

---

## Applying the Dark Metal Recipe to a New Component

1. `border-radius`: 14–30 px depending on size (pill = 30 px, panel = 16–20 px)
2. `background`: two stacked `linear-gradient` (top shimmer + dark body)
3. `border-top`: `rgba(255,255,255,0.18–0.25)` — fake overhead light
4. `border-bottom`: `rgba(0,0,0,0.75–0.85)` — fake ground shadow
5. `border`: `1px solid rgba(255,255,255,0.07–0.08)` — sides
6. `box-shadow`: two inset edge lines + deep inset fill + two outer drops
7. No `backdrop-filter` if there's 3D content behind it

---

## Premium panel family (the `/data` look — reuse these for other sections)

Five distinct **dark metallic + glow** card variants. All: `position:relative;
isolation:isolate; overflow:hidden`, content wrapped via `> * { z-index: … }`,
`prefers-reduced-motion` freezes animations, pure CSS (GPU-cheap), electric-blue
accent family (`#3d6bff` / `rgba(61,107,255,…)`). Mix them so a page isn't one
repeated pattern. The animated border ring uses `@property --gl-bd-angle` +
`@keyframes gl-border-spin` (a masked conic-gradient, `mask-composite: exclude`).

The onyx variants (Trending / Top Gainers) are the user's favourite look — darkest +
cleanest. Aurora / prism / converter were later darkened toward that onyx darkness.

| Class | Motion / signature | Used on (/data) |
|---|---|---|
| `.gl-metal-panel` | single bright arc travels the border + one huge soft drifting glow | Market Cap, 24h Volume |
| `.gl-onyx-panel` | wide soft glow drifts horizontally + electric glint slides along the TOP hairline | BTC Dominance, Fear&Greed, Trending |
| `.gl-onyx-panel-b` | same dark onyx family, different pattern: diagonal glow drift + glint along the BOTTOM edge | Top Gainers |
| `.gl-aurora-panel` | deep blue/violet aurora bloom breathes up from the base + glowing animated border (darkened) | Market Statistics |
| `.gl-prism-panel` | wide soft diagonal sheen (`alternate` = seamless, no reset) + BOTH side edges glow against a very dark cinematic body | Top 20 by Market Cap |
| `.gl-liquid-panel` | brushed-steel conic reflection rotates slowly + 2-arc breathing border | (defined, currently unused — was Top Gainers) |

**Converter** (`.gl-conv-*`): animated blue **plasma/smoke** (SVG `feTurbulence`
`#gl-smoke` filter, rendered in DataPage) over a dark floor with just a hair of blue +
a subtle blue ring (`.gl-conv-scrim` box-shadow) so it reads as the odd-one-out
"active tool" — kept dark to match the panels.

Apply: swap a card's `gl-panel`/tailwind bg for one of these classes (keep
`rounded-*` + padding). Verify animations via `preview_inspect`/`eval` —
`/data` is animation-dense so screenshots hang (see memory).

---

## Engineering / production / routing → see `REDESIGN_PLAYBOOK.md`

Deploy (Vercel + Railway backend + the market-data caching proxy), the geo-block /
trailing-slash gotchas, the single-source routing, and the prod-only "navbar freeze"
fix (lazy + Suspense + startTransition + lazyWithReload) are **engineering**, not
visual design — they live in `REDESIGN_PLAYBOOK.md` §11–12. This file stays focused on
the design system.
