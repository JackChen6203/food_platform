import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Production Cloud Run URL - change to localhost if running locally
const API_URL = 'https://food-platform-backend-786175107600.asia-east1.run.app';

export default function LoginScreen({ navigation }) {
    const handleLogin = async (provider, mockId) => {
        console.log(`Logging in with ${provider}...`);

        try {
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    auth_provider: provider,
                    auth_id: mockId || `mock_${provider}_id`,
                    email: `user_${provider}@example.com`,
                })
            });
            const data = await res.json();

            if (res.ok) {
                if (data.is_merchant) {
                    navigation.replace('Home', { user: data, role: 'MERCHANT' });
                } else {
                    navigation.replace('Home', { user: data, role: 'CONSUMER' });
                }
            } else {
                Alert.alert("Login Failed", data.error);
            }
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Network request failed");
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Food Platform Login</Text>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>User / Merchant Login</Text>

                <TouchableOpacity style={[styles.btn, { backgroundColor: '#DB4437' }]} onPress={() => handleLogin('google')}>
                    <Text style={styles.btnText}>Login with Google</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.btn, { backgroundColor: '#4267B2' }]} onPress={() => handleLogin('facebook')}>
                    <Text style={styles.btnText}>Login with Facebook</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.btn, { backgroundColor: '#00C300' }]} onPress={() => handleLogin('line')}>
                    <Text style={styles.btnText}>Login with Line</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.btn, { backgroundColor: '#000000' }]} onPress={() => handleLogin('x')}>
                    <Text style={styles.btnText}>Login with X</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.btn, { backgroundColor: '#F7931A' }]} onPress={() => handleLogin('crypto', '0x123...abc')}>
                    <Text style={styles.btnText}>Login with Crypto Wallet</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Debug / Quick Access</Text>
                <TouchableOpacity style={[styles.btn, styles.secondaryBtn]} onPress={() => handleLogin('google', 'merchant_user_id')}>
                    <Text style={[styles.btnText, styles.secondaryText]}>Simulate Existing Merchant</Text>
                </TouchableOpacity>
            </View>

            <StatusBar style="auto" />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 40,
        color: '#333',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 10,
        textAlign: 'center',
    },
    btn: {
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        alignItems: 'center',
    },
    btnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    secondaryBtn: {
        backgroundColor: '#eee',
    },
    secondaryText: {
        color: '#333',
    },
    divider: {
        height: 1,
        backgroundColor: '#ddd',
        marginVertical: 20,
    }
});
