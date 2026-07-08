// EVA Official Branding Constants

export const OFFICIAL_LINKS = {
  github: 'https://github.com/protocol-eva',
  twitter: 'https://x.com/EvaProtocolBase',
  telegram: 'https://t.me/evaprotocolbase',
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
