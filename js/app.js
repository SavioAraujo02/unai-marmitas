// Estado da aplicação
let currentMonth = '2025-08';
let currentFilter = 'todos';
let empresas = [];
let controles = [];
let precos = {};

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', async function() {
    await initializePeriods();
    await loadData();
    setupEventListeners();
    renderDashboard();
});

// Carregar dados
async function loadData() {
    try {
        empresas = await Database.getEmpresas();
        controles = await Database.getControleByMes(currentMonth);
        precos = await Database.getPrecos();
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}


// Renderizar dashboard completof
function renderDashboard() {
    renderResumo();
    renderEmpresas();
}

// Renderizar resumo do mês com cores temáticas
function renderResumo() {
    const totalFaturado = controles.reduce((sum, c) => sum + c.valor_total, 0);
    const totalEmpresas = empresas.length;
    const concluidas = controles.filter(c => c.status === 'concluido').length;
    const pendentes = controles.filter(c => c.status === 'pendente').length;
    const comErro = controles.filter(c => c.status === 'erro-nf').length;

    const resumoStats = document.querySelector('.resumo-stats');
    resumoStats.innerHTML = `
        <div class="stat-item stat-faturado">
            <span class="stat-label">💰 Total Faturado</span>
            <span class="stat-value">R$ ${totalFaturado.toFixed(2).replace('.', ',')}</span>
        </div>
        <div class="stat-item stat-empresas">
            <span class="stat-label">🏢 Empresas</span>
            <span class="stat-value">${totalEmpresas}</span>
        </div>
        <div class="stat-item stat-concluidas">
            <span class="stat-label">✅ Concluídas</span>
            <span class="stat-value">${concluidas}</span>
        </div>
        <div class="stat-item stat-pendentes">
            <span class="stat-label">⏳ Pendentes</span>
            <span class="stat-value">${pendentes}</span>
        </div>
        <div class="stat-item stat-erro">
            <span class="stat-label">❌ Com Erro</span>
            <span class="stat-value">${comErro}</span>
        </div>
    `;
}

// Renderizar empresas
function renderEmpresas() {
    const grid = document.getElementById('empresasGrid');
    let empresasFiltradas = empresas;

    // Aplicar filtro
    if (currentFilter !== 'todos') {
        empresasFiltradas = empresas.filter(empresa => {
            const controle = controles.find(c => c.empresa_id === empresa.id);
            if (!controle) return currentFilter === 'pendentes';
            
            switch (currentFilter) {
                case 'pendentes':
                    return controle.status === 'pendente';
                case 'erro':
                    return controle.status === 'erro-nf';
                case 'concluidos':
                    return controle.status === 'concluido';
                default:
                    return true;
            }
        });
    }

    grid.innerHTML = empresasFiltradas.map(empresa => createEmpresaCard(empresa)).join('');
}

// Criar card da empresa
function createEmpresaCard(empresa) {
    const controle = controles.find(c => c.empresa_id === empresa.id);
    const status = controle ? controle.status : 'pendente';
    const statusText = getStatusText(status);
    const statusIcon = getStatusIcon(status);
    
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
            
            <div class="empresa-info">
                <p><strong>Contato:</strong> ${empresa.contato}</p>
                <p><strong>Marmitas:</strong> ${qtdText}</p>
                <p><strong>Total:</strong> R$ ${valorTotal.toFixed(2).replace('.', ',')}</p>
            </div>
            
            <div class="empresa-actions">
                ${createActionButtons(empresa.id, status, controle)}
            </div>
        </div>
    `;
}

// Criar botões de ação
function createActionButtons(empresaId, status, controle) {
    let buttons = [];

    // Botão Template (sempre disponível se tem dados)
    if (controle && (controle.qtd_pequena + controle.qtd_media + controle.qtd_grande) > 0) {
        buttons.push(`<button class="btn btn-secondary btn-small" onclick="gerarTemplate(${empresaId})">
            <i class="fas fa-envelope"></i> Template
        </button>`);
        
        // ADICIONAR ESTE BOTÃO PDF:
        buttons.push(`<button class="btn btn-success btn-small" onclick="gerarPDF(${empresaId})">
            <i class="fas fa-file-pdf"></i> PDF
        </button>`);
    }

    // Botões baseados no status
    switch (status) {
        case 'pendente':
            buttons.push(`<button class="btn btn-primary btn-small" onclick="modalLancamentoRapido(${empresaId})">
                <i class="fas fa-plus"></i> Lançar Dia
            </button>`);
            buttons.push(`<button class="btn btn-secondary btn-small" onclick="editarEmpresa(${empresaId})">
                <i class="fas fa-list"></i> Ver Todos
            </button>`);
            break;
        case 'erro-nf':
            buttons.push(`<button class="btn btn-primary btn-small" onclick="editarEmpresa(${empresaId})">
                <i class="fas fa-edit"></i> Editar
            </button>`);
            buttons.push(`<button class="btn btn-success btn-small" onclick="avancarStatusDireto(${empresaId}, 'emitindo-nf')">
                <i class="fas fa-redo"></i> Tentar NF
            </button>`);
            break;
        case 'concluido':
            buttons.push(`<button class="btn btn-secondary btn-small" onclick="editarEmpresa(${empresaId})">
                <i class="fas fa-eye"></i> Ver Dados
            </button>`);
            break;
        default:
            buttons.push(`<button class="btn btn-primary btn-small" onclick="modalLancamentoRapido(${empresaId})">
                <i class="fas fa-plus"></i> Lançar Dia
            </button>`);
            buttons.push(`<button class="btn btn-secondary btn-small" onclick="editarEmpresa(${empresaId})">
                <i class="fas fa-edit"></i> Gerenciar
            </button>`);
            buttons.push(`<button class="btn btn-success btn-small" onclick="avancarStatusProximo(${empresaId})">
                <i class="fas fa-arrow-right"></i> Avançar
            </button>`);
    }

    return buttons.join('');
}

// Funções auxiliares
function getStatusText(status) {
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

function getStatusIcon(status) {
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


function avancarStatus(empresaId) {
    alert(`Avançar status da empresa ${empresaId} - Em desenvolvimento!`);
}

function verDetalhes(empresaId) {
    alert(`Ver detalhes da empresa ${empresaId} - Em desenvolvimento!`);
}

function gerarTemplate(empresaId) {
    const empresa = empresas.find(e => e.id === empresaId);
    const controle = controles.find(c => c.empresa_id === empresaId);
    
    if (!empresa || !controle) {
        showNotification('Dados não encontrados!', 'error');
        return;
    }

    const templateProcessado = processarTemplate(templateEmail.assunto, templateEmail.corpo, empresa, controle);
    
    const templateFinal = `Para: ${empresa.email || 'Sem email cadastrado'}
Assunto: ${templateProcessado.assunto}

${templateProcessado.corpo}`;

    // Copiar para clipboard
    navigator.clipboard.writeText(templateFinal).then(() => {
        showNotification('Template copiado para a área de transferência!', 'success');
    }).catch(() => {
        // Fallback: mostrar em um prompt
        prompt('Template gerado (Ctrl+C para copiar):', templateFinal);
    });
}


// Gerar PDF profissional com logo
function gerarPDF(empresaId) {
    const empresa = empresas.find(e => e.id === empresaId);
    const controle = controles.find(c => c.empresa_id === empresaId);
    
    if (!empresa || !controle) {
        showNotification('Dados não encontrados!', 'error');
        return;
    }

    // Verificar se tem dados para gerar PDF
    const temDados = controle.qtd_pequena + controle.qtd_media + controle.qtd_grande > 0;
    if (!temDados) {
        showNotification('Empresa não possui lançamentos para gerar PDF!', 'error');
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Configurações do tema profissional
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 20;
        let currentY = margin;
        
        // Cores do tema profissional
        const primaryColor = [255, 215, 0]; // Amarelo
        const secondaryColor = [26, 26, 26]; // Preto
        const lightGray = [248, 249, 250]; // Cinza claro
        const textColor = [51, 51, 51]; // Cinza escuro
        
        // LOGO BASE64 (converta sua logo para base64)
        const logoBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='; // PLACEHOLDER - coloque sua logo aqui
        
        // HEADER PROFISSIONAL
        // Fundo do header
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, pageWidth, 80, 'F');
        
        // Borda elegante do header
        doc.setDrawColor(...secondaryColor);
        doc.setLineWidth(2);
        doc.line(0, 80, pageWidth, 80);
        
        // Logo (se disponível)
        try {
            if (logoBase64 && logoBase64 !== 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==') {
                doc.addImage(logoBase64, 'PNG', 25, 15, 50, 50);
            } else {
                // Logo estilizado como fallback
                drawCustomLogo(doc, 25, 15, 50, 50);
            }
        } catch (error) {
            drawCustomLogo(doc, 25, 15, 50, 50);
        }
        
        // Informações da empresa (lado direito do header)
        doc.setTextColor(...secondaryColor);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('UNAÍ MARMITAS', 85, 30);
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Restaurante • Marmitas • Delivery', 85, 40);
        doc.text('CNPJ: 00.000.000/0001-00', 85, 50);
        doc.text('Telefone: (38) 99999-9999', 85, 58);
        doc.text('Email: contato@unaimarmitas.com', 85, 66);
        
        // Número do relatório e data
        const numeroRelatorio = `REL-${currentMonth.replace('-', '')}-${String(empresa.id).padStart(3, '0')}`;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`Relatório Nº ${numeroRelatorio}`, pageWidth - margin, 25, { align: 'right' });
        doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - margin, 35, { align: 'right' });
        
        currentY = 100;
        
        // TÍTULO DO RELATÓRIO
        doc.setFillColor(...lightGray);
        doc.rect(margin, currentY, pageWidth - 2 * margin, 30, 'F');
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(1);
        doc.rect(margin, currentY, pageWidth - 2 * margin, 30);
        
        doc.setTextColor(...textColor);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('RELATÓRIO MENSAL DE CONSUMO', pageWidth / 2, currentY + 20, { align: 'center' });
        
        currentY += 50;
        
        // DADOS DA EMPRESA CLIENTE
        addSectionHeader(doc, 'DADOS DO CLIENTE', currentY, pageWidth, margin, primaryColor, secondaryColor);
        currentY += 15;
        
        const clienteBox = {
            x: margin,
            y: currentY,
            width: pageWidth - 2 * margin,
            height: 60
        };
        
        // Box do cliente
        doc.setFillColor(255, 255, 255);
        doc.rect(clienteBox.x, clienteBox.y, clienteBox.width, clienteBox.height, 'F');
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(2);
        doc.rect(clienteBox.x, clienteBox.y, clienteBox.width, clienteBox.height);
        
        // Informações do cliente
        doc.setTextColor(...textColor);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Empresa: ${empresa.nome}`, clienteBox.x + 15, clienteBox.y + 20);
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Contato: ${empresa.contato || 'Não informado'}`, clienteBox.x + 15, clienteBox.y + 35);
        doc.text(`Email: ${empresa.email || 'Não informado'}`, clienteBox.x + 15, clienteBox.y + 50);
        
        // Período de referência (lado direito)
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Período de Referência:', clienteBox.x + clienteBox.width - 15, clienteBox.y + 20, { align: 'right' });
        doc.setFontSize(14);
        doc.setTextColor(...primaryColor);
        doc.text(getCurrentMonthText(), clienteBox.x + clienteBox.width - 15, clienteBox.y + 35, { align: 'right' });
        
        currentY += 80;
        
        // DETALHAMENTO DE CONSUMO
        addSectionHeader(doc, 'DETALHAMENTO DE CONSUMO', currentY, pageWidth, margin, primaryColor, secondaryColor);
        currentY += 25;
        
        // Tabela de marmitas profissional
        const tableData = [
            ['Tamanho', 'Quantidade', 'Valor Unitário', 'Subtotal'],
            [
                'Pequena (P)', 
                controle.qtd_pequena.toString(), 
                `R$ ${precos.P.toFixed(2).replace('.', ',')}`, 
                `R$ ${(controle.qtd_pequena * precos.P).toFixed(2).replace('.', ',')}`
            ],
            [
                'Média (M)', 
                controle.qtd_media.toString(), 
                `R$ ${precos.M.toFixed(2).replace('.', ',')}`, 
                `R$ ${(controle.qtd_media * precos.M).toFixed(2).replace('.', ',')}`
            ],
            [
                'Grande (G)', 
                controle.qtd_grande.toString(), 
                `R$ ${precos.G.toFixed(2).replace('.', ',')}`, 
                `R$ ${(controle.qtd_grande * precos.G).toFixed(2).replace('.', ',')}`
            ]
        ];
        
        drawProfessionalTable(doc, tableData, margin, currentY, pageWidth - 2 * margin, primaryColor, secondaryColor);
        currentY += (tableData.length * 15) + 25;
        
        // ITENS EXTRAS (se houver)
        const valorMarmitas = (controle.qtd_pequena * precos.P) + (controle.qtd_media * precos.M) + (controle.qtd_grande * precos.G);
        const valorExtras = controle.valor_total - valorMarmitas;
        
        if (valorExtras > 0 && controle.lancamentos_diarios) {
            const todosExtras = processarExtrasParaPDF(controle.lancamentos_diarios);
            
            if (todosExtras.length > 0) {
                addSectionHeader(doc, 'ITENS EXTRAS', currentY, pageWidth, margin, primaryColor, secondaryColor);
                currentY += 25;
                
                const extrasTableData = [['Descrição', 'Quantidade', 'Valor Unitário', 'Subtotal']];
                
                todosExtras.forEach(extra => {
                    extrasTableData.push([
                        extra.descricao,
                        extra.quantidade.toString(),
                        `R$ ${extra.valor_unitario.toFixed(2).replace('.', ',')}`,
                        `R$ ${extra.total.toFixed(2).replace('.', ',')}`
                    ]);
                });
                
                drawProfessionalTable(doc, extrasTableData, margin, currentY, pageWidth - 2 * margin, primaryColor, secondaryColor);
                currentY += (extrasTableData.length * 15) + 25;
            }
        }
        
        // RESUMO FINANCEIRO PROFISSIONAL
        addSectionHeader(doc, 'RESUMO FINANCEIRO', currentY, pageWidth, margin, primaryColor, secondaryColor);
        currentY += 25;
        
        const resumoBox = {
            x: margin,
            y: currentY,
            width: pageWidth - 2 * margin,
            height: 80
        };
        
        // Background do resumo
        doc.setFillColor(...lightGray);
        doc.rect(resumoBox.x, resumoBox.y, resumoBox.width, resumoBox.height, 'F');
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(2);
        doc.rect(resumoBox.x, resumoBox.y, resumoBox.width, resumoBox.height);
        
        // Linhas do resumo
        const qtdTotal = controle.qtd_pequena + controle.qtd_media + controle.qtd_grande;
        doc.setTextColor(...textColor);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        
        doc.text(`Total de Marmitas: ${qtdTotal} unidades`, resumoBox.x + 20, resumoBox.y + 20);
        doc.text(`Valor das Marmitas: R$ ${valorMarmitas.toFixed(2).replace('.', ',')}`, resumoBox.x + 20, resumoBox.y + 35);
        
        if (valorExtras > 0) {
            doc.text(`Valor dos Extras: R$ ${valorExtras.toFixed(2).replace('.', ',')}`, resumoBox.x + 20, resumoBox.y + 50);
        }
        
        // Total geral destacado
        doc.setFillColor(...primaryColor);
        doc.rect(resumoBox.x + 20, resumoBox.y + 60, resumoBox.width - 40, 15, 'F');
        doc.setTextColor(...secondaryColor);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`VALOR TOTAL: R$ ${controle.valor_total.toFixed(2).replace('.', ',')}`, resumoBox.x + 30, resumoBox.y + 72);
        
        currentY += 100;
        
        // OBSERVAÇÕES (se houver)
        if (controle.observacoes && controle.observacoes.trim()) {
            if (currentY > pageHeight - 120) {
                doc.addPage();
                currentY = margin;
            }
            
            addSectionHeader(doc, 'OBSERVAÇÕES', currentY, pageWidth, margin, primaryColor, secondaryColor);
            currentY += 20;
            
            doc.setTextColor(...textColor);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            const observacoes = doc.splitTextToSize(controle.observacoes, pageWidth - 2 * margin);
            doc.text(observacoes, margin, currentY);
            currentY += observacoes.length * 6 + 20;
        }
        
        // ASSINATURAS PROFISSIONAIS
        if (currentY > pageHeight - 100) {
            doc.addPage();
            currentY = margin;
        }
        
        addSectionHeader(doc, 'ASSINATURAS', currentY, pageWidth, margin, primaryColor, secondaryColor);
        currentY += 40;
        
        const assinaturaWidth = (pageWidth - 3 * margin) / 2;
        
        // Campos de assinatura estilizados
        drawSignatureField(doc, margin, currentY, assinaturaWidth, 'Unaí Marmitas', 'Responsável Comercial', primaryColor, secondaryColor);
        drawSignatureField(doc, margin + assinaturaWidth + margin, currentY, assinaturaWidth, empresa.nome, 'Responsável da Empresa', primaryColor, secondaryColor);
        
        // FOOTER PROFISSIONAL
        addProfessionalFooter(doc, pageWidth, pageHeight, primaryColor, secondaryColor);
        
        // Salvar PDF
        const nomeArquivo = `Relatorio_${empresa.nome.replace(/[^a-zA-Z0-9]/g, '_')}_${currentMonth}.pdf`;
        doc.save(nomeArquivo);
        
        showNotification('PDF profissional gerado com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        showNotification('Erro ao gerar PDF. Tente novamente.', 'error');
    }
}

// Desenhar logo customizado
function drawCustomLogo(doc, x, y, width, height) {
    // Background do logo
    doc.setFillColor(26, 26, 26);
    doc.roundedRect(x, y, width, height, 8, 8, 'F');
    
    // Borda dourada
    doc.setDrawColor(255, 215, 0);
    doc.setLineWidth(3);
    doc.roundedRect(x, y, width, height, 8, 8);
    
    // Ícone central estilizado
    doc.setTextColor(255, 215, 0);
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.text('🍽️', x + width/2 - 8, y + height/2 + 5);
    
    // Texto do logo
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('UNAÍ', x + width/2, y + height - 8, { align: 'center' });
    doc.setFontSize(8);
    doc.text('MARMITAS', x + width/2, y + height - 2, { align: 'center' });
}

// Adicionar cabeçalho de seção profissional
function addSectionHeader(doc, title, y, pageWidth, margin, primaryColor, secondaryColor) {
    // Linha decorativa
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(3);
    doc.line(margin, y, pageWidth - margin, y);
    
    // Título
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, y + 10);
    
    // Linha inferior
    doc.setLineWidth(1);
    doc.line(margin, y + 12, pageWidth - margin, y + 12);
}

// Desenhar tabela profissional
function drawProfessionalTable(doc, data, x, y, width, primaryColor, secondaryColor) {
    const rowHeight = 15;
    const colWidth = width / data[0].length;
    
    data.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            const cellX = x + (colIndex * colWidth);
            const cellY = y + (rowIndex * rowHeight);
            
            // Header da tabela
            if (rowIndex === 0) {
                doc.setFillColor(...primaryColor);
                doc.rect(cellX, cellY, colWidth, rowHeight, 'F');
                doc.setTextColor(...secondaryColor);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
            } else {
                // Linhas alternadas
                if (rowIndex % 2 === 0) {
                    doc.setFillColor(248, 249, 250);
                    doc.rect(cellX, cellY, colWidth, rowHeight, 'F');
                } else {
                    doc.setFillColor(255, 255, 255);
                    doc.rect(cellX, cellY, colWidth, rowHeight, 'F');
                }
                doc.setTextColor(51, 51, 51);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
            }
            
            // Bordas elegantes
            doc.setDrawColor(...primaryColor);
            doc.setLineWidth(0.5);
            doc.rect(cellX, cellY, colWidth, rowHeight);
            
            // Texto centralizado
            doc.text(cell, cellX + colWidth/2, cellY + 10, { align: 'center' });
        });
    });
}

// Processar extras para PDF
function processarExtrasParaPDF(lancamentosDiarios) {
    try {
        const lancamentos = JSON.parse(lancamentosDiarios);
        const todosExtras = [];
        
        lancamentos.forEach(lancamento => {
            if (lancamento.extras && lancamento.extras.length > 0) {
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
        
        return todosExtras;
    } catch (error) {
        console.error('Erro ao processar extras:', error);
        return [];
    }
}

// Desenhar campo de assinatura profissional
function drawSignatureField(doc, x, y, width, nome, cargo, primaryColor, secondaryColor) {
    // Linha da assinatura
    doc.setDrawColor(...secondaryColor);
    doc.setLineWidth(1);
    doc.line(x, y, x + width, y);
    
    // Nome
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(nome, x, y + 12);
    
    // Cargo
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(cargo, x, y + 22);
    
    // Data
    doc.setFontSize(9);
    doc.text(`Data: ___/___/______`, x, y + 32);
}

// Adicionar rodapé profissional
function addProfessionalFooter(doc, pageWidth, pageHeight, primaryColor, secondaryColor) {
    const footerY = pageHeight - 20;
    
    // Linha superior do rodapé
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(2);
    doc.line(0, footerY - 5, pageWidth, footerY - 5);
    
    // Background do rodapé
    doc.setFillColor(...primaryColor);
    doc.rect(0, footerY - 5, pageWidth, 20, 'F');
    
    // Texto do rodapé
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('UNAÍ MARMITAS', 20, footerY + 5);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Sabor que alimenta, qualidade que conquista', 20, footerY + 12);
    
    // Informações de contato no rodapé
    doc.text('www.unaimarmitas.com • contato@unaimarmitas.com • (38) 99999-9999', 
        pageWidth - 20, footerY + 8, { align: 'right' });
    
    // Número da página
    doc.setFontSize(8);
    doc.text('Página 1', pageWidth / 2, footerY + 8, { align: 'center' });
}

// Função auxiliar para desenhar tabelas estilizadas
function drawStyledTable(doc, data, x, y, width) {
const rowHeight = 15;
const colWidth = width / data[0].length;

data.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
        const cellX = x + (colIndex * colWidth);
        const cellY = y + (rowIndex * rowHeight);
        
        // Header da tabela
        if (rowIndex === 0) {
            doc.setFillColor(255, 215, 0); // Amarelo
            doc.rect(cellX, cellY, colWidth, rowHeight, 'F');
            doc.setTextColor(26, 26, 26); // Preto
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
        } else {
            // Linhas alternadas
            if (rowIndex % 2 === 0) {
                doc.setFillColor(255, 248, 220); // Amarelo muito claro
                doc.rect(cellX, cellY, colWidth, rowHeight, 'F');
            } else {
                doc.setFillColor(255, 255, 255); // Branco
                doc.rect(cellX, cellY, colWidth, rowHeight, 'F');
            }
            doc.setTextColor(51, 51, 51); // Cinza escuro
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
        }
        
        // Bordas
        doc.setDrawColor(255, 215, 0); // Borda amarela
        doc.setLineWidth(1);
        doc.rect(cellX, cellY, colWidth, rowHeight);
        
        // Texto centralizado
        doc.text(cell, cellX + colWidth/2, cellY + 10, { align: 'center' });
    });
});
}

// Função para adicionar elementos decorativos
function addDecorativeElements(doc, pageWidth, pageHeight) {
    // Borda decorativa
    doc.setDrawColor(255, 215, 0);
    doc.setLineWidth(3);
    doc.rect(5, 5, pageWidth - 10, pageHeight - 10);
    
    // Cantos decorativos
    const cornerSize = 10;
    doc.setFillColor(255, 215, 0);
    
    // Canto superior esquerdo
    doc.triangle(5, 5, 5 + cornerSize, 5, 5, 5 + cornerSize, 'F');
    
    // Canto superior direito
    doc.triangle(pageWidth - 5, 5, pageWidth - 5 - cornerSize, 5, pageWidth - 5, 5 + cornerSize, 'F');
    
    // Canto inferior esquerdo
    doc.triangle(5, pageHeight - 5, 5 + cornerSize, pageHeight - 5, 5, pageHeight - 5 - cornerSize, 'F');
    
    // Canto inferior direito
    doc.triangle(pageWidth - 5, pageHeight - 5, pageWidth - 5 - cornerSize, pageHeight - 5, pageWidth - 5, pageHeight - 5 - cornerSize, 'F');
}

// Função auxiliar para desenhar tabelas
function drawTable(doc, data, x, y, width) {
    const rowHeight = 12;
    const colWidth = width / data[0].length;
    
    data.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            const cellX = x + (colIndex * colWidth);
            const cellY = y + (rowIndex * rowHeight);
            
            // Header da tabela
            if (rowIndex === 0) {
                doc.setFillColor(255, 215, 0);
                doc.rect(cellX, cellY, colWidth, rowHeight, 'F');
                doc.setTextColor(26, 26, 26);
                doc.setFont('helvetica', 'bold');
            } else {
                // Linhas alternadas
                if (rowIndex % 2 === 0) {
                    doc.setFillColor(250, 250, 250);
                    doc.rect(cellX, cellY, colWidth, rowHeight, 'F');
                }
                doc.setTextColor(51, 51, 51);
                doc.setFont('helvetica', 'normal');
            }
            
            // Bordas
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.rect(cellX, cellY, colWidth, rowHeight);
            
            // Texto
            doc.setFontSize(10);
            doc.text(cell, cellX + 2, cellY + 8);
        });
    });
}

// Função para adicionar logo personalizado
function addLogoToPDF(doc, x, y, width, height) {
    // Você pode substituir por uma imagem real usando:
    // doc.addImage(logoBase64, 'PNG', x, y, width, height);
    
    // Por enquanto, vamos criar um logo estilizado
    doc.setFillColor(255, 215, 0);
    doc.roundedRect(x, y, width, height, 5, 5, 'F');
    
    doc.setFillColor(26, 26, 26);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('🍽️', x + width/2 - 5, y + height/2 + 3);
    
    doc.setTextColor(26, 26, 26);
    doc.setFontSize(8);
    doc.text('UNAÍ', x + width/2, y + height - 8, { align: 'center' });
}

// Modal para cadastro/edição de empresa
function showEmpresaModal(empresaId = null) {
    const isEdit = empresaId !== null;
    const empresa = isEdit ? empresas.find(e => e.id === empresaId) : null;
    
    const modalHTML = `
        <div class="modal-overlay" id="empresaModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${isEdit ? 'Editar Empresa' : 'Nova Empresa'}</h2>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                
                <form id="empresaForm" class="modal-form">
                    <div class="form-group">
                        <label for="nome">Nome da Empresa *</label>
                        <input type="text" id="nome" name="nome" required 
                               value="${empresa ? empresa.nome : ''}" 
                               placeholder="Ex: Empresa ABC Ltda">
                    </div>
                    
                    <div class="form-group">
                        <label for="contato">Contato</label>
                        <input type="text" id="contato" name="contato" 
                               value="${empresa ? empresa.contato : ''}" 
                               placeholder="Ex: João Silva">
                    </div>
                    
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" name="email" 
                               value="${empresa ? empresa.email : ''}" 
                               placeholder="Ex: contato@empresa.com">
                    </div>
                    
                    <div class="form-group">
                        <label for="telefone">Telefone</label>
                        <input type="tel" id="telefone" name="telefone" 
                               value="${empresa ? empresa.telefone : ''}" 
                               placeholder="Ex: (38) 99999-9999">
                    </div>
                    
                    <div class="form-group">
                        <label for="observacoes">Observações</label>
                        <textarea id="observacoes" name="observacoes" rows="3" 
                                  placeholder="Observações adicionais...">${empresa ? empresa.observacoes || '' : ''}</textarea>
                    </div>
                    
                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
                        <button type="submit" class="btn btn-primary">
                            ${isEdit ? 'Atualizar' : 'Cadastrar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Event listener para o formulário
    document.getElementById('empresaForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        await saveEmpresa(empresaId);
    });
}

