import React, { useState, useCallback } from 'react'; 
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Dimensions, Alert, Modal, TextInput, RefreshControl } from 'react-native'; 
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function Dashboard({ setView, setMode, sales, expenses = [], onResetAll }) {
  const [pinVisible, setPinVisible] = useState(false);
  const [inputPin, setInputPin] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const dailySales = sales.filter(s => s.date === todayStr);
  const dailyExpenses = expenses.filter(e => e.date === todayStr);

  const todayRevenue = dailySales.reduce((a, b) => a + b.total, 0);
  const grossProfit = dailySales.reduce((a, b) => a + (b.profit || 0), 0);
  const totalExpenses = dailyExpenses.reduce((a, b) => a + b.amount, 0);
  const netProfit = grossProfit - totalExpenses;

  const handleVerifyPin = () => {
    if (inputPin === "1972") {
      setPinVisible(false);
      setInputPin('');
      Alert.alert(
        "Final Warning",
        "PIN Correct. Wipe the entire database?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "YES, RESET", style: "destructive", onPress: () => onResetAll() }
        ]
      );
    } else {
      Alert.alert("Error", "Incorrect PIN!");
      setInputPin('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Modal visible={pinVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Admin PIN</Text>
            <TextInput
              style={styles.pinInput}
              placeholder="****"
              secureTextEntry
              keyboardType="numeric"
              maxLength={4}
              value={inputPin}
              onChangeText={setInputPin}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => { setPinVisible(false); setInputPin(''); }}>
                <Text style={styles.btnCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleVerifyPin}>
                <Text style={styles.btnConfirm}>Verify</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1C1C1E" colors={["#1C1C1E"]} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greet}>SARI APP</Text>
            <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
          </View>
          <TouchableOpacity style={styles.profileBtn} onPress={() => setPinVisible(true)}>
            <MaterialCommunityIcons name="cog-outline" size={26} color="#333" />
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <Text style={styles.heroLabel}>TODAY'S REVENUE</Text>
            <MaterialCommunityIcons name="trending-up" size={20} color="#34C759" />
          </View>
          <Text style={styles.heroVal}>₱{todayRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
          
          {/* GI-FIX NA: View na ni, dili na div */}
          <View style={styles.heroDivider} />
          
          <View style={styles.heroBottom}>
            <View style={{ flex: 1 }}>
              <Text style={styles.subLabel}>EXPENSES</Text>
              <Text style={[styles.subVal, { color: '#FF3B30' }]}>-₱{totalExpenses.toLocaleString()}</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={[styles.subLabel, { textAlign: 'right' }]}>NET PROFIT</Text>
              <Text style={[styles.subVal, { color: netProfit >= 0 ? '#34C759' : '#FF3B30' }]}>₱{netProfit.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.grid}>
          <MenuTile color="#4A90E2" icon="cart-outline" label="Sell / POS" sub="Transactions" onPress={() => setMode('SELL')} />
          <MenuTile color="#5856D6" icon="barcode-scan" label="Price Check" sub="Scanner" onPress={() => setMode('CHECK')} />
          <MenuTile color="#FF3B30" icon="wallet-outline" label="Expenses" sub="Costs" onPress={() => setView('EXPENSES')} />
          <MenuTile color="#FF9500" icon="plus-box-outline" label="Add Stock" sub="Restock" onPress={() => setMode('ADD')} />
          <MenuTile color="#34C759" icon="archive-outline" label="Inventory" sub="Stock Mgmt" onPress={() => setView('INVENTORY')} />
          <MenuTile color="#AF52DE" icon="file-document-outline" label="Reports" sub="Audit Log" onPress={() => setView('SALES')} />
        </View>

        <View style={styles.copyrightContainer}>
          <MaterialCommunityIcons name="shield-check-outline" size={16} color="#AEAEB2" />
          <Text style={styles.copyrightText}>Developed by Richelle Mae Arat</Text>
          <Text style={styles.versionText}>v1.0.2 Premium</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const MenuTile = ({ color, icon, label, sub, onPress }) => (
  <TouchableOpacity style={styles.tile} onPress={onPress}>
    <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
      <MaterialCommunityIcons name={icon} size={28} color={color} />
    </View>
    <Text style={styles.tileLabel}>{label}</Text>
    <Text style={styles.tileSub}>{sub}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, marginTop: 10 },
  greet: { fontSize: 24, fontWeight: '800', color: '#1C1C1E' },
  date: { fontSize: 14, color: '#8E8E93' },
  profileBtn: { padding: 5 },
  heroCard: { backgroundColor: '#1C1C1E', borderRadius: 24, padding: 25 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between' },
  heroLabel: { color: '#8E8E93', fontSize: 11, fontWeight: '800' },
  heroVal: { color: '#FFF', fontSize: 36, fontWeight: '800', marginVertical: 10 },
  heroDivider: { height: 1, backgroundColor: '#333', marginVertical: 15 },
  heroBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  subLabel: { color: '#8E8E93', fontSize: 10 },
  subVal: { fontSize: 18, fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginTop: 30, marginBottom: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  tile: { backgroundColor: '#FFF', width: '48%', padding: 20, borderRadius: 24, marginBottom: 15 },
  iconContainer: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  tileLabel: { fontSize: 15, fontWeight: '700' },
  tileSub: { fontSize: 11, color: '#AEAEB2' },
  copyrightContainer: { marginTop: 40, alignItems: 'center' },
  copyrightText: { fontSize: 13, color: '#8E8E93', fontWeight: '700' },
  versionText: { fontSize: 10, color: '#C7C7CC' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', padding: 30, borderRadius: 20, width: '80%', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  pinInput: { borderBottomWidth: 2, borderColor: '#007AFF', width: '100%', fontSize: 24, textAlign: 'center', marginBottom: 30, color: '#333' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  btnCancel: { color: '#8E8E93', fontWeight: 'bold' },
  btnConfirm: { color: '#007AFF', fontWeight: 'bold' }
});