// src/lib/utils.ts
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

export function getPrecoMarmita(tamanho: 'P' | 'M' | 'G'): number {
  switch (tamanho) {
    case 'P': return 15.00
    case 'M': return 18.00
    case 'G': return 22.00
    default: return 18.00
  }
}

// NOVA FUNÇÃO PARA CALCULAR VALOR COM DESCONTO
export function calcularValorComDesconto(
  tamanho: 'P' | 'M' | 'G', 
  quantidade: number, 
  itensExtras: { nome: string; preco: number; quantidade: number }[],
  descontoPercentual: number = 0
): { valorMarmitas: number; valorExtras: number; valorDesconto: number; valorTotal: number } {
  const precoMarmita = getPrecoMarmita(tamanho)
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