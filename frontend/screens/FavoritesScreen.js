import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, SHADOWS, BORDER_RADIUS } from '../theme/theme';
import { API_URL } from '../auth_config';

const API_BASE = API_URL || 'https://food-platform-backend-786175107600.asia-east1.run.app';

export default function FavoritesScreen({ route, navigation }) {
    const { userId } = route.params;
    const { t } = useTranslation();

    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFavorites();
    }, []);

    const fetchFavorites = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/favorites/${userId}`);
            const data = await res.json();
            setFavorites(data || []);
        } catch (error) {
            console.error('Error fetching favorites:', error);
            setFavorites([]);
        } finally {
            setLoading(false);
        }
    };

    const handleMerchantPress = (merchantId) => {
        navigation.navigate('MerchantDetail', {
            merchantId,
            userId,
        });
    };

    const getCategoryIcon = (category) => {
        switch (category?.toLowerCase()) {
            case 'bakery': return 'bread-slice-outline';
            case 'restaurant': return 'restaurant-outline';
            case 'cafe': return 'cafe-outline';
            case 'supermarket': return 'cart-outline';
            default: return 'storefront-outline';
        }
    };

    const renderFavoriteItem = ({ item }) => (
        <TouchableOpacity
            style={styles.favoriteCard}
            onPress={() => handleMerchantPress(item.merchant_id)}
        >
            <View style={styles.iconContainer}>
                <Ionicons
                    name={getCategoryIcon(item.category)}
                    size={28}
                    color={COLORS.primary}
                />
            </View>
            <View style={styles.infoContainer}>
                <Text style={styles.shopName}>{item.shop_name}</Text>
                <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.address}>{item.address}</Text>
                </View>
                {item.category && (
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{item.category}</Text>
                    </View>
                )}
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={80} color={COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>{t('no_favorites')}</Text>
            <Text style={styles.emptySubtitle}>{t('no_favorites_desc')}</Text>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    testID="back-button"
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('favorites')}</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Favorites List */}
            {favorites.length > 0 ? (
                <FlatList
                    data={favorites}
                    renderItem={renderFavoriteItem}
                    keyExtractor={(item) => item.id?.toString() || item.merchant_id}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                renderEmptyState()
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        padding: SPACING.xs,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    placeholder: {
        width: 32,
    },
    listContainer: {
        padding: SPACING.m,
    },
    favoriteCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: SPACING.m,
        borderRadius: BORDER_RADIUS.m,
        marginBottom: SPACING.s,
        ...SHADOWS.small,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: COLORS.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.m,
    },
    infoContainer: {
        flex: 1,
    },
    shopName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    address: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginLeft: 4,
    },
    categoryBadge: {
        backgroundColor: COLORS.primary + '15',
        paddingHorizontal: SPACING.s,
        paddingVertical: 2,
        borderRadius: BORDER_RADIUS.s,
        alignSelf: 'flex-start',
    },
    categoryText: {
        fontSize: 11,
        color: COLORS.primary,
        fontWeight: '500',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginTop: SPACING.l,
    },
    emptySubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: SPACING.s,
    },
});
