import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { User, AuthConfig, LoginCredentials, RegisterCredentials } from '@/types'
import * as api from '@/lib/api'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  authConfig: AuthConfig | null
  login: (credentials: LoginCredentials) => Promise<void>
  register: (credentials: RegisterCredentials) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authConfig, setAuthConfig] = useState<AuthConfig | null>(null)

  const fetchAuthConfig = useCallback(async () => {
    try {
      const config = await api.getAuthConfig()
      setAuthConfig(config)
    } catch (error) {
      console.error('Failed to fetch auth config:', error)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const userData = await api.getCurrentUser()
      setUser(userData)
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true)
      await fetchAuthConfig()
      await refreshUser()
      setIsLoading(false)
    }
    initAuth()
  }, [fetchAuthConfig, refreshUser])

  const login = useCallback(async (credentials: LoginCredentials) => {
    const userData = await api.login(credentials)
    setUser(userData)
  }, [])

  const register = useCallback(async (credentials: RegisterCredentials) => {
    const userData = await api.register(credentials)
    setUser(userData)
  }, [])

  const logout = useCallback(async () => {
    await api.logout()
    setUser(null)
  }, [])

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    authConfig,
    login,
    register,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
