// ===== FUNÇÕES DE COMPATIBILIDADE TEMPORÁRIA =====

// Funções que ainda não foram migradas para a nova estrutura
window.gerarTemplate = function(empresaId) {
    console.log('gerarTemplate chamado para empresa:', empresaId);
    if (window.NotificationManager) {
        window.NotificationManager.info('Funcionalidade de template será implementada em breve!');
    }
};

window.gerarPDF = function(empresaId) {
    console.log('gerarPDF chamado para empresa:', empresaId);
    if (window.NotificationManager) {
        window.NotificationManager.info('Funcionalidade de PDF será implementada em breve!');
    }
};

window.showNotification = function(message, type = 'info') {
    if (window.NotificationManager) {
        window.NotificationManager.show(message, type);
    } else {
        alert(message);
    }
};

// Outras funções que podem ser chamadas pelos event handlers inline
window.modalLancamentoRapido = function(empresaId) {
    if (window.app) {
        window.app.modalLancamentoRapido(empresaId);
    }
};

window.editarEmpresa = function(empresaId) {
    if (window.app) {
        window.app.editarEmpresa(empresaId);
    }
};

window.avancarStatusProximo = function(empresaId) {
    if (window.app) {
        window.app.avancarStatusProximo(empresaId);
    }
};

window.avancarStatusDireto = function(empresaId, status) {
    if (window.app) {
        window.app.avancarStatusDireto(empresaId, status);
    }
};

console.log('✅ Funções de compatibilidade carregadas');