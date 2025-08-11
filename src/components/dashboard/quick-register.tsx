// src/components/dashboard/quick-register.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { Empresa } from '@/types'
import { getPrecoMarmita, getTodayString } from '@/lib/utils'

interface QuickRegisterProps {
  onSuccess?: () => void
}

export function QuickRegister({ onSuccess }: QuickRegisterProps) {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [selectedEmpresa, setSelectedEmpresa] = useState<number | null>(null)
  const [selectedTamanho, setSelectedTamanho] = useState<'P' | 'M' | 'G'>('M')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchEmpresas()
  }, [])

  async function fetchEmpresas() {
    const { data } = await supabase
      .from('empresas')
      .select('*')
      .eq('ativo', true)
      .order('nome')
    
    setEmpresas(data || [])
  }

  async function handleRegister() {
    if (!selectedEmpresa) return

    try {
      setLoading(true)
      
      const empresa = empresas.find(e => e.id === selectedEmpresa)
      const preco = getPrecoMarmita(selectedTamanho)

      const { error } = await supabase
        .from('consumos')
        .insert({
          empresa_id: selectedEmpresa,
          responsavel: empresa?.responsavel,
          data_consumo: getTodayString(),
          tamanho: selectedTamanho,
          preco
        })

      if (error) throw error

      // Reset form
      setSelectedEmpresa(null)
      setSelectedTamanho('M')
      
      onSuccess?.()
      
      alert('Marmita registrada com sucesso!')
    } catch (error) {
      console.error('Erro ao registrar:', error)
      alert('Erro ao registrar marmita')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>🍱 Registro Rápido</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Empresa
            </label>
            <select
              value={selectedEmpresa || ''}
              onChange={(e) => setSelectedEmpresa(Number(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Selecione uma empresa...</option>
              {empresas.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nome} - {empresa.responsavel}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tamanho da Marmita
            </label>
            <div className="flex space-x-2">
              {(['P', 'M', 'G'] as const).map((tamanho) => (
                <button
                  key={tamanho}
                  onClick={() => setSelectedTamanho(tamanho)}
                  className={`flex-1 p-3 rounded-md border-2 transition-colors ${
                    selectedTamanho === tamanho
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="font-semibold">{tamanho}</div>
                  <div className="text-sm text-gray-600">
                    R$ {getPrecoMarmita(tamanho).toFixed(2)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleRegister}
            disabled={!selectedEmpresa || loading}
            className="w-full"
          >
            {loading ? 'Registrando...' : 'Registrar Marmita'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}