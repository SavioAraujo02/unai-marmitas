// src/hooks/use-consumos.ts
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Consumo, Empresa, ItemExtra } from '@/types'
import { getTodayString, calcularValorComDesconto, getPrecoMarmita } from '@/lib/utils'
import { useNotifications } from '@/hooks/use-notifications'
import { useConfiguracoes } from './use-configuracoes'

export function useConsumos() {
  const [consumos, setConsumos] = useState<Consumo[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const { showSuccess, showError } = useNotifications()
  const [selectedDate, setSelectedDate] = useState(getTodayString())
  const [selectedEmpresa, setSelectedEmpresa] = useState<number | null>(null)
  const { configuracoes } = useConfiguracoes()

  useEffect(() => {
    fetchEmpresas()
  }, [])
  
  useEffect(() => {
    fetchConsumos()
  }, [selectedDate, selectedEmpresa])

  async function fetchEmpresas() {
    try {
      const { data } = await supabase
        .from('empresas')
        .select('*')
        .eq('ativo', true)
        .order('nome')
      
      setEmpresas(data || [])
    } catch (error) {
      console.error('Erro ao buscar empresas:', error)
    }
  }

  async function fetchConsumos() {
    try {
      setLoading(true)
      
      let query = supabase
        .from('consumos')
        .select(`
          *,
          empresa:empresas(nome, responsavel)
        `)
        .eq('data_consumo', selectedDate)
        .order('created_at', { ascending: false })

      if (selectedEmpresa) {
        query = query.eq('empresa_id', selectedEmpresa)
      }

      const { data, error } = await query

      if (error) throw error
      setConsumos(data || [])
    } catch (error) {
      console.error('Erro ao buscar consumos:', error)
    } finally {
      setLoading(false)
    }
  }

  // Encontre a função createConsumo e substitua por:
  async function createConsumo(
    empresaId: number, 
    tamanho: 'P' | 'M' | 'G', 
    quantidade: number,
    itensExtras: ItemExtra[],
    observacoes?: string
  ) {
    try {
      const empresa = empresas.find(e => e.id === empresaId)
      if (!empresa) throw new Error('Empresa não encontrada')
  
      // Usar a função assíncrona para buscar preços das configurações
      const { valorMarmitas, valorExtras, valorDesconto, valorTotal } = await calcularValorComDesconto(
        tamanho, 
        quantidade, 
        itensExtras, 
        empresa.desconto_percentual || 0
      )
  
      const { data, error } = await supabase
        .from('consumos')
        .insert({
          empresa_id: empresaId,
          responsavel: empresa.responsavel,
          data_consumo: selectedDate,
          tamanho,
          quantidade,
          preco: valorTotal, // Valor total já com desconto
          itens_extras: itensExtras,
          valor_extras: valorExtras,
          valor_desconto: valorDesconto,
          observacoes
        })
        .select(`
          *,
          empresa:empresas(nome, responsavel, desconto_percentual)
        `)
        .single()
  
      if (error) throw error
  
      setConsumos(prev => [data, ...prev])
  
      // Notificação de sucesso
      showSuccess(
        'Consumo Registrado!', 
        `${quantidade}x marmita ${tamanho} para ${empresa.nome}`,
        { label: 'Ver Consumos', url: '/consumos' }
      )
  
      return { success: true, data }
    } catch (error) {
      console.error('Erro ao criar consumo:', error)
      showError('Erro ao Registrar', 'Não foi possível registrar o consumo')
      return { success: false, error }
    }
  }

  async function deleteConsumo(id: number) {
    try {
      const { error } = await supabase
        .from('consumos')
        .delete()
        .eq('id', id)

      if (error) throw error

      setConsumos(prev => prev.filter(c => c.id !== id))
      return { success: true }
    } catch (error) {
      console.error('Erro ao deletar consumo:', error)
      return { success: false, error }
    }
  }

  async function updateConsumo(id: number, updates: Partial<Consumo>) {
    try {
      const { data, error } = await supabase
        .from('consumos')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          empresa:empresas(nome, responsavel)
        `)
        .single()

      if (error) throw error

      setConsumos(prev => prev.map(c => c.id === id ? data : c))
      return { success: true, data }
    } catch (error) {
      console.error('Erro ao atualizar consumo:', error)
      return { success: false, error }
    }
  }

  // Estatísticas do dia (atualizadas para considerar quantidade)
  const stats = {
    total: consumos.reduce((sum, c) => sum + (c.quantidade || 1), 0), // Total de marmitas
    totalP: consumos.filter(c => c.tamanho === 'P').reduce((sum, c) => sum + (c.quantidade || 1), 0),
    totalM: consumos.filter(c => c.tamanho === 'M').reduce((sum, c) => sum + (c.quantidade || 1), 0),
    totalG: consumos.filter(c => c.tamanho === 'G').reduce((sum, c) => sum + (c.quantidade || 1), 0),
    valorTotal: consumos.reduce((sum, c) => sum + (c.preco || 0), 0),
    valorExtras: consumos.reduce((sum, c) => sum + (c.valor_extras || 0), 0), // CORRIGIDO
    empresasAtendidas: new Set(consumos.map(c => c.empresa_id)).size,
    pedidos: consumos.length // Número de pedidos (diferentes de marmitas)
  }

  return {
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
    updateConsumo,
    refetch: fetchConsumos
  }
}