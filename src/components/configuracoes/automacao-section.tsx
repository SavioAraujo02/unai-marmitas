// src/components/configuracoes/automacao-section.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface AutomacaoSectionProps {
  automacao: {
    fechar_automaticamente: boolean
    dia_fechamento: number
    enviar_relatorios_automatico: boolean
    reenviar_erros_automatico: boolean
    tempo_reenvio_horas: number
    notificar_email_erros: boolean
    enviar_lembrete_pagamento: boolean
    dias_lembrete: number
  }
  onSave: (automacao: any) => Promise<{ success: boolean }>
  saving: boolean
}

export function AutomacaoSection({ automacao, onSave, saving }: AutomacaoSectionProps) {
  const [formData, setFormData] = useState(automacao)

  async function handleSave() {
    const result = await onSave({ automacao: formData })
    if (result.success) {
      alert('Configurações de automação salvas com sucesso!')
    } else {
      alert('Erro ao salvar configurações!')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>🤖 Automação de Processos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Fechamento automático */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="fechar_automaticamente"
              checked={formData.fechar_automaticamente}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                fechar_automaticamente: e.target.checked 
              }))}
              className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
            />
            <label htmlFor="fechar_automaticamente" className="text-sm font-medium text-gray-700">
              Fechar automaticamente no final do mês
            </label>
          </div>
          
          {formData.fechar_automaticamente && (
            <div className="ml-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dia do fechamento
              </label>
              <Input
                                type="number"
                min="1"
                max="31"
                value={formData.dia_fechamento}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  dia_fechamento: parseInt(e.target.value) || 30 
                }))}
                className="w-20"
              />
              <p className="text-xs text-gray-500 mt-1">
                Dia do mês para fechamento automático
              </p>
            </div>
          )}
        </div>

        {/* Envio automático de relatórios */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="enviar_relatorios_automatico"
            checked={formData.enviar_relatorios_automatico}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              enviar_relatorios_automatico: e.target.checked 
            }))}
            className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
          />
          <label htmlFor="enviar_relatorios_automatico" className="text-sm font-medium text-gray-700">
            Enviar relatórios automaticamente após fechamento
          </label>
        </div>

        {/* Reenvio automático de erros */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="reenviar_erros_automatico"
              checked={formData.reenviar_erros_automatico}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                reenviar_erros_automatico: e.target.checked 
              }))}
              className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
            />
            <label htmlFor="reenviar_erros_automatico" className="text-sm font-medium text-gray-700">
              Reenviar documentos com erro automaticamente
            </label>
          </div>
          
          {formData.reenviar_erros_automatico && (
            <div className="ml-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tempo entre tentativas (horas)
              </label>
              <Input
                type="number"
                min="1"
                max="24"
                value={formData.tempo_reenvio_horas}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  tempo_reenvio_horas: parseInt(e.target.value) || 2 
                }))}
                className="w-20"
              />
            </div>
          )}
        </div>

        {/* Notificações por email */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="notificar_email_erros"
            checked={formData.notificar_email_erros}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              notificar_email_erros: e.target.checked 
            }))}
            className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
          />
          <label htmlFor="notificar_email_erros" className="text-sm font-medium text-gray-700">
            Notificar por email quando houver erros
          </label>
        </div>

        {/* Lembrete de pagamento */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="enviar_lembrete_pagamento"
              checked={formData.enviar_lembrete_pagamento}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                enviar_lembrete_pagamento: e.target.checked 
              }))}
              className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
            />
            <label htmlFor="enviar_lembrete_pagamento" className="text-sm font-medium text-gray-700">
              Enviar lembrete de pagamento
            </label>
          </div>
          
          {formData.enviar_lembrete_pagamento && (
            <div className="ml-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dias após vencimento
              </label>
              <Input
                type="number"
                min="1"
                max="30"
                value={formData.dias_lembrete}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  dias_lembrete: parseInt(e.target.value) || 5 
                }))}
                className="w-20"
              />
            </div>
          )}
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? 'Salvando...' : 'Salvar Configurações de Automação'}
        </Button>
      </CardContent>
    </Card>
  )
}