// ===== SERVIÇO DE CONTROLES MENSAIS =====

import { validateLancamento, validatePeriod } from '../utils/validators.js';
import { stateManager } from '../core/state-manager.js';
import { errorHandler } from '../core/error-handler.js';
import { performanceMonitor } from '../core/performance-monitor.js';
import { getCurrentPeriod } from '../utils/date-utils.js';

class ControleService {
    constructor() {
        this.supabase = null;
    }
    
    /**
     * Inicializar serviço
     */
    init(supabaseClient) {
        this.supabase = supabaseClient;
        console.log('✅ ControleService inicializado');
    }
    
    /**
     * Buscar controles por período
     */
    async getByPeriod(period = null) {
        return performanceMonitor.measureAsync('controles:getByPeriod', async () => {
            try {
                if (!period) period = getCurrentPeriod();
                
                if (!validatePeriod(period)) {
                    throw new Error('Período inválido');
                }
                
                // Verificar cache
                const cacheKey = `controles:${period}`;
                const cached = stateManager.getCache(cacheKey);
                if (cached) {
                    console.log('📦 Controles carregados do cache');
                    return cached;
                }
                
                const { data, error } = await this.supabase
                    .from('controle_mensal')
                    .select('*')
                    .eq('mes_ano', period)
                    .order('created_at', { ascending: false });
                
                if (error) throw error;
                
                const controles = data || [];
                
                                // Cachear resultado
                                stateManager.setCache(cacheKey, controles);
                
                                console.log(`✅ ${controles.length} controles carregados para ${period}`);
                                return controles;
                                
                            } catch (error) {
                                errorHandler.captureError(error, { context: 'ControleService.getByPeriod', period });
                                throw new Error('Erro ao carregar controles: ' + error.message);
                            }
                        });
                    }
                    
                    /**
                     * Buscar controle por empresa e período
                     */
                    async getByEmpresaAndPeriod(empresaId, period = null) {
                        return performanceMonitor.measureAsync('controles:getByEmpresaAndPeriod', async () => {
                            try {
                                if (!empresaId) throw new Error('ID da empresa é obrigatório');
                                if (!period) period = getCurrentPeriod();
                                
                                const { data, error } = await this.supabase
                                    .from('controle_mensal')
                                    .select('*')
                                    .eq('empresa_id', empresaId)
                                    .eq('mes_ano', period)
                                    .single();
                                
                                if (error && error.code !== 'PGRST116') throw error;
                                
                                return data || null;
                                
                            } catch (error) {
                                errorHandler.captureError(error, { 
                                    context: 'ControleService.getByEmpresaAndPeriod', 
                                    empresaId, 
                                    period 
                                });
                                throw new Error('Erro ao buscar controle: ' + error.message);
                            }
                        });
                    }
                    
                    /**
                     * Criar novo controle
                     */
                    async create(controleData) {
                        return performanceMonitor.measureAsync('controles:create', async () => {
                            try {
                                // Validar dados básicos
                                if (!controleData.empresa_id) {
                                    throw new Error('ID da empresa é obrigatório');
                                }
                                
                                if (!controleData.mes_ano) {
                                    controleData.mes_ano = getCurrentPeriod();
                                }
                                
                                if (!validatePeriod(controleData.mes_ano)) {
                                    throw new Error('Período inválido');
                                }
                                
                                // Verificar se já existe controle para esta empresa/período
                                const existing = await this.getByEmpresaAndPeriod(
                                    controleData.empresa_id, 
                                    controleData.mes_ano
                                );
                                
                                if (existing) {
                                    throw new Error('Já existe controle para esta empresa neste período');
                                }
                                
                                // Preparar dados para inserção
                                const dataToInsert = {
                                    empresa_id: controleData.empresa_id,
                                    mes_ano: controleData.mes_ano,
                                    qtd_pequena: controleData.qtd_pequena || 0,
                                    qtd_media: controleData.qtd_media || 0,
                                    qtd_grande: controleData.qtd_grande || 0,
                                    valor_total: controleData.valor_total || 0,
                                    status: controleData.status || 'pendente',
                                    observacoes: controleData.observacoes?.trim() || '',
                                    lancamentos_diarios: controleData.lancamentos_diarios || '[]',
                                    created_at: new Date().toISOString(),
                                    updated_at: new Date().toISOString()
                                };
                                
                                const { data, error } = await this.supabase
                                    .from('controle_mensal')
                                    .insert([dataToInsert])
                                    .select()
                                    .single();
                                
                                if (error) throw error;
                                
                                // Limpar cache
                                this.clearCache(controleData.mes_ano);
                                
                                console.log('✅ Controle criado para empresa:', controleData.empresa_id);
                                return data;
                                
                            } catch (error) {
                                errorHandler.captureError(error, { context: 'ControleService.create', controleData });
                                throw new Error('Erro ao criar controle: ' + error.message);
                            }
                        });
                    }
                    
