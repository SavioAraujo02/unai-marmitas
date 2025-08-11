// src/hooks/use-relatorios.ts
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getMonthYear } from '@/lib/utils'

interface RelatorioData {
  faturamentoPorMes: { mes: string; valor: number }[]
  consumoPorTamanho: { tamanho: string; quantidade: number; valor: number }[]
  topEmpresas: { nome: string; valor: number; marmitas: number }[]
  evolucaoMensal: { mes: string; marmitas: number; valor: number }[]
  estatisticasGerais: {
    totalMarmitas: number
    totalFaturamento: number
    empresasAtivas: number
    ticketMedio: number
    crescimentoMensal: number
  }
}

export function useRelatorios() {
  const [data, setData] = useState<RelatorioData>({
    faturamentoPorMes: [],
    consumoPorTamanho: [],
    topEmpresas: [],
    evolucaoMensal: [],
    estatisticasGerais: {
      totalMarmitas: 0,
      totalFaturamento: 0,
      empresasAtivas: 0,
      ticketMedio: 0,
      crescimentoMensal: 0
    }
  })
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const { mes, ano } = getMonthYear()
    return { mes, ano }
  })

  useEffect(() => {
    fetchRelatorios()
  }, [selectedPeriod])

  async function fetchRelatorios() {
    try {
      setLoading(true)
      
      // Buscar dados dos últimos 6 meses
      const mesesParaBuscar = []
      for (let i = 5; i >= 0; i--) {
        const data = new Date()
        data.setMonth(data.getMonth() - i)
        mesesParaBuscar.push({
          mes: data.getMonth() + 1,
          ano: data.getFullYear(),
          nome: data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
        })
      }

      // Buscar consumos dos últimos 6 meses
      const dataInicio = new Date()
      dataInicio.setMonth(dataInicio.getMonth() - 5)
      dataInicio.setDate(1)

      const { data: consumos, error: consumosError } = await supabase
        .from('consumos')
        .select(`
          *,
          empresa:empresas(nome)
        `)
        .gte('data_consumo', dataInicio.toISOString().split('T')[0])
        .order('data_consumo')

      if (consumosError) throw consumosError

      // Buscar empresas ativas
      const { data: empresas, error: empresasError } = await supabase
        .from('empresas')
        .select('*')
        .eq('ativo', true)

      if (empresasError) throw empresasError

      // Processar dados
      const faturamentoPorMes = mesesParaBuscar.map(periodo => {
        const consumosDoMes = consumos?.filter(c => {
          const dataConsumo = new Date(c.data_consumo)
          return dataConsumo.getMonth() + 1 === periodo.mes && 
                 dataConsumo.getFullYear() === periodo.ano
        }) || []
        
        return {
          mes: periodo.nome,
          valor: consumosDoMes.reduce((sum, c) => sum + c.preco, 0)
        }
      })

      // Consumo por tamanho (mês atual)
      const consumosDoMesAtual = consumos?.filter(c => {
        const dataConsumo = new Date(c.data_consumo)
        return dataConsumo.getMonth() + 1 === selectedPeriod.mes && 
               dataConsumo.getFullYear() === selectedPeriod.ano
      }) || []

      const consumoPorTamanho = [
        {
          tamanho: 'P',
          quantidade: consumosDoMesAtual.filter(c => c.tamanho === 'P').reduce((sum, c) => sum + c.quantidade, 0),
          valor: consumosDoMesAtual.filter(c => c.tamanho === 'P').reduce((sum, c) => sum + c.preco, 0)
        },
        {
          tamanho: 'M',
          quantidade: consumosDoMesAtual.filter(c => c.tamanho === 'M').reduce((sum, c) => sum + c.quantidade, 0),
          valor: consumosDoMesAtual.filter(c => c.tamanho === 'M').reduce((sum, c) => sum + c.preco, 0)
        },
        {
          tamanho: 'G',
          quantidade: consumosDoMesAtual.filter(c => c.tamanho === 'G').reduce((sum, c) => sum + c.quantidade, 0),
          valor: consumosDoMesAtual.filter(c => c.tamanho === 'G').reduce((sum, c) => sum + c.preco, 0)
        }
      ]

      // Top empresas (mês atual)
      const empresasComConsumo = new Map()
      consumosDoMesAtual.forEach(consumo => {
        const empresaId = consumo.empresa_id
        const empresaNome = consumo.empresa?.nome || 'Empresa não encontrada'
        
        if (!empresasComConsumo.has(empresaId)) {
          empresasComConsumo.set(empresaId, {
            nome: empresaNome,
            valor: 0,
            marmitas: 0
          })
        }
        
        const empresa = empresasComConsumo.get(empresaId)
        empresa.valor += consumo.preco
        empresa.marmitas += consumo.quantidade
      })

      const topEmpresas = Array.from(empresasComConsumo.values())
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 5)

      // Evolução mensal
      const evolucaoMensal = mesesParaBuscar.map(periodo => {
        const consumosDoMes = consumos?.filter(c => {
          const dataConsumo = new Date(c.data_consumo)
          return dataConsumo.getMonth() + 1 === periodo.mes && 
                 dataConsumo.getFullYear() === periodo.ano
        }) || []
        
        return {
          mes: periodo.nome,
          marmitas: consumosDoMes.reduce((sum, c) => sum + c.quantidade, 0),
          valor: consumosDoMes.reduce((sum, c) => sum + c.preco, 0)
        }
      })

      // Estatísticas gerais
      const totalMarmitas = consumosDoMesAtual.reduce((sum, c) => sum + c.quantidade, 0)
      const totalFaturamento = consumosDoMesAtual.reduce((sum, c) => sum + c.preco, 0)
      const empresasAtivas = empresas?.length || 0
      const ticketMedio = totalMarmitas > 0 ? totalFaturamento / totalMarmitas : 0

      // Crescimento mensal (comparar com mês anterior)
      const mesAnterior = evolucaoMensal[evolucaoMensal.length - 2]
      const mesAtual = evolucaoMensal[evolucaoMensal.length - 1]
      const crescimentoMensal = mesAnterior && mesAnterior.valor > 0 
        ? ((mesAtual.valor - mesAnterior.valor) / mesAnterior.valor) * 100 
        : 0

      setData({
        faturamentoPorMes,
        consumoPorTamanho,
        topEmpresas,
        evolucaoMensal,
        estatisticasGerais: {
          totalMarmitas,
          totalFaturamento,
          empresasAtivas,
          ticketMedio,
          crescimentoMensal
        }
      })
    } catch (error) {
      console.error('Erro ao buscar relatórios:', error)
    } finally {
      setLoading(false)
    }
  }

  return {
    data,
    loading,
    selectedPeriod,
    setSelectedPeriod,
    refetch: fetchRelatorios
  }
}