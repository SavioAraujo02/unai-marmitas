// src/components/tables/empresas-table.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Empresa } from '@/types'
import { Edit, Trash2, Eye, ToggleLeft, ToggleRight } from 'lucide-react'

interface EmpresasTableProps {
  empresas: Empresa[]
  onEdit: (empresa: Empresa) => void
  onDelete: (id: number) => void
  onToggleStatus: (id: number) => void
  onView: (empresa: Empresa) => void
}

export function EmpresasTable({ 
  empresas, 
  onEdit, 
  onDelete, 
  onToggleStatus, 
  onView 
}: EmpresasTableProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  function handleDelete(id: number) {
    if (deleteConfirm === id) {
      onDelete(id)
      setDeleteConfirm(null)
    } else {
      setDeleteConfirm(id)
      // Reset após 3 segundos
      setTimeout(() => setDeleteConfirm(null), 3000)
    }
  }

  function getStatusBadge(ativo: boolean) {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        ativo 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {ativo ? '🟢 Ativa' : '🔴 Inativa'}
      </span>
    )
  }

  function getPaymentBadge(forma: string) {
    const colors = {
      boleto: 'bg-blue-100 text-blue-800',
      pix: 'bg-green-100 text-green-800',
      transferencia: 'bg-purple-100 text-purple-800'
    }
    
    const icons = {
      boleto: '📄',
      pix: '💳',
      transferencia: '🏦'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[forma as keyof typeof colors]}`}>
        {icons[forma as keyof typeof icons]} {forma.charAt(0).toUpperCase() + forma.slice(1)}
      </span>
    )
  }

  if (empresas.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">Nenhuma empresa encontrada</p>
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
                  Empresa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase                   tracking-wider">
                  Responsável
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Pagamento
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
              {empresas.map((empresa) => (
                <tr key={empresa.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {empresa.nome}
                      </div>
                      {empresa.cnpj && (
                        <div className="text-sm text-gray-500">
                          CNPJ: {empresa.cnpj}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{empresa.responsavel}</div>
                    {empresa.email && (
                      <div className="text-sm text-gray-500">{empresa.email}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {empresa.contato || 'Não informado'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getPaymentBadge(empresa.forma_pagamento)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(empresa.ativo)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(empresa)}
                        title="Ver detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(empresa)}
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleStatus(empresa.id)}
                        title={empresa.ativo ? 'Desativar' : 'Ativar'}
                      >
                        {empresa.ativo ? (
                          <ToggleRight className="h-4 w-4 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(empresa.id)}
                        className={deleteConfirm === empresa.id ? 'text-red-600 bg-red-50' : ''}
                        title={deleteConfirm === empresa.id ? 'Clique novamente para confirmar' : 'Excluir'}
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