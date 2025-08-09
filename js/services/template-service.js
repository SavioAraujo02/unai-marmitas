// ===== SERVIÇO DE TEMPLATES DE EMAIL =====

import { DEFAULT_EMAIL_TEMPLATE, TEMPLATE_VARIABLES, STORAGE_KEYS } from '../config/constants.js';
import { formatCurrency, formatPeriod } from '../utils/formatters.js';
import { stateManager } from '../core/state-manager.js';
import { errorHandler } from '../core/error-handler.js';
import { performanceMonitor } from '../core/performance-monitor.js';

class TemplateService {
    constructor() {
        this.currentTemplate = { ...DEFAULT_EMAIL_TEMPLATE };
        this.loadSavedTemplate();
    }
    
    /**
     * Carregar template salvo
     */
    loadSavedTemplate() {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.TEMPLATE_EMAIL);
            if (saved) {
                this.currentTemplate = JSON.parse(saved);
                console.log('📧 Template carregado do localStorage');
            }
        } catch (error) {
            console.warn('⚠️ Erro ao carregar template:', error);
            this.currentTemplate = { ...DEFAULT_EMAIL_TEMPLATE };
        }
    }
    
    /**
     * Salvar template
     */
    saveTemplate(template) {
        return performanceMonitor.measure('template:save', () => {
            try {
                if (!template.assunto || !template.corpo) {
                    throw new Error('Assunto e corpo são obrigatórios');
                }
                
                this.currentTemplate = {
                    assunto: template.assunto.trim(),
                    corpo: template.corpo.trim()
                };
                
                localStorage.setItem(STORAGE_KEYS.TEMPLATE_EMAIL, JSON.stringify(this.currentTemplate));
                
                console.log('✅ Template salvo');
                return this.currentTemplate;
                
            } catch (error) {
                errorHandler.captureError(error, { context: 'TemplateService.saveTemplate', template });
                throw new Error('Erro ao salvar template: ' + error.message);
            }
        });
    }
    
    /**
     * Obter template atual
     */
    getTemplate() {
        return { ...this.currentTemplate };
    }
    
    /**
     * Restaurar template padrão
     */
    resetToDefault() {
        this.currentTemplate = { ...DEFAULT_EMAIL_TEMPLATE };
        localStorage.setItem(STORAGE_KEYS.TEMPLATE_EMAIL, JSON.stringify(this.currentTemplate));
        console.log('🔄 Template restaurado para padrão');
        return this.currentTemplate;
    }
    
    /**
     * Processar template com dados da empresa
     */
    processTemplate(empresa, controle, precos) {
        return performanceMonitor.measure('template:process', () => {
            try {
                if (!empresa || !controle) {
                    throw new Error('Empresa e controle são obrigatórios');
                }
                
                const [year, month] = controle.mes_ano.split('-');
                const mesNome = formatPeriod(controle.mes_ano).split('/')[0];
                
                // Calcular valores
                const valorMarmitas = (controle.qtd_pequena * precos.P) + 
                                    (controle.qtd_media * precos.M) + 
                                    (controle.qtd_grande * precos.G);
                const valorExtras = controle.valor_total - valorMarmitas;
                const qtdTotal = controle.qtd_pequena + controle.qtd_media + controle.qtd_grande;
                
                // Processar extras
                const { extrasSection, valorExtrasLine } = this.processExtras(controle.lancamentos_diarios, valorExtras);
                
                // Mapa de variáveis
                const variables = {
                    '{EMPRESA}': empresa.nome,
                    '{MES}': mesNome,
                    '{ANO}': year,
                    '{QTD_P}': controle.qtd_pequena.toString(),
                    '{QTD_M}': controle.qtd_media.toString(),
                    '{QTD_G}': controle.qtd_grande.toString(),
                    '{PRECO_P}': formatCurrency(precos.P).replace('R$ ', ''),
                    '{PRECO_M}': formatCurrency(precos.M).replace('R$ ', ''),
                    '{PRECO_G}': formatCurrency(precos.G).replace('R$ ', ''),
                    '{TOTAL_P}': formatCurrency(controle.qtd_pequena * precos.P).replace('R$ ', ''),
                    '{TOTAL_M}': formatCurrency(controle.qtd_media * precos.M).replace('R$ ', ''),
                    '{TOTAL_G}': formatCurrency(controle.qtd_grande * precos.G).replace('R$ ', ''),
                    '{QTD_TOTAL}': qtdTotal.toString(),
                    '{VALOR_MARMITAS}': formatCurrency(valorMarmitas).replace('R$ ', ''),
                    '{VALOR_EXTRAS}': formatCurrency(valorExtras).replace('R$ ', ''),
                    '{VALOR_TOTAL}': formatCurrency(controle.valor_total).replace('R$ ', ''),
                    '{EXTRAS_SECTION}': extrasSection,
                    '{VALOR_EXTRAS_LINE}': valorExtrasLine
                };
                
                // Substituir variáveis no assunto e corpo
                let assuntoProcessado = this.currentTemplate.assunto;
                let corpoProcessado = this.currentTemplate.corpo;
                
                Object.entries(variables).forEach(([variavel, valor]) => {
                    const regex = new RegExp(variavel.replace(/[{}]/g, '\\$&'), 'g');
                    assuntoProcessado = assuntoProcessado.replace(regex, valor);
                    corpoProcessado = corpoProcessado.replace(regex, valor);
                });
                
                return {
                    assunto: assuntoProcessado,
                    corpo: corpoProcessado,
                    variables: variables
                };
                
            } catch (error) {
                errorHandler.captureError(error, { 
                    context: 'TemplateService.processTemplate', 
                    empresa, 
                    controle 
                });
                throw new Error('Erro ao processar template: ' + error.message);
            }
        });
    }
    
    /**
     * Processar seção de extras
     */
    processExtras(lancamentosDiarios, valorExtras) {
        try {
            let extrasSection = '';
            let valorExtrasLine = '';
            
            if (lancamentosDiarios && valorExtras > 0) {
                const lancamentos = JSON.parse(lancamentosDiarios);
                const todosExtras = [];
                
                // Consolidar extras de todos os dias
                lancamentos.forEach(lancamento => {
                    if (lancamento.extras && Array.isArray(lancamento.extras)) {
                        lancamento.extras.forEach(extra => {
                            const existente = todosExtras.find(e => e.descricao === extra.descricao);
                            if (existente) {
                                existente.quantidade += extra.quantidade;
                                existente.total += extra.total;
                            } else {
                                todosExtras.push({
                                    descricao: extra.descricao,
                                    quantidade: extra.quantidade,
                                    valor_unitario: extra.valor_unitario,
                                    total: extra.total
                                });
                            }
                        });
                    }
                });
                
                if (todosExtras.length > 0) {
                    extrasSection = '\nITENS EXTRAS:\n';
                    todosExtras.forEach(extra => {
                        extrasSection += `${extra.descricao}: ${extra.quantidade} x R$ ${extra.valor_unitario.toFixed(2)} = R$ ${extra.total.toFixed(2)}\n`;
                    });
                    valorExtrasLine = `Total Extras: R$ ${valorExtras.toFixed(2)}\n`;
                }
            }
            
            return { extrasSection, valorExtrasLine };
            
        } catch (error) {
            console.warn('Erro ao processar extras:', error);
            return { extrasSection: '', valorExtrasLine: '' };
        }
    }
    
    /**
     * Validar template
     */
    validateTemplate(template) {
        const errors = [];
        
        if (!template.assunto || template.assunto.trim().length === 0) {
            errors.push('Assunto é obrigatório');
        }
        
        if (!template.corpo || template.corpo.trim().length === 0) {
            errors.push('Corpo é obrigatório');
        }
        
        if (template.assunto && template.assunto.length > 200) {
            errors.push('Assunto muito longo (máximo 200 caracteres)');
        }
        
        if (template.corpo && template.corpo.length > 10000) {
            errors.push('Corpo muito longo (máximo 10.000 caracteres)');
        }
        
        // Verificar variáveis inválidas
        const validVariables = TEMPLATE_VARIABLES.map(v => v.key);
        const usedVariables = this.extractVariables(template.assunto + ' ' + template.corpo);
        const invalidVariables = usedVariables.filter(v => !validVariables.includes(v));
        
        if (invalidVariables.length > 0) {
            errors.push(`Variáveis inválidas: ${invalidVariables.join(', ')}`);
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    /**
     * Extrair variáveis do texto
     */
    extractVariables(text) {
        const regex = /\{[A-Z_]+\}/g;
        const matches = text.match(regex);
        return matches ? [...new Set(matches)] : [];
    }
    
    /**
     * Obter variáveis disponíveis
     */
    getAvailableVariables() {
        return [...TEMPLATE_VARIABLES];
    }
    
    /**
     * Gerar preview do template
     */
    generatePreview(empresa = null, controle = null, precos = null) {
        try {
            // Usar dados de exemplo se não fornecidos
            const exemploEmpresa = empresa || {
                nome: 'Empresa Exemplo Ltda',
                email: 'contato@exemplo.com',
                contato: 'João Silva'
            };
            
            const exemploControle = controle || {
                mes_ano: stateManager.get('currentMonth'),
                qtd_pequena: 10,
                qtd_media: 15,
                qtd_grande: 5,
                valor_total: 290.00,
                lancamentos_diarios: JSON.stringify([
                    {
                        data: '2025-08-01',
                        qtd_pequena: 2,
                        qtd_media: 3,
                        qtd_grande: 1,
                        extras: [
                            {
                                descricao: 'Coca-Cola',
                                quantidade: 2,
                                valor_unitario: 3.50,
                                total: 7.00
                            }
                        ]
                    }
                ])
            };
            
            const exemploPrecos = precos || stateManager.get('precos');
            
            return this.processTemplate(exemploEmpresa, exemploControle, exemploPrecos);
            
        } catch (error) {
            errorHandler.captureError(error, { context: 'TemplateService.generatePreview' });
            throw new Error('Erro ao gerar preview: ' + error.message);
        }
    }
    
    /**
     * Exportar template
     */
    exportTemplate() {
        try {
            const exportData = {
                template: this.currentTemplate,
                variables: TEMPLATE_VARIABLES,
                exportedAt: new Date().toISOString(),
                version: '1.0'
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `template-email-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            
            console.log('✅ Template exportado');
            
        } catch (error) {
            errorHandler.captureError(error, { context: 'TemplateService.exportTemplate' });
            throw new Error('Erro ao exportar template: ' + error.message);
        }
    }
    
    /**
     * Importar template
     */
    async importTemplate(file) {
        try {
            if (!file) throw new Error('Arquivo é obrigatório');
            
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (!data.template || !data.template.assunto || !data.template.corpo) {
                throw new Error('Arquivo de template inválido');
            }
            
            const validation = this.validateTemplate(data.template);
            if (!validation.isValid) {
                throw new Error('Template inválido: ' + validation.errors.join(', '));
            }
            
            this.saveTemplate(data.template);
            
            console.log('✅ Template importado');
            return this.currentTemplate;
            
        } catch (error) {
            errorHandler.captureError(error, { context: 'TemplateService.importTemplate' });
            throw new Error('Erro ao importar template: ' + error.message);
        }
    }
    
    /**
     * Gerar template para múltiplas empresas
     */
    generateBulkTemplates(empresas, controles, precos) {
        return performanceMonitor.measure('template:generateBulk', () => {
            try {
                const templates = [];
                
                empresas.forEach(empresa => {
                    const controle = controles.find(c => c.empresa_id === empresa.id);
                    if (controle) {
                        const processed = this.processTemplate(empresa, controle, precos);
                        templates.push({
                            empresa: empresa,
                            email: empresa.email,
                            assunto: processed.assunto,
                            corpo: processed.corpo
                        });
                    }
                });
                
                return templates;
                
            } catch (error) {
                errorHandler.captureError(error, { 
                    context: 'TemplateService.generateBulkTemplates',
                    empresasCount: empresas.length 
                });
                throw new Error('Erro ao gerar templates em lote: ' + error.message);
            }
        });
    }
    
    /**
     * Verificar se template foi modificado
     */
    isModified() {
        const defaultTemplate = DEFAULT_EMAIL_TEMPLATE;
        return this.currentTemplate.assunto !== defaultTemplate.assunto ||
               this.currentTemplate.corpo !== defaultTemplate.corpo;
    }
    
    /**
     * Obter estatísticas do template
     */
    getTemplateStats() {
        const stats = {
            assunto: {
                length: this.currentTemplate.assunto.length,
                variables: this.extractVariables(this.currentTemplate.assunto).length
            },
            corpo: {
                length: this.currentTemplate.corpo.length,
                lines: this.currentTemplate.corpo.split('\n').length,
                variables: this.extractVariables(this.currentTemplate.corpo).length
            },
            totalVariables: this.extractVariables(this.currentTemplate.assunto + ' ' + this.currentTemplate.corpo).length,
            isModified: this.isModified(),
            lastModified: this.getLastModified()
        };
        
        return stats;
    }
    
    /**
     * Obter data da última modificação
     */
    getLastModified() {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.TEMPLATE_EMAIL + '_modified');
            return saved ? new Date(saved) : null;
        } catch (error) {
            return null;
        }
    }
    
    /**
     * Marcar como modificado
     */
    markAsModified() {
        localStorage.setItem(STORAGE_KEYS.TEMPLATE_EMAIL + '_modified', new Date().toISOString());
    }
    
    /**
     * Criar backup do template
     */
    createBackup() {
        try {
            const backup = {
                template: this.currentTemplate,
                timestamp: new Date().toISOString(),
                version: '1.0'
            };
            
            const backups = this.getBackups();
            backups.unshift(backup);
            
            // Manter apenas os últimos 10 backups
            const maxBackups = 10;
            if (backups.length > maxBackups) {
                backups.splice(maxBackups);
            }
            
            localStorage.setItem(STORAGE_KEYS.TEMPLATE_EMAIL + '_backups', JSON.stringify(backups));
            
            console.log('💾 Backup do template criado');
            return backup;
            
        } catch (error) {
            console.warn('Erro ao criar backup:', error);
            return null;
        }
    }
    
    /**
     * Obter backups disponíveis
     */
    getBackups() {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.TEMPLATE_EMAIL + '_backups');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            return [];
        }
    }
    
    /**
     * Restaurar backup
     */
    restoreBackup(backupIndex) {
        try {
            const backups = this.getBackups();
            if (backupIndex < 0 || backupIndex >= backups.length) {
                throw new Error('Backup não encontrado');
            }
            
            const backup = backups[backupIndex];
            this.saveTemplate(backup.template);
            
            console.log('🔄 Template restaurado do backup');
            return this.currentTemplate;
            
        } catch (error) {
            errorHandler.captureError(error, { context: 'TemplateService.restoreBackup', backupIndex });
            throw new Error('Erro ao restaurar backup: ' + error.message);
        }
    }
}

// Criar instância única
export const templateService = new TemplateService();