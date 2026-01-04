import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, TextInput, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons'; 

export default function Inventory({ inventory, onUpdate }) {
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  
  const [pName, setPName] = useState('');
  const [pCost, setPCost] = useState(''); 
  const [pPrice, setPPrice] = useState('');
  const [pQty, setPQty] = useState('');

  const openEdit = (item) => {
    setEditItem(item);
    setPName(item.name);
    setPCost(item.cost ? item.cost.toString() : '0'); 
    setPPrice(item.price.toString());
    setPQty(item.qty.toString());
    setModal(true);
  };

  const saveEdit = () => {
    const newList = inventory.map(i => 
      i.id === editItem.id ? { 
        ...i, 
        name: pName, 
        cost: parseFloat(pCost || 0), 
        price: parseFloat(pPrice || 0), 
        qty: parseInt(pQty || 0) 
      } : i
    );
    onUpdate(newList);
    setModal(false);
    Alert.alert("Updated", "Inventory record has been modified.");
  };

  const deleteItem = (item) => {
    Alert.alert("Delete Product", `Are you sure you want to remove ${item.name}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => onUpdate(inventory.filter(i => i.id !== item.id)) }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Inventory</Text>
          <Text style={styles.headerSub}>{inventory.length} Total Products</Text>
        </View>
        <TouchableOpacity style={styles.searchBtn}>
          <MaterialCommunityIcons name="magnify" size={24} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
        {inventory.map(item => {
          const isLowStock = parseInt(item.qty) <= 5;
          const profitMargin = item.price - (item.cost || 0);

          return (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{flex: 1}}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <View style={[styles.stockBadge, isLowStock ? styles.lowStockBg : styles.normalStockBg]}>
                    <Text style={[styles.stockText, isLowStock ? styles.lowStockText : styles.normalStockText]}>
                      {isLowStock ? 'LOW STOCK' : 'IN STOCK'}: {item.qty} units
                    </Text>
                  </View>
                </View>
                
                <View style={styles.actionRow}>
                  <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionBtn}>
                    <MaterialCommunityIcons name="pencil-box-outline" size={24} color="#007AFF" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteItem(item)} style={styles.actionBtn}>
                    <MaterialCommunityIcons name="trash-can-outline" size={24} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>COST</Text>
                  <Text style={styles.statValue}>₱{parseFloat(item.cost || 0).toLocaleString()}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>SELLING</Text>
                  <Text style={[styles.statValue, {color: '#28A745'}]}>₱{parseFloat(item.price).toLocaleString()}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>EST. PROFIT</Text>
                  <Text style={[styles.statValue, {color: '#007AFF'}]}>₱{profitMargin.toLocaleString()}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* EDIT MODAL */}
      <Modal visible={modal} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Product</Text>
              <TouchableOpacity onPress={() => setModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>PRODUCT NAME</Text>
            <TextInput value={pName} style={styles.input} onChangeText={setPName} placeholder="Item description" />
            
            <View style={styles.inputRow}>
              <View style={{flex: 1, marginRight: 10}}>
                <Text style={styles.inputLabel}>COST PRICE (₱)</Text>
                <TextInput value={pCost} style={styles.input} keyboardType="numeric" onChangeText={setPCost} />
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.inputLabel}>SELLING PRICE (₱)</Text>
                <TextInput value={pPrice} style={styles.input} keyboardType="numeric" onChangeText={setPPrice} />
              </View>
            </View>

            <Text style={styles.inputLabel}>STOCK COUNT</Text>
            <TextInput value={pQty} style={styles.input} keyboardType="numeric" onChangeText={setPQty} />

            <TouchableOpacity style={styles.saveBtn} onPress={saveEdit}>
              <Text style={styles.saveBtnText}>SAVE PRODUCT</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25, paddingTop: 40 },
  headerTitle: { fontSize: 32, fontWeight: '800', color: '#1C1C1E' },
  headerSub: { fontSize: 13, color: '#8E8E93', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  searchBtn: { backgroundColor: '#FFF', padding: 10, borderRadius: 12, elevation: 2, shadowOpacity: 0.1 },
  
  card: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#1C1C1E', marginBottom: 5 },
  
  stockBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  lowStockBg: { backgroundColor: '#FF3B3015' },
  normalStockBg: { backgroundColor: '#E8F5E9' },
  stockText: { fontSize: 10, fontWeight: 'bold' },
  lowStockText: { color: '#FF3B30' },
  normalStockText: { color: '#2E7D32' },
  
  actionRow: { flexDirection: 'row' },
  actionBtn: { marginLeft: 15 },

  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F2F2F7', paddingTop: 15 },
  statBox: { alignItems: 'flex-start' },
  statLabel: { fontSize: 9, fontWeight: '800', color: '#AEAEB2', marginBottom: 4 },
  statValue: { fontSize: 15, fontWeight: '700', color: '#1C1C1E' },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 30, padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  inputLabel: { fontSize: 10, fontWeight: '800', color: '#8E8E93', marginBottom: 8, marginLeft: 5 },
  input: { backgroundColor: '#F2F2F7', padding: 15, borderRadius: 15, marginBottom: 15, fontSize: 16, fontWeight: '600' },
  inputRow: { flexDirection: 'row', justifyContent: 'space-between' },
  saveBtn: { backgroundColor: '#1C1C1E', padding: 20, borderRadius: 18, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});