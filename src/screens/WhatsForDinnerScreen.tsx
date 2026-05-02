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
import { useTheme } from '../context/ThemeContext';
import { useTokens } from '../context/TokenContext';
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
  const { colors } = useTheme();
  const { earn } = useTokens();
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
    const meal: Meal = { id: makeId(), name: name.trim(), category };
    const updated = await addItem(KEYS.MEALS, meal);
    setMeals(updated);
    setName('');
    earn(3, '🍽️ Added a meal');
  }

  async function handleDelete(id: string) {
    Alert.alert('Delete meal?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const updated = await removeItem<Meal>(KEYS.MEALS, id);
        setMeals(updated);
      }},
    ]);
  }

  function pickRandom(cat?: Meal['category']) {
    const pool = cat ? meals.filter((m) => m.category === cat) : meals;
    if (pool.length === 0) { setRandomPick('No meals to pick from!'); return; }
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setRandomPick(pick.name);
    earn(1, '🎲 Used random picker');
  }

  const s = makeStyles(colors);

  return (
    <View style={s.container}>
      <View style={s.addSection}>
        <TextInput
          style={s.input}
          placeholder="Add a meal..."
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
          onSubmitEditing={handleAdd}
        />
        <View style={s.catRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[s.catChip, { backgroundColor: category === cat.key ? colors.chipActive : colors.chipBg }]}
              onPress={() => setCategory(cat.key)}
            >
              <Text style={{ fontSize: 13, color: category === cat.key ? colors.chipTextActive : colors.chipText }}>
                {cat.icon} {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={s.addBtn} onPress={handleAdd}>
          <Text style={s.addBtnText}>+ Add Meal</Text>
        </TouchableOpacity>
      </View>

      <View style={s.randomSection}>
        <View style={s.randomRow}>
          <TouchableOpacity style={s.randomBtn} onPress={() => pickRandom('dinner')}>
            <Text style={s.randomBtnText}>🎲 Tonight's Dinner</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.randomBtn, { backgroundColor: colors.accent }]} onPress={() => pickRandom()}>
            <Text style={[s.randomBtnText, { color: '#fff' }]}>🎰 Surprise Me</Text>
          </TouchableOpacity>
        </View>
        {randomPick && (
          <View style={[s.randomResult, { backgroundColor: colors.accentBg }]}>
            <Text style={[s.randomResultText, { color: colors.text }]}>{randomPick}</Text>
            <TouchableOpacity onPress={() => setRandomPick(null)}>
              <Text style={{ fontSize: 18, color: colors.textSecondary, marginLeft: 12, fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <FlatList
        data={CATEGORIES}
        keyExtractor={(item) => item.key}
        contentContainerStyle={s.list}
        renderItem={({ item: cat }) => {
          const catMeals = meals.filter((m) => m.category === cat.key);
          if (catMeals.length === 0) return null;
          return (
            <View style={s.categoryBlock}>
              <Text style={[s.catHeader, { color: colors.text }]}>
                {cat.icon} {cat.label} ({catMeals.length})
              </Text>
              {catMeals.map((meal) => (
                <View key={meal.id} style={[s.mealRow, { backgroundColor: colors.card }]}>
                  <Text style={{ fontSize: 16, color: colors.text }}>{meal.name}</Text>
                  <TouchableOpacity onPress={() => handleDelete(meal.id)}>
                    <Text style={{ fontSize: 18 }}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', color: colors.textMuted, marginTop: 40, fontSize: 16 }}>
            No meals yet. Add your favorites above!
          </Text>
        }
      />
    </View>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    addSection: { backgroundColor: colors.surface, padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    input: { backgroundColor: colors.inputBg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, color: colors.text },
    catRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
    catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, marginRight: 6, marginBottom: 4 },
    addBtn: { backgroundColor: colors.accent, borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 8 },
    addBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    randomSection: { padding: 12, backgroundColor: colors.surface, marginTop: 4, marginBottom: 4 },
    randomRow: { flexDirection: 'row', gap: 8 },
    randomBtn: { flex: 1, backgroundColor: '#ffeaa7', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
    randomBtnText: { fontSize: 15, fontWeight: '700', color: '#2d3436' },
    randomResult: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 10, padding: 12, marginTop: 8 },
    randomResultText: { fontSize: 18, fontWeight: '700' },
    list: { padding: 12, paddingBottom: 40 },
    categoryBlock: { marginBottom: 16 },
    catHeader: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
    mealRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      borderRadius: 10, padding: 12, marginBottom: 4,
      shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
    },
  });
}
