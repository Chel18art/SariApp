import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Analytics({ sales }) {
  
  // LOGIC: Group and count items sold
  const getFastMovingItems = () => {
    const counts = {};
    
    sales.forEach(transaction => {
      // Assuming transaction.items is an array of sold products
      transaction.items?.forEach(item => {
        counts[item.name] = (counts[item.name] || 0) + item.qty;
      });
    });

    // Convert to array and sort
    return Object.entries(counts)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5); // Get Top 5 only
  };

  const topItems = getFastMovingItems();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fast-Moving Items (Top 5)</Text>
      <Text style={styles.sub}>Products with the highest sales volume</Text>

      <View style={styles.list}>
        {topItems.map((item, index) => (
          <View key={index} style={styles.row}>
            <View style={[styles.rankBadge, { backgroundColor: index === 0 ? '#FFD700' : '#F2F2F7' }]}>
              <Text style={styles.rankText}>{index + 1}</Text>
            </View>
            
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemSub}>{item.qty} units sold</Text>
            </View>

            <MaterialCommunityIcons 
              name={index === 0 ? "fire" : "trending-up"} 
              size={24} 
              color={index === 0 ? "#FF3B30" : "#34C759"} 
            />
          </View>
        ))}

        {topItems.length === 0 && (
          <Text style={styles.empty}>No sales data available yet.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginTop: 20 },
  title: { fontSize: 18, fontWeight: '800', color: '#1C1C1E' },
  sub: { fontSize: 12, color: '#8E8E93', marginBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  rankBadge: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  rankText: { fontSize: 14, fontWeight: 'bold' },
  itemName: { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
  itemSub: { fontSize: 12, color: '#8E8E93' },
  empty: { textAlign: 'center', color: '#8E8E93', marginTop: 10 }
});