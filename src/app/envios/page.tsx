// src/app/envios/page.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusTracker } from '@/components/envios/status-tracker'
import { ActionButtons } from '@/components/envios/action-buttons'
import { ObservationField } from '@/components/envios/observation-field'
import { useEnvios } from '@/hooks/use-envios'
import { formatCurrency } from '@/lib/utils'
import { 
  Calendar, 
  RefreshCw, 
  Filter,
  CheckCircle,
  AlertTriangle,
  Clock,
  XCircle,
  BarChart3,
  Send
} from 'lucide-react'

export default function EnviosPage() {
  const {
    enviosAgrupados,
    loading,
    selectedMonth,
    setSelectedMonth,
    statusFilter,
    setStatusFilter,
    stats,
    reenviarDocumento,
    marcarComoEnviado,
    adicionarObservacao,
    refetch
  } = useEnvios()

  const [expandedCard, setExpandedCard] = useState<number | null>(null)

  async function handleReenviar(envioId: number, empresaNome: string) {
    const result = await reenviarDocumento(envioId)
    if (result.success) {
      alert(`Documento reenviado para ${empresaNome}!`)
    } else {
      alert('Erro ao reenviar documento!')
    }
  }

  async function handleMarcarEnviado(envioId: number, empresaNome: string) {
    const result = await marcarComoEnviado(envioId)
    if (result.success) {
      alert(`Documento marcado como enviado para ${empresaNome}!`)
    } else {
      alert('Erro ao marcar como enviado!')
    }
  }

  async function handleAdicionarObservacao(envioId: number, observacao: string) {
    const result = await adicionarObservacao(envioId, observacao)
    if (result.success) {
      // Observação salva silenciosamente
    } else {
      alert('Erro ao salvar observação!')
    }
  }

  function handleLigar(empresa: string, contato?: string) {
    if (contato) {
      alert(`Ligando para ${empresa}: ${contato}`)
    } else {
      alert(`Contato não disponível para ${empresa}`)
    }
  }

  function getStatusGlobalColor(status: string) {
    switch (status) {
      case 'completo': return 'border-green-500 bg-green-50'
      case 'erro': return 'border-red-500 bg-red-50'
      case 'parcial': return 'border-yellow-500 bg-yellow-50'
      case 'pendente': return 'border-gray-500 bg-gray-50'
      default: return 'border-gray-300 bg-white'
    }
  }

  function getStatusGlobalIcon(status: string) {
    switch (status) {
      case 'completo': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'erro': return <XCircle className="h-5 w-5 text-red-600" />
      case 'parcial': return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'pendente': return <Clock className="h-5 w-5 text-gray-600" />
      default: return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  function getStatusGlobalText(status: string) {
    switch (status) {
      case 'completo': return '✅ COMPLETO'
      case 'erro': return '🔴 COM ERRO'
      case 'parcial': return '🟡 PARCIAL'
      case 'pendente': return '⏳ PENDENTE'
      default: return 'INDEFINIDO'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Carregando controle de envios...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🚀 Controle de Envios</h1>
          <p className="text-gray-600">
            Gerencie o envio de relatórios, cobranças e notas fiscais
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Controles */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Seletor de mês */}
            <div className="flex items-center space-x-4">
              <Calendar className="h-5 w-5 text-yellow-600" />
              <div className="flex space-x-2">
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

            {/* Filtro de status */}
            <div className="flex items-center space-x-4">
              <Filter className="h-5 w-5 text-yellow-600" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              >
                <option value="all">Todos os Status</option>
                <option value="erro">Apenas com Erro</option>
                <option value="pendente">Apenas Pendentes</option>
                <option value="enviado">Apenas Enviados</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completos</p>
                <p className="text-2xl font-bold text-green-600">{stats.completos}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Parciais</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.parciais}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Com Erro</p>
                <p className="text-2xl font-bold text-red-600">{stats.comErro}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Progresso</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.total > 0 ? Math.round((stats.completos / stats.total) * 100) : 0}%
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de progresso geral */}
      {stats.total > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progresso Geral</span>
              <span className="text-sm text-gray-500">
                {stats.completos} de {stats.total} completos
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(stats.completos / stats.total) * 100}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Envios */}
      <div className="space-y-4">
        {enviosAgrupados.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-gray-500">
                <Send className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">Nenhum envio encontrado</p>
                <p className="text-sm">
                  Gere os fechamentos mensais primeiro para criar os controles de envio
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          enviosAgrupados.map((item) => (
            <Card 
              key={item.fechamento.id} 
              className={`border-l-4 ${getStatusGlobalColor(item.statusGeral)} transition-all duration-200 hover:shadow-md`}
            >
              <CardHeader 
                className="cursor-pointer"
                onClick={() => setExpandedCard(expandedCard === item.fechamento.id ? null : item.fechamento.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusGlobalIcon(item.statusGeral)}
                    <div>
                      <CardTitle className="text-lg">
                        🏢 {item.fechamento.empresa?.nome}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        {item.fechamento.empresa?.responsavel} • {formatCurrency(item.fechamento.valor_total)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-medium ${
                      item.statusGeral === 'completo' ? 'text-green-600' :
                      item.statusGeral === 'erro' ? 'text-red-600' :
                      item.statusGeral === 'parcial' ? 'text-yellow-600' :
                      'text-gray-600'
                    }`}>
                      {getStatusGlobalText(item.statusGeral)}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      Clique para {expandedCard === item.fechamento.id ? 'recolher' : 'expandir'}
                    </p>
                  </div>
                </div>
              </CardHeader>

              {expandedCard === item.fechamento.id && (
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Status dos documentos */}
                    <div className="space-y-3">
                      <StatusTracker 
                        envio={item.relatorio} 
                        tipo="relatorio" 
                        nome="📄 Relatório Mensal" 
                      />
                      <StatusTracker 
                        envio={item.cobranca} 
                        tipo="cobranca" 
                        nome="💳 Cobrança" 
                      />
                      <StatusTracker 
                        envio={item.notaFiscal} 
                        tipo="nota_fiscal" 
                        nome="📋 Nota Fiscal" 
                      />
                    </div>

                    {/* Observações */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">📝 Observações:</h4>
                      <ObservationField
                        value={item.observacoes}
                        onChange={(value) => {
                          // Atualizar observação no primeiro envio disponível
                          const envioParaAtualizar = item.relatorio || item.cobranca || item.notaFiscal
                          if (envioParaAtualizar) {
                            handleAdicionarObservacao(envioParaAtualizar.id, value)
                          }
                        }}
                        placeholder="Ex: Cliente prefere receber por WhatsApp, ligar após 14h..."
                      />
                    </div>

                    {/* Ações rápidas */}
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">🎯 Ações Rápidas:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Ações para Relatório */}
                        <div>
                          <p className="text-xs font-medium text-gray-600 mb-2">Relatório</p>
                          <ActionButtons
                            envio={item.relatorio}
                            onReenviar={() => item.relatorio && handleReenviar(item.relatorio.id, item.fechamento.empresa?.nome || '')}
                            onMarcarEnviado={() => item.relatorio && handleMarcarEnviado(item.relatorio.id, item.fechamento.empresa?.nome || '')}
                            onAdicionarObservacao={() => {
                              const obs = prompt('Adicionar observação:')
                              if (obs && item.relatorio) {
                                handleAdicionarObservacao(item.relatorio.id, obs)
                              }
                            }}
                          />
                        </div>

                        {/* Ações para Cobrança */}
                        <div>
                          <p className="text-xs font-medium text-gray-600 mb-2">Cobrança</p>
                          <ActionButtons
                            envio={item.cobranca}
                            onReenviar={() => item.cobranca && handleReenviar(item.cobranca.id, item.fechamento.empresa?.nome || '')}
                            onMarcarEnviado={() => item.cobranca && handleMarcarEnviado(item.cobranca.id, item.fechamento.empresa?.nome || '')}
                            onAdicionarObservacao={() => {
                              const obs = prompt('Adicionar observação:')
                              if (obs && item.cobranca) {
                                handleAdicionarObservacao(item.cobranca.id, obs)
                              }
                            }}
                            onLigar={() => handleLigar(item.fechamento.empresa?.nome || '', item.fechamento.empresa?.responsavel)}
                          />
                        </div>

                        {/* Ações para Nota Fiscal */}
                        <div>
                          <p className="text-xs font-medium text-gray-600 mb-2">Nota Fiscal</p>
                          <ActionButtons
                            envio={item.notaFiscal}
                            onReenviar={() => item.notaFiscal && handleReenviar(item.notaFiscal.id, item.fechamento.empresa?.nome || '')}
                            onMarcarEnviado={() => item.notaFiscal && handleMarcarEnviado(item.notaFiscal.id, item.fechamento.empresa?.nome || '')}
                            onAdicionarObservacao={() => {
                              const obs = prompt('Adicionar observação:')
                              if (obs && item.notaFiscal) {
                                handleAdicionarObservacao(item.notaFiscal.id, obs)
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Informações da empresa */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">ℹ️ Informações da Empresa:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><strong>Responsável:</strong> {item.fechamento.empresa?.responsavel}</p>
                          <p><strong>Email:</strong> {item.fechamento.empresa?.email || 'Não informado'}</p>
                        </div>
                        <div>
                          <p><strong>Forma de Pagamento:</strong> {item.fechamento.empresa?.forma_pagamento}</p>
                          <p><strong>Valor Total:</strong> {formatCurrency(item.fechamento.valor_total)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Ações em lote */}
      {stats.comErro > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <div>
                  <h3 className="font-medium text-red-800">
                    {stats.comErro} empresa(s) com erro nos envios
                  </h3>
                  <p className="text-sm text-red-700">
                    Resolva os problemas ou tente reenviar os documentos
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="border-red-300 text-red-700 hover:bg-red-100"
                onClick={() => {
                  // Implementar reenvio em lote
                  alert('Funcionalidade de reenvio em lote será implementada!')
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reenviar Todos com Erro
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}