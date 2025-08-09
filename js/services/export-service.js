// ===== SERVIÇO DE EXPORTAÇÃO =====

import { formatCurrency, formatDateBR, formatPeriod } from '../utils/formatters.js';
import { errorHandler } from '../core/error-handler.js';
import { performanceMonitor } from '../core/performance-monitor.js';
import { EXPORT_CONFIG } from '../config/constants.js';

class ExportService {
    constructor() {
        this.supabase = null;
    }
    
    /**
     * Inicializar serviço
     */
    init(supabaseClient) {
        this.supabase = supabaseClient;
        console.log('✅ ExportService inicializado');
    }
    
    /**
     * Exportar dados completos do período
     */
    async exportPeriodData(period, format = 'json') {
        return performanceMonitor.measureAsync('export:periodData', async () => {
            try {
                // Buscar dados do período
                const [empresas, controles, precos] = await Promise.all([
                    this.getEmpresasData(),
                    this.getControlesData(period),
                    this.getPrecosData()
                ]);
                
                const exportData = {
                    period,
                    periodText: formatPeriod(period),
                    exportedAt: new Date().toISOString(),
                    summary: this.generateSummary(controles, precos),
                    empresas,
                    controles,
                    precos
                };
                
                switch (format.toLowerCase()) {
                    case 'csv':
                        return this.exportToCSV(exportData);
                    case 'excel':
                        return this.exportToExcel(exportData);
                    case 'pdf':
                        return this.exportToPDF(exportData);
                    default:
                        return this.exportToJSON(exportData);
                }
                
            } catch (error) {
                errorHandler.captureError(error, { context: 'ExportService.exportPeriodData', period, format });
                throw new Error('Erro ao exportar dados: ' + error.message);
            }
        });
    }
    
    /**
     * Buscar dados das empresas
     */
    async getEmpresasData() {
        const { data, error } = await this.supabase
            .from('empresas')
            .select('*')
            .eq('ativo', true)
            .order('nome');
        
        if (error) throw error;
        return data || [];
    }
    
    /**
     * Buscar dados dos controles
     */
    async getControlesData(period) {
        const { data, error } = await this.supabase
            .from('controle_mensal')
            .select('*')
            .eq('mes_ano', period)
            .order('created_at');
        
        if (error) throw error;
        return data || [];
    }
    
    /**
     * Buscar dados dos preços
     */
    async getPrecosData() {
        const { data, error } = await this.supabase
            .from('precos_marmitas')
            .select('*')
            .eq('ativo', true);
        
        if (error) throw error;
        
        const precos = {};
        data.forEach(item => {
            precos[item.tamanho] = parseFloat(item.preco);
        });
        
        return precos;
    }
    
    /**
     * Gerar resumo dos dados
     */
    generateSummary(controles, precos) {
        const summary = {
            totalEmpresas: controles.length,
            totalFaturado: 0,
            totalMarmitas: 0,
            byStatus: {},
            bySize: { P: 0, M: 0, G: 0 },
            avgTicket: 0
        };
        
        controles.forEach(controle => {
            // Totais
            summary.totalFaturado += controle.valor_total || 0;
            summary.totalMarmitas += (controle.qtd_pequena || 0) + (controle.qtd_media || 0) + (controle.qtd_grande || 0);
            
            // Por tamanho
            summary.bySize.P += controle.qtd_pequena || 0;
            summary.bySize.M += controle.qtd_media || 0;
            summary.bySize.G += controle.qtd_grande || 0;
            
            // Por status
            const status = controle.status || 'pendente';
            summary.byStatus[status] = (summary.byStatus[status] || 0) + 1;
        });
        
        // Ticket médio
        summary.avgTicket = summary.totalEmpresas > 0 ? summary.totalFaturado / summary.totalEmpresas : 0;
        
        return summary;
    }
    
