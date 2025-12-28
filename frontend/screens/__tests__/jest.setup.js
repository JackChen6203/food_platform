// Jest setup file for mocking native modules

// Mock react-i18next
jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key) => key,
        i18n: {
            changeLanguage: jest.fn(),
            language: 'en',
        },
    }),
    initReactI18next: {
        type: '3rdParty',
        init: jest.fn(),
    },
}));

// Mock theme
jest.mock('../theme/theme', () => ({
    COLORS: {
        primary: '#4CAF50',
        background: '#121212',
        surface: '#1E1E1E',
        textPrimary: '#FFFFFF',
        textSecondary: '#888888',
        border: '#333333',
        error: '#FF5252',
    },
    SPACING: { xs: 4, s: 8, m: 16, l: 24, xl: 32 },
    SHADOWS: { small: {} },
    BORDER_RADIUS: { s: 4, m: 8, l: 16 },
}));

// Mock auth_config
jest.mock('../auth_config', () => ({
    API_URL: 'https://food-platform-backend-786175107600.asia-east1.run.app',
    GOOGLE_CONFIG: {},
    FACEBOOK_CONFIG: {},
    WALLET_CONNECT_CONFIG: { projectId: 'test' },
}));

// Silence console logs during tests
global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
};
