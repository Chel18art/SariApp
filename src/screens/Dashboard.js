import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function Dashboard({ setView, setMode, sales, expenses = [] }) {
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Logic for Today's Stats
  const dailySales = sales.filter(s => s.date === todayStr);
  const dailyExpenses = expenses.filter(e => e.date === todayStr);

  const todayRevenue = dailySales.reduce((a, b) => a + b.total, 0);
  const grossProfit = dailySales.reduce((a, b) => a + (b.profit || 0), 0);
  const totalExpenses = dailyExpenses.reduce((a, b) => a + b.amount, 0);
  
  // NET PROFIT = Margin minus Expenses
  const netProfit = grossProfit - totalExpenses;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
        
        {/* WELCOME SECTION */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greet}>SARI APP</Text>
            <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
          </View>
          <TouchableOpacity style={styles.profileBtn}>
            <MaterialCommunityIcons name="account-circle-outline" size={28} color="#333" />
          </TouchableOpacity>
        </View>

        {/* HERO STATS CARD */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <Text style={styles.heroLabel}>TODAY'S REVENUE</Text>
            <MaterialCommunityIcons name="trending-up" size={20} color="#34C759" />
          </View>
          <Text style={styles.heroVal}>₱{todayRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
          
          <View style={styles.heroDivider} />
          
          <View style={styles.heroBottom}>
            <View style={{ flex: 1 }}>
              <Text style={styles.subLabel}>TOTAL EXPENSES</Text>
              <Text style={[styles.subVal, { color: '#FF3B30' }]}>-₱{totalExpenses.toLocaleString()}</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={[styles.subLabel, { textAlign: 'right' }]}>NET PROFIT</Text>
              <Text style={[styles.subVal, { color: netProfit >= 0 ? '#34C759' : '#FF3B30' }]}>
                {netProfit >= 0 ? '+' : ''}₱{netProfit.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* MAIN MENU GRID */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.grid}>
          <MenuTile color="#4A90E2" icon="cart-outline" label="Sell / POS" sub="Transactions" onPress={() => setMode('SELL')} />
          <MenuTile color="#5856D6" icon="barcode-scan" label="Price Check" sub="Scanner" onPress={() => setMode('CHECK')} />
          <MenuTile color="#FF3B30" icon="wallet-outline" label="Expenses" sub="Record Costs" onPress={() => setView('EXPENSES')} />
          <MenuTile color="#FF9500" icon="plus-box-outline" label="Add Stock" sub="Restock Items" onPress={() => setMode('ADD')} />
          <MenuTile color="#34C759" icon="archive-outline" label="Inventory" sub="Stock Mgmt" onPress={() => setView('INVENTORY')} />
          <MenuTile color="#AF52DE" icon="file-document-outline" label="Reports" sub="Audit Log" onPress={() => setView('SALES')} />
        </View>

        {/* BOTTOM TILE */}
        <TouchableOpacity style={styles.reportTile} onPress={() => setView('SALES')}>
          <View style={styles.reportIconBg}>
            <MaterialCommunityIcons name="chart-box-outline" size={26} color="#FFF" />
          </View>
          <View style={{flex: 1, marginLeft: 15}}>
            <Text style={styles.reportTitle}>Financial Analytics</Text>
            <Text style={styles.reportSub}>View history and PDF reports</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#C7C7CC" />
        </TouchableOpacity>

        {/* --- COPYRIGHT SECTION --- */}
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
  date: { fontSize: 14, color: '#8E8E93', fontWeight: '500' },
  profileBtn: { padding: 5 },
  
  heroCard: { backgroundColor: '#1C1C1E', borderRadius: 24, padding: 25, elevation: 8 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLabel: { color: '#8E8E93', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  heroVal: { color: '#FFF', fontSize: 36, fontWeight: '800', marginVertical: 10 },
  heroDivider: { height: 1, backgroundColor: '#333', marginVertical: 15 },
  heroBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subLabel: { color: '#8E8E93', fontSize: 10, fontWeight: '700', marginBottom: 2 },
  subVal: { fontSize: 18, fontWeight: '700' },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E', marginTop: 30, marginBottom: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  
  tile: { backgroundColor: '#FFF', width: '48%', padding: 20, borderRadius: 24, marginBottom: 15, elevation: 2 },
  iconContainer: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  tileLabel: { fontSize: 15, fontWeight: '700', color: '#1C1C1E' },
  tileSub: { fontSize: 11, color: '#AEAEB2', marginTop: 2 },

  reportTile: { backgroundColor: '#FFF', padding: 20, borderRadius: 24, flexDirection: 'row', alignItems: 'center', marginTop: 5, elevation: 2 },
  reportIconBg: { backgroundColor: '#1C1C1E', padding: 12, borderRadius: 15 },
  reportTitle: { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
  reportSub: { fontSize: 12, color: '#8E8E93', marginTop: 2 },

  // COPYRIGHT STYLES
  copyrightContainer: {
    marginTop: 40,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyrightText: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '700',
    marginTop: 5,
  },
  versionText: {
    fontSize: 10,
    color: '#C7C7CC',
    marginTop: 2,
    letterSpacing: 1,
    textTransform: 'uppercase'
  }
});