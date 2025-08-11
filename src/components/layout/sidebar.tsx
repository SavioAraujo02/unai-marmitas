// src/components/layout/sidebar.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Building2, 
  ClipboardList, 
  FileText, 
  Send, 
  BarChart3,
  Settings,
  Menu,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Empresas', href: '/empresas', icon: Building2 },
  { name: 'Consumos', href: '/consumos', icon: ClipboardList },
  { name: 'Fechamentos', href: '/fechamentos', icon: FileText },
  { name: 'Envios', href: '/envios', icon: Send },
  { name: 'Relatórios', href: '/relatorios', icon: BarChart3 },
  { name: 'Configurações', href: '/configuracoes', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <>
      {/* Botão mobile */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden bg-white shadow-md"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay mobile */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "w-64 bg-gradient-to-b from-yellow-50 to-yellow-100 shadow-lg border-r border-yellow-200 flex flex-col h-full transition-transform duration-300 ease-in-out",
        "md:translate-x-0", // Desktop sempre visível
        isMobileOpen ? "translate-x-0" : "-translate-x-full", // Mobile toggle
        "fixed md:relative z-50 md:z-auto"
      )}>
        <div className="p-6 pt-16 md:pt-6">
          <div className="flex items-center space-x-2">
            <div className="text-3xl">🍱</div>
            <div>
              <h1 className="text-xl font-bold text-yellow-900">Unaí Marmitas</h1>
              <p className="text-xs text-yellow-700">Sistema de Gestão</p>
            </div>
          </div>
        </div>
        
        <nav className="mt-6 flex-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileOpen(false)} // Fechar menu mobile ao clicar
                className={cn(
                  'flex items-center px-6 py-3 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-yellow-500 text-white border-r-4 border-yellow-600 shadow-md'
                    : 'text-yellow-800 hover:bg-yellow-200 hover:text-yellow-900'
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>
        
        {/* Footer da sidebar */}
        <div className="p-4 mt-auto">
          <div className="bg-green-100 border border-green-300 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-xs text-green-800 font-medium">
                Sistema Online
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}