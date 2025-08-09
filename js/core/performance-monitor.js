// ===== MONITOR DE PERFORMANCE =====

import { PERFORMANCE_CONFIG } from '../config/constants.js';

class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.observers = [];
        this.isEnabled = true;
    }
    
    /**
     * Iniciar medição de operação
     */
    start(operation) {
        if (!this.isEnabled) return;
        
        this.metrics.set(operation, {
            start: performance.now(),
            operation,
            memory: this.getMemoryUsage()
        });
    }
    
    /**
     * Finalizar medição de operação
     */
    end(operation) {
        if (!this.isEnabled) return;
        
        const metric = this.metrics.get(operation);
        if (!metric) return;
        
        const duration = performance.now() - metric.start;
        const result = {
            operation,
            duration,
            startMemory: metric.memory,
            endMemory: this.getMemoryUsage(),
            timestamp: Date.now()
        };
        
        this.logResult(result);
        this.notifyObservers(result);
        this.metrics.delete(operation);
        
        return result;
    }
    
    /**
     * Medir função automaticamente
     */
    measure(operation, fn) {
        if (!this.isEnabled) return fn();
        
        this.start(operation);
        
        try {
            const result = fn();
            
            // Se for Promise, aguardar conclusão
            if (result && typeof result.then === 'function') {
                return result.finally(() => {
                    this.end(operation);
                });
            }
            
            this.end(operation);
            return result;
        } catch (error) {
            this.end(operation);
            throw error;
        }
    }
    
    /**
     * Medir função async
     */
    async measureAsync(operation, asyncFn) {
        if (!this.isEnabled) return await asyncFn();
        
        this.start(operation);
        
        try {
            const result = await asyncFn();
            this.end(operation);
            return result;
        } catch (error) {
            this.end(operation);
            throw error;
        }
    }
    
    /**
     * Obter uso de memória
     */
    getMemoryUsage() {
        if (performance.memory) {
            return {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            };
        }
        return null;
    }
    
    /**
     * Obter métricas de navegação
     */
    getNavigationMetrics() {
        if (!performance.navigation) return null;
        
        const timing = performance.timing;
        
        return {
            domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
            loadComplete: timing.loadEventEnd - timing.navigationStart,
            domReady: timing.domComplete - timing.navigationStart,
            firstPaint: this.getFirstPaint(),
            firstContentfulPaint: this.getFirstContentfulPaint()
        };
    }
    
    /**
     * Obter First Paint
     */
    getFirstPaint() {
        const paintEntries = performance.getEntriesByType('paint');
        const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
        return firstPaint ? Math.round(firstPaint.startTime) : null;
    }
    
    /**
     * Obter First Contentful Paint
     */
    getFirstContentfulPaint() {
        const paintEntries = performance.getEntriesByType('paint');
        const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        return fcp ? Math.round(fcp.startTime) : null;
    }
    
    /**
     * Monitorar recursos carregados
     */
    getResourceMetrics() {
        const resources = performance.getEntriesByType('resource');
        
        const metrics = {
            total: resources.length,
            byType: {},
            slowest: null,
            totalSize: 0,
            totalDuration: 0
        };
        
        let slowestDuration = 0;
        
        resources.forEach(resource => {
            const type = this.getResourceType(resource.name);
            const duration = resource.responseEnd - resource.startTime;
            const size = resource.transferSize || 0;
            
            // Agrupar por tipo
            if (!metrics.byType[type]) {
                metrics.byType[type] = { count: 0, totalSize: 0, totalDuration: 0 };
            }
            
            metrics.byType[type].count++;
            metrics.byType[type].totalSize += size;
            metrics.byType[type].totalDuration += duration;
            
            metrics.totalSize += size;
            metrics.totalDuration += duration;
            
            // Encontrar o mais lento
            if (duration > slowestDuration) {
                slowestDuration = duration;
                metrics.slowest = {
                    name: resource.name,
                    duration: Math.round(duration),
                    size: size
                };
            }
        });
        
        return metrics;
    }
    
    /**
     * Determinar tipo de recurso
     */
    getResourceType(url) {
        if (url.includes('.css')) return 'CSS';
        if (url.includes('.js')) return 'JavaScript';
        if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return 'Image';
        if (url.match(/\.(woff|woff2|ttf|eot)$/i)) return 'Font';
        return 'Other';
    }
    
    /**
     * Monitorar FPS
     */
    startFPSMonitoring() {
        let frames = 0;
        let lastTime = performance.now();
        
        const measureFPS = () => {
            frames++;
            const currentTime = performance.now();
            
            if (currentTime >= lastTime + 1000) {
                const fps = Math.round((frames * 1000) / (currentTime - lastTime));
                
                this.notifyObservers({
                    type: 'fps',
                    value: fps,
                    timestamp: Date.now()
                });
                
                frames = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(measureFPS);
        };
        
        requestAnimationFrame(measureFPS);
    }
    
    /**
     * Detectar operações lentas
     */
    detectSlowOperations() {
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                if (entry.duration > PERFORMANCE_CONFIG.SLOW_OPERATION_THRESHOLD) {
                    console.warn(`🐌 Operação lenta detectada: ${entry.name} (${entry.duration.toFixed(2)}ms)`);
                    
                    this.notifyObservers({
                        type: 'slow-operation',
                        operation: entry.name,
                        duration: entry.duration,
                        timestamp: Date.now()
                    });
                }
            });
        });
        
        observer.observe({ entryTypes: ['measure'] });
    }
    
    /**
     * Log de resultado
     */
    logResult(result) {
        const { operation, duration } = result;
        
        if (duration > PERFORMANCE_CONFIG.SLOW_OPERATION_THRESHOLD) {
            console.warn(`🐌 ${operation}: ${duration.toFixed(2)}ms`);
        } else {
            console.log(`⏱️ ${operation}: ${duration.toFixed(2)}ms`);
        }
    }
    
    /**
     * Adicionar observer
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
    notifyObservers(data) {
        this.observers.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('Erro no observer de performance:', error);
            }
        });
    }
    
    /**
     * Obter relatório completo
     */
    getReport() {
        return {
            navigation: this.getNavigationMetrics(),
            resources: this.getResourceMetrics(),
            memory: this.getMemoryUsage(),
            activeMetrics: Array.from(this.metrics.keys()),
            timestamp: Date.now()
        };
    }
    
    /**
     * Habilitar/desabilitar monitoramento
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        
        if (enabled) {
            console.log('📊 Performance Monitor habilitado');
        } else {
            console.log('📊 Performance Monitor desabilitado');
        }
    }
    
    /**
     * Limpar métricas
     */
    clear() {
        this.metrics.clear();
        console.log('🧹 Métricas de performance limpas');
    }
    
    /**
     * Benchmark de função
     */
    benchmark(name, fn, iterations = 1000) {
        const results = [];
        
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            fn();
            const end = performance.now();
            results.push(end - start);
        }
        
        const avg = results.reduce((a, b) => a + b, 0) / results.length;
        const min = Math.min(...results);
        const max = Math.max(...results);
        
        const report = {
            name,
            iterations,
            average: avg.toFixed(3),
            min: min.toFixed(3),
            max: max.toFixed(3),
            total: results.reduce((a, b) => a + b, 0).toFixed(3)
        };
        
        console.table(report);
        return report;
    }
}

// Criar instância única
export const performanceMonitor = new PerformanceMonitor();

// Auto-inicializar em desenvolvimento
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    performanceMonitor.startFPSMonitoring();
    performanceMonitor.detectSlowOperations();
    window.PerformanceMonitor = performanceMonitor;
}