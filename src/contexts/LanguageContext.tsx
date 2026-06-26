import { createContext, useContext, useState, ReactNode } from 'react'
import type { Language } from '../i18n/translations'

/** App-wide UI language. EVA Protocol is English-first. */
export const DEFAULT_LANGUAGE: Language = 'en'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    // Always English — ignore any legacy `language=zh` in localStorage.
    try {
      localStorage.setItem('language', DEFAULT_LANGUAGE)
    } catch {
      /* ignore */
    }
    return DEFAULT_LANGUAGE
  })

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
