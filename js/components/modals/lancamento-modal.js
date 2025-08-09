// ===== MODAL DE LANÇAMENTOS =====

import { BaseModal } from './base-modal.js';
import { validateLancamento } from '../../utils/validators.js';
import { formatCurrency, formatDateBR } from '../../utils/formatters.js';
import { getCurrentDate } from '../../utils/date-utils.js';
import { generateId } from '../../utils/dom-utils.js';
import { controleService } from '../../services/controle-service.js';
import { empresaService } from '../../services/empresa-service.js';
import { stateManager } from '../../core/state-manager.js';
import { errorHandler } from '../../core/error-handler.js';
import { STATUS_CONFIG } from '../../config/constants.js';

export class LancamentoModal extends BaseModal {
    constructor(empresaId) {
        super({
            id: 'lancamentoModal',
            title: 'Gerenciar Lançamentos',
            size: 'extra-large',
            className: 'lancamento-modal'
        });
        
        this.empresaId = empresaId;
        this.empresa = null;
        this.controle = null;
        this.precos = stateManager.get('precos');
        this.currentMonth = stateManager.get('currentMonth');
        this.isLoading = false;
        this.lancamentos = [];
    }
    
    /**
     * Abrir modal
     */
    async open() {
        super.open();
        
        try {
            this.showLoading('Carregando dados...');
            
            // Carregar dados da empresa e controle
            this.empresa = await empresaService.getById(this.empresaId);
            this.controle = await controleService.getByEmpresaAndPeriod(this.empresaId, this.currentMonth);
            
            // Atualizar título
            this.setTitle(`🏢 ${this.empresa.nome} - ${this.formatPeriod(this.currentMonth)}`);
            
            this.createInterface();
            
        } catch (error) {
            this.showError('Erro ao carregar dados: ' + error.message);
        }
        
        return this;
    }
    
