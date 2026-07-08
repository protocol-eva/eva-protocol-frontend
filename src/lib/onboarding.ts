const ONBOARDING_KEY_PREFIX = 'eva_onboarding_done_'

export function isOnboardingComplete(userId: string): boolean {
  if (!userId) return true
  try {
    return localStorage.getItem(`${ONBOARDING_KEY_PREFIX}${userId}`) === '1'
  } catch {
    return true
  }
}

export function markOnboardingComplete(userId: string): void {
  if (!userId) return
  try {
    localStorage.setItem(`${ONBOARDING_KEY_PREFIX}${userId}`, '1')
  } catch {
    /* ignore quota errors */
  }
}
