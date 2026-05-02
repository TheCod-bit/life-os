import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { getItem, KEYS } from '../storage/storage';
import { useTheme } from '../context/ThemeContext';
import { useTokens } from '../context/TokenContext';
import { Meal, StickyNote, Birthday, ExpiryItem } from '../types';

export default function HomeScreen({ navigation }: { navigation: any }) {
  const { colors, isDark } = useTheme();
  const { balance, earn } = useTokens();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [expiry, setExpiry] = useState<ExpiryItem[]>([]);
  const [checkedIn, setCheckedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    checkDailyBonus();
  }, []);

  function checkDailyBonus() {
    const today = new Date().toDateString();
    const stored = getStoredDate();
    if (stored !== today) {
      setCheckedIn(false);
    } else {
      setCheckedIn(true);
    }
  }

  function getStoredDate(): string | null {
    return null; // simplified — relies on state reset on app restart
  }

  function claimDailyBonus() {
    earn(25, '📅 Daily login bonus');
    setCheckedIn(true);
  }

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

  const dynamicStyles = makeStyles(colors);

  return (
    <ScrollView style={dynamicStyles.container}>
      {/* ── Header with token badge ── */}
      <View style={dynamicStyles.header}>
        <View>
          <Text style={dynamicStyles.title}>Life OS</Text>
          <Text style={dynamicStyles.subtitle}>{today.toDateString()}</Text>
        </View>
        <View style={dynamicStyles.tokenBadge}>
          <Text style={dynamicStyles.tokenIcon}>🪙</Text>
          <Text style={dynamicStyles.tokenCount}>{balance}</Text>
        </View>
      </View>

      {/* ── Daily bonus ── */}
      {!checkedIn && (
        <TouchableOpacity style={dynamicStyles.bonusCard} onPress={claimDailyBonus}>
          <Text style={dynamicStyles.bonusText}>
            🎁 Daily Bonus! Tap to claim 25 tokens
          </Text>
        </TouchableOpacity>
      )}

      {/* ── Birthday alert ── */}
      {todayBirthdays.length > 0 && (
        <View style={dynamicStyles.alert}>
          <Text style={dynamicStyles.alertText}>
            🎂 {todayBirthdays.map((b) => b.name).join(', ')} today!
          </Text>
        </View>
      )}

      {/* ── Dashboard grid ── */}
      <View style={dynamicStyles.grid}>
        <Card
          title="👗 What to Wear"
          subtitle="Pick outfit by weather"
          accent="#6c5ce7"
          colors={colors}
          onPress={() => navigation.navigate('WhatToWear')}
        />
        <Card
          title="🍽️ Dinner"
          subtitle={`${meals.length} meals saved`}
          accent="#00b894"
          colors={colors}
          onPress={() => navigation.navigate('WhatsForDinner')}
        />
        <Card
          title="📝 Don't Forget"
          subtitle={`${pendingNotes.length} pending`}
          accent="#e17055"
          colors={colors}
          onPress={() => navigation.navigate('DontForget')}
        />
        <Card
          title="🎂 Birthdays"
          subtitle={`${birthdays.length} saved`}
          accent="#fd79a8"
          colors={colors}
          onPress={() => navigation.navigate('BirthdayAlarm')}
        />
        <Card
          title="📅 Expiry Check"
          subtitle={`${expiringSoon.length} expiring soon`}
          accent="#fdcb6e"
          colors={colors}
          onPress={() => navigation.navigate('ExpiryCheck')}
        />
      </View>
    </ScrollView>
  );
}

function Card({ title, subtitle, accent, colors, onPress }: {
  title: string;
  subtitle: string;
  accent: string;
  colors: any;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[cardStyles.card, { backgroundColor: colors.card }]}
      onPress={onPress}
    >
      <View style={[cardStyles.accentBar, { backgroundColor: accent }]} />
      <View style={cardStyles.content}>
        <Text style={[cardStyles.cardTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[cardStyles.cardSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  accentBar: { width: 4 },
  content: { flex: 1, padding: 18 },
  cardTitle: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  cardSubtitle: { fontSize: 13 },
});

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      padding: 20,
      paddingTop: 24,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: { fontSize: 32, fontWeight: '800', color: colors.text },
    subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
    tokenBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.tokenBg,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 8,
      gap: 6,
    },
    tokenIcon: { fontSize: 18 },
    tokenCount: { fontSize: 18, fontWeight: '800', color: colors.tokenText },
    bonusCard: {
      backgroundColor: '#6c5ce7',
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 14,
      padding: 16,
      alignItems: 'center',
    },
    bonusText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    alert: {
      backgroundColor: colors.alertBg,
      padding: 15,
      borderRadius: 12,
      marginTop: 16,
      marginHorizontal: 16,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 5,
      elevation: 3,
    },
    alertText: { fontSize: 16, fontWeight: '600', color: colors.alertText },
    grid: { gap: 12, padding: 16, paddingBottom: 40 },
  });
}
