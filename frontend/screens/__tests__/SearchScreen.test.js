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

// Import component
import SearchScreen from '../SearchScreen';

describe('SearchScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        fetch.mockImplementation(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve([
                    {
                        user_id: 'merchant_1',
                        shop_name: 'Test Bakery',
                        address: 'Taipei 101',
                        category: 'bakery',
                    },
                    {
                        user_id: 'merchant_2',
                        shop_name: 'Sushi House',
                        address: 'Xinyi District',
                        category: 'restaurant',
                    },
                ]),
            })
        );
    });

    // TEST 1: Renders search input
    it('should display search input', async () => {
        const { getByPlaceholderText } = render(
            <SearchScreen route={mockRoute} navigation={mockNavigation} />
        );

        expect(getByPlaceholderText('search_placeholder')).toBeTruthy();
    });

    // TEST 2: Back button works
    it('should call goBack when back button pressed', async () => {
        const { getByTestId } = render(
            <SearchScreen route={mockRoute} navigation={mockNavigation} />
        );

        const backButton = getByTestId('back-button');
        fireEvent.press(backButton);
        expect(mockNavigation.goBack).toHaveBeenCalled();
    });

    // TEST 3: Search triggers API call
    it('should call search API when typing', async () => {
        const { getByPlaceholderText } = render(
            <SearchScreen route={mockRoute} navigation={mockNavigation} />
        );

        const searchInput = getByPlaceholderText('search_placeholder');
        fireEvent.changeText(searchInput, 'Bakery');

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/merchants/search'),
                expect.any(Object)
            );
        });
    });

    // TEST 4: Renders search results
    it('should display search results', async () => {
        const { getByPlaceholderText, getByText } = render(
            <SearchScreen route={mockRoute} navigation={mockNavigation} />
        );

        const searchInput = getByPlaceholderText('search_placeholder');
        fireEvent.changeText(searchInput, 'Bakery');

        await waitFor(() => {
            expect(getByText('Test Bakery')).toBeTruthy();
        });
    });

    // TEST 5: Navigate to merchant on press
    it('should navigate to merchant detail on result press', async () => {
        const { getByPlaceholderText, getByText } = render(
            <SearchScreen route={mockRoute} navigation={mockNavigation} />
        );

        const searchInput = getByPlaceholderText('search_placeholder');
        fireEvent.changeText(searchInput, 'Bakery');

        await waitFor(() => {
            const result = getByText('Test Bakery');
            fireEvent.press(result);
            expect(mockNavigation.navigate).toHaveBeenCalledWith('MerchantDetail', expect.any(Object));
        });
    });
});
