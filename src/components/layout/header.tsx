// src/components/layout/header.tsx
'use client'

import { LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlobalSearch } from '@/components/search/global-search'
import { NotificationCenter } from '@/components/notifications/notification-center'
import { useAuth } from '@/hooks/use-auth'

export function Header() {
  const { user, logout } = useAuth()

  async function handleLogout() {
    if (confirm('Deseja realmente sair do sistema?')) {
      await logout()
    }
  }

  return (
    <header className="bg-white shadow-sm border-b border-yellow-200">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Sistema de Gestão
          </h2>
          <p className="text-sm text-gray-700">
            {new Date().toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        
        {/* Busca Global */}
        <div className="flex-1 max-w-md mx-8">
          <GlobalSearch />
        </div>
        
        <div className="flex items-center space-x-4">
          <NotificationCenter />
          
          {/* Informações do usuário */}
          <div className="flex items-center space-x-2">
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium text-gray-900">{user?.nome}</p>
              <p className="text-xs text-gray-600 capitalize">
                {user?.role === 'admin' ? '👑 Administrador' : 
                 user?.role === 'gerente' ? '👨‍💼 Gerente' : '👤 Operador'}
              </p>
            </div>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleLogout}
              title="Sair do sistema"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}