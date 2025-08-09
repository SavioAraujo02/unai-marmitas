// ===== GERENCIADOR DE EVENTOS CENTRALIZADO =====

import { debounce, throttle, createRippleEffect } from '../utils/dom-utils.js';
import { stateManager } from './state-manager.js';

class EventManager {
    constructor() {
        this.listeners = new Map();
        this.globalListeners = [];
        this.isInitialized = false;
    }
    
    /**
     * Inicializar gerenciador de eventos
     */
    init() {
        if (this.isInitialized) return;
        
        this.setupGlobalListeners();
        this.setupKeyboardShortcuts();
        this.setupTouchEvents();
        this.setupVisibilityEvents();
        this.setupConnectionEvents();
        
        this.isInitialized = true;
        console.log('✅ Event Manager inicializado');
    }
    
    /**
     * Configurar listeners globais
     */
    setupGlobalListeners() {
        // Delegação de eventos para botões
        this.addGlobalListener('click', (event) => {
            const target = event.target;
            
            // Ripple effect em botões
            if (target.classList.contains('btn') && !target.classList.contains('btn-ghost')) {
                createRippleEffect(target, event);
            }
            
            // Loading feedback em botões de ação
            if (target.closest('.empresa-actions')) {
                const empresaCard = target.closest('.empresa-card');
                const empresaId = empresaCard ? parseInt(empresaCard.dataset.empresaId) : null;
                
                if (empresaId) {
                    target.classList.add('btn-loading');
                    setTimeout(() => {
                        target.classList.remove('btn-loading');
                    }, 500);
                }
            }
        });
        
        // Prevenir zoom acidental no mobile
        if (this.isMobile()) {
            let lastTouchEnd = 0;
            this.addGlobalListener('touchend', (event) => {
                const now = Date.now();
                if (now - lastTouchEnd <= 300) {
                    event.preventDefault();
                }
                lastTouchEnd = now;
            });
        }
        
        // Auto-save quando sair da página
        this.addGlobalListener('beforeunload', () => {
            stateManager.saveState();
        });
        
        // Resize com throttle
        const throttledResize = throttle(() => {
            document.body.classList.toggle('mobile-layout', this.isMobile());
            this.emit('resize', { width: window.innerWidth, height: window.innerHeight });
        }, 250);
        
        this.addGlobalListener('resize', throttledResize);
    }
    
