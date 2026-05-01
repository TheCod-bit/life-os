import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  OUTFITS: '@life-os/outfits',
  MEALS: '@life-os/meals',
  NOTES: '@life-os/notes',
  BIRTHDAYS: '@life-os/birthdays',
  EXPIRY: '@life-os/expiry',
};

export async function getItem<T>(key: string): Promise<T[]> {
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

export async function setItem<T>(key: string, data: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

export async function addItem<T extends { id: string }>(key: string, item: T): Promise<T[]> {
  const items = await getItem<T>(key);
  items.push(item);
  await setItem(key, items);
  return items;
}

export async function updateItem<T extends { id: string }>(key: string, id: string, updates: Partial<T>): Promise<T[]> {
  let items = await getItem<T>(key);
  items = items.map((item) => (item.id === id ? { ...item, ...updates } : item));
  await setItem(key, items);
  return items;
}

export async function removeItem<T extends { id: string }>(key: string, id: string): Promise<T[]> {
  let items = await getItem<T>(key);
  items = items.filter((item) => item.id !== id);
  await setItem(key, items);
  return items;
}

export { KEYS };
