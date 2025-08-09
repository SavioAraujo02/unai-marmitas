// ===== MODAL BASE =====

import { createElement, animateIn, animateOut, onClickOutside } from '../../utils/dom-utils.js';
import { eventManager } from '../../core/event-manager.js';

export class BaseModal {
    constructor(options = {}) {
        this.options = {
            id: options.id || `modal-${Date.now()}`,
            title: options.title || '',
            size: options.size || 'medium', // small, medium, large, extra-large, full-screen
            closable: options.closable !== false,
            backdrop: options.backdrop !== false,
            keyboard: options.keyboard !== false,
            autoFocus: options.autoFocus !== false,
            className: options.className || '',
            ...options
        };
        
        this.element = null;
        this.isOpen = false;
        this.removeClickOutside = null;
        this.onCloseCallbacks = [];
        this.onOpenCallbacks = [];
    }
    
    /**
     * Criar estrutura do modal
     */
    create() {
        if (this.element) return this.element;
        
        // Overlay
        this.element = createElement('div', {
            className: `modal-overlay ${this.options.className}`,
            id: this.options.id
        });
        
        // Container do modal
        const modalContainer = createElement('div', {
            className: `modal-content modal-${this.options.size}`
        });
        
        // Header
        if (this.options.title || this.options.closable) {
            const header = this.createHeader();
            modalContainer.appendChild(header);
        }
        
        // Body
        const body = createElement('div', {
            className: 'modal-body'
        });
        modalContainer.appendChild(body);
        
        // Footer (será adicionado pelos modais filhos se necessário)
        const footer = createElement('div', {
            className: 'modal-footer'
        });
        modalContainer.appendChild(footer);
        
        this.element.appendChild(modalContainer);
        
        // Configurar eventos
        this.setupEvents();
        
        return this.element;
    }
    
    /**
     * Criar header do modal
     */
    createHeader() {
        const header = createElement('div', {
            className: 'modal-header'
        });
        
        if (this.options.title) {
            const title = createElement('h2', {
                className: 'modal-title',
                textContent: this.options.title
            });
            header.appendChild(title);
        }
        
        if (this.options.closable) {
            const closeBtn = createElement('button', {
                className: 'modal-close',
                innerHTML: '&times;',
                title: 'Fechar'
            });
            
            closeBtn.addEventListener('click', () => this.close());
            header.appendChild(closeBtn);
        }
        
        return header;
    }
    
    /**
     * Configurar eventos
     */
    setupEvents() {
        // Fechar com ESC
        if (this.options.keyboard) {
            this.keydownHandler = (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.close();
                }
            };
            document.addEventListener('keydown', this.keydownHandler);
        }
        
