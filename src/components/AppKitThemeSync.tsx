import { useEffect, useRef } from 'react'
import { useAppKitTheme } from '@reown/appkit/react'
import { APPKIT_THEME_VARIABLES } from '../config/appkitTheme'

/** Run AppKit theme setup once. Must NOT live in App — unstable hook deps there
 *  re-ran on every route and could starve the main thread globally. */
export function AppKitThemeSync() {
  const { setThemeMode, setThemeVariables } = useAppKitTheme()
  const didInit = useRef(false)

  useEffect(() => {
    if (didInit.current) return
    didInit.current = true
    setThemeMode('dark')
    setThemeVariables(APPKIT_THEME_VARIABLES)
  }, [setThemeMode, setThemeVariables])

  return null
}
