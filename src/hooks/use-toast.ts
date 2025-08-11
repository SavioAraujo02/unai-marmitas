// src/hooks/use-toast.ts
'use client'

import { useNotifications } from './use-notifications'

export function useToast() {
  const { showSuccess, showError, showWarning, showInfo } = useNotifications()

  const toast = {
    success: (title: string, message?: string, action?: { label: string; url: string }) => {
      showSuccess(title, message || '', action)
    },
    
    error: (title: string, message?: string, action?: { label: string; url: string }) => {
      showError(title, message || '', action)
    },
    
    warning: (title: string, message?: string, action?: { label: string; url: string }) => {
      showWarning(title, message || '', action)
    },
    
    info: (title: string, message?: string, action?: { label: string; url: string }) => {
      showInfo(title, message || '', action)
    },

    // Função para confirmação elegante
    confirm: (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
      return new Promise<boolean>((resolve) => {
        const confirmed = window.confirm(`${title}\n\n${message}`)
        if (confirmed) {
          onConfirm()
          resolve(true)
        } else {
          onCancel?.()
          resolve(false)
        }
      })
    }
  }

  return toast
}