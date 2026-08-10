import { jwtDecode } from 'jwt-decode'

// Utilitaires d'authentification
const TOKEN_KEY = 'accessToken'
const AUTH_KEYS = [TOKEN_KEY, 'authToken', 'token'] as const

export const SESSION_EXPIRED_EVENT = 'auth:session-expired'

type JwtPayload = {
  exp?: number
}

const hasWindow = () => typeof window !== 'undefined'
const hasJwtShape = (token: string) => token.split('.').length === 3

const dispatchSessionExpired = () => {
  if (!hasWindow()) return
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT))
}

const clearStoredSession = () => {
  if (!hasWindow()) return

  AUTH_KEYS.forEach((key) => {
    localStorage.removeItem(key)
  })
  localStorage.removeItem('user')
}

const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true

  if (!hasJwtShape(token)) {
    return false
  }

  try {
    const decoded = jwtDecode<JwtPayload>(token)
    if (!decoded.exp) {
      return false
    }

    return decoded.exp * 1000 <= Date.now()
  } catch {
    return true
  }
}

const getValidToken = (): string | null => {
  if (!hasWindow()) return null

  const token = localStorage.getItem(TOKEN_KEY) || localStorage.getItem('authToken') || localStorage.getItem('token')
  if (!token) {
    return null
  }

  if (isTokenExpired(token)) {
    clearStoredSession()
    dispatchSessionExpired()
    return null
  }

  return token
}

export const authUtils = {
  getToken: (): string | null => {
    if (!hasWindow()) return null
    return localStorage.getItem(TOKEN_KEY) || localStorage.getItem('authToken') || localStorage.getItem('token')
  },

  getValidToken,

  isTokenExpired,

  setToken: (token: string): void => {
    if (!hasWindow()) return
    localStorage.setItem(TOKEN_KEY, token)
    // Nettoyer les anciennes clés pour éviter la confusion
    localStorage.removeItem('authToken')
    localStorage.removeItem('token')
  },

  removeToken: (): void => {
    clearStoredSession()
  },

  clearSession: (): void => {
    clearStoredSession()
  },

  expireSession: (): void => {
    clearStoredSession()
    dispatchSessionExpired()
  },

  isAuthenticated: (): boolean => {
    return !!getValidToken()
  },

  logout: (): void => {
    clearStoredSession()
    if (hasWindow()) {
      window.location.href = '/'
    }
  }
}
