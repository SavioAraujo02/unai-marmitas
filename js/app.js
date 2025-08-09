// ===== APLICAÇÃO PRINCIPAL REFATORADA =====

// Imports dos módulos
import { SUPABASE_CONFIG } from './config/constants.js';
import { stateManager } from './core/state-manager.js';
import { eventManager } from './core/event-manager.js';
import { performanceMonitor } from './core/performance-monitor.js';
import { errorHandler } from './core/error-handler.js';
import { empresaService } from './services/empresa-service.js';
import { controleService } from './services/controle-service.js';
import { templateService } from './services/template-service.js';
import { exportService } from './services/export-service.js';
import { EmpresaModal } from './components/modals/empresa-modal.js';
import { LancamentoModal } from './components/forms/lancamento-form.js';
import { LancamentoRapidoModal } from './components/modals/lancamento-rapido-modal.js';

class UnaiMarmitasApp {
    constructor() {
        this.supabase = null;
        this.isInitialized = false;
        this.currentFilter = 'todos';
        this.searchTerm = '';
    }
    
    /**
     * Inicializar aplicação
     */
    async init() {
        if (this.isInitialized) return;
        
        console.log('🚀 Iniciando Unaí Marmitas v3.0...');
        
        try {
            // Mostrar splash screen
            this.showSplashScreen();
            
            // Inicializar Supabase
            this.initSupabase();
            
            // Inicializar sistemas core
            this.initCoreSystems();
            
            // Inicializar serviços
            this.initServices();
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Inicializar períodos
            await this.initializePeriods();
            
            // Carregar dados iniciais
            await this.loadInitialData();
            
            // Renderizar interface
            this.renderDashboard();
            
            // Configurar auto-updates
            this.setupAutoUpdates();
            
            // Remover splash screen
            this.hideSplashScreen();
            
            this.isInitialized = true;
            
            // Notificação de sucesso
            setTimeout(() => {
                if (window.NotificationManager) {
                    const empresasCount = stateManager.get('empresas').length;
                    window.NotificationManager.success(
                        `Sistema carregado! ${empresasCount} empresas encontradas.`
                    );
                }
            }, 500);
            
            console.log('✅ Sistema inicializado com sucesso!');
            
        } catch (error) {
            console.error('❌ Erro crítico na inicialização:', error);
            this.hideSplashScreen();
            this.handleInitError(error);
        }
    }
    
