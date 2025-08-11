// src/hooks/use-global-search.ts
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Empresa, Consumo, Fechamento } from '@/types'

interface SearchResult {
  type: 'empresa' | 'consumo' | 'fechamento'
  id: number
  title: string
  subtitle: string
  description: string
  url: string
  data: any
}

export function useGlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (query.length >= 2) {
      performSearch(query)
    } else {
      setResults([])
    }
  }, [query])

  async function performSearch(searchQuery: string) {
    try {
      setLoading(true)
      const searchResults: SearchResult[] = []

      // Buscar empresas
      const { data: empresas } = await supabase
        .from('empresas')
        .select('*')
        .or(`nome.ilike.%${searchQuery}%,responsavel.ilike.%${searchQuery}%,cnpj.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .limit(5)

      empresas?.forEach(empresa => {
        searchResults.push({
          type: 'empresa',
          id: empresa.id,
          title: empresa.nome,
          subtitle: `Responsável: ${empresa.responsavel}`,
          description: empresa.cnpj ? `CNPJ: ${empresa.cnpj}` : 'Empresa cadastrada',
          url: `/empresas`,
          data: empresa
        })
      })

      // Buscar consumos recentes
      const { data: consumos } = await supabase
        .from('consumos')
        .select(`
          *,
          empresa:empresas(nome, responsavel)
        `)
        .or(`responsavel.ilike.%${searchQuery}%,observacoes.ilike.%${searchQuery}%`)
        .order('created_at', { ascending: false })
        .limit(5)

      consumos?.forEach(consumo => {
        searchResults.push({
          type: 'consumo',
          id: consumo.id,
          title: `${consumo.empresa?.nome || 'Empresa'} - ${consumo.quantidade}x ${consumo.tamanho}`,
          subtitle: `${new Date(consumo.data_consumo).toLocaleDateString('pt-BR')} - ${consumo.responsavel}`,
          description: `R$ ${consumo.preco.toFixed(2)}${consumo.observacoes ? ` - ${consumo.observacoes}` : ''}`,
          url: `/consumos`,
          data: consumo
        })
      })

      // Buscar fechamentos
      const { data: fechamentos } = await supabase
        .from('fechamentos')
        .select(`
          *,
          empresa:empresas(nome, responsavel)
        `)
        .or(`observacoes.ilike.%${searchQuery}%`)
        .order('created_at', { ascending: false })
        .limit(3)

      fechamentos?.forEach(fechamento => {
        searchResults.push({
          type: 'fechamento',
          id: fechamento.id,
          title: `Fechamento - ${fechamento.empresa?.nome}`,
          subtitle: `${fechamento.mes}/${fechamento.ano} - ${fechamento.status}`,
          description: `R$ ${fechamento.valor_total.toFixed(2)} - ${fechamento.total_p + fechamento.total_m + fechamento.total_g} marmitas`,
          url: `/fechamentos`,
          data: fechamento
        })
      })

      setResults(searchResults)
    } catch (error) {
      console.error('Erro na busca:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  function clearSearch() {
    setQuery('')
    setResults([])
    setIsOpen(false)
  }

  return {
    query,
    setQuery,
    results,
    loading,
    isOpen,
    setIsOpen,
    clearSearch
  }
}