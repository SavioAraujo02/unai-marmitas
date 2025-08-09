// ===== GERENCIADOR DE ESTADO CENTRALIZADO =====

import { DEFAULT_PRICES, CACHE_CONFIG, STORAGE_KEYS } from '../config/constants.js';
import { getCurrentPeriod } from '../utils/date-utils.js';

class StateManager {
    constructor() {
        this.state = {
            // Dados principais
            currentMonth: getCurrentPeriod(),
            currentFilter: 'todos',
            empresas: [],
            controles: [],
            precos: { ...DEFAULT_PRICES },
            
            // Estado da UI
            isLoading: false,
            searchTerm: '',
            selectedEmpresa: null,
            
            // Configurações
            config: {
                autoSave: true,
                autoBackup: false,
                notificationsEnabled: true,
                darkMode: false,
                autoRefresh: true
            }
        };
        
        this.observers = {
            empresas: [],
            controles: [],
            loading: [],
            filter: [],
            search: [],
            config: []
        };
        
        this.cache = new Map();
        this.cacheExpiry = new Map();
        
        // Restaurar estado salvo
        this.restoreState();
        
        // Auto-save periódico
        this.setupAutoSave();
    }
    
    /**
     * Subscrever a mudanças de estado
     */
    subscribe(event, callback) {
        if (this.observers[event]) {
            this.observers[event].push(callback);
        }
        
        return () => {
            this.unsubscribe(event, callback);
        };
    }
    
    /**
     * Cancelar subscrição
     */
    unsubscribe(event, callback) {
        if (this.observers[event]) {
            const index = this.observers[event].indexOf(callback);
            if (index > -1) {
                this.observers[event].splice(index, 1);
            }
        }
    }
    
