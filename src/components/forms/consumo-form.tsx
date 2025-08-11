'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Empresa, ItemExtra } from '@/types'
import { getPrecoMarmitaFromConfig, calcularValorComDescontoComPrecos } from '@/lib/utils'
import { Plus, Minus, X, Trash2 } from 'lucide-react'

interface ConsumoFormProps {
  empresas: Empresa[]
  onSubmit: (
    empresaId: number, 
    tamanho: 'P' | 'M' | 'G', 
    quantidade: number,
    itensExtras: ItemExtra[],
    observacoes?: string
  ) => Promise<{ success: boolean }>
  selectedDate: string
}

export function ConsumoForm({ empresas, onSubmit, selectedDate }: ConsumoFormProps) {
  const [selectedEmpresa, setSelectedEmpresa] = useState<number | null>(null)
  const [selectedTamanho, setSelectedTamanho] = useState<'P' | 'M' | 'G'>('M')
  const [quantidade, setQuantidade] = useState(1)
  const [itensExtras, setItensExtras] = useState<ItemExtra[]>([])
  const [novoItem, setNovoItem] = useState({ nome: '', preco: 0, quantidade: 1 })
  const [observacoes, setObservacoes] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Estado para preços carregados das configurações
const [precos, setPrecos] = useState({ P: 15, M: 18, G: 22 })
const [precosLoading, setPrecosLoading] = useState(true)

// Carregar preços das configurações
useEffect(() => {
  function carregarPrecos() {
    try {
      setPrecosLoading(true)
      // Usar função síncrona que busca do localStorage
      const precoP = getPrecoMarmitaFromConfig('P')
      const precoM = getPrecoMarmitaFromConfig('M')
      const precoG = getPrecoMarmitaFromConfig('G')
      setPrecos({ P: precoP, M: precoM, G: precoG })
    } catch (error) {
      console.error('Erro ao carregar preços:', error)
      // Manter preços padrão em caso de erro
    } finally {
      setPrecosLoading(false)
    }
  }
  carregarPrecos()
}, [])

  const empresaSelecionada = empresas.find(e => e.id === selectedEmpresa)
  const descontoPercentual = empresaSelecionada?.desconto_percentual || 0
  
  // Usar função com preços carregados para cálculos em tempo real na interface
  const { valorMarmitas, valorExtras, valorDesconto, valorTotal } = calcularValorComDescontoComPrecos(
    selectedTamanho, 
    quantidade, 
    itensExtras, 
    descontoPercentual,
    precos
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!selectedEmpresa) {
      alert('Selecione uma empresa!')
      return
    }

    if (quantidade < 1) {
      alert('Quantidade deve ser pelo menos 1!')
      return
    }

    try {
      setLoading(true)
      const result = await onSubmit(selectedEmpresa, selectedTamanho, quantidade, itensExtras, observacoes)
      
      if (result.success) {
        // Reset form
        setSelectedEmpresa(null)
        setSelectedTamanho('M')
        setQuantidade(1)
        setItensExtras([])
        setNovoItem({ nome: '', preco: 0, quantidade: 1 })
        setObservacoes('')
      }
    } catch (error) {
      alert('Erro ao registrar consumo!')
    } finally {
      setLoading(false)
    }
  }

  function adicionarItemPersonalizado() {
    if (!novoItem.nome || novoItem.preco <= 0) {
      alert('Preencha o nome e preço do item!')
      return
    }

    setItensExtras(prev => [...prev, { ...novoItem }])
    setNovoItem({ nome: '', preco: 0, quantidade: 1 })
  }

  function alterarQuantidadeExtra(index: number, novaQuantidade: number) {
    if (novaQuantidade <= 0) {
      setItensExtras(prev => prev.filter((_, i) => i !== index))
    } else {
      setItensExtras(prev => 
        prev.map((item, i) => 
          i === index ? { ...item, quantidade: novaQuantidade } : item
        )
      )
    }
  }

  function removerItemExtra(index: number) {
    setItensExtras(prev => prev.filter((_, i) => i !== index))
  }

  if (precosLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-lg text-gray-600">Carregando preços...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>🍱 Registrar Consumo</CardTitle>
        <p className="text-sm text-gray-600">
          Data: {new Date(selectedDate).toLocaleDateString('pt-BR')}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Empresa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Empresa *
            </label>
            <select
              value={selectedEmpresa || ''}
              onChange={(e) => setSelectedEmpresa(Number(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              required
            >
              <option value="">Selecione uma empresa...</option>
              {empresas.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nome} - {empresa.responsavel}
                  {empresa.desconto_percentual > 0 && ` (${empresa.desconto_percentual}% desconto)`}
                </option>
              ))}
            </select>
            {empresaSelecionada && (
              <div className="mt-2 p-2 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Responsável:</strong> {empresaSelecionada.responsavel}
                  {empresaSelecionada.contato && ` • ${empresaSelecionada.contato}`}
                </p>
                {empresaSelecionada.desconto_percentual > 0 && (
                  <p className="text-sm text-green-600 font-medium">
                    🎉 Desconto de {empresaSelecionada.desconto_percentual}% aplicado!
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Tamanho e Quantidade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Marmitas *
            </label>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {(['P', 'M', 'G'] as const).map((tamanho) => (
                <button
                  key={tamanho}
                  type="button"
                  onClick={() => setSelectedTamanho(tamanho)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedTamanho === tamanho
                      ? 'border-yellow-500 bg-yellow-50 text-yellow-700 shadow-md'
                      : 'border-gray-300 hover:border-yellow-300 hover:bg-yellow-50'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold">{tamanho}</div>
                    <div className="text-sm text-gray-600">
                      R$ {precos[tamanho].toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {tamanho === 'P' && 'Pequena'}
                      {tamanho === 'M' && 'Média'}
                      {tamanho === 'G' && 'Grande'}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Quantidade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantidade
              </label>
              <div className="flex items-center space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                  disabled={quantidade <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={quantidade}
                  onChange={(e) => setQuantidade(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 text-center"
                  min="1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantidade(quantidade + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600">
                = R$ {(precos[selectedTamanho] * quantidade).toFixed(2)}
              </span>
              </div>
            </div>
          </div>

          {/* Itens Extras Personalizados */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Itens Extras (opcional)
            </label>
            
            {/* Adicionar novo item */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
              <h4 className="font-medium text-gray-700 mb-3">➕ Adicionar Item Extra:</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <Input
                    placeholder="Nome do item (ex: Coca-Cola, Sobremesa...)"
                    value={novoItem.nome}
                    onChange={(e) => setNovoItem(prev => ({ ...prev, nome: e.target.value }))}
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Preço"
                    value={novoItem.preco || ''}
                    onChange={(e) => setNovoItem(prev => ({ 
                      ...prev, 
                      preco: parseFloat(e.target.value) || 0 
                    }))}
                  />
                </div>
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    min="1"
                    value={novoItem.quantidade}
                    onChange={(e) => setNovoItem(prev => ({ 
                      ...prev, 
                      quantidade: parseInt(e.target.value) || 1 
                    }))}
                    className="w-16"
                  />
                  <Button
                    type="button"
                    onClick={adicionarItemPersonalizado}
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Itens selecionados */}
            {itensExtras.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-700 mb-2">Itens Selecionados:</h4>
                <div className="space-y-2">
                  {itensExtras.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md"
                    >
                      <div>
                        <span className="font-medium">{item.nome}</span>
                        <span className="text-sm text-gray-600 ml-2">
                          R$ {item.preco.toFixed(2)} x {item.quantidade} = R$ {(item.preco * item.quantidade).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => alterarQuantidadeExtra(index, item.quantidade - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm">{item.quantidade}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => alterarQuantidadeExtra(index, item.quantidade + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removerItemExtra(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações (opcional)
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Sem cebola, extra salada..."
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              rows={3}
            />
          </div>

          {/* Resumo do Pedido */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-700 mb-2">📋 Resumo do Pedido:</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>{quantidade}x Marmita {selectedTamanho}</span>
                <span>R$ {(precos[selectedTamanho] * quantidade).toFixed(2)}</span>
              </div>
              {itensExtras.map((item, index) => (
                <div key={index} className="flex justify-between text-gray-600">
                  <span>{item.quantidade}x {item.nome}</span>
                  <span>R$ {(item.preco * item.quantidade).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>R$ {(precos[selectedTamanho] * quantidade + valorExtras).toFixed(2)}</span>
                </div>
                {descontoPercentual > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto ({descontoPercentual}%):</span>
                    <span>- R$ {valorDesconto.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-1">
                  <span>Total:</span>
                  <span className="text-green-600">R$ {valorTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Botão de Submit */}
          <Button
            type="submit"
            disabled={!selectedEmpresa || loading}
            className="w-full"
            size="lg"
          >
            {loading ? 'Registrando...' : `Registrar Pedido - R$ ${valorTotal.toFixed(2)}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}