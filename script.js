// Authentication and Application State
const AuthState = {
    isLoggedIn: false,
    currentUser: null,
    loginTime: null,
    currentTheme: localStorage.getItem('theme') || 'dark',
    settings: {
        animations: localStorage.getItem('animations') !== 'false',
        sound: localStorage.getItem('sound') === 'true',
        contrast: localStorage.getItem('contrast') === 'true',
        reducedMotion: localStorage.getItem('reducedMotion') === 'true'
    }
};

// Application State
const AppState = {
    currentTheme: 'dark',
    tools: [],
    filteredTools: [],
    searchTerm: '',
    isLoading: true
};

// DOM Elements
const DOM = {
    // Login Elements
    loginScreen: null,
    mainApp: null,
    loginForm: null,
    raInput: null,
    passwordInput: null,
    termsCheckbox: null,
    loginBtn: null,
    togglePassword: null,
    openTermsBtn: null,
    
    // Main App Elements
    searchInput: null,
    clearSearch: null,
    toolsGrid: null,
    noResults: null,
    toast: null,
    toastMessage: null,
    themeButtons: null,
    userRADisplay: null,
    logoutBtn: null,
    
    // Modal Elements
    termsModal: null,
    closeTermsBtn: null,
    acceptTermsBtn: null,
    declineTermsBtn: null,
    expandTermsBtn: null,
    expandedContent: null,
    footerTermsBtn: null,
    
    // Settings Elements
    settingsModal: null,
    settingsBtn: null,
    closeSettingsBtn: null,
    themeOptions: null,
    animationsToggle: null,
    soundToggle: null,
    contrastToggle: null,
    motionToggle: null,
    resetSettingsBtn: null
};

// Initialize DOM references
function initializeDOM() {
    // Login Elements
    DOM.loginScreen = document.getElementById('loginScreen');
    DOM.mainApp = document.getElementById('mainApp');
    DOM.loginForm = document.getElementById('loginForm');
    DOM.raInput = document.getElementById('raInput');
    DOM.passwordInput = document.getElementById('passwordInput');
    DOM.termsCheckbox = document.getElementById('termsCheckbox');
    DOM.loginBtn = document.getElementById('loginBtn');
    DOM.togglePassword = document.getElementById('togglePassword');
    DOM.openTermsBtn = document.getElementById('openTermsBtn');
    
    // Main App Elements
    DOM.searchInput = document.getElementById('searchInput');
    DOM.clearSearch = document.getElementById('clearSearch');
    DOM.toolsGrid = document.getElementById('toolsGrid');
    DOM.noResults = document.getElementById('noResults');
    DOM.toast = document.getElementById('toast');
    DOM.toastMessage = document.getElementById('toastMessage');
    DOM.themeButtons = document.querySelectorAll('.theme-btn');
    DOM.userRADisplay = document.getElementById('userRADisplay');
    DOM.logoutBtn = document.getElementById('logoutBtn');
    
    // Modal Elements
    DOM.termsModal = document.getElementById('termsModal');
    DOM.closeTermsBtn = document.getElementById('closeTermsBtn');
    DOM.acceptTermsBtn = document.getElementById('acceptTermsBtn');
    DOM.declineTermsBtn = document.getElementById('declineTermsBtn');
    DOM.expandTermsBtn = document.getElementById('expandTermsBtn');
    DOM.expandedContent = document.getElementById('expandedContent');
    DOM.footerTermsBtn = document.getElementById('footerTermsBtn');
    
    // Settings Elements
    DOM.settingsModal = document.getElementById('settingsModal');
    DOM.settingsBtn = document.getElementById('settingsBtn');
    DOM.closeSettingsBtn = document.getElementById('closeSettingsBtn');
    DOM.themeOptions = document.querySelectorAll('.theme-option');
    DOM.animationsToggle = document.getElementById('animationsToggle');
    DOM.soundToggle = document.getElementById('soundToggle');
    DOM.contrastToggle = document.getElementById('contrastToggle');
    DOM.motionToggle = document.getElementById('motionToggle');
    DOM.resetSettingsBtn = document.getElementById('resetSettingsBtn');
}

// Authentication Manager
class AuthManager {
    constructor() {
        this.storageKey = 'edu-tools-auth';
    }

