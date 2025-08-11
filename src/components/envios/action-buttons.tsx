// src/components/envios/action-buttons.tsx
import { Button } from '@/components/ui/button'
import { EnvioDocumento } from '@/types'
import { RefreshCw, CheckCircle, MessageSquare, Phone } from 'lucide-react'

interface ActionButtonsProps {
  envio?: EnvioDocumento
  onReenviar: () => void
  onMarcarEnviado: () => void
  onAdicionarObservacao: () => void
  onLigar?: () => void
}

export function ActionButtons({ 
  envio, 
  onReenviar, 
  onMarcarEnviado, 
  onAdicionarObservacao,
  onLigar 
}: ActionButtonsProps) {
  if (!envio) return null

  return (
    <div className="flex flex-wrap gap-2">
      {envio.status === 'erro' && (
        <Button
          size="sm"
          variant="outline"
          onClick={onReenviar}
          className="text-blue-600 border-blue-300 hover:bg-blue-50"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Reenviar
        </Button>
      )}
      
      {envio.status === 'pendente' && (
        <Button
          size="sm"
          variant="outline"
          onClick={onMarcarEnviado}
          className="text-green-600 border-green-300 hover:bg-green-50"
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          Marcar Enviado
        </Button>
      )}

      <Button
        size="sm"
        variant="ghost"
        onClick={onAdicionarObservacao}
        className="text-gray-600 hover:bg-gray-50"
      >
        <MessageSquare className="h-3 w-3 mr-1" />
        Observação
      </Button>

      {onLigar && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onLigar}
          className="text-purple-600 hover:bg-purple-50"
        >
          <Phone className="h-3 w-3 mr-1" />
          Ligar
        </Button>
      )}
    </div>
  )
}