// src/hooks/use-envios.ts
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { EnvioDocumento, Fechamento } from '@/types'
import { getMonthYear } from '@/lib/utils'

export function useEnvios() {
  const [envios, setEnvios] = useState<EnvioDocumento[]>([])
  const [fechamentos, setFechamentos] = useState<Fechamento[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const { mes, ano } = getMonthYear()
    return { mes, ano }
  })
  const [statusFilter, setStatusFilter] = useState<'all' | 'pendente' | 'enviado' | 'erro'>('all')

  useEffect(() => {
    fetchEnvios()
  }, [selectedMonth, statusFilter])

  async function fetchEnvios() {
    try {
      setLoading(true)
      
      // Buscar fechamentos do mês com dados da empresa
      const { data: fechamentosData, error: fechamentosError } = await supabase
        .from('fechamentos')
        .select(`
          *,
          empresa:empresas(nome, responsavel, email, forma_pagamento)
        `)
        .eq('mes', selectedMonth.mes)
        .eq('ano', selectedMonth.ano)
        .order('empresa_id')

      if (fechamentosError) throw fechamentosError
      setFechamentos(fechamentosData || [])

      // Para cada fechamento, buscar ou criar registros de envio
      const enviosData = []
      
      for (const fechamento of fechamentosData || []) {
        // Buscar envios existentes
        const { data: enviosExistentes } = await supabase
          .from('envios_documentos')
          .select('*')
          .eq('fechamento_id', fechamento.id)

        // Se não existir, criar os 3 tipos de documento
        if (!enviosExistentes || enviosExistentes.length === 0) {
          const novosEnvios = [
            {
              fechamento_id: fechamento.id,
              tipo_documento: 'relatorio',
              status: 'pendente',
              tentativas: 0
            },
            {
              fechamento_id: fechamento.id,
              tipo_documento: 'cobranca',
              status: 'pendente',
              tentativas: 0
            },
            {
              fechamento_id: fechamento.id,
              tipo_documento: 'nota_fiscal',
              status: 'pendente',
              tentativas: 0
            }
          ]

          const { data: enviosCriados } = await supabase
            .from('envios_documentos')
            .insert(novosEnvios)
            .select('*')

          enviosData.push(...(enviosCriados || []))
        } else {
          enviosData.push(...enviosExistentes)
        }
      }

      // Adicionar dados do fechamento aos envios
      const enviosComDados = enviosData.map(envio => ({
        ...envio,
        fechamento: fechamentosData?.find(f => f.id === envio.fechamento_id)
      }))

      // Filtrar por status se necessário
      let enviosFiltrados = enviosComDados
      if (statusFilter !== 'all') {
        enviosFiltrados = enviosComDados.filter(envio => envio.status === statusFilter)
      }

      setEnvios(enviosFiltrados)
    } catch (error) {
      console.error('Erro ao buscar envios:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateEnvio(id: number, updates: {
    status?: 'pendente' | 'enviado' | 'erro'
    tentativas?: number
    data_envio?: string | null
    ultimo_erro?: string | null
    observacoes?: string
  }) {
    try {
      const { data, error } = await supabase
        .from('envios_documentos')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single()
  
      if (error) throw error
  
      setEnvios(prev => prev.map(envio => 
        envio.id === id ? { ...data, fechamento: envio.fechamento } : envio
      ))
  
      return { success: true, data }
    } catch (error) {
      console.error('Erro ao atualizar envio:', error)
      return { success: false, error }
    }
  }

  async function reenviarDocumento(id: number) {
    try {
      const envio = envios.find(e => e.id === id)
      if (!envio) throw new Error('Envio não encontrado')
  
      // Simular processo de envio
      const sucesso = Math.random() > 0.3 // 70% de chance de sucesso
  
      const updates = {
        status: sucesso ? ('enviado' as const) : ('erro' as const),
        tentativas: envio.tentativas + 1,
        data_envio: sucesso ? new Date().toISOString() : null,
        ultimo_erro: sucesso ? null : 'Erro simulado de conexão'
      }
  
      return await updateEnvio(id, updates)
    } catch (error) {
      console.error('Erro ao reenviar documento:', error)
      return { success: false, error }
    }
  }

  async function marcarComoEnviado(id: number) {
    return await updateEnvio(id, {
      status: 'enviado',
      data_envio: new Date().toISOString()
    })
  }
  
  async function adicionarObservacao(id: number, observacao: string) {
    return await updateEnvio(id, { 
      observacoes: observacao 
    })
  }

  // Agrupar envios por fechamento para exibição
  const enviosAgrupados = fechamentos.map(fechamento => {
    const enviosDoFechamento = envios.filter(e => e.fechamento_id === fechamento.id)
    
    const relatorio = enviosDoFechamento.find(e => e.tipo_documento === 'relatorio')
    const cobranca = enviosDoFechamento.find(e => e.tipo_documento === 'cobranca')
    const notaFiscal = enviosDoFechamento.find(e => e.tipo_documento === 'nota_fiscal')

    // Determinar status geral
    let statusGeral = 'completo'
    if (!relatorio || !cobranca || !notaFiscal) {
      statusGeral = 'pendente'
    } else if ([relatorio, cobranca, notaFiscal].some(e => e.status === 'erro')) {
      statusGeral = 'erro'
    } else if ([relatorio, cobranca, notaFiscal].some(e => e.status === 'pendente')) {
      statusGeral = 'parcial'
    } else if ([relatorio, cobranca, notaFiscal].every(e => e.status === 'enviado')) {
      statusGeral = 'completo'
    }

    return {
      fechamento,
      relatorio,
      cobranca,
      notaFiscal,
      statusGeral,
      observacoes: relatorio?.observacoes || cobranca?.observacoes || notaFiscal?.observacoes || ''
    }
  })

  // Estatísticas
  const stats = {
    total: enviosAgrupados.length,
    completos: enviosAgrupados.filter(e => e.statusGeral === 'completo').length,
    parciais: enviosAgrupados.filter(e => e.statusGeral === 'parcial').length,
    comErro: enviosAgrupados.filter(e => e.statusGeral === 'erro').length,
    pendentes: enviosAgrupados.filter(e => e.statusGeral === 'pendente').length
  }

  return {
    enviosAgrupados,
    loading,
    selectedMonth,
    setSelectedMonth,
    statusFilter,
    setStatusFilter,
    stats,
    updateEnvio,
    reenviarDocumento,
    marcarComoEnviado,
    adicionarObservacao,
    refetch: fetchEnvios
  }
}