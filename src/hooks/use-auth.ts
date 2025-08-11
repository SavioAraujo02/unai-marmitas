// src/hooks/use-auth.ts
'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '@/lib/supabase'
import { User, AuthState, LoginCredentials, RegisterData } from '@/types'

const AuthContext = createContext<{
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>
} | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}

export function useAuthProvider() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true
  })

  useEffect(() => {
    // Verificar se há usuário logado no localStorage
    checkAuthState()
  }, [])

  async function checkAuthState() {
    try {
      const savedUser = localStorage.getItem('unai-user')
      if (savedUser) {
        const user = JSON.parse(savedUser)
        setAuthState({
          user,
          isAuthenticated: true,
          loading: false
        })
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          loading: false
        })
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error)
      setAuthState({
        user: null,
        isAuthenticated: false,
        loading: false
      })
    }
  }

  async function login(credentials: LoginCredentials) {
    try {
      setAuthState(prev => ({ ...prev, loading: true }))

      // Simular login (em produção, usar Supabase Auth)
      if (credentials.email === 'admin@unaimarmitas.com' && credentials.password === 'admin123') {
        const user: User = {
          id: '1',
          email: credentials.email,
          nome: 'Administrador',
          role: 'admin',
          ativo: true,
          ultimo_acesso: new Date().toISOString(),
          created_at: new Date().toISOString()
        }

        localStorage.setItem('unai-user', JSON.stringify(user))
        setAuthState({
          user,
          isAuthenticated: true,
          loading: false
        })

        return { success: true }
      } else if (credentials.email === 'gerente@unaimarmitas.com' && credentials.password === 'gerente123') {
        const user: User = {
          id: '2',
          email: credentials.email,
          nome: 'Gerente',
          role: 'gerente',
          ativo: true,
          ultimo_acesso: new Date().toISOString(),
          created_at: new Date().toISOString()
        }

        localStorage.setItem('unai-user', JSON.stringify(user))
        setAuthState({
          user,
          isAuthenticated: true,
          loading: false
        })

        return { success: true }
      } else {
        setAuthState(prev => ({ ...prev, loading: false }))
        return { success: false, error: 'Email ou senha incorretos' }
      }
    } catch (error) {
      setAuthState(prev => ({ ...prev, loading: false }))
      return { success: false, error: 'Erro interno do servidor' }
    }
  }

  async function logout() {
    localStorage.removeItem('unai-user')
    setAuthState({
      user: null,
      isAuthenticated: false,
      loading: false
    })
  }

  async function register(data: RegisterData) {
    try {
      // Simular registro (em produção, usar Supabase Auth)
      const user: User = {
        id: Math.random().toString(),
        email: data.email,
        nome: data.nome,
        role: data.role,
        ativo: true,
        created_at: new Date().toISOString()
      }

      localStorage.setItem('unai-user', JSON.stringify(user))
      setAuthState({
        user,
        isAuthenticated: true,
        loading: false
      })

      return { success: true }
    } catch (error) {
      return { success: false, error: 'Erro ao criar usuário' }
    }
  }

  async function updateProfile(data: Partial<User>) {
    try {
      if (!authState.user) return { success: false, error: 'Usuário não logado' }

      const updatedUser = { ...authState.user, ...data }
      localStorage.setItem('unai-user', JSON.stringify(updatedUser))
      
      setAuthState(prev => ({
        ...prev,
        user: updatedUser
      }))

      return { success: true }
    } catch (error) {
      return { success: false, error: 'Erro ao atualizar perfil' }
    }
  }

  return {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    loading: authState.loading,
    login,
    logout,
    register,
    updateProfile
  }
}

export { AuthContext }