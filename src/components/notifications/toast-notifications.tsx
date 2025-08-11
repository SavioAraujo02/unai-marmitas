// src/components/notifications/toast-notifications.tsx
'use client'

import { useNotifications, Notification } from '@/hooks/use-notifications'
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function ToastNotifications() {
  const { notifications, removeNotification } = useNotifications()

  // Mostrar apenas as 3 notificações mais recentes que são auto-close
  const toastNotifications = notifications
    .filter(n => n.autoClose)
    .slice(0, 3)

  function getToastIcon(type: Notification['type']) {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-600" />
    }
  }

  function getToastBgColor(type: Notification['type']) {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  if (toastNotifications.length === 0) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toastNotifications.map((notification) => (
        <Card
          key={notification.id}
          className={`w-80 p-4 shadow-lg border-l-4 ${getToastBgColor(notification.type)} animate-in slide-in-from-right duration-300`}
        >
          <div className="flex items-start space-x-3">
            <div className="mt-0.5">
              {getToastIcon(notification.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {notification.title}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {notification.message}
              </p>
              
              {notification.action && (
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto mt-2 text-xs"
                  onClick={() => {
                    window.location.href = notification.action!.url
                    removeNotification(notification.id)
                  }}
                >
                  {notification.action.label}
                </Button>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeNotification(notification.id)}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}