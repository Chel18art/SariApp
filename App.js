import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, StatusBar, View, TouchableOpacity, Text, ActivityIndicator } from 'react-native';

// 1. Firebase Imports
import { db } from './firebase'; 
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

import Dashboard from './src/screens/Dashboard';
import Inventory from './src/screens/Inventory';
import SalesReport from './src/screens/SalesReport';
import CameraModule from './src/screens/CameraModule';

export default function App() {
  const [currentView, setCurrentView] = useState('DASHBOARD');
  const [appMode, setAppMode] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  // 2. Real-time Database Sync (The Heart of the App)
  useEffect(() => {
    // Listen to Inventory Changes
    const qInv = query(collection(db, "inventory"));
    const unsubInv = onSnapshot(qInv, (snapshot) => {
      const invData = snapshot.docs.map(doc => ({ 
        id: doc.id, // This is the Barcode
        ...doc.data() 
      }));
      setInventory(invData);
      setLoading(false);
    }, (error) => console.error("Inventory Sync Error:", error));

    // Listen to Sales Changes
    const qSales = query(collection(db, "sales"), orderBy("createdAt", "desc"));
    const unsubSales = onSnapshot(qSales, (snapshot) => {
      const salesData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setSales(salesData);
    }, (error) => console.error("Sales Sync Error:", error));

    // Cleanup connections when the app closes
    return () => {
      unsubInv();
      unsubSales();
    };
  }, []);

  const handleBack = () => {
    setCurrentView('DASHBOARD');
    setAppMode(null);
  };

  if (loading) {
    return (
      <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor: '#F2F2F7'}}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{marginTop: 10, color: '#888', fontWeight: '600'}}>Connecting to POS Cloud...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerText}>POS <Text style={{color:'#007AFF'}}>PRO</Text></Text>
      </View>

      <View style={styles.main}>
        {appMode ? (
          <CameraModule 
            mode={appMode} 
            inventory={inventory} 
            sales={sales}
            onClose={handleBack}
            // Note: CameraModule now handles its own Firestore updates
          />
        ) : (
          <>
            {currentView === 'DASHBOARD' && (
              <Dashboard setView={setCurrentView} setMode={setAppMode} sales={sales} inventory={inventory} />
            )}
            {currentView === 'INVENTORY' && (
              <Inventory inventory={inventory} />
            )}
            {currentView === 'SALES' && (
              <SalesReport sales={sales} inventory={inventory} />
            )}
          </>
        )}
      </View>

      {!appMode && (
        <View style={styles.nav}>
          <TouchableOpacity style={styles.navBtn} onPress={() => setCurrentView('DASHBOARD')}>
            <Text style={[styles.navIcon, currentView === 'DASHBOARD' && {opacity: 1}]}>🏠</Text>
            <Text style={[styles.navT, currentView === 'DASHBOARD' && {color: '#007AFF'}]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => setCurrentView('INVENTORY')}>
            <Text style={[styles.navIcon, currentView === 'INVENTORY' && {opacity: 1}]}>📦</Text>
            <Text style={[styles.navT, currentView === 'INVENTORY' && {color: '#007AFF'}]}>Stocks</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => setCurrentView('SALES')}>
            <Text style={[styles.navIcon, currentView === 'SALES' && {opacity: 1}]}>📊</Text>
            <Text style={[styles.navT, currentView === 'SALES' && {color: '#007AFF'}]}>Sales</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { height: 60, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderColor: '#DDD' },
  headerText: { fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  main: { flex: 1 },
  nav: { height: 80, backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderTopWidth: 1, borderColor: '#DDD' },
  navBtn: { alignItems:'center', flex: 1 },
  navIcon: { fontSize: 22, opacity: 0.4 },
  navT: { fontSize: 10, color: '#888', marginTop: 4, fontWeight: '600' }
});