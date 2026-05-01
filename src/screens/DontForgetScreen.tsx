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
import { StickyNote } from '../types';

const TAGS = ['🏠 Home', '💼 Work', '🛒 Shopping', '❤️ Health', '🚨 Urgent', '📌 Other'];

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export default function DontForgetScreen() {
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
  }

  async function handleToggle(id: string) {
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    const updated = await updateItem<StickyNote>(KEYS.NOTES, id, { done: !note.done });
    setNotes(updated);
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

  return (
    <View style={styles.container}>
      {/* ── Add new note ── */}
      <View style={styles.addBar}>
        <TextInput
          style={styles.input}
          placeholder="What do you need to remember?"
          value={text}
          onChangeText={setText}
          onSubmitEditing={handleAdd}
        />
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* ── Tag picker for new note ── */}
      <View style={styles.tagRow}>
        {TAGS.map((tag) => (
          <TouchableOpacity
            key={tag}
            style={[styles.tagChip, selectedTag === tag && styles.tagChipActive]}
            onPress={() => setSelectedTag(tag)}
          >
            <Text style={[styles.tagChipText, selectedTag === tag && styles.tagChipTextActive]}>
              {tag}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Filter tags ── */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filterTag === null && styles.filterChipActive]}
          onPress={() => setFilterTag(null)}
        >
          <Text style={[styles.filterChipText, filterTag === null && styles.filterChipTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        {TAGS.map((tag) => (
          <TouchableOpacity
            key={tag}
            style={[styles.filterChip, filterTag === tag && styles.filterChipActive]}
            onPress={() => setFilterTag(filterTag === tag ? null : tag)}
          >
            <Text style={[styles.filterChipText, filterTag === tag && styles.filterChipTextActive]}>
              {tag}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Notes list ── */}
      <FlatList
        data={[...active, ...done]}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No notes yet. Add one above!</Text>
        }
        renderItem={({ item }) => (
          <View style={[styles.noteCard, item.done && styles.noteCardDone]}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => handleToggle(item.id)}
            >
              <Text style={styles.checkIcon}>{item.done ? '✅' : '⬜'}</Text>
            </TouchableOpacity>
            <View style={styles.noteBody}>
              <Text style={[styles.noteText, item.done && styles.noteTextDone]}>
                {item.text}
              </Text>
              <Text style={styles.noteTag}>{item.tag}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id)}>
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
  addBar: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
  addBtn: {
    backgroundColor: '#1a1a2e',
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
    marginRight: 6,
    marginBottom: 4,
  },
  tagChipActive: { backgroundColor: '#1a1a2e' },
  tagChipText: { fontSize: 12, color: '#555' },
  tagChipTextActive: { color: '#fff' },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    backgroundColor: '#fff',
    marginBottom: 4,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    marginRight: 6,
    marginBottom: 4,
  },
  filterChipActive: { backgroundColor: '#ffeaa7' },
  filterChipText: { fontSize: 12, color: '#555' },
  filterChipTextActive: { color: '#2d3436', fontWeight: '600' },
  list: { padding: 12, paddingBottom: 40 },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 40, fontSize: 16 },
  noteCard: {
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
  noteCardDone: { opacity: 0.5, backgroundColor: '#f5f5f5' },
  checkbox: { marginRight: 10 },
  checkIcon: { fontSize: 22 },
  noteBody: { flex: 1 },
  noteText: { fontSize: 16, color: '#1a1a2e' },
  noteTextDone: { textDecorationLine: 'line-through', color: '#aaa' },
  noteTag: { fontSize: 12, color: '#888', marginTop: 3 },
  deleteBtn: { fontSize: 18, paddingLeft: 8 },
});
