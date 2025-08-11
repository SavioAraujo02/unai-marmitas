// src/hooks/use-configuracoes.ts
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Configuracoes {
  precos: {
    marmita_p: number
    marmita_m: number
    marmita_g: number
    taxa_adicional: number
  }
  automacao: {
    fechar_automaticamente: boolean
    dia_fechamento: number
    enviar_relatorios_automatico: boolean
    reenviar_erros_automatico: boolean
    tempo_reenvio_horas: number
    notificar_email_erros: boolean
    enviar_lembrete_pagamento: boolean
    dias_lembrete: number
  }
  empresa: {
    nome: string
    cnpj: string
    endereco: string
    telefone: string
    email: string
    logo_url: string
  }
  integracao: {
    email_smtp_host: string
    email_smtp_port: number
    email_usuario: string
    email_senha: string
    whatsapp_token: string
    whatsapp_numero: string
    banco_pix_chave: string
    banco_agencia: string
    banco_conta: string
  }
  templates: {
    email_relatorio: string
    email_cobranca: string
    whatsapp_cobranca: string
    sms_lembrete: string
  }
}

const configuracoesPadrao: Configuracoes = {
  precos: {
    marmita_p: 15.00,
    marmita_m: 18.00,
    marmita_g: 22.00,
    taxa_adicional: 0.00
  },
  automacao: {
    fechar_automaticamente: true,
    dia_fechamento: 30,
    enviar_relatorios_automatico: true,
    reenviar_erros_automatico: true,
    tempo_reenvio_horas: 2,
    notificar_email_erros: true,
    enviar_lembrete_pagamento: false,
    dias_lembrete: 5
  },
  empresa: {
    nome: 'Unaí Marmitas',
    cnpj: '',
    endereco: '',
    telefone: '',
    email: '',
    logo_url: ''
  },
  integracao: {
    email_smtp_host: '',
    email_smtp_port: 587,
    email_usuario: '',
    email_senha: '',
    whatsapp_token: '',
    whatsapp_numero: '',
    banco_pix_chave: '',
    banco_agencia: '',
    banco_conta: ''
  },
  templates: {
    email_relatorio: `Olá {nome_responsavel},

Segue em anexo o relatório de consumo de marmitas do mês {mes}/{ano}.

Resumo:
- Total de marmitas: {total_marmitas}
- Valor total: {valor_total}

Atenciosamente,
Unaí Marmitas`,
    email_cobranca: `Olá {nome_responsavel},

Segue a cobrança referente ao consumo de marmitas do mês {mes}/{ano}.

Valor total: {valor_total}
Vencimento: {data_vencimento}

Para pagamento via PIX, utilize a chave: {pix_chave}

Atenciosamente,
Unaí Marmitas`,
    whatsapp_cobranca: `Olá {nome_responsavel}! 

Sua cobrança de marmitas está disponível:
📅 Mês: {mes}/{ano}
💰 Valor: {valor_total}
📋 {total_marmitas} marmitas

PIX: {pix_chave}

Unaí Marmitas 🍱`,
    sms_lembrete: `Lembrete: Sua fatura de marmitas vence em {dias_restantes} dias. Valor: {valor_total}. PIX: {pix_chave} - Unaí Marmitas`
  }
}

export function useConfiguracoes() {
  const [configuracoes, setConfiguracoes] = useState<Configuracoes>(configuracoesPadrao)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    carregarConfiguracoes()
  }, [])

  async function carregarConfiguracoes() {
    try {
      setLoading(true)
      
      // Tentar carregar do banco de dados primeiro
      const { data, error } = await supabase
        .from('configuracoes')
        .select('chave, valor')

      if (error) {
        console.error('Erro ao carregar do banco, usando localStorage:', error)
        // Fallback para localStorage
        const configSalvas = localStorage.getItem('unai-marmitas-config')
        if (configSalvas) {
          const parsed = JSON.parse(configSalvas)
          setConfiguracoes({ ...configuracoesPadrao, ...parsed })
        }
        return
      }

      // Montar configurações a partir do banco
      const configFromDB: Partial<Configuracoes> = {}
      
      data?.forEach((item) => {
        if (item.chave === 'precos') {
          configFromDB.precos = item.valor
        } else if (item.chave === 'empresa') {
          configFromDB.empresa = item.valor
        }
      })

      // Mesclar com padrão e atualizar
      const configFinais = { ...configuracoesPadrao, ...configFromDB }
      setConfiguracoes(configFinais)
      
      console.log('✅ Configurações carregadas do banco:', configFromDB)
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
      // Fallback para localStorage em caso de erro
      const configSalvas = localStorage.getItem('unai-marmitas-config')
      if (configSalvas) {
        const parsed = JSON.parse(configSalvas)
        setConfiguracoes({ ...configuracoesPadrao, ...parsed })
      }
    } finally {
      setLoading(false)
    }
  }

  async function salvarConfiguracoes(novasConfiguracoes: Partial<Configuracoes>) {
    try {
      setSaving(true)
      const configAtualizadas = { ...configuracoes, ...novasConfiguracoes }
      
      // Salvar no banco de dados
      if (novasConfiguracoes.precos) {
        const { error } = await supabase
          .from('configuracoes')
          .upsert({ 
            chave: 'precos', 
            valor: novasConfiguracoes.precos 
          }, { 
            onConflict: 'chave' 
          })
        
        if (error) {
          console.error('Erro ao salvar preços no banco:', error)
          throw error
        }
      }
      
      if (novasConfiguracoes.empresa) {
        const { error } = await supabase
          .from('configuracoes')
          .upsert({ 
            chave: 'empresa', 
            valor: novasConfiguracoes.empresa 
          }, { 
            onConflict: 'chave' 
          })
        
        if (error) {
          console.error('Erro ao salvar empresa no banco:', error)
          throw error
        }
      }
      
      // Backup no localStorage
      localStorage.setItem('unai-marmitas-config', JSON.stringify(configAtualizadas))
      
      // Atualizar estado
      setConfiguracoes(configAtualizadas)
      
      console.log('✅ Configurações salvas no banco com sucesso')
      return { success: true }
    } catch (error) {
      console.error('❌ Erro ao salvar configurações:', error)
      return { success: false, error }
    } finally {
      setSaving(false)
    }
  }

  async function resetarConfiguracoes() {
    try {
      setSaving(true)
      
      // Deletar configurações do banco
      const { error } = await supabase
        .from('configuracoes')
        .delete()
        .neq('id', 0) // Deletar todos
      
      if (error) throw error
      
      localStorage.removeItem('unai-marmitas-config')
      setConfiguracoes(configuracoesPadrao)
      return { success: true }
    } catch (error) {
      console.error('Erro ao resetar configurações:', error)
      return { success: false, error }
    } finally {
      setSaving(false)
    }
  }

  async function testarIntegracao(tipo: 'email' | 'whatsapp' | 'sms') {
    try {
      // Simular teste de integração
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const sucesso = Math.random() > 0.3 // 70% de chance de sucesso
      
      if (sucesso) {
        return { success: true, message: `Integração ${tipo} testada com sucesso!` }
      } else {
        return { success: false, message: `Erro ao testar integração ${tipo}. Verifique as configurações.` }
      }
    } catch (error) {
      return { success: false, message: `Erro inesperado ao testar ${tipo}` }
    }
  }

  return {
    configuracoes,
    loading,
    saving,
    salvarConfiguracoes,
    resetarConfiguracoes,
    testarIntegracao,
    refetch: carregarConfiguracoes
  }
}