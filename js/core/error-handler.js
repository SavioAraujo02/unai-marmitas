// ===== SISTEMA DE TRATAMENTO DE ERROS =====

class ErrorHandler {
    constructor() {
        this.errors = [];
        this.maxErrors = 100;
        this.observers = [];
        this.isInitialized = false;
    }
    
    /**
     * Inicializar tratamento de erros
     */
    init() {
        if (this.isInitialized) return;
        
        this.setupGlobalErrorHandling();
        this.setupUnhandledRejectionHandling();
        this.setupConsoleErrorCapture();
        
        this.isInitialized = true;
        console.log('✅ Error Handler inicializado');
    }
    
    /**
     * Configurar captura de erros JavaScript
     */
    setupGlobalErrorHandling() {
        window.addEventListener('error', (event) => {
            const error = {
                type: 'javascript',
                message: event.error?.message || event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack,
                timestamp: Date.now(),
                userAgent: navigator.userAgent,
                url: window.location.href
            };
            
            this.logError(error);
            this.notifyObservers(error);
            
            // Mostrar notificação amigável ao usuário
            this.showUserFriendlyError('Ocorreu um erro inesperado. A equipe foi notificada.');
        });
    }
    
    /**
     * Configurar captura de promises rejeitadas
     */
    setupUnhandledRejectionHandling() {
        window.addEventListener('unhandledrejection', (event) => {
            const error = {
                type: 'promise',
                message: event.reason?.message || String(event.reason),
                stack: event.reason?.stack,
                timestamp: Date.now(),
                userAgent: navigator.userAgent,
                url: window.location.href
            };
            
            this.logError(error);
            this.notifyObservers(error);
            
            // Mostrar notificação específica para problemas de rede/servidor
            if (this.isNetworkError(event.reason)) {
                this.showUserFriendlyError('Falha na comunicação com o servidor. Verifique sua conexão.');
            } else {
                this.showUserFriendlyError('Ocorreu um erro inesperado. Tente novamente.');
            }
            
            // Prevenir que o erro apareça no console (opcional)
            event.preventDefault();
        });
    }
    
    /**
     * Capturar erros do console (opcional)
     */
    setupConsoleErrorCapture() {
        const originalError = console.error;
        
        console.error = (...args) => {
            // Chamar console.error original
            originalError.apply(console, args);
            
            // Capturar para nosso sistema
            const error = {
                type: 'console',
                message: args.join(' '),
                timestamp: Date.now(),
                userAgent: navigator.userAgent,
                url: window.location.href
            };
            
            this.logError(error);
        };
    }
    
    /**
     * Verificar se é erro de rede
     */
    isNetworkError(error) {
        if (!error) return false;
        
        const networkMessages = [
            'fetch',
            'network',
            'connection',
            'timeout',
            'cors',
            'failed to fetch'
        ];
        
        const message = String(error.message || error).toLowerCase();
        return networkMessages.some(keyword => message.includes(keyword));
    }
    
    /**
     * Log de erro
     */
    logError(error) {
        // Adicionar à lista de erros
        this.errors.unshift(error);
        
        // Manter apenas os últimos N erros
        if (this.errors.length > this.maxErrors) {
            this.errors = this.errors.slice(0, this.maxErrors);
        }
        
        // Log detalhado no console
        console.group(`❌ ${error.type.toUpperCase()} ERROR`);
        console.error('Message:', error.message);
        if (error.filename) console.error('File:', error.filename);
        if (error.lineno) console.error('Line:', error.lineno);
        if (error.stack) console.error('Stack:', error.stack);
        console.error('Timestamp:', new Date(error.timestamp).toISOString());
        console.groupEnd();
        
        // Enviar para analytics (se configurado)
        this.sendToAnalytics(error);
    }
    
    /**
     * Mostrar erro amigável ao usuário
     */
    showUserFriendlyError(message) {
        // Usar sistema de notificações se disponível
        if (window.NotificationManager) {
            window.NotificationManager.error(message, 5000);
        } else {
            // Fallback para alert
            console.warn('Sistema de notificações não disponível, usando alert');
            alert(message);
        }
    }
    
    /**
     * Enviar erro para analytics
     */
    sendToAnalytics(error) {
        // Google Analytics (se disponível)
        if (typeof gtag !== 'undefined') {
            gtag('event', 'exception', {
                description: error.message,
                fatal: false,
                custom_map: {
                    error_type: error.type
                }
            });
        }
        
        // Sentry (se disponível)
        if (typeof Sentry !== 'undefined') {
            Sentry.captureException(new Error(error.message), {
                tags: {
                    type: error.type
                },
                extra: error
            });
        }
    }
    
