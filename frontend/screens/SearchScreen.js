import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, SHADOWS, BORDER_RADIUS } from '../theme/theme';
import { API_URL } from '../auth_config';

const API_BASE = API_URL || 'https://food-platform-backend-786175107600.asia-east1.run.app';

// Debounce helper
const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
};

export default function SearchScreen({ route, navigation }) {
    const { userId } = route.params;
    const { t } = useTranslation();

    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const searchMerchants = async (searchQuery) => {
        if (!searchQuery.trim()) {
            setResults([]);
            setHasSearched(false);
            return;
        }

        setLoading(true);
        setHasSearched(true);
        try {
            const res = await fetch(`${API_BASE}/merchants/search?q=${encodeURIComponent(searchQuery)}`, {
                method: 'GET',
            });
            const data = await res.json();
            setResults(data || []);
        } catch (error) {
            console.error('Error searching:', error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const debouncedSearch = useCallback(
        debounce((text) => searchMerchants(text), 500),
        []
    );

    const handleQueryChange = (text) => {
        setQuery(text);
        debouncedSearch(text);
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

    const renderResultItem = ({ item }) => (
        <TouchableOpacity
            style={styles.resultCard}
            onPress={() => handleMerchantPress(item.user_id)}
        >
            <View style={styles.iconContainer}>
                <Ionicons
                    name={getCategoryIcon(item.category)}
                    size={24}
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
            {hasSearched ? (
                <>
                    <Ionicons name="search-outline" size={60} color={COLORS.textSecondary} />
                    <Text style={styles.emptyTitle}>{t('no_results')}</Text>
                </>
            ) : (
                <>
                    <Ionicons name="search" size={60} color={COLORS.textSecondary} />
                    <Text style={styles.emptyTitle}>{t('search')}</Text>
                    <Text style={styles.emptySubtitle}>{t('search_placeholder')}</Text>
                </>
            )}
        </View>
    );

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
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color={COLORS.textSecondary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={t('search_placeholder')}
                        placeholderTextColor={COLORS.textSecondary}
                        value={query}
                        onChangeText={handleQueryChange}
                        autoFocus
                        returnKeyType="search"
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => handleQueryChange('')}>
                            <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Results */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : results.length > 0 ? (
                <FlatList
                    data={results}
                    renderItem={renderResultItem}
                    keyExtractor={(item) => item.user_id}
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.s,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        padding: SPACING.xs,
        marginRight: SPACING.s,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.m,
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.s,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: COLORS.textPrimary,
        marginLeft: SPACING.s,
        marginRight: SPACING.s,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        padding: SPACING.m,
    },
    resultCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: SPACING.m,
        borderRadius: BORDER_RADIUS.m,
        marginBottom: SPACING.s,
        ...SHADOWS.small,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
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
