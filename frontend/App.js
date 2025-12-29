import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import MerchantSetupScreen from './screens/MerchantSetupScreen';
import MerchantDetailScreen from './screens/MerchantDetailScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import SearchScreen from './screens/SearchScreen';
import RegisterScreen from './screens/RegisterScreen';

import './i18n'; // Initialize i18n

// WalletConnect & Wagmi Imports
import { createWeb3Modal, defaultWagmiConfig, Web3Modal } from '@web3modal/wagmi-react-native';
import { WagmiProvider } from 'wagmi';
import { mainnet, polygon, arbitrum } from 'viem/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WALLET_CONNECT_CONFIG } from './auth_config';

const Stack = createNativeStackNavigator();

const projectId = WALLET_CONNECT_CONFIG.projectId || '3a8170812b534d0ff9d794f19a901d64'; // Fallback to a demo ID if empty

const metadata = {
    name: 'FoodRescue',
    description: 'Food Rescue App',
    url: 'https://foodrescue.app',
    icons: ['https://avatars.githubusercontent.com/u/37784886'],
    redirect: {
        native: 'foodrescue://',
        universal: 'https://foodrescue.app'
    }
};

const chains = [mainnet, polygon, arbitrum];

const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata });
const queryClient = new QueryClient();

createWeb3Modal({
    projectId,
    chains,
    wagmiConfig,
    enableAnalytics: true // Optional - defaults to your Cloud configuration
});


export default function App() {
    return (
        <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                <NavigationContainer>
                    <Stack.Navigator initialRouteName="Login">
                        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="MerchantSetup" component={MerchantSetupScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="MerchantDetail" component={MerchantDetailScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="Search" component={SearchScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
                    </Stack.Navigator>
                </NavigationContainer>
                <Web3Modal />
            </QueryClientProvider>
        </WagmiProvider>
    );
}
