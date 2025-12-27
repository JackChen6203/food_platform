import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, Alert, TouchableOpacity, TextInput, Button, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';

// Production Cloud Run URL - change to localhost if running locally
const API_URL = 'https://food-platform-backend-786175107600.asia-east1.run.app';

export default function HomeScreen({ route, navigation }) {
    const { user: initialUser, role: initialRole } = route.params;

    // Local state
    const [user, setUser] = useState(initialUser);
    const [role, setRole] = useState(initialRole || 'CONSUMER');

    const [location, setLocation] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);

    // Merchant Form State
    const [newName, setNewName] = useState('');
    const [newOriginalPrice, setNewOriginalPrice] = useState('');
    const [newCurrentPrice, setNewCurrentPrice] = useState('');
    const [expiryMinutes, setExpiryMinutes] = useState('60');

    useEffect(() => {
        // Update user/role if params change (e.g. returning from MerchantSetup)
        if (route.params?.user) setUser(route.params.user);
        if (route.params?.role) setRole(route.params.role);

        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Permission denied", "Location access is needed.");
                return;
            }
            let loc = await Location.getCurrentPositionAsync({});
            setLocation(loc);
            fetchProducts();
        })();
    }, [route.params]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/products`);
            const json = await response.json();
            if (json && Array.isArray(json)) {
                setProducts(json);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    const handlePurchase = async (productID) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/purchase/${productID}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ consumer_id: user.user_id })
            });
            const data = await res.json();
            if (res.ok) {
                Alert.alert("Success", data.message);
                fetchProducts();
            } else {
                Alert.alert("Purchase Failed", data.error);
            }
        } catch (err) {
            Alert.alert("Error", "Network error");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProduct = async () => {
        if (!newName || !newOriginalPrice || !newCurrentPrice) {
            Alert.alert("Error", "Please fill all fields");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    merchant_id: user.user_id, // Use real User ID
                    name: newName,
                    original_price: parseFloat(newOriginalPrice),
                    current_price: parseFloat(newCurrentPrice),
                    expiry_minutes: parseInt(expiryMinutes),
                    latitude: location?.coords.latitude || 25.0330,
                    longitude: location?.coords.longitude || 121.5654
                })
            });
            const data = await res.json();
            if (res.ok) {
                Alert.alert("Success", "Product listed!");
                setNewName(''); setNewOriginalPrice(''); setNewCurrentPrice('');
                fetchProducts();
            } else {
                Alert.alert("Error", data.error);
            }
        } catch (err) {
            Alert.alert("Error", "Failed to create product");
        } finally {
            setLoading(false);
        }
    };

    const toggleRole = () => {
        if (role === 'CONSUMER') {
            if (user.is_merchant) {
                setRole('MERCHANT');
            } else {
                // Navigate to Setup
                navigation.navigate('MerchantSetup', { user });
            }
        } else {
            setRole('CONSUMER');
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.name}</Text>
                <View style={styles.priceRow}>
                    <Text style={styles.originalPrice}>${item.original_price}</Text>
                    <Text style={styles.currentPrice}>${item.current_price}</Text>
                </View>
                <Text style={styles.expiry}>Expiry: {new Date(item.expiry_date).toLocaleTimeString()}</Text>
            </View>
            {role === 'CONSUMER' && (
                <TouchableOpacity
                    style={[styles.buyButton, item.status === 'SOLD' && styles.disabledButton]}
                    onPress={() => item.status !== 'SOLD' && handlePurchase(item.id)}
                    disabled={item.status === 'SOLD'}
                >
                    <Text style={styles.buyText}>{item.status === 'SOLD' ? 'SOLD' : 'BUY'}</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.header}>Welcome, {role}</Text>
                <TouchableOpacity onPress={toggleRole} style={styles.roleSwitch}>
                    <Text style={styles.roleText}>{role === 'CONSUMER' ? 'Switch to Merchant' : 'Switch to Consumer'}</Text>
                </TouchableOpacity>
            </View>

            {role === 'MERCHANT' ? (
                <ScrollView style={styles.form}>
                    <Text style={styles.subHeader}>List New Item</Text>
                    <TextInput placeholder="Product Name" style={styles.input} value={newName} onChangeText={setNewName} />
                    <TextInput placeholder="Original Price" keyboardType="numeric" style={styles.input} value={newOriginalPrice} onChangeText={setNewOriginalPrice} />
                    <TextInput placeholder="Current Price" keyboardType="numeric" style={styles.input} value={newCurrentPrice} onChangeText={setNewCurrentPrice} />
                    <TextInput placeholder="Expiry (Minutes from now)" keyboardType="numeric" style={styles.input} value={expiryMinutes} onChangeText={setExpiryMinutes} />
                    <Button title="List Product" onPress={handleCreateProduct} />
                </ScrollView>
            ) : (
                <>
                    <Text style={styles.subHeader}>Nearby Deals</Text>
                    {loading && <ActivityIndicator />}
                    <FlatList
                        data={products}
                        renderItem={renderItem}
                        keyExtractor={item => item.id.toString()}
                        contentContainerStyle={styles.list}
                        refreshing={loading}
                        onRefresh={fetchProducts}
                    />
                </>
            )}
            <StatusBar style="auto" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', paddingTop: 10 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10, marginTop: 10 },
    header: { fontSize: 20, fontWeight: 'bold' },
    roleSwitch: { backgroundColor: '#ddd', padding: 8, borderRadius: 5 },
    roleText: { fontWeight: 'bold', fontSize: 12 },
    subHeader: { fontSize: 18, fontWeight: '600', marginLeft: 20, marginBottom: 10 },
    list: { paddingHorizontal: 20 },
    card: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#eee', flexDirection: 'row', alignItems: 'center' },
    title: { fontSize: 18, fontWeight: '600' },
    priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
    originalPrice: { textDecorationLine: 'line-through', color: 'gray', marginRight: 10, fontSize: 16 },
    currentPrice: { color: 'green', fontWeight: 'bold', fontSize: 20 },
    expiry: { marginTop: 5, fontSize: 12, color: '#555' },
    buyButton: { backgroundColor: '#ff6347', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20 },
    disabledButton: { backgroundColor: '#ccc' },
    buyText: { color: 'white', fontWeight: 'bold' },
    form: { padding: 20 },
    input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 15, borderRadius: 5 },
});