// Salvar empresa
async function saveEmpresa(empresaId = null) {
    const form = document.getElementById('empresaForm');
    const formData = new FormData(form);
    
    const empresaData = {
        nome: formData.get('nome'),
        contato: formData.get('contato'),
        email: formData.get('email'),
        telefone: formData.get('telefone'),
        observacoes: formData.get('observacoes')
    };
    
    try {
        if (empresaId) {
            // Atualizar empresa existente
            await Database.updateEmpresa(empresaId, empresaData);
            showNotification('Empresa atualizada com sucesso!', 'success');
        } else {
            // Criar nova empresa
            await Database.createEmpresa(empresaData);
            showNotification('Empresa cadastrada com sucesso!', 'success');
        }
        
        closeModal();
        await loadData();
        renderDashboard();
        
    } catch (error) {
        console.error('Erro ao salvar empresa:', error);
        showNotification('Erro ao salvar empresa. Tente novamente.', 'error');
    }
}

// Fechar modal
function closeModal() {
    const modal = document.getElementById('empresaModal');
    if (modal) {
        modal.remove();
    }
}

// Mostrar notificação
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Configurar event listeners
function setupEventListeners() {
    // Filtros
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            renderEmpresas();
        });
    });

    
    // Botão Lançamentos
    document.getElementById('btnLancamentos').addEventListener('click', function() {
        showPaginaLancamentos();
    });

    // Botão Nova Empresa
    document.getElementById('btnNovaEmpresa').addEventListener('click', function() {
        showEmpresaModal();
    });

    // Botão Configurações
    document.getElementById('btnConfiguracoes').addEventListener('click', function() {
        showConfiguracoes();
    });
    
    // Seletor de Mês
    document.getElementById('selectMes').addEventListener('change', async function() {
        currentMonth = this.value;
        await loadData();
        renderDashboard();
        showNotification(`Período alterado para ${getCurrentMonthText()}`, 'info');
    });
    
    // Botão Novo Mês
    document.getElementById('btnNovoMes').addEventListener('click', function() {
        showNovoMesModal();
    });

    // Botão Template (sempre disponível se tem dados)
    if (controle && (controle.qtd_pequena + controle.qtd_media + controle.qtd_grande) > 0) {
        buttons.push(`<button class="btn btn-secondary btn-small" onclick="gerarTemplate(${empresaId})">
            <i class="fas fa-envelope"></i> Template
        </button>`);
        
        // ADICIONAR ESTE BOTÃO PDF:
        buttons.push(`<button class="btn btn-success btn-small" onclick="gerarPDF(${empresaId})">
            <i class="fas fa-file-pdf"></i> PDF
        </button>`);
    }
}

