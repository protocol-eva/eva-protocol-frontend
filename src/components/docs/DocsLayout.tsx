import { useState, useMemo, useCallback } from 'react'
import { Menu, BookOpen, ArrowLeft } from 'lucide-react'
import { faqCategories } from '../../data/faqData'
import { t as translate, type Language } from '../../i18n/translations'
import { goTo } from '../../lib/nav'
import { DocsSidebar } from './DocsSidebar'
import { DocsContent } from './DocsContent'

interface DocsLayoutProps {
  language: Language
}

export function DocsLayout({ language }: DocsLayoutProps) {
  const t = (key: string) => translate(key, language)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeItemId, setActiveItemId] = useState<string | null>(
    faqCategories[0]?.items[0]?.id ?? null
  )
  const [mobileOpen, setMobileOpen] = useState(false)

  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return faqCategories
    const lower = searchTerm.toLowerCase()
    return faqCategories
      .map((category) => ({
        ...category,
        items: category.items.filter((item) => {
          const q = t(item.questionKey).toLowerCase()
          const a = t(item.answerKey).toLowerCase()
          return q.includes(lower) || a.includes(lower)
        }),
      }))
      .filter((category) => category.items.length > 0)
  }, [searchTerm, language])

  const handleItemClick = useCallback((_categoryId: string, itemId: string) => {
    setActiveItemId(itemId)
  }, [])

  const handleNavigate = useCallback((itemId: string) => {
    setActiveItemId(itemId)
  }, [])

  // Back — the global navbar is hidden on this page, so the docs top bar owns
  // navigation. Return to the previous page, or home if opened on a deep link.
  const goBack = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1)
      window.history.back()
    else goTo('/')
  }, [])

  return (
    <div
      className="flex flex-col"
      style={{
        height: '100dvh',
        backgroundColor: 'var(--background)',
        // subtle life — a soft cool glow up top + a faint corner wash, kept low
        // so it reads cleaner/simpler than the premium pages.
        backgroundImage:
          'radial-gradient(1100px 520px at 50% -8%, rgba(61,107,255,0.07), transparent 60%), radial-gradient(700px 500px at 100% 100%, rgba(124,92,255,0.05), transparent 65%)',
      }}
    >
      {/* Top bar */}
      <div
        className="flex items-center gap-2.5 px-4 sm:px-6 py-3 flex-shrink-0"
        style={{
          borderBottom: '1px solid var(--surface-tertiary)',
          background: 'var(--surface-primary)',
        }}
      >
        {/* Back button — replaces the removed navbar back control */}
        <button
          onClick={goBack}
          className="flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-lg text-sm font-medium transition-all shrink-0"
          style={{
            color: 'var(--text-secondary)',
            background: 'var(--surface-secondary)',
            border: '1px solid var(--surface-tertiary)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--accent-primary)'
            e.currentTarget.style.borderColor = 'var(--accent-primary-border)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)'
            e.currentTarget.style.borderColor = 'var(--surface-tertiary)'
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">
            {language === 'zh' ? '返回' : 'Back'}
          </span>
        </button>

        <div
          className="h-5 w-px shrink-0"
          style={{ background: 'var(--surface-tertiary)' }}
        />

        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-1.5 rounded-lg transition-colors shrink-0"
          style={{
            color: 'var(--text-secondary)',
            background: 'var(--surface-secondary)',
          }}
        >
          <Menu className="w-4.5 h-4.5" />
        </button>
        <BookOpen
          className="w-5 h-5 hidden sm:block shrink-0"
          style={{ color: 'var(--accent-primary)' }}
        />
        <h1
          className="text-base font-bold truncate"
          style={{ color: 'var(--text-primary)' }}
        >
          {language === 'zh' ? '文档' : 'Documentation'}
        </h1>

        {/* spacer pushes the article count to the far right so it never crosses
            the sidebar divider */}
        <div className="flex-1" />

        <span
          className="text-xs px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0 leading-relaxed"
          style={{
            background: 'var(--accent-primary-bg)',
            color: 'var(--accent-primary)',
            border: '1px solid var(--accent-primary-border)',
          }}
        >
          {filteredCategories.reduce((sum, c) => sum + c.items.length, 0)}{' '}
          {language === 'zh' ? '篇' : 'articles'}
        </span>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        <DocsSidebar
          categories={filteredCategories}
          activeItemId={activeItemId}
          language={language}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onItemClick={handleItemClick}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
        <DocsContent
          categories={filteredCategories}
          language={language}
          activeItemId={activeItemId}
          onNavigate={handleNavigate}
        />
      </div>
    </div>
  )
}