                    /**
                     * Atualizar controle
                     */
                    async update(id, controleData) {
                        return performanceMonitor.measureAsync('controles:update', async () => {
                            try {
                                if (!id) throw new Error('ID do controle é obrigatório');
                                
                                // Preparar dados para atualização
                                const dataToUpdate = {
                                    qtd_pequena: controleData.qtd_pequena || 0,
                                    qtd_media: controleData.qtd_media || 0,
                                    qtd_grande: controleData.qtd_grande || 0,
                                    valor_total: controleData.valor_total || 0,
                                    status: controleData.status || 'pendente',
                                    observacoes: controleData.observacoes?.trim() || '',
                                    lancamentos_diarios: controleData.lancamentos_diarios || '[]',
                                    updated_at: new Date().toISOString()
                                };
                                
                                const { data, error } = await this.supabase
                                    .from('controle_mensal')
                                    .update(dataToUpdate)
                                    .eq('id', id)
                                    .select()
                                    .single();
                                
                                if (error) throw error;
                                
                                // Limpar cache
                                this.clearCache(data.mes_ano);
                                
                                console.log('✅ Controle atualizado:', id);
                                return data;
                                
                            } catch (error) {
                                errorHandler.captureError(error, { context: 'ControleService.update', id, controleData });
                                throw new Error('Erro ao atualizar controle: ' + error.message);
                            }
                        });
                    }
                    
                    /**
                     * Excluir controle
                     */
                    async delete(id) {
                        return performanceMonitor.measureAsync('controles:delete', async () => {
                            try {
                                if (!id) throw new Error('ID do controle é obrigatório');
                                
                                // Buscar controle para obter o período
                                const { data: controle, error: fetchError } = await this.supabase
                                    .from('controle_mensal')
                                    .select('mes_ano')
                                    .eq('id', id)
                                    .single();
                                
                                if (fetchError) throw fetchError;
                                
                                const { error } = await this.supabase
                                    .from('controle_mensal')
                                    .delete()
                                    .eq('id', id);
                                
                                if (error) throw error;
                                
                                // Limpar cache
                                this.clearCache(controle.mes_ano);
                                
                                console.log('✅ Controle excluído:', id);
                                return true;
                                
                            } catch (error) {
                                errorHandler.captureError(error, { context: 'ControleService.delete', id });
                                throw new Error('Erro ao excluir controle: ' + error.message);
                            }
                        });
                    }
                    
                    /**
                     * Salvar lançamento completo
                     */
                    async saveLancamento(empresaId, period, lancamentosData) {
                        return performanceMonitor.measureAsync('controles:saveLancamento', async () => {
                            try {
                                if (!empresaId) throw new Error('ID da empresa é obrigatório');
                                if (!period) period = getCurrentPeriod();
                                
                                // Validar lançamentos
                                if (lancamentosData.lancamentos_diarios) {
                                    const lancamentos = JSON.parse(lancamentosData.lancamentos_diarios);
                                    for (const lancamento of lancamentos) {
                                        const validation = validateLancamento(lancamento);
                                        if (!validation.valid) {
                                            throw new Error('Lançamento inválido: ' + Object.values(validation.errors).join(', '));
                                        }
                                    }
                                }
                                
                                // Verificar se já existe controle
                                const existing = await this.getByEmpresaAndPeriod(empresaId, period);
                                
                                if (existing) {
                                    // Atualizar existente
                                    return await this.update(existing.id, lancamentosData);
                                } else {
                                    // Criar novo
                                    const newControle = {
                                        empresa_id: empresaId,
                                        mes_ano: period,
                                        ...lancamentosData
                                    };
                                    return await this.create(newControle);
                                }
                                
                            } catch (error) {
                                errorHandler.captureError(error, { 
                                    context: 'ControleService.saveLancamento', 
                                    empresaId, 
                                    period, 
                                    lancamentosData 
                                });
                                throw new Error('Erro ao salvar lançamento: ' + error.message);
                            }
                        });
                    }
                    