    /**
     * Configurar atalhos de teclado
     */
    setupKeyboardShortcuts() {
        this.addGlobalListener('keydown', (event) => {
            // Ignorar se está digitando em input
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
                return;
            }
            
            const isCtrlOrCmd = event.ctrlKey || event.metaKey;
            
            // Ctrl/Cmd + N = Nova empresa
            if (isCtrlOrCmd && event.key === 'n') {
                event.preventDefault();
                this.emit('shortcut:nova-empresa');
            }
            
            // Ctrl/Cmd + L = Lançamentos
            if (isCtrlOrCmd && event.key === 'l') {
                event.preventDefault();
                this.emit('shortcut:lancamentos');
            }
            
            // Ctrl/Cmd + K = Busca
            if (isCtrlOrCmd && event.key === 'k') {
                event.preventDefault();
                this.emit('shortcut:busca');
            }
            
            // Esc = Fechar modais
            if (event.key === 'Escape') {
                this.emit('shortcut:escape');
            }
            
            // F5 = Recarregar dados
            if (event.key === 'F5') {
                event.preventDefault();
                this.emit('shortcut:refresh');
            }
        });
    }
    
    /**
     * Configurar eventos de touch
     */
    setupTouchEvents() {
        if (!this.isTouchDevice()) return;
        
        // Swipe gestures (futuro)
        let startX, startY;
        
        this.addGlobalListener('touchstart', (event) => {
            const touch = event.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
        });
        
        this.addGlobalListener('touchend', (event) => {
            if (!startX || !startY) return;
            
            const touch = event.changedTouches[0];
            const endX = touch.clientX;
            const endY = touch.clientY;
            
            const diffX = startX - endX;
            const diffY = startY - endY;
            
            // Detectar swipe horizontal
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                if (diffX > 0) {
                    this.emit('swipe:left');
                } else {
                    this.emit('swipe:right');
                }
            }
            
            startX = startY = null;
        });
    }
    
    /**
     * Configurar eventos de visibilidade
     */
    setupVisibilityEvents() {
        this.addGlobalListener('visibilitychange', () => {
            if (document.hidden) {
                this.emit('page:hidden');
            } else {
                this.emit('page:visible');
            }
        });
    }
    
    /**
     * Configurar eventos de conexão
     */
    setupConnectionEvents() {
        this.addGlobalListener('online', () => {
            this.emit('connection:online');
        });
        
        this.addGlobalListener('offline', () => {
            this.emit('connection:offline');
        });
    }
    
    /**
     * Adicionar listener global
     */
    addGlobalListener(event, handler, options = {}) {
        document.addEventListener(event, handler, options);
        this.globalListeners.push({ event, handler, options });
    }
    
    /**
     * Adicionar listener customizado
     */
    on(event, handler) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        
        this.listeners.get(event).push(handler);
        
        // Retornar função para remover listener
        return () => {
            this.off(event, handler);
        };
    }
    
    /**
     * Remover listener
     */
    off(event, handler) {
        if (!this.listeners.has(event)) return;
        
        const handlers = this.listeners.get(event);
        const index = handlers.indexOf(handler);
        
        if (index > -1) {
            handlers.splice(index, 1);
        }
        
        if (handlers.length === 0) {
            this.listeners.delete(event);
        }
    }
    
    /**
     * Emitir evento customizado
     */
    emit(event, data = null) {
        if (!this.listeners.has(event)) return;
        
        const handlers = this.listeners.get(event);
        handlers.forEach(handler => {
            try {
                handler(data);
            } catch (error) {
                console.error(`Erro no handler do evento ${event}:`, error);
            }
        });
    }
    
    /**
     * Configurar busca com debounce
     */
    setupSearch(inputElement, callback, delay = 300) {
        if (!inputElement) return;
        
        const debouncedCallback = debounce(callback, delay);
        
        const handler = (event) => {
            debouncedCallback(event.target.value);
        };
        
        inputElement.addEventListener('input', handler);
        
        // Limpar busca com Escape
        const escapeHandler = (event) => {
            if (event.key === 'Escape') {
                inputElement.value = '';
                callback('');
                inputElement.blur();
            }
        };
        
        inputElement.addEventListener('keydown', escapeHandler);
        
        // Retornar função para cleanup
        return () => {
            inputElement.removeEventListener('input', handler);
            inputElement.removeEventListener('keydown', escapeHandler);
        };
    }
    
    /**
     * Configurar filtros
     */
    setupFilters(containerElement, callback) {
        if (!containerElement) return;
        
        const handler = (event) => {
            const filterBtn = event.target.closest('.filter-btn');
            if (!filterBtn) return;
            
            // Atualizar UI
            containerElement.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            filterBtn.classList.add('active');
            
            // Callback
            const filter = filterBtn.dataset.filter;
            callback(filter);
        };
        
        containerElement.addEventListener('click', handler);
        
        return () => {
            containerElement.removeEventListener('click', handler);
        };
    }
    
    /**
 * Configurar FAB menu
 */