    /**
     * Exportar para JSON
     */
    exportToJSON(data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        });
        
        const filename = `${EXPORT_CONFIG.FILENAME_PREFIX}-${data.period}.json`;
        this.downloadBlob(blob, filename);
        
        return { success: true, format: 'json', filename };
    }
    
    /**
     * Exportar para CSV
     */
    exportToCSV(data) {
        const csvData = this.generateCSVData(data);
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        
        const filename = `${EXPORT_CONFIG.FILENAME_PREFIX}-${data.period}.csv`;
        this.downloadBlob(blob, filename);
        
        return { success: true, format: 'csv', filename };
    }
    
    /**
     * Gerar dados CSV
     */
    generateCSVData(data) {
        const headers = [
            'Empresa',
            'Contato',
            'Email',
            'Telefone',
            'Qtd Pequena',
            'Qtd Média',
            'Qtd Grande',
            'Total Marmitas',
            'Valor Total',
            'Status',
            'Observações'
        ];
        
        const rows = [];
        
        data.controles.forEach(controle => {
            const empresa = data.empresas.find(e => e.id === controle.empresa_id);
            if (empresa) {
                rows.push([
                    empresa.nome,
                    empresa.contato || '',
                    empresa.email || '',
                    empresa.telefone || '',
                    controle.qtd_pequena || 0,
                    controle.qtd_media || 0,
                    controle.qtd_grande || 0,
                    (controle.qtd_pequena || 0) + (controle.qtd_media || 0) + (controle.qtd_grande || 0),
                    controle.valor_total || 0,
                    controle.status || 'pendente',
                    controle.observacoes || ''
                ]);
            }
        });
        
        // Adicionar linha de resumo
        rows.push([]);
        rows.push(['RESUMO']);
        rows.push(['Total de Empresas', data.summary.totalEmpresas]);
        rows.push(['Total Faturado', data.summary.totalFaturado]);
        rows.push(['Total Marmitas', data.summary.totalMarmitas]);
        rows.push(['Ticket Médio', data.summary.avgTicket.toFixed(2)]);
        
        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');
        
        return '\uFEFF' + csvContent; // BOM para UTF-8
    }
    
    /**
     * Exportar relatório detalhado
     */
    async exportDetailedReport(period) {
        return performanceMonitor.measureAsync('export:detailedReport', async () => {
            try {
                const data = await this.exportPeriodData(period, 'json');
                
                // Processar lançamentos diários
                const detailedData = {
                    ...data,
                    dailyLaunches: this.processDailyLaunches(data.controles),
                    extrasAnalysis: this.analyzeExtras(data.controles),
                    trends: this.calculateTrends(data.controles)
                };
                
                const blob = new Blob([JSON.stringify(detailedData, null, 2)], {
                    type: 'application/json'
                });
                
                const filename = `relatorio-detalhado-${period}.json`;
                this.downloadBlob(blob, filename);
                
                return { success: true, format: 'detailed-json', filename };
                
            } catch (error) {
                errorHandler.captureError(error, { context: 'ExportService.exportDetailedReport', period });
                throw new Error('Erro ao exportar relatório detalhado: ' + error.message);
            }
        });
    }
    
    /**
     * Processar lançamentos diários
     */
    processDailyLaunches(controles) {
        const dailyData = {};
        
        controles.forEach(controle => {
            if (controle.lancamentos_diarios) {
                try {
                    const lancamentos = JSON.parse(controle.lancamentos_diarios);
                    lancamentos.forEach(lancamento => {
                        if (!dailyData[lancamento.data]) {
                            dailyData[lancamento.data] = {
                                date: lancamento.data,
                                totalMarmitas: 0,
                                totalValue: 0,
                                empresas: 0,
                                extras: []
                            };
                        }
                        
                        const dayData = dailyData[lancamento.data];
                        dayData.totalMarmitas += (lancamento.qtd_pequena || 0) + (lancamento.qtd_media || 0) + (lancamento.qtd_grande || 0);
                        dayData.totalValue += lancamento.valor_dia || 0;
                        dayData.empresas++;
                        
                        if (lancamento.extras) {
                            dayData.extras.push(...lancamento.extras);
                        }
                    });
                } catch (error) {
                    console.warn('Erro ao processar lançamentos diários:', error);
                }
            }
        });
        
        return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
    }
    
    /**
     * Analisar extras
     */
    analyzeExtras(controles) {
        const extrasMap = new Map();
        
        controles.forEach(controle => {
            if (controle.lancamentos_diarios) {
                try {
                    const lancamentos = JSON.parse(controle.lancamentos_diarios);
                    lancamentos.forEach(lancamento => {
                        if (lancamento.extras && Array.isArray(lancamento.extras)) {
                            lancamento.extras.forEach(extra => {
                                const key = extra.descricao.toLowerCase();
                                if (!extrasMap.has(key)) {
                                    extrasMap.set(key, {
                                        descricao: extra.descricao,
                                        totalQuantidade: 0,
                                        totalValor: 0,
                                        ocorrencias: 0
                                    });
                                }
                                
                                const item = extrasMap.get(key);
                                item.totalQuantidade += extra.quantidade;
                                item.totalValor += extra.total;
                                item.ocorrencias++;
                            });
                        }
                    });
                } catch (error) {
                    console.warn('Erro ao analisar extras:', error);
                }
            }
        });
        
        return Array.from(extrasMap.values())
            .sort((a, b) => b.totalValor - a.totalValor);
    }
    
    /**
     * Calcular tendências
     */
    calculateTrends(controles) {
        // Análise simples de tendências
        const trends = {
            avgMarmitasPorEmpresa: 0,
            avgValorPorEmpresa: 0,
            empresasComExtras: 0,
            statusDistribution: {}
        };
        
        if (controles.length === 0) return trends;
        
        let totalMarmitas = 0;
        let totalValor = 0;
        let empresasComExtras = 0;
        
        controles.forEach(controle => {
            totalMarmitas += (controle.qtd_pequena || 0) + (controle.qtd_media || 0) + (controle.qtd_grande || 0);
            totalValor += controle.valor_total || 0;
            
            // Verificar se tem extras
            if (controle.lancamentos_diarios) {
                try {
                    const lancamentos = JSON.parse(controle.lancamentos_diarios);
                    const temExtras = lancamentos.some(l => l.extras && l.extras.length > 0);
                    if (temExtras) empresasComExtras++;
                } catch (error) {
                    // Ignorar erro
                }
            }
            
            // Distribuição de status
            const status = controle.status || 'pendente';
            trends.statusDistribution[status] = (trends.statusDistribution[status] || 0) + 1;
        });
        
        trends.avgMarmitasPorEmpresa = totalMarmitas / controles.length;
        trends.avgValorPorEmpresa = totalValor / controles.length;
        trends.empresasComExtras = empresasComExtras;
        trends.percentualComExtras = (empresasComExtras / controles.length) * 100;
        
        return trends;
    }
    
    /**
     * Exportar backup completo
     */
    async exportBackup() {
        return performanceMonitor.measureAsync('export:backup', async () => {
            try {
                // Buscar todos os dados
                const [empresas, controles, precos, periodos] = await Promise.all([
                    this.getAllEmpresas(),
                    this.getAllControles(),
                    this.getPrecosData(),
                    this.getAllPeriods()
                ]);
                
                const backupData = {
                    version: '1.0',
                    exportedAt: new Date().toISOString(),
                    type: 'full-backup',
                    data: {
                        empresas,
                        controles,
                        precos,
                        periodos
                    },
                    metadata: {
                        totalEmpresas: empresas.length,
                        totalControles: controles.length,
                        periodosDisponiveis: periodos.length
                    }
                };
                
                const blob = new Blob([JSON.stringify(backupData, null, 2)], {
                    type: 'application/json'
                });
                
                const filename = `backup-completo-${new Date().toISOString().split('T')[0]}.json`;
                this.downloadBlob(blob, filename);
                
                return { success: true, format: 'backup', filename };
                
            } catch (error) {
                errorHandler.captureError(error, { context: 'ExportService.exportBackup' });
                throw new Error('Erro ao exportar backup: ' + error.message);
            }
        });
    }

        /**
     * Buscar todas as empresas (incluindo inativas)
     */
        async getAllEmpresas() {
            const { data, error } = await this.supabase
                .from('empresas')
                .select('*')
                .order('nome');
            
            if (error) throw error;
            return data || [];
        }
        
        /**
         * Buscar todos os controles
         */
        async getAllControles() {
            const { data, error } = await this.supabase
                .from('controle_mensal')
                .select('*')
                .order('mes_ano', { ascending: false });
            
            if (error) throw error;
            return data || [];
        }
        
        /**
         * Buscar todos os períodos
         */
        async getAllPeriods() {
            const { data, error } = await this.supabase
                .from('controle_mensal')
                .select('mes_ano')
                .order('mes_ano', { ascending: false });
            
            if (error) throw error;
            
            return [...new Set(data.map(item => item.mes_ano))];
        }
        
        /**
         * Exportar template de importação
         */
        exportImportTemplate() {
            const template = {
                empresas: [
                    {
                        nome: 'Empresa Exemplo',
                        contato: 'João Silva',
                        email: 'contato@exemplo.com',
                        telefone: '(38) 99999-9999',
                        observacoes: 'Observações da empresa'
                    }
                ],
                controles: [
                    {
                        empresa_nome: 'Empresa Exemplo',
                        mes_ano: '2025-08',
                        qtd_pequena: 10,
                        qtd_media: 15,
                        qtd_grande: 5,
                        valor_total: 290.00,
                        status: 'pendente',
                        observacoes: 'Observações do controle'
                    }
                ],
                instrucoes: {
                    empresas: 'Lista de empresas a serem importadas',
                    controles: 'Lista de controles mensais a serem importados',
                    observacoes: [
                        'O campo empresa_nome deve corresponder exatamente ao nome da empresa',
                        'O formato do mes_ano deve ser YYYY-MM',
                        'Status válidos: pendente, relatorio-enviado, pagamento-enviado, emitindo-nf, erro-nf, concluido'
                    ]
                }
            };
            
            const blob = new Blob([JSON.stringify(template, null, 2)], {
                type: 'application/json'
            });
            
            const filename = 'template-importacao.json';
            this.downloadBlob(blob, filename);
            
            return { success: true, format: 'template', filename };
        }
        
        /**
         * Exportar relatório financeiro
         */
        async exportFinancialReport(startPeriod, endPeriod) {
            return performanceMonitor.measureAsync('export:financialReport', async () => {
                try {
                    // Buscar dados do período
                    const { data: controles, error } = await this.supabase
                        .from('controle_mensal')
                        .select('*')
                        .gte('mes_ano', startPeriod)
                        .lte('mes_ano', endPeriod)
                        .order('mes_ano');
                    
                    if (error) throw error;
                    
                    // Buscar empresas relacionadas
                    const empresaIds = [...new Set(controles.map(c => c.empresa_id))];
                    const { data: empresas, error: empresasError } = await this.supabase
                        .from('empresas')
                        .select('*')
                        .in('id', empresaIds);
                    
                    if (empresasError) throw empresasError;
                    
                    // Gerar relatório financeiro
                    const report = this.generateFinancialReport(controles, empresas, startPeriod, endPeriod);
                    
                    const blob = new Blob([JSON.stringify(report, null, 2)], {
                        type: 'application/json'
                    });
                    
                    const filename = `relatorio-financeiro-${startPeriod}-${endPeriod}.json`;
                    this.downloadBlob(blob, filename);
                    
                    return { success: true, format: 'financial-report', filename };
                    
                } catch (error) {
                    errorHandler.captureError(error, { 
                        context: 'ExportService.exportFinancialReport', 
                        startPeriod, 
                        endPeriod 
                    });
                    throw new Error('Erro ao exportar relatório financeiro: ' + error.message);
                }
            });
        }
        
        /**
         * Gerar relatório financeiro
         */
        generateFinancialReport(controles, empresas, startPeriod, endPeriod) {
            const report = {
                periodo: {
                    inicio: startPeriod,
                    fim: endPeriod,
                    texto: `${formatPeriod(startPeriod)} a ${formatPeriod(endPeriod)}`
                },
                resumo: {
                    totalFaturado: 0,
                    totalMarmitas: 0,
                    totalEmpresas: empresas.length,
                    ticketMedio: 0
                },
                porPeriodo: {},
                porEmpresa: {},
                evolucao: [],
                geradoEm: new Date().toISOString()
            };
            
            // Agrupar por período
            controles.forEach(controle => {
                const periodo = controle.mes_ano;
                
                if (!report.porPeriodo[periodo]) {
                    report.porPeriodo[periodo] = {
                        periodo,
                        periodoTexto: formatPeriod(periodo),
                        faturamento: 0,
                        marmitas: 0,
                        empresas: 0
                    };
                }
                
                const periodData = report.porPeriodo[periodo];
                periodData.faturamento += controle.valor_total || 0;
                periodData.marmitas += (controle.qtd_pequena || 0) + (controle.qtd_media || 0) + (controle.qtd_grande || 0);
                periodData.empresas++;
                
                // Totais gerais
                report.resumo.totalFaturado += controle.valor_total || 0;
                report.resumo.totalMarmitas += (controle.qtd_pequena || 0) + (controle.qtd_media || 0) + (controle.qtd_grande || 0);
            });
            
            // Agrupar por empresa
            empresas.forEach(empresa => {
                const empresaControles = controles.filter(c => c.empresa_id === empresa.id);
                
                if (empresaControles.length > 0) {
                    report.porEmpresa[empresa.id] = {
                        empresa: empresa.nome,
                        contato: empresa.contato,
                        email: empresa.email,
                        totalFaturado: empresaControles.reduce((sum, c) => sum + (c.valor_total || 0), 0),
                        totalMarmitas: empresaControles.reduce((sum, c) => 
                            sum + (c.qtd_pequena || 0) + (c.qtd_media || 0) + (c.qtd_grande || 0), 0),
                        periodos: empresaControles.length,
                        ticketMedio: 0
                    };
                    
                    report.porEmpresa[empresa.id].ticketMedio = 
                        report.porEmpresa[empresa.id].totalFaturado / empresaControles.length;
                }
            });
            
            // Calcular ticket médio geral
            const totalPeriodos = Object.keys(report.porPeriodo).length;
            report.resumo.ticketMedio = totalPeriodos > 0 ? report.resumo.totalFaturado / totalPeriodos : 0;
            
            // Gerar evolução
            report.evolucao = Object.values(report.porPeriodo)
                .sort((a, b) => a.periodo.localeCompare(b.periodo));
            
            return report;
        }
        
        /**
         * Exportar dados para planilha (CSV otimizado)
         */
        async exportToSpreadsheet(period) {
            return performanceMonitor.measureAsync('export:spreadsheet', async () => {
                try {
                    const data = await this.exportPeriodData(period, 'json');
                    
                    // Criar múltiplas abas em formato CSV
                    const sheets = {
                        resumo: this.generateSummarySheet(data),
                        empresas: this.generateEmpresasSheet(data),
                        detalhado: this.generateDetailedSheet(data),
                        extras: this.generateExtrasSheet(data)
                    };
                    
                    // Criar arquivo ZIP com múltiplos CSVs
                    const zip = await this.createZipFile(sheets, period);
                    
                    const filename = `planilha-${period}.zip`;
                    this.downloadBlob(zip, filename);
                    
                    return { success: true, format: 'spreadsheet', filename };
                    
                } catch (error) {
                    errorHandler.captureError(error, { context: 'ExportService.exportToSpreadsheet', period });
                    throw new Error('Erro ao exportar planilha: ' + error.message);
                }
            });
        }
        
        /**
         * Gerar aba de resumo
         */
        generateSummarySheet(data) {
            const rows = [
                ['RESUMO DO PERÍODO', data.periodText],
                [''],
                ['Métrica', 'Valor'],
                ['Total de Empresas', data.summary.totalEmpresas],
                ['Total Faturado', formatCurrency(data.summary.totalFaturado)],
                ['Total de Marmitas', data.summary.totalMarmitas],
                ['Ticket Médio', formatCurrency(data.summary.avgTicket)],
                [''],
                ['POR TAMANHO'],
                ['Pequenas (P)', data.summary.bySize.P],
                ['Médias (M)', data.summary.bySize.M],
                ['Grandes (G)', data.summary.bySize.G],
                [''],
                ['POR STATUS']
            ];
            
            Object.entries(data.summary.byStatus).forEach(([status, count]) => {
                rows.push([status, count]);
            });
            
            return rows.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
        }
        
        /**
         * Gerar aba de empresas
         */
        generateEmpresasSheet(data) {
            const headers = ['Nome', 'Contato', 'Email', 'Telefone', 'P', 'M', 'G', 'Total Marmitas', 'Valor', 'Status'];
            const rows = [headers];
            
            data.controles.forEach(controle => {
                const empresa = data.empresas.find(e => e.id === controle.empresa_id);
                if (empresa) {
                    rows.push([
                        empresa.nome,
                        empresa.contato || '',
                        empresa.email || '',
                        empresa.telefone || '',
                        controle.qtd_pequena || 0,
                        controle.qtd_media || 0,
                        controle.qtd_grande || 0,
                        (controle.qtd_pequena || 0) + (controle.qtd_media || 0) + (controle.qtd_grande || 0),
                        controle.valor_total || 0,
                        controle.status || 'pendente'
                    ]);
                }
            });
            
            return rows.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
        }
        
        /**
         * Gerar aba detalhada
         */
        generateDetailedSheet(data) {
            const headers = ['Empresa', 'Data', 'P', 'M', 'G', 'Valor Marmitas', 'Valor Extras', 'Total Dia'];
            const rows = [headers];
            
            data.controles.forEach(controle => {
                const empresa = data.empresas.find(e => e.id === controle.empresa_id);
                if (empresa && controle.lancamentos_diarios) {
                    try {
                        const lancamentos = JSON.parse(controle.lancamentos_diarios);
                        lancamentos.forEach(lancamento => {
                            rows.push([
                                empresa.nome,
                                formatDateBR(lancamento.data),
                                lancamento.qtd_pequena || 0,
                                lancamento.qtd_media || 0,
                                lancamento.qtd_grande || 0,
                                lancamento.valor_marmitas || 0,
                                lancamento.valor_extras || 0,
                                lancamento.valor_dia || 0
                            ]);
                        });
                    } catch (error) {
                        console.warn('Erro ao processar lançamentos:', error);
                    }
                }
            });
            
            return rows.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
        }
        
        /**
         * Gerar aba de extras
         */
        generateExtrasSheet(data) {
            const extrasAnalysis = this.analyzeExtras(data.controles);
            const headers = ['Item', 'Quantidade Total', 'Valor Total', 'Ocorrências', 'Valor Médio'];
            const rows = [headers];
            
            extrasAnalysis.forEach(extra => {
                rows.push([
                    extra.descricao,
                    extra.totalQuantidade,
                    extra.totalValor,
                    extra.ocorrencias,
                    (extra.totalValor / extra.ocorrencias).toFixed(2)
                ]);
            });
            
            return rows.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
        }
        
        /**
         * Criar arquivo ZIP
         */
        async createZipFile(sheets, period) {
            // Simulação de criação de ZIP (em produção, usar biblioteca como JSZip)
            const files = Object.entries(sheets).map(([name, content]) => ({
                name: `${name}.csv`,
                content: '\uFEFF' + content // BOM para UTF-8
            }));
            
            // Por simplicidade, retornar apenas o primeiro arquivo
            // Em produção, implementar ZIP real
            const blob = new Blob([files[0].content], { type: 'text/csv;charset=utf-8;' });
            return blob;
        }
        
        /**
         * Download de blob
         */
        downloadBlob(blob, filename) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.style.display = 'none';
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
        }
        
        /**
         * Obter estatísticas de exportação
         */
        getExportStats() {
            const stats = {
                formatsSupported: ['json', 'csv', 'excel', 'pdf'],
                lastExport: this.getLastExportTime(),
                totalExports: this.getTotalExports()
            };
            
            return stats;
        }
        
        /**
         * Obter último tempo de exportação
         */
        getLastExportTime    /**
        * Obter último tempo de exportação
        */
       getLastExportTime() {
           try {
               return localStorage.getItem('last-export-time');
           } catch (error) {
               return null;
           }
       }
       
       /**
        * Obter total de exportações
        */
       getTotalExports() {
           try {
               return parseInt(localStorage.getItem('total-exports') || '0');
           } catch (error) {
               return 0;
           }
       }
       
       /**
        * Registrar exportação
        */
       registerExport() {
           try {
               localStorage.setItem('last-export-time', new Date().toISOString());
               const total = this.getTotalExports() + 1;
               localStorage.setItem('total-exports', total.toString());
           } catch (error) {
               console.warn('Erro ao registrar exportação:', error);
           }
       }
       
       /**
        * Validar dados antes da exportação
        */
       validateExportData(data) {
           const errors = [];
           
           if (!data.period) {
               errors.push('Período não informado');
           }
           
           if (!data.empresas || data.empresas.length === 0) {
               errors.push('Nenhuma empresa encontrada');
           }
           
           if (!data.controles || data.controles.length === 0) {
               errors.push('Nenhum controle encontrado');
           }
           
           return {
               isValid: errors.length === 0,
               errors
           };
       }
   }
   
   // Criar instância única
   export const exportService = new ExportService();