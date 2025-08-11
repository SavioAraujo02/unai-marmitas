// src/app/empresas/page.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmpresasTable } from '@/components/tables/empresas-table'
import { EmpresaForm } from '@/components/forms/empresa-form'
import { useEmpresas } from '@/hooks/use-empresas'
import { Empresa } from '@/types'
import { Plus, Search, Building2, Users, TrendingUp } from 'lucide-react'

type ViewMode = 'list' | 'create' | 'edit' | 'view'

export default function EmpresasPage() {
  const {
    empresas,
    loading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    createEmpresa,
    updateEmpresa,
    deleteEmpresa,
    toggleStatus
  } = useEmpresas()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null)

  // Estatísticas
  const stats = {
    total: empresas.length,
    ativas: empresas.filter(e => e.ativo).length,
    inativas: empresas.filter(e => !e.ativo).length
  }

  function handleCreate() {
    setSelectedEmpresa(null)
    setViewMode('create')
  }

  function handleEdit(empresa: Empresa) {
    setSelectedEmpresa(empresa)
    setViewMode('edit')
  }

  function handleView(empresa: Empresa) {
    setSelectedEmpresa(empresa)
    setViewMode('view')
  }

  function handleCancel() {
    setSelectedEmpresa(null)
    setViewMode('list')
  }

  async function handleSubmit(data: Omit<Empresa, 'id' | 'created_at'>) {
    let result: { success: boolean; data?: any; error?: any } = { success: false }

    if (viewMode === 'create') {
      result = await createEmpresa(data)
    } else if (viewMode === 'edit' && selectedEmpresa) {
      result = await updateEmpresa(selectedEmpresa.id, data)
    } else {
      result = { success: false }
    }

    return result
  }

  async function handleDelete(id: number) {
    const result = await deleteEmpresa(id)
    if (result.success) {
      alert('Empresa excluída com sucesso!')
    } else {
      alert('Erro ao excluir empresa!')
    }
  }

  async function handleToggleStatus(id: number) {
    const result = await toggleStatus(id)
    if (result.success) {
      alert('Status da empresa atualizado!')
    } else {
      alert('Erro ao atualizar status!')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Carregando empresas...</div>
      </div>
    )
  }

  // Modo de visualização/edição
  if (viewMode !== 'list') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {viewMode === 'create' && 'Nova Empresa'}
              {viewMode === 'edit' && 'Editar Empresa'}
              {viewMode === 'view' && 'Detalhes da Empresa'}
            </h1>
            <p className="text-gray-600">
              {viewMode === 'create' && 'Cadastre uma nova empresa cliente'}
              {viewMode === 'edit' && 'Edite as informações da empresa'}
              {viewMode === 'view' && 'Visualize os detalhes da empresa'}
            </p>
          </div>
          <Button variant="outline" onClick={handleCancel}>
            Voltar
          </Button>
        </div>

        {viewMode === 'view' && selectedEmpresa ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>📋 Informações da Empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedEmpresa.nome}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">CNPJ</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedEmpresa.cnpj || 'Não informado'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Responsável</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedEmpresa.responsavel}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contato</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedEmpresa.contato || 'Não informado'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedEmpresa.email || 'Não informado'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Forma de Pagamento</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{selectedEmpresa.forma_pagamento}</p>
                </div>
              </div>
              {selectedEmpresa.endereco && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Endereço</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedEmpresa.endereco}</p>
                </div>
              )}
              <div className="flex space-x-4 pt-4">
                <Button onClick={() => handleEdit(selectedEmpresa)}>
                  Editar
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Fechar
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <EmpresaForm
            empresa={selectedEmpresa || undefined}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            title={viewMode === 'create' ? 'Nova Empresa' : 'Editar Empresa'}
          />
        )}
      </div>
    )
  }

  // Modo lista
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Empresas</h1>
          <p className="text-gray-600">Gerencie suas empresas clientes</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Empresa
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ativas</p>
                <p className="text-2xl font-bold text-green-600">{stats.ativas}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inativas</p>
                <p className="text-2xl font-bold text-red-600">{stats.inativas}</p>
              </div>
              <Users className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nome, responsável ou CNPJ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'ativo' | 'inativo')}
                className="w-full md:w-auto p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todas</option>
                <option value="ativo">Apenas Ativas</option>
                <option value="inativo">Apenas Inativas</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <EmpresasTable
        empresas={empresas}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        onView={handleView}
      />
    </div>
  )
}