    initialize() {
        this.checkStoredAuth();
        this.setupEventListeners();
    }

    checkStoredAuth() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const authData = JSON.parse(stored);
                const now = Date.now();
                const oneWeek = 7 * 24 * 60 * 60 * 1000;
                
                // Check if auth is still valid (1 week)
                if (now - authData.loginTime < oneWeek) {
                    AuthState.isLoggedIn = true;
                    AuthState.currentUser = authData.user;
                    AuthState.loginTime = authData.loginTime;
                    this.showMainApp();
                    return;
                }
            }
        } catch (error) {
            console.warn('Error checking stored auth:', error);
        }
        
        this.showLoginScreen();
    }

    setupEventListeners() {
        // Login form
        DOM.loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Toggle password visibility
        DOM.togglePassword.addEventListener('click', () => {
            this.togglePasswordVisibility();
        });

        // Terms modal
        DOM.openTermsBtn.addEventListener('click', () => {
            this.openTermsModal();
        });

        DOM.footerTermsBtn?.addEventListener('click', () => {
            this.openTermsModal();
        });

        // Logout
        DOM.logoutBtn.addEventListener('click', () => {
            this.handleLogout();
        });
        
        // Settings
        DOM.settingsBtn?.addEventListener('click', () => {
            SettingsManager.openModal();
        });
    }

    async handleLogin() {
        const ra = DOM.raInput.value.trim();
        const password = DOM.passwordInput.value.trim();
        const termsAccepted = DOM.termsCheckbox.checked;

        // Validation
        if (!ra || !password) {
            this.showToast('Por favor, preencha todos os campos', 'error');
            return;
        }

        if (!termsAccepted) {
            this.showToast('Você deve aceitar os termos de uso', 'warning');
            return;
        }

        // Simulate login loading
        DOM.loginBtn.disabled = true;
        DOM.loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Since it's a fictional login, any credentials work
        const userData = {
            ra: ra,
            loginTime: Date.now()
        };

        try {
            localStorage.setItem(this.storageKey, JSON.stringify({
                user: userData,
                loginTime: userData.loginTime
            }));
        } catch (error) {
            console.warn('Could not store auth data:', error);
        }

        AuthState.isLoggedIn = true;
        AuthState.currentUser = userData;
        AuthState.loginTime = userData.loginTime;

        this.showToast('Login realizado com sucesso!', 'success');
        
        // Short delay before transition
        setTimeout(() => {
            this.showMainApp();
            DOM.loginBtn.disabled = false;
            DOM.loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar';
        }, 800);
    }

    handleLogout() {
        try {
            localStorage.removeItem(this.storageKey);
        } catch (error) {
            console.warn('Could not remove auth data:', error);
        }

        AuthState.isLoggedIn = false;
        AuthState.currentUser = null;
        AuthState.loginTime = null;

        this.showToast('Logout realizado com sucesso!', 'success');
        
        setTimeout(() => {
            this.showLoginScreen();
            this.resetLoginForm();
        }, 500);
    }

    togglePasswordVisibility() {
        const type = DOM.passwordInput.type === 'password' ? 'text' : 'password';
        DOM.passwordInput.type = type;
        
        const icon = DOM.togglePassword.querySelector('i');
        icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
    }

    openTermsModal() {
        DOM.termsModal.classList.add('visible');
        document.body.style.overflow = 'hidden';
    }

    closeTermsModal() {
        DOM.termsModal.classList.remove('visible');
        document.body.style.overflow = '';
    }

    showLoginScreen() {
        DOM.loginScreen.classList.remove('hidden');
        DOM.mainApp.classList.add('hidden');
        document.body.style.overflow = '';
    }

    showMainApp() {
        DOM.loginScreen.classList.add('hidden');
        DOM.mainApp.classList.remove('hidden');
        
        // Update user display
        if (AuthState.currentUser) {
            DOM.userRADisplay.textContent = `RA: ${AuthState.currentUser.ra}`;
        }
    }

    resetLoginForm() {
        DOM.loginForm.reset();
        DOM.passwordInput.type = 'password';
        DOM.togglePassword.querySelector('i').className = 'fas fa-eye';
    }

    showToast(message, type = 'success') {
        DOM.toastMessage.textContent = message;
        DOM.toast.className = `toast ${type} visible`;

        setTimeout(() => {
            this.hideToast();
        }, 3000);
    }

    hideToast() {
        DOM.toast.classList.remove('visible');
    }
}

