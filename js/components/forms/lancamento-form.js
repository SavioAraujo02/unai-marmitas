// ===== MODAL COMPLETO DE LANÇAMENTOS =====

import { BaseModal } from '../modals/base-modal.js';
import { validateLancamento } from '../../utils/validators.js';
import { formatCurrency, formatDateBR } from '../../utils/formatters.js';
import { getCurrentDate, getDatesInPeriod, formatDateForInput } from '../../utils/date-utils.js';
import { createElement, animateIn, debounce } from '../../utils/dom-utils.js';
import { controleService } from '../../services/controle-service.js';
import { empresaService } from '../../services/empresa-service.js';
import { templateService } from '../../services/template-service.js';
import { stateManager } from '../../core/state-manager.js';
import { errorHandler } from '../../core/error-handler.js';
import { performanceMonitor } from '../../core/performance-monitor.js';

export class LancamentoModal extends BaseModal {
    constructor(empresaId = null) {
        super({
            id: 'lancamentoModal',
            title: 'Gerenciar Lançamentos',
            size: 'extra-large',
            className: 'lancamento-modal'
        });
        
        this.empresaId = empresaId;
        this.empresa = null;
        this.controle = null;
        this.lancamentos = [];
        this.precos = stateManager.get('precos');
        this.currentMonth = stateManager.get('currentMonth');
        this.isLoading = false;
        this.hasChanges = false;
        
        // Debounced functions
        this.debouncedCalculateTotal = debounce(() => this.calculateTotalGeral(), 300);
        this.debouncedSave = debounce(() => this.autoSave(), 2000);
    }
    
    /**
     * Abrir modal
     */
    async open() {
        super.open();
        
        try {
            if (this.empresaId) {
                this.showLoading('Carregando dados da empresa...');
                await this.loadEmpresaData();
            }
            
            this.createInterface();
            this.setupEvents();
            
        } catch (error) {
            this.showError('Erro ao carregar dados: ' + error.message);
        }
        
        return this;
    }
    
    /**
     * Carregar dados da empresa
     */
    async loadEmpresaData() {
        return performanceMonitor.measureAsync('lancamento-modal:loadData', async () => {
            try {
                // Carregar empresa e controle em paralelo
                const [empresa, controle] = await Promise.all([
                    empresaService.getById(this.empresaId),
                    controleService.getByEmpresaAndPeriod(this.empresaId, this.currentMonth)
                ]);
                
                this.empresa = empresa;
                this.controle = controle;
                
                // Processar lançamentos existentes
                if (controle && controle.lancamentos_diarios) {
                    this.lancamentos = JSON.parse(controle.lancamentos_diarios);
                    // Ordenar por data
                    this.lancamentos.sort((a, b) => a.data.localeCompare(b.data));
                }
                
                this.setTitle(`📋 Lançamentos - ${empresa.nome}`);
                
            } catch (error) {
                errorHandler.captureError(error, { 
                    context: 'LancamentoModal.loadEmpresaData', 
                    empresaId: this.empresaId 
                });
                throw error;
            }
        });
    }
    
    /**
     * Criar interface principal
     */
    createInterface() {
        const interfaceHTML = `
            <div class="modal-grid">
                <!-- Conteúdo Principal -->
                <div class="modal-main-content">
                    <div class="lancamentos-container">
                        <!-- Cabeçalho com informações da empresa -->
                        ${this.createEmpresaHeader()}
                        
                        <!-- Lista de lançamentos -->
                        <div class="lancamentos-section">
                            <div class="section-header">
                                <h3><i class="fas fa-calendar-alt"></i> Lançamentos do Mês</h3>
                                <div class="section-actions">
                                    <button type="button" class="btn btn-primary btn-sm" id="btnNovoLancamento">
                                        <i class="fas fa-plus"></i> Novo Lançamento
                                    </button>
                                    <button type="button" class="btn btn-secondary btn-sm" id="btnPreencherDias">
                                        <i class="fas fa-magic"></i> Preencher Dias Úteis
                                    </button>
                                </div>
                            </div>
                            
                            <div class="lancamentos-list" id="lancamentosList">
                                ${this.renderLancamentos()}
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Sidebar com resumo e ações -->
                <div class="modal-sidebar">
                    ${this.createSidebar()}
                </div>
            </div>
        `;
        
        this.setBody(interfaceHTML);
        
        // Configurar botões do footer
        this.addButtons([
            {
                text: 'Cancelar',
                className: 'btn-secondary',
                onClick: () => this.handleClose()
            },
            {
                text: 'Salvar Alterações',
                className: 'btn-primary',
                onClick: () => this.save()
            }
        ]);
    }
    
