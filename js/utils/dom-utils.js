// ===== UTILITÁRIOS DE MANIPULAÇÃO DO DOM =====

/**
 * Criar elemento HTML com atributos e conteúdo
 */
export const createElement = (tag, attributes = {}, content = '') => {
    const element = document.createElement(tag);
    
    // Adicionar atributos
    Object.keys(attributes).forEach(key => {
        if (key === 'className') {
            element.className = attributes[key];
        } else if (key === 'innerHTML') {
            element.innerHTML = attributes[key];
        } else if (key === 'textContent') {
            element.textContent = attributes[key];
        } else {
            element.setAttribute(key, attributes[key]);
        }
    });
    
    // Adicionar conteúdo
    if (content) {
        if (typeof content === 'string') {
            element.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            element.appendChild(content);
        }
    }
    
    return element;
};

/**
 * Adicionar classe com animação
 */
export const addClassWithAnimation = (element, className, duration = 300) => {
    if (!element) return;
    
    element.classList.add(className);
    
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, duration);
    });
};

/**
 * Remover classe com animação
 */
export const removeClassWithAnimation = (element, className, duration = 300) => {
    if (!element) return;
    
    return new Promise(resolve => {
        setTimeout(() => {
            element.classList.remove(className);
            resolve();
        }, duration);
    });
};

/**
 * Animar entrada de elemento
 */
export const animateIn = (element, animationClass = 'fade-in') => {
    if (!element) return;
    
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    element.classList.add(animationClass);
    
    requestAnimationFrame(() => {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
    });
};

/**
 * Animar saída de elemento
 */
export const animateOut = (element, animationClass = 'fade-out') => {
    if (!element) return Promise.resolve();
    
    return new Promise(resolve => {
        element.classList.add(animationClass);
        element.style.opacity = '0';
        element.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            resolve();
        }, 300);
    });
};

/**
 * Encontrar elemento pai com classe específica
 */
export const findParentWithClass = (element, className) => {
    let current = element;
    
    while (current && current !== document.body) {
        if (current.classList && current.classList.contains(className)) {
            return current;
        }
        current = current.parentElement;
    }
    
    return null;
};

/**
 * Verificar se elemento está visível na tela
 */
export const isElementVisible = (element) => {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;
    
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= windowHeight &&
        rect.right <= windowWidth
    );
};

/**
 * Rolar suavemente para elemento
 */
export const scrollToElement = (element, offset = 0) => {
    if (!element) return;
    
    const elementPosition = element.offsetTop - offset;
    
    window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
    });
};

/**
 * Copiar texto para clipboard
 */
export const copyToClipboard = async (text) => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        // Fallback para navegadores mais antigos
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            return true;
        } catch (err) {
            return false;
        } finally {
            document.body.removeChild(textArea);
        }
    }
};

/**
 * Criar efeito ripple em botão
 */
export const createRippleEffect = (button, event) => {
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: ripple 0.6s linear;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        pointer-events: none;
    `;
    
    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    button.appendChild(ripple);
    
    setTimeout(() => {
        if (ripple.parentNode) {
            ripple.parentNode.removeChild(ripple);
        }
    }, 600);
};

/**
 * Detectar clique fora do elemento
 */
export const onClickOutside = (element, callback) => {
    const handleClick = (event) => {
        if (!element.contains(event.target)) {
            callback(event);
        }
    };
    
    document.addEventListener('click', handleClick);
    
    // Retorna função para remover o listener
    return () => {
        document.removeEventListener('click', handleClick);
    };
};

/**
 * Debounce para funções
 */
export const debounce = (func, delay) => {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
};

/**
 * Throttle para funções
 */
export const throttle = (func, delay) => {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, delay);
        }
    };
};

/**
 * Gerar ID único
 */
export const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Detectar dispositivo móvel
 */
export const isMobile = () => {
    return window.innerWidth <= 768;
};

/**
 * Detectar se é touch device
 */
export const isTouchDevice = () => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

/**
 * Obter posição do mouse/touch
 */
export const getEventPosition = (event) => {
    if (event.touches && event.touches.length > 0) {
        return {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY
        };
    }
    
    return {
        x: event.clientX,
        y: event.clientY
    };
};

/**
 * Animar número (contador)
 */
export const animateNumber = (element, start, end, duration = 1000, formatter = null) => {
    if (!element) return;
    
    const startTime = performance.now();
    
    const updateNumber = (currentTime) => {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        
        // Easing function (ease out cubic)
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        
        const current = start + (end - start) * easeOutCubic;
        
        if (formatter) {
            element.textContent = formatter(current);
        } else {
            element.textContent = Math.round(current);
        }
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    };
    
    requestAnimationFrame(updateNumber);
};

/**
 * Criar loading spinner
 */
export const createLoadingSpinner = (size = 'medium') => {
    const spinner = createElement('div', {
        className: `loading-spinner loading-spinner-${size}`
    });
    
    const inner = createElement('div', {
        className: 'loading-spinner-inner'
    });
    
    spinner.appendChild(inner);
    return spinner;
};

/**
 * Mostrar/esconder loading em elemento
 */
export const toggleLoading = (element, show = true) => {
    if (!element) return;
    
    if (show) {
        element.classList.add('loading');
        const spinner = createLoadingSpinner();
        spinner.classList.add('element-loading-spinner');
        element.appendChild(spinner);
    } else {
        element.classList.remove('loading');
        const spinner = element.querySelector('.element-loading-spinner');
        if (spinner) {
            spinner.remove();
        }
    }
};