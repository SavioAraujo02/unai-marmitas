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
import { LancamentoModal } from './components/modals/lancamento-modal.js';
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
                    <button class="btn btn-secondary btn-small" onclick="app.editarEmpresa(${empresaId})" title="Ver todos os lançamentos">
                        <i class="fas fa-list"></i>
                    </button>
                `);
                break;
                
            case 'erro-nf':
                buttons.push(`
                    <button class="btn btn-primary btn-small" onclick="app.editarEmpresa(${empresaId})" title="Editar lançamentos">
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
                    <button class="btn btn-secondary btn-small" onclick="app.editarEmpresa(${empresaId})" title="Ver dados">
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
                    <button class="btn btn-secondary btn-small" onclick="app.editarEmpresa(${empresaId})" title="Gerenciar">
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
    
    /**
     * Métodos de ação (compatibilidade com código existente)
     */
    modalLancamentoRapido(empresaId) {
        LancamentoRapidoModal.open(empresaId);
    }
    
    editarEmpresa(empresaId) {
        LancamentoModal.open(empresaId);
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
    
    gerarTemplate(empresaId) {
        // TODO: Implementar com templateService
        if (window.NotificationManager) {
            window.NotificationManager.info('Funcionalidade de template em desenvolvimento');
        }
    }
    
    gerarPDF(empresaId) {
        // TODO: Implementar geração de PDF
        if (window.NotificationManager) {
            window.NotificationManager.info('Funcionalidade de PDF em desenvolvimento');
        }
    }
    
    showAnalytics(empresaId = null) {
        if (window.NotificationManager) {
            window.NotificationManager.info('Funcionalidade de Analytics em desenvolvimento');
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