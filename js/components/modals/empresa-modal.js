// ===== MODAL DE EMPRESA =====

import { BaseModal } from './base-modal.js';
import { validateEmpresa } from '../../utils/validators.js';
import { formatPhone } from '../../utils/formatters.js';
import { empresaService } from '../../services/empresa-service.js';
import { stateManager } from '../../core/state-manager.js';
import { errorHandler } from '../../core/error-handler.js';

export class EmpresaModal extends BaseModal {
    constructor(empresaId = null) {
        super({
            id: 'empresaModal',
            title: empresaId ? 'Editar Empresa' : 'Nova Empresa',
            size: 'medium',
            className: 'empresa-modal'
        });
        
        this.empresaId = empresaId;
        this.empresa = null;
        this.form = null;
        this.isLoading = false;
    }
    
    /**
     * Abrir modal
     */
    async open() {
        super.open();
        
        try {
            if (this.empresaId) {
                this.showLoading('Carregando dados da empresa...');
                this.empresa = await empresaService.getById(this.empresaId);
            }
            
            this.createForm();
            
        } catch (error) {
            this.showError('Erro ao carregar empresa: ' + error.message);
        }
        
        return this;
    }
    
    /**
     * Criar formulário
     */
    createForm() {
        const formHTML = `
            <form id="empresaForm" class="empresa-form">
                <div class="form-group">
                    <label for="nome" class="required">Nome da Empresa</label>
                    <input 
                        type="text" 
                        id="nome" 
                        name="nome" 
                        required 
                        maxlength="100"
                        value="${this.empresa ? this.empresa.nome : ''}" 
                        placeholder="Ex: Empresa ABC Ltda"
                        class="form-control">
                    <div class="form-error" id="nome-error"></div>
                </div>
                
                <div class="form-group">
                    <label for="contato">Pessoa de Contato</label>
                    <input 
                        type="text" 
                        id="contato" 
                        name="contato" 
                        maxlength="100"
                        value="${this.empresa ? this.empresa.contato || '' : ''}" 
                        placeholder="Ex: João Silva"
                        class="form-control">
                    <div class="form-error" id="contato-error"></div>
                </div>
                
                <div class="form-group">
                    <label for="email">Email</label>
                    <input 
                        type="email" 
                        id="email" 
                        name="email" 
                        maxlength="100"
                        value="${this.empresa ? this.empresa.email || '' : ''}" 
                        placeholder="Ex: contato@empresa.com"
                        class="form-control">
                    <div class="form-error" id="email-error"></div>
                </div>
                
                <div class="form-group">
                    <label for="telefone">Telefone</label>
                    <input 
                        type="tel" 
                        id="telefone" 
                        name="telefone" 
                        maxlength="20"
                        value="${this.empresa ? this.empresa.telefone || '' : ''}" 
                        placeholder="Ex: (38) 99999-9999"
                        class="form-control">
                    <div class="form-error" id="telefone-error"></div>
                </div>
                
                <div class="form-group">
                                        <label for="observacoes">Observações</label>
                    <textarea 
                        id="observacoes" 
                        name="observacoes" 
                        rows="3" 
                        maxlength="500"
                        placeholder="Observações adicionais sobre a empresa..."
                        class="form-control">${this.empresa ? this.empresa.observacoes || '' : ''}</textarea>
                    <div class="form-error" id="observacoes-error"></div>
                    <small class="form-help">Máximo 500 caracteres</small>
                </div>
            </form>
        `;
        
        this.setBody(formHTML);
        
        // Configurar botões
        this.addButtons([
            {
                text: 'Cancelar',
                className: 'btn-secondary',
                onClick: () => this.close()
            },
            {
                text: this.empresaId ? 'Atualizar' : 'Cadastrar',
                className: 'btn-primary',
                onClick: () => this.save()
            }
        ]);
        
        // Configurar eventos do formulário
        this.setupFormEvents();
    }
    
    /**
     * Configurar eventos do formulário
     */
    setupFormEvents() {
        this.form = this.element.querySelector('#empresaForm');
        
        // Validação em tempo real
        const inputs = this.form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
        
        // Formatação automática do telefone
        const telefoneInput = this.form.querySelector('#telefone');
        if (telefoneInput) {
            telefoneInput.addEventListener('input', (e) => {
                e.target.value = formatPhone(e.target.value);
            });
        }
        
        // Submit do formulário
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.save();
        });
        
        // Contador de caracteres para observações
        const observacoesInput = this.form.querySelector('#observacoes');
        if (observacoesInput) {
            const counter = document.createElement('div');
            counter.className = 'char-counter';
            observacoesInput.parentNode.appendChild(counter);
            
            const updateCounter = () => {
                const remaining = 500 - observacoesInput.value.length;
                counter.textContent = `${remaining} caracteres restantes`;
                counter.className = `char-counter ${remaining < 50 ? 'warning' : ''}`;
            };
            
            observacoesInput.addEventListener('input', updateCounter);
            updateCounter();
        }
    }
    
    /**
     * Validar campo individual
     */
    validateField(input) {
        const value = input.value.trim();
        const fieldName = input.name;
        let error = '';
        
        switch (fieldName) {
            case 'nome':
                if (!value) {
                    error = 'Nome da empresa é obrigatório';
                } else if (value.length < 2) {
                    error = 'Nome deve ter pelo menos 2 caracteres';
                }
                break;
                
            case 'email':
                if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    error = 'Email inválido';
                }
                break;
                
            case 'telefone':
                if (value && !/^[\d\sKATEX_INLINE_OPENKATEX_INLINE_CLOSE\-\+]+$/.test(value)) {
                    error = 'Telefone inválido';
                }
                break;
        }
        
        this.showFieldError(input, error);
        return !error;
    }
    
    /**
     * Mostrar erro no campo
     */
    showFieldError(input, error) {
        const errorElement = this.form.querySelector(`#${input.name}-error`);
        if (errorElement) {
            errorElement.textContent = error;
            errorElement.style.display = error ? 'block' : 'none';
        }
        
        input.classList.toggle('error', !!error);
    }
    
    /**
     * Limpar erro do campo
     */
    clearFieldError(input) {
        this.showFieldError(input, '');
    }
    
    /**
     * Validar formulário completo
     */
    validateForm() {
        const inputs = this.form.querySelectorAll('input, textarea');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    /**
     * Obter dados do formulário
     */
    getFormData() {
        const formData = new FormData(this.form);
        
        return {
            nome: formData.get('nome').trim(),
            contato: formData.get('contato').trim(),
            email: formData.get('email').trim(),
            telefone: formData.get('telefone').trim(),
            observacoes: formData.get('observacoes').trim()
        };
    }
    
    /**
     * Salvar empresa
     */
    async save() {
        if (this.isLoading) return;
        
        try {
            // Validar formulário
            if (!this.validateForm()) {
                return;
            }
            
            this.setLoading(true);
            
            const empresaData = this.getFormData();
            
            // Validação adicional
            const validation = validateEmpresa(empresaData);
            if (!validation.valid) {
                this.showValidationErrors(validation.errors);
                return;
            }
            
            // Verificar se email já existe (se fornecido)
            if (empresaData.email) {
                const emailExists = await empresaService.emailExists(empresaData.email, this.empresaId);
                if (emailExists) {
                    this.showFieldError(this.form.querySelector('#email'), 'Este email já está cadastrado');
                    return;
                }
            }
            
            // Salvar
            let result;
            if (this.empresaId) {
                result = await empresaService.update(this.empresaId, empresaData);
            } else {
                result = await empresaService.create(empresaData);
            }
            
            // Atualizar estado global
            const empresas = await empresaService.getAll();
            stateManager.updateEmpresas(empresas);
            
            // Fechar modal
            this.close();
            
            // Notificar sucesso
            if (window.NotificationManager) {
                const message = this.empresaId ? 'Empresa atualizada com sucesso!' : 'Empresa cadastrada com sucesso!';
                window.NotificationManager.success(message);
            }
            
        } catch (error) {
            errorHandler.captureError(error, { 
                context: 'EmpresaModal.save', 
                empresaId: this.empresaId 
            });
            
            if (window.NotificationManager) {
                window.NotificationManager.error('Erro ao salvar empresa: ' + error.message);
            }
            
        } finally {
            this.setLoading(false);
        }
    }
    
    /**
     * Mostrar erros de validação
     */
    showValidationErrors(errors) {
        Object.entries(errors).forEach(([field, messages]) => {
            const input = this.form.querySelector(`[name="${field}"]`);
            if (input) {
                const message = Array.isArray(messages) ? messages[0] : messages;
                this.showFieldError(input, message);
            }
        });
    }
    
    /**
     * Definir estado de loading
     */
    setLoading(loading) {
        this.isLoading = loading;
        
        const submitBtn = this.element.querySelector('.btn-primary');
        if (submitBtn) {
            submitBtn.disabled = loading;
            submitBtn.innerHTML = loading ? 
                '<i class="fas fa-spinner fa-spin"></i> Salvando...' : 
                (this.empresaId ? 'Atualizar' : 'Cadastrar');
        }
        
        // Desabilitar campos durante loading
        const inputs = this.form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.disabled = loading;
        });
    }
    
    /**
     * Método estático para abrir modal
     */
    static open(empresaId = null) {
        const modal = new EmpresaModal(empresaId);
        return modal.open();
    }
    
    /**
     * Método estático para confirmar exclusão
     */
    static async confirmDelete(empresaId) {
        try {
            const empresa = await empresaService.getById(empresaId);
            
            const confirmed = confirm(
                `Tem certeza que deseja excluir a empresa "${empresa.nome}"?\n\n` +
                'Esta ação não pode ser desfeita e a empresa será marcada como inativa.'
            );
            
            if (confirmed) {
                await empresaService.delete(empresaId);
                
                // Atualizar estado global
                const empresas = await empresaService.getAll();
                stateManager.updateEmpresas(empresas);
                
                if (window.NotificationManager) {
                    window.NotificationManager.success('Empresa excluída com sucesso!');
                }
                
                return true;
            }
            
            return false;
            
        } catch (error) {
            errorHandler.captureError(error, { context: 'EmpresaModal.confirmDelete', empresaId });
            
            if (window.NotificationManager) {
                window.NotificationManager.error('Erro ao excluir empresa: ' + error.message);
            }
            
            return false;
        }
    }
}

// Expor globalmente para uso nos event handlers
window.EmpresaModal = EmpresaModal;