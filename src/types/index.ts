// src/types/index.ts
export interface Empresa {
  id: number;
  nome: string;
  cnpj?: string;
  endereco?: string;
  responsavel: string;
  contato?: string;
  email?: string;
  forma_pagamento: 'boleto' | 'pix' | 'transferencia';
  desconto_percentual: number; // NOVO
  ativo: boolean;
  created_at: string;
}

export interface ItemExtra {
  nome: string;
  preco: number;
  quantidade: number;
}

export interface Consumo {
  id: number;
  empresa_id: number;
  responsavel?: string;
  data_consumo: string;
  tamanho: 'P' | 'M' | 'G';
  quantidade: number;
  preco: number;
  itens_extras: ItemExtra[];
  valor_extras: number;
  valor_desconto: number; // NOVO
  observacoes?: string;
  created_at: string;
  empresa?: Empresa;
}

// Resto dos tipos permanece igual...
export interface Fechamento {
  id: number;
  empresa_id: number;
  mes: number;
  ano: number;
  total_p: number;
  total_m: number;
  total_g: number;
  valor_total: number;
  status: 'pendente' | 'enviado' | 'pago' | 'erro';
  data_fechamento?: string;
  observacoes?: string;
  empresa?: Empresa;
}

export interface EnvioDocumento {
  id: number;
  fechamento_id: number;
  tipo_documento: 'relatorio' | 'cobranca' | 'nota_fiscal';
  status: 'pendente' | 'enviado' | 'erro';
  tentativas: number;
  ultimo_erro?: string;
  data_envio?: string;
  observacoes?: string;
  fechamento?: Fechamento;
}

export interface DashboardStats {
  marmitasHoje: number;
  faturamentoMes: number;
  empresasPendentes: number;
  empresasAtivas: number;
  crescimentoHoje: number;
  crescimentoMes: number;
}

// Tipos de usuário e autenticação
export interface User {
  id: string
  email: string
  nome: string
  role: 'admin' | 'gerente' | 'operador'
  ativo: boolean
  ultimo_acesso?: string
  created_at: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  nome: string
  role: 'admin' | 'gerente' | 'operador'
}