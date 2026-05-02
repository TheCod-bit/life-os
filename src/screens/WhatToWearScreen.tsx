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
import { Outfit } from '../types';

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export default function WhatToWearScreen() {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [temperature, setTemperature] = useState<number | null>(null);
  const [weatherCode, setWeatherCode] = useState<number>(0);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [weatherError, setWeatherError] = useState('');

  // Add outfit form
  const [name, setName] = useState('');
  const [minTemp, setMinTemp] = useState('');
  const [maxTemp, setMaxTemp] = useState('');

  useEffect(() => {
    loadOutfits();
    fetchWeather();
  }, []);

  async function loadOutfits() {
    const data = await getItem<Outfit>(KEYS.OUTFITS);
    setOutfits(data);
  }

  async function fetchWeather() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setWeatherError('Location permission denied');
        setLoadingWeather(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;

      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
      );
      const data = await res.json();
      setTemperature(data.current_weather.temperature);
      setWeatherCode(data.current_weather.weathercode);
    } catch {
      setWeatherError('Could not fetch weather');
    } finally {
      setLoadingWeather(false);
    }
  }

  async function handleAdd() {
    if (!name.trim() || !minTemp || !maxTemp) return;
    const outfit: Outfit = {
      id: makeId(),
      name: name.trim(),
      minTemp: Number(minTemp),
      maxTemp: Number(maxTemp),
    };
    const updated = await addItem(KEYS.OUTFITS, outfit);
    setOutfits(updated);
    setName('');
    setMinTemp('');
    setMaxTemp('');
  }

  async function handleDelete(id: string) {
    Alert.alert('Delete outfit?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = await removeItem<Outfit>(KEYS.OUTFITS, id);
          setOutfits(updated);
        },
      },
    ]);
  }

  const weatherIcon = getWeatherIcon(weatherCode);
  const matchingOutfits =
    temperature !== null
      ? outfits.filter((o) => o.minTemp <= temperature && o.maxTemp >= temperature)
      : [];

  return (
    <View style={styles.container}>
      {/* ── Weather header ── */}
      <View style={styles.weatherCard}>
        {loadingWeather ? (
          <ActivityIndicator size="large" color="#1a1a2e" />
        ) : weatherError ? (
          <Text style={styles.weatherError}>{weatherError}</Text>
        ) : (
          <>
            <Text style={styles.weatherIcon}>{weatherIcon}</Text>
            <Text style={styles.tempText}>{temperature}°C</Text>
            <Text style={styles.weatherLabel}>Current temperature</Text>
          </>
        )}
      </View>

      {/* ── Matching outfits ── */}
      {temperature !== null && (
        <View style={styles.matchSection}>
          <Text style={styles.sectionTitle}>
            👕 Outfits for {temperature}°C ({matchingOutfits.length})
          </Text>
          {matchingOutfits.length === 0 ? (
            <Text style={styles.noMatch}>
              No outfits match this temperature. Add some below!
            </Text>
          ) : (
            matchingOutfits.map((o) => (
              <View key={o.id} style={styles.outfitRow}>
                <View style={styles.outfitInfo}>
                  <Text style={styles.outfitName}>{o.name}</Text>
                  <Text style={styles.outfitRange}>
                    {o.minTemp}°C – {o.maxTemp}°C
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(o.id)}>
                  <Text style={styles.deleteBtn}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      )}

      {/* ── Add new outfit ── */}
      <View style={styles.addSection}>
        <Text style={styles.sectionTitle}>Add Outfit</Text>
        <TextInput
          style={styles.input}
          placeholder="Outfit name (e.g. Hoodie & Jeans)"
          value={name}
          onChangeText={setName}
        />
        <View style={styles.tempRow}>
          <TextInput
            style={styles.tempInput}
            placeholder="Min °C"
            value={minTemp}
            onChangeText={setMinTemp}
            keyboardType="numeric"
          />
          <Text style={styles.tempDash}>–</Text>
          <TextInput
            style={styles.tempInput}
            placeholder="Max °C"
            value={maxTemp}
            onChangeText={setMaxTemp}
            keyboardType="numeric"
          />
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
          <Text style={styles.addBtnText}>+ Add Outfit</Text>
        </TouchableOpacity>
      </View>

      {/* ── All outfits ── */}
      <FlatList
        data={outfits}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          outfits.length > 0 ? (
            <Text style={styles.sectionTitle}>All Outfits ({outfits.length})</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.outfitRow}>
            <View style={styles.outfitInfo}>
              <Text style={styles.outfitName}>{item.name}</Text>
              <Text style={styles.outfitRange}>
                {item.minTemp}°C – {item.maxTemp}°C
              </Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id)}>
              <Text style={styles.deleteBtn}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No outfits saved yet.</Text>
        }
      />
    </View>
  );
}

function getWeatherIcon(code: number): string {
  if (code === 0) return '☀️';
  if (code <= 3) return '⛅';
  if (code <= 48) return '☁️';
  if (code <= 57) return '🌧️';
  if (code <= 67) return '🌨️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌧️';
  if (code <= 86) return '🌨️';
  return '⛈️';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  weatherCard: {
    backgroundColor: '#1a1a2e',
    padding: 24,
    alignItems: 'center',
  },
  weatherIcon: { fontSize: 48, marginBottom: 4 },
  tempText: { fontSize: 42, fontWeight: '800', color: '#fff' },
  weatherLabel: { fontSize: 14, color: '#aaa', marginTop: 4 },
  weatherError: { color: '#ff7675', fontSize: 16 },
  matchSection: {
    backgroundColor: '#fff',
    padding: 12,
    marginTop: 4,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  noMatch: { color: '#aaa', fontSize: 14, fontStyle: 'italic' },
  outfitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 12,
    marginBottom: 4,
  },
  outfitInfo: { flex: 1 },
  outfitName: { fontSize: 16, fontWeight: '600', color: '#333' },
  outfitRange: { fontSize: 13, color: '#888', marginTop: 2 },
  deleteBtn: { fontSize: 18, paddingLeft: 8 },
  addSection: {
    backgroundColor: '#fff',
    padding: 12,
  },
  input: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  tempInput: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  tempDash: { fontSize: 20, color: '#888' },
  addBtn: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  list: { padding: 12, paddingBottom: 40 },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 20, fontSize: 14 },
});
