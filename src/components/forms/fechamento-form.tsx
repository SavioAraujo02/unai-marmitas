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
    ultimo_erro: fechamento.ultimo_erro || '',
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
      
      // Enviar apenas os campos que existem na tabela atual
      const updates: Partial<Fechamento> = {
        status: formData.status,
        observacoes: formData.observacoes,
        total_p: formData.total_p,
        total_m: formData.total_m,
        total_g: formData.total_g,
        valor_total: formData.valor_total
      }
  
      // Adicionar campos novos apenas se não estiverem vazios
      if (formData.ultimo_erro) {
        updates.ultimo_erro = formData.ultimo_erro
      }
  
      const result = await onSubmit(updates)
      
      if (result.success) {
        alert('Fechamento atualizado com sucesso!')
        onCancel()
      } else {
        alert('Erro ao atualizar fechamento!')
      }
    } catch (error) {
      console.error('Erro no formulário:', error)
      alert('Erro ao atualizar fechamento!')
    } finally {
      setLoading(false)
    }
  }

  function getStatusInfo(status: string) {
    switch (status) {
      case 'pendente':
        return { color: 'bg-gray-100 text-gray-800', icon: '⏳', label: 'Pendente', etapa: 1 }
      case 'relatorio_enviado':
        return { color: 'bg-blue-100 text-blue-800', icon: '📊', label: 'Relatório Enviado', etapa: 2 }
      case 'nf_pendente':
        return { color: 'bg-yellow-100 text-yellow-800', icon: '📄', label: 'NF Pendente', etapa: 3 }
      case 'nf_enviada':
        return { color: 'bg-purple-100 text-purple-800', icon: '📋', label: 'NF Enviada', etapa: 4 }
      case 'pagamento_pendente':
        return { color: 'bg-orange-100 text-orange-800', icon: '💰', label: 'Aguardando Pagamento', etapa: 5 }
      case 'concluido':
        return { color: 'bg-green-100 text-green-800', icon: '✅', label: 'Concluído', etapa: 6 }
      case 'erro_relatorio':
        return { color: 'bg-red-100 text-red-800', icon: '❌', label: 'Erro no Relatório', etapa: 1 }
      case 'erro_nf':
        return { color: 'bg-red-100 text-red-800', icon: '❌', label: 'Erro na NF', etapa: 3 }
      case 'erro_pagamento':
        return { color: 'bg-red-100 text-red-800', icon: '❌', label: 'Erro no Pagamento', etapa: 5 }
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: '❓', label: 'Desconhecido', etapa: 0 }
    }
  }

  function ProgressBar({ status }: { status: string }) {
    const statusInfo = getStatusInfo(status)
    const isError = status.includes('erro')
    
    return (
      <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
        <div 
          className={`h-3 rounded-full transition-all duration-300 ${
            isError ? 'bg-red-500' : 'bg-green-500'
          }`}
          style={{ width: `${(statusInfo.etapa / 6) * 100}%` }}
        />
      </div>
    )
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
          {/* Status e Progresso */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Status e Progresso</h3>
            <div className="space-y-4">
              <ProgressBar status={formData.status} />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status Atual
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    status: e.target.value as any
                  }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                >
                  <optgroup label="📋 Etapas Normais">
                    <option value="pendente">⏳ Pendente</option>
                    <option value="relatorio_enviado">📊 Relatório Enviado</option>
                    <option value="nf_pendente">📄 NF Pendente</option>
                    <option value="nf_enviada">📋 NF Enviada</option>
                    <option value="pagamento_pendente">💰 Aguardando Pagamento</option>
                    <option value="concluido">✅ Concluído</option>
                  </optgroup>
                  <optgroup label="❌ Status de Erro">
                    <option value="erro_relatorio">❌ Erro no Relatório</option>
                    <option value="erro_nf">❌ Erro na NF</option>
                    <option value="erro_pagamento">❌ Erro no Pagamento</option>
                  </optgroup>
                </select>
              </div>

              {/* Campo de erro (só aparece se status for de erro) */}
              {formData.status.includes('erro') && (
                <div>
                  <label className="block text-sm font-medium text-red-700 mb-2">
                    Descrição do Erro
                  </label>
                  <Input
                    value={formData.ultimo_erro}
                    onChange={(e) => setFormData(prev => ({ ...prev, ultimo_erro: e.target.value }))}
                    placeholder="Descreva o erro encontrado..."
                    className="border-red-300 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              )}

              {/* Status visual atual */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusInfo(formData.status).color}`}>
                  {getStatusInfo(formData.status).icon} {getStatusInfo(formData.status).label}
                </span>
              </div>
            </div>
          </div>

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
                <p>Etapa: <strong>{getStatusInfo(formData.status).etapa}/6</strong></p>
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