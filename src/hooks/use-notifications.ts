// src/hooks/use-notifications.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface Notification {
  id: string
  type: 'success' | 'warning' | 'error' | 'info'
  title: string
  message: string
  timestamp: Date
  read: boolean
  action?: {
    label: string
    url: string
  }
  autoClose?: boolean
  duration?: number
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Adicionar nova notificação
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false,
      autoClose: notification.autoClose ?? true,
      duration: notification.duration ?? 5000
    }

    setNotifications(prev => [newNotification, ...prev])
    setUnreadCount(prev => prev + 1)

    // Auto-close se configurado
    if (newNotification.autoClose) {
      setTimeout(() => {
        removeNotification(newNotification.id)
      }, newNotification.duration)
    }

    return newNotification.id
  }, [])

  // Remover notificação
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id)
      if (notification && !notification.read) {
        setUnreadCount(count => Math.max(0, count - 1))
      }
      return prev.filter(n => n.id !== id)
    })
  }, [])

  // Marcar como lida
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => {
      if (n.id === id && !n.read) {
        setUnreadCount(count => Math.max(0, count - 1))
        return { ...n, read: true }
      }
      return n
    }))
  }, [])

  // Marcar todas como lidas
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }, [])

  // Limpar todas
  const clearAll = useCallback(() => {
    setNotifications([])
    setUnreadCount(0)
  }, [])

  // Verificar alertas automáticos
  const checkAutomaticAlerts = useCallback(async () => {
    try {
      const hoje = new Date()
      const primeiroDiaProximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1)
      const ultimoDiaMes = new Date(primeiroDiaProximoMes.getTime() - 1)
      
      // Verificar se estamos próximos do fim do mês (últimos 3 dias)
      const diasRestantes = Math.ceil((ultimoDiaMes.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diasRestantes <= 3 && diasRestantes > 0) {
        // Verificar empresas sem fechamento
        const { data: empresasSemFechamento } = await supabase
          .from('empresas')
          .select(`
            id, nome,
            fechamentos!left(id)
          `)
          .eq('ativo', true)
          .is('fechamentos.id', null)

        if (empresasSemFechamento && empresasSemFechamento.length > 0) {
          addNotification({
            type: 'warning',
            title: 'Fechamento Mensal Pendente',
            message: `${empresasSemFechamento.length} empresa(s) sem fechamento. Restam ${diasRestantes} dias para o fim do mês.`,
            action: {
              label: 'Ver Fechamentos',
              url: '/fechamentos'
            },
            autoClose: false
          })
        }
      }

      // Verificar envios com erro
      const { data: enviosComErro } = await supabase
        .from('envios_documentos')
        .select(`
          id,
          fechamento:fechamentos(
            empresa:empresas(nome)
          )
        `)
        .eq('status', 'erro')
        .gte('tentativas', 3)

      if (enviosComErro && enviosComErro.length > 0) {
        addNotification({
          type: 'error',
          title: 'Envios com Erro',
          message: `${enviosComErro.length} documento(s) falharam após múltiplas tentativas.`,
          action: {
            label: 'Resolver Envios',
            url: '/envios'
          },
          autoClose: false
        })
      }

      // Verificar consumos do dia
      const { data: consumosHoje } = await supabase
        .from('consumos')
        .select('id')
        .eq('data_consumo', hoje.toISOString().split('T')[0])

      const totalHoje = consumosHoje?.length || 0
      
      // Se for depois das 14h e não houve consumos, alertar
      if (hoje.getHours() >= 14 && totalHoje === 0) {
        addNotification({
          type: 'info',
          title: 'Nenhum Consumo Hoje',
          message: 'Ainda não foram registrados consumos para hoje.',
          action: {
            label: 'Registrar Consumo',
            url: '/consumos'
          }
        })
      }

    } catch (error) {
      console.error('Erro ao verificar alertas:', error)
    }
  }, [addNotification])

  // Verificar alertas a cada 5 minutos
  useEffect(() => {
    checkAutomaticAlerts() // Verificar imediatamente
    
    const interval = setInterval(checkAutomaticAlerts, 5 * 60 * 1000) // 5 minutos
    
    return () => clearInterval(interval)
  }, [checkAutomaticAlerts])

  // Funções de conveniência para diferentes tipos
  const showSuccess = useCallback((title: string, message: string, action?: Notification['action']) => {
    return addNotification({ type: 'success', title, message, action })
  }, [addNotification])

  const showWarning = useCallback((title: string, message: string, action?: Notification['action']) => {
    return addNotification({ type: 'warning', title, message, action, autoClose: false })
  }, [addNotification])

  const showError = useCallback((title: string, message: string, action?: Notification['action']) => {
    return addNotification({ type: 'error', title, message, action, autoClose: false })
  }, [addNotification])

  const showInfo = useCallback((title: string, message: string, action?: Notification['action']) => {
    return addNotification({ type: 'info', title, message, action })
  }, [addNotification])

  return {
    notifications,
    unreadCount,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    showSuccess,
    showWarning,
    showError,
    showInfo
  }
}