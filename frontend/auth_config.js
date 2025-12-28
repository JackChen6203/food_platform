// ============================================================================
// Auth Configuration
// ============================================================================
// This file reads from your .env file (via EXPO_PUBLIC_ variables).
//
// 1. Copy 'frontend/.env.example' to 'frontend/.env'
// 2. Fill in your keys in .env
// 3. Restart Expo
// ============================================================================

export const GOOGLE_CONFIG = {
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '',
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
};

export const FACEBOOK_CONFIG = {
    appId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || '',
};

export const WALLET_CONNECT_CONFIG = {
    projectId: process.env.EXPO_PUBLIC_WALLET_CONNECT_PROJECT_ID || '',
};

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://food-platform-backend-786175107600.asia-east1.run.app';

// Helper to check if a specific provider is configured
export const isConfigured = (provider) => {
    switch (provider) {
        case 'google':
            return !!GOOGLE_CONFIG.webClientId; // Web Client ID is widely used as a basic check
        case 'facebook':
            return !!FACEBOOK_CONFIG.appId;
        case 'walletconnect':
            return !!WALLET_CONNECT_CONFIG.projectId;
        default:
            return false;
    }
};

// Global Demo Mode Override (Optional)
// Set to true to force demo mode even if keys are present (for testing)
export const IS_DEMO_MODE = false; 
