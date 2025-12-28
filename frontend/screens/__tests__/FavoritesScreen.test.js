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
        userId: 'test_user_456',
    },
};

// Mock fetch
global.fetch = jest.fn();

// Import component (will fail initially - TDD red phase)
import FavoritesScreen from '../FavoritesScreen';

describe('FavoritesScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        fetch.mockImplementation(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve([
                    {
                        id: 1,
                        merchant_id: 'merchant_1',
                        shop_name: 'Test Bakery',
                        address: 'Taipei 101',
                        category: 'bakery',
                    },
                    {
                        id: 2,
                        merchant_id: 'merchant_2',
                        shop_name: 'Sushi House',
                        address: 'Xinyi District',
                        category: 'restaurant',
                    },
                ]),
            })
        );
    });

    // TEST 1: Renders title
    it('should display screen title', async () => {
        const { getByText } = render(
            <FavoritesScreen route={mockRoute} navigation={mockNavigation} />
        );

        await waitFor(() => {
            expect(getByText('favorites')).toBeTruthy();
        });
    });

    // TEST 2: Renders favorite merchants
    it('should display favorite merchant names', async () => {
        const { getByText } = render(
            <FavoritesScreen route={mockRoute} navigation={mockNavigation} />
        );

        await waitFor(() => {
            expect(getByText('Test Bakery')).toBeTruthy();
            expect(getByText('Sushi House')).toBeTruthy();
        });
    });

    // TEST 3: Back button works
    it('should call goBack when back button pressed', async () => {
        const { getByTestId } = render(
            <FavoritesScreen route={mockRoute} navigation={mockNavigation} />
        );

        await waitFor(() => {
            const backButton = getByTestId('back-button');
            fireEvent.press(backButton);
            expect(mockNavigation.goBack).toHaveBeenCalled();
        });
    });

    // TEST 4: Navigate to merchant detail on press
    it('should navigate to merchant detail on item press', async () => {
        const { getByText } = render(
            <FavoritesScreen route={mockRoute} navigation={mockNavigation} />
        );

        await waitFor(() => {
            const merchantItem = getByText('Test Bakery');
            fireEvent.press(merchantItem);
            expect(mockNavigation.navigate).toHaveBeenCalledWith('MerchantDetail', expect.any(Object));
        });
    });

    // TEST 5: Empty state
    it('should display empty state when no favorites', async () => {
        fetch.mockImplementationOnce(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve([]),
            })
        );

        const { getByText } = render(
            <FavoritesScreen route={mockRoute} navigation={mockNavigation} />
        );

        await waitFor(() => {
            expect(getByText('no_favorites')).toBeTruthy();
        });
    });
});