// Terms Modal Manager
class TermsModalManager {
    constructor() {
        this.isExpanded = false;
    }

    initialize() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Close modal
        DOM.closeTermsBtn.addEventListener('click', () => {
            authManager.closeTermsModal();
        });

        DOM.declineTermsBtn.addEventListener('click', () => {
            authManager.closeTermsModal();
        });

        // Accept terms
        DOM.acceptTermsBtn.addEventListener('click', () => {
            DOM.termsCheckbox.checked = true;
            authManager.closeTermsModal();
            authManager.showToast('Termos aceitos com sucesso!', 'success');
            // Auto hide toast after 3 seconds
            setTimeout(() => {
                authManager.hideToast();
            }, 3000);
        });

        // Expand/collapse detailed terms
        DOM.expandTermsBtn.addEventListener('click', () => {
            this.toggleExpandedTerms();
        });

        // Click outside to close
        DOM.termsModal.addEventListener('click', (e) => {
            if (e.target === DOM.termsModal) {
                authManager.closeTermsModal();
            }
        });

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && DOM.termsModal.classList.contains('visible')) {
                authManager.closeTermsModal();
            }
        });
    }

    toggleExpandedTerms() {
        this.isExpanded = !this.isExpanded;
        
        DOM.expandedContent.classList.toggle('visible', this.isExpanded);
        DOM.expandTermsBtn.classList.toggle('expanded', this.isExpanded);
        
        const text = this.isExpanded ? 'Ocultar termos detalhados' : 'Ver termos detalhados';
        DOM.expandTermsBtn.innerHTML = `<i class="fas fa-chevron-down"></i> ${text}`;
    }
}

// Settings Manager
class SettingsManager {
    static initialize() {
        this.setupEventListeners();
        this.loadSettings();
        this.applyTheme(AuthState.currentTheme);
        this.applySettings();
    }

    static setupEventListeners() {
        // Settings modal
        DOM.closeSettingsBtn?.addEventListener('click', () => {
            this.closeModal();
        });

        // Theme selection
        DOM.themeOptions.forEach(option => {
            option.addEventListener('click', () => {
                const theme = option.dataset.theme;
                this.setTheme(theme);
            });
        });

        // Toggles
        DOM.animationsToggle?.addEventListener('click', () => {
            this.toggleSetting('animations');
        });

        DOM.soundToggle?.addEventListener('click', () => {
            this.toggleSetting('sound');
        });

        DOM.contrastToggle?.addEventListener('click', () => {
            this.toggleSetting('contrast');
        });

        DOM.motionToggle?.addEventListener('click', () => {
            this.toggleSetting('reducedMotion');
        });

        // Reset settings
        DOM.resetSettingsBtn?.addEventListener('click', () => {
            this.resetSettings();
        });

        // Close modal on outside click
        DOM.settingsModal?.addEventListener('click', (e) => {
            if (e.target === DOM.settingsModal) {
                this.closeModal();
            }
        });
    }

    static openModal() {
        DOM.settingsModal.classList.add('visible');
        this.updateUI();
    }

    static closeModal() {
        DOM.settingsModal.classList.remove('visible');
    }

    static setTheme(theme) {
        AuthState.currentTheme = theme;
        localStorage.setItem('theme', theme);
        this.applyTheme(theme);
        this.updateUI();
        authManager.showToast(`Tema alterado para ${this.getThemeName(theme)}`, 'success');
    }

    static getThemeName(theme) {
        const names = {
            light: 'Claro',
            dark: 'Escuro',
            cloudy: 'Nublado',
            ocean: 'Oceano',
            forest: 'Floresta',
            purple: 'Roxo',
            sunset: 'Pôr do Sol',
            rose: 'Rosa'
        };
        return names[theme] || theme;
    }

