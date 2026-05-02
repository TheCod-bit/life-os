import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { getItem, addItem, removeItem, KEYS } from '../storage/storage';
import { ExpiryItem } from '../types';

const CATEGORIES: { key: ExpiryItem['category']; label: string; icon: string }[] = [
  { key: 'dairy', label: 'Dairy', icon: '🧀' },
  { key: 'meat', label: 'Meat', icon: '🥩' },
  { key: 'produce', label: 'Produce', icon: '🥬' },
  { key: 'pantry', label: 'Pantry', icon: '🥫' },
  { key: 'frozen', label: 'Frozen', icon: '❄️' },
  { key: 'other', label: 'Other', icon: '📦' },
];

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function daysLeft(isoDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiry = new Date(isoDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function ExpiryCheckScreen() {
  const [items, setItems] = useState<ExpiryItem[]>([]);
  const [name, setName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState<ExpiryItem['category']>('other');
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    const data = await getItem<ExpiryItem>(KEYS.EXPIRY);
    setItems(data);
  }

  async function handleAdd() {
    if (!name.trim() || !expiryDate.trim()) {
      Alert.alert('Missing fields', 'Please enter a name and expiry date.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) {
      Alert.alert('Invalid date', 'Use YYYY-MM-DD format (e.g. 2026-06-15).');
      return;
    }
    const item: ExpiryItem = {
      id: makeId(),
      name: name.trim(),
      expiryDate: expiryDate.trim(),
      category,
      barcode: barcode.trim() || undefined,
    };
    const updated = await addItem(KEYS.EXPIRY, item);
    setItems(updated);
    setName('');
    setExpiryDate('');
    setBarcode('');
    setCategory('other');
  }

  async function handleDelete(id: string) {
    Alert.alert('Delete item?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = await removeItem<ExpiryItem>(KEYS.EXPIRY, id);
          setItems(updated);
        },
      },
    ]);
  }

  function openScanner() {
    if (!permission?.granted) {
      requestPermission();
      return;
    }
    setScanning(true);
  }

  function handleBarcodeScanned(data: string) {
    setBarcode(data);
    setScanning(false);
  }

  const sorted = [...items].sort(
    (a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
  );

  function getStatusStyle(days: number) {
    if (days < 0) return { bg: '#ffeaa7', text: '#d63031', label: 'EXPIRED' };
    if (days <= 3) return { bg: '#fab1a0', text: '#d63031', label: `${days}d left` };
    if (days <= 7) return { bg: '#ffeaa7', text: '#e17055', label: `${days}d left` };
    return { bg: '#dfe6e9', text: '#636e72', label: `${days}d left` };
  }

  return (
    <View style={styles.container}>
      {/* ── Add item form ── */}
      <View style={styles.addSection}>
        <TextInput
          style={styles.input}
          placeholder="Item name (e.g. Milk)"
          value={name}
          onChangeText={setName}
        />
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.flex]}
            placeholder="Expiry (YYYY-MM-DD)"
            value={expiryDate}
            onChangeText={setExpiryDate}
          />
          <TouchableOpacity style={styles.scanBtn} onPress={openScanner}>
            <Text style={styles.scanBtnText}>📷</Text>
          </TouchableOpacity>
        </View>
        {barcode ? (
          <Text style={styles.barcodeText}>Barcode: {barcode}</Text>
        ) : null}
        <View style={styles.catRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[styles.catChip, category === cat.key && styles.catChipActive]}
              onPress={() => setCategory(cat.key)}
            >
              <Text style={[styles.catChipText, category === cat.key && styles.catChipTextActive]}>
                {cat.icon} {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
          <Text style={styles.addBtnText}>+ Add Item</Text>
        </TouchableOpacity>
      </View>

      {/* ── Items list ── */}
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No items tracked. Add groceries above!</Text>
        }
        renderItem={({ item }) => {
          const days = daysLeft(item.expiryDate);
          const status = getStatusStyle(days);
          const cat = CATEGORIES.find((c) => c.key === item.category);
          return (
            <View style={[styles.itemRow, { backgroundColor: status.bg }]}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>
                  {cat?.icon} {item.name}
                </Text>
                <Text style={styles.itemDate}>Expires: {item.expiryDate}</Text>
                {item.barcode ? (
                  <Text style={styles.itemBarcode}>Barcode: {item.barcode}</Text>
                ) : null}
              </View>
              <View style={styles.itemActions}>
                <Text style={[styles.statusBadge, { color: status.text }]}>
                  {status.label}
                </Text>
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                  <Text style={styles.deleteBtn}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* ── Barcode scanner modal ── */}
      <Modal visible={scanning} animationType="slide">
        <View style={styles.scannerContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'] }}
            onBarcodeScanned={({ data }) => {
              if (data) handleBarcodeScanned(data);
            }}
          />
          <View style={styles.scannerOverlay}>
            <Text style={styles.scannerHint}>Point camera at a barcode</Text>
          </View>
          <TouchableOpacity style={styles.closeScanner} onPress={() => setScanning(false)}>
            <Text style={styles.closeScannerText}>✕ Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  addSection: {
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  input: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 8,
  },
  flex: { flex: 1, marginBottom: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scanBtn: {
    backgroundColor: '#6c5ce7',
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanBtnText: { fontSize: 22 },
  barcodeText: {
    fontSize: 12,
    color: '#6c5ce7',
    marginTop: -4,
    marginBottom: 8,
    fontWeight: '600',
  },
  catRow: { flexDirection: 'row', flexWrap: 'wrap' },
  catChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
    marginRight: 6,
    marginBottom: 4,
  },
  catChipActive: { backgroundColor: '#1a1a2e' },
  catChipText: { fontSize: 12, color: '#555' },
  catChipTextActive: { color: '#fff' },
  addBtn: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  list: { padding: 12, paddingBottom: 40 },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 40, fontSize: 16 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '600', color: '#333' },
  itemDate: { fontSize: 13, color: '#666', marginTop: 2 },
  itemBarcode: { fontSize: 11, color: '#888', marginTop: 1 },
  itemActions: { alignItems: 'flex-end', gap: 6 },
  statusBadge: { fontSize: 13, fontWeight: '700' },
  deleteBtn: { fontSize: 18 },
  scannerContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  scannerOverlay: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scannerHint: { color: '#fff', fontSize: 16, fontWeight: '600' },
  closeScanner: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  closeScannerText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
