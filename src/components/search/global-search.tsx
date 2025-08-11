// src/components/search/global-search.tsx
'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useGlobalSearch } from '@/hooks/use-global-search'
import { Search, X, Building2, Package, FileText, Loader2 } from 'lucide-react'

export function GlobalSearch() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const {
    query,
    setQuery,
    results,
    loading,
    isOpen,
    setIsOpen,
    clearSearch
  } = useGlobalSearch()

  // Atalho de teclado Ctrl+K
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault()
        setIsOpen(true)
        setTimeout(() => inputRef.current?.focus(), 100)
      }
      
      if (event.key === 'Escape') {
        setIsOpen(false)
        clearSearch()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [setIsOpen, clearSearch])

  function handleResultClick(result: any) {
    router.push(result.url)
    clearSearch()
  }

  function getResultIcon(type: string) {
    switch (type) {
      case 'empresa': return <Building2 className="h-4 w-4 text-blue-600" />
      case 'consumo': return <Package className="h-4 w-4 text-green-600" />
      case 'fechamento': return <FileText className="h-4 w-4 text-purple-600" />
      default: return <Search className="h-4 w-4 text-gray-600" />
    }
  }

  function getResultTypeLabel(type: string) {
    switch (type) {
      case 'empresa': return 'Empresa'
      case 'consumo': return 'Consumo'
      case 'fechamento': return 'Fechamento'
      default: return 'Item'
    }
  }

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="w-64 justify-start text-gray-500 hover:text-gray-700"
      >
        <Search className="h-4 w-4 mr-2" />
        Buscar... 
        <span className="ml-auto text-xs bg-gray-100 px-2 py-1 rounded">
          Ctrl+K
        </span>
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20">
      <Card className="w-full max-w-2xl mx-4 max-h-96 overflow-hidden">
        <CardContent className="p-0">
          {/* Campo de busca */}
          <div className="flex items-center p-4 border-b">
            <Search className="h-5 w-5 text-gray-400 mr-3" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar empresas, consumos, fechamentos..."
              className="border-0 focus:ring-0 text-lg"
              autoFocus
            />
            {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400 mr-2" />}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Resultados */}
          <div className="max-h-80 overflow-y-auto">
            {query.length < 2 ? (
              <div className="p-8 text-center text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Busca Global</p>
                <p className="text-sm">Digite pelo menos 2 caracteres para buscar</p>
                <div className="mt-4 text-xs">
                  <p>• Empresas por nome, responsável, CNPJ</p>
                  <p>• Consumos por responsável, observações</p>
                  <p>• Fechamentos por observações</p>
                </div>
              </div>
            ) : results.length === 0 && !loading ? (
              <div className="p-8 text-center text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Nenhum resultado encontrado</p>
                <p className="text-sm">Tente usar termos diferentes</p>
              </div>
            ) : (
              <div className="divide-y">
                {results.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}-${index}`}
                    onClick={() => handleResultClick(result)}
                    className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="mt-1">
                        {getResultIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {getResultTypeLabel(result.type)}
                          </span>
                        </div>
                        <p className="font-medium text-gray-900 truncate">
                          {result.title}
                        </p>
                        <p className="text-sm text-gray-600 truncate">
                          {result.subtitle}
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-1">
                          {result.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Rodapé com dicas */}
          {query.length >= 2 && (
            <div className="border-t p-3 bg-gray-50">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
                </span>
                <div className="flex space-x-4">
                  <span>↑↓ Navegar</span>
                  <span>Enter Abrir</span>
                  <span>Esc Fechar</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}