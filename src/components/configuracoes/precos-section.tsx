// src/components/configuracoes/precos-section.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

interface PrecosSectionProps {
  precos: {
    marmita_p: number
    marmita_m: number
    marmita_g: number
    taxa_adicional: number
  }
  onSave: (precos: any) => Promise<{ success: boolean }>
  saving: boolean
}

export function PrecosSection({ precos, onSave, saving }: PrecosSectionProps) {
  const [formData, setFormData] = useState(precos)

  async function handleSave() {
    const result = await onSave({ precos: formData })
    if (result.success) {
      alert('Preços atualizados com sucesso!')
    } else {
      alert('Erro ao salvar preços!')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>💰 Preços das Marmitas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Marmita Pequena (P)
            </label>
            <Input
              type="number"
              step="0.01"
              value={formData.marmita_p}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                marmita_p: parseFloat(e.target.value) || 0 
              }))}
              placeholder="15.00"
            />
            <p className="text-xs text-gray-500 mt-1">
              Atual: {formatCurrency(precos.marmita_p)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Marmita Média (M)
            </label>
            <Input
              type="number"
              step="0.01"
              value={formData.marmita_m}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                marmita_m: parseFloat(e.target.value) || 0 
              }))}
              placeholder="18.00"
            />
            <p className="text-xs text-gray-500 mt-1">
              Atual: {formatCurrency(precos.marmita_m)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Marmita Grande (G)
            </label>
            <Input
              type="number"
              step="0.01"
              value={formData.marmita_g}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                marmita_g: parseFloat(e.target.value) || 0 
              }))}
              placeholder="22.00"
            />
            <p className="text-xs text-gray-500 mt-1">
              Atual: {formatCurrency(precos.marmita_g)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Taxa Adicional
            </label>
            <Input
              type="number"
              step="0.01"
              value={formData.taxa_adicional}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                taxa_adicional: parseFloat(e.target.value) || 0 
              }))}
              placeholder="0.00"
            />
            <p className="text-xs text-gray-500 mt-1">
              Para custos extras (entrega, etc.)
            </p>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h4 className="font-medium text-yellow-800 mb-2">📊 Simulação de Preços:</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <p className="font-medium">Pequena</p>
              <p className="text-lg font-bold text-blue-600">
                {formatCurrency(formData.marmita_p + formData.taxa_adicional)}
              </p>
            </div>
            <div className="text-center">
              <p className="font-medium">Média</p>
              <p className="text-lg font-bold text-green-600">
                {formatCurrency(formData.marmita_m + formData.taxa_adicional)}
              </p>
            </div>
            <div className="text-center">
              <p className="font-medium">Grande</p>
              <p className="text-lg font-bold text-orange-600">
                {formatCurrency(formData.marmita_g + formData.taxa_adicional)}
              </p>
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? 'Salvando...' : 'Salvar Preços'}
        </Button>
      </CardContent>
    </Card>
  )
}