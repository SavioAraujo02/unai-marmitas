// src/app/consumos/page.tsx
'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConsumoForm } from '@/components/forms/consumo-form'
import { ConsumosTable } from '@/components/tables/consumos-table'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { useConsumos } from '@/hooks/use-consumos'
import { Calendar, Download, RefreshCw, Filter } from 'lucide-react'

export default function ConsumosPage() {
  const {
    consumos,
    empresas,
    loading,
    selectedDate,
    setSelectedDate,
    selectedEmpresa,
    setSelectedEmpresa,
    stats,
    createConsumo,
    deleteConsumo,
    refetch
  } = useConsumos()

  async function handleDelete(id: number) {
    const result = await deleteConsumo(id)
    if (result.success) {
      alert('Consumo excluído com sucesso!')
    } else {
      alert('Erro ao excluir consumo!')
    }
  }

  function handleExport() {
    if (consumos.length === 0) {
      alert('Nenhum dado para exportar!')
      return
    }

    // Criar CSV simples
    const headers = ['Horário', 'Empresa', 'Responsável', 'Tamanho', 'Valor', 'Observações']
    const csvContent = [
      headers.join(','),
      ...consumos.map(consumo => [
        new Date(consumo.created_at).toLocaleTimeString('pt-BR'),
        `"${consumo.empresa?.nome || ''}"`,
        `"${consumo.responsavel || ''}"`,
        consumo.tamanho,
        consumo.preco.toFixed(2).replace('.', ','),
        `"${consumo.observacoes || ''}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `consumos_${selectedDate}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Carregando consumos...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Consumos</h1>
          <p className="text-gray-600">Registre e gerencie o consumo diário de marmitas</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Empresa
              </label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <select
                  value={selectedEmpresa || ''}
                  onChange={(e) => setSelectedEmpresa(e.target.value ? Number(e.target.value) : null)}
                  className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todas as empresas</option>
                  {empresas.map((empresa) => (
                    <option key={empresa.id} value={empresa.id}>
                      {empresa.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <StatsCards stats={stats} />

      {/* Formulário e Tabela */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de registro */}
        <div className="lg:col-span-1">
          <ConsumoForm
            empresas={empresas}
            onSubmit={createConsumo}
            selectedDate={selectedDate}
          />
        </div>

        {/* Lista de consumos */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                📋 Consumos do Dia
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({stats.total} {stats.total === 1 ? 'registro' : 'registros'})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ConsumosTable
                consumos={consumos}
                onDelete={handleDelete}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}