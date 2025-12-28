import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    FlatList,
    ActivityIndicator,
    SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, SHADOWS, BORDER_RADIUS } from '../theme/theme';
import { API_URL } from '../auth_config';

const API_BASE = API_URL || 'https://food-platform-backend-786175107600.asia-east1.run.app';

export default function MerchantDetailScreen({ route, navigation }) {
    const { merchantId, userId } = route.params;
    const { t } = useTranslation();

    const [merchant, setMerchant] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [isFavorite, setIsFavorite] = useState(false);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ averageRating: 0, totalReviews: 0, productCount: 0 });

    useEffect(() => {
        fetchMerchantData();
    }, [merchantId]);

    const fetchMerchantData = async () => {
        setLoading(true);
        try {
            // Fetch merchant details
            const merchantRes = await fetch(`${API_BASE}/merchant/${merchantId}`);
            const merchantData = await merchantRes.json();

            if (merchantData.merchant) {
                setMerchant(merchantData.merchant);
                setStats({
                    averageRating: merchantData.average_rating || 0,
                    totalReviews: merchantData.total_reviews || 0,
                    productCount: merchantData.product_count || 0,
                });
            }

            // Fetch reviews
            const reviewsRes = await fetch(`${API_BASE}/reviews/merchant/${merchantId}`);
            const reviewsData = await reviewsRes.json();
            if (reviewsData.reviews) {
                setReviews(reviewsData.reviews);
            }

            // Check if favorite
            if (userId) {
                const favRes = await fetch(`${API_BASE}/favorites/check?user_id=${userId}&merchant_id=${merchantId}`);
                const favData = await favRes.json();
                setIsFavorite(favData.is_favorite || false);
            }
        } catch (error) {
            console.error('Error fetching merchant data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleFavorite = async () => {
        try {
            const res = await fetch(`${API_BASE}/favorites/toggle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, merchant_id: merchantId }),
            });
            const data = await res.json();
            setIsFavorite(data.is_favorite);
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    };

    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push(<Ionicons key={i} name="star" size={16} color="#FFD700" />);
            } else if (i === fullStars && hasHalfStar) {
                stars.push(<Ionicons key={i} name="star-half" size={16} color="#FFD700" />);
            } else {
                stars.push(<Ionicons key={i} name="star-outline" size={16} color="#FFD700" />);
            }
        }
        return stars;
    };

    const renderReview = ({ item }) => (
        <View style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
                <View style={styles.ratingContainer}>
                    {renderStars(item.rating)}
                </View>
                <Text style={styles.reviewDate}>
                    {new Date(item.created_at).toLocaleDateString()}
                </Text>
            </View>
            <Text style={styles.reviewComment}>{item.comment}</Text>
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
            <ScrollView>
                {/* Header with back and favorite buttons */}
                <View style={styles.header}>
                    <TouchableOpacity
                        testID="back-button"
                        style={styles.headerButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        testID="favorite-button"
                        style={styles.headerButton}
                        onPress={handleToggleFavorite}
                    >
                        <Ionicons
                            name={isFavorite ? 'heart' : 'heart-outline'}
                            size={24}
                            color={isFavorite ? COLORS.error : COLORS.textPrimary}
                        />
                    </TouchableOpacity>
                </View>

                {/* Hero Image */}
                <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800' }}
                    style={styles.heroImage}
                />

                {/* Merchant Info */}
                <View style={styles.infoSection}>
                    <Text style={styles.shopName}>{merchant?.shop_name}</Text>

                    <View style={styles.ratingRow}>
                        <View style={styles.ratingContainer}>
                            {renderStars(stats.averageRating)}
                        </View>
                        <Text style={styles.ratingText}>{stats.averageRating.toFixed(1)}</Text>
                        <Text style={styles.reviewCount}>({stats.totalReviews} reviews)</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Ionicons name="location" size={18} color={COLORS.textSecondary} />
                        <Text style={styles.detailText}>{merchant?.address}</Text>
                    </View>

                    {merchant?.phone && (
                        <View style={styles.detailRow}>
                            <Ionicons name="call" size={18} color={COLORS.textSecondary} />
                            <Text style={styles.detailText}>{merchant?.phone}</Text>
                        </View>
                    )}

                    {(merchant?.business_hours_open || merchant?.business_hours_close) && (
                        <View style={styles.detailRow}>
                            <Ionicons name="time" size={18} color={COLORS.textSecondary} />
                            <Text style={styles.detailText}>
                                {merchant?.business_hours_open} - {merchant?.business_hours_close}
                            </Text>
                        </View>
                    )}

                    {merchant?.category && (
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{merchant?.category}</Text>
                        </View>
                    )}

                    {merchant?.description && (
                        <Text style={styles.description}>{merchant?.description}</Text>
                    )}
                </View>

                {/* Stats Section */}
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{stats.productCount}</Text>
                        <Text style={styles.statLabel}>Products</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{stats.averageRating.toFixed(1)}</Text>
                        <Text style={styles.statLabel}>Rating</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{stats.totalReviews}</Text>
                        <Text style={styles.statLabel}>Reviews</Text>
                    </View>
                </View>

                {/* Reviews Section */}
                <View style={styles.reviewsSection}>
                    <Text style={styles.sectionTitle}>Reviews</Text>
                    {reviews.length > 0 ? (
                        <FlatList
                            data={reviews}
                            renderItem={renderReview}
                            keyExtractor={(item) => item.id.toString()}
                            scrollEnabled={false}
                        />
                    ) : (
                        <Text style={styles.noReviews}>No reviews yet</Text>
                    )}
                </View>
            </ScrollView>
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
        position: 'absolute',
        top: 10,
        left: 0,
        right: 0,
        zIndex: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.m,
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.small,
    },
    heroImage: {
        width: '100%',
        height: 250,
    },
    infoSection: {
        padding: SPACING.l,
        backgroundColor: COLORS.surface,
    },
    shopName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: SPACING.s,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.m,
    },
    ratingContainer: {
        flexDirection: 'row',
    },
    ratingText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginLeft: SPACING.s,
    },
    reviewCount: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginLeft: SPACING.xs,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.s,
    },
    detailText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginLeft: SPACING.s,
    },
    categoryBadge: {
        backgroundColor: COLORS.primary + '20',
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.xs,
        borderRadius: BORDER_RADIUS.s,
        alignSelf: 'flex-start',
        marginTop: SPACING.s,
    },
    categoryText: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    description: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: SPACING.m,
        lineHeight: 20,
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        marginTop: SPACING.s,
        paddingVertical: SPACING.l,
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    statLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        backgroundColor: COLORS.border,
    },
    reviewsSection: {
        padding: SPACING.l,
        backgroundColor: COLORS.surface,
        marginTop: SPACING.s,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: SPACING.m,
    },
    reviewCard: {
        backgroundColor: COLORS.background,
        padding: SPACING.m,
        borderRadius: BORDER_RADIUS.m,
        marginBottom: SPACING.s,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.s,
    },
    reviewDate: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    reviewComment: {
        fontSize: 14,
        color: COLORS.textPrimary,
        lineHeight: 20,
    },
    noReviews: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        paddingVertical: SPACING.l,
    },
});
