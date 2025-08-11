// src/components/configuracoes/integracao-section.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff, TestTube } from 'lucide-react'

interface IntegracaoSectionProps {
  integracao: {
    email_smtp_host: string
    email_smtp_port: number
    email_usuario: string
    email_senha: string
    whatsapp_token: string
    whatsapp_numero: string
    banco_pix_chave: string
    banco_agencia: string
    banco_conta: string
  }
  onSave: (integracao: any) => Promise<{ success: boolean }>
  onTest: (tipo: 'email' | 'whatsapp' | 'sms') => Promise<{ success: boolean; message: string }>
  saving: boolean
}

export function IntegracaoSection({ integracao, onSave, onTest, saving }: IntegracaoSectionProps) {
  const [formData, setFormData] = useState(integracao)
  const [showPasswords, setShowPasswords] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)

  async function handleSave() {
    const result = await onSave({ integracao: formData })
    if (result.success) {
      alert('Configurações de integração salvas com sucesso!')
    } else {
      alert('Erro ao salvar configurações!')
    }
  }

  async function handleTest(tipo: 'email' | 'whatsapp' | 'sms') {
    setTesting(tipo)
    const result = await onTest(tipo)
    alert(result.message)
    setTesting(null)
  }

  return (
    <div className="space-y-6">
      {/* Configurações de Email */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>📧 Configurações de Email</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTest('email')}
              disabled={testing === 'email'}
            >
              <TestTube className="h-4 w-4 mr-2" />
              {testing === 'email' ? 'Testando...' : 'Testar'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Servidor SMTP
              </label>
              <Input
                value={formData.email_smtp_host}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  email_smtp_host: e.target.value 
                }))}
                placeholder="smtp.gmail.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Porta SMTP
              </label>
              <Input
                type="number"
                value={formData.email_smtp_port}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  email_smtp_port: parseInt(e.target.value) || 587 
                }))}
                placeholder="587"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuário/Email
              </label>
              <Input
                type="email"
                value={formData.email_usuario}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  email_usuario: e.target.value 
                }))}
                placeholder="seu-email@gmail.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <Input
                  type={showPasswords ? "text" : "password"}
                  value={formData.email_senha}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    email_senha: e.target.value 
                  }))}
                  placeholder="sua-senha"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPasswords(!showPasswords)}
                >
                  {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações do WhatsApp */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>📱 WhatsApp Business</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTest('whatsapp')}
              disabled={testing === 'whatsapp'}
            >
              <TestTube className="h-4 w-4 mr-2" />
              {testing === 'whatsapp' ? 'Testando...' : 'Testar'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token da API
              </label>
              <Input
                type={showPasswords ? "text" : "password"}
                value={formData.whatsapp_token}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  whatsapp_token: e.target.value 
                }))}
                placeholder="Token do WhatsApp Business API"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número do WhatsApp
              </label>
              <Input
                value={formData.whatsapp_numero}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  whatsapp_numero: e.target.value 
                }))}
                placeholder="5534999999999"
              />
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              💡 <strong>Dica:</strong> Para usar o WhatsApp Business API, você precisa de uma conta verificada e aprovada pelo Meta.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Configurações Bancárias */}
      <Card>
        <CardHeader>
          <CardTitle>🏦 Informações Bancárias</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chave PIX
              </label>
              <Input
                value={formData.banco_pix_chave}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  banco_pix_chave: e.target.value 
                }))}
                placeholder="seu-email@gmail.com ou CPF/CNPJ"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agência
              </label>
              <Input
                value={formData.banco_agencia}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  banco_agencia: e.target.value 
                }))}
                placeholder="1234"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conta
              </label>
              <Input
                value={formData.banco_conta}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  banco_conta: e.target.value 
                }))}
                placeholder="12345-6"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? 'Salvando...' : 'Salvar Todas as Integrações'}
      </Button>
    </div>
  )
}