// Função editarEmpresa existente (não mexer)
function editarEmpresa(empresaId) {
    showLancamentoModal(empresaId);
}

// ADICIONAR ESTAS FUNÇÕES LOGO APÓS A LINHA ACIMA:

const modalHTML = `
    <div class="modal-overlay" id="lancamentoModal">
        <div class="modal-content modal-extra-large">
            <div class="modal-header">
                <h2>🏢 ${empresa.nome} - ${getCurrentMonthText()}</h2>
                <button class="modal-close" onclick="closeLancamentoModal()">&times;</button>
            </div>
            
            <div class="modal-form">
                <div class="modal-grid">
                    <!-- CONTEÚDO PRINCIPAL -->
                    <div class="modal-main-content">
                        <!-- Seção de Lançamentos Diários -->
                        <div class="lancamentos-section">
                            <div class="section-header">
                                <h3>📅 Lançamentos Diários</h3>
                                <button type="button" class="btn btn-secondary btn-small" onclick="adicionarLancamento()">
                                    <i class="fas fa-plus"></i> Adicionar Dia
                                </button>
                            </div>
                            
                            <div id="lancamentosList" class="lancamentos-list">
                                ${renderLancamentosExistentes(controle)}
                            </div>
                        </div>
                        
                        <div class="section-divider"></div>
                        
                        <!-- Observações -->
                        <div class="config-section">
                            <h3>📝 Observações</h3>
                            <div class="form-group">
                                <textarea id="observacoes_lancamento" rows="4" placeholder="Observações sobre este lançamento...">${controle ? controle.observacoes || '' : ''}</textarea>
                            </div>
                        </div>
                    </div>
                    
                    <!-- SIDEBAR COM RESUMO E AÇÕES -->
                    <div class="modal-sidebar">
                        <!-- Ações Rápidas -->
                        <div class="quick-actions-grid">
                            <div class="action-card" onclick="gerarTemplate(${empresaId})">
                                <i class="fas fa-envelope"></i>
                                <span>Template Email</span>
                            </div>
                            <div class="action-card" onclick="gerarPDF(${empresaId})">
                                <i class="fas fa-file-pdf"></i>
                                <span>Gerar PDF</span>
                            </div>
                        </div>
                        
                        <!-- Resumo Total -->
                        <div class="resumo-section">
                            <h3>📊 Resumo do Mês</h3>
                            <div class="resumo-grid" style="grid-template-columns: 1fr 1fr; gap: 15px;">
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
                                    <span id="valor_total_mes">R$ 0,00</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Status -->
                        <div class="status-section">
                            <h3>📈 Status Atual</h3>
                            <div class="status-badge ${controle ? controle.status : 'pendente'}" style="display: block; text-align: center; margin-bottom: 15px;">
                                ${getStatusText(controle ? controle.status : 'pendente')}
                            </div>
                            
                            <div class="status-controls">
                                <h4>Alterar Status:</h4>
                                ${createStatusButtons(controle ? controle.status : 'pendente')}
                            </div>
                        </div>
                        
                        <!-- Botões de Ação -->
                        <div class="modal-actions" style="border-top: none; padding-top: 0; margin-top: 25px;">
                            <button type="button" class="btn btn-secondary" onclick="closeLancamentoModal()">
                                <i class="fas fa-times"></i> Fechar
                            </button>
                            <button type="button" class="btn btn-primary" onclick="salvarLancamento(${empresaId})">
                                <i class="fas fa-save"></i> Salvar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;

// Renderizar lançamentos existentes
function renderLancamentosExistentes(controle) {
    if (!controle || !controle.lancamentos_diarios) {
        return '<p class="no-lancamentos">Nenhum lançamento ainda. Clique em "Adicionar Dia" para começar.</p>';
    }
    
    const lancamentos = JSON.parse(controle.lancamentos_diarios || '[]');
    
    if (lancamentos.length === 0) {
        return '<p class="no-lancamentos">Nenhum lançamento ainda. Clique em "Adicionar Dia" para começar.</p>';
    }
    
    return lancamentos.map((lancamento, index) => createLancamentoRow(lancamento, index)).join('');
}

// Criar linha de lançamento
function createLancamentoRow(lancamento = {}, index = 0) {
    const hoje = new Date().toISOString().split('T')[0];
    const extras = lancamento.extras || [];
    
    // CORREÇÃO: Criar ID único para cada lançamento
    const uniqueId = `lancamento_${Date.now()}_${index}`;
    
    return `
        <div class="lancamento-row" data-index="${index}" data-unique-id="${uniqueId}">
            <div class="lancamento-header">
                <input type="date" class="data-input" value="${lancamento.data || hoje}" onchange="calcularTotaisMes()">
                <button type="button" class="btn-remove" onclick="removerLancamento('${uniqueId}')" title="Remover este dia">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            
            <!-- Marmitas -->
            <div class="marmitas-section">
                <h4>🍽️ Marmitas</h4>
                <div class="quantidades-grid">
                    <div class="quantidade-item">
                        <label>Pequena (P)</label>
                        <input type="number" class="qtd-input qtd-p" min="0" value="${lancamento.qtd_pequena || ''}" 
                               onchange="calcularTotaisMes()" placeholder="0">
                        <span class="preco">R$ ${precos.P.toFixed(2)}</span>
                    </div>
                    
                    <div class="quantidade-item">
                        <label>Média (M)</label>
                        <input type="number" class="qtd-input qtd-m" min="0" value="${lancamento.qtd_media || ''}" 
                               onchange="calcularTotaisMes()" placeholder="0">
                        <span class="preco">R$ ${precos.M.toFixed(2)}</span>
                    </div>
                    
                    <div class="quantidade-item">
                        <label>Grande (G)</label>
                        <input type="number" class="qtd-input qtd-g" min="0" value="${lancamento.qtd_grande || ''}" 
                               onchange="calcularTotaisMes()" placeholder="0">
                        <span class="preco">R$ ${precos.G.toFixed(2)}</span>
                    </div>
                </div>
            </div>
            
            <!-- Itens Extras -->
            <div class="extras-section">
                <div class="extras-header">
                    <h4>🥤 Itens Extras</h4>
                    <button type="button" class="btn btn-secondary btn-small" onclick="adicionarExtra('${uniqueId}')">
                        <i class="fas fa-plus"></i> Adicionar Item
                    </button>
                </div>
                
                <div class="extras-list" id="extrasList_${uniqueId}">
                    ${extras.map((extra, extraIndex) => createExtraRow(uniqueId, extraIndex, extra)).join('')}
                    ${extras.length === 0 ? '<p class="no-extras">Nenhum item extra adicionado.</p>' : ''}
                </div>
            </div>
            
            <!-- Total do Dia -->
            <div class="total-dia-section">
                <div class="total-dia">
                    <label>Total do Dia</label>
                    <span class="valor-dia">R$ 0,00</span>
                </div>
            </div>
        </div>
    `;
}

// Criar linha de item extra
function createExtraRow(lancamentoId, extraIndex, extra = {}) {
    const uniqueExtraId = `extra_${Date.now()}_${extraIndex}`;
    
    return `
        <div class="extra-row" data-lancamento="${lancamentoId}" data-extra="${extraIndex}" data-extra-id="${uniqueExtraId}">
            <input type="text" class="extra-descricao" placeholder="Ex: Coca-Cola, Água, etc." 
                   value="${extra.descricao || ''}" onchange="calcularTotaisMes()">
            <input type="number" class="extra-quantidade" min="1" placeholder="Qtd" 
                   value="${extra.quantidade || 1}" onchange="calcularTotaisMes()">
            <input type="number" class="extra-valor" step="0.01" min="0" placeholder="Valor unit." 
                   value="${extra.valor_unitario || ''}" onchange="calcularTotaisMes()">
            <span class="extra-total">R$ 0,00</span>
            <button type="button" class="btn-remove-extra" onclick="removerExtra('${uniqueExtraId}')" title="Remover item">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
}