                    /**
                     * Obter períodos disponíveis
                     */
                    async getAvailablePeriods() {
                        return performanceMonitor.measureAsync('controles:getAvailablePeriods', async () => {
                            try {
                                const { data, error } = await this.supabase
                                    .from('controle_mensal')
                                    .select('mes_ano')
                                    .order('mes_ano', { ascending: false });
                                
                                if (error) throw error;
                                
                                // Remover duplicatas e ordenar
                                const periods = [...new Set(data.map(item => item.mes_ano))];
                                
                                return periods;
                                
                            } catch (error) {
                                errorHandler.captureError(error, { context: 'ControleService.getAvailablePeriods' });
                                throw new Error('Erro ao buscar períodos: ' + error.message);
                            }
                        });
                    }
                    
                    /**
                     * Obter estatísticas do período
                     */
                    async getStatsForPeriod(period = null) {
                        return performanceMonitor.measureAsync('controles:getStatsForPeriod', async () => {
                            try {
                                if (!period) period = getCurrentPeriod();
                                
                                const controles = await this.getByPeriod(period);
                                
                                const stats = {
                                    period,
                                    totalEmpresas: controles.length,
                                    totalFaturado: controles.reduce((sum, c) => sum + (c.valor_total || 0), 0),
                                    totalMarmitas: controles.reduce((sum, c) => 
                                        sum + (c.qtd_pequena || 0) + (c.qtd_media || 0) + (c.qtd_grande || 0), 0
                                    ),
                                    byStatus: {},
                                    bySize: {
                                        pequena: controles.reduce((sum, c) => sum + (c.qtd_pequena || 0), 0),
                                        media: controles.reduce((sum, c) => sum + (c.qtd_media || 0), 0),
                                        grande: controles.reduce((sum, c) => sum + (c.qtd_grande || 0), 0)
                                    }
                                };
                                
                                // Agrupar por status
                                controles.forEach(controle => {
                                    const status = controle.status || 'pendente';
                                    if (!stats.byStatus[status]) {
                                        stats.byStatus[status] = 0;
                                    }
                                    stats.byStatus[status]++;
                                });
                                
                                return stats;
                                
                            } catch (error) {
                                errorHandler.captureError(error, { context: 'ControleService.getStatsForPeriod', period });
                                throw new Error('Erro ao obter estatísticas: ' + error.message);
                            }
                        });
                    }
                    
                    /**
                     * Limpar período (zerar todos os controles)
                     */
                    async clearPeriod(period) {
                        return performanceMonitor.measureAsync('controles:clearPeriod', async () => {
                            try {
                                if (!period) throw new Error('Período é obrigatório');
                                
                                const { error } = await this.supabase
                                    .from('controle_mensal')
                                    .update({
                                        qtd_pequena: 0,
                                        qtd_media: 0,
                                        qtd_grande: 0,
                                        valor_total: 0,
                                        status: 'pendente',
                                        observacoes: '',
                                        lancamentos_diarios: '[]',
                                        updated_at: new Date().toISOString()
                                    })
                                    .eq('mes_ano', period);
                                
                                if (error) throw error;
                                
                                // Limpar cache
                                this.clearCache(period);
                                
                                console.log('✅ Período limpo:', period);
                                return true;
                                
                            } catch (error) {
                                errorHandler.captureError(error, { context: 'ControleService.clearPeriod', period });
                                throw new Error('Erro ao limpar período: ' + error.message);
                            }
                        });
                    }
                    
