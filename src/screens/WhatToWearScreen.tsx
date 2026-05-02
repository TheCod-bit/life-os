import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { getItem, addItem, removeItem, KEYS } from '../storage/storage';
import { useTheme } from '../context/ThemeContext';
import { useTokens } from '../context/TokenContext';
import { Outfit } from '../types';

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export default function WhatToWearScreen() {
  const { colors } = useTheme();
  const { earn } = useTokens();
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [temperature, setTemperature] = useState<number | null>(null);
  const [weatherCode, setWeatherCode] = useState<number>(0);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [weatherError, setWeatherError] = useState('');
  const [name, setName] = useState('');
  const [minTemp, setMinTemp] = useState('');
  const [maxTemp, setMaxTemp] = useState('');

  useEffect(() => { loadOutfits(); fetchWeather(); }, []);

  async function loadOutfits() {
    const data = await getItem<Outfit>(KEYS.OUTFITS);
    setOutfits(data);
  }

  async function fetchWeather() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setWeatherError('Location permission denied'); setLoadingWeather(false); return; }
      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
      const data = await res.json();
      setTemperature(data.current_weather.temperature);
      setWeatherCode(data.current_weather.weathercode);
    } catch { setWeatherError('Could not fetch weather'); }
    finally { setLoadingWeather(false); }
  }

  async function handleAdd() {
    if (!name.trim() || !minTemp || !maxTemp) return;
    const outfit: Outfit = { id: makeId(), name: name.trim(), minTemp: Number(minTemp), maxTemp: Number(maxTemp) };
    const updated = await addItem(KEYS.OUTFITS, outfit);
    setOutfits(updated);
    setName(''); setMinTemp(''); setMaxTemp('');
    earn(3, '👗 Added an outfit');
  }

  async function handleDelete(id: string) {
    Alert.alert('Delete outfit?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { const updated = await removeItem<Outfit>(KEYS.OUTFITS, id); setOutfits(updated); } },
    ]);
  }

  const weatherIcon = getWeatherIcon(weatherCode);
  const matchingOutfits = temperature !== null ? outfits.filter((o) => o.minTemp <= temperature && o.maxTemp >= temperature) : [];

  const s = makeStyles(colors);

  return (
    <View style={s.container}>
      <View style={s.weatherCard}>
        {loadingWeather ? <ActivityIndicator size="large" color="#fff" /> :
          weatherError ? <Text style={s.weatherError}>{weatherError}</Text> : (
            <>
              <Text style={s.weatherIcon}>{weatherIcon}</Text>
              <Text style={s.tempText}>{temperature}°C</Text>
              <Text style={s.weatherLabel}>Current temperature</Text>
            </>
          )}
      </View>

      {temperature !== null && (
        <View style={[s.matchSection, { backgroundColor: colors.surface }]}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>👕 Outfits for {temperature}°C ({matchingOutfits.length})</Text>
          {matchingOutfits.length === 0 ? (
            <Text style={{ color: colors.textMuted, fontSize: 14, fontStyle: 'italic' }}>No outfits match this temperature. Add some below!</Text>
          ) : matchingOutfits.map((o) => (
            <View key={o.id} style={[s.outfitRow, { backgroundColor: colors.inputBg }]}>
              <View style={s.outfitInfo}>
                <Text style={[s.outfitName, { color: colors.text }]}>{o.name}</Text>
                <Text style={[s.outfitRange, { color: colors.textSecondary }]}>{o.minTemp}°C – {o.maxTemp}°C</Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(o.id)}><Text style={s.deleteBtn}>🗑️</Text></TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={[s.addSection, { backgroundColor: colors.surface }]}>
        <Text style={[s.sectionTitle, { color: colors.text }]}>Add Outfit</Text>
        <TextInput style={s.input} placeholder="Outfit name (e.g. Hoodie & Jeans)" placeholderTextColor={colors.textMuted} value={name} onChangeText={setName} />
        <View style={s.tempRow}>
          <TextInput style={s.tempInput} placeholder="Min °C" placeholderTextColor={colors.textMuted} value={minTemp} onChangeText={setMinTemp} keyboardType="numeric" />
          <Text style={{ fontSize: 20, color: colors.textSecondary }}>–</Text>
          <TextInput style={s.tempInput} placeholder="Max °C" placeholderTextColor={colors.textMuted} value={maxTemp} onChangeText={setMaxTemp} keyboardType="numeric" />
        </View>
        <TouchableOpacity style={s.addBtn} onPress={handleAdd}>
          <Text style={s.addBtnText}>+ Add Outfit</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={outfits}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.list}
        ListHeaderComponent={outfits.length > 0 ? <Text style={[s.sectionTitle, { color: colors.text }]}>All Outfits ({outfits.length})</Text> : null}
        renderItem={({ item }) => (
          <View style={[s.outfitRow, { backgroundColor: colors.card }]}>
            <View style={s.outfitInfo}>
              <Text style={[s.outfitName, { color: colors.text }]}>{item.name}</Text>
              <Text style={[s.outfitRange, { color: colors.textSecondary }]}>{item.minTemp}°C – {item.maxTemp}°C</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id)}><Text style={s.deleteBtn}>🗑️</Text></TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={{ textAlign: 'center', color: colors.textMuted, marginTop: 20, fontSize: 14 }}>No outfits saved yet.</Text>}
      />
    </View>
  );
}

function getWeatherIcon(code: number): string {
  if (code === 0) return '☀️'; if (code <= 3) return '⛅'; if (code <= 48) return '☁️'; if (code <= 57) return '🌧️'; if (code <= 67) return '🌨️'; if (code <= 77) return '❄️'; if (code <= 82) return '🌧️'; if (code <= 86) return '🌨️'; return '⛈️';
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    weatherCard: { backgroundColor: '#1a1a2e', padding: 24, alignItems: 'center' },
    weatherIcon: { fontSize: 48, marginBottom: 4 },
    tempText: { fontSize: 42, fontWeight: '800', color: '#fff' },
    weatherLabel: { fontSize: 14, color: '#aaa', marginTop: 4 },
    weatherError: { color: '#ff7675', fontSize: 16 },
    matchSection: { padding: 12, marginTop: 4, marginBottom: 4 },
    sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
    outfitRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      borderRadius: 10, padding: 12, marginBottom: 4,
    },
    outfitInfo: { flex: 1 },
    outfitName: { fontSize: 16, fontWeight: '600' },
    outfitRange: { fontSize: 13, marginTop: 2 },
    deleteBtn: { fontSize: 18, paddingLeft: 8 },
    addSection: { padding: 12 },
    input: { backgroundColor: colors.inputBg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, color: colors.text },
    tempRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
    tempInput: { flex: 1, backgroundColor: colors.inputBg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, textAlign: 'center', color: colors.text },
    addBtn: { backgroundColor: colors.accent, borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 8 },
    addBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    list: { padding: 12, paddingBottom: 40 },
  });
}
