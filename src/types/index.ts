export interface Outfit {
  id: string;
  name: string;
  minTemp: number;
  maxTemp: number;
  image?: string;
}

export interface Meal {
  id: string;
  name: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export interface StickyNote {
  id: string;
  text: string;
  tag: string;
  createdAt: number;
  done: boolean;
}

export interface Birthday {
  id: string;
  name: string;
  date: string; // MM-DD format
  year?: number;
  notifyEnabled: boolean;
}

export interface ExpiryItem {
  id: string;
  name: string;
  expiryDate: string; // ISO string
  category: 'dairy' | 'meat' | 'produce' | 'pantry' | 'frozen' | 'other';
  barcode?: string;
}