                    /**
                     * Copiar empresas para novo período
                     */
                    async copyEmpresasToNewPeriod(fromPeriod, toPeriod, empresaIds = null) {
                        return performanceMonitor.measureAsync('controles:copyEmpresasToNewPeriod', async () => {
                            try {
                                if (!fromPeriod || !toPeriod) {
                                    throw new Error('Períodos de origem e destino são obrigatórios');
                                }
                                
                                // Buscar empresas do período de origem
                                let query = this.supabase
                                    .from('controle_mensal')
                                    .select('empresa_id')
                                    .eq('mes_ano', fromPeriod);
                                
                                if (empresaIds && empresaIds.length > 0) {
                                    query = query.in('empresa_id', empresaIds);
                                }
                                
                                const { data: existingControles, error: fetchError } = await query;
                                
                                if (fetchError) throw fetchError;
                                
                                // Criar controles vazios para o novo período
                                const newControles = existingControles.map(controle => ({
                                    empresa_id: controle.empresa_id,
                                    mes_ano: toPeriod,
                                    qtd_pequena: 0,
                                    qtd_media: 0,
                                    qtd_grande: 0,
                                    valor_total: 0,
                                    status: 'pendente',
                                    observacoes: '',
                                    lancamentos_diarios: '[]',
                                    created_at: new Date().toISOString(),
                                    updated_at: new Date().toISOString()
                                }));
                                
                                if (newControles.length === 0) {
                                    return { created: 0, skipped: 0 };
                                }
                                
                                // Inserir novos controles (ignorar duplicatas)
                                const { data, error } = await this.supabase
                                    .from('controle_mensal')
                                    .upsert(newControles, { 
                                        onConflict: 'empresa_id,mes_ano',
                                        ignoreDuplicates: true 
                                    })
                                    .select();
                                
                                if (error) throw error;
                                
                                // Limpar cache
                                this.clearCache(toPeriod);
                                
                                const result = {
                                    created: data ? data.length : 0,
                                    skipped: newControles.length - (data ? data.length : 0)
                                };
                                
                                console.log('✅ Empresas copiadas para novo período:', result);
                                return result;
                                
                            } catch (error) {
                                errorHandler.captureError(error, { 
                                    context: 'ControleService.copyEmpresasToNewPeriod', 
                                    fromPeriod, 
                                    toPeriod, 
                                    empresaIds 
                                });
                                throw new Error('Erro ao copiar empresas: ' + error.message);
                            }
                        });
                    }
                    
                    /**
                     * Obter histórico de uma empresa
                     */
                    async getEmpresaHistory(empresaId, limit = 12) {
                        return performanceMonitor.measureAsync('controles:getEmpresaHistory', async () => {
                            try {
                                if (!empresaId) throw new Error('ID da empresa é obrigatório');
                                
                                const { data, error } = await this.supabase
                                    .from('controle_mensal')
                                    .select('*')
                                    .eq('empresa_id', empresaId)
                                    .order('mes_ano', { ascending: false })
                                    .limit(limit);
                                
                                if (error) throw error;
                                
                                return data || [];
                                
                            } catch (error) {
                                errorHandler.captureError(error, { 
                                    context: 'ControleService.getEmpresaHistory', 
                                    empresaId, 
                                    limit 
                                });
                                throw new Error('Erro ao buscar histórico: ' + error.message);
                            }
                        });
                    }
                    
                    /**
                     * Atualizar apenas status
                     */
                    async updateStatus(id, newStatus) {
                        return performanceMonitor.measureAsync('controles:updateStatus', async () => {
                            try {
                                if (!id) throw new Error('ID do controle é obrigatório');
                                if (!newStatus) throw new Error('Status é obrigatório');
                                
                                const { data, error } = await this.supabase
                                    .from('controle_mensal')
                                    .update({ 
                                        status: newStatus,
                                        updated_at: new Date().toISOString()
                                    })
                                    .eq('id', id)
                                    .select()
                                    .single();
                                
                                if (error) throw error;
                                
                                // Limpar cache
                                this.clearCache(data.mes_ano);
                                
                                console.log('✅ Status atualizado:', newStatus);
                                return data;
                                
                            } catch (error) {
                                errorHandler.captureError(error, { 
                                    context: 'ControleService.updateStatus', 
                                    id, 
                                    newStatus 
                                });
                                throw new Error('Erro ao atualizar status: ' + error.message);
                            }
                        });
                    }
                    
                    /**
                     * Processar lançamentos diários para estatísticas
                     */
                    processLancamentosDiarios(lancamentosJson) {
                        try {
                            if (!lancamentosJson) return { dias: 0, extras: [] };
                            
                            const lancamentos = JSON.parse(lancamentosJson);
                            const todosExtras = [];
                            
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
                            
                            return {
                                dias: lancamentos.length,
                                extras: todosExtras
                            };
                            
                        } catch (error) {
                            console.warn('Erro ao processar lançamentos diários:', error);
                            return { dias: 0, extras: [] };
                        }
                    }
                    
