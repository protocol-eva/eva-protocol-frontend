// EVA Official Branding Constants

// Social links. Until EVA has its own handles we point at the OFFICIAL platform
// sites (not custom project routes) — this makes the navbar icons live + hover.
export const OFFICIAL_LINKS = {
  get twitter() {
    return 'https://x.com'
  },
  get telegram() {
    return 'https://telegram.org'
  },
  get github() {
    return 'https://github.com'
  },
} as const

// Brand info
export const BRAND_INFO = {
  name: 'EVA',
  tagline: 'AI Trading Platform',
  version: '1.0.0',
  social: {
    x: () => OFFICIAL_LINKS.twitter,
    tg: () => OFFICIAL_LINKS.telegram,
    gh: () => OFFICIAL_LINKS.github,
  },
} as const
