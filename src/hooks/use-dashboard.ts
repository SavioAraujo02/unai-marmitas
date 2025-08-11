// src/hooks/use-dashboard.ts
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { DashboardStats, Consumo } from '@/types'
import { getTodayString, getMonthYear } from '@/lib/utils'

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    marmitasHoje: 0,
    faturamentoMes: 0,
    empresasPendentes: 0,
    empresasAtivas: 0,
    crescimentoHoje: 0,
    crescimentoMes: 0,
  })
  const [recentConsumos, setRecentConsumos] = useState<Consumo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      setLoading(true)
      
      const hoje = getTodayString()
      const { mes, ano } = getMonthYear()
      const ontem = new Date()
      ontem.setDate(ontem.getDate() - 1)
      const ontemString = ontem.toISOString().split('T')[0]

      // Consumos de hoje
      const { data: consumosHoje } = await supabase
        .from('consumos')
        .select('*')
        .eq('data_consumo', hoje)

      // Consumos de ontem para comparação
      const { data: consumosOntem } = await supabase
        .from('consumos')
        .select('*')
        .eq('data_consumo', ontemString)

      // Faturamento do mês atual
      const { data: consumosMes } = await supabase
        .from('consumos')
        .select('preco')
        .gte('data_consumo', `${ano}-${mes.toString().padStart(2, '0')}-01`)
        .lt('data_consumo', `${ano}-${(mes + 1).toString().padStart(2, '0')}-01`)

      // Empresas ativas
      const { data: empresasAtivas } = await supabase
        .from('empresas')
        .select('id')
        .eq('ativo', true)

      // Fechamentos pendentes
      const { data: fechamentosPendentes } = await supabase
        .from('fechamentos')
        .select('id')
        .eq('status', 'pendente')

      // Consumos recentes com dados da empresa
      const { data: recentes } = await supabase
        .from('consumos')
        .select(`
          *,
          empresa:empresas(nome)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      // Calcular estatísticas
      const marmitasHoje = consumosHoje?.length || 0
      const marmitasOntem = consumosOntem?.length || 0
      const faturamentoMes = consumosMes?.reduce((sum, item) => sum + (item.preco || 0), 0) || 0
      
      const crescimentoHoje = marmitasOntem > 0 
        ? ((marmitasHoje - marmitasOntem) / marmitasOntem) * 100 
        : 0

      setStats({
        marmitasHoje,
        faturamentoMes,
        empresasPendentes: fechamentosPendentes?.length || 0,
        empresasAtivas: empresasAtivas?.length || 0,
        crescimentoHoje,
        crescimentoMes: 8, // Placeholder - calcularemos depois
      })

      setRecentConsumos(recentes || [])
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  return {
    stats,
    recentConsumos,
    loading,
    refetch: fetchDashboardData
  }
}