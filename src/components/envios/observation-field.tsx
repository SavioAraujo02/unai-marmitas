// src/components/envios/observation-field.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Save, Edit3 } from 'lucide-react'

interface ObservationFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function ObservationField({ value, onChange, placeholder }: ObservationFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [tempValue, setTempValue] = useState(value)

  function handleSave() {
    onChange(tempValue)
    setIsEditing(false)
  }

  function handleCancel() {
    setTempValue(value)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
        <div className="space-y-2">
        <textarea
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          placeholder={placeholder || "Adicione observações..."}
          className="w-full p-3 border border-yellow-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-sm"
          rows={3}
          autoFocus
        />
        <div className="flex space-x-2">
          <Button size="sm" onClick={handleSave}>
            <Save className="h-3 w-3 mr-1" />
            Salvar
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {value ? (
            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md border">
              {value}
            </p>
          ) : (
            <p className="text-sm text-gray-500 italic p-3 border border-dashed border-gray-300 rounded-md">
              {placeholder || "Clique para adicionar observações..."}
            </p>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsEditing(true)}
          className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Edit3 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}