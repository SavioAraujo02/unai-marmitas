// src/app/fechamentos/page.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FechamentosTable } from '@/components/tables/fechamentos-table'
import { FechamentoForm } from '@/components/forms/fechamento-form'
import { useFechamentos } from '@/hooks/use-fechamentos'
import { Fechamento } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { 
  Plus, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Building2, 
  AlertTriangle,
  Download,
  RefreshCw,
  FileText
} from 'lucide-react'

import { usePDFReports } from '@/hooks/use-pdf-reports'

type ViewMode = 'list' | 'edit' | 'view'

export default function FechamentosPage() {
  const {
    fechamentos,
    loading,
    selectedMonth,
    setSelectedMonth,
    stats,
    gerarFechamentoAutomatico,
    updateFechamento,
    deleteFechamento,
    refetch
  } = useFechamentos()

  const { loading: pdfLoading, gerarRelatorioEmpresa, gerarRelatorioConsolidado } = usePDFReports()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedFechamento, setSelectedFechamento] = useState<Fechamento | null>(null)

  function handleEdit(fechamento: Fechamento) {
    setSelectedFechamento(fechamento)
    setViewMode('edit')
  }

  function handleView(fechamento: Fechamento) {
    setSelectedFechamento(fechamento)
    setViewMode('view')
  }

  function handleCancel() {
    setSelectedFechamento(null)
    setViewMode('list')
  }

  async function handleSubmit(updates: Partial<Fechamento>) {
    if (!selectedFechamento) return { success: false }
    
    const result = await updateFechamento(selectedFechamento.id, updates)
    return result
  }

  async function handleDelete(id: number) {
    const result = await deleteFechamento(id)
    if (result.success) {
      alert('Fechamento excluído com sucesso!')
    } else {
      alert('Erro ao excluir fechamento!')
    }
  }

  async function handleGerarAutomatico() {
    if (confirm('Deseja gerar os fechamentos automáticos para este mês? Isso irá calcular o consumo de todas as empresas ativas.')) {
      const result = await gerarFechamentoAutomatico()
      if (result.success) {
        alert(`${result.count} fechamentos gerados com sucesso!`)
      } else {
        alert('Erro ao gerar fechamentos automáticos!')
      }
    }
  }

  async function handleGerarRelatorio(fechamento: Fechamento) {
    const result = await gerarRelatorioEmpresa(
      fechamento.empresa_id,
      selectedMonth.mes,
      selectedMonth.ano
    )
    
    if (result.success) {
      alert('Relatório PDF gerado com sucesso!')
    } else {
      alert(result.error || 'Erro ao gerar relatório!')
    }
  }

  async function handleGerarConsolidado() {
    const result = await gerarRelatorioConsolidado(selectedMonth.mes, selectedMonth.ano)
    
    if (result.success) {
      alert('Relatório consolidado gerado com sucesso!')
    } else {
      alert(result.error || 'Erro ao gerar relatório consolidado!')
    }
  }

  async function handleEnviarCobranca(fechamento: Fechamento) {
    const result = await updateFechamento(fechamento.id, { status: 'enviado' })
    if (result.success) {
      alert(`Cobrança enviada para ${fechamento.empresa?.nome}!`)
    }
  }

  async function handleMarcarPago(fechamento: Fechamento) {
    const result = await updateFechamento(fechamento.id, { status: 'pago' })
    if (result.success) {
      alert(`Pagamento confirmado para ${fechamento.empresa?.nome}!`)
    }
  }

  function handleExportarTodos() {
    if (fechamentos.length === 0) {
      alert('Nenhum fechamento para exportar!')
      return
    }

    // Criar CSV
    const headers = ['Empresa', 'P', 'M', 'G', 'Total Marmitas', 'Valor Total', 'Status', 'Forma Pagamento']
    const csvContent = [
      headers.join(','),
      ...fechamentos.map(f => [
        `"${f.empresa?.nome || ''}"`,
        f.total_p,
        f.total_m,
        f.total_g,
        f.total_p + f.total_m + f.total_g,
        f.valor_total.toFixed(2).replace('.', ','),
        f.status,
        f.empresa?.forma_pagamento || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `fechamentos_${selectedMonth.mes}_${selectedMonth.ano}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Carregando fechamentos...</div>
      </div>
    )
  }

  // Modo de edição/visualização
  if (viewMode !== 'list') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {viewMode === 'edit' && 'Editar Fechamento'}
              {viewMode === 'view' && 'Detalhes do Fechamento'}
            </h1>
            <p className="text-gray-600">
              {selectedFechamento?.empresa?.nome} - {selectedMonth.mes}/{selectedMonth.ano}
            </p>
          </div>
          <Button variant="outline" onClick={handleCancel}>
            Voltar
          </Button>
        </div>

        {viewMode === 'view' && selectedFechamento ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>📋 Detalhes do Fechamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Informações da empresa */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-medium text-yellow-800 mb-2">🏢 Empresa</h3>
                <p className="text-lg font-semibold">{selectedFechamento.empresa?.nome}</p>
                <p className="text-sm text-gray-600">
                  Responsável: {selectedFechamento.empresa?.responsavel}
                </p>
                <p className="text-sm text-gray-600">
                  Forma de Pagamento: {selectedFechamento.empresa?.forma_pagamento}
                  </p>
              </div>

              {/* Resumo das marmitas */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{selectedFechamento.total_p}</div>
                  <div className="text-sm text-blue-800">Pequenas (P)</div>
                  <div className="text-xs text-gray-600">R$ 15,00 cada</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{selectedFechamento.total_m}</div>
                  <div className="text-sm text-green-800">Médias (M)</div>
                  <div className="text-xs text-gray-600">R$ 18,00 cada</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-600">{selectedFechamento.total_g}</div>
                  <div className="text-sm text-orange-800">Grandes (G)</div>
                  <div className="text-xs text-gray-600">R$ 22,00 cada</div>
                </div>
              </div>

              {/* Totais */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total de Marmitas</p>
                    <p className="text-xl font-bold">
                      {selectedFechamento.total_p + selectedFechamento.total_m + selectedFechamento.total_g}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Valor Total</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(selectedFechamento.valor_total)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status e observações */}
              <div>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    selectedFechamento.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                    selectedFechamento.status === 'enviado' ? 'bg-blue-100 text-blue-800' :
                    selectedFechamento.status === 'pago' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {selectedFechamento.status === 'pendente' && '🟡 Pendente'}
                    {selectedFechamento.status === 'enviado' && '🔵 Enviado'}
                    {selectedFechamento.status === 'pago' && '🟢 Pago'}
                    {selectedFechamento.status === 'erro' && '🔴 Erro'}
                  </span>
                </div>
                
                {selectedFechamento.observacoes && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Observações</p>
                    <p className="text-sm bg-white p-3 rounded border">
                      {selectedFechamento.observacoes}
                    </p>
                  </div>
                )}
              </div>

              {/* Ações */}
              <div className="flex space-x-4 pt-4">
                <Button onClick={() => handleEdit(selectedFechamento)}>
                  Editar
                </Button>
                <Button variant="outline" onClick={() => handleGerarRelatorio(selectedFechamento)}>
                  Gerar Relatório
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Fechar
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : selectedFechamento ? (
          <FechamentoForm
            fechamento={selectedFechamento}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        ) : null}
      </div>
    )
  }

  // Modo lista
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fechamentos Mensais</h1>
          <p className="text-gray-600">Gerencie os fechamentos e cobranças mensais</p>
        </div>
        <div className="flex space-x-2">
        <Button variant="outline" onClick={refetch}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
        <Button variant="outline" onClick={handleExportarTodos}>
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
        <Button variant="outline" onClick={handleGerarConsolidado} disabled={pdfLoading}>
          <FileText className="h-4 w-4 mr-2" />
          {pdfLoading ? 'Gerando...' : 'Relatório PDF'}
        </Button>
        <Button onClick={handleGerarAutomatico}>
          <Plus className="h-4 w-4 mr-2" />
          Gerar Automático
        </Button>
      </div>
      </div>

      {/* Seletor de mês */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <Calendar className="h-5 w-5 text-yellow-600" />
            <div className="flex space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mês</label>
                <select
                  value={selectedMonth.mes}
                  onChange={(e) => setSelectedMonth(prev => ({ ...prev, mes: parseInt(e.target.value) }))}
                  className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2024, i).toLocaleDateString('pt-BR', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
                <select
                  value={selectedMonth.ano}
                  onChange={(e) => setSelectedMonth(prev => ({ ...prev, ano: parseInt(e.target.value) }))}
                  className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                >
                  {Array.from({ length: 5 }, (_, i) => (
                    <option key={2024 + i} value={2024 + i}>
                      {2024 + i}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Empresas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEmpresas}</p>
              </div>
              <Building2 className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Faturamento</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalFaturamento)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Marmitas</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalMarmitas}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendentes}</p>
                <p className="text-xs text-gray-500">
                  Pagos: {stats.pagos} | Erros: {stats.comErro}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {stats.comErro > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">
                Atenção: {stats.comErro} fechamento(s) com erro
              </h3>
              <p className="text-sm text-red-700 mt-1">
                Verifique os fechamentos com status de erro e corrija os problemas.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabela */}
      <FechamentosTable
        fechamentos={fechamentos}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        onGerarRelatorio={handleGerarRelatorio}
        onEnviarCobranca={handleEnviarCobranca}
        onMarcarPago={handleMarcarPago}
      />
    </div>
  )
}