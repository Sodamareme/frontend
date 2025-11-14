// Utilitaires d'authentification
const TOKEN_KEY = 'accessToken'

export const authUtils = {
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(TOKEN_KEY)
  },

  setToken: (token: string): void => {
    if (typeof window === 'undefined') return
    localStorage.setItem(TOKEN_KEY, token)
    // Nettoyer les anciennes clés pour éviter la confusion
    localStorage.removeItem('authToken')
    localStorage.removeItem('token')
  },

  removeToken: (): void => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem('authToken')
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },

  isAuthenticated: (): boolean => {
    return !!authUtils.getToken()
  },

  logout: (): void => {
    authUtils.removeToken()
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }
}