// ===== SERVIÇO DE EMPRESAS =====

import { validateEmpresa } from '../utils/validators.js';
import { stateManager } from '../core/state-manager.js';
import { errorHandler } from '../core/error-handler.js';
import { performanceMonitor } from '../core/performance-monitor.js';

class EmpresaService {
    constructor() {
        this.supabase = null;
        this.cache = new Map();
    }
    
    /**
     * Inicializar serviço
     */
    init(supabaseClient) {
        this.supabase = supabaseClient;
        console.log('✅ EmpresaService inicializado');
    }
    
    /**
     * Buscar todas as empresas ativas
     */
    async getAll() {
        return performanceMonitor.measureAsync('empresas:getAll', async () => {
            try {
                // Verificar cache primeiro
                const cached = stateManager.getCache('empresas:all');
                if (cached) {
                    console.log('📦 Empresas carregadas do cache');
                    return cached;
                }
                
                const { data, error } = await this.supabase
                    .from('empresas')
                    .select('*')
                    .eq('ativo', true)
                    .order('nome');
                
                if (error) throw error;
                
                const empresas = data || [];
                
                // Cachear resultado
                stateManager.setCache('empresas:all', empresas);
                
                console.log(`✅ ${empresas.length} empresas carregadas`);
                return empresas;
                
            } catch (error) {
                errorHandler.captureError(error, { context: 'EmpresaService.getAll' });
                throw new Error('Erro ao carregar empresas: ' + error.message);
            }
        });
    }
    
    /**
     * Buscar empresa por ID
     */
    async getById(id) {
        return performanceMonitor.measureAsync('empresas:getById', async () => {
            try {
                if (!id) throw new Error('ID da empresa é obrigatório');
                
                // Verificar cache primeiro
                const cacheKey = `empresa:${id}`;
                const cached = stateManager.getCache(cacheKey);
                if (cached) {
                    return cached;
                }
                
                const { data, error } = await this.supabase
                    .from('empresas')
                    .select('*')
                    .eq('id', id)
                    .eq('ativo', true)
                    .single();
                
                if (error) {
                    if (error.code === 'PGRST116') {
                        throw new Error('Empresa não encontrada');
                    }
                    throw error;
                }
                
                // Cachear resultado
                stateManager.setCache(cacheKey, data);
                
                return data;
                
            } catch (error) {
                errorHandler.captureError(error, { context: 'EmpresaService.getById', id });
                throw new Error('Erro ao buscar empresa: ' + error.message);
            }
        });
    }
    
