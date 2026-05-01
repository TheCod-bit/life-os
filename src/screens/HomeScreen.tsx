import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { getItem, KEYS } from '../storage/storage';
import { Meal, StickyNote, Birthday, ExpiryItem } from '../types';

export default function HomeScreen({ navigation }: { navigation: any }) {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [expiry, setExpiry] = useState<ExpiryItem[]>([]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation]);

  async function loadData() {
    const [m, n, b, e] = await Promise.all([
      getItem<Meal>(KEYS.MEALS),
      getItem<StickyNote>(KEYS.NOTES),
      getItem<Birthday>(KEYS.BIRTHDAYS),
      getItem<ExpiryItem>(KEYS.EXPIRY),
    ]);
    setMeals(m);
    setNotes(n);
    setBirthdays(b);
    setExpiry(e);
  }

  const today = new Date();
  const monthDay = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const todayBirthdays = birthdays.filter((b) => b.date === monthDay);
  const expiringSoon = expiry.filter((item) => {
    const diff = new Date(item.expiryDate).getTime() - today.getTime();
    return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
  });
  const pendingNotes = notes.filter((n) => !n.done);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Life OS</Text>
      <Text style={styles.subtitle}>{today.toDateString()}</Text>

      {todayBirthdays.length > 0 && (
        <View style={styles.alert}>
          <Text style={styles.alertText}>
            🎂 {todayBirthdays.map((b) => b.name).join(', ')} today!
          </Text>
        </View>
      )}

      <View style={styles.grid}>
        <Card
          title="👗 What to Wear"
          subtitle="Pick outfit by weather"
          onPress={() => navigation.navigate('WhatToWear')}
        />
        <Card
          title="🍽️ Dinner"
          subtitle={`${meals.length} meals saved`}
          onPress={() => navigation.navigate('WhatsForDinner')}
        />
        <Card
          title="📝 Don't Forget"
          subtitle={`${pendingNotes.length} pending`}
          onPress={() => navigation.navigate('DontForget')}
        />
        <Card
          title="🎂 Birthdays"
          subtitle={`${birthdays.length} saved`}
          onPress={() => navigation.navigate('BirthdayAlarm')}
        />
        <Card
          title="📅 Expiry Check"
          subtitle={`${expiringSoon.length} expiring soon`}
          onPress={() => navigation.navigate('ExpiryCheck')}
        />
      </View>
    </ScrollView>
  );
}

function Card({ title, subtitle, onPress }: {
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 20 },
  title: { fontSize: 32, fontWeight: '800', color: '#1a1a2e', marginTop: 20 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 20 },
  alert: {
    backgroundColor: '#ffeaa7',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  alertText: { fontSize: 16, fontWeight: '600', color: '#2d3436' },
  grid: { gap: 12 },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  cardSubtitle: { fontSize: 14, color: '#888' },
});
