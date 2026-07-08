import { createContext, useContext, useState, ReactNode } from 'react'
import type { Language } from '../i18n/translations'

/** Fallback when no saved preference and browser is not Chinese. */
export const DEFAULT_LANGUAGE: Language = 'en'

function detectBrowserLanguage(): Language {
  if (typeof navigator === 'undefined') return DEFAULT_LANGUAGE
  const candidates = [navigator.language, ...(navigator.languages ?? [])]
  for (const tag of candidates) {
    if (tag?.toLowerCase().startsWith('zh')) {
      return 'zh'
    }
  }
  return DEFAULT_LANGUAGE
}

function resolveInitialLanguage(): Language {
  try {
    const stored = localStorage.getItem('language')
    if (stored === 'en' || stored === 'zh') {
      return stored
    }
  } catch {
    /* ignore */
  }
  return detectBrowserLanguage()
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(resolveInitialLanguage)

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    try {
      localStorage.setItem('language', lang)
    } catch {
      /* ignore */
    }
  }

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage: handleSetLanguage }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
