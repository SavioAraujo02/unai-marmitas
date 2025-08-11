// src/components/charts/top-empresas-chart.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

interface TopEmpresasChartProps {
  data: { nome: string; valor: number; marmitas: number }[]
}

export function TopEmpresasChart({ data }: TopEmpresasChartProps) {
  const maxValor = Math.max(...data.map(d => d.valor))

  const medalhas = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣']

  return (
    <Card>
      <CardHeader>
        <CardTitle>🏆 Top 5 Empresas do Mês</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((empresa, index) => (
            <div key={empresa.nome} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{medalhas[index]}</span>
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {empresa.nome}
                    </span>
                    <div className="text-xs text-gray-500">
                      {empresa.marmitas} marmitas
                    </div>
                  </div>
                </div>
                <span className="text-sm font-bold text-green-600">
                  {formatCurrency(empresa.valor)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                    index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-500' :
                    index === 2 ? 'bg-gradient-to-r from-yellow-600 to-yellow-800' :
                    'bg-gradient-to-r from-blue-400 to-blue-600'
                  }`}
                  style={{ 
                    width: `${maxValor > 0 ? (empresa.valor / maxValor) * 100 : 0}%` 
                  }}
                ></div>
              </div>
            </div>
          ))}
          
          {data.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📊</div>
              <p>Nenhum dado disponível para este período</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}