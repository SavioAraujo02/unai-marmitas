// src/components/tables/consumos-table.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Consumo } from '@/types'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Trash2, Edit, Eye } from 'lucide-react'

interface ConsumosTableProps {
  consumos: Consumo[]
  onDelete: (id: number) => void
  onEdit?: (consumo: Consumo) => void
}

export function ConsumosTable({ consumos, onDelete, onEdit }: ConsumosTableProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [expandedRow, setExpandedRow] = useState<number | null>(null)

  function handleDelete(id: number) {
    if (deleteConfirm === id) {
      onDelete(id)
      setDeleteConfirm(null)
    } else {
      setDeleteConfirm(id)
      setTimeout(() => setDeleteConfirm(null), 3000)
    }
  }

  function getTamanhoColor(tamanho: string) {
    switch (tamanho) {
      case 'P': return 'bg-blue-100 text-blue-800'
      case 'M': return 'bg-green-100 text-green-800'
      case 'G': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (consumos.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-gray-500">
            <div className="text-4xl mb-4">🍽️</div>
            <p className="text-lg font-medium">Nenhum consumo registrado</p>
            <p className="text-sm">Registre o primeiro consumo do dia!</p>
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
          <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Horário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Empresa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Pedido
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Valor Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
            {consumos.map((consumo) => [
              <tr key={consumo.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatDateTime(consumo.created_at).split(' ')[1]}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDateTime(consumo.created_at).split(' ')[0]}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {consumo.empresa?.nome || 'Empresa não encontrada'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {consumo.responsavel || consumo.empresa?.responsavel || 'Não informado'}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTamanhoColor(consumo.tamanho)}`}>
                      {consumo.quantidade}x {consumo.tamanho}
                    </span>
                    {consumo.itens_extras && consumo.itens_extras.length > 0 && (
                      <span className="text-xs text-blue-600 cursor-pointer hover:underline"
                            onClick={() => setExpandedRow(expandedRow === consumo.id ? null : consumo.id)}>
                        +{consumo.itens_extras.length} extra{consumo.itens_extras.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  {consumo.observacoes && (
                    <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                      💬 {consumo.observacoes}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-green-600">
                    {formatCurrency(consumo.preco)}
                  </div>
                  {(consumo.valor_extras && consumo.valor_extras > 0) && (
                    <div className="text-xs text-gray-500">
                      Extras: {formatCurrency(consumo.valor_extras)}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedRow(expandedRow === consumo.id ? null : consumo.id)}
                      title="Ver detalhes"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(consumo)}
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(consumo.id)}
                      className={deleteConfirm === consumo.id ? 'text-red-600 bg-red-50' : ''}
                      title={deleteConfirm === consumo.id ? 'Clique novamente para confirmar' : 'Excluir'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>,
              
              // Linha expandida com detalhes
              expandedRow === consumo.id && (
                <tr key={`expanded-${consumo.id}`} className="bg-blue-50">
                  <td colSpan={5} className="px-6 py-4">
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">📋 Detalhes do Pedido:</h4>
                      
                      {/* Marmitas */}
                      <div className="bg-white p-3 rounded-md">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">
                            {consumo.quantidade}x Marmita {consumo.tamanho}
                          </span>
                          <span className="text-green-600 font-medium">
                            {formatCurrency((consumo.preco - (consumo.valor_extras || 0)))}
                          </span>
                        </div>
                      </div>

                      {/* Itens extras */}
                      {consumo.itens_extras && consumo.itens_extras.length > 0 && (
                        <div className="bg-white p-3 rounded-md">
                          <h5 className="font-medium text-gray-700 mb-2">Itens Extras:</h5>
                          <div className="space-y-1">
                            {consumo.itens_extras.map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>{item.quantidade}x {item.nome}</span>
                                <span className="text-green-600">
                                  {formatCurrency(item.preco * item.quantidade)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Observações */}
                      {consumo.observacoes && (
                        <div className="bg-white p-3 rounded-md">
                          <h5 className="font-medium text-gray-700 mb-1">Observações:</h5>
                          <p className="text-sm text-gray-600">{consumo.observacoes}</p>
                        </div>
                      )}

                      {/* Total */}
                      <div className="bg-white p-3 rounded-md border-2 border-green-200">
                        <div className="flex justify-between items-center font-bold">
                          <span>Total do Pedido:</span>
                          <span className="text-green-600 text-lg">
                            {formatCurrency(consumo.preco)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )
            ].filter(Boolean))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}