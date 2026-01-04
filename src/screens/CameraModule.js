import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, TextInput, ScrollView, Dimensions } from 'react-native';
import { CameraView } from 'expo-camera';

// Firebase Imports
import { db } from '../../firebase'; 
import { doc, setDoc, collection, writeBatch } from 'firebase/firestore';

const { height, width } = Dimensions.get('window');

export default function CameraModule({ mode, inventory, onClose }) {
  const [scanned, setScanned] = useState(false);
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const [qtyModal, setQtyModal] = useState(false);
  const [formModal, setFormModal] = useState(false);
  const [checkModal, setCheckModal] = useState(false);
  const [viewCartModal, setViewCartModal] = useState(false);

  const [barcode, setBarcode] = useState('');
  const [pName, setPName] = useState('');
  const [pCost, setPCost] = useState(''); 
  const [pPrice, setPPrice] = useState(''); 
  const [pQty, setPQty] = useState('');

  // --- HANDLE SCAN ---
  const handleScan = ({ data }) => {
    if (scanned || formModal || qtyModal || checkModal || viewCartModal) return;
    
    setScanned(true);
    const scannedData = String(data).trim();
    setBarcode(scannedData);

    const found = inventory.find(i => String(i.id).trim() === scannedData);

    if (mode === 'CHECK') {
      if (found) {
        setSelectedProduct(found);
        setCheckModal(true);
      } else {
        Alert.alert("Wala Makita", `Barcode: ${scannedData}\nItem not registered.`, [{ text: "Retry", onPress: () => setScanned(false) }]);
      }
    } 
    else if (mode === 'ADD') {
      if (found) {
        setSelectedProduct(found);
        setPName(found.name || '');
        setPCost(found.cost?.toString() || '0');
        setPPrice(found.price?.toString() || '0');
        setPQty(found.qty?.toString() || '0');
      } else {
        setSelectedProduct(null);
        setPName(''); setPCost(''); setPPrice(''); setPQty('0');
      }
      setFormModal(true);
    } 
    else if (mode === 'SELL') {
      if (found) {
        if (parseInt(found.qty || 0) <= 0) {
          Alert.alert("Hurot na", found.name + " is out of stock.", [{ text: "OK", onPress: () => setScanned(false) }]);
          return;
        }
        setSelectedProduct(found);
        setPQty('1');
        setQtyModal(true);
      } else {
        Alert.alert("Wala Makita", "I-register una kini sa ADD mode.", [{ text: "OK", onPress: () => setScanned(false) }]);
      }
    }
  };

  // --- ADD TO CART (DILI MAG DUPLICATE) ---
  const handleAddToCart = () => {
    const q = parseInt(pQty);
    if (!q || q <= 0) return Alert.alert("Error", "Enter valid quantity");
    
    const existingIndex = cart.findIndex(item => String(item.id) === String(selectedProduct.id));

    if (existingIndex > -1) {
      const updatedCart = [...cart];
      const newTotalQty = updatedCart[existingIndex].cartQty + q;
      
      if (newTotalQty > parseInt(selectedProduct.qty)) {
        Alert.alert("Dili Paigo", `Stocks available: ${selectedProduct.qty}`);
        return;
      }

      updatedCart[existingIndex].cartQty = newTotalQty;
      updatedCart[existingIndex].subtotal = updatedCart[existingIndex].price * newTotalQty;
      setCart(updatedCart);
    } else {
      if (q > parseInt(selectedProduct.qty)) return Alert.alert("Dili Paigo ang Stock");
      setCart([...cart, { ...selectedProduct, cartQty: q, subtotal: selectedProduct.price * q }]);
    }
    setQtyModal(false); 
    setScanned(false);
  };

  // --- CHECKOUT ---
  const processCheckout = async () => {
    if (cart.length === 0) return;
    const batch = writeBatch(db);
    const today = new Date().toISOString().split('T')[0];

    try {
      for (const item of cart) {
        const itemRef = doc(db, "inventory", String(item.id));
        const newQtyValue = (parseInt(item.qty) - item.cartQty).toString();
        batch.update(itemRef, { qty: newQtyValue });

        const salesRef = doc(collection(db, "sales"));
        batch.set(salesRef, {
          date: today,
          itemName: item.name,
          sellingPrice: item.price,
          capitalPrice: item.cost || 0,
          qtySold: item.cartQty,
          total: item.subtotal,
          profit: (item.price - (item.cost || 0)) * item.cartQty,
          createdAt: new Date()
        });
      }

      await batch.commit();
      setCart([]);
      setViewCartModal(false);
      onClose();
      Alert.alert("Success", "Transaction Complete!");
    } catch (error) {
      Alert.alert("Error", "Cloud sync failed. Siguroha nga naka-Create na ang Database sa Firebase.");
    }
  };

  // --- SAVE ITEM ---
  const handleSaveItem = async () => {
    if (!pName) return Alert.alert("Error", "Name is required");
    try {
      const itemRef = doc(db, "inventory", String(barcode));
      await setDoc(itemRef, {
        name: pName,
        cost: parseFloat(pCost || 0),
        price: parseFloat(pPrice || 0),
        qty: pQty.toString(),
        updatedAt: new Date()
      }, { merge: true });

      setFormModal(false);
      setScanned(false);
      Alert.alert("Saved", "Item updated in Cloud!");
    } catch (error) {
      Alert.alert("Error", "Failed to save.");
    }
  };

  const grandTotal = cart.reduce((a, b) => a + b.subtotal, 0);

  return (
    <View style={styles.fullScreen}>
      <CameraView 
        style={StyleSheet.absoluteFillObject} 
        onBarcodeScanned={scanned ? undefined : handleScan}
      />
      
      {/* SCANNER UI */}
      <View style={styles.overlay}>
        <View style={styles.scannerFrame}>
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
        </View>
        <View style={styles.modeBadge}><Text style={styles.badgeText}>{mode} MODE</Text></View>
      </View>

      {/* BOTTOM BAR */}
      <View style={styles.bottomBar}>
        {mode === 'SELL' && cart.length > 0 && (
          <TouchableOpacity style={styles.cartSummaryBar} onPress={() => setViewCartModal(true)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cartBtnText}>🛒 {cart.length} Items in Cart</Text>
              <Text style={styles.latestItemText} numberOfLines={1}>Latest: {cart[cart.length - 1].name}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.totalDueMiniLabel}>TOTAL DUE</Text>
              <Text style={styles.cartAmount}>₱{grandTotal.toFixed(2)}</Text>
            </View>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>EXIT CAMERA</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL: REGISTER / ADD ITEM */}
      <Modal visible={formModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.formCard}>
            <Text style={styles.modalTitle}>{selectedProduct ? 'Edit Product' : 'Register New Item'}</Text>
            <Text style={styles.barcInfo}>Barcode: {barcode}</Text>
            <TextInput placeholder="Item Name" value={pName} style={styles.input} onChangeText={setPName} />
            <View style={styles.row}>
                <View style={{flex:1, marginRight:5}}>
                    <Text style={styles.label}>Cost Price</Text>
                    <TextInput value={pCost} style={styles.input} keyboardType="numeric" onChangeText={setPCost} />
                </View>
                <View style={{flex:1, marginLeft:5}}>
                    <Text style={styles.label}>Sell Price</Text>
                    <TextInput value={pPrice} style={styles.input} keyboardType="numeric" onChangeText={setPPrice} />
                </View>
            </View>
            <Text style={styles.label}>Available Stocks</Text>
            <TextInput value={pQty} style={styles.input} keyboardType="numeric" onChangeText={setPQty} />
            <View style={styles.row}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => {setFormModal(false); setScanned(false);}}><Text>CANCEL</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveItem}><Text style={styles.btnText}>SAVE ITEM</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: PRICE INQUIRY */}
      <Modal visible={checkModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.priceCard}>
            <Text style={styles.priceLabel}>Price Inquiry</Text>
            <Text style={styles.priceName}>{selectedProduct?.name}</Text>
            <Text style={styles.priceValue}>₱{parseFloat(selectedProduct?.price || 0).toFixed(2)}</Text>
            <Text style={styles.priceStock}>Current Stock: {selectedProduct?.qty} units</Text>
            <TouchableOpacity style={styles.mainBtn} onPress={() => {setCheckModal(false); setScanned(false);}}>
              <Text style={styles.btnText}>SCAN NEXT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: QUANTITY INPUT */}
      <Modal visible={qtyModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.formCard, {alignItems:'center'}]}>
            <Text style={styles.modalTitle}>How many pcs?</Text>
            <Text style={{color:'#007AFF', fontWeight:'bold', fontSize:22, marginBottom:10}}>{selectedProduct?.name}</Text>
            <TextInput value={pQty} style={styles.qtyInput} keyboardType="numeric" onChangeText={setPQty} autoFocus selectTextOnFocus />
            <View style={styles.row}>
              <TouchableOpacity style={[styles.cancelBtn, {width:'40%'}]} onPress={() => {setQtyModal(false); setScanned(false);}}><Text>CANCEL</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, {width:'55%'}]} onPress={handleAddToCart}><Text style={styles.btnText}>ADD TO CART</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: CART SUMMARY (DAKO NGA VIEW) */}
      <Modal visible={viewCartModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.fullCard}>
            <View style={styles.modalHeader}>
                <Text style={styles.cartSummaryTitle}>Cart Summary</Text>
                <TouchableOpacity style={styles.closeBtnHeader} onPress={() => setViewCartModal(false)}>
                    <Text style={styles.closeBtnHeaderText}>CLOSE</Text>
                </TouchableOpacity>
            </View>
            
            <ScrollView style={{ flex: 1, marginVertical: 15 }}>
              {cart.map((item, index) => (
                <View key={index} style={styles.cartRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemNameDisplay}>{item.name}</Text>
                    <Text style={styles.itemQtyDisplay}>{item.cartQty} pcs x ₱{item.price.toFixed(2)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.itemSubtotalDisplay}>₱{item.subtotal.toFixed(2)}</Text>
                    <TouchableOpacity style={styles.removeAction} onPress={() => { 
                      const c = [...cart]; 
                      c.splice(index, 1); 
                      setCart(c); 
                    }}>
                      <Text style={styles.removeActionText}>REMOVE</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
            
            <View style={styles.cartFooter}>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total Quantity:</Text>
                    <Text style={styles.totalValue}>{cart.reduce((a, b) => a + b.cartQty, 0)} pcs</Text>
                </View>
                <View style={styles.totalRow}>
                    <Text style={styles.finalDueLabel}>TOTAL DUE:</Text>
                    <Text style={styles.finalDueAmount}>₱{grandTotal.toFixed(2)}</Text>
                </View>
                <TouchableOpacity style={styles.completeBtn} onPress={processCheckout}>
                    <Text style={styles.completeBtnText}>COMPLETE TRANSACTION</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addMoreBtn} onPress={() => setViewCartModal(false)}>
                    <Text style={styles.addMoreText}>+ Add More Items</Text>
                </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: { flex: 1, backgroundColor: 'black' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor:'rgba(0,0,0,0.1)' },
  scannerFrame: { width: 260, height: 180, position: 'relative' },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: '#FFF', borderWidth: 5 },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  modeBadge: { backgroundColor: 'rgba(0,122,255,0.9)', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginTop: 40 },
  badgeText: { color: '#FFF', fontWeight: 'bold' },
  bottomBar: { position: 'absolute', bottom: 30, width: '100%', alignItems: 'center' },
  cartSummaryBar: { backgroundColor: '#FFF', width: '92%', padding: 15, borderRadius: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems:'center', elevation: 10, marginBottom: 15 },
  cartBtnText: { color: '#007AFF', fontWeight: 'bold', fontSize: 16 },
  latestItemText: { color: '#666', fontSize: 12 },
  totalDueMiniLabel: { fontSize: 10, color: '#888', fontWeight: 'bold' },
  cartAmount: { fontSize: 24, fontWeight: 'bold', color: '#28A745' },
  closeBtn: { backgroundColor: 'rgba(255,59,48,0.9)', paddingVertical: 15, paddingHorizontal: 50, borderRadius: 30 },
  closeBtnText: { color: '#FFF', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 15 },
  formCard: { backgroundColor: '#FFF', padding: 25, borderRadius: 25 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  barcInfo: { fontSize: 12, color: '#666', textAlign: 'center', marginBottom: 15 },
  input: { backgroundColor: '#F2F2F7', padding: 15, borderRadius: 12, marginBottom: 15, fontSize: 16 },
  label: { fontSize: 12, color: '#888', marginBottom: 5 },
  qtyInput: { fontSize: 60, textAlign: 'center', fontWeight: 'bold', color: '#007AFF', marginVertical: 15 },
  fullCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 30, height: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 15 },
  cartSummaryTitle: { fontSize: 24, fontWeight: 'bold' },
  closeBtnHeader: { backgroundColor: '#FF3B30', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10 },
  closeBtnHeaderText: { color: '#FFF', fontWeight: 'bold' },
  cartRow: { flexDirection: 'row', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F2F2F7', alignItems: 'center' },
  itemNameDisplay: { fontWeight: 'bold', fontSize: 20, color: '#000' },
  itemQtyDisplay: { fontSize: 16, color: '#007AFF', marginTop: 4 },
  itemSubtotalDisplay: { fontWeight: 'bold', fontSize: 20, color: '#333' },
  removeAction: { backgroundColor: '#FF3B30', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5, marginTop: 8 },
  removeActionText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  cartFooter: { borderTopWidth: 2, borderTopColor: '#F2F2F7', paddingTop: 15 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  totalLabel: { fontSize: 18, color: '#666' },
  totalValue: { fontSize: 20, fontWeight: 'bold' },
  finalDueLabel: { fontSize: 24, fontWeight: 'bold' },
  finalDueAmount: { fontSize: 32, fontWeight: 'bold', color: '#28A745' },
  completeBtn: { backgroundColor: '#28A745', padding: 20, borderRadius: 20, alignItems: 'center', marginTop: 10 },
  completeBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  addMoreBtn: { marginTop: 15, alignItems: 'center' },
  addMoreText: { color: '#007AFF', fontWeight: 'bold', fontSize: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  saveBtn: { backgroundColor: '#007AFF', padding: 15, borderRadius: 15, alignItems: 'center', width: '55%' },
  cancelBtn: { backgroundColor: '#E5E5EA', padding: 15, borderRadius: 15, alignItems: 'center', width: '40%' },
  btnText: { color: '#FFF', fontWeight: 'bold' },
  priceCard: { backgroundColor: '#FFF', padding: 30, borderRadius: 30, alignItems: 'center' },
  priceLabel: { color: '#888', fontSize: 12, fontWeight: 'bold' },
  priceName: { fontSize: 26, fontWeight: 'bold', marginVertical: 10, textAlign:'center' },
  priceValue: { fontSize: 60, fontWeight: 'bold', color: '#007AFF' },
  priceStock: { color: '#FF9500', marginBottom: 25, fontWeight:'600', fontSize: 18 },
  mainBtn: { backgroundColor: '#007AFF', width:'100%', padding: 20, borderRadius: 15, alignItems:'center' }
});