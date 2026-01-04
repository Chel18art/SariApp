import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function Dashboard({ setView, setMode, sales, expenses = [] }) {
  const todayStr = new Date().toISOString().split('T')[0];
  
  // 1. STATS LOGIC
  const dailySales = sales.filter(s => s.date === todayStr);
  const dailyExpenses = expenses.filter(e => e.date === todayStr);

  const todayRevenue = dailySales.reduce((a, b) => a + b.total, 0);
  const grossProfit = dailySales.reduce((a, b) => a + (b.profit || 0), 0);
  const totalExpenses = dailyExpenses.reduce((a, b) => a + b.amount, 0);
  const netProfit = grossProfit - totalExpenses;

  // 2. FAST MOVING LOGIC (All time or per month)
  const getFastMovingItems = () => {
    const counts = {};
    sales.forEach(s => {
      counts[s.itemName] = (counts[s.itemName] || 0) + s.qtySold;
    });
    return Object.entries(counts)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 3); // Get top 3
  };

  const fastMoving = getFastMovingItems();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
        
        {/* WELCOME SECTION */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greet}>Business Overview</Text>
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

        {/* FAST MOVING SECTION - BAG-O NI */}
        <Text style={styles.sectionTitle}>🔥 Fast Moving Items</Text>
        <View style={styles.analyticsCard}>
          {fastMoving.length > 0 ? fastMoving.map((item, index) => (
            <View key={index} style={[styles.analyticsRow, index === fastMoving.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemQty}>{item.qty} sold</Text>
            </View>
          )) : (
            <Text style={{color: '#8E8E93', textAlign: 'center'}}>No sales data yet</Text>
          )}
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

  // ANALYTICS STYLE
  analyticsCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 15, elevation: 2 },
  analyticsRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  rankBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#F2F2F7', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  rankText: { fontSize: 12, fontWeight: '800', color: '#1C1C1E' },
  itemName: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  itemQty: { fontSize: 14, fontWeight: '700', color: '#007AFF' },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E', marginTop: 25, marginBottom: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  tile: { backgroundColor: '#FFF', width: '48%', padding: 20, borderRadius: 24, marginBottom: 15, elevation: 2 },
  iconContainer: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  tileLabel: { fontSize: 15, fontWeight: '700', color: '#1C1C1E' },
  tileSub: { fontSize: 11, color: '#AEAEB2', marginTop: 2 }
});