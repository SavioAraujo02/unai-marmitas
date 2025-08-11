// src/components/forms/empresa-form.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Empresa } from '@/types'

interface EmpresaFormProps {
  empresa?: Empresa
  onSubmit: (data: Omit<Empresa, 'id' | 'created_at'>) => Promise<{ success: boolean }>
  onCancel: () => void
  title: string
}

export function EmpresaForm({ empresa, onSubmit, onCancel, title }: EmpresaFormProps) {
  const [formData, setFormData] = useState({
    nome: empresa?.nome || '',
    cnpj: empresa?.cnpj || '',
    endereco: empresa?.endereco || '',
    responsavel: empresa?.responsavel || '',
    contato: empresa?.contato || '',
    email: empresa?.email || '',
    forma_pagamento: empresa?.forma_pagamento || 'boleto' as const,
    desconto_percentual: empresa?.desconto_percentual || 0, // NOVO
    ativo: empresa?.ativo ?? true
  })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!formData.nome || !formData.responsavel) {
      alert('Nome da empresa e responsável são obrigatórios!')
      return
    }

    try {
      setLoading(true)
      const result = await onSubmit(formData)
      
      if (result.success) {
        alert(empresa ? 'Empresa atualizada com sucesso!' : 'Empresa criada com sucesso!')
        onCancel()
      } else {
        alert('Erro ao salvar empresa!')
      }
    } catch (error) {
      alert('Erro ao salvar empresa!')
    } finally {
      setLoading(false)
    }
  }

  function formatCNPJ(value: string) {
    const numbers = value.replace(/\D/g, '')
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }

  function formatPhone(value: string) {
    const numbers = value.replace(/\D/g, '')
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Empresa *
              </label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Ex: Construtora ABC Ltda"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CNPJ
              </label>
              <Input
                value={formData.cnpj}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  cnpj: formatCNPJ(e.target.value) 
                }))}
                placeholder="00.000.000/0000-00"
                maxLength={18}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Endereço
            </label>
            <Input
              value={formData.endereco}
              onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
              placeholder="Rua, número, bairro, cidade"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Responsável *
              </label>
              <Input
                value={formData.responsavel}
                onChange={(e) => setFormData(prev => ({ ...prev, responsavel: e.target.value }))}
                placeholder="Nome do responsável"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contato
              </label>
              <Input
                value={formData.contato}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  contato: formatPhone(e.target.value) 
                }))}
                placeholder="(34) 99999-9999"
                maxLength={15}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="contato@empresa.com.br"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Forma de Pagamento
              </label>
              <select
                value={formData.forma_pagamento}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  forma_pagamento: e.target.value as 'boleto' | 'pix' | 'transferencia'
                }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="boleto">Boleto</option>
                <option value="pix">PIX</option>
                <option value="transferencia">Transferência</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Desconto (%)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.desconto_percentual || 0}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  desconto_percentual: parseFloat(e.target.value) || 0 
                }))}
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                Desconto percentual aplicado automaticamente
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="ativo"
              checked={formData.ativo}
              onChange={(e) => setFormData(prev => ({ ...prev, ativo: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="ativo" className="text-sm font-medium text-gray-700">
              Empresa ativa
            </label>
          </div>

          <div className="flex space-x-4 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}