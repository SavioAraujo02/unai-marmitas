// src/hooks/use-fechamentos.ts
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Fechamento, Empresa } from '@/types'
import { getMonthYear } from '@/lib/utils'

export function useFechamentos() {
  const [fechamentos, setFechamentos] = useState<Fechamento[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const { mes, ano } = getMonthYear()
    return { mes, ano }
  })

  useEffect(() => {
    fetchFechamentos()
  }, [selectedMonth])

  async function fetchFechamentos() {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('fechamentos')
        .select(`
          *,
          empresa:empresas(nome, responsavel, forma_pagamento)
        `)
        .eq('mes', selectedMonth.mes)
        .eq('ano', selectedMonth.ano)
        .order('empresa_id')

      if (error) throw error
      setFechamentos(data || [])
    } catch (error) {
      console.error('Erro ao buscar fechamentos:', error)
    } finally {
      setLoading(false)
    }
  }

  async function gerarFechamentoAutomatico() {
    try {
      setLoading(true)

      // Buscar todas as empresas ativas
      const { data: empresas, error: empresasError } = await supabase
        .from('empresas')
        .select('*')
        .eq('ativo', true)

      if (empresasError) throw empresasError

      // Para cada empresa, calcular consumo do mês
      const fechamentosParaInserir = []

      for (const empresa of empresas || []) {
        // Buscar consumos da empresa no mês
        const { data: consumos, error: consumosError } = await supabase
          .from('consumos')
          .select('*')
          .eq('empresa_id', empresa.id)
          .gte('data_consumo', `${selectedMonth.ano}-${selectedMonth.mes.toString().padStart(2, '0')}-01`)
          .lt('data_consumo', `${selectedMonth.ano}-${(selectedMonth.mes + 1).toString().padStart(2, '0')}-01`)

        if (consumosError) throw consumosError

        if (consumos && consumos.length > 0) {
          // Calcular totais
          const totalP = consumos.filter(c => c.tamanho === 'P').reduce((sum, c) => sum + c.quantidade, 0)
          const totalM = consumos.filter(c => c.tamanho === 'M').reduce((sum, c) => sum + c.quantidade, 0)
          const totalG = consumos.filter(c => c.tamanho === 'G').reduce((sum, c) => sum + c.quantidade, 0)
          const valorTotal = consumos.reduce((sum, c) => sum + c.preco, 0)

          fechamentosParaInserir.push({
            empresa_id: empresa.id,
            mes: selectedMonth.mes,
            ano: selectedMonth.ano,
            total_p: totalP,
            total_m: totalM,
            total_g: totalG,
            valor_total: valorTotal,
            status: 'pendente',
            data_fechamento: new Date().toISOString().split('T')[0]
          })
        }
      }

      // Inserir fechamentos
      if (fechamentosParaInserir.length > 0) {
        const { error: insertError } = await supabase
          .from('fechamentos')
          .upsert(fechamentosParaInserir, {
            onConflict: 'empresa_id,mes,ano'
          })

        if (insertError) throw insertError
      }

      await fetchFechamentos()
      return { success: true, count: fechamentosParaInserir.length }
    } catch (error: unknown) {
      const getErrorMessage = (err: unknown): string => {
        if (err instanceof Error) {
          return err.message
        }
        if (typeof err === 'string') {
          return err
        }
        if (err && typeof err === 'object' && 'message' in err) {
          return String((err as any).message)
        }
        return 'Erro ao gerar fechamentos'
      }

      console.error('Erro ao gerar fechamentos:', error)
      return { success: false, error: getErrorMessage(error) }
    } finally {
      setLoading(false)
    }
  }

  async function updateFechamento(id: number, updates: Partial<Fechamento>) {
    try {
      console.log('🔄 Atualizando fechamento:', { id, updates }) // Debug
      
      // Verificar se os dados estão corretos
      if (!id || typeof id !== 'number') {
        throw new Error('ID inválido fornecido para updateFechamento')
      }
      
      if (!updates || Object.keys(updates).length === 0) {
        throw new Error('Nenhuma atualização fornecida')
      }
      
      const { data, error } = await supabase
        .from('fechamentos')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          empresa:empresas(nome, responsavel, forma_pagamento)
        `)
        .single()

      if (error) {
        console.error('❌ Erro do Supabase:', error)
        throw error
      }

      console.log('✅ Fechamento atualizado com sucesso:', data) // Debug
      
      setFechamentos(prev => prev.map(f => f.id === id ? data : f))
      return { success: true, data }
    } catch (error: unknown) {
      // Função helper para extrair mensagem de erro seguramente
      const getErrorMessage = (err: unknown): string => {
        if (err instanceof Error) {
          return err.message
        }
        if (typeof err === 'string') {
          return err
        }
        if (err && typeof err === 'object' && 'message' in err) {
          return String((err as any).message)
        }
        if (err && typeof err === 'object') {
          return JSON.stringify(err)
        }
        return 'Erro desconhecido'
      }

      const errorMessage = getErrorMessage(error)
      
      console.error('❌ Erro ao atualizar fechamento:', {
        error: error,
        message: errorMessage,
        type: typeof error,
        isError: error instanceof Error
      })
      
      return { 
        success: false, 
        error: errorMessage
      }
    }
  }

  async function deleteFechamento(id: number) {
    try {
      // Primeiro, verificar se existem envios relacionados
      const { data: envios, error: enviosError } = await supabase
        .from('envios_documentos')
        .select('id')
        .eq('fechamento_id', id)
  
      if (enviosError) throw enviosError
  
      // Se existem envios, deletar primeiro
      if (envios && envios.length > 0) {
        const { error: deleteEnviosError } = await supabase
          .from('envios_documentos')
          .delete()
          .eq('fechamento_id', id)
  
        if (deleteEnviosError) throw deleteEnviosError
      }
  
      // Agora deletar o fechamento
      const { error } = await supabase
        .from('fechamentos')
        .delete()
        .eq('id', id)
  
      if (error) throw error
  
      setFechamentos(prev => prev.filter(f => f.id !== id))
      return { success: true }
    } catch (error: unknown) {
      const getErrorMessage = (err: unknown): string => {
        if (err instanceof Error) {
          return err.message
        }
        if (typeof err === 'string') {
          return err
        }
        if (err && typeof err === 'object' && 'message' in err) {
          return String((err as any).message)
        }
        return 'Erro ao deletar fechamento'
      }

      console.error('Erro ao deletar fechamento:', error)
      return { success: false, error: getErrorMessage(error) }
    }
  }

  // Estatísticas do mês
  const stats = {
    totalEmpresas: fechamentos.length,
    totalFaturamento: fechamentos.reduce((sum, f) => sum + f.valor_total, 0),
    totalMarmitas: fechamentos.reduce((sum, f) => sum + f.total_p + f.total_m + f.total_g, 0),
    pendentes: fechamentos.filter(f => f.status === 'pendente').length,
    relatorioEnviado: fechamentos.filter(f => f.status === 'relatorio_enviado').length,
    nfPendente: fechamentos.filter(f => f.status === 'nf_pendente').length,
    nfEnviada: fechamentos.filter(f => f.status === 'nf_enviada').length,
    pagamentoPendente: fechamentos.filter(f => f.status === 'pagamento_pendente').length,
    concluidos: fechamentos.filter(f => f.status === 'concluido').length,
    comErroRelatorio: fechamentos.filter(f => f.status === 'erro_relatorio').length,
    comErroNF: fechamentos.filter(f => f.status === 'erro_nf').length,
    comErroPagamento: fechamentos.filter(f => f.status === 'erro_pagamento').length,
    // Totais agrupados para compatibilidade
    enviados: fechamentos.filter(f => ['relatorio_enviado', 'nf_pendente', 'nf_enviada', 'pagamento_pendente'].includes(f.status)).length,
    pagos: fechamentos.filter(f => f.status === 'concluido').length,
    comErro: fechamentos.filter(f => f.status.includes('erro')).length
  }

  return {
    fechamentos,
    loading,
    selectedMonth,
    setSelectedMonth,
    stats,
    gerarFechamentoAutomatico,
    updateFechamento,
    deleteFechamento,
    refetch: fetchFechamentos
  }
}