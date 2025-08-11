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
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(fechamento.status)}`}>
                      {fechamento.status === 'pendente' && '🟡 Pendente'}
                      {fechamento.status === 'enviado' && '🔵 Enviado'}
                      {fechamento.status === 'pago' && '🟢 Pago'}
                      {fechamento.status === 'erro' && '🔴 Erro'}
                    </span>
                    {fechamento.data_fechamento && (
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(fechamento.data_fechamento).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-1">
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onGerarRelatorio(fechamento)}
                        title="Gerar relatório"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      {fechamento.status === 'pendente' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEnviarCobranca(fechamento)}
                          title="Enviar cobrança"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                      {fechamento.status === 'enviado' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onMarcarPago(fechamento)}
                          title="Marcar como pago"
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