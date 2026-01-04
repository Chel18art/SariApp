import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, TextInput, SafeAreaView, Platform, KeyboardAvoidingView, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db } from '../../firebase'; 
import { collection, addDoc, onSnapshot, deleteDoc, doc, query, orderBy, updateDoc } from 'firebase/firestore';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [modal, setModal] = useState(false);
  const [filterModal, setFilterModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  useEffect(() => {
    const q = query(collection(db, "expenses"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExpenses(data);
    });
    return () => unsubscribe();
  }, []);

  const currentYear = new Date().getFullYear();
  const filteredExpenses = expenses.filter(exp => {
    const d = new Date(exp.date);
    return d.getMonth() === selectedMonth && d.getFullYear() === currentYear;
  });

  const totalExpenses = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);

  const handleSave = async () => {
    if (!title || !amount) return Alert.alert("Missing Info", "Please provide a description and amount.");
    try {
      if (editId) {
        await updateDoc(doc(db, "expenses", editId), { title: title.trim(), amount: parseFloat(amount) });
      } else {
        await addDoc(collection(db, "expenses"), {
          title: title.trim(),
          amount: parseFloat(amount),
          date: new Date().toISOString().split('T')[0],
          timestamp: new Date()
        });
      }
      setModal(false);
    } catch (e) { Alert.alert("Error", "Could not process request."); }
  };

  const deleteExpense = (id) => {
    Alert.alert("Delete Record", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => await deleteDoc(doc(db, "expenses", id)) }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* PROFESSIONAL HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Business Outflow</Text>
          <TouchableOpacity onPress={() => setFilterModal(true)} style={styles.monthPicker}>
            <Text style={styles.headerTitle}>{months[selectedMonth]}</Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color="#1C1C1E" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => { setEditId(null); setTitle(''); setAmount(''); setModal(true); }}>
          <MaterialCommunityIcons name="plus" size={28} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* SLEEK SUMMARY CARD */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryLabel}>Total Expenses</Text>
          <Text style={styles.summaryAmount}>₱{totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
        </View>

        {/* TRANSACTIONS LIST */}
        <View style={styles.listContainer}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>History</Text>
            <Text style={styles.itemCount}>{filteredExpenses.length} items</Text>
          </View>

          {filteredExpenses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="database-off-outline" size={48} color="#D1D1D6" />
              <Text style={styles.emptyText}>No records for {months[selectedMonth]}</Text>
            </View>
          ) : (
            filteredExpenses.map(item => (
              <View key={item.id} style={styles.expenseItem}>
                <View style={styles.iconCircle}>
                  <MaterialCommunityIcons name="arrow-down-right" size={20} color="#FF3B30" />
                </View>
                
                <View style={styles.itemMain}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemDate}>{new Date(item.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.itemAmount}>- ₱{item.amount.toLocaleString()}</Text>
                  <View style={styles.itemActions}>
                    <TouchableOpacity onPress={() => { setEditId(item.id); setTitle(item.title); setAmount(item.amount.toString()); setModal(true); }}>
                      <MaterialCommunityIcons name="pencil" size={16} color="#8E8E93" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteExpense(item.id)} style={{ marginLeft: 15 }}>
                      <MaterialCommunityIcons name="trash-can-outline" size={16} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* FILTER MODAL */}
      <Modal visible={filterModal} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay} onPress={() => setFilterModal(false)}>
          <View style={styles.dropdownCard}>
            <Text style={styles.modalHeading}>Select Month</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {months.map((m, i) => (
                <TouchableOpacity key={m} style={styles.dropItem} onPress={() => { setSelectedMonth(i); setFilterModal(false); }}>
                  <Text style={[styles.dropText, selectedMonth === i && styles.dropActiveText]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ADD/EDIT MODAL */}
      <Modal visible={modal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior="padding" style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{editId ? "Update Entry" : "New Expense"}</Text>
              <TouchableOpacity onPress={() => setModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <Text style={styles.inputLabel}>WHAT WAS THIS FOR?</Text>
              <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. Office Supplies" placeholderTextColor="#C7C7CC" />

              <Text style={styles.inputLabel}>AMOUNT (₱)</Text>
              <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0.00" placeholderTextColor="#C7C7CC" />

              <TouchableOpacity style={styles.mainButton} onPress={handleSave}>
                <Text style={styles.mainButtonText}>{editId ? "Save Changes" : "Confirm Expense"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, paddingTop: 20, paddingBottom: 10 },
  welcomeText: { fontSize: 13, fontWeight: '600', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 0.5 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1C1C1E', marginRight: 5 },
  monthPicker: { flexDirection: 'row', alignItems: 'center' },
  addButton: { backgroundColor: '#1C1C1E', width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', elevation: 4 },

  summarySection: { paddingHorizontal: 25, paddingVertical: 20 },
  summaryLabel: { fontSize: 14, color: '#8E8E93', fontWeight: '500' },
  summaryAmount: { fontSize: 36, fontWeight: '800', color: '#1C1C1E', marginTop: 5 },

  listContainer: { paddingHorizontal: 25, marginTop: 10 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  listTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E' },
  itemCount: { fontSize: 13, color: '#8E8E93', fontWeight: '500' },

  expenseItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  iconCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#F2F2F7', justifyContent: 'center', alignItems: 'center' },
  itemMain: { flex: 1, marginLeft: 15 },
  itemTitle: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  itemDate: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  itemAmount: { fontSize: 16, fontWeight: '700', color: '#FF3B30' },
  itemActions: { flexDirection: 'row', marginTop: 6 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  dropdownCard: { width: '80%', backgroundColor: '#FFF', borderRadius: 24, padding: 20, elevation: 20 },
  modalHeading: { fontSize: 17, fontWeight: '700', marginBottom: 15, textAlign: 'center' },
  dropItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  dropText: { fontSize: 16, color: '#1C1C1E', textAlign: 'center' },
  dropActiveText: { color: '#FF3B30', fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 25 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  sheetTitle: { fontSize: 20, fontWeight: '800' },
  form: { paddingBottom: 20 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: '#8E8E93', marginBottom: 8 },
  input: { backgroundColor: '#F2F2F7', padding: 18, borderRadius: 16, marginBottom: 20, fontSize: 16, color: '#1C1C1E', fontWeight: '600' },
  mainButton: { backgroundColor: '#1C1C1E', padding: 20, borderRadius: 16, alignItems: 'center' },
  mainButtonText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#AEAEB2', marginTop: 10, fontSize: 15 }
});