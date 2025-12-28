import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, Alert, TouchableOpacity, TextInput, Image, SafeAreaView } from 'react-native';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS, BORDER_RADIUS } from '../theme/theme';
import { useTranslation } from 'react-i18next';

const API_URL = 'https://food-platform-backend-786175107600.asia-east1.run.app';

export default function HomeScreen({ route, navigation }) {
    const { user: initialUser, role: initialRole } = route.params;
    const [user, setUser] = useState(initialUser);
    const [role, setRole] = useState(initialRole || 'CONSUMER');
    const [location, setLocation] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const { t } = useTranslation();

    // Merchant Form
    const [newName, setNewName] = useState('');
    const [newOriginalPrice, setNewOriginalPrice] = useState('');
    const [newCurrentPrice, setNewCurrentPrice] = useState('');
    const [expiryMinutes, setExpiryMinutes] = useState('60');

    useEffect(() => {
        if (route.params?.user) setUser(route.params.user);
        if (route.params?.role) setRole(route.params.role);

        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                let loc = await Location.getCurrentPositionAsync({});
                setLocation(loc);
            }
            fetchProducts();
        })();
    }, [route.params]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/products`);
            const json = await response.json();
            if (json && Array.isArray(json)) setProducts(json);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    const handlePurchase = async (productID) => {
        // ... (Purchase logic same as before)
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/purchase/${productID}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ consumer_id: user.user_id })
            });
            const data = await res.json();
            if (res.ok) {
                Alert.alert(t('success'), t('order_placed'));
                fetchProducts();
            } else {
                Alert.alert(t('failed'), data.error);
            }
        } catch (err) {
            Alert.alert(t('error'), t('network_error'));
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProduct = async () => {
        // ... (Create logic same as before)
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    merchant_id: user.user_id,
                    name: newName,
                    original_price: parseFloat(newOriginalPrice),
                    current_price: parseFloat(newCurrentPrice),
                    expiry_minutes: parseInt(expiryMinutes),
                    latitude: location?.coords.latitude || 25.0330,
                    longitude: location?.coords.longitude || 121.5654
                })
            });
            if (res.ok) {
                Alert.alert(t('listed'), t('product_live'));
                setNewName(''); setNewOriginalPrice(''); setNewCurrentPrice('');
                fetchProducts();
            }
        } catch (e) { Alert.alert(t('error'), t('failed')); } finally { setLoading(false); }
    };

    const toggleRole = () => {
        if (role === 'CONSUMER') {
            user.is_merchant ? setRole('MERCHANT') : navigation.navigate('MerchantSetup', { user });
        } else {
            setRole('CONSUMER');
        }
    };

    const renderProductCard = ({ item }) => {
        const isSold = item.status === 'SOLD';
        const discount = Math.round(((item.original_price - item.current_price) / item.original_price) * 100);

        return (
            <View style={[styles.card, isSold && { opacity: 0.6 }]}>
                <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop' }}
                    style={styles.cardImage}
                />

                {/* Status Badge */}
                {isSold && (
                    <View style={styles.soldBadge}>
                        <Text style={styles.soldText}>{t('sold_out')}</Text>
                    </View>
                )}

                {/* Discount Badge */}
                {!isSold && discount > 0 && (
                    <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>{discount}% {t('off')}</Text>
                    </View>
                )}

                <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{item.name}</Text>

                    <View style={styles.priceRow}>
                        <Text style={styles.currentPrice}>${item.current_price}</Text>
                        <Text style={styles.originalPrice}>${item.original_price}</Text>
                    </View>

                    <View style={styles.metaRow}>
                        <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
                        <Text style={styles.metaText}>Exp: {new Date(item.expiry_date).getHours()}:{new Date(item.expiry_date).getMinutes().toString().padStart(2, '0')}</Text>

                        <View style={{ width: 10 }} />

                        <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
                        <Text style={styles.metaText}>0.5km</Text>
                    </View>

                    {role === 'CONSUMER' && !isSold && (
                        <TouchableOpacity style={styles.buyBtn} onPress={() => handlePurchase(item.id)}>
                            <Text style={styles.buyBtnText}>{t('rescue_meal')}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>{t('hello')}, {role === 'MERCHANT' ? t('partner') : t('foodie')}</Text>
                    <View style={styles.locationPill}>
                        <Ionicons name="location-sharp" size={16} color={COLORS.primary} />
                        <Text style={styles.locationText}>Taipei, Taiwan</Text>
                        <Ionicons name="chevron-down" size={14} color={COLORS.textSecondary} />
                    </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Search', { userId: user?.user_id })}
                        style={styles.iconBtn}
                    >
                        <Ionicons name="search" size={22} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Favorites', { userId: user?.user_id })}
                        style={styles.iconBtn}
                    >
                        <Ionicons name="heart-outline" size={22} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Notifications', { userId: user?.user_id })}
                        style={styles.iconBtn}
                    >
                        <Ionicons name="notifications-outline" size={22} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={toggleRole} style={styles.iconBtn}>
                        <MaterialCommunityIcons name={role === 'MERCHANT' ? "store" : "account"} size={22} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.replace('Login')} style={styles.iconBtn}>
                        <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content */}
            {role === 'MERCHANT' ? (
                <View style={styles.merchantContainer}>
                    <Text style={styles.sectionTitle}>{t('add_listing')}</Text>
                    <View style={styles.formCard}>
                        <TextInput style={styles.input} placeholder={t('item_name')} value={newName} onChangeText={setNewName} />
                        <View style={styles.row}>
                            <TextInput style={[styles.input, { flex: 1, marginRight: 5 }]} placeholder={t('original_price')} keyboardType="numeric" value={newOriginalPrice} onChangeText={setNewOriginalPrice} />
                            <TextInput style={[styles.input, { flex: 1, marginLeft: 5 }]} placeholder={t('sale_price')} keyboardType="numeric" value={newCurrentPrice} onChangeText={setNewCurrentPrice} />
                        </View>
                        <TextInput style={styles.input} placeholder={t('minutes_to_expiry')} keyboardType="numeric" value={expiryMinutes} onChangeText={setExpiryMinutes} />

                        <TouchableOpacity style={styles.primaryBtn} onPress={handleCreateProduct}>
                            <Text style={styles.primaryBtnText}>{t('post_listing')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <FlatList
                    contentContainerStyle={styles.listContent}
                    data={products}
                    renderItem={renderProductCard}
                    keyExtractor={item => item.id.toString()}
                    ListHeaderComponent={<Text style={styles.sectionTitle}>{t('nearby_rescues')}</Text>}
                    refreshing={loading}
                    onRefresh={fetchProducts}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.l, backgroundColor: COLORS.surface, ...SHADOWS.small },
    greeting: { fontSize: 14, color: COLORS.textSecondary },
    locationPill: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    locationText: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary, marginHorizontal: 4 },
    iconBtn: { padding: 8, backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.xl },

    listContent: { padding: SPACING.m },
    sectionTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING.m, paddingHorizontal: SPACING.xs },

    // Card Styles
    card: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.l, marginBottom: SPACING.m, ...SHADOWS.medium, overflow: 'hidden' },
    cardImage: { width: '100%', height: 160 },
    cardContent: { padding: SPACING.m },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING.xs },

    priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: SPACING.s },
    currentPrice: { fontSize: 20, fontWeight: '800', color: COLORS.primary, marginRight: 8 },
    originalPrice: { fontSize: 14, color: COLORS.textSecondary, textDecorationLine: 'line-through' },

    metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.m },
    metaText: { fontSize: 12, color: COLORS.textSecondary, marginLeft: 4 },

    buyBtn: { backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: BORDER_RADIUS.l, alignItems: 'center' },
    buyBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

    // Badges
    discountBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: COLORS.success, paddingVertical: 4, paddingHorizontal: 8, borderRadius: BORDER_RADIUS.s },
    discountText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
    soldBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: COLORS.textSecondary, paddingVertical: 4, paddingHorizontal: 8, borderRadius: BORDER_RADIUS.s },
    soldText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },

    // Merchant Styles
    merchantContainer: { padding: SPACING.m },
    formCard: { backgroundColor: COLORS.surface, padding: SPACING.l, borderRadius: BORDER_RADIUS.m, ...SHADOWS.small },
    input: { backgroundColor: COLORS.background, padding: 12, borderRadius: BORDER_RADIUS.s, marginBottom: SPACING.m, borderWidth: 1, borderColor: COLORS.border },
    row: { flexDirection: 'row', marginBottom: SPACING.m },
    primaryBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: BORDER_RADIUS.l, alignItems: 'center' },
    primaryBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});