    /**
     * Notificar observadores
     */
    notify(event, data) {
        if (this.observers[event]) {
            this.observers[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Erro no observer ${event}:`, error);
                }
            });
        }
    }
    
    /**
     * Atualizar empresas
     */
    updateEmpresas(empresas) {
        this.state.empresas = empresas || [];
        this.notify('empresas', this.state.empresas);
        this.saveState();
    }
    
    /**
     * Atualizar controles
     */
    updateControles(controles) {
        this.state.controles = controles || [];
        this.notify('controles', this.state.controles);
        this.saveState();
    }
    
    /**
     * Atualizar preços
     */
    updatePrecos(precos) {
        this.state.precos = { ...precos };
        this.notify('precos', this.state.precos);
        this.saveState();
    }
    
    /**
     * Definir estado de loading
     */
    setLoading(isLoading) {
        this.state.isLoading = isLoading;
        this.notify('loading', isLoading);
        this.updateLoadingUI(isLoading);
    }
    
    /**
     * Definir filtro atual
     */
    setFilter(filter) {
        this.state.currentFilter = filter;
        this.notify('filter', filter);
        this.saveState();
    }
    
    /**
     * Definir termo de busca
     */
    setSearchTerm(searchTerm) {
        this.state.searchTerm = searchTerm;
        this.notify('search', searchTerm);
    }
    
    /**
     * Definir mês atual
     */
    setCurrentMonth(month) {
        this.state.currentMonth = month;
        this.notify('month', month);
        this.saveState();
    }
    
    /**
     * Atualizar configurações
     */
    updateConfig(newConfig) {
        this.state.config = { ...this.state.config, ...newConfig };
        this.notify('config', this.state.config);
        this.saveState();
    }
    
    /**
     * Obter estado atual
     */
    getState() {
        return { ...this.state };
    }
    
    /**
     * Obter valor específico do estado
     */
    get(key) {
        return this.state[key];
    }
    
    /**
     * Cache com TTL
     */
    setCache(key, value, ttl = CACHE_CONFIG.DEFAULT_TTL) {
        this.cache.set(key, value);
        this.cacheExpiry.set(key, Date.now() + ttl);
    }
    
    /**
     * Obter do cache
     */
    getCache(key) {
        if (this.cacheExpiry.has(key) && Date.now() > this.cacheExpiry.get(key)) {
            this.cache.delete(key);
            this.cacheExpiry.delete(key);
            return null;
        }
        return this.cache.get(key);
    }
    
    /**
     * Limpar cache
     */
    clearCache() {
        this.cache.clear();
        this.cacheExpiry.clear();
    }
    
    /**
     * Limpar cache específico
     */
    clearCacheByPattern(pattern) {
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
                this.cacheExpiry.delete(key);
            }
        }
    }
    
    /**
     * Salvar estado no localStorage
     */
    saveState() {
        if (!this.state.config.autoSave) return;
        
        try {
            const stateToSave = {
                currentMonth: this.state.currentMonth,
                currentFilter: this.state.currentFilter,
                searchTerm: this.state.searchTerm,
                config: this.state.config,
                lastSave: Date.now()
            };
            
            localStorage.setItem(STORAGE_KEYS.APP_STATE, JSON.stringify(stateToSave));
        } catch (error) {
            console.error('Erro ao salvar estado:', error);
        }
    }
    
    /**
     * Restaurar estado do localStorage
     */
    restoreState() {
        try {
            const savedState = localStorage.getItem(STORAGE_KEYS.APP_STATE);
            if (savedState) {
                const state = JSON.parse(savedState);
                
                this.state.currentMonth = state.currentMonth || this.state.currentMonth;
                this.state.currentFilter = state.currentFilter || 'todos';
                this.state.searchTerm = state.searchTerm || '';
                this.state.config = { ...this.state.config, ...state.config };
                
                console.log('📦 Estado restaurado do localStorage');
            }
        } catch (error) {
            console.warn('⚠️ Erro ao restaurar estado:', error);
        }
    }
    
    /**
     * Configurar auto-save
     */
    setupAutoSave() {
        setInterval(() => {
            if (this.state.config.autoSave) {
                this.saveState();
            }
        }, 60 * 1000); // A cada minuto
    }
    
    /**
     * Atualizar UI de loading
     */
    updateLoadingUI(isLoading) {
        const loadingElements = document.querySelectorAll('.btn-loading');
        loadingElements.forEach(btn => {
            if (isLoading) {
                btn.classList.add('btn-loading');
                btn.disabled = true;
            } else {
                btn.classList.remove('btn-loading');
                btn.disabled = false;
            }
        });
        
        // Atualizar body class
        document.body.classList.toggle('loading', isLoading);
    }
    
    /**
     * Reset completo do estado
     */
    reset() {
        this.state = {
            currentMonth: getCurrentPeriod(),
            currentFilter: 'todos',
            empresas: [],
            controles: [],
            precos: { ...DEFAULT_PRICES },
            isLoading: false,
            searchTerm: '',
            selectedEmpresa: null,
            config: {
                autoSave: true,
                autoBackup: false,
                notificationsEnabled: true,
                darkMode: false,
                autoRefresh: true
            }
        };
        
        this.clearCache();
        localStorage.removeItem(STORAGE_KEYS.APP_STATE);
        
        // Notificar todos os observadores
        Object.keys(this.observers).forEach(event => {
            this.notify(event, this.state[event]);
        });
    }
    
    /**
     * Obter estatísticas do estado
     */
    getStats() {
        return {
            empresas: this.state.empresas.length,
            controles: this.state.controles.length,
            cacheSize: this.cache.size,
            observers: Object.keys(this.observers).reduce((acc, key) => {
                acc[key] = this.observers[key].length;
                return acc;
            }, {}),
            lastSave: this.getLastSaveTime()
        };
    }
    
    /**
     * Obter último tempo de save
     */
    getLastSaveTime() {
        try {
            const savedState = localStorage.getItem(STORAGE_KEYS.APP_STATE);
            if (savedState) {
                const state = JSON.parse(savedState);
                return state.lastSave;
            }
        } catch (error) {
            return null;
        }
        return null;
    }
}

// Criar instância única (Singleton)
export const stateManager = new StateManager();

// Expor globalmente para debug (apenas em desenvolvimento)
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    window.StateManager = stateManager;
}