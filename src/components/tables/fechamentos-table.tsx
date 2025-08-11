// src/components/tables/fechamentos-table.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Fechamento } from '@/types'
import { formatCurrency, getStatusColor } from '@/lib/utils'
import { Edit, Trash2, FileText, Send, CreditCard, Eye } from 'lucide-react'

interface FechamentosTableProps {
  fechamentos: Fechamento[]
  onEdit: (fechamento: Fechamento) => void
  onDelete: (id: number) => void
  onView: (fechamento: Fechamento) => void
  onGerarRelatorio: (fechamento: Fechamento) => void
  onEnviarCobranca: (fechamento: Fechamento) => void
  onMarcarPago: (fechamento: Fechamento) => void
}

export function FechamentosTable({ 
  fechamentos, 
  onEdit, 
  onDelete, 
  onView,
  onGerarRelatorio,
  onEnviarCobranca,
  onMarcarPago
}: FechamentosTableProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  function handleDelete(id: number) {
    if (deleteConfirm === id) {
      onDelete(id)
      setDeleteConfirm(null)
    } else {
      setDeleteConfirm(id)
      setTimeout(() => setDeleteConfirm(null), 3000)
    }
  }

  function getFormaPagamentoIcon(forma: string) {
    switch (forma) {
      case 'boleto': return '📄'
      case 'pix': return '💳'
      case 'transferencia': return '🏦'
      default: return '💰'
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
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${
            isError ? 'bg-red-500' : 'bg-green-500'
          }`}
          style={{ width: `${(statusInfo.etapa / 6) * 100}%` }}
        />
      </div>
    )
  }

  if (fechamentos.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-gray-500">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-lg font-medium">Nenhum fechamento encontrado</p>
            <p className="text-sm">Gere os fechamentos automáticos para este mês</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-yellow-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Empresa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Marmitas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Valor Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {fechamentos.map((fechamento) => (
                <tr key={fechamento.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {fechamento.empresa?.nome || 'Empresa não encontrada'}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        {getFormaPagamentoIcon(fechamento.empresa?.forma_pagamento || '')}
                        <span className="ml-1 capitalize">
                          {fechamento.empresa?.forma_pagamento || 'Não definido'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="flex space-x-4">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          P: {fechamento.total_p}
                        </span>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                          M: {fechamento.total_m}
                        </span>
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
                          G: {fechamento.total_g}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Total: {fechamento.total_p + fechamento.total_m + fechamento.total_g} marmitas
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-green-600">
                      {formatCurrency(fechamento.valor_total)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Média: {formatCurrency(fechamento.valor_total / (fechamento.total_p + fechamento.total_m + fechamento.total_g) || 0)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-2">
                      <ProgressBar status={fechamento.status} />
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusInfo(fechamento.status).color}`}>
                        {getStatusInfo(fechamento.status).icon} {getStatusInfo(fechamento.status).label}
                      </span>
                      {fechamento.data_fechamento && (
                        <div className="text-xs text-gray-500">
                          {new Date(fechamento.data_fechamento).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                      {fechamento.ultimo_erro && (
                        <div className="text-xs text-red-600 bg-red-50 p-1 rounded">
                          {fechamento.ultimo_erro}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-wrap gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(fechamento)}
                        title="Ver detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(fechamento)}
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      {/* Botões específicos por etapa */}
                      {(fechamento.status === 'pendente' || fechamento.status === 'erro_relatorio') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onGerarRelatorio(fechamento)}
                          title="Enviar Relatório"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {(fechamento.status === 'relatorio_enviado' || fechamento.status === 'erro_nf') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEnviarCobranca(fechamento)}
                          title="Enviar Nota Fiscal"
                          className="text-yellow-600 hover:text-yellow-800"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {(fechamento.status === 'nf_enviada' || fechamento.status === 'erro_pagamento') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onMarcarPago(fechamento)}
                          title="Confirmar Pagamento"
                          className="text-green-600 hover:text-green-800"
                        >
                          <CreditCard className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(fechamento.id)}
                        className={deleteConfirm === fechamento.id ? 'text-red-600 bg-red-50' : ''}
                        title={deleteConfirm === fechamento.id ? 'Clique novamente para confirmar' : 'Excluir'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}