    static applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    }

    static toggleSetting(setting) {
        AuthState.settings[setting] = !AuthState.settings[setting];
        localStorage.setItem(setting, AuthState.settings[setting]);
        this.applySettings();
        this.updateUI();
        
        const settingNames = {
            animations: 'Animações',
            sound: 'Efeitos sonoros',
            contrast: 'Alto contraste',
            reducedMotion: 'Reduzir movimento'
        };
        
        const status = AuthState.settings[setting] ? 'ativado' : 'desativado';
        authManager.showToast(`${settingNames[setting]} ${status}`, 'success');
    }

    static applySettings() {
        // Apply animations
        document.documentElement.setAttribute(
            'data-animations', 
            AuthState.settings.animations ? 'enabled' : 'disabled'
        );

        // Apply reduced motion
        if (AuthState.settings.reducedMotion) {
            document.documentElement.style.setProperty('--animation-duration', '0s');
        } else {
            document.documentElement.style.removeProperty('--animation-duration');
        }

        // Apply high contrast
        if (AuthState.settings.contrast) {
            document.body.classList.add('high-contrast');
        } else {
            document.body.classList.remove('high-contrast');
        }
    }

    static updateUI() {
        // Update theme selection
        DOM.themeOptions.forEach(option => {
            if (option.dataset.theme === AuthState.currentTheme) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });

        // Update toggles
        this.updateToggle(DOM.animationsToggle, AuthState.settings.animations);
        this.updateToggle(DOM.soundToggle, AuthState.settings.sound);
        this.updateToggle(DOM.contrastToggle, AuthState.settings.contrast);
        this.updateToggle(DOM.motionToggle, AuthState.settings.reducedMotion);
    }

    static updateToggle(toggle, active) {
        if (toggle) {
            if (active) {
                toggle.classList.add('active');
            } else {
                toggle.classList.remove('active');
            }
        }
    }

    static loadSettings() {
        // Load all settings from localStorage
        AuthState.settings.animations = localStorage.getItem('animations') !== 'false';
        AuthState.settings.sound = localStorage.getItem('sound') === 'true';
        AuthState.settings.contrast = localStorage.getItem('contrast') === 'true';
        AuthState.settings.reducedMotion = localStorage.getItem('reducedMotion') === 'true';
    }

    static resetSettings() {
        // Reset to defaults
        AuthState.currentTheme = 'dark';
        AuthState.settings = {
            animations: true,
            sound: false,
            contrast: false,
            reducedMotion: false
        };

        // Clear localStorage
        localStorage.removeItem('theme');
        localStorage.removeItem('animations');
        localStorage.removeItem('sound');
        localStorage.removeItem('contrast');
        localStorage.removeItem('reducedMotion');

        // Apply defaults
        this.applyTheme('dark');
        this.applySettings();
        this.updateUI();

        authManager.showToast('Configurações restauradas para o padrão', 'success');
    }
}

// Theme Management (Enhanced for login state)
class ThemeManager {
    constructor() {
        this.themes = ['light', 'dark', 'cloudy'];
        this.currentTheme = this.getStoredTheme() || 'dark';
    }

    getStoredTheme() {
        try {
            return localStorage.getItem('preferred-theme');
        } catch (error) {
            console.warn('LocalStorage not available:', error);
            return null;
        }
    }

    setStoredTheme(theme) {
        try {
            localStorage.setItem('preferred-theme', theme);
        } catch (error) {
            console.warn('Cannot save theme to LocalStorage:', error);
        }
    }

    applyTheme(theme) {
        if (!this.themes.includes(theme)) {
            theme = 'light';
        }

        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        this.setStoredTheme(theme);
        this.updateThemeButtons();
        
        window.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme } 
        }));
    }

    updateThemeButtons() {
        if (!DOM.themeButtons) return;
        
        DOM.themeButtons.forEach(btn => {
            const btnTheme = btn.getAttribute('data-theme');
            btn.classList.toggle('active', btnTheme === this.currentTheme);
        });
    }

    initializeThemeButtons() {
        if (!DOM.themeButtons) return;
        
        DOM.themeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const theme = e.currentTarget.getAttribute('data-theme');
                this.applyTheme(theme);
                this.playClickSound();
            });
        });
    }

    playClickSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);

            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (error) {
            console.warn('Audio feedback not available:', error);
        }
    }

    initialize() {
        this.applyTheme(this.currentTheme);
        this.initializeThemeButtons();
    }
}

