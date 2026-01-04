import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, TextInput, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons'; 

// Firebase imports
import { db } from '../../firebase'; 
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';

export default function Inventory({ inventory }) {
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  
  const [pName, setPName] = useState('');
  const [pCost, setPCost] = useState(''); 
  const [pPrice, setPPrice] = useState('');
  const [pQty, setPQty] = useState('');

  // 1. Logic para sa Search (Optional implementation)
  const [searchQuery, setSearchQuery] = useState('');

  const openEdit = (item) => {
    setEditItem(item);
    setPName(item.name);
    setPCost(item.cost ? item.cost.toString() : '0'); 
    setPPrice(item.price.toString());
    setPQty(item.qty.toString());
    setModal(true);
  };

  const saveEdit = async () => {
    if (!editItem) return;
    try {
      const itemRef = doc(db, "inventory", editItem.id);
      await updateDoc(itemRef, {
        name: pName,
        cost: parseFloat(pCost || 0),
        price: parseFloat(pPrice || 0),
        qty: parseInt(pQty || 0)
      });
      setModal(false);
      Alert.alert("Success", "Product updated in cloud.");
    } catch (error) {
      Alert.alert("Error", "Failed to update product.");
    }
  };

  const deleteItem = (item) => {
    Alert.alert("Delete Product", `Are you sure you want to remove ${item.name}?`, [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive", 
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "inventory", item.id));
          } catch (error) {
            Alert.alert("Error", "Could not delete item.");
          }
        } 
      }
    ]);
  };

  // Filter inventory based on search
  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Inventory</Text>
          <Text style={styles.headerSub}>{inventory.length} Total Products</Text>
        </View>
      </View>

      {/* SEARCH BAR ADDED */}
      <View style={styles.searchWrapper}>
        <MaterialCommunityIcons name="magnify" size={20} color="#8E8E93" />
        <TextInput 
          placeholder="Search products..." 
          style={styles.searchBar}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
        {filteredInventory.map(item => {
          // LOW STOCK LOGIC (Set to 5 units as threshold)
          const isLowStock = parseInt(item.qty) <= 5;
          const profitMargin = item.price - (item.cost || 0);

          return (
            <View key={item.id} style={[styles.card, isLowStock && styles.cardLowStock]}>
              <View style={styles.cardHeader}>
                <View style={{flex: 1}}>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    {isLowStock && (
                       <MaterialCommunityIcons name="alert-decagram" size={20} color="#FF3B30" style={{marginLeft: 8}} />
                    )}
                  </View>

                  <View style={[styles.stockBadge, isLowStock ? styles.lowStockBg : styles.normalStockBg]}>
                    <Text style={[styles.stockText, isLowStock ? styles.lowStockText : styles.normalStockText]}>
                      {isLowStock ? '⚠️ LOW STOCK' : '✅ IN STOCK'}: {item.qty} units
                    </Text>
                  </View>
                </View>
                
                <View style={styles.actionRow}>
                  <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionBtn}>
                    <MaterialCommunityIcons name="pencil-box-outline" size={26} color="#007AFF" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteItem(item)} style={styles.actionBtn}>
                    <MaterialCommunityIcons name="trash-can-outline" size={26} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>COST</Text>
                  <Text style={styles.statValue}>₱{parseFloat(item.cost || 0).toFixed(2)}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>SELLING</Text>
                  <Text style={[styles.statValue, {color: '#28A745'}]}>₱{parseFloat(item.price).toFixed(2)}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>MARGIN</Text>
                  <Text style={[styles.statValue, {color: '#007AFF'}]}>₱{profitMargin.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* MODAL SECTION REMAINS SAME */}
      <Modal visible={modal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Product</Text>
              <TouchableOpacity onPress={() => setModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={30} color="#CCC" />
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
  header: { padding: 25, paddingTop: 40 },
  headerTitle: { fontSize: 32, fontWeight: '800', color: '#1C1C1E' },
  headerSub: { fontSize: 13, color: '#8E8E93', fontWeight: '600', textTransform: 'uppercase' },
  
  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', marginHorizontal: 20, paddingHorizontal: 15, borderRadius: 15, height: 50, marginBottom: 20, elevation: 2, shadowOpacity: 0.05 },
  searchBar: { flex: 1, marginLeft: 10, fontSize: 16, fontWeight: '600' },

  card: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 15, borderLeftWidth: 0 },
  cardLowStock: { borderLeftWidth: 8, borderLeftColor: '#FF3B30' }, // Visual indicator for low stock
  
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#1C1C1E' },
  
  stockBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginTop: 5 },
  lowStockBg: { backgroundColor: '#FF3B3015' },
  normalStockBg: { backgroundColor: '#E8F5E9' },
  stockText: { fontSize: 11, fontWeight: '900' },
  lowStockText: { color: '#FF3B30' },
  normalStockText: { color: '#2E7D32' },
  
  actionRow: { flexDirection: 'row' },
  actionBtn: { marginLeft: 15 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F2F2F7', paddingTop: 15 },
  statBox: { alignItems: 'flex-start' },
  statLabel: { fontSize: 9, fontWeight: '800', color: '#AEAEB2', marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '800', color: '#1C1C1E' },
  
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25, paddingBottom: 50 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 22, fontWeight: '800' },
  inputLabel: { fontSize: 10, fontWeight: '800', color: '#8E8E93', marginBottom: 8, marginLeft: 5 },
  input: { backgroundColor: '#F2F2F7', padding: 18, borderRadius: 18, marginBottom: 15, fontSize: 16, fontWeight: '600' },
  inputRow: { flexDirection: 'row', justifyContent: 'space-between' },
  saveBtn: { backgroundColor: '#000', padding: 20, borderRadius: 20, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 }
});