// src/app/configuracoes/page.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PrecosSection } from '@/components/configuracoes/precos-section'
import { AutomacaoSection } from '@/components/configuracoes/automacao-section'
import { IntegracaoSection } from '@/components/configuracoes/integracao-section'
import { useConfiguracoes } from '@/hooks/use-configuracoes'
import { useAuth } from '@/hooks/use-auth'
import { 
  Settings, 
  RefreshCw, 
  Download, 
  Upload,
  AlertTriangle,
  CheckCircle,
  Trash2
} from 'lucide-react'

type TabType = 'precos' | 'automacao' | 'integracao' | 'templates' | 'empresa'

export default function ConfiguracoesPage() {
  const { user } = useAuth()
  
  // Verificar se é admin
  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🚫</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Acesso Restrito</h2>
        <p className="text-gray-600">Apenas administradores podem acessar as configurações.</p>
      </div>
    )
  }
    const {
      configuracoes,
      loading,
      saving,
      salvarConfiguracoes,
      resetarConfiguracoes,
      testarIntegracao,
      refetch
    } = useConfiguracoes()
  
    const [activeTab, setActiveTab] = useState<TabType>('precos')
    const [templates, setTemplates] = useState(configuracoes.templates)
  
    const tabs = [
      { id: 'precos', name: '💰 Preços', icon: '💰' },
      { id: 'automacao', name: '🤖 Automação', icon: '🤖' },
      { id: 'integracao', name: '🔗 Integrações', icon: '🔗' },
      { id: 'templates', name: '📝 Templates', icon: '📝' },
      { id: 'empresa', name: '🏢 Empresa', icon: '🏢' }
    ]
  
    async function handleExportarConfig() {
      const dataStr = JSON.stringify(configuracoes, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'unai-marmitas-config.json'
      link.click()
      URL.revokeObjectURL(url)
    }
  
    async function handleImportarConfig(event: React.ChangeEvent<HTMLInputElement>) {
      const file = event.target.files?.[0]
      if (!file) return
  
      try {
        const text = await file.text()
        const config = JSON.parse(text)
        const result = await salvarConfiguracoes(config)
        if (result.success) {
          alert('Configurações importadas com sucesso!')
          refetch()
        } else {
          alert('Erro ao importar configurações!')
        }
      } catch (error) {
        alert('Arquivo inválido!')
      }
    }
  
    async function handleResetar() {
      if (confirm('Tem certeza que deseja resetar todas as configurações? Esta ação não pode ser desfeita.')) {
        const result = await resetarConfiguracoes()
        if (result.success) {
          alert('Configurações resetadas com sucesso!')
          setTemplates(configuracoes.templates)
        } else {
          alert('Erro ao resetar configurações!')
        }
      }
    }
  
    async function handleSalvarTemplates() {
      const result = await salvarConfiguracoes({ templates })
      if (result.success) {
        alert('Templates salvos com sucesso!')
      } else {
        alert('Erro ao salvar templates!')
      }
    }
  
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Carregando configurações...</div>
        </div>
      )
    }
  
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">⚙️ Configurações</h1>
            <p className="text-gray-600">Gerencie as configurações do sistema</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={refetch}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Recarregar
            </Button>
            <Button variant="outline" onClick={handleExportarConfig}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <label className="cursor-pointer">
            <span className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 h-10 px-4 py-2">
                <Upload className="h-4 w-4 mr-2" />
                Importar
            </span>
            <input
                type="file"
                accept=".json"
                onChange={handleImportarConfig}
                className="hidden"
            />
            </label>
          </div>
        </div>
  
        {/* Tabs */}
        <Card>
          <CardContent className="p-0">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-yellow-500 text-yellow-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>
          </CardContent>
        </Card>
  
        {/* Conteúdo das tabs */}
        <div className="space-y-6">
          {activeTab === 'precos' && (
            <PrecosSection
              precos={configuracoes.precos}
              onSave={salvarConfiguracoes}
              saving={saving}
            />
          )}
  
          {activeTab === 'automacao' && (
            <AutomacaoSection
              automacao={configuracoes.automacao}
              onSave={salvarConfiguracoes}
              saving={saving}
            />
          )}
  
          {activeTab === 'integracao' && (
            <IntegracaoSection
              integracao={configuracoes.integracao}
              onSave={salvarConfiguracoes}
              onTest={testarIntegracao}
              saving={saving}
            />
          )}
  
          {activeTab === 'templates' && (
            <Card>
              <CardHeader>
                <CardTitle>📝 Templates de Mensagens</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template de Email - Relatório
                  </label>
                  <textarea
                    value={templates.email_relatorio}
                    onChange={(e) => setTemplates(prev => ({ 
                      ...prev, 
                      email_relatorio: e.target.value 
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    rows={6}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Variáveis disponíveis: {'{nome_responsavel}'}, {'{mes}'}, {'{ano}'}, {'{total_marmitas}'}, {'{valor_total}'}
                  </p>
                </div>
  
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template de Email - Cobrança
                  </label>
                  <textarea
                    value={templates.email_cobranca}
                    onChange={(e) => setTemplates(prev => ({ 
                      ...prev, 
                      email_cobranca: e.target.value 
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    rows={6}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Variáveis disponíveis: {'{nome_responsavel}'}, {'{mes}'}, {'{ano}'}, {'{valor_total}'}, {'{data_vencimento}'}, {'{pix_chave}'}
                  </p>
                </div>
  
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template de WhatsApp - Cobrança
                  </label>
                  <textarea
                    value={templates.whatsapp_cobranca}
                    onChange={(e) => setTemplates(prev => ({ 
                      ...prev, 
                      whatsapp_cobranca: e.target.value 
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Variáveis disponíveis: {'{nome_responsavel}'}, {'{mes}'}, {'{ano}'}, {'{valor_total}'}, {'{total_marmitas}'}, {'{pix_chave}'}
                  </p>
                </div>
  
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template de SMS - Lembrete
                  </label>
                  <textarea
                    value={templates.sms_lembrete}
                    onChange={(e) => setTemplates(prev => ({ 
                      ...prev, 
                      sms_lembrete: e.target.value 
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Variáveis disponíveis: {'{dias_restantes}'}, {'{valor_total}'}, {'{pix_chave}'}
                  </p>
                </div>
  
                <Button onClick={handleSalvarTemplates} disabled={saving} className="w-full">
                  {saving ? 'Salvando...' : 'Salvar Templates'}
                </Button>
              </CardContent>
            </Card>
          )}
  
          {activeTab === 'empresa' && (
            <Card>
              <CardHeader>
                <CardTitle>🏢 Informações da Empresa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome da Empresa
                    </label>
                    <input
                      type="text"
                      value={configuracoes.empresa.nome}
                      onChange={(e) => {
                        const novaConfig = {
                          ...configuracoes,
                          empresa: { ...configuracoes.empresa, nome: e.target.value }
                        }
                        salvarConfiguracoes(novaConfig)
                      }}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      placeholder="Unaí Marmitas"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CNPJ
                    </label>
                    <input
                      type="text"
                      value={configuracoes.empresa.cnpj}
                      onChange={(e) => {
                        const novaConfig = {
                          ...configuracoes,
                          empresa: { ...configuracoes.empresa, cnpj: e.target.value }
                        }
                        salvarConfiguracoes(novaConfig)
                      }}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Endereço
                    </label>
                    <input
                      type="text"
                      value={configuracoes.empresa.endereco}
                      onChange={(e) => {
                        const novaConfig = {
                          ...configuracoes,
                          empresa: { ...configuracoes.empresa, endereco: e.target.value }
                        }
                        salvarConfiguracoes(novaConfig)
                      }}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      placeholder="Rua, número, bairro, cidade"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone
                    </label>
                    <input
                      type="text"
                      value={configuracoes.empresa.telefone}
                      onChange={(e) => {
                        const novaConfig = {
                          ...configuracoes,
                          empresa: { ...configuracoes.empresa, telefone: e.target.value }
                        }
                        salvarConfiguracoes(novaConfig)
                      }}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      placeholder="(34) 99999-9999"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={configuracoes.empresa.email}
                      onChange={(e) => {
                        const novaConfig = {
                          ...configuracoes,
                          empresa: { ...configuracoes.empresa, email: e.target.value }
                        }
                        salvarConfiguracoes(novaConfig)
                      }}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      placeholder="contato@unaimarmitas.com.br"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
  
        {/* Zona de perigo */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Zona de Perigo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-red-800">Resetar Todas as Configurações</h3>
                <p className="text-sm text-red-700 mt-1">
                  Esta ação irá restaurar todas as configurações para os valores padrão. 
                  Esta ação não pode ser desfeita.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleResetar}
                className="border-red-300 text-red-700 hover:bg-red-100"
                disabled={saving}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Resetar Tudo
              </Button>
            </div>
          </CardContent>
        </Card>
  
        {/* Status das configurações */}
        <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-800 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            Status das Configurações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl mb-2">💰</div>
              <p className="text-sm font-medium text-green-800">Preços</p>
              <p className="text-xs text-green-600">Configurado</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">
                {configuracoes.automacao.fechar_automaticamente ? '🤖' : '⚠️'}
              </div>
              <p className="text-sm font-medium text-green-800">Automação</p>
              <p className="text-xs text-green-600">
                {configuracoes.automacao.fechar_automaticamente ? 'Ativa' : 'Parcial'}
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">
                {configuracoes.integracao.email_smtp_host ? '📧' : '⚠️'}
              </div>
              <p className="text-sm font-medium text-green-800">Email</p>
              <p className="text-xs text-green-600">
                {configuracoes.integracao.email_smtp_host ? 'Configurado' : 'Pendente'}
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">
                {configuracoes.integracao.whatsapp_token ? '📱' : '⚠️'}
              </div>
              <p className="text-sm font-medium text-green-800">WhatsApp</p>
              <p className="text-xs text-green-600">
                {configuracoes.integracao.whatsapp_token ? 'Configurado' : 'Pendente'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}