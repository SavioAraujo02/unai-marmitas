// ===== MODAL DE CONFIGURAÇÕES =====

import { BaseModal } from './base-modal.js';
import { validatePositiveNumber } from '../../utils/validators.js';
import { formatCurrency } from '../../utils/formatters.js';
import { stateManager } from '../../core/state-manager.js';
import { empresaService } from '../../services/empresa-service.js';
import { controleService } from '../../services/controle-service.js';
import { exportService } from '../../services/export-service.js';
import { errorHandler } from '../../core/error-handler.js';
import { EmpresaModal } from './empresa-modal.js';

export class ConfigModal extends BaseModal {
    constructor() {
        super({
            id: 'configModal',
            title: '⚙️ Configurações do Sistema',
            size: 'extra-large',
            className: 'config-modal'
        });
        
        this.isLoading = false;
        this.currentTab = 'precos';
    }
    
    /**
     * Abrir modal
     */
    async open() {
        super.open();
        this.createInterface();
        return this;
    }
    
    /**
     * Criar interface
     */
    createInterface() {
        const interfaceHTML = `
            <div class="config-interface">
                <!-- Tabs de Navegação -->
                <div class="config-tabs">
                    <button class="config-tab active" data-tab="precos">
                        <i class="fas fa-dollar-sign"></i> Preços
                    </button>
                    <button class="config-tab" data-tab="empresas">
                        <i class="fas fa-building"></i> Empresas
                    </button>
                    <button class="config-tab" data-tab="periodos">
                        <i class="fas fa-calendar"></i> Períodos
                    </button>
                    <button class="config-tab" data-tab="backup">
                        <i class="fas fa-database"></i> Backup
                    </button>
                </div>
                
                <!-- Conteúdo das Tabs -->
                <div class="config-content">
                    <!-- Tab Preços -->
                    <div class="config-tab-content active" id="tab-precos">
                        ${this.createPrecosTab()}
                    </div>
                    
                    <!-- Tab Empresas -->
                    <div class="config-tab-content" id="tab-empresas">
                        ${this.createEmpresasTab()}
                    </div>
                    
                    <!-- Tab Períodos -->
                    <div class="config-tab-content" id="tab-periodos">
                        ${this.createPeriodosTab()}
                    </div>
                    
                    <!-- Tab Backup -->
                    <div class="config-tab-content" id="tab-backup">
                        ${this.createBackupTab()}
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
            }
        ]);
        
        // Configurar eventos
        this.setupEvents();
    }
    
    /**
     * Criar tab de preços
     */
    createPrecosTab() {
        const precos = stateManager.get('precos');
        
        return `
            <div class="precos-section">
                <h3><i class="fas fa-dollar-sign"></i> Preços das Marmitas</h3>
                <p class="section-description">Configure os valores das marmitas por tamanho.</p>
                
                <div class="precos-grid">
                    <div class="preco-item">
                        <label for="preco_p">Pequena (P):</label>
                        <div class="input-group">
                            <span class="input-prefix">R$</span>
                            <input type="number" id="preco_p" step="0.01" min="0" 
                                   value="${precos.P ? precos.P.toFixed(2) : '8.50'}" 
                                   class="form-control">
                        </div>
                    </div>
                    
                    <div class="preco-item">
                        <label for="preco_m">Média (M):</label>
                        <div class="input-group">
                            <span class="input-prefix">R$</span>
                            <input type="number" id="preco_m" step="0.01" min="0" 
                                   value="${precos.M ? precos.M.toFixed(2) : '10.00'}" 
                                   class="form-control">
                        </div>
                    </div>
                    
                    <div class="preco-item">
                        <label for="preco_g">Grande (G):</label>
                        <div class="input-group">
                            <span class="input-prefix">R$</span>
                            <input type="number" id="preco_g" step="0.01" min="0" 
                                   value="${precos.G ? precos.G.toFixed(2) : '12.50'}" 
                                   class="form-control">
                        </div>
                    </div>
                </div>
                
                <div class="precos-preview">
                    <h4>Preview dos Preços:</h4>
                    <div class="preview-grid">
                        <div class="preview-item">
                            <span>10 Pequenas:</span>
                            <span id="preview_p">${formatCurrency(10 * (precos.P || 8.50))}</span>
                        </div>
                        <div class="preview-item">
                            <span>10 Médias:</span>
                            <span id="preview_m">${formatCurrency(10 * (precos.M || 10.00))}</span>
                        </div>
                        <div class="preview-item">
                            <span>10 Grandes:</span>
                            <span id="preview_g">${formatCurrency(10 * (precos.G || 12.50))}</span>
                        </div>
                    </div>
                </div>
                
                <div class="section-actions">
                    <button type="button" class="btn btn-primary" id="btnSalvarPrecos">
                        <i class="fas fa-save"></i> Salvar Preços
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * Criar tab de empresas
     */
    createEmpresasTab() {
        const empresas = stateManager.get('empresas');
        
        return `
            <div class="empresas-section">
                <h3><i class="fas fa-building"></i> Empresas Cadastradas</h3>
                <p class="section-description">Gerencie as empresas do sistema.</p>
                
                <div class="empresas-actions">
                    <button type="button" class="btn btn-primary" id="btnNovaEmpresaConfig">
                        <i class="fas fa-plus"></i> Nova Empresa
                    </button>
                    <div class="empresas-stats">
                        <span class="stat-badge">
                            <i class="fas fa-building"></i>
                            ${empresas.length} empresas
                        </span>
                    </div>
                </div>
                
                <div class="empresas-list" id="empresasConfigList">
                    ${this.renderEmpresasList()}
                </div>
            </div>
        `;
    }
    
    /**
     * Criar tab de períodos
     */
    createPeriodosTab() {
        return `
            <div class="periodos-section">
                <h3><i class="fas fa-calendar"></i> Gerenciar Períodos</h3>
                <p class="section-description">Crie novos períodos e gerencie os existentes.</p>
                
                <div class="periodo-atual">
                    <h4>Período Atual:</h4>
                    <div class="current-period">
                        <i class="fas fa-calendar-check"></i>
                        <strong>${this.getCurrentMonthText()}</strong>
                    </div>
                </div>
                
                <div class="novo-periodo">
                    <h4>Criar Novo Período:</h4>
                    <div class="periodo-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="novo_mes">Mês:</label>
                                <select id="novo_mes" class="form-control">
                                    <option value="">Selecione</option>
                                    <option value="01">Janeiro</option>
                                    <option value="02">Fevereiro</option>
                                    <option value="03">Março</option>
                                    <option value="04">Abril</option>
                                    <option value="05">Maio</option>
                                    <option value="06">Junho</option>
                                    <option value="07">Julho</option>
                                    <option value="08">Agosto</option>
                                    <option value="09">Setembro</option>
                                    <option value="10">Outubro</option>
                                    <option value="11">Novembro</option>
                                    <option value="12">Dezembro</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="novo_ano">Ano:</label>
                                <select id="novo_ano" class="form-control">
                                    <option value="">Selecione</option>
                                    <option value="2024">2024</option>
                                    <option value="2025">2025</option>
                                    <option value="2026">2026</option>
                                    <option value="2027">2027</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="copiarEmpresas" checked>
                                <span class="checkmark"></span>
                                Copiar empresas do período atual
                            </label>
                            <small class="form-help">
                                Se marcado, todas as empresas ativas serão copiadas para o novo período
                            </small>
                        </div>
                        
                        <button type="button" class="btn btn-primary" id="btnCriarPeriodo">
                            <i class="fas fa-plus"></i> Criar Período
                        </button>
                    </div>
                </div>
                
                <div class="periodos-existentes">
                    <h4>Períodos Existentes:</h4>
                    <div class="periodos-grid" id="periodosGrid">
                        ${this.renderPeriodosGrid()}
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Criar tab de backup
     */
    createBackupTab() {
        return `
            <div class="backup-section">
                <h3><i class="fas fa-database"></i> Backup e Dados</h3>
                <p class="section-description">Exporte, importe e gerencie seus dados.</p>
                
                <div class="backup-actions-grid">
                    <div class="backup-card">
                        <div class="backup-card-header">
                            <i class="fas fa-download"></i>
                            <h4>Exportar Dados</h4>
                        </div>
                        <p>Baixe todos os dados do sistema para backup.</p>
                        <div class="backup-card-actions">
                            <button class="btn btn-success" id="btnExportarCompleto">
                                <i class="fas fa-download"></i> Backup Completo
                            </button>
                            <button class="btn btn-secondary" id="btnExportarPeriodo">
                                <i class="fas fa-calendar"></i> Período Atual
                            </button>
                        </div>
                    </div>
                    
                    <div class="backup-card">
                        <div class="backup-card-header">
                            <i class="fas fa-file-excel"></i>
                            <h4>Relatórios</h4>
                        </div>
                        <p>Gere relatórios em diferentes formatos.</p>
                        <div class="backup-card-actions">
                            <button class="btn btn-info" id="btnRelatorioCSV">
                                <i class="fas fa-file-csv"></i> CSV
                            </button>
                            <button class="btn btn-info" id="btnRelatorioExcel">
                                <i class="fas fa-file-excel"></i> Excel
                            </button>
                        </div>
                    </div>
                    
                    <div class="backup-card">
                        <div class="backup-card-header">
                            <i class="fas fa-trash-alt"></i>
                            <h4>Limpeza</h4>
                        </div>
                        <p>Limpe dados antigos ou reset do sistema.</p>
                        <div class="backup-card-actions">
                            <button class="btn btn-warning" id="btnLimparPeriodo">
                                <i class="fas fa-broom"></i> Limpar Período
                            </button>
                            <button class="btn btn-danger" id="btnResetSistema">
                                <i class="fas fa-exclamation-triangle"></i> Reset Sistema
                            </button>
                        </div>
                    </div>
                    
                    <div class="backup-card">
                        <div class="backup-card-header">
                            <i class="fas fa-chart-line"></i>
                            <h4>Estatísticas</h4>
                        </div>
                        <p>Informações sobre o uso do sistema.</p>
                        <div class="backup-stats" id="backupStats">
                            <div class="stat-row">
                                <span>Total de Empresas:</span>
                                <strong>${stateManager.get('empresas').length}</strong>
                            </div>
                            <div class="stat-row">
                                <span>Total de Controles:</span>
                                <strong>${stateManager.get('controles').length}</strong>
                            </div>
                            <div class="stat-row">
                                <span>Último Backup:</span>
                                                                <strong>Nunca</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Renderizar lista de empresas
     */
    renderEmpresasList() {
        const empresas = stateManager.get('empresas');
        
        if (empresas.length === 0) {
            return '<div class="no-empresas">📭 Nenhuma empresa cadastrada ainda.</div>';
        }
        
        return empresas.map(empresa => `
            <div class="empresa-config-item">
                <div class="empresa-config-info">
                    <div class="empresa-config-name">
                        <strong>${empresa.nome}</strong>
                        <span class="empresa-config-id">#${empresa.id}</span>
                    </div>
                    <div class="empresa-config-details">
                        <span><i class="fas fa-user"></i> ${empresa.contato || 'Sem contato'}</span>
                        <span><i class="fas fa-envelope"></i> ${empresa.email || 'Sem email'}</span>
                        <span><i class="fas fa-phone"></i> ${empresa.telefone || 'Sem telefone'}</span>
                    </div>
                </div>
                <div class="empresa-config-actions">
                    <button class="btn btn-sm btn-secondary" onclick="window.configModal.editarEmpresa(${empresa.id})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-sm btn-info" onclick="window.configModal.verHistorico(${empresa.id})">
                        <i class="fas fa-history"></i> Histórico
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="window.configModal.confirmarExclusao(${empresa.id})">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    /**
     * Renderizar grid de períodos
     */
    renderPeriodosGrid() {
        const selectMes = document.getElementById('selectMes');
        if (!selectMes) return '<div class="no-periodos">Nenhum período encontrado.</div>';
        
        const periodos = Array.from(selectMes.options).map(option => ({
            value: option.value,
            text: option.textContent,
            isCurrent: option.value === stateManager.get('currentMonth')
        }));
        
        return periodos.map(periodo => `
            <div class="periodo-item ${periodo.isCurrent ? 'current' : ''}">
                <div class="periodo-info">
                    <i class="fas fa-calendar"></i>
                    <span>${periodo.text}</span>
                </div>
                ${periodo.isCurrent ? '<span class="periodo-badge">Atual</span>' : ''}
                <div class="periodo-actions">
                    <button class="btn btn-xs btn-secondary" onclick="window.configModal.mudarPeriodo('${periodo.value}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    /**
     * Configurar eventos
     */
    setupEvents() {
        // Expor instância globalmente
        window.configModal = this;
        
        // Navegação entre tabs
        this.element.querySelectorAll('.config-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });
        
        // Eventos da tab de preços
        this.setupPrecosEvents();
        
        // Eventos da tab de empresas
        this.setupEmpresasEvents();
        
        // Eventos da tab de períodos
        this.setupPeriodosEvents();
        
        // Eventos da tab de backup
        this.setupBackupEvents();
    }
    
    /**
     * Configurar eventos da tab de preços
     */
    setupPrecosEvents() {
        // Atualizar preview em tempo real
        const precoInputs = this.element.querySelectorAll('#preco_p, #preco_m, #preco_g');
        precoInputs.forEach(input => {
            input.addEventListener('input', () => this.updatePrecosPreview());
        });
        
        // Salvar preços
        const btnSalvar = this.element.querySelector('#btnSalvarPrecos');
        if (btnSalvar) {
            btnSalvar.addEventListener('click', () => this.salvarPrecos());
        }
    }
    
    /**
     * Configurar eventos da tab de empresas
     */
    setupEmpresasEvents() {
        const btnNovaEmpresa = this.element.querySelector('#btnNovaEmpresaConfig');
        if (btnNovaEmpresa) {
            btnNovaEmpresa.addEventListener('click', () => {
                EmpresaModal.open();
            });
        }
    }
    
    /**
     * Configurar eventos da tab de períodos
     */
    setupPeriodosEvents() {
        const btnCriarPeriodo = this.element.querySelector('#btnCriarPeriodo');
        if (btnCriarPeriodo) {
            btnCriarPeriodo.addEventListener('click', () => this.criarNovoPeriodo());
        }
    }
    
    /**
     * Configurar eventos da tab de backup
     */
    setupBackupEvents() {
        // Exportar completo
        const btnExportarCompleto = this.element.querySelector('#btnExportarCompleto');
        if (btnExportarCompleto) {
            btnExportarCompleto.addEventListener('click', () => this.exportarCompleto());
        }
        
        // Exportar período
        const btnExportarPeriodo = this.element.querySelector('#btnExportarPeriodo');
        if (btnExportarPeriodo) {
            btnExportarPeriodo.addEventListener('click', () => this.exportarPeriodo());
        }
        
        // Relatórios
        const btnRelatorioCSV = this.element.querySelector('#btnRelatorioCSV');
        if (btnRelatorioCSV) {
            btnRelatorioCSV.addEventListener('click', () => this.gerarRelatorio('csv'));
        }
        
        // Limpar período
        const btnLimparPeriodo = this.element.querySelector('#btnLimparPeriodo');
        if (btnLimparPeriodo) {
            btnLimparPeriodo.addEventListener('click', () => this.limparPeriodo());
        }
    }
    
    /**
     * Trocar tab
     */
    switchTab(tabName) {
        // Atualizar botões
        this.element.querySelectorAll('.config-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        this.element.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Atualizar conteúdo
        this.element.querySelectorAll('.config-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        this.element.querySelector(`#tab-${tabName}`).classList.add('active');
        
        this.currentTab = tabName;
        
        // Recarregar dados se necessário
        if (tabName === 'empresas') {
            this.refreshEmpresasList();
        } else if (tabName === 'periodos') {
            this.refreshPeriodosGrid();
        }
    }
    
    /**
     * Atualizar preview dos preços
     */
    updatePrecosPreview() {
        const precoP = parseFloat(this.element.querySelector('#preco_p').value) || 0;
        const precoM = parseFloat(this.element.querySelector('#preco_m').value) || 0;
        const precoG = parseFloat(this.element.querySelector('#preco_g').value) || 0;
        
        const previewP = this.element.querySelector('#preview_p');
        const previewM = this.element.querySelector('#preview_m');
        const previewG = this.element.querySelector('#preview_g');
        
        if (previewP) previewP.textContent = formatCurrency(10 * precoP);
        if (previewM) previewM.textContent = formatCurrency(10 * precoM);
        if (previewG) previewG.textContent = formatCurrency(10 * precoG);
    }
    
    /**
     * Salvar preços
     */
    async salvarPrecos() {
        try {
            this.setLoading(true);
            
            const novosPrecos = {
                P: parseFloat(this.element.querySelector('#preco_p').value),
                M: parseFloat(this.element.querySelector('#preco_m').value),
                G: parseFloat(this.element.querySelector('#preco_g').value)
            };
            
            // Validar
            if (novosPrecos.P <= 0 || novosPrecos.M <= 0 || novosPrecos.G <= 0) {
                throw new Error('Todos os preços devem ser maiores que zero!');
            }
            
            // Salvar no banco (implementar depois)
            // await Database.updatePrecos(novosPrecos);
            
            // Atualizar estado
            stateManager.updatePrecos(novosPrecos);
            
            if (window.NotificationManager) {
                window.NotificationManager.success('Preços atualizados com sucesso!');
            }
            
        } catch (error) {
            errorHandler.captureError(error, { context: 'ConfigModal.salvarPrecos' });
            
            if (window.NotificationManager) {
                window.NotificationManager.error('Erro ao salvar preços: ' + error.message);
            }
        } finally {
            this.setLoading(false);
        }
    }
    
    /**
     * Criar novo período
     */
    async criarNovoPeriodo() {
        try {
            const mes = this.element.querySelector('#novo_mes').value;
            const ano = this.element.querySelector('#novo_ano').value;
            const copiarEmpresas = this.element.querySelector('#copiarEmpresas').checked;
            
            if (!mes || !ano) {
                throw new Error('Selecione mês e ano!');
            }
            
            const novoPeriodo = `${ano}-${mes}`;
            
            // Verificar se já existe
            const selectMes = document.getElementById('selectMes');
            const periodosExistentes = Array.from(selectMes.options).map(opt => opt.value);
            
            if (periodosExistentes.includes(novoPeriodo)) {
                throw new Error('Este período já existe!');
            }
            
            // Adicionar ao select
            const option = document.createElement('option');
            option.value = novoPeriodo;
            option.textContent = this.formatPeriod(novoPeriodo);
            selectMes.appendChild(option);
            
            // Copiar empresas se solicitado
            if (copiarEmpresas) {
                const currentMonth = stateManager.get('currentMonth');
                await controleService.copyEmpresasToNewPeriod(currentMonth, novoPeriodo);
            }
            
            // Limpar form
            this.element.querySelector('#novo_mes').value = '';
            this.element.querySelector('#novo_ano').value = '';
            
            // Refresh grid
            this.refreshPeriodosGrid();
            
            if (window.NotificationManager) {
                window.NotificationManager.success(`Período ${this.formatPeriod(novoPeriodo)} criado com sucesso!`);
            }
            
        } catch (error) {
            errorHandler.captureError(error, { context: 'ConfigModal.criarNovoPeriodo' });
            
            if (window.NotificationManager) {
                window.NotificationManager.error('Erro ao criar período: ' + error.message);
            }
        }
    }
    
    /**
     * Exportar backup completo
     */
    async exportarCompleto() {
        try {
            this.setLoading(true);
            
            await exportService.exportBackup();
            
            if (window.NotificationManager) {
                window.NotificationManager.success('Backup exportado com sucesso!');
            }
            
        } catch (error) {
            errorHandler.captureError(error, { context: 'ConfigModal.exportarCompleto' });
            
            if (window.NotificationManager) {
                window.NotificationManager.error('Erro ao exportar backup: ' + error.message);
            }
        } finally {
            this.setLoading(false);
        }
    }
    
    /**
     * Exportar período atual
     */
    async exportarPeriodo() {
        try {
            this.setLoading(true);
            
            const currentMonth = stateManager.get('currentMonth');
            await exportService.exportPeriodData(currentMonth, 'json');
            
            if (window.NotificationManager) {
                window.NotificationManager.success('Dados do período exportados!');
            }
            
        } catch (error) {
            errorHandler.captureError(error, { context: 'ConfigModal.exportarPeriodo' });
            
            if (window.NotificationManager) {
                window.NotificationManager.error('Erro ao exportar período: ' + error.message);
            }
        } finally {
            this.setLoading(false);
        }
    }
    
    /**
     * Gerar relatório
     */
    async gerarRelatorio(formato) {
        try {
            this.setLoading(true);
            
            const currentMonth = stateManager.get('currentMonth');
            await exportService.exportPeriodData(currentMonth, formato);
            
            if (window.NotificationManager) {
                window.NotificationManager.success(`Relatório ${formato.toUpperCase()} gerado!`);
            }
            
        } catch (error) {
            errorHandler.captureError(error, { context: 'ConfigModal.gerarRelatorio' });
            
            if (window.NotificationManager) {
                window.NotificationManager.error('Erro ao gerar relatório: ' + error.message);
            }
        } finally {
            this.setLoading(false);
        }
    }
    
    /**
     * Limpar período atual
     */
    async limparPeriodo() {
        const currentMonth = stateManager.get('currentMonth');
        const confirmed = confirm(
            `Tem certeza que deseja limpar TODOS os dados do período ${this.getCurrentMonthText()}?\n\n` +
            'Esta ação não pode ser desfeita!'
        );
        
        if (!confirmed) return;
        
        const finalConfirm = confirm('CONFIRMAÇÃO FINAL: Todos os lançamentos serão perdidos. Continuar?');
        if (!finalConfirm) return;
        
        try {
            this.setLoading(true);
            
            await controleService.clearPeriod(currentMonth);
            
            // Recarregar dados
            if (window.app) {
                await window.app.loadInitialData(false);
            }
            
            if (window.NotificationManager) {
                window.NotificationManager.success(`Período ${this.getCurrentMonthText()} limpo com sucesso!`);
            }
            
        } catch (error) {
            errorHandler.captureError(error, { context: 'ConfigModal.limparPeriodo' });
            
            if (window.NotificationManager) {
                window.NotificationManager.error('Erro ao limpar período: ' + error.message);
            }
        } finally {
            this.setLoading(false);
        }
    }
    
    /**
     * Métodos de ação para empresas
     */
    editarEmpresa(empresaId) {
        EmpresaModal.open(empresaId);
    }
    
    async verHistorico(empresaId) {
        try {
            const empresa = stateManager.get('empresas').find(e => e.id === empresaId);
            if (!empresa) return;
            
            // TODO: Implementar modal de histórico
            if (window.NotificationManager) {
                window.NotificationManager.info(`Histórico da ${empresa.nome} - Em desenvolvimento!`);
            }
            
        } catch (error) {
            console.error('Erro ao ver histórico:', error);
        }
    }
    
    async confirmarExclusao(empresaId) {
        const confirmed = await EmpresaModal.confirmDelete(empresaId);
        if (confirmed) {
            this.refreshEmpresasList();
        }
    }
    
    /**
     * Mudar período ativo
     */
    async mudarPeriodo(periodo) {
        try {
            stateManager.setCurrentMonth(periodo);
            
            // Atualizar select principal
            const selectMes = document.getElementById('selectMes');
            if (selectMes) {
                selectMes.value = periodo;
            }
            
            // Recarregar dados
            if (window.app) {
                await window.app.loadInitialData();
            }
            
            // Refresh grid
            this.refreshPeriodosGrid();
            
            if (window.NotificationManager) {
                window.NotificationManager.success(`Período alterado para ${this.formatPeriod(periodo)}`);
            }
            
        } catch (error) {
            errorHandler.captureError(error, { context: 'ConfigModal.mudarPeriodo' });
            
            if (window.NotificationManager) {
                window.NotificationManager.error('Erro ao mudar período: ' + error.message);
            }
        }
    }
    
    /**
     * Refresh da lista de empresas
     */
    refreshEmpresasList() {
        const empresasConfigList = this.element.querySelector('#empresasConfigList');
        if (empresasConfigList) {
            empresasConfigList.innerHTML = this.renderEmpresasList();
        }
        
        // Atualizar contador
        const empresas = stateManager.get('empresas');
        const statBadge = this.element.querySelector('.empresas-stats .stat-badge');
        if (statBadge) {
            statBadge.innerHTML = `<i class="fas fa-building"></i> ${empresas.length} empresas`;
        }
    }
    
    /**
     * Refresh do grid de períodos
     */
    refreshPeriodosGrid() {
        const periodosGrid = this.element.querySelector('#periodosGrid');
        if (periodosGrid) {
            periodosGrid.innerHTML = this.renderPeriodosGrid();
        }
    }
    
    /**
     * Métodos utilitários
     */
    getCurrentMonthText() {
        const currentMonth = stateManager.get('currentMonth');
        return this.formatPeriod(currentMonth);
    }
    
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
        
        // Desabilitar botões durante loading
        const buttons = this.element.querySelectorAll('button');
        buttons.forEach(btn => {
            if (!btn.classList.contains('btn-secondary')) {
                btn.disabled = loading;
            }
        });
        
        // Adicionar spinner nos botões primários
        const primaryButtons = this.element.querySelectorAll('.btn-primary');
        primaryButtons.forEach(btn => {
            if (loading) {
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
            }
        });
    }
    
    /**
     * Limpar instância global ao fechar
     */
    close() {
        window.configModal = null;
        return super.close();
    }
    
    /**
     * Método estático para abrir modal
     */
    static open() {
        const modal = new ConfigModal();
        return modal.open();
    }
}

// Expor globalmente
window.ConfigModal = ConfigModal;