import React, { createContext, useContext, useState, useEffect } from 'react'
import { apiUrl } from '../lib/config'
import { reset401Flag, httpClient } from '../lib/httpClient'
import {
  getAuthIntent,
  clearAuthIntent,
} from '../components/landing/LoginModal'

function getPostAuthRedirect(defaultPath = '/traders'): string {
  const returnUrl = sessionStorage.getItem('returnUrl')
  if (returnUrl) {
    sessionStorage.removeItem('returnUrl')
    return returnUrl
  }
  const intent = getAuthIntent()
  clearAuthIntent()
  if (intent === 'wallet') return '/wallet'
  if (intent === 'trader') return '/traders'
  return defaultPath
}

interface User {
  id: string
  email: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (
    email: string,
    password: string
  ) => Promise<{
    success: boolean
    message?: string
    userID?: string
    requiresOTP?: boolean
    requiresOTPSetup?: boolean
    qrCodeURL?: string
    otpSecret?: string
    email?: string
  }>
  loginAdmin: (password: string) => Promise<{
    success: boolean
    message?: string
  }>
  register: (
    email: string,
    password: string,
    betaCode?: string
  ) => Promise<{
    success: boolean
    message?: string
    userID?: string
    otpSecret?: string
    qrCodeURL?: string
    completed?: boolean
  }>
  verifyOTP: (
    userID: string,
    otpCode: string
  ) => Promise<{ success: boolean; message?: string }>
  completeRegistration: (
    userID: string,
    otpCode: string,
    options?: { redirect?: boolean }
  ) => Promise<{ success: boolean; message?: string }>
  setupOTP: () => Promise<{
    success: boolean
    message?: string
    otpSecret?: string
  }>
  getAccountSecurity: () => Promise<{
    success: boolean
    message?: string
    email?: string
    otpEnabled?: boolean
  }>
  resetPassword: (
    email: string,
    newPassword: string,
    otpCode: string
  ) => Promise<{ success: boolean; message?: string }>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Reset 401 flag on page load to allow fresh 401 handling
    reset401Flag()

    // ── Dev-only session bypass ──────────────────────────────────────────────
    // Lets the authenticated UI be built/refactored without backend whitelist
    // access (the live site's /api/* requires a whitelisted account).
    //   /?devlogin=1   → enter the app as a mock user (persists)
    //   /?devlogout=1  → clear the mock session
    // import.meta.env.DEV is statically false in production builds, so this whole
    // block is dead-code-eliminated and can never ship.
    if (import.meta.env.DEV) {
      const params = new URLSearchParams(window.location.search)
      if (params.get('devlogout') === '1') {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        localStorage.removeItem('eva_dev_bypass')
      } else if (params.get('devlogin') === '1') {
        localStorage.setItem('auth_token', 'dev-bypass-token')
        localStorage.setItem(
          'auth_user',
          JSON.stringify({ id: 'dev', email: 'dev@local' })
        )
        localStorage.setItem('eva_dev_bypass', '1')
      }
    }

