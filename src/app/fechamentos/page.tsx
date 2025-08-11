// src/app/fechamentos/page.tsx
'use client'

import { useState, useEffect } from 'react' // ← Adicionar useEffect aqui
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FechamentosTable } from '@/components/tables/fechamentos-table'
import { FechamentoForm } from '@/components/forms/fechamento-form'
import { useFechamentos } from '@/hooks/use-fechamentos'
import { Fechamento } from '@/types'
import { formatCurrency, getPrecoMarmitaFromConfig } from '@/lib/utils'
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
import { useConfiguracoes } from '@/hooks/use-configuracoes'

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
  const { configuracoes } = useConfiguracoes()
  const [precos, setPrecos] = useState({ P: 15, M: 18, G: 22 })

  useEffect(() => {
    function carregarPrecos() {
      setPrecos({
        P: getPrecoMarmitaFromConfig('P'),
        M: getPrecoMarmitaFromConfig('M'),
        G: getPrecoMarmitaFromConfig('G')
      })
    }
    carregarPrecos()
  }, [])

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
    // Esta função agora é a mesma que handleEnviarRelatorio
    await handleEnviarRelatorio(fechamento)
  }

  async function handleGerarConsolidado() {
    const result = await gerarRelatorioConsolidado(selectedMonth.mes, selectedMonth.ano)
    
    if (result.success) {
      alert('Relatório consolidado gerado com sucesso!')
    } else {
      alert(result.error || 'Erro ao gerar relatório consolidado!')
    }
  }

  async function handleEnviarRelatorio(fechamento: Fechamento) {
    try {
      console.log('🔄 Iniciando geração de relatório para:', fechamento.empresa?.nome)
      console.log('📋 Dados do fechamento:', { id: fechamento.id, empresa_id: fechamento.empresa_id })
      
      const result = await gerarRelatorioEmpresa(
        fechamento.empresa_id,
        selectedMonth.mes,
        selectedMonth.ano
      )
      
      console.log('📊 Resultado da geração do relatório:', result)
      
      if (result.success) {
        console.log('✅ Relatório gerado com sucesso, atualizando status...')
        
        const updateData = { 
          status: 'relatorio_enviado' as const,
          data_ultimo_envio: new Date().toISOString(),
          ultimo_erro: undefined
        }
        
        console.log('📝 Dados para atualização:', updateData)
        
        const updateResult = await updateFechamento(fechamento.id, updateData)
        
        console.log('📊 Resultado da atualização:', updateResult)
        
        if (updateResult.success) {
          alert(`Relatório enviado com sucesso para ${fechamento.empresa?.nome}!`)
        } else {
          console.error('❌ Erro ao atualizar status:', updateResult.error)
          alert('Relatório gerado mas houve erro ao atualizar status')
        }
      } else {
        console.log('❌ Erro na geração do relatório, atualizando status de erro...')
        const errorMessage = result.error || 'Erro desconhecido ao gerar relatório'
        
        const updateResult = await updateFechamento(fechamento.id, { 
          status: 'erro_relatorio' as const,
          ultimo_erro: errorMessage
        })
        
        if (updateResult.success) {
          alert(`Erro ao gerar relatório: ${errorMessage}`)
        } else {
          console.error('❌ Erro ao atualizar status de erro:', updateResult.error)
          alert(`Erro ao gerar relatório: ${errorMessage}\nTambém houve erro ao salvar o status.`)
        }
      }
    } catch (error) {
      console.error('💥 Erro inesperado em handleEnviarRelatorio:', error)
      
      try {
        await updateFechamento(fechamento.id, { 
          status: 'erro_relatorio' as const,
          ultimo_erro: 'Erro inesperado ao processar relatório'
        })
      } catch (updateError) {
        console.error('💥 Erro ao salvar status de erro:', updateError)
      }
      
      alert('Erro inesperado ao processar relatório')
    }
  }
  
  async function handleEnviarCobranca(fechamento: Fechamento) {
    try {
      console.log('Iniciando envio de cobrança para:', fechamento.empresa?.nome)
      
      // Simular envio de NF (aqui você integraria com seu sistema de NF)
      const sucesso = Math.random() > 0.3 // 70% de chance de sucesso para teste
      
      if (sucesso) {
        const result = await updateFechamento(fechamento.id, { 
          status: 'nf_enviada',
          data_ultimo_envio: new Date().toISOString(),
          ultimo_erro: undefined
        })
        
        if (result.success) {
          alert(`Nota Fiscal enviada com sucesso para ${fechamento.empresa?.nome}!`)
        } else {
          console.error('Erro ao atualizar status de NF enviada:', result.error)
          alert('NF processada mas erro ao atualizar status')
        }
      } else {
        const result = await updateFechamento(fechamento.id, { 
          status: 'erro_nf',
          ultimo_erro: 'Erro ao gerar/enviar nota fiscal'
        })
        
        if (result.success) {
          alert('Erro ao enviar Nota Fiscal!')
        }
      }
    } catch (error) {
      console.error('Erro inesperado em handleEnviarCobranca:', error)
      
      try {
        await updateFechamento(fechamento.id, { 
          status: 'erro_nf',
          ultimo_erro: 'Erro inesperado ao processar NF'
        })
      } catch (updateError) {
        console.error('Erro ao salvar status de erro NF:', updateError)
      }
      
      alert('Erro inesperado ao processar Nota Fiscal')
    }
  }
  
  async function handleMarcarPago(fechamento: Fechamento) {
    try {
      console.log('Marcando como pago:', fechamento.empresa?.nome)
      
      const result = await updateFechamento(fechamento.id, { 
        status: 'concluido',
        data_ultimo_envio: new Date().toISOString(),
        ultimo_erro: undefined
      })
      
      if (result.success) {
        alert(`Pagamento confirmado para ${fechamento.empresa?.nome}!`)
      } else {
        console.error('Erro ao marcar como pago:', result.error)
        alert('Erro ao confirmar pagamento')
      }
    } catch (error) {
      console.error('Erro inesperado em handleMarcarPago:', error)
      alert('Erro inesperado ao confirmar pagamento')
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
                  <div className="text-xs text-gray-600">{formatCurrency(precos.P)} cada</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{selectedFechamento.total_m}</div>
                  <div className="text-sm text-green-800">Médias (M)</div>
                  <div className="text-xs text-gray-600">{formatCurrency(precos.M)} cada</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-600">{selectedFechamento.total_g}</div>
                  <div className="text-sm text-orange-800">Grandes (G)</div>
                  <div className="text-xs text-gray-600">{formatCurrency(precos.G)} cada</div>
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
                  selectedFechamento.status === 'pendente' ? 'bg-gray-100 text-gray-800' :
                  selectedFechamento.status === 'relatorio_enviado' ? 'bg-blue-100 text-blue-800' :
                  selectedFechamento.status === 'nf_pendente' ? 'bg-yellow-100 text-yellow-800' :
                  selectedFechamento.status === 'nf_enviada' ? 'bg-purple-100 text-purple-800' :
                  selectedFechamento.status === 'pagamento_pendente' ? 'bg-orange-100 text-orange-800' :
                  selectedFechamento.status === 'concluido' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {selectedFechamento.status === 'pendente' && '⏳ Pendente'}
                  {selectedFechamento.status === 'relatorio_enviado' && '📊 Relatório Enviado'}
                  {selectedFechamento.status === 'nf_pendente' && '📄 NF Pendente'}
                  {selectedFechamento.status === 'nf_enviada' && '📋 NF Enviada'}
                  {selectedFechamento.status === 'pagamento_pendente' && '💰 Aguardando Pagamento'}
                  {selectedFechamento.status === 'concluido' && '✅ Concluído'}
                  {selectedFechamento.status.includes('erro') && '❌ Erro'}
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
                <p className="text-sm font-medium text-gray-600">Em Andamento</p>
                <p className="text-2xl font-bold text-blue-600">{stats.pendentes + stats.relatorioEnviado + stats.nfPendente + stats.nfEnviada + stats.pagamentoPendente}</p>
                <p className="text-xs text-gray-500">
                  Concluídos: {stats.concluidos} | Erros: {stats.comErro}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Novo card com breakdown detalhado */}
      <Card className="border-yellow-200">
        <CardHeader>
          <CardTitle className="text-lg">📊 Progresso Detalhado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 text-center">
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-lg font-bold text-gray-600">{stats.pendentes}</div>
              <div className="text-xs text-gray-500">⏳ Pendentes</div>
            </div>
            <div className="bg-blue-50 p-3 rounded">
              <div className="text-lg font-bold text-blue-600">{stats.relatorioEnviado}</div>
              <div className="text-xs text-blue-500">📊 Relatório OK</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded">
              <div className="text-lg font-bold text-yellow-600">{stats.nfPendente}</div>
              <div className="text-xs text-yellow-500">📄 NF Pendente</div>
            </div>
            <div className="bg-purple-50 p-3 rounded">
              <div className="text-lg font-bold text-purple-600">{stats.nfEnviada}</div>
              <div className="text-xs text-purple-500">📋 NF Enviada</div>
            </div>
            <div className="bg-orange-50 p-3 rounded">
              <div className="text-lg font-bold text-orange-600">{stats.pagamentoPendente}</div>
              <div className="text-xs text-orange-500">💰 Aguard. Pag.</div>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <div className="text-lg font-bold text-green-600">{stats.concluidos}</div>
              <div className="text-xs text-green-500">✅ Concluídos</div>
            </div>
            <div className="bg-red-50 p-3 rounded">
              <div className="text-lg font-bold text-red-600">{stats.comErro}</div>
              <div className="text-xs text-red-500">❌ Com Erro</div>
            </div>
          </div>
        </CardContent>
      </Card>

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
        onGerarRelatorio={handleEnviarRelatorio}
        onEnviarCobranca={handleEnviarCobranca}
        onMarcarPago={handleMarcarPago}
      />
    </div>
  )
}