    /**
     * Criar nova empresa
     */
    async create(empresaData) {
        return performanceMonitor.measureAsync('empresas:create', async () => {
            try {
                // Validar dados
                const validation = validateEmpresa(empresaData);
                if (!validation.valid) {
                    throw new Error('Dados inválidos: ' + Object.values(validation.errors).join(', '));
                }
                
                // Preparar dados para inserção
                const dataToInsert = {
                    nome: empresaData.nome.trim(),
                    contato: empresaData.contato?.trim() || null,
                    email: empresaData.email?.trim() || null,
                    telefone: empresaData.telefone?.trim() || null,
                    observacoes: empresaData.observacoes?.trim() || null,
                    ativo: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                
                const { data, error } = await this.supabase
                    .from('empresas')
                    .insert([dataToInsert])
                    .select()
                    .single();
                
                if (error) throw error;
                
                // Limpar cache
                this.clearCache();
                
                console.log('✅ Empresa criada:', data.nome);
                return data;
                
            } catch (error) {
                errorHandler.captureError(error, { context: 'EmpresaService.create', empresaData });
                throw new Error('Erro ao criar empresa: ' + error.message);
            }
        });
    }
    
    /**
     * Atualizar empresa
     */
    async update(id, empresaData) {
        return performanceMonitor.measureAsync('empresas:update', async () => {
            try {
                if (!id) throw new Error('ID da empresa é obrigatório');
                
                // Validar dados
                const validation = validateEmpresa(empresaData);
                if (!validation.valid) {
                    throw new Error('Dados inválidos: ' + Object.values(validation.errors).join(', '));
                }
                
                // Verificar se empresa existe
                await this.getById(id);
                
                // Preparar dados para atualização
                const dataToUpdate = {
                    nome: empresaData.nome.trim(),
                    contato: empresaData.contato?.trim() || null,
                    email: empresaData.email?.trim() || null,
                    telefone: empresaData.telefone?.trim() || null,
                    observacoes: empresaData.observacoes?.trim() || null,
                    updated_at: new Date().toISOString()
                };
                
                const { data, error } = await this.supabase
                    .from('empresas')
                    .update(dataToUpdate)
                    .eq('id', id)
                    .eq('ativo', true)
                    .select()
                    .single();
                
                if (error) throw error;
                
                // Limpar cache
                this.clearCache();
                
                console.log('✅ Empresa atualizada:', data.nome);
                return data;
                
            } catch (error) {
                errorHandler.captureError(error, { context: 'EmpresaService.update', id, empresaData });
                throw new Error('Erro ao atualizar empresa: ' + error.message);
            }
        });
    }
    
    /**
     * Excluir empresa (soft delete)
     */
    async delete(id) {
        return performanceMonitor.measureAsync('empresas:delete', async () => {
            try {
                if (!id) throw new Error('ID da empresa é obrigatório');
                
                // Verificar se empresa existe
                const empresa = await this.getById(id);
                
                // Verificar se tem controles associados
                const hasControles = await this.hasControles(id);
                if (hasControles) {
                    throw new Error('Não é possível excluir empresa com lançamentos associados');
                }
                
                const { error } = await this.supabase
                    .from('empresas')
                    .update({ 
                        ativo: false,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', id);
                
                if (error) throw error;
                
                // Limpar cache
                this.clearCache();
                
                console.log('✅ Empresa excluída:', empresa.nome);
                return true;
                
            } catch (error) {
                errorHandler.captureError(error, { context: 'EmpresaService.delete', id });
                throw new Error('Erro ao excluir empresa: ' + error.message);
            }
        });
    }
    
    /**
     * Verificar se empresa tem controles
     */
    async hasControles(empresaId) {
        try {
            const { data, error } = await this.supabase
                .from('controle_mensal')
                .select('id')
                .eq('empresa_id', empresaId)
                .limit(1);
            
            if (error) throw error;
            
            return data && data.length > 0;
            
        } catch (error) {
            console.warn('Erro ao verificar controles da empresa:', error);
            return false;
        }
    }
    
    /**
     * Buscar empresas por nome
     */
    async searchByName(searchTerm) {
        return performanceMonitor.measureAsync('empresas:searchByName', async () => {
            try {
                if (!searchTerm || searchTerm.trim().length < 2) {
                    return [];
                }
                
                const { data, error } = await this.supabase
                    .from('empresas')
                    .select('*')
                    .eq('ativo', true)
                    .ilike('nome', `%${searchTerm.trim()}%`)
                    .order('nome')
                    .limit(20);
                
                if (error) throw error;
                
                return data || [];
                
            } catch (error) {
                errorHandler.captureError(error, { context: 'EmpresaService.searchByName', searchTerm });
                throw new Error('Erro ao buscar empresas: ' + error.message);
            }
        });
    }
    
    /**
     * Obter estatísticas das empresas
     */
    async getStats() {
        return performanceMonitor.measureAsync('empresas:getStats', async () => {
            try {
                const { data, error } = await this.supabase
                    .from('empresas')
                    .select('id, created_at, ativo');
                
                if (error) throw error;
                
                const stats = {
                    total: data.length,
                    ativas: data.filter(e => e.ativo).length,
                    inativas: data.filter(e => !e.ativo).length,
                    criadasEsteAno: data.filter(e => {
                        const year = new Date(e.created_at).getFullYear();
                        return year === new Date().getFullYear();
                    }).length
                };
                
                return stats;
                
            } catch (error) {
                errorHandler.captureError(error, { context: 'EmpresaService.getStats' });
                throw new Error('Erro ao obter estatísticas: ' + error.message);
            }
        });
    }
    
    /**
     * Validar se email já existe
     */
    async emailExists(email, excludeId = null) {
        try {
            if (!email) return false;
            
            let query = this.supabase
                .from('empresas')
                .select('id')
                .eq('email', email.trim())
                .eq('ativo', true);
            
            if (excludeId) {
                query = query.neq('id', excludeId);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            
            return data && data.length > 0;
            
        } catch (error) {
            console.warn('Erro ao verificar email:', error);
            return false;
        }
    }
    
    /**
     * Limpar cache
     */
    clearCache() {
        stateManager.clearCacheByPattern('empresa');
        console.log('🧹 Cache de empresas limpo');
    }
    
    /**
     * Recarregar dados
     */
    async reload() {
        this.clearCache();
        return await this.getAll();
    }
    
    /**
     * Exportar empresas
     */
    async export(format = 'json') {
        try {
            const empresas = await this.getAll();
            
            if (format === 'csv') {
                return this.exportToCSV(empresas);
            }
            
            return {
                empresas,
                exportedAt: new Date().toISOString(),
                total: empresas.length
            };
            
        } catch (error) {
            errorHandler.captureError(error, { context: 'EmpresaService.export', format });
            throw new Error('Erro ao exportar empresas: ' + error.message);
        }
    }
    
    /**
     * Exportar para CSV
     */
    exportToCSV(empresas) {
        const headers = ['ID', 'Nome', 'Contato', 'Email', 'Telefone', 'Observações', 'Criado em'];
        const rows = empresas.map(empresa => [
            empresa.id,
            empresa.nome,
            empresa.contato || '',
            empresa.email || '',
            empresa.telefone || '',
            empresa.observacoes || '',
            new Date(empresa.created_at).toLocaleDateString('pt-BR')
        ]);
        
        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');
        
        return csvContent;
    }
}

// Criar instância única
export const empresaService = new EmpresaService();