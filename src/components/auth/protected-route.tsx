// src/components/auth/protected-route.tsx
'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { LoginForm } from './login-form'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: 'admin' | 'gerente' | 'operador'
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-4">🍱</div>
          <p className="text-lg text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginForm />
  }

  // Verificar permissões por role
  if (requiredRole && user?.role !== 'admin') {
    const roleHierarchy = { admin: 3, gerente: 2, operador: 1 }
    const userLevel = roleHierarchy[user?.role || 'operador']
    const requiredLevel = roleHierarchy[requiredRole]

    if (userLevel < requiredLevel) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="text-4xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
            <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}