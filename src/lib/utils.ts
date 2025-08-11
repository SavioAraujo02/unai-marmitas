import { supabase } from './supabase'

export function cn(...inputs: (string | undefined | null | boolean)[]): string {
  return inputs.filter(Boolean).join(' ')
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

export function getMonthYear(date: Date = new Date()) {
  return {
    mes: date.getMonth() + 1,
    ano: date.getFullYear()
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'pendente': return 'bg-yellow-100 text-yellow-800'
    case 'enviado': return 'bg-blue-100 text-blue-800'
    case 'pago': return 'bg-green-100 text-green-800'
    case 'erro': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

// FUNÇÃO ATUALIZADA PARA BUSCAR PREÇOS DAS CONFIGURAÇÕES DO LOCALSTORAGE
export async function getPrecoMarmita(tamanho: 'P' | 'M' | 'G'): Promise<number> {
  try {
    // Buscar do localStorage onde as configurações estão sendo salvas
    const configSalvas = localStorage.getItem('unai-marmitas-config')
    if (configSalvas) {
      const config = JSON.parse(configSalvas)
      const chavePreco = `marmita_${tamanho.toLowerCase()}`
      const preco = config.precos?.[chavePreco]
      if (preco && preco > 0) {
        return preco
      }
    }
    
    // Fallback para preços padrão
    return getPrecoMarmitaFallback(tamanho)
  } catch (error) {
    console.error('Erro ao buscar preço:', error)
    return getPrecoMarmitaFallback(tamanho)
  }
}

// FUNÇÃO SÍNCRONA PARA BUSCAR PREÇOS DO LOCALSTORAGE
export function getPrecoMarmitaFromConfig(tamanho: 'P' | 'M' | 'G'): number {
  try {
    const configSalvas = localStorage.getItem('unai-marmitas-config')
    if (configSalvas) {
      const config = JSON.parse(configSalvas)
      const chavePreco = `marmita_${tamanho.toLowerCase()}`
      const preco = config.precos?.[chavePreco]
      if (preco && preco > 0) {
        return preco
      }
    }
    
    return getPrecoMarmitaFallback(tamanho)
  } catch (error) {
    console.error('Erro ao buscar preço:', error)
    return getPrecoMarmitaFallback(tamanho)
  }
}

// FUNÇÃO DE FALLBACK COM PREÇOS PADRÃO
export function getPrecoMarmitaFallback(tamanho: 'P' | 'M' | 'G'): number {
  switch (tamanho) {
    case 'P': return 15.00
    case 'M': return 18.00
    case 'G': return 22.00
    default: return 18.00
  }
}

// FUNÇÃO SÍNCRONA PARA COMPATIBILIDADE (usar apenas quando necessário)
export function getPrecoMarmitaSync(tamanho: 'P' | 'M' | 'G'): number {
  return getPrecoMarmitaFallback(tamanho)
}

// NOVA FUNÇÃO PARA CALCULAR VALOR COM DESCONTO (ASYNC)
export async function calcularValorComDesconto(
  tamanho: 'P' | 'M' | 'G', 
  quantidade: number, 
  itensExtras: { nome: string; preco: number; quantidade: number }[],
  descontoPercentual: number = 0
): Promise<{ valorMarmitas: number; valorExtras: number; valorDesconto: number; valorTotal: number }> {
  const precoMarmita = await getPrecoMarmita(tamanho)
  const valorMarmitas = precoMarmita * quantidade
  const valorExtras = itensExtras.reduce((sum, item) => sum + (item.preco * item.quantidade), 0)
  const subtotal = valorMarmitas + valorExtras
  const valorDesconto = (subtotal * descontoPercentual) / 100
  const valorTotal = subtotal - valorDesconto

  return {
    valorMarmitas,
    valorExtras,
    valorDesconto,
    valorTotal
  }
}

// FUNÇÃO SÍNCRONA PARA COMPATIBILIDADE (mantém a original)
export function calcularValorComDescontoSync(
  tamanho: 'P' | 'M' | 'G', 
  quantidade: number, 
  itensExtras: { nome: string; preco: number; quantidade: number }[],
  descontoPercentual: number = 0
): { valorMarmitas: number; valorExtras: number; valorDesconto: number; valorTotal: number } {
  const precoMarmita = getPrecoMarmitaSync(tamanho)
  const valorMarmitas = precoMarmita * quantidade
  const valorExtras = itensExtras.reduce((sum, item) => sum + (item.preco * item.quantidade), 0)
  const subtotal = valorMarmitas + valorExtras
  const valorDesconto = (subtotal * descontoPercentual) / 100
  const valorTotal = subtotal - valorDesconto

  return {
    valorMarmitas,
    valorExtras,
    valorDesconto,
    valorTotal
  }
}

// FUNÇÃO SÍNCRONA ATUALIZADA PARA USAR PREÇOS CARREGADOS
export function calcularValorComDescontoComPrecos(
  tamanho: 'P' | 'M' | 'G', 
  quantidade: number, 
  itensExtras: { nome: string; preco: number; quantidade: number }[],
  descontoPercentual: number = 0,
  precos: { P: number; M: number; G: number }
): { valorMarmitas: number; valorExtras: number; valorDesconto: number; valorTotal: number } {
  const precoMarmita = precos[tamanho]
  const valorMarmitas = precoMarmita * quantidade
  const valorExtras = itensExtras.reduce((sum, item) => sum + (item.preco * item.quantidade), 0)
  const subtotal = valorMarmitas + valorExtras
  const valorDesconto = (subtotal * descontoPercentual) / 100
  const valorTotal = subtotal - valorDesconto

  return {
    valorMarmitas,
    valorExtras,
    valorDesconto,
    valorTotal
  }
}