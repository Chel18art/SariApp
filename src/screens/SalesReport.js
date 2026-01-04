import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, SafeAreaView } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function SalesReport({ sales, onUpdate }) {
  const [filter, setFilter] = useState('DAILY');
  const [optModal, setOptModal] = useState(false);

  const getFiltered = () => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    return sales.filter(s => {
      if (filter === 'DAILY') return s.date === todayStr;
      const saleDate = new Date(s.date);
      if (filter === 'WEEKLY') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        return saleDate >= oneWeekAgo;
      }
      return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
    });
  };

  const filteredData = getFiltered();
  const grandTotal = filteredData.reduce((a, b) => a + b.total, 0);
  const totalProfit = filteredData.reduce((a, b) => a + (b.profit || 0), 0);

  const generatePDF = async () => {
    const html = `
      <html>
        <body style="font-family:sans-serif; padding:20px; color: #333;">
          <h1 style="text-align:center;">DETAILED SALES AUDIT (${filter})</h1>
          <table style="width:100%; border-collapse:collapse; margin-top:20px;">
            <tr style="background:#f4f4f4;">
              <th style="padding:10px; border:1px solid #ddd; text-align:left;">Item & Date</th>
              <th style="padding:10px; border:1px solid #ddd;">Qty</th>
              <th style="padding:10px; border:1px solid #ddd;">Unit Cost</th>
              <th style="padding:10px; border:1px solid #ddd;">Unit Price</th>
              <th style="padding:10px; border:1px solid #ddd;">Total Profit</th>
              <th style="padding:10px; border:1px solid #ddd;">Gross Total</th>
            </tr>
            ${filteredData.map(s => `
              <tr>
                <td style="padding:10px; border:1px solid #ddd;">${s.itemName}<br/><small>${s.date}</small></td>
                <td style="padding:10px; border:1px solid #ddd; text-align:center;">${s.qtySold}</td>
                <td style="padding:10px; border:1px solid #ddd; text-align:right;">₱${s.capitalPrice?.toFixed(2)}</td>
                <td style="padding:10px; border:1px solid #ddd; text-align:right;">₱${s.sellingPrice?.toFixed(2)}</td>
                <td style="padding:10px; border:1px solid #ddd; text-align:right; color:green;">₱${s.profit?.toFixed(2)}</td>
                <td style="padding:10px; border:1px solid #ddd; text-align:right; font-weight:bold;">₱${s.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </table>
        </body>
      </html>`;
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri);
  };

  const handleReset = () => {
    Alert.alert(
      "Confirm Factory Reset", 
      "This will permanently delete all sales and inventory. This action cannot be reversed.", 
      [
        { text: "Cancel", style: "cancel" },
        { text: "Wipe All Data", style: "destructive", onPress: async () => {
          await AsyncStorage.clear();
          onUpdate([], []);
          setOptModal(false);
          Alert.alert("Success", "All data has been cleared.");
        }}
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER WITH RESET MOVED TO THE TOP RIGHT GEAR ICON */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerTitle}>Financial Audit</Text>
          <TouchableOpacity style={styles.settingsIcon} onPress={() => setOptModal(true)}>
            <MaterialCommunityIcons name="cog-outline" size={24} color="#8E8E93" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.mainStats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>TOTAL REVENUE</Text>
            <Text style={styles.revValue}>₱{grandTotal.toLocaleString()}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>NET PROFIT</Text>
            <Text style={styles.profValue}>₱{totalProfit.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      {/* FILTER BUTTONS */}
      <View style={styles.filterBar}>
        {['DAILY', 'WEEKLY', 'MONTHLY'].map(f => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[styles.fBtn, filter === f && styles.fBtnActive]}>
            <Text style={[styles.fBtnText, filter === f && styles.fBtnTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ paddingHorizontal: 20 }}>
        {filteredData.map((s) => {
          const markup = (((s.sellingPrice - s.capitalPrice) / s.capitalPrice) * 100).toFixed(0);
          return (
            <View key={s.id} style={styles.auditCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.itemName}>{s.itemName}</Text>
                <View style={styles.markupBadge}>
                  <Text style={styles.markupText}>{markup}% Markup</Text>
                </View>
              </View>
              <Text style={styles.dateText}>{s.date}</Text>
              <View style={styles.grid}>
                <View style={styles.gridItem}><Text style={styles.gLabel}>UNIT COST</Text><Text style={styles.gValue}>₱{s.capitalPrice?.toFixed(2)}</Text></View>
                <View style={styles.gridItem}><Text style={styles.gLabel}>UNIT PRICE</Text><Text style={styles.gValue}>₱{s.sellingPrice?.toFixed(2)}</Text></View>
                <View style={styles.gridItem}><Text style={styles.gLabel}>QUANTITY</Text><Text style={styles.gValue}>{s.qtySold}</Text></View>
              </View>
              <View style={styles.resultBar}>
                <View><Text style={styles.resLabel}>CAPITAL OUTLAY</Text><Text style={styles.resValue}>₱{(s.capitalPrice * s.qtySold).toFixed(2)}</Text></View>
                <View style={{ alignItems: 'flex-end' }}><Text style={[styles.resLabel, { color: '#2ecc71' }]}>NET PROFIT</Text><Text style={[styles.resValue, { color: '#2ecc71' }]}>₱{s.profit?.toFixed(2)}</Text></View>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>GROSS TOTAL SALE</Text>
                <Text style={styles.totalAmount}>₱{s.total.toFixed(2)}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* FOOTER NOW ONLY HAS EXPORT (SAFE) */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.exportBtn} onPress={generatePDF}>
          <MaterialCommunityIcons name="file-pdf-box" size={24} color="white" />
          <Text style={styles.exportText}>EXPORT DETAILED AUDIT (PDF)</Text>
        </TouchableOpacity>
      </View>

      {/* HIDDEN OPTIONS MODAL */}
      <Modal visible={optModal} transparent animationType="fade">
        <TouchableOpacity style={styles.mBg} activeOpacity={1} onPress={() => setOptModal(false)}>
          <View style={styles.mContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.mTitle}>Report Settings</Text>
            <Text style={styles.mSub}>Manage your database and application records.</Text>
            
            <TouchableOpacity style={styles.resetBtnAction} onPress={handleReset}>
              <MaterialCommunityIcons name="alert-octagon" size={24} color="#FF3B30" />
              <View style={{marginLeft: 15}}>
                <Text style={styles.resetTitle}>Factory Reset</Text>
                <Text style={styles.resetSub}>Wipe all sales and inventory data</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setOptModal(false)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>Close Menu</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfcfc' },
  header: { padding: 25, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', paddingTop: 50 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#1a1a1a' },
  settingsIcon: { padding: 5 },
  mainStats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statItem: { flex: 1 },
  statLabel: { fontSize: 10, fontWeight: '700', color: '#aaa', letterSpacing: 1 },
  revValue: { fontSize: 22, fontWeight: '800', color: '#007AFF' },
  profValue: { fontSize: 22, fontWeight: '800', color: '#2ecc71' },
  divider: { width: 1, height: 40, backgroundColor: '#eee', marginHorizontal: 20 },
  filterBar: { flexDirection: 'row', padding: 20, justifyContent: 'space-around' },
  fBtn: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20 },
  fBtnActive: { backgroundColor: '#1a1a1a' },
  fBtnText: { fontSize: 12, fontWeight: '700', color: '#888' },
  fBtnTextActive: { color: '#fff' },
  auditCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#f0f0f0', elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  markupBadge: { backgroundColor: '#f0f9f4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  markupText: { fontSize: 10, color: '#2ecc71', fontWeight: 'bold' },
  dateText: { fontSize: 12, color: '#aaa', marginVertical: 8 },
  grid: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 15, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f9f9f9' },
  gLabel: { fontSize: 9, color: '#bbb', fontWeight: '800' },
  gValue: { fontSize: 14, fontWeight: '600', color: '#444' },
  resultBar: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  resLabel: { fontSize: 9, fontWeight: '800', color: '#aaa' },
  resValue: { fontSize: 15, fontWeight: '700', color: '#444' },
  totalRow: { backgroundColor: '#1a1a1a', padding: 15, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: '#888', fontSize: 10, fontWeight: '800' },
  totalAmount: { color: '#fff', fontSize: 18, fontWeight: '800' },
  footer: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
  exportBtn: { backgroundColor: '#1a1a1a', padding: 18, borderRadius: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  exportText: { color: 'white', fontWeight: 'bold', marginLeft: 10, fontSize: 14 },
  mBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  mContent: { backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 30, paddingBottom: 50 },
  modalHandle: { width: 40, height: 5, backgroundColor: '#eee', borderRadius: 5, alignSelf: 'center', marginBottom: 20 },
  mTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  mSub: { textAlign: 'center', color: '#8E8E93', marginTop: 5, marginBottom: 30 },
  resetBtnAction: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF0F0', padding: 20, borderRadius: 20 },
  resetTitle: { color: '#FF3B30', fontWeight: 'bold', fontSize: 16 },
  resetSub: { color: '#FF3B30', fontSize: 12, opacity: 0.7 },
  closeBtn: { marginTop: 25, alignItems: 'center' },
  closeBtnText: { color: '#007AFF', fontWeight: 'bold' }
});