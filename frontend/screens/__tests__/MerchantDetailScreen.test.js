import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// Mock navigation
const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
};

// Mock route params
const mockRoute = {
    params: {
        merchantId: 'test_merchant_123',
        userId: 'test_user_456',
    },
};

// Mock fetch
global.fetch = jest.fn();

// Import component (will fail initially - TDD red phase)
import MerchantDetailScreen from '../MerchantDetailScreen';

describe('MerchantDetailScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        fetch.mockImplementation((url) => {
            if (url.includes('/merchant/')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        merchant: {
                            user_id: 'test_merchant_123',
                            shop_name: 'Test Bakery',
                            address: 'Taipei 101',
                            phone: '0912345678',
                            category: 'bakery',
                            description: 'Fresh bread daily',
                            business_hours_open: '09:00',
                            business_hours_close: '21:00',
                        },
                        average_rating: 4.5,
                        total_reviews: 10,
                        product_count: 5,
                    }),
                });
            }
            if (url.includes('/reviews/merchant/')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        reviews: [
                            { id: 1, rating: 5, comment: 'Great!', user_id: 'user1' },
                            { id: 2, rating: 4, comment: 'Good', user_id: 'user2' },
                        ],
                    }),
                });
            }
            if (url.includes('/favorites/check')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ is_favorite: false }),
                });
            }
            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });
    });

    // TEST 1: Renders merchant name
    it('should display merchant shop name', async () => {
        const { getByText } = render(
            <MerchantDetailScreen route={mockRoute} navigation={mockNavigation} />
        );

        await waitFor(() => {
            expect(getByText('Test Bakery')).toBeTruthy();
        });
    });

    // TEST 2: Renders address
    it('should display merchant address', async () => {
        const { getByText } = render(
            <MerchantDetailScreen route={mockRoute} navigation={mockNavigation} />
        );

        await waitFor(() => {
            expect(getByText('Taipei 101')).toBeTruthy();
        });
    });

    // TEST 3: Renders rating
    it('should display average rating', async () => {
        const { getByText } = render(
            <MerchantDetailScreen route={mockRoute} navigation={mockNavigation} />
        );

        await waitFor(() => {
            expect(getByText('4.5')).toBeTruthy();
        });
    });

    // TEST 4: Back button works
    it('should call goBack when back button pressed', async () => {
        const { getByTestId } = render(
            <MerchantDetailScreen route={mockRoute} navigation={mockNavigation} />
        );

        await waitFor(() => {
            const backButton = getByTestId('back-button');
            fireEvent.press(backButton);
            expect(mockNavigation.goBack).toHaveBeenCalled();
        });
    });

    // TEST 5: Favorite toggle works
    it('should toggle favorite when heart button pressed', async () => {
        fetch.mockImplementationOnce(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ is_favorite: true, message: 'Added to favorites' }),
            })
        );

        const { getByTestId } = render(
            <MerchantDetailScreen route={mockRoute} navigation={mockNavigation} />
        );

        await waitFor(() => {
            const favoriteButton = getByTestId('favorite-button');
            fireEvent.press(favoriteButton);
        });

        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/favorites/toggle'),
            expect.any(Object)
        );
    });

    // TEST 6: Renders reviews section
    it('should display reviews', async () => {
        const { getByText } = render(
            <MerchantDetailScreen route={mockRoute} navigation={mockNavigation} />
        );

        await waitFor(() => {
            expect(getByText('Great!')).toBeTruthy();
        });
    });
});
