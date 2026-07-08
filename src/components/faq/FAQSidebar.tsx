import { t, type Language } from '../../i18n/translations'
import type { FAQCategory } from '../../data/faqData'

interface FAQSidebarProps {
  categories: FAQCategory[]
  activeItemId: string | null
  language: Language
  onItemClick: (categoryId: string, itemId: string) => void
}

export function FAQSidebar({
  categories,
  activeItemId,
  language,
  onItemClick,
}: FAQSidebarProps) {
  // Pre-compute a global number for each item id
  const itemNumbers: Record<string, number> = {}
  let n = 0
  for (const cat of categories) {
    for (const item of cat.items) {
      itemNumbers[item.id] = ++n
    }
  }

  return (
    <nav
      className="sticky top-24 h-[calc(100vh-120px)] overflow-y-auto pr-4"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'var(--surface-tertiary) var(--surface-secondary)',
      }}
    >
      <div className="space-y-6">
        {categories.map((category) => (
          <div
            key={category.id}
            className="eva-glass p-4 rounded-xl border border-white/5"
          >
            {/* Category Title */}
            <div className="flex items-center gap-2 mb-3 px-3">
              <category.icon className="w-5 h-5 text-eva-gold" />
              <h3 className="text-sm font-bold uppercase tracking-wide text-eva-gold">
                {t(category.titleKey, language)}
              </h3>
            </div>

            {/* Category Items */}
            <ul className="space-y-1">
              {category.items.map((item) => {
                const isActive = activeItemId === item.id
                const num = itemNumbers[item.id]
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => onItemClick(category.id, item.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all border-l-[3px] flex items-start gap-2 ${
                        isActive
                          ? 'bg-eva-gold/10 text-eva-gold border-eva-gold pl-[9px]'
                          : 'bg-transparent text-eva-text-muted border-transparent pl-3 hover:bg-eva-gold/5 hover:text-eva-text-main'
                      }`}
                    >
                      <span
                        className="shrink-0 font-mono text-xs mt-0.5"
                        style={{ color: 'var(--accent-primary)', opacity: 0.7 }}
                      >
                        {num}.
                      </span>
                      <span>{t(item.questionKey, language)}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  )
}
