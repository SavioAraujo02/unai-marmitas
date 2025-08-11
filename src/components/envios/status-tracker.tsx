// src/components/envios/status-tracker.tsx
import { EnvioDocumento } from '@/types'
import { formatDateTime } from '@/lib/utils'
import { CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react'

interface StatusTrackerProps {
  envio?: EnvioDocumento
  tipo: string
  nome: string
}

export function StatusTracker({ envio, tipo, nome }: StatusTrackerProps) {
  if (!envio) {
    return (
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">{nome}</span>
        </div>
        <span className="text-xs text-gray-500">Não criado</span>
      </div>
    )
  }

  const getStatusIcon = () => {
    switch (envio.status) {
      case 'enviado':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'erro':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'pendente':
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusColor = () => {
    switch (envio.status) {
      case 'enviado':
        return 'text-green-600'
      case 'erro':
        return 'text-red-600'
      case 'pendente':
      default:
        return 'text-yellow-600'
    }
  }

  const getStatusText = () => {
    switch (envio.status) {
      case 'enviado':
        return `✅ Enviado ${envio.data_envio ? `(${formatDateTime(envio.data_envio).split(' ')[1]})` : ''}`
      case 'erro':
        return `🔴 ERRO (${envio.tentativas} tentativas)`
      case 'pendente':
      default:
        return '🟡 Pendente'
    }
  }

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border-l-4 ${
      envio.status === 'enviado' ? 'bg-green-50 border-green-500' :
      envio.status === 'erro' ? 'bg-red-50 border-red-500' :
      'bg-yellow-50 border-yellow-500'
    }`}>
      <div className="flex items-center space-x-2">
        {getStatusIcon()}
        <span className="text-sm font-medium">{nome}</span>
      </div>
      <div className="text-right">
        <div className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </div>
        {envio.status === 'erro' && envio.ultimo_erro && (
          <div className="text-xs text-red-500 mt-1 max-w-xs truncate">
            ⚠️ {envio.ultimo_erro}
          </div>
        )}
      </div>
    </div>
  )
}