    /**
     * Inicializar Supabase
     */
    initSupabase() {
        this.supabase = window.supabase.createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.KEY);
        console.log('✅ Supabase inicializado');
    }
    
    /**
     * Inicializar sistemas core
     */
    initCoreSystems() {
        errorHandler.init();
        eventManager.init();
        
        // Configurar observers do estado
        this.setupStateObservers();
        
        console.log('✅ Sistemas core inicializados');
    }
    
    /**
     * Inicializar serviços
     */
    initServices() {
        empresaService.init(this.supabase);
        controleService.init(this.supabase);
        exportService.init(this.supabase);
        
        console.log('✅ Serviços inicializados');
    }
    
    /**
     * Configurar observers do estado
     */
    setupStateObservers() {
        stateManager.subscribe('empresas', (empresas) => {
            console.log('🏢 Empresas atualizadas:', empresas.length);
            this.renderEmpresas();
        });
        
        stateManager.subscribe('controles', (controles) => {
            console.log('📊 Controles atualizados:', controles.length);
            this.renderResumo();
            this.renderEmpresas();
        });
        
        stateManager.subscribe('loading', (isLoading) => {
            document.body.classList.toggle('app-loading', isLoading);
        });
        
        stateManager.subscribe('filter', (filter) => {
            this.currentFilter = filter;
            this.renderEmpresas();
        });
        
        stateManager.subscribe('search', (searchTerm) => {
            this.searchTerm = searchTerm;
            this.renderEmpresas();
        });
    }
    
    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Atalhos de teclado
        eventManager.on('shortcut:nova-empresa', () => {
            EmpresaModal.open();
        });
        
        eventManager.on('shortcut:lancamentos', () => {
            this.showPaginaLancamentos();
        });
        
        eventManager.on('shortcut:busca', () => {
            const searchInput = document.getElementById('searchEmpresa');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        });
        
        eventManager.on('shortcut:escape', () => {
            this.closeTopModal();
        });
        
        eventManager.on('shortcut:refresh', () => {
            this.reloadData();
        });
        
        // Eventos de conectividade
        eventManager.on('connection:online', () => {
            if (window.NotificationManager) {
                window.NotificationManager.success('Conexão restaurada!');
            }
            this.loadInitialData(false);
        });
        
        eventManager.on('connection:offline', () => {
            if (window.NotificationManager) {
                window.NotificationManager.warning('Sem conexão com a internet', 0);
            }
        });
        
        // Eventos de visibilidade
        eventManager.on('page:visible', () => {
            // Verificar se precisa atualizar dados
            const lastUpdate = stateManager.getCache('last-update');
            const now = Date.now();
            
            if (!lastUpdate || (now - lastUpdate) > 5 * 60 * 1000) { // 5 minutos
                this.loadInitialData(false);
                stateManager.setCache('last-update', now);
            }
        });
        
        // Configurar elementos da interface
        this.setupInterfaceEvents();
        
        console.log('✅ Event listeners configurados');
    }
    
    /**
     * Configurar eventos da interface
     */
    setupInterfaceEvents() {
        // Botão Nova Empresa
        const btnNovaEmpresa = document.getElementById('btnNovaEmpresa');
        if (btnNovaEmpresa) {
            btnNovaEmpresa.addEventListener('click', () => {
                EmpresaModal.open();
            });
        }
        
        // Botão Lançamentos
        const btnLancamentos = document.getElementById('btnLancamentos');
        if (btnLancamentos) {
            btnLancamentos.addEventListener('click', () => {
                this.showPaginaLancamentos();
            });
        }
        
        // Seletor de mês
        const selectMes = document.getElementById('selectMes');
        if (selectMes) {
            selectMes.addEventListener('change', async (e) => {
                const newMonth = e.target.value;
                if (newMonth !== stateManager.get('currentMonth')) {
                    stateManager.setCurrentMonth(newMonth);
                    stateManager.clearCache();
                    await this.loadInitialData();
                    
                    if (window.NotificationManager) {
                        window.NotificationManager.info(
                            `Período alterado para ${this.getCurrentMonthText()}`
                        );
                    }
                }
            });
        }
        
        // Busca
        const searchInput = document.getElementById('searchEmpresa');
        if (searchInput) {
            eventManager.setupSearch(searchInput, (searchTerm) => {
                stateManager.setSearchTerm(searchTerm);
            });
        }
        
        // Filtros
        const filtrosContainer = document.querySelector('.filtros');
        if (filtrosContainer) {
            eventManager.setupFilters(filtrosContainer, (filter) => {
                stateManager.setFilter(filter);
            });
        }
        
        // FAB Menu
        const fabMain = document.getElementById('fabMain');
        if (fabMain) {
            const fabItems = [
                { 
                    icon: 'fas fa-building', 
                    label: 'Nova Empresa', 
                    action: () => EmpresaModal.open() 
                },
                { 
                    icon: 'fas fa-plus', 
                    label: 'Lançamento', 
                    action: () => LancamentoRapidoModal.open() 
                },
                { 
                    icon: 'fas fa-chart-line', 
                    label: 'Analytics', 
                    action: () => this.showAnalytics() 
                },
                { 
                    icon: 'fas fa-cog', 
                    label: 'Configurações', 
                    action: () => this.showConfiguracoes() 
                }
            ];
            
            eventManager.setupFAB(fabMain, fabItems);
        }
    }
    
    /**
     * Inicializar períodos
     */
    async initializePeriods() {
        try {
            const periodos = await controleService.getAvailablePeriods();
            const selectMes = document.getElementById('selectMes');
            
            if (selectMes) {
                selectMes.innerHTML = '';
                
                if (periodos.length === 0) {
                    // Se não há períodos, criar o atual
                    const currentMonth = stateManager.get('currentMonth');
                    const option = document.createElement('option');
                    option.value = currentMonth;
                    option.textContent = this.getCurrentMonthText();
                    selectMes.appendChild(option);
                } else {
                    // Adicionar todos os períodos encontrados
                    periodos.forEach(periodo => {
                        const option = document.createElement('option');
                        option.value = periodo;
                        option.textContent = this.formatPeriod(periodo);
                        selectMes.appendChild(option);
                    });
                    
                    // Se o período atual não existe na lista, usar o mais recente
                    const currentMonth = stateManager.get('currentMonth');
                    if (!periodos.includes(currentMonth)) {
                        stateManager.setCurrentMonth(periodos[0]);
                    }
                }
                
                selectMes.value = stateManager.get('currentMonth');
            }
            
        } catch (error) {
            console.error('Erro ao inicializar períodos:', error);
            // Fallback: usar período atual
            const selectMes = document.getElementById('selectMes');
            if (selectMes) {
                const currentMonth = stateManager.get('currentMonth');
                selectMes.innerHTML = `<option value="${currentMonth}">${this.getCurrentMonthText()}</option>`;
            }
        }
    }
    
    /**
     * Carregar dados iniciais
     */
    async loadInitialData(showLoading = true) {
        if (showLoading) {
            stateManager.setLoading(true);
        }
        
        try {
            const currentMonth = stateManager.get('currentMonth');
            
            // Carregar dados em paralelo
            const [empresas, controles, precos] = await Promise.all([
                empresaService.getAll(),
                controleService.getByPeriod(currentMonth),
                this.loadPrecos()
            ]);
            
            // Atualizar estado
            stateManager.updateEmpresas(empresas);
            stateManager.updateControles(controles);
            stateManager.updatePrecos(precos);
            
            console.log('✅ Dados carregados:', {
                empresas: empresas.length,
                controles: controles.length,
                periodo: currentMonth
            });
            
        } catch (error) {
            errorHandler.captureError(error, { context: 'UnaiMarmitasApp.loadInitialData' });
            
            if (window.NotificationManager) {
                window.NotificationManager.error(
                    'Erro ao carregar dados. Verifique sua conexão.',
                    5000,
                    [{
                        label: 'Tentar Novamente',
                        callback: () => this.loadInitialData()
                    }]
                );
            }
        } finally {
            if (showLoading) {
                stateManager.setLoading(false);
            }
        }
    }
    
    /**
     * Carregar preços
     */
    async loadPrecos() {
        try {
            const { data, error } = await this.supabase
                .from('precos_marmitas')
                .select('*')
                .eq('ativo', true);
            
            if (error) throw error;
            
            const precos = {};
            data.forEach(item => {
                precos[item.tamanho] = parseFloat(item.preco);
            });
            
            return precos;
        } catch (error) {
            console.error('Erro ao carregar preços:', error);
            return stateManager.get('precos'); // Usar preços padrão
        }
    }
    
    /**
     * Renderizar dashboard
     */
    renderDashboard() {
        this.renderResumo();
        this.renderEmpresas();
        this.updateProgressChart();
    }
    
    /**
     * Renderizar resumo
     */
    renderResumo() {
        const controles = stateManager.get('controles');
        
        const totalFaturado = controles.reduce((sum, c) => sum + (c.valor_total || 0), 0);
        const totalEmpresas = stateManager.get('empresas').length;
        const concluidas = controles.filter(c => c.status === 'concluido').length;
        const pendentes = controles.filter(c => c.status === 'pendente').length;
        const comErro = controles.filter(c => c.status === 'erro-nf').length;
        
        // Atualizar elementos com animação
        this.animateStatValue('.stat-faturado .stat-value', totalFaturado, true);
        this.animateStatValue('.stat-empresas .stat-value', totalEmpresas);
        this.animateStatValue('.stat-concluidas .stat-value', concluidas);
        this.animateStatValue('.stat-pendentes .stat-value', pendentes);
        this.animateStatValue('.stat-erro .stat-value', comErro);
    }
    
    /**
     * Animar valor das estatísticas
     */
    animateStatValue(selector, newValue, isCurrency = false) {
        const element = document.querySelector(selector);
        if (!element) return;
        
        const currentValue = isCurrency ? 
            parseFloat(element.textContent.replace(/[^0-9,]/g, '').replace(',', '.')) || 0 :
            parseInt(element.textContent) || 0;
        
        if (currentValue !== newValue) {
            this.animateNumber(element, currentValue, newValue, isCurrency);
        }
    }
    
    /**
     * Animar número
     */
    animateNumber(element, start, end, isCurrency = false) {
        const duration = 1000;
        const startTime = performance.now();
        
        const updateNumber = (currentTime) => {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            const current = start + (end - start) * easeOutCubic;
            
            if (isCurrency) {
                element.textContent = this.formatCurrency(current);
            } else {
                element.textContent = Math.round(current);
            }
            
            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            }
        };
        
        requestAnimationFrame(updateNumber);
    }
    
    /**
     * Renderizar empresas
     */
    renderEmpresas() {
        const grid = document.getElementById('empresasGrid');
        if (!grid) return;
        
        let empresas = stateManager.get('empresas');
        const controles = stateManager.get('controles');
        
        // Aplicar filtros
        empresas = this.applyFilters(empresas, controles);
        
        // Renderizar cards
        grid.style.opacity = '0.5';
        grid.innerHTML = empresas.map(empresa => this.createEmpresaCard(empresa, controles)).join('');
        
        // Animar entrada
        requestAnimationFrame(() => {
            grid.style.opacity = '1';
            const cards = grid.querySelectorAll('.empresa-card');
            cards.forEach((card, index) => {
                card.style.animationDelay = `${index * 0.1}s`;
                card.classList.add('fade-in');
            });
        });
    }
    
    /**
     * Aplicar filtros
     */
    applyFilters(empresas, controles) {
        let filtered = [...empresas];
        
        // Filtro por status
        if (this.currentFilter !== 'todos') {
            filtered = filtered.filter(empresa => {
                const controle = controles.find(c => c.empresa_id === empresa.id);
                if (!controle) return this.currentFilter === 'pendentes';
                
                switch (this.currentFilter) {
                    case 'pendentes': return controle.status === 'pendente';
                    case 'erro': return controle.status === 'erro-nf';
                    case 'concluidos': return controle.status === 'concluido';
                    default: return true;
                }
            });
        }
        
        // Filtro por busca
        if (this.searchTerm) {
            const searchLower = this.searchTerm.toLowerCase();
            filtered = filtered.filter(empresa => 
                empresa.nome.toLowerCase().includes(searchLower) ||
                (empresa.contato && empresa.contato.toLowerCase().includes(searchLower)) ||
                (empresa.email && empresa.email.toLowerCase().includes(searchLower))
            );
        }
        
        return filtered;
    }
    
    /**
     * Criar card da empresa
     */
    createEmpresaCard(empresa, controles) {
        const controle = controles.find(c => c.empresa_id === empresa.id);
        const status = controle ? controle.status : 'pendente';
        const statusText = this.getStatusText(status);
        const statusIcon = this.getStatusIcon(status);
        
        const qtdTotal = controle ? 
            (controle.qtd_pequena + controle.qtd_media + controle.qtd_grande) : 0;
        const valorTotal = controle ? controle.valor_total : 0;
        
        const qtdText = controle ? 
            `P:${controle.qtd_pequena} M:${controle.qtd_media} G:${controle.qtd_grande}` : 
            'Não lançado';
        
        return `
            <div class="empresa-card ${status}" data-empresa-id="${empresa.id}">
                <div class="empresa-header">
                    <div class="empresa-nome">${empresa.nome}</div>
                    <div class="status-badge ${status}">${statusIcon} ${statusText}</div>
                </div>
                
                <div class="empresa-metrics">
                    <div class="metric-item">
                        <span class="metric-value">${qtdTotal}</span>
                        <span class="metric-label">Marmitas</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-value">${this.calculateDaysCount(controle)}</span>
                        <span class="metric-label">Dias</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-value">${this.formatCurrency(valorTotal)}</span>
                        <span class="metric-label">Total</span>
                    </div>
                </div>
                
                <div class="empresa-info">
                    <p><strong>📞 Contato:</strong> ${empresa.contato || 'Não informado'}</p>
                    <p><strong>🍽️ Marmitas:</strong> ${qtdText}</p>
                    <p><strong>📧 Email:</strong> ${empresa.email || 'Não informado'}</p>
                </div>
                
                <div class="empresa-actions">
                    ${this.createActionButtons(empresa.id, status, controle)}
                </div>
            </div>
        `;
    }
    
    /**
     * Criar botões de ação
     */
    createActionButtons(empresaId, status, controle) {
        let buttons = [];
        
        // Template e PDF (sempre disponível se tem dados)
        if (controle && (controle.qtd_pequena + controle.qtd_media + controle.qtd_grande) > 0) {
            buttons.push(`
                <button class="btn btn-secondary btn-small" onclick="app.gerarTemplate(${empresaId})" title="Gerar template de email">
                    <i class="fas fa-envelope"></i>
                </button>
            `);
            
            buttons.push(`
                <button class="btn btn-pdf btn-small" onclick="app.gerarPDF(${empresaId})" title="Gerar PDF">
                    <i class="fas fa-file-pdf"></i>
                </button>
            `);
        }
        
        // Botões baseados no status
        switch (status) {
            case 'pendente':
                buttons.push(`
                    <button class="btn btn-primary btn-small" onclick="app.modalLancamentoRapido(${empresaId})" title="Lançamento rápido">
                        <i class="fas fa-plus"></i>
                    </button>
                `);
                buttons.push(`
                    <button class="btn btn-secondary btn-small" onclick="app.abrirLancamentosCompletos(${empresaId})" title="Ver todos os lançamentos">
                        <i class="fas fa-list"></i>
                    </button>
                `);
                break;
                
            case 'erro-nf':
                buttons.push(`
                    <button class="btn btn-primary btn-small" onclick="app.abrirLancamentosCompletos(${empresaId})" title="Editar lançamentos">
                        <i class="fas fa-edit"></i>
                    </button>
                `);
                buttons.push(`
                    <button class="btn btn-success btn-small" onclick="app.avancarStatusDireto(${empresaId}, 'emitindo-nf')" title="Tentar novamente">
                        <i class="fas fa-redo"></i>
                    </button>
                `);
                break;
                
            case 'concluido':
                buttons.push(`
                    <button class="btn btn-secondary btn-small" onclick="app.abrirLancamentosCompletos(${empresaId})" title="Ver dados">
                        <i class="fas fa-eye"></i>
                    </button>
                `);
                buttons.push(`
                    <button class="btn btn-info btn-small" onclick="app.showAnalytics(${empresaId})" title="Analytics">
                        <i class="fas fa-chart-line"></i>
                    </button>
                `);
                break;
                
            default:
                buttons.push(`
                    <button class="btn btn-primary btn-small" onclick="app.modalLancamentoRapido(${empresaId})" title="Lançar dia">
                        <i class="fas fa-plus"></i>
                    </button>
                `);
                buttons.push(`
                    <button class="btn btn-secondary btn-small" onclick="app.abrirLancamentosCompletos(${empresaId})" title="Gerenciar">
                        <i class="fas fa-edit"></i>
                    </button>
                `);
                buttons.push(`
                    <button class="btn btn-success btn-small" onclick="app.avancarStatusProximo(${empresaId})" title="Avançar status">
                        <i class="fas fa-arrow-right"></i>
                    </button>
                `);
        }
        
        return buttons.join('');
    }
    
    /**
     * Atualizar gráfico de progresso
     */
    updateProgressChart() {
        const empresas = stateManager.get('empresas');
        const controles = stateManager.get('controles');
        
        const totalEmpresas = empresas.length;
        const concluidas = controles.filter(c => c.status === 'concluido').length;
        const progress = totalEmpresas > 0 ? (concluidas / totalEmpresas) * 100 : 0;
        
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        if (progressFill && progressText) {
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `${Math.round(progress)}%`;
        }
    }
    
    /**
     * Configurar auto-updates
     */
    setupAutoUpdates() {
        // Auto-refresh de dados a cada 5 minutos (se a página estiver ativa)
        setInterval(() => {
            if (!document.hidden && stateManager.get('config').autoRefresh) {
                this.loadInitialData(false);
            }
        }, 5 * 60 * 1000);
    }
    
    modalLancamentoRapido(empresaId) {
        console.log('🔍 Abrindo lançamento rápido para empresa:', empresaId);
        
        try {
            LancamentoRapidoModal.open(empresaId);
        } catch (error) {
            console.error('❌ Erro ao abrir lançamento rápido:', error);
            if (window.NotificationManager) {
                window.NotificationManager.error('Erro ao abrir lançamento rápido: ' + error.message);
            }
        }
    }
    
    editarEmpresa(empresaId) {
        this.abrirLancamentosCompletos(empresaId);
    }
    
    /**
     * Abrir modal de lançamentos completos
     */
    abrirLancamentosCompletos(empresaId) {
        try {
            LancamentoModal.open(empresaId);
        } catch (error) {
            console.error('Erro ao abrir lançamentos completos:', error);
            if (window.NotificationManager) {
                window.NotificationManager.error('Erro ao abrir lançamentos completos: ' + error.message);
            }
        }
    }

    async avancarStatusProximo(empresaId) {
        const controles = stateManager.get('controles');
        const controle = controles.find(c => c.empresa_id === empresaId);
        if (!controle) return;
        
        const proximoStatus = {
            'pendente': 'relatorio-enviado',
            'relatorio-enviado': 'pagamento-enviado',
            'pagamento-enviado': 'emitindo-nf',
            'emitindo-nf': 'concluido'
        };
        
        const novoStatus = proximoStatus[controle.status];
        if (novoStatus) {
            await this.avancarStatusDireto(empresaId, novoStatus);
        }
    }
    
    async avancarStatusDireto(empresaId, novoStatus) {
        try {
            const controles = stateManager.get('controles');
            const controle = controles.find(c => c.empresa_id === empresaId);
            if (!controle) return;
            
            await controleService.updateStatus(controle.id, novoStatus);
            
            if (window.NotificationManager) {
                window.NotificationManager.success('Status atualizado com sucesso!');
            }
            
            // Recarregar dados
            await this.loadInitialData(false);
            
        } catch (error) {
            errorHandler.captureError(error, { context: 'avancarStatusDireto', empresaId, novoStatus });
            
            if (window.NotificationManager) {
                window.NotificationManager.error('Erro ao atualizar status: ' + error.message);
            }
        }
    }
    
    async gerarTemplate(empresaId) {
        try {
            // Buscar dados da empresa e controle
            const empresa = await empresaService.getById(empresaId);
            const controle = await controleService.getByEmpresaAndPeriod(empresaId, this.currentMonth);
            
            if (!controle || (!controle.qtd_pequena && !controle.qtd_media && !controle.qtd_grande)) {
                if (window.NotificationManager) {
                    window.NotificationManager.warning('Empresa não possui lançamentos para gerar template.');
                }
                return;
            }
            
            // Processar template
            const template = templateService.processTemplate(empresa, controle, this.precos);
            
            // Criar modal para mostrar o template
            this.showTemplatePreview(template, empresa);
            
        } catch (error) {
            errorHandler.captureError(error, { context: 'gerarTemplate', empresaId });
            if (window.NotificationManager) {
                window.NotificationManager.error('Erro ao gerar template: ' + error.message);
            }
        }
    }
    
    /**
     * Mostrar preview do template
     */
    showTemplatePreview(template, empresa) {
        const previewModal = document.createElement('div');
        previewModal.className = 'modal-overlay';
        previewModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;
        
        previewModal.innerHTML = `
            <div class="modal-content modal-large" style="background: white; border-radius: 12px; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column;">
                <div class="modal-header" style="padding: 20px 24px; border-bottom: 1px solid #e9ecef; background: #f8f9fa; display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="margin: 0; color: #333;"><i class="fas fa-envelope"></i> Template de Email - ${empresa.nome}</h2>
                    <button class="modal-close" style="background: none; border: none; font-size: 24px; color: #666; cursor: pointer; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 50%;">&times;</button>
                </div>
                <div class="modal-body" style="padding: 24px; overflow-y: auto; flex: 1;">
                    <div class="template-preview">
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #333;"><strong>📧 Assunto:</strong></label>
                            <div class="preview-content" style="padding: 12px; background: #f8f9fa; border-radius: 6px; border: 1px solid #e9ecef; font-family: monospace;">${template.assunto}</div>
                        </div>
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #333;"><strong>📝 Corpo do Email:</strong></label>
                            <div class="preview-content email-body" style="padding: 12px; background: #f8f9fa; border-radius: 6px; border: 1px solid #e9ecef; white-space: pre-wrap; font-family: monospace; max-height: 400px; overflow-y: auto;">${template.corpo}</div>
                        </div>
                        <div class="template-actions" style="display: flex; gap: 10px; flex-wrap: wrap;">
                            <button class="btn-copy-all" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                                <i class="fas fa-copy"></i> Copiar Tudo
                            </button>
                            <button class="btn-copy-subject" style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                                <i class="fas fa-envelope"></i> Copiar Apenas Assunto
                            </button>
                            <button class="btn-copy-body" style="padding: 10px 20px; background: #ffc107; color: #333; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                                <i class="fas fa-file-text"></i> Copiar Apenas Corpo
                            </button>
                        </div>
                    </div>
                </div>
                <div class="modal-footer" style="padding: 16px 24px; border-top: 1px solid #e9ecef; background: #f8f9fa; display: flex; justify-content: flex-end; gap: 12px;">
                    <button class="btn-secondary close-preview" style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer;">Fechar</button>
                    <button class="btn-primary open-email" style="padding: 8px 16px; background: #FFD700; color: #333; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                        <i class="fas fa-external-link-alt"></i> Abrir Email
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(previewModal);
        
        // Configurar eventos
        const closeModal = () => {
            document.body.removeChild(previewModal);
        };
        
        // Botão fechar (X)
        previewModal.querySelector('.modal-close').addEventListener('click', closeModal);
        
        // Botão fechar
        previewModal.querySelector('.close-preview').addEventListener('click', closeModal);
        
        // Fechar clicando fora
        previewModal.addEventListener('click', (e) => {
            if (e.target === previewModal) {
                closeModal();
            }
        });
        
        // Copiar tudo
        previewModal.querySelector('.btn-copy-all').addEventListener('click', async () => {
            try {
                const texto = `Assunto: ${template.assunto}\n\n${template.corpo}`;
                await navigator.clipboard.writeText(texto);
                if (window.NotificationManager) {
                    window.NotificationManager.success('Template completo copiado!');
                }
            } catch (error) {
                if (window.NotificationManager) {
                    window.NotificationManager.error('Erro ao copiar template.');
                }
            }
        });
        
        // Copiar apenas assunto
        previewModal.querySelector('.btn-copy-subject').addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(template.assunto);
                if (window.NotificationManager) {
                    window.NotificationManager.success('Assunto copiado!');
                }
            } catch (error) {
                if (window.NotificationManager) {
                    window.NotificationManager.error('Erro ao copiar assunto.');
                }
            }
        });
        
        // Copiar apenas corpo
        previewModal.querySelector('.btn-copy-body').addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(template.corpo);
                if (window.NotificationManager) {
                    window.NotificationManager.success('Corpo do email copiado!');
                }
            } catch (error) {
                if (window.NotificationManager) {
                    window.NotificationManager.error('Erro ao copiar corpo.');
                }
            }
        });
        
        // Abrir cliente de email
        previewModal.querySelector('.open-email').addEventListener('click', () => {
            try {
                const emailUrl = `mailto:${empresa.email || ''}?subject=${encodeURIComponent(template.assunto)}&body=${encodeURIComponent(template.corpo)}`;
                window.open(emailUrl);
                
                if (window.NotificationManager) {
                    window.NotificationManager.success('Cliente de email aberto!');
                }
            } catch (error) {
                if (window.NotificationManager) {
                    window.NotificationManager.error('Erro ao abrir cliente de email.');
                }
            }
        });
        
        // Animar entrada
        previewModal.style.opacity = '0';
        requestAnimationFrame(() => {
            previewModal.style.opacity = '1';
            previewModal.style.transition = 'opacity 0.3s ease';
        });
    }
    
    async gerarPDF(empresaId) {
        try {
            // Verificar se jsPDF está disponível
            if (typeof window.jsPDF === 'undefined') {
                if (window.NotificationManager) {
                    window.NotificationManager.error('Biblioteca jsPDF não carregada. Verifique a conexão.');
                }
                return;
            }
            
            // Buscar dados da empresa e controle
            const empresa = await empresaService.getById(empresaId);
            const controle = await controleService.getByEmpresaAndPeriod(empresaId, this.currentMonth);
            
            if (!controle || (!controle.qtd_pequena && !controle.qtd_media && !controle.qtd_grande)) {
                if (window.NotificationManager) {
                    window.NotificationManager.warning('Empresa não possui lançamentos para gerar PDF.');
                }
                return;
            }
            
            // Mostrar loading
            if (window.NotificationManager) {
                window.NotificationManager.info('Gerando PDF... Aguarde.');
            }
            
            // Criar PDF
            const { jsPDF } = window.jsPDF;
            const doc = new jsPDF();
            
            // Configurações
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 20;
            let yPosition = margin;
            
            // Função para adicionar texto
            const addText = (text, x, y, options = {}) => {
                doc.setFontSize(options.fontSize || 12);
                doc.setFont('helvetica', options.style || 'normal');
                doc.text(text, x, y);
                return y + (options.lineHeight || 7);
            };
            
            // Função para adicionar linha
            const addLine = (y, padding = 5) => {
                doc.setDrawColor(200, 200, 200);
                doc.line(margin, y + padding, pageWidth - margin, y + padding);
                return y + padding + 5;
            };
            
            // Cabeçalho
            yPosition = addText('UNAÍ MARMITAS', margin, yPosition, { fontSize: 20, style: 'bold' });
            yPosition = addText('Relatório Mensal de Consumo', margin, yPosition, { fontSize: 14 });
            yPosition = addLine(yPosition);
            
            // Dados da empresa
            yPosition = addText('DADOS DA EMPRESA', margin, yPosition, { fontSize: 16, style: 'bold' });
            yPosition += 5;
            yPosition = addText(`Empresa: ${empresa.nome}`, margin, yPosition);
            yPosition = addText(`Contato: ${empresa.contato || 'Não informado'}`, margin, yPosition);
            yPosition = addText(`Email: ${empresa.email || 'Não informado'}`, margin, yPosition);
            yPosition = addText(`Telefone: ${empresa.telefone || 'Não informado'}`, margin, yPosition);
            yPosition = addLine(yPosition);
            
            // Período
            const periodoTexto = this.getCurrentMonthText();
            yPosition = addText(`PERÍODO: ${periodoTexto}`, margin, yPosition, { fontSize: 16, style: 'bold' });
            yPosition += 5;
            
            // Resumo das marmitas
            yPosition = addText('RESUMO DO CONSUMO', margin, yPosition, { fontSize: 14, style: 'bold' });
            yPosition += 5;
            
            const precos = this.precos;
            const qtdP = controle.qtd_pequena || 0;
            const qtdM = controle.qtd_media || 0;
            const qtdG = controle.qtd_grande || 0;
            
            const valorP = qtdP * precos.P;
            const valorM = qtdM * precos.M;
            const valorG = qtdG * precos.G;
            const valorMarmitas = valorP + valorM + valorG;
            
            // Tabela de marmitas
            yPosition = addText(`Pequenas (P): ${qtdP} x R$ ${precos.P.toFixed(2)} = R$ ${valorP.toFixed(2)}`, margin, yPosition);
            yPosition = addText(`Médias (M): ${qtdM} x R$ ${precos.M.toFixed(2)} = R$ ${valorM.toFixed(2)}`, margin, yPosition);
            yPosition = addText(`Grandes (G): ${qtdG} x R$ ${precos.G.toFixed(2)} = R$ ${valorG.toFixed(2)}`, margin, yPosition);
            yPosition = addLine(yPosition);
            
            // Processar extras se houver
            let valorExtras = 0;
            if (controle.lancamentos_diarios) {
                try {
                    const lancamentos = JSON.parse(controle.lancamentos_diarios);
                    const todosExtras = [];
                    
                    lancamentos.forEach(lancamento => {
                        if (lancamento.extras && Array.isArray(lancamento.extras)) {
                            lancamento.extras.forEach(extra => {
                                const existente = todosExtras.find(e => e.descricao === extra.descricao);
                                if (existente) {
                                    existente.quantidade += extra.quantidade;
                                    existente.total += extra.total;
                                } else {
                                    todosExtras.push({
                                        descricao: extra.descricao,
                                        quantidade: extra.quantidade,
                                        valor_unitario: extra.valor_unitario,
                                        total: extra.total
                                    });
                                }
                            });
                        }
                    });
                    
                    if (todosExtras.length > 0) {
                        yPosition = addText('ITENS EXTRAS', margin, yPosition, { fontSize: 14, style: 'bold' });
                        yPosition += 5;
                        
                        todosExtras.forEach(extra => {
                            yPosition = addText(`${extra.descricao}: ${extra.quantidade} x R$ ${extra.valor_unitario.toFixed(2)} = R$ ${extra.total.toFixed(2)}`, margin, yPosition);
                            valorExtras += extra.total;
                        });
                        
                        yPosition = addLine(yPosition);
                    }
                } catch (error) {
                    console.warn('Erro ao processar extras para PDF:', error);
                }
            }
            
            // Totais
            yPosition = addText('TOTAIS', margin, yPosition, { fontSize: 16, style: 'bold' });
            yPosition += 5;
            yPosition = addText(`Total Marmitas: ${qtdP + qtdM + qtdG} unidades = R$ ${valorMarmitas.toFixed(2)}`, margin, yPosition);
            if (valorExtras > 0) {
                yPosition = addText(`Total Extras: R$ ${valorExtras.toFixed(2)}`, margin, yPosition);
            }
            yPosition = addText(`VALOR TOTAL: R$ ${controle.valor_total.toFixed(2)}`, margin, yPosition, { fontSize: 14, style: 'bold' });
            
            // Status
            yPosition = addLine(yPosition);
            const statusText = this.getStatusText(controle.status);
            yPosition = addText(`Status: ${statusText}`, margin, yPosition, { fontSize: 12 });
            
            // Observações
            if (controle.observacoes && controle.observacoes.trim()) {
                yPosition = addLine(yPosition);
                yPosition = addText('OBSERVAÇÕES', margin, yPosition, { fontSize: 14, style: 'bold' });
                yPosition += 5;
                
                // Quebrar texto longo em múltiplas linhas
                const observacoes = controle.observacoes.trim();
                const maxWidth = pageWidth - (margin * 2);
                const lines = doc.splitTextToSize(observacoes, maxWidth);
                
                lines.forEach(line => {
                    yPosition = addText(line, margin, yPosition);
                });
            }
            
            // Rodapé
            const dataGeracao = new Date().toLocaleDateString('pt-BR');
            const horaGeracao = new Date().toLocaleTimeString('pt-BR');
            yPosition = doc.internal.pageSize.getHeight() - 30;
            yPosition = addText(`Relatório gerado em ${dataGeracao} às ${horaGeracao}`, margin, yPosition, { fontSize: 10 });
            yPosition = addText('Sistema Unaí Marmitas - Controle Mensal', margin, yPosition, { fontSize: 10 });
            
            // Nome do arquivo
            const nomeArquivo = `relatorio-${empresa.nome.replace(/[^a-zA-Z0-9]/g, '-')}-${controle.mes_ano}.pdf`;
            
            // Salvar PDF
            doc.save(nomeArquivo);
            
            if (window.NotificationManager) {
                window.NotificationManager.success(`PDF "${nomeArquivo}" gerado com sucesso!`);
            }
            
        } catch (error) {
            errorHandler.captureError(error, { context: 'gerarPDF', empresaId });
            if (window.NotificationManager) {
                window.NotificationManager.error('Erro ao gerar PDF: ' + error.message);
            }
        }
    }
    
    async showAnalytics(empresaId = null) {
        try {
            // Buscar dados para analytics
            const empresas = stateManager.get('empresas');
            const controles = stateManager.get('controles');
            const currentMonth = stateManager.get('currentMonth');
            
            let analyticsData;
            let title;
            
            if (empresaId) {
                // Analytics específico de uma empresa
                const empresa = empresas.find(e => e.id === empresaId);
                const controle = controles.find(c => c.empresa_id === empresaId);
                
                if (!empresa) {
                    if (window.NotificationManager) {
                        window.NotificationManager.error('Empresa não encontrada.');
                    }
                    return;
                }
                
                title = `📊 Analytics - ${empresa.nome}`;
                analyticsData = this.generateEmpresaAnalytics(empresa, controle);
            } else {
                // Analytics geral do sistema
                title = `📈 Analytics Geral - ${this.getCurrentMonthText()}`;
                analyticsData = this.generateGeneralAnalytics(empresas, controles);
            }
            
            // Criar modal de analytics
            this.showAnalyticsModal(title, analyticsData, empresaId);
            
        } catch (error) {
            errorHandler.captureError(error, { context: 'showAnalytics', empresaId });
            if (window.NotificationManager) {
                window.NotificationManager.error('Erro ao carregar analytics: ' + error.message);
            }
        }
    }
    
    /**
     * Gerar analytics de uma empresa específica
     */
    generateEmpresaAnalytics(empresa, controle) {
        const precos = this.precos;
        
        if (!controle) {
            return {
                tipo: 'empresa',
                empresa: empresa.nome,
                temDados: false,
                mensagem: 'Empresa não possui lançamentos neste período.'
            };
        }
        
        const qtdTotal = (controle.qtd_pequena || 0) + (controle.qtd_media || 0) + (controle.qtd_grande || 0);
        const valorMarmitas = ((controle.qtd_pequena || 0) * precos.P) + 
                             ((controle.qtd_media || 0) * precos.M) + 
                             ((controle.qtd_grande || 0) * precos.G);
        const valorExtras = (controle.valor_total || 0) - valorMarmitas;
        
        // Processar lançamentos diários
        let diasLancados = 0;
        let mediaMarmiatasPorDia = 0;
        let diaComMaisMarmitas = null;
        let maxMarmitasDia = 0;
        
        if (controle.lancamentos_diarios) {
            try {
                const lancamentos = JSON.parse(controle.lancamentos_diarios);
                diasLancados = lancamentos.length;
                
                if (diasLancados > 0) {
                    mediaMarmiatasPorDia = qtdTotal / diasLancados;
                    
                    lancamentos.forEach(lancamento => {
                        const qtdDia = (lancamento.qtd_pequena || 0) + (lancamento.qtd_media || 0) + (lancamento.qtd_grande || 0);
                        if (qtdDia > maxMarmitasDia) {
                            maxMarmitasDia = qtdDia;
                            diaComMaisMarmitas = {
                                data: lancamento.data,
                                quantidade: qtdDia,
                                dataFormatada: this.formatDateBR(lancamento.data)
                            };
                        }
                    });
                }
            } catch (error) {
                console.warn('Erro ao processar lançamentos para analytics:', error);
            }
        }
        
        return {
            tipo: 'empresa',
            empresa: empresa.nome,
            contato: empresa.contato || 'Não informado',
            email: empresa.email || 'Não informado',
            temDados: true,
            status: controle.status,
            statusTexto: this.getStatusText(controle.status),
            
            // Métricas principais
            qtdTotal,
            qtdPorTamanho: {
                pequena: controle.qtd_pequena || 0,
                media: controle.qtd_media || 0,
                grande: controle.qtd_grande || 0
            },
            
            // Valores
            valorTotal: controle.valor_total || 0,
            valorMarmitas,
            valorExtras,
            ticketMedio: qtdTotal > 0 ? (controle.valor_total || 0) / qtdTotal : 0,
            
            // Análise temporal
            diasLancados,
            mediaMarmiatasPorDia,
            diaComMaisMarmitas,
            
            // Percentuais
            percentualPorTamanho: {
                pequena: qtdTotal > 0 ? ((controle.qtd_pequena || 0) / qtdTotal * 100) : 0,
                media: qtdTotal > 0 ? ((controle.qtd_media || 0) / qtdTotal * 100) : 0,
                grande: qtdTotal > 0 ? ((controle.qtd_grande || 0) / qtdTotal * 100) : 0
            },
            
            percentualExtras: (controle.valor_total || 0) > 0 ? (valorExtras / (controle.valor_total || 0) * 100) : 0
        };
    }
    
    /**
     * Gerar analytics geral do sistema
     */
    generateGeneralAnalytics(empresas, controles) {
        const totalEmpresas = empresas.length;
        const empresasComLancamento = controles.length;
        const empresasSemLancamento = totalEmpresas - empresasComLancamento;
        
        // Métricas gerais
        const totalFaturado = controles.reduce((sum, c) => sum + (c.valor_total || 0), 0);
        const totalMarmitas = controles.reduce((sum, c) => 
            sum + (c.qtd_pequena || 0) + (c.qtd_media || 0) + (c.qtd_grande || 0), 0);
        
        const qtdPorTamanho = controles.reduce((acc, c) => {
            acc.pequena += c.qtd_pequena || 0;
            acc.media += c.qtd_media || 0;
            acc.grande += c.qtd_grande || 0;
            return acc;
        }, { pequena: 0, media: 0, grande: 0 });
        
        // Análise por status
        const porStatus = controles.reduce((acc, c) => {
            const status = c.status || 'pendente';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});
        
        // Top empresas por faturamento
        const topEmpresas = controles
            .map(c => {
                const empresa = empresas.find(e => e.id === c.empresa_id);
                return {
                    nome: empresa ? empresa.nome : 'Empresa não encontrada',
                    valor: c.valor_total || 0,
                    marmitas: (c.qtd_pequena || 0) + (c.qtd_media || 0) + (c.qtd_grande || 0)
                };
            })
            .sort((a, b) => b.valor - a.valor)
            .slice(0, 5);
        
        // Métricas calculadas
        const ticketMedio = empresasComLancamento > 0 ? totalFaturado / empresasComLancamento : 0;
        const marmiatasPorEmpresa = empresasComLancamento > 0 ? totalMarmitas / empresasComLancamento : 0;
        
        return {
            tipo: 'geral',
            periodo: this.getCurrentMonthText(),
            
            // Métricas principais
            totalEmpresas,
            empresasComLancamento,
            empresasSemLancamento,
            percentualComLancamento: totalEmpresas > 0 ? (empresasComLancamento / totalEmpresas * 100) : 0,
            
            // Financeiro
            totalFaturado,
            ticketMedio,
            
            // Produtos
            totalMarmitas,
            marmiatasPorEmpresa,
            qtdPorTamanho,
            
            // Percentuais por tamanho
            percentualPorTamanho: {
                pequena: totalMarmitas > 0 ? (qtdPorTamanho.pequena / totalMarmitas * 100) : 0,
                media: totalMarmitas > 0 ? (qtdPorTamanho.media / totalMarmitas * 100) : 0,
                grande: totalMarmitas > 0 ? (qtdPorTamanho.grande / totalMarmitas * 100) : 0
            },
            
            // Status
            porStatus,
            
            // Rankings
            topEmpresas
        };
    }
    
    /**
     * Mostrar modal de analytics
     */
    showAnalyticsModal(title, data, empresaId) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;
        
        const content = data.tipo === 'empresa' ? 
            this.createEmpresaAnalyticsHTML(data) : 
            this.createGeneralAnalyticsHTML(data);
        
        modal.innerHTML = `
            <div class="modal-content modal-extra-large" style="background: white; border-radius: 12px; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; width: 95%; max-width: 1200px;">
                <div class="modal-header" style="padding: 20px 24px; border-bottom: 1px solid #e9ecef; background: #f8f9fa; display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="margin: 0; color: #333;">${title}</h2>
                    <button class="modal-close" style="background: none; border: none; font-size: 24px; color: #666; cursor: pointer; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 50%;">&times;</button>
                </div>
                <div class="modal-body" style="padding: 24px; overflow-y: auto; flex: 1;">
                    ${content}
                </div>
                <div class="modal-footer" style="padding: 16px 24px; border-top: 1px solid #e9ecef; background: #f8f9fa; display: flex; justify-content: space-between; gap: 12px;">
                    <button class="btn-export-analytics" style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer;">
                        <i class="fas fa-download"></i> Exportar Dados
                    </button>
                    <button class="btn-close" style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer;">Fechar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Configurar eventos
        const closeModal = () => {
            document.body.removeChild(modal);
        };
        
        modal.querySelector('.modal-close').addEventListener('click', closeModal);
        modal.querySelector('.btn-close').addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        
        // Exportar analytics
        modal.querySelector('.btn-export-analytics').addEventListener('click', () => {
            this.exportAnalytics(data, empresaId);
        });
        
        // Animar entrada
        modal.style.opacity = '0';
        requestAnimationFrame(() => {
            modal.style.opacity = '1';
            modal.style.transition = 'opacity 0.3s ease';
        });
    }
    
    /**
     * Criar HTML para analytics de empresa
     */
    createEmpresaAnalyticsHTML(data) {
        if (!data.temDados) {
            return `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-chart-line" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                    <h3>Sem dados para análise</h3>
                    <p>${data.mensagem}</p>
                </div>
            `;
        }
        
        return `
            <div class="analytics-grid" style="display: grid; gap: 24px;">
                <!-- Informações da Empresa -->
                <div class="analytics-section" style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                    <h3 style="margin: 0 0 15px 0; color: #333;"><i class="fas fa-building"></i> Informações da Empresa</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        <div><strong>Empresa:</strong> ${data.empresa}</div>
                        <div><strong>Contato:</strong> ${data.contato}</div>
                        <div><strong>Email:</strong> ${data.email}</div>
                        <div><strong>Status:</strong> <span class="status-badge ${data.status}" style="padding: 4px 8px; border-radius: 4px; font-size: 0.8em;">${data.statusTexto}</span></div>
                    </div>
                </div>
                
                <!-- Métricas Principais -->
                <div class="metrics-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                    <div class="metric-card" style="background: linear-gradient(135deg, #e8f5e8, #f1f8e9); padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #28a745;">
                        <div style="font-size: 2em; font-weight: bold; color: #28a745; margin-bottom: 8px;">${data.qtdTotal}</div>
                        <div style="color: #666; font-weight: 500;">Total de Marmitas</div>
                    </div>
                    <div class="metric-card" style="background: linear-gradient(135deg, #e3f2fd, #f3e5f5); padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #2196f3;">
                        <div style="font-size: 2em; font-weight: bold; color: #2196f3; margin-bottom: 8px;">${this.formatCurrency(data.valorTotal)}</div>
                        <div style="color: #666; font-weight: 500;">Valor Total</div>
                    </div>
                    <div class="metric-card" style="background: linear-gradient(135deg, #fff8e1, #fffde7); padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #ff9800;">
                        <div style="font-size: 2em; font-weight: bold; color: #ff9800; margin-bottom: 8px;">${data.diasLancados}</div>
                        <div style="color: #666; font-weight: 500;">Dias com Lançamento</div>
                    </div>
                    <div class="metric-card" style="background: linear-gradient(135deg, #fce4ec, #f8bbd9); padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #e91e63;">
                        <div style="font-size: 2em; font-weight: bold; color: #e91e63; margin-bottom: 8px;">${this.formatCurrency(data.ticketMedio)}</div>
                        <div style="color: #666; font-weight: 500;">Ticket Médio</div>
                    </div>
                </div>
                
                <!-- Distribuição por Tamanho -->
                <div class="analytics-section" style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                    <h3 style="margin: 0 0 15px 0; color: #333;"><i class="fas fa-chart-pie"></i> Distribuição por Tamanho</h3>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
                        <div style="text-align: center; padding: 15px; background: white; border-radius: 6px; border: 2px solid #ffc107;">
                            <div style="font-size: 1.5em; font-weight: bold; color: #333; margin-bottom: 8px;">${data.qtdPorTamanho.pequena}</div>
                            <div style="color: #666; margin-bottom: 4px;">Pequenas (P)</div>
                            <div style="font-size: 0.9em; color: #ffc107; font-weight: bold;">${data.percentualPorTamanho.pequena.toFixed(1)}%</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: white; border-radius: 6px; border: 2px solid #17a2b8;">
                            <div style="font-size: 1.5em; font-weight: bold; color: #333; margin-bottom: 8px;">${data.qtdPorTamanho.media}</div>
                            <div style="color: #666; margin-bottom: 4px;">Médias (M)</div>
                            <div style="font-size: 0.9em; color: #17a2b8; font-weight: bold;">${data.percentualPorTamanho.media.toFixed(1)}%</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: white; border-radius: 6px; border: 2px solid #dc3545;">
                            <div style="font-size: 1.5em; font-weight: bold; color: #333; margin-bottom: 8px;">${data.qtdPorTamanho.grande}</div>
                            <div style="color: #666; margin-bottom: 4px;">Grandes (G)</div>
                            <div style="font-size: 0.9em; color: #dc3545; font-weight: bold;">${data.percentualPorTamanho.grande.toFixed(1)}%</div>
                        </div>
                    </div>
                </div>
                
                <!-- Análise Financeira -->
                <div class="analytics-section" style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                    <h3 style="margin: 0 0 15px 0; color: #333;"><i class="fas fa-dollar-sign"></i> Análise Financeira</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
                        <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #28a745;">
                            <div style="color: #666; font-size: 0.9em; margin-bottom: 4px;">Valor Marmitas</div>
                            <div style="font-size: 1.2em; font-weight: bold; color: #28a745;">${this.formatCurrency(data.valorMarmitas)}</div>
                        </div>
                        <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107;">
                            <div style="color: #666; font-size: 0.9em; margin-bottom: 4px;">Valor Extras</div>
                            <div style="font-size: 1.2em; font-weight: bold; color: #ffc107;">${this.formatCurrency(data.valorExtras)}</div>
                            <div style="font-size: 0.8em; color: #666;">${data.percentualExtras.toFixed(1)}% do total</div>
                        </div>
                        <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #17a2b8;">
                            <div style="color: #666; font-size: 0.9em; margin-bottom: 4px;">Média por Dia</div>
                            <div style="font-size: 1.2em; font-weight: bold; color: #17a2b8;">${data.mediaMarmiatasPorDia.toFixed(1)} marmitas</div>
                        </div>
                    </div>
                </div>
                
                ${data.diaComMaisMarmitas ? `
                <!-- Destaque -->
                <div class="analytics-section" style="background: linear-gradient(135deg, #FFD700, #FFA500); padding: 20px; border-radius: 8px; color: #333;">
                    <h3 style="margin: 0 0 10px 0;"><i class="fas fa-star"></i> Dia com Maior Consumo</h3>
                    <div style="font-size: 1.1em;">
                        <strong>${data.diaComMaisMarmitas.dataFormatada}</strong> - 
                        ${data.diaComMaisMarmitas.quantidade} marmitas
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Criar HTML para analytics geral
     */
    createGeneralAnalyticsHTML(data) {
        return `
            <div class="analytics-grid" style="display: grid; gap: 24px;">
                <!-- Resumo Geral -->
                <div class="analytics-section" style="background: linear-gradient(135deg, #FFD700, #FFA500); padding: 20px; border-radius: 8px; color: #333;">
                    <h3 style="margin: 0 0 15px 0;"><i class="fas fa-chart-line"></i> Resumo do Período: ${data.periodo}</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; text-align: center;">
                        <div>
                            <div style="font-size: 1.8em; font-weight: bold; margin-bottom: 4px;">${data.totalEmpresas}</div>
                            <div style="font-size: 0.9em; opacity: 0.8;">Total de Empresas</div>
                        </div>
                        <div>
                            <div style="font-size: 1.8em; font-weight: bold; margin-bottom: 4px;">${data.empresasComLancamento}</div>
                            <div style="font-size: 0.9em; opacity: 0.8;">Com Lançamentos</div>
                        </div>
                        <div>
                            <div style="font-size: 1.8em; font-weight: bold; margin-bottom: 4px;">${data.percentualComLancamento.toFixed(1)}%</div>
                            <div style="font-size: 0.9em; opacity: 0.8;">Taxa de Atividade</div>
                        </div>
                    </div>
                </div>
                
                <!-- Métricas Financeiras -->
                <div class="analytics-section" style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                    <h3 style="margin: 0 0 15px 0; color: #333;"><i class="fas fa-dollar-sign"></i> Métricas Financeiras</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                        <div class="metric-card" style="background: linear-gradient(135deg, #e8f5e8, #f1f8e9); padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #28a745;">
                            <div style="font-size: 1.5em; font-weight: bold; color: #28a745; margin-bottom: 8px;">${this.formatCurrency(data.totalFaturado)}</div>
                            <div style="color: #666; font-weight: 500;">Faturamento Total</div>
                        </div>
                        <div class="metric-card" style="background: linear-gradient(135deg, #e3f2fd, #f3e5f5); padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #2196f3;">
                            <div style="font-size: 1.5em; font-weight: bold; color: #2196f3; margin-bottom: 8px;">${this.formatCurrency(data.ticketMedio)}</div>
                            <div style="color: #666; font-weight: 500;">Ticket Médio</div>
                        </div>
                    </div>
                </div>
                
                <!-- Métricas de Produto -->
                <div class="analytics-section" style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                    <h3 style="margin: 0 0 15px 0; color: #333;"><i class="fas fa-utensils"></i> Análise de Produtos</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px;">
                        <div class="metric-card" style="background: white; padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #ffc107;">
                            <div style="font-size: 1.5em; font-weight: bold; color: #333; margin-bottom: 8px;">${data.totalMarmitas}</div>
                            <div style="color: #666; font-weight: 500;">Total de Marmitas</div>
                        </div>
                        <div class="metric-card" style="background: white; padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #17a2b8;">
                            <div style="font-size: 1.5em; font-weight: bold; color: #333; margin-bottom: 8px;">${data.marmiatasPorEmpresa.toFixed(1)}</div>
                            <div style="color: #666; font-weight: 500;">Média por Empresa</div>
                        </div>
                    </div>
                    
                    <!-- Distribuição por Tamanho -->
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
                        <div style="text-align: center; padding: 15px; background: white; border-radius: 6px; border: 2px solid #ffc107;">
                            <div style="font-size: 1.3em; font-weight: bold; color: #333; margin-bottom: 8px;">${data.qtdPorTamanho.pequena}</div>
                            <div style="color: #666; margin-bottom: 4px;">Pequenas</div>
                            <div style="font-size: 0.9em; color: #ffc107; font-weight: bold;">${data.percentualPorTamanho.pequena.toFixed(1)}%</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: white; border-radius: 6px; border: 2px solid #17a2b8;">
                            <div style="font-size: 1.3em; font-weight: bold; color: #333; margin-bottom: 8px;">${data.qtdPorTamanho.media}</div>
                            <div style="color: #666; margin-bottom: 4px;">Médias</div>
                            <div style="font-size: 0.9em; color: #17a2b8; font-weight: bold;">${data.percentualPorTamanho.media.toFixed(1)}%</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: white; border-radius: 6px; border: 2px solid #dc3545;">
                            <div style="font-size: 1.3em; font-weight: bold; color: #333; margin-bottom: 8px;">${data.qtdPorTamanho.grande}</div>
                            <div style="color: #666; margin-bottom: 4px;">Grandes</div>
                            <div style="font-size: 0.9em; color: #dc3545; font-weight: bold;">${data.percentualPorTamanho.grande.toFixed(1)}%</div>
                        </div>
                    </div>
                </div>
                
                <!-- Status das Empresas -->
                <div class="analytics-section" style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                    <h3 style="margin: 0 0 15px 0; color: #333;"><i class="fas fa-tasks"></i> Status das Empresas</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                        ${Object.entries(data.porStatus).map(([status, count]) => `
                            <div style="text-align: center; padding: 12px; background: white; border-radius: 6px; border: 2px solid #e9ecef;">
                                <div style="font-size: 1.2em; font-weight: bold; color: #333; margin-bottom: 4px;">${count}</div>
                                <div style="font-size: 0.8em; color: #666;">${this.getStatusText(status)}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Top 5 Empresas -->
                <div class="analytics-section" style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                    <h3 style="margin: 0 0 15px 0; color: #333;"><i class="fas fa-trophy"></i> Top 5 Empresas por Faturamento</h3>
                    <div style="display: grid; gap: 10px;">
                        ${data.topEmpresas.map((empresa, index) => `
                            <div style="display: grid; grid-template-columns: 30px 2fr 1fr 1fr; gap: 15px; align-items: center; padding: 12px; background: white; border-radius: 6px; border-left: 4px solid ${index === 0 ? '#FFD700' : '#e9ecef'};">
                                <div style="text-align: center; font-weight: bold; color: ${index === 0 ? '#FFD700' : '#666'};">${index + 1}º</div>
                                <div style="font-weight: 500; color: #333;">${empresa.nome}</div>
                                <div style="text-align: center; color: #28a745; font-weight: bold;">${this.formatCurrency(empresa.valor)}</div>
                                <div style="text-align: center; color: #666;">${empresa.marmitas} marmitas</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Exportar dados de analytics
     */
    async exportAnalytics(data, empresaId) {
        try {
            const fileName = empresaId ? 
                `analytics-empresa-${data.empresa.replace(/[^a-zA-Z0-9]/g, '-')}-${this.currentMonth}.json` :
                `analytics-geral-${this.currentMonth}.json`;
            
            const exportData = {
                ...data,
                exportedAt: new Date().toISOString(),
                periodo: this.currentMonth,
                sistema: 'Unaí Marmitas'
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            
            URL.revokeObjectURL(url);
            
            if (window.NotificationManager) {
                window.NotificationManager.success(`Analytics exportado como "${fileName}"`);
            }
            
        } catch (error) {
            errorHandler.captureError(error, { context: 'exportAnalytics' });
            if (window.NotificationManager) {
                window.NotificationManager.error('Erro ao exportar analytics: ' + error.message);
            }
        }
    }

    showConfiguracoes() {
        // Importar dinamicamente o modal de configurações
        import('./components/modals/config-modal.js').then(module => {
            const { ConfigModal } = module;
            ConfigModal.open();
        }).catch(error => {
            console.error('Erro ao carregar modal de configurações:', error);
            if (window.NotificationManager) {
                window.NotificationManager.error('Erro ao abrir configurações');
            }
        });
    }
    
    showPaginaLancamentos() {
        if (window.NotificationManager) {
            window.NotificationManager.info('Página de Lançamentos em desenvolvimento');
        }
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
    
    calculateDaysCount(controle) {
        if (!controle || !controle.lancamentos_diarios) return 0;
        try {
            const lancamentos = JSON.parse(controle.lancamentos_diarios);
            return lancamentos.length;
        } catch {
            return 0;
        }
    }
    
    formatCurrency(value) {
        if (value === null || value === undefined || isNaN(value)) {
            return 'R$ 0,00';
        }
        
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }
    
    formatPeriod(period) {
        const [year, month] = period.split('-');
        const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                       'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        return `${months[parseInt(month) - 1]}/${year}`;
    }
    
    getCurrentMonthText() {
        return this.formatPeriod(stateManager.get('currentMonth'));
    }
    
    /**
     * Métodos de controle da aplicação
     */
    async reloadData() {
        stateManager.clearCache();
        await this.loadInitialData();
        
        if (window.NotificationManager) {
            window.NotificationManager.info('Dados recarregados!');
        }
    }
    
    closeTopModal() {
        const modals = document.querySelectorAll('.modal-overlay');
        if (modals.length > 0) {
            const lastModal = modals[modals.length - 1];
            const closeBtn = lastModal.querySelector('.modal-close');
            if (closeBtn) closeBtn.click();
        }
    }
    
    /**
     * Splash screen
     */
    showSplashScreen() {
        const splash = document.createElement('div');
        splash.id = 'splashScreen';
        splash.innerHTML = `
            <div class="splash-content">
                <div class="splash-logo">
                    <i class="fas fa-utensils"></i>
                </div>
                <h1>Unaí Marmitas</h1>
                <p>Carregando sistema v3.0...</p>
                <div class="splash-loader">
                    <div class="loader-bar"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(splash);
    }
    
    hideSplashScreen() {
        const splash = document.getElementById('splashScreen');
        if (splash) {
            splash.style.opacity = '0';
            setTimeout(() => {
                if (splash.parentNode) {
                    splash.parentNode.removeChild(splash);
                }
            }, 500);
        }
    }
    
    /**
     * Tratamento de erro de inicialização
     */
    handleInitError(error) {
        errorHandler.captureError(error, { context: 'UnaiMarmitasApp.init' });
        
        const errorHTML = `
            <div class="init-error">
                <div class="error-content">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h2>Erro ao Inicializar</h2>
                    <p>Ocorreu um erro ao carregar o sistema.</p>
                    <button class="btn btn-primary" onclick="location.reload()">
                        <i class="fas fa-redo"></i> Tentar Novamente
                    </button>
                </div>
            </div>
        `;
        
        document.body.innerHTML = errorHTML;
    }
}

// Criar instância da aplicação
const app = new UnaiMarmitasApp();

// Expor globalmente para compatibilidade
window.app = app;

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// Expor para debug em desenvolvimento
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    window.UnaiMarmitasApp = UnaiMarmitasApp;
    window.stateManager = stateManager;
    window.eventManager = eventManager;
    window.performanceMonitor = performanceMonitor;
    window.errorHandler = errorHandler;
}