// Adicionar item extra
function adicionarExtra(lancamentoId) {
    const extrasList = document.getElementById(`extrasList_${lancamentoId}`);
    const noExtras = extrasList.querySelector('.no-extras');
    
    if (noExtras) {
        noExtras.remove();
    }
    
    const extraIndex = extrasList.querySelectorAll('.extra-row').length;
    const novoExtra = createExtraRow(lancamentoId, extraIndex);
    
    extrasList.insertAdjacentHTML('beforeend', novoExtra);
    
    // Focar no campo descrição do novo extra
    setTimeout(() => {
        const novoExtraRow = extrasList.lastElementChild;
        const descricaoInput = novoExtraRow.querySelector('.extra-descricao');
        if (descricaoInput) {
            descricaoInput.focus();
        }
    }, 100);
    
    calcularTotaisMes();
}

// Remover item extra
function removerExtra(uniqueExtraId) {
    const extraRow = document.querySelector(`[data-extra-id="${uniqueExtraId}"]`);
    if (extraRow) {
        const lancamentoId = extraRow.dataset.lancamento;
        extraRow.remove();
        calcularTotaisMes();
        
        // Se não sobrou nenhum extra, mostrar mensagem
        const extrasList = document.getElementById(`extrasList_${lancamentoId}`);
        if (extrasList.querySelectorAll('.extra-row').length === 0) {
            extrasList.innerHTML = '<p class="no-extras">Nenhum item extra adicionado.</p>';
        }
    }
}

// Adicionar novo lançamento
function adicionarLancamento() {
    const lista = document.getElementById('lancamentosList');
    const noLancamentos = lista.querySelector('.no-lancamentos');
    
    if (noLancamentos) {
        noLancamentos.remove();
    }
    
    // CORREÇÃO: Sempre criar um lançamento VAZIO para novo dia
    const index = lista.children.length;
    const novoLancamento = createLancamentoRow({}, index);
    
    lista.insertAdjacentHTML('beforeend', novoLancamento);
    
    // Focar no campo de data do novo lançamento
    setTimeout(() => {
        const novoRow = lista.lastElementChild;
        const dataInput = novoRow.querySelector('.data-input');
        if (dataInput) {
            dataInput.focus();
        }
    }, 100);
    
    calcularTotaisMes();
}

// Remover lançamento
function removerLancamento(uniqueId) {
    const row = document.querySelector(`[data-unique-id="${uniqueId}"]`);
    if (row) {
        if (confirm('Tem certeza que deseja remover este lançamento do dia?')) {
            row.remove();
            calcularTotaisMes();
            
            // Se não sobrou nenhum lançamento, mostrar mensagem
            const lista = document.getElementById('lancamentosList');
            if (lista.children.length === 0) {
                lista.innerHTML = '<p class="no-lancamentos">Nenhum lançamento ainda. Clique em "Adicionar Dia" para começar.</p>';
            }
        }
    }
}

// Calcular totais do mês
function calcularTotaisMes() {
    let totalP = 0, totalM = 0, totalG = 0, valorTotal = 0, totalExtras = 0;
    
    document.querySelectorAll('.lancamento-row').forEach(row => {
        const qtdP = parseInt(row.querySelector('.qtd-p').value) || 0;
        const qtdM = parseInt(row.querySelector('.qtd-m').value) || 0;
        const qtdG = parseInt(row.querySelector('.qtd-g').value) || 0;
        
        const valorMarmitas = (qtdP * precos.P) + (qtdM * precos.M) + (qtdG * precos.G);
        
        // Calcular extras do dia
        let valorExtrasDia = 0;
        row.querySelectorAll('.extra-row').forEach(extraRow => {
            const quantidade = parseInt(extraRow.querySelector('.extra-quantidade').value) || 0;
            const valorUnitario = parseFloat(extraRow.querySelector('.extra-valor').value) || 0;
            const totalExtra = quantidade * valorUnitario;
            
            // Atualizar total do extra
            const extraTotalSpan = extraRow.querySelector('.extra-total');
            if (extraTotalSpan) {
                extraTotalSpan.textContent = `R$ ${totalExtra.toFixed(2).replace('.', ',')}`;
            }
            
            valorExtrasDia += totalExtra;
        });
        
        const valorDia = valorMarmitas + valorExtrasDia;
        
        // Atualizar total do dia
        const valorDiaSpan = row.querySelector('.valor-dia');
        if (valorDiaSpan) {
            valorDiaSpan.textContent = `R$ ${valorDia.toFixed(2).replace('.', ',')}`;
        }
        
        totalP += qtdP;
        totalM += qtdM;
        totalG += qtdG;
        valorTotal += valorDia;
        totalExtras += valorExtrasDia;
    });
    
    // Atualizar resumo
    const totalPequenas = document.getElementById('total_pequenas');
    const totalMedias = document.getElementById('total_medias');
    const totalGrandes = document.getElementById('total_grandes');
    const valorTotalMes = document.getElementById('valor_total_mes');
    
    if (totalPequenas) totalPequenas.textContent = totalP;
    if (totalMedias) totalMedias.textContent = totalM;
    if (totalGrandes) totalGrandes.textContent = totalG;
    if (valorTotalMes) {
        valorTotalMes.innerHTML = `
            <div>Marmitas: R$ ${(valorTotal - totalExtras).toFixed(2).replace('.', ',')}</div>
            <div>Extras: R$ ${totalExtras.toFixed(2).replace('.', ',')}</div>
            <div><strong>Total: R$ ${valorTotal.toFixed(2).replace('.', ',')}</strong></div>
        `;
    }
}

// Calcular totais automaticamente
function calculateTotals() {
    const qtdP = parseInt(document.getElementById('qtd_pequena').value) || 0;
    const qtdM = parseInt(document.getElementById('qtd_media').value) || 0;
    const qtdG = parseInt(document.getElementById('qtd_grande').value) || 0;
    
    const subtotalP = qtdP * precos.P;
    const subtotalM = qtdM * precos.M;
    const subtotalG = qtdG * precos.G;
    const total = subtotalP + subtotalM + subtotalG;
    const totalMarmitas = qtdP + qtdM + qtdG;
    
    document.getElementById('subtotal_p').textContent = `= R$ ${subtotalP.toFixed(2).replace('.', ',')}`;
    document.getElementById('subtotal_m').textContent = `= R$ ${subtotalM.toFixed(2).replace('.', ',')}`;
    document.getElementById('subtotal_g').textContent = `= R$ ${subtotalG.toFixed(2).replace('.', ',')}`;
    document.getElementById('total_marmitas').textContent = totalMarmitas;
    document.getElementById('total_valor').textContent = total.toFixed(2).replace('.', ',');
}

