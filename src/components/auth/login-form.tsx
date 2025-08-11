// src/components/auth/login-form.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { Eye, EyeOff, LogIn } from 'lucide-react'

export function LoginForm() {
  const router = useRouter()
  const { login, loading } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!formData.email || !formData.password) {
      setError('Preencha todos os campos')
      return
    }

    const result = await login(formData)
    
    if (result.success) {
      router.push('/')
    } else {
      setError(result.error || 'Erro ao fazer login')
    }
  }

  function fillDemoCredentials(type: 'admin' | 'gerente') {
    if (type === 'admin') {
      setFormData({
        email: 'admin@unaimarmitas.com',
        password: 'admin123'
      })
    } else {
      setFormData({
        email: 'gerente@unaimarmitas.com',
        password: 'gerente123'
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-yellow-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-6xl mb-4">🍱</div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Unaí Marmitas
          </CardTitle>
          <p className="text-gray-600">Sistema de Gestão</p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Sua senha"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                'Entrando...'
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Entrar
                </>
              )}
            </Button>
          </form>

          {/* Credenciais de demonstração */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3 text-center">
              Credenciais de demonstração:
            </p>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fillDemoCredentials('admin')}
                className="w-full text-xs"
              >
                👑 Admin: admin@unaimarmitas.com / admin123
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fillDemoCredentials('gerente')}
                className="w-full text-xs"
              >
                👨‍💼 Gerente: gerente@unaimarmitas.com / gerente123
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}