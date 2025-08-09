// ===== CONFIGURAÇÕES E CONSTANTES DO SISTEMA =====

// Configurações do Supabase
export const SUPABASE_CONFIG = {
    URL: 'https://eiguglyibkjvzedavune.supabase.co',
    KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpZ3VnbHlpYmtqdnplZGF2dW5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2ODQzOTQsImV4cCI6MjA3MDI2MDM5NH0.FLlsGaPEMw0MHVfvlzedqzgUovc4aOMttTpjSqfHj_0'
};

// Status possíveis dos controles
export const STATUS_TYPES = {
    PENDENTE: 'pendente',
    RELATORIO_ENVIADO: 'relatorio-enviado',
    PAGAMENTO_ENVIADO: 'pagamento-enviado',
    EMITINDO_NF: 'emitindo-nf',
    ERRO_NF: 'erro-nf',
    CONCLUIDO: 'concluido'
};

// Textos e ícones dos status
export const STATUS_CONFIG = {
    [STATUS_TYPES.PENDENTE]: { text: 'Pendente', icon: '⚪' },
    [STATUS_TYPES.RELATORIO_ENVIADO]: { text: 'Rel. Enviado', icon: '🔵' },
    [STATUS_TYPES.PAGAMENTO_ENVIADO]: { text: 'Pag. Enviado', icon: '🟡' },
    [STATUS_TYPES.EMITINDO_NF]: { text: 'Emitindo NF', icon: '🟠' },
    [STATUS_TYPES.ERRO_NF]: { text: 'Erro na NF', icon: '🔴' },
    [STATUS_TYPES.CONCLUIDO]: { text: 'Concluído', icon: '🟢' }
};

// Tamanhos de marmitas
export const MARMITA_SIZES = {
    P: 'P',
    M: 'M',
    G: 'G'
};

// Preços padrão das marmitas
export const DEFAULT_PRICES = {
    [MARMITA_SIZES.P]: 8.50,
    [MARMITA_SIZES.M]: 10.00,
    [MARMITA_SIZES.G]: 12.50
};

// Configurações de cache (em milissegundos)
export const CACHE_CONFIG = {
    DEFAULT_TTL: 5 * 60 * 1000, // 5 minutos
    LONG_TTL: 30 * 60 * 1000,   // 30 minutos
    SHORT_TTL: 1 * 60 * 1000    // 1 minuto
};

// Configurações de notificações
export const NOTIFICATION_CONFIG = {
    DURATION: {
        SUCCESS: 3000,
        ERROR: 5000,
        WARNING: 4000,
        INFO: 3000
    },
    MAX_VISIBLE: 3
};

// Nomes dos meses
export const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// Configurações de validação
export const VALIDATION_RULES = {
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE_REGEX: /^[\d\sKATEX_INLINE_OPENKATEX_INLINE_CLOSE\-\+]+$/,
    MIN_EMPRESA_NAME: 2,
    MAX_EMPRESA_NAME: 100
};

// Configurações de performance
export const PERFORMANCE_CONFIG = {
    DEBOUNCE_DELAY: 300,
    THROTTLE_DELAY: 250,
    ANIMATION_DURATION: 300,
    SLOW_OPERATION_THRESHOLD: 1000
};

// Chaves do localStorage
export const STORAGE_KEYS = {
    APP_STATE: 'unai-app-state',
    TEMPLATE_EMAIL: 'unai_template_email',
    USER_PREFERENCES: 'unai-user-preferences',
    CACHE_PREFIX: 'unai-cache-'
};

// Template padrão de email
export const DEFAULT_EMAIL_TEMPLATE = {
    assunto: 'Relatório Mensal - {EMPRESA} - {MES}/{ANO}',
    corpo: `Prezados {EMPRESA},

Segue o relatório de consumo do mês {MES}/{ANO}:

MARMITAS:
Pequenas: {QTD_P} x R$ {PRECO_P} = R$ {TOTAL_P}
Médias: {QTD_M} x R$ {PRECO_M} = R$ {TOTAL_M}
Grandes: {QTD_G} x R$ {PRECO_G} = R$ {TOTAL_G}

{EXTRAS_SECTION}

RESUMO:
Total Marmitas: {QTD_TOTAL} unidades = R$ {VALOR_MARMITAS}
{VALOR_EXTRAS_LINE}
VALOR TOTAL: R$ {VALOR_TOTAL}

Atenciosamente,
Unaí Marmitas`
};

// Variáveis disponíveis no template
export const TEMPLATE_VARIABLES = [
    { key: '{EMPRESA}', description: 'Nome da empresa' },
    { key: '{MES}', description: 'Nome do mês' },
    { key: '{ANO}', description: 'Ano' },
    { key: '{QTD_P}', description: 'Quantidade pequenas' },
    { key: '{QTD_M}', description: 'Quantidade médias' },
    { key: '{QTD_G}', description: 'Quantidade grandes' },
    { key: '{PRECO_P}', description: 'Preço pequena' },
    { key: '{PRECO_M}', description: 'Preço média' },
    { key: '{PRECO_G}', description: 'Preço grande' },
    { key: '{TOTAL_P}', description: 'Total pequenas' },
    { key: '{TOTAL_M}', description: 'Total médias' },
    { key: '{TOTAL_G}', description: 'Total grandes' },
    { key: '{QTD_TOTAL}', description: 'Total de marmitas' },
    { key: '{VALOR_MARMITAS}', description: 'Valor total marmitas' },
    { key: '{VALOR_EXTRAS}', description: 'Valor total extras' },
    { key: '{VALOR_TOTAL}', description: 'Valor total geral' },
    { key: '{EXTRAS_SECTION}', description: 'Seção de extras (automática)' },
    { key: '{VALOR_EXTRAS_LINE}', description: 'Linha de valor extras (automática)' }
];

// Configurações de filtros
export const FILTER_TYPES = {
    TODOS: 'todos',
    PENDENTES: 'pendentes',
    ERRO: 'erro',
    CONCLUIDOS: 'concluidos'
};

// Configurações de exportação
export const EXPORT_CONFIG = {
    FORMATS: {
        JSON: 'json',
        CSV: 'csv',
        PDF: 'pdf'
    },
    DATE_FORMAT: 'YYYY-MM-DD',
    FILENAME_PREFIX: 'unai-marmitas'
};