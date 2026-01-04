import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, StatusBar, View, Alert, TouchableOpacity, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Dashboard from './src/screens/Dashboard';
import Inventory from './src/screens/Inventory';
import SalesReport from './src/screens/SalesReport';
import CameraModule from './src/screens/CameraModule';

export default function App() {
  const [currentView, setCurrentView] = useState('DASHBOARD');
  const [appMode, setAppMode] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [sales, setSales] = useState([]);

  useEffect(() => { loadAllData(); }, []);

  const loadAllData = async () => {
    try {
      const inv = await AsyncStorage.getItem('@sari_inventory');
      const sls = await AsyncStorage.getItem('@sari_sales');
      if (inv) setInventory(JSON.parse(inv));
      if (sls) setSales(JSON.parse(sls));
    } catch (e) { console.log("Load Error"); }
  };

  const syncData = async (newInv, newSls) => {
    try {
      if (newInv !== null && newInv !== undefined) {
        setInventory(newInv);
        await AsyncStorage.setItem('@sari_inventory', JSON.stringify(newInv));
      }
      if (newSls !== null && newSls !== undefined) {
        setSales(newSls);
        await AsyncStorage.setItem('@sari_sales', JSON.stringify(newSls));
      }
    } catch (e) { console.log("Sync Error:", e); }
  };

  const handleBack = () => {
    setCurrentView('DASHBOARD');
    setAppMode(null);
  };

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
            onUpdate={(inv, sls) => syncData(inv, sls)} 
          />
        ) : (
          <>
            {currentView === 'DASHBOARD' && (
              <Dashboard setView={setCurrentView} setMode={setAppMode} sales={sales} inventory={inventory} />
            )}
            {currentView === 'INVENTORY' && (
              <Inventory inventory={inventory} onUpdate={(n) => syncData(n, sales)} />
            )}
            {currentView === 'SALES' && (
              <SalesReport 
                sales={sales} 
                inventory={inventory} // I-pass ang inventory sa SalesReport
                onUpdate={(inv, sls) => syncData(inv, sls)} // Tugoti ang SalesReport sa pag-update sa duha
              />
            )}
          </>
        )}
      </View>

      {!appMode && (
        <View style={styles.nav}>
          <TouchableOpacity style={styles.navBtn} onPress={() => setCurrentView('DASHBOARD')}>
            <Text style={styles.navIcon}>🏠</Text><Text style={styles.navT}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => setCurrentView('INVENTORY')}>
            <Text style={styles.navIcon}>📦</Text><Text style={styles.navT}>Stocks</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => setCurrentView('SALES')}>
            <Text style={styles.navIcon}>📊</Text><Text style={styles.navT}>Sales</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { height: 60, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderColor: '#DDD' },
  headerText: { fontSize: 18, fontWeight: 'bold' },
  main: { flex: 1 },
  nav: { height: 80, backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderTopWidth: 1, borderColor: '#DDD' },
  navBtn: { alignItems:'center' },
  navIcon: { fontSize: 24 },
  navT: { fontSize: 10, color: '#888' }
});