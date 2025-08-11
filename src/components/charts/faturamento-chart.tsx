// src/components/charts/faturamento-chart.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

interface FaturamentoChartProps {
  data: { mes: string; valor: number }[]
}

export function FaturamentoChart({ data }: FaturamentoChartProps) {
  const maxValor = Math.max(...data.map(d => d.valor))

  return (
    <Card>
      <CardHeader>
        <CardTitle>📈 Evolução do Faturamento</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">{item.mes}</span>
                <span className="text-sm font-bold text-green-600">
                  {formatCurrency(item.valor)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-3 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${maxValor > 0 ? (item.valor / maxValor) * 100 : 0}%` 
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}