setupFAB(fabElement, menuItems = []) {
    if (!fabElement) return;
    
    let isOpen = false;
    let menuElement = null;
    let overlayElement = null;
    
    const openFABMenu = () => {
        if (isOpen) return;
        
        isOpen = true;
        fabElement.classList.add('menu-open', 'rotating');
        
        // Criar overlay
        overlayElement = document.createElement('div');
        overlayElement.className = 'fab-overlay';
        document.body.appendChild(overlayElement);
        
        // Criar menu
        menuElement = this.createFABMenu(menuItems);
        document.body.appendChild(menuElement);
        
        // Animar entrada dos itens
        setTimeout(() => {
            menuElement.querySelectorAll('.fab-item').forEach((item, index) => {
                setTimeout(() => {
                    item.classList.add('show');
                }, index * 100);
            });
        }, 50);
        
        // Fechar ao clicar no overlay
        overlayElement.addEventListener('click', closeFABMenu);
    };
    
    const closeFABMenu = () => {
        if (!isOpen) return;
        
        isOpen = false;
        fabElement.classList.remove('menu-open', 'rotating');
        
        if (menuElement) {
            // Animar saída
            menuElement.querySelectorAll('.fab-item').forEach((item, index) => {
                setTimeout(() => {
                    item.classList.remove('show');
                    item.classList.add('exiting');
                }, index * 50);
            });
            
            setTimeout(() => {
                if (menuElement && menuElement.parentNode) {
                    menuElement.parentNode.removeChild(menuElement);
                }
                menuElement = null;
            }, 300);
        }
        
        if (overlayElement) {
            setTimeout(() => {
                if (overlayElement && overlayElement.parentNode) {
                    overlayElement.parentNode.removeChild(overlayElement);
                }
                overlayElement = null;
            }, 100);
        }
    };
    
    const toggleMenu = (e) => {
        e.stopPropagation();
        if (isOpen) {
            closeFABMenu();
        } else {
            openFABMenu();
        }
    };
    
    // Event listener principal
    fabElement.addEventListener('click', toggleMenu);
    
    // Fechar com ESC
    const escapeHandler = (e) => {
        if (e.key === 'Escape' && isOpen) {
            closeFABMenu();
        }
    };
    document.addEventListener('keydown', escapeHandler);
    
    // Expor métodos
    this.openFABMenu = openFABMenu;
    this.closeFABMenu = closeFABMenu;
    
    return () => {
        document.removeEventListener('keydown', escapeHandler);
        if (overlayElement && overlayElement.parentNode) {
            overlayElement.parentNode.removeChild(overlayElement);
        }
        if (menuElement && menuElement.parentNode) {
            menuElement.parentNode.removeChild(menuElement);
        }
    };
}

/**
 * Criar menu FAB
 */
createFABMenu(items) {
    const menu = document.createElement('div');
    menu.className = 'fab-menu';
    
    items.forEach((item, index) => {
        const button = document.createElement('button');
        button.className = 'fab-item';
        button.title = item.label;
        
        button.innerHTML = `
            <i class="${item.icon}"></i>
            <span class="fab-label">${item.label}</span>
        `;
        
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            item.action();
            this.closeFABMenu();
        });
        
        menu.appendChild(button);
    });
    
    return menu;
}
    
    /**
     * Criar menu FAB
     */
    createFABMenu(items) {
        const menu = document.createElement('div');
        menu.className = 'fab-menu';
        
        items.forEach((item, index) => {
            const button = document.createElement('button');
            button.className = 'fab-item';
            button.style.transform = 'translateY(20px) scale(0.8)';
            button.style.opacity = '0';
            button.title = item.label;
            
            button.innerHTML = `
                <i class="${item.icon}"></i>
                <span class="fab-label">${item.label}</span>
            `;
            
            button.addEventListener('click', () => {
                item.action();
                this.closeFABMenu();
            });
            
            menu.appendChild(button);
        });
        
        return menu;
    }
    
    /**
     * Utilitários
     */
    isMobile() {
        return window.innerWidth <= 768;
    }
    
    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }
    
    /**
     * Cleanup - remover todos os listeners
     */
    destroy() {
        // Remover listeners globais
        this.globalListeners.forEach(({ event, handler, options }) => {
            document.removeEventListener(event, handler, options);
        });
        
        // Limpar listeners customizados
        this.listeners.clear();
        this.globalListeners = [];
        this.isInitialized = false;
        
        console.log('🧹 Event Manager destruído');
    }
}

// Criar instância única
export const eventManager = new EventManager();

// Expor globalmente para debug
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    window.EventManager = eventManager;
}