    /**
     * Criar cabeçalho da empresa
     */
    createEmpresaHeader() {
        if (!this.empresa) return '';
        
        return `
            <div class="empresa-header-card">
                <div class="empresa-info-grid">
                    <div class="empresa-details">
                        <h2><i class="fas fa-building"></i> ${this.empresa.nome}</h2>
                        <div class="empresa-meta">
                            <span><i class="fas fa-user"></i> ${this.empresa.contato || 'Sem contato'}</span>
                            <span><i class="fas fa-envelope"></i> ${this.empresa.email || 'Sem email'}</span>
                            <span><i class="fas fa-phone"></i> ${this.empresa.telefone || 'Sem telefone'}</span>
                        </div>
                    </div>
                    <div class="empresa-status">
                        <div class="status-badge ${this.controle ? this.controle.status : 'pendente'}">
                            ${this.getStatusIcon(this.controle ? this.controle.status : 'pendente')} 
                            ${this.getStatusText(this.controle ? this.controle.status : 'pendente')}
                        </div>
                        <div class="periodo-info">
                            <i class="fas fa-calendar"></i> ${this.getCurrentMonthText()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Criar sidebar
     */
    createSidebar() {
        return `
            <!-- Resumo Financeiro -->
            <div class="resumo-section">
                <h4><i class="fas fa-chart-pie"></i> Resumo Financeiro</h4>
                <div class="resumo-grid">
                    <div class="resumo-item">
                        <span class="resumo-label">Total Marmitas</span>
                        <span class="resumo-valor" id="totalMarmitas">0</span>
                    </div>
                    <div class="resumo-item">
                        <span class="resumo-label">Valor Marmitas</span>
                        <span class="resumo-valor" id="valorMarmitas">${formatCurrency(0)}</span>
                    </div>
                    <div class="resumo-item">
                        <span class="resumo-label">Valor Extras</span>
                        <span class="resumo-valor" id="valorExtras">${formatCurrency(0)}</span>
                    </div>
                    <div class="resumo-item total">
                        <span class="resumo-label">TOTAL GERAL</span>
                        <span class="resumo-valor" id="valorTotal">${formatCurrency(0)}</span>
                    </div>
                </div>
            </div>
            
            <!-- Detalhamento por Tamanho -->
            <div class="detalhamento-section">
                <h4><i class="fas fa-utensils"></i> Por Tamanho</h4>
                <div class="tamanhos-grid">
                    <div class="tamanho-item">
                        <span class="tamanho-label">Pequenas (P)</span>
                        <span class="tamanho-qtd" id="qtdPequenas">0</span>
                        <span class="tamanho-valor" id="valorPequenas">${formatCurrency(0)}</span>
                    </div>
                    <div class="tamanho-item">
                        <span class="tamanho-label">Médias (M)</span>
                        <span class="tamanho-qtd" id="qtdMedias">0</span>
                        <span class="tamanho-valor" id="valorMedias">${formatCurrency(0)}</span>
                    </div>
                    <div class="tamanho-item">
                        <span class="tamanho-label">Grandes (G)</span>
                        <span class="tamanho-qtd" id="qtdGrandes">0</span>
                        <span class="tamanho-valor" id="valorGrandes">${formatCurrency(0)}</span>
                    </div>
                </div>
            </div>
            
            <!-- Controle de Status -->
            <div class="status-section">
                <h4><i class="fas fa-tasks"></i> Controle de Status</h4>
                <div class="status-controls">
                    <select id="statusSelect" class="form-control">
                        <option value="pendente">⚪ Pendente</option>
                        <option value="relatorio-enviado">🔵 Relatório Enviado</option>
                        <option value="pagamento-enviado">🟡 Pagamento Enviado</option>
                        <option value="emitindo-nf">🟠 Emitindo NF</option>
                        <option value="erro-nf">🔴 Erro na NF</option>
                        <option value="concluido">🟢 Concluído</option>
                    </select>
                </div>
                
                <div class="observacoes-group">
                    <label for="observacoes">Observações:</label>
                    <textarea id="observacoes" class="form-control" rows="3" 
                              placeholder="Observações sobre este controle...">${this.controle ? this.controle.observacoes || '' : ''}</textarea>
                </div>
            </div>
            
            <!-- Ações Rápidas -->
            <div class="quick-actions">
                <h4><i class="fas fa-bolt"></i> Ações Rápidas</h4>
                <div class="quick-actions-grid">
                    <button type="button" class="action-card" id="btnGerarTemplate">
                        <i class="fas fa-envelope"></i>
                        <span>Template Email</span>
                    </button>
                    <button type="button" class="action-card" id="btnGerarPDF">
                        <i class="fas fa-file-pdf"></i>
                        <span>Gerar PDF</span>
                    </button>
                    <button type="button" class="action-card" id="btnDuplicarMes">
                        <i class="fas fa-copy"></i>
                        <span>Duplicar Mês</span>
                    </button>
                    <button type="button" class="action-card" id="btnLimparTudo">
                        <i class="fas fa-trash"></i>
                        <span>Limpar Tudo</span>
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * Renderizar lista de lançamentos
     */
    renderLancamentos() {
        if (this.lancamentos.length === 0) {
            return `
                <div class="no-lancamentos">
                    <i class="fas fa-calendar-plus"></i>
                    <h3>Nenhum lançamento ainda</h3>
                    <p>Clique em "Novo Lançamento" para começar</p>
                </div>
            `;
        }
        
        return this.lancamentos.map((lancamento, index) => this.createLancamentoRow(lancamento, index)).join('');
    }
    
    /**
     * Criar linha de lançamento
     */
    createLancamentoRow(lancamento, index) {
        const valorDia = lancamento.valor_dia || 0;
        const hasExtras = lancamento.extras && lancamento.extras.length > 0;
        
        return `
            <div class="lancamento-row" data-index="${index}">
                <div class="lancamento-header">
                    <input type="date" class="data-input" value="${lancamento.data}" 
                           onchange="window.currentLancamentoModal.updateLancamento(${index}, 'data', this.value)">
                    <div class="lancamento-actions">
                        <button type="button" class="btn btn-sm btn-secondary" 
                                onclick="window.currentLancamentoModal.duplicarLancamento(${index})" title="Duplicar">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-danger" 
                                onclick="window.currentLancamentoModal.removerLancamento(${index})" title="Remover">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Seção Marmitas -->
                <div class="marmitas-section">
                    <h4><i class="fas fa-utensils"></i> Marmitas</h4>
                    <div class="quantidades-grid">
                        <div class="quantidade-item">
                            <label>Pequena (P)</label>
                            <input type="number" class="qtd-input" min="0" value="${lancamento.qtd_pequena || 0}"
                                   onchange="window.currentLancamentoModal.updateLancamento(${index}, 'qtd_pequena', parseInt(this.value) || 0)">
                            <span class="preco">${formatCurrency(this.precos.P)}</span>
                        </div>
                        <div class="quantidade-item">
                            <label>Média (M)</label>
                            <input type="number" class="qtd-input" min="0" value="${lancamento.qtd_media || 0}"
                                   onchange="window.currentLancamentoModal.updateLancamento(${index}, 'qtd_media', parseInt(this.value) || 0)">
                            <span class="preco">${formatCurrency(this.precos.M)}</span>
                        </div>
                        <div class="quantidade-item">
                            <label>Grande (G)</label>
                            <input type="number" class="qtd-input" min="0" value="${lancamento.qtd_grande || 0}"
                                   onchange="window.currentLancamentoModal.updateLancamento(${index}, 'qtd_grande', parseInt(this.value) || 0)">
                            <span class="preco">${formatCurrency(this.precos.G)}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Seção Extras -->
                <div class="extras-section">
                    <div class="extras-header">
                        <h4><i class="fas fa-plus-circle"></i> Itens Extras</h4>
                        <button type="button" class="btn btn-sm btn-secondary" 
                                onclick="window.currentLancamentoModal.adicionarExtra(${index})">
                            <i class="fas fa-plus"></i> Adicionar
                        </button>
                    </div>
                    <div class="extras-list" id="extrasList${index}">
                        ${this.renderExtras(lancamento.extras || [], index)}
                    </div>
                </div>
                
                <!-- Total do Dia -->
                <div class="total-dia-section">
                    <div class="total-dia">
                        <label>💰 Total do Dia:</label>
                        <span class="valor-dia" id="valorDia${index}">${formatCurrency(valorDia)}</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Renderizar extras
     */
    renderExtras(extras, lancamentoIndex) {
        if (!extras || extras.length === 0) {
            return '<div class="no-extras">Nenhum item extra neste dia</div>';
        }
        
        return extras.map((extra, extraIndex) => `
            <div class="extra-row">
                <input type="text" class="extra-descricao" value="${extra.descricao || ''}" 
                       placeholder="Descrição do item"
                       onchange="window.currentLancamentoModal.updateExtra(${lancamentoIndex}, ${extraIndex}, 'descricao', this.value)">
                <input type="number" class="extra-quantidade" min="1" value="${extra.quantidade || 1}"
                       onchange="window.currentLancamentoModal.updateExtra(${lancamentoIndex}, ${extraIndex}, 'quantidade', parseInt(this.value) || 1)">
                <input type="number" class="extra-valor" step="0.01" min="0" value="${(extra.valor_unitario || 0).toFixed(2)}"
                       onchange="window.currentLancamentoModal.updateExtra(${lancamentoIndex}, ${extraIndex}, 'valor_unitario', parseFloat(this.value) || 0)">
                <span class="extra-total">${formatCurrency(extra.total || 0)}</span>
                <button type="button" class="btn-remove-extra" 
                        onclick="window.currentLancamentoModal.removerExtra(${lancamentoIndex}, ${extraIndex})">
                    <i class="fas fa-minus"></i>
                </button>
            </div>
        `).join('');
    }
    
    /**
     * Configurar eventos
     */
    setupEvents() {
        // Expor instância globalmente
        window.currentLancamentoModal = this;
        
        // Novo lançamento
        const btnNovo = this.element.querySelector('#btnNovoLancamento');
        if (btnNovo) {
            btnNovo.addEventListener('click', () => this.novoLancamento());
        }
        
        // Preencher dias úteis
        const btnPreencher = this.element.querySelector('#btnPreencherDias');
        if (btnPreencher) {
            btnPreencher.addEventListener('click', () => this.preencherDiasUteis());
        }
        
        // Status select
        const statusSelect = this.element.querySelector('#statusSelect');
        if (statusSelect) {
            statusSelect.value = this.controle ? this.controle.status : 'pendente';
            statusSelect.addEventListener('change', () => this.markAsChanged());
        }
        
        // Observações
        const observacoes = this.element.querySelector('#observacoes');
        if (observacoes) {
            observacoes.addEventListener('input', () => this.markAsChanged());
        }
        
        // Ações rápidas
        this.setupQuickActions();
        
        // Calcular totais iniciais
        this.calculateTotalGeral();
    }
    
    /**
     * Configurar ações rápidas
     */
    setupQuickActions() {
        const actions = {
            'btnGerarTemplate': () => this.gerarTemplate(),
            'btnGerarPDF': () => this.gerarPDF(),
            'btnDuplicarMes': () => this.duplicarMes(),
            'btnLimparTudo': () => this.limparTudo()
        };
        
        Object.entries(actions).forEach(([id, handler]) => {
            const btn = this.element.querySelector(`#${id}`);
            if (btn) {
                btn.addEventListener('click', handler);
            }
        });
    }
    
    /**
     * Novo lançamento
     */
    novoLancamento() {
        const novoLancamento = {
            data: getCurrentDate(),
            qtd_pequena: 0,
            qtd_media: 0,
            qtd_grande: 0,
            extras: [],
            valor_dia: 0
        };
        
        this.lancamentos.push(novoLancamento);
        this.lancamentos.sort((a, b) => a.data.localeCompare(b.data));
        
        this.refreshLancamentos();
        this.markAsChanged();
        
        // Scroll para o novo lançamento
        setTimeout(() => {
            const newRow = this.element.querySelector('.lancamento-row:last-child');
            if (newRow) {
                newRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const dateInput = newRow.querySelector('.data-input');
                if (dateInput) dateInput.focus();
            }
        }, 100);
    }
    
    /**
     * Atualizar lançamento
     */
    updateLancamento(index, field, value) {
        if (!this.lancamentos[index]) return;
        
        this.lancamentos[index][field] = value;
        this.calculateLancamentoTotal(index);
        this.debouncedCalculateTotal();
        this.markAsChanged();
        
        // Se mudou a data, reordenar
        if (field === 'data') {
            this.lancamentos.sort((a, b) => a.data.localeCompare(b.data));
            this.refreshLancamentos();
        }
    }
    
    /**
     * Calcular total do lançamento
     */
    calculateLancamentoTotal(index) {
        const lancamento = this.lancamentos[index];
        if (!lancamento) return;
        
        const valorMarmitas = (lancamento.qtd_pequena * this.precos.P) + 
                             (lancamento.qtd_media * this.precos.M) + 
                             (lancamento.qtd_grande * this.precos.G);
        
        const valorExtras = (lancamento.extras || []).reduce((sum, extra) => sum + (extra.total || 0), 0);
        
        lancamento.valor_marmitas = valorMarmitas;
        lancamento.valor_extras = valorExtras;
        lancamento.valor_dia = valorMarmitas + valorExtras;
        
        // Atualizar UI
        const valorElement = this.element.querySelector(`#valorDia${index}`);
        if (valorElement) {
            valorElement.textContent = formatCurrency(lancamento.valor_dia);
        }
    }
    
    /**
     * Adicionar extra
     */
    adicionarExtra(lancamentoIndex) {
        if (!this.lancamentos[lancamentoIndex].extras) {
            this.lancamentos[lancamentoIndex].extras = [];
        }
        
        this.lancamentos[lancamentoIndex].extras.push({
            descricao: '',
            quantidade: 1,
            valor_unitario: 0,
            total: 0
        });
        
        this.refreshExtras(lancamentoIndex);
        this.markAsChanged();
    }
    
    /**
     * Atualizar extra
     */
    updateExtra(lancamentoIndex, extraIndex, field, value) {
        const extra = this.lancamentos[lancamentoIndex].extras[extraIndex];
        if (!extra) return;
        
        extra[field] = value;
        
        // Recalcular total do extra
        extra.total = extra.quantidade * extra.valor_unitario;
        
        this.refreshExtras(lancamentoIndex);
        this.calculateLancamentoTotal(lancamentoIndex);
        this.debouncedCalculateTotal();
        this.markAsChanged();
    }
    
    /**
     * Remover extra
     */
    removerExtra(lancamentoIndex, extraIndex) {
        this.lancamentos[lancamentoIndex].extras.splice(extraIndex, 1);
        this.refreshExtras(lancamentoIndex);
        this.calculateLancamentoTotal(lancamentoIndex);
        this.debouncedCalculateTotal();
        this.markAsChanged();
    }
    
    /**
     * Refresh lista de extras
     */
    refreshExtras(lancamentoIndex) {
        const container = this.element.querySelector(`#extrasList${lancamentoIndex}`);
        if (container) {
            container.innerHTML = this.renderExtras(this.lancamentos[lancamentoIndex].extras || [], lancamentoIndex);
        }
    }
    
    /**
     * Duplicar lançamento
     */
    duplicarLancamento(index) {
        const original = this.lancamentos[index];
        const duplicado = {
            ...original,
            data: getCurrentDate(),
            extras: original.extras ? [...original.extras] : []
        };
        
        this.lancamentos.push(duplicado);
        this.lancamentos.sort((a, b) => a.data.localeCompare(b.data));
        
        this.refreshLancamentos();
        this.markAsChanged();
    }
    
    /**
     * Remover lançamento
     */
    removerLancamento(index) {
        if (confirm('Tem certeza que deseja remover este lançamento?')) {
            this.lancamentos.splice(index, 1);
            this.refreshLancamentos();
            this.markAsChanged();
        }
    }
    
    /**
     * Refresh lista de lançamentos
     */
    refreshLancamentos() {
        const container = this.element.querySelector('#lancamentosList');
        if (container) {
            container.innerHTML = this.renderLancamentos();
            // Recalcular todos os totais
            this.lancamentos.forEach((_, index) => this.calculateLancamentoTotal(index));
            this.calculateTotalGeral();
        }
    }
    
    /**
     * Calcular total geral
     */
    calculateTotalGeral() {
        const totais = this.lancamentos.reduce((acc, lancamento) => {
            acc.qtdPequenas += lancamento.qtd_pequena || 0;
            acc.qtdMedias += lancamento.qtd_media || 0;
            acc.qtdGrandes += lancamento.qtd_grande || 0;
            acc.valorMarmitas += lancamento.valor_marmitas || 0;
            acc.valorExtras += lancamento.valor_extras || 0;
            acc.valorTotal += lancamento.valor_dia || 0;
            return acc;
        }, {
            qtdPequenas: 0,
            qtdMedias: 0,
            qtdGrandes: 0,
            valorMarmitas: 0,
            valorExtras: 0,
            valorTotal: 0
        });
        
        totais.totalMarmitas = totais.qtdPequenas + totais.qtdMedias + totais.qtdGrandes;
        totais.valorPequenas = totais.qtdPequenas * this.precos.P;
        totais.valorMedias = totais.qtdMedias * this.precos.M;
        totais.valorGrandes = totais.qtdGrandes * this.precos.G;
        
        // Atualizar UI
        this.updateResumoUI(totais);
    }
    
    /**
     * Atualizar UI do resumo
     */
    updateResumoUI(totais) {
        const elements = {
            '#totalMarmitas': totais.totalMarmitas,
            '#valorMarmitas': formatCurrency(totais.valorMarmitas),
            '#valorExtras': formatCurrency(totais.valorExtras),
            '#valorTotal': formatCurrency(totais.valorTotal),
            '#qtdPequenas': totais.qtdPequenas,
            '#qtdMedias': totais.qtdMedias,
            '#qtdGrandes': totais.qtdGrandes,
            '#valorPequenas': formatCurrency(totais.valorPequenas),
            '#valorMedias': formatCurrency(totais.valorMedias),
            '#valorGrandes': formatCurrency(totais.valorGrandes)
        };
        
        Object.entries(elements).forEach(([selector, value]) => {
            const element = this.element.querySelector(selector);
            if (element) {
                element.textContent = value;
            }
        });
    }
    
    /**
     * Preencher dias úteis
     */
    preencherDiasUteis() {
        const confirmed = confirm(
            'Isso irá criar lançamentos para todos os dias úteis do mês que ainda não existem.\n' +
            'Deseja continuar?'
        );
        
        if (!confirmed) return;
        
        const diasDoMes = getDatesInPeriod(this.currentMonth);
        const diasUteis = diasDoMes.filter(data => {
            const dayOfWeek = new Date(data).getDay();
            return dayOfWeek !== 0 && dayOfWeek !== 6; // Não é domingo nem sábado
        });
        
        let adicionados = 0;
        diasUteis.forEach(data => {
            const existe = this.lancamentos.some(l => l.data === data);
            if (!existe) {
                this.lancamentos.push({
                    data,
                    qtd_pequena: 0,
                    qtd_media: 0,
                    qtd_grande: 0,
                    extras: [],
                    valor_dia: 0
                });
                adicionados++;
            }
        });
        
        if (adicionados > 0) {
            this.lancamentos.sort((a, b) => a.data.localeCompare(b.data));
            this.refreshLancamentos();
            this.markAsChanged();
            
            if (window.NotificationManager) {
                window.NotificationManager.success(`${adicionados} dias úteis adicionados!`);
            }
        } else {
            if (window.NotificationManager) {
                window.NotificationManager.info('Todos os dias úteis já possuem lançamentos.');
            }
        }
    }
    
    /**
     * Gerar template de email
     */
    async gerarTemplate() {
        try {
            if (this.lancamentos.length === 0) {
                if (window.NotificationManager) {
                    window.NotificationManager.warning('Adicione pelo menos um lançamento antes de gerar o template.');
                }
                return;
            }
            
            // Salvar dados atuais primeiro
            await this.save(false);
            
            // Gerar template usando templateService
            const template = templateService.processTemplate(
                this.empresa,
                this.getControleData(),
                this.precos
            );
            
            // Criar modal para mostrar o template
            this.showTemplatePreview(template);
            
        } catch (error) {
            errorHandler.captureError(error, { context: 'LancamentoModal.gerarTemplate' });
            if (window.NotificationManager) {
                window.NotificationManager.error('Erro ao gerar template: ' + error.message);
            }
        }
    }
    
    /**
     * Mostrar preview do template
     */
    showTemplatePreview(template) {
        const previewModal = createElement('div', {
            className: 'modal-overlay template-preview-modal'
        });
        
        previewModal.innerHTML = `
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h2><i class="fas fa-envelope"></i> Template de Email</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="template-preview">
                        <div class="form-group">
                            <label><strong>Assunto:</strong></label>
                            <div class="preview-content">${template.assunto}</div>
                        </div>
                        <div class="form-group">
                            <label><strong>Corpo do Email:</strong></label>
                            <div class="preview-content email-body">${template.corpo.replace(/\n/g, '<br>')}</div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary close-preview">Fechar</button>
                    <button class="btn btn-primary copy-template">
                        <i class="fas fa-copy"></i> Copiar para Área de Transferência
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(previewModal);
        
        // Eventos
        previewModal.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(previewModal);
        });
        
        previewModal.querySelector('.close-preview').addEventListener('click', () => {
            document.body.removeChild(previewModal);
        });
        
        previewModal.querySelector('.copy-template').addEventListener('click', async () => {
            try {
                const texto = `${template.assunto}\n\n${template.corpo}`;
                await navigator.clipboard.writeText(texto);
                if (window.NotificationManager) {
                    window.NotificationManager.success('Template copiado para área de transferência!');
                }
            } catch (error) {
                if (window.NotificationManager) {
                    window.NotificationManager.error('Erro ao copiar template.');
                }
            }
        });
        
        previewModal.addEventListener('click', (e) => {
            if (e.target === previewModal) {
                document.body.removeChild(previewModal);
            }
        });
    }
    
    /**
     * Gerar PDF
     */
    async gerarPDF() {
        try {
            if (this.lancamentos.length === 0) {
                if (window.NotificationManager) {
                    window.NotificationManager.warning('Adicione pelo menos um lançamento antes de gerar o PDF.');
                }
                return;
            }
            
            // Por enquanto, mostrar notificação de desenvolvimento
            if (window.NotificationManager) {
                window.NotificationManager.info('Funcionalidade de PDF em desenvolvimento. Em breve estará disponível!');
            }
            
            // TODO: Implementar geração de PDF usando jsPDF
            // const pdf = new jsPDF();
            // ... lógica de geração do PDF
            
        } catch (error) {
            errorHandler.captureError(error, { context: 'LancamentoModal.gerarPDF' });
            if (window.NotificationManager) {
                window.NotificationManager.error('Erro ao gerar PDF: ' + error.message);
            }
        }
    }
    
    /**
     * Duplicar mês
     */
    duplicarMes() {
        const novoMes = prompt(
            'Digite o período de destino no formato YYYY-MM:\n' +
            'Exemplo: 2025-09 para Setembro/2025'
        );
        
        if (!novoMes) return;
        
        if (!/^\d{4}-\d{2}$/.test(novoMes)) {
            if (window.NotificationManager) {
                window.NotificationManager.error('Formato inválido! Use YYYY-MM (ex: 2025-09)');
            }
            return;
        }
        
        const confirmed = confirm(
            `Tem certeza que deseja duplicar todos os lançamentos para ${novoMes}?\n` +
            'Isso criará uma cópia exata de todos os lançamentos no período selecionado.'
        );
        
        if (!confirmed) return;
        
        // TODO: Implementar duplicação para outro mês
        if (window.NotificationManager) {
            window.NotificationManager.info('Funcionalidade de duplicação em desenvolvimento!');
        }
    }
    
    /**
     * Limpar tudo
     */
    limparTudo() {
        const confirmed = confirm(
            'ATENÇÃO: Isso irá remover TODOS os lançamentos!\n\n' +
            'Esta ação não pode ser desfeita. Tem certeza?'
        );
        
        if (!confirmed) return;
        
        const finalConfirm = confirm('CONFIRMAÇÃO FINAL: Todos os lançamentos serão perdidos!');
        if (!finalConfirm) return;
        
        this.lancamentos = [];
        this.refreshLancamentos();
        this.markAsChanged();
        
        if (window.NotificationManager) {
            window.NotificationManager.success('Todos os lançamentos foram removidos.');
        }
    }
    
    /**
     * Marcar como alterado
     */
    markAsChanged() {
        this.hasChanges = true;
        this.debouncedSave();
        
        // Atualizar visual do botão salvar
        const saveBtn = this.element.querySelector('.btn-primary');
        if (saveBtn && !saveBtn.classList.contains('btn-loading')) {
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Alterações*';
        }
    }
    
    /**
     * Auto save
     */
    async autoSave() {
        if (!this.hasChanges) return;
        
        try {
            await this.save(false); // Save silencioso
            
            // Feedback visual sutil
            const saveBtn = this.element.querySelector('.btn-primary');
            if (saveBtn) {
                saveBtn.innerHTML = '<i class="fas fa-check"></i> Salvo Automaticamente';
                setTimeout(() => {
                    saveBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Alterações';
                }, 2000);
            }
            
        } catch (error) {
            console.warn('Erro no auto-save:', error);
        }
    }
    
    /**
     * Obter dados do controle
     */
    getControleData() {
        const totais = this.lancamentos.reduce((acc, lancamento) => {
            acc.qtd_pequena += lancamento.qtd_pequena || 0;
            acc.qtd_media += lancamento.qtd_media || 0;
            acc.qtd_grande += lancamento.qtd_grande || 0;
            acc.valor_total += lancamento.valor_dia || 0;
            return acc;
        }, {
            qtd_pequena: 0,
            qtd_media: 0,
            qtd_grande: 0,
            valor_total: 0
        });
        
        const statusSelect = this.element.querySelector('#statusSelect');
        const observacoes = this.element.querySelector('#observacoes');
        
        return {
            empresa_id: this.empresaId,
            mes_ano: this.currentMonth,
            qtd_pequena: totais.qtd_pequena,
            qtd_media: totais.qtd_media,
            qtd_grande: totais.qtd_grande,
            valor_total: totais.valor_total,
            status: statusSelect ? statusSelect.value : 'pendente',
            observacoes: observacoes ? observacoes.value.trim() : '',
            lancamentos_diarios: JSON.stringify(this.lancamentos)
        };
    }
    
    /**
     * Salvar dados
     */
    async save(showNotification = true) {
        if (this.isLoading) return;
        
        try {
            this.setLoading(true);
            
            const controleData = this.getControleData();
            
            // Validar se tem pelo menos um lançamento com dados
            const hasValidLancamento = this.lancamentos.some(l => 
                (l.qtd_pequena > 0 || l.qtd_media > 0 || l.qtd_grande > 0) ||
                (l.extras && l.extras.some(e => e.descricao && e.quantidade > 0 && e.valor_unitario > 0))
            );
            
            if (!hasValidLancamento && showNotification) {
                if (window.NotificationManager) {
                    window.NotificationManager.warning(
                        'Adicione pelo menos um lançamento com quantidades ou extras antes de salvar.'
                    );
                }
                return;
            }
            
            // Salvar via controle service
            await controleService.saveLancamento(this.empresaId, this.currentMonth, controleData);
            
            // Atualizar estado global
            const controles = await controleService.getByPeriod(this.currentMonth);
            stateManager.updateControles(controles);
            
            this.hasChanges = false;
            
            if (showNotification && window.NotificationManager) {
                window.NotificationManager.success('Lançamentos salvos com sucesso!');
            }
            
        } catch (error) {
            errorHandler.captureError(error, { 
                context: 'LancamentoModal.save',
                empresaId: this.empresaId 
            });
            
            if (showNotification && window.NotificationManager) {
                window.NotificationManager.error('Erro ao salvar: ' + error.message);
            }
            throw error;
            
        } finally {
            this.setLoading(false);
        }
    }
    
    /**
     * Lidar com fechamento
     */
    async handleClose() {
        if (this.hasChanges) {
            const result = confirm(
                'Você tem alterações não salvas.\n\n' +
                'Deseja salvar antes de fechar?'
            );
            
            if (result) {
                try {
                    await this.save();
                    this.close();
                } catch (error) {
                    // Erro já tratado no save()
                }
            } else {
                this.close();
            }
        } else {
            this.close();
        }
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
                '<i class="fas fa-save"></i> Salvar Alterações';
        }
        
        // Desabilitar campos durante loading
        const inputs = this.element.querySelectorAll('input, textarea, select, button');
        inputs.forEach(input => {
            if (!input.classList.contains('btn-secondary')) {
                input.disabled = loading;
            }
        });
    }
    
    /**
     * Métodos utilitários
     */
    getStatusText(status) {
        const statusMap = {
            'pendente': 'Pendente',
            'relatorio-enviado': 'Rel. Enviado',
            'pagamento-enviado': 'Pag. Enviado',
            'emitindo-nf': 'Emitindo NF',
            'erro-nf': 'Erro na NF',
            'concluido': 'Concluído'
        };
        return statusMap[status] || 'Pendente';
    }
    
    getStatusIcon(status) {
        const iconMap = {
            'pendente': '⚪',
            'relatorio-enviado': '🔵',
            'pagamento-enviado': '🟡',
            'emitindo-nf': '🟠',
            'erro-nf': '🔴',
            'concluido': '🟢'
        };
        return iconMap[status] || '⚪';
    }
    
    getCurrentMonthText() {
        const [year, month] = this.currentMonth.split('-');
        const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                       'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        return `${months[parseInt(month) - 1]}/${year}`;
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
    static open(empresaId = null) {
        const modal = new LancamentoModal(empresaId);
        return modal.open();
    }
}

// Expor globalmente
window.LancamentoModal = LancamentoModal;