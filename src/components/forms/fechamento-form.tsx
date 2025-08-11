// src/components/forms/fechamento-form.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Fechamento } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface FechamentoFormProps {
  fechamento: Fechamento
  onSubmit: (updates: Partial<Fechamento>) => Promise<{ success: boolean }>
  onCancel: () => void
}

export function FechamentoForm({ fechamento, onSubmit, onCancel }: FechamentoFormProps) {
  const [formData, setFormData] = useState({
    status: fechamento.status,
    observacoes: fechamento.observacoes || '',
    total_p: fechamento.total_p,
    total_m: fechamento.total_m,
    total_g: fechamento.total_g,
    valor_total: fechamento.valor_total
  })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      setLoading(true)
      const result = await onSubmit(formData)
      
      if (result.success) {
        alert('Fechamento atualizado com sucesso!')
        onCancel()
      } else {
        alert('Erro ao atualizar fechamento!')
      }
    } catch (error) {
      alert('Erro ao atualizar fechamento!')
    } finally {
      setLoading(false)
    }
  }

  // Recalcular valor total quando quantidades mudarem
  const valorCalculado = (formData.total_p * 15) + (formData.total_m * 18) + (formData.total_g * 22)

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>✏️ Editar Fechamento - {fechamento.empresa?.nome}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Quantidades */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quantidades de Marmitas</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pequena (P) - R$ 15,00
                </label>
                <Input
                  type="number"
                  value={formData.total_p}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    total_p: parseInt(e.target.value) || 0 
                  }))}
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Média (M) - R$ 18,00
                </label>
                <Input
                  type="number"
                  value={formData.total_m}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    total_m: parseInt(e.target.value) || 0 
                  }))}
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grande (G) - R$ 22,00
                </label>
                <Input
                  type="number"
                  value={formData.total_g}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    total_g: parseInt(e.target.value) || 0 
                  }))}
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Valor Total */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor Total
            </label>
            <div className="flex space-x-4">
              <Input
                type="number"
                step="0.01"
                value={formData.valor_total}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  valor_total: parseFloat(e.target.value) || 0 
                }))}
                min="0"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormData(prev => ({ ...prev, valor_total: valorCalculado }))}
              >
                Recalcular ({formatCurrency(valorCalculado)})
              </Button>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                status: e.target.value as 'pendente' | 'enviado' | 'pago' | 'erro'
              }))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            >
              <option value="pendente">🟡 Pendente</option>
              <option value="enviado">🔵 Enviado</option>
              <option value="pago">🟢 Pago</option>
              <option value="erro">🔴 Erro</option>
            </select>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              placeholder="Observações sobre este fechamento..."
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              rows={4}
            />
          </div>

          {/* Resumo */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h4 className="font-medium text-yellow-800 mb-2">📊 Resumo:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p>Total de Marmitas: <strong>{formData.total_p + formData.total_m + formData.total_g}</strong></p>
                <p>Valor Calculado: <strong>{formatCurrency(valorCalculado)}</strong></p>
              </div>
              <div>
                <p>Valor Final: <strong>{formatCurrency(formData.valor_total)}</strong></p>
                <p>Status: <strong>{formData.status}</strong></p>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex space-x-4 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}