// Search Functionality (Enhanced)
class SearchManager {
    constructor() {
        this.debounceTimer = null;
        this.debounceDelay = 300;
    }

    initialize() {
        if (!AuthState.isLoggedIn) return;
        
        this.setupEventListeners();
        this.initializeTools();
    }

    setupEventListeners() {
        if (!DOM.searchInput) return;

        DOM.searchInput.addEventListener('input', (e) => {
            this.handleSearchInput(e.target.value);
        });

        DOM.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.clearSearch();
            }
        });

        DOM.clearSearch.addEventListener('click', () => {
            this.clearSearch();
        });
    }

    handleSearchInput(value) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.performSearch(value);
        }, this.debounceDelay);

        DOM.clearSearch.classList.toggle('visible', value.length > 0);
    }

    performSearch(searchTerm) {
        AppState.searchTerm = searchTerm.toLowerCase().trim();
        
        if (AppState.searchTerm === '') {
            this.showAllTools();
        } else {
            this.filterTools();
        }
    }

    filterTools() {
        const cards = DOM.toolsGrid.querySelectorAll('.tool-card');
        let visibleCount = 0;

        cards.forEach(card => {
            const isVisible = this.isToolVisible(card);
            card.style.display = isVisible ? 'block' : 'none';
            
            if (isVisible) {
                visibleCount++;
                this.animateCardEntrance(card);
            }
        });

        this.toggleNoResults(visibleCount === 0);
    }

    isToolVisible(card) {
        const title = card.querySelector('.tool-title').textContent.toLowerCase();
        const description = card.querySelector('.tool-description').textContent.toLowerCase();
        const tags = card.getAttribute('data-tags') || '';
        const features = Array.from(card.querySelectorAll('.feature-tag'))
            .map(tag => tag.textContent.toLowerCase())
            .join(' ');

        const searchableContent = `${title} ${description} ${tags} ${features}`;
        return searchableContent.includes(AppState.searchTerm);
    }

    showAllTools() {
        const cards = DOM.toolsGrid.querySelectorAll('.tool-card');
        cards.forEach(card => {
            card.style.display = 'block';
            this.animateCardEntrance(card);
        });
        this.toggleNoResults(false);
    }

    animateCardEntrance(card) {
        card.style.animation = 'none';
        card.offsetHeight; // Trigger reflow
        card.style.animation = 'fadeInUp 0.4s ease-out forwards';
    }

    toggleNoResults(show) {
        if (DOM.noResults) {
            DOM.noResults.classList.toggle('visible', show);
        }
    }

    clearSearch() {
        DOM.searchInput.value = '';
        DOM.clearSearch.classList.remove('visible');
        this.performSearch('');
        DOM.searchInput.focus();
    }

    initializeTools() {
        // Remove loading state and show tools
        AppState.isLoading = false;
        this.hideLoadingState();
        this.showAllTools();
    }

    hideLoadingState() {
        // Hide any loading indicators
        const loadingIndicators = document.querySelectorAll('.loading, .spinner, [data-loading]');
        loadingIndicators.forEach(indicator => {
            indicator.style.display = 'none';
            indicator.classList.remove('visible');
        });

        // Show tools grid
        if (DOM.toolsGrid) {
            DOM.toolsGrid.style.display = 'grid';
            DOM.toolsGrid.classList.add('loaded');
        }
    }
}

// Copy Link Functionality (Enhanced)
class CopyManager {
    constructor() {
        this.audioContext = null;
        this.initializeAudioContext();
    }

    initializeAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.warn('Web Audio API not available:', error);
        }
    }

    initialize() {
        if (!AuthState.isLoggedIn) return;
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.copy-link-btn')) {
                e.preventDefault();
                const button = e.target.closest('.copy-link-btn');
                const url = button.getAttribute('data-url');
                this.copyToClipboard(url, button);
            }
        });
    }

    async copyToClipboard(text, button) {
        try {
            button.disabled = true;
            button.classList.add('copying');

            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                this.fallbackCopyToClipboard(text);
            }

            authManager.showToast('Link copiado com sucesso!', 'success');
            this.playSuccessSound();

        } catch (error) {
            console.error('Failed to copy:', error);
            authManager.showToast('Erro ao copiar link. Tente novamente.', 'error');
        } finally {
            setTimeout(() => {
                button.disabled = false;
                button.classList.remove('copying');
            }, 300);
        }
    }

    fallbackCopyToClipboard(text) {
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
        } catch (error) {
            throw new Error('Fallback copy failed');
        } finally {
            document.body.removeChild(textArea);
        }
    }

    playSuccessSound() {
        if (!this.audioContext) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.setValueAtTime(523.25, this.audioContext.currentTime);
            oscillator.frequency.setValueAtTime(659.25, this.audioContext.currentTime + 0.1);

            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.3);
        } catch (error) {
            console.warn('Audio feedback not available:', error);
        }
    }
}

