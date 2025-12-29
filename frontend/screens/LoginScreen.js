import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ImageBackground, Modal, ActivityIndicator, Switch } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS, BORDER_RADIUS } from '../theme/theme';

import { GOOGLE_CONFIG, FACEBOOK_CONFIG, IS_DEMO_MODE, isConfigured, API_URL as ENV_API_URL } from '../auth_config';

import { useTranslation } from 'react-i18next';
import { useWeb3Modal } from '@web3modal/wagmi-react-native';
import { useAccount } from 'wagmi';

WebBrowser.maybeCompleteAuthSession();

// Use Env URL if available
const API_URL = ENV_API_URL;

export default function LoginScreen({ navigation }) {
    const { t, i18n } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [isMerchantMode, setIsMerchantMode] = useState(false);

    // WalletConnect Hook
    const { address, isConnected } = useAccount();
    const { open } = useWeb3Modal();

    // Google Auth Hook
    const [gRequest, gResponse, gPromptAsync] = Google.useAuthRequest({
        iosClientId: GOOGLE_CONFIG.iosClientId,
        androidClientId: GOOGLE_CONFIG.androidClientId,
        webClientId: GOOGLE_CONFIG.webClientId,
    });

    // Facebook Auth Hook
    const [fRequest, fResponse, fPromptAsync] = Facebook.useAuthRequest({
        clientId: FACEBOOK_CONFIG.appId,
    });

    useEffect(() => {
        if (gResponse?.type === 'success') {
            const { authentication } = gResponse;
            handleBackendLogin('google', 'google_user_' + authentication.accessToken.substring(0, 10));
        } else if (gResponse?.type === 'error') {
            Alert.alert(t('login_failed'), "Please check your Client IDs in auth_config.js");
        }
    }, [gResponse]);

    useEffect(() => {
        if (fResponse?.type === 'success') {
            const { authentication } = fResponse;
            handleBackendLogin('facebook', 'fb_user_' + authentication.accessToken.substring(0, 10));
        }
    }, [fResponse]);

    // WalletConnect Auto-Login
    useEffect(() => {
        if (isConnected && address) {
            console.log("[Auth] Wallet Connected:", address);
            // Small delay to ensure UI is ready or just proceed
            handleBackendLogin('crypto', address);
        }
    }, [isConnected, address]);

    const handleBackendLogin = async (provider, authId) => {
        setIsLoading(true);
        console.log(`[Auth] Attempting login with ${provider} (ID: ${authId})...`);
        try {
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    auth_provider: provider,
                    auth_id: authId,
                    email: `user_${provider}@example.com`,
                })
            });
            const data = await res.json();

            if (res.ok) {
                console.log("[Auth] Success:", data);

                let finalRole = 'CONSUMER';

                if (isMerchantMode) {
                    if (!data.is_merchant) {
                        console.log("[Auth] New Merchant detected, redirecting to setup...");
                        navigation.navigate('MerchantSetup', { user: data });
                        return true;
                    }
                    finalRole = 'MERCHANT';
                }

                navigation.navigate('Home', { user: data, role: finalRole });
                return true;
            } else {
                console.error("[Auth] Failed:", data.error);
                Alert.alert(t('login_failed'), data.error || "Unknown backend error");
                return false;
            }
        } catch (e) {
            console.error("[Auth] Network Error:", e);
            Alert.alert(t('network_error'), "Could not connect to backend.\nPlease check your internet connection.");
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoginPress = async (provider) => {
        const isGoogleReady = provider === 'google' && isConfigured('google');
        const isFBReady = provider === 'facebook' && isConfigured('facebook');
        const needsDemo = IS_DEMO_MODE || (provider === 'google' && !isGoogleReady) || (provider === 'facebook' && !isFBReady);

        if (needsDemo) {
            const isMissing = (provider === 'google' && !isGoogleReady) || (provider === 'facebook' && !isFBReady);
            showConfigAlert(provider, isMissing);
            return;
        }

        if (provider === 'google') {
            await gPromptAsync();
        } else if (provider === 'facebook') {
            await fPromptAsync();
        } else {
            simulateLogin(provider);
        }
    };

    const showConfigAlert = (provider, isMissing) => {
        Alert.alert(
            isMissing ? t('setup_required') : t('demo_mode'),
            isMissing
                ? `To enable REAL ${provider} login, please paste your Client ID in 'frontend/auth_config.js'.`
                : `Real login is disabled in 'auth_config.js'. Using simulation.`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Verify with Demo", onPress: () => simulateLogin(provider) }
            ]
        );
    };

    const simulateLogin = (provider) => {
        setIsLoading(true);
        setTimeout(() => {
            handleBackendLogin(provider, `simulated_${provider}_id_${Math.floor(Math.random() * 1000)}`);
        }, 1500);
    };

    const SocialButton = ({ provider, color, icon, label, onPress, fontAwesome }) => (
        <TouchableOpacity
            style={[styles.socialBtn, { backgroundColor: color, ...SHADOWS.small }]}
            onPress={onPress}
            disabled={!gRequest && provider === 'google'}
        >
            <View style={styles.iconContainer}>
                {fontAwesome ? (
                    <FontAwesome name={icon} size={20} color="#FFF" />
                ) : (
                    <MaterialCommunityIcons name={icon} size={22} color="#FFF" />
                )}
            </View>
            <Text style={styles.socialBtnText}>{label}</Text>
        </TouchableOpacity>
    );

    const LanguageButton = ({ lang, code }) => (
        <TouchableOpacity onPress={() => i18n.changeLanguage(code)} style={styles.langBtn}>
            <Text style={[styles.langText, i18n.language === code && styles.langTextActive]}>{lang}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <ImageBackground
                source={{ uri: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1974&auto=format&fit=crop' }}
                style={styles.backgroundImage}
                resizeMode="cover"
            >
                <LinearGradient
                    colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
                    style={styles.gradientOverlay}
                />

                <ScrollView contentContainerStyle={styles.scrollContent}>

                    <View style={styles.langContainer}>
                        <Ionicons name="globe-outline" size={16} color="rgba(255,255,255,0.8)" style={{ marginRight: 8 }} />
                        <LanguageButton lang="EN" code="en" />
                        <Text style={styles.langDivider}>|</Text>
                        <LanguageButton lang="繁" code="zh-TW" />
                        <Text style={styles.langDivider}>|</Text>
                        <LanguageButton lang="简" code="zh-CN" />
                        <Text style={styles.langDivider}>|</Text>
                        <LanguageButton lang="VI" code="vi" />
                    </View>

                    <View style={styles.headerArea}>
                        <Text style={styles.appTitle}>FoodRescue</Text>
                        <Text style={styles.appTagline}>{t('app_tagline')}</Text>
                    </View>

                    <BlurView intensity={90} tint="light" style={styles.loginCard}>
                        {isLoading ? (
                            <View style={{ padding: 40, alignItems: 'center' }}>
                                <ActivityIndicator size="large" color={COLORS.primary} />
                                <Text style={{ marginTop: 15, color: COLORS.textSecondary }}>{t('authenticating')}</Text>
                            </View>
                        ) : (
                            <>
                                <View style={styles.roleToggleContainer}>
                                    <Text style={[styles.roleText, !isMerchantMode && styles.roleActive]}>{t('consumer')}</Text>
                                    <Switch
                                        trackColor={{ false: "#767577", true: COLORS.primary }}
                                        thumbColor={isMerchantMode ? "#fff" : "#f4f3f4"}
                                        ios_backgroundColor="#3e3e3e"
                                        onValueChange={() => setIsMerchantMode(!isMerchantMode)}
                                        value={isMerchantMode}
                                        style={{ transform: [{ scaleX: .8 }, { scaleY: .8 }] }}
                                    />
                                    <Text style={[styles.roleText, isMerchantMode && styles.roleActive]}>{t('merchant')}</Text>
                                </View>
                                <Text style={styles.loginTitle}>{t('welcome')}, {isMerchantMode ? t('partner') : t('foodie')}</Text>
                                <Text style={styles.loginSubtitle}>{isMerchantMode ? t('login_manage') : t('login_find')}</Text>

                                <SocialButton
                                    provider="google"
                                    color={COLORS.google}
                                    icon="google"
                                    label={t('continue_google')}
                                    fontAwesome={true}
                                    onPress={() => handleLoginPress('google')}
                                />

                                <SocialButton
                                    provider="facebook"
                                    color={COLORS.facebook}
                                    icon="facebook"
                                    label={t('continue_facebook')}
                                    fontAwesome={true}
                                    onPress={() => handleLoginPress('facebook')}
                                />

                                <SocialButton
                                    provider="line"
                                    color={COLORS.line}
                                    icon="chat-processing"
                                    label={t('continue_line')}
                                    fontAwesome={false}
                                    onPress={() => simulateLogin('line')}
                                />

                                {/* WalletConnect Button */}
                                <SocialButton
                                    provider="wallet"
                                    color="#667eea"
                                    icon="wallet"
                                    label={t('connect_wallet')}
                                    fontAwesome={false}
                                    onPress={() => open()}
                                />

                                {/* Register Button */}
                                <TouchableOpacity
                                    style={[styles.socialBtn, styles.registerBtn]}
                                    onPress={() => navigation.navigate('Register')}
                                >
                                    <View style={styles.iconContainer}>
                                        <Ionicons name="person-add" size={20} color={COLORS.primary} />
                                    </View>
                                    <Text style={styles.registerBtnText}>{t('register')}</Text>
                                </TouchableOpacity>

                                {/* Developer Shortcut */}
                                <TouchableOpacity onPress={() => handleBackendLogin('google', 'merchant_user_id')} style={{ marginTop: 10 }}>
                                    <Text style={styles.debugText}>{t('dev_quick_login')}</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </BlurView>
                </ScrollView>
            </ImageBackground>
            <StatusBar style="light" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    backgroundImage: { flex: 1, width: '100%', height: '100%' },
    gradientOverlay: { ...StyleSheet.absoluteFillObject },
    scrollContent: { flexGrow: 1, justifyContent: 'flex-end', padding: SPACING.l, paddingBottom: SPACING.xxl },

    headerArea: { marginBottom: SPACING.xl, alignItems: 'center' },
    appTitle: { fontSize: 48, fontWeight: '800', color: COLORS.surface, letterSpacing: -1 },
    appTagline: { fontSize: 16, color: '#DDD', marginTop: SPACING.xs, fontWeight: '500' },

    loginCard: {
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.l,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.9)',
        ...SHADOWS.large
    },
    loginTitle: { fontSize: 26, fontWeight: 'bold', color: COLORS.textPrimary, textAlign: 'center' },
    loginSubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.l },

    socialBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: SPACING.m,
        borderRadius: BORDER_RADIUS.m,
        marginBottom: SPACING.m,
        justifyContent: 'center',
    },
    iconContainer: { marginRight: SPACING.s },
    socialBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15, flexShrink: 1 },

    registerBtn: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: COLORS.primary,
        marginTop: SPACING.m,
    },
    registerBtnText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 15 },

    debugText: { textAlign: 'center', color: COLORS.textSecondary, fontSize: 12, opacity: 0.6 },

    roleToggleContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.m
    },
    roleText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginHorizontal: 10
    },
    roleActive: {
        color: COLORS.primary,
        fontWeight: 'bold'
    },

    langContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 50,
        marginBottom: 15,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 20,
        alignSelf: 'center',
    },
    langBtn: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    langText: {
        color: 'rgba(255,255,255,0.6)',
        fontWeight: '600',
        fontSize: 13
    },
    langTextActive: {
        color: '#FFF',
        fontWeight: 'bold'
    },
    langDivider: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 12,
    }
});