    /**
     * Criar interface do modal
     */
    createInterface() {
        const interfaceHTML = `
            <div class="lancamento-interface">
                <!-- Conteúdo Principal -->
                <div class="lancamento-main">
                    <!-- Seção de Lançamentos Diários -->
                    <div class="lancamentos-section">
                        <div class="section-header">
                            <h3><i class="fas fa-calendar-alt"></i> Lançamentos Diários</h3>
                            <button type="button" class="btn btn-secondary btn-sm" id="btnAdicionarLancamento">
                                <i class="fas fa-plus"></i> Adicionar Dia
                            </button>
                        </div>
                        
                        <div id="lancamentosList" class="lancamentos-list">
                            ${this.renderLancamentosExistentes()}
                        </div>
                    </div>
                    
                    <div class="section-divider"></div>
                    
                    <!-- Observações -->
                    <div class="observacoes-section">
                        <h3><i class="fas fa-sticky-note"></i> Observações</h3>
                        <div class="form-group">
                            <textarea 
                                id="observacoes_lancamento" 
                                rows="4" 
                                placeholder="Observações sobre este lançamento..."
                                class="form-control">${this.controle ? this.controle.observacoes || '' : ''}</textarea>
                        </div>
                    </div>
                </div>
                
                <!-- Sidebar com Resumo e Ações -->
                <div class="lancamento-sidebar">
                    <!-- Ações Rápidas -->
                    <div class="quick-actions">
                        <h3><i class="fas fa-bolt"></i> Ações Rápidas</h3>
                        <div class="quick-actions-grid">
                            <button class="action-card" id="btnTemplate">
                                <i class="fas fa-envelope"></i>
                                <span>Template Email</span>
                            </button>
                            <button class="action-card" id="btnPDF">
                                <i class="fas fa-file-pdf"></i>
                                <span>Gerar PDF</span>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Resumo Total -->
                    <div class="resumo-section">
                        <h3><i class="fas fa-chart-pie"></i> Resumo do Mês</h3>
                        <div class="resumo-grid">
                            <div class="resumo-item">
                                <label>Pequenas:</label>
                                <span id="total_pequenas">0</span>
                            </div>
                            <div class="resumo-item">
                                <label>Médias:</label>
                                <span id="total_medias">0</span>
                            </div>
                            <div class="resumo-item">
                                <label>Grandes:</label>
                                <span id="total_grandes">0</span>
                            </div>
                            <div class="resumo-item total">
                                <label>Valor Total:</label>
                                <div id="valor_total_mes" class="valor-breakdown">
                                    <div>Marmitas: R$ 0,00</div>
                                    <div>Extras: R$ 0,00</div>
                                    <div><strong>Total: R$ 0,00</strong></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Status -->
                    <div class="status-section">
                        <h3><i class="fas fa-flag"></i> Status Atual</h3>
                        <div class="status-badge ${this.controle ? this.controle.status : 'pendente'}" id="currentStatus">
                            ${this.getStatusText(this.controle ? this.controle.status : 'pendente')}
                        </div>
                        
                        <div class="status-controls">
                            <h4>Alterar Status:</h4>
                            <div class="status-buttons" id="statusButtons">
                                ${this.createStatusButtons(this.controle ? this.controle.status : 'pendente')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.setBody(interfaceHTML);
        
        // Configurar botões do footer
        this.addButtons([
            {
                text: 'Fechar',
                className: 'btn-secondary',
                onClick: () => this.close()
            },
            {
                text: 'Salvar',
                className: 'btn-primary',
                onClick: () => this.save()
            }
        ]);
        
        // Configurar eventos
        this.setupEvents();
        
        // Calcular totais iniciais
        this.calcularTotais();
    }
    
    /**
     * Renderizar lançamentos existentes
     */
    renderLancamentosExistentes() {
        if (!this.controle || !this.controle.lancamentos_diarios) {
            return '<p class="no-lancamentos">Nenhum lançamento ainda. Clique em "Adicionar Dia" para começar.</p>';
        }
        
        try {
            this.lancamentos = JSON.parse(this.controle.lancamentos_diarios || '[]');
            
            if (this.lancamentos.length === 0) {
                return '<p class="no-lancamentos">Nenhum lançamento ainda. Clique em "Adicionar Dia" para começar.</p>';
            }
            
            return this.lancamentos.map((lancamento, index) => 
                this.createLancamentoRow(lancamento, index)
            ).join('');
            
        } catch (error) {
            console.error('Erro ao renderizar lançamentos:', error);
            return '<p class="no-lancamentos error">Erro ao carregar lançamentos. Tente novamente.</p>';
        }
    }
    
    /**
     * Criar linha de lançamento
     */
    createLancamentoRow(lancamento = {}, index = 0) {
        const hoje = getCurrentDate();
        const extras = lancamento.extras || [];
        const uniqueId = `lancamento_${Date.now()}_${index}`;
        
        return `
            <div class="lancamento-row" data-index="${index}" data-unique-id="${uniqueId}">
                <div class="lancamento-header">
                    <div class="lancamento-date">
                        <label>📅 Data:</label>
                        <input type="date" class="data-input form-control" 
                               value="${lancamento.data || hoje}" 
                               onchange="window.currentLancamentoModal.calcularTotais()">
                    </div>
                    <button type="button" class="btn-remove" 
                            onclick="window.currentLancamentoModal.removerLancamento('${uniqueId}')" 
                            title="Remover este dia">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                
                <!-- Marmitas -->
                <div class="marmitas-section">
                    <h4><i class="fas fa-utensils"></i> Marmitas</h4>
                    <div class="quantidades-grid">
                        <div class="quantidade-item">
                            <label>Pequena (P)</label>
                            <input type="number" class="qtd-input qtd-p form-control" 
                                   min="0" value="${lancamento.qtd_pequena || ''}" 
                                   onchange="window.currentLancamentoModal.calcularTotais()" 
                                   placeholder="0">
                            <span class="preco">${formatCurrency(this.precos.P)}</span>
                        </div>
                        
                        <div class="quantidade-item">
                            <label>Média (M)</label>
                            <input type="number" class="qtd-input qtd-m form-control" 
                                   min="0" value="${lancamento.qtd_media || ''}" 
                                   onchange="window.currentLancamentoModal.calcularTotais()" 
                                   placeholder="0">
                            <span class="preco">${formatCurrency(this.precos.M)}</span>
                        </div>
                        
                        <div class="quantidade-item">
                            <label>Grande (G)</label>
                            <input type="number" class="qtd-input qtd-g form-control" 
                                   min="0" value="${lancamento.qtd_grande || ''}" 
                                   onchange="window.currentLancamentoModal.calcularTotais()" 
                                   placeholder="0">
                            <span class="preco">${formatCurrency(this.precos.G)}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Itens Extras -->
                <div class="extras-section">
                    <div class="extras-header">
                        <h4><i class="fas fa-plus-circle"></i> Itens Extras</h4>
                        <button type="button" class="btn btn-secondary btn-sm" 
                                onclick="window.currentLancamentoModal.adicionarExtra('${uniqueId}')">
                            <i class="fas fa-plus"></i> Adicionar Item
                        </button>
                    </div>
                    
                    <div class="extras-list" id="extrasList_${uniqueId}">
                        ${extras.map((extra, extraIndex) => 
                            this.createExtraRow(uniqueId, extraIndex, extra)
                        ).join('')}
                        ${extras.length === 0 ? '<p class="no-extras">Nenhum item extra adicionado.</p>' : ''}
                    </div>
                </div>
                
                <!-- Total do Dia -->
                <div class="total-dia-section">
                    <div class="total-dia">
                        <label><i class="fas fa-calculator"></i> Total do Dia:</label>
                        <span class="valor-dia">${formatCurrency(0)}</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Criar linha de item extra
     */
    createExtraRow(lancamentoId, extraIndex, extra = {}) {
        const uniqueExtraId = `extra_${Date.now()}_${extraIndex}`;
        
        return `
            <div class="extra-row" data-lancamento="${lancamentoId}" 
                 data-extra="${extraIndex}" data-extra-id="${uniqueExtraId}">
                <input type="text" class="extra-descricao form-control" 
                       placeholder="Ex: Coca-Cola, Água, etc." 
                       value="${extra.descricao || ''}" 
                       onchange="window.currentLancamentoModal.calcularTotais()">
                <input type="number" class="extra-quantidade form-control" 
                       min="1" placeholder="Qtd" 
                       value="${extra.quantidade || 1}" 
                       onchange="window.currentLancamentoModal.calcularTotais()">
                <input type="number" class="extra-valor form-control" 
                       step="0.01" min="0" placeholder="Valor unit." 
                       value="${extra.valor_unitario || ''}" 
                       onchange="window.currentLancamentoModal.calcularTotais()">
                <span class="extra-total">${formatCurrency(0)}</span>
                <button type="button" class="btn-remove-extra" 
                        onclick="window.currentLancamentoModal.removerExtra('${uniqueExtraId}')" 
                        title="Remover item">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }
    
    /**
     * Configurar eventos
     */
    setupEvents() {
        // Expor instância globalmente para callbacks inline
        window.currentLancamentoModal = this;
        
        // Adicionar lançamento
        const btnAdicionar = this.element.querySelector('#btnAdicionarLancamento');
        if (btnAdicionar) {
            btnAdicionar.addEventListener('click', () => this.adicionarLancamento());
        }
        
        // Ações rápidas
        const btnTemplate = this.element.querySelector('#btnTemplate');
        if (btnTemplate) {
            btnTemplate.addEventListener('click', () => this.gerarTemplate());
        }
        
        const btnPDF = this.element.querySelector('#btnPDF');
        if (btnPDF) {
            btnPDF.addEventListener('click', () => this.gerarPDF());
        }
        
        // Status buttons
        const statusButtons = this.element.querySelectorAll('.status-btn');
        statusButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.changeStatus(e.target.dataset.status));
        });
    }
    
    /**
     * Adicionar novo lançamento
     */
    adicionarLancamento() {
                const lista = this.element.querySelector('#lancamentosList');
        const noLancamentos = lista.querySelector('.no-lancamentos');
        
        if (noLancamentos) {
            noLancamentos.remove();
        }
        
        const index = lista.children.length;
        const novoLancamento = this.createLancamentoRow({}, index);
        
        lista.insertAdjacentHTML('beforeend', novoLancamento);
        
        // Focar no campo de data do novo lançamento
        setTimeout(() => {
            const novoRow = lista.lastElementChild;
            const dataInput = novoRow.querySelector('.data-input');
            if (dataInput) {
                dataInput.focus();
            }
        }, 100);
        
        this.calcularTotais();
    }
    
    /**
     * Remover lançamento
     */
    removerLancamento(uniqueId) {
        const row = this.element.querySelector(`[data-unique-id="${uniqueId}"]`);
        if (row) {
            if (confirm('Tem certeza que deseja remover este lançamento do dia?')) {
                row.remove();
                this.calcularTotais();
                
                // Se não sobrou nenhum lançamento, mostrar mensagem
                const lista = this.element.querySelector('#lancamentosList');
                if (lista.children.length === 0) {
                    lista.innerHTML = '<p class="no-lancamentos">Nenhum lançamento ainda. Clique em "Adicionar Dia" para começar.</p>';
                }
            }
        }
    }
    
    /**
     * Adicionar item extra
     */
    adicionarExtra(lancamentoId) {
        const extrasList = this.element.querySelector(`#extrasList_${lancamentoId}`);
        const noExtras = extrasList.querySelector('.no-extras');
        
        if (noExtras) {
            noExtras.remove();
        }
        
        const extraIndex = extrasList.querySelectorAll('.extra-row').length;
        const novoExtra = this.createExtraRow(lancamentoId, extraIndex);
        
        extrasList.insertAdjacentHTML('beforeend', novoExtra);
        
        // Focar no campo descrição do novo extra
        setTimeout(() => {
            const novoExtraRow = extrasList.lastElementChild;
            const descricaoInput = novoExtraRow.querySelector('.extra-descricao');
            if (descricaoInput) {
                descricaoInput.focus();
            }
        }, 100);
        
        this.calcularTotais();
    }
    
    /**
     * Remover item extra
     */
    removerExtra(uniqueExtraId) {
        const extraRow = this.element.querySelector(`[data-extra-id="${uniqueExtraId}"]`);
        if (extraRow) {
            const lancamentoId = extraRow.dataset.lancamento;
            extraRow.remove();
            this.calcularTotais();
            
            // Se não sobrou nenhum extra, mostrar mensagem
            const extrasList = this.element.querySelector(`#extrasList_${lancamentoId}`);
            if (extrasList.querySelectorAll('.extra-row').length === 0) {
                extrasList.innerHTML = '<p class="no-extras">Nenhum item extra adicionado.</p>';
            }
        }
    }
    
    /**
     * Calcular totais do mês
     */
    calcularTotais() {
        let totalP = 0, totalM = 0, totalG = 0, valorTotal = 0, totalExtras = 0;
        
        const lancamentoRows = this.element.querySelectorAll('.lancamento-row');
        
        lancamentoRows.forEach(row => {
            const qtdP = parseInt(row.querySelector('.qtd-p').value) || 0;
            const qtdM = parseInt(row.querySelector('.qtd-m').value) || 0;
            const qtdG = parseInt(row.querySelector('.qtd-g').value) || 0;
            
            const valorMarmitas = (qtdP * this.precos.P) + (qtdM * this.precos.M) + (qtdG * this.precos.G);
            
            // Calcular extras do dia
            let valorExtrasDia = 0;
            row.querySelectorAll('.extra-row').forEach(extraRow => {
                const quantidade = parseInt(extraRow.querySelector('.extra-quantidade').value) || 0;
                const valorUnitario = parseFloat(extraRow.querySelector('.extra-valor').value) || 0;
                const totalExtra = quantidade * valorUnitario;
                
                // Atualizar total do extra
                const extraTotalSpan = extraRow.querySelector('.extra-total');
                if (extraTotalSpan) {
                    extraTotalSpan.textContent = formatCurrency(totalExtra);
                }
                
                valorExtrasDia += totalExtra;
            });
            
            const valorDia = valorMarmitas + valorExtrasDia;
            
            // Atualizar total do dia
            const valorDiaSpan = row.querySelector('.valor-dia');
            if (valorDiaSpan) {
                valorDiaSpan.textContent = formatCurrency(valorDia);
            }
            
            totalP += qtdP;
            totalM += qtdM;
            totalG += qtdG;
            valorTotal += valorDia;
            totalExtras += valorExtrasDia;
        });
        
        // Atualizar resumo na sidebar
        this.updateResumo(totalP, totalM, totalG, valorTotal, totalExtras);
    }
    
    /**
     * Atualizar resumo na sidebar
     */
    updateResumo(totalP, totalM, totalG, valorTotal, totalExtras) {
        const totalPequenas = this.element.querySelector('#total_pequenas');
        const totalMedias = this.element.querySelector('#total_medias');
        const totalGrandes = this.element.querySelector('#total_grandes');
        const valorTotalMes = this.element.querySelector('#valor_total_mes');
        
        if (totalPequenas) totalPequenas.textContent = totalP;
        if (totalMedias) totalMedias.textContent = totalM;
        if (totalGrandes) totalGrandes.textContent = totalG;
        
        if (valorTotalMes) {
            const valorMarmitas = valorTotal - totalExtras;
            valorTotalMes.innerHTML = `
                <div>Marmitas: ${formatCurrency(valorMarmitas)}</div>
                <div>Extras: ${formatCurrency(totalExtras)}</div>
                <div><strong>Total: ${formatCurrency(valorTotal)}</strong></div>
            `;
        }
    }
    
    /**
     * Criar botões de status
     */
    createStatusButtons(currentStatus) {
        const statuses = [
            { key: 'pendente', label: 'Pendente', icon: '⚪' },
            { key: 'relatorio-enviado', label: 'Relatório Enviado', icon: '🔵' },
            { key: 'pagamento-enviado', label: 'Pagamento Enviado', icon: '🟡' },
            { key: 'emitindo-nf', label: 'Emitindo NF', icon: '🟠' },
            { key: 'erro-nf', label: 'Erro na NF', icon: '🔴' },
            { key: 'concluido', label: 'Concluído', icon: '🟢' }
        ];
        
        return statuses.map(status => `
            <button type="button" class="status-btn ${status.key === currentStatus ? 'active' : ''}" 
                    data-status="${status.key}">
                ${status.icon} ${status.label}
            </button>
        `).join('');
    }
    
    /**
     * Alterar status
     */
    changeStatus(newStatus) {
        // Atualizar UI dos botões
        this.element.querySelectorAll('.status-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const selectedBtn = this.element.querySelector(`[data-status="${newStatus}"]`);
        if (selectedBtn) {
            selectedBtn.classList.add('active');
        }
        
        // Atualizar badge de status atual
        const currentStatusBadge = this.element.querySelector('#currentStatus');
        if (currentStatusBadge) {
            currentStatusBadge.className = `status-badge ${newStatus}`;
            currentStatusBadge.textContent = this.getStatusText(newStatus);
        }
        
        // Armazenar status selecionado
        this.selectedStatus = newStatus;
    }
    
    /**
     * Obter texto do status
     */
    getStatusText(status) {
        return STATUS_CONFIG[status]?.text || 'Pendente';
    }
    
    /**
     * Coletar dados dos lançamentos
     */
    coletarDadosLancamentos() {
        const lancamentosDiarios = [];
        let totalP = 0, totalM = 0, totalG = 0, valorTotal = 0;
        
        const lancamentoRows = this.element.querySelectorAll('.lancamento-row');
        
        lancamentoRows.forEach(row => {
            const data = row.querySelector('.data-input').value;
            const qtdP = parseInt(row.querySelector('.qtd-p').value) || 0;
            const qtdM = parseInt(row.querySelector('.qtd-m').value) || 0;
            const qtdG = parseInt(row.querySelector('.qtd-g').value) || 0;
            
            // Coletar extras
            const extras = [];
            row.querySelectorAll('.extra-row').forEach(extraRow => {
                const descricao = extraRow.querySelector('.extra-descricao').value.trim();
                const quantidade = parseInt(extraRow.querySelector('.extra-quantidade').value) || 0;
                const valorUnitario = parseFloat(extraRow.querySelector('.extra-valor').value) || 0;
                
                if (descricao && quantidade > 0 && valorUnitario > 0) {
                    extras.push({
                        descricao: descricao,
                        quantidade: quantidade,
                        valor_unitario: valorUnitario,
                        total: quantidade * valorUnitario
                    });
                }
            });
            
            const valorMarmitas = (qtdP * this.precos.P) + (qtdM * this.precos.M) + (qtdG * this.precos.G);
            const valorExtras = extras.reduce((sum, extra) => sum + extra.total, 0);
            const valorDiaTotal = valorMarmitas + valorExtras;
            
            if (data && (qtdP > 0 || qtdM > 0 || qtdG > 0 || extras.length > 0)) {
                lancamentosDiarios.push({
                    data: data,
                    qtd_pequena: qtdP,
                    qtd_media: qtdM,
                    qtd_grande: qtdG,
                    valor_marmitas: valorMarmitas,
                    extras: extras,
                    valor_extras: valorExtras,
                    valor_dia: valorDiaTotal
                });
                
                totalP += qtdP;
                totalM += qtdM;
                totalG += qtdG;
                valorTotal += valorDiaTotal;
            }
        });
        
        return {
            lancamentosDiarios,
            totais: { totalP, totalM, totalG, valorTotal }
        };
    }
    
    /**
     * Salvar lançamentos
     */
    async save() {
        if (this.isLoading) return;
        
        try {
            this.setLoading(true);
            
            const observacoes = this.element.querySelector('#observacoes_lancamento').value;
            const { lancamentosDiarios, totais } = this.coletarDadosLancamentos();
            
            const lancamentoData = {
                empresa_id: this.empresaId,
                mes_ano: this.currentMonth,
                qtd_pequena: totais.totalP,
                qtd_media: totais.totalM,
                qtd_grande: totais.totalG,
                valor_total: totais.valorTotal,
                status: this.selectedStatus || (this.controle ? this.controle.status : 'pendente'),
                observacoes: observacoes,
                lancamentos_diarios: JSON.stringify(lancamentosDiarios)
            };
            
            // Salvar via service
            await controleService.saveLancamento(this.empresaId, this.currentMonth, lancamentoData);
            
            // Atualizar estado global
            const controles = await controleService.getByPeriod(this.currentMonth);
            stateManager.updateControles(controles);
            
            // Fechar modal
            this.close();
            
            // Notificar sucesso
            if (window.NotificationManager) {
                window.NotificationManager.success('Lançamentos salvos com sucesso!');
            }
            
        } catch (error) {
            errorHandler.captureError(error, { 
                context: 'LancamentoModal.save', 
                empresaId: this.empresaId 
            });
            
            if (window.NotificationManager) {
                window.NotificationManager.error('Erro ao salvar lançamentos: ' + error.message);
            }
            
        } finally {
            this.setLoading(false);
        }
    }
    
    /**
     * Gerar template de email
     */
    async gerarTemplate() {
        try {
            if (window.gerarTemplate) {
                window.gerarTemplate(this.empresaId);
            } else {
                if (window.NotificationManager) {
                    window.NotificationManager.info('Funcionalidade de template em desenvolvimento');
                }
            }
        } catch (error) {
            console.error('Erro ao gerar template:', error);
        }
    }
    
    /**
     * Gerar PDF
     */
    async gerarPDF() {
        try {
            if (window.gerarPDF) {
                window.gerarPDF(this.empresaId);
            } else {
                if (window.NotificationManager) {
                    window.NotificationManager.info('Funcionalidade de PDF em desenvolvimento');
                }
            }
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
        }
    }
    
    /**
     * Formatar período
     */
    formatPeriod(period) {
        const [year, month] = period.split('-');
        const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                       'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        return `${months[parseInt(month) - 1]}/${year}`;
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
                'Salvar';
        }
    }
    
    /**
     * Limpar instância global ao fechar
     */
    close() {
        window.currentLancamentoModal = null;
        return super.close();
    }
    
        /**
     * Método estático para abrir modal
     */
        static open(empresaId) {
            const modal = new LancamentoModal(empresaId);
            return modal.open();
        }
    }
    
    // Expor globalmente para uso nos event handlers
    window.LancamentoModal = LancamentoModal;