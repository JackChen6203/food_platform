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
import NotificationsScreen from '../NotificationsScreen';

describe('NotificationsScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        fetch.mockImplementation(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    notifications: [
                        {
                            id: 1,
                            title: 'New Deal!',
                            body: '50% off at Test Bakery',
                            type: 'promotion',
                            is_read: false,
                            created_at: new Date().toISOString(),
                        },
                        {
                            id: 2,
                            title: 'Order Ready',
                            body: 'Your order is ready for pickup',
                            type: 'order',
                            is_read: true,
                            created_at: new Date().toISOString(),
                        },
                    ],
                    unread_count: 1,
                }),
            })
        );
    });

    // TEST 1: Renders title
    it('should display screen title', async () => {
        const { getByText } = render(
            <NotificationsScreen route={mockRoute} navigation={mockNavigation} />
        );

        await waitFor(() => {
            expect(getByText('notifications')).toBeTruthy();
        });
    });

    // TEST 2: Renders notifications
    it('should display notification titles', async () => {
        const { getByText } = render(
            <NotificationsScreen route={mockRoute} navigation={mockNavigation} />
        );

        await waitFor(() => {
            expect(getByText('New Deal!')).toBeTruthy();
            expect(getByText('Order Ready')).toBeTruthy();
        });
    });

    // TEST 3: Back button works
    it('should call goBack when back button pressed', async () => {
        const { getByTestId } = render(
            <NotificationsScreen route={mockRoute} navigation={mockNavigation} />
        );

        await waitFor(() => {
            const backButton = getByTestId('back-button');
            fireEvent.press(backButton);
            expect(mockNavigation.goBack).toHaveBeenCalled();
        });
    });

    // TEST 4: Mark as read on press
    it('should mark notification as read on press', async () => {
        const { getByText } = render(
            <NotificationsScreen route={mockRoute} navigation={mockNavigation} />
        );

        await waitFor(() => {
            const notification = getByText('New Deal!');
            fireEvent.press(notification);
        });

        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/notifications/1/read'),
            expect.any(Object)
        );
    });

    // TEST 5: Empty state
    it('should display empty state when no notifications', async () => {
        fetch.mockImplementationOnce(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    notifications: [],
                    unread_count: 0,
                }),
            })
        );

        const { getByText } = render(
            <NotificationsScreen route={mockRoute} navigation={mockNavigation} />
        );

        await waitFor(() => {
            expect(getByText('no_notifications')).toBeTruthy();
        });
    });
});