                    /**
                     * Exportar controles do período
                     */
                    async export(period, format = 'json') {
                        try {
                            const controles = await this.getByPeriod(period);
                            const stats = await this.getStatsForPeriod(period);
                            
                            if (format === 'csv') {
                                return this.exportToCSV(controles);
                            }
                            
                            return {
                                period,
                                controles,
                                stats,
                                exportedAt: new Date().toISOString(),
                                total: controles.length
                            };
                            
                        } catch (error) {
                            errorHandler.captureError(error, { context: 'ControleService.export', period, format });
                            throw new Error('Erro ao exportar controles: ' + error.message);
                        }
                    }
                    
                    /**
                     * Exportar para CSV
                     */
                    exportToCSV(controles) {
                        const headers = [
                            'Empresa ID', 'Período', 'Qtd Pequena', 'Qtd Média', 'Qtd Grande', 
                            'Total Marmitas', 'Valor Total', 'Status', 'Observações', 'Atualizado em'
                        ];
                        
                        const rows = controles.map(controle => [
                            controle.empresa_id,
                            controle.mes_ano,
                            controle.qtd_pequena || 0,
                            controle.qtd_media || 0,
                            controle.qtd_grande || 0,
                            (controle.qtd_pequena || 0) + (controle.qtd_media || 0) + (controle.qtd_grande || 0),
                            controle.valor_total || 0,
                            controle.status || 'pendente',
                            controle.observacoes || '',
                            new Date(controle.updated_at).toLocaleDateString('pt-BR')
                        ]);
                        
                        const csvContent = [headers, ...rows]
                            .map(row => row.map(field => `"${field}"`).join(','))
                            .join('\n');
                        
                        return csvContent;
                    }
                    
                    /**
                     * Limpar cache
                     */
                    clearCache(period = null) {
                        if (period) {
                            stateManager.clearCacheByPattern(`controles:${period}`);
                        } else {
                            stateManager.clearCacheByPattern('controles:');
                        }
                        console.log('🧹 Cache de controles limpo');
                    }
                    
                    /**
                     * Recarregar dados
                     */
                    async reload(period = null) {
                        this.clearCache(period);
                        return await this.getByPeriod(period);
                    }
                    
                    /**
                     * Validar integridade dos dados
                     */
                    async validateDataIntegrity(period = null) {
                        try {
                            if (!period) period = getCurrentPeriod();
                            
                            const controles = await this.getByPeriod(period);
                            const issues = [];
                            
                            for (const controle of controles) {
                                // Verificar se empresa existe
                                try {
                                    const { data: empresa, error } = await this.supabase
                                        .from('empresas')
                                        .select('id')
                                        .eq('id', controle.empresa_id)
                                        .eq('ativo', true)
                                        .single();
                                    
                                    if (error || !empresa) {
                                        issues.push({
                                            type: 'empresa_inexistente',
                                            controle_id: controle.id,
                                            empresa_id: controle.empresa_id
                                        });
                                    }
                                } catch (error) {
                                    issues.push({
                                        type: 'erro_verificacao_empresa',
                                        controle_id: controle.id,
                                        empresa_id: controle.empresa_id,
                                        error: error.message
                                    });
                                }
                                
                                // Verificar consistência dos valores
                                const qtdTotal = (controle.qtd_pequena || 0) + (controle.qtd_media || 0) + (controle.qtd_grande || 0);
                                if (qtdTotal === 0 && controle.valor_total > 0) {
                                    issues.push({
                                        type: 'valor_sem_quantidade',
                                        controle_id: controle.id,
                                        valor_total: controle.valor_total
                                    });
                                }
                                
                                // Verificar JSON dos lançamentos
                                if (controle.lancamentos_diarios) {
                                    try {
                                        JSON.parse(controle.lancamentos_diarios);
                                    } catch (error) {
                                        issues.push({
                                            type: 'json_invalido',
                                            controle_id: controle.id,
                                            error: error.message
                                        });
                                    }
                                }
                            }
                            
                            return {
                                period,
                                totalControles: controles.length,
                                issues,
                                isValid: issues.length === 0
                            };
                            
                        } catch (error) {
                            errorHandler.captureError(error, { context: 'ControleService.validateDataIntegrity', period });
                            throw new Error('Erro ao validar integridade: ' + error.message);
                        }
                    }
                }
                
                // Criar instância única
                export const controleService = new ControleService();