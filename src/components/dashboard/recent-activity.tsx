// src/components/dashboard/recent-activity.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Consumo } from '@/types'
import { formatCurrency, formatDateTime } from '@/lib/utils'

interface RecentActivityProps {
  consumos: Consumo[]
}

export function RecentActivity({ consumos }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>📋 Últimos Registros</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {consumos.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Nenhum registro hoje ainda
            </p>
          ) : (
            consumos.map((consumo) => (
              <div
                key={consumo.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {consumo.empresa?.nome || 'Empresa não encontrada'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {consumo.responsavel} • {formatDateTime(consumo.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    Tamanho {consumo.tamanho}
                  </p>
                  <p className="text-sm text-green-600">
                    {formatCurrency(consumo.preco)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}