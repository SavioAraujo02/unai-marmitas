// src/components/notifications/notification-center.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useNotifications, Notification } from '@/hooks/use-notifications'
import { 
  Bell, 
  X, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Info,
  Check,
  Trash2,
  ExternalLink
} from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

export function NotificationCenter() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const {
    notifications,
    unreadCount,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll
  } = useNotifications()

  function getNotificationIcon(type: Notification['type']) {
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

  function getNotificationBgColor(type: Notification['type']) {
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

  function handleNotificationClick(notification: Notification) {
    if (!notification.read) {
      markAsRead(notification.id)
    }
    
    if (notification.action) {
      router.push(notification.action.url)
      setIsOpen(false)
    }
  }

  function handleMarkAsRead(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    markAsRead(id)
  }

  function handleRemove(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    removeNotification(id)
  }

  return (
    <div className="relative">
      {/* Botão do sino */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Painel de notificações */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Painel */}
          <Card className="absolute right-0 top-12 w-96 max-h-96 z-50 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Notificações</CardTitle>
                <div className="flex space-x-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Marcar todas
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAll}
                    className="text-xs"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Limpar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-600">
                  {unreadCount} não lida{unreadCount !== 1 ? 's' : ''}
                </p>
              )}
            </CardHeader>
            
            <CardContent className="p-0 max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="font-medium">Nenhuma notificação</p>
                  <p className="text-sm">Você está em dia! 🎉</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className={`text-sm font-medium ${
                              !notification.read ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </p>
                            <div className="flex items-center space-x-1">
                              {!notification.read && (
                                <button
                                  onClick={(e) => handleMarkAsRead(e, notification.id)}
                                  className="text-blue-600 hover:text-blue-800"
                                  title="Marcar como lida"
                                >
                                  <Check className="h-3 w-3" />
                                </button>
                              )}
                              <button
                                onClick={(e) => handleRemove(e, notification.id)}
                                className="text-gray-400 hover:text-gray-600"
                                title="Remover"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500">
                              {formatDateTime(notification.timestamp)}
                            </p>
                            
                            {notification.action && (
                              <div className="flex items-center text-xs text-blue-600 hover:text-blue-800">
                                <span>{notification.action.label}</span>
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}