import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, Alert, Platform, TouchableOpacity, TextInput, Button, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';

// Production Cloud Run URL - change to localhost if running locally
const API_URL = 'https://food-platform-backend-786175107600.asia-east1.run.app';
// const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';

export default function App() {
  const [role, setRole] = useState('CONSUMER'); // CONSUMER or MERCHANT
  const [location, setLocation] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Merchant Form State
  const [newName, setNewName] = useState('');
  const [newOriginalPrice, setNewOriginalPrice] = useState('');
  const [newCurrentPrice, setNewCurrentPrice] = useState('');
  const [expiryMinutes, setExpiryMinutes] = useState('60');

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
      fetchProducts();
    })();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/products`);
      const json = await response.json();
      if (json && Array.isArray(json)) {
        setProducts(json);
      }
    } catch (error) {
      Alert.alert("Error", "Could not fetch products.");
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
        body: JSON.stringify({ consumer_id: 'user_123' }) // Mock User ID
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert("Success", data.message);
        fetchProducts(); // Refresh list
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
          merchant_id: 'merchant_001', // Mock Merchant ID
          name: newName,
          original_price: parseFloat(newOriginalPrice),
          current_price: parseFloat(newCurrentPrice),
          expiry_minutes: parseInt(expiryMinutes),
          latitude: location?.coords.latitude || 25.0330,  // Default or Real GPS
          longitude: location?.coords.longitude || 121.5654
        })
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert("Success", "Product listed!");
        setNewName(''); setNewOriginalPrice(''); setNewCurrentPrice('');
        fetchProducts();
        setRole('CONSUMER'); // Switch back to see it
      } else {
        Alert.alert("Error", data.error);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    return (
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
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Leftover Food</Text>
        <TouchableOpacity onPress={() => setRole(role === 'CONSUMER' ? 'MERCHANT' : 'CONSUMER')} style={styles.roleSwitch}>
          <Text style={styles.roleText}>{role}</Text>
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
          <Button title="Back to List" color="gray" onPress={() => setRole('CONSUMER')} />
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
  container: {
    flex: 1, backgroundColor: '#fff', paddingTop: 50,
  },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10
  },
  header: { fontSize: 24, fontWeight: 'bold' },
  roleSwitch: { backgroundColor: '#ddd', padding: 8, borderRadius: 5 },
  roleText: { fontWeight: 'bold', fontSize: 12 },
  subHeader: { fontSize: 18, fontWeight: '600', marginLeft: 20, marginBottom: 10 },
  list: { paddingHorizontal: 20 },
  card: {
    backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, marginBottom: 10,
    borderWidth: 1, borderColor: '#eee', flexDirection: 'row', alignItems: 'center'
  },
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
