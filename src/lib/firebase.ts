// Local-First Data Engine
// This replaces Firebase entirely for offline APK stability

export const onAuthStateChanged = (f: any, callback: any) => {
  const user = JSON.parse(localStorage.getItem('lumina_user') || 'null');
  callback(user);
  return () => {};
};

export const auth = {
  currentUser: JSON.parse(localStorage.getItem('lumina_user') || 'null'),
  onAuthStateChanged: onAuthStateChanged
};

export const db: any = {};

export const doc = (database: any, collection: string, id: string) => ({ type: 'doc', collection, id });
export const collection = (database: any, name: string) => name;
export const query = (col: any, ...constraints: any[]) => col;
export const where = (...args: any[]) => ({ type: 'where', args });
export const orderBy = (...args: any[]) => ({ type: 'orderBy', args });
export const limit = (n: number) => ({ type: 'limit', n });
export const serverTimestamp = () => new Date().toISOString();

export const Timestamp = {
  fromDate: (date: Date) => date.toISOString(),
  now: () => new Date().toISOString()
};

const mapToDoc = (d: any) => ({
  data: () => ({
    ...d,
    consumedAt: typeof d.consumedAt === 'string' ? { toDate: () => new Date(d.consumedAt) } : d.consumedAt,
    createdAt: typeof d.createdAt === 'string' ? { toDate: () => new Date(d.createdAt) } : d.createdAt
  }),
  id: d.id
});

export const getDoc = async (docRef: any) => {
  if (docRef.collection === 'users') {
    const profile = JSON.parse(localStorage.getItem('lumina_profile') || 'null');
    return { exists: () => !!profile, data: () => profile };
  }
  return { exists: () => false, data: () => null };
};

export const setDoc = async (docRef: any, data: any) => {
  if (docRef.collection === 'users') {
    localStorage.setItem('lumina_profile', JSON.stringify(data));
  }
};

export const updateDoc = async (docRef: any, data: any) => {
  if (docRef.collection === 'users') {
    const existing = JSON.parse(localStorage.getItem('lumina_profile') || '{}');
    const updated = { ...existing, ...data };
    localStorage.setItem('lumina_profile', JSON.stringify(updated));
  }
};

export const addDoc = async (collectionName: string, data: any) => {
  const existing = JSON.parse(localStorage.getItem(collectionName) || '[]');
  const newItem = { 
    id: Math.random().toString(36).substr(2, 9), 
    ...data, 
    consumedAt: data.consumedAt || new Date().toISOString(),
    createdAt: new Date().toISOString()
  };
  localStorage.setItem(collectionName, JSON.stringify([...existing, newItem]));
  return newItem;
};

export const deleteDoc = async (docRef: any) => {
  const collectionName = docRef.collection;
  const id = docRef.id;
  const existing = JSON.parse(localStorage.getItem(collectionName) || '[]');
  const filtered = existing.filter((item: any) => item.id !== id);
  localStorage.setItem(collectionName, JSON.stringify(filtered));
};

export const getDocs = async (collectionName: string) => {
  const data = JSON.parse(localStorage.getItem(collectionName) || '[]');
  return { docs: data.map(mapToDoc) };
};

export const onSnapshot = (q: any, callback: any) => {
  const data = JSON.parse(localStorage.getItem(q) || '[]');
  callback({ docs: data.map(mapToDoc) });
  return () => {};
};

// Simple local login
export const startLocalSession = async () => {
  const mockUser = {
    uid: 'local-user',
    displayName: 'User',
    email: 'local@device',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nutri'
  };
  localStorage.setItem('lumina_user', JSON.stringify(mockUser));
  window.location.reload();
  return mockUser;
};

export const logout = () => {
  localStorage.clear();
  window.location.reload();
};

export type FirebaseUser = {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
};