// Criar botões de status
function createStatusButtons(currentStatus) {
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
                onclick="changeStatus('${status.key}')">
            ${status.icon} ${status.label}
        </button>
    `).join('');
}

// Alterar status
function changeStatus(newStatus) {
    // Remover classe active de todos os botões
    document.querySelectorAll('.status-btn').forEach(btn => btn.classList.remove('active'));
    
    // Adicionar classe active ao botão clicado
    event.target.classList.add('active');
    
    // Armazenar o status selecionado
    document.getElementById('lancamentoForm').dataset.selectedStatus = newStatus;
}

// Salvar lançamento
async function saveLancamento(empresaId) {
    const observacoes = document.getElementById('observacoes_lancamento').value;
    const selectedStatus = document.getElementById('lancamentoForm').dataset.selectedStatus;
    
    // Coletar todos os lançamentos diários
    const lancamentosDiarios = [];
    let totalP = 0, totalM = 0, totalG = 0, valorTotal = 0;
    
    document.querySelectorAll('.lancamento-row').forEach(row => {
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
        
        const valorMarmitas = (qtdP * precos.P) + (qtdM * precos.M) + (qtdG * precos.G);
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
    
    const lancamentoData = {
        empresa_id: empresaId,
        mes_ano: currentMonth,
        qtd_pequena: totalP,
        qtd_media: totalM,
        qtd_grande: totalG,
        valor_total: valorTotal,
        status: selectedStatus || 'pendente',
        observacoes: observacoes,
        lancamentos_diarios: JSON.stringify(lancamentosDiarios)
    };
    
    try {
        const controleExistente = controles.find(c => c.empresa_id === empresaId);
        
        if (controleExistente) {
            await Database.updateControle(controleExistente.id, lancamentoData);
            showNotification('Lançamento atualizado com sucesso!', 'success');
        } else {
            await Database.createControle(lancamentoData);
            showNotification('Lançamento salvo com sucesso!', 'success');
        }
        
        closeLancamentoModal();
        await loadData();
        renderDashboard();
        
    } catch (error) {
        console.error('Erro ao salvar lançamento:', error);
        showNotification('Erro ao salvar lançamento. Tente novamente.', 'error');
    }
}

// Fechar modal de lançamento
function closeLancamentoModal() {
    const modal = document.getElementById('lancamentoModal');
    if (modal) {
        modal.remove();
    }
}

// Obter texto do mês atual
function getCurrentMonthText() {
    const [year, month] = currentMonth.split('-');
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return `${months[parseInt(month) - 1]}/${year}`;
}

// Avançar para próximo status automaticamente
async function avancarStatusProximo(empresaId) {
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
        await avancarStatusDireto(empresaId, novoStatus);
    }
}

// Avançar para status específico
async function avancarStatusDireto(empresaId, novoStatus) {
    const controle = controles.find(c => c.empresa_id === empresaId);
    if (!controle) return;
    
    try {
        await Database.updateControle(controle.id, { status: novoStatus });
        showNotification('Status atualizado com sucesso!', 'success');
        await loadData();
        renderDashboard();
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        showNotification('Erro ao atualizar status.', 'error');
    }
}

// Modal de configurações
function showConfiguracoes() {
    const modalHTML = `
        <div class="modal-overlay" id="configModal">
            <div class="modal-content modal-extra-large">
                <div class="modal-header">
                    <h2>⚙️ Configurações do Sistema</h2>
                    <button class="modal-close" onclick="closeConfigModal()">&times;</button>
                </div>
                
                <div class="modal-form">
                    <!-- Seção de Preços -->
                    <div class="config-section">
                        <h3>💰 Preços das Marmitas</h3>
                        <div class="precos-grid">
                            <div class="preco-item">
                                <label>Pequena (P):</label>
                                <div class="input-group">
                                    <span>R$</span>
                                    <input type="number" id="preco_p" step="0.01" min="0" value="${precos.P ? precos.P.toFixed(2) : '8.00'}">
                                </div>
                            </div>
                            <div class="preco-item">
                                <label>Média (M):</label>
                                <div class="input-group">
                                    <span>R$</span>
                                    <input type="number" id="preco_m" step="0.01" min="0" value="${precos.M ? precos.M.toFixed(2) : '10.00'}">
                                </div>
                            </div>
                            <div class="preco-item">
                                <label>Grande (G):</label>
                                <div class="input-group">
                                    <span>R$</span>
                                    <input type="number" id="preco_g" step="0.01" min="0" value="${precos.G ? precos.G.toFixed(2) : '12.00'}">
                                </div>
                            </div>
                        </div>
                        <button type="button" class="btn btn-primary" onclick="salvarPrecos()">
                            <i class="fas fa-save"></i> Salvar Preços
                        </button>
                    </div>
                    
                    <!-- Seção de Empresas -->
                    <div class="config-section">
                        <h3>🏢 Empresas Cadastradas</h3>
                        <div class="empresas-actions">
                            <button type="button" class="btn btn-primary" onclick="showEmpresaModal()">
                                <i class="fas fa-plus"></i> Nova Empresa
                            </button>
                            <span class="empresas-count">Total: ${empresas.length} empresas</span>
                        </div>
                        <div class="empresas-list" id="empresasConfigList">
                            ${renderEmpresasConfig()}
                        </div>
                    </div>
                    
                    <!-- Seção de Períodos -->
                    <div class="config-section">
                        <h3>📅 Gerenciar Períodos</h3>
                        <div class="periodos-info">
                            <p>Período atual: <strong>${getCurrentMonthText()}</strong></p>
                            <button type="button" class="btn btn-secondary" onclick="showNovoMesModal()">
                                <i class="fas fa-plus"></i> Criar Novo Período
                            </button>
                        </div>
                        <div class="periodos-list">
                            ${renderPeriodosList()}
                        </div>
                    </div>
                    
                    <!-- Seção de Template -->
                    <div class="config-section">
                        <h3>📧 Template de Email</h3>
                        <div class="template-section">
                            <button type="button" class="btn btn-secondary" onclick="showTemplateModal()">
                                <i class="fas fa-edit"></i> Editar Template
                            </button>
                            <button type="button" class="btn btn-secondary" onclick="previewTemplate()">
                                <i class="fas fa-eye"></i> Visualizar Template
                            </button>
                        </div>
                        <p class="template-info">Configure o modelo de email que será enviado para as empresas.</p>
                    </div>
                    
                    <!-- Seção de Backup -->
                    <div class="config-section">
                        <h3>💾 Backup e Dados</h3>
                        <div class="backup-actions">
                            <button type="button" class="btn btn-success" onclick="exportarDados()">
                                <i class="fas fa-download"></i> Exportar Dados
                            </button>
                            <button type="button" class="btn btn-warning" onclick="limparPeriodo()">
                                <i class="fas fa-trash"></i> Limpar Período Atual
                            </button>
                        </div>
                        <p class="backup-info">Exporte seus dados para backup ou limpe o período atual.</p>
                    </div>
                    
                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" onclick="closeConfigModal()">Fechar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Renderizar lista de empresas na configuração
function renderEmpresasConfig() {
    if (empresas.length === 0) {
        return '<p class="no-empresas">Nenhuma empresa cadastrada ainda.</p>';
    }
    
    return empresas.map(empresa => `
        <div class="empresa-config-item">
            <div class="empresa-config-info">
                <strong>${empresa.nome}</strong>
                <span>${empresa.contato || 'Sem contato'} - ${empresa.email || 'Sem email'}</span>
            </div>
            <div class="empresa-config-actions">
                <button class="btn btn-small btn-secondary" onclick="showEmpresaModal(${empresa.id})">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn btn-small btn-secondary" onclick="verHistoricoEmpresa(${empresa.id})">
                    <i class="fas fa-history"></i> Histórico
                </button>
                <button class="btn btn-small btn-danger" onclick="confirmarExclusaoEmpresa(${empresa.id})">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        </div>
    `).join('');
}

// Renderizar lista de períodos
function renderPeriodosList() {
    const selectMes = document.getElementById('selectMes');
    const periodos = Array.from(selectMes.options).map(option => ({
        value: option.value,
        text: option.textContent
    }));
    
    return `
        <div class="periodos-grid">
            ${periodos.map(periodo => `
                <div class="periodo-item ${periodo.value === currentMonth ? 'active' : ''}">
                    <span>${periodo.text}</span>
                    ${periodo.value === currentMonth ? '<span class="badge">Atual</span>' : ''}
                </div>
            `).join('')}
        </div>
    `;
}


// Ver histórico da empresa
function verHistoricoEmpresa(empresaId) {
    const empresa = empresas.find(e => e.id === empresaId);
    if (!empresa) return;
    
    showNotification(`Histórico da ${empresa.nome} - Funcionalidade em desenvolvimento!`, 'info');
}

// Mostrar modal de template
function showTemplateModal() {
    showNotification('Editor de template em desenvolvimento!', 'info');
}

// Preview do template
function previewTemplate() {
    if (empresas.length === 0) {
        showNotification('Cadastre pelo menos uma empresa para visualizar o template!', 'error');
        return;
    }
    
    // Usar primeira empresa como exemplo
    const empresaExemplo = empresas[0];
    const controleExemplo = controles.find(c => c.empresa_id === empresaExemplo.id) || {
        qtd_pequena: 10,
        qtd_media: 15,
        qtd_grande: 5,
        valor_total: 290.00
    };
    
    const template = `Prezados ${empresaExemplo.nome},

Segue o relatório de consumo do mês ${getCurrentMonthText()}:

MARMITAS:
Pequenas: ${controleExemplo.qtd_pequena} x R$ ${precos.P.toFixed(2)} = R$ ${(controleExemplo.qtd_pequena * precos.P).toFixed(2)}
Médias: ${controleExemplo.qtd_media} x R$ ${precos.M.toFixed(2)} = R$ ${(controleExemplo.qtd_media * precos.M).toFixed(2)}
Grandes: ${controleExemplo.qtd_grande} x R$ ${precos.G.toFixed(2)} = R$ ${(controleExemplo.qtd_grande * precos.G).toFixed(2)}

VALOR TOTAL: R$ ${controleExemplo.valor_total.toFixed(2)}

Atenciosamente,
Unaí Marmitas`;
    
    alert(`PREVIEW DO TEMPLATE:\n\n${template}`);
}

// Exportar dados
async function exportarDados() {
    try {
        const dadosExport = {
            empresas: empresas,
            controles: controles,
            precos: precos,
            periodo: currentMonth,
            data_export: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(dadosExport, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `unai-marmitas-backup-${currentMonth}.json`;
        link.click();
        
        showNotification('Dados exportados com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao exportar dados:', error);
        showNotification('Erro ao exportar dados.', 'error');
    }
}

// Limpar período atual
function limparPeriodo() {
    if (confirm(`Tem certeza que deseja limpar TODOS os dados do período ${getCurrentMonthText()}?\n\nEsta ação não pode ser desfeita!`)) {
        if (confirm('CONFIRMAÇÃO FINAL: Todos os lançamentos do período atual serão perdidos. Continuar?')) {
            limparPeriodoConfirmado();
        }
    }
}

// Limpar período confirmado
async function limparPeriodoConfirmado() {
    try {
        // Deletar todos os controles do período atual
        for (const controle of controles) {
            await Database.updateControle(controle.id, {
                qtd_pequena: 0,
                qtd_media: 0,
                qtd_grande: 0,
                valor_total: 0,
                status: 'pendente',
                observacoes: '',
                lancamentos_diarios: '[]'
            });
        }
        
        await loadData();
        renderDashboard();
        showNotification(`Período ${getCurrentMonthText()} limpo com sucesso!`, 'success');
        
    } catch (error) {
        console.error('Erro ao limpar período:', error);
        showNotification('Erro ao limpar período.', 'error');
    }
}

// Fechar modal de configurações
function closeConfigModal() {
    const modal = document.getElementById('configModal');
    if (modal) {
        modal.remove();
    }
}

// Salvar preços
async function salvarPrecos() {
    const novosPrecos = {
        P: parseFloat(document.getElementById('preco_p').value),
        M: parseFloat(document.getElementById('preco_m').value),
        G: parseFloat(document.getElementById('preco_g').value)
    };
    
    try {
        await Database.updatePrecos(novosPrecos);
        precos = novosPrecos;
        showNotification('Preços atualizados com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao salvar preços:', error);
        showNotification('Erro ao salvar preços.', 'error');
    }
}

// Criar novo período
function criarNovoPeriodo() {
    const mes = document.getElementById('novo_mes').value;
    const ano = document.getElementById('novo_ano').value;
    const novoPeriodo = `${ano}-${mes}`;
    
    // Atualizar o select do mês no dashboard
    const selectMes = document.getElementById('selectMes');
    const option = document.createElement('option');
    option.value = novoPeriodo;
    option.textContent = `${getMonthName(mes)}/${ano}`;
    selectMes.appendChild(option);
    selectMes.value = novoPeriodo;
    
    currentMonth = novoPeriodo;
    showNotification('Novo período criado!', 'success');
    
    // Recarregar dados para o novo período
    loadData().then(() => renderDashboard());
}

// Obter nome do mês
function getMonthName(monthNumber) {
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return months[parseInt(monthNumber) - 1];
}

// Confirmar exclusão de empresa
function confirmarExclusaoEmpresa(empresaId) {
    const empresa = empresas.find(e => e.id === empresaId);
    if (!empresa) return;
    
    if (confirm(`Tem certeza que deseja excluir a empresa "${empresa.nome}"?\n\nEsta ação não pode ser desfeita.`)) {
        excluirEmpresa(empresaId);
    }
}

// Excluir empresa
async function excluirEmpresa(empresaId) {
    try {
        await Database.deleteEmpresa(empresaId);
        showNotification('Empresa excluída com sucesso!', 'success');
        await loadData();
        renderDashboard();
        
        // Atualizar lista na configuração se estiver aberta
        const empresasConfigList = document.getElementById('empresasConfigList');
        if (empresasConfigList) {
            empresasConfigList.innerHTML = renderEmpresasConfig();
        }
    } catch (error) {
        console.error('Erro ao excluir empresa:', error);
        showNotification('Erro ao excluir empresa.', 'error');
    }
}

// Sistema de Templates
let templateEmail = {
    assunto: 'Relatório Mensal - {EMPRESA} - {MES}/{ANO}',
    corpo: `Prezados {EMPRESA},

Segue o relatório de consumo do mês {MES}/{ANO}:

MARMITAS:
Pequenas: {QTD_P} x R$ {PRECO_P} = R$ {TOTAL_P}
Médias: {QTD_M} x R$ {PRECO_M} = R$ {TOTAL_M}
Grandes: {QTD_G} x R$ {PRECO_G} = R$ {TOTAL_G}

{EXTRAS_SECTION}

RESUMO:
Total Marmitas: {QTD_TOTAL} unidades = R$ {VALOR_MARMITAS}
{VALOR_EXTRAS_LINE}
VALOR TOTAL: R$ {VALOR_TOTAL}

Atenciosamente,
Unaí Marmitas`
};

// Mostrar modal de edição de template
function showTemplateModal() {
    const modalHTML = `
        <div class="modal-overlay" id="templateModal">
            <div class="modal-content modal-extra-large">
                <div class="modal-header">
                    <h2>📧 Editor de Template de Email</h2>
                    <button class="modal-close" onclick="closeTemplateModal()">&times;</button>
                </div>
                
                <form id="templateForm" class="modal-form">
                    <div class="template-editor">
                        <div class="form-group">
                            <label for="template_assunto">Assunto do Email:</label>
                            <input type="text" id="template_assunto" value="${templateEmail.assunto}" 
                                   placeholder="Ex: Relatório Mensal - {EMPRESA} - {MES}/{ANO}">
                        </div>
                        
                        <div class="form-group">
                            <label for="template_corpo">Corpo do Email:</label>
                            <textarea id="template_corpo" rows="15" placeholder="Digite o template do email...">${templateEmail.corpo}</textarea>
                        </div>
                        
                        <div class="variaveis-section">
                            <h4>📋 Variáveis Disponíveis:</h4>
                            <div class="variaveis-grid">
                                <div class="variavel-item" onclick="inserirVariavel('{EMPRESA}')">
                                    <code>{EMPRESA}</code>
                                    <span>Nome da empresa</span>
                                </div>
                                <div class="variavel-item" onclick="inserirVariavel('{MES}')">
                                    <code>{MES}</code>
                                    <span>Nome do mês</span>
                                </div>
                                <div class="variavel-item" onclick="inserirVariavel('{ANO}')">
                                    <code>{ANO}</code>
                                    <span>Ano</span>
                                </div>
                                <div class="variavel-item" onclick="inserirVariavel('{QTD_P}')">
                                    <code>{QTD_P}</code>
                                    <span>Quantidade pequenas</span>
                                </div>
                                <div class="variavel-item" onclick="inserirVariavel('{QTD_M}')">
                                    <code>{QTD_M}</code>
                                    <span>Quantidade médias</span>
                                </div>
                                <div class="variavel-item" onclick="inserirVariavel('{QTD_G}')">
                                    <code>{QTD_G}</code>
                                    <span>Quantidade grandes</span>
                                </div>
                                <div class="variavel-item" onclick="inserirVariavel('{PRECO_P}')">
                                    <code>{PRECO_P}</code>
                                    <span>Preço pequena</span>
                                </div>
                                <div class="variavel-item" onclick="inserirVariavel('{PRECO_M}')">
                                    <code>{PRECO_M}</code>
                                    <span>Preço média</span>
                                </div>
                                <div class="variavel-item" onclick="inserirVariavel('{PRECO_G}')">
                                    <code>{PRECO_G}</code>
                                    <span>Preço grande</span>
                                </div>
                                <div class="variavel-item" onclick="inserirVariavel('{TOTAL_P}')">
                                    <code>{TOTAL_P}</code>
                                    <span>Total pequenas</span>
                                </div>
                                <div class="variavel-item" onclick="inserirVariavel('{TOTAL_M}')">
                                    <code>{TOTAL_M}</code>
                                    <span>Total médias</span>
                                </div>
                                <div class="variavel-item" onclick="inserirVariavel('{TOTAL_G}')">
                                    <code>{TOTAL_G}</code>
                                    <span>Total grandes</span>
                                </div>
                                <div class="variavel-item" onclick="inserirVariavel('{QTD_TOTAL}')">
                                    <code>{QTD_TOTAL}</code>
                                    <span>Total de marmitas</span>
                                </div>
                                <div class="variavel-item" onclick="inserirVariavel('{VALOR_MARMITAS}')">
                                    <code>{VALOR_MARMITAS}</code>
                                    <span>Valor total marmitas</span>
                                </div>
                                <div class="variavel-item" onclick="inserirVariavel('{VALOR_EXTRAS}')">
                                    <code>{VALOR_EXTRAS}</code>
                                    <span>Valor total extras</span>
                                </div>
                                <div class="variavel-item" onclick="inserirVariavel('{VALOR_TOTAL}')">
                                    <code>{VALOR_TOTAL}</code>
                                    <span>Valor total geral</span>
                                </div>
                                <div class="variavel-item" onclick="inserirVariavel('{EXTRAS_SECTION}')">
                                    <code>{EXTRAS_SECTION}</code>
                                    <span>Seção de extras (automática)</span>
                                </div>
                                <div class="variavel-item" onclick="inserirVariavel('{VALOR_EXTRAS_LINE}')">
                                    <code>{VALOR_EXTRAS_LINE}</code>
                                    <span>Linha de valor extras (automática)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" onclick="resetTemplate()">
                            <i class="fas fa-undo"></i> Restaurar Padrão
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="previewTemplateCompleto()">
                            <i class="fas fa-eye"></i> Visualizar
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="closeTemplateModal()">Cancelar</button>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i> Salvar Template
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Event listener para o formulário
    document.getElementById('templateForm').addEventListener('submit', function(e) {
        e.preventDefault();
        salvarTemplate();
    });
}

// Inserir variável no cursor
function inserirVariavel(variavel) {
    const textarea = document.getElementById('template_corpo');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    textarea.value = text.substring(0, start) + variavel + text.substring(end);
    textarea.focus();
    textarea.setSelectionRange(start + variavel.length, start + variavel.length);
}

// Salvar template
function salvarTemplate() {
    const assunto = document.getElementById('template_assunto').value;
    const corpo = document.getElementById('template_corpo').value;
    
    if (!assunto.trim() || !corpo.trim()) {
        showNotification('Assunto e corpo são obrigatórios!', 'error');
        return;
    }
    
    templateEmail = {
        assunto: assunto,
        corpo: corpo
    };
    
    // Salvar no localStorage para persistir
    localStorage.setItem('unai_template_email', JSON.stringify(templateEmail));
    
    showNotification('Template salvo com sucesso!', 'success');
    closeTemplateModal();
}

// Restaurar template padrão
function resetTemplate() {
    if (confirm('Tem certeza que deseja restaurar o template padrão? As alterações atuais serão perdidas.')) {
        document.getElementById('template_assunto').value = 'Relatório Mensal - {EMPRESA} - {MES}/{ANO}';
        document.getElementById('template_corpo').value = `Prezados {EMPRESA},

Segue o relatório de consumo do mês {MES}/{ANO}:

MARMITAS:
Pequenas: {QTD_P} x R$ {PRECO_P} = R$ {TOTAL_P}
Médias: {QTD_M} x R$ {PRECO_M} = R$ {TOTAL_M}
Grandes: {QTD_G} x R$ {PRECO_G} = R$ {TOTAL_G}

{EXTRAS_SECTION}

RESUMO:
Total Marmitas: {QTD_TOTAL} unidades = R$ {VALOR_MARMITAS}
{VALOR_EXTRAS_LINE}
VALOR TOTAL: R$ {VALOR_TOTAL}

Atenciosamente,
Unaí Marmitas`;
    }
}

// Preview do template completo
function previewTemplateCompleto() {
    if (empresas.length === 0) {
        showNotification('Cadastre pelo menos uma empresa para visualizar o template!', 'error');
        return;
    }
    
    const assunto = document.getElementById('template_assunto').value;
    const corpo = document.getElementById('template_corpo').value;
    
    // Usar primeira empresa como exemplo
    const empresaExemplo = empresas[0];
    const controleExemplo = controles.find(c => c.empresa_id === empresaExemplo.id) || {
        qtd_pequena: 10,
        qtd_media: 15,
        qtd_grande: 5,
        valor_total: 290.00,
        lancamentos_diarios: '[]'
    };
    
    const templateProcessado = processarTemplate(assunto, corpo, empresaExemplo, controleExemplo);
    
    // Mostrar preview em modal
    const previewHTML = `
        <div class="modal-overlay" id="previewModal">
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h2>👁️ Preview do Template</h2>
                    <button class="modal-close" onclick="closePreviewModal()">&times;</button>
                </div>
                
                <div class="preview-content">
                    <div class="email-preview">
                        <div class="email-header">
                            <strong>Para:</strong> ${empresaExemplo.email || 'empresa@exemplo.com'}<br>
                            <strong>Assunto:</strong> ${templateProcessado.assunto}
                        </div>
                        
                        <div class="email-body">
                            <pre>${templateProcessado.corpo}</pre>
                        </div>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="copiarTemplate()">
                        <i class="fas fa-copy"></i> Copiar
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="closePreviewModal()">Fechar</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', previewHTML);
    
    // Armazenar template processado para cópia
    window.templateParaCopia = `Para: ${empresaExemplo.email || 'empresa@exemplo.com'}
Assunto: ${templateProcessado.assunto}

${templateProcessado.corpo}`;
}

// Processar template com variáveis
function processarTemplate(assunto, corpo, empresa, controle) {
    const [year, month] = currentMonth.split('-');
    const mesNome = getMonthName(month);
    
    // Calcular valores
    const valorMarmitas = (controle.qtd_pequena * precos.P) + (controle.qtd_media * precos.M) + (controle.qtd_grande * precos.G);
    const valorExtras = controle.valor_total - valorMarmitas;
    const qtdTotal = controle.qtd_pequena + controle.qtd_media + controle.qtd_grande;
    
    // Processar extras
    let extrasSection = '';
    let valorExtrasLine = '';
    
    if (controle.lancamentos_diarios) {
        try {
            const lancamentos = JSON.parse(controle.lancamentos_diarios);
            const todosExtras = [];
            
            lancamentos.forEach(lancamento => {
                if (lancamento.extras && lancamento.extras.length > 0) {
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
                extrasSection = '\nITENS EXTRAS:\n';
                todosExtras.forEach(extra => {
                    extrasSection += `${extra.descricao}: ${extra.quantidade} x R$ ${extra.valor_unitario.toFixed(2)} = R$ ${extra.total.toFixed(2)}\n`;
                });
                valorExtrasLine = `Total Extras: R$ ${valorExtras.toFixed(2)}\n`;
            }
        } catch (error) {
            console.error('Erro ao processar extras:', error);
        }
    }
    
    // Substituir variáveis
    const variaveis = {
        '{EMPRESA}': empresa.nome,
        '{MES}': mesNome,
        '{ANO}': year,
        '{QTD_P}': controle.qtd_pequena.toString(),
        '{QTD_M}': controle.qtd_media.toString(),
        '{QTD_G}': controle.qtd_grande.toString(),
        '{PRECO_P}': precos.P.toFixed(2),
        '{PRECO_M}': precos.M.toFixed(2),
        '{PRECO_G}': precos.G.toFixed(2),
        '{TOTAL_P}': (controle.qtd_pequena * precos.P).toFixed(2),
        '{TOTAL_M}': (controle.qtd_media * precos.M).toFixed(2),
        '{TOTAL_G}': (controle.qtd_grande * precos.G).toFixed(2),
        '{QTD_TOTAL}': qtdTotal.toString(),
        '{VALOR_MARMITAS}': valorMarmitas.toFixed(2),
        '{VALOR_EXTRAS}': valorExtras.toFixed(2),
        '{VALOR_TOTAL}': controle.valor_total.toFixed(2),
        '{EXTRAS_SECTION}': extrasSection,
        '{VALOR_EXTRAS_LINE}': valorExtrasLine
    };
    
    let assuntoProcessado = assunto;
    let corpoProcessado = corpo;
    
    // Substituir todas as variáveis
    Object.keys(variaveis).forEach(variavel => {
        const regex = new RegExp(variavel.replace(/[{}]/g, '\\$&'), 'g');
        assuntoProcessado = assuntoProcessado.replace(regex, variaveis[variavel]);
        corpoProcessado = corpoProcessado.replace(regex, variaveis[variavel]);
    });
    
    return {
        assunto: assuntoProcessado,
        corpo: corpoProcessado
    };
}

// Copiar template do preview
function copiarTemplate() {
    if (window.templateParaCopia) {
        navigator.clipboard.writeText(window.templateParaCopia).then(() => {
            showNotification('Template copiado para a área de transferência!', 'success');
        }).catch(() => {
            prompt('Template gerado (Ctrl+C para copiar):', window.templateParaCopia);
        });
    }
}

// Fechar modais
function closeTemplateModal() {
    const modal = document.getElementById('templateModal');
    if (modal) {
        modal.remove();
    }
}

function closePreviewModal() {
    const modal = document.getElementById('previewModal');
    if (modal) {
        modal.remove();
    }
}

// Carregar template salvo
function loadTemplate() {
    const templateSalvo = localStorage.getItem('unai_template_email');
    if (templateSalvo) {
        try {
            templateEmail = JSON.parse(templateSalvo);
        } catch (error) {
            console.error('Erro ao carregar template:', error);
        }
    }
}

// Modal para criar novo mês
function showNovoMesModal() {
    const modalHTML = `
        <div class="modal-overlay" id="novoMesModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>📅 Criar Novo Período</h2>
                    <button class="modal-close" onclick="closeNovoMesModal()">&times;</button>
                </div>
                
                <form id="novoMesForm" class="modal-form">
                    <div class="form-group">
                        <label for="novo_mes_select">Mês:</label>
                        <select id="novo_mes_select" required>
                            <option value="">Selecione o mês</option>
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
                        <label for="novo_ano_select">Ano:</label>
                        <select id="novo_ano_select" required>
                            <option value="">Selecione o ano</option>
                            <option value="2024">2024</option>
                            <option value="2025">2025</option>
                            <option value="2026">2026</option>
                            <option value="2027">2027</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="copiarDados" checked>
                            Copiar empresas do período atual
                        </label>
                        <small>Se marcado, todas as empresas serão copiadas para o novo período com status "Pendente"</small>
                    </div>
                    
                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" onclick="closeNovoMesModal()">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Criar Período</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Event listener para o formulário
    document.getElementById('novoMesForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        await criarNovoMes();
    });
}

// Criar novo mês
async function criarNovoMes() {
    const mes = document.getElementById('novo_mes_select').value;
    const ano = document.getElementById('novo_ano_select').value;
    const copiarDados = document.getElementById('copiarDados').checked;
    
    if (!mes || !ano) {
        showNotification('Por favor, selecione mês e ano!', 'error');
        return;
    }
    
    const novoPeriodo = `${ano}-${mes}`;
    
    // Verificar se o período já existe
    const periodosExistentes = Array.from(document.getElementById('selectMes').options).map(opt => opt.value);
    if (periodosExistentes.includes(novoPeriodo)) {
        showNotification('Este período já existe!', 'error');
        return;
    }
    
    try {
        // Adicionar nova opção no select
        const selectMes = document.getElementById('selectMes');
        const option = document.createElement('option');
        option.value = novoPeriodo;
        option.textContent = `${getMonthName(mes)}/${ano}`;
        
        // Inserir na posição correta (ordenado)
        let inserted = false;
        for (let i = 0; i < selectMes.options.length; i++) {
            if (selectMes.options[i].value > novoPeriodo) {
                selectMes.insertBefore(option, selectMes.options[i]);
                inserted = true;
                break;
            }
        }
        if (!inserted) {
            selectMes.appendChild(option);
        }
        
        // Se deve copiar dados do período atual
        if (copiarDados && empresas.length > 0) {
            for (const empresa of empresas) {
                const novoControle = {
                    empresa_id: empresa.id,
                    mes_ano: novoPeriodo,
                    qtd_pequena: 0,
                    qtd_media: 0,
                    qtd_grande: 0,
                    valor_total: 0,
                    status: 'pendente',
                    observacoes: '',
                    lancamentos_diarios: '[]'
                };
                
                try {
                    await Database.createControle(novoControle);
                } catch (error) {
                    // Ignorar erro se já existir (constraint unique)
                    console.log(`Controle para empresa ${empresa.id} já existe no período ${novoPeriodo}`);
                }
            }
        }
        
        // Mudar para o novo período
        selectMes.value = novoPeriodo;
        currentMonth = novoPeriodo;
        
        closeNovoMesModal();
        await loadData();
        renderDashboard();
        
        showNotification(`Período ${getMonthName(mes)}/${ano} criado com sucesso!`, 'success');
        
    } catch (error) {
        console.error('Erro ao criar novo período:', error);
        showNotification('Erro ao criar novo período.', 'error');
    }
}

// Fechar modal de novo mês
function closeNovoMesModal() {
    const modal = document.getElementById('novoMesModal');
    if (modal) {
        modal.remove();
    }
}

// Inicializar períodos disponíveis
async function initializePeriods() {
    try {
        // Buscar todos os períodos únicos no banco
        const { data, error } = await supabase
            .from('controle_mensal')
            .select('mes_ano')
            .order('mes_ano', { ascending: false });
        
        if (error) throw error;
        
        const periodosUnicos = [...new Set(data.map(item => item.mes_ano))];
        const selectMes = document.getElementById('selectMes');
        
        // Limpar opções existentes
        selectMes.innerHTML = '';
        
        // Se não há períodos, criar o atual
        if (periodosUnicos.length === 0) {
            const option = document.createElement('option');
            option.value = currentMonth;
            option.textContent = getCurrentMonthText();
            selectMes.appendChild(option);
        } else {
            // Adicionar todos os períodos encontrados
            periodosUnicos.forEach(periodo => {
                const option = document.createElement('option');
                option.value = periodo;
                const [year, month] = periodo.split('-');
                option.textContent = `${getMonthName(month)}/${year}`;
                selectMes.appendChild(option);
            });
            
            // Se o período atual não existe na lista, usar o mais recente
            if (!periodosUnicos.includes(currentMonth)) {
                currentMonth = periodosUnicos[0];
            }
        }
        
        selectMes.value = currentMonth;
        
    } catch (error) {
        console.error('Erro ao inicializar períodos:', error);
        // Fallback: usar período atual
        const selectMes = document.getElementById('selectMes');
        selectMes.innerHTML = `<option value="${currentMonth}">${getCurrentMonthText()}</option>`;
    }
}

// Modal de lançamento rápido
function modalLancamentoRapido(empresaId) {
    const empresa = empresas.find(e => e.id === empresaId);
    if (!empresa) {
        showNotification('Empresa não encontrada!', 'error');
        return;
    }
    
    const hoje = new Date().toISOString().split('T')[0];
    
    const modalHTML = `
        <div class="modal-overlay" id="modalRapido">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>🍽️ Lançamento Rápido - ${empresa.nome}</h2>
                    <button class="modal-close" onclick="closeModalRapido()">&times;</button>
                </div>
                
                <form id="formRapido" class="modal-form">
                    <div class="form-group">
                        <label for="data_rapido">📅 Data:</label>
                        <input type="date" id="data_rapido" value="${hoje}" required>
                    </div>
                    
                    <div class="form-group">
                        <label>🍽️ Marmitas:</label>
                        <div class="quantidades-grid">
                            <div class="quantidade-item">
                                <label>Pequena (P)</label>
                                <input type="number" id="qtd_p_rapido" class="qtd-input" min="0" value="0" 
                                       onchange="calcularTotalRapido()" placeholder="0">
                                <span class="preco">R$ ${precos.P.toFixed(2)}</span>
                            </div>
                            
                            <div class="quantidade-item">
                                <label>Média (M)</label>
                                <input type="number" id="qtd_m_rapido" class="qtd-input" min="0" value="0" 
                                       onchange="calcularTotalRapido()" placeholder="0">
                                <span class="preco">R$ ${precos.M.toFixed(2)}</span>
                            </div>
                            
                            <div class="quantidade-item">
                                <label>Grande (G)</label>
                                <input type="number" id="qtd_g_rapido" class="qtd-input" min="0" value="0" 
                                       onchange="calcularTotalRapido()" placeholder="0">
                                <span class="preco">R$ ${precos.G.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>🥤 Itens Extras (Opcional):</label>
                        <div id="extrasRapidoList">
                            <div class="extra-row-simples">
                                <input type="text" class="extra-desc" placeholder="Ex: Coca-Cola" onchange="calcularTotalRapido()">
                                <input type="number" class="extra-qtd" min="1" value="1" onchange="calcularTotalRapido()" placeholder="Qtd">
                                <input type="number" class="extra-valor" step="0.01" min="0" onchange="calcularTotalRapido()" placeholder="Valor">
                                <button type="button" class="btn-add-extra" onclick="adicionarExtraRapido()">+</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <div class="total-rapido">
                            <label>💰 Total do Dia:</label>
                            <span id="valorTotalRapido">R$ 0,00</span>
                        </div>
                    </div>
                    
                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" onclick="closeModalRapido()">Cancelar</button>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i> Salvar Lançamento
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Event listener para o form
    document.getElementById('formRapido').addEventListener('submit', async function(e) {
        e.preventDefault();
        await salvarLancamentoRapido(empresaId);
    });
    
    // Focar no primeiro campo de quantidade
    setTimeout(() => {
        document.getElementById('qtd_p_rapido').focus();
    }, 100);
}

// Calcular total do modal rápido
function calcularTotalRapido() {
    const qtdP = parseInt(document.getElementById('qtd_p_rapido').value) || 0;
    const qtdM = parseInt(document.getElementById('qtd_m_rapido').value) || 0;
    const qtdG = parseInt(document.getElementById('qtd_g_rapido').value) || 0;
    
    let totalMarmitas = (qtdP * precos.P) + (qtdM * precos.M) + (qtdG * precos.G);
    let totalExtras = 0;
    
    // Calcular extras
    document.querySelectorAll('.extra-row-simples').forEach(row => {
        const desc = row.querySelector('.extra-desc').value.trim();
        const qtd = parseInt(row.querySelector('.extra-qtd').value) || 0;
        const valor = parseFloat(row.querySelector('.extra-valor').value) || 0;
        
        if (desc && qtd > 0 && valor > 0) {
            totalExtras += qtd * valor;
        }
    });
    
    const total = totalMarmitas + totalExtras;
    document.getElementById('valorTotalRapido').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

// Adicionar extra no modal rápido
function adicionarExtraRapido() {
    const container = document.getElementById('extrasRapidoList');
    const novaLinha = `
        <div class="extra-row-simples">
            <input type="text" class="extra-desc" placeholder="Ex: Água" onchange="calcularTotalRapido()">
            <input type="number" class="extra-qtd" min="1" value="1" onchange="calcularTotalRapido()" placeholder="Qtd">
            <input type="number" class="extra-valor" step="0.01" min="0" onchange="calcularTotalRapido()" placeholder="Valor">
            <button type="button" class="btn-remove-extra-rapido" onclick="removerExtraRapido(this)">−</button>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', novaLinha);
}

// Remover extra do modal rápido
function removerExtraRapido(btn) {
    btn.closest('.extra-row-simples').remove();
    calcularTotalRapido();
}

// Salvar lançamento rápido
async function salvarLancamentoRapido(empresaId) {
    const data = document.getElementById('data_rapido').value;
    const qtdP = parseInt(document.getElementById('qtd_p_rapido').value) || 0;
    const qtdM = parseInt(document.getElementById('qtd_m_rapido').value) || 0;
    const qtdG = parseInt(document.getElementById('qtd_g_rapido').value) || 0;
    
    if (!data) {
        showNotification('Data é obrigatória!', 'error');
        return;
    }
    
    if (qtdP === 0 && qtdM === 0 && qtdG === 0) {
        showNotification('Informe pelo menos uma quantidade de marmita!', 'error');
        return;
    }
    
    // Coletar extras
    const extras = [];
    document.querySelectorAll('.extra-row-simples').forEach(row => {
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
    
    const valorMarmitas = (qtdP * precos.P) + (qtdM * precos.M) + (qtdG * precos.G);
    const valorExtras = extras.reduce((sum, extra) => sum + extra.total, 0);
    const valorTotal = valorMarmitas + valorExtras;
    
    // Criar objeto do lançamento do dia
    const lancamentoDia = {
        data: data,
        qtd_pequena: qtdP,
        qtd_media: qtdM,
        qtd_grande: qtdG,
        valor_marmitas: valorMarmitas,
        extras: extras,
        valor_extras: valorExtras,
        valor_dia: valorTotal
    };
    
    try {
        // Buscar controle existente ou criar novo
        let controle = controles.find(c => c.empresa_id === empresaId);
        let lancamentosExistentes = [];
        
        if (controle && controle.lancamentos_diarios) {
            lancamentosExistentes = JSON.parse(controle.lancamentos_diarios);
        }
        
        // Verificar se já existe lançamento nesta data
        const indiceExistente = lancamentosExistentes.findIndex(l => l.data === data);
        
        if (indiceExistente >= 0) {
            if (confirm(`Já existe um lançamento para o dia ${data}. Deseja substituir?`)) {
                lancamentosExistentes[indiceExistente] = lancamentoDia;
            } else {
                return;
            }
        } else {
            lancamentosExistentes.push(lancamentoDia);
        }
        
        // Recalcular totais
        const novoTotalP = lancamentosExistentes.reduce((sum, l) => sum + l.qtd_pequena, 0);
        const novoTotalM = lancamentosExistentes.reduce((sum, l) => sum + l.qtd_media, 0);
        const novoTotalG = lancamentosExistentes.reduce((sum, l) => sum + l.qtd_grande, 0);
        const novoValorTotal = lancamentosExistentes.reduce((sum, l) => sum + l.valor_dia, 0);
        
        const dadosControle = {
            empresa_id: empresaId,
            mes_ano: currentMonth,
            qtd_pequena: novoTotalP,
            qtd_media: novoTotalM,
            qtd_grande: novoTotalG,
            valor_total: novoValorTotal,
            status: controle ? controle.status : 'relatorio-enviado',
            observacoes: controle ? controle.observacoes : '',
            lancamentos_diarios: JSON.stringify(lancamentosExistentes)
        };
        
        if (controle) {
            await Database.updateControle(controle.id, dadosControle);
        } else {
            await Database.createControle(dadosControle);
        }
        
        closeModalRapido();
        await loadData();
        renderDashboard();
        
        showNotification(`Lançamento do dia ${data} salvo com sucesso!`, 'success');
        
    } catch (error) {
        console.error('Erro ao salvar lançamento:', error);
        showNotification('Erro ao salvar lançamento.', 'error');
    }
}

// Fechar modal rápido
function closeModalRapido() {
    const modal = document.getElementById('modalRapido');
    if (modal) {
        modal.remove();
    }
}

// Página dedicada de lançamentos
function showPaginaLancamentos() {
    const paginaHTML = `
        <div class="modal-overlay" id="paginaLancamentos">
            <div class="modal-content modal-full-screen">
                <div class="modal-header">
                    <h2>📅 Gerenciamento de Lançamentos - ${getCurrentMonthText()}</h2>
                    <button class="modal-close" onclick="closePaginaLancamentos()">&times;</button>
                </div>
                
                <div class="pagina-lancamentos-content">
                    <!-- Filtros Superiores -->
                    <div class="filtros-lancamentos">
                        <div class="filtro-empresa">
                            <label>🏢 Empresa:</label>
                            <select id="filtroEmpresa" onchange="filtrarLancamentos()">
                                <option value="">Todas as empresas</option>
                                ${empresas.map(emp => `<option value="${emp.id}">${emp.nome}</option>`).join('')}
                            </select>
                        </div>
                        
                        <div class="filtro-data">
                            <label>📅 Período:</label>
                            <input type="date" id="dataInicio" onchange="filtrarLancamentos()">
                            <span>até</span>
                            <input type="date" id="dataFim" onchange="filtrarLancamentos()">
                        </div>
                        
                        <div class="acoes-rapidas">
                            <button class="btn btn-primary" onclick="novoLancamentoRapido()">
                                <i class="fas fa-plus"></i> Novo Lançamento
                            </button>
                            <button class="btn btn-secondary" onclick="exportarLancamentos()">
                                <i class="fas fa-download"></i> Exportar
                            </button>
                        </div>
                    </div>
                    
                    <!-- Grade de Lançamentos -->
                    <div class="lancamentos-grid" id="lancamentosGrid">
                        ${renderGridLancamentos()}
                    </div>
                    
                    <!-- Resumo Geral -->
                    <div class="resumo-geral">
                        <h3>📊 Resumo Geral</h3>
                        <div class="resumo-cards">
                            <div class="resumo-card">
                                <span class="resumo-label">Total de Dias</span>
                                <span class="resumo-valor" id="totalDias">0</span>
                            </div>
                            <div class="resumo-card">
                                <span class="resumo-label">Total Marmitas</span>
                                <span class="resumo-valor" id="totalMarmitas">0</span>
                            </div>
                            <div class="resumo-card">
                                <span class="resumo-label">Total Faturado</span>
                                <span class="resumo-valor" id="totalFaturado">R$ 0,00</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', paginaHTML);
    
    // Configurar datas padrão (primeiro e último dia do mês)
    const [year, month] = currentMonth.split('-');
    const primeiroDia = `${currentMonth}-01`;
    const ultimoDia = `${currentMonth}-${new Date(year, month, 0).getDate()}`;
    
    document.getElementById('dataInicio').value = primeiroDia;
    document.getElementById('dataFim').value = ultimoDia;
    
    // Calcular resumo inicial
    calcularResumoGeral();
}

// Renderizar grid de lançamentos
function renderGridLancamentos() {
    let todosLancamentos = [];
    
    // Coletar todos os lançamentos de todas as empresas
    controles.forEach(controle => {
        if (controle.lancamentos_diarios) {
            try {
                const lancamentos = JSON.parse(controle.lancamentos_diarios);
                const empresa = empresas.find(e => e.id === controle.empresa_id);
                
                lancamentos.forEach(lancamento => {
                    todosLancamentos.push({
                        ...lancamento,
                        empresa_nome: empresa ? empresa.nome : 'Empresa não encontrada',
                        empresa_id: controle.empresa_id,
                        controle_id: controle.id
                    });
                });
            } catch (error) {
                console.error('Erro ao processar lançamentos:', error);
            }
        }
    });
    
    // Ordenar por data (mais recente primeiro)
    todosLancamentos.sort((a, b) => new Date(b.data) - new Date(a.data));
    
    if (todosLancamentos.length === 0) {
        return '<div class="no-lancamentos-encontrados">📭 Nenhum lançamento encontrado para este período.</div>';
    }
    
    return todosLancamentos.map(lancamento => `
        <div class="lancamento-card" data-empresa="${lancamento.empresa_id}" data-data="${lancamento.data}">
            <div class="lancamento-header">
                <div class="lancamento-empresa">${lancamento.empresa_nome}</div>
                <div class="lancamento-data">${formatarData(lancamento.data)}</div>
            </div>
            
            <div class="lancamento-detalhes">
                <div class="marmitas-resumo">
                    <span>🍽️ P:${lancamento.qtd_pequena} M:${lancamento.qtd_media} G:${lancamento.qtd_grande}</span>
                    <span class="total-marmitas">${lancamento.qtd_pequena + lancamento.qtd_media + lancamento.qtd_grande} marmitas</span>
                </div>
                
                ${lancamento.extras && lancamento.extras.length > 0 ? `
                    <div class="extras-resumo">
                        <span>🥤 ${lancamento.extras.length} item(ns) extra(s)</span>
                        <span class="valor-extras">R$ ${lancamento.valor_extras.toFixed(2)}</span>
                    </div>
                ` : ''}
                
                <div class="valor-total-lancamento">
                    <strong>💰 R$ ${lancamento.valor_dia.toFixed(2)}</strong>
                </div>
            </div>
            
            <div class="lancamento-acoes">
                <button class="btn btn-small btn-secondary" onclick="editarLancamentoDia(${lancamento.empresa_id}, '${lancamento.data}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-small btn-danger" onclick="excluirLancamentoDia(${lancamento.empresa_id}, '${lancamento.data}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Filtrar lançamentos
function filtrarLancamentos() {
    const empresaSelecionada = document.getElementById('filtroEmpresa').value;
    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim = document.getElementById('dataFim').value;
    
    const cards = document.querySelectorAll('.lancamento-card');
    
    cards.forEach(card => {
        const empresaId = card.dataset.empresa;
        const dataLancamento = card.dataset.data;
        
        let mostrar = true;
        
        // Filtro por empresa
        if (empresaSelecionada && empresaId !== empresaSelecionada) {
            mostrar = false;
        }
        
        // Filtro por data
        if (dataInicio && dataLancamento < dataInicio) {
            mostrar = false;
        }
        
        if (dataFim && dataLancamento > dataFim) {
            mostrar = false;
        }
        
        card.style.display = mostrar ? 'block' : 'none';
    });
    
    calcularResumoGeral();
}

// Calcular resumo geral
function calcularResumoGeral() {
    const cardsVisiveis = document.querySelectorAll('.lancamento-card:not([style*="display: none"])');
    
    let totalDias = 0;
    let totalMarmitas = 0;
    let totalFaturado = 0;
    
    cardsVisiveis.forEach(card => {
        totalDias++;
        
        // Extrair dados do card (forma simples)
        const textoMarmitas = card.querySelector('.total-marmitas').textContent;
        const qtdMarmitas = parseInt(textoMarmitas.match(/\d+/)[0]) || 0;
        
        const textoValor = card.querySelector('.valor-total-lancamento strong').textContent;
        const valor = parseFloat(textoValor.replace('💰 R$ ', '').replace(',', '.')) || 0;
        
        totalMarmitas += qtdMarmitas;
        totalFaturado += valor;
    });
    
    document.getElementById('totalDias').textContent = totalDias;
    document.getElementById('totalMarmitas').textContent = totalMarmitas;
    document.getElementById('totalFaturado').textContent = `R$ ${totalFaturado.toFixed(2).replace('.', ',')}`;
}

// Novo lançamento rápido (sem empresa pré-selecionada)
function novoLancamentoRapido() {
    if (empresas.length === 0) {
        showNotification('Cadastre pelo menos uma empresa primeiro!', 'error');
        return;
    }
    
    const modalHTML = `
        <div class="modal-overlay" id="modalNovoRapido">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>🚀 Novo Lançamento Rápido</h2>
                    <button class="modal-close" onclick="closeNovoLancamentoRapido()">&times;</button>
                </div>
                
                <form id="formNovoRapido" class="modal-form">
                    <div class="form-group">
                        <label for="empresa_nova">🏢 Empresa:</label>
                        <select id="empresa_nova" required>
                            <option value="">Selecione a empresa</option>
                            ${empresas.map(emp => `<option value="${emp.id}">${emp.nome}</option>`).join('')}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="data_nova">📅 Data:</label>
                        <input type="date" id="data_nova" value="${new Date().toISOString().split('T')[0]}" required>
                    </div>
                    
                    <div class="form-group">
                        <label>🍽️ Marmitas:</label>
                        <div class="quantidades-grid">
                            <div class="quantidade-item">
                                <label>Pequena (P)</label>
                                <input type="number" id="qtd_p_nova" class="qtd-input" min="0" value="0" 
                                       onchange="calcularTotalNovo()" placeholder="0">
                                <span class="preco">R$ ${precos.P.toFixed(2)}</span>
                            </div>
                            
                            <div class="quantidade-item">
                                <label>Média (M)</label>
                                <input type="number" id="qtd_m_nova" class="qtd-input" min="0" value="0" 
                                       onchange="calcularTotalNovo()" placeholder="0">
                                <span class="preco">R$ ${precos.M.toFixed(2)}</span>
                            </div>
                            
                            <div class="quantidade-item">
                                <label>Grande (G)</label>
                                <input type="number" id="qtd_g_nova" class="qtd-input" min="0" value="0" 
                                       onchange="calcularTotalNovo()" placeholder="0">
                                <span class="preco">R$ ${precos.G.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <div class="total-rapido">
                            <label>💰 Total:</label>
                            <span id="valorTotalNovo">R$ 0,00</span>
                        </div>
                    </div>
                    
                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" onclick="closeNovoLancamentoRapido()">Cancelar</button>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i> Salvar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    document.getElementById('formNovoRapido').addEventListener('submit', async function(e) {
        e.preventDefault();
        await salvarNovoLancamentoRapido();
    });
}

// Funções auxiliares da página de lançamentos
function formatarData(data) {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}

function calcularTotalNovo() {
    const qtdP = parseInt(document.getElementById('qtd_p_nova').value) || 0;
    const qtdM = parseInt(document.getElementById('qtd_m_nova').value) || 0;
    const qtdG = parseInt(document.getElementById('qtd_g_nova').value) || 0;
    
    const total = (qtdP * precos.P) + (qtdM * precos.M) + (qtdG * precos.G);
    document.getElementById('valorTotalNovo').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

async function salvarNovoLancamentoRapido() {
    const empresaId = parseInt(document.getElementById('empresa_nova').value);
    const data = document.getElementById('data_nova').value;
    const qtdP = parseInt(document.getElementById('qtd_p_nova').value) || 0;
    const qtdM = parseInt(document.getElementById('qtd_m_nova').value) || 0;
    const qtdG = parseInt(document.getElementById('qtd_g_nova').value) || 0;
    
    if (!empresaId || !data) {
        showNotification('Empresa e data são obrigatórios!', 'error');
        return;
    }
    
    if (qtdP === 0 && qtdM === 0 && qtdG === 0) {
        showNotification('Informe pelo menos uma quantidade!', 'error');
        return;
    }
    
    // Simular salvamento (usar a mesma lógica do modal rápido)
    closeNovoLancamentoRapido();
    await modalLancamentoRapido(empresaId);
    
    showNotification('Use o modal que abriu para completar o lançamento!', 'info');
}

function editarLancamentoDia(empresaId, data) {
    closePaginaLancamentos();
    modalLancamentoRapido(empresaId);
}

function excluirLancamentoDia(empresaId, data) {
    if (confirm(`Confirma a exclusão do lançamento do dia ${formatarData(data)}?`)) {
        showNotification('Funcionalidade de exclusão em desenvolvimento!', 'info');
    }
}

function exportarLancamentos() {
    showNotification('Exportação em desenvolvimento!', 'info');
}

function closeNovoLancamentoRapido() {
    const modal = document.getElementById('modalNovoRapido');
    if (modal) modal.remove();
}

function closePaginaLancamentos() {
    const modal = document.getElementById('paginaLancamentos');
    if (modal) modal.remove();
}