/**
 * NAVIGATION CONFIG — single source of truth for the whole navbar.
 *
 * The old navbar showed a flat list of links that GREW once you entered a page
 * (home showed a few, inner pages dumped ~10 links inline). This config replaces
 * that with a small, CONSISTENT set of entries — two dropdowns + two links — so
 * the navbar looks identical everywhere and consolidates the app behind tidy
 * menus instead of a wall of links.
 *
 * ── Icons ──────────────────────────────────────────────────────────────────
 * Every entry carries a premium icon from **Hugeicons** (`@hugeicons/core-free-
 * icons`, MIT) — a newer, non-generic set chosen so each glyph reads as exactly
 * what the link does. ALL icon imports live HERE: this file is the one place to
 * swap the icon library if we ever change it (nothing else imports the set).
 */
import type { IconSvgElement } from '@hugeicons/react'
import {
  GridViewIcon,
  DashboardSquare01Icon,
  Robot01Icon,
  Target01Icon,
  Store01Icon,
  TestTube01Icon,
  Award01Icon,
  BubbleChatIcon,
  Analytics02Icon,
  Bitcoin01Icon,
  Coins01Icon,
  Rocket01Icon,
  News01Icon,
  Book02Icon,
  ArrowDown01Icon,
} from '@hugeicons/core-free-icons'

// The chevron used by every dropdown trigger (rotates 180° when open).
export const CHEVRON_ICON: IconSvgElement = ArrowDown01Icon

export type NavPage =
  | 'competition'
  | 'traders'
  | 'trader'
  | 'backtest'
  | 'strategy'
  | 'strategy-market'
  | 'data'
  | 'news'
  | 'debate'
  | 'faq'
  | 'tokenomics'
  | 'upgrade'

/** A single navigable destination (a row inside a dropdown, or a top-level link). */
export interface NavLeaf {
  page: NavPage
  path: string
  label: string
  /** Simplified-Chinese label (language === 'zh'). */
  zh: string
  /** One-line helper shown under the label in dropdowns. */
  desc: string
  descZh: string
  icon: IconSvgElement
  requiresAuth?: boolean
}

/** A dropdown grouping several leaves under one trigger. */
export interface NavGroup {
  id: string
  label: string
  zh: string
  icon: IconSvgElement
  /** 2 → mega panel (two columns + descriptions); 1 → compact list. */
  columns: 1 | 2
  items: NavLeaf[]
}

export type NavEntry =
  | { kind: 'link'; leaf: NavLeaf }
  | { kind: 'group'; group: NavGroup }

// ── Platform — the full trading suite, all behind auth ───────────────────────
const PLATFORM: NavGroup = {
  id: 'platform',
  label: 'Platform',
  zh: '平台',
  icon: GridViewIcon,
  columns: 2,
  items: [
    {
      page: 'trader',
      path: '/dashboard',
      icon: DashboardSquare01Icon,
      requiresAuth: true,
      label: 'Dashboard',
      zh: '仪表盘',
      desc: 'AI trader performance at a glance',
      descZh: 'AI 交易员表现概览',
    },
    {
      page: 'traders',
      path: '/traders',
      icon: Robot01Icon,
      requiresAuth: true,
      label: 'AI Traders',
      zh: 'AI 交易员',
      desc: 'Configure & manage your agents',
      descZh: '配置和管理 AI 交易代理',
    },
    {
      page: 'strategy',
      path: '/strategy',
      icon: Target01Icon,
      requiresAuth: true,
      label: 'Strategies',
      zh: '策略',
      desc: 'Build & tune trading strategies',
      descZh: '创建和管理交易策略',
    },
    {
      page: 'strategy-market',
      path: '/strategy-market',
      icon: Store01Icon,
      requiresAuth: true,
      label: 'Strategy Market',
      zh: '策略市场',
      desc: 'Browse the community marketplace',
      descZh: '浏览社区策略',
    },
    {
      page: 'backtest',
      path: '/backtest',
      icon: TestTube01Icon,
      requiresAuth: true,
      label: 'Backtest',
      zh: '回测',
      desc: 'Test against historical data',
      descZh: '针对历史数据测试策略',
    },
    {
      page: 'competition',
      path: '/competition',
      icon: Award01Icon,
      requiresAuth: true,
      label: 'Live Competition',
      zh: '实时排行',
      desc: 'Real-time trader leaderboard',
      descZh: '实时 AI 交易员排行榜',
    },
    {
      page: 'debate',
      path: '/debate',
      icon: BubbleChatIcon,
      requiresAuth: true,
      label: 'AI Debate',
      zh: 'AI 辩论',
      desc: 'Watch agents debate the market',
      descZh: '观看 AI 交易员实时辩论市场走势',
    },
  ],
}

// ── Token — $EVA token + plan upgrades ───────────────────────────────────────
const TOKEN: NavGroup = {
  id: 'token',
  label: 'Token',
  zh: '代币',
  icon: Bitcoin01Icon,
  columns: 1,
  items: [
    {
      page: 'tokenomics',
      path: '/tokenomics',
      icon: Coins01Icon,
      label: 'Tokenomics',
      zh: '代币经济',
      desc: 'Supply, allocation & utility',
      descZh: '供应、分配与用途',
    },
    {
      page: 'upgrade',
      path: '/upgrade',
      icon: Rocket01Icon,
      label: 'Upgrade',
      zh: '升级',
      desc: 'Unlock premium plans',
      descZh: '解锁高级套餐',
    },
  ],
}

// ── Standalone links (no dropdown) ───────────────────────────────────────────
const MARKETS: NavLeaf = {
  page: 'data',
  path: '/data',
  icon: Analytics02Icon,
  label: 'Markets',
  zh: '市场',
  desc: 'Live market data & analytics',
  descZh: '实时市场数据与分析',
}
const NEWS: NavLeaf = {
  page: 'news',
  path: '/news',
  icon: News01Icon,
  label: 'News',
  zh: '资讯',
  desc: 'Latest crypto headlines & analysis',
  descZh: '最新加密头条与分析',
}
const DOCS: NavLeaf = {
  page: 'faq',
  path: '/faq',
  icon: Book02Icon,
  label: 'Docs',
  zh: '文档',
  desc: 'Guides & documentation',
  descZh: '指南与文档',
}

/** The complete, ordered navbar — identical on every page. */
export const NAV: NavEntry[] = [
  { kind: 'group', group: PLATFORM },
  { kind: 'link', leaf: MARKETS },
  { kind: 'link', leaf: NEWS },
  { kind: 'group', group: TOKEN },
  { kind: 'link', leaf: DOCS },
]

/** Pages that mark a group's trigger as "active" (current section highlight). */
export function groupActivePages(group: NavGroup): NavPage[] {
  return group.items.map((i) => i.page)
}
