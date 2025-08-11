// src/components/dashboard/stats-cards.tsx
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, Package, DollarSign, Building2, ShoppingCart, Plus } from 'lucide-react'

interface StatsCardsProps {
  stats: {
    total: number
    totalP: number
    totalM: number
    totalG: number
    valorTotal: number
    valorExtras: number
    empresasAtendidas: number
    pedidos: number
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Marmitas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500 mt-1">
                P: {stats.totalP} • M: {stats.totalM} • G: {stats.totalG}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Valor Total</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.valorTotal)}</p>
              <p className="text-xs text-gray-500 mt-1">
                Média: {formatCurrency(stats.total > 0 ? stats.valorTotal / stats.total : 0)}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pedidos</p>
              <p className="text-2xl font-bold text-purple-600">{stats.pedidos}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.empresasAtendidas} empresas
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-full">
              <ShoppingCart className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Extras</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats.valorExtras)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.valorTotal > 0 ? ((stats.valorExtras / stats.valorTotal) * 100).toFixed(1) : '0.0'}% do total
              </p>
            </div>
            <div className="p-3 bg-orange-50 rounded-full">
              <Plus className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}