// Keyboard navigation support
function initializeKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        // Quick search with '/' key (only when logged in)
        if (e.key === '/' && !e.ctrlKey && !e.metaKey && AuthState.isLoggedIn) {
            e.preventDefault();
            if (DOM.searchInput) {
                DOM.searchInput.focus();
            }
        }

        // Close search with Escape
        if (e.key === 'Escape' && document.activeElement === DOM.searchInput) {
            DOM.searchInput.blur();
        }
    });
}

// Application Initialization
class App {
    constructor() {
        this.authManager = new AuthManager();
        this.termsModalManager = new TermsModalManager();
        this.themeManager = new ThemeManager();
        this.searchManager = new SearchManager();
        this.copyManager = new CopyManager();
    }

    async initialize() {
        try {
            // Initialize DOM references first
            initializeDOM();

            // Initialize settings system (themes, animations, etc.)
            SettingsManager.initialize();

            // Initialize theme system (works for both login and main app)
            this.themeManager.initialize();

            // Initialize authentication
            this.authManager.initialize();

            // Initialize terms modal
            this.termsModalManager.initialize();

            // Wait a bit for auth to determine state
            await new Promise(resolve => setTimeout(resolve, 100));

            // Initialize main app features only if logged in
            if (AuthState.isLoggedIn) {
                this.searchManager.initialize();
                this.copyManager.initialize();
                this.initializeMainApp();
            }

            // Initialize universal features
            initializeKeyboardNavigation();

            console.log('🚀 Zipora initialized successfully');

        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.handleInitializationError();
        }
    }

    initializeMainApp() {
        // Force display of tools and clear any loading states
        try {
            // Clear loading state immediately
            AppState.isLoading = false;
            
            // Ensure tools grid is visible
            if (DOM.toolsGrid) {
                DOM.toolsGrid.style.display = 'grid';
                DOM.toolsGrid.style.visibility = 'visible';
                DOM.toolsGrid.classList.remove('loading');
                DOM.toolsGrid.classList.add('loaded');
            }

            // Show all tool cards
            const toolCards = document.querySelectorAll('.tool-card');
            toolCards.forEach(card => {
                card.style.display = 'block';
                card.style.visibility = 'visible';
            });

            // Hide any loading indicators
            const loadingElements = document.querySelectorAll('.loading, .spinner, [data-loading="true"]');
            loadingElements.forEach(element => {
                element.style.display = 'none';
            });

            console.log('✅ Main app initialized - tools visible');

        } catch (error) {
            console.error('Error initializing main app:', error);
        }
    }

    handleInitializationError() {
        document.body.innerHTML = `
            <div style="
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                flex-direction: column;
                text-align: center;
                padding: 2rem;
                font-family: system-ui, sans-serif;
            ">
                <h1 style="color: #dc2626; margin-bottom: 1rem;">
                    ⚠️ Erro de Inicialização
                </h1>
                <p style="color: #64748b; margin-bottom: 2rem;">
                    Houve um problema ao carregar a aplicação. Tente recarregar a página.
                </p>
                <button 
                    onclick="window.location.reload()" 
                    style="
                        background: #3470dc;
                        color: white;
                        border: none;
                        padding: 0.75rem 1.5rem;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 1rem;
                    "
                >
                    Recarregar Página
                </button>
            </div>
        `;
    }
}

// Global instances
let authManager;
let app;

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app = new App();
    authManager = app.authManager; // Make auth manager globally accessible
    app.initialize();
});

// Export for debugging in development
if (typeof window !== 'undefined') {
    window.DebugApp = {
        AuthState,
        AppState,
        DOM,
        app
    };
}