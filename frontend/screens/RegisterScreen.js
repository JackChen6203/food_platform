import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    Alert, ImageBackground, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS, BORDER_RADIUS } from '../theme/theme';
import { useTranslation } from 'react-i18next';
import { API_URL as ENV_API_URL } from '../auth_config';

const API_URL = ENV_API_URL;

export default function RegisterScreen({ navigation }) {
    const { t } = useTranslation();
    const [phone, setPhone] = useState('');
    const [code, setCode] = useState('');
    const [step, setStep] = useState(1); // 1: enter phone, 2: enter code
    const [isLoading, setIsLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const codeInputRef = useRef(null);

    useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const sendSMSCode = async () => {
        if (!phone || phone.length < 10) {
            Alert.alert(t('error'), t('invalid_phone'));
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/register/send-sms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone })
            });
            const data = await res.json();

            if (res.ok) {
                Alert.alert(t('success'), t('code_sent'));
                setStep(2);
                setCountdown(60);
                setTimeout(() => codeInputRef.current?.focus(), 300);
            } else {
                Alert.alert(t('error'), data.error || t('send_code_failed'));
            }
        } catch (e) {
            console.error('[SMS] Error:', e);
            Alert.alert(t('network_error'), e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const verifySMSCode = async () => {
        if (!code || code.length !== 6) {
            Alert.alert(t('error'), t('invalid_code'));
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/register/verify-sms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, code })
            });
            const data = await res.json();

            if (res.ok) {
                Alert.alert(t('success'), t('registration_success'));
                navigation.navigate('Home', { user: data, role: 'CONSUMER' });
            } else {
                Alert.alert(t('error'), data.error || t('invalid_code'));
            }
        } catch (e) {
            console.error('[Verify] Error:', e);
            Alert.alert(t('network_error'), e.message);
        } finally {
            setIsLoading(false);
        }
    };

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

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <View style={styles.content}>
                        {/* Back Button */}
                        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                            <Ionicons name="arrow-back" size={24} color="#FFF" />
                        </TouchableOpacity>

                        <View style={styles.headerArea}>
                            <Text style={styles.appTitle}>FoodRescue</Text>
                            <Text style={styles.appTagline}>{t('register')}</Text>
                        </View>

                        <BlurView intensity={90} tint="light" style={styles.card}>
                            {isLoading ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color={COLORS.primary} />
                                    <Text style={styles.loadingText}>{t('authenticating')}</Text>
                                </View>
                            ) : step === 1 ? (
                                <>
                                    <Text style={styles.title}>{t('phone_number')}</Text>
                                    <Text style={styles.subtitle}>{t('enter_phone_subtitle')}</Text>

                                    <View style={styles.inputContainer}>
                                        <View style={styles.countryCode}>
                                            <Text style={styles.countryCodeText}>+886</Text>
                                        </View>
                                        <TextInput
                                            style={styles.phoneInput}
                                            placeholder="912345678"
                                            placeholderTextColor={COLORS.textSecondary}
                                            keyboardType="phone-pad"
                                            value={phone}
                                            onChangeText={setPhone}
                                            maxLength={10}
                                        />
                                    </View>

                                    <TouchableOpacity style={styles.primaryBtn} onPress={sendSMSCode}>
                                        <Text style={styles.primaryBtnText}>{t('send_code')}</Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.title}>{t('enter_code')}</Text>
                                    <Text style={styles.subtitle}>+886 {phone}</Text>

                                    <TextInput
                                        ref={codeInputRef}
                                        style={styles.codeInput}
                                        placeholder="000000"
                                        placeholderTextColor={COLORS.textSecondary}
                                        keyboardType="number-pad"
                                        value={code}
                                        onChangeText={setCode}
                                        maxLength={6}
                                        textAlign="center"
                                    />

                                    <TouchableOpacity style={styles.primaryBtn} onPress={verifySMSCode}>
                                        <Text style={styles.primaryBtnText}>{t('verify_and_register')}</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.resendBtn}
                                        onPress={sendSMSCode}
                                        disabled={countdown > 0}
                                    >
                                        <Text style={[styles.resendText, countdown > 0 && styles.resendDisabled]}>
                                            {countdown > 0 ? `${t('resend_code')} (${countdown}s)` : t('resend_code')}
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity onPress={() => setStep(1)}>
                                        <Text style={styles.changePhoneText}>{t('change_phone')}</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </BlurView>
                    </View>
                </KeyboardAvoidingView>
            </ImageBackground>
            <StatusBar style="light" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    backgroundImage: { flex: 1, width: '100%', height: '100%' },
    gradientOverlay: { ...StyleSheet.absoluteFillObject },
    keyboardView: { flex: 1 },
    content: { flex: 1, justifyContent: 'flex-end', padding: SPACING.l, paddingBottom: SPACING.xxl },

    backBtn: {
        position: 'absolute',
        top: 50,
        left: SPACING.l,
        zIndex: 10,
        padding: SPACING.s,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: BORDER_RADIUS.m,
    },

    headerArea: { marginBottom: SPACING.xl, alignItems: 'center' },
    appTitle: { fontSize: 48, fontWeight: '800', color: COLORS.surface, letterSpacing: -1 },
    appTagline: { fontSize: 18, color: '#DDD', marginTop: SPACING.xs, fontWeight: '500' },

    card: {
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.l,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.9)',
        ...SHADOWS.large
    },

    loadingContainer: { padding: 40, alignItems: 'center' },
    loadingText: { marginTop: 15, color: COLORS.textSecondary },

    title: { fontSize: 24, fontWeight: 'bold', color: COLORS.textPrimary, textAlign: 'center' },
    subtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.xs, marginBottom: SPACING.l },

    inputContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.m },
    countryCode: {
        backgroundColor: COLORS.surface,
        paddingHorizontal: SPACING.m,
        paddingVertical: 14,
        borderRadius: BORDER_RADIUS.m,
        marginRight: SPACING.s,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    countryCodeText: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
    phoneInput: {
        flex: 1,
        backgroundColor: COLORS.surface,
        paddingHorizontal: SPACING.m,
        paddingVertical: 14,
        borderRadius: BORDER_RADIUS.m,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        color: COLORS.textPrimary,
    },

    codeInput: {
        backgroundColor: COLORS.surface,
        paddingHorizontal: SPACING.m,
        paddingVertical: 16,
        borderRadius: BORDER_RADIUS.m,
        fontSize: 24,
        fontWeight: 'bold',
        letterSpacing: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        marginBottom: SPACING.m,
        color: COLORS.textPrimary,
    },

    primaryBtn: {
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: BORDER_RADIUS.m,
        alignItems: 'center',
        ...SHADOWS.small,
    },
    primaryBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

    resendBtn: { marginTop: SPACING.m, alignItems: 'center' },
    resendText: { color: COLORS.primary, fontWeight: '600' },
    resendDisabled: { color: COLORS.textSecondary },

    changePhoneText: { color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.m, fontSize: 14 },
});
