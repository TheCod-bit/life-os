import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { useTokens } from '../context/TokenContext';

const USERNAME_KEY = '@life-os/username';

export default function UsernameScreen({ onDone }: { onDone: () => void }) {
  const { colors } = useTheme();
  const { balance } = useTokens();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    const name = username.trim();
    if (name.length < 3) {
      Alert.alert('Too short', 'Username must be at least 3 characters.');
      return;
    }
    if (name.length > 20) {
      Alert.alert('Too long', 'Username must be under 20 characters.');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(name)) {
      Alert.alert('Invalid username', 'Only letters, numbers, and underscores allowed.');
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('players')
      .upsert({
        id: name.toLowerCase(),
        username: name,
        tokens: balance,
        tier: getTier(balance),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (error) {
      Alert.alert('Error', 'Could not register username. The database may not be set up yet.');
      setLoading(false);
      return;
    }

    await AsyncStorage.setItem(USERNAME_KEY, name);
    onDone();
  }

  const s = makeStyles(colors);

  return (
    <View style={s.container}>
      <Text style={s.title}>Welcome to Life OS</Text>
      <Text style={s.subtitle}>Choose a username to compete globally!</Text>

      <TextInput
        style={s.input}
        placeholder="Pick a username"
        placeholderTextColor={colors.textMuted}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={20}
      />

      <TouchableOpacity
        style={[s.btn, { opacity: loading ? 0.6 : 1 }]}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={s.btnText}>Join the Competition 🏆</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

export function getTier(tokens: number): string {
  if (tokens >= 10000) return 'diamond';
  if (tokens >= 5000) return 'platinum';
  if (tokens >= 2000) return 'gold';
  if (tokens >= 500) return 'silver';
  if (tokens >= 100) return 'bronze';
  return 'beginner';
}

const TIER_NAMES: Record<string, string> = {
  diamond: '💎 Diamond',
  platinum: '🪩 Platinum',
  gold: '🥇 Gold',
  silver: '🥈 Silver',
  bronze: '🥉 Bronze',
  beginner: '🌱 Beginner',
};

export { TIER_NAMES };

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 8 },
    subtitle: { fontSize: 16, color: colors.textSecondary, marginBottom: 32, textAlign: 'center' },
    input: {
      width: '100%',
      backgroundColor: colors.inputBg,
      borderRadius: 12,
      paddingHorizontal: 18,
      paddingVertical: 14,
      fontSize: 18,
      color: colors.text,
      textAlign: 'center',
      marginBottom: 16,
    },
    btn: {
      width: '100%',
      backgroundColor: colors.accent,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    btnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  });
}