    const savedToken = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('auth_user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  // Listen for unauthorized events from httpClient (401 responses)
  useEffect(() => {
    const handleUnauthorized = () => {
      console.log('Unauthorized event received - clearing auth state')
      // Clear auth state when 401 is detected
      setUser(null)
      setToken(null)
      // Note: localStorage cleanup is already done in httpClient
    }

    window.addEventListener('unauthorized', handleUnauthorized)

    return () => {
      window.removeEventListener('unauthorized', handleUnauthorized)
    }
  }, [])

  const persistAuthSession = (data: {
    token: string
    user_id: string
    email: string
  }) => {
    reset401Flag()

    const userInfo = { id: data.user_id, email: data.email }
    setToken(data.token)
    setUser(userInfo)
    localStorage.setItem('auth_token', data.token)
    localStorage.setItem('auth_user', JSON.stringify(userInfo))

    const redirect = getPostAuthRedirect()
    window.history.pushState({}, '', redirect)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  const updateAuthSession = (data: {
    token?: string
    user_id: string
    email: string
  }) => {
    reset401Flag()

    const userInfo = { id: data.user_id, email: data.email }
    if (data.token) {
      setToken(data.token)
      localStorage.setItem('auth_token', data.token)
    }
    setUser(userInfo)
    localStorage.setItem('auth_user', JSON.stringify(userInfo))
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(apiUrl('/api/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.token) {
          persistAuthSession(data)
          return { success: true }
        }

        // Check for OTP setup required (incomplete registration)
        if (data.requires_otp_setup) {
          return {
            success: true,
            userID: data.user_id,
            requiresOTPSetup: true,
            message: data.message,
            qrCodeURL: data.qr_code_url,
            otpSecret: data.otp_secret,
            email: data.email,
          }
        }
        // Check for OTP verification required (normal login flow)
        if (data.requires_otp) {
          return {
            success: true,
            userID: data.user_id,
            requiresOTP: true,
            message: data.message,
            qrCodeURL: data.qr_code_url,
            otpSecret: data.otp_secret,
          }
        }
        // Unexpected success response
        return { success: false, message: 'Unexpected login response' }
      } else {
        return {
          success: false,
          message: data.error,
          qrCodeURL: data.qr_code_url,
          otpSecret: data.otp_secret,
          userID: data.user_id,
        }
      }
    } catch (error) {
      return { success: false, message: 'Login failed, please try again' }
    }
  }

  const loginAdmin = async (password: string) => {
    try {
      const response = await fetch(apiUrl('/api/admin-login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await response.json()
      if (response.ok) {
        // Reset 401 flag on successful login
        reset401Flag()

        const userInfo = {
          id: data.user_id || 'admin',
          email: data.email || 'admin@localhost',
        }
        setToken(data.token)
        setUser(userInfo)
        localStorage.setItem('auth_token', data.token)
        localStorage.setItem('auth_user', JSON.stringify(userInfo))

        const redirect = getPostAuthRedirect('/dashboard')
        window.history.pushState({}, '', redirect)
        window.dispatchEvent(new PopStateEvent('popstate'))
        return { success: true }
      } else {
        return { success: false, message: data.error || 'Login failed' }
      }
    } catch (e) {
      return { success: false, message: 'Login failed, please try again' }
    }
  }

  const register = async (
    email: string,
    password: string,
    betaCode?: string
  ) => {
    const requestBody: {
      email: string
      password: string
      beta_code?: string
    } = { email, password }
    if (betaCode) {
      requestBody.beta_code = betaCode
    }

    try {
      const result = await httpClient.post<{
        user_id: string
        email: string
        token?: string
        otp_secret?: string
        qr_code_url?: string
        message: string
      }>('/api/register', requestBody)

      if (result.success && result.data) {
        if (result.data.token) {
          persistAuthSession({
            token: result.data.token,
            user_id: result.data.user_id,
            email: result.data.email,
          })
          return {
            success: true,
            completed: true,
            message: result.message || result.data.message,
          }
        }

        if (result.data.otp_secret) {
          return {
            success: true,
            userID: result.data.user_id,
            otpSecret: result.data.otp_secret,
            qrCodeURL: result.data.qr_code_url,
            message: result.message || result.data.message,
          }
        }

        return {
          success: false,
          message:
            result.message || result.data.message || 'Registration failed',
        }
      }

      // Only business errors reach here (system/network errors were intercepted)
      return {
        success: false,
        message: result.message || 'Registration failed',
      }
    } catch (error) {
      console.error('Auth register error:', error)
      // Re-throw if it's a critical error, or return structured error
      // Since httpClient throws on 500, we should return a structured error response
      // to let the UI display it gracefully without crashing.
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Detailed server error',
      }
    }
  }

  const verifyOTP = async (userID: string, otpCode: string) => {
    try {
      const response = await fetch(apiUrl('/api/verify-otp'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userID, otp_code: otpCode }),
      })

      const data = await response.json()

      if (response.ok) {
        persistAuthSession(data)
        return { success: true, message: data.message }
      } else {
        return { success: false, message: data.error }
      }
    } catch (error) {
      return {
        success: false,
        message: 'OTP verification failed, please try again',
      }
    }
  }

  const completeRegistration = async (
    userID: string,
    otpCode: string,
    options?: { redirect?: boolean }
  ) => {
    try {
      const response = await fetch(apiUrl('/api/complete-registration'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userID, otp_code: otpCode }),
      })

      const data = await response.json()

      if (response.ok) {
        if (options?.redirect === false) {
          updateAuthSession(data)
        } else {
          persistAuthSession(data)
        }
        return { success: true, message: data.message }
      } else {
        return { success: false, message: data.error }
      }
    } catch (error) {
      return {
        success: false,
        message: 'Registration failed, please try again',
      }
    }
  }

  const setupOTP = async () => {
    try {
      const result = await httpClient.post<{
        user_id: string
        email: string
        otp_secret: string
        qr_code_url: string
        message: string
      }>('/api/setup-otp')

      if (result.success && result.data?.otp_secret) {
        return {
          success: true,
          otpSecret: result.data.otp_secret,
          message: result.message || result.data.message,
        }
      }

      return {
        success: false,
        message: result.message || 'Failed to start two-factor setup',
      }
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to start two-factor setup',
      }
    }
  }

  const getAccountSecurity = async () => {
    try {
      const result = await httpClient.get<{
        email: string
        otp_enabled: boolean
      }>('/api/account/security')

      if (result.success && result.data) {
        return {
          success: true,
          email: result.data.email,
          otpEnabled: result.data.otp_enabled,
        }
      }

      return {
        success: false,
        message: result.message || 'Failed to load account security settings',
      }
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to load account security settings',
      }
    }
  }

  const resetPassword = async (
    email: string,
    newPassword: string,
    otpCode: string
  ) => {
    try {
      const response = await fetch(apiUrl('/api/reset-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          new_password: newPassword,
          otp_code: otpCode,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        return { success: true, message: data.message }
      } else {
        return { success: false, message: data.error }
      }
    } catch (error) {
      return {
        success: false,
        message: 'Password reset failed, please try again',
      }
    }
  }

  const logout = () => {
    const savedToken = localStorage.getItem('auth_token')
    if (savedToken) {
      fetch(apiUrl('/api/logout'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${savedToken}` },
      }).catch(() => {
        /* ignore network errors on logout */
      })
    }
    setUser(null)
    setToken(null)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        loginAdmin,
        register,
        verifyOTP,
        completeRegistration,
        setupOTP,
        getAccountSecurity,
        resetPassword,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
