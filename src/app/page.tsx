// src/app/page.tsx - DASHBOARD ORIGINAL
'use client'

import { TrendingUp, Building2, AlertTriangle, Users } from 'lucide-react'
import { MetricCard } from '@/components/dashboard/metric-card'
import { QuickRegister } from '@/components/dashboard/quick-register'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { useDashboard } from '@/hooks/use-dashboard'

export default function Dashboard() {
  const { stats, recentConsumos, loading, refetch } = useDashboard()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Carregando dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Visão geral do sistema Unaí Marmitas
        </p>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Marmitas Hoje"
          value={stats.marmitasHoje}
          icon={TrendingUp}
          growth={stats.crescimentoHoje}
          suffix=" unidades"
        />
        <MetricCard
          title="Faturamento Mês"
          value={stats.faturamentoMes}
          icon={TrendingUp}
          type="currency"
          growth={stats.crescimentoMes}
        />
        <MetricCard
          title="Empresas Pendentes"
          value={stats.empresasPendentes}
          icon={AlertTriangle}
          suffix=" empresas"
        />
        <MetricCard
          title="Empresas Ativas"
          value={stats.empresasAtivas}
          icon={Building2}
          suffix=" empresas"
        />
      </div>

      {/* Conteúdo principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registro rápido */}
        <QuickRegister onSuccess={refetch} />
        
        {/* Atividade recente */}
        <RecentActivity consumos={recentConsumos} />
      </div>

      {/* Alertas importantes */}
      {stats.empresasPendentes > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Atenção: {stats.empresasPendentes} empresa(s) com pendências
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Verifique a seção de Envios para resolver os problemas.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}