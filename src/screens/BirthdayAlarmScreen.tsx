import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert, Switch,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { getItem, addItem, updateItem, removeItem, KEYS } from '../storage/storage';
import { useTheme } from '../context/ThemeContext';
import { useTokens } from '../context/TokenContext';
import { Birthday } from '../types';

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function getNextBirthday(mmdd: string): Date {
  const now = new Date();
  const [month, day] = mmdd.split('-').map(Number);
  const next = new Date(now.getFullYear(), month - 1, day);
  if (next <= now) next.setFullYear(now.getFullYear() + 1);
  return next;
}

function daysUntil(mmdd: string): number {
  const next = getNextBirthday(mmdd);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function BirthdayAlarmScreen() {
  const { colors } = useTheme();
  const { earn } = useTokens();
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [name, setName] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [notifyEnabled, setNotifyEnabled] = useState(true);

  useEffect(() => { loadBirthdays(); requestPermission(); }, []);

  async function requestPermission() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') Alert.alert('Notifications', 'Enable notifications in settings to get birthday alarms.');
  }

  async function loadBirthdays() { const data = await getItem<Birthday>(KEYS.BIRTHDAYS); setBirthdays(data); }

  async function handleAdd() {
    const m = Number(month); const d = Number(day);
    if (!name.trim() || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) { Alert.alert('Invalid date', 'Please enter a valid month (1-12) and day (1-31).'); return; }
    const date = `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const birthday: Birthday = { id: makeId(), name: name.trim(), date, notifyEnabled };
    const updated = await addItem(KEYS.BIRTHDAYS, birthday);
    setBirthdays(updated);
    if (notifyEnabled) scheduleNotification(birthday);
    earn(3, '🎂 Added a birthday');
    setName(''); setMonth(''); setDay(''); setNotifyEnabled(true);
  }

  async function handleToggleNotify(item: Birthday) {
    const updated = await updateItem<Birthday>(KEYS.BIRTHDAYS, item.id, { notifyEnabled: !item.notifyEnabled });
    setBirthdays(updated);
    if (!item.notifyEnabled) scheduleNotification({ ...item, notifyEnabled: true });
    else cancelNotification(item.id);
  }

  async function handleDelete(item: Birthday) {
    Alert.alert('Delete birthday?', `Remove ${item.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { const updated = await removeItem<Birthday>(KEYS.BIRTHDAYS, item.id); setBirthdays(updated); cancelNotification(item.id); } },
    ]);
  }

  async function scheduleNotification(birthday: Birthday) {
    const triggerDate = getNextBirthday(birthday.date); triggerDate.setHours(8, 0, 0, 0);
    await Notifications.scheduleNotificationAsync({
      identifier: birthday.id,
      content: { title: '🎂 Birthday Today!', body: `It's ${birthday.name}'s birthday today!`, sound: true },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
    });
  }

  async function cancelNotification(id: string) { await Notifications.cancelScheduledNotificationAsync(id); }

  const sorted = [...birthdays].sort((a, b) => daysUntil(a.date) - daysUntil(b.date));
  const nextUp = sorted[0];
  const s = makeStyles(colors);

  return (
    <View style={s.container}>
      {nextUp && (
        <View style={s.nextCard}>
          <Text style={s.nextLabel}>Next Up</Text>
          <Text style={s.nextName}>🎂 {nextUp.name}</Text>
          <Text style={s.nextDate}>{new Date(getNextBirthday(nextUp.date)).toDateString()} — in {daysUntil(nextUp.date)} days</Text>
        </View>
      )}

      <View style={[s.addSection, { backgroundColor: colors.surface }]}>
        <TextInput style={s.input} placeholder="Person's name" placeholderTextColor={colors.textMuted} value={name} onChangeText={setName} />
        <View style={s.dateRow}>
          <TextInput style={s.dateInput} placeholder="MM" placeholderTextColor={colors.textMuted} value={month} onChangeText={setMonth} keyboardType="numeric" maxLength={2} />
          <Text style={{ fontSize: 20, color: colors.textSecondary }}>/</Text>
          <TextInput style={s.dateInput} placeholder="DD" placeholderTextColor={colors.textMuted} value={day} onChangeText={setDay} keyboardType="numeric" maxLength={2} />
          <View style={s.notifyRow}>
            <Text style={{ fontSize: 14, color: colors.textSecondary }}>Notify</Text>
            <Switch value={notifyEnabled} onValueChange={setNotifyEnabled} trackColor={{ false: '#ddd', true: colors.accent }} thumbColor="#fff" />
          </View>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={handleAdd}>
          <Text style={s.addBtnText}>+ Add Birthday</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.list}
        ListEmptyComponent={<Text style={{ textAlign: 'center', color: colors.textMuted, marginTop: 40, fontSize: 16 }}>Add your first birthday above!</Text>}
        renderItem={({ item }) => (
          <View style={[s.birthdayRow, { backgroundColor: colors.card }]}>
            <View style={s.birthdayInfo}>
              <Text style={[s.birthdayName, { color: colors.text }]}>🎂 {item.name}</Text>
              <Text style={[s.birthdayDate, { color: colors.textSecondary }]}>{item.date} — in {daysUntil(item.date)} days</Text>
            </View>
            <Switch value={item.notifyEnabled} onValueChange={() => handleToggleNotify(item)} trackColor={{ false: '#ddd', true: colors.accent }} thumbColor="#fff" />
            <TouchableOpacity onPress={() => handleDelete(item)}><Text style={s.deleteBtn}>🗑️</Text></TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    nextCard: { backgroundColor: colors.accent, padding: 20, alignItems: 'center' },
    nextLabel: { color: '#dfe6e9', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 },
    nextName: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 4 },
    nextDate: { color: '#dfe6e9', fontSize: 14, marginTop: 4 },
    addSection: { padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    input: { backgroundColor: colors.inputBg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, color: colors.text },
    dateRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 },
    dateInput: { width: 60, backgroundColor: colors.inputBg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, textAlign: 'center', color: colors.text },
    notifyRow: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto', gap: 6 },
    addBtn: { backgroundColor: colors.accent, borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 8 },
    addBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    list: { padding: 12, paddingBottom: 40 },
    birthdayRow: {
      flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 14, marginBottom: 8,
      shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    },
    birthdayInfo: { flex: 1 },
    birthdayName: { fontSize: 16, fontWeight: '600' },
    birthdayDate: { fontSize: 13, marginTop: 3 },
    deleteBtn: { fontSize: 18, paddingLeft: 8 },
  });
}