    /**
     * Capturar erro manualmente
     */
    captureError(error, context = {}) {
        const errorData = {
            type: 'manual',
            message: error.message || String(error),
            stack: error.stack,
            context,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        this.logError(errorData);
        this.notifyObservers(errorData);
        
        return errorData;
    }
    
    /**
     * Wrapper para funções que podem gerar erro
     */
    wrapFunction(fn, context = '') {
        return (...args) => {
            try {
                const result = fn.apply(this, args);
                
                // Se for Promise, capturar rejeições
                if (result && typeof result.then === 'function') {
                    return result.catch(error => {
                        this.captureError(error, { context, args });
                        throw error;
                    });
                }
                
                return result;
            } catch (error) {
                this.captureError(error, { context, args });
                throw error;
            }
        };
    }
    
    /**
     * Wrapper para funções async
     */
    wrapAsync(fn, context = '') {
        return async (...args) => {
            try {
                return await fn.apply(this, args);
            } catch (error) {
                this.captureError(error, { context, args });
                throw error;
            }
        };
    }
    
    /**
     * Adicionar observer para erros
     */
    addObserver(callback) {
        this.observers.push(callback);
        
        return () => {
            const index = this.observers.indexOf(callback);
            if (index > -1) {
                this.observers.splice(index, 1);
            }
        };
    }
    
    /**
     * Notificar observers
     */
    notifyObservers(error) {
        this.observers.forEach(callback => {
            try {
                callback(error);
            } catch (err) {
                console.error('Erro no observer de erro:', err);
            }
        });
    }
    
    /**
     * Obter estatísticas de erros
     */
    getStats() {
        const stats = {
            total: this.errors.length,
            byType: {},
            recent: this.errors.slice(0, 10),
            mostCommon: null
        };
        
        // Agrupar por tipo
        this.errors.forEach(error => {
            const type = error.type;
            if (!stats.byType[type]) {
                stats.byType[type] = 0;
            }
            stats.byType[type]++;
        });
        
        // Encontrar mais comum
        let maxCount = 0;
        Object.entries(stats.byType).forEach(([type, count]) => {
            if (count > maxCount) {
                maxCount = count;
                stats.mostCommon = { type, count };
            }
        });
        
        return stats;
    }
    
    /**
     * Obter erros por período
     */
    getErrorsByPeriod(hours = 24) {
        const cutoff = Date.now() - (hours * 60 * 60 * 1000);
        return this.errors.filter(error => error.timestamp >= cutoff);
    }
    
    /**
     * Limpar erros antigos
     */
    clearOldErrors(hours = 24) {
        const cutoff = Date.now() - (hours * 60 * 60 * 1000);
        const before = this.errors.length;
        this.errors = this.errors.filter(error => error.timestamp >= cutoff);
        const after = this.errors.length;
        
        console.log(`🧹 Removidos ${before - after} erros antigos`);
    }
    
    /**
     * Exportar erros para análise
     */
    exportErrors() {
        const data = {
            errors: this.errors,
            stats: this.getStats(),
            exportTime: Date.now(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `errors-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }
    
    /**
     * Verificar saúde do sistema
     */
    getSystemHealth() {
        const recentErrors = this.getErrorsByPeriod(1); // Última hora
        const criticalErrors = recentErrors.filter(error => 
            error.type === 'javascript' || error.type === 'promise'
        );
        
        let status = 'healthy';
        let message = 'Sistema funcionando normalmente';
        
        if (criticalErrors.length > 10) {
            status = 'critical';
            message = 'Muitos erros críticos detectados';
        } else if (criticalErrors.length > 5) {
            status = 'warning';
            message = 'Alguns erros detectados';
        } else if (recentErrors.length > 20) {
            status = 'warning';
            message = 'Muitos erros menores detectados';
        }
        
        return {
            status,
            message,
            recentErrors: recentErrors.length,
            criticalErrors: criticalErrors.length,
            timestamp: Date.now()
        };
    }
    
    /**
     * Tentar recuperação automática
     */
    attemptRecovery(error) {
        // Estratégias de recuperação baseadas no tipo de erro
        switch (error.type) {
            case 'network':
                // Tentar recarregar dados após delay
                setTimeout(() => {
                    if (window.loadData) {
                        window.loadData(false);
                    }
                }, 5000);
                break;
                
            case 'storage':
                // Limpar localStorage corrompido
                try {
                    localStorage.clear();
                    location.reload();
                } catch (e) {
                    console.error('Falha na recuperação de storage:', e);
                }
                break;
                
            default:
                // Recuperação genérica - recarregar página após confirmação
                if (confirm('Ocorreu um erro. Deseja recarregar a página?')) {
                    location.reload();
                }
        }
    }
    
    /**
     * Relatório de erro para suporte
     */
    generateSupportReport() {
        const health = this.getSystemHealth();
        const stats = this.getStats();
        
        return {
            timestamp: new Date().toISOString(),
            health,
            stats,
            recentErrors: this.getErrorsByPeriod(24),
            browser: {
                userAgent: navigator.userAgent,
                language: navigator.language,
                platform: navigator.platform,
                cookieEnabled: navigator.cookieEnabled,
                onLine: navigator.onLine
            },
            page: {
                url: window.location.href,
                referrer: document.referrer,
                title: document.title
            },
            performance: window.PerformanceMonitor ? 
                window.PerformanceMonitor.getReport() : null
        };
    }
    
    /**
     * Limpar todos os erros
     */
    clear() {
        this.errors = [];
        console.log('🧹 Todos os erros foram limpos');
    }
    
    /**
     * Destruir handler
     */
    destroy() {
        this.errors = [];
        this.observers = [];
        this.isInitialized = false;
        console.log('🧹 Error Handler destruído');
    }
}

// Criar instância única
export const errorHandler = new ErrorHandler();

// Expor globalmente para debug
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    window.ErrorHandler = errorHandler;
}