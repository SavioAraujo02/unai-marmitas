// src/components/dashboard/metric-card.tsx
import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: number
  icon: LucideIcon
  type?: 'number' | 'currency' | 'percentage'
  growth?: number
  suffix?: string
}

export function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  type = 'number',
  growth,
  suffix = ''
}: MetricCardProps) {
  const formatValue = () => {
    switch (type) {
      case 'currency':
        return formatCurrency(value)
      case 'percentage':
        return `${value.toFixed(1)}%`
      default:
        return value.toString() + suffix
    }
  }

  const growthColor = growth && growth > 0 ? 'text-green-600' : 'text-red-600'
  const growthIcon = growth && growth > 0 ? '↗️' : '↘️'

  return (
    <Card className="border-yellow-200 hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-800">{title}</p> {/* CORRIGIDO */}
            <p className="text-2xl font-bold text-gray-900">{formatValue()}</p>
            {growth !== undefined && (
              <p className={`text-sm ${growthColor} flex items-center mt-1`}>
                <span className="mr-1">{growthIcon}</span>
                {Math.abs(growth).toFixed(1)}% vs ontem
              </p>
            )}
          </div>
          <div className="p-3 bg-yellow-100 rounded-full">
            <Icon className="h-6 w-6 text-yellow-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}