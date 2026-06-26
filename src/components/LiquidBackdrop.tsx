/**
 * LiquidBackdrop — a fixed, animated liquid-gradient layer anchored at the left
 * & right screen edges (deep blue blobs that drift slowly). Fills the empty
 * space on sparse pages (login, tokenomics, upgrade) so the dark background
 * doesn't read as flat black.
 *
 * Sits at z-index 0 (see `.gl-liquid-bg` in index.css). Render it inside a dark
 * page wrapper and keep the page's real content at `relative z-10` so it stays
 * above the backdrop. Pure CSS, compositor-only, reduced-motion aware.
 */
export function LiquidBackdrop() {
  return <div className="gl-liquid-bg" aria-hidden="true" />
}
