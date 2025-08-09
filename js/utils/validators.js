// ===== VALIDADORES E UTILITÁRIOS DE VALIDAÇÃO =====

import { VALIDATION_RULES } from '../config/constants.js';

/**
 * Validação de email
 */
export const validateEmail = (email) => {
    if (!email || typeof email !== 'string') {
        return false;
    }
    
    return VALIDATION_RULES.EMAIL_REGEX.test(email.trim());
};

/**
 * Validação de telefone
 */
export const validatePhone = (phone) => {
    if (!phone || typeof phone !== 'string') {
        return false;
    }
    
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= 10 && cleanPhone.length <= 11;
};

/**
 * Validação de campo obrigatório
 */
export const validateRequired = (value) => {
    if (value === null || value === undefined) {
        return false;
    }
    
    if (typeof value === 'string') {
        return value.trim().length > 0;
    }
    
    if (typeof value === 'number') {
        return !isNaN(value);
    }
    
    return Boolean(value);
};

/**
 * Validação de tamanho mínimo
 */
export const validateMinLength = (value, minLength) => {
    if (!value || typeof value !== 'string') {
        return false;
    }
    
    return value.trim().length >= minLength;
};

/**
 * Validação de tamanho máximo
 */
export const validateMaxLength = (value, maxLength) => {
    if (!value || typeof value !== 'string') {
        return true; // Se não tem valor, não viola o máximo
    }
    
    return value.trim().length <= maxLength;
};

/**
 * Validação de número positivo
 */
export const validatePositiveNumber = (value) => {
    const num = parseFloat(value);
    return !isNaN(num) && num > 0;
};

/**
 * Validação de número não negativo
 */
export const validateNonNegativeNumber = (value) => {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0;
};

/**
 * Validação de data
 */
export const validateDate = (dateString) => {
    if (!dateString) return false;
    
    const date = new Date(dateString);
    return !isNaN(date.getTime());
};

/**
 * Validação de data não futura
 */
export const validateDateNotFuture = (dateString) => {
    if (!validateDate(dateString)) return false;
    
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Fim do dia atual
    
    return date <= today;
};

/**
 * Validação de período (YYYY-MM)
 */
export const validatePeriod = (period) => {
    if (!period || typeof period !== 'string') {
        return false;
    }
    
    const regex = /^\d{4}-\d{2}$/;
    if (!regex.test(period)) {
        return false;
    }
    
    const [year, month] = period.split('-');
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    
    return yearNum >= 2020 && yearNum <= 2030 && monthNum >= 1 && monthNum <= 12;
};

/**
 * Validação de nome de empresa
 */
export const validateEmpresaName = (name) => {
    if (!validateRequired(name)) {
        return { valid: false, message: 'Nome da empresa é obrigatório' };
    }
    
    if (!validateMinLength(name, VALIDATION_RULES.MIN_EMPRESA_NAME)) {
        return { 
            valid: false, 
            message: `Nome deve ter pelo menos ${VALIDATION_RULES.MIN_EMPRESA_NAME} caracteres` 
        };
    }
    
    if (!validateMaxLength(name, VALIDATION_RULES.MAX_EMPRESA_NAME)) {
        return { 
            valid: false, 
            message: `Nome deve ter no máximo ${VALIDATION_RULES.MAX_EMPRESA_NAME} caracteres` 
        };
    }
    
    return { valid: true };
};

/**
 * Validação completa de empresa
 */
export const validateEmpresa = (empresa) => {
    const errors = {};
    
    // Validar nome
    const nameValidation = validateEmpresaName(empresa.nome);
    if (!nameValidation.valid) {
        errors.nome = nameValidation.message;
    }
    
    // Validar email (se fornecido)
    if (empresa.email && !validateEmail(empresa.email)) {
        errors.email = 'Email inválido';
    }
    
    // Validar telefone (se fornecido)
    if (empresa.telefone && !validatePhone(empresa.telefone)) {
        errors.telefone = 'Telefone inválido';
    }
    
    return {
        valid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Validação de lançamento
 */
export const validateLancamento = (lancamento) => {
    const errors = {};
    
    // Validar data
    if (!validateDate(lancamento.data)) {
        errors.data = 'Data inválida';
    } else if (!validateDateNotFuture(lancamento.data)) {
        errors.data = 'Data não pode ser futura';
    }
    
    // Validar quantidades
    const qtdP = parseInt(lancamento.qtd_pequena) || 0;
    const qtdM = parseInt(lancamento.qtd_media) || 0;
    const qtdG = parseInt(lancamento.qtd_grande) || 0;
    
    if (qtdP < 0 || qtdM < 0 || qtdG < 0) {
        errors.quantidades = 'Quantidades não podem ser negativas';
    }
    
    if (qtdP === 0 && qtdM === 0 && qtdG === 0) {
        // Verificar se tem extras
        const hasExtras = lancamento.extras && 
                          Array.isArray(lancamento.extras) && 
                          lancamento.extras.length > 0;
        
        if (!hasExtras) {
            errors.quantidades = 'Informe pelo menos uma quantidade ou item extra';
        }
    }
    
    // Validar extras (se houver)
    if (lancamento.extras && Array.isArray(lancamento.extras)) {
        lancamento.extras.forEach((extra, index) => {
            if (!extra.descricao || !extra.descricao.trim()) {
                errors[`extra_${index}_descricao`] = 'Descrição do extra é obrigatória';
            }
            
            if (!validatePositiveNumber(extra.quantidade)) {
                errors[`extra_${index}_quantidade`] = 'Quantidade deve ser maior que zero';
            }
            
            if (!validatePositiveNumber(extra.valor_unitario)) {
                errors[`extra_${index}_valor`] = 'Valor deve ser maior que zero';
            }
        });
    }
    
    return {
        valid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Sanitização de input (remove caracteres perigosos)
 */
export const sanitizeInput = (input) => {
    if (!input || typeof input !== 'string') {
        return '';
    }
    
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
};

/**
 * Validação de arquivo
 */
export const validateFile = (file, allowedTypes = [], maxSize = null) => {
    const errors = [];
    
    if (!file) {
        errors.push('Nenhum arquivo selecionado');
        return { valid: false, errors };
    }
    
    // Validar tipo
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
        errors.push(`Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(', ')}`);
    }
    
    // Validar tamanho
    if (maxSize && file.size > maxSize) {
        errors.push(`Arquivo muito grande. Tamanho máximo: ${formatFileSize(maxSize)}`);
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
};