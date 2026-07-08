import { useCallback, useMemo, useState } from 'react'
import useSWR from 'swr'
import { motion } from 'framer-motion'
import { ExternalLink, RefreshCw } from 'lucide-react'
import { HugeiconsIcon } from '@hugeicons/react'
import { News01Icon } from '@hugeicons/core-free-icons'
import { useLanguage } from '../contexts/LanguageContext'
import { apiUrl } from '../lib/config'
import type { NewsArticle, NewsFeedResponse } from '../types'

type NewsFilter =
  | 'all'
  | 'breaking'
  | 'bitcoin'
  | 'ethereum'
  | 'solana'
  | 'defi'
  | 'regulation'

const FILTERS: { id: NewsFilter; en: string; zh: string }[] = [
  { id: 'all', en: 'All', zh: '全部' },
  { id: 'breaking', en: 'Breaking', zh: '突发' },
  { id: 'bitcoin', en: 'Bitcoin', zh: '比特币' },
  { id: 'ethereum', en: 'Ethereum', zh: '以太坊' },
  { id: 'solana', en: 'Solana', zh: 'Solana' },
  { id: 'defi', en: 'DeFi', zh: 'DeFi' },
  { id: 'regulation', en: 'Regulation', zh: '监管' },
]

async function fetchNews(filter: NewsFilter): Promise<NewsFeedResponse> {
  const params = new URLSearchParams({ limit: '30' })
  if (filter === 'breaking') {
    params.set('breaking', 'true')
  } else if (filter !== 'all') {
    params.set('coin', filter)
    if (filter === 'defi' || filter === 'regulation') {
      params.delete('coin')
      params.set('category', filter)
    }
  }
  const res = await fetch(apiUrl(`/api/news?${params}`))
  if (!res.ok) {
    throw new Error(`News feed unavailable (${res.status})`)
  }
  return res.json()
}

function timeAgo(iso: string, isEn: boolean): string {
  const then = new Date(iso).getTime()
  if (!Number.isFinite(then)) return ''
  const mins = Math.floor((Date.now() - then) / 60000)
  if (mins < 1) return isEn ? 'Just now' : '刚刚'
  if (mins < 60) return isEn ? `${mins}m ago` : `${mins} 分钟前`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return isEn ? `${hrs}h ago` : `${hrs} 小时前`
  const days = Math.floor(hrs / 24)
  return isEn ? `${days}d ago` : `${days} 天前`
}

function sourceColor(source: string): string {
  const map: Record<string, string> = {
    CoinDesk: '#3d6bff',
    Cointelegraph: '#58c7ff',
    Decrypt: '#8b5cf6',
    'The Block': '#10b981',
    Blockworks: '#f59e0b',
  }
  return map[source] ?? '#6189ff'
}

function NewsCard({ article, isEn }: { article: NewsArticle; isEn: boolean }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-xl overflow-hidden transition-all duration-200 gl-onyx-panel"
      style={{ border: '1px solid var(--panel-border)' }}
    >
      <div className="flex flex-col sm:flex-row gap-0 sm:gap-4">
        {article.image && (
          <div
            className="sm:w-44 md:w-52 shrink-0 aspect-[16/10] sm:aspect-auto sm:min-h-[120px] overflow-hidden"
            style={{ background: 'var(--surface-tertiary)' }}
          >
            <img
              src={article.image}
              alt=""
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              loading="lazy"
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          </div>
        )}
        <div className="flex-1 min-w-0 p-4 sm:py-4 sm:pr-4 sm:pl-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
              style={{
                background: `${sourceColor(article.source)}22`,
                color: sourceColor(article.source),
              }}
            >
              {article.source}
            </span>
            <span
              className="text-[11px] tabular-nums"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {timeAgo(article.published_at, isEn)}
            </span>
            {article.category && article.category !== 'markets' && (
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded capitalize"
                style={{
                  background: 'var(--accent-primary-bg)',
                  color: 'var(--accent-primary)',
                }}
              >
                {article.category}
              </span>
            )}
          </div>
          <h3
            className="text-sm sm:text-[15px] font-semibold leading-snug mb-2 group-hover:underline decoration-[var(--accent-primary)] underline-offset-2"
            style={{ color: 'var(--text-primary)' }}
          >
            {article.title}
          </h3>
          {article.summary && (
            <p
              className="text-xs leading-relaxed line-clamp-2 mb-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              {article.summary}
            </p>
          )}
          <span
            className="inline-flex items-center gap-1 text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: 'var(--accent-primary)' }}
          >
            {isEn ? 'Read article' : '阅读原文'}
            <ExternalLink className="w-3 h-3" />
          </span>
        </div>
      </div>
    </a>
  )
}

