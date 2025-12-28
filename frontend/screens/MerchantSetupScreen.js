import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Image, ActivityIndicator, TouchableOpacity, Alert, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Modal, FlatList } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS, BORDER_RADIUS } from '../theme/theme';
import { useTranslation } from 'react-i18next';
import { API_URL as ENV_API_URL } from '../auth_config';

const API_URL = ENV_API_URL || 'https://food-platform-backend-786175107600.asia-east1.run.app';

export default function MerchantSetupScreen({ route, navigation }) {
    const { user } = route.params;
    const { t } = useTranslation();

    // Basic Info
    const [shopName, setShopName] = useState('');
    const [address, setAddress] = useState('');
    const [location, setLocation] = useState(null);

    // New Fields
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [openTime, setOpenTime] = useState('09:00');
    const [closeTime, setCloseTime] = useState('21:00');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');

    // UI States
    const [loading, setLoading] = useState(false);
    const [locating, setLocating] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);

    const categories = [
        { key: 'restaurant', label: t('cat_restaurant') },
        { key: 'bakery', label: t('cat_bakery') },
        { key: 'grocery', label: t('cat_grocery') },
        { key: 'cafe', label: t('cat_cafe') },
        { key: 'other', label: t('cat_other') },
    ];

    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') Alert.alert(t('error'), t('provide_required'));
        })();
    }, []);

    const handleUseGPS = async () => {
        setLocating(true);
        try {
            let loc = await Location.getCurrentPositionAsync({});
            setLocation(loc);

            let reverseGeocode = await Location.reverseGeocodeAsync({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude
            });
            if (reverseGeocode.length > 0) {
                const addr = reverseGeocode[0];
                const fullAddress = `${addr.city || ''} ${addr.district || ''} ${addr.street || ''} ${addr.name || ''}`.trim();
                setAddress(fullAddress);
            }
        } catch (error) {
            Alert.alert(t('error'), t('network_error'));
        } finally {
            setLocating(false);
        }
    };

    const handleSave = async () => {
        if (!shopName || !address || !phone) {
            Alert.alert(t('missing_info'), t('provide_required'));
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/merchant/setup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.user_id,
                    shop_name: shopName,
                    address: address,
                    latitude: location?.coords.latitude || 0,
                    longitude: location?.coords.longitude || 0,
                    phone: phone,
                    email: email,
                    business_hours_open: openTime,
                    business_hours_close: closeTime,
                    category: category,
                    description: description
                })
            });

            if (res.ok) {
                const updatedUser = { ...user, is_merchant: true };
                navigation.navigate('Home', { user: updatedUser, role: 'MERCHANT' });
            } else {
                const data = await res.json();
                Alert.alert(t('setup_failed'), data.error);
            }
        } catch (e) {
            Alert.alert(t('error'), t('network_error'));
        } finally {
            setLoading(false);
        }
    };

    const selectCategory = (cat) => {
        setCategory(cat.key);
        setShowCategoryModal(false);
    };

    const getCategoryLabel = () => {
        const found = categories.find(c => c.key === category);
        return found ? found.label : t('category_placeholder');
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scroll}>
                    {/* Back Button */}
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                        <Text style={styles.backText}>{t('back')}</Text>
                    </TouchableOpacity>

                    <View style={styles.header}>
                        <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1046/1046771.png' }} style={styles.icon} />
                        <Text style={styles.title}>{t('store_setup')}</Text>
                        <Text style={styles.subtitle}>{t('store_setup_subtitle')}</Text>
                    </View>

                    <View style={styles.formCard}>
                        {/* Shop Name */}
                        <Text style={styles.label}>{t('shop_name')} *</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="business" size={20} color={COLORS.textSecondary} style={{ marginRight: 10 }} />
                            <TextInput
                                style={styles.input}
                                placeholder={t('shop_name_placeholder')}
                                value={shopName}
                                onChangeText={setShopName}
                            />
                        </View>

                        {/* Address */}
                        <Text style={styles.label}>{t('store_address')} *</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="map" size={20} color={COLORS.textSecondary} style={{ marginRight: 10 }} />
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                placeholder={t('address_placeholder')}
                                value={address}
                                onChangeText={setAddress}
                            />
                            <TouchableOpacity style={styles.gpsBtn} onPress={handleUseGPS} disabled={locating}>
                                {locating ? <ActivityIndicator color="#FFF" size="small" /> : <Ionicons name="location" size={20} color="#FFF" />}
                            </TouchableOpacity>
                        </View>

                        {/* Phone */}
                        <Text style={styles.label}>{t('phone')} *</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="call" size={20} color={COLORS.textSecondary} style={{ marginRight: 10 }} />
                            <TextInput
                                style={styles.input}
                                placeholder={t('phone_placeholder')}
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                            />
                        </View>

                        {/* Email */}
                        <Text style={styles.label}>{t('email')}</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="mail" size={20} color={COLORS.textSecondary} style={{ marginRight: 10 }} />
                            <TextInput
                                style={styles.input}
                                placeholder={t('email_placeholder')}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        {/* Business Hours */}
                        <Text style={styles.label}>{t('business_hours')}</Text>
                        <View style={styles.row}>
                            <View style={[styles.inputContainer, { flex: 1, marginRight: 5 }]}>
                                <Ionicons name="time" size={20} color={COLORS.textSecondary} style={{ marginRight: 5 }} />
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('open_time')}
                                    value={openTime}
                                    onChangeText={setOpenTime}
                                />
                            </View>
                            <Text style={styles.toText}>-</Text>
                            <View style={[styles.inputContainer, { flex: 1, marginLeft: 5 }]}>
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('close_time')}
                                    value={closeTime}
                                    onChangeText={setCloseTime}
                                />
                            </View>
                        </View>

                        {/* Category */}
                        <Text style={styles.label}>{t('category')}</Text>
                        <TouchableOpacity style={styles.inputContainer} onPress={() => setShowCategoryModal(true)}>
                            <Ionicons name="pricetag" size={20} color={COLORS.textSecondary} style={{ marginRight: 10 }} />
                            <Text style={[styles.input, { paddingTop: 15, color: category ? COLORS.textPrimary : COLORS.textSecondary }]}>
                                {getCategoryLabel()}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
                        </TouchableOpacity>

                        {/* Description */}
                        <Text style={styles.label}>{t('description')}</Text>
                        <View style={[styles.inputContainer, { height: 100, alignItems: 'flex-start', paddingTop: 10 }]}>
                            <Ionicons name="document-text" size={20} color={COLORS.textSecondary} style={{ marginRight: 10, marginTop: 5 }} />
                            <TextInput
                                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                                placeholder={t('description_placeholder')}
                                value={description}
                                onChangeText={setDescription}
                                multiline
                            />
                        </View>
                    </View>

                    <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
                        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>{t('complete_setup')}</Text>}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Category Modal */}
            <Modal visible={showCategoryModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{t('category')}</Text>
                        <FlatList
                            data={categories}
                            keyExtractor={item => item.key}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.modalItem} onPress={() => selectCategory(item)}>
                                    <Text style={styles.modalItemText}>{item.label}</Text>
                                    {category === item.key && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowCategoryModal(false)}>
                            <Text style={styles.modalCloseText}>{t('back')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scroll: { padding: SPACING.l, paddingBottom: SPACING.xxl },

    backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.m },
    backText: { marginLeft: 5, fontSize: 16, color: COLORS.textPrimary },

    header: { alignItems: 'center', marginBottom: SPACING.xl },
    icon: { width: 80, height: 80, marginBottom: SPACING.m },
    title: { fontSize: 28, fontWeight: 'bold', color: COLORS.textPrimary },
    subtitle: { fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.s },

    formCard: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.l,
        padding: SPACING.l,
        marginBottom: SPACING.xl,
        ...SHADOWS.medium
    },
    label: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: SPACING.s, marginTop: SPACING.m },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: BORDER_RADIUS.m,
        paddingHorizontal: SPACING.m,
        height: 50,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    input: { flex: 1, height: '100%', fontSize: 16, color: COLORS.textPrimary },
    row: { flexDirection: 'row', alignItems: 'center' },
    toText: { marginHorizontal: 5, fontSize: 16, color: COLORS.textSecondary },

    gpsBtn: {
        backgroundColor: COLORS.primary,
        padding: 8,
        borderRadius: BORDER_RADIUS.s,
        marginLeft: SPACING.s
    },

    saveBtn: {
        backgroundColor: COLORS.primary,
        paddingVertical: 18,
        borderRadius: BORDER_RADIUS.xl,
        alignItems: 'center',
        ...SHADOWS.medium
    },
    saveBtnText: { color: COLORS.surface, fontSize: 18, fontWeight: 'bold' },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: COLORS.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: SPACING.l, maxHeight: '50%' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING.m, textAlign: 'center' },
    modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.m, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    modalItemText: { fontSize: 16, color: COLORS.textPrimary },
    modalCloseBtn: { marginTop: SPACING.m, paddingVertical: SPACING.m, alignItems: 'center' },
    modalCloseText: { fontSize: 16, color: COLORS.textSecondary }
});
