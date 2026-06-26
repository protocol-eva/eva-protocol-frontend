export interface SystemConfig {
  beta_mode: boolean
  registration_enabled?: boolean
}

/** Prepend the backend base URL for raw fetch() calls (not handled by httpClient) */
export function apiUrl(path: string): string {
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
  return `${base}${path}`
}

let configPromise: Promise<SystemConfig> | null = null
let cachedConfig: SystemConfig | null = null
const DEFAULT_CONFIG: SystemConfig = { beta_mode: false, registration_enabled: true }

export function getSystemConfig(): Promise<SystemConfig> {
  if (cachedConfig) {
    return Promise.resolve(cachedConfig)
  }
  if (configPromise) {
    return configPromise
  }
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 3500)

  configPromise = fetch(apiUrl('/api/config'), { signal: controller.signal })
    .then((res) => {
      if (!res.ok) return DEFAULT_CONFIG
      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) return DEFAULT_CONFIG
      return res.json()
    })
    .then((data: SystemConfig) => {
      cachedConfig = data
      return data
    })
    .catch(() => {
      cachedConfig = DEFAULT_CONFIG
      return DEFAULT_CONFIG
    })
    .finally(() => {
      window.clearTimeout(timeout)
      configPromise = null
    })
  return configPromise
}
