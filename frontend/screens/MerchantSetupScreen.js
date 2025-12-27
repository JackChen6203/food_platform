import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Alert, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';

// Production Cloud Run URL - change to localhost if running locally
const API_URL = 'https://food-platform-backend-786175107600.asia-east1.run.app';

export default function MerchantSetupScreen({ route, navigation }) {
    const { user } = route.params;
    const [shopName, setShopName] = useState('');
    const [address, setAddress] = useState('');
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Permission denied", "Location permission is required to detect store address.");
                return;
            }
        })();
    }, []);

    const handleUseGPS = async () => {
        setLoading(true);
        try {
            let loc = await Location.getCurrentPositionAsync({});
            setLocation(loc);

            // Reverse Geocoding to get address string
            let reverseGeocode = await Location.reverseGeocodeAsync({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude
            });

            if (reverseGeocode.length > 0) {
                const addr = reverseGeocode[0];
                const fullAddress = `${addr.city || ''} ${addr.district || ''} ${addr.street || ''} ${addr.name || ''}`.trim();
                setAddress(fullAddress);
            }
        } catch (error) {
            Alert.alert("Error", "Could not fetch location");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!shopName || !address) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/merchant/setup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.user_id,
                    shop_name: shopName,
                    address: address,
                    latitude: location?.coords.latitude || 0,
                    longitude: location?.coords.longitude || 0
                })
            });
            const data = await res.json();

            if (res.ok) {
                // Feature Flag: Notification Stub
                Alert.alert("Success", "Merchant Profile Created! Notification sent."); // Stub for notification

                // Navigate back to Home as Merchant
                // We need to update the local user object state to is_merchant = true
                const updatedUser = { ...user, is_merchant: true };
                navigation.replace('Home', { user: updatedUser, role: 'MERCHANT' });
            } else {
                Alert.alert("Error", data.error);
            }
        } catch (e) {
            Alert.alert("Error", "Network request failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Merchant Setup</Text>
            <Text style={styles.subText}>To start selling, we need your shop details.</Text>

            <Text style={styles.label}>Shop Name</Text>
            <TextInput style={styles.input} value={shopName} onChangeText={setShopName} placeholder="Target 101" />

            <Text style={styles.label}>Address</Text>
            <View style={styles.row}>
                <TextInput style={[styles.input, { flex: 1 }]} value={address} onChangeText={setAddress} placeholder="123 Food St" />
                <Button title="GPS" onPress={handleUseGPS} />
            </View>

            {loading ? <ActivityIndicator size="large" /> : <Button title="Save & Start Selling" onPress={handleSave} />}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff', paddingTop: 50 },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
    subText: { fontSize: 14, color: '#666', marginBottom: 20 },
    label: { fontSize: 16, fontWeight: '600', marginBottom: 5 },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, marginBottom: 15 },
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
});
