// src/hooks/use-empresas.ts
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Empresa } from '@/types'

export function useEmpresas() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'ativo' | 'inativo'>('all')

  useEffect(() => {
    fetchEmpresas()
  }, [])

  async function fetchEmpresas() {
    try {
      setLoading(true)
      let query = supabase
        .from('empresas')
        .select('*')
        .order('nome')

      if (statusFilter !== 'all') {
        query = query.eq('ativo', statusFilter === 'ativo')
      }

      const { data, error } = await query

      if (error) throw error
      setEmpresas(data || [])
    } catch (error) {
      console.error('Erro ao buscar empresas:', error)
    } finally {
      setLoading(false)
    }
  }

  async function createEmpresa(empresa: Omit<Empresa, 'id' | 'created_at'>): Promise<{ success: boolean; data?: Empresa; error?: unknown }> {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .insert(empresa)
        .select()
        .single()

      if (error) throw error
      
      setEmpresas(prev => [...prev, data])
      return { success: true, data }
    } catch (error) {
      console.error('Erro ao criar empresa:', error)
      return { success: false, error }
    }
  }

  async function updateEmpresa(id: number, updates: Partial<Empresa>): Promise<{ success: boolean; data?: Empresa; error?: unknown }> {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
  
      if (error) throw error
  
      setEmpresas(prev => prev.map(emp => emp.id === id ? data : emp))
      return { success: true, data }
    } catch (error) {
      console.error('Erro ao atualizar empresa:', error)
      return { success: false, error }
    }
  }

  async function deleteEmpresa(id: number): Promise<{ success: boolean; error?: unknown }> {
    try {
      const { error } = await supabase
        .from('empresas')
        .delete()
        .eq('id', id)
  
      if (error) throw error
  
      setEmpresas(prev => prev.filter(emp => emp.id !== id))
      return { success: true }
    } catch (error) {
      console.error('Erro ao deletar empresa:', error)
      return { success: false, error }
    }
  }
  
  async function toggleStatus(id: number): Promise<{ success: boolean; error?: unknown }> {
    const empresa = empresas.find(e => e.id === id)
    if (!empresa) return { success: false, error: 'Empresa não encontrada' }
  
    return updateEmpresa(id, { ativo: !empresa.ativo })
  }

  // Filtrar empresas baseado na busca
  const filteredEmpresas = empresas.filter(empresa => {
    const matchesSearch = empresa.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         empresa.responsavel.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (empresa.cnpj && empresa.cnpj.includes(searchTerm))
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'ativo' && empresa.ativo) ||
                         (statusFilter === 'inativo' && !empresa.ativo)

    return matchesSearch && matchesStatus
  })

  return {
    empresas: filteredEmpresas,
    loading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    createEmpresa,
    updateEmpresa,
    deleteEmpresa,
    toggleStatus,
    refetch: fetchEmpresas
  }
}