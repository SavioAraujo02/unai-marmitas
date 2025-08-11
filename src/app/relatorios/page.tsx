// src/app/relatorios/page.tsx
'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FaturamentoChart } from '@/components/charts/faturamento-chart'
import { ConsumoChart } from '@/components/charts/consumo-chart'
import { TopEmpresasChart } from '@/components/charts/top-empresas-chart'
import { useRelatorios } from '@/hooks/use-relatorios'
import { formatCurrency } from '@/lib/utils'
import { 
  Calendar, 
  Download, 
  RefreshCw,
  TrendingUp,
  DollarSign,
  Package,
  Building2,
  BarChart3,
  ArrowUp,
  ArrowDown
} from 'lucide-react'

export default function RelatoriosPage() {
  const {
    data,
    loading,
    selectedPeriod,
    setSelectedPeriod,
    refetch
  } = useRelatorios()

  function handleExportarRelatorio() {
    // Criar relatório em CSV
    const csvContent = [
      'RELATÓRIO UNAÍ MARMITAS',
      `Período: ${selectedPeriod.mes}/${selectedPeriod.ano}`,
      '',
      'ESTATÍSTICAS GERAIS',
      `Total de Marmitas,${data.estatisticasGerais.totalMarmitas}`,
      `Faturamento Total,${data.estatisticasGerais.totalFaturamento.toFixed(2)}`,
      `Empresas Ativas,${data.estatisticasGerais.empresasAtivas}`,
      `Ticket Médio,${data.estatisticasGerais.ticketMedio.toFixed(2)}`,
      '',
      'TOP EMPRESAS',
      'Posição,Empresa,Valor,Marmitas',
      ...data.topEmpresas.map((emp, index) => 
        `${index + 1},${emp.nome},${emp.valor.toFixed(2)},${emp.marmitas}`
      ),
      '',
      'CONSUMO POR TAMANHO',
      'Tamanho,Quantidade,Valor',
      ...data.consumoPorTamanho.map(item => 
        `${item.tamanho},${item.quantidade},${item.valor.toFixed(2)}`
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `relatorio_${selectedPeriod.mes}_${selectedPeriod.ano}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Carregando relatórios...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📊 Relatórios & Analytics</h1>
          <p className="text-gray-600">Análises detalhadas do desempenho do negócio</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="outline" onClick={handleExportarRelatorio}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Seletor de período */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <Calendar className="h-5 w-5 text-yellow-600" />
            <div className="flex space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mês</label>
                <select
                  value={selectedPeriod.mes}
                  onChange={(e) => setSelectedPeriod(prev => ({ ...prev, mes: parseInt(e.target.value) }))}
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
                  value={selectedPeriod.ano}
                  onChange={(e) => setSelectedPeriod(prev => ({ ...prev, ano: parseInt(e.target.value) }))}
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

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Marmitas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.estatisticasGerais.totalMarmitas}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Unidades vendidas
                </p>
              </div>
              <Package className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Faturamento</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(data.estatisticasGerais.totalFaturamento)}
                </p>
                <div className="flex items-center mt-1">
                  {data.estatisticasGerais.crescimentoMensal >= 0 ? (
                    <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <ArrowDown className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  <p className={`text-xs ${
                    data.estatisticasGerais.crescimentoMensal >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {Math.abs(data.estatisticasGerais.crescimentoMensal).toFixed(1)}% vs mês anterior
                  </p>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(data.estatisticasGerais.ticketMedio)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Por marmita
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Empresas Ativas</p>
                <p className="text-2xl font-bold text-purple-600">
                  {data.estatisticasGerais.empresasAtivas}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Clientes ativos
                </p>
              </div>
              <Building2 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FaturamentoChart data={data.faturamentoPorMes} />
        <ConsumoChart data={data.consumoPorTamanho} />
      </div>

      {/* Top empresas e evolução */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopEmpresasChart data={data.topEmpresas} />
        
        {/* Evolução mensal */}
        <Card>
          <CardHeader>
            <CardTitle>📈 Evolução dos Últimos 6 Meses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.evolucaoMensal.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{item.mes}</p>
                    <p className="text-sm text-gray-600">{item.marmitas} marmitas</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{formatCurrency(item.valor)}</p>
                    <p className="text-xs text-gray-500">
                      {item.marmitas > 0 ? formatCurrency(item.valor / item.marmitas) : 'R$ 0,00'} /un
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights automáticos */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800">💡 Insights Automáticos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">📊 Tamanho Mais Vendido</h4>
              <p className="text-sm text-gray-700">
                {data.consumoPorTamanho.length > 0 && 
                  `Marmita tamanho ${data.consumoPorTamanho.reduce((prev, current) => 
                    prev.quantidade > current.quantidade ? prev : current
                  ).tamanho} representa a maior parte das vendas`
                }
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">🏆 Melhor Cliente</h4>
              <p className="text-sm text-gray-700">
                {data.topEmpresas.length > 0 && 
                  `${data.topEmpresas[0]?.nome} é o cliente que mais fatura: ${formatCurrency(data.topEmpresas[0]?.valor || 0)}`
                }
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">📈 Tendência</h4>
              <p className="text-sm text-gray-700">
                {data.estatisticasGerais.crescimentoMensal >= 0 
                  ? `Crescimento positivo de ${data.estatisticasGerais.crescimentoMensal.toFixed(1)}% em relação ao mês anterior`
                  : `Queda de ${Math.abs(data.estatisticasGerais.crescimentoMensal).toFixed(1)}% em relação ao mês anterior`
                }
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">💰 Oportunidade</h4>
              <p className="text-sm text-gray-700">
                {data.estatisticasGerais.empresasAtivas > 0 && data.topEmpresas.length > 0 &&
                  `Potencial de crescimento: ${data.estatisticasGerais.empresasAtivas - data.topEmpresas.length} empresas podem aumentar o consumo`
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo executivo */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-800">📋 Resumo Executivo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none text-gray-700">
            <p className="mb-4">
              <strong>Período analisado:</strong> {selectedPeriod.mes}/{selectedPeriod.ano}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-yellow-800 mb-2">🎯 Principais Resultados:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• {data.estatisticasGerais.totalMarmitas} marmitas vendidas</li>
                  <li>• Faturamento de {formatCurrency(data.estatisticasGerais.totalFaturamento)}</li>
                  <li>• {data.estatisticasGerais.empresasAtivas} empresas ativas</li>
                  <li>• Ticket médio de {formatCurrency(data.estatisticasGerais.ticketMedio)}</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-yellow-800 mb-2">📊 Destaques:</h4>
                <ul className="space-y-1 text-sm">
                  {data.topEmpresas.length > 0 && (
                    <li>• Melhor cliente: {data.topEmpresas[0].nome}</li>
                  )}
                  {data.consumoPorTamanho.length > 0 && (
                    <li>• Tamanho preferido: {
                      data.consumoPorTamanho.reduce((prev, current) => 
                        prev.quantidade > current.quantidade ? prev : current
                      ).tamanho
                    }</li>
                  )}
                  <li>• Crescimento mensal: {data.estatisticasGerais.crescimentoMensal >= 0 ? '+' : ''}{data.estatisticasGerais.crescimentoMensal.toFixed(1)}%</li>
                  <li>• Status: {data.estatisticasGerais.crescimentoMensal >= 0 ? '📈 Em crescimento' : '📉 Necessita atenção'}</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}