export function NewsPage() {
  const { language } = useLanguage()
  const isEn = language !== 'zh'
  const [filter, setFilter] = useState<NewsFilter>('all')

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    ['news-feed', filter],
    () => fetchNews(filter),
    {
      refreshInterval: 120_000,
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
      keepPreviousData: true,
    }
  )

  const articles = data?.articles ?? []
  const sources = data?.sources ?? []

  const headline = isEn ? 'Crypto News' : '加密资讯'
  const subtitle = isEn
    ? 'Headlines from CoinDesk, Cointelegraph, Decrypt, The Block & Blockworks'
    : '来自 CoinDesk、Cointelegraph、Decrypt、The Block 和 Blockworks 的头条'

  const onRefresh = useCallback(() => mutate(), [mutate])

  const emptyMessage = useMemo(() => {
    if (error) return isEn ? 'Could not load news feed.' : '无法加载资讯。'
    if (!isLoading && articles.length === 0)
      return isEn ? 'No articles match this filter.' : '没有符合筛选的文章。'
    return null
  }, [error, isLoading, articles.length, isEn])

  return (
    <div className="gl-data-page min-h-screen pb-16">
      <div className="w-full mx-auto px-4 md:px-8 relative z-10 pt-6 max-w-[960px]">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-6"
        >
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex items-center gap-3">
              <div className="dash-kpi-ico rounded-xl w-11 h-11 flex items-center justify-center">
                <HugeiconsIcon icon={News01Icon} size={22} strokeWidth={1.8} />
              </div>
              <div>
                <h1 className="text-2xl font-bold gl-metal-shine">
                  {headline}
                </h1>
                <p
                  className="text-xs font-bold mt-0.5"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {subtitle}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onRefresh}
              disabled={isValidating}
              className="gl-navbar-btn px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 shrink-0"
              aria-label={isEn ? 'Refresh news' : '刷新资讯'}
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isValidating ? 'animate-spin' : ''}`}
              />
              {isEn ? 'Refresh' : '刷新'}
            </button>
          </div>

          {/* Filter pills */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mt-4">
            {FILTERS.map((f) => {
              const active = filter === f.id
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={{
                    background: active
                      ? 'var(--accent-primary)'
                      : 'var(--surface-secondary)',
                    color: active ? '#fff' : 'var(--text-secondary)',
                    border: active
                      ? '1px solid transparent'
                      : '1px solid var(--panel-border)',
                  }}
                >
                  {isEn ? f.en : f.zh}
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* Source strip */}
        {sources.length > 0 && (
          <p
            className="text-[10px] font-bold mb-4 uppercase tracking-wider"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {isEn ? 'Sources' : '来源'}: {sources.join(' · ')}
            {data?.fetched_at && (
              <span className="ml-2 normal-case">
                · {isEn ? 'Updated' : '更新'} {timeAgo(data.fetched_at, isEn)}
              </span>
            )}
          </p>
        )}

        {/* Feed */}
        <div className="space-y-3">
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl h-28 animate-pulse"
                style={{ background: 'var(--surface-secondary)' }}
              />
            ))}

          {!isLoading &&
            articles.map((article, i) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
              >
                <NewsCard article={article} isEn={isEn} />
              </motion.div>
            ))}

          {emptyMessage && !isLoading && (
            <div
              className="rounded-xl p-10 text-center text-sm"
              style={{
                background: 'var(--surface-secondary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--panel-border)',
              }}
            >
              {emptyMessage}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
