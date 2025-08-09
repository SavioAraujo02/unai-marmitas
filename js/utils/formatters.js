// ===== FORMATADORES E UTILITÁRIOS DE FORMATAÇÃO =====

import { MONTH_NAMES } from '../config/constants.js';

/**
 * Formatação de moeda brasileira
 */
export const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
        return 'R$ 0,00';
    }
    
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

/**
 * Formatação de números simples
 */
export const formatNumber = (value, decimals = 0) => {
    if (value === null || value === undefined || isNaN(value)) {
        return '0';
    }
    
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value);
};

/**
 * Formatação de data brasileira
 */
export const formatDate = (date, format = 'pt-BR') => {
    if (!date) return '';
    
    if (typeof date === 'string') {
        date = new Date(date);
    }
    
    if (isNaN(date.getTime())) {
        return '';
    }
    
    return new Intl.DateTimeFormat(format).format(date);
};

/**
 * Formatação de data para exibição (dd/mm/aaaa)
 */
export const formatDateBR = (dateString) => {
    if (!dateString) return '';
    
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
};

/**
 * Formatação de período (mês/ano)
 */
export const formatPeriod = (monthYear) => {
    if (!monthYear) return '';
    
    const [year, month] = monthYear.split('-');
    const monthIndex = parseInt(month) - 1;
    
    if (monthIndex < 0 || monthIndex > 11) {
        return monthYear;
    }
    
    return `${MONTH_NAMES[monthIndex]}/${year}`;
};

/**
 * Formatação de telefone brasileiro
 */
export const formatPhone = (phone) => {
    if (!phone) return '';
    
    // Remove tudo que não é número
    const numbers = phone.replace(/\D/g, '');
    
    // Aplica máscara baseada no tamanho
    if (numbers.length === 11) {
        return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (numbers.length === 10) {
        return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    
    return phone;
};

/**
 * Formatação de texto para título (primeira letra maiúscula)
 */
export const formatTitle = (text) => {
    if (!text) return '';
    
    return text.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Formatação de texto para slug (URL amigável)
 */
export const formatSlug = (text) => {
    if (!text) return '';
    
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
        .replace(/\s+/g, '-') // Substitui espaços por hífens
        .replace(/-+/g, '-') // Remove hífens duplicados
        .trim();
};

/**
 * Formatação de tamanho de arquivo
 */
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Formatação de tempo decorrido
 */
export const formatTimeAgo = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now - past) / 1000);
    
    if (diffInSeconds < 60) {
        return 'agora mesmo';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} minuto${minutes > 1 ? 's' : ''} atrás`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} hora${hours > 1 ? 's' : ''} atrás`;
    } else {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} dia${days > 1 ? 's' : ''} atrás`;
    }
};

/**
 * Formatação de porcentagem
 */
export const formatPercentage = (value, decimals = 1) => {
    if (value === null || value === undefined || isNaN(value)) {
        return '0%';
    }
    
    return `${formatNumber(value, decimals)}%`;
};

/**
 * Formatação de texto truncado
 */
export const formatTruncate = (text, maxLength = 50, suffix = '...') => {
    if (!text) return '';
    
    if (text.length <= maxLength) {
        return text;
    }
    
    return text.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Formatação de lista para texto
 */
export const formatList = (items, separator = ', ', lastSeparator = ' e ') => {
    if (!Array.isArray(items) || items.length === 0) {
        return '';
    }
    
    if (items.length === 1) {
        return items[0];
    }
    
    if (items.length === 2) {
        return items.join(lastSeparator);
    }
    
    const allButLast = items.slice(0, -1);
    const last = items[items.length - 1];
    
    return allButLast.join(separator) + lastSeparator + last;
};