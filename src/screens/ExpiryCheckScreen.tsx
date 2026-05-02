import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert, Modal,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { getItem, addItem, removeItem, KEYS } from '../storage/storage';
import { useTheme } from '../context/ThemeContext';
import { useTokens } from '../context/TokenContext';
import { ExpiryItem } from '../types';

const CATEGORIES: { key: ExpiryItem['category']; label: string; icon: string }[] = [
  { key: 'dairy', label: 'Dairy', icon: '🧀' }, { key: 'meat', label: 'Meat', icon: '🥩' },
  { key: 'produce', label: 'Produce', icon: '🥬' }, { key: 'pantry', label: 'Pantry', icon: '🥫' },
  { key: 'frozen', label: 'Frozen', icon: '❄️' }, { key: 'other', label: 'Other', icon: '📦' },
];

function makeId(): string { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

function daysLeft(isoDate: string): number {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const expiry = new Date(isoDate); expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function ExpiryCheckScreen() {
  const { colors } = useTheme();
  const { earn } = useTokens();
  const [items, setItems] = useState<ExpiryItem[]>([]);
  const [name, setName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState<ExpiryItem['category']>('other');
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => { loadItems(); }, []);

  async function loadItems() { const data = await getItem<ExpiryItem>(KEYS.EXPIRY); setItems(data); }

  async function handleAdd() {
    if (!name.trim() || !expiryDate.trim()) { Alert.alert('Missing fields', 'Please enter a name and expiry date.'); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) { Alert.alert('Invalid date', 'Use YYYY-MM-DD format (e.g. 2026-06-15).'); return; }
    const item: ExpiryItem = { id: makeId(), name: name.trim(), expiryDate: expiryDate.trim(), category, barcode: barcode.trim() || undefined };
    const updated = await addItem(KEYS.EXPIRY, item);
    setItems(updated);
    setName(''); setExpiryDate(''); setBarcode(''); setCategory('other');
    earn(barcode ? 5 : 3, barcode ? '📷 Scanned item' : '📅 Added item');
  }

  async function handleDelete(id: string) {
    Alert.alert('Delete item?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { const updated = await removeItem<ExpiryItem>(KEYS.EXPIRY, id); setItems(updated); } },
    ]);
  }

  function openScanner() { if (!permission?.granted) { requestPermission(); return; } setScanning(true); }
  function handleBarcodeScanned(data: string) { setBarcode(data); setScanning(false); }

  const sorted = [...items].sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

  function getStatusStyle(days: number) {
    if (days < 0) return { bg: colors.alertBg, text: colors.danger, label: 'EXPIRED' };
    if (days <= 3) return { bg: '#fab1a0', text: colors.danger, label: `${days}d left` };
    if (days <= 7) return { bg: colors.alertBg, text: colors.warning, label: `${days}d left` };
    return { bg: colors.card, text: colors.textSecondary, label: `${days}d left` };
  }

  const s = makeStyles(colors);

  return (
    <View style={s.container}>
      <View style={[s.addSection, { backgroundColor: colors.surface }]}>
        <TextInput style={s.input} placeholder="Item name (e.g. Milk)" placeholderTextColor={colors.textMuted} value={name} onChangeText={setName} />
        <View style={s.row}>
          <TextInput style={[s.input, s.flex]} placeholder="Expiry (YYYY-MM-DD)" placeholderTextColor={colors.textMuted} value={expiryDate} onChangeText={setExpiryDate} />
          <TouchableOpacity style={s.scanBtn} onPress={openScanner}><Text style={s.scanBtnText}>📷</Text></TouchableOpacity>
        </View>
        {barcode ? <Text style={s.barcodeText}>Barcode: {barcode}</Text> : null}
        <View style={s.catRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity key={cat.key} style={[s.catChip, { backgroundColor: category === cat.key ? colors.chipActive : colors.chipBg }]} onPress={() => setCategory(cat.key)}>
              <Text style={{ fontSize: 12, color: category === cat.key ? colors.chipTextActive : colors.chipText }}>{cat.icon} {cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={s.addBtn} onPress={handleAdd}><Text style={s.addBtnText}>+ Add Item</Text></TouchableOpacity>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.list}
        ListEmptyComponent={<Text style={{ textAlign: 'center', color: colors.textMuted, marginTop: 40, fontSize: 16 }}>No items tracked. Add groceries above!</Text>}
        renderItem={({ item }) => {
          const days = daysLeft(item.expiryDate);
          const status = getStatusStyle(days);
          const cat = CATEGORIES.find((c) => c.key === item.category);
          return (
            <View style={[s.itemRow, { backgroundColor: status.bg }]}>
              <View style={s.itemInfo}>
                <Text style={[s.itemName, { color: colors.text }]}>{cat?.icon} {item.name}</Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>Expires: {item.expiryDate}</Text>
                {item.barcode ? <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 1 }}>Barcode: {item.barcode}</Text> : null}
              </View>
              <View style={s.itemActions}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: status.text }}>{status.label}</Text>
                <TouchableOpacity onPress={() => handleDelete(item.id)}><Text style={s.deleteBtn}>🗑️</Text></TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      <Modal visible={scanning} animationType="slide">
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'] }}
            onBarcodeScanned={({ data }) => { if (data) handleBarcodeScanned(data); }}
          />
          <View style={{ position: 'absolute', top: 80, left: 0, right: 0, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Point camera at a barcode</Text>
          </View>
          <TouchableOpacity style={{ position: 'absolute', bottom: 50, alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 }} onPress={() => setScanning(false)}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>✕ Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    addSection: { padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    input: { backgroundColor: colors.inputBg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, color: colors.text, marginBottom: 8 },
    flex: { flex: 1, marginBottom: 0 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    scanBtn: { backgroundColor: colors.accent, width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    scanBtnText: { fontSize: 22 },
    barcodeText: { fontSize: 12, color: colors.accent, marginTop: -4, marginBottom: 8, fontWeight: '600' },
    catRow: { flexDirection: 'row', flexWrap: 'wrap' },
    catChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, marginRight: 6, marginBottom: 4 },
    addBtn: { backgroundColor: colors.accent, borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 8 },
    addBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    list: { padding: 12, paddingBottom: 40 },
    itemRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 14, marginBottom: 8 },
    itemInfo: { flex: 1 },
    itemName: { fontSize: 16, fontWeight: '600' },
    itemActions: { alignItems: 'flex-end', gap: 6 },
    deleteBtn: { fontSize: 18 },
  });
}
