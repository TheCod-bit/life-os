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
import { getItem, addItem, updateItem, removeItem, KEYS } from '../storage/storage';
import { useTheme } from '../context/ThemeContext';
import { useTokens } from '../context/TokenContext';
import { StickyNote } from '../types';

const TAGS = ['🏠 Home', '💼 Work', '🛒 Shopping', '❤️ Health', '🚨 Urgent', '📌 Other'];

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export default function DontForgetScreen() {
  const { colors } = useTheme();
  const { earn } = useTokens();
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [text, setText] = useState('');
  const [selectedTag, setSelectedTag] = useState('📌 Other');
  const [filterTag, setFilterTag] = useState<string | null>(null);

  useEffect(() => {
    loadNotes();
  }, []);

  async function loadNotes() {
    const data = await getItem<StickyNote>(KEYS.NOTES);
    setNotes(data);
  }

  async function handleAdd() {
    if (!text.trim()) return;
    const newNote: StickyNote = {
      id: makeId(),
      text: text.trim(),
      tag: selectedTag,
      createdAt: Date.now(),
      done: false,
    };
    const updated = await addItem(KEYS.NOTES, newNote);
    setNotes(updated);
    setText('');
    earn(3, '📝 Added a note');
  }

  async function handleToggle(id: string) {
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    const updated = await updateItem<StickyNote>(KEYS.NOTES, id, { done: !note.done });
    setNotes(updated);
    if (!note.done) {
      earn(5, '✅ Completed a task');
    }
  }

  async function handleDelete(id: string) {
    Alert.alert('Delete note?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = await removeItem<StickyNote>(KEYS.NOTES, id);
          setNotes(updated);
        },
      },
    ]);
  }

  const displayedNotes = filterTag
    ? notes.filter((n) => n.tag === filterTag)
    : notes;

  const active = displayedNotes.filter((n) => !n.done);
  const done = displayedNotes.filter((n) => n.done);

  const s = makeStyles(colors);

  return (
    <View style={s.container}>
      <View style={s.addBar}>
        <TextInput
          style={s.input}
          placeholder="What do you need to remember?"
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={setText}
          onSubmitEditing={handleAdd}
        />
        <TouchableOpacity style={s.addBtn} onPress={handleAdd}>
          <Text style={s.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={s.tagRow}>
        {TAGS.map((tag) => (
          <TouchableOpacity
            key={tag}
            style={[s.tagChip, { backgroundColor: selectedTag === tag ? colors.chipActive : colors.chipBg }]}
            onPress={() => setSelectedTag(tag)}
          >
            <Text style={[s.tagChipText, { color: selectedTag === tag ? colors.chipTextActive : colors.chipText }]}>
              {tag}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.filterRow}>
        <TouchableOpacity
          style={[s.filterChip, { backgroundColor: filterTag === null ? colors.alertBg : colors.chipBg }]}
          onPress={() => setFilterTag(null)}
        >
          <Text style={[s.filterChipText, { color: filterTag === null ? colors.alertText : colors.chipText }]}>
            All
          </Text>
        </TouchableOpacity>
        {TAGS.map((tag) => (
          <TouchableOpacity
            key={tag}
            style={[s.filterChip, { backgroundColor: filterTag === tag ? colors.alertBg : colors.chipBg }]}
            onPress={() => setFilterTag(filterTag === tag ? null : tag)}
          >
            <Text style={[s.filterChipText, { color: filterTag === tag ? colors.alertText : colors.chipText }]}>
              {tag}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={[...active, ...done]}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.list}
        ListEmptyComponent={
          <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 40, fontSize: 16 }}>
            No notes yet. Add one above!
          </Text>
        }
        renderItem={({ item }) => (
          <View style={[s.noteCard, { backgroundColor: item.done ? colors.accentBg : colors.card, opacity: item.done ? 0.6 : 1 }]}>
            <TouchableOpacity style={s.checkbox} onPress={() => handleToggle(item.id)}>
              <Text style={s.checkIcon}>{item.done ? '✅' : '⬜'}</Text>
            </TouchableOpacity>
            <View style={s.noteBody}>
              <Text style={[s.noteText, { color: item.done ? colors.textMuted : colors.text, textDecorationLine: item.done ? 'line-through' : 'none' }]}>
                {item.text}
              </Text>
              <Text style={[s.noteTag, { color: colors.textSecondary }]}>{item.tag}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id)}>
              <Text style={s.deleteBtn}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    addBar: {
      flexDirection: 'row',
      padding: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    input: {
      flex: 1,
      backgroundColor: colors.inputBg,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 16,
      color: colors.text,
    },
    addBtn: {
      backgroundColor: colors.accent,
      width: 44,
      height: 44,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 10,
    },
    addBtnText: { color: '#fff', fontSize: 24, fontWeight: '600', lineHeight: 26 },
    tagRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: 8,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tagChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, marginRight: 6, marginBottom: 4 },
    tagChipText: { fontSize: 12 },
    filterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: 8,
      backgroundColor: colors.surface,
      marginBottom: 4,
    },
    filterChip: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginRight: 6, marginBottom: 4 },
    filterChipText: { fontSize: 12, fontWeight: '600' },
    list: { padding: 12, paddingBottom: 40 },
    noteCard: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
      shadowColor: '#000',
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 2,
    },
    checkbox: { marginRight: 10 },
    checkIcon: { fontSize: 22 },
    noteBody: { flex: 1 },
    noteText: { fontSize: 16 },
    noteTag: { fontSize: 12, marginTop: 3 },
    deleteBtn: { fontSize: 18, paddingLeft: 8 },
  });
}
