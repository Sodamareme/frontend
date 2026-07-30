// Utilitaires d'authentification
const TOKEN_KEY = 'accessToken'
const USER_KEY = 'user'

const canUseStorage = () => typeof window !== 'undefined'

const getStorageValue = (key: string): string | null => {
  if (!canUseStorage()) return null
  return sessionStorage.getItem(key) ?? localStorage.getItem(key)
}

export const authUtils = {
  getToken: (): string | null => {
    if (!canUseStorage()) return null

    const token =
      sessionStorage.getItem(TOKEN_KEY) ||
      sessionStorage.getItem('authToken') ||
      sessionStorage.getItem('token') ||
      localStorage.getItem(TOKEN_KEY) ||
      localStorage.getItem('authToken') ||
      localStorage.getItem('token')

    if (token && !sessionStorage.getItem(TOKEN_KEY)) {
      sessionStorage.setItem(TOKEN_KEY, token)
    }

    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem('authToken')
    localStorage.removeItem('token')

    return token
  },

  setToken: (token: string): void => {
    if (!canUseStorage()) return
    sessionStorage.setItem(TOKEN_KEY, token)
    localStorage.removeItem('authToken')
    localStorage.removeItem('token')
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem('authToken')
    sessionStorage.removeItem('token')
  },

  removeToken: (): void => {
    if (!canUseStorage()) return
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem('authToken')
    sessionStorage.removeItem('token')
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem('authToken')
    localStorage.removeItem('token')
    sessionStorage.removeItem(USER_KEY)
    localStorage.removeItem(USER_KEY)
  },

  getUser: <T = unknown>(): T | null => {
    const user = getStorageValue(USER_KEY)
    if (!user) return null

    try {
      if (localStorage.getItem(USER_KEY) && !sessionStorage.getItem(USER_KEY)) {
        sessionStorage.setItem(USER_KEY, user)
        localStorage.removeItem(USER_KEY)
      }

      return JSON.parse(user) as T
    } catch {
      authUtils.removeToken()
      return null
    }
  },

  setUser: (user: unknown): void => {
    if (!canUseStorage()) return
    sessionStorage.setItem(USER_KEY, JSON.stringify(user))
    localStorage.removeItem(USER_KEY)
  },

  isAuthenticated: (): boolean => {
    return !!authUtils.getToken()
  },

  logout: (): void => {
    authUtils.removeToken()
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }
}
