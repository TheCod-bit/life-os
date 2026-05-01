import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { getItem, addItem, removeItem, KEYS } from '../storage/storage';
import { Meal } from '../types';

const CATEGORIES: { key: Meal['category']; label: string; icon: string }[] = [
  { key: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { key: 'lunch', label: 'Lunch', icon: '☀️' },
  { key: 'dinner', label: 'Dinner', icon: '🌙' },
  { key: 'snack', label: 'Snacks', icon: '🍿' },
];

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export default function WhatsForDinnerScreen() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Meal['category']>('dinner');
  const [randomPick, setRandomPick] = useState<string | null>(null);

  useEffect(() => {
    loadMeals();
  }, []);

  async function loadMeals() {
    const data = await getItem<Meal>(KEYS.MEALS);
    setMeals(data);
  }

  async function handleAdd() {
    if (!name.trim()) return;
    const meal: Meal = {
      id: makeId(),
      name: name.trim(),
      category,
    };
    const updated = await addItem(KEYS.MEALS, meal);
    setMeals(updated);
    setName('');
  }

  async function handleDelete(id: string) {
    Alert.alert('Delete meal?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = await removeItem<Meal>(KEYS.MEALS, id);
          setMeals(updated);
        },
      },
    ]);
  }

  function pickRandom(cat?: Meal['category']) {
    const pool = cat ? meals.filter((m) => m.category === cat) : meals;
    if (pool.length === 0) {
      setRandomPick('No meals to pick from!');
      return;
    }
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setRandomPick(pick.name);
  }

  return (
    <View style={styles.container}>
      {/* ── Add meal ── */}
      <View style={styles.addSection}>
        <TextInput
          style={styles.input}
          placeholder="Add a meal..."
          value={name}
          onChangeText={setName}
          onSubmitEditing={handleAdd}
        />
        <View style={styles.catRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[styles.catChip, category === cat.key && styles.catChipActive]}
              onPress={() => setCategory(cat.key)}
            >
              <Text
                style={[styles.catChipText, category === cat.key && styles.catChipTextActive]}
              >
                {cat.icon} {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
          <Text style={styles.addBtnText}>+ Add Meal</Text>
        </TouchableOpacity>
      </View>

      {/* ── Random picker ── */}
      <View style={styles.randomSection}>
        <View style={styles.randomRow}>
          <TouchableOpacity style={styles.randomBtn} onPress={() => pickRandom('dinner')}>
            <Text style={styles.randomBtnText}>🎲 Tonight's Dinner</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.randomBtn} onPress={() => pickRandom()}>
            <Text style={styles.randomBtnText}>🎰 Surprise Me</Text>
          </TouchableOpacity>
        </View>
        {randomPick && (
          <View style={styles.randomResult}>
            <Text style={styles.randomResultText}>{randomPick}</Text>
            <TouchableOpacity onPress={() => setRandomPick(null)}>
              <Text style={styles.randomClose}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── Meals grouped by category ── */}
      <FlatList
        data={CATEGORIES}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.list}
        renderItem={({ item: cat }) => {
          const catMeals = meals.filter((m) => m.category === cat.key);
          if (catMeals.length === 0) return null;
          return (
            <View style={styles.categoryBlock}>
              <Text style={styles.catHeader}>
                {cat.icon} {cat.label} ({catMeals.length})
              </Text>
              {catMeals.map((meal) => (
                <View key={meal.id} style={styles.mealRow}>
                  <Text style={styles.mealName}>{meal.name}</Text>
                  <TouchableOpacity onPress={() => handleDelete(meal.id)}>
                    <Text style={styles.deleteBtn}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>No meals yet. Add your favorites above!</Text>
        }
      />
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
  },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
    marginRight: 6,
    marginBottom: 4,
  },
  catChipActive: { backgroundColor: '#1a1a2e' },
  catChipText: { fontSize: 13, color: '#555' },
  catChipTextActive: { color: '#fff' },
  addBtn: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  randomSection: { padding: 12, backgroundColor: '#fff', marginTop: 4, marginBottom: 4 },
  randomRow: { flexDirection: 'row', gap: 8 },
  randomBtn: {
    flex: 1,
    backgroundColor: '#ffeaa7',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  randomBtnText: { fontSize: 15, fontWeight: '700', color: '#2d3436' },
  randomResult: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dfe6e9',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  randomResultText: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  randomClose: { fontSize: 18, color: '#888', marginLeft: 12, fontWeight: '700' },
  list: { padding: 12, paddingBottom: 40 },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 40, fontSize: 16 },
  categoryBlock: { marginBottom: 16 },
  catHeader: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 6 },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  mealName: { fontSize: 16, color: '#333' },
  deleteBtn: { fontSize: 18 },
});
