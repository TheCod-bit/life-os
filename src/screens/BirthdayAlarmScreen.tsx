import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { getItem, addItem, updateItem, removeItem, KEYS } from '../storage/storage';
import { Birthday } from '../types';

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function getNextBirthday(mmdd: string): Date {
  const now = new Date();
  const [month, day] = mmdd.split('-').map(Number);
  const next = new Date(now.getFullYear(), month - 1, day);
  if (next <= now) {
    next.setFullYear(now.getFullYear() + 1);
  }
  return next;
}

function daysUntil(mmdd: string): number {
  const next = getNextBirthday(mmdd);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function BirthdayAlarmScreen() {
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [name, setName] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [notifyEnabled, setNotifyEnabled] = useState(true);

  useEffect(() => {
    loadBirthdays();
    requestNotificationPermission();
  }, []);

  async function requestNotificationPermission() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Notifications', 'Enable notifications in settings to get birthday alarms.');
    }
  }

  async function loadBirthdays() {
    const data = await getItem<Birthday>(KEYS.BIRTHDAYS);
    setBirthdays(data);
  }

  async function handleAdd() {
    const m = Number(month);
    const d = Number(day);
    if (!name.trim() || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) {
      Alert.alert('Invalid date', 'Please enter a valid month (1-12) and day (1-31).');
      return;
    }
    const date = `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const birthday: Birthday = {
      id: makeId(),
      name: name.trim(),
      date,
      notifyEnabled,
    };
    const updated = await addItem(KEYS.BIRTHDAYS, birthday);
    setBirthdays(updated);
    if (notifyEnabled) scheduleNotification(birthday);
    setName('');
    setMonth('');
    setDay('');
    setNotifyEnabled(true);
  }

  async function handleToggleNotify(item: Birthday) {
    const updated = await updateItem<Birthday>(KEYS.BIRTHDAYS, item.id, {
      notifyEnabled: !item.notifyEnabled,
    });
    setBirthdays(updated);
    if (!item.notifyEnabled) {
      scheduleNotification({ ...item, notifyEnabled: true });
    } else {
      cancelNotification(item.id);
    }
  }

  async function handleDelete(item: Birthday) {
    Alert.alert('Delete birthday?', `Remove ${item.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = await removeItem<Birthday>(KEYS.BIRTHDAYS, item.id);
          setBirthdays(updated);
          cancelNotification(item.id);
        },
      },
    ]);
  }

  async function scheduleNotification(birthday: Birthday) {
    const triggerDate = getNextBirthday(birthday.date);
    triggerDate.setHours(8, 0, 0, 0);

    await Notifications.scheduleNotificationAsync({
      identifier: birthday.id,
      content: {
        title: '🎂 Birthday Today!',
        body: `It's ${birthday.name}'s birthday today!`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });
  }

  async function cancelNotification(id: string) {
    await Notifications.cancelScheduledNotificationAsync(id);
  }

  const sorted = [...birthdays].sort((a, b) => daysUntil(a.date) - daysUntil(b.date));
  const nextUp = sorted[0];

  return (
    <View style={styles.container}>
      {/* ── Next birthday ── */}
      {nextUp && (
        <View style={styles.nextCard}>
          <Text style={styles.nextLabel}>Next Up</Text>
          <Text style={styles.nextName}>🎂 {nextUp.name}</Text>
          <Text style={styles.nextDate}>
            {new Date(getNextBirthday(nextUp.date)).toDateString()} — in{' '}
            {daysUntil(nextUp.date)} days
          </Text>
        </View>
      )}

      {/* ── Add birthday ── */}
      <View style={styles.addSection}>
        <TextInput
          style={styles.input}
          placeholder="Person's name"
          value={name}
          onChangeText={setName}
        />
        <View style={styles.dateRow}>
          <TextInput
            style={styles.dateInput}
            placeholder="MM"
            value={month}
            onChangeText={setMonth}
            keyboardType="numeric"
            maxLength={2}
          />
          <Text style={styles.dateSep}>/</Text>
          <TextInput
            style={styles.dateInput}
            placeholder="DD"
            value={day}
            onChangeText={setDay}
            keyboardType="numeric"
            maxLength={2}
          />
          <View style={styles.notifyRow}>
            <Text style={styles.notifyLabel}>Notify</Text>
            <Switch
              value={notifyEnabled}
              onValueChange={setNotifyEnabled}
              trackColor={{ false: '#ddd', true: '#6c5ce7' }}
              thumbColor={notifyEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
          <Text style={styles.addBtnText}>+ Add Birthday</Text>
        </TouchableOpacity>
      </View>

      {/* ── Birthday list ── */}
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>Add your first birthday above!</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.birthdayRow}>
            <View style={styles.birthdayInfo}>
              <Text style={styles.birthdayName}>🎂 {item.name}</Text>
              <Text style={styles.birthdayDate}>
                {item.date} — in {daysUntil(item.date)} days
              </Text>
            </View>
            <Switch
              value={item.notifyEnabled}
              onValueChange={() => handleToggleNotify(item)}
              trackColor={{ false: '#ddd', true: '#6c5ce7' }}
              thumbColor={item.notifyEnabled ? '#fff' : '#f4f3f4'}
            />
            <TouchableOpacity onPress={() => handleDelete(item)}>
              <Text style={styles.deleteBtn}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  nextCard: {
    backgroundColor: '#6c5ce7',
    padding: 20,
    alignItems: 'center',
  },
  nextLabel: { color: '#dfe6e9', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 },
  nextName: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 4 },
  nextDate: { color: '#dfe6e9', fontSize: 14, marginTop: 4 },
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
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  dateInput: {
    width: 60,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  dateSep: { fontSize: 20, color: '#888' },
  notifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    gap: 6,
  },
  notifyLabel: { fontSize: 14, color: '#666' },
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
  birthdayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  birthdayInfo: { flex: 1 },
  birthdayName: { fontSize: 16, fontWeight: '600', color: '#333' },
  birthdayDate: { fontSize: 13, color: '#888', marginTop: 3 },
  deleteBtn: { fontSize: 18, paddingLeft: 8 },
});
