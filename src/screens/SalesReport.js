import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, SafeAreaView, Platform, TextInput, RefreshControl } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker'; 

export default function SalesReport({ sales, onUpdate }) {
  const [filter, setFilter] = useState('DAILY');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [optModal, setOptModal] = useState(false);

  // --- ADDED REFRESH STATE ---
  const [refreshing, setRefreshing] = useState(false);

  // --- ADDED REFRESH FUNCTION ---
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const getFiltered = () => {
    const selDateStr = selectedDate.toISOString().split('T')[0];
    
    return sales.filter(s => {
      const matchesSearch = s.itemName.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (filter === 'DAILY') {
        return s.date === selDateStr;
      }
      
      const saleDate = new Date(s.date);
      if (filter === 'WEEKLY') {
        const oneWeekAgo = new Date(selectedDate);
        oneWeekAgo.setDate(selectedDate.getDate() - 7);
        return saleDate >= oneWeekAgo && saleDate <= selectedDate;
      }
      
      if (filter === 'MONTHLY') {
        return saleDate.getMonth() === selectedDate.getMonth() && 
               saleDate.getFullYear() === selectedDate.getFullYear();
      }
      
      return true;
    });
  };

  const filteredData = getFiltered();
  const grandTotal = filteredData.reduce((a, b) => a + b.total, 0);
  const totalProfit = filteredData.reduce((a, b) => a + (b.profit || 0), 0);

  const onDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) setSelectedDate(date);
  };

  const generatePDF = async () => {
    if (filteredData.length === 0) return Alert.alert("Empty", "No data matches your filters.");
    const dateStr = selectedDate.toISOString().split('T')[0];
    const fileName = `${filter}_Audit_${dateStr}`;

    const html = `
      <html>
        <head>
          <style>
            body { font-family: sans-serif; padding: 30px; }
            h1 { text-align: center; font-size: 24px; margin-bottom: 5px; }
            p { text-align: center; margin-bottom: 20px; color: #666; }
            table { width: 100%; border-collapse: collapse; }
            th { border-bottom: 2px solid #000; padding: 10px; text-align: left; font-size: 12px; }
            td { border-bottom: 1px solid #eee; padding: 10px; font-size: 14px; }
            .total-box { margin-top: 30px; text-align: right; border-top: 2px solid #000; padding-top: 10px; }
          </style>
        </head>
        <body>
          <h1>SALES AUDIT REPORT</h1>
          <p>Range: ${filter} | Focus Date: ${selectedDate.toLocaleDateString()}</p>
          <table>
            <thead>
              <tr>
                <th>Item/Date</th>
                <th>Qty</th>
                <th>Cost</th>
                <th>Selling</th>
                <th style="text-align:right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData.map(s => `
                <tr>
                  <td>${s.itemName}<br/><small>${s.date}</small></td>
                  <td style="text-align:center;">${s.qtySold}</td>
                  <td>₱${s.capitalPrice?.toFixed(2)}</td>
                  <td>₱${s.sellingPrice?.toFixed(2)}</td>
                  <td style="text-align:right;">₱${s.total.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total-box">
            <h2>Total Revenue: ₱${grandTotal.toLocaleString()}</h2>
            <h2 style="color: green;">Net Profit: ₱${totalProfit.toLocaleString()}</h2>
          </div>
        </body>
      </html>`;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = uri; link.download = `${fileName}.pdf`; link.click();
      } else {
        await Sharing.shareAsync(uri);
      }
    } catch (e) { Alert.alert("Error", "Download failed."); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.topRow}>
          <Text style={styles.title}>Audit Log</Text>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateBtn}>
            <MaterialCommunityIcons name="calendar-month" size={24} color="#007AFF" />
            <Text style={styles.dateBtnText}>{selectedDate.toLocaleDateString()}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={22} color="#888" />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search items..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.statPill}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>SALES</Text>
          <Text style={styles.statValue}>₱{grandTotal.toLocaleString()}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>PROFIT</Text>
          <Text style={[styles.statValue, {color: '#28A745'}]}>₱{totalProfit.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.tabBar}>
        {['DAILY', 'WEEKLY', 'MONTHLY'].map(f => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[styles.tab, filter === f && styles.activeTab]}>
            <Text style={[styles.tabText, filter === f && styles.activeTabText]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView 
        style={styles.list}
        // --- ADDED REFRESH CONTROL PROPERTY ---
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="#007AFF" 
            colors={["#007AFF"]}
          />
        }
      >
        {filteredData.length === 0 ? (
          <Text style={styles.empty}>No matches found.</Text>
        ) : (
          filteredData.map((item, idx) => (
            <View key={idx} style={styles.row}>
              <View style={{ flex: 3 }}>
                <Text style={styles.itemTitle}>{item.itemName}</Text>
                <Text style={styles.itemDate}>{item.date}</Text>
              </View>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={styles.qtyText}>{item.qtySold}</Text>
                <Text style={styles.qtyLabel}>QTY</Text>
              </View>
              <View style={{ flex: 2, alignItems: 'flex-end' }}>
                <Text style={styles.totalText}>₱{item.total.toFixed(0)}</Text>
                <Text style={styles.profitText}>+₱{item.profit?.toFixed(0)}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.exportBtn} onPress={generatePDF}>
          <MaterialCommunityIcons name="printer-eye" size={24} color="#FFF" />
          <Text style={styles.exportBtnText}>DOWNLOAD PDF REPORT</Text>
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker value={selectedDate} mode="date" display="default" onChange={onDateChange} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#000' },
  dateBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F7FF', padding: 10, borderRadius: 12 },
  dateBtnText: { marginLeft: 8, fontWeight: 'bold', color: '#007AFF' },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', paddingHorizontal: 15, borderRadius: 15, height: 50 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, fontWeight: '500' },

  statPill: { flexDirection: 'row', margin: 15, padding: 20, backgroundColor: '#000', borderRadius: 20 },
  statBox: { flex: 1, alignItems: 'center' },
  statLabel: { color: '#888', fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
  statValue: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },

  tabBar: { flexDirection: 'row', paddingHorizontal: 15, marginBottom: 10 },
  tab: { flex: 1, padding: 12, alignItems: 'center' },
  activeTab: { borderBottomWidth: 3, borderBottomColor: '#000' },
  tabText: { color: '#AAA', fontWeight: 'bold' },
  activeTabText: { color: '#000' },

  list: { flex: 1, paddingHorizontal: 20 },
  row: { flexDirection: 'row', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F9F9F9', alignItems: 'center' },
  itemTitle: { fontSize: 18, fontWeight: 'bold' },
  itemDate: { fontSize: 12, color: '#AAA' },
  qtyText: { fontSize: 16, fontWeight: 'bold' },
  qtyLabel: { fontSize: 9, color: '#BBB' },
  totalText: { fontSize: 18, fontWeight: 'bold' },
  profitText: { fontSize: 13, color: '#28A745', fontWeight: 'bold' },

  footer: { padding: 20 },
  exportBtn: { backgroundColor: '#000', padding: 20, borderRadius: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  exportBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  empty: { textAlign: 'center', marginTop: 40, color: '#AAA' }
});