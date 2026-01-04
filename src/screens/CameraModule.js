import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, TextInput, ScrollView, Dimensions } from 'react-native';
import { CameraView } from 'expo-camera';

const { height } = Dimensions.get('window');

export default function CameraModule({ mode, inventory, sales, onClose, onUpdate }) {
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
  const [discount, setDiscount] = useState('0');

  const handleScan = ({ data }) => {
    if (scanned || formModal || qtyModal || checkModal || viewCartModal) return;
    
    setScanned(true);
    const found = inventory.find(i => i.id === data);
    setBarcode(data);

    if (mode === 'CHECK') {
      if (found) {
        setSelectedProduct(found);
        setCheckModal(true);
      } else {
        Alert.alert("Error", "Item not found.", [{ text: "Retry", onPress: () => setScanned(false) }]);
      }
    } 
    else if (mode === 'ADD') {
      if (found) {
        setSelectedProduct(found);
        setPName(found.name);
        setPCost(found.cost?.toString() || '');
        setPPrice(found.price?.toString() || '');
        setPQty(found.qty?.toString() || '0');
      } else {
        setSelectedProduct(null);
        setPName(''); setPCost(''); setPPrice(''); setPQty('0');
      }
      setFormModal(true);
    } 
    else if (mode === 'SELL') {
      if (found) {
        if (parseInt(found.qty) <= 0) {
          Alert.alert("Out of Stock", found.name + " is empty.", [{ text: "OK", onPress: () => setScanned(false) }]);
          return;
        }
        setSelectedProduct(found);
        setPQty('1');
        setQtyModal(true);
      } else {
        Alert.alert("Unknown Barcode", "Please register this item in ADD mode first.", [{ text: "OK", onPress: () => setScanned(false) }]);
      }
    }
  };

  // --- KINI NGA PART ANG GI-UPDATE PARA SA SELL LOGIC ---
  const handleAddToCart = () => {
    const q = parseInt(pQty);
    if (!q || q <= 0) return Alert.alert("Error", "Enter valid quantity");
    
    const existingIndex = cart.findIndex(item => item.id === selectedProduct.id);

    if (existingIndex > -1) {
      const updatedCart = [...cart];
      const newQty = updatedCart[existingIndex].cartQty + q;

      if (newQty > parseInt(selectedProduct.qty)) {
        Alert.alert("Insufficient", "Total in cart exceeds stock. Only " + selectedProduct.qty + " available.");
        return;
      }

      updatedCart[existingIndex].cartQty = newQty;
      updatedCart[existingIndex].subtotal = updatedCart[existingIndex].price * newQty;
      setCart(updatedCart);
    } else {
      if (q > parseInt(selectedProduct.qty)) return Alert.alert("Insufficient Stock");
      setCart([...cart, { ...selectedProduct, cartQty: q, subtotal: selectedProduct.price * q }]);
    }

    setQtyModal(false); 
    setScanned(false);
  };

  const processCheckout = () => {
    if (cart.length === 0) return;
    const today = new Date().toISOString().split('T')[0];
    const totalDiscount = parseFloat(discount) || 0;
    
    const updatedInventory = inventory.map(invItem => {
      const soldItem = cart.find(c => c.id === invItem.id);
      return soldItem ? { ...invItem, qty: (parseInt(invItem.qty) - soldItem.cartQty).toString() } : invItem;
    });

    const newSalesBatch = cart.map(item => ({
      id: Date.now().toString() + Math.random(),
      date: today,
      itemName: item.name,
      sellingPrice: item.price,
      capitalPrice: item.cost || 0,
      qtySold: item.cartQty,
      total: item.subtotal - (totalDiscount / cart.length),
      profit: ((item.price - (item.cost || 0)) * item.cartQty) - (totalDiscount / cart.length)
    }));

    onUpdate(updatedInventory, [...newSalesBatch, ...sales]);
    setCart([]);
    setDiscount('0');
    setViewCartModal(false);
    onClose();
    Alert.alert("Done", "Transaction Successful!");
  };

  const grandTotal = cart.reduce((a, b) => a + b.subtotal, 0) - (parseFloat(discount) || 0);

  return (
    <View style={styles.fullScreen}>
      <CameraView 
        style={StyleSheet.absoluteFillObject} 
        onBarcodeScanned={scanned ? undefined : handleScan}
        barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "qr", "code128"] }}
      />
      
      <View style={styles.overlay}>
        <View style={styles.scannerFrame}>
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
        </View>
        <View style={styles.modeBadge}><Text style={styles.badgeText}>{mode} MODE ACTIVE</Text></View>
      </View>

      <View style={styles.bottomBar}>
        {mode === 'SELL' && cart.length > 0 && (
          <TouchableOpacity style={styles.cartSummary} onPress={() => setViewCartModal(true)}>
            <View>
              <Text style={styles.cartBtnText}>🛒 {cart.length} ITEMS IN CART</Text>
              <Text style={styles.cartSubText}>Tap to review & checkout</Text>
            </View>
            <Text style={styles.cartAmount}>₱{cart.reduce((a, b) => a + b.subtotal, 0).toFixed(2)}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>EXIT CAMERA</Text>
        </TouchableOpacity>
      </View>

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

      <Modal visible={formModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.formCard}>
            <Text style={styles.modalTitle}>{selectedProduct ? 'Edit Product' : 'Register New Item'}</Text>
            <Text style={styles.barcInfo}>Barcode: {barcode}</Text>
            <TextInput placeholder="Item Name" value={pName} style={styles.input} onChangeText={setPName} />
            <View style={styles.row}>
                <View style={{flex:1, marginRight:5}}>
                    <Text style={styles.label}>Cost Price</Text>
                    <TextInput placeholder="0.00" value={pCost} style={styles.input} keyboardType="numeric" onChangeText={setPCost} />
                </View>
                <View style={{flex:1, marginLeft:5}}>
                    <Text style={styles.label}>Sell Price</Text>
                    <TextInput placeholder="0.00" value={pPrice} style={styles.input} keyboardType="numeric" onChangeText={setPPrice} />
                </View>
            </View>
            <Text style={styles.label}>Available Stocks</Text>
            <TextInput placeholder="0" value={pQty} style={styles.input} keyboardType="numeric" onChangeText={setPQty} />
            <View style={styles.row}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => {setFormModal(false); setScanned(false);}}><Text>CANCEL</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={() => {
                const updated = { id: barcode, name: pName, cost: parseFloat(pCost || 0), price: parseFloat(pPrice || 0), qty: pQty };
                const newList = inventory.find(i => i.id === barcode) ? inventory.map(i => i.id === barcode ? updated : i) : [...inventory, updated];
                onUpdate(newList, sales);
                setFormModal(false); setScanned(false);
              }}><Text style={styles.btnText}>SAVE ITEM</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: QUANTITY INPUT */}
      <Modal visible={qtyModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.formCard, {alignItems:'center'}]}>
            <Text style={styles.modalTitle}>How many pcs?</Text>
            <Text style={{color:'#007AFF', fontWeight:'bold', fontSize:18, marginBottom:15}}>{selectedProduct?.name}</Text>
            <TextInput value={pQty} style={styles.qtyInput} keyboardType="numeric" onChangeText={setPQty} autoFocus selectTextOnFocus />
            <View style={styles.row}>
              <TouchableOpacity style={[styles.cancelBtn, {width:'40%'}]} onPress={() => {setQtyModal(false); setScanned(false);}}><Text>CANCEL</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, {width:'55%'}]} onPress={handleAddToCart}><Text style={styles.btnText}>ADD TO CART</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: FINAL CART & CHECKOUT (Kini ang gi-update ang Layout) */}
      <Modal visible={viewCartModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.fullCard}>
            <Text style={styles.modalTitle}>Cart Summary</Text>
            <ScrollView style={{flex: 1, marginBottom: 15}}>
              {cart.map((item, index) => (
                <View key={index} style={styles.cartRow}>
                  <View style={{flex: 1}}>
                    {/* DISPLAY SA NAME */}
                    <Text style={{fontWeight: 'bold', fontSize: 16}}>{item.name}</Text>
                    {/* DISPLAY SA QUANTITY (cartQty) */}
                    <Text style={{fontSize: 14, color:'#007AFF'}}>{item.cartQty} pcs x ₱{item.price.toFixed(2)}</Text>
                  </View>
                  <Text style={{fontWeight: 'bold', fontSize: 16, color: '#28A745'}}>₱{item.subtotal.toFixed(2)}</Text>
                  <TouchableOpacity onPress={() => { const c = [...cart]; c.splice(index, 1); setCart(c); }} style={{marginLeft:15, padding: 5}}>
                    <Text style={{color:'red', fontSize:18, fontWeight: 'bold'}}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            
            <View style={styles.footer}>
                <View style={styles.rowBetween}>
                    <Text style={{fontWeight: 'bold'}}>Total Items:</Text>
                    {/* DISPLAY SA TOTAL COUNT SA ITEMS */}
                    <Text style={{fontWeight: 'bold'}}>{cart.reduce((a, b) => a + b.cartQty, 0)} pcs</Text>
                </View>
                <View style={styles.rowBetween}>
                    <Text style={{fontSize: 20, fontWeight: 'bold'}}>TOTAL DUE:</Text>
                    <Text style={{fontSize: 24, fontWeight: 'bold', color: '#28A745'}}>₱{grandTotal.toFixed(2)}</Text>
                </View>
                <TouchableOpacity style={styles.finalBtn} onPress={processCheckout}>
                    <Text style={styles.finalBtnText}>COMPLETE TRANSACTION</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setViewCartModal(false)} style={{marginTop: 15, alignItems:'center'}}>
                    <Text style={{color:'#007AFF', fontWeight: 'bold'}}>+ Add More Items</Text>
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
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor:'rgba(0,0,0,0.2)' },
  scannerFrame: { width: 260, height: 180, position: 'relative' },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: '#FFF', borderWidth: 5 },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  modeBadge: { backgroundColor: 'rgba(0,122,255,0.9)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25, marginTop: 40 },
  badgeText: { color: '#FFF', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },
  bottomBar: { position: 'absolute', bottom: 30, width: '100%', alignItems: 'center' },
  cartSummary: { backgroundColor: '#FFF', width: '92%', padding: 18, borderRadius: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems:'center', elevation: 10, marginBottom: 15 },
  cartBtnText: { color: '#007AFF', fontWeight: 'bold', fontSize: 16 },
  cartSubText: { color: '#888', fontSize: 11 },
  cartAmount: { fontSize: 22, fontWeight: 'bold', color: '#28A745' },
  closeBtn: { backgroundColor: 'rgba(255,59,48,0.9)', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30 },
  closeBtnText: { color: '#FFF', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  priceCard: { backgroundColor: '#FFF', padding: 30, borderRadius: 30, alignItems: 'center' },
  priceLabel: { color: '#888', fontSize: 12, fontWeight: 'bold' },
  priceName: { fontSize: 22, fontWeight: 'bold', marginVertical: 10, textAlign:'center' },
  priceValue: { fontSize: 55, fontWeight: 'bold', color: '#007AFF' },
  priceStock: { color: '#FF9500', marginBottom: 25, fontWeight:'600' },
  mainBtn: { backgroundColor: '#007AFF', width:'100%', padding: 18, borderRadius: 15, alignItems:'center' },
  formCard: { backgroundColor: '#FFF', padding: 25, borderRadius: 25 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  barcInfo: { fontSize: 12, color: '#666', textAlign: 'center', marginBottom: 15 },
  input: { backgroundColor: '#F2F2F7', padding: 15, borderRadius: 12, marginBottom: 15, fontSize: 16 },
  label: { fontSize: 12, color: '#888', marginBottom: 5, marginLeft: 5 },
  qtyInput: { fontSize: 60, textAlign: 'center', fontWeight: 'bold', color: '#007AFF', marginVertical: 20, width: '100%' },
  fullCard: { backgroundColor: '#FFF', padding: 25, borderRadius: 30, maxHeight: '85%' },
  cartRow: { flexDirection: 'row', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F2F2F7', alignItems: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10 },
  saveBtn: { backgroundColor: '#007AFF', padding: 15, borderRadius: 15, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#E5E5EA', padding: 15, borderRadius: 15, alignItems: 'center', width: '45%' },
  discInput: { backgroundColor: '#F2F2F7', width: 100, padding: 8, borderRadius: 8, textAlign: 'right', fontWeight:'bold' },
  finalBtn: { backgroundColor: '#28A745', padding: 20, borderRadius: 18, alignItems: 'center', marginTop: 10 },
  finalBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  btnText: { color: '#FFF', fontWeight: 'bold' }
});