        // Fechar clicando no backdrop
        if (this.options.backdrop) {
            this.element.addEventListener('click', (e) => {
                if (e.target === this.element) {
                    this.close();
                }
            });
        }
    }
    
    /**
     * Abrir modal
     */
    open() {
        if (this.isOpen) return;
        
        if (!this.element) {
            this.create();
        }
        
        // Adicionar ao DOM
        document.body.appendChild(this.element);
        
        // Prevenir scroll do body
        document.body.style.overflow = 'hidden';
        
        // Animar entrada
        this.element.style.opacity = '0';
        this.element.style.display = 'flex';
        
        requestAnimationFrame(() => {
            this.element.style.opacity = '1';
            const content = this.element.querySelector('.modal-content');
            if (content) {
                animateIn(content, 'modal-enter');
            }
        });
        
        this.isOpen = true;
        
        // Auto focus
        if (this.options.autoFocus) {
            setTimeout(() => {
                const firstInput = this.element.querySelector('input, textarea, select, button');
                if (firstInput) {
                    firstInput.focus();
                }
            }, 100);
        }
        
        // Callbacks
        this.onOpenCallbacks.forEach(callback => callback());
        
        return this;
    }
    
    /**
     * Fechar modal
     */
    close() {
        if (!this.isOpen) return;
        
        const content = this.element.querySelector('.modal-content');
        
        // Animar saída
        if (content) {
            content.style.transform = 'translateY(-20px) scale(0.95)';
            content.style.opacity = '0';
        }
        
        this.element.style.opacity = '0';
        
        setTimeout(() => {
            if (this.element && this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }
            
            // Restaurar scroll do body
            document.body.style.overflow = '';
            
            this.isOpen = false;
            
            // Callbacks
            this.onCloseCallbacks.forEach(callback => callback());
            
        }, 300);
        
        return this;
    }
    
    /**
     * Definir conteúdo do body
     */
    setBody(content) {
        const body = this.element.querySelector('.modal-body');
        if (body) {
            if (typeof content === 'string') {
                body.innerHTML = content;
            } else if (content instanceof HTMLElement) {
                body.innerHTML = '';
                body.appendChild(content);
            }
        }
        return this;
    }
    
    /**
     * Definir conteúdo do footer
     */
    setFooter(content) {
        const footer = this.element.querySelector('.modal-footer');
        if (footer) {
            if (typeof content === 'string') {
                footer.innerHTML = content;
            } else if (content instanceof HTMLElement) {
                footer.innerHTML = '';
                footer.appendChild(content);
            }
        }
        return this;
    }
    
    /**
     * Adicionar botões ao footer
     */
    addButtons(buttons) {
        const footer = this.element.querySelector('.modal-footer');
        if (!footer) return this;
        
        footer.innerHTML = '';
        
        buttons.forEach(button => {
            const btn = createElement('button', {
                className: `btn ${button.className || 'btn-secondary'}`,
                textContent: button.text
            });
            
            if (button.onClick) {
                btn.addEventListener('click', button.onClick);
            }
            
            footer.appendChild(btn);
        });
        
        return this;
    }
    
    /**
     * Adicionar callback de fechamento
     */
    onClose(callback) {
        this.onCloseCallbacks.push(callback);
        return this;
    }
    
    /**
     * Adicionar callback de abertura
     */
    onOpen(callback) {
        this.onOpenCallbacks.push(callback);
        return this;
    }
    
    /**
     * Obter elemento do modal
     */
    getElement() {
        return this.element;
    }
    
    /**
     * Verificar se está aberto
     */
    isModalOpen() {
        return this.isOpen;
    }
    
    /**
     * Destruir modal
     */
    destroy() {
        this.close();
        
        // Remover event listeners
        if (this.keydownHandler) {
            document.removeEventListener('keydown', this.keydownHandler);
        }
        
        if (this.removeClickOutside) {
            this.removeClickOutside();
        }
        
        // Limpar callbacks
        this.onCloseCallbacks = [];
        this.onOpenCallbacks = [];
        
        this.element = null;
    }
    
    /**
     * Atualizar título
     */
    setTitle(title) {
        const titleElement = this.element.querySelector('.modal-title');
        if (titleElement) {
            titleElement.textContent = title;
        }
        return this;
    }
    
    /**
     * Mostrar loading no modal
     */
    showLoading(message = 'Carregando...') {
        const body = this.element.querySelector('.modal-body');
        if (body) {
            body.innerHTML = `
                <div class="modal-loading">
                    <div class="loading-spinner"></div>
                    <p>${message}</p>
                </div>
            `;
        }
        return this;
    }
    
    /**
     * Mostrar erro no modal
     */
    showError(message) {
        const body = this.element.querySelector('.modal-body');
        if (body) {
            body.innerHTML = `
                <div class="modal-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>${message}</p>
                </div>
            `;
        }
        return this;
    }
    
    /**
     * Redimensionar modal
     */
    resize(size) {
        const content = this.element.querySelector('.modal-content');
        if (content) {
            content.className = content.className.replace(/modal-(small|medium|large|extra-large|full-screen)/, `modal-${size}`);
        }
        return this;
    }
}