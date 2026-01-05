import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  Alert, Modal, TextInput, KeyboardAvoidingView, StatusBar, Platform, RefreshControl 
} from 'react-native'; // Added RefreshControl
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db } from '../../firebase'; 
import { collection, onSnapshot, deleteDoc, doc, query, orderBy, addDoc, updateDoc } from 'firebase/firestore';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [sales, setSales] = useState([]);
  const [modal, setModal] = useState(false);
  const [filterModal, setFilterModal] = useState(false);
  
  const [editId, setEditId] = useState(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  // --- ADDED REFRESH STATE ---
  const [refreshing, setRefreshing] = useState(false);

  // --- ADDED REFRESH LOGIC ---
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Since we use onSnapshot, the data updates automatically, 
    // but the spinner provides visual feedback to the user.
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentYear = 2026;

  useEffect(() => {
    const qExp = query(collection(db, "expenses"), orderBy("date", "desc"));
    const unsubExp = onSnapshot(qExp, (snapshot) => {
      setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const qSales = query(collection(db, "sales"), orderBy("date", "desc"));
    const unsubSales = onSnapshot(qSales, (snapshot) => {
      setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsubExp(); unsubSales(); };
  }, []);

  const filteredExpenses = expenses.filter(exp => {
    const d = new Date(exp.date);
    return d.getMonth() === selectedMonth && d.getFullYear() === currentYear;
  });
  const filteredSales = sales.filter(s => {
    const d = new Date(s.date);
    return d.getMonth() === selectedMonth && d.getFullYear() === currentYear;
  });

  const totalSalesVal = filteredSales.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const totalExpVal = filteredExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const netProfit = totalSalesVal - totalExpVal;

  const handleOpenAdd = () => {
    setEditId(null);
    setTitle('');
    setAmount('');
    setModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditId(item.id);
    setTitle(item.title);
    setAmount(item.amount.toString());
    setModal(true);
  };

  const handleSaveExpense = async () => {
    if(!title || !amount) {
        Alert.alert("Required", "Please provide a description and amount.");
        return;
    };

    const expenseData = { 
        title, 
        amount: parseFloat(amount), 
        date: new Date().toISOString().split('T')[0] 
    };

    try {
        if (editId) {
            await updateDoc(doc(db, "expenses", editId), expenseData);
        } else {
            await addDoc(collection(db, "expenses"), expenseData);
        }
        setModal(false);
        setTitle('');
        setAmount('');
        setEditId(null);
    } catch (error) {
        Alert.alert("Error", "Could not save transaction.");
    }
  };

  const exportPDF = async () => {
    const html = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica'; padding: 50px; color: #1a1a1a; line-height: 1.6; }
            .header-title { text-align: center; font-size: 26px; font-weight: 800; letter-spacing: 1px; color: #000; margin-bottom: 5px; }
            .header-date { text-align: center; font-size: 14px; color: #666; margin-bottom: 25px; text-transform: uppercase; }
            .divider { border-bottom: 3px solid #000; margin-bottom: 40px; }
            h2 { font-size: 16px; font-weight: 900; margin-bottom: 15px; color: #000; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            th { background-color: #f8f9fa; border: 1.5px solid #000; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; }
            td { border: 1px solid #e0e0e0; padding: 12px; font-size: 12px; }
            .summary-box { border: 3px solid #000; border-radius: 20px; padding: 30px; margin-top: 50px; background-color: #fff; }
            .summary-row { display: flex; justify-content: space-between; font-size: 16px; font-weight: 500; margin-bottom: 12px; }
            .profit-total { display: flex; justify-content: space-between; font-size: 24px; font-weight: 900; border-top: 2px solid #000; padding-top: 20px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header-title">MONTHLY FINANCIAL REPORT</div>
          <div class="header-date">${months[selectedMonth]} ${currentYear}</div>
          <div class="divider"></div>
          <h2>1. DETAILED SALES</h2>
          <table>
            <thead><tr><th>Date</th><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
            <tbody>
              ${filteredSales.map(s => `<tr><td>${s.date}</td><td>${s.customerName || 'Retail Sale'}</td><td style="text-align:right">₱${(Number(s.total) || 0).toLocaleString()}</td></tr>`).join('')}
            </tbody>
          </table>
          <h2>2. DETAILED EXPENSES</h2>
          <table>
            <thead><tr><th>Date</th><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
            <tbody>
              ${filteredExpenses.map(e => `<tr><td>${e.date}</td><td>${e.title}</td><td style="text-align:right">₱${(Number(e.amount) || 0).toLocaleString()}</td></tr>`).join('')}
            </tbody>
          </table>
          <div class="summary-box">
            <div class="summary-row"><span>Total Revenue:</span><span>₱${totalSalesVal.toLocaleString()}</span></div>
            <div class="summary-row"><span>Total Expenses:</span><span>- ₱${totalExpVal.toLocaleString()}</span></div>
            <div class="profit-total"><span>NET EARNINGS:</span><span>₱${netProfit.toLocaleString()}</span></div>
          </div>
        </body>
      </html>
    `;
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.appBar}>
        <View>
          <Text style={styles.appBarSubtitle}>Business Ledger</Text>
          <TouchableOpacity onPress={() => setFilterModal(true)} style={styles.monthTrigger}>
            <Text style={styles.appBarTitle}>{months[selectedMonth]}</Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color="#636E72" />
          </TouchableOpacity>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.btnSecondary} onPress={exportPDF}>
            <MaterialCommunityIcons name="file-pdf-box" size={24} color="#4834D4" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnPrimary} onPress={handleOpenAdd}>
            <MaterialCommunityIcons name="plus" size={26} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.mainScroll} 
        showsVerticalScrollIndicator={false}
        // --- ADDED REFRESH CONTROL PROPERTY ---
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="#1C1C1E" 
            colors={["#1C1C1E"]}
          />
        }
      >
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>NET CASH FLOW</Text>
          <Text style={[styles.metricValue, {color: netProfit >= 0 ? '#10AC84' : '#EE5253'}]}>
            ₱{netProfit.toLocaleString()}
          </Text>
          
          <View style={styles.miniGrid}>
            <View style={styles.miniStat}>
              <View style={[styles.dot, {backgroundColor: '#10AC84'}]} />
              <Text style={styles.statInfo}>In: ₱{totalSalesVal.toLocaleString()}</Text>
            </View>
            <View style={styles.miniStat}>
              <View style={[styles.dot, {backgroundColor: '#EE5253'}]} />
              <Text style={styles.statInfo}>Out: ₱{totalExpVal.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.listHeader}>Recent Expenses</Text>
          <Text style={styles.countTag}>{filteredExpenses.length} Records</Text>
        </View>
        
        {filteredExpenses.map((item) => (
          <View key={item.id} style={styles.logRow}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="arrow-down-right" size={20} color="#EE5253" />
            </View>
            <View style={styles.logMeta}>
              <Text style={styles.logTitle}>{item.title}</Text>
              <Text style={styles.logDate}>{item.date}</Text>
            </View>
            <View style={styles.logRight}>
              <Text style={styles.logPrice}>-₱{Number(item.amount).toLocaleString()}</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity onPress={() => handleOpenEdit(item)} style={styles.editBtn}>
                    <MaterialCommunityIcons name="pencil-outline" size={18} color="#4834D4" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteDoc(doc(db, "expenses", item.id))}>
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color="#D1D1D1" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={filterModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setFilterModal(false)}>
          <View style={styles.dropdownBox}>
            <ScrollView>{months.map((m, i) => (
              <TouchableOpacity key={m} style={styles.dropdownItem} onPress={() => { setSelectedMonth(i); setFilterModal(false); }}>
                <Text style={[styles.dropdownText, selectedMonth === i && styles.dropdownTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}</ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={modal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior="padding" style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{editId ? "Update Expense" : "New Operating Expense"}</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>DESCRIPTION</Text>
              <TextInput style={styles.inputField} placeholder="e.g. Utility Bills, Rent" value={title} onChangeText={setTitle} placeholderTextColor="#B2BEC3" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>AMOUNT (PHP)</Text>
              <TextInput style={styles.inputField} placeholder="0.00" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholderTextColor="#B2BEC3" />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSaveExpense}>
              <Text style={styles.submitButtonText}>{editId ? "Update Transaction" : "Confirm Entry"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModal(false)}><Text style={styles.dismissLink}>Discard</Text></TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFB' },
  appBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 25, paddingVertical: 15, paddingTop: Platform.OS === 'ios' ? 60 : 40, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  appBarSubtitle: { fontSize: 11, fontWeight: '800', color: '#B2BEC3', textTransform: 'uppercase', letterSpacing: 1.5 },
  monthTrigger: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  appBarTitle: { fontSize: 26, fontWeight: '900', color: '#1C1C1E', marginRight: 4 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  btnSecondary: { padding: 10, backgroundColor: '#F0F0FF', borderRadius: 14, marginRight: 10 },
  btnPrimary: { padding: 10, backgroundColor: '#1C1C1E', borderRadius: 14, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  
  mainScroll: { paddingHorizontal: 25, paddingBottom: 40 },
  metricCard: { backgroundColor: '#FFF', padding: 25, borderRadius: 28, marginTop: 20, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 20, elevation: 3 },
  metricLabel: { fontSize: 10, fontWeight: '800', color: '#B2BEC3', textAlign: 'center', letterSpacing: 2 },
  metricValue: { fontSize: 42, fontWeight: '900', textAlign: 'center', marginVertical: 8, letterSpacing: -1 },
  miniGrid: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 5 },
  miniStat: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statInfo: { fontSize: 12, fontWeight: '700', color: '#636E72' },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 35, marginBottom: 20 },
  listHeader: { fontSize: 18, fontWeight: '900', color: '#1C1C1E' },
  countTag: { fontSize: 11, fontWeight: '700', color: '#B2BEC3', backgroundColor: '#F2F2F7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  
  logRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 20, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10, elevation: 2 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF5F5', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  logMeta: { flex: 1 },
  logTitle: { fontSize: 15, fontWeight: '700', color: '#2D3436' },
  logDate: { fontSize: 11, color: '#B2BEC3', marginTop: 2 },
  logRight: { alignItems: 'flex-end' },
  logPrice: { fontSize: 16, fontWeight: '800', color: '#1C1C1E', marginBottom: 4 },
  actionRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  editBtn: { padding: 2 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  dropdownBox: { backgroundColor: '#FFF', width: '80%', borderRadius: 28, padding: 15, maxHeight: '60%' },
  dropdownItem: { padding: 18, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  dropdownText: { fontSize: 16, textAlign: 'center', color: '#B2BEC3', fontWeight: '600' },
  dropdownTextActive: { color: '#4834D4', fontWeight: '800' },

  bottomSheet: { backgroundColor: '#FFF', width: '100%', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 35, position: 'absolute', bottom: 0 },
  sheetHandle: { width: 40, height: 5, backgroundColor: '#E1E1E1', borderRadius: 10, alignSelf: 'center', marginBottom: 25 },
  sheetTitle: { fontSize: 24, fontWeight: '900', color: '#1C1C1E', marginBottom: 30 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 10, fontWeight: '800', color: '#B2BEC3', marginBottom: 8, letterSpacing: 1 },
  inputField: { backgroundColor: '#F9F9FB', padding: 18, borderRadius: 18, fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  submitButton: { backgroundColor: '#1C1C1E', padding: 22, borderRadius: 20, alignItems: 'center', marginTop: 10 },
  submitButtonText: { color: '#FFF', fontWeight: '900', fontSize: 16, textTransform: 'uppercase' },
  dismissLink: { textAlign: 'center', color: '#B2BEC3', marginTop: 20, fontWeight: '700', fontSize: 14 }
});