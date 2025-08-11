// src/components/charts/consumo-chart.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

interface ConsumoChartProps {
  data: { tamanho: string; quantidade: number; valor: number }[]
}

export function ConsumoChart({ data }: ConsumoChartProps) {
  const total = data.reduce((sum, item) => sum + item.quantidade, 0)

  const cores = {
    P: 'bg-blue-500',
    M: 'bg-green-500',
    G: 'bg-orange-500'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>🍱 Distribuição por Tamanho</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Gráfico de pizza simples */}
          <div className="flex justify-center">
            <div className="relative w-32 h-32">
              {data.map((item, index) => {
                const percentage = total > 0 ? (item.quantidade / total) * 100 : 0
                return (
                  <div
                    key={item.tamanho}
                    className={`absolute inset-0 rounded-full ${cores[item.tamanho as keyof typeof cores]} opacity-80`}
                    style={{
                      clipPath: `polygon(50% 50%, 50% 0%, ${50 + percentage * 0.5}% 0%, 50% 50%)`
                    }}
                  />
                )
              })}
              <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-gray-700">{total}</span>
              </div>
            </div>
          </div>

          {/* Legenda */}
          <div className="space-y-3">
            {data.map((item) => (
              <div key={item.tamanho} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded ${cores[item.tamanho as keyof typeof cores]}`}></div>
                  <span className="text-sm font-medium">
                    Tamanho {item.tamanho}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">{item.quantidade} unidades</div>
                  <div className="text-xs text-gray-500">{formatCurrency(item.valor)}</div>
                  <div className="text-xs text-gray-400">
                    {total > 0 ? ((item.quantidade / total) * 100).toFixed(1) : 0}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}