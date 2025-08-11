// src/hooks/use-pdf-reports.ts
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PDFGenerator } from '@/lib/pdf-generator'
import { Fechamento, Consumo } from '@/types'

export function usePDFReports() {
  const [loading, setLoading] = useState(false)

  async function gerarRelatorioEmpresa(
    empresaId: number, 
    mes: number, 
    ano: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      setLoading(true)

      // Buscar dados da empresa
      const { data: empresa, error: empresaError } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', empresaId)
        .single()

      if (empresaError) throw empresaError

      // Buscar fechamento
      const { data: fechamento, error: fechamentoError } = await supabase
        .from('fechamentos')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('mes', mes)
        .eq('ano', ano)
        .single()

      if (fechamentoError) throw fechamentoError

      // Buscar consumos do período
      const { data: consumos, error: consumosError } = await supabase
        .from('consumos')
        .select('*')
        .eq('empresa_id', empresaId)
        .gte('data_consumo', `${ano}-${mes.toString().padStart(2, '0')}-01`)
        .lt('data_consumo', `${ano}-${(mes + 1).toString().padStart(2, '0')}-01`)
        .order('data_consumo')

      if (consumosError) throw consumosError

      // Gerar PDF
      const pdfGenerator = new PDFGenerator()
      const pdfBlob = await pdfGenerator.gerarRelatorioMensal({
        empresa,
        fechamento,
        consumos: consumos || [],
        periodo: { mes, ano }
      })

      // Download do arquivo
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `relatorio_${empresa.nome.replace(/\s+/g, '_')}_${mes}_${ano}.pdf`
      link.click()
      URL.revokeObjectURL(url)

      return { success: true }
    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
      return { success: false, error: 'Erro ao gerar relatório PDF' }
    } finally {
      setLoading(false)
    }
  }

  async function gerarRelatorioConsolidado(
    mes: number, 
    ano: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      setLoading(true)

      // Buscar todos os fechamentos do período
      const { data: fechamentos, error: fechamentosError } = await supabase
        .from('fechamentos')
        .select(`
          *,
          empresa:empresas(nome, responsavel)
        `)
        .eq('mes', mes)
        .eq('ano', ano)
        .order('valor_total', { ascending: false })

      if (fechamentosError) throw fechamentosError

      if (!fechamentos || fechamentos.length === 0) {
        return { success: false, error: 'Nenhum fechamento encontrado para este período' }
      }

      // Gerar PDF
      const pdfGenerator = new PDFGenerator()
      const pdfBlob = await pdfGenerator.gerarRelatorioConsolidado(
        fechamentos,
        { mes, ano }
      )

      // Download do arquivo
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `relatorio_consolidado_${mes}_${ano}.pdf`
      link.click()
      URL.revokeObjectURL(url)

      return { success: true }
    } catch (error) {
      console.error('Erro ao gerar relatório consolidado:', error)
      return { success: false, error: 'Erro ao gerar relatório consolidado' }
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    gerarRelatorioEmpresa,
    gerarRelatorioConsolidado
  }
}