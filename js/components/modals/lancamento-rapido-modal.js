// ===== MODAL DE LANÇAMENTO RÁPIDO =====

import { BaseModal } from './base-modal.js';
import { validateLancamento } from '../../utils/validators.js';
import { formatCurrency } from '../../utils/formatters.js';
import { getCurrentDate } from '../../utils/date-utils.js';
import { controleService } from '../../services/controle-service.js';
import { empresaService } from '../../services/empresa-service.js';
import { stateManager } from '../../core/state-manager.js';
import { errorHandler } from '../../core/error-handler.js';

export class LancamentoRapidoModal extends BaseModal {
    constructor(empresaId = null) {
        super({
            id: 'lancamentoRapidoModal',
            title: 'Lançamento Rápido',
            size: 'medium',
            className: 'lancamento-rapido-modal'
        });
        
        this.empresaId = empresaId;
        this.empresa = null;
        this.precos = stateManager.get('precos');
        this.currentMonth = stateManager.get('currentMonth');
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
                this.setTitle(`🍽️ Lançamento Rápido - ${this.empresa.nome}`);
            } else {
                this.setTitle('🚀 Novo Lançamento Rápido');
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
        const empresas = stateManager.get('empresas');
        const hoje = getCurrentDate();
        
        const formHTML = `
            <form id="lancamentoRapidoForm" class="lancamento-rapido-form">
                ${!this.empresaId ? `
                    <div class="form-group">
                        <label for="empresa_select" class="required">🏢 Empresa:</label>
                        <select id="empresa_select" name="empresa_id" required class="form-control">
                            <option value="">Selecione a empresa</option>
                            ${empresas.map(emp => `<option value="${emp.id}">${emp.nome}</option>`).join('')}
                        </select>
                        <div class="form-error" id="empresa-error"></div>
                    </div>
                ` : ''}
                
                <div class="form-group">
                    <label for="data_lancamento" class="required">📅 Data:</label>
                    <input type="date" id="data_lancamento" name="data" required 
                           value="${hoje}" class="form-control">
                    <div class="form-error" id="data-error"></div>
                </div>
                
                <div class="form-group">
                    <label>🍽️ Marmitas:</label>
                    <div class="quantidades-grid-rapido">
                        <div class="quantidade-item-rapido">
                            <label>Pequena (P)</label>
                            <input type="number" id="qtd_p" name="qtd_pequena" 
                                   class="qtd-input form-control" min="0" value="0" 
                                   onchange="window.currentLancamentoRapidoModal.calcularTotal()">
                            <span class="preco">${formatCurrency(this.precos.P)}</span>
                        </div>
                        
                        <div class="quantidade-item-rapido">
                            <label>Média (M)</label>
                            <input type="number" id="qtd_m" name="qtd_media" 
                                   class="qtd-input form-control" min="0" value="0" 
                                   onchange="window.currentLancamentoRapidoModal.calcularTotal()">
                            <span class="preco">${formatCurrency(this.precos.M)}</span>
                        </div>
                        
                        <div class="quantidade-item-rapido">
                            <label>Grande (G)</label>
                            <input type="number" id="qtd_g" name="qtd_grande" 
                                   class="qtd-input form-control" min="0" value="0" 
                                   onchange="window.currentLancamentoRapidoModal.calcularTotal()">
                            <span class="preco">${formatCurrency(this.precos.G)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>🥤 Itens Extras (Opcional):</label>
                    <div id="extrasRapidoList" class="extras-rapido-list">
                        <div class="extra-row-rapido">
                            <input type="text" class="extra-desc form-control" 
                                   placeholder="Ex: Coca-Cola" 
                                   onchange="window.currentLancamentoRapidoModal.calcularTotal()">
                            <input type="number" class="extra-qtd form-control" 
                                   min="1" value="1" placeholder="Qtd"
                                   onchange="window.currentLancamentoRapidoModal.calcularTotal()">
                            <input type="number" class="extra-valor form-control" 
                                   step="0.01" min="0" placeholder="Valor"
                                   onchange="window.currentLancamentoRapidoModal.calcularTotal()">
                            <button type="button" class="btn-add-extra" 
                                    onclick="window.currentLancamentoRapidoModal.adicionarExtra()">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <div class="total-rapido">
                        <label>💰 Total do Dia:</label>
                        <span id="valorTotalRapido" class="valor-total-display">${formatCurrency(0)}</span>
                    </div>
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
                text: 'Salvar Lançamento',
                className: 'btn-primary',
                onClick: () => this.save()
            }
        ]);
        
        // Configurar eventos
        this.setupEvents();
        
        // Focar no primeiro campo
        setTimeout(() => {
            const firstInput = this.empresaId ? 
                this.element.querySelector('#qtd_p') : 
                this.element.querySelector('#empresa_select');
            if (firstInput) {
                firstInput.focus();
            }
        }, 100);
    }
    
    /**
     * Configurar eventos
     */
    setupEvents() {
        // Expor instância globalmente para callbacks inline
        window.currentLancamentoRapidoModal = this;
        
        const form = this.element.querySelector('#lancamentoRapidoForm');
        
        // Submit do formulário
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.save();
        });
        
        // Validação em tempo real
        const inputs = form.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    }
    
    /**
     * Calcular total
     */
    calcularTotal() {
        const qtdP = parseInt(this.element.querySelector('#qtd_p').value) || 0;
        const qtdM = parseInt(this.element.querySelector('#qtd_m').value) || 0;
        const qtdG = parseInt(this.element.querySelector('#qtd_g').value) || 0;
        
        let totalMarmitas = (qtdP * this.precos.P) + (qtdM * this.precos.M) + (qtdG * this.precos.G);
        let totalExtras = 0;
        
        // Calcular extras
        this.element.querySelectorAll('.extra-row-rapido').forEach(row => {
            const desc = row.querySelector('.extra-desc').value.trim();
            const qtd = parseInt(row.querySelector('.extra-qtd').value) || 0;
            const valor = parseFloat(row.querySelector('.extra-valor').value) || 0;
            
            if (desc && qtd > 0 && valor > 0) {
                totalExtras += qtd * valor;
            }
        });
        
        const total = totalMarmitas + totalExtras;
        const valorTotalElement = this.element.querySelector('#valorTotalRapido');
        if (valorTotalElement) {
            valorTotalElement.textContent = formatCurrency(total);
        }
    }
    
    /**
     * Adicionar extra
     */
    adicionarExtra() {
        const container = this.element.querySelector('#extrasRapidoList');
        const novaLinha = document.createElement('div');
        novaLinha.className = 'extra-row-rapido';
        novaLinha.innerHTML = `
            <input type="text" class="extra-desc form-control" 
                   placeholder="Ex: Água" 
                   onchange="window.currentLancamentoRapidoModal.calcularTotal()">
            <input type="number" class="extra-qtd form-control" 
                   min="1" value="1" placeholder="Qtd"
                   onchange="window.currentLancamentoRapidoModal.calcularTotal()">
            <input type="number" class="extra-valor form-control" 
                   step="0.01" min="0" placeholder="Valor"
                   onchange="window.currentLancamentoRapidoModal.calcularTotal()">
            <button type="button" class="btn-remove-extra-rapido" 
                    onclick="window.currentLancamentoRapidoModal.removerExtra(this)">
                <i class="fas fa-minus"></i>
            </button>
        `;
        
        container.appendChild(novaLinha);
        
        // Focar no campo descrição
        setTimeout(() => {
            const descInput = novaLinha.querySelector('.extra-desc');
            if (descInput) {
                descInput.focus();
            }
        }, 100);
    }
    
    /**
     * Remover extra
     */
    removerExtra(btn) {
        const row = btn.closest('.extra-row-rapido');
        if (row) {
            row.remove();
            this.calcularTotal();
        }
    }
    
    /**
     * Validar campo
     */
    validateField(input) {
        const value = input.value.trim();
        const fieldName = input.name;
        let error = '';
        
        switch (fieldName) {
            case 'empresa_id':
                if (!value) {
                    error = 'Selecione uma empresa';
                }
                break;
                
            case 'data':
                if (!value) {
                    error = 'Data é obrigatória';
                } else if (new Date(value) > new Date()) {
                    error = 'Data não pode ser futura';
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
        const fieldName = input.name || input.id.replace('_select', '');
        const errorElement = this.element.querySelector(`#${fieldName}-error`);
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
     * Validar formulário
     */
    validateForm() {
        const form = this.element.querySelector('#lancamentoRapidoForm');
        const inputs = form.querySelectorAll('input[required], select[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });
        
        // Validar se tem pelo menos uma quantidade
        const qtdP = parseInt(this.element.querySelector('#qtd_p').value) || 0;
        const qtdM = parseInt(this.element.querySelector('#qtd_m').value) || 0;
        const qtdG = parseInt(this.element.querySelector('#qtd_g').value) || 0;
        
        if (qtdP === 0 && qtdM === 0 && qtdG === 0) {
            // Verificar se tem extras
            const hasExtras = Array.from(this.element.querySelectorAll('.extra-row-rapido')).some(row => {
                const desc = row.querySelector('.extra-desc').value.trim();
                const qtd = parseInt(row.querySelector('.extra-qtd').value) || 0;
                const valor = parseFloat(row.querySelector('.extra-valor').value) || 0;
                return desc && qtd > 0 && valor > 0;
            });
            
            if (!hasExtras) {
                if (window.NotificationManager) {
                    window.NotificationManager.error('Informe pelo menos uma quantidade de marmita ou item extra!');
                }
                isValid = false;
            }
        }
        
        return isValid;
    }
    
    /**
     * Obter dados do formulário
     */
    getFormData() {
        const empresaId = this.empresaId || parseInt(this.element.querySelector('#empresa_select').value);
        const data = this.element.querySelector('#data_lancamento').value;
        const qtdP = parseInt(this.element.querySelector('#qtd_p').value) || 0;
        const qtdM = parseInt(this.element.querySelector('#qtd_m').value) || 0;
        const qtdG = parseInt(this.element.querySelector('#qtd_g').value) || 0;
        
        // Coletar extras
        const extras = [];
        this.element.querySelectorAll('.extra-row-rapido').forEach(row => {
            const desc = row.querySelector('.extra-desc').value.trim();
            const qtd = parseInt(row.querySelector('.extra-qtd').value) || 0;
            const valor = parseFloat(row.querySelector('.extra-valor').value) || 0;
            
            if (desc && qtd > 0 && valor > 0) {
                extras.push({
                    descricao: desc,
                    quantidade: qtd,
                    valor_unitario: valor,
                    total: qtd * valor
                });
            }
        });
        
        const valorMarmitas = (qtdP * this.precos.P) + (qtdM * this.precos.M) + (qtdG * this.precos.G);
        const valorExtras = extras.reduce((sum, extra) => sum + extra.total, 0);
        const valorTotal = valorMarmitas + valorExtras;
        
        return {
            empresaId,
            data,
            qtdP,
            qtdM,
            qtdG,
            extras,
            valorMarmitas,
            valorExtras,
            valorTotal
        };
    }
    
    /**
     * Salvar lançamento
     */
    async save() {
        if (this.isLoading) return;
        
        try {
            // Validar formulário
            if (!this.validateForm()) {
                return;
            }
            
            this.setLoading(true);
            
            const formData = this.getFormData();
            
            // Criar objeto do lançamento do dia
            const lancamentoDia = {
                data: formData.data,
                qtd_pequena: formData.qtdP,
                qtd_media: formData.qtdM,
                qtd_grande: formData.qtdG,
                valor_marmitas: formData.valorMarmitas,
                extras: formData.extras,
                valor_extras: formData.valorExtras,
                valor_dia: formData.valorTotal
            };
            
            // Buscar controle existente ou preparar dados para novo
            const controleExistente = await controleService.getByEmpresaAndPeriod(
                formData.empresaId, 
                this.currentMonth
            );
            
            let lancamentosExistentes = [];
            if (controleExistente && controleExistente.lancamentos_diarios) {
                lancamentosExistentes = JSON.parse(controleExistente.lancamentos_diarios);
            }
            
            // Verificar se já existe lançamento nesta data
            const indiceExistente = lancamentosExistentes.findIndex(l => l.data === formData.data);
            
            if (indiceExistente >= 0) {
                const confirmed = confirm(
                    `Já existe um lançamento para o dia ${this.formatDateBR(formData.data)}. Deseja substituir?`
                );
                if (!confirmed) {
                    return;
                }
                lancamentosExistentes[indiceExistente] = lancamentoDia;
            } else {
                lancamentosExistentes.push(lancamentoDia);
            }
            
            // Recalcular totais
            const novoTotalP = lancamentosExistentes.reduce((sum, l) => sum + l.qtd_pequena, 0);
            const novoTotalM = lancamentosExistentes.reduce((sum, l) => sum + l.qtd_media, 0);
            const novoTotalG = lancamentosExistentes.reduce((sum, l) => sum + l.qtd_grande, 0);
            const novoValorTotal = lancamentosExistentes.reduce((sum, l) => sum + l.valor_dia, 0);
            
            const dadosControle = {
                empresa_id: formData.empresaId,
                mes_ano: this.currentMonth,
                qtd_pequena: novoTotalP,
                qtd_media: novoTotalM,
                qtd_grande: novoTotalG,
                valor_total: novoValorTotal,
                status: controleExistente ? controleExistente.status : 'relatorio-enviado',
                observacoes: controleExistente ? controleExistente.observacoes : '',
                lancamentos_diarios: JSON.stringify(lancamentosExistentes)
            };
            
            // Salvar via service
            await controleService.saveLancamento(formData.empresaId, this.currentMonth, dadosControle);
            
            // Atualizar estado global
            const controles = await controleService.getByPeriod(this.currentMonth);
            stateManager.updateControles(controles);
            
            // Fechar modal
            this.close();
            
            // Notificar sucesso
            if (window.NotificationManager) {
                window.NotificationManager.success(
                    `Lançamento do dia ${this.formatDateBR(formData.data)} salvo com sucesso!`
                );
            }
            
        } catch (error) {
            errorHandler.captureError(error, { 
                context: 'LancamentoRapidoModal.save',
                empresaId: this.empresaId 
            });
            
            if (window.NotificationManager) {
                window.NotificationManager.error('Erro ao salvar lançamento: ' + error.message);
            }
            
        } finally {
            this.setLoading(false);
        }
    }
    
    /**
     * Formatar data brasileira
     */
    formatDateBR(dateString) {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    }
    
    /**
     * Definir estado de loading
     */
    setLoading(loading) {
        this.isLoading = loading;
        
        const saveBtn = this.element.querySelector('.btn-primary');
        if (saveBtn) {
            saveBtn.disabled = loading;
            saveBtn.innerHTML = loading ? 
                '<i class="fas fa-spinner fa-spin"></i> Salvando...' : 
                'Salvar Lançamento';
        }
        
        // Desabilitar campos durante loading
        const inputs = this.element.querySelectorAll('input, select, button');
        inputs.forEach(input => {
            if (!input.classList.contains('btn-secondary')) {
                input.disabled = loading;
            }
        });
    }
    
    /**
     * Limpar instância global ao fechar
     */
    close() {
        window.currentLancamentoRapidoModal = null;
        return super.close();
    }
    
    /**
     * Método estático para abrir modal
     */
    static open(empresaId = null) {
        const modal = new LancamentoRapidoModal(empresaId);
        return modal.open();
    }
}

// Expor globalmente para uso nos event handlers
window.LancamentoRapidoModal = LancamentoRapidoModal;