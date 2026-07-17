// EVA Official Branding Constants

export const OFFICIAL_LINKS = {
  github: 'https://github.com/protocol-eva',
  githubFrontend: 'https://github.com/protocol-eva/eva-protocol-frontend',
  githubBackend: 'https://github.com/protocol-eva/eva-backend',
  twitter: 'https://x.com/EvaProtocolRH',
  telegram: 'https://t.me/evaprotocolRH',
  twitterHandle: '@EvaProtocolRH',
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
