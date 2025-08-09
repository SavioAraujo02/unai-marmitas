// ===== UTILITÁRIOS DE DATA E TEMPO =====

import { MONTH_NAMES } from '../config/constants.js';

/**
 * Obter data atual no formato YYYY-MM-DD
 */
export const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
};

/**
 * Obter período atual (YYYY-MM)
 */
export const getCurrentPeriod = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
};

/**
 * Obter primeiro dia do mês
 */
export const getFirstDayOfMonth = (period) => {
    if (!period) period = getCurrentPeriod();
    return `${period}-01`;
};

/**
 * Obter último dia do mês
 */
export const getLastDayOfMonth = (period) => {
    if (!period) period = getCurrentPeriod();
    
    const [year, month] = period.split('-');
    const lastDay = new Date(year, month, 0).getDate();
    return `${period}-${String(lastDay).padStart(2, '0')}`;
};

/**
 * Obter nome do mês por número
 */
export const getMonthName = (monthNumber) => {
    const index = parseInt(monthNumber) - 1;
    return MONTH_NAMES[index] || '';
};

/**
 * Obter texto formatado do período
 */
export const getPeriodText = (period) => {
    if (!period) return '';
    
    const [year, month] = period.split('-');
    return `${getMonthName(month)}/${year}`;
};

/**
 * Verificar se data é hoje
 */
export const isToday = (dateString) => {
    if (!dateString) return false;
    return dateString === getCurrentDate();
};

/**
 * Verificar se data é no passado
 */
export const isPastDate = (dateString) => {
    if (!dateString) return false;
    return dateString < getCurrentDate();
};

/**
 * Verificar se data é no futuro
 */
export const isFutureDate = (dateString) => {
    if (!dateString) return false;
    return dateString > getCurrentDate();
};

/**
 * Calcular diferença em dias
 */
export const getDaysDifference = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Adicionar dias a uma data
 */
export const addDays = (dateString, days) => {
    const date = new Date(dateString);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
};

/**
 * Subtrair dias de uma data
 */
export const subtractDays = (dateString, days) => {
    return addDays(dateString, -days);
};

/**
 * Obter dias da semana de uma data
 */
export const getDayOfWeek = (dateString) => {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const date = new Date(dateString);
    return days[date.getDay()];
};

/**
 * Verificar se é fim de semana
 */
export const isWeekend = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDay();
    return day === 0 || day === 6; // Domingo ou Sábado
};

/**
 * Obter todas as datas de um período
 */
export const getDatesInPeriod = (period) => {
    const firstDay = getFirstDayOfMonth(period);
    const lastDay = getLastDayOfMonth(period);
    
    const dates = [];
    let currentDate = new Date(firstDay);
    const endDate = new Date(lastDay);
    
    while (currentDate <= endDate) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
};

/**
 * Obter dias úteis de um período (excluindo fins de semana)
 */
export const getBusinessDaysInPeriod = (period) => {
    const allDates = getDatesInPeriod(period);
    return allDates.filter(date => !isWeekend(date));
};

/**
 * Formatar data para exibição brasileira
 */
export const formatDateBR = (dateString, includeWeekDay = false) => {
    if (!dateString) return '';
    
    const [year, month, day] = dateString.split('-');
    let formatted = `${day}/${month}/${year}`;
    
    if (includeWeekDay) {
        const weekDay = getDayOfWeek(dateString);
        formatted = `${weekDay}, ${formatted}`;
    }
    
    return formatted;
};

/**
 * Formatar data para input HTML
 */
export const formatDateForInput = (date) => {
    if (!date) return '';
    if (typeof date === 'string') {
        return date;
    }
    
    if (date instanceof Date) {
        return date.toISOString().split('T')[0];
    }
    
    return '';
};

/**
 * Converter data brasileira (dd/mm/yyyy) para formato ISO (yyyy-mm-dd)
 */
export const convertBRDateToISO = (brDate) => {
    if (!brDate) return '';
    
    const parts = brDate.split('/');
    if (parts.length !== 3) return '';
    
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

/**
 * Obter idade em anos
 */
export const getAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
};

/**
 * Verificar se ano é bissexto
 */
export const isLeapYear = (year) => {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
};

/**
 * Obter número de dias no mês
 */
export const getDaysInMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
};

/**
 * Obter próximo período (mês seguinte)
 */
export const getNextPeriod = (period) => {
    if (!period) period = getCurrentPeriod();
    
    const [year, month] = period.split('-');
    const date = new Date(year, month - 1); // month - 1 porque Date usa 0-11
    date.setMonth(date.getMonth() + 1);
    
    const newYear = date.getFullYear();
    const newMonth = String(date.getMonth() + 1).padStart(2, '0');
    
    return `${newYear}-${newMonth}`;
};

/**
 * Obter período anterior (mês anterior)
 */
export const getPreviousPeriod = (period) => {
    if (!period) period = getCurrentPeriod();
    
    const [year, month] = period.split('-');
    const date = new Date(year, month - 1);
    date.setMonth(date.getMonth() - 1);
    
    const newYear = date.getFullYear();
    const newMonth = String(date.getMonth() + 1).padStart(2, '0');
    
    return `${newYear}-${newMonth}`;
};

/**
 * Gerar lista de períodos (últimos N meses)
 */
export const generatePeriodList = (count = 12) => {
    const periods = [];
    let currentPeriod = getCurrentPeriod();
    
    for (let i = 0; i < count; i++) {
        periods.push({
            value: currentPeriod,
            text: getPeriodText(currentPeriod)
        });
        currentPeriod = getPreviousPeriod(currentPeriod);
    }
    
    return periods;
};

/**
 * Verificar se período é válido
 */
export const isValidPeriod = (period) => {
    if (!period || typeof period !== 'string') return false;
    
    const regex = /^\d{4}-\d{2}$/;
    if (!regex.test(period)) return false;
    
    const [year, month] = period.split('-');
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    
    return yearNum >= 2020 && yearNum <= 2030 && monthNum >= 1 && monthNum <= 12;
};

/**
 * Obter timestamp atual
 */
export const getCurrentTimestamp = () => {
    return Date.now();
};

/**
 * Converter timestamp para data
 */
export const timestampToDate = (timestamp) => {
    return new Date(timestamp).toISOString().split('T')[0];
};

/**
 * Obter tempo decorrido em formato legível
 */
export const getTimeElapsed = (startTime) => {
    const elapsed = Date.now() - startTime;
    
    if (elapsed < 1000) {
        return `${elapsed}ms`;
    } else if (elapsed < 60000) {
        return `${Math.round(elapsed / 1000)}s`;
    } else if (elapsed < 3600000) {
        return `${Math.round(elapsed / 60000)}min`;
    } else {
        return `${Math.round(elapsed / 3600000)}h`;
    }
};

/**
 * Criar range de datas
 */
export const createDateRange = (startDate, endDate) => {
    const dates = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    
    while